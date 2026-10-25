import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, HandCoins, MapPin, UsersRound } from "lucide-react";

import { Nuqta, Sparks } from "@/components/brand";
import { FamilyCard } from "@/components/cards";
import { ContactPanel } from "@/components/contact-panel";
import { BackLink, DetailLayout, DetailSection, FactList } from "@/components/detail";
import { CategoryIcon } from "@/components/icons";
import { CoverImage } from "@/components/media";
import { ReportButton, ShareActions } from "@/components/share-actions";
import { cn } from "@/components/cn";
import { Badge, Container } from "@/components/ui";
import { contactChannels } from "@/lib/contact";
import { getFamily, listFamilies, similarTo } from "@/lib/data";
import { coverOf } from "@/lib/listing";
import { COUNT, countLabel, joinedOn } from "@/lib/format";
import { getCategory, governorateName, type CategoryIcon as CategoryIconKey } from "@/lib/taxonomy";

export async function generateMetadata({ params }: PageProps<"/families/[id]">): Promise<Metadata> {
  const family = await getFamily((await params).id);
  if (!family) return { title: "الصفحة غير موجودة" };
  return {
    title: `${family.name} — ${family.tagline}`,
    description: family.story.slice(0, 160),
    openGraph: coverOf(family) ? { images: [coverOf(family)!] } : undefined,
  };
}

