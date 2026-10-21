import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpLeft, Check, Mail, Phone, Quote, RotateCcw, X } from "lucide-react";

import { setApplicationStatus } from "@/app/account/actions";
import type { FitPoint } from "@/lib/applications";
import { timeAgo } from "@/lib/format";
import { KIND_NAME, coverOf, pathOf } from "@/lib/listing";
import { getCategory } from "@/lib/taxonomy";
import { formatSaudiMobile, normalizeSaudiMobile } from "@/lib/text";
import type { Application, ApplicationStatus, Family, Opportunity, Talent } from "@/lib/types";

import { NuqtaAvatar } from "./brand";
import { cn } from "./cn";
import { WhatsApp } from "./icons";
import { CoverImage } from "./media";
import { SubmitButton } from "./submit-button";
import { Badge, buttonClass, type ButtonVariant } from "./ui";

/** التواصل مع المتقدم: واتساب برسالة جاهزة تذكّره بالفرصة، وإلا اتصال أو بريد */
function contactOf(profile: Talent | Family, opportunity: Opportunity) {
  const text = `السلام عليكم ${profile.name}، معك ${opportunity.poster.name} بخصوص تقديمك على «${opportunity.title}» في منصة فرصة.`;
  const whatsapp = normalizeSaudiMobile(profile.contact.whatsapp);
  if (whatsapp) {
    return {
      Icon: WhatsApp,
      href: `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`,
      label: "تواصل بالواتساب",
      display: formatSaudiMobile(whatsapp),
    };
  }
  const phone = normalizeSaudiMobile(profile.contact.phone);
  if (phone) return { Icon: Phone, href: `tel:+${phone}`, label: "اتصال", display: formatSaudiMobile(phone) };
  const email = profile.contact.email;
  if (email) {
    const subject = encodeURIComponent(`بخصوص «${opportunity.title}» — عبر فرصة`);
    return { Icon: Mail, href: `mailto:${email}?subject=${subject}`, label: "بريد إلكتروني", display: email };
  }
  return null;
}

const FIT_STYLE: Record<FitPoint["tone"], string> = {
  good: "bg-sage-50 text-sage-800 ring-sage-200",
  neutral: "bg-sand-100 text-ink-700 ring-sand-300",
  weak: "bg-white text-ink-500 ring-ink-200",
};

function StatusButton({
  application,
  status,
  variant = "secondary",
  children,
}: {
  application: Application;
  status: ApplicationStatus;
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <form action={setApplicationStatus}>
      <input type="hidden" name="application" value={application.id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant={variant} size="sm">
        {children}
      </SubmitButton>
    </form>
  );
}

/** بطاقة متقدم في صفحة الفرز: من هو، وما يوافق الفرصة منه، ورسالته، وأزرار الفرز والتواصل */
export function ApplicantCard({
  application,
  profile,
  opportunity,
  fit,
}: {
  application: Application;
  profile: Talent | Family;
  opportunity: Opportunity;
  fit: FitPoint[];
}) {
  const { status } = application;
  const female = profile.kind === "family" || profile.gender === "f";
  const contact = contactOf(profile, opportunity);
  const details =
    profile.kind === "talent" ? profile.skills : profile.products.map((p) => p.name).slice(0, 6);

  return (
    <article
      className={cn(
        "rounded-[28px] rounded-ee-[8px] bg-white p-5 ring-1 ring-ink-100 md:p-6",
        status === "shortlisted" && "ring-2 ring-sage-300",
        status === "rejected" && "bg-white/60",
      )}
    >
      <header className="flex items-start gap-4">
        {profile.kind === "talent" ? (
          <NuqtaAvatar name={profile.name} seed={profile.id} className="mt-1" />
        ) : (
          <CoverImage
            src={coverOf(profile)}
            alt={profile.name}
            icon={getCategory(profile.categories[0])?.icon}
            sizes="56px"
            className="size-14 shrink-0 rounded-2xl rounded-ee-[6px]"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 dir="auto" className="font-display text-lg font-extrabold text-ink-900">
              {profile.name}
            </h3>
            {status === "shortlisted" ? (
              <Badge tone="sage" dot>
                {female ? "مرشّحة" : "مرشّح"}
              </Badge>
            ) : null}
            {status === "rejected" ? <Badge tone="sand">{female ? "مستبعدة" : "مستبعد"}</Badge> : null}
          </div>
          <p dir="auto" className="mt-0.5 text-ink-600">
            {profile.kind === "talent" ? profile.headline : profile.tagline}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            {KIND_NAME[profile.kind]} · {female ? "قدّمت" : "قدّم"} {timeAgo(application.createdAt)}
          </p>
        </div>
      </header>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="التوافق مع الفرصة">
        {fit.map((point) => (
          <li
            key={point.label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              FIT_STYLE[point.tone],
            )}
          >
            {point.tone === "good" ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
            {point.label}
          </li>
        ))}
      </ul>

      {application.message ? (
        <blockquote className="mt-4 flex gap-2 rounded-2xl bg-sand-100 p-4 text-ink-800">
          <Quote className="size-4 shrink-0 text-clay-500" />
          <p dir="auto" className="leading-relaxed whitespace-pre-line">
            {application.message}
          </p>
        </blockquote>
      ) : null}

      {details.length ? (
        <p className="mt-4 text-sm text-ink-600">
          <span className="font-semibold text-ink-800">
            {profile.kind === "talent" ? "المهارات" : "المنتجات"}:
          </span>{" "}
          {details.join("، ")}
        </p>
      ) : null}

      <footer className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4">
        {status === "new" ? (
          <>
            <StatusButton application={application} status="shortlisted" variant="sage">
              <Check className="size-4" />
              ترشيح
            </StatusButton>
            <StatusButton application={application} status="rejected">
              <X className="size-4" />
              استبعاد
            </StatusButton>
          </>
        ) : (
          <>
            <StatusButton application={application} status="new" variant="ghost">
              <RotateCcw className="size-4" />
              {status === "shortlisted" ? "إلغاء الترشيح" : "إعادة للفرز"}
            </StatusButton>
            {status === "shortlisted" ? (
              <StatusButton application={application} status="rejected" variant="ghost">
                <X className="size-4" />
                استبعاد
              </StatusButton>
            ) : (
              <StatusButton application={application} status="shortlisted" variant="ghost">
                <Check className="size-4" />
                ترشيح
              </StatusButton>
            )}
          </>
        )}
        <span className="ms-auto flex flex-wrap items-center gap-2">
          {profile.hidden || profile.moderated ? null : (
            <Link
              href={pathOf(profile)}
              target="_blank"
              className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-clay-700 hover:text-clay-800"
            >
              الملف كاملاً
              <ArrowUpLeft className="size-4" />
            </Link>
          )}
          {contact ? (
            <a
              href={contact.href}
              target={contact.href.startsWith("https:") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={buttonClass({
                variant: status === "shortlisted" ? "sage" : "secondary",
                size: "sm",
              })}
            >
              <contact.Icon className="size-4" />
              {contact.label}
              <span dir="ltr" className="text-xs font-medium opacity-80">
                {contact.display}
              </span>
            </a>
          ) : (
            <span className="text-xs text-ink-500">لا توجد وسيلة تواصل في الملف</span>
          )}
        </span>
      </footer>
    </article>
  );
}
