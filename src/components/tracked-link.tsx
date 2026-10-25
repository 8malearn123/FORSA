"use client";

import type { ComponentProps } from "react";

import { countWhatsApp } from "@/app/actions";
import type { ListingKind } from "@/lib/types";

/** رابط تواصل يُحسب في تقارير لوحة الإشراف عند الضغط عليه إن كان واتساب لإعلان */
export function ContactLink({
  whatsappOf,
  ...props
}: ComponentProps<"a"> & { whatsappOf?: { kind: ListingKind; id: string } }) {
  const count = whatsappOf
    ? () => void countWhatsApp(whatsappOf.kind, whatsappOf.id).catch(() => {})
    : undefined;
  return <a {...props} onClick={count} />;
}
