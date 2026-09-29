"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowLeft, Menu, Plus, X } from "lucide-react";

import { Logo, Nuqta, Sparks } from "./brand";
import { buttonClass } from "./ui";

export function MobileNav({ items }: { items: readonly { href: string; label: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="grid size-10 place-items-center rounded-xl text-ink-800 ring-1 ring-ink-200 transition-colors ring-inset hover:bg-white lg:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="size-5" />
      </button>

      <dialog
        ref={dialog}
        aria-label="القائمة الرئيسية"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-sand-100 p-0 text-ink-900 backdrop:bg-ink-950/40 open:animate-rise"
        onClick={(e) => {
          // تُغلق عند الضغط خارجها أو على أي رابط (حتى رابط الصفحة الحالية)
          const target = e.target as HTMLElement;
          if (target === dialog.current || target.closest("a")) dialog.current?.close();
        }}
      >
        <div className="flex h-full flex-col px-5 pt-4 pb-8">
          <div className="flex items-center justify-between">
            <Logo className="w-[70px]" />
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="grid size-10 place-items-center rounded-xl ring-1 ring-ink-200 ring-inset"
              aria-label="إغلاق القائمة"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav aria-label="القائمة" className="mt-10">
            <ul className="flex flex-col gap-1">
              {[{ href: "/", label: "الرئيسية" }, ...items].map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between rounded-2xl px-4 py-4 font-display text-2xl font-bold transition-colors hover:bg-white"
                    >
                      <span className="flex items-center gap-3">
                        {active ? <Nuqta className="size-3 text-clay-600" /> : null}
                        {item.label}
                      </span>
                      <ArrowLeft className="size-5 text-ink-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="relative mt-auto overflow-hidden rounded-[28px] rounded-ee-[8px] bg-clay-600 p-6 text-white">
            <Sparks className="absolute -top-2 left-4 w-14 text-sage-300" />
            <p className="font-display text-2xl font-extrabold">عندك مهارة أو منتج؟</p>
            <p className="mt-1 text-clay-100">اعرضه لأهل جازان مجاناً في دقائق.</p>
            <Link href="/join" className={buttonClass({ variant: "secondary", size: "md" }) + " mt-5 w-full"}>
              <Plus className="size-4" strokeWidth={2.5} />
              أضف فرصتك
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
