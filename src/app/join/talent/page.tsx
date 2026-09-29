import type { Metadata } from "next";

import { JoinLayout } from "@/components/join/join-layout";
import { TalentForm } from "@/components/join/talent-form";

export const metadata: Metadata = {
  title: "اعرض مهارتك",
  description: "أنشئ ملفك على «فرصة» مجاناً، وخلّ أهل جازان وشركاتها يكتشفون مهارتك.",
};

export default function JoinTalentPage() {
  return (
    <JoinLayout
      eyebrow="أصحاب المهارات"
      title="اعرض مهارتك، وخلّ الفرصة تلقاك"
      description="سواء تبحث عن وظيفة، أو مشاريع حرة، أو دخل إضافي: ملف واضح على «فرصة» يوصلك لناس وشركات في جازان يبحثون عن مهارتك."
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
      <TalentForm />
    </JoinLayout>
  );
}
