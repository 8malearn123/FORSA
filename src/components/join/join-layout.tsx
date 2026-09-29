import type { ReactNode } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

import { Nuqta, Sparks } from "../brand";
import { BackLink } from "../detail";
import { Container } from "../ui";

export function JoinLayout({
  eyebrow,
  title,
  description,
  tips,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tips: { title: string; items: string[] };
  children: ReactNode;
}) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-100/70">
        <div aria-hidden="true" className="absolute inset-0 bg-nuqta-grid opacity-60" />
        <Sparks className="absolute top-12 left-[12%] hidden w-12 md:block" animated />
        <Container className="relative pt-8 pb-10">
          <BackLink href="/join">خيارات الانضمام</BackLink>
          <p className="mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-clay-700">
            <Nuqta className="size-2.5 text-clay-600" />
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl leading-[1.25] font-black text-ink-900 md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-[1.9] text-ink-600">{description}</p>
        </Container>
      </section>
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="min-w-0">{children}</div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] rounded-ee-[8px] bg-sage-100 p-6">
            <h2 className="font-display text-lg font-extrabold text-sage-950">{tips.title}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {tips.items.map((tip) => (
                <li key={tip} className="flex gap-3 text-sage-950/85">
                  <Nuqta className="mt-2 size-2 shrink-0 text-sage-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3 rounded-[24px] rounded-ee-[7px] bg-white p-5 text-sm leading-relaxed text-ink-600 ring-1 ring-ink-100">
            <KeyRound className="size-5 shrink-0 text-clay-600" />
            <p>
              بدون حساب ولا كلمة مرور. بعد النشر نعطيك <strong className="text-ink-900">رابطاً خاصاً</strong>{" "}
              تدير منه إعلانك: تخفيه، أو تغلقه، أو تحذفه.
            </p>
          </div>
          <div className="flex gap-3 rounded-[24px] rounded-ee-[7px] bg-white p-5 text-sm leading-relaxed text-ink-600 ring-1 ring-ink-100">
            <ShieldCheck className="size-5 shrink-0 text-sage-600" />
            <p>
              بيانات التواصل لا تظهر في الصفحة، وتُعرض فقط لمن يطلبها. ونحذف بيانات الموقع من الصور تلقائياً.
            </p>
          </div>
        </aside>
      </Container>
    </>
  );
}
