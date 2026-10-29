// High-Accuracy Open-Source AI Conversational Agent for Subsi
// Supports:
// 1. Meta Llama 3.3 70B & Llama 3.1 8B via Groq / Ollama / Together / OpenAI-Compatible endpoints
// 2. High-Fidelity Multi-Turn Intent Classifier & Conversational Reasoner
// 3. Situational Awareness of Cart, Trolley, Aisles, Catalog, and Multi-Item Requests

import { Product } from '@/types/product';
import { formatINR } from '@/lib/currency';
import { catalogService, ClarifyingItemOption } from '@/services/catalogService';
import { AISLES } from '@/data/aisles';

export interface ChatTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CartContextItem {
  id?: string;
  name: string;
  brand: string;
  quantity: number;
  price: number;
}

export interface ConversationalAIContext {
  message: string;
  conversationHistory: ChatTurn[];
  pendingChoices?: Product[];
  cartItems?: CartContextItem[];
  cartTotal?: number;
  currentAisleId?: string;
  apiKey?: string;
  provider?: 'groq' | 'ollama' | 'builtin';
}

export interface SubsiAction {
  type: 'add_to_cart' | 'remove_item' | 'clear_cart' | 'navigate_aisle' | 'none';
  items?: { product: Product; quantity: number }[];
  aisleId?: string;
}

export interface SubsiAIResult {
  reply: string;
  action: SubsiAction;
  pendingChoices?: Product[];
  usedModel?: string;
}

/**
 * Ordinal & Anaphora Parser for references like:
 * "I'll select first one you said", "give me the second one", "the cheaper one", "both"
 */
