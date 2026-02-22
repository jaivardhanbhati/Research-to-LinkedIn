import { NextRequest, NextResponse } from "next/server";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const SCOPES = "w_member_social openid profile email";

export async function GET(req: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/?linkedin=config", req.nextUrl.origin));
  }
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || new URL("/api/linkedin/callback", req.nextUrl.origin).toString();
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });
  return NextResponse.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
}
