"use client";

import { useActionState } from "react";
import { signInAction, signUpAction, type AuthFormState } from "./actions";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [signInState, signInFormAction] = useActionState(signInAction, initialState);
  const [signUpState, signUpFormAction] = useActionState(signUpAction, initialState);

  return (
    <div className="mt-6 grid gap-6">
      <section>
        <h2 className="text-sm font-semibold text-slate-800">Sign in</h2>
        <form action={signInFormAction} className="mt-3 grid gap-3" aria-label="Sign in">
          <input name="email" type="email" required placeholder="Email" aria-label="Email"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="password" type="password" required placeholder="Password" aria-label="Password"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {signInState.error && <p className="text-sm text-rose-600">{signInState.error}</p>}
          {signInState.message && <p className="text-sm text-teal-700">{signInState.message}</p>}
          <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white">
            Sign in
          </button>
        </form>
      </section>
      <section>
        <h2 className="text-sm font-semibold text-slate-800">Create account</h2>
        <form action={signUpFormAction} className="mt-3 grid gap-3" aria-label="Create account">
          <input name="email" type="email" required placeholder="Email" aria-label="Email"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="password" type="password" required placeholder="Password" aria-label="Password" minLength={8}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {signUpState.error && <p className="text-sm text-rose-600">{signUpState.error}</p>}
          {signUpState.message && <p className="text-sm text-teal-700">{signUpState.message}</p>}
          <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Sign up
          </button>
        </form>
      </section>
    </div>
  );
}