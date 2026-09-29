"use client";

import { useSyncExternalStore } from "react";
import { TriangleAlert } from "lucide-react";

import { WhatsApp } from "./icons";
import { CopyLink } from "./share-actions";

const subscribe = () => () => {};
const getUrl = () => window.location.href.split("?")[0];

/** أدوات حفظ رابط الإدارة: نسخ، أو إرساله لنفسك في واتساب */
export function ManageLinkTools() {
  const url = useSyncExternalStore(subscribe, getUrl, () => "");
  return (
    <div className="flex flex-col gap-3">
      <p
        dir="ltr"
        className="truncate rounded-xl bg-sand-100 px-3 py-2.5 text-start font-mono text-xs text-ink-600 ring-1 ring-sand-300"
      >
        {url || "…"}
      </p>
      <div className="flex flex-wrap gap-2">
        <CopyLink url={url} />
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`رابط إدارة إعلاني على «فرصة» (خاص، لا أشاركه):\n${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-sage-50 px-3.5 text-sm font-semibold text-sage-800 ring-1 ring-sage-200 ring-inset hover:bg-sage-100"
        >
          <WhatsApp className="size-4" />
          أرسله لنفسك
        </a>
      </div>
      <p className="flex gap-2 text-xs leading-relaxed text-clay-800">
        <TriangleAlert className="size-4 shrink-0" />
        من يملك هذا الرابط يستطيع إدارة إعلانك. احفظه لنفسك ولا تشاركه مع أحد.
      </p>
    </div>
  );
}
