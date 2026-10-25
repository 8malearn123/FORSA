"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Globe, LoaderCircle, Mail, MessageCircleHeart, Phone, ShieldCheck } from "lucide-react";

import { revealContact, type RevealResult } from "@/app/actions";
import type { ContactChannel } from "@/lib/contact";
import type { ListingKind } from "@/lib/types";

import { Sparks } from "./brand";
import { cn } from "./cn";
import { Instagram, WhatsApp } from "./icons";
import { buttonClass } from "./ui";

const CHANNEL_ICON = {
  whatsapp: WhatsApp,
  phone: Phone,
  email: Mail,
  instagram: Instagram,
  website: Globe,
} as const;

/** حالات يبقى فيها زر الإظهار ظاهراً ليحاول الزائر مرة أخرى */
const RETRY_MESSAGE = {
  missing: "تعذّر العثور على هذا الإعلان.",
  limited: "طلبت وسائل تواصل كثيرة خلال وقت قصير. حاول بعد قليل.",
  failed: "تعذّر الاتصال. تأكد من الإنترنت ثم حاول مرة أخرى.",
} as const;
const RETRY = new Set<string>(Object.keys(RETRY_MESSAGE));

const CHANNEL_NAME: Record<ContactChannel["kind"], string> = {
  whatsapp: "واتساب",
  phone: "اتصال",
  email: "بريد",
  instagram: "انستقرام",
  website: "رابط",
};

export function ContactPanel({
  kind,
  id,
  name,
  available,
  cta = "تواصل الآن",
  className,
}: {
  kind: ListingKind;
  id: string;
  name: string;
  /** أنواع وسائل التواصل المتاحة (بدون البيانات نفسها) */
  available: ContactChannel["kind"][];
  cta?: string;
  className?: string;
}) {
  const [result, setResult] = useState<RevealResult | { status: "failed" } | null>(null);
  const [pending, startTransition] = useTransition();
  const revealed = useRef<HTMLDivElement>(null);

  const reveal = () =>
    startTransition(async () => {
      let next: RevealResult | { status: "failed" };
      try {
        next = await revealContact(kind, id);
      } catch {
        next = { status: "failed" };
      }
      startTransition(() => setResult(next));
    });

  // زر الإظهار يختفي بعد الضغط؛ ننقل التركيز لأول وسيلة تواصل (أو للرسالة) حتى لا يضيع
  const shown = result && !RETRY.has(result.status);
  useEffect(() => {
    if (!shown) return;
    const target = revealed.current?.querySelector<HTMLElement>("a") ?? revealed.current;
    target?.focus();
  }, [shown]);

  const retryMessage = result ? RETRY_MESSAGE[result.status as keyof typeof RETRY_MESSAGE] : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] rounded-ee-[8px] bg-white p-6 shadow-lift ring-1 ring-ink-100",
        className,
      )}
    >
      <Sparks className="absolute top-5 left-5 w-9" />
      <p className="text-sm font-semibold text-sage-700">تواصل مباشر، بلا وسيط</p>
      <h2 className="mt-1 font-display text-xl font-extrabold text-ink-900">
        <span dir="auto">{name}</span>
      </h2>

      {!shown ? (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {available.map((k) => {
              const Icon = CHANNEL_ICON[k];
              return (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-2.5 py-1 text-xs text-ink-700"
                >
                  <Icon className="size-3.5" />
                  {CHANNEL_NAME[k]}
                </span>
              );
            })}
          </div>
          <button
            type="button"
            onClick={reveal}
            disabled={pending}
            className={cn(buttonClass({ variant: "sage", size: "lg" }), "mt-5 w-full")}
          >
            {pending ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <MessageCircleHeart className="size-5" />
            )}
            {cta}
          </button>
          {retryMessage ? (
            <p role="alert" className="mt-3 text-sm text-clay-700">
              {retryMessage}
            </p>
          ) : null}
        </>
      ) : null}

      <div ref={revealed} tabIndex={-1} className="outline-none">
        {result?.status === "ok" ? (
          <ul className="mt-5 flex flex-col gap-2">
            {result.channels.map((c, i) => {
              const Icon = CHANNEL_ICON[c.kind];
              return (
                <li key={c.kind}>
                  <a
                    href={c.href}
                    target={c.kind === "phone" || c.kind === "email" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className={cn(
                      buttonClass({ variant: i === 0 ? "sage" : "secondary", size: "lg" }),
                      "w-full justify-between",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-5" />
                      {c.label}
                    </span>
                    {"display" in c ? (
                      <span dir="ltr" className="text-sm font-medium opacity-80">
                        {c.display}
                      </span>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}

        {result?.status === "closed" ? (
          <p className="mt-5 rounded-2xl bg-sand-100 p-4 text-sm text-ink-700">
            اكتملت هذه الفرصة وأغلقها صاحبها. تصفّح فرصاً أخرى مشابهة بالأسفل.
          </p>
        ) : null}
      </div>

      <p className="mt-5 flex gap-2 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-500">
        <ShieldCheck className="size-4 shrink-0 text-sage-600" />
        «فرصة» لا تتدخل في الاتفاق ولا الدفع. تأكد من التفاصيل قبل أي التزام، ولا تحوّل مبالغ قبل الاتفاق
        الواضح.
      </p>
    </div>
  );
}
