import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("linkedin_token")?.value;
  const personId = cookieStore.get("linkedin_person_id")?.value;
  const connected = !!(token && personId);
  return NextResponse.json({ connected });
}
