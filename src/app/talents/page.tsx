import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { FilterChip, FilterRow, PageHeader, ResultsBar, hrefWith, one, tally } from "@/components/browse";
import { TalentCard } from "@/components/cards";
import { SearchBar } from "@/components/search-bar";
import { ButtonLink, Container, EmptyState } from "@/components/ui";
import { listTalents } from "@/lib/data";
import { COUNT, countLabel } from "@/lib/format";
import {
  SEEKING,
  SKILL_CATEGORIES,
  getCategory,
  governorateName,
  isCategory,
  isGovernorate,
} from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "المواهب",
  description:
    "أصحاب مهارات من منطقة جازان يبحثون عن وظيفة أو مشروع أو دخل إضافي. تصفّح ملفاتهم وتواصل معهم مباشرة.",
};

export default async function TalentsPage({ searchParams }: PageProps<"/talents">) {
  const sp = await searchParams;
  const params = {
    q: one(sp.q),
    area: isGovernorate(one(sp.area)) ? one(sp.area) : undefined,
    category: isCategory(one(sp.category)) ? one(sp.category) : undefined,
    seeking: SEEKING.some((s) => s.slug === one(sp.seeking)) ? one(sp.seeking) : undefined,
  };
  const [talents, withoutCategory, withoutSeeking] = await Promise.all([
    listTalents(params),
    listTalents({ ...params, category: undefined }),
    listTalents({ ...params, seeking: undefined }),
  ]);
  const byCategory = tally(withoutCategory, (t) => t.category);
  const bySeeking = tally(withoutSeeking, (t) => t.seeking);

  const active = [
    params.q && { label: `«${params.q}»`, clearHref: hrefWith("/talents", params, { q: undefined }) },
    params.area && {
      label: governorateName(params.area),
      clearHref: hrefWith("/talents", params, { area: undefined }),
    },
    params.category && {
      label: getCategory(params.category)?.name ?? "",
      clearHref: hrefWith("/talents", params, { category: undefined }),
    },
    params.seeking && {
      label: SEEKING.find((s) => s.slug === params.seeking)?.name ?? "",
      clearHref: hrefWith("/talents", params, { seeking: undefined }),
    },
  ].filter(Boolean) as { label: string; clearHref: string }[];

  return (
    <>
      <PageHeader
        tone="sage"
        eyebrow="المواهب وأصحاب المهارات"
        title="مواهب جازان، في مكان واحد"
        description="مصممون ومعلمات وفنيون ومصورون وخطاطون… يبحثون عن وظيفة أو مشروع أو دخل إضافي. تصفّح ملفاتهم وتواصل معهم مباشرة."
        action={
          <ButtonLink href="/join/talent" variant="sage">
            <Plus className="size-4" strokeWidth={2.5} />
            اعرض مهارتك
          </ButtonLink>
        }
      >
        <SearchBar
          action="/talents"
          size="md"
          defaultQuery={params.q}
          defaultArea={params.area}
          placeholder="ابحث بالمهارة أو الاسم: تصوير، رياضيات، تكييف…"
          hidden={{ category: params.category, seeking: params.seeking }}
          className="max-w-3xl"
        />
      </PageHeader>

      <Container className="py-10">
        <div className="flex flex-col gap-3">
          <FilterRow label="المجال">
            <FilterChip
              href={hrefWith("/talents", params, { category: undefined })}
              active={!params.category}
            >
              الكل
            </FilterChip>
            {SKILL_CATEGORIES.filter((c) => byCategory.has(c.slug) || params.category === c.slug).map((c) => (
              <FilterChip
                key={c.slug}
                icon={c.icon}
                href={hrefWith("/talents", params, { category: c.slug })}
                active={params.category === c.slug}
                count={byCategory.get(c.slug) ?? 0}
              >
                {c.name}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow label="يبحث عن">
            <FilterChip href={hrefWith("/talents", params, { seeking: undefined })} active={!params.seeking}>
              الكل
            </FilterChip>
            {SEEKING.filter((s) => bySeeking.has(s.slug) || params.seeking === s.slug).map((s) => (
              <FilterChip
                key={s.slug}
                href={hrefWith("/talents", params, { seeking: s.slug })}
                active={params.seeking === s.slug}
                count={bySeeking.get(s.slug) ?? 0}
              >
                {s.name}
              </FilterChip>
            ))}
          </FilterRow>
        </div>

        <div className="mt-10">
          <ResultsBar count={countLabel(talents.length, COUNT.talent)} filters={active} />
        </div>

        {talents.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {talents.map((t) => (
              <TalentCard key={t.id} talent={t} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="ما لقينا موهبة بهذه المواصفات… بعد"
              description="جرّب كلمة أخرى أو محافظة ثانية. أو انشر احتياجك كفرصة، وخلّ أصحاب المهارات يوصلون لك."
              action={<ButtonLink href="/join/opportunity">انشر احتياجك</ButtonLink>}
            />
          </div>
        )}
      </Container>
    </>
  );
}
