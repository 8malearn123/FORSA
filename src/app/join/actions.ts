"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { COUNT, countLabel, formatNumber } from "@/lib/format";
import { imagesOf } from "@/lib/listing";
import { HOUR, release, take, visitorKey } from "@/lib/rate-limit";
import { collectionOf, hashToken, insertListing, mutateStore, newId, readStore } from "@/lib/store";
import {
  CATEGORIES,
  EXPERIENCE,
  GOVERNORATES,
  OPPORTUNITY_TYPES,
  POSTER_TYPES,
  PRODUCT_CATEGORIES,
  SEEKING,
  SKILL_CATEGORIES,
} from "@/lib/taxonomy";
import { normalizeSaudiMobile } from "@/lib/text";
import type { Contact, Family, Listing, ListingKind, Opportunity, Product, Talent } from "@/lib/types";
import { UploadError, discardImages, saveImage } from "@/lib/uploads";

export type FormState =
  { status: "idle" } | { status: "error"; message: string; errors: Record<string, string> };

type Parsed<T> = { ok: true; data: T; saved: string[] } | { ok: false; state: FormState };

const slugs = <T extends readonly { slug: string }[]>(list: T) =>
  list.map((x) => x.slug) as [T[number]["slug"], ...T[number]["slug"][]];

/** لقيم لا تأتي إلا من نموذج معدّل يدوياً */
const CHOOSE = "اختر من الخيارات المتاحة";

/** «حرفين»، «٣ أحرف»، «٤٠ حرفاً»، «٨٠٠ حرف» */
const letters = (n: number) => countLabel(n, COUNT.letter, { accusative: true });

/** نص مطلوب؛ fem للكلمات المؤنثة («النبذة قصيرة»، «التفاصيل مطلوبة») */
const text = (min: number, max: number, label: string, fem = false) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} ${fem ? "مطلوبة" : "مطلوب"}` })
    .min(min, { error: `${label} ${fem ? "قصيرة" : "قصير"}، اكتب ${letters(min)} على الأقل` })
    .max(max, { error: `${label} ${fem ? "طويلة" : "طويل"}، الحد الأقصى ${letters(max)}` });

const optionalText = (max: number, label = "النص") =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} طويل، الحد الأقصى ${letters(max)}` })
    .transform((v) => v || undefined)
    .optional();

const mobile = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const n = normalizeSaudiMobile(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "اكتب رقم جوال سعودي صحيح مثل 05xxxxxxxx" });
      return z.NEVER;
    }
    return "0" + n.slice(3);
  })
  .optional();

/** يقبل «@name» أو «name» أو رابط الحساب كما يُنسخ من التطبيق (مع ?igsh=…) */
function instagramHandle(raw: string): string | null | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  let handle = value.replace(/^@/, "");
  if (/instagram\.com/i.test(value)) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return null;
      handle = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      return null;
    }
  }
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

/** رابط أعمال: http أو https فقط، ويُضاف https إن لم يُكتب */
function websiteUrl(raw: string): string | null | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  if (/^[a-z][a-z0-9+-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const contactSchema = z
  .object({
    whatsapp: mobile,
    phone: mobile,
    email: z
      .string()
      .trim()
      .max(120, { error: "البريد الإلكتروني طويل" })
      .transform((v) => v || undefined)
      .pipe(z.email({ error: "البريد الإلكتروني غير صحيح" }).optional())
      .optional(),
    instagram: z
      .string()
      .max(200, { error: "اسم الحساب طويل" })
      .transform((v, ctx) => {
        const handle = instagramHandle(v);
        if (handle === null) {
          ctx.addIssue({ code: "custom", message: "اكتب اسم حساب انستقرام صحيحاً أو رابط الحساب" });
          return z.NEVER;
        }
        return handle;
      })
      .optional(),
    website: z
      .string()
      .max(200, { error: "الرابط طويل" })
      .transform((v, ctx) => {
        const url = websiteUrl(v);
        if (url === null) {
          ctx.addIssue({ code: "custom", message: "اكتب رابطاً صحيحاً يبدأ بـ https" });
          return z.NEVER;
        }
        return url;
      })
      .optional(),
    consent: z.literal("on", { error: "نحتاج موافقتك على عرض وسائل التواصل للمهتمين" }),
  })
  .refine((c) => c.whatsapp || c.phone || c.email, {
    error: "أضف وسيلة تواصل واحدة على الأقل",
    path: ["whatsapp"],
  });

/** نربط كل خطأ بالحقل الأعلى (مثلاً خطأ في منتج يظهر تحت قائمة المنتجات) */
function issuesToErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    errors[key] ??= issue.message;
  }
  return errors;
}

