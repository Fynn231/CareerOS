import { AppState, FollowUp, FollowUpDraft, FollowUpContext } from "./types";
import { validateFollowUpInput, hasErrors } from "./validation";

export type CreateFollowUpResult =
  | { ok: true; state: AppState; followUp: FollowUp }
  | { ok: false; errors: Record<string, string> };

export const createFollowUp = (
  state: AppState,
  draft: FollowUpDraft,
  ctx: FollowUpContext,
): CreateFollowUpResult => {
  const errors = validateFollowUpInput(draft);
  if (hasErrors(errors)) return { ok: false, errors };

  const exists = state.applications.some((a) => a.id === draft.applicationId);
  if (!exists) {
    return { ok: false, errors: { applicationId: "Application not found." } };
  }

  const followUp: FollowUp = {
    id: ctx.id,
    applicationId: draft.applicationId,
    dueDate: draft.dueDate,
    completedAt: null,
    notes: (draft.notes ?? "").trim(),
    createdAt: ctx.now,
  };

  return {
    ok: true,
    state: { ...state, followUps: [...state.followUps, followUp] },
    followUp,
  };
};

export const completeFollowUp = (
  state: AppState,
  id: string,
  now: string,
): AppState => {
  return {
    ...state,
    followUps: state.followUps.map((f) =>
      f.id === id && f.completedAt === null
        ? { ...f, completedAt: now }
        : f,
    ),
  };
};

export const reopenFollowUp = (state: AppState, id: string): AppState => {
  return {
    ...state,
    followUps: state.followUps.map((f) =>
      f.id === id ? { ...f, completedAt: null } : f,
    ),
  };
};

export const deleteFollowUp = (state: AppState, id: string): AppState => {
  return {
    ...state,
    followUps: state.followUps.filter((f) => f.id !== id),
  };
};