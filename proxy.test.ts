import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/config", () => ({ getSupabasePublicConfig: vi.fn(() => ({ url: "https://example.supabase.co", anonKey: "publishable" })) }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url, _key, options) => {
    options.cookies.setAll?.([{ name: "sb-access", value: "refreshed", options: { maxAge: 100 } }], {});
    return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u" } }, error: null }) } };
  }),
}));

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerClient } from "@supabase/ssr";
import { proxy } from "./proxy";

describe("Supabase proxy adapter (provider mocks, not live integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabasePublicConfig).mockReturnValue({ url: "https://example.supabase.co", anonKey: "publishable" });
  });

  it("propagates refreshed cookie names, values, and options", async () => {
    const request = new NextRequest("http://127.0.0.1:3100/workspace", {
      headers: { origin: "http://127.0.0.1:3100", host: "127.0.0.1:3100", cookie: "sb-access=old" },
    });
    const response = await proxy(request);
    expect(response.cookies.get("sb-access")?.value).toBe("refreshed");
    expect(response.cookies.get("sb-access")?.maxAge).toBe(100);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("returns a generic fail-closed response when verification throws", async () => {
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      options.cookies.setAll?.([], {});
      return { auth: { getUser: vi.fn().mockRejectedValue(new Error("raw provider detail")) } };
    });
    const request = new NextRequest("http://127.0.0.1:3100/workspace", {
      headers: { origin: "http://127.0.0.1:3100", host: "127.0.0.1:3100" },
    });
    const response = await proxy(request);
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = await response.text();
    expect(body).not.toContain("raw provider detail");
  });

  it("keeps no-store when Supabase is unconfigured", async () => {
    vi.mocked(getSupabasePublicConfig).mockReturnValue(null);
    const request = new NextRequest("http://127.0.0.1:3100/login");
    const response = await proxy(request);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});