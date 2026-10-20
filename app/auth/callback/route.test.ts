import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ getSupabasePublicConfig: vi.fn(() => ({ url: "https://example.supabase.co", anonKey: "publishable" })) }));

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "./route";

describe("auth callback (mocked client, not live integration)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses configured origin rather than Next internal localhost host", async () => {
    vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3100");
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    } as never);
    const response = await GET(new Request("http://localhost:3100/auth/callback?code=abc"));
    expect(response.headers.get("location")).toBe("http://127.0.0.1:3100/workspace");
  });

  it("handles thrown exchange failure with a generic login redirect", async () => {
    vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3100");
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockRejectedValue(new Error("provider-private-detail")) },
    } as never);
    const response = await GET(new Request("http://localhost:3100/auth/callback?code=abc"));
    expect(response.headers.get("location")).toBe("http://127.0.0.1:3100/login?error=auth");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabasePublicConfig).mockReturnValue({ url: "https://example.supabase.co", anonKey: "publishable" });
  });

  it("redirects missing config or code to generic login failure", async () => {
    vi.mocked(getSupabasePublicConfig).mockReturnValue(null);
    const response = await GET(new Request("http://127.0.0.1:3100/auth/callback?code=abc"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?error=auth");

    vi.mocked(getSupabasePublicConfig).mockReturnValue({ url: "https://example.supabase.co", anonKey: "publishable" });
    const noCode = await GET(new Request("http://127.0.0.1:3100/auth/callback"));
    expect(noCode.headers.get("location")).toContain("/login?error=auth");
  });

  it("redirects exchange failures to generic login failure", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: new Error("bad code") }) },
    } as never);
    const response = await GET(new Request("http://127.0.0.1:3100/auth/callback?code=abc"));
    expect(response.headers.get("location")).toContain("/login?error=auth");
  });

  it("redirects missing client to generic login failure", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    const response = await GET(new Request("http://127.0.0.1:3100/auth/callback?code=abc"));
    expect(response.headers.get("location")).toContain("/login?error=auth");
  });

  it("success with unsafe next falls back to /workspace", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    } as never);
    const response = await GET(new Request("http://127.0.0.1:3100/auth/callback?code=abc&next=https://evil.example/path"));
    expect(response.headers.get("location")).toContain("/workspace");
  });
});