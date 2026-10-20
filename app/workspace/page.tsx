import Link from "next/link";
import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { WorkspaceApplications } from "./WorkspaceApplications";
import { SignOutForm } from "./SignOutForm";
import { STAGES } from "@/domain/types";

export const dynamic = "force-dynamic";

type DbApplication = {
  id: string;
  company: string;
  role: string;
  stage: string;
  notes: string | null;
  posting_url: string | null;
  applied_date: string | null;
};

export default async function WorkspacePage() {
  const configured = getSupabasePublicConfig() !== null;
  if (!configured) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Secure workspace</h1>
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            Supabase is not configured. Add the public variables from
            <code className="mx-1">.env.example</code> before using this workspace.
          </div>
          <p className="mt-6 text-sm">
            <Link className="text-teal-700 underline" href="/">Return to demo</Link>
          </p>
        </div>
      </main>
    );
  }

  const { user, error, client } = await getVerifiedUser({ readOnly: true });
  if (error || !user || !client) redirect("/login");

  const { data, error: queryError } = await client
    .from("applications")
    .select("id, company, role, stage, notes, posting_url, applied_date")
    .order("updated_at", { ascending: false });

  if (queryError) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Secure workspace</h1>
          <div className="mt-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-950">
            Unable to load applications right now.
          </div>
          <div className="mt-6">
            <SignOutForm />
          </div>
        </div>
      </main>
    );
  }

  const applications = (data as DbApplication[] | null) ?? [];

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold">Secure workspace</h1>
            <p className="text-sm text-slate-600">
              Server-verified account. Private application records are isolated by Row Level Security.
            </p>
          </div>
          <SignOutForm />
        </div>
        <WorkspaceApplications
          applications={applications}
          stages={STAGES}
        />
        <p className="text-sm">
          <Link className="text-teal-700 underline" href="/">Return to credential-free demo</Link>
        </p>
      </div>
    </main>
  );
}