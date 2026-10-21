import type { Metadata } from "next";

import { one } from "@/components/browse";
import { JoinLayout } from "@/components/join/join-layout";
import { OpportunityForm } from "@/components/join/opportunity-form";
import { requireAccount } from "@/lib/auth";
import { OPPORTUNITY_TYPES, type OpportunityType } from "@/lib/taxonomy";
import { localSaudiMobile } from "@/lib/text";

export const metadata: Metadata = {
  title: "انشر فرصة",
  description:
    "وظيفة، مهمة، طلب ضيافة أو منتجات، تدريب، أو تطوع: انشرها مجاناً على «فرصة» وتواصل مع أهل جازان مباشرة.",
};

export default async function JoinOpportunityPage({ searchParams }: PageProps<"/join/opportunity">) {
  const requested = one((await searchParams).type);
  const defaultType = OPPORTUNITY_TYPES.find((t) => t.slug === requested)?.slug as
    OpportunityType | undefined;
  const account = await requireAccount(
    defaultType ? `/join/opportunity?type=${defaultType}` : "/join/opportunity",
  );
  return (
    <JoinLayout
      eyebrow="الأفراد والشركات والجهات"
      title="تبحث عن أحد؟ انشر احتياجك"
      description="موظف، أو شخص ينجز لك مهمة، أو أسرة منتجة تجهّز ضيافة فعاليتك: انشر ما تحتاجه، واستقبل المتقدمين بملفاتهم وافرزهم، أو خلّهم يتواصلون معك مباشرة."
      tips={{
        title: "لفرصة واضحة",
        items: [
          "اكتب عنواناً يلخّص المطلوب: من؟ وماذا؟ وكم؟",
          "حدد المحافظة والموعد، فهي أول ما يسأل عنه الناس.",
          "ضع ميزانية تقريبية إن أمكن، توفّر وقتك ووقتهم.",
          "تتوقع متقدمين كثيرين؟ اختر أن يقدّموا بملفاتهم، وافرزهم من «حسابي».",
          "إذا وجدت الشخص المناسب، أغلق الفرصة من «حسابي».",
        ],
      }}
    >
      <OpportunityForm defaultType={defaultType} whatsapp={localSaudiMobile(account.phone)} />
    </JoinLayout>
  );
}
