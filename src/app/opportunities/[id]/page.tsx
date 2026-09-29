import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, CircleCheck, Clock3, Hourglass, MapPin, Package, Wallet, Wifi } from "lucide-react";

import { Nuqta, Sparks } from "@/components/brand";
import { OpportunityCard, PosterIcon, TYPE_TONE } from "@/components/cards";
import { ContactPanel } from "@/components/contact-panel";
import { BackLink, DetailLayout, DetailSection } from "@/components/detail";
import { CategoryIcon } from "@/components/icons";
import { ReportButton, ShareActions } from "@/components/share-actions";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { contactChannels } from "@/lib/contact";
import { getOpportunity, listOpportunities, similarTo } from "@/lib/data";
import { formatNumber, timeAgo } from "@/lib/format";
import { STALE_DAYS, freshSince, isStale } from "@/lib/listing";
import { getCategory, governorateName, opportunityTypeName, posterTypeName } from "@/lib/taxonomy";

export async function generateMetadata({ params }: PageProps<"/opportunities/[id]">): Promise<Metadata> {
  const o = await getOpportunity((await params).id);
  if (!o) return { title: "الفرصة غير موجودة" };
  return {
    title: o.title,
    description: `${opportunityTypeName(o.type)} في ${governorateName(o.governorate)}: ${o.description.slice(0, 140)}`,
    // المحتوى التجريبي لا يُفهرس في محركات البحث
    robots: o.seed ? { index: false } : undefined,
  };
}

