import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_VERSION = "202502";

function escapeCommentary(text: string): string {
  return text.replace(/([\\{}@\[\]()<>#*_~])/g, "\\$1");
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("linkedin_token")?.value;
  const personId = cookieStore.get("linkedin_person_id")?.value;

  if (!token || !personId) {
    return NextResponse.json({ error: "Not connected to LinkedIn. Connect first." }, { status: 401 });
  }

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const content = body.content;
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const commentary = escapeCommentary(content.trim());
  const authorUrn = `urn:li:person:${personId}`;

  const postBody = {
    author: authorUrn,
    commentary,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED" },
    lifecycleState: "PUBLISHED",
  };

  const res = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Linkedin-Version": LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(postBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("LinkedIn publish error:", res.status, errText);
    if (res.status === 401) {
      return NextResponse.json({ error: "LinkedIn session expired. Connect again." }, { status: 401 });
    }
    return NextResponse.json(
      { error: errText || "LinkedIn could not publish the post." },
      { status: res.status >= 500 ? 502 : res.status }
    );
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: true, id: data.id });
}