function fail(errors: Record<string, string>, message = "راجع الحقول المظللة ثم أعد المحاولة."): FormState {
  return { status: "error", message, errors };
}

const UNEXPECTED = "تعذّر حفظ الإعلان الآن. بياناتك ما زالت هنا، حاول مرة أخرى بعد قليل.";

/** حقل مخفي يملؤه الروبوت فقط */
const isBot = (fd: FormData) => String(fd.get("website_url") ?? "") !== "";

/**
 * حد النشر لكل زائر: ٨ إعلانات في الساعة في الإنتاج (وحد واسع أثناء التطوير والاختبار).
 * يُحسب بعد نجاح التحقق فقط، فأخطاء النموذج لا تستهلك منه شيئاً.
 */
const POSTS_PER_HOUR = process.env.NODE_ENV === "production" ? 8 : 200;

const limited = () => fail({}, "نشرت عدة إعلانات خلال وقت قصير. حاول مرة أخرى بعد قليل.");

/** المتصفحات ترسل أسطر النصوص الطويلة بـ \r\n؛ نوحّدها حتى يتطابق العد مع ما يراه المستخدم */
const clean = (value: FormDataEntryValue | null | undefined) => String(value ?? "").replace(/\r\n?/g, "\n");
const get = (fd: FormData, key: string) => clean(fd.get(key));
const at = (fd: FormData, key: string, i: number) => clean(fd.getAll(key)[i]).trim();
const lines = (value: string, max: number) =>
  value
    .split(/[\n،,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);

function contactFrom(fd: FormData) {
  return contactSchema.safeParse({
    whatsapp: get(fd, "whatsapp"),
    phone: get(fd, "phone"),
    email: get(fd, "email"),
    instagram: get(fd, "instagram"),
    website: get(fd, "website"),
    consent: fd.get("consent") ?? undefined,
  });
}

const cleanContact = (c: z.infer<typeof contactSchema>): Contact => ({
  whatsapp: c.whatsapp,
  phone: c.phone,
  email: c.email,
  instagram: c.instagram,
  website: c.website,
});

function invalid(...results: z.ZodSafeParseResult<unknown>[]): FormState | null {
  const errors = Object.assign({}, ...results.map((r) => (r.success ? {} : issuesToErrors(r.error))));
  return Object.keys(errors).length ? fail(errors) : null;
}

/**
 * صورة صف واحد: ملف جديد إن رُفع، وإلا الصورة الحالية إن طلب إبقاءها
 * (ونتحقق أنها فعلاً من صور الإعلان نفسه).
 */
async function imageFor(
  file: FormDataEntryValue | null,
  keep: string,
  allowed: Set<string>,
  saved: string[],
) {
  const fresh = await saveImage(file);
  if (fresh) {
    saved.push(fresh);
    return fresh;
  }
  return keep && allowed.has(keep) ? keep : undefined;
}

/* ─────────────── أصحاب المهارات ─────────────── */

const talentSchema = z.object({
  name: text(2, 40, "الاسم"),
  gender: z.enum(["m", "f"], { error: "اختر أحد الخيارين" }),
  headline: text(3, 60, "المسمى"),
  category: z.enum(slugs(SKILL_CATEGORIES), { error: "اختر المجال" }),
  governorate: z.enum(slugs(GOVERNORATES), { error: "اختر المحافظة" }),
  remote: z.boolean(),
  bio: text(40, 800, "النبذة", true),
  skills: z
    .array(z.string().max(40, { error: `كل مهارة يجب ألا تتجاوز ${letters(40)}` }))
    .min(1, { error: "أضف مهارة واحدة على الأقل" })
    .max(10, { error: `حتى ${formatNumber(10)} مهارات` }),
  experience: z.enum(slugs(EXPERIENCE), { error: "اختر مستوى خبرتك" }),
  seeking: z.array(z.enum(slugs(SEEKING), { error: CHOOSE })).min(1, { error: "اختر ما تبحث عنه" }),
  services: z
    .array(
      z.object({
        title: z.string().max(80, { error: `اسم الخدمة طويل، الحد الأقصى ${letters(80)}` }),
        priceHint: z
          .string()
          .max(40, { error: `السعر التقريبي طويل، الحد الأقصى ${letters(40)}` })
          .optional(),
      }),
    )
    .max(6, { error: `حتى ${formatNumber(6)} خدمات` }),
});

type TalentFields = Omit<Talent, "kind" | "id" | "createdAt" | "available" | "seed" | "hidden" | "moderated">;

async function readTalent(fd: FormData, existing?: Talent): Promise<Parsed<TalentFields>> {
  const parsed = talentSchema.safeParse({
    name: get(fd, "name"),
    gender: get(fd, "gender") || undefined,
    headline: get(fd, "headline"),
    category: get(fd, "category") || undefined,
    governorate: get(fd, "governorate") || undefined,
    remote: fd.get("remote") === "on",
    bio: get(fd, "bio"),
    skills: lines(get(fd, "skills"), 10),
    experience: get(fd, "experience") || undefined,
    seeking: fd.getAll("seeking").map(String),
    services: fd
      .getAll("service_title")
      .map((t, i) => ({ title: clean(t).trim(), priceHint: at(fd, "service_price", i) || undefined }))
      .filter((s) => s.title),
  });
  const contact = contactFrom(fd);
  const bad = invalid(parsed, contact);
  if (bad || !parsed.success || !contact.success) return { ok: false, state: bad ?? fail({}) };

  const saved: string[] = [];
  const allowed = new Set(existing?.work.map((w) => w.image));
  const work: Talent["work"] = [];
  try {
    const files = fd.getAll("work_image");
    for (let i = 0; i < Math.min(files.length, 4); i++) {
      const image = await imageFor(files[i], at(fd, "work_keep", i), allowed, saved);
      if (image) work.push({ image, caption: at(fd, "work_caption", i).slice(0, 80) || "من أعمالي" });
    }
  } catch (error) {
    await discardImages(saved);
    if (error instanceof UploadError)
      return { ok: false, state: fail({ work: error.message }, error.message) };
    throw error;
  }

  const { remote, ...data } = parsed.data;
  return {
    ok: true,
    saved,
    data: { ...data, remote: remote || undefined, work, contact: cleanContact(contact.data) },
  };
}

/* ─────────────── الأسر المنتجة ─────────────── */

const familySchema = z.object({
  name: text(2, 50, "اسم الأسرة أو المشروع"),
  tagline: text(6, 90, "الوصف المختصر"),
  governorate: z.enum(slugs(GOVERNORATES), { error: "اختر المحافظة" }),
  categories: z
    .array(z.enum(slugs(PRODUCT_CATEGORIES), { error: CHOOSE }))
    .min(1, { error: "اختر تصنيفاً واحداً على الأقل" })
    .max(3, { error: "اختر ثلاثة تصنيفات كحد أقصى" }),
  story: text(40, 900, "الحكاية", true),
  events: z.boolean(),
  capacity: optionalText(40, "العدد"),
  notice: optionalText(40, "موعد الطلب المسبق"),
  products: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(2, { error: "اسم المنتج مطلوب" })
          .max(60, { error: `اسم المنتج طويل، الحد الأقصى ${letters(60)}` }),
        description: optionalText(160, "وصف المنتج"),
        priceHint: optionalText(40, "السعر التقريبي"),
      }),
    )
    .min(1, { error: "أضف منتجاً واحداً على الأقل" })
    .max(8, { error: `حتى ${formatNumber(8)} منتجات` }),
});

