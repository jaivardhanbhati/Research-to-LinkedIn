import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { draft, feedback } = await req.json();
    if (!draft || typeof draft !== "string") {
      return NextResponse.json({ error: "Draft is required" }, { status: 400 });
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
          content: `You are a LinkedIn post editor. Given the current draft and the user's feedback, produce a revised version of the post. Keep the same tone and length unless the user asks otherwise. Output only the revised post text.`,
        },
        {
          role: "user",
          content: `Current draft:\n\n${draft}\n\nUser feedback: ${feedback}\n\nRevised post:`,
        },
      ],
    });
    const revised = response.choices[0]?.message?.content?.trim() ?? draft;

    return NextResponse.json({ draft: revised });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Refine failed" },
      { status: 500 }
    );
  }
}
