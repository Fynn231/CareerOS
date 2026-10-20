export const STAGES = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type Stage = (typeof STAGES)[number];

export const isStage = (value: unknown): value is Stage =>
  typeof value === "string" && (STAGES as readonly string[]).includes(value);

export type ValidationErrors = Record<string, string>;

export type Application = {
  id: string;
  company: string;
  role: string;
  postingUrl: string | null;
  stage: Stage;
  appliedDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationDraft = {
  company: string;
  role: string;
  postingUrl?: string | null;
  stage: Stage;
  appliedDate?: string | null;
  notes?: string;
};

export type ApplicationPatch = Partial<ApplicationDraft>;

export type StageEvent = {
  id: string;
  applicationId: string;
  previousStage: Stage | null;
  newStage: Stage;
  occurredAt: string;
  recordedAt: string;
};

export type FollowUp = {
  id: string;
  applicationId: string;
  dueDate: string;
  completedAt: string | null;
  notes: string;
  createdAt: string;
};

export type FollowUpDraft = {
  applicationId: string;
  dueDate: string;
  notes?: string;
};

export type ApplicationFilters = {
  query: string;
  stage: Stage | "all";
};

export type AppState = {
  applications: Application[];
  followUps: FollowUp[];
  stageEvents: StageEvent[];
};

export const createEmptyState = (): AppState => ({
  applications: [],
  followUps: [],
  stageEvents: [],
});

export type CreateContext = {
  now: string;
  id: string;
};

export type UpdateContext = {
  now: string;
};

export type FollowUpContext = {
  now: string;
  id: string;
};