import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured in .env.local" },
      { status: 500 },
    );
  }

  const { ticker, name, price, change, sentiment, currency } = await req.json();

  const client = new Anthropic({ apiKey });

  const currencyPrefix = currency === "USD" ? "$" : `${currency} `;
  const priceStr = price != null ? `${currencyPrefix}${Number(price).toFixed(2)}` : "N/A";
  const changeStr =
    change != null ? `${Number(change) >= 0 ? "+" : ""}${Number(change).toFixed(2)}%` : "N/A";

  try {
    const stream = client.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `You are a sharp, direct stock analyst. Analyze ${ticker} (${name}):

- Current price: ${priceStr}
- Daily change: ${changeStr}
- 52-week position: ${sentiment}/100 (0 = at 52-week low, 100 = at 52-week high)

Give a 3–4 sentence verdict. Start with one of: BUY, HOLD, or UNLOAD — then explain your reasoning based on the available data. Be blunt about risks. No disclaimers.`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
