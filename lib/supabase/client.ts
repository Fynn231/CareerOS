import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";

export const createSupabaseBrowserClient = () => {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey);
};