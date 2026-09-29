"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";

import { inputClass } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

import { adminLogin, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(adminLogin, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-semibold text-ink-900">مفتاح الإشراف</span>
        <input
          type="password"
          name="key"
          required
          autoComplete="current-password"
          dir="ltr"
          className={`${inputClass} h-12`}
        />
      </label>
      {state.error ? <p className="text-sm font-medium text-clay-700">{state.error}</p> : null}
      <SubmitButton variant="dark" pending={pending} pendingLabel="جارِ الدخول…">
        <KeyRound className="size-4" />
        دخول
      </SubmitButton>
    </form>
  );
}
