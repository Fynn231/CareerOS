import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { createSupabaseServerClient, getVerifiedUser } from "./server";

const mockedCookies = vi.mocked(cookies);
const mockedCreateServer = vi.mocked(createServerClient);

describe("Supabase server cookie adapter (provider mocks, not live integration)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("sets cookie names, values, and options through setAll", async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(),
    };
    mockedCookies.mockResolvedValue(cookieStore as never);

    let capturedSetAll: SetAllCookies | undefined;
    mockedCreateServer.mockImplementation((_url, _key, options) => {
      capturedSetAll = options.cookies.setAll;
      return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } } as never;
    });

    const client = await createSupabaseServerClient();
    expect(client).not.toBeNull();
    capturedSetAll?.([{ name: "sb-access", value: "secret-value", options: { maxAge: 3600 } }], {});

    expect(cookieStore.set).toHaveBeenCalledWith("sb-access", "secret-value", { maxAge: 3600 });
  });

  it("propagates cookie-write errors in writable context", async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(() => {
        throw new Error("write blocked");
      }),
    };
    mockedCookies.mockResolvedValue(cookieStore as never);
    mockedCreateServer.mockImplementation((_url, _key, options) => {
      options.cookies.setAll?.([{ name: "sb-access", value: "x", options: {} }], {});
      return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } } as never;
    });

    await expect(createSupabaseServerClient()).rejects.toThrow("write blocked");
  });

  it("suppresses cookie-write errors in readOnly context", async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(() => {
        throw new Error("write blocked");
      }),
    };
    mockedCookies.mockResolvedValue(cookieStore as never);
    mockedCreateServer.mockImplementation((_url, _key, options) => {
      options.cookies.setAll?.([{ name: "sb-access", value: "x", options: {} }], {});
      return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } } as never;
    });

    await expect(createSupabaseServerClient({ readOnly: true })).resolves.not.toBeNull();
  });

  it("returns null user on absent verification", async () => {
    const cookieStore = { getAll: vi.fn(() => []), set: vi.fn() };
    mockedCookies.mockResolvedValue(cookieStore as never);
    mockedCreateServer.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never);

    const result = await getVerifiedUser({ readOnly: true });
    expect(result.user).toBeNull();
  });

  it("returns null user on verification error", async () => {
    const cookieStore = { getAll: vi.fn(() => []), set: vi.fn() };
    mockedCookies.mockResolvedValue(cookieStore as never);
    mockedCreateServer.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "x" } }, error: new Error("bad") }) },
    } as never);

    const result = await getVerifiedUser();
    expect(result.user).toBeNull();
  });

  it("returns null user when verification throws", async () => {
    const cookieStore = { getAll: vi.fn(() => []), set: vi.fn() };
    mockedCookies.mockResolvedValue(cookieStore as never);
    mockedCreateServer.mockReturnValue({
      auth: { getUser: vi.fn().mockRejectedValue(new Error("network")) },
    } as never);

    const result = await getVerifiedUser();
    expect(result.user).toBeNull();
  });
});