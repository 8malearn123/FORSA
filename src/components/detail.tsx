import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { Nuqta } from "./brand";
import { cn } from "./cn";
import { Container } from "./ui";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-clay-700"
    >
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      {children}
    </Link>
  );
}

export function DetailSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-ink-100 pt-8", className)}>
      <h2 className="flex items-center gap-2.5 text-2xl font-extrabold text-ink-900">
        <Nuqta className="size-3 text-clay-600" />
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function DetailLayout({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <Container className="grid grid-cols-[minmax(0,1fr)] gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
      <div className="flex min-w-0 flex-col gap-10">{main}</div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-4">{aside}</div>
      </aside>
    </Container>
  );
}

export function FactList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-ink-100 rounded-[24px] rounded-ee-[7px] bg-white px-5 ring-1 ring-ink-100">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 py-3.5 text-sm">
          <dt className="text-ink-500">{item.label}</dt>
          <dd className="text-end font-semibold text-ink-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
