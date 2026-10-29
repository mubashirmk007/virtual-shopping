import { Product } from '@/types/product';
import { PRODUCTS } from '@/data/products';
import { AISLES } from '@/data/aisles';

export interface ClarifyingItemOption {
  keyword: string;
  categoryName?: string;
  matches: Product[];
}

// Common functional English words and query terms that should NEVER be searched as groceries
const STOP_WORDS = new Set([
  'are', 'how', 'many', 'items', 'item', 'there', 'in', 'my', 'cart', 'trolley', 'basket',
  'what', 'whats', "what's", 'is', 'the', 'this', 'that', 'these', 'those', 'can', 'you',
  'tell', 'me', 'about', 'and', 'with', 'for', 'have', 'has', 'had', 'do', 'does', 'did',
  'get', 'give', 'put', 'take', 'want', 'need', 'like', 'would', 'could', 'should',
  'total', 'cost', 'bill', 'price', 'checkout', 'pay', 'much', 'more', 'some', 'any',
  'please', 'hey', 'subsi', 'subzi', 'hi', 'hello', 'which', 'where', 'who', 'why',
  'one', 'first', 'second', 'third', 'last', 'both', 'all', 'none', 'neither', 'cheaper',
  'good', 'best', 'popular', 'show', 'check', 'view', 'list', 'count', 'see', 'look'
]);

export const catalogService = {
  /**
   * Search products by keyword, brand, or category name with strict term boundaries
   */
  async searchProducts(query: string): Promise<Product[]> {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2 || STOP_WORDS.has(q)) return [];

    return PRODUCTS.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchVisual = p.visual.label.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);

      // Category matching: match exact segment, never false substring (e.g. 'are' inside 'personal-care')
      const catSegments = p.categoryId.toLowerCase().split('-');
      const matchCategory = catSegments.includes(q) || (q.length >= 4 && p.categoryId.toLowerCase().includes(q));

      const subSegments = p.subcategoryId ? p.subcategoryId.toLowerCase().split('-') : [];
      const matchSub = subSegments.includes(q) || (q.length >= 4 && (p.subcategoryId || '').toLowerCase().includes(q));

      return matchName || matchBrand || matchVisual || matchCategory || matchSub || matchDesc;
    });
  },

  /**
   * Get product by exact ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    return PRODUCTS.find((p) => p.id === productId) || null;
  },

  /**
   * Get all products in a specific aisle or category
   */
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.categoryId.toLowerCase() === categoryId.toLowerCase());
  },

  /**
   * Intelligent parser that finds all item options when a customer asks for groceries
   * e.g. "milk and bread" -> finds options for milk, and options for bread
   */
  async extractProductOptions(userVoiceInput: string): Promise<ClarifyingItemOption[]> {
    const input = userVoiceInput.toLowerCase();

    // Common grocery item vocabulary mappings
    const keywordsToLookFor: { [key: string]: string[] } = {
      milk: ['milk', 'dairy'],
      bread: ['bread', 'pav', 'bun', 'loaf'],
      apple: ['apple', 'apples', 'kashmir'],
      banana: ['banana', 'bananas'],
      tomato: ['tomato', 'tomatoes'],
      potato: ['potato', 'potatoes', 'aloo'],
      onion: ['onion', 'onions', 'pyaz'],
      oil: ['oil', 'cooking oil', 'sunflower', 'mustard', 'olive'],
      ghee: ['ghee', 'clarified butter'],
      rice: ['rice', 'basmati', 'daawat', 'india gate'],
      dal: ['dal', 'dhal', 'pulses', 'toor', 'moong', 'chana'],
      noodles: ['noodle', 'noodles', 'maggi', 'yippee'],
      pasta: ['pasta', 'penne', 'macaroni'],
      coffee: ['coffee', 'nescafe', 'bru'],
      tea: ['tea', 'chai', 'taj mahal', 'tata tea'],
      soap: ['soap', 'body wash', 'dettol'],
      shampoo: ['shampoo', 'conditioner', 'dove'],
      biscuit: ['biscuit', 'biscuits', 'cookie', 'cookies', 'parle', 'oreo'],
      chips: ['chips', 'crisps', 'lays', 'kurkure', 'doritos'],
      chocolate: ['chocolate', 'cadbury', 'dairy milk', 'kitkat'],
      butter: ['butter', 'amul butter'],
      cheese: ['cheese', 'amul cheese'],
      paneer: ['paneer', 'cottage cheese'],
      egg: ['egg', 'eggs'],
      curd: ['curd', 'dahi', 'yogurt'],
      atta: ['atta', 'flour', 'wheat flour', 'aashirvaad'],
      sugar: ['sugar'],
      salt: ['salt', 'tata salt'],
    };

    const identifiedGroups: ClarifyingItemOption[] = [];

    // 1. Check direct keyword dictionary
    for (const [canonicalName, variations] of Object.entries(keywordsToLookFor)) {
      const isMentioned = variations.some((v) => {
        const regex = new RegExp(`\\b${v}\\b`, 'i');
        return regex.test(input);
      });

      if (isMentioned) {
        const matches = PRODUCTS.filter((p) => {
          const pName = p.name.toLowerCase();
          const pCat = p.categoryId.toLowerCase();
          const pSub = (p.subcategoryId || '').toLowerCase();
          return variations.some((v) => pName.includes(v) || pCat.includes(v) || pSub.includes(v));
        });

        if (matches.length > 0) {
          const aisle = AISLES.find((a) => a.id === matches[0].aisleId);
          identifiedGroups.push({
            keyword: canonicalName,
            categoryName: aisle?.name,
            matches: matches.slice(0, 4),
          });
        }
      }
    }

    // 2. Fallback search ONLY on non-stop words with length >= 4 (or valid short groceries)
    if (identifiedGroups.length === 0) {
      const validShorts = new Set(['tea', 'oil', 'dal', 'egg', 'bun', 'jam', 'fig']);
      const words = input
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => (w.length >= 4 || validShorts.has(w)) && !STOP_WORDS.has(w));

      for (const w of words) {
        const matches = await catalogService.searchProducts(w);
        if (matches.length > 0) {
          identifiedGroups.push({
            keyword: w,
            matches: matches.slice(0, 3),
          });
        }
      }
    }

    return identifiedGroups;
  },
};
