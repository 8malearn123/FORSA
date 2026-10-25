import { GOVERNORATES, getCategory, governorateName, type GovernorateSlug } from "./taxonomy";
import { areasOf } from "./listing";
import { normalizeArabic } from "./text";
import type { Listing } from "./types";

/** كلمات لا تفيد البحث، ومنها عبارات دارجة مثل «ابغى» و«ودي» */
const STOP_WORDS = new Set(
  [
    "في",
    "من",
    "على",
    "الى",
    "إلى",
    "عن",
    "مع",
    "او",
    "أو",
    "و",
    "ل",
    "ب",
    "ابحث",
    "ادور",
    "أدور",
    "ابي",
    "ابغى",
    "ابغا",
    "ودي",
    "احتاج",
    "أحتاج",
    "نحتاج",
    "مطلوب",
    "اريد",
    "أريد",
    "عندي",
    "شخص",
    "احد",
    "أحد",
    "حد",
    "لي",
    "لنا",
    "عشان",
    "حق",
  ].map(normalizeArabic),
);

/**
 * مرادفات بسيطة حتى يجد «مصور» من كتب «تصوير» والعكس.
 * الكلمة قد تنتمي لأكثر من مجموعة (مثل «قهوه»)، فنجمع كل مرادفاتها.
 */
const SYNONYM_GROUPS = [
  ["مصور", "تصوير", "فوتوغرافي", "كاميرا"],
  ["مصمم", "مصممه", "تصميم", "تصاميم", "شعار", "هويه", "جرافيك"],
  ["مبرمج", "برمجه", "مطور", "تطوير", "مواقع", "تطبيقات", "تقنيه"],
  ["معلم", "معلمه", "مدرس", "مدرسه", "تدريس", "دروس", "خصوصي", "تقويه", "تاسيس"],
  ["ضيافه", "قهوه", "بوفيه", "كوفي", "مضيفه"],
  ["بن", "خولاني", "قهوه", "محمص"],
  ["تمر", "تمور"],
  ["حلا", "حلى", "حلويات", "حلوي"],
  ["كيك", "كيكه", "حلويات"],
  ["لقيمات", "حلويات"],
  ["معمول", "حلويات"],
  ["اكل", "اكلات", "طبخ", "طعام", "مطبخ", "غداء", "عشاء", "وجبات", "عزايم"],
  ["معجنات", "مخبوزات", "فطاير", "فطائر", "سمبوسه", "خبز"],
  ["صيانه", "فني", "تصليح", "اصلاح", "يصلح", "صلح", "كهربائي", "كهربا", "سباك", "عطل"],
  ["مكيف", "مكيفات", "تكييف", "سبليت", "فريون"],
  ["خياطه", "خياط", "تفصيل", "تطريز", "فساتين", "فستان", "جلابيات", "جلابيه"],
  ["بخور", "عود", "عطور", "عطر", "مبخره", "دهن"],
  ["هدايا", "هديه", "توزيعات", "تغليف"],
  ["حفل", "حفله", "حفلات", "مناسبه", "مناسبات", "فعاليه", "فعاليات"],
  ["تخرج", "تخريج", "حفل", "حفلات"],
  ["عرس", "زواج", "زفاف", "عروس", "عرايس", "حناء"],
  ["وظيفه", "وظايف", "وظائف", "توظيف", "دوام"],
  ["حناء", "حنا", "نقش", "نقاشه"],
  ["ترجمه", "مترجم", "مترجمه", "تدقيق", "كتابه"],
  ["محاسب", "محاسبه", "حسابات", "فواتير"],
  ["عسل", "سدر", "سمر", "نحل", "مناحل"],
  ["مانجو", "فواكه", "فاكهه", "بابايا", "مزرعه", "مزارع", "بستان"],
  ["خوص", "سعف", "سلال", "سله"],
  ["فخار", "جره", "طين"],
  ["محتوى", "تسويق", "سوشال", "ريلز", "انستقرام", "سناب"],
  ["تدريب", "تعاوني", "متدرب"],
  ["تطوع", "متطوع", "متطوعه", "تطوعي"],
  ["سباحه", "غوص"],
  ["بنات", "طالبات", "فتيات", "نسائيه"],
  ["اولاد", "طلاب", "شباب"],
  ["نجار", "نجاره", "خشب", "رفوف", "اثاث"],
].map((group) => group.map(normalizeArabic));

