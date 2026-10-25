import Link from "next/link";
import type { ReactNode } from "react";
import { CircleCheck, LogIn, ShieldCheck, UserRoundPlus, Users } from "lucide-react";

import { withdrawApplication } from "@/app/account/actions";
import { currentAccount } from "@/lib/auth";
import { COUNT, countLabel, timeAgo } from "@/lib/format";
import { KIND_NAME, titleOf } from "@/lib/listing";
import { listingsOf, profileOf, readStore } from "@/lib/store";
import { formatSaudiMobile, normalizeSaudiMobile } from "@/lib/text";
import type { Contact, Family, Opportunity, Talent } from "@/lib/types";

import { ApplyForm, type ProfileOption } from "./apply-form";
import { Sparks } from "./brand";
import { cn } from "./cn";
import { SubmitButton } from "./submit-button";
import { ButtonLink } from "./ui";

/** وسيلة التواصل التي تصل لصاحب الفرصة من هذا الملف */
function contactOf(contact: Contact): ProfileOption["contact"] {
  const whatsapp = normalizeSaudiMobile(contact.whatsapp);
  if (whatsapp) return { label: "واتساب", value: formatSaudiMobile(whatsapp) };
  const phone = normalizeSaudiMobile(contact.phone);
  if (phone) return { label: "رقم الاتصال", value: formatSaudiMobile(phone) };
  if (contact.email) return { label: "البريد", value: contact.email };
  return { label: "لا توجد وسيلة تواصل في هذا الملف" };
}

function Note({ tone = "sand", children }: { tone?: "sand" | "sage" | "clay"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mt-5 rounded-2xl p-4 text-sm leading-relaxed",
        tone === "sand" && "bg-sand-100 text-ink-700",
        tone === "sage" && "bg-sage-50 text-sage-900 ring-1 ring-sage-200",
        tone === "clay" && "bg-clay-50 text-clay-900 ring-1 ring-clay-100",
      )}
    >
      {children}
    </div>
  );
}

/**
 * لوحة التقديم في صفحة الفرصة التي تستقبل التقديم: تتبدل حسب حال الزائر
 * (لم يدخل، صاحب الفرصة، قدّم من قبل، بلا ملف، أو جاهز ليقدّم).
 */
