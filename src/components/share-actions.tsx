"use client";

import { startTransition, useActionState, useId, useRef, useState } from "react";
import { Check, Flag, Link2, Share2, X } from "lucide-react";

import { reportListing, type ReportState } from "@/app/actions";
import type { ListingKind } from "@/lib/types";

import { cn } from "./cn";
import { WhatsApp } from "./icons";
import { SubmitButton } from "./submit-button";

const absolute = (path?: string) =>
  typeof window === "undefined"
    ? ""
    : path
      ? new URL(path, window.location.origin).href
      : window.location.href.split("?")[0];

/** مشاركة الإعلان: واتساب أولاً لأنه طريقة أهل جازان في تمرير الفرص */
export function ShareActions({ title, prompt, path }: { title: string; prompt?: string; path?: string }) {
  const [copied, setCopied] = useState(false);

  const shareNative = async () => {
    const url = absolute(path);
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // المستخدم ألغى المشاركة
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = `${prompt ?? "شف هالفرصة على منصة فرصة"}: ${title}\n${absolute(path)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={shareWhatsApp}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-sage-50 px-3.5 text-sm font-semibold text-sage-800 ring-1 ring-sage-200 transition-colors ring-inset hover:bg-sage-100"
      >
        <WhatsApp className="size-4" />
        شارك في واتساب
      </button>
      <button
        type="button"
        onClick={shareNative}
        className="inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 transition-colors ring-inset hover:bg-white"
      >
        {copied ? <Check className="size-4 text-sage-600" /> : <Share2 className="size-4" />}
        {copied ? "تم نسخ الرابط" : "مشاركة"}
      </button>
    </div>
  );
}

export function CopyLink({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-ink-800 ring-1 ring-ink-200 ring-inset hover:bg-sand-50",
        className,
      )}
    >
      {copied ? <Check className="size-4 text-sage-600" /> : <Link2 className="size-4" />}
      {copied ? "تم النسخ" : "نسخ الرابط"}
    </button>
  );
}

const REASONS = [
  { value: "wrong-info", label: "معلومات غير صحيحة" },
  { value: "inappropriate", label: "محتوى غير لائق" },
  { value: "scam", label: "احتيال أو طلب مبالغ مقدماً" },
  { value: "expired", label: "الإعلان منتهٍ أو مكرر" },
  { value: "other", label: "سبب آخر" },
];

export function ReportButton({ kind, id }: { kind: ListingKind; id: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, action, pending] = useActionState<ReportState, FormData>(reportListing, { status: "idle" });

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 underline-offset-4 hover:text-clay-700 hover:underline"
      >
        <Flag className="size-4" />
        إبلاغ عن هذا الإعلان
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,440px)] rounded-[28px] rounded-ee-[8px] bg-sand-50 p-0 text-ink-900 shadow-lift backdrop:bg-ink-950/40"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="font-display text-xl font-extrabold">
              إبلاغ عن الإعلان
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="grid size-9 place-items-center rounded-xl ring-1 ring-ink-200 ring-inset"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>
          {state.status === "done" ? (
            <div className="mt-6 rounded-2xl bg-sage-50 p-5 text-sage-900 ring-1 ring-sage-200">
              <p className="font-semibold">شكراً لك، وصلنا بلاغك.</p>
              <p className="mt-1 text-sm">نراجع البلاغات يدوياً حتى تبقى «فرصة» مساحة آمنة للجميع.</p>
            </div>
          ) : (
            <form
              action={action}
              onSubmit={(event) => {
                // إرسال يدوي حتى لا تُمسح التفاصيل المكتوبة إن رجع خطأ
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                startTransition(() => action(data));
              }}
              className="mt-5"
            >
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="id" value={id} />
              <fieldset>
                <legend className="text-sm text-ink-600">ما المشكلة؟</legend>
                <div className="mt-3 flex flex-col gap-2">
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-ink-100 has-[:checked]:ring-2 has-[:checked]:ring-clay-500"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        required
                        className="accent-clay-600"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="mt-4 block">
                <span className="text-sm text-ink-600">تفاصيل إضافية (اختياري)</span>
                <textarea
                  name="note"
                  rows={3}
                  maxLength={500}
                  className="mt-2 w-full rounded-2xl bg-white px-4 py-3 ring-1 ring-ink-200 outline-none focus:ring-2 focus:ring-clay-500"
                />
              </label>
              {state.status === "error" ? (
                <p role="alert" className="mt-3 text-sm text-clay-700">
                  {state.message}
                </p>
              ) : null}
              <SubmitButton
                variant="dark"
                className="mt-5 w-full"
                pending={pending}
                pendingLabel="جارِ الإرسال…"
              >
                إرسال البلاغ
              </SubmitButton>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
