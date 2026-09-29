import Image from "next/image";

import { initialOf } from "@/lib/text";

import { cn } from "./cn";

/** الشعار كما هو دون أي تعديل — يُعرض دائماً على خلفية فاتحة */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/forsa-logo.svg"
      alt="فرصة"
      width={1219}
      height={736}
      priority={priority}
      unoptimized
      className={cn("h-auto select-none", className)}
    />
  );
}

/**
 * «النقطة»: المعيّن ذو الزاوية المستديرة كما يظهر في نقاط الشعار.
 * نستخدمها كعلامة، وفاصل، ومؤشر، وزخرفة.
 */
export function Nuqta({
  className,
  rotate = 0,
  title,
}: {
  className?: string;
  rotate?: number;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 115 120"
      className={cn("shrink-0", className)}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      fill="currentColor"
    >
      {title ? <title>{title}</title> : null}
      <path d="M107.78 71.21C114.83 64.16 114.83 56.46 107.78 48.11L59.66 0 0 59.66l59.66 59.66z" />
    </svg>
  );
}

/** الشرارات الثلاث الخضراء من الشعار — رمز الفرصة حين تلمع */
export function Sparks({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 248 255"
      className={cn("shrink-0 text-sage-400", animated && "animate-spark", className)}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M118.91 17.68 247.4 63.64l-97.14 92.4 27.33-78.18z" />
      <path d="M0 126.23 51.84 0l87.82 101.3-76.83-30.91z" />
      <path d="M.46 193.22 116.39 121.22l11.91 133.53-44.2-70.03z" />
    </svg>
  );
}

const TONES = {
  clay: { tile: "bg-clay-100 text-clay-700", dot: "text-clay-600" },
  sage: { tile: "bg-sage-100 text-sage-800", dot: "text-sage-500" },
  sand: { tile: "bg-sand-300 text-clay-800", dot: "text-clay-600" },
  ink: { tile: "bg-ink-800 text-sand-100", dot: "text-sage-300" },
} as const;

export type Tone = keyof typeof TONES;

export function toneFor(seed: string): Tone {
  const tones = Object.keys(TONES) as Tone[];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tones[h % tones.length];
}

const SIZES = {
  sm: { box: "size-11 rounded-[14px] rounded-ss-[5px] text-xl", dot: "size-2.5 -top-1 start-1.5" },
  md: { box: "size-14 rounded-[18px] rounded-ss-[6px] text-2xl", dot: "size-3 -top-1.5 start-2" },
  lg: { box: "size-24 rounded-[28px] rounded-ss-[9px] text-5xl", dot: "size-5 -top-2.5 start-3" },
  xl: { box: "size-32 rounded-[36px] rounded-ss-[11px] text-6xl", dot: "size-6 -top-3 start-4" },
} as const;

/**
 * صورة رمزية بحرف الاسم داخل شكل «الورقة»، تعلوه نقطة الشعار —
 * كل شخص حرف، و«فرصة» هي النقطة التي تكمله.
 * لا نطلب صوراً شخصية؛ هذا يناسب خصوصية المجتمع.
 */
export function NuqtaAvatar({
  name,
  seed,
  tone,
  size = "md",
  className,
}: {
  name: string;
  seed?: string;
  tone?: Tone;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const t = TONES[tone ?? toneFor(seed ?? name)];
  const s = SIZES[size];
  return (
    <span className={cn("relative inline-grid shrink-0", className)} aria-hidden="true">
      <span className={cn("grid place-items-center font-display leading-none font-black", s.box, t.tile)}>
        <span className="translate-y-[0.06em]">{initialOf(name)}</span>
      </span>
      <Nuqta className={cn("absolute", s.dot, t.dot)} rotate={-90} />
    </span>
  );
}

/** شريط زخرفي من النقاط والشرارات — إشارة هادئة لفنون تهامة وعسير */
export function OrnamentBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-3 w-full opacity-90", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='12' viewBox='0 0 48 12'%3E%3Cpath d='M6 1l5 5-5 5-5-5z' fill='%23a63f2b'/%3E%3Cpath d='M18 10l5-8 5 8z' fill='%2372a98f'/%3E%3Cpath d='M30 1l5 5-5 5-5-5z' fill='%23dec6a2'/%3E%3Cpath d='M42 10l5-8 5 8z' fill='%23a63f2b' fill-opacity='.35'/%3E%3C/svg%3E\")",
        backgroundRepeat: "repeat-x",
        backgroundSize: "48px 12px",
      }}
    />
  );
}
