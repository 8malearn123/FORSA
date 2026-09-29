"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Check, Smartphone, X } from "lucide-react";

import { lookupMyListings, type MyListing } from "@/app/actions";
import type { ListingKind } from "@/lib/types";

import { Nuqta } from "./brand";
import { Badge } from "./ui";

/**
 * روابط الإدارة تُحفظ في هذا المتصفح فقط، وبطلب صريح من صاحب الإعلان
 * (قد يكون الجهاز مشتركاً بين أفراد العائلة). لا تُرسل لأي مكان إلا للتحقق منها عند العرض.
 */
const KEY = "forsa:my-listings";
const EVENT = "forsa:my-listings-change";

type Saved = { token: string; savedAt: number };

function readSaved(): Saved[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v?.token === "string") : [];
  } catch {
    return [];
  }
}

function writeSaved(items: Saved[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 20)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // التخزين غير متاح (وضع التصفح الخاص مثلاً) — لا بأس
  }
}

const forget = (token: string) => writeSaved(readSaved().filter((s) => s.token !== token));

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** زر في صفحة الإدارة: يحفظ الرابط على هذا الجهاز أو يزيله */
export function SaveOnDevice({ token }: { token: string }) {
  const saved = useSyncExternalStore(
    subscribe,
    () => readSaved().some((s) => s.token === token),
    () => false,
  );
  if (saved) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-sage-800">
          <Check className="size-4" />
          محفوظ على هذا الجهاز
        </span>
        <button
          type="button"
          onClick={() => forget(token)}
          className="text-ink-500 underline-offset-4 hover:text-clay-700 hover:underline"
        >
          إزالة
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() =>
        writeSaved([{ token, savedAt: Date.now() }, ...readSaved().filter((s) => s.token !== token)])
      }
      className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-white px-3.5 text-sm font-semibold text-ink-800 ring-1 ring-ink-200 ring-inset hover:bg-sand-50"
    >
      <Smartphone className="size-4" />
      احفظه على هذا الجهاز
    </button>
  );
}

/** يوضع داخل نموذج الحذف: يزيل الرابط من هذا الجهاز عند تأكيد الحذف */
export function ForgetOnSubmit({ token }: { token: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = marker.current?.closest("form");
    const onSubmit = () => forget(token);
    form?.addEventListener("submit", onSubmit);
    return () => form?.removeEventListener("submit", onSubmit);
  }, [token]);
  return <span ref={marker} hidden />;
}

const KIND_NAME: Record<ListingKind, string> = {
  talent: "ملف موهبة",
  family: "صفحة أسرة منتجة",
  opportunity: "فرصة",
};

/**
 * يعرض الإعلانات المحفوظة على هذا الجهاز. لا نحذف أي رابط تلقائياً:
 * ما لم يعد متاحاً يظهر كذلك، وصاحبه يقرر إزالته.
 */
export function MyListings() {
  const [state, setState] = useState<{ found: MyListing[]; missing: string[] } | null>(null);

  useEffect(() => {
    const saved = readSaved();
    if (saved.length === 0) return;
    let cancelled = false;
    lookupMyListings(saved.map((s) => s.token))
      .then((found) => {
        if (cancelled) return;
        const missing = saved.map((s) => s.token).filter((t) => !found.some((f) => f.token === t));
        setState({ found, missing });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || (state.found.length === 0 && state.missing.length === 0)) return null;

  const remove = (token: string) => {
    forget(token);
    setState((s) =>
      s
        ? { found: s.found.filter((f) => f.token !== token), missing: s.missing.filter((t) => t !== token) }
        : s,
    );
  };

  return (
    <section className="rounded-[28px] rounded-ee-[8px] bg-white p-6 ring-1 ring-ink-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-ink-900">
          <Smartphone className="size-5 text-clay-600" />
          إعلاناتك على هذا الجهاز
        </h2>
        <p className="text-sm text-ink-500">محفوظة في هذا المتصفح فقط.</p>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {state.found.map((item) => (
          <li key={item.token} className="flex items-center gap-2">
            <Link
              href={`/manage/${item.token}`}
              className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-sand-50 px-4 py-3 ring-1 ring-ink-100 transition-colors hover:bg-sand-100"
            >
              <Nuqta className="size-2.5 shrink-0 text-clay-600" />
              <span className="min-w-0 flex-1">
                <span dir="auto" className="block truncate text-start font-semibold text-ink-900">
                  {item.title}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                  {KIND_NAME[item.kind]}
                  {item.hidden ? <Badge tone="sand">مخفي</Badge> : null}
                  {item.closed ? <Badge tone="sand">مغلقة</Badge> : null}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-clay-700">
                إدارة
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </span>
            </Link>
            <RemoveButton label={item.title} onClick={() => remove(item.token)} />
          </li>
        ))}
        {state.missing.map((token) => (
          <li key={token} className="flex items-center gap-2">
            <p className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-dashed border-ink-200 px-4 py-3 text-sm text-ink-500">
              <Nuqta className="size-2.5 shrink-0 text-ink-300" />
              رابط محفوظ لإعلان لم يعد متاحاً (ربما حُذف).
            </p>
            <RemoveButton label="الرابط غير المتاح" onClick={() => remove(token)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-xl text-ink-500 ring-1 ring-ink-100 ring-inset hover:bg-sand-50 hover:text-clay-700"
      aria-label={`إزالة «${label}» من هذا الجهاز`}
      title="إزالة من هذا الجهاز"
    >
      <X className="size-4" />
    </button>
  );
}
