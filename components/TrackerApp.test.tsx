import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackerApp } from "./TrackerApp";

describe("TrackerApp dialog", () => {
  it("opens and closes on Escape, restoring focus", async () => {
    const user = userEvent.setup();
    render(<TrackerApp />);
    const opener = screen.getByRole("button", { name: /add application/i });
    await user.click(opener);
    const dialog = screen.getByTestId("application-dialog");
    expect(dialog).toHaveAttribute("open");
    await user.keyboard("{Escape}");
    expect(dialog).not.toHaveAttribute("open");
    expect(opener).toHaveFocus();
  });

  it("cancels via Cancel button", async () => {
    const user = userEvent.setup();
    render(<TrackerApp />);
    await user.click(screen.getByRole("button", { name: /add application/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    const dialog = screen.getByTestId("application-dialog");
    expect(dialog).not.toHaveAttribute("open");
  });
});