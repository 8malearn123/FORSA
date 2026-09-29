import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateFamily, updateOpportunity, updateTalent } from "@/app/join/actions";
import { Nuqta } from "@/components/brand";
import { BackLink } from "@/components/detail";
import { FamilyForm } from "@/components/join/family-form";
import { OpportunityForm } from "@/components/join/opportunity-form";
import { TalentForm } from "@/components/join/talent-form";
import { Container } from "@/components/ui";
import { findOwned } from "@/lib/store";

export const metadata: Metadata = {
  title: "تعديل الإعلان",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function EditListingPage({ params }: PageProps<"/manage/[token]/edit">) {
  const { token } = await params;
  const listing = await findOwned(token);
  if (!listing) notFound();

  return (
    <>
      <section className="border-b border-ink-100/70 bg-sand-200/50">
        <Container className="pt-8 pb-10">
          <BackLink href={`/manage/${token}`}>لوحة إدارة الإعلان</BackLink>
          <p className="mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-clay-700">
            <Nuqta className="size-2.5 text-clay-600" />
            تعديل الإعلان
          </p>
          <h1 className="mt-3 text-4xl leading-[1.25] font-black text-ink-900 md:text-5xl">
            {listing.kind === "opportunity" ? listing.title : listing.name}
          </h1>
          <p className="mt-3 text-lg text-ink-600">عدّل ما تحتاج ثم احفظ، وتظهر التغييرات فوراً.</p>
        </Container>
      </section>
      <Container className="py-10">
        <div className="max-w-4xl">
          {listing.kind === "talent" ? (
            <TalentForm initial={listing} action={updateTalent.bind(null, token)} />
          ) : null}
          {listing.kind === "family" ? (
            <FamilyForm initial={listing} action={updateFamily.bind(null, token)} />
          ) : null}
          {listing.kind === "opportunity" ? (
            <OpportunityForm initial={listing} action={updateOpportunity.bind(null, token)} />
          ) : null}
        </div>
      </Container>
    </>
  );
}
