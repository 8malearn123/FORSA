import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BriefcaseBusiness, Clock3, Coins, HandCoins, MapPin, Sparkles, Wifi } from "lucide-react";

import { NuqtaAvatar, Sparks } from "@/components/brand";
import { TalentCard, availableLabel } from "@/components/cards";
import { ContactPanel } from "@/components/contact-panel";
import { BackLink, DetailLayout, DetailSection, FactList } from "@/components/detail";
import { CategoryIcon } from "@/components/icons";
import { ReportButton, ShareActions } from "@/components/share-actions";
import { Badge, Container } from "@/components/ui";
import { contactChannels } from "@/lib/contact";
import { getTalent, listTalents, similarTo } from "@/lib/data";
import { joinedOn } from "@/lib/format";
import { experienceName, getCategory, governorateName, SEEKING } from "@/lib/taxonomy";

const SEEKING_ICON = {
  "full-time": BriefcaseBusiness,
  "part-time": Clock3,
  freelance: Sparkles,
  "extra-income": Coins,
} as const;

export async function generateMetadata({ params }: PageProps<"/talents/[id]">): Promise<Metadata> {
  const talent = await getTalent((await params).id);
  if (!talent) return { title: "الملف غير موجود" };
  return {
    title: `${talent.name} — ${talent.headline}`,
    description: talent.bio.slice(0, 160),
    robots: talent.seed ? { index: false } : undefined,
  };
}

export default async function TalentPage({ params }: PageProps<"/talents/[id]">) {
  const talent = await getTalent((await params).id);
  if (!talent) notFound();

  const category = getCategory(talent.category);
  const similar = similarTo(talent, await listTalents(), (a, b) => a.category === b.category);
  const channels = contactChannels(talent.contact, talent.name).map((c) => c.kind);
  const she = talent.gender === "f";

  return (
    <>
      <section className="relative overflow-hidden bg-sage-100/70">
        <div aria-hidden="true" className="absolute inset-0 bg-nuqta-grid opacity-60" />
        <Sparks className="absolute top-10 left-[10%] hidden w-14 md:block" animated />
        <Container className="relative pt-8 pb-12">
          <BackLink href="/talents">كل المواهب</BackLink>
          <div className="mt-8 flex flex-col gap-7 sm:flex-row sm:items-center">
            <NuqtaAvatar name={talent.name} seed={talent.id} size="xl" />
            <div>
              <div className="flex flex-wrap gap-2">
                {category ? (
                  <Badge tone="white">
                    <CategoryIcon icon={category.icon} className="size-3.5 text-sage-700" />
                    {category.name}
                  </Badge>
                ) : null}
                {talent.available ? (
                  <Badge tone="sage" dot>
                    {availableLabel(talent)}
                  </Badge>
                ) : (
                  <Badge tone="sand">{she ? "مشغولة حالياً" : "مشغول حالياً"}</Badge>
                )}
              </div>
              <h1 className="mt-4 text-4xl leading-tight font-black text-ink-900 md:text-5xl">
                <span dir="auto">{talent.name}</span>
              </h1>
              <p className="mt-2 text-xl text-ink-700">
                <span dir="auto">{talent.headline}</span>
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-clay-500" />
                  {governorateName(talent.governorate)}
                </span>
                {talent.remote ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Wifi className="size-4 text-sage-600" />
                    {she ? "تعمل عن بُعد أيضاً" : "يعمل عن بُعد أيضاً"}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <DetailLayout
        main={
          <>
            <section>
              <h2 className="sr-only">نبذة</h2>
              <p dir="auto" className="text-xl leading-[2] whitespace-pre-line text-ink-800">
                {talent.bio}
              </p>
            </section>

            <DetailSection title={she ? "تبحث عن" : "يبحث عن"}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {SEEKING.filter((s) => talent.seeking.includes(s.slug)).map((s) => {
                  const Icon = SEEKING_ICON[s.slug];
                  return (
                    <li
                      key={s.slug}
                      className="flex items-center gap-3 rounded-2xl rounded-ee-[6px] bg-sage-50 px-4 py-3.5 font-semibold text-sage-900 ring-1 ring-sage-100"
                    >
                      <Icon className="size-5 text-sage-600" />
                      {s.name}
                    </li>
                  );
                })}
              </ul>
            </DetailSection>

            {talent.services.length > 0 ? (
              <DetailSection title="الخدمات">
                <ul className="divide-y divide-ink-100 rounded-[24px] rounded-ee-[7px] bg-white ring-1 ring-ink-100">
                  {talent.services.map((s, i) => (
                    <li
                      key={i}
                      className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span dir="auto" className="font-semibold text-ink-900">
                        {s.title}
                      </span>
                      {s.priceHint ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-ink-600">
                          <HandCoins className="size-4 text-clay-500" />
                          {s.priceHint}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-ink-500">
                  الأسعار تقديرية ويحددها صاحب الملف، والاتفاق النهائي بينكم مباشرة.
                </p>
              </DetailSection>
            ) : null}

            <DetailSection title="المهارات">
              <ul className="flex flex-wrap gap-2">
                {talent.skills.map((skill, i) => (
                  <li
                    key={i}
                    dir="auto"
                    className="rounded-xl bg-white px-4 py-2 text-ink-800 ring-1 ring-ink-100"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </DetailSection>

            {talent.work.length > 0 ? (
              <DetailSection title="من الأعمال">
                <ul className="grid gap-4 sm:grid-cols-2">
                  {talent.work.map((w, i) => (
                    <li key={i}>
                      <figure>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] rounded-ee-[7px] bg-sand-200">
                          <Image
                            src={w.image}
                            alt={w.caption}
                            fill
                            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                            unoptimized={w.image.startsWith("/media/")}
                            className="object-cover"
                          />
                        </div>
                        <figcaption dir="auto" className="mt-2 text-sm text-ink-600">
                          {w.caption}
                        </figcaption>
                      </figure>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}
          </>
        }
        aside={
          <>
            <ContactPanel
              kind="talent"
              id={talent.id}
              name={`تواصل مع ${talent.name}`}
              available={channels}
              cta="أظهر وسائل التواصل"
            />
            <FactList
              items={[
                { label: "المجال", value: category?.name ?? "" },
                { label: "الخبرة", value: experienceName(talent.experience) },
                { label: "المحافظة", value: governorateName(talent.governorate) },
                { label: "على فرصة منذ", value: joinedOn(talent.createdAt) },
              ]}
            />
            <div className="flex flex-col gap-4 rounded-[24px] rounded-ee-[7px] bg-sand-200/70 p-5">
              <p className="text-sm text-ink-700">تعرف أحد يحتاج {she ? "مهارتها" : "مهارته"}؟ شارك الملف.</p>
              <ShareActions title={`${talent.name} — ${talent.headline}`} prompt="تعرف أحد يحتاج هالمهارة؟" />
            </div>
            <ReportButton kind="talent" id={talent.id} />
          </>
        }
      />

      {similar.length > 0 ? (
        <section className="bg-white py-16">
          <Container>
            <h2 className="text-3xl font-extrabold text-ink-900">مواهب قريبة من هذا المجال</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((t) => (
                <TalentCard key={t.id} talent={t} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
