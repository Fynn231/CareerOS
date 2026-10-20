import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";

export const createSupabaseServerClient = async ({ readOnly = false }: { readOnly?: boolean } = {}) => {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            if (!readOnly) throw error;
          }
        });
      },
    },
  });
};

export const getVerifiedUser = async ({ readOnly = false }: { readOnly?: boolean } = {}) => {
  const client = await createSupabaseServerClient({ readOnly });
  if (!client) return { client: null, user: null, error: new Error("Supabase is not configured.") };
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      return { client, user: null, error: error ?? new Error("Not authenticated.") };
    }
    return { client, user: data.user, error: null };
  } catch (error) {
    return {
      client,
      user: null,
      error: error instanceof Error ? error : new Error("Unable to verify your session."),
    };
  }
};