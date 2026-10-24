import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Check, Eye, EyeOff, Flag, LogOut, Trash2 } from "lucide-react";

import { Nuqta } from "@/components/brand";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Container } from "@/components/ui";
import { adminEnabled, adminKeyEnabled, adminVia } from "@/lib/admin";
import { formatNumber, timeAgo } from "@/lib/format";
import { pathOf, REASON_NAME, titleOf } from "@/lib/listing";
import { listingKey, readStore } from "@/lib/store";
import { governorateName } from "@/lib/taxonomy";
import type { Listing, ListingKind } from "@/lib/types";

import { adminLogout, moderate } from "./actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "الإشراف",
  robots: { index: false, follow: false },
};

const KIND_NAME: Record<ListingKind, string> = {
  talent: "موهبة",
  family: "أسرة منتجة",
  opportunity: "فرصة",
};

function ModerateButton({
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
  children: React.ReactNode;
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

export default async function AdminPage() {
  await connection();
  if (!adminEnabled()) notFound();

  const via = await adminVia();
  if (!via) {
    // دون مفتاح، لا يدخل إلا أصحاب أرقام الفريق، فلا نكشف الصفحة لغيرهم
    if (!adminKeyEnabled()) notFound();
    return (
      <Container className="flex justify-center py-20">
        <div className="w-full max-w-sm rounded-[28px] rounded-ee-[8px] bg-white p-8 shadow-lift ring-1 ring-ink-100">
          <Nuqta className="size-8 text-clay-600" rotate={-90} />
          <h1 className="mt-4 text-2xl font-black text-ink-900">لوحة الإشراف</h1>
          <p className="mt-1 mb-6 text-sm text-ink-600">لفريق مبادرة «فرصة» فقط.</p>
          <LoginForm />
          <p className="mt-5 text-center text-sm text-ink-600">
            من فريق «فرصة»؟{" "}
            <Link
              href="/login?next=/admin"
              className="font-semibold text-clay-700 underline underline-offset-4"
            >
              ادخل برقم واتسابك
            </Link>
          </p>
        </div>
      </Container>
    );
  }

  const store = await readStore();
  const listings: Listing[] = [...store.talents, ...store.families, ...store.opportunities].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const byKey = new Map(listings.map((l) => [listingKey(l.kind, l.id), l]));
  const openReports = store.reports.filter((r) => !r.resolved).reverse();

  const stats = [
    { label: "مواهب", value: store.talents.length },
    { label: "أسر منتجة", value: store.families.length },
    { label: "فرص", value: store.opportunities.length },
    { label: "بلاغات مفتوحة", value: openReports.length },
  ];

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-clay-700">
            <Nuqta className="size-2.5 text-clay-600" />
            فريق فرصة
          </p>
          <h1 className="mt-2 text-4xl font-black text-ink-900">لوحة الإشراف</h1>
        </div>
        {via === "key" ? (
          <form action={adminLogout}>
            <SubmitButton size="sm" variant="ghost">
              <LogOut className="size-4" />
              خروج
            </SubmitButton>
          </form>
        ) : null}
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[22px] rounded-ee-[7px] bg-white p-5 ring-1 ring-ink-100">
            <dt className="text-sm text-ink-500">{s.label}</dt>
            <dd className="mt-1 font-display text-3xl font-black text-ink-900">{formatNumber(s.value)}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <Flag className="size-5 text-clay-600" />
          البلاغات المفتوحة
        </h2>
        {openReports.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-sage-50 p-5 text-sage-900 ring-1 ring-sage-100">
            لا توجد بلاغات مفتوحة. المجتمع بخير.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {openReports.map((r) => {
              const listing = byKey.get(listingKey(r.kind, r.listingId));
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-4 rounded-[22px] rounded-ee-[7px] bg-white p-5 ring-1 ring-ink-100 md:flex-row md:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="clay">{REASON_NAME[r.reason] ?? r.reason}</Badge>
                      <span className="text-xs text-ink-500">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="mt-2 font-semibold text-ink-900">
                      {listing ? (
                        <Link href={pathOf(listing)} className="hover:text-clay-700">
                          {titleOf(listing)}
                        </Link>
                      ) : (
                        `${KIND_NAME[r.kind]} تجريبية أو محذوفة (${r.listingId})`
                      )}
                    </p>
                    {r.note ? <p className="mt-1 text-sm text-ink-600">«{r.note}»</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {listing && !listing.moderated ? (
                      <ModerateButton op="hide" kind={r.kind} id={r.listingId} report={r.id}>
                        <EyeOff className="size-4" />
                        إخفاء
                      </ModerateButton>
                    ) : null}
                    {listing ? (
                      <ModerateButton op="delete" kind={r.kind} id={r.listingId} danger>
                        <Trash2 className="size-4" />
                        حذف
                      </ModerateButton>
                    ) : null}
                    <ModerateButton report={r.id}>
                      <Check className="size-4" />
                      إغلاق البلاغ
                    </ModerateButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-ink-900">أحدث الإعلانات المنشورة</h2>
        {listings.length === 0 ? (
          <p className="mt-4 text-ink-600">لم يُنشر أي إعلان بعد.</p>
        ) : (
          <ul className="mt-5 flex flex-col gap-2">
            {listings.slice(0, 60).map((l) => (
              <li
                key={listingKey(l.kind, l.id)}
                className="flex flex-col gap-3 rounded-2xl rounded-ee-[6px] bg-white p-4 ring-1 ring-ink-100 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <Badge tone={l.kind === "family" ? "clay" : l.kind === "talent" ? "sage" : "ink"}>
                      {KIND_NAME[l.kind]}
                    </Badge>
                    {governorateName(l.governorate)} · {timeAgo(l.createdAt)} · طلبات تواصل:{" "}
                    {formatNumber(store.reveals[listingKey(l.kind, l.id)] ?? 0)}
                    {l.moderated ? <Badge tone="clay">أخفاه الإشراف</Badge> : null}
                    {l.hidden ? <Badge tone="sand">أخفاه صاحبه</Badge> : null}
                  </div>
                  <Link
                    href={pathOf(l)}
                    className="mt-1.5 block truncate font-semibold text-ink-900 hover:text-clay-700"
                  >
                    {titleOf(l)}
                  </Link>
                </div>
                <div className="flex gap-2">
                  {l.moderated ? (
                    <ModerateButton op="show" kind={l.kind} id={l.id}>
                      <Eye className="size-4" />
                      إظهار
                    </ModerateButton>
                  ) : (
                    <ModerateButton op="hide" kind={l.kind} id={l.id}>
                      <EyeOff className="size-4" />
                      إخفاء
                    </ModerateButton>
                  )}
                  <ModerateButton op="delete" kind={l.kind} id={l.id} danger>
                    <Trash2 className="size-4" />
                    حذف
                  </ModerateButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
