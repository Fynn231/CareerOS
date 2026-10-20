import {
  AppState,
  ApplicationDraft,
  ApplicationPatch,
  createEmptyState,
} from "../domain/types";
import { createApplication } from "../domain/applications";
import { createFollowUp, completeFollowUp, reopenFollowUp, deleteFollowUp } from "../domain/followups";
import { updateApplication, deleteApplication } from "../domain/applications";

export type Action =
  | { type: "application/add"; draft: ApplicationDraft; meta: { id: string; now: string } }
  | { type: "application/update"; id: string; patch: ApplicationPatch; meta: { now: string } }
  | { type: "application/delete"; id: string }
  | { type: "followup/add"; draft: { applicationId: string; dueDate: string; notes?: string }; meta: { id: string; now: string } }
  | { type: "followup/complete"; id: string; now: string }
  | { type: "followup/reopen"; id: string }
  | { type: "followup/delete"; id: string };

export const trackerReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "application/add": {
      const result = createApplication(state, action.draft, {
        now: action.meta.now,
        id: action.meta.id,
      });
      return result.ok ? result.state : state;
    }
    case "application/update": {
      const result = updateApplication(state, action.id, action.patch, {
        now: action.meta.now,
      });
      return result.ok ? result.state : state;
    }
    case "application/delete":
      return deleteApplication(state, action.id);
    case "followup/add": {
      const result = createFollowUp(state, action.draft, {
        now: action.meta.now,
        id: action.meta.id,
      });
      return result.ok ? result.state : state;
    }
    case "followup/complete":
      return completeFollowUp(state, action.id, action.now);
    case "followup/reopen":
      return reopenFollowUp(state, action.id);
    case "followup/delete":
      return deleteFollowUp(state, action.id);
    default:
      return state;
  }
};

export { createEmptyState };