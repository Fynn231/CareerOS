import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("REDIRECT_SENTINEL"); }) }));

vi.mock("@/lib/security/same-origin", () => ({ assertSameOrigin: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/supabase/config", () => ({ getSupabasePublicConfig: vi.fn(() => ({ url: "https://example.supabase.co", anonKey: "publishable" })) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn(), getVerifiedUser: vi.fn() }));

import { redirect } from "next/navigation";
import { assertSameOrigin } from "@/lib/security/same-origin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedUser } from "@/lib/supabase/server";
import { signInAction, signUpAction } from "./actions";

afterEach(() => { vi.unstubAllEnvs(); });

describe("login server actions (provider mocks, not live integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3100");
    vi.mocked(getSupabasePublicConfig).mockReturnValue({ url: "https://example.supabase.co", anonKey: "publishable" });
  });

  it("signup confirmation targets the loopback callback port 3100", async () => {
    const signUp = vi.fn().mockResolvedValue({ data: { session: null, user: { id: "u" } }, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { signUp },
    } as never);

    const formData = new FormData();
    formData.set("email", "a@example.com");
    formData.set("password", "password123");
    const result = await signUpAction({} as never, formData);

    expect(result.message).toContain("Check your email");
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: "http://127.0.0.1:3100/auth/callback?next=/workspace" },
      }),
    );
  });
});
const form = () => {
  const data = new FormData();
  data.set("email", "fictional@example.com");
  data.set("password", "fictional-password");
  return data;
};

describe("signIn thrown provider failures (provider mocks)", () => {
  it.each(["client", "signIn", "verification", "cleanup"])("returns a generic error for thrown %s failures", async (point) => {
    vi.resetAllMocks();
    vi.mocked(getSupabasePublicConfig).mockReturnValue({ url: "https://example.supabase.co", anonKey: "publishable" });
    const failure = new Error("fictional provider internal detail");
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signInWithPassword, signOut } } as never);
    vi.mocked(getVerifiedUser).mockResolvedValue({ user: null, error: null } as never);
    if (point === "client") vi.mocked(createSupabaseServerClient).mockRejectedValue(failure);
    if (point === "signIn") signInWithPassword.mockRejectedValue(failure);
    if (point === "verification") vi.mocked(getVerifiedUser).mockRejectedValue(failure);
    if (point === "cleanup") signOut.mockRejectedValue(failure);
    expect(await signInAction({}, form())).toEqual({ error: point === "cleanup" || point === "verification" ? "Unable to verify your session." : "Invalid email or password." });
    if (point === "verification" || point === "cleanup") expect(signOut).toHaveBeenCalledOnce();
  });
});

describe("signUp thrown provider failures (provider mocks)", () => {
  it.each(["client", "signUp", "verification", "cleanup"])("returns a generic error for thrown %s failures", async (point) => {
    vi.resetAllMocks();
    vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3100");
    vi.mocked(getSupabasePublicConfig).mockReturnValue({ url: "https://example.supabase.co", anonKey: "publishable" });
    const failure = new Error("fictional provider internal detail");
    const signUp = vi.fn().mockResolvedValue({ data: { session: {} }, error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signUp, signOut } } as never);
    vi.mocked(getVerifiedUser).mockResolvedValue({ user: null, error: null } as never);
    if (point === "client") vi.mocked(createSupabaseServerClient).mockRejectedValue(failure);
    if (point === "signUp") signUp.mockRejectedValue(failure);
    if (point === "verification") vi.mocked(getVerifiedUser).mockRejectedValue(failure);
    if (point === "cleanup") signOut.mockRejectedValue(failure);
    expect(await signUpAction({}, form())).toEqual({ error: point === "cleanup" || point === "verification" ? "Unable to verify your session." : "Unable to create account." });
    if (point === "verification" || point === "cleanup") expect(signOut).toHaveBeenCalledOnce();
  });
});

describe("auth action guards and redirects (provider mocks)", () => {
  const signInWithPassword = vi.fn();
  const signUp = vi.fn();
  const signOut = vi.fn();
  const sentinel = new Error("REDIRECT_SENTINEL");
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3100");
    vi.mocked(assertSameOrigin).mockResolvedValue(undefined);
    vi.mocked(redirect).mockImplementation(() => { throw sentinel; });
    vi.mocked(getSupabasePublicConfig).mockReturnValue({ url: "https://example.supabase.co", anonKey: "publishable" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signInWithPassword, signUp, signOut } } as never);
    signInWithPassword.mockResolvedValue({ error: null });
    signUp.mockResolvedValue({ data: { session: {} }, error: null });
    signOut.mockResolvedValue({ error: null });
    vi.mocked(getVerifiedUser).mockResolvedValue({ user: { id: "fictional-user" }, error: null } as never);
  });

  it.each([signInAction, signUpAction])("propagates successful session redirect sentinel", async (action) => {
    await expect(action({}, form())).rejects.toBe(sentinel);
    expect(redirect).toHaveBeenCalledWith("/workspace");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("returns generic invalid credentials without provider details", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "fictional provider detail" } });
    expect(await signInAction({}, form())).toEqual({ error: "Invalid email or password." });
    expect(getVerifiedUser).not.toHaveBeenCalled();
  });

  it.each([signInAction, signUpAction])("cleans up failed verification", async (action) => {
    vi.mocked(getVerifiedUser).mockResolvedValue({ user: null, error: new Error("fictional detail") } as never);
    expect(await action({}, form())).toEqual({ error: "Unable to verify your session." });
    expect(signOut).toHaveBeenCalledOnce();
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each([signInAction, signUpAction])("rejects origin before creating client", async (action) => {
    vi.mocked(assertSameOrigin).mockRejectedValue(new Error("fictional origin"));
    expect(await action({}, form())).toEqual({ error: "Invalid request origin." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it.each([signInAction, signUpAction])("rejects missing config before client", async (action) => {
    vi.mocked(getSupabasePublicConfig).mockReturnValue(null);
    expect(await action({}, form())).toEqual({ error: "Supabase is not configured. Add the public variables to continue." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it.each([signInAction, signUpAction])("rejects unavailable client", async (action) => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    expect(await action({}, form())).toEqual({ error: "Supabase is not configured. Add the public variables to continue." });
  });

  it.each([signInAction, signUpAction])("rejects missing inputs before client", async (action) => {
    expect((await action({}, new FormData())).error).toBeTruthy();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects short signup passwords", async () => {
    const data = form(); data.set("password", "short");
    expect(await signUpAction({}, data)).toEqual({ error: "Enter a valid email and a password with at least 8 characters." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects invalid callback origin before client", async () => {
    vi.stubEnv("APP_ORIGIN", "https://example.com");
    expect(await signUpAction({}, form())).toEqual({ error: "Supabase is not configured. Add the public variables to continue." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns a generic signup provider error", async () => {
    signUp.mockResolvedValue({ data: {}, error: { message: "fictional detail" } });
    expect(await signUpAction({}, form())).toEqual({ error: "Unable to create account." });
  });
});
