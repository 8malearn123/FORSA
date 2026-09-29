import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Nuqta, Sparks } from "./brand";
import { cn } from "./cn";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

const BUTTON_VARIANTS = {
  primary: "bg-clay-600 text-white shadow-clay hover:bg-clay-700",
  sage: "bg-sage-700 text-white hover:bg-sage-800",
  dark: "bg-ink-900 text-sand-50 hover:bg-ink-800",
  secondary: "bg-white text-ink-900 ring-1 ring-ink-200 ring-inset hover:bg-sand-50 hover:ring-ink-300",
  soft: "bg-clay-50 text-clay-700 hover:bg-clay-100",
  ghost: "text-ink-700 hover:bg-ink-50",
} as const;

const BUTTON_SIZES = {
  sm: "h-9 px-3.5 text-sm rounded-xl rounded-ee-[5px]",
  md: "h-11 px-5 text-[0.95rem] rounded-2xl rounded-ee-[6px]",
  lg: "h-14 px-7 text-lg rounded-[20px] rounded-ee-[7px]",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

type ButtonStyle = {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const buttonClass = ({ variant = "primary", size = "md" }: ButtonStyle = {}) =>
  cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size]);

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & ButtonStyle) {
  return <button className={cn(buttonClass({ variant, size }), className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={cn(buttonClass({ variant, size }), className)} {...props} />;
}

const BADGE_TONES = {
  clay: "bg-clay-50 text-clay-700 ring-clay-200/70",
  sage: "bg-sage-50 text-sage-700 ring-sage-200",
  sand: "bg-sand-200 text-ink-700 ring-sand-300",
  ink: "bg-ink-900 text-sand-50 ring-ink-900",
  white: "bg-white text-ink-700 ring-ink-100",
} as const;

export function Badge({
  tone = "sand",
  className,
  children,
  dot,
}: {
  tone?: keyof typeof BADGE_TONES;
  className?: string;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-semibold ring-1 ring-inset",
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot ? <Nuqta className="size-2" /> : null}
      {children}
    </span>
  );
}

/** عنوان قسم: سطر تمهيدي صغير بعلامة النقطة، ثم عنوان كبير */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  align = "start",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-3xl reveal-rise", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-clay-700">
            <Nuqta className="size-2.5 text-clay-600" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl leading-[1.3] font-extrabold text-ink-900 md:text-[2.6rem]">{title}</h2>
        {description ? <p className="mt-3 text-body text-ink-600">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** كلمة مضيئة: تلوين بالطين مع شرارات الشعار فوقها */
export function Spark({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block text-clay-600", className)}>
      {children}
      <Sparks className="pointer-events-none absolute -top-[0.42em] -left-[0.5em] w-[0.62em]" animated />
    </span>
  );
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[28px] rounded-ee-[8px] border border-dashed border-ink-200 bg-white/60 px-6 py-16 text-center">
      <div className="relative mb-5">
        <Nuqta className="size-14 text-clay-100" />
        <Sparks className="absolute -top-3 -left-4 w-8" animated />
      </div>
      <h3 className="text-xl font-bold text-ink-900">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-ink-600">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
