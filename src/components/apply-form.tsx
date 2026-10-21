"use client";

import { useActionState } from "react";
import { CircleAlert, Send } from "lucide-react";

import { applyToOpportunity, type ApplyState } from "@/app/account/actions";

import { cn } from "./cn";
import { inputClass } from "./form";
import { SubmitButton } from "./submit-button";

/** ملف يستطيع التقديم به، مع وسيلة التواصل التي سيراها صاحب الفرصة */
export type ProfileOption = {
  value: string;
  title: string;
  detail: string;
  contact: { label: string; value?: string };
};

export function ApplyForm({
  opportunityId,
  profiles,
  cta,
  placeholder,
}: {
  opportunityId: string;
  profiles: ProfileOption[];
  cta: string;
  placeholder: string;
}) {
  const [state, action] = useActionState<ApplyState, FormData>(applyToOpportunity, {});
  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="opportunity" value={opportunityId} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-ink-900">
          {profiles.length > 1 ? "اختر الملف الذي تقدّم به" : "تقدّم بملفك"}
        </legend>
        {profiles.map((p, i) => (
          <label
            key={p.value}
            className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sand-50 p-3.5 ring-1 ring-ink-200 transition ring-inset has-[:checked]:bg-sage-50 has-[:checked]:ring-2 has-[:checked]:ring-sage-500"
          >
            <input
              type="radio"
              name="profile"
              value={p.value}
              defaultChecked={i === 0}
              className="mt-1 size-4 shrink-0 accent-sage-700"
            />
            <span className="min-w-0">
              <span dir="auto" className="block font-semibold text-ink-900">
                {p.title}
              </span>
              <span className="block truncate text-xs text-ink-500">{p.detail}</span>
              <span className="mt-1 block text-xs text-sage-800">
                يراه صاحب الفرصة: {p.contact.label}{" "}
                {p.contact.value ? (
                  <span dir="ltr" className="whitespace-nowrap">
                    {p.contact.value}
                  </span>
                ) : null}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink-900">
          رسالة قصيرة <span className="font-normal text-ink-500">(اختياري)</span>
        </span>
        <textarea
          name="message"
          rows={3}
          maxLength={500}
          placeholder={placeholder}
          className={cn(inputClass, "min-h-24 py-3 leading-relaxed")}
        />
      </label>
      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-2xl bg-clay-50 p-3.5 text-sm font-medium text-clay-900 ring-1 ring-clay-200"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-clay-600" />
          {state.error}
        </p>
      ) : null}
      <SubmitButton variant="sage" size="lg" className="w-full" pendingLabel="جارِ التقديم…">
        <Send className="size-5" />
        {cta}
      </SubmitButton>
    </form>
  );
}