const synonymsOf = (word: string) => SYNONYM_GROUPS.filter((g) => g.includes(word)).flat();

type Variant = { form: string; factor: number };

/**
 * صيغ الكلمة للبحث مع وزن لكل صيغة: الكلمة كما كُتبت أولاً، ثم بدون «ال» واللواحق
 * الشائعة («المكيفات» ← «مكيف»)، ثم بدون «و» أو «ب» أو «ل» ملتصقة بكلمة طويلة
 * («لحفلة» ← «حفلة»)، ثم المرادفات. لا نجرّد اللواحق بعد حذف الحرف الملتصق،
 * حتى لا تصير «لقيمات» «قيم».
 */
function variantsOf(token: string): Variant[] {
  const forms = new Map<string, number>();
  const add = (form: string | undefined, factor: number) => {
    if (!form || (form.length < 3 && form !== token)) return;
    if ((forms.get(form) ?? 0) < factor) forms.set(form, factor);
  };
  const stemOf = (word: string) => word.match(/^(.{3,}?)(ات|ين|ون|ان|ه|ي)$/)?.[1];
  const article = token.match(/^(وبال|وال|بال|كال|فال|لل|ال)(.{3,})$/)?.[2];
  const particle = token.match(/^[وبل](.{4,})$/)?.[1];

  add(token, 1);
  add(article, 0.9);
  add(stemOf(token), 0.75);
  if (article) add(stemOf(article), 0.75);
  add(particle, 0.6);
  for (const [form, factor] of [...forms]) {
    for (const synonym of synonymsOf(form)) add(synonym, factor * 0.6);
  }
  return [...forms].map(([form, factor]) => ({ form, factor }));
}

/** أسماء المحافظات في نص البحث تُعامل كمكان، لا ككلمات (حتى لا تطابق «أبو» كل كنية) */
const AREA_ALIASES = (
  [
    ...GOVERNORATES.map((g) => [g.name, g.slug]),
    ["فيفا", "fifa"],
    ["الداير", "ad-dayer"],
    ["ابوعريش", "abu-arish"],
    ["جيزان", "jazan"],
  ] as [string, GovernorateSlug][]
)
  .map(([name, slug]) => [normalizeArabic(name), slug] as const)
  .sort((a, b) => b[0].length - a[0].length);

export type ParsedQuery = { words: Variant[][]; areas: GovernorateSlug[] };

export function parseQuery(query: string): ParsedQuery {
  let text = ` ${normalizeArabic(query)} `;
  const areas: GovernorateSlug[] = [];
  for (const [name, slug] of AREA_ALIASES) {
    const pattern = ` ${name} `;
    if (text.includes(pattern)) {
      if (!areas.includes(slug)) areas.push(slug);
      text = text.replaceAll(pattern, "  ");
    }
  }
  const words = text
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
    .slice(0, 12)
    .map(variantsOf);
  return { words, areas };
}

type Field = { text: string; weight: number };

function fieldsOf(listing: Listing): Field[] {
  const area = { text: areasOf(listing).map(governorateName).join(" "), weight: 2 };
  if (listing.kind === "talent") {
    return [
      { text: listing.name, weight: 5 },
      { text: listing.headline, weight: 5 },
      { text: getCategory(listing.category)?.name ?? "", weight: 3 },
      { text: listing.skills.join(" "), weight: 3 },
      { text: listing.services.map((s) => s.title).join(" "), weight: 2 },
      { text: listing.bio, weight: 1 },
      area,
    ];
  }
  if (listing.kind === "family") {
    return [
      { text: listing.name, weight: 5 },
      { text: listing.tagline, weight: 4 },
      { text: listing.categories.map((c) => getCategory(c)?.name ?? "").join(" "), weight: 3 },
      { text: listing.products.map((p) => `${p.name} ${p.description ?? ""}`).join(" "), weight: 3 },
      { text: listing.story, weight: 1 },
      area,
    ];
  }
  return [
    { text: listing.title, weight: 5 },
    { text: listing.poster.name, weight: 3 },
    { text: getCategory(listing.category)?.name ?? "", weight: 3 },
    { text: listing.description, weight: 1 },
    { text: listing.requirements.join(" "), weight: 1 },
    area,
  ];
}

