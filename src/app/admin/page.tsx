import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowDown,
  ArrowUp,
  ChartColumn,
  Check,
  Clock3,
  EyeOff,
  Flag,
  HeartHandshake,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Nuqta } from "@/components/brand";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Container } from "@/components/ui";
import { adminEnabled, adminKeyEnabled, adminVia } from "@/lib/admin";
import { formatNumber, timeAgo } from "@/lib/format";
import { areasName, pathOf, REASON_NAME, titleOf } from "@/lib/listing";
import { partnersOf } from "@/lib/partners";
import { reportsOf, type ReportTile } from "@/lib/reports";
import { reviewEnabled } from "@/lib/review";
import { listingKey, readStore } from "@/lib/store";
import { opportunityTypeName, posterTypeName } from "@/lib/taxonomy";

import { adminLogout, partnerOp } from "./actions";
import { ListingsSection } from "./listings-section";
import { LoginForm } from "./login-form";
import { KIND_NAME, ModerateButton } from "./moderate-button";
import { PartnerForm } from "./partner-form";

export const metadata: Metadata = {
  title: "الإشراف",
  robots: { index: false, follow: false },
};

function ReportGroup({ title, tiles }: { title: string; tiles: ReportTile[] }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-sm font-semibold text-ink-600">{title}</h3>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="flex flex-col rounded-[22px] rounded-ee-[7px] bg-white p-5 ring-1 ring-ink-100"
          >
            <dt className="text-sm text-ink-500">{t.label}</dt>
            <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 font-display text-3xl font-black text-ink-900">
              {formatNumber(t.value)}
              {t.month ? (
                <span className="font-sans text-xs font-semibold text-sage-700">
                  +{formatNumber(t.month)} هذا الشهر
                </span>
              ) : null}
            </dd>
            {t.note ? <dd className="mt-auto pt-2 text-xs leading-relaxed text-ink-500">{t.note}</dd> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}

function PartnerButton({
  op,
  id,
  label,
  children,
}: {
  op: string;
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <form action={partnerOp}>
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        size="sm"
        variant={op === "delete" ? "soft" : "secondary"}
        aria-label={label}
        title={label}
      >
        {children}
      </SubmitButton>
    </form>
  );
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
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
  const byKey = new Map(
    [...store.talents, ...store.families, ...store.opportunities].map((l) => [listingKey(l.kind, l.id), l]),
  );
  const openReports = store.reports.filter((r) => !r.resolved).reverse();
  const pending = store.opportunities
    .filter((o) => o.pending && !o.moderated)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const partners = partnersOf(store);

  const reports = reportsOf(store);

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

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <ChartColumn className="size-5 text-clay-600" />
          التقارير
        </h2>
        <ReportGroup title="الأعضاء" tiles={reports.people} />
        <ReportGroup title="النشاط" tiles={reports.activity} />
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          تواصل الواتساب يُحسب من تاريخ تفعيل التقارير، مرة واحدة يومياً لكل زائر وإعلان، ويشمل تواصل أصحاب
          الفرص مع المتقدمين. «هذا الشهر» حسب التقويم الميلادي.
        </p>
      </section>

      <section id="pending" className="mt-12 scroll-mt-24">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <Clock3 className="size-5 text-clay-600" />
          فرص بانتظار الموافقة
          {pending.length > 0 ? <Badge tone="clay">{formatNumber(pending.length)}</Badge> : null}
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          {reviewEnabled()
            ? "علّقتها المراجعة الآلية لأنها قد لا تكون فرصة فعلية، ولا تظهر للزوار حتى توافقوا عليها."
            : "المراجعة الآلية متوقفة: اضبطوا ANTHROPIC_API_KEY لتُراجَع الفرص قبل نشرها."}
        </p>
        {pending.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-sage-50 p-5 text-sage-900 ring-1 ring-sage-100">
            لا توجد فرص بانتظار الموافقة.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {pending.map((o) => (
              <li key={o.id} className="rounded-[22px] rounded-ee-[7px] bg-white p-5 ring-1 ring-ink-100">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                  <Badge tone="ink">{opportunityTypeName(o.type)}</Badge>
                  {posterTypeName(o.poster.type)}: {o.poster.name} · {areasName(o)} · {timeAgo(o.createdAt)}
                </div>
                <p className="mt-2 font-semibold text-ink-900">{o.title}</p>
                <p className="mt-1 line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-ink-700">
                  {o.description}
                </p>
                <p className="mt-3 rounded-xl bg-clay-50 px-3 py-2 text-sm text-clay-800">
                  سبب التعليق: {o.pending?.reason}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ModerateButton op="approve" kind="opportunity" id={o.id}>
                    <Check className="size-4" />
                    موافقة ونشر
                  </ModerateButton>
                  <ModerateButton op="reject" kind="opportunity" id={o.id}>
                    <EyeOff className="size-4" />
                    رفض
                  </ModerateButton>
                  <ModerateButton op="delete" kind="opportunity" id={o.id} danger>
                    <Trash2 className="size-4" />
                    حذف
                  </ModerateButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <Flag className="size-5 text-clay-600" />
          البلاغات المفتوحة
          {openReports.length > 0 ? <Badge tone="clay">{formatNumber(openReports.length)}</Badge> : null}
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
                        `${KIND_NAME[r.kind]} محذوفة (${r.listingId})`
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
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <HeartHandshake className="size-5 text-clay-600" />
          شركاء النجاح
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          تظهر بهذا الترتيب في صفحة{" "}
          <Link href="/about#partners" className="font-semibold text-clay-700 underline underline-offset-4">
            «عن فرصة»
          </Link>
          ، وإن حذفتها كلها يختفي القسم.
        </p>
        <ul className="mt-5 flex flex-col gap-2">
          {partners.map((p, i) => (
            <li key={p.id} className="rounded-2xl rounded-ee-[6px] bg-white p-4 ring-1 ring-ink-100">
              <div className="flex flex-wrap items-center gap-4">
                <span className="relative grid h-12 w-24 shrink-0 place-items-center rounded-xl bg-sand-50">
                  {p.logo ? (
                    <Image
                      src={p.logo}
                      alt=""
                      fill
                      sizes="96px"
                      unoptimized={p.logo.startsWith("/media/")}
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <span className="text-xs text-ink-500">بلا شعار</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{p.name}</p>
                  {p.role || p.url ? (
                    <p className="truncate text-sm text-ink-500">
                      {[p.role, p.url?.replace(/^https?:\/\//, "")].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {i > 0 ? (
                    <PartnerButton op="up" id={p.id} label="تقديم">
                      <ArrowUp className="size-4" />
                    </PartnerButton>
                  ) : null}
                  {i < partners.length - 1 ? (
                    <PartnerButton op="down" id={p.id} label="تأخير">
                      <ArrowDown className="size-4" />
                    </PartnerButton>
                  ) : null}
                  <PartnerButton op="delete" id={p.id} label="حذف">
                    <Trash2 className="size-4" />
                  </PartnerButton>
                </div>
              </div>
              <details className="group mt-3">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-clay-700">
                  <Pencil className="size-3.5" />
                  تعديل
                </summary>
                <div className="mt-4 border-t border-ink-100 pt-4">
                  <PartnerForm partner={p} />
                </div>
              </details>
            </li>
          ))}
        </ul>
        <details
          className="mt-3 rounded-2xl rounded-ee-[6px] bg-white p-4 ring-1 ring-ink-100"
          open={partners.length === 0}
        >
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-semibold text-ink-900">
            <Plus className="size-4 text-clay-600" />
            إضافة شريك أو راعٍ
          </summary>
          <div className="mt-4">
            <PartnerForm />
          </div>
        </details>
      </section>

      <ListingsSection store={store} params={await searchParams} />
    </Container>
  );
}
