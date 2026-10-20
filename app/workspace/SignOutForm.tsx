"use client";

import { useActionState } from "react";
import { signOutAction } from "./actions";

const emptyState = { error: undefined, message: undefined } as const;

export function SignOutForm() {
  const [state, action] = useActionState(() => signOutAction(), emptyState);
  return (
    <form action={action} className="space-y-2">
      <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
        Sign out
      </button>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
    </form>
  );
}