type FamilyFields = Omit<Family, "kind" | "id" | "createdAt" | "seed" | "hidden" | "moderated">;

async function readFamily(fd: FormData, existing?: Family): Promise<Parsed<FamilyFields>> {
  const names = fd.getAll("product_name").map((n) => clean(n).trim());
  const rows = names.map((name, i) => ({ name, i })).filter((r) => r.name);
  const parsed = familySchema.safeParse({
    name: get(fd, "name"),
    tagline: get(fd, "tagline"),
    governorate: get(fd, "governorate") || undefined,
    categories: fd.getAll("categories").map(String),
    story: get(fd, "story"),
    events: fd.get("events") === "on",
    capacity: get(fd, "capacity"),
    notice: get(fd, "notice"),
    products: rows.map(({ name, i }) => ({
      name,
      description: at(fd, "product_description", i),
      priceHint: at(fd, "product_price", i),
    })),
  });
  const contact = contactFrom(fd);
  const bad = invalid(parsed, contact);
  if (bad || !parsed.success || !contact.success) return { ok: false, state: bad ?? fail({}) };

  const saved: string[] = [];
  const allowed = new Set(
    [existing?.cover, ...(existing?.products.map((p) => p.image) ?? [])].filter((s): s is string =>
      Boolean(s),
    ),
  );
  const knownIds = new Set(existing?.products.map((p) => p.id));
  const files = fd.getAll("product_image");
  const products: Product[] = [];
  let cover: string | undefined;
  try {
    cover = await imageFor(fd.get("cover"), get(fd, "cover_keep"), allowed, saved);
    for (const [row, { i }] of rows.entries()) {
      const id = at(fd, "product_id", i);
      products.push({
        ...parsed.data.products[row],
        id: knownIds.has(id) ? id : newId(),
        image: await imageFor(files[i] ?? null, at(fd, "product_keep", i), allowed, saved),
      });
    }
  } catch (error) {
    await discardImages(saved);
    if (error instanceof UploadError)
      return { ok: false, state: fail({ products: error.message }, error.message) };
    throw error;
  }

  const { name, tagline, governorate, categories, story, events, capacity, notice } = parsed.data;
  return {
    ok: true,
    saved,
    data: {
      name,
      tagline,
      governorate,
      categories,
      story,
      products,
      // الغلاف يُحفظ فقط إن رُفع صراحة؛ وإلا تُعرض أول صورة منتج مكانه
      cover,
      events: events ? { capacity, notice } : undefined,
      contact: cleanContact(contact.data),
    },
  };
}

