"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertSameOrigin } from "@/lib/security/same-origin";
import { getVerifiedUser } from "@/lib/supabase/server";
import { validateApplicationInput } from "@/domain/validation";
import { STAGES, type Stage } from "@/domain/types";

export type WorkspaceFormState = {
  error?: string;
  message?: string;
};

const readText = (formData: FormData, key: string): string =>
  String(formData.get(key) ?? "").trim();

const stageValue = (value: string): Stage | null =>
  STAGES.includes(value as Stage) ? (value as Stage) : null;

export const createApplicationAction = async (
  _prev: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> => {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Invalid request origin." };
  }

  const { user, error: authError, client } = await getVerifiedUser();
  if (authError || !user || !client) return { error: "You must be signed in." };

  const input = {
    company: readText(formData, "company"),
    role: readText(formData, "role"),
    postingUrl: readText(formData, "postingUrl") || null,
    stage: (readText(formData, "stage") || "saved") as Stage,
    appliedDate: readText(formData, "appliedDate") || null,
    notes: readText(formData, "notes"),
  };
  if (!stageValue(input.stage)) return { error: "Invalid stage." };

  const errors = validateApplicationInput(input);
  if (Object.keys(errors).length > 0) {
    return { error: Object.values(errors)[0] };
  }

  const { error } = await client.from("applications").insert({
    owner_id: user.id,
    company: input.company,
    role: input.role,
    stage: input.stage,
    notes: input.notes,
    posting_url: input.postingUrl,
    applied_date: input.appliedDate,
  });

  if (error) return { error: "Unable to save application." };
  revalidatePath("/workspace");
  return { message: "Application created." };
};

export const updateApplicationAction = async (
  _prev: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> => {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Invalid request origin." };
  }

  const id = readText(formData, "id");
  if (!id) return { error: "Application id is required." };

  const { user, error: authError, client } = await getVerifiedUser();
  if (authError || !user || !client) return { error: "You must be signed in." };

  const input = {
    company: readText(formData, "company"),
    role: readText(formData, "role"),
    postingUrl: readText(formData, "postingUrl") || null,
    stage: (readText(formData, "stage") || "saved") as Stage,
    appliedDate: readText(formData, "appliedDate") || null,
    notes: readText(formData, "notes"),
  };
  if (!stageValue(input.stage)) return { error: "Invalid stage." };

  const errors = validateApplicationInput(input);
  if (Object.keys(errors).length > 0) {
    return { error: Object.values(errors)[0] };
  }

  const { data, error } = await client
    .from("applications")
    .update({
      company: input.company,
      role: input.role,
      stage: input.stage,
      notes: input.notes,
      posting_url: input.postingUrl,
      applied_date: input.appliedDate,
    })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) {
    return { error: "Unable to update application." };
  }

  revalidatePath("/workspace");
  return { message: "Application updated." };
};

export const deleteApplicationAction = async (
  formData: FormData,
): Promise<WorkspaceFormState> => {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Invalid request origin." };
  }

  const id = readText(formData, "id");
  const { user, error: authError, client } = await getVerifiedUser();
  if (authError || !user || !client || !id) return { error: "You must be signed in." };

  const { data, error } = await client
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) {
    return { error: "Unable to delete application." };
  }

  revalidatePath("/workspace");
  return { message: "Application deleted." };
};

export const signOutAction = async (): Promise<WorkspaceFormState> => {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Invalid request origin." };
  }

  const { client, error: authError } = await getVerifiedUser();
  if (authError || !client) return { error: "Unable to sign out." };

  const { error } = await client.auth.signOut();
  if (error) return { error: "Unable to sign out." };

  redirect("/login");
};