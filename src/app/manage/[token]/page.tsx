import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpLeft,
  CircleCheck,
  Eye,
  EyeOff,
  PencilLine,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { Nuqta, Sparks } from "@/components/brand";
import { FamilyCard, OpportunityCard, TalentCard } from "@/components/cards";
import { ManageLinkTools } from "@/components/manage-link";
import { ForgetOnSubmit, SaveOnDevice } from "@/components/my-listings";
import { ShareActions } from "@/components/share-actions";
import { SubmitButton } from "@/components/submit-button";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { COUNT, countLabel, formatNumber } from "@/lib/format";
import { STALE_DAYS, canRenew, isStale } from "@/lib/listing";
import { findOwned, revealsOf } from "@/lib/store";
import type { Listing } from "@/lib/types";

import { deleteListing, updateListing } from "../actions";

export const metadata: Metadata = {
  title: "إدارة إعلانك",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const publicPath = (l: Listing) =>
  l.kind === "talent"
    ? `/talents/${l.id}`
    : l.kind === "family"
      ? `/families/${l.id}`
      : `/opportunities/${l.id}`;

const titleOf = (l: Listing) => (l.kind === "opportunity" ? l.title : l.name);

function OpButton({
  token,
  op,
  children,
  variant = "secondary",
}: {
  token: string;
  op: string;
  children: React.ReactNode;
  variant?: "secondary" | "sage" | "dark";
}) {
  return (
    <form action={updateListing}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="op" value={op} />
      <SubmitButton variant={variant} size="md">
        {children}
      </SubmitButton>
    </form>
  );
}

export default async function ManagePage({ params, searchParams }: PageProps<"/manage/[token]">) {
  const { token } = await params;
  const sp = await searchParams;
  const isNew = sp.new === "1";
  const saved = sp.saved === "1";
  const listing = await findOwned(token);
  if (!listing) notFound();

  const path = publicPath(listing);
  const reveals = await revealsOf(listing.kind, listing.id);

  return (
    <>
      <section className="relative overflow-hidden bg-sage-100/70">
        <div aria-hidden="true" className="absolute inset-0 bg-nuqta-grid opacity-60" />
        <Sparks className="absolute top-10 left-[12%] w-16" animated />
        <Container className="relative py-12 md:py-16">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-sage-800">
            <Nuqta className="size-2.5 text-sage-600" />
            {isNew ? "تم النشر بنجاح" : "لوحة إدارة إعلانك"}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.25] font-black text-ink-900 md:text-5xl">
            {isNew ? "مبروك! صار لك مكان على «فرصة»" : titleOf(listing)}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-[1.9] text-ink-700">
            {isNew
              ? "إعلانك منشور الآن ويستطيع أهل جازان اكتشافه. شاركه مع معارفك، واحفظ رابط هذه الصفحة لتديره لاحقاً."
              : "من هنا تتحكم في ظهور إعلانك وحالته، أو تحذفه نهائياً."}
          </p>
        </Container>
      </section>

      {listing.moderated ? (
        <div className="bg-clay-700 text-white">
          <Container className="flex items-center gap-3 py-3.5 font-semibold">
            <ShieldAlert className="size-5 shrink-0" />
            أخفى فريق الإشراف هذا الإعلان بعد مراجعة بلاغ عنه، ولن يظهر للزوار.
          </Container>
        </div>
      ) : null}

      {saved ? (
        <div className="bg-sage-700 text-white">
          <Container className="flex items-center gap-3 py-3.5 font-semibold">
            <CircleCheck className="size-5" />
            تم حفظ التعديلات، وتظهر الآن في صفحتك العامة.
          </Container>
        </div>
      ) : null}

      <Container className="grid grid-cols-[minmax(0,1fr)] gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex items-center gap-5 rounded-[28px] rounded-ee-[8px] bg-sage-100 p-6">
            <span className="relative grid size-16 shrink-0 place-items-center">
              <Nuqta className="absolute size-16 text-sage-200" rotate={-90} />
              <span className="relative font-display text-2xl font-black text-sage-800">
                {formatNumber(reveals)}
              </span>
            </span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-sage-950">
                {reveals > 0
                  ? `طلب وسائل تواصلك ${countLabel(reveals, COUNT.person)}`
                  : "لم يطلب أحد وسائل تواصلك بعد"}
              </h2>
              <p className="mt-1 text-sm text-sage-900/80">
                {reveals > 0
                  ? "كل طلب يعني شخصاً مهتماً. تأكد أن رقمك متاح للرد."
                  : "شارك إعلانك في قروبات العائلة والأصدقاء ليصل لأكثر الناس."}
              </p>
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="me-2 font-display text-xl font-extrabold text-ink-900">كيف يراه الناس</h2>
              {listing.moderated ? (
                <Badge tone="clay">أخفاه فريق الإشراف</Badge>
              ) : listing.hidden ? (
                <Badge tone="sand">مخفي حالياً</Badge>
              ) : (
                <Badge tone="sage" dot>
                  ظاهر للجميع
                </Badge>
              )}
              {listing.kind === "opportunity" && listing.closed ? <Badge tone="sand">مغلقة</Badge> : null}
            </div>
            <div className="max-w-md">
              {listing.kind === "talent" ? <TalentCard talent={listing} /> : null}
              {listing.kind === "family" ? <FamilyCard family={listing} /> : null}
              {listing.kind === "opportunity" ? <OpportunityCard opportunity={listing} /> : null}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ButtonLink href={`/manage/${token}/edit`} variant="dark" size="md">
                <PencilLine className="size-4" />
                عدّل الإعلان
              </ButtonLink>
              <Link
                href={path}
                className="inline-flex items-center gap-1.5 px-2 font-semibold text-clay-700 hover:text-clay-800"
              >
                افتح الصفحة العامة
                <ArrowUpLeft className="size-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-[28px] rounded-ee-[8px] bg-white p-6 ring-1 ring-ink-100">
            <h2 className="font-display text-xl font-extrabold text-ink-900">الحالة</h2>
            <div className="mt-5 flex flex-col gap-5">
              {listing.kind === "opportunity" ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-ink-700">
                    {listing.closed
                      ? "الفرصة مغلقة، ويظهر للزوار أنها اكتملت."
                      : "وجدت الشخص المناسب؟ أغلق الفرصة حتى لا تصلك رسائل جديدة."}
                  </p>
                  {listing.closed ? (
                    <OpButton token={token} op="reopen">
                      أعد فتح الفرصة
                    </OpButton>
                  ) : (
                    <OpButton token={token} op="close" variant="sage">
                      <CircleCheck className="size-4" />
                      اكتملت الفرصة
                    </OpButton>
                  )}
                </div>
              ) : null}

              {listing.kind === "opportunity" && !listing.closed && canRenew(listing) ? (
                <div
                  className={
                    isStale(listing)
                      ? "flex flex-col gap-3 rounded-2xl bg-clay-50 p-4 ring-1 ring-clay-100 sm:flex-row sm:items-center sm:justify-between"
                      : "flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between"
                  }
                >
                  <p className={isStale(listing) ? "text-clay-900" : "text-ink-700"}>
                    {isStale(listing)
                      ? `مرّ على فرصتك أكثر من ${formatNumber(STALE_DAYS)} يوماً، وتظهر للزوار بأنها «قد تكون انتهت». ما زالت متاحة؟ جدّدها.`
                      : "ما زالت الفرصة متاحة؟ جدّدها لتعود إلى أعلى القائمة."}
                  </p>
                  <OpButton token={token} op="renew" variant={isStale(listing) ? "sage" : "secondary"}>
                    <RefreshCw className="size-4" />
                    جدّد الفرصة
                  </OpButton>
                </div>
              ) : null}

              {listing.kind === "talent" ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-ink-700">
                    {listing.available
                      ? `ملفك يظهر بعلامة «${listing.gender === "f" ? "متاحة" : "متاح"} للعمل».`
                      : `ملفك يظهر بأنك ${listing.gender === "f" ? "مشغولة" : "مشغول"} حالياً.`}
                  </p>
                  {listing.available ? (
                    <OpButton token={token} op="busy">
                      {listing.gender === "f" ? "أنا مشغولة حالياً" : "أنا مشغول حالياً"}
                    </OpButton>
                  ) : (
                    <OpButton token={token} op="available" variant="sage">
                      {listing.gender === "f" ? "أنا متاحة للعمل" : "أنا متاح للعمل"}
                    </OpButton>
                  )}
                </div>
              ) : null}

              {listing.moderated ? (
                <p className="border-t border-ink-100 pt-5 text-ink-700">
                  أخفى فريق الإشراف هذا الإعلان، لذلك لا يمكن إظهاره من هنا. تستطيع تعديله أو حذفه.
                </p>
              ) : (
                <div className="flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-ink-700">
                    {listing.hidden
                      ? "الإعلان مخفي ولا يظهر في البحث أو القوائم."
                      : "تستطيع إخفاء الإعلان مؤقتاً دون حذفه."}
                  </p>
                  {listing.hidden ? (
                    <OpButton token={token} op="show" variant="sage">
                      <Eye className="size-4" />
                      أظهر الإعلان
                    </OpButton>
                  ) : (
                    <OpButton token={token} op="hide">
                      <EyeOff className="size-4" />
                      أخفِ الإعلان
                    </OpButton>
                  )}
                </div>
              )}
            </div>
          </section>

          <details className="group rounded-[28px] rounded-ee-[8px] bg-clay-50 p-6 ring-1 ring-clay-100">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-clay-800">
              <Trash2 className="size-4" />
              حذف الإعلان نهائياً
            </summary>
            <form action={deleteListing} className="mt-4 flex flex-col gap-4">
              <p className="text-clay-900">سيُحذف الإعلان وصوره من «فرصة» ولا يمكن استرجاعه. متأكد؟</p>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="confirm" value="yes" />
              <ForgetOnSubmit token={token} />
              <SubmitButton variant="primary" className="self-start" pendingLabel="جارِ الحذف…">
                نعم، احذف نهائياً
              </SubmitButton>
            </form>
          </details>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] rounded-ee-[8px] bg-white p-6 shadow-lift ring-1 ring-ink-100">
            <h2 className="font-display text-lg font-extrabold text-ink-900">احفظ رابط الإدارة</h2>
            <p className="mt-1 mb-4 text-sm text-ink-600">
              لا توجد كلمة مرور على «فرصة». هذا الرابط هو مفتاحك الوحيد لإدارة الإعلان.
            </p>
            <ManageLinkTools />
            <div className="mt-4 border-t border-ink-100 pt-4">
              <p className="mb-2 text-xs text-ink-500">
                جهازك الشخصي؟ احفظ الرابط فيه ليظهر لك في صفحة «انضم».
              </p>
              <SaveOnDevice token={token} />
            </div>
          </div>
          <div className="rounded-[28px] rounded-ee-[8px] bg-sand-200/70 p-6">
            <h2 className="font-display text-lg font-extrabold text-ink-900">انشر الخبر</h2>
            <p className="mt-1 mb-4 text-sm text-ink-600">
              مشاركة واحدة في قروب العائلة قد تجيب لك أول فرصة.
            </p>
            <ShareActions title={titleOf(listing)} path={path} prompt="صار لي مكان على منصة فرصة" />
          </div>
        </aside>
      </Container>
    </>
  );
}
