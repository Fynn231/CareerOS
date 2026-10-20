import { describe, it, expect } from "vitest";
import { createEmptyState } from "./types";
import {
  createApplication,
  updateApplication,
  deleteApplication,
  filterApplications,
} from "./applications";
import { createFollowUp, completeFollowUp, reopenFollowUp } from "./followups";
import { computeAnalytics } from "./analytics";
import { validateApplicationInput, isValidDate, isHttpUrl } from "./validation";

const NOW = "2026-10-15T12:00:00.000Z";

describe("validation", () => {
  it("requires company and role", () => {
    const errors = validateApplicationInput({
      company: "   ",
      role: "",
      stage: "saved",
    });
    expect(errors.company).toBeTruthy();
    expect(errors.role).toBeTruthy();
  });

  it("validates stage", () => {
    const errors = validateApplicationInput({
      company: "Acme",
      role: "Engineer",
      stage: "nope" as never,
    });
    expect(errors.stage).toBeTruthy();
  });

  it("validates url and date", () => {
    expect(isHttpUrl("https://example.com")).toBe(true);
    expect(isHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-02-20")).toBe(true);
    const errors = validateApplicationInput({
      company: "Acme",
      role: "Engineer",
      stage: "applied",
      postingUrl: "not-a-url",
      appliedDate: "2026-99-99",
    });
    expect(errors.postingUrl).toBeTruthy();
    expect(errors.appliedDate).toBeTruthy();
  });

  it("enforces length limits", () => {
    const errors = validateApplicationInput({
      company: "a".repeat(200),
      role: "Engineer",
      stage: "saved",
      notes: "b".repeat(3000),
    });
    expect(errors.company).toBeTruthy();
    expect(errors.notes).toBeTruthy();
  });
});

describe("crud", () => {
  it("creates application and rejects invalid", () => {
    let state = createEmptyState();
    const bad = createApplication(
      state,
      { company: "", role: "Engineer", stage: "saved" },
      { now: NOW, id: "a1" },
    );
    expect(bad.ok).toBe(false);
    const good = createApplication(
      state,
      { company: "Acme (Demo)", role: "Engineer", stage: "saved" },
      { now: NOW, id: "a1" },
    );
    expect(good.ok).toBe(true);
    if (good.ok) {
      state = good.state;
      expect(state.applications).toHaveLength(1);
      expect(state.applications[0].id).toBe("a1");
      expect(state.stageEvents).toHaveLength(0);
    }
  });

  it("updates stage and records stage event", () => {
    let state = createEmptyState();
    const created = createApplication(
      state,
      { company: "Acme (Demo)", role: "Engineer", stage: "saved" },
      { now: NOW, id: "a1" },
    );
    if (!created.ok) throw new Error("create failed");
    state = created.state;
    const updated = updateApplication(
      state,
      "a1",
      { stage: "applied", appliedDate: "2026-10-14" },
      { now: "2026-10-15T13:00:00.000Z" },
    );
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.application.stage).toBe("applied");
      expect(updated.stageEvent).not.toBeNull();
      expect(updated.stageEvent?.previousStage).toBe("saved");
      expect(updated.stageEvent?.newStage).toBe("applied");
      expect(updated.state.stageEvents).toHaveLength(1);
    }
  });

  it("update keeps state unchanged on invalid", () => {
    let state = createEmptyState();
    const created = createApplication(
      state,
      { company: "Acme (Demo)", role: "Engineer", stage: "saved" },
      { now: NOW, id: "a1" },
    );
    if (!created.ok) throw new Error("create failed");
    state = created.state;
    const updated = updateApplication(state, "a1", { company: "" }, { now: NOW });
    expect(updated.ok).toBe(false);
    expect(state.applications[0].company).toBe("Acme (Demo)");
  });

  it("does not record event when stage unchanged", () => {
    let state = createEmptyState();
    const created = createApplication(
      state,
      { company: "Acme (Demo)", role: "Engineer", stage: "saved" },
      { now: NOW, id: "a1" },
    );
    if (!created.ok) throw new Error("create failed");
    state = created.state;
    const updated = updateApplication(state, "a1", { notes: "updated" }, { now: NOW });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.stageEvent).toBeNull();
  });

  it("deletes application and related followups/events", () => {
    let state = createEmptyState();
    const created = createApplication(
      state,
      { company: "Acme (Demo)", role: "Engineer", stage: "saved" },
      { now: NOW, id: "a1" },
    );
    if (!created.ok) throw new Error("create failed");
    state = created.state;
    const fu = createFollowUp(
      state,
      { applicationId: "a1", dueDate: "2026-10-20", notes: "x" },
      { now: NOW, id: "f1" },
    );
    if (!fu.ok) throw new Error("followup failed");
    state = fu.state;
    const up = updateApplication(state, "a1", { stage: "applied" }, { now: NOW });
    if (up.ok) state = up.state;
    const next = deleteApplication(state, "a1");
    expect(next.applications).toHaveLength(0);
    expect(next.followUps).toHaveLength(0);
    expect(next.stageEvents).toHaveLength(0);
  });

  it("unknown update fails", () => {
    const result = updateApplication(createEmptyState(), "nope", { notes: "x" }, { now: NOW });
    expect(result.ok).toBe(false);
  });
});

