import type { Metadata } from "next";

import { one } from "@/components/browse";
import { JoinLayout } from "@/components/join/join-layout";
import { TalentForm } from "@/components/join/talent-form";
import { requireAccount } from "@/lib/auth";
import { isListingId } from "@/lib/listing";
import { localSaudiMobile } from "@/lib/text";

export const metadata: Metadata = {
  title: "اعرض مهارتك",
  description: "أنشئ ملفك على «فرصة» مجاناً، وخلّ أهل جازان وشركاتها يكتشفون مهارتك.",
};

export default async function JoinTalentPage({ searchParams }: PageProps<"/join/talent">) {
  // جاء ليقدّم على فرصة: بعد النشر نرجعه إليها
  const apply = one((await searchParams).apply);
  const applyTo = isListingId(apply) ? apply : undefined;
  const account = await requireAccount(applyTo ? `/join/talent?apply=${applyTo}` : "/join/talent");
  return (
    <JoinLayout
      eyebrow="أصحاب المهارات"
      title="اعرض مهارتك، وخلّ الفرصة تلقاك"
      description={
        applyTo
          ? "أنشئ ملفك مرة واحدة، وبعد النشر نرجعك للفرصة لتقدّم عليها به مباشرة. وتقدّم به على أي فرصة بعدها."
          : "سواء تبحث عن وظيفة، أو مشاريع حرة، أو دخل إضافي: ملف واضح على «فرصة» يوصلك لناس وشركات في جازان يبحثون عن مهارتك."
      }
      tips={{
        title: "لملف يلفت الانتباه",
        items: [
          "اكتب مسمى واضحاً يفهمه الناس من أول نظرة.",
          "احكِ في النبذة عن تجربة حقيقية أو مشروع تفتخر فيه.",
          "أضف أسعاراً تقريبية لخدماتك، تختصر على الناس السؤال.",
          "صور أعمالك تساوي ألف كلمة، ولو كانت من جوالك.",
        ],
      }}
    >
      <TalentForm whatsapp={localSaudiMobile(account.phone)} applyTo={applyTo} />
    </JoinLayout>
  );
}
