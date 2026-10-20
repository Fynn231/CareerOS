import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSupabasePublicConfig, isSupabaseConfigured } from "./config";

describe("Supabase public config", () => {
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("returns null when env is missing (RED-case guard)", () => {
    expect(getSupabasePublicConfig()).toBeNull();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("returns null for malformed URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "key";
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("returns config when both variables are valid", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    expect(getSupabasePublicConfig()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "publishable",
    });
    expect(isSupabaseConfigured()).toBe(true);
  });
});