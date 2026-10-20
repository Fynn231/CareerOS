import { AppState, Stage, STAGES } from "./types";

export type OverdueFollowUp = {
  id: string;
  applicationId: string;
  dueDate: string;
  notes: string;
};

export type Analytics = {
  totalCount: number;
  byStage: Record<Stage, number>;
  recordedApplicationsByDate: Array<{ date: string; count: number }>;
  overdueFollowUps: Array<{
    id: string;
    applicationId: string;
    dueDate: string;
    notes: string;
    daysOverdue: number;
  }>;
  completedFollowUpsCount: number;
  openFollowUpsCount: number;
  definitions: string[];
};

const dateOnly = (iso: string): string => iso.slice(0, 10);

const daysBetween = (from: string, to: string): number => {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
};

export const computeAnalytics = (state: AppState, now: string): Analytics => {
  const byStage = STAGES.reduce((acc, stage) => {
    acc[stage] = 0;
    return acc;
  }, {} as Record<Stage, number>);

  for (const app of state.applications) byStage[app.stage] += 1;

  const dateCounts = new Map<string, number>();
  for (const app of state.applications) {
    if (app.appliedDate) {
      dateCounts.set(app.appliedDate, (dateCounts.get(app.appliedDate) ?? 0) + 1);
    }
  }
  const recordedApplicationsByDate = Array.from(dateCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const today = dateOnly(now);
  const overdueFollowUps = state.followUps
    .filter((f) => f.completedAt === null && f.dueDate < today)
    .map((f) => ({
      id: f.id,
      applicationId: f.applicationId,
      dueDate: f.dueDate,
      notes: f.notes,
      daysOverdue: daysBetween(f.dueDate, today),
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const completedFollowUpsCount = state.followUps.filter(
    (f) => f.completedAt !== null,
  ).length;

  const definitions = [
    "'Applied' stage counts records you moved to Applied. It is user-reported and unverified by any employer.",
    "Applied date is the date you recorded as submitted; it is not proof of employer receipt or review.",
    "Verified employer confirmations are not tracked in this demo; no submitted-vs-verified ratio is computed.",
    "Current stage counts are snapshots of where each record sits now; they are not transition or conversion rates.",
    "Recorded stage history contains only explicit stage changes you saved, not inferred activity.",
    "Overdue follow-ups use due date versus today's local calendar date in the browser.",
  ];

  return {
    totalCount: state.applications.length,
    byStage,
    recordedApplicationsByDate,
    overdueFollowUps,
    completedFollowUpsCount,
    openFollowUpsCount: state.followUps.length - completedFollowUpsCount,
    definitions,
  };
};