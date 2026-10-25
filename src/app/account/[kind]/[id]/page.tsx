import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpLeft,
  CircleCheck,
  Clock3,
  Eye,
  EyeOff,
  LayoutList,
  PencilLine,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { Nuqta, Sparks } from "@/components/brand";
import { FamilyCard, OpportunityCard, TalentCard } from "@/components/cards";
import { BackLink } from "@/components/detail";
import { ListingStatus } from "@/components/listing-status";
import { ShareActions } from "@/components/share-actions";
import { SubmitButton } from "@/components/submit-button";
import { ButtonLink, Container } from "@/components/ui";
import { requireAccount } from "@/lib/auth";
import { COUNT, countLabel, formatNumber } from "@/lib/format";
import { STALE_DAYS, canRenew, isKind, isStale, pathOf, titleOf } from "@/lib/listing";
import { listingKey, ownedListing, readStore } from "@/lib/store";
import type { Listing } from "@/lib/types";

import { deleteListing, updateListing } from "../../actions";

export const metadata: Metadata = {
  title: "إدارة إعلانك",
  robots: { index: false, follow: false },
};

function OpButton({
  listing,
  op,
  children,
  variant = "secondary",
}: {
  listing: Listing;
  op: string;
  children: React.ReactNode;
  variant?: "secondary" | "sage" | "dark";
}) {
  return (
    <form action={updateListing}>
      <input type="hidden" name="kind" value={listing.kind} />
      <input type="hidden" name="id" value={listing.id} />
      <input type="hidden" name="op" value={op} />
      <SubmitButton variant={variant} size="md">
        {children}
      </SubmitButton>
    </form>
  );
}