/* ─────────────── الفرص ─────────────── */

const opportunitySchema = z.object({
  posterType: z.enum(slugs(POSTER_TYPES), { error: "اختر نوع الناشر" }),
  posterName: text(2, 60, "الاسم"),
  type: z.enum(slugs(OPPORTUNITY_TYPES), { error: "اختر نوع الفرصة" }),
  title: text(6, 90, "عنوان الفرصة"),
  category: z.enum(slugs(CATEGORIES), { error: "اختر المجال" }),
  governorate: z.enum(slugs(GOVERNORATES), { error: "اختر المحافظة" }),
  remote: z.boolean(),
  description: text(30, 1200, "التفاصيل", true),
  requirements: z
    .array(z.string().max(120, { error: `كل متطلب يجب ألا يتجاوز ${letters(120)}` }))
    .max(8, { error: `حتى ${formatNumber(8)} متطلبات` }),
  when: optionalText(60, "الموعد"),
  quantity: optionalText(40, "العدد"),
  budget: optionalText(60, "المبلغ"),
});

type OpportunityFields = Omit<
  Opportunity,
  "kind" | "id" | "createdAt" | "seed" | "hidden" | "moderated" | "closed" | "renewedAt"
>;

/** نحذف علامات القوائم فقط («-»، «•»، «١.»، «2)») ونُبقي الأرقام التي هي جزء من النص («3 سنوات خبرة») */
const LIST_MARKER = /^\s*(?:[-–•*·]+|[\d٠-٩]+\s*[.)\-–])\s*/;

async function readOpportunity(fd: FormData): Promise<Parsed<OpportunityFields>> {
  const parsed = opportunitySchema.safeParse({
    posterType: get(fd, "posterType") || undefined,
    posterName: get(fd, "posterName"),
    type: get(fd, "type") || undefined,
    title: get(fd, "title"),
    category: get(fd, "category") || undefined,
    governorate: get(fd, "governorate") || undefined,
    remote: fd.get("remote") === "on",
    description: get(fd, "description"),
    requirements: get(fd, "requirements")
      .split("\n")
      .map((s) => s.replace(LIST_MARKER, "").trim())
      .filter(Boolean)
      .slice(0, 8),
    when: get(fd, "when"),
    quantity: get(fd, "quantity"),
    budget: get(fd, "budget"),
  });
  const contact = contactFrom(fd);
  const bad = invalid(parsed, contact);
  if (bad || !parsed.success || !contact.success) return { ok: false, state: bad ?? fail({}) };

  const { posterType, posterName, remote, ...data } = parsed.data;
  return {
    ok: true,
    saved: [],
    data: {
      ...data,
      poster: { type: posterType, name: posterName },
      remote: remote || undefined,
      contact: cleanContact(contact.data),
    },
  };
}

/* ─────────────── النشر ─────────────── */

type Stamp = { id: string; createdAt: string };

/**
 * خطوات النشر المشتركة: التحقق، ثم حد النشر، ثم الحفظ والانتقال لصفحة الإدارة.
 * أي خطأ غير متوقع يرجع رسالة ودّية ويُبقي ما كتبه الزائر في النموذج.
 */
async function publish<T>(
  fd: FormData,
  read: (fd: FormData) => Promise<Parsed<T>>,
  toListing: (data: T, stamp: Stamp) => Listing,
): Promise<FormState> {
  if (isBot(fd)) return fail({}, "تعذّر إرسال النموذج.");
  let reserved: string | undefined;
  let saved: string[] = [];
  let token: string;
  try {
    const result = await read(fd);
    if (!result.ok) return result.state;
    saved = result.saved;
    const key = `post:${await visitorKey()}`;
    if (!take(key, POSTS_PER_HOUR, HOUR)) {
      await discardImages(saved);
      return limited();
    }
    reserved = key;
    token = await insertListing(toListing(result.data, { id: newId(), createdAt: new Date().toISOString() }));
  } catch (error) {
    console.error("[forsa] publish failed", error);
    if (reserved) release(reserved);
    await discardImages(saved).catch(() => undefined);
    return fail({}, UNEXPECTED);
  }
  redirect(`/manage/${token}?new=1`);
}

