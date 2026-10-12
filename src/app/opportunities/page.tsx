import type { Metadata } from "next";
import { Plus } from "lucide-react";

import {
  FilterChip,
  FilterPanel,
  FilterRow,
  PageHeader,
  ResultsBar,
  hrefWith,
  one,
  tally,
} from "@/components/browse";
import { OpportunityCard } from "@/components/cards";
import { SearchBar } from "@/components/search-bar";
import { ButtonLink, Container, EmptyState } from "@/components/ui";
import { listOpportunities } from "@/lib/data";
import { COUNT, countLabel } from "@/lib/format";
import {
  CATEGORIES,
  OPPORTUNITY_TYPES,
  getCategory,
  governorateName,
  isCategory,
  isGovernorate,
  opportunityTypeName,
} from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "الفرص",
  description:
    "وظائف ومهام وطلبات ضيافة ومنتجات وتدريب وتطوع من أفراد وشركات وجهات في منطقة جازان. تواصل مع صاحب الفرصة مباشرة.",
};

export default async function OpportunitiesPage({ searchParams }: PageProps<"/opportunities">) {
  const sp = await searchParams;
  const params = {
    q: one(sp.q),
    area: isGovernorate(one(sp.area)) ? one(sp.area) : undefined,
    category: isCategory(one(sp.category)) ? one(sp.category) : undefined,
    type: OPPORTUNITY_TYPES.some((t) => t.slug === one(sp.type)) ? one(sp.type) : undefined,
  };
  const [opportunities, withoutType, withoutCategory] = await Promise.all([
    listOpportunities(params),
    listOpportunities({ ...params, type: undefined }),
    listOpportunities({ ...params, category: undefined }),
  ]);
  const openOnly = <T extends { closed?: boolean }>(list: T[]) => list.filter((o) => !o.closed);
  const byType = tally(openOnly(withoutType), (o) => o.type);
  const byCategory = tally(openOnly(withoutCategory), (o) => o.category);
  const open = opportunities.filter((o) => !o.closed).length;

  const active = [
    params.q && { label: `«${params.q}»`, clearHref: hrefWith("/opportunities", params, { q: undefined }) },
    params.area && {
      label: governorateName(params.area),
      clearHref: hrefWith("/opportunities", params, { area: undefined }),
    },
    params.type && {
      label: opportunityTypeName(params.type),
      clearHref: hrefWith("/opportunities", params, { type: undefined }),
    },
    params.category && {
      label: getCategory(params.category)?.name ?? "",
      clearHref: hrefWith("/opportunities", params, { category: undefined }),
    },
  ].filter(Boolean) as { label: string; clearHref: string }[];

  return (
    <>
      <PageHeader
        tone="ink"
        eyebrow="الفرص"
        title="فرص مفتوحة في جازان"
        description="أفراد وشركات وجهات ينشرون ما يحتاجونه: وظائف، ومهام، وطلبات ضيافة ومنتجات، وتدريب، وتطوع. إذا شفت فرصة تناسبك، تواصل مباشرة."
        action={
          <ButtonLink href="/join/opportunity" variant="dark">
            <Plus className="size-4" strokeWidth={2.5} />
            انشر فرصة
          </ButtonLink>
        }
      >
        <SearchBar
          action="/opportunities"
          size="md"
          defaultQuery={params.q}
          defaultArea={params.area}
          placeholder="ابحث في الفرص: مصمم، ضيافة، محاسب، تدريب…"
          hidden={{ type: params.type, category: params.category }}
          className="max-w-3xl"
        />
      </PageHeader>

      <Container className="py-10">
        <FilterPanel>
          <FilterRow label="النوع">
            <FilterChip href={hrefWith("/opportunities", params, { type: undefined })} active={!params.type}>
              الكل
            </FilterChip>
            {OPPORTUNITY_TYPES.filter((t) => byType.has(t.slug) || params.type === t.slug).map((t) => (
              <FilterChip
                key={t.slug}
                href={hrefWith("/opportunities", params, { type: t.slug })}
                active={params.type === t.slug}
                count={byType.get(t.slug) ?? 0}
              >
                {t.name}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow label="المجال">
            <FilterChip
              href={hrefWith("/opportunities", params, { category: undefined })}
              active={!params.category}
            >
              كل المجالات
            </FilterChip>
            {CATEGORIES.filter((c) => byCategory.has(c.slug) || params.category === c.slug).map((c) => (
              <FilterChip
                key={c.slug}
                icon={c.icon}
                href={hrefWith("/opportunities", params, { category: c.slug })}
                active={params.category === c.slug}
                count={byCategory.get(c.slug) ?? 0}
              >
                {c.short}
              </FilterChip>
            ))}
          </FilterRow>
        </FilterPanel>

        <div className="mt-10">
          <ResultsBar count={countLabel(open, COUNT.openOpportunity)} filters={active} />
        </div>

        {opportunities.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="لا توجد فرص بهذه المواصفات حالياً"
              description="جرّب نوعاً آخر أو محافظة ثانية. وإذا عندك مهارة، اعرضها وخلّ الفرص تجيك."
              action={
                <ButtonLink href="/join/talent" variant="sage">
                  اعرض مهارتك
                </ButtonLink>
              }
            />
          </div>
        )}
      </Container>
    </>
  );
}
