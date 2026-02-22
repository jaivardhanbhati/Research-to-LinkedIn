import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { research, feedback } = await req.json();
    if (!research || typeof research !== "string") {
      return NextResponse.json({ error: "Research is required" }, { status: 400 });
    }
    if (!feedback || typeof feedback !== "string") {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a research editor. Given the current research summary and the user's feedback, produce a revised research summary. Keep it structured (bullets/paragraphs), factual, and comprehensive unless the user asks otherwise. Output only the revised research text.`,
        },
        {
          role: "user",
          content: `Current research summary:\n\n${research}\n\nUser feedback: ${feedback}\n\nRevised research summary:`,
        },
      ],
    });
    const revised = response.choices[0]?.message?.content?.trim() ?? research;

    return NextResponse.json({ research: revised });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Refine failed" },
      { status: 500 }
    );
  }
}
