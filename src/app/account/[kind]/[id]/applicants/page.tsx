import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicantCard } from "@/components/applicant-card";
import { Nuqta } from "@/components/brand";
import { hrefWith, one } from "@/components/browse";
import { cn } from "@/components/cn";
import { BackLink } from "@/components/detail";
import { ShareActions } from "@/components/share-actions";
import { Container, EmptyState } from "@/components/ui";
import { fitOf, isApplicationStatus } from "@/lib/applications";
import { requireAccount } from "@/lib/auth";
import { COUNT, countLabel, formatNumber } from "@/lib/format";
import { pathOf } from "@/lib/listing";
import { ownedListing, profileOf, readStore } from "@/lib/store";
import type { ApplicationStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "فرز المتقدمين",
  robots: { index: false, follow: false },
};

const TABS: { status?: ApplicationStatus; label: string }[] = [
  { label: "الكل" },
  { status: "new", label: "بانتظار الفرز" },
  { status: "shortlisted", label: "المرشحون" },
  { status: "rejected", label: "المستبعدون" },
];

export default async function ApplicantsPage({
  params,
  searchParams,
}: PageProps<"/account/[kind]/[id]/applicants">) {
  const { kind, id } = await params;
  const account = await requireAccount(`/account/${kind}/${id}/applicants`);
  const store = await readStore();
  const opportunity = kind === "opportunity" ? ownedListing(store, account.id, "opportunity", id) : null;
  if (opportunity?.kind !== "opportunity") notFound();

  const sp = await searchParams;
  const status = one(sp.status);
  const tab = isApplicationStatus(status) ? status : undefined;
  const sort = one(sp.sort) === "newest" ? "newest" : undefined;
  const current = { status: tab, sort };
  const base = `/account/opportunity/${opportunity.id}/applicants`;

  // ملفات المتقدمين كما هي الآن؛ ما أخفاه الإشراف لا يظهر
  const all = store.applications
    .filter((a) => a.opportunityId === opportunity.id)
    .flatMap((application) => {
      const profile = profileOf(store, application.profile);
      return profile && !profile.moderated ? [{ application, profile, ...fitOf(profile, opportunity) }] : [];
    });
  const count = (s?: ApplicationStatus) => all.filter((x) => !s || x.application.status === s).length;
  const shown = all
    .filter((x) => !tab || x.application.status === tab)
    .sort(
      (a, b) =>
        (sort ? 0 : b.score - a.score) || b.application.createdAt.localeCompare(a.application.createdAt),
    );

  return (
    <>
      <section className="border-b border-ink-100/70 bg-sand-200/50">
        <Container className="pt-8 pb-10">
          <BackLink href={`/account/opportunity/${opportunity.id}`}>لوحة إدارة الفرصة</BackLink>
          <p className="mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-clay-700">
            <Nuqta className="size-2.5 text-clay-600" />
            فرز المتقدمين
          </p>
          <h1
            dir="auto"
            className="mt-3 max-w-3xl text-4xl leading-[1.25] font-black text-ink-900 md:text-5xl"
          >
            {opportunity.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-[1.9] text-ink-600">
            {all.length
              ? `${countLabel(all.length, COUNT.applicant)} حتى الآن. رشّح المناسبين ثم تواصل معهم بالواتساب؛ المتقدمون لا يرون نتيجة الفرز.`
              : "هنا تظهر ملفات من يتقدم لفرصتك، مع ما يوافقها من كل ملف."}
          </p>
        </Container>
      </section>

      <Container className="flex flex-col gap-6 py-10">
        {all.length === 0 ? (
          <EmptyState
            title="لم يتقدم أحد بعد"
            description="شارك الفرصة في قروبات العائلة والأصدقاء والعمل، ليصل لها أكثر الناس."
            action={
              <ShareActions
                title={opportunity.title}
                path={pathOf(opportunity)}
                prompt="فرصة في جازان ممكن تناسبك"
              />
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="أقسام المتقدمين" className="flex flex-wrap gap-2">
                {TABS.map((t) => {
                  const active = t.status === tab;
                  return (
                    <Link
                      key={t.label}
                      href={hrefWith(base, current, { status: t.status })}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors ring-inset",
                        active
                          ? "bg-ink-900 text-sand-50 ring-ink-900"
                          : "bg-white text-ink-700 ring-ink-200 hover:bg-sand-50",
                      )}
                    >
                      {t.label}
                      <span className={cn("text-xs", active ? "text-ink-200" : "text-ink-500")}>
                        {formatNumber(count(t.status))}
                      </span>
                    </Link>
                  );
                })}
              </nav>
              <p className="flex items-center gap-1 text-sm text-ink-500">
                الترتيب:
                {[
                  { value: undefined, label: "الأنسب أولاً" },
                  { value: "newest", label: "الأحدث" },
                ].map((s) => (
                  <Link
                    key={s.label}
                    href={hrefWith(base, current, { sort: s.value })}
                    aria-current={s.value === sort ? "true" : undefined}
                    className={cn(
                      "rounded-lg px-2 py-1 font-semibold",
                      s.value === sort ? "bg-white text-ink-900 ring-1 ring-ink-200" : "hover:text-ink-800",
                    )}
                  >
                    {s.label}
                  </Link>
                ))}
              </p>
            </div>

            {shown.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ink-200 p-8 text-center text-ink-500">
                لا يوجد متقدمون في هذا القسم.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {shown.map(({ application, profile, points }) => (
                  <li key={application.id}>
                    <ApplicantCard
                      application={application}
                      profile={profile}
                      opportunity={opportunity}
                      fit={points}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Container>
    </>
  );
}
