export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const getSupabasePublicConfig = (): SupabasePublicConfig | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey || !url.trim() || !anonKey.trim()) {
    return null;
  }

  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();
  if (!isHttpUrl(trimmedUrl)) return null;

  return { url: trimmedUrl, anonKey: trimmedKey };
};

export const isSupabaseConfigured = (): boolean =>
  getSupabasePublicConfig() !== null;