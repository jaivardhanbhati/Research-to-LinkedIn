import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("linkedin_token");
  cookieStore.delete("linkedin_person_id");
  return NextResponse.json({ ok: true });
}
