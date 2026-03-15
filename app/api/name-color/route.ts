import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { hex, r, g, b } = await req.json();

  if (!hex || r == null || g == null || b == null) {
    return NextResponse.json({ error: "Missing color data" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: `Give this color a single evocative, poetic name (2–4 words max). No explanation. Just the name.\n\nColor: ${hex} / rgb(${r}, ${g}, ${b})`,
      },
    ],
  });

  const name = (message.content[0] as { type: string; text: string }).text.trim();
  return NextResponse.json({ name });
}
