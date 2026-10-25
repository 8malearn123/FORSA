import "server-only";

import { connection } from "next/server";

import { readStore, type Partner } from "./store";

/** تظهر حتى يعدّل فريق الإشراف القائمة أول مرة */
export const DEFAULT_PARTNERS: Partner[] = [
  { id: "qimma-code", name: "قمة كود", logo: "/brand/forsa-logo.svg" },
  { id: "atheer", name: "المصممة أثير", logo: "/brand/forsa-logo.svg" },
];

export const partnersOf = (store: { partners?: Partner[] }) => store.partners ?? DEFAULT_PARTNERS;

export async function listPartners() {
  await connection();
  return partnersOf(await readStore());
}
