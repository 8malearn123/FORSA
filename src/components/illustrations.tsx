import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, Check, CheckCheck, MapPin, Search } from "lucide-react";

import { initialOf } from "@/lib/text";

import { Sparks } from "./brand";
import { cn } from "./cn";
import { WhatsApp } from "./icons";

/*
 * رسوم توضيحية مبنية من واجهة «فرصة» نفسها، تحكي قصة طلب واحد:
 * أسرة تنشر صفحتها، فيجدها من يبحث، ثم يتفقون مباشرة في واتساب.
 * هي زخرفة فقط (aria-hidden)؛ النص المجاور لكل رسم يشرح الخطوة.
 */

const FAMILY = {
  name: "مخبوزات أم فهد",
  area: "صبيا",
  image: "/images/products/maamoul.jpg",
};

const SCENE = "relative h-56 overflow-hidden rounded-[24px] rounded-ee-[7px]";

/** الخطوة الأولى: صفحة الأسرة تُنشر */
export function PostScene() {
  return (
    <div aria-hidden="true" className={cn(SCENE, "grid place-items-center bg-clay-50")}>
      <div className="relative">
        <div className="w-52 -rotate-2 overflow-hidden rounded-[20px] rounded-ee-[6px] bg-white shadow-lift ring-1 ring-ink-100">
          <div className="relative h-24 bg-sand-200">
            <Image src={FAMILY.image} alt="" fill sizes="208px" className="object-cover" />
          </div>
          <div className="px-3.5 py-3">
            <p className="font-display text-sm font-bold text-ink-900">{FAMILY.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
              <MapPin className="size-3 text-clay-500" />
              {FAMILY.area} · حلويات ومخبوزات
            </p>
          </div>
        </div>
        <span className="absolute -start-5 -top-3 inline-flex items-center gap-1 rounded-full bg-sage-700 px-2.5 py-1 text-xs font-semibold text-white shadow-lift">
          <Check className="size-3.5" strokeWidth={3} />
          تم النشر
        </span>
        <Sparks className="absolute -end-6 -top-8 w-9" animated />
      </div>
    </div>
  );
}

/** الخطوة الثانية: من يبحث عن «معمول» في صبيا يجدها */
export function SearchScene() {
  return (
    <div aria-hidden="true" className={cn(SCENE, "flex flex-col justify-center gap-2.5 bg-sage-50 px-5")}>
      <div className="flex items-center gap-2 rounded-2xl rounded-ee-[6px] bg-white px-3.5 py-2.5 text-sm shadow-soft ring-1 ring-ink-100">
        <Search className="size-4 shrink-0 text-clay-600" />
        <span className="text-ink-900">معمول</span>
        <span className="-ms-1 h-4 w-px animate-pulse bg-clay-600" />
        <span className="ms-auto flex items-center gap-1 border-s border-ink-100 ps-2.5 text-xs text-ink-600">
          <MapPin className="size-3.5 text-sage-600" />
          {FAMILY.area}
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl rounded-ee-[6px] bg-white p-2 pe-3.5 shadow-lift ring-2 ring-clay-200">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-[14px] rounded-ss-[5px] bg-sand-200">
          <Image src={FAMILY.image} alt="" fill sizes="44px" className="object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-sm font-bold text-ink-900">{FAMILY.name}</span>
          <span className="block text-xs text-ink-500">{FAMILY.area} · تستقبل الطلبات</span>
        </span>
        <ArrowLeft className="ms-auto size-4 shrink-0 text-clay-600" />
      </div>
      <div className="flex items-center gap-3 rounded-2xl rounded-ee-[6px] bg-white/60 p-2 ring-1 ring-ink-100">
        <span className="size-11 shrink-0 rounded-[14px] rounded-ss-[5px] bg-sage-100" />
        <span className="flex flex-col gap-1.5">
          <span className="h-2 w-24 rounded-full bg-ink-100" />
          <span className="h-2 w-14 rounded-full bg-ink-100" />
        </span>
      </div>
    </div>
  );
}

/** الخطوة الثالثة: أول رسالة بينهم، مباشرة وبلا وسيط */
export function ChatScene() {
  return (
    <div
      aria-hidden="true"
      className={cn(SCENE, "flex flex-col justify-center gap-2 bg-sand-200 bg-nuqta-grid px-4 text-[0.8rem]")}
    >
      <ChatHeader />
      <Bubble out time="٩:٤١ م">
        السلام عليكم، شفت صفحتكم في «فرصة». يمديكم ٥٠&nbsp;حبة معمول للخميس؟
      </Bubble>
      <Bubble time="٩:٤٣ م">وعليكم السلام، حيّاك الله! يمدينا إن شاء الله</Bubble>
    </div>
  );
}

const TERMS = [
  ["الكمية", "٥٠\u00A0حبة معمول"],
  ["السعر", "١٢٥ ريال"],
  ["الموعد", "الخميس، ٤ العصر"],
  ["الدفع", "عند الاستلام"],
];

/** مثال لاتفاق واضح: الكمية والسعر والموعد وطريقة الدفع في رسالة واحدة */
export function AgreementScene({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col gap-2.5 rounded-[28px] rounded-ee-[8px] bg-sand-200 bg-nuqta-grid p-4 text-sm",
        className,
      )}
    >
      <ChatHeader />
      <Bubble time="١٠:٠٢ م">
        <span className="font-semibold">نثبّت الطلب:</span>
        <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {TERMS.map(([term, value]) => (
            <Fragment key={term}>
              <dt className="text-clay-700">{term}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
      </Bubble>
      <Bubble out time="١٠:٠٥ م">
        تمام، متفقين. الله يعطيكم العافية
      </Bubble>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/90 p-1.5 pe-3 shadow-soft">
      <span className="grid size-8 place-items-center rounded-[11px] rounded-ss-[4px] bg-clay-100 font-display text-sm font-black text-clay-700">
        {initialOf(FAMILY.name)}
      </span>
      <span className="font-display font-bold text-ink-900">{FAMILY.name}</span>
      <WhatsApp className="ms-auto size-[1.3em] text-sage-600" />
    </div>
  );
}

/** فقاعة محادثة: زاوية حادة واحدة مثل شكل «الورقة»، والمُرسَلة باليسار كما في واتساب العربي */
function Bubble({ out, time, children }: { out?: boolean; time: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-[88%] rounded-2xl px-3 pt-2 pb-1.5 leading-relaxed shadow-soft",
        out
          ? "self-end rounded-se-[4px] bg-sage-100 text-sage-950"
          : "self-start rounded-ss-[4px] bg-white text-ink-900",
      )}
    >
      {children}
      <span className="mt-1 flex items-center justify-end gap-1 text-[0.75em] leading-none text-ink-400">
        {time}
        {out ? <CheckCheck className="size-[1.25em] text-sage-600" /> : null}
      </span>
    </div>
  );
}
