import { inArea } from "./listing";
import { rank } from "./search";
import {
  experienceName,
  getCategory,
  governorateName,
  seekingName,
  type OpportunityType,
  type Seeking,
} from "./taxonomy";
import type { ApplicationStatus, Family, Opportunity, Talent } from "./types";

export const APPLICATION_STATUSES: ApplicationStatus[] = ["new", "shortlisted", "rejected"];

export const isApplicationStatus = (value: unknown): value is ApplicationStatus =>
  APPLICATION_STATUSES.includes(value as ApplicationStatus);

/** نقطة في بطاقة المتقدم: ميزة توافق الفرصة، أو معلومة محايدة، أو ما قد لا يناسب */
export type FitPoint = { label: string; tone: "good" | "neutral" | "weak" };

/** ما يناسب كل نوع فرصة مما «يبحث عنه» صاحب المهارة */
const SEEKING_FOR: Partial<Record<OpportunityType, Seeking[]>> = {
  job: ["full-time", "part-time"],
  task: ["freelance", "extra-income"],
};

/** هل تذكر الفرصة هذه العبارة؟ بالبحث العربي نفسه، فـ«مصور» تطابق «تصوير» و«القهوة» تطابق «قهوة» */
const mentions = (opportunity: Opportunity, phrase: string) => rank([opportunity], phrase).length > 0;

/**
 * يقارن ملف المتقدم بالفرصة، ليسهل الفرز: نقاط واضحة يقرؤها صاحب الفرصة بنظرة،
 * ودرجة تقريبية لترتيب «الأنسب أولاً».
 */
export function fitOf(profile: Talent | Family, opportunity: Opportunity) {
  const points: FitPoint[] = [];
  let score = 0;
  const add = (tone: FitPoint["tone"], label: string, weight = 1) => {
    points.push({ tone, label });
    if (tone === "good") score += weight;
  };
  const area = governorateName(profile.governorate);
  const sameArea = inArea(opportunity, profile.governorate);

  if (profile.kind === "talent") {
    const female = profile.gender === "f";
    if (profile.category === opportunity.category) add("good", "نفس مجال الفرصة", 3);
    else add("neutral", `المجال: ${getCategory(profile.category)?.short ?? ""}`);
    const remote = female ? "يمكنها العمل عن بُعد" : "يمكنه العمل عن بُعد";
    if (sameArea) add("good", `من ${area}`, 2);
    else if (opportunity.remote && profile.remote) add("good", remote, 2);
    else add("weak", `من ${area}`);
    if (profile.available) add("good", female ? "متاحة للعمل" : "متاح للعمل");
    else add("weak", female ? "مشغولة حالياً" : "مشغول حالياً");
    const seeking = profile.seeking.filter((s) => SEEKING_FOR[opportunity.type]?.includes(s));
    if (seeking.length) {
      add("good", `${female ? "تبحث عن" : "يبحث عن"} ${seeking.map(seekingName).join(" أو ")}`);
    }
    add("neutral", `الخبرة: ${experienceName(profile.experience)}`);
    const skills = profile.skills.filter((s) => mentions(opportunity, s)).slice(0, 3);
    if (skills.length) add("good", `مهارات مطابقة: ${skills.join("، ")}`, skills.length);
  } else {
    if (profile.categories.includes(opportunity.category)) add("good", "نفس مجال الطلب", 3);
    else add("neutral", `المجال: ${profile.categories.map((c) => getCategory(c)?.short).join("، ")}`);
    if (sameArea) add("good", `من ${area}`, 2);
    else add("weak", `من ${area}`);
    if (opportunity.type === "order") {
      if (profile.events) {
        const capacity = profile.events.capacity ? ` (حتى ${profile.events.capacity})` : "";
        add("good", `تستقبل طلبات المناسبات والشركات${capacity}`, 2);
      } else add("weak", "لا تستقبل طلبات المناسبات عادةً");
    }
    const products = profile.products
      .map((p) => p.name)
      .filter((name) => mentions(opportunity, name))
      .slice(0, 3);
    if (products.length) add("good", `منتجات مطابقة: ${products.join("، ")}`, products.length);
  }
  return { points, score };
}
