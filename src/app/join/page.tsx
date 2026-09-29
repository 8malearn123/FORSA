import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleCheck, HandHeart, Megaphone } from "lucide-react";

import { PageHeader } from "@/components/browse";
import { Nuqta } from "@/components/brand";
import { cn } from "@/components/cn";
import { Dallah } from "@/components/icons";
import { MyListings } from "@/components/my-listings";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "انضم إلى فرصة",
  description: "اعرض مهارتك، أو منتجات أسرتك، أو انشر فرصة. مجاناً، وبدون حساب.",
};

const OPTIONS = [
  {
    href: "/join/talent",
    icon: HandHeart,
    tone: "sage",
    title: "عندي مهارة",
    body: "أنشئ ملفاً يعرض مهارتك وخبرتك وخدماتك، لتصلك الوظائف والمشاريع والدخل الإضافي.",
    time: "حوالي ٥ دقائق",
    cta: "أنشئ ملفي",
  },
  {
    href: "/join/family",
    icon: Dallah,
    tone: "clay",
    title: "نحن أسرة منتجة",
    body: "صفحة لأسرتكم بمنتجاتكم وحكايتكم، يكتشفها الأفراد والشركات ويطلبون منكم مباشرة.",
    time: "حوالي ٧ دقائق",
    cta: "أنشئ صفحة أسرتنا",
  },
  {
    href: "/join/opportunity",
    icon: Megaphone,
    tone: "ink",
    title: "أبحث عن أحد",
    body: "انشر وظيفة، أو مهمة، أو طلب ضيافة ومنتجات، أو تدريباً، أو فرصة تطوع.",
    time: "حوالي ٣ دقائق",
    cta: "انشر فرصة",
  },
] as const;

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const deleted = (await searchParams).deleted === "1";
  return (
    <>
      {deleted ? (
        <div className="bg-sage-100">
          <Container className="flex items-center gap-3 py-4 font-semibold text-sage-900">
            <CircleCheck className="size-5 text-sage-600" />
            تم حذف إعلانك وصوره نهائياً. نتمنى لك التوفيق، وحيّاك في أي وقت.
          </Container>
        </div>
      ) : null}
      <PageHeader
        eyebrow="انضم إلى فرصة"
        title="وش تحب تضيف اليوم؟"
        description="كل شيء على «فرصة» مجاني، وبدون حساب ولا كلمة مرور. اختر ما يناسبك وابدأ."
      />
      <Container className="flex flex-col gap-8 py-12">
        <MyListings />
        <ul className="grid gap-5 md:grid-cols-3">
          {OPTIONS.map((o) => {
            const dark = o.tone === "ink";
            return (
              <li key={o.href}>
                <Link
                  href={o.href}
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-[32px] rounded-ee-[9px] p-8 ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-lift",
                    o.tone === "sage" && "bg-sage-100 ring-sage-200",
                    o.tone === "clay" && "bg-clay-100 ring-clay-200",
                    dark && "bg-ink-900 text-sand-50 ring-ink-900",
                  )}
                >
                  <Nuqta
                    rotate={-90}
                    className={cn(
                      "absolute -bottom-14 -left-12 size-48",
                      o.tone === "sage" && "text-sage-200/70",
                      o.tone === "clay" && "text-clay-200/60",
                      dark && "text-ink-800",
                    )}
                  />
                  <span
                    className={cn(
                      "relative grid size-16 place-items-center rounded-[20px] rounded-ss-[6px]",
                      o.tone === "sage" && "bg-sage-700 text-white",
                      o.tone === "clay" && "bg-clay-600 text-white",
                      dark && "bg-sand-100 text-ink-900",
                    )}
                  >
                    <o.icon className="size-8" strokeWidth={1.75} />
                  </span>
                  <h2 className="relative mt-7 text-3xl font-black">{o.title}</h2>
                  <p className={cn("relative mt-3 leading-[1.9]", dark ? "text-ink-200" : "text-ink-700")}>
                    {o.body}
                  </p>
                  <p className={cn("relative mt-4 text-sm", dark ? "text-ink-300" : "text-ink-500")}>
                    {o.time}
                  </p>
                  <span
                    className={cn(
                      "relative mt-8 inline-flex items-center gap-2 self-start rounded-2xl rounded-ee-[6px] px-5 py-3 font-semibold transition-colors",
                      o.tone === "sage" && "bg-sage-700 text-white group-hover:bg-sage-800",
                      o.tone === "clay" && "bg-clay-600 text-white group-hover:bg-clay-700",
                      dark && "bg-sand-100 text-ink-900 group-hover:bg-white",
                    )}
                  >
                    {o.cta}
                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
