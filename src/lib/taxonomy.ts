/** المحافظات — «فرصة» تبدأ من منطقة جازان فقط */
export const GOVERNORATES = [
  { slug: "jazan", name: "جازان" },
  { slug: "sabya", name: "صبيا" },
  { slug: "abu-arish", name: "أبو عريش" },
  { slug: "samtah", name: "صامطة" },
  { slug: "baish", name: "بيش" },
  { slug: "ad-darb", name: "الدرب" },
  { slug: "damad", name: "ضمد" },
  { slug: "farasan", name: "فرسان" },
  { slug: "fifa", name: "فيفاء" },
  { slug: "ad-dayer", name: "الدائر" },
  { slug: "al-harth", name: "الحرث" },
  { slug: "al-aridhah", name: "العارضة" },
  { slug: "al-idabi", name: "العيدابي" },
  { slug: "al-reeth", name: "الريث" },
  { slug: "harub", name: "هروب" },
  { slug: "ahad-al-masarihah", name: "أحد المسارحة" },
  { slug: "at-tuwal", name: "الطوال" },
] as const;

export type GovernorateSlug = (typeof GOVERNORATES)[number]["slug"];

export const governorateName = (slug: string) => GOVERNORATES.find((g) => g.slug === slug)?.name ?? "جازان";

export const isGovernorate = (slug: unknown): slug is GovernorateSlug =>
  GOVERNORATES.some((g) => g.slug === slug);

/**
 * التصنيفات: جزء للمهارات والخدمات (أصحاب المهارات)،
 * وجزء للمنتجات (الأسر المنتجة). الفرص تستخدم الاثنين.
 */
export const CATEGORIES = [
  // مهارات وخدمات
  { slug: "design", name: "التصميم والإبداع", short: "تصميم", group: "skills", icon: "palette" },
  { slug: "photography", name: "التصوير والمونتاج", short: "تصوير", group: "skills", icon: "camera" },
  { slug: "tech", name: "التقنية والبرمجة", short: "تقنية", group: "skills", icon: "code" },
  { slug: "education", name: "التعليم والدروس", short: "تعليم", group: "skills", icon: "book" },
  { slug: "maintenance", name: "الصيانة والحِرف", short: "صيانة", group: "skills", icon: "wrench" },
  { slug: "events", name: "تنظيم المناسبات", short: "مناسبات", group: "skills", icon: "party" },
  { slug: "marketing", name: "التسويق وصناعة المحتوى", short: "محتوى", group: "skills", icon: "megaphone" },
  { slug: "writing", name: "الكتابة والترجمة", short: "ترجمة", group: "skills", icon: "languages" },
  { slug: "beauty", name: "التجميل والحناء", short: "حناء", group: "skills", icon: "hand" },
  { slug: "arts", name: "الخط والفنون", short: "فنون", group: "skills", icon: "pen" },
  { slug: "business", name: "المحاسبة والإدارة", short: "محاسبة", group: "skills", icon: "calculator" },
  { slug: "sales", name: "المبيعات وخدمة العملاء", short: "مبيعات", group: "skills", icon: "store" },
  { slug: "sports", name: "الرياضة والتدريب", short: "رياضة", group: "skills", icon: "waves" },
  // منتجات الأسر
  { slug: "catering", name: "ضيافة ومناسبات", short: "ضيافة", group: "products", icon: "dallah" },
  { slug: "traditional-food", name: "أكلات شعبية", short: "أكلات", group: "products", icon: "pot" },
  { slug: "sweets", name: "حلويات ومخبوزات", short: "حلويات", group: "products", icon: "cake" },
  { slug: "crafts", name: "مشغولات يدوية", short: "مشغولات", group: "products", icon: "basket" },
  { slug: "gifts", name: "هدايا وتنسيق", short: "هدايا", group: "products", icon: "gift" },
  { slug: "perfume", name: "عطور وبخور", short: "بخور", group: "products", icon: "mabkhara" },
  { slug: "farm", name: "منتجات زراعية وعسل", short: "مزارع", group: "products", icon: "sprout" },
  { slug: "sewing", name: "خياطة وتطريز", short: "خياطة", group: "products", icon: "scissors" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type CategoryIcon = (typeof CATEGORIES)[number]["icon"];
export type Category = (typeof CATEGORIES)[number];

export const SKILL_CATEGORIES = CATEGORIES.filter((c) => c.group === "skills");
export const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c.group === "products");

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const isCategory = (slug: unknown): slug is CategorySlug => CATEGORIES.some((c) => c.slug === slug);

/** ما يبحث عنه صاحب المهارة */
export const SEEKING = [
  { slug: "full-time", name: "وظيفة بدوام كامل", short: "دوام كامل" },
  { slug: "part-time", name: "دوام جزئي", short: "دوام جزئي" },
  { slug: "freelance", name: "عمل حر ومشاريع", short: "عمل حر" },
  { slug: "extra-income", name: "دخل إضافي", short: "دخل إضافي" },
] as const;

export type Seeking = (typeof SEEKING)[number]["slug"];
export const seekingName = (slug: string) => SEEKING.find((s) => s.slug === slug)?.short ?? slug;

export const EXPERIENCE = [
  { slug: "starter", name: "في بداية الطريق" },
  { slug: "1-3", name: "من سنة إلى ٣ سنوات" },
  { slug: "3-5", name: "من ٣ إلى ٥ سنوات" },
  { slug: "5+", name: "أكثر من ٥ سنوات" },
] as const;

export type ExperienceLevel = (typeof EXPERIENCE)[number]["slug"];
export const experienceName = (slug: string) => EXPERIENCE.find((e) => e.slug === slug)?.name ?? "";

/** أنواع الفرص */
export const OPPORTUNITY_TYPES = [
  { slug: "job", name: "وظيفة", short: "وظيفة", hint: "دوام كامل أو جزئي" },
  { slug: "task", name: "مهمة أو خدمة", short: "مهمة", hint: "عمل محدد لمرة واحدة" },
  { slug: "order", name: "طلب منتجات أو ضيافة", short: "طلب منتجات", hint: "من الأسر المنتجة" },
  { slug: "training", name: "تدريب", short: "تدريب", hint: "تدريب تعاوني أو صيفي" },
  { slug: "volunteer", name: "تطوع", short: "تطوع", hint: "لخدمة المجتمع" },
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]["slug"];
export const opportunityTypeName = (slug: string) =>
  OPPORTUNITY_TYPES.find((t) => t.slug === slug)?.name ?? slug;
export const opportunityTypeShort = (slug: string) =>
  OPPORTUNITY_TYPES.find((t) => t.slug === slug)?.short ?? slug;

/** من ينشر الفرصة */
export const POSTER_TYPES = [
  { slug: "individual", name: "فرد" },
  { slug: "company", name: "شركة أو مؤسسة" },
  { slug: "organization", name: "جهة أو جمعية" },
] as const;

export type PosterType = (typeof POSTER_TYPES)[number]["slug"];
export const posterTypeName = (slug: string) => POSTER_TYPES.find((t) => t.slug === slug)?.name ?? slug;