export default async function ManagePage({ params, searchParams }: PageProps<"/account/[kind]/[id]">) {
  const { kind, id } = await params;
  const account = await requireAccount(`/account/${kind}/${id}`);
  const sp = await searchParams;
  const isNew = sp.new === "1";
  const saved = sp.saved === "1";
  const claimed = sp.claimed === "1";
  const store = await readStore();
  // إعلان غيرك يظهر كأنه غير موجود
  const listing = isKind(kind) ? ownedListing(store, account.id, kind, id) : null;
  if (!listing) notFound();

  const path = pathOf(listing);
  const reveals = store.reveals[listingKey(listing.kind, listing.id)] ?? 0;
  // الفرصة التي تستقبل التقديم (أو وصلها تقديم قبل تغيير طريقتها) تعرض المتقدمين بدل عدد طلبات التواصل
  const received = store.applications.filter((a) => a.opportunityId === listing.id);
  const applicants = listing.kind === "opportunity" && (listing.apply || received.length) ? received : null;

  return (
    <>
      <section className="relative overflow-hidden bg-sage-100/70">
        <div aria-hidden="true" className="absolute inset-0 bg-nuqta-grid opacity-60" />
        <Sparks className="absolute top-10 left-[12%] w-16" animated />
        <Container className="relative py-12 md:py-16">
          <BackLink href="/account">كل إعلاناتك</BackLink>
          <p className="mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-sage-800">
            <Nuqta className="size-2.5 text-sage-600" />
            {isNew ? (listing.pending ? "وصلنا إعلانك" : "تم النشر بنجاح") : "لوحة إدارة إعلانك"}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.25] font-black text-ink-900 md:text-5xl">
            {isNew ? "مبروك! صار لك مكان على «فرصة»" : titleOf(listing)}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-[1.9] text-ink-700">
            {isNew
              ? listing.pending
                ? "يراجعه فريق «فرصة» قبل نشره، ونتأكد أنه فرصة فعلية تخدم أهل جازان. يظهر للجميع بعد الموافقة، وتجده دائماً في «حسابي»."
                : "إعلانك منشور الآن ويستطيع أهل جازان اكتشافه. شاركه مع معارفك، وتجده دائماً في «حسابي»."
              : "من هنا تتحكم في ظهور إعلانك وحالته، أو تحذفه نهائياً."}
          </p>
        </Container>
      </section>

      {listing.moderated ? (
        <div className="bg-clay-700 text-white">
          <Container className="flex items-center gap-3 py-3.5 font-semibold">
            <ShieldAlert className="size-5 shrink-0" />
            أخفى فريق الإشراف هذا الإعلان بعد مراجعته، ولن يظهر للزوار.
          </Container>
        </div>
      ) : listing.pending ? (
        <div className="bg-sand-200 text-ink-900">
          <Container className="flex items-center gap-3 py-3.5 font-semibold">
            <Clock3 className="size-5 shrink-0" />
            إعلانك بانتظار موافقة فريق «فرصة»، ولن يظهر للزوار حتى تتم الموافقة عليه.
          </Container>
        </div>
      ) : null}

      {saved && !listing.pending ? (
        <div className="bg-sage-700 text-white">
          <Container className="flex items-center gap-3 py-3.5 font-semibold">
            <CircleCheck className="size-5" />
            تم حفظ التعديلات، وتظهر الآن في صفحتك العامة.
          </Container>
        </div>
      ) : null}

      {claimed ? (
        <div className="bg-sage-700 text-white">
          <Container className="flex items-center gap-3 py-3.5 font-semibold">
            <CircleCheck className="size-5" />
            ربطنا الإعلان بحسابك، وتوقف رابط الإدارة القديم عن العمل.
          </Container>
        </div>
      ) : null}

      <Container className="grid grid-cols-[minmax(0,1fr)] gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-8">
          {applicants ? (
            <section className="flex flex-col gap-4 rounded-[28px] rounded-ee-[8px] bg-sage-100 p-6 sm:flex-row sm:items-center">
              <span className="relative grid size-16 shrink-0 place-items-center">
                <Nuqta className="absolute size-16 text-sage-200" rotate={-90} />
                <span className="relative font-display text-2xl font-black text-sage-800">
                  {formatNumber(applicants.length)}
                </span>
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg font-extrabold text-sage-950">
                  {applicants.length
                    ? `تقدّم لفرصتك ${countLabel(applicants.length, COUNT.applicant)}`
                    : "لم يتقدم أحد لفرصتك بعد"}
                </h2>
                <p className="mt-1 text-sm text-sage-900/80">
                  {applicants.length
                    ? `${formatNumber(applicants.filter((a) => a.status === "new").length)} بانتظار الفرز، و${formatNumber(applicants.filter((a) => a.status === "shortlisted").length)} في قائمة المرشحين.`
                    : "شارك الفرصة في قروبات العائلة والأصدقاء ليصل لها أكثر الناس."}
                </p>
              </div>
              <ButtonLink
                href={`/account/opportunity/${listing.id}/applicants`}
                variant="dark"
                size="md"
                className="shrink-0"
              >
                <Users className="size-4" />
                افرز المتقدمين
              </ButtonLink>
            </section>
          ) : (
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
          )}

          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="me-2 font-display text-xl font-extrabold text-ink-900">كيف يراه الناس</h2>
              <ListingStatus listing={listing} />
            </div>
            <div className="max-w-md">
              {listing.kind === "talent" ? <TalentCard talent={listing} /> : null}
              {listing.kind === "family" ? <FamilyCard family={listing} /> : null}
              {listing.kind === "opportunity" ? <OpportunityCard opportunity={listing} /> : null}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ButtonLink href={`/account/${listing.kind}/${listing.id}/edit`} variant="dark" size="md">
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
                    <OpButton listing={listing} op="reopen">
                      أعد فتح الفرصة
                    </OpButton>
                  ) : (
                    <OpButton listing={listing} op="close" variant="sage">
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
                  <OpButton listing={listing} op="renew" variant={isStale(listing) ? "sage" : "secondary"}>
                    <RefreshCw className="size-4" />
                    جدّد الفرصة
                  </OpButton>
                </div>
              ) : null}

              {listing.kind === "opportunity" && !listing.apply && !listing.closed ? (
                <div className="flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-ink-700">
                    يتواصل المهتمون معك مباشرة. تفضّل أن يقدّموا بملفاتهم وتفرزهم بنفسك، دون أن يظهر رقمك؟
                  </p>
                  <ButtonLink
                    href={`/account/opportunity/${listing.id}/edit`}
                    variant="secondary"
                    size="md"
                    className="shrink-0"
                  >
                    <Users className="size-4" />
                    استقبل التقديم
                  </ButtonLink>
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
                    <OpButton listing={listing} op="busy">
                      {listing.gender === "f" ? "أنا مشغولة حالياً" : "أنا مشغول حالياً"}
                    </OpButton>
                  ) : (
                    <OpButton listing={listing} op="available" variant="sage">
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
                    <OpButton listing={listing} op="show" variant="sage">
                      <Eye className="size-4" />
                      أظهر الإعلان
                    </OpButton>
                  ) : (
                    <OpButton listing={listing} op="hide">
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
              <input type="hidden" name="kind" value={listing.kind} />
              <input type="hidden" name="id" value={listing.id} />
              <input type="hidden" name="confirm" value="yes" />
              <SubmitButton variant="primary" className="self-start" pendingLabel="جارِ الحذف…">
                نعم، احذف نهائياً
              </SubmitButton>
            </form>
          </details>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] rounded-ee-[8px] bg-white p-6 shadow-lift ring-1 ring-ink-100">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
              <ShieldCheck className="size-5 text-sage-600" />
              إعلانك في حسابك
            </h2>
            <p className="mt-1 mb-4 text-sm leading-relaxed text-ink-600">
              لا يستطيع أحد غيرك تعديله أو حذفه. لتديره من أي جهاز، ادخل برقم واتسابك ويصلك رمز الدخول.
            </p>
            <ButtonLink href="/account" variant="secondary" size="sm">
              <LayoutList className="size-4" />
              كل إعلاناتك
            </ButtonLink>
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
