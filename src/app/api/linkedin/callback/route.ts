import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";


const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || new URL("/api/linkedin/callback", req.nextUrl.origin).toString();
  const appOrigin = new URL("/", req.nextUrl.origin).toString();

  if (error) {
    return NextResponse.redirect(`${appOrigin}?linkedin=denied`);
  }
  if (!code) {
    return NextResponse.redirect(`${appOrigin}?linkedin=error`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appOrigin}?linkedin=config`);
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("LinkedIn token exchange failed:", err);
    return NextResponse.redirect(`${appOrigin}?linkedin=token`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  
  if (!accessToken) {
    return NextResponse.redirect(`${appOrigin}?linkedin=token`);
  }

  const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) {
    const profileErr = await meRes.text();
    console.error("LinkedIn /v2/userInfo failed:", meRes.status, profileErr);
    return NextResponse.redirect(`${appOrigin}?linkedin=profile`);
  }
  const me = await meRes.json();
  const personId = me.id;
  if (!personId) {
    console.error("LinkedIn /v2/userInfo missing id:", JSON.stringify(me));
    return NextResponse.redirect(`${appOrigin}?linkedin=profile`);
  }

  const cookieStore = await cookies();
  cookieStore.set("linkedin_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 59,
    path: "/",
  });
  cookieStore.set("linkedin_person_id", personId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 59,
    path: "/",
  });

  return NextResponse.redirect(`${appOrigin}?linkedin=connected`);
}
