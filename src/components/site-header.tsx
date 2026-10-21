import Link from "next/link";
import { Plus, UserRound } from "lucide-react";

import { Logo } from "./brand";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { ButtonLink, Container } from "./ui";

export const NAV = [
  { href: "/opportunities", label: "الفرص" },
  { href: "/talents", label: "المواهب" },
  { href: "/families", label: "الأسر المنتجة" },
  { href: "/about", label: "عن فرصة" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-sand-100/85 backdrop-blur-md supports-[backdrop-filter]:bg-sand-100/75">
      <Container className="flex h-[72px] items-center gap-6">
        <Link href="/" className="shrink-0 rounded-lg" aria-label="فرصة — الصفحة الرئيسية">
          <Logo priority className="w-[74px] sm:w-[86px]" />
        </Link>

        <nav aria-label="التنقل الرئيسي" className="hidden flex-1 lg:block">
          <NavLinks items={NAV} />
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {/* رابط ثابت لكل الزوار: من لم يدخل تنقله صفحة الحساب إلى الدخول */}
          <Link
            href="/account"
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-[0.95rem] font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900 lg:inline-flex"
          >
            <UserRound className="size-4" />
            حسابي
          </Link>
          <ButtonLink href="/join" size="sm">
            <Plus className="size-4" strokeWidth={2.5} />
            أضف فرصتك
          </ButtonLink>
          <MobileNav items={[...NAV, { href: "/account", label: "حسابي" }]} />
        </div>
      </Container>
    </header>
  );
}
