"use client";

import { useActionState } from "react";
import { Check, Plus } from "lucide-react";

import { inputClass } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";
import type { Partner } from "@/lib/store";

import { savePartner, type PartnerState } from "./actions";

/** نموذج إضافة جهة، أو تعديلها إن مُرّرت */
export function PartnerForm({ partner }: { partner?: Partner }) {
  const [state, action, pending] = useActionState<PartnerState, FormData>(savePartner, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {partner ? <input type="hidden" name="id" value={partner.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="font-semibold text-ink-900">الاسم</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            defaultValue={partner?.name}
            placeholder="اسم الجهة أو الشخص"
            className={`${inputClass} h-12`}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold text-ink-900">
            الصفة <span className="text-sm font-normal text-ink-500">(اختياري)</span>
          </span>
          <input
            name="role"
            maxLength={40}
            defaultValue={partner?.role}
            placeholder="الراعي الرسمي، التصميم"
            className={`${inputClass} h-12`}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-semibold text-ink-900">
            الموقع <span className="text-sm font-normal text-ink-500">(اختياري)</span>
          </span>
          <input
            name="url"
            dir="ltr"
            maxLength={200}
            defaultValue={partner?.url}
            placeholder="example.com"
            className={`${inputClass} h-12`}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-semibold text-ink-900">
            {partner?.logo ? "استبدال الشعار" : "الشعار"}{" "}
            <span className="text-sm font-normal text-ink-500">(PNG شفاف أو SVG، حتى ٦ ميجابايت)</span>
          </span>
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="text-sm text-ink-700 file:me-3 file:rounded-full file:border-0 file:bg-sand-100 file:px-4 file:py-2 file:font-semibold file:text-ink-900"
          />
        </label>
        {partner?.logo ? (
          <label className="flex items-center gap-2 pb-2 text-sm text-ink-700">
            <input type="checkbox" name="removeLogo" className="size-4 accent-clay-600" />
            إزالة الشعار
          </label>
        ) : null}
        <SubmitButton
          size="sm"
          variant="dark"
          pending={pending}
          pendingLabel="جارِ الحفظ…"
          className="ms-auto"
        >
          {partner ? <Check className="size-4" /> : <Plus className="size-4" />}
          {partner ? "احفظ" : "أضف"}
        </SubmitButton>
      </div>
      {state.error ? <p className="text-sm font-medium text-clay-700">{state.error}</p> : null}
      {state.ok && !pending ? <p className="text-sm font-medium text-sage-700">تم الحفظ.</p> : null}
    </form>
  );
}
