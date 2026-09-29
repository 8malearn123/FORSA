import Image from "next/image";
import Link from "next/link";
import { Building2, HandHeart, MapPin, Search } from "lucide-react";

import { timeAgo } from "@/lib/format";
import { freshSince } from "@/lib/listing";
import { getCategory, governorateName, opportunityTypeShort } from "@/lib/taxonomy";
import type { Family, Opportunity, Talent } from "@/lib/types";

import { TYPE_TONE, availableLabel } from "../cards";
import { Nuqta, NuqtaAvatar, Sparks } from "../brand";
import { Dallah, WhatsApp } from "../icons";
import { SearchBar } from "../search-bar";
import { Badge, Container, Spark } from "../ui";

const QUICK_SEARCHES = [
  "ضيافة لفعالية",
  "حلويات منزلية",
  "مصوّر",
  "معلمة خصوصي",
  "مصمم شعار",
  "صيانة مكيفات",
];

export function Hero({
  opportunity,
  family,
  talent,
}: {
  opportunity?: Opportunity;
  family?: Family;
  talent?: Talent;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-nuqta-grid [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-60"
      />
      <Container className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-14 pt-12 pb-16 md:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 lg:pt-16 lg:pb-20">
        <div className="min-w-0 animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-sage-800 ring-1 ring-sage-200">
            <Nuqta className="size-2.5 text-sage-500" />
            مبادرة مجتمعية مجانية لأهل منطقة جازان
          </p>

          <h1 className="mt-6 text-[3.1rem] leading-[1.2] font-black text-ink-900 sm:text-6xl lg:text-[4.6rem]">
            جازان مليانة <Spark>فرص</Spark>
            <span className="mt-2 block text-[0.52em] leading-[1.45] font-extrabold text-ink-700">
              وفرصتك أقرب مما تتوقع
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-[1.9] text-ink-600">
            «فرصة» مساحة تجمع أصحاب المهارات والأسر المنتجة بكل من يبحث عنهم في جازان. اعرض ما تتقنه، واكتشف
            ما تحتاجه، وتواصلوا مباشرة: بلا وسيط ولا عمولة.
          </p>

          <SearchBar className="mt-9 max-w-2xl" />

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-500">جرّب:</span>
            {QUICK_SEARCHES.map((q) => (
              <Link
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="rounded-full bg-white/70 px-3 py-1.5 text-sm text-ink-700 ring-1 ring-ink-100 transition-colors hover:bg-white hover:text-clay-700 hover:ring-clay-200"
              >
                {q}
              </Link>
            ))}
          </div>

          <HeroStrip opportunity={opportunity} family={family} talent={talent} />
        </div>

        <HeroCollage opportunity={opportunity} family={family} talent={talent} />
      </Container>
    </section>
  );
}

/** على الجوال: شريط أفقي بنفس الفكرة بدل اللوحة الكبيرة */
function HeroStrip({
  opportunity,
  family,
  talent,
}: {
  opportunity?: Opportunity;
  family?: Family;
  talent?: Talent;
}) {
  if (!opportunity || !family || !talent) return null;
  const product = family.products.find((p) => p.image);
  const card =
    "w-[250px] shrink-0 snap-start rounded-[22px] rounded-ee-[7px] bg-white p-4 shadow-soft ring-1 ring-ink-100";
  return (
    <div
      className="-mx-5 mt-8 no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:hidden"
      aria-label="أمثلة من فرصة"
    >
      <Link href={`/opportunities/${opportunity.id}`} className={card}>
        <div className="flex items-center gap-2">
          <Badge tone={TYPE_TONE[opportunity.type]}>{opportunityTypeShort(opportunity.type)}</Badge>
          <span className="ms-auto text-xs text-ink-500">{timeAgo(freshSince(opportunity))}</span>
        </div>
        <p className="mt-2.5 font-display leading-snug font-bold text-ink-900">{opportunity.title}</p>
      </Link>
      <Link href={`/families/${family.id}`} className={`${card} flex items-center gap-3`}>
        <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl rounded-ss-[6px] bg-sand-200">
          {product?.image ? (
            <Image src={product.image} alt="" fill sizes="64px" className="object-cover" />
          ) : null}
        </span>
        <span>
          <span className="block font-display font-bold text-ink-900">{family.name}</span>
          <span className="block text-sm text-ink-500">{governorateName(family.governorate)}</span>
        </span>
      </Link>
      <Link href={`/talents/${talent.id}`} className={`${card} flex items-center gap-3`}>
        <NuqtaAvatar name={talent.name} seed={talent.id} size="sm" />
        <span>
          <span className="block font-display font-bold text-ink-900">{talent.name}</span>
          <span className="block text-sm text-ink-600">{talent.headline}</span>
        </span>
      </Link>
    </div>
  );
}

/** قبل وجود إعلانات: رسم يوضح الأطراف الثلاثة وهي تلتقي حول «فرصة» */
function HeroIllustration() {
  const sides = [
    { icon: HandHeart, label: "مهارة", tile: "bg-sage-700 text-white", pos: "top-6 right-6" },
    { icon: Dallah, label: "منتج بيتي", tile: "bg-clay-600 text-white", pos: "top-[200px] left-2" },
    { icon: Search, label: "احتياج", tile: "bg-ink-900 text-sand-50", pos: "right-16 bottom-8" },
  ];
  return (
    <div className="relative mx-auto hidden h-[520px] w-full max-w-[500px] md:block" aria-hidden="true">
      <Nuqta
        className="absolute top-1/2 left-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 text-clay-100"
        rotate={-90}
      />
      <svg className="absolute inset-0 size-full" viewBox="0 0 500 520" fill="none">
        <path
          d="M400 90 C 330 150, 300 210, 255 250"
          stroke="#72a98f"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
        <path
          d="M95 250 C 150 250, 200 255, 245 262"
          stroke="#a63f2b"
          strokeOpacity=".5"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
        <path
          d="M330 440 C 300 380, 280 320, 258 272"
          stroke="#241b15"
          strokeOpacity=".35"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 grid size-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[36px] rounded-ee-[10px] bg-white shadow-lift">
        <Sparks className="w-14" animated />
      </div>
      {sides.map((side) => (
        <div
          key={side.label}
          className={`absolute ${side.pos} flex animate-float items-center gap-3 rounded-[22px] rounded-ee-[7px] bg-white p-3 pe-5 shadow-lift ring-1 ring-ink-100`}
        >
          <span className={`grid size-12 place-items-center rounded-[16px] rounded-ss-[5px] ${side.tile}`}>
            <side.icon className="size-6" strokeWidth={1.75} />
          </span>
          <span className="font-display text-lg font-bold text-ink-900">{side.label}</span>
        </div>
      ))}
    </div>
  );
}

/** لوحة توضح الفكرة: طلب من شركة، أسرة منتجة، وموهبة — وخيوط تواصل بينهم */
function HeroCollage({
  opportunity,
  family,
  talent,
}: {
  opportunity?: Opportunity;
  family?: Family;
  talent?: Talent;
}) {
  if (!opportunity || !family || !talent) return <HeroIllustration />;
  const product = family.products.find((p) => p.image);
  return (
    <div
      className="relative mx-auto hidden h-[560px] w-full max-w-[540px] md:block"
      aria-label="أمثلة من فرصة"
    >
      {/* الخلفية: نقطة الشعار بحجم كبير */}
      <Nuqta
        className="absolute top-1/2 left-1/2 size-[440px] -translate-x-1/2 -translate-y-1/2 text-clay-100"
        rotate={-90}
      />
      <Nuqta className="absolute top-8 left-10 size-10 text-sage-200" rotate={-90} />
      <Sparks className="absolute top-[38%] right-[46%] w-16" animated />

      {/* خيوط التواصل */}
      <svg className="absolute inset-0 size-full" viewBox="0 0 540 560" fill="none" aria-hidden="true">
        <path
          d="M360 150 C 250 170, 170 190, 150 270"
          stroke="#a63f2b"
          strokeOpacity=".45"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
        <path
          d="M205 532 C 250 545, 290 530, 310 500"
          stroke="#72a98f"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      </svg>

      {/* طلب من شركة */}
      <Link
        href={`/opportunities/${opportunity.id}`}
        className="absolute top-2 right-0 w-[300px] animate-float rounded-[24px] rounded-ee-[7px] bg-white p-5 shadow-lift ring-1 ring-ink-100 transition-transform hover:scale-[1.02]"
      >
        <div className="flex items-center gap-2">
          <Badge tone={TYPE_TONE[opportunity.type]}>{opportunityTypeShort(opportunity.type)}</Badge>
          <span className="ms-auto text-xs text-ink-500">{timeAgo(freshSince(opportunity))}</span>
        </div>
        <p className="mt-3 font-display text-lg leading-snug font-bold text-ink-900">{opportunity.title}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
          <Building2 className="size-4 text-ink-400" />
          {opportunity.poster.name}
        </p>
      </Link>

      {/* أسرة منتجة */}
      <Link
        href={`/families/${family.id}`}
        className="absolute top-[228px] left-0 w-[250px] animate-float-slow overflow-hidden rounded-[24px] rounded-ee-[7px] bg-white shadow-lift ring-1 ring-ink-100 transition-transform [animation-delay:-3s] hover:scale-[1.02]"
      >
        <div className="relative aspect-[4/3] bg-sand-200">
          {product?.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="250px"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        <div className="p-4">
          <p className="font-display font-bold text-ink-900">{family.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500">
            <MapPin className="size-3.5 text-clay-500" />
            {governorateName(family.governorate)}
            {product ? ` · ${product.name}` : null}
          </p>
        </div>
      </Link>

      {/* موهبة */}
      <Link
        href={`/talents/${talent.id}`}
        className="absolute right-4 bottom-10 w-[270px] animate-float rounded-[24px] rounded-ee-[7px] bg-white p-4 shadow-lift ring-1 ring-ink-100 transition-transform [animation-delay:-5s] hover:scale-[1.02]"
      >
        <div className="flex items-center gap-3">
          <NuqtaAvatar name={talent.name} seed={talent.id} size="sm" />
          <div>
            <p className="font-display font-bold text-ink-900">{talent.name}</p>
            <p className="text-sm text-ink-600">{talent.headline}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {talent.available ? (
            <Badge tone="sage" dot>
              {availableLabel(talent)}
            </Badge>
          ) : (
            <Badge tone="sand">{getCategory(talent.category)?.short}</Badge>
          )}
          <span className="text-xs text-ink-500">{governorateName(talent.governorate)}</span>
        </div>
      </Link>

      {/* لحظة التواصل */}
      <div className="absolute top-[512px] left-[28px] flex items-center gap-2 rounded-full bg-sage-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lift">
        <WhatsApp className="size-4" />
        تواصلوا مباشرة
      </div>
    </div>
  );
}
