import Link from "next/link";

import { demoEnabled } from "@/lib/demo";

import { Logo, Nuqta, OrnamentBand } from "./brand";
import { Container } from "./ui";

const COLUMNS = [
  {
    title: "اكتشف",
    links: [
      { href: "/opportunities", label: "الفرص المتاحة" },
      { href: "/talents", label: "المواهب وأصحاب المهارات" },
      { href: "/families", label: "الأسر المنتجة" },
      { href: "/families?events=1", label: "ضيافة للشركات والمناسبات" },
    ],
  },
  {
    title: "شارك",
    links: [
      { href: "/join/talent", label: "اعرض مهارتك" },
      { href: "/join/family", label: "اعرض منتجات أسرتك" },
      { href: "/join/opportunity", label: "انشر فرصة أو احتياجاً" },
      { href: "/join", label: "إعلاناتي على هذا الجهاز" },
    ],
  },
  {
    title: "فرصة",
    links: [
      { href: "/about", label: "عن المبادرة" },
      { href: "/about#safety", label: "نصائح التواصل الآمن" },
      { href: "/about#faq", label: "الأسئلة الشائعة" },
      { href: "/credits", label: "حقوق الصور" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-sand-200">
      <OrnamentBand />
      <Container className="grid gap-12 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo className="w-24" />
          <p className="mt-5 text-ink-700">
            مبادرة مجتمعية مجانية تجعل مواهب جازان وأسرها المنتجة وفرصها أوضح وأقرب. نحن مساحة للاكتشاف فقط:
            لا عمولات، ولا وسطاء، والاتفاق بينكم مباشرة.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-900">
              <Nuqta className="size-2 text-clay-600" />
              {col.title}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink-600 transition-colors hover:text-clay-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-sand-300">
        <Container className="flex flex-col gap-2 py-6 text-sm text-ink-500 md:flex-row md:items-center md:justify-between">
          <p>صُنعت بحب في جازان · ٢٠٢٦</p>
          {demoEnabled() ? <p>نسخة تجريبية أولى — الملفات المعروضة حالياً أمثلة توضيحية.</p> : null}
        </Container>
      </div>
    </footer>
  );
}