export default async function OpportunityPage({ params }: PageProps<"/opportunities/[id]">) {
  const o = await getOpportunity((await params).id);
  if (!o) notFound();

  const category = getCategory(o.category);
  const similar = similarTo(
    o,
    await listOpportunities(),
    (a, b) => a.category === b.category || a.type === b.type,
  );
  const channels = contactChannels(o.contact, o.title).map((c) => c.kind);
  const isOrder = o.type === "order";
  const stale = isStale(o);

  const facts = [
    {
      icon: MapPin,
      label: "المكان",
      value: `${governorateName(o.governorate)}${o.remote ? " · أو عن بُعد" : ""}`,
    },
    o.when && { icon: CalendarDays, label: "الموعد", value: o.when },
    o.quantity && { icon: Package, label: "العدد أو الكمية", value: o.quantity },
    o.budget && { icon: Wallet, label: "الميزانية", value: o.budget },
    {
      icon: Clock3,
      label: o.renewedAt ? "جُدّدت" : "نُشرت",
      value: timeAgo(freshSince(o)),
    },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[];

  // بيانات منظمة للوظائف والتدريب حتى تظهر في نتائج البحث عن الوظائف
  const jobJsonLd =
    (o.type === "job" || o.type === "training") && !o.closed && !stale && !o.seed
      ? {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: o.title,
          description: [o.description, ...o.requirements].join("\n"),
          datePosted: freshSince(o),
          employmentType: o.type === "training" ? "INTERN" : undefined,
          hiringOrganization: { "@type": "Organization", name: o.poster.name },
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: governorateName(o.governorate),
              addressRegion: "منطقة جازان",
              addressCountry: "SA",
            },
          },
          jobLocationType: o.remote ? "TELECOMMUTE" : undefined,
          directApply: false,
        }
      : null;

  return (
    <>
      {jobJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobJsonLd).replace(/</g, "\\u003c") }}
        />
      ) : null}
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <Nuqta className="absolute -top-20 -left-16 size-72 text-sand-200" rotate={-90} />
        <Sparks className="absolute top-12 left-[12%] hidden w-14 md:block" animated />
        <Container className="relative pt-8 pb-12">
          <BackLink href="/opportunities">كل الفرص</BackLink>
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge tone={TYPE_TONE[o.type]}>{opportunityTypeName(o.type)}</Badge>
            {category ? (
              <Badge tone="white">
                <CategoryIcon icon={category.icon} className="size-3.5 text-clay-600" />
                {category.name}
              </Badge>
            ) : null}
            {o.remote ? (
              <Badge tone="sage">
                <Wifi className="size-3.5" />
                يمكن عن بُعد
              </Badge>
            ) : null}
            {o.closed ? <Badge tone="sand">اكتملت</Badge> : null}
            {stale ? <Badge tone="sand">قد تكون انتهت</Badge> : null}
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.3] font-black text-ink-900 md:text-5xl">
            <span dir="auto">{o.title}</span>
          </h1>
          <p className="mt-5 flex items-center gap-3 text-lg text-ink-700">
            <span className="grid size-10 place-items-center rounded-xl rounded-ss-[4px] bg-sand-200 text-ink-700">
              <PosterIcon type={o.poster.type} className="size-5" />
            </span>
            <span>
              <span dir="auto" className="font-semibold text-ink-900">
                {o.poster.name}
              </span>
              <span className="text-ink-500"> · {posterTypeName(o.poster.type)}</span>
            </span>
          </p>
        </Container>
      </section>

      {o.closed ? (
        <div className="bg-sand-200">
          <Container className="flex items-center gap-3 py-4 text-ink-800">
            <CircleCheck className="size-5 text-sage-600" />
            اكتملت هذه الفرصة ووجد صاحبها ما يبحث عنه. شكراً لكل من تواصل!
          </Container>
        </div>
      ) : null}

      {stale ? (
        <div className="bg-sand-200">
          <Container className="flex items-center gap-3 py-4 text-ink-800">
            <Hourglass className="size-5 shrink-0 text-clay-600" />
            مرّ على هذه الفرصة أكثر من {formatNumber(STALE_DAYS)} يوماً دون تجديد، وقد تكون انتهت. تأكد من
            صاحبها قبل أن تستعد لها.
          </Container>
        </div>
      ) : null}

      <DetailLayout
        main={
          <>
            <ul className="grid gap-3 sm:grid-cols-2">
              {facts.map((f) => (
                <li
                  key={f.label}
                  className="flex items-start gap-3 rounded-2xl rounded-ee-[6px] bg-white p-4 ring-1 ring-ink-100"
                >
                  <f.icon className="mt-0.5 size-5 shrink-0 text-clay-600" />
                  <div>
                    <p className="text-sm text-ink-500">{f.label}</p>
                    <p className="font-semibold text-ink-900">{f.value}</p>
                  </div>
                </li>
              ))}
            </ul>

            <DetailSection title="التفاصيل">
              <p dir="auto" className="text-lg leading-[2] whitespace-pre-line text-ink-800">
                {o.description}
              </p>
            </DetailSection>

            {o.requirements.length > 0 ? (
              <DetailSection title={isOrder ? "المطلوب" : "المتطلبات"}>
                <ul className="flex flex-col gap-3">
                  {o.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-lg text-ink-800">
                      <Nuqta className="mt-2.5 size-2.5 shrink-0 text-sage-500" />
                      <span dir="auto">{r}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}

            {isOrder && !o.closed ? (
              <div className="flex flex-col gap-4 rounded-[28px] rounded-ee-[8px] bg-clay-50 p-6 ring-1 ring-clay-100 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-clay-900">
                  عندكم أسرة منتجة تقدر تلبي هذا الطلب؟ اعرضوا منتجاتكم على «فرصة» ليجدكم أصحاب الطلبات
                  القادمة.
                </p>
                <ButtonLink href="/join/family" variant="primary" className="shrink-0">
                  اعرضوا منتجاتكم
                </ButtonLink>
              </div>
            ) : null}
          </>
        }
        aside={
          <>
            <ContactPanel
              kind="opportunity"
              id={o.id}
              name={isOrder ? "قدّم عرضك مباشرة" : "مهتم بهذه الفرصة؟"}
              available={channels}
              cta={isOrder ? "تواصل مع صاحب الطلب" : "تواصل مع صاحب الفرصة"}
            />
            <div className="flex flex-col gap-4 rounded-[24px] rounded-ee-[7px] bg-sand-200/70 p-5">
              <p className="text-sm text-ink-700">تعرف أحد تناسبه هذه الفرصة؟ الفرص تكبر بالمشاركة.</p>
              <ShareActions title={o.title} prompt="فرصة في جازان ممكن تناسبك" />
            </div>
            <ReportButton kind="opportunity" id={o.id} />
          </>
        }
      />

      {similar.length > 0 ? (
        <section className="bg-white py-16">
          <Container>
            <h2 className="text-3xl font-extrabold text-ink-900">فرص مشابهة</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((item) => (
                <OpportunityCard key={item.id} opportunity={item} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