/**
 * كلمات الحقل بصيغها «العارية»: الكلمة نفسها، وبدون «ال» وأخواتها،
 * وبدون واو العطف فقط (فحذف «ك» أو «ب» من أول الكلمة يجعل «كاميرا» تطابق «أمير»).
 * نطابق بداية الكلمة لا أي جزء منها، حتى لا تطابق «عود» كلمة «السعودية» ولا «حلي» كلمة «محلية».
 */
function wordsOf(text: string) {
  const out = new Set<string>();
  for (const word of normalizeArabic(text).split(" ")) {
    if (!word) continue;
    out.add(word);
    const noArticle = word.replace(/^(وبال|وال|بال|كال|فال|لل|ال)/, "");
    if (noArticle.length >= 2) out.add(noArticle);
    const noAnd = word.replace(/^و/, "");
    if (noAnd.length >= 3) out.add(noAnd);
  }
  return [...out];
}

const indexCache = new WeakMap<Listing, { words: string[]; weight: number }[]>();

function indexOf(listing: Listing) {
  let index = indexCache.get(listing);
  if (!index) {
    index = fieldsOf(listing).map((f) => ({ words: wordsOf(f.text), weight: f.weight }));
    indexCache.set(listing, index);
  }
  return index;
}

const hits = (words: string[], form: string) =>
  form.length < 3 ? words.includes(form) : words.some((w) => w.startsWith(form));

/** كم كلمة من كلمات البحث وُجدت (والمكان إن ذُكر)، ومجموع أوزان الحقول التي وُجدت فيها */
function match(listing: Listing, query: ParsedQuery) {
  const index = indexOf(listing);
  let words = 0;
  let score = 0;
  for (const variants of query.words) {
    let best = 0;
    for (const field of index) {
      for (const v of variants) {
        const weight = field.weight * v.factor;
        if (weight > best && hits(field.words, v.form)) best = weight;
      }
    }
    if (best > 0) {
      words += 1;
      score += best;
    }
  }
  const inArea = query.areas.some((a) => areasOf(listing).includes(a));
  return { words, matched: words + (inArea ? 1 : 0), score: score + (inArea ? 2 : 0) };
}

/**
 * ترتيب النتائج: نبدأ بالإعلانات التي تحتوي كل كلمات البحث.
 * وإن لم نجد، نقبل ما يحتوي نصف الكلمات على الأقل — فالعبارات الطبيعية
 * مثل «ابغى معلمة خصوصي للبنات في أبو عريش» تجد أقرب النتائج بدل لا شيء.
 * لكن لا نقبل نتيجة طابقت المكان وحده: من بحث عن «حناء صامطة» لا يريد فني تكييف في صامطة.
 */
export function rank<T extends Listing>(items: T[], query: string | undefined): T[] {
  if (!query?.trim()) return items;
  const parsed = parseQuery(query);
  const total = parsed.words.length + (parsed.areas.length > 0 ? 1 : 0);
  // بحث كله كلمات عامة («ابغى»، «في») لا يطابق شيئاً بعينه
  if (total === 0) return [];
  const results = items.map((item) => ({ item, ...match(item, parsed) }));
  const complete = results.filter((r) => r.matched === total);
  const pool = complete.length
    ? complete
    : results.filter((r) => r.words > 0 && r.matched >= Math.ceil(total / 2));
  return pool.sort((a, b) => b.matched - a.matched || b.score - a.score).map((r) => r.item);
}