describe("filtering", () => {
  it("filters by stage and query", () => {
    let state = createEmptyState();
    const a = createApplication(state, { company: "Acme (Demo)", role: "Engineer", stage: "saved" }, { now: NOW, id: "a1" });
    if (!a.ok) throw new Error();
    state = a.state;
    const b = createApplication(state, { company: "Beta (Demo)", role: "Designer", stage: "applied" }, { now: NOW, id: "a2" });
    if (!b.ok) throw new Error();
    state = b.state;
    const filtered = filterApplications(state.applications, { query: "beta", stage: "all" });
    expect(filtered).toHaveLength(1);
    const byStage = filterApplications(state.applications, { query: "", stage: "applied" });
    expect(byStage).toHaveLength(1);
  });
});

describe("followups", () => {
  it("creates, completes, reopens", () => {
    let state = createEmptyState();
    const a = createApplication(state, { company: "Acme (Demo)", role: "Engineer", stage: "saved" }, { now: NOW, id: "a1" });
    if (!a.ok) throw new Error();
    state = a.state;
    const fu = createFollowUp(state, { applicationId: "a1", dueDate: "2026-10-20" }, { now: NOW, id: "f1" });
    expect(fu.ok).toBe(true);
    if (!fu.ok) return;
    state = fu.state;
    state = completeFollowUp(state, "f1", NOW);
    expect(state.followUps[0].completedAt).toBe(NOW);
    state = reopenFollowUp(state, "f1");
    expect(state.followUps[0].completedAt).toBeNull();
  });

  it("rejects followup for missing application", () => {
    const result = createFollowUp(createEmptyState(), { applicationId: "nope", dueDate: "2026-10-20" }, { now: NOW, id: "f1" });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid date", () => {
    let state = createEmptyState();
    const a = createApplication(state, { company: "Acme (Demo)", role: "Engineer", stage: "saved" }, { now: NOW, id: "a1" });
    if (!a.ok) throw new Error();
    state = a.state;
    const result = createFollowUp(state, { applicationId: "a1", dueDate: "bad" }, { now: NOW, id: "f1" });
    expect(result.ok).toBe(false);
  });
});

describe("analytics", () => {
  it("edge cases empty", () => {
    const analytics = computeAnalytics(createEmptyState(), NOW);
    expect(analytics.totalCount).toBe(0);
    expect(analytics.overdueFollowUps).toHaveLength(0);
    expect(analytics.recordedApplicationsByDate).toHaveLength(0);
    for (const stage of Object.keys(analytics.byStage)) {
      expect(analytics.byStage[stage as keyof typeof analytics.byStage]).toBe(0);
    }
  });

  it("counts stages and overdue followups", () => {
    let state = createEmptyState();
    const a = createApplication(state, { company: "Acme (Demo)", role: "Engineer", stage: "applied", appliedDate: "2026-10-01" }, { now: NOW, id: "a1" });
    if (!a.ok) throw new Error();
    state = a.state;
    const fu = createFollowUp(state, { applicationId: "a1", dueDate: "2026-10-01", notes: "x" }, { now: NOW, id: "f1" });
    if (!fu.ok) throw new Error();
    state = fu.state;
    const analytics = computeAnalytics(state, "2026-10-15T12:00:00.000Z");
    expect(analytics.totalCount).toBe(1);
    expect(analytics.byStage.applied).toBe(1);
    expect(analytics.recordedApplicationsByDate).toEqual([{ date: "2026-10-01", count: 1 }]);
    expect(analytics.overdueFollowUps).toHaveLength(1);
    expect(analytics.definitions.length).toBeGreaterThan(0);
  });

  it("does not compute conversion", () => {
    const analytics = computeAnalytics(createEmptyState(), NOW) as Record<string, unknown>;
    expect(analytics).not.toHaveProperty("conversionRate");
  });

  it("treats overdue boundary by calendar date", () => {
    let state = createEmptyState();
    const a = createApplication(
      state,
      { company: "Acme (Demo)", role: "Engineer", stage: "applied", appliedDate: "2026-10-01" },
      { now: NOW, id: "a1" },
    );
    if (!a.ok) throw new Error("create failed");
    state = a.state;
    const f1 = createFollowUp(state, { applicationId: "a1", dueDate: "2026-10-14" }, { now: NOW, id: "f1" });
    if (!f1.ok) throw new Error("followup failed");
    state = f1.state;
    const f2 = createFollowUp(state, { applicationId: "a1", dueDate: "2026-10-15" }, { now: NOW, id: "f2" });
    if (!f2.ok) throw new Error("followup failed");
    state = f2.state;
    const analytics = computeAnalytics(state, "2026-10-15");
    expect(analytics.overdueFollowUps.map((f) => f.dueDate)).toEqual(["2026-10-14"]);
  });
});