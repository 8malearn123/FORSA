const LOCALE = "ar-SA-u-ca-gregory-nu-arab";

const numberFormat = new Intl.NumberFormat(LOCALE);
const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" });

export const formatNumber = (n: number) => numberFormat.format(n);

export function timeAgo(iso: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "الآن";
  if (abs < 3600) return relative.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(diff / 3600), "hour");
  if (abs < 604_800) return relative.format(Math.round(diff / 86_400), "day");
  if (abs < 2_592_000) return relative.format(Math.round(diff / 604_800), "week");
  return relative.format(Math.round(diff / 2_592_000), "month");
}

export const joinedOn = (iso: string) => monthYear.format(new Date(iso));

export type CountForms = {
  /** «لا توجد مواهب» */
  zero: string;
  /** «موهبة واحدة» */
  one: string;
  /** مثنى مرفوع: «موهبتان» */
  two: string;
  /** مثنى منصوب أو مجرور: «موهبتين» (بعد «وجدنا» أو «تصفّح») */
  twoAcc: string;
  /** جمع (من ٣ إلى ١٠): «مواهب» */
  few: string;
  /** مفرد منصوب (من ١١ إلى ٩٩): «موهبة»، «منتجاً» */
  many: string;
  /** مفرد مجرور بعد المئات والآلاف: «١٠٠ موهبة»، «٢٠٠ منتج» */
  unit: string;
};

/**
 * يعدّ العناصر بصيغة عربية سليمة: «موهبة واحدة»، «موهبتان»، «٥ مواهب»، «١٢ موهبة»، «١٠٠ منتج».
 * استخدم accusative حين يكون العدد مفعولاً به: «وجدنا نتيجتين».
 */
export function countLabel(n: number, forms: CountForms, { accusative = false } = {}) {
  if (n === 0) return forms.zero;
  if (n === 1) return forms.one;
  if (n === 2) return accusative ? forms.twoAcc : forms.two;
  const mod100 = n % 100;
  if (mod100 >= 3 && mod100 <= 10) return `${formatNumber(n)} ${forms.few}`;
  if (mod100 >= 11) return `${formatNumber(n)} ${forms.many}`;
  return `${formatNumber(n)} ${forms.unit}`;
}

export const COUNT = {
  talent: {
    zero: "لا توجد مواهب",
    one: "موهبة واحدة",
    two: "موهبتان",
    twoAcc: "موهبتين",
    few: "مواهب",
    many: "موهبة",
    unit: "موهبة",
  },
  family: {
    zero: "لا توجد أسر",
    one: "أسرة واحدة",
    two: "أسرتان",
    twoAcc: "أسرتين",
    few: "أسر",
    many: "أسرة",
    unit: "أسرة",
  },
  opportunity: {
    zero: "لا توجد فرص",
    one: "فرصة واحدة",
    two: "فرصتان",
    twoAcc: "فرصتين",
    few: "فرص",
    many: "فرصة",
    unit: "فرصة",
  },
  openOpportunity: {
    zero: "لا توجد فرص مفتوحة",
    one: "فرصة مفتوحة واحدة",
    two: "فرصتان مفتوحتان",
    twoAcc: "فرصتين مفتوحتين",
    few: "فرص مفتوحة",
    many: "فرصة مفتوحة",
    unit: "فرصة مفتوحة",
  },
  listing: {
    zero: "لا توجد إعلانات",
    one: "إعلان واحد",
    two: "إعلانان",
    twoAcc: "إعلانين",
    few: "إعلانات",
    many: "إعلاناً",
    unit: "إعلان",
  },
  applicant: {
    zero: "لا يوجد متقدمون",
    one: "متقدم واحد",
    two: "متقدمان",
    twoAcc: "متقدمين",
    few: "متقدمين",
    many: "متقدماً",
    unit: "متقدم",
  },
  product: {
    zero: "لا توجد منتجات",
    one: "منتج واحد",
    two: "منتجان",
    twoAcc: "منتجين",
    few: "منتجات",
    many: "منتجاً",
    unit: "منتج",
  },
  result: {
    zero: "لا توجد نتائج",
    one: "نتيجة واحدة",
    two: "نتيجتان",
    twoAcc: "نتيجتين",
    few: "نتائج",
    many: "نتيجة",
    unit: "نتيجة",
  },
  person: {
    zero: "لا أحد",
    one: "شخص واحد",
    two: "شخصان",
    twoAcc: "شخصين",
    few: "أشخاص",
    many: "شخصاً",
    unit: "شخص",
  },
  letter: {
    zero: "لا أحرف",
    one: "حرف واحد",
    two: "حرفان",
    twoAcc: "حرفين",
    few: "أحرف",
    many: "حرفاً",
    unit: "حرف",
  },
} as const satisfies Record<string, CountForms>;
