import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function searchTavily(query: string): Promise<string[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      search_depth: "advanced",
      max_results: 8,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const results = data.results ?? [];
  return results.map((r: { title?: string; content?: string }) => `${r.title || ""}\n${r.content || ""}`).filter(Boolean);
}

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
    }

    // Agent step 1: Search for information
    const searchSnippets = await searchTavily(topic);
    const searchContext = searchSnippets.length
      ? "Here is web search results for the topic:\n\n" + searchSnippets.join("\n\n---\n\n")
      : "No web search was performed (Tavily API key not set). Use your knowledge to provide a comprehensive research summary.";

    // Agent step 2: Synthesize research
    const researchResponse = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a research assistant. Given a topic and any available search results, produce a clear, structured research summary. Include key facts, statistics, trends, and insights. Use bullet points and short paragraphs. If no search results are provided, use your knowledge to create a thorough research summary.`,
        },
        {
          role: "user",
          content: `Topic: ${topic}\n\n${searchContext}\n\nProvide a comprehensive research summary.`,
        },
      ],
    });
    const research = researchResponse.choices[0]?.message?.content?.trim() ?? "";

    // Agent step 3: Create LinkedIn post draft
    const draftResponse = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You write engaging LinkedIn posts. Write in a professional but conversational tone. Use short paragraphs (1-3 lines). Start with a hook. Include a clear takeaway or call to action. Keep it under 300 words. Do not use hashtags unless the user's topic clearly benefits from 1-3 relevant ones. Output only the post text, no meta or instructions.`,
        },
        {
          role: "user",
          content: `Based on this research, write a LinkedIn post about: ${topic}\n\nResearch:\n${research}`,
        },
      ],
    });
    const draft = draftResponse.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ research, draft, searchSnippets: searchSnippets.length ? searchSnippets : undefined });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Research failed" },
      { status: 500 }
    );
  }
}