export async function createTalent(_prev: FormState, fd: FormData): Promise<FormState> {
  return publish(fd, readTalent, (data, stamp) => ({ ...stamp, ...data, kind: "talent", available: true }));
}

export async function createFamily(_prev: FormState, fd: FormData): Promise<FormState> {
  return publish(fd, readFamily, (data, stamp) => ({ ...stamp, ...data, kind: "family" }));
}

export async function createOpportunity(_prev: FormState, fd: FormData): Promise<FormState> {
  return publish(fd, readOpportunity, (data, stamp) => ({ ...stamp, ...data, kind: "opportunity" }));
}

/* ─────────────── التعديل من رابط الإدارة ─────────────── */

async function ownedListing(token: string, kind: ListingKind) {
  const store = await readStore();
  const owner = store.owners[hashToken(token)];
  if (!owner || owner.kind !== kind) return null;
  return collectionOf(store, kind).find((l) => l.id === owner.id) ?? null;
}

/**
 * نُبقي فقط الصور التي ما زالت تابعة للإعلان الآن (أو التي رُفعت في هذا الحفظ)،
 * فحفظان متزامنان من نافذتين لا يتركان صورة محذوفة في الإعلان.
 */
function keepKnownImages(listing: Listing, allowed: Set<string>): Listing {
  const ok = (src?: string) => (src && allowed.has(src) ? src : undefined);
  if (listing.kind === "talent") {
    return { ...listing, work: listing.work.filter((w) => allowed.has(w.image)) };
  }
  if (listing.kind === "family") {
    return {
      ...listing,
      cover: ok(listing.cover),
      products: listing.products.map((p) => ({ ...p, image: ok(p.image) })),
    };
  }
  return listing;
}

/** يحفظ التعديل مع الإبقاء على المعرّف وتاريخ النشر والحالة، ويحذف الصور التي لم تعد مستخدمة */
async function saveEdit(
  token: string,
  kind: ListingKind,
  fields: object,
  saved: string[],
): Promise<FormState> {
  let replaced: { before: Listing; after: Listing } | null;
  try {
    replaced = await mutateStore((store) => {
      const owner = store.owners[hashToken(token)];
      if (!owner || owner.kind !== kind) return null;
      const list = collectionOf(store, kind);
      const index = list.findIndex((l) => l.id === owner.id);
      if (index < 0) return null;
      const before = list[index];
      const allowed = new Set([...imagesOf(before), ...saved].filter((s): s is string => Boolean(s)));
      list[index] = keepKnownImages({ ...before, ...fields } as Listing, allowed);
      return { before, after: list[index] };
    });
  } catch (error) {
    console.error("[forsa] edit failed", error);
    await discardImages(saved).catch(() => undefined);
    return fail({}, UNEXPECTED);
  }
  if (!replaced) {
    await discardImages(saved);
    return fail({}, "رابط الإدارة لم يعد صالحاً، ربما حُذف الإعلان.");
  }
  const kept = new Set(imagesOf(replaced.after));
  await discardImages([...imagesOf(replaced.before), ...saved].filter((src) => src && !kept.has(src))).catch(
    () => undefined,
  );
  redirect(`/manage/${token}?saved=1`);
}

async function edit<T extends Listing>(
  token: string,
  kind: ListingKind,
  fd: FormData,
  read: (fd: FormData, existing: T) => Promise<Parsed<object>>,
): Promise<FormState> {
  let result: Parsed<object>;
  try {
    const existing = await ownedListing(token, kind);
    if (!existing) return fail({}, "رابط الإدارة غير صالح.");
    result = await read(fd, existing as T);
  } catch (error) {
    console.error("[forsa] edit failed", error);
    return fail({}, UNEXPECTED);
  }
  if (!result.ok) return result.state;
  return saveEdit(token, kind, result.data, result.saved);
}

export async function updateTalent(token: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return edit<Talent>(token, "talent", fd, readTalent);
}

export async function updateFamily(token: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return edit<Family>(token, "family", fd, readFamily);
}

export async function updateOpportunity(token: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return edit<Opportunity>(token, "opportunity", fd, (form) => readOpportunity(form));
}
