import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { isSafeInternalPath } from "@/lib/security/redirects";
import { getAppOrigin } from "@/lib/security/origin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getAppOrigin();
  const redirectTo = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  const code = url.searchParams.get("code");
  if (!code || !getSupabasePublicConfig()) {
    return redirectTo("/login?error=auth");
  }

  try {
    const client = await createSupabaseServerClient();
    if (!client) return redirectTo("/login?error=auth");
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return redirectTo("/login?error=auth");
  } catch {
    return redirectTo("/login?error=auth");
  }

  const next = url.searchParams.get("next");
  const destination = isSafeInternalPath(next) ? next : "/workspace";
  return redirectTo(destination);
}