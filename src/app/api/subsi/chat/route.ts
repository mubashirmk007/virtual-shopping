import { NextRequest, NextResponse } from 'next/server';
import {
  processConversationalChat,
  ConversationalAIContext,
  SubsiAIResult,
} from '@/lib/openSourceAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      apiKey,
      conversationHistory = [],
      pendingChoices = [],
      cartItems = [],
      cartTotal = 0,
      currentAisleId = 'aisle-entrance',
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          reply: "Hey partner, I'm right here! What would you like to put in your basket?",
          action: { type: 'none' },
          pendingChoices: [],
        },
        { status: 400 }
      );
    }

    const context: ConversationalAIContext = {
      message,
      apiKey,
      conversationHistory,
      pendingChoices,
      cartItems,
      cartTotal,
      currentAisleId,
    };

    const result: SubsiAIResult = await processConversationalChat(context);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Subsi API Error:', error);
    return NextResponse.json<SubsiAIResult>(
      {
        reply: "I'm right here partner! Tell me what groceries you'd like to put in your trolley.",
        action: { type: 'none' },
        pendingChoices: [],
      },
      { status: 200 }
    );
  }
}
