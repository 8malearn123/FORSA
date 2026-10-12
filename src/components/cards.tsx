import Link from "next/link";
import { Building2, CalendarDays, Landmark, MapPin, UserRound, Wallet, Wifi } from "lucide-react";

import { COUNT, countLabel, timeAgo } from "@/lib/format";
import {
  getCategory,
  governorateName,
  opportunityTypeShort,
  seekingName,
  type OpportunityType,
  type PosterType,
} from "@/lib/taxonomy";
import { coverOf, freshSince, isStale } from "@/lib/listing";
import type { Family, Opportunity, Talent } from "@/lib/types";

import { NuqtaAvatar } from "./brand";
import { cn } from "./cn";
import { CategoryIcon } from "./icons";
import { CoverImage } from "./media";
import { PendingHint } from "./pending-hint";
import { Badge } from "./ui";

const CARD =
  "reveal group relative flex flex-col bg-white ring-1 ring-ink-100 shadow-soft transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift hover:ring-ink-200";

export const availableLabel = (t: Pick<Talent, "gender">) =>
  t.gender === "f" ? "متاحة للعمل" : "متاح للعمل";

export function TalentCard({ talent, className }: { talent: Talent; className?: string }) {
  const category = getCategory(talent.category);
  return (
    <Link
      href={`/talents/${talent.id}`}
      className={cn(CARD, "rounded-[28px] rounded-ee-[8px] p-5", className)}
    >
      <div className="flex items-start gap-4">
        <NuqtaAvatar name={talent.name} seed={talent.id} className="mt-1" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg leading-snug font-bold text-ink-900 group-hover:text-clay-700">
            {talent.name}
          </h3>
          <p className="mt-0.5 text-[0.95rem] leading-relaxed text-ink-600">{talent.headline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {talent.skills.slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-lg bg-sand-100 px-2.5 py-1 text-[0.8rem] text-ink-700">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-5 text-sm text-ink-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-4 text-clay-500" />
          {governorateName(talent.governorate)}
        </span>
        {talent.remote ? (
          <span className="inline-flex items-center gap-1">
            <Wifi className="size-4 text-sage-600" />
            عن بُعد
          </span>
        ) : null}
        <span className="ms-auto flex gap-1.5">
          {talent.available ? (
            <Badge tone="sage" dot>
              {availableLabel(talent)}
            </Badge>
          ) : (
            <Badge tone="sand">{category?.short}</Badge>
          )}
        </span>
      </div>
      <p className="mt-3 border-t border-ink-100 pt-3 text-[0.8rem] text-ink-500">
        {talent.gender === "f" ? "تبحث عن" : "يبحث عن"}: {talent.seeking.map(seekingName).join("، ")}
      </p>
      <PendingHint inset />
    </Link>
  );
}

export function FamilyCard({
  family,
  className,
  priority,
}: {
  family: Family;
  className?: string;
  priority?: boolean;
}) {
  const primary = getCategory(family.categories[0]);
  return (
    <Link
      href={`/families/${family.id}`}
      className={cn(CARD, "overflow-hidden rounded-[28px] rounded-ee-[8px]", className)}
    >
      <div className="relative">
        <CoverImage
          src={coverOf(family)}
          alt={family.name}
          icon={primary?.icon}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="aspect-[4/3] transition duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-800 backdrop-blur">
          {countLabel(family.products.length, COUNT.product)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1 text-sm text-ink-500">
          <MapPin className="size-4 text-clay-500" />
          {governorateName(family.governorate)}
          <span className="mx-1 text-ink-300">·</span>
          {family.categories.map((c) => getCategory(c)?.short).join("، ")}
        </p>
        <h3 className="mt-2 font-display text-xl font-bold text-ink-900 group-hover:text-clay-700">
          {family.name}
        </h3>
        <p className="mt-1 leading-relaxed text-ink-600">{family.tagline}</p>
        {family.events ? (
          <div className="mt-auto pt-4">
            <Badge tone="clay" dot>
              تستقبل طلبات المناسبات والشركات
            </Badge>
          </div>
        ) : null}
      </div>
      <PendingHint inset />
    </Link>
  );
}

export const TYPE_TONE: Record<OpportunityType, "ink" | "sage" | "clay" | "sand" | "white"> = {
  job: "ink",
  task: "sage",
  order: "clay",
  training: "sand",
  volunteer: "white",
};

export function PosterIcon({ type, className }: { type: PosterType; className?: string }) {
  const Icon = type === "company" ? Building2 : type === "organization" ? Landmark : UserRound;
  return <Icon className={className} aria-hidden="true" />;
}

/** لون مربع المجال يتبع نوع الفرصة، فتتميز البطاقات بالنظر قبل القراءة */
const TILE_TONE: Record<OpportunityType, string> = {
  job: "bg-ink-900 text-sand-50",
  task: "bg-sage-100 text-sage-700",
  order: "bg-clay-100 text-clay-700",
  training: "bg-sand-300 text-clay-800",
  volunteer: "bg-sage-50 text-sage-700 ring-1 ring-sage-200 ring-inset",
};

export function OpportunityCard({
  opportunity: o,
  className,
}: {
  opportunity: Opportunity;
  className?: string;
}) {
  const muted = o.closed || isStale(o);
  const category = getCategory(o.category);
  return (
    <Link
      href={`/opportunities/${o.id}`}
      className={cn(
        CARD,
        "rounded-[26px] rounded-ee-[8px] p-5",
        muted && "bg-sand-50 shadow-none",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <span
          title={category?.name}
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-[18px] rounded-ss-[6px]",
            TILE_TONE[o.type],
            muted && "opacity-60",
          )}
        >
          {category ? <CategoryIcon icon={category.icon} className="size-7" strokeWidth={1.6} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone={TYPE_TONE[o.type]}>{opportunityTypeShort(o.type)}</Badge>
            {o.closed ? <Badge tone="sand">اكتملت</Badge> : null}
            {isStale(o) ? <Badge tone="sand">قد تكون انتهت</Badge> : null}
            <span className="ms-auto text-xs text-ink-500">{timeAgo(freshSince(o))}</span>
          </div>
          <h3 className="mt-2.5 font-display text-lg leading-snug font-bold text-ink-900 group-hover:text-clay-700">
            {o.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-600">
            <PosterIcon type={o.poster.type} className="size-4 text-ink-400" />
            {o.poster.name}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 pt-4 text-sm text-ink-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-4 text-clay-500" />
          {governorateName(o.governorate)}
          {o.remote ? " · عن بُعد" : ""}
        </span>
        {o.when ? (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4 text-ink-400" />
            {o.when}
          </span>
        ) : null}
        {o.budget ? (
          <span className="inline-flex items-center gap-1">
            <Wallet className="size-4 text-ink-400" />
            {o.budget}
          </span>
        ) : null}
      </div>
      <PendingHint inset />
    </Link>
  );
}
