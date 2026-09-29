import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader, hrefWith, one } from "@/components/browse";
import { FamilyCard, OpportunityCard, TalentCard } from "@/components/cards";
import { SearchBar } from "@/components/search-bar";
import { ButtonLink, Container, EmptyState } from "@/components/ui";
import { searchEverything } from "@/lib/data";
import { COUNT, countLabel } from "@/lib/format";
import { governorateName, isGovernorate } from "@/lib/taxonomy";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const sp = await searchParams;
  const q = one(sp.q);
  const area = one(sp.area);
  const where = isGovernorate(area) ? ` في ${governorateName(area)}` : "";
  return { title: q ? `«${q}»${where}` : `اكتشف${where || " جازان"}`, robots: { index: !q } };
}

function Group({
  title,
  count,
  href,
  children,
}: {
  title: string;
  count: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink-100 pt-10 first:border-t-0 first:pt-0">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-ink-900 md:text-3xl">
          {title} <span className="text-lg font-bold text-ink-500">({count})</span>
        </h2>
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 font-semibold text-clay-700"
        >
          عرض الكل
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = one(sp.q);
  const area = isGovernorate(one(sp.area)) ? one(sp.area) : undefined;
  const { talents, families, opportunities } = await searchEverything(q, area);
  const total = talents.length + families.length + opportunities.length;
  const where = area ? governorateName(area) : "منطقة جازان";
  const params = { q, area };

  return (
    <>
      <PageHeader
        eyebrow={q ? "نتائج البحث" : "اكتشف"}
        title={
          q ? (
            <>
              «{q}» في {where}
            </>
          ) : (
            <>كل ما في {where}</>
          )
        }
        description={
          total > 0
            ? `وجدنا ${countLabel(total, COUNT.result, { accusative: true })} بين المواهب والأسر المنتجة والفرص.`
            : undefined
        }
      >
        <SearchBar size="md" defaultQuery={q} defaultArea={area} className="max-w-3xl" />
      </PageHeader>

      <Container className="flex flex-col gap-14 py-12">
        {total === 0 ? (
          <EmptyState
            title="ما لقينا شيء مطابق… بعد"
            description={`جرّب كلمة أبسط أو ابحث في كل المحافظات. وإذا تبحث عن شيء محدد، انشره كفرصة وخلّ أهل ${where} يوصلون لك.`}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink href="/join/opportunity">انشر احتياجك</ButtonLink>
                {area ? (
                  <ButtonLink href={hrefWith("/search", params, { area: undefined })} variant="secondary">
                    ابحث في كل جازان
                  </ButtonLink>
                ) : null}
              </div>
            }
          />
        ) : null}

        {opportunities.length > 0 ? (
          <Group
            title="الفرص"
            count={countLabel(opportunities.length, COUNT.opportunity)}
            href={hrefWith("/opportunities", params, {})}
          >
            {opportunities.slice(0, 6).map((o) => (
              <OpportunityCard key={o.id} opportunity={o} />
            ))}
          </Group>
        ) : null}

        {talents.length > 0 ? (
          <Group
            title="المواهب"
            count={countLabel(talents.length, COUNT.talent)}
            href={hrefWith("/talents", params, {})}
          >
            {talents.slice(0, 6).map((t) => (
              <TalentCard key={t.id} talent={t} />
            ))}
          </Group>
        ) : null}

        {families.length > 0 ? (
          <Group
            title="الأسر المنتجة"
            count={countLabel(families.length, COUNT.family)}
            href={hrefWith("/families", params, {})}
          >
            {families.slice(0, 6).map((f) => (
              <FamilyCard key={f.id} family={f} />
            ))}
          </Group>
        ) : null}
      </Container>
    </>
  );
}
