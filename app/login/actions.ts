"use server";

import { redirect } from "next/navigation";
import { getVerifiedUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { assertSameOrigin } from "@/lib/security/same-origin";
import { getAppOrigin } from "@/lib/security/origin";

export type AuthFormState = {
  error?: string;
  message?: string;
};

export const signInAction = async (
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Invalid request origin." };
  }

  const config = getSupabasePublicConfig();
  if (!config) return { error: "Supabase is not configured. Add the public variables to continue." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const client = await createSupabaseServerClient();
    if (!client) return { error: "Supabase is not configured. Add the public variables to continue." };
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { error: "Invalid email or password." };

    try {
      const { user, error: verificationError } = await getVerifiedUser();
      if (verificationError || !user) throw new Error("Session verification failed");
    } catch {
      try { await client.auth.signOut(); } catch { /* Cleanup is best effort. */ }
      return { error: "Unable to verify your session." };
    }
  } catch {
    return { error: "Invalid email or password." };
  }

  redirect("/workspace");
};

export const signUpAction = async (
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Invalid request origin." };
  }

  const config = getSupabasePublicConfig();
  if (!config) return { error: "Supabase is not configured. Add the public variables to continue." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password || password.length < 8) {
    return { error: "Enter a valid email and a password with at least 8 characters." };
  }

  let appOrigin: string;
  try {
    appOrigin = getAppOrigin();
  } catch {
    return { error: "Supabase is not configured. Add the public variables to continue." };
  }

  try {
    const client = await createSupabaseServerClient();
    if (!client) return { error: "Supabase is not configured. Add the public variables to continue." };
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${appOrigin}/auth/callback?next=/workspace` },
    });
    if (error) return { error: "Unable to create account." };
    if (!data.session) {
      return { message: "Account created. Check your email to confirm the account before signing in." };
    }
    try {
      const { user, error: verificationError } = await getVerifiedUser();
      if (verificationError || !user) throw new Error("Session verification failed");
    } catch {
      try { await client.auth.signOut(); } catch { /* Cleanup is best effort. */ }
      return { error: "Unable to verify your session." };
    }
  } catch {
    return { error: "Unable to create account." };
  }

  redirect("/workspace");
};