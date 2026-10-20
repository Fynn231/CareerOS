import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVerifiedUser } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/security/same-origin";

vi.mock("@/lib/security/same-origin", () => ({ assertSameOrigin: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getVerifiedUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import {
  createApplicationAction,
  updateApplicationAction,
  deleteApplicationAction,
  signOutAction,
} from "./actions";

const mockedAssert = vi.mocked(assertSameOrigin);
const mockedGetUser = vi.mocked(getVerifiedUser);

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([key, value]) => fd.set(key, value));
  return fd;
}

describe("workspace server actions (provider mocks, not live integration)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any;

  beforeEach(() => {
    vi.clearAllMocks();
    client = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn().mockResolvedValue({ data: [{ id: "row-1" }], error: null }),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn().mockResolvedValue({ data: [{ id: "row-1" }], error: null }),
            })),
          })),
        })),
      })),
      auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    };
    mockedAssert.mockResolvedValue(undefined);
    mockedGetUser.mockResolvedValue({ user: { id: "verified-user" } as never, client: client as never, error: null });
  });

  it("fails closed when identity verification fails before any insert", async () => {
    mockedGetUser.mockResolvedValue({ user: null, client, error: new Error("bad") });
    const result = await createApplicationAction({} as never, formData({ company: "A", role: "B", stage: "saved" }));
    expect(result.error).toBe("You must be signed in.");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("blocks writes when origin assertion fails", async () => {
    mockedAssert.mockRejectedValue(new Error("origin"));
    const result = await createApplicationAction({} as never, formData({ company: "A", role: "B", stage: "saved" }));
    expect(result.error).toBe("Invalid request origin.");
    expect(mockedGetUser).not.toHaveBeenCalled();
  });

  it("ignores a submitted owner_id and uses verified identity", async () => {
    const result = await createApplicationAction(
      {} as never,
      formData({ company: "A", role: "B", stage: "saved", owner_id: "attacker" }),
    );
    expect(result.error).toBeUndefined();
    const insertPayload = client.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertPayload.owner_id).toBe("verified-user");
  });

  it("update filters by both supplied id and verified owner", async () => {
    const result = await updateApplicationAction(
      {} as never,
      formData({ id: "row-1", company: "A", role: "B", stage: "saved" }),
    );
    expect(result.error).toBeUndefined();
    const updateBuilder = client.from.mock.results[0].value.update.mock.results[0].value;
    const firstEq = updateBuilder.eq.mock.calls[0];
    const secondEq = updateBuilder.eq.mock.results[0].value.eq.mock.calls[0];
    expect(firstEq).toEqual(["id", "row-1"]);
    expect(secondEq).toEqual(["owner_id", "verified-user"]);
  });

  it("delete returns an error for zero affected rows", async () => {
    const deleteBuilder = {
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    };
    const deleteClient = { from: vi.fn(() => deleteBuilder), auth: client.auth };
    mockedGetUser.mockResolvedValue({ user: { id: "verified-user" } as never, client: deleteClient as never, error: null });
    const result = await deleteApplicationAction(formData({ id: "row-1" }));
    expect(result.error).toBe("Unable to delete application.");
  });

  it("signout surfaces a generic failure instead of redirecting", async () => {
    client.auth.signOut.mockResolvedValue({ error: new Error("boom") });
    const result = await signOutAction();
    expect(result.error).toBe("Unable to sign out.");
  });

  it("blocks update when identity verification is unavailable", async () => {
    mockedGetUser.mockResolvedValue({ user: null, client, error: new Error("bad") });
    const result = await updateApplicationAction({} as never, formData({ id: "row-1", company: "A", role: "B", stage: "saved" }));
    expect(result.error).toBe("You must be signed in.");
  });

  it("blocks delete when identity verification is unavailable", async () => {
    mockedGetUser.mockResolvedValue({ user: null, client, error: new Error("bad") });
    const result = await deleteApplicationAction(formData({ id: "row-1" }));
    expect(result.error).toBe("You must be signed in.");
  });

  it("rejects signout origin mismatches before signing out", async () => {
    mockedAssert.mockRejectedValueOnce(new Error("origin"));
    const result = await signOutAction();
    expect(result.error).toBe("Invalid request origin.");
    expect(client.auth.signOut).not.toHaveBeenCalled();
  });
});