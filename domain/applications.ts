import {
  Application,
  ApplicationDraft,
  ApplicationPatch,
  AppState,
  CreateContext,
  Stage,
  UpdateContext,
} from "./types";
import { validateApplicationInput, hasErrors } from "./validation";
import { StageEvent } from "./types";

const trimOrNull = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export type CreateApplicationSuccess = {
  ok: true;
  state: AppState;
  application: Application;
};

export type CreateApplicationFailure = {
  ok: false;
  errors: Record<string, string>;
};

export type CreateApplicationResult = CreateApplicationSuccess | CreateApplicationFailure;

export const createApplication = (
  state: AppState,
  draft: ApplicationDraft,
  ctx: CreateContext,
): CreateApplicationResult => {
  const errors = validateApplicationInput(draft);
  if (hasErrors(errors)) return { ok: false, errors };

  const now = ctx.now;
  const application: Application = {
    id: ctx.id,
    company: draft.company.trim(),
    role: draft.role.trim(),
    postingUrl: trimOrNull(draft.postingUrl),
    stage: draft.stage,
    appliedDate: draft.appliedDate ? draft.appliedDate : null,
    notes: (draft.notes ?? "").trim(),
    createdAt: now,
    updatedAt: now,
  };

  return {
    ok: true,
    state: {
      ...state,
      applications: [...state.applications, application],
    },
    application,
  };
};

export type UpdateApplicationSuccess = {
  ok: true;
  state: AppState;
  application: Application;
  stageEvent: StageEvent | null;
};

export type UpdateApplicationFailure = {
  ok: false;
  errors: Record<string, string>;
};

export type UpdateApplicationResult = UpdateApplicationSuccess | UpdateApplicationFailure;

export const updateApplication = (
  state: AppState,
  id: string,
  patch: ApplicationPatch,
  ctx: UpdateContext,
): UpdateApplicationResult => {
  const index = state.applications.findIndex((a) => a.id === id);
  if (index === -1) {
    return { ok: false, errors: { id: "Application not found." } };
  }

  const current = state.applications[index];
  const merged: ApplicationDraft = {
    company: patch.company ?? current.company,
    role: patch.role ?? current.role,
    postingUrl: patch.postingUrl === undefined ? current.postingUrl : patch.postingUrl,
    stage: patch.stage ?? current.stage,
    appliedDate: patch.appliedDate === undefined ? current.appliedDate : patch.appliedDate,
    notes: patch.notes === undefined ? current.notes : patch.notes,
  };

  const errors = validateApplicationInput(merged);
  if (hasErrors(errors)) return { ok: false, errors };

  const now = ctx.now;
  const stageChanged = merged.stage !== current.stage;

  const updated: Application = {
    ...current,
    company: merged.company.trim(),
    role: merged.role.trim(),
    postingUrl: trimOrNull(merged.postingUrl),
    stage: merged.stage,
    appliedDate: merged.appliedDate ? merged.appliedDate : null,
    notes: (merged.notes ?? "").trim(),
    updatedAt: now,
  };

  let stageEvent: StageEvent | null = null;
  const newStageEvents = [...state.stageEvents];
  if (stageChanged) {
    stageEvent = {
      id: `${id}-evt-${state.stageEvents.length + 1}`,
      applicationId: id,
      previousStage: current.stage,
      newStage: merged.stage,
      occurredAt: now,
      recordedAt: now,
    };
    newStageEvents.push(stageEvent);
  }

  const newApplications = [...state.applications];
  newApplications[index] = updated;

  return {
    ok: true,
    state: {
      ...state,
      applications: newApplications,
      stageEvents: newStageEvents,
    },
    application: updated,
    stageEvent,
  };
};

export const deleteApplication = (state: AppState, id: string): AppState => {
  return {
    ...state,
    applications: state.applications.filter((a) => a.id !== id),
    followUps: state.followUps.filter((f) => f.applicationId !== id),
    stageEvents: state.stageEvents.filter((e) => e.applicationId !== id),
  };
};

export const filterApplications = (
  applications: Application[],
  filters: { query: string; stage: Stage | "all" },
): Application[] => {
  const query = filters.query.trim().toLowerCase();
  const result = applications.filter((a) => {
    if (filters.stage !== "all" && a.stage !== filters.stage) return false;
    if (query) {
      const haystack = [a.company, a.role, a.notes, a.postingUrl ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  return result.slice().sort((a, b) => {
    if (a.updatedAt !== b.updatedAt) return b.updatedAt.localeCompare(a.updatedAt);
    return b.createdAt.localeCompare(a.createdAt);
  });
};