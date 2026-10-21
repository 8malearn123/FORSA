import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link2, LogIn } from "lucide-react";

import { claimListing } from "@/app/account/actions";
import { PageHeader } from "@/components/browse";
import { SubmitButton } from "@/components/submit-button";
import { ButtonLink, Container } from "@/components/ui";
import { currentAccount } from "@/lib/auth";
import { KIND_NAME, titleOf } from "@/lib/listing";
import { findByLegacyLink } from "@/lib/store";
import { formatSaudiMobile } from "@/lib/text";

export const metadata: Metadata = {
  title: "اربط إعلانك بحسابك",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** روابط الإدارة من قبل الحسابات: تُستخدم مرة واحدة لربط الإعلان بحساب صاحبه ثم تتوقف */
export default async function LegacyManagePage({ params }: PageProps<"/manage/[token]">) {
  const { token } = await params;
  const listing = await findByLegacyLink(token);
  if (!listing) notFound();
  const account = await currentAccount();

  return (
    <>
      <PageHeader
        tone="sage"
        eyebrow={`${KIND_NAME[listing.kind]} · رابط إدارة قديم`}
        title={titleOf(listing)}
        description="صارت إدارة الإعلانات على «فرصة» من حساب برقم الواتساب، بدل الروابط التي قد تضيع أو تصل لغير أصحابها. اربط إعلانك بحسابك مرة واحدة، ثم تديره من أي جهاز."
      />
      <Container className="py-12">
        <div className="max-w-xl rounded-[30px] rounded-ee-[9px] bg-white p-6 ring-1 ring-ink-100 md:p-8">
          {account ? (
            <form action={claimListing} className="flex flex-col gap-5">
              <p className="leading-relaxed text-ink-700">
                سنربط الإعلان بحسابك على الرقم{" "}
                <span dir="ltr" className="font-semibold whitespace-nowrap text-ink-900">
                  {formatSaudiMobile(account.phone)}
                </span>
                ، وبعدها يتوقف هذا الرابط عن العمل.
              </p>
              <input type="hidden" name="token" value={token} />
              <SubmitButton size="lg" className="self-start" pendingLabel="جارِ الربط…">
                <Link2 className="size-5" />
                اربطه بحسابي
              </SubmitButton>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="leading-relaxed text-ink-700">
                ادخل أولاً برقم واتسابك ويصلك رمز الدخول، ثم نرجعك إلى هنا لتربط الإعلان بحسابك.
              </p>
              <ButtonLink
                href={`/login?next=${encodeURIComponent(`/manage/${token}`)}`}
                size="lg"
                className="self-start"
              >
                <LogIn className="size-5" />
                ادخل برقم واتسابك
              </ButtonLink>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
