import { isStage, Stage, STAGES } from "./types";

export const LIMITS = {
  company: 120,
  role: 120,
  notes: 2000,
  url: 2048,
  followUpNotes: 1000,
} as const;

export const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
};

export const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export type ApplicationInput = {
  company: string;
  role: string;
  postingUrl?: string | null;
  stage: Stage;
  appliedDate?: string | null;
  notes?: string;
};

export const validateApplicationInput = (
  input: ApplicationInput,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const company = (input.company ?? "").trim();
  const role = (input.role ?? "").trim();
  if (!company) errors.company = "Company is required.";
  else if (company.length > LIMITS.company)
    errors.company = `Company must be ${LIMITS.company} characters or fewer.`;

  if (!role) errors.role = "Role is required.";
  else if (role.length > LIMITS.role)
    errors.role = `Role must be ${LIMITS.role} characters or fewer.`;

  if (!isStage(input.stage)) {
    errors.stage = `Stage must be one of: ${STAGES.join(", ")}.`;
  }

  const url = input.postingUrl;
  if (url != null && url !== "") {
    const trimmed = url.trim();
    if (trimmed.length > LIMITS.url) errors.postingUrl = "URL is too long.";
    else if (!isHttpUrl(trimmed)) errors.postingUrl = "URL must use http or https.";
    else {
      const parsed = new URL(trimmed);
      if (parsed.username || parsed.password) errors.postingUrl = "URL must not include credentials.";
    }
  }

  const date = input.appliedDate;
  if (date != null && date !== "") {
    if (!isValidDate(date)) errors.appliedDate = "Applied date must be YYYY-MM-DD.";
  }

  const notes = input.notes ?? "";
  if (notes.length > LIMITS.notes)
    errors.notes = `Notes must be ${LIMITS.notes} characters or fewer.`;

  return errors;
};

export const validateFollowUpInput = (input: {
  applicationId: string;
  dueDate: string;
  notes?: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!input.applicationId) errors.applicationId = "Application is required.";
  if (!input.dueDate || !isValidDate(input.dueDate))
    errors.dueDate = "Due date must be YYYY-MM-DD.";
  const notes = input.notes ?? "";
  if (notes.length > LIMITS.followUpNotes)
    errors.notes = `Notes must be ${LIMITS.followUpNotes} characters or fewer.`;
  return errors;
};

export const hasErrors = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length > 0;