import type { Metadata } from "next";

import { FamilyForm } from "@/components/join/family-form";
import { JoinLayout } from "@/components/join/join-layout";

export const metadata: Metadata = {
  title: "اعرضوا منتجات أسرتكم",
  description: "صفحة مجانية لأسرتكم المنتجة على «فرصة»، يكتشفها أهل جازان وشركاتها ويطلبون منكم مباشرة.",
};

export default function JoinFamilyPage() {
  return (
    <JoinLayout
      eyebrow="الأسر المنتجة"
      title="منتجاتكم تستاهل يشوفها الكل"
      description="أكلات، حلويات، ضيافة، مشغولات، بخور، أو منتجات مزارع: اعرضوها في صفحة جميلة، واستقبلوا الطلبات مباشرة من الأفراد والشركات."
      tips={{
        title: "لصفحة تفتح النفس",
        items: [
          "صوّروا المنتجات في ضوء النهار قرب النافذة.",
          "اكتبوا حكايتكم ببساطة: الناس تشتري القصة قبل المنتج.",
          "حددوا سعراً تقريبياً وكمية المنتج (للعلبة، للكيلو، للشخص).",
          "إذا تستقبلون طلبات الشركات، فعّلوا خيار المناسبات.",
        ],
      }}
    >
      <FamilyForm />
    </JoinLayout>
  );
}
