import Link from "next/link";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }> | { error?: string | string[] };
}) {
  const resolved = (await Promise.resolve(searchParams ?? {})) as { error?: string | string[] };
  const authError = Array.isArray(resolved.error) ? resolved.error[0] : resolved.error;
  const showAuthError = authError === "auth";
  const configured = getSupabasePublicConfig() !== null;

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Secure workspace</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to a private application tracker backed by Supabase.
        </p>
        {showAuthError && (
          <div className="mt-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-950">
            Unable to complete authentication. Try again.
          </div>
        )}
        {configured ? (
          <LoginForm />
        ) : (
          <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            Supabase is not configured. Add the public variables from
            <code className="mx-1">.env.example</code>
            before using this workspace.
          </div>
        )}
        <p className="mt-6 text-sm">
          <Link className="text-teal-700 underline" href="/">
            Return to the credential-free demo
          </Link>
        </p>
      </div>
    </main>
  );
}