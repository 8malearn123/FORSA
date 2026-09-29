import { Areas, FinalCta, HowItWorks } from "@/components/home/community";
import { Hero } from "@/components/home/hero";
import { Paths } from "@/components/home/paths";
import { Stories } from "@/components/home/stories";
import {
  CorporateBand,
  FamiliesShowcase,
  LatestOpportunities,
  TalentsShowcase,
} from "@/components/home/showcase";
import { getStats, listFamilies, listOpportunities, listTalents } from "@/lib/data";
import { isStale } from "@/lib/listing";

/** يختار عناصر بعينها إن وُجدت، وإلا يكمل من الأحدث */
function pick<T extends { id: string }>(items: T[], ids: string[]) {
  const chosen = ids.map((id) => items.find((i) => i.id === id)).filter((i): i is T => Boolean(i));
  return [...chosen, ...items.filter((i) => !chosen.includes(i))];
}

export default async function HomePage() {
  const [talents, families, opportunities, stats] = await Promise.all([
    listTalents(),
    listFamilies(),
    listOpportunities(),
    getStats(),
  ]);
  // الصفحة الرئيسية تعرض الفرص المفتوحة الحديثة فقط
  const open = opportunities.filter((o) => !o.closed && !isStale(o));

  return (
    <>
      <Hero
        opportunity={open.find((o) => o.type === "order") ?? open[0]}
        family={families.find((f) => f.id === "alrayhan-hospitality") ?? families[0]}
        talent={talents.find((t) => t.available) ?? talents[0]}
      />
      <Paths
        counts={{
          talents: stats.talents,
          families: stats.families,
          opportunities: stats.opportunities,
        }}
      />
      <LatestOpportunities items={open.slice(0, 6)} total={stats.opportunities} />
      <FamiliesShowcase items={families.slice(0, 3)} total={stats.families} />
      <CorporateBand />
      <TalentsShowcase items={talents.slice(0, 6)} total={stats.talents} />
      <Stories
        families={pick(families, ["khoos-wa-teen", "farasan-bukhoor"])}
        talents={pick(talents, ["mohammed-alfaifi"])}
      />
      <Areas counts={stats.byArea} />
      <HowItWorks />
      <FinalCta />
    </>
  );
}
