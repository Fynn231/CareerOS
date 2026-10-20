import { describe, it, expect } from "vitest";
import { trackerReducer, createEmptyState } from "./reducer";
import { createDemoState } from "../demo/fixtures";

describe("trackerReducer", () => {
  it("adds and deletes application", () => {
    const state = createEmptyState();
    const next = trackerReducer(state, {
      type: "application/add",
      draft: { company: "Acme (Demo)", role: "Engineer", stage: "saved" },
      meta: { id: "a1", now: "2026-10-15T12:00:00.000Z" },
    });
    expect(next.applications).toHaveLength(1);
    const afterDelete = trackerReducer(next, { type: "application/delete", id: "a1" });
    expect(afterDelete.applications).toHaveLength(0);
  });

  it("invalid add does not change state", () => {
    const state = createEmptyState();
    const next = trackerReducer(state, {
      type: "application/add",
      draft: { company: "", role: "Engineer", stage: "saved" },
      meta: { id: "a1", now: "2026-10-15T12:00:00.000Z" },
    });
    expect(next).toEqual(state);
  });

  it("loads demo state non-empty", () => {
    const demo = createDemoState();
    expect(demo.applications.length).toBeGreaterThan(0);
    expect(demo.followUps.length).toBeGreaterThan(0);
  });
});