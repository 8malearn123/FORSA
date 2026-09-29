import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { coverOf } from "@/lib/listing";
import { governorateName } from "@/lib/taxonomy";
import type { Family, Talent } from "@/lib/types";

import { NuqtaAvatar, Sparks } from "../brand";
import { cn } from "../cn";
import { CoverImage } from "../media";
import { Container, SectionHeading } from "../ui";

/** مقتطف طبيعي: نجمع المقاطع حتى يكتمل المعنى دون أن يطول */
function excerpt(text: string, min = 55, max = 120) {
  const sentence = text.split(".")[0];
  const clauses = sentence.split("،");
  let out = "";
  for (const clause of clauses) {
    const next = out ? `${out}،${clause}` : clause;
    if (next.length > max && out) break;
    out = next;
    if (out.length >= min) break;
  }
  return out.trim();
}

/** حكايات أصحاب الإعلانات بكلماتهم — الوجه الإنساني لـ«فرصة» */
export function Stories({ families, talents }: { families: Family[]; talents: Talent[] }) {
  const [lead, second] = families;
  const [person] = talents;
  if (!lead || !second || !person) return null;

  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="حكايات من جازان"
          title="وراء كل مهارة وكل منتج… حكاية"
          description="«فرصة» ليست دليلاً للأسماء، بل مساحة لناس حقيقيين يصنعون شيئاً جميلاً ويستحقون أن يُرى."
        />
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Link
            href={`/families/${lead.id}`}
            className="group relative grid overflow-hidden rounded-[36px] rounded-ee-[10px] bg-clay-600 text-white sm:grid-cols-[1fr_1.1fr]"
          >
            <CoverImage
              src={coverOf(lead)}
              alt={lead.name}
              sizes="(min-width: 1024px) 360px, 100vw"
              className="min-h-64 sm:min-h-full"
            />
            <div className="relative flex flex-col p-8 md:p-10">
              <Sparks className="w-10 text-sage-300" />
              <blockquote className="mt-5 font-display text-2xl leading-[1.7] font-bold md:text-[1.7rem]">
                «{excerpt(lead.story)}»
              </blockquote>
              <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                <div>
                  <p className="font-display text-xl font-extrabold">{lead.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-clay-100">
                    <MapPin className="size-4" />
                    {governorateName(lead.governorate)} · {lead.tagline}
                  </p>
                </div>
                <ArrowLeft className="size-6 shrink-0 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
            <StoryCard
              href={`/families/${second.id}`}
              quote={excerpt(second.story)}
              name={second.name}
              meta={`${governorateName(second.governorate)} · ${second.tagline}`}
              tone="sand"
              image={coverOf(second)}
            />
            <StoryCard
              href={`/talents/${person.id}`}
              quote={excerpt(person.bio)}
              name={person.name}
              meta={`${governorateName(person.governorate)} · ${person.headline}`}
              tone="sage"
              avatar={{ name: person.name, seed: person.id }}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function StoryCard({
  href,
  quote,
  name,
  meta,
  tone,
  image,
  avatar,
}: {
  href: string;
  quote: string;
  name: string;
  meta: string;
  tone: "sand" | "sage";
  image?: string;
  avatar?: { name: string; seed: string };
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-[32px] rounded-ee-[9px] p-7 transition-transform hover:-translate-y-1",
        tone === "sand" ? "bg-sand-200" : "bg-sage-100",
      )}
    >
      <blockquote className="font-display text-xl leading-[1.75] font-bold text-ink-900">
        «{quote}»
      </blockquote>
      <div className="mt-auto flex items-center gap-3 pt-6">
        {avatar ? (
          <NuqtaAvatar name={avatar.name} seed={avatar.seed} size="sm" />
        ) : (
          <CoverImage src={image} alt="" sizes="44px" className="size-11 rounded-[14px] rounded-ss-[5px]" />
        )}
        <div className="min-w-0">
          <p className="font-display font-extrabold text-ink-900">{name}</p>
          <p className="truncate text-sm text-ink-600">{meta}</p>
        </div>
        <ArrowLeft className="ms-auto size-5 shrink-0 text-ink-500 transition-transform group-hover:-translate-x-1" />
      </div>
    </Link>
  );
}
