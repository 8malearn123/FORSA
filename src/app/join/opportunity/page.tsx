import type { Metadata } from "next";

import { one } from "@/components/browse";
import { JoinLayout } from "@/components/join/join-layout";
import { OpportunityForm } from "@/components/join/opportunity-form";
import { OPPORTUNITY_TYPES, type OpportunityType } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "انشر فرصة",
  description:
    "وظيفة، مهمة، طلب ضيافة أو منتجات، تدريب، أو تطوع: انشرها مجاناً على «فرصة» وتواصل مع أهل جازان مباشرة.",
};

export default async function JoinOpportunityPage({ searchParams }: PageProps<"/join/opportunity">) {
  const requested = one((await searchParams).type);
  const defaultType = OPPORTUNITY_TYPES.find((t) => t.slug === requested)?.slug as
    OpportunityType | undefined;
  return (
    <JoinLayout
      eyebrow="الأفراد والشركات والجهات"
      title="تبحث عن أحد؟ انشر احتياجك"
      description="موظف، أو شخص ينجز لك مهمة، أو أسرة منتجة تجهّز ضيافة فعاليتك: انشر ما تحتاجه، وخلّ أصحاب المهارات والأسر المنتجة في جازان يتواصلون معك."
      tips={{
        title: "لفرصة واضحة",
        items: [
          "اكتب عنواناً يلخّص المطلوب: من؟ وماذا؟ وكم؟",
          "حدد المحافظة والموعد، فهي أول ما يسأل عنه الناس.",
          "ضع ميزانية تقريبية إن أمكن، توفّر وقتك ووقتهم.",
          "إذا وجدت الشخص المناسب، أغلق الفرصة من رابط الإدارة.",
        ],
      }}
    >
      <OpportunityForm defaultType={defaultType} />
    </JoinLayout>
  );
}