export function resolvePendingChoices(
  message: string,
  pendingChoices: Product[]
): { selected: { product: Product; quantity: number }[]; remaining: Product[]; isChoiceMatch: boolean } {
  if (!pendingChoices || pendingChoices.length === 0) {
    return { selected: [], remaining: [], isChoiceMatch: false };
  }

  const clean = message.toLowerCase().trim();

  // Extract explicit quantity
  const qtyWordMap: { [w: string]: number } = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    single: 1,
    pair: 2,
    double: 2,
  };

  let quantity = 1;
  const numMatch = clean.match(/\b([1-9])\b/);
  if (numMatch) {
    quantity = parseInt(numMatch[1], 10);
  } else {
    for (const [w, n] of Object.entries(qtyWordMap)) {
      if (new RegExp(`\\b${w}\\b`).test(clean)) {
        quantity = n;
        break;
      }
    }
  }

  // ALL / BOTH
  if (/\b(both|all|both of them|all of them|everything|both options)\b/i.test(clean)) {
    return {
      selected: pendingChoices.map((p) => ({ product: p, quantity })),
      remaining: [],
      isChoiceMatch: true,
    };
  }

  // FIRST
  if (
    /\b(first|1st|first one|first option|number one|no 1|#1|former|first you said|select first)\b/i.test(clean) &&
    pendingChoices.length >= 1
  ) {
    const chosen = pendingChoices[0];
    return {
      selected: [{ product: chosen, quantity }],
      remaining: pendingChoices.slice(1),
      isChoiceMatch: true,
    };
  }

  // SECOND
  if (
    /\b(second|2nd|second one|second option|number two|no 2|#2|latter|the second)\b/i.test(clean) &&
    pendingChoices.length >= 2
  ) {
    const chosen = pendingChoices[1];
    return {
      selected: [{ product: chosen, quantity }],
      remaining: pendingChoices.filter((_, idx) => idx !== 1),
      isChoiceMatch: true,
    };
  }

  // THIRD
  if (
    /\b(third|3rd|third one|third option|number three|no 3|#3)\b/i.test(clean) &&
    pendingChoices.length >= 3
  ) {
    const chosen = pendingChoices[2];
    return {
      selected: [{ product: chosen, quantity }],
      remaining: pendingChoices.filter((_, idx) => idx !== 2),
      isChoiceMatch: true,
    };
  }

  // FOURTH
  if (
    /\b(fourth|4th|fourth one|fourth option|number four|no 4|#4)\b/i.test(clean) &&
    pendingChoices.length >= 4
  ) {
    const chosen = pendingChoices[3];
    return {
      selected: [{ product: chosen, quantity }],
      remaining: pendingChoices.filter((_, idx) => idx !== 3),
      isChoiceMatch: true,
    };
  }

  // LAST
  if (/\b(last|last one|the last option|the last)\b/i.test(clean) && pendingChoices.length > 0) {
    const chosen = pendingChoices[pendingChoices.length - 1];
    return {
      selected: [{ product: chosen, quantity }],
      remaining: pendingChoices.slice(0, pendingChoices.length - 1),
      isChoiceMatch: true,
    };
  }

  // CHEAPER / BUDGET
  if (/\b(cheap|cheaper|cheapest|lowest price|budget|affordable|less cost)\b/i.test(clean)) {
    const sorted = [...pendingChoices].sort((a, b) => a.price - b.price);
    const chosen = sorted[0];
    return {
      selected: [{ product: chosen, quantity }],
      remaining: pendingChoices.filter((p) => p.id !== chosen.id),
      isChoiceMatch: true,
    };
  }

  // EXPENSIVE / PREMIUM
  if (/\b(expensive|costlier|premium|best one|highest quality)\b/i.test(clean)) {
    const sorted = [...pendingChoices].sort((a, b) => b.price - a.price);
    const chosen = sorted[0];
    return {
      selected: [{ product: chosen, quantity }],
      remaining: pendingChoices.filter((p) => p.id !== chosen.id),
      isChoiceMatch: true,
    };
  }

  // Direct brand or name match in pendingChoices
  const matched = pendingChoices.filter((p) => {
    const brand = p.brand.toLowerCase();
    const nameWords = p.name.toLowerCase().split(' ');
    const visual = p.visual.label.toLowerCase();
    return clean.includes(brand) || visual.includes(clean) || nameWords.some((w) => w.length > 3 && clean.includes(w));
  });

  if (matched.length > 0) {
    const chosen = matched[0];
    return {
      selected: [{ product: chosen, quantity }],
      remaining: pendingChoices.filter((p) => p.id !== chosen.id),
      isChoiceMatch: true,
    };
  }

  return { selected: [], remaining: pendingChoices, isChoiceMatch: false };
}

/**
 * External Open-Source LLM caller (Groq Llama 3.3 70B, Ollama, Together)
 */
async function callOpenSourceLLM(context: ConversationalAIContext): Promise<SubsiAIResult | null> {
  const groqApiKey = context.apiKey || process.env.GROQ_API_KEY;
  const ollamaHost = process.env.OLLAMA_BASE_URL || (process.env.OLLAMA_HOST ? `${process.env.OLLAMA_HOST}` : null);
  const genericUrl = process.env.OPENSOURCE_LLM_URL;
  const genericKey = process.env.OPENSOURCE_LLM_API_KEY;

  let endpoint = '';
  let authHeader = '';
  let modelName = '';

  if (groqApiKey) {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    authHeader = `Bearer ${groqApiKey}`;
    modelName = 'llama-3.3-70b-versatile';
  } else if (ollamaHost) {
    endpoint = `${ollamaHost.replace(/\/$/, '')}/v1/chat/completions`;
    authHeader = 'Bearer ollama';
    modelName = 'llama3.2';
  } else if (genericUrl) {
    endpoint = genericUrl;
    authHeader = genericKey ? `Bearer ${genericKey}` : '';
    modelName = process.env.OPENSOURCE_LLM_MODEL || 'meta-llama/Llama-3.3-70B-Instruct';
  } else {
    return null;
  }

  try {
    const systemPrompt = `You are Subsi, the warm, energetic AI shopping assistant in "AISLE 3D Supermarket".
You converse with customers verbally. Be concise (under 25 words). Call the shopper "partner".
Output JSON ONLY in this exact structure:
{
  "reply": "spoken reply string",
  "action": {
    "type": "add_to_cart" | "remove_item" | "clear_cart" | "navigate_aisle" | "none",
    "items": [{"productId": "string", "quantity": 1}],
    "aisleId": "string"
  },
  "suggestChoices": ["productId1", "productId2"]
}

Context:
- Cart items count: ${context.cartItems?.reduce((s, i) => s + i.quantity, 0) || 0} items
- Cart items list: ${JSON.stringify(context.cartItems || [])}
- Cart total: ₹${context.cartTotal || 0}
- Active offered choices: ${JSON.stringify(
      (context.pendingChoices || []).map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
      }))
    )}

CRITICAL RULES:
1. If the user asks about their cart (e.g. "how many items are there in my cart?", "what is my total?", "what's in my cart?"), LOGICALLY ANSWER THE QUESTION using the Cart Context. DO NOT suggest unrelated groceries!
2. If the user refers to past choices ("first one", "second one", "cheaper one", "both"), add that item to cart and continue!
3. If the user asks for groceries (e.g. "milk and bread"), identify them and ask for brand preference.
4. If the user says checkout, navigate to "aisle-entrance".`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: context.message },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      reply: parsed.reply,
      action: parsed.action || { type: 'none' },
      pendingChoices: parsed.suggestChoices || [],
      usedModel: `Meta ${modelName}`,
    };
  } catch (err) {
    console.warn('Open-source LLM skipped, falling back to built-in reasoner:', err);
    return null;
  }
}

/**
 * Built-in Supermarket Reasoner with High-Accuracy Intent Classification
 */
export async function processConversationalChat(
  context: ConversationalAIContext
): Promise<SubsiAIResult> {
  const cleanMsg = context.message.toLowerCase().trim();
  const pending = context.pendingChoices || [];
  const items = context.cartItems || [];
  const totalItemsCount = items.reduce((s, i) => s + i.quantity, 0);
  const totalCost = context.cartTotal || 0;

  // 1. Try external Open-Source LLM (Llama 3.3 70B / 3.1) if configured
  const llmResult = await callOpenSourceLLM(context);
  if (llmResult) {
    return llmResult;
  }

  // =========================================================================
  // INTENT 1: CART COUNT INQUIRY ("how many items are there in my cart?")
  // =========================================================================
  const isCartCountQuery =
    /\b(how many items|item count|number of items|how many products|how many things|how many total)\b/i.test(cleanMsg) ||
    (/\b(how many)\b/i.test(cleanMsg) && /\b(cart|trolley|basket|bag)\b/i.test(cleanMsg));

  if (isCartCountQuery) {
    if (totalItemsCount === 0) {
      return {
        reply: "Your trolley basket is currently empty, partner! Tell me what groceries you'd like — like fresh milk, whole wheat bread, or apples — and I'll drop them in!",
        action: { type: 'none' },
        pendingChoices: [],
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }

    const itemSummaries = items
      .slice(0, 3)
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(', ');
    const extra = items.length > 3 ? ` and ${items.length - 3} more items` : '';

    return {
      reply: `You currently have ${totalItemsCount} item${totalItemsCount > 1 ? 's' : ''} in your trolley basket (${itemSummaries}${extra}), totaling ${formatINR(totalCost)}. Ready to checkout or add more?`,
      action: { type: 'none' },
      pendingChoices: [],
      usedModel: 'Built-in Supermarket Reasoner',
    };
  }

  // =========================================================================
  // INTENT 2: CART CONTENTS & TOTAL INQUIRY ("what's in my cart?", "my total?")
  // =========================================================================
  const isCartContentsQuery =
    /\b(what's in my cart|what is in my cart|what do i have|show my cart|show my trolley|check my basket|list my items|view cart|see my cart)\b/i.test(
      cleanMsg
    );

  const isCartTotalQuery =
    /\b(how much is my total|what is my bill|how much have i spent|what is the total|total cost|bill amount|what's the total|how much does it cost)\b/i.test(
      cleanMsg
    );

  if (isCartContentsQuery || isCartTotalQuery) {
    if (totalItemsCount === 0) {
      return {
        reply: "Your trolley is completely empty right now, partner! What groceries would you like to put in?",
        action: { type: 'none' },
        pendingChoices: [],
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }

    const itemDetails = items
      .slice(0, 4)
      .map((i) => `${i.quantity}x ${i.name} (${formatINR(i.price * i.quantity)})`)
      .join(', ');

    if (isCartTotalQuery) {
      const freeDeliveryNote = totalCost >= 499 ? ' You qualify for FREE express delivery!' : ` Add ${formatINR(499 - totalCost)} more for free delivery.`;
      return {
        reply: `Your current trolley subtotal is ${formatINR(totalCost)} for ${totalItemsCount} items.${freeDeliveryNote} Ready to checkout?`,
        action: { type: 'none' },
        pendingChoices: [],
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }

    return {
      reply: `In your trolley, you have ${totalItemsCount} items: ${itemDetails}. Total is ${formatINR(totalCost)}. Would you like to add anything else or head to billing?`,
      action: { type: 'none' },
      pendingChoices: [],
      usedModel: 'Built-in Supermarket Reasoner',
    };
  }

  // =========================================================================
  // INTENT 3: CLEAR CART / EMPTY TROLLEY ("empty my trolley", "clear cart")
  // =========================================================================
  if (/\b(clear cart|clear my cart|empty trolley|empty my trolley|remove all|delete all)\b/i.test(cleanMsg)) {
    return {
      reply: "I've emptied out your trolley basket for you, partner! Let me know what you'd like to pick up next.",
      action: { type: 'clear_cart' },
      pendingChoices: [],
      usedModel: 'Built-in Supermarket Reasoner',
    };
  }

  // =========================================================================
  // INTENT 4: CHECKOUT / BILLING ("checkout", "bill", "pay now")
  // =========================================================================
  if (/\b(checkout|bill|billing|pay|payment|order now|finish shopping|done shopping|take me to billing)\b/i.test(cleanMsg)) {
    let reply = "Right away partner! Wheeling your trolley directly to the billing counter for checkout.";
    if (totalItemsCount > 0) {
      reply = `Right away partner! Wheeling your trolley with ${totalItemsCount} items (${formatINR(totalCost)}) straight to the billing counter now!`;
    }

    return {
      reply,
      action: { type: 'navigate_aisle', aisleId: 'aisle-entrance' },
      pendingChoices: [],
      usedModel: 'Built-in Supermarket Reasoner',
    };
  }

  // =========================================================================
  // INTENT 5: ORDINAL SELECTION FROM PREVIOUS CHOICES ("first one you said", "the second one")
  // =========================================================================
  if (pending.length > 0) {
    const { selected, remaining, isChoiceMatch } = resolvePendingChoices(cleanMsg, pending);

    if (isChoiceMatch && selected.length > 0) {
      const selectedNames = selected.map((s) => `${s.quantity}x ${s.product.name}`).join(' and ');

      const firstCat = selected[0].product.categoryId;
      const remainingDifferentCategories = remaining.filter((p) => p.categoryId !== firstCat);

      if (remainingDifferentCategories.length > 0) {
        const nextCat = remainingDifferentCategories[0].categoryId === 'bakery'
          ? 'bread'
          : remainingDifferentCategories[0].categoryId.replace('-', ' ');

        const nextOptionsText = remainingDifferentCategories
          .slice(0, 2)
          .map((p) => `${p.brand} ${p.visual.label} (${p.netQuantity} at ${formatINR(p.price)})`)
          .join(' or ');

        return {
          reply: `Awesome choice partner! I've placed ${selectedNames} right into your trolley basket. Now for the ${nextCat}: we have ${nextOptionsText}. Which one would you prefer?`,
          action: {
            type: 'add_to_cart',
            items: selected,
          },
          pendingChoices: remainingDifferentCategories,
          usedModel: 'Built-in Multi-Turn Conversational Reasoner',
        };
      }

      return {
        reply: `Awesome choice partner! I'm flying ${selectedNames} right into your trolley basket now! Anything else you need, or shall we checkout?`,
        action: {
          type: 'add_to_cart',
          items: selected,
        },
        pendingChoices: [],
        usedModel: 'Built-in Multi-Turn Conversational Reasoner',
      };
    }
  }

  // =========================================================================
  // INTENT 6: AISLE NAVIGATION ("take me to dairy", "where is snacks?")
  // =========================================================================
  if (/\b(take me to|where is|where are|go to|show me the|navigate to)\b/i.test(cleanMsg)) {
    if (/\b(produce|fruit|fruits|veggies|vegetable|vegetables|greens|palak|apple)\b/i.test(cleanMsg)) {
      return {
        reply: "Taking your trolley straight to Aisle 1 — Farm Fresh Produce Market!",
        action: { type: 'navigate_aisle', aisleId: 'aisle-1' },
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }
    if (/\b(dairy|milk|cheese|butter|paneer|bakery|bread|loaf)\b/i.test(cleanMsg)) {
      return {
        reply: "Rolling your trolley to Aisle 2 — Dairy, Butter & Fresh Bakery!",
        action: { type: 'navigate_aisle', aisleId: 'aisle-2' },
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }
    if (/\b(snack|snacks|chip|chips|beverage|beverages|drink|drinks|juice|coke)\b/i.test(cleanMsg)) {
      return {
        reply: "Heading over to Aisle 3 — Snacks, Crisps & Chilled Drinks!",
        action: { type: 'navigate_aisle', aisleId: 'aisle-3' },
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }
    if (/\b(grain|grains|rice|dal|pulses|breakfast|cereal|oats)\b/i.test(cleanMsg)) {
      return {
        reply: "Heading to Aisle 4 — Staples, Rice, Dals & Breakfast Grains!",
        action: { type: 'navigate_aisle', aisleId: 'aisle-4' },
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }
    if (/\b(oil|oils|ghee|spice|spices|masala|masalas)\b/i.test(cleanMsg)) {
      return {
        reply: "Navigating to Aisle 5 — Cooking Oils, Pure Ghee & Spices!",
        action: { type: 'navigate_aisle', aisleId: 'aisle-5' },
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }
    if (/\b(instant|noodle|noodles|maggi|pasta|soap|shampoo|personal care|cleaning)\b/i.test(cleanMsg)) {
      return {
        reply: "Taking your trolley to Aisle 6 — Instant Foods & Household Essentials!",
        action: { type: 'navigate_aisle', aisleId: 'aisle-6' },
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }
  }

  // =========================================================================
  // INTENT 7: CHIT-CHAT / GREETING / QUESTIONS
  // =========================================================================
  if (/\b(hello|hi|hey|good morning|good evening|who are you|what is your name)\b/i.test(cleanMsg)) {
    return {
      reply: "Hey partner! I'm Subsi, your 3D supermarket assistant. Tell me what groceries you need or ask me to check your cart anytime!",
      action: { type: 'none' },
      pendingChoices: [],
      usedModel: 'Built-in Supermarket Reasoner',
    };
  }

  if (/\b(thank you|thanks|good job|awesome|nice)\b/i.test(cleanMsg)) {
    return {
      reply: "You're very welcome partner! Happy to help. What else can I get for your basket?",
      action: { type: 'none' },
      pendingChoices: [],
      usedModel: 'Built-in Supermarket Reasoner',
    };
  }

  if (/\b(recipe|cook|dinner|lunch|breakfast ideas|what can i make)\b/i.test(cleanMsg)) {
    return {
      reply: "How about fresh palak paneer with whole wheat roti, or masala Maggi with sweet corn? We have farm-fresh palak in Aisle 1 and paneer in Aisle 2!",
      action: { type: 'none' },
      pendingChoices: [],
      usedModel: 'Built-in Supermarket Reasoner',
    };
  }

  // =========================================================================
  // INTENT 8: GENUINE PRODUCT EXTRACTION & PURCHASE
  // (Only triggered when actual grocery terms are present, never on stop-words!)
  // =========================================================================
  const optionGroups: ClarifyingItemOption[] = await catalogService.extractProductOptions(cleanMsg);

  if (optionGroups.length > 0) {
    const allMatches: Product[] = [];
    const parts: string[] = [];

    for (const group of optionGroups) {
      allMatches.push(...group.matches);
      const matchSummaries = group.matches
        .slice(0, 2)
        .map((p) => `${p.brand} ${p.visual.label} (${p.netQuantity} at ${formatINR(p.price)})`)
        .join(' or ');
      parts.push(`For ${group.keyword}, we have ${matchSummaries}`);
    }

    // Check if user already specified an exact brand & single item (e.g. "Add Nandini GoodLife")
    const exactMatch = allMatches.find((p) => {
      const b = p.brand.toLowerCase();
      const n = p.name.toLowerCase();
      return cleanMsg.includes(b) && (cleanMsg.includes(p.visual.label.toLowerCase()) || cleanMsg.includes(n.split(' ')[0]));
    });

    if (exactMatch && optionGroups.length === 1) {
      const qtyMatch = cleanMsg.match(/\b([1-9])\b/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      return {
        reply: `You got it! Adding ${qty}x ${exactMatch.name} (${exactMatch.netQuantity}) for ${formatINR(exactMatch.price * qty)} directly into your basket.`,
        action: {
          type: 'add_to_cart',
          items: [{ product: exactMatch, quantity: qty }],
        },
        pendingChoices: [],
        usedModel: 'Built-in Supermarket Reasoner',
      };
    }

    const reply = `Hey partner! ${parts.join('. And ')}. Which one would you like to have, and how many?`;

    return {
      reply,
      action: { type: 'none' },
      pendingChoices: allMatches,
      usedModel: 'Built-in Supermarket Reasoner',
    };
  }

  // =========================================================================
  // FALLBACK LOGICAL ANSWER: DO NOT INVENT GROCERY PRODUCTS!
  // =========================================================================
  return {
    reply: "I'm right here with your trolley, partner! You can ask me to check your cart, add groceries (like milk, bread, or apples), or take you to checkout.",
    action: { type: 'none' },
    pendingChoices: [],
    usedModel: 'Built-in Supermarket Reasoner',
  };
}
