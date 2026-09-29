"use client";

import { useLinkStatus } from "next/link";

import { Nuqta } from "./brand";
import { cn } from "./cn";

/** نقطة صغيرة تدور على الرابط أثناء الانتقال، دون أن تحرّك التخطيط */
export function PendingHint({ inset }: { /** داخل البطاقة بدل حافتها */ inset?: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-10 grid place-items-center rounded-full bg-white shadow transition-opacity duration-150",
        inset ? "end-3 top-3 size-7" : "-end-1 -top-1 size-4",
        pending ? "opacity-100" : "opacity-0",
      )}
    >
      <Nuqta className={cn("text-clay-600", inset ? "size-3.5" : "size-2.5", pending && "animate-spin")} />
    </span>
  );
}
