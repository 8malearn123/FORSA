import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CircleCheck,
  LogOut,
  MonitorSmartphone,
  Plus,
  Send,
  ShieldCheck,
  ShieldUser,
  Trash2,
} from "lucide-react";

import { Nuqta, Sparks } from "@/components/brand";
import { ListingStatus } from "@/components/listing-status";
import { SubmitButton } from "@/components/submit-button";
import { Badge, ButtonLink, Container, EmptyState } from "@/components/ui";
import { isAdmin } from "@/lib/admin";
import { requireAccount } from "@/lib/auth";
import { COUNT, countLabel, formatNumber, timeAgo } from "@/lib/format";
import { KIND_NAME, titleOf } from "@/lib/listing";
import { listingKey, listingsOf, profileOf, readStore } from "@/lib/store";
import { formatSaudiMobile } from "@/lib/text";

import { deleteAccount, logout, logoutEverywhere, withdrawApplication } from "./actions";

export const metadata: Metadata = {
  title: "حسابي",
  robots: { index: false, follow: false },
};

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const account = await requireAccount("/account");
  const deleted = (await searchParams).deleted === "1";
  const store = await readStore();
  const listings = listingsOf(store, account.id);
  // ما قدّم عليه صاحب الحساب، الأحدث أولاً
  const applications = store.applications
    .filter((a) => a.accountId === account.id)
    .flatMap((application) => {
      const opportunity = store.opportunities.find((o) => o.id === application.opportunityId);
      return opportunity
        ? [{ application, opportunity, profile: profileOf(store, application.profile) }]
        : [];
    })
    .reverse();

  return (
    <>
      <section className="relative overflow-hidden bg-sage-100/70">
        <div aria-hidden="true" className="absolute inset-0 bg-nuqta-grid opacity-60" />
        <Sparks className="absolute top-10 left-[12%] w-16" animated />
        <Container className="relative py-12 md:py-16">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-sage-800">
            <Nuqta className="size-2.5 text-sage-600" />
            حسابي
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.25] font-black text-ink-900 md:text-5xl">
            إعلاناتك على «فرصة»
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-[1.9] text-ink-700">
            تدخل برقم الواتساب{" "}
            <span dir="ltr" className="font-semibold whitespace-nowrap text-ink-900">
              {formatSaudiMobile(account.phone)}
            </span>
            ، ولا يدير إعلاناتك أحد غيرك.
          </p>
        </Container>
      </section>

      {deleted ? (
        <div className="bg-sage-700 text-white">
          <Container className="flex items-center gap-3 py-3.5 font-semibold">
            <CircleCheck className="size-5" />
            تم حذف الإعلان وصوره نهائياً.
          </Container>
        </div>
      ) : null}

      <Container className="grid grid-cols-[minmax(0,1fr)] gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold text-ink-900">
              {listings.length ? countLabel(listings.length, COUNT.listing) : "إعلاناتك"}
            </h2>
            {listings.length ? (
              <ButtonLink href="/join" variant="secondary" size="sm">
                <Plus className="size-4" strokeWidth={2.5} />
                إعلان جديد
              </ButtonLink>
            ) : null}
          </div>
          {listings.length === 0 ? (
            <EmptyState
              title="ما نشرت شيئاً بعد"
              description="اعرض مهارتك، أو منتجات أسرتك، أو انشر فرصة. يأخذ دقائق، ويبقى في حسابك تديره متى شئت."
              action={
                <ButtonLink href="/join">
                  <Plus className="size-4" strokeWidth={2.5} />
                  أضف إعلانك الأول
                </ButtonLink>
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {listings.map((listing) => {
                const key = listingKey(listing.kind, listing.id);
                const reveals = store.reveals[key] ?? 0;
                const received = store.applications.filter((a) => a.opportunityId === listing.id);
                const waiting = received.filter((a) => a.status === "new").length;
                const interest =
                  listing.kind === "opportunity" && (listing.apply || received.length)
                    ? received.length
                      ? `${countLabel(received.length, COUNT.applicant)}${waiting ? ` · ${formatNumber(waiting)} بانتظار الفرز` : ""}`
                      : "لم يتقدم أحد بعد"
                    : reveals > 0
                      ? `طلب وسائل تواصلك ${countLabel(reveals, COUNT.person)}`
                      : "لم يطلب أحد وسائل تواصلك بعد";
                return (
                  <li key={key}>
                    <Link
                      href={`/account/${listing.kind}/${listing.id}`}
                      className="group flex items-center gap-4 rounded-[24px] rounded-ee-[7px] bg-white p-5 ring-1 ring-ink-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift hover:ring-ink-200"
                    >
                      <Nuqta className="size-3 shrink-0 text-clay-600" />
                      <span className="min-w-0 flex-1">
                        <span
                          dir="auto"
                          className="block truncate text-start font-display text-lg font-extrabold text-ink-900"
                        >
                          {titleOf(listing)}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                          {KIND_NAME[listing.kind]}
                          <span aria-hidden="true">·</span>
                          {interest}
                          <ListingStatus listing={listing} />
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-clay-700">
                        إدارة
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {applications.length ? (
            <div className="mt-6 flex flex-col gap-4">
              <h2 className="font-display text-xl font-extrabold text-ink-900">تقديماتك على الفرص</h2>
              <ul className="flex flex-col gap-3">
                {applications.map(({ application, opportunity, profile }) => {
                  const visible = !opportunity.hidden && !opportunity.moderated;
                  return (
                    <li
                      key={application.id}
                      className="flex flex-wrap items-center gap-4 rounded-[24px] rounded-ee-[7px] bg-white p-5 ring-1 ring-ink-100"
                    >
                      <Send className="size-4 shrink-0 text-sage-600" />
                      <span className="min-w-0 flex-1">
                        {visible ? (
                          <Link
                            href={`/opportunities/${opportunity.id}`}
                            dir="auto"
                            className="block truncate text-start font-display text-lg font-extrabold text-ink-900 hover:text-clay-700"
                          >
                            {opportunity.title}
                          </Link>
                        ) : (
                          <span
                            dir="auto"
                            className="block truncate font-display text-lg font-extrabold text-ink-500"
                          >
                            {opportunity.title}
                          </span>
                        )}
                        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                          <span dir="auto">{opportunity.poster.name}</span>
                          <span aria-hidden="true">·</span>
                          {profile ? `بملف «${titleOf(profile)}»` : null}
                          <span aria-hidden="true">·</span>
                          {timeAgo(application.createdAt)}
                          {opportunity.closed ? <Badge tone="sand">اكتملت</Badge> : null}
                          {visible ? null : <Badge tone="sand">لم تعد ظاهرة</Badge>}
                        </span>
                      </span>
                      <form action={withdrawApplication}>
                        <input type="hidden" name="application" value={application.id} />
                        <input type="hidden" name="back" value="/account" />
                        <SubmitButton variant="ghost" size="sm" pendingLabel="جارِ السحب…">
                          اسحب التقديم
                        </SubmitButton>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          {(await isAdmin()) ? (
            <ButtonLink href="/admin" variant="dark" size="md">
              <ShieldUser className="size-4" />
              لوحة الإشراف
            </ButtonLink>
          ) : null}
          <div className="rounded-[28px] rounded-ee-[8px] bg-white p-6 ring-1 ring-ink-100">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
              <ShieldCheck className="size-5 text-sage-600" />
              أمان حسابك
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              الدخول برمز يصل إلى واتسابك فقط. لا تعطِ الرمز لأي أحد، حتى لو قال إنه من فريق «فرصة».
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <form action={logout}>
                <SubmitButton variant="secondary" size="md" className="w-full">
                  <LogOut className="size-4" />
                  تسجيل الخروج
                </SubmitButton>
              </form>
              <form action={logoutEverywhere}>
                <SubmitButton variant="ghost" size="md" className="w-full">
                  <MonitorSmartphone className="size-4" />
                  الخروج من كل الأجهزة
                </SubmitButton>
              </form>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              دخلت من جوال غيرك ونسيت الخروج؟ هذا الزر يُخرجك منه ومن أي جهاز آخر.
            </p>
          </div>
          <details className="group rounded-[28px] rounded-ee-[8px] bg-clay-50 p-6 ring-1 ring-clay-100">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-clay-800">
              <Trash2 className="size-4" />
              حذف الحساب نهائياً
            </summary>
            <form action={deleteAccount} className="mt-4 flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-clay-900">
                سيُحذف حسابك وكل إعلاناتك وصورها من «فرصة»، ولا يمكن استرجاعها. متأكد؟
              </p>
              <input type="hidden" name="confirm" value="yes" />
              <SubmitButton variant="primary" className="self-start" pendingLabel="جارِ الحذف…">
                نعم، احذف حسابي
              </SubmitButton>
            </form>
          </details>
        </aside>
      </Container>
    </>
  );
}
