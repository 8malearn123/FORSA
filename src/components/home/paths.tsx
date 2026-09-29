import Link from "next/link";
import { ArrowLeft, Briefcase, HandHeart, Search } from "lucide-react";

import { COUNT, countLabel } from "@/lib/format";

import { Nuqta, Sparks } from "../brand";
import { cn } from "../cn";
import { Dallah } from "../icons";
import { ButtonLink, Container, SectionHeading } from "../ui";

/** ثلاثة أبواب للدخول، لكل طرف من أطراف المجتمع */
export function Paths({ counts }: { counts: { talents: number; families: number; opportunities: number } }) {
  const paths = [
    {
      key: "talent",
      tone: "sage",
      icon: HandHeart,
      title: "عندي مهارة",
      body: "مصمم، معلمة، فني، مصوّر، خطّاط… اعرض مهارتك وخبرتك، وخلّ الناس والشركات في جازان يلقونك، سواء تبحث عن وظيفة أو دخل إضافي.",
      cta: { href: "/join/talent", label: "اعرض مهارتك" },
      browse: {
        href: "/talents",
        label: counts.talents
          ? `تصفّح ${countLabel(counts.talents, COUNT.talent, { accusative: true })}`
          : "تصفّح المواهب",
      },
    },
    {
      key: "family",
      tone: "clay",
      icon: Dallah,
      title: "أسرة منتجة",
      body: "أكلات شعبية، حلويات، ضيافة، مشغولات، بخور… اعرضوا منتجاتكم لأهل جازان وشركاتها، واستقبلوا الطلبات مباشرة منهم.",
      cta: { href: "/join/family", label: "اعرضوا منتجاتكم" },
      browse: {
        href: "/families",
        label: counts.families
          ? `تصفّح ${countLabel(counts.families, COUNT.family, { accusative: true })}`
          : "تصفّح الأسر المنتجة",
      },
    },
    {
      key: "seeker",
      tone: "ink",
      icon: Search,
      title: "أبحث عن…",
      body: "شخص توظّفه، خدمة تحتاجها، أو ضيافة لفعالية شركتك؟ انشر احتياجك، وخلّ الفرصة توصل لأصحابها في جازان.",
      cta: { href: "/join/opportunity", label: "انشر فرصة" },
      browse: {
        href: "/opportunities",
        label: counts.opportunities
          ? `تصفّح ${countLabel(counts.opportunities, COUNT.opportunity, { accusative: true })}`
          : "تصفّح الفرص",
      },
    },
  ] as const;

  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="ابدأ من مكانك"
          title="ثلاثة أبواب… وكلها توصلك لفرصة"
          description="«فرصة» تجمع أطراف المجتمع في مكان واحد: من يملك المهارة، ومن يصنع المنتج، ومن يبحث عنهما."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {paths.map((p) => {
            const Icon = p.icon;
            const dark = p.tone === "ink";
            return (
              <article
                key={p.key}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-[32px] rounded-ee-[9px] p-7 md:p-8",
                  p.tone === "sage" && "bg-sage-100 text-sage-950",
                  p.tone === "clay" && "bg-clay-100 text-clay-950",
                  dark && "bg-ink-900 text-sand-50",
                )}
              >
                <Nuqta
                  rotate={-90}
                  className={cn(
                    "absolute -bottom-16 -left-12 size-56",
                    p.tone === "sage" && "text-sage-200/70",
                    p.tone === "clay" && "text-clay-200/60",
                    dark && "text-ink-800",
                  )}
                />
                {dark ? <Sparks className="absolute top-6 left-7 w-12" animated /> : null}
                <span
                  className={cn(
                    "relative grid size-14 place-items-center rounded-[18px] rounded-ss-[6px]",
                    p.tone === "sage" && "bg-sage-700 text-white",
                    p.tone === "clay" && "bg-clay-600 text-white",
                    dark && "bg-sand-100 text-ink-900",
                  )}
                >
                  <Icon className="size-7" strokeWidth={1.75} />
                </span>
                <h3 className="relative mt-6 text-3xl font-black">{p.title}</h3>
                <p className={cn("relative mt-3 leading-[1.9]", dark ? "text-ink-200" : "opacity-80")}>
                  {p.body}
                </p>
                <div className="relative mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-8">
                  <ButtonLink
                    href={p.cta.href}
                    variant={p.tone === "sage" ? "sage" : dark ? "secondary" : "primary"}
                  >
                    {p.cta.label}
                  </ButtonLink>
                  <Link
                    href={p.browse.href}
                    className={cn(
                      "group inline-flex items-center gap-1.5 text-sm font-semibold",
                      dark ? "text-sand-100" : "text-ink-800",
                    )}
                  >
                    {p.browse.label}
                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-ink-500">
          <Briefcase className="size-4" />
          شركة أو جهة في جازان؟ يمكنك نشر الوظائف وطلبات الضيافة والهدايا مجاناً، والتواصل مع أصحابها مباشرة.
        </p>
      </Container>
    </section>
  );
}
