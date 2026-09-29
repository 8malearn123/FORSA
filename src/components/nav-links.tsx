"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Nuqta } from "./brand";
import { cn } from "./cn";
import { PendingHint } from "./pending-hint";

export function NavLinks({ items }: { items: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center rounded-xl px-3.5 py-2 text-[0.95rem] font-medium transition-colors",
                active ? "text-clay-700" : "text-ink-700 hover:bg-ink-50 hover:text-ink-900",
              )}
            >
              {item.label}
              <PendingHint />
              {active ? (
                <Nuqta className="absolute -bottom-1.5 left-1/2 size-2 -translate-x-1/2 text-clay-600" />
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