export default async function FamilyPage({ params }: PageProps<"/families/[id]">) {
  const family = await getFamily((await params).id);
  if (!family) notFound();

  const categories = family.categories.map(getCategory).filter(Boolean);
  const primary = categories[0];
  const images = [family.cover, ...family.products.map((p) => p.image)].filter(
    (src, i, all): src is string => Boolean(src) && all.indexOf(src) === i,
  );
  const similar = similarTo(family, await listFamilies(), (a, b) =>
    a.categories.some((c) => b.categories.includes(c)),
  );
  const channels = contactChannels(family.contact, family.name).map((c) => c.kind);

  return (
    <>
      <Container className="pt-8">
        <BackLink href="/families">كل الأسر المنتجة</BackLink>
      </Container>

      {/* معرض الصور: يتكيّف مع عدد الصور المتاحة */}
      <Container className="mt-6">
        <Gallery
          images={images}
          name={family.name}
          alt={(src) => family.products.find((p) => p.image === src)?.name ?? family.name}
          icon={primary?.icon}
        />
      </Container>

      <Container className="relative mt-10">
        <Sparks className="absolute top-0 left-8 hidden w-12 md:block" animated />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) =>
            c ? (
              <Badge key={c.slug} tone="white">
                <CategoryIcon icon={c.icon} className="size-3.5 text-clay-600" />
                {c.name}
              </Badge>
            ) : null,
          )}
          {family.events ? (
            <Badge tone="clay" dot>
              تستقبل طلبات المناسبات والشركات
            </Badge>
          ) : null}
        </div>
        <h1 className="mt-4 text-4xl leading-tight font-black text-ink-900 md:text-6xl">
          <span dir="auto">{family.name}</span>
        </h1>
        <p className="mt-3 text-xl text-ink-700">
          <span dir="auto">{family.tagline}</span>
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-ink-600">
          <MapPin className="size-4 text-clay-500" />
          {governorateName(family.governorate)}
        </p>
      </Container>

      <DetailLayout
        main={
          <>
            <section className="relative rounded-[32px] rounded-ee-[9px] bg-clay-50 p-7 ring-1 ring-clay-100 md:p-9">
              <span
                aria-hidden="true"
                className="absolute top-2 left-7 font-display text-8xl leading-none text-clay-200"
              >
                «
              </span>
              <h2 className="font-display text-lg font-bold text-clay-700">حكايتنا</h2>
              <p dir="auto" className="mt-3 text-xl leading-[2] whitespace-pre-line text-ink-800">
                {family.story}
              </p>
            </section>

            <DetailSection title={`المنتجات (${countLabel(family.products.length, COUNT.product)})`}>
              <ul className="grid gap-5 sm:grid-cols-2">
                {family.products.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col overflow-hidden rounded-[26px] rounded-ee-[8px] bg-white ring-1 ring-ink-100"
                  >
                    <CoverImage
                      src={p.image}
                      alt={p.name}
                      icon={primary?.icon}
                      tone="sand"
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                      className="aspect-[4/3]"
                    />
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg font-bold text-ink-900">
                        <span dir="auto">{p.name}</span>
                      </h3>
                      {p.description ? (
                        <p dir="auto" className="mt-1.5 leading-relaxed text-ink-600">
                          {p.description}
                        </p>
                      ) : null}
                      {p.priceHint ? (
                        <p className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-semibold text-clay-700">
                          <HandCoins className="size-4" />
                          {p.priceHint}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-500">
                الأسعار تقديرية تحددها الأسرة، والطلب والاتفاق بينكم مباشرة.
              </p>
            </DetailSection>

            {family.events ? (
              <DetailSection title="للمناسبات والشركات">
                <div className="relative overflow-hidden rounded-[28px] rounded-ee-[8px] bg-sage-100 p-7">
                  <Nuqta className="absolute -bottom-10 -left-8 size-40 text-sage-200" rotate={-90} />
                  <p className="relative max-w-lg text-lg leading-[1.9] text-sage-950">
                    تستقبل {family.name} طلبات الضيافة والهدايا لمناسباتكم وفعاليات الشركات والجهات. تواصلوا
                    معهم بتفاصيل المناسبة والعدد والموعد.
                  </p>
                  <div className="relative mt-5 flex flex-wrap gap-3">
                    {family.events.capacity ? (
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 font-semibold text-sage-900">
                        <UsersRound className="size-5 text-sage-600" />
                        {family.events.capacity}
                      </span>
                    ) : null}
                    {family.events.notice ? (
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 font-semibold text-sage-900">
                        <CalendarClock className="size-5 text-sage-600" />
                        الطلب {family.events.notice}
                      </span>
                    ) : null}
                  </div>
                </div>
              </DetailSection>
            ) : null}
          </>
        }
        aside={
          <>
            <ContactPanel
              kind="family"
              id={family.id}
              name={`اطلب من ${family.name}`}
              available={channels}
              cta="أظهر وسائل التواصل"
            />
            <FactList
              items={[
                { label: "المحافظة", value: governorateName(family.governorate) },
                { label: "التصنيف", value: categories.map((c) => c?.short).join("، ") },
                { label: "المنتجات", value: countLabel(family.products.length, COUNT.product) },
                { label: "على فرصة منذ", value: joinedOn(family.createdAt) },
              ]}
            />
            <div className="flex flex-col gap-4 rounded-[24px] rounded-ee-[7px] bg-sand-200/70 p-5">
              <p className="text-sm text-ink-700">ادعم الأسر المنتجة بمشاركة صفحتهم مع من يحتاجها.</p>
              <ShareActions title={`${family.name} — ${family.tagline}`} prompt="من أسر جازان المنتجة" />
            </div>
            <ReportButton kind="family" id={family.id} />
          </>
        }
      />

      {similar.length > 0 ? (
        <section className="bg-white py-16">
          <Container>
            <h2 className="text-3xl font-extrabold text-ink-900">أسر منتجة قد تعجبك</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((f) => (
                <FamilyCard key={f.id} family={f} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

/** الصورة الأولى كبيرة، وما يليها في فسيفساء بحسب العدد (حتى ٥ صور) */
function Gallery({
  images,
  name,
  alt,
  icon,
}: {
  images: string[];
  name: string;
  alt: (src: string) => string;
  icon?: CategoryIconKey;
}) {
  const shown = images.slice(0, 5);
  const [main, ...rest] = shown;
  const tile = "size-full rounded-[24px] rounded-ee-[7px]";
  const layout = [
    "grid-cols-1",
    "grid-cols-1",
    "sm:grid-cols-[2fr_1fr] sm:grid-rows-1",
    "sm:grid-cols-3 sm:grid-rows-2",
    "sm:grid-cols-4 sm:grid-rows-2",
    "sm:grid-cols-4 sm:grid-rows-2",
  ][shown.length];
  const mainSpan = shown.length >= 3 ? "sm:col-span-2 sm:row-span-2" : "";
  const restSpan = (i: number) => (shown.length === 4 && i === 0 ? "sm:col-span-2" : "");
  return (
    <div className={cn("grid h-[300px] gap-3 sm:h-[420px]", layout)}>
      <CoverImage
        src={main}
        alt={name}
        icon={icon}
        sizes="(min-width: 1024px) 760px, 100vw"
        priority
        className={cn("size-full rounded-[32px] rounded-ee-[9px]", mainSpan)}
      />
      {rest.map((src, i) => (
        <div key={src} className={cn("hidden sm:block", restSpan(i))}>
          <CoverImage src={src} alt={alt(src)} sizes="(min-width: 1024px) 380px, 50vw" className={tile} />
        </div>
      ))}
    </div>
  );
}
