import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

vi.mock("@/lib/supabase/config", () => ({
  getSupabasePublicConfig: () => null,
}));

describe("login page (mocked config, not live integration)", () => {
  it("shows a generic authentication error and no raw details", async () => {
    render(await LoginPage({ searchParams: { error: "auth" } }));
    expect(screen.getByText("Unable to complete authentication. Try again.")).toBeInTheDocument();
    expect(screen.queryByText(/raw provider/i)).not.toBeInTheDocument();
  });
});