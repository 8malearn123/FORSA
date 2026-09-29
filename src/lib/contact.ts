import type { Contact } from "./types";
import { formatSaudiMobile, normalizeSaudiMobile } from "./text";

export type ContactChannel =
  | { kind: "whatsapp"; href: string; label: string }
  | { kind: "phone"; href: string; label: string; display: string }
  | { kind: "email"; href: string; label: string; display: string }
  | { kind: "instagram"; href: string; label: string; display: string }
  | { kind: "website"; href: string; label: string; display: string };

/**
 * يحوّل بيانات التواصل إلى روابط جاهزة. رسالة الواتساب تُكتب مسبقاً
 * بلغة ودودة حتى يعرف صاحب الإعلان من أين جاء التواصل.
 */
export function contactChannels(contact: Contact, subject: string): ContactChannel[] {
  const channels: ContactChannel[] = [];
  const wa = normalizeSaudiMobile(contact.whatsapp);
  if (wa) {
    const text = `السلام عليكم، شفت «${subject}» على منصة فرصة وحاب أتواصل معك.`;
    channels.push({
      kind: "whatsapp",
      href: `https://wa.me/${wa}?text=${encodeURIComponent(text)}`,
      label: "تواصل عبر واتساب",
    });
  }
  const phone = normalizeSaudiMobile(contact.phone);
  if (phone) {
    channels.push({
      kind: "phone",
      href: `tel:+${phone}`,
      label: "اتصال",
      display: formatSaudiMobile(phone),
    });
  }
  if (contact.email) {
    channels.push({
      kind: "email",
      href: `mailto:${contact.email}?subject=${encodeURIComponent(`بخصوص ${subject} — عبر فرصة`)}`,
      label: "بريد إلكتروني",
      display: contact.email,
    });
  }
  if (contact.instagram) {
    const handle = contact.instagram.replace(/^@/, "");
    channels.push({
      kind: "instagram",
      href: `https://instagram.com/${encodeURIComponent(handle)}`,
      label: "انستقرام",
      display: `@${handle}`,
    });
  }
  if (contact.website) {
    channels.push({
      kind: "website",
      href: contact.website,
      label: "رابط الأعمال",
      display: contact.website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    });
  }
  return channels;
}
