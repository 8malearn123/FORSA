import type { Metadata } from "next";

import { one } from "@/components/browse";
import { FamilyForm } from "@/components/join/family-form";
import { JoinLayout } from "@/components/join/join-layout";
import { requireAccount } from "@/lib/auth";
import { isListingId } from "@/lib/listing";
import { localSaudiMobile } from "@/lib/text";

export const metadata: Metadata = {
  title: "اعرضوا منتجات أسرتكم",
  description: "صفحة مجانية لأسرتكم المنتجة على «فرصة»، يكتشفها أهل جازان وشركاتها ويطلبون منكم مباشرة.",
};

export default async function JoinFamilyPage({ searchParams }: PageProps<"/join/family">) {
  // جاء ليقدّم على فرصة: بعد النشر نرجعه إليها
  const apply = one((await searchParams).apply);
  const applyTo = isListingId(apply) ? apply : undefined;
  const account = await requireAccount(applyTo ? `/join/family?apply=${applyTo}` : "/join/family");
  return (
    <JoinLayout
      eyebrow="الأسر المنتجة"
      title="منتجاتكم تستاهل يشوفها الكل"
      description={
        applyTo
          ? "أنشئوا صفحة أسرتكم مرة واحدة، وبعد النشر نرجعكم للطلب لتقدّموا عليه بها مباشرة."
          : "أكلات، حلويات، ضيافة، مشغولات، بخور، أو منتجات مزارع: اعرضوها في صفحة جميلة، واستقبلوا الطلبات مباشرة من الأفراد والشركات."
      }
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
      <FamilyForm whatsapp={localSaudiMobile(account.phone)} applyTo={applyTo} />
    </JoinLayout>
  );
}