export async function ApplyPanel({
  opportunity: o,
  ready,
  applied,
}: {
  opportunity: Opportunity;
  /** أنشأ ملفه للتو ليقدّم */
  ready?: boolean;
  /** قدّم للتو */
  applied?: boolean;
}) {
  const path = `/opportunities/${o.id}`;
  const isOrder = o.type === "order";
  const account = await currentAccount();
  const store = account ? await readStore() : null;

  let body: ReactNode;
  if (o.closed) {
    body = <Note>اكتملت هذه الفرصة ولم تعد تستقبل التقديم. تصفّح فرصاً مشابهة بالأسفل.</Note>;
  } else if (!account || !store) {
    body = (
      <>
        <ButtonLink
          href={`/login?next=${encodeURIComponent(path)}`}
          variant="sage"
          size="lg"
          className="mt-5 w-full"
        >
          <LogIn className="size-5" />
          ادخل وقدّم
        </ButtonLink>
        <p className="mt-2 text-center text-xs text-ink-500">بدون كلمة مرور: يصلك رمز الدخول على واتساب.</p>
      </>
    );
  } else if (o.ownerId === account.id) {
    const count = store.applications.filter((a) => a.opportunityId === o.id).length;
    body = (
      <>
        <Note tone="sage">
          هذه فرصتك. {count ? `تقدّم لها ${countLabel(count, COUNT.applicant)}.` : "لم يتقدم أحد بعد."}
        </Note>
        <ButtonLink href={`/account/opportunity/${o.id}/applicants`} variant="dark" className="mt-4 w-full">
          <Users className="size-4" />
          افرز المتقدمين
        </ButtonLink>
      </>
    );
  } else {
    const mine = store.applications.find((a) => a.opportunityId === o.id && a.accountId === account.id);
    const profile = mine ? profileOf(store, mine.profile) : null;
    if (mine) {
      body = (
        <>
          <Note tone="sage">
            <p className="flex items-center gap-2 font-semibold">
              <CircleCheck className="size-4 text-sage-600" />
              {applied ? "تم إرسال تقديمك" : "قدّمت على هذه الفرصة"}
            </p>
            <p className="mt-1">
              {profile ? `بملف «${titleOf(profile)}»، ` : ""}
              {timeAgo(mine.createdAt)}. إن ناسب ملفك صاحب الفرصة، يتواصل معك بالواتساب.
            </p>
          </Note>
          <form action={withdrawApplication} className="mt-3">
            <input type="hidden" name="application" value={mine.id} />
            <input type="hidden" name="back" value={path} />
            <SubmitButton variant="ghost" size="sm" pendingLabel="جارِ السحب…">
              اسحب تقديمك
            </SubmitButton>
          </form>
        </>
      );
    } else {
      const profiles = listingsOf(store, account.id).filter(
        (l): l is Talent | Family => l.kind !== "opportunity" && !l.moderated,
      );
      if (profiles.length === 0) {
        const [first, second] = isOrder
          ? [
              { href: `/join/family?apply=${o.id}`, label: "أنشئوا صفحة أسرتكم" },
              { href: `/join/talent?apply=${o.id}`, label: "أو ملف موهبة" },
            ]
          : [
              { href: `/join/talent?apply=${o.id}`, label: "أنشئ ملفك" },
              { href: `/join/family?apply=${o.id}`, label: "أو صفحة أسرة منتجة" },
            ];
        body = (
          <>
            <Note>
              تقدّم بملفك على «فرصة»، وما عندك ملف بعد. أنشئه في دقائق، ونرجعك إلى هنا لتقدّم مباشرة.
            </Note>
            <ButtonLink href={first.href} variant="sage" size="lg" className="mt-4 w-full">
              <UserRoundPlus className="size-5" />
              {first.label}
            </ButtonLink>
            <Link
              href={second.href}
              className="mt-3 block text-center text-sm font-semibold text-clay-700 hover:text-clay-800"
            >
              {second.label}
            </Link>
          </>
        );
      } else {
        body = (
          <>
            {ready ? <Note tone="sage">ملفك جاهز. راجعه ثم قدّم الآن.</Note> : null}
            <ApplyForm
              opportunityId={o.id}
              cta={isOrder ? "قدّم عرضك" : "قدّم الآن"}
              placeholder={
                isOrder
                  ? "عرّفوا بأنفسكم: ماذا تقدّمون لهذا الطلب؟ وكم السعر التقريبي؟"
                  : "عرّف بنفسك في سطرين: لماذا تناسبك هذه الفرصة؟ ومتى تستطيع البدء؟"
              }
              profiles={profiles.map((p) => ({
                value: `${p.kind}:${p.id}`,
                title: titleOf(p),
                detail: `${KIND_NAME[p.kind]} · ${p.kind === "talent" ? p.headline : p.tagline}`,
                contact: contactOf(p.contact),
              }))}
            />
          </>
        );
      }
    }
  }

  return (
    <div
      id="apply"
      className="relative scroll-mt-28 overflow-hidden rounded-[28px] rounded-ee-[8px] bg-white p-6 shadow-lift ring-1 ring-ink-100"
    >
      <Sparks className="absolute top-5 left-5 w-9" />
      <p className="text-sm font-semibold text-sage-700">التقديم عبر «فرصة»</p>
      <h2 className="mt-1 font-display text-xl font-extrabold text-ink-900">
        {isOrder ? "قدّم عرضك على هذا الطلب" : "قدّم على هذه الفرصة"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        يقدّم المهتمون بملفاتهم، و<span dir="auto">{o.poster.name}</span> يتواصل بالواتساب مع من يناسبه.
      </p>
      {body}
      <p className="mt-5 flex gap-2 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-500">
        <ShieldCheck className="size-4 shrink-0 text-sage-600" />
        ملفك ووسيلة التواصل فيه تصل لصاحب الفرصة وحده. «فرصة» لا تتدخل في الاتفاق ولا الدفع.
      </p>
    </div>
  );
}
