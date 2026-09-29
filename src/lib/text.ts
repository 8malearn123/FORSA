/** أدوات نصوص عربية: توحيد الأرقام والحروف لأغراض البحث والتحقق */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

export function toLatinDigits(input: string) {
  return input.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN.indexOf(d));
  });
}

const TASHKEEL = /[ً-ٰٟۖ-ۭ]/g;

export function normalizeArabic(input: string) {
  return toLatinDigits(input)
    .toLowerCase()
    .replace(TASHKEEL, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * أول حرف من الاسم لعرضه داخل «النقطة». نتخطى الرموز التعبيرية وعلامات الترقيم
 * («🌸 بيت الورد» ← «ا»)، وإن لم يكن في الاسم حرف أصلاً نأخذ أول رمز كاملاً.
 */
export function initialOf(name: string) {
  let cleaned = name.replace(/^[^\p{L}\p{N}]+/u, "");
  // «مطبخ أم علي» ← «علي»
  for (let i = 0; i < 2; i++) cleaned = cleaned.replace(/^(أبو|ابو|أم|ام|مطبخ|بيت)\s+/, "");
  const letter = cleaned.match(/[\p{L}\p{N}]/u)?.[0] ?? name.match(/[\p{L}\p{N}]/u)?.[0];
  if (letter) return letter.replace(/[أإآ]/, "ا").toUpperCase();
  const [first] = new Intl.Segmenter("ar", { granularity: "grapheme" }).segment(name.trim());
  return first?.segment ?? "ف";
}

/** رقم سعودي بصيغة دولية بدون + (مثال: 966501234567) أو null */
export function normalizeSaudiMobile(raw: string | undefined | null) {
  if (!raw) return null;
  const digits = toLatinDigits(raw)
    .replace(/[^\d+]/g, "")
    .replace(/^\+/, "");
  let n = digits;
  if (n.startsWith("00966")) n = n.slice(2);
  if (n.startsWith("966")) n = "0" + n.slice(3);
  if (/^5\d{8}$/.test(n)) n = "0" + n;
  if (!/^05\d{8}$/.test(n)) return null;
  return "966" + n.slice(1);
}

export function formatSaudiMobile(international: string) {
  const local = "0" + international.slice(3);
  const grouped = `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return grouped.replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);
}
