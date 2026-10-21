import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { PageHeader, one } from "@/components/browse";
import { Nuqta } from "@/components/brand";
import { Container } from "@/components/ui";
import { currentAccount, safeNext } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { CODE_MINUTES } from "@/lib/otp";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "الدخول",
  description: "ادخل إلى حسابك على «فرصة» برقم واتسابك، بدون كلمة مرور.",
  robots: { index: false, follow: false },
};

const WHY = [
  "حتى لا يعدّل إعلانك أو يحذفه أحد غيرك.",
  `الرمز يصل إلى جوالك فقط، ويعمل مرة واحدة خلال ${formatNumber(CODE_MINUTES)} دقائق.`,
  "رقم حسابك لا يظهر لأحد، إلا إن وضعته وسيلة تواصل في إعلانك.",
  "لا نرسل لك رسائل دعائية.",
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext(one((await searchParams).next));
  if (await currentAccount()) redirect(next);
  const posting = next.startsWith("/join/");

  return (
    <>
      <PageHeader
        tone="sage"
        eyebrow="حسابك على «فرصة»"
        title="ادخل برقم واتسابك"
        description={
          posting
            ? "قبل النشر، ادخل برقم واتسابك. حسابك يحمي إعلانك: لا أحد يعدّله أو يحذفه غيرك."
            : "يصلك رمز دخول على واتساب، بدون كلمة مرور. ومن حسابك تدير كل إعلاناتك من أي جهاز."
        }
      />
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="w-full max-w-xl self-start rounded-[30px] rounded-ee-[9px] bg-white p-6 ring-1 ring-ink-100 md:p-8">
          <LoginForm next={next} />
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] rounded-ee-[8px] bg-sage-100 p-6">
            <h2 className="font-display text-lg font-extrabold text-sage-950">ليش نطلب رقم الواتساب؟</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {WHY.map((item) => (
                <li key={item} className="flex gap-3 text-sage-950/85">
                  <Nuqta className="mt-2 size-2 shrink-0 text-sage-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3 rounded-[24px] rounded-ee-[7px] bg-white p-5 text-sm leading-relaxed text-ink-600 ring-1 ring-ink-100">
            <ShieldCheck className="size-5 shrink-0 text-clay-600" />
            <p>
              <strong className="text-ink-900">لا تعطِ رمز الدخول لأي أحد</strong>، حتى لو قال إنه من فريق
              «فرصة». نحن لا نطلبه منك أبداً.
            </p>
          </div>
        </aside>
      </Container>
    </>
  );
}
