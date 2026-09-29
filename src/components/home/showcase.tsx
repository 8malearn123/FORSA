import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { COUNT, countLabel } from "@/lib/format";
import { OPPORTUNITY_TYPES, SKILL_CATEGORIES } from "@/lib/taxonomy";
import type { Family, Opportunity, Talent } from "@/lib/types";

import { Nuqta, Sparks } from "../brand";
import { FamilyCard, OpportunityCard, TalentCard } from "../cards";
import { CategoryIcon } from "../icons";
import { ButtonLink, Container, EmptyState, SectionHeading } from "../ui";

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-2xl px-1 py-2 font-semibold text-clay-700 hover:text-clay-800"
    >
      {children}
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
    </Link>
  );
}

export function LatestOpportunities({ items, total }: { items: Opportunity[]; total: number }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="فرص جديدة حولك"
          title="ناس وشركات في جازان يبحثون عن أحد مثلك"
          description="وظائف، مهام، وطلبات ضيافة ومنتجات نُشرت مؤخراً. تواصل مع صاحب الفرصة مباشرة."
          action={
            total ? (
              <MoreLink href="/opportunities">كل الفرص ({countLabel(total, COUNT.opportunity)})</MoreLink>
            ) : null
          }
        />
        <div className="mt-8 flex flex-wrap gap-2">
          {OPPORTUNITY_TYPES.map((t) => (
            <Link
              key={t.slug}
              href={`/opportunities?type=${t.slug}`}
              className="rounded-full bg-sand-100 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-clay-50 hover:text-clay-700"
            >
              {t.name}
            </Link>
          ))}
        </div>
        {items.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="كن أول من ينشر فرصة"
              description="تبحث عن موظف، أو مصوّر، أو ضيافة لفعاليتك؟ انشرها الآن وخلّ أهل جازان يوصلون لك."
              action={<ButtonLink href="/join/opportunity">انشر فرصة</ButtonLink>}
            />
          </div>
        )}
      </Container>
    </section>
  );
}

export function FamiliesShowcase({ items, total }: { items: Family[]; total: number }) {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="الأسر المنتجة"
          title="من بيوت جازان… لبيتك ومناسبتك وشركتك"
          description="أكلات شعبية، حلويات، بخور، مشغولات، وعسل من الجبال. منتجات تُصنع باليد وبحب، وأصحابها على بعد رسالة."
          action={
            total ? <MoreLink href="/families">كل الأسر ({countLabel(total, COUNT.family)})</MoreLink> : null
          }
        />
        {items.length ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((f, i) => (
              <FamilyCard key={f.id} family={f} priority={i === 0} />
            ))}
          </div>
        ) : (
          <div className="mt-12">
            <EmptyState
              title="أول أسرة منتجة على «فرصة»… ليش ما تكونون أنتم؟"
              description="اعرضوا منتجاتكم وحكايتكم مجاناً، وخلّ أهل جازان وشركاتها يكتشفونكم."
              action={<ButtonLink href="/join/family">اعرضوا منتجاتكم</ButtonLink>}
            />
          </div>
        )}
      </Container>
    </section>
  );
}

/** الشريط المخصص للشركات: ضيافة الفعاليات من الأسر المنتجة */
export function CorporateBand() {
  return (
    <section className="pb-16 md:pb-24">
      <Container>
        <div className="relative grid overflow-hidden rounded-[36px] rounded-ee-[10px] bg-clay-600 text-white lg:grid-cols-[1.15fr_1fr]">
          <Nuqta className="absolute -top-24 -right-20 size-80 text-clay-500/60" rotate={-90} />
          <div className="relative p-8 md:p-14">
            <Sparks className="w-12 text-sage-300" animated />
            <h2 className="mt-5 text-3xl leading-[1.35] font-black md:text-[2.7rem]">
              فعالية في شركتك؟
              <br />
              خلّ الضيافة من أسرة منتجة.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-[1.9] text-clay-50/90">
              بدل المقاهي التجارية، اطلب ركن القهوة والتمر والمعجنات من أسر منتجة قريبة منك. تقدّم لضيوفك طعم
              جازان الحقيقي، وتدعم بيتاً من بيوتها.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/families?events=1" variant="secondary" size="lg">
                أسر تستقبل طلبات الشركات
              </ButtonLink>
              <ButtonLink
                href="/join/opportunity?type=order"
                size="lg"
                className="bg-clay-800 shadow-none hover:bg-clay-900"
              >
                انشر طلب ضيافة
              </ButtonLink>
            </div>
          </div>
          <div className="relative grid min-h-[260px] grid-cols-2 gap-3 p-3 sm:min-h-[320px] lg:p-4">
            <div className="relative row-span-2 overflow-hidden rounded-[26px] rounded-ee-[8px]">
              <Image
                src="/images/products/hospitality.jpg"
                alt="ركن ضيافة لفعالية"
                fill
                sizes="(min-width: 1024px) 280px, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-[26px] rounded-ee-[8px]">
              <Image
                src="/images/products/coffee-dallah.jpg"
                alt="قهوة سعودية"
                fill
                sizes="(min-width: 1024px) 280px, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-[26px] rounded-ee-[8px]">
              <Image
                src="/images/products/pastries.jpg"
                alt="معجنات منزلية"
                fill
                sizes="(min-width: 1024px) 280px, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function TalentsShowcase({ items, total }: { items: Talent[]; total: number }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="مواهب من جازان"
          title="مهارات حقيقية… تنتظر من يكتشفها"
          description="أصحاب مهارات يبحثون عن وظيفة، أو مشروع، أو دخل إضافي. تصفّح ملفاتهم وتواصل معهم مباشرة."
          action={
            total ? <MoreLink href="/talents">كل المواهب ({countLabel(total, COUNT.talent)})</MoreLink> : null
          }
        />
        <div className="-mx-5 mt-8 no-scrollbar flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
          {SKILL_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/talents?category=${c.slug}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-sand-100 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-sage-50 hover:text-sage-800"
            >
              <CategoryIcon icon={c.icon} className="size-4 text-sage-600" />
              {c.name}
            </Link>
          ))}
        </div>
        {items.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <TalentCard key={t.id} talent={t} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="مهارتك ممكن تكون أول مهارة هنا"
              description="اعرض ما تتقنه مجاناً، سواء تبحث عن وظيفة أو مشاريع أو دخل إضافي."
              action={
                <ButtonLink href="/join/talent" variant="sage">
                  اعرض مهارتك
                </ButtonLink>
              }
            />
          </div>
        )}
      </Container>
    </section>
  );
}
