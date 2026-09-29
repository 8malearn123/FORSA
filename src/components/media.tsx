import Image from "next/image";

import type { CategoryIcon as CategoryIconKey } from "@/lib/taxonomy";

import { Nuqta } from "./brand";
import { cn } from "./cn";
import { CategoryIcon } from "./icons";

/**
 * صورة بإطار «الورقة»، وإن لم توجد صورة نعرض غلافاً من ألوان الهوية
 * مع رمز التصنيف بدلاً من مربع فارغ.
 */
export function CoverImage({
  src,
  alt,
  icon,
  sizes,
  className,
  priority,
  tone = "clay",
}: {
  src?: string;
  alt: string;
  icon?: CategoryIconKey;
  sizes: string;
  className?: string;
  priority?: boolean;
  tone?: "clay" | "sage" | "sand";
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-sand-200", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={src.startsWith("/media/")}
          className="object-cover"
        />
      </div>
    );
  }
  const palette = {
    clay: "bg-clay-100 text-clay-600",
    sage: "bg-sage-100 text-sage-700",
    sand: "bg-sand-200 text-clay-700",
  }[tone];
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative grid place-items-center overflow-hidden bg-nuqta-grid", palette, className)}
    >
      <Nuqta className="absolute -bottom-8 -left-6 size-32 opacity-[0.12]" />
      <Nuqta className="absolute -top-5 right-6 size-12 opacity-[0.1]" rotate={180} />
      {icon ? <CategoryIcon icon={icon} className="relative size-12" strokeWidth={1.5} /> : null}
    </div>
  );
}
