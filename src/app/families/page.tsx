import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { FilterChip, FilterRow, PageHeader, ResultsBar, hrefWith, one, tally } from "@/components/browse";
import { FamilyCard } from "@/components/cards";
import { SearchBar } from "@/components/search-bar";
import { ButtonLink, Container, EmptyState } from "@/components/ui";
import { listFamilies } from "@/lib/data";
import { COUNT, countLabel } from "@/lib/format";
import { PRODUCT_CATEGORIES, getCategory, governorateName, isCategory, isGovernorate } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "الأسر المنتجة",
  description:
    "أكلات شعبية وحلويات وضيافة ومشغولات وبخور وعسل من بيوت جازان. اكتشف الأسر المنتجة واطلب منها مباشرة، للبيت أو للمناسبات أو لفعاليات الشركات.",
};

export default async function FamiliesPage({ searchParams }: PageProps<"/families">) {
  const sp = await searchParams;
  const params = {
    q: one(sp.q),
    area: isGovernorate(one(sp.area)) ? one(sp.area) : undefined,
    category: isCategory(one(sp.category)) ? one(sp.category) : undefined,
    events: one(sp.events) === "1" ? "1" : undefined,
  };
  const [families, withoutCategory] = await Promise.all([
    listFamilies({ ...params, events: Boolean(params.events) }),
    listFamilies({ ...params, category: undefined, events: Boolean(params.events) }),
  ]);
  const byCategory = tally(withoutCategory, (f) => f.categories);

  const active = [
    params.q && { label: `«${params.q}»`, clearHref: hrefWith("/families", params, { q: undefined }) },
    params.area && {
      label: governorateName(params.area),
      clearHref: hrefWith("/families", params, { area: undefined }),
    },
    params.category && {
      label: getCategory(params.category)?.name ?? "",
      clearHref: hrefWith("/families", params, { category: undefined }),
    },
    params.events && {
      label: "تستقبل طلبات المناسبات والشركات",
      clearHref: hrefWith("/families", params, { events: undefined }),
    },
  ].filter(Boolean) as { label: string; clearHref: string }[];

  return (
    <>
      <PageHeader
        eyebrow="الأسر المنتجة"
        title="من بيوت جازان… بحب"
        description="أكلات شعبية، حلويات، ضيافة، مشغولات، بخور، وعسل من الجبال. اطلب مباشرة من الأسرة: لبيتك، أو لمناسبتك، أو لفعالية شركتك."
        action={
          <ButtonLink href="/join/family">
            <Plus className="size-4" strokeWidth={2.5} />
            اعرضوا منتجاتكم
          </ButtonLink>
        }
      >
        <SearchBar
          action="/families"
          size="md"
          defaultQuery={params.q}
          defaultArea={params.area}
          placeholder="ابحث عن منتج أو أسرة: لقيمات، بخور، ضيافة…"
          hidden={{ category: params.category, events: params.events }}
          className="max-w-3xl"
        />
      </PageHeader>

      <Container className="py-10">
        <div className="flex flex-col gap-3">
          <FilterRow label="التصنيف">
            <FilterChip
              href={hrefWith("/families", params, { category: undefined })}
              active={!params.category}
            >
              الكل
            </FilterChip>
            {PRODUCT_CATEGORIES.filter((c) => byCategory.has(c.slug) || params.category === c.slug).map(
              (c) => (
                <FilterChip
                  key={c.slug}
                  icon={c.icon}
                  href={hrefWith("/families", params, { category: c.slug })}
                  active={params.category === c.slug}
                  count={byCategory.get(c.slug) ?? 0}
                >
                  {c.name}
                </FilterChip>
              ),
            )}
          </FilterRow>
          <FilterRow label="للشركات">
            <FilterChip
              href={hrefWith("/families", params, { events: params.events ? undefined : "1" })}
              active={Boolean(params.events)}
            >
              تستقبل طلبات المناسبات والشركات
            </FilterChip>
          </FilterRow>
        </div>

        <div className="mt-10">
          <ResultsBar count={countLabel(families.length, COUNT.family)} filters={active} />
        </div>

        {families.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((f, i) => (
              <FamilyCard key={f.id} family={f} priority={i < 3} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="ما لقينا أسرة بهذه المواصفات… بعد"
              description="جرّب تصنيفاً آخر أو محافظة ثانية. وإذا تبحث عن شيء محدد، انشر طلبك وخلّ الأسر المنتجة تتواصل معك."
              action={<ButtonLink href="/join/opportunity?type=order">انشر طلبك</ButtonLink>}
            />
          </div>
        )}
      </Container>
    </>
  );
}
