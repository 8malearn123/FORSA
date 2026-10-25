import type { MetadataRoute } from "next";

import { listFamilies, listOpportunities, listTalents } from "@/lib/data";
import { freshSince } from "@/lib/listing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [talents, families, opportunities] = await Promise.all([
    listTalents(),
    listFamilies(),
    listOpportunities(),
  ]);
  const pages = ["", "/opportunities", "/talents", "/families", "/join", "/about"].map((path) => ({
    url: `${SITE}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  return [
    ...pages,
    ...talents.map((t) => ({ url: `${SITE}/talents/${t.id}`, lastModified: t.createdAt })),
    ...families.map((f) => ({ url: `${SITE}/families/${f.id}`, lastModified: f.createdAt })),
    ...opportunities
      .filter((o) => !o.closed)
      .map((o) => ({ url: `${SITE}/opportunities/${o.id}`, lastModified: freshSince(o) })),
  ];
}
