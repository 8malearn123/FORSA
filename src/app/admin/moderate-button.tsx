import type { ReactNode } from "react";

import { SubmitButton } from "@/components/submit-button";
import type { ListingKind } from "@/lib/types";

import { moderate } from "./actions";

export const KIND_NAME: Record<ListingKind, string> = {
  talent: "موهبة",
  family: "أسرة منتجة",
  opportunity: "فرصة",
};

export function ModerateButton({
  op,
  kind,
  id,
  report,
  children,
  danger,
}: {
  op?: string;
  kind?: ListingKind;
  id?: string;
  report?: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <form action={moderate}>
      {op ? <input type="hidden" name="op" value={op} /> : null}
      {kind ? <input type="hidden" name="kind" value={kind} /> : null}
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {report ? <input type="hidden" name="report" value={report} /> : null}
      <SubmitButton size="sm" variant={danger ? "soft" : "secondary"}>
        {children}
      </SubmitButton>
    </form>
  );
}
