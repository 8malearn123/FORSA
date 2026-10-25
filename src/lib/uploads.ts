import "server-only";

import sharp from "sharp";

import { newId } from "./store";
import { db, must } from "./supabase";

/** حاوية خاصة على Supabase Storage، والصور تُقدَّم عبر مسار /media في التطبيق */
const bucket = () => db().storage.from("media");

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
export const MEDIA_NAME = /^[a-z0-9]{8,40}\.webp$/;

export class UploadError extends Error {}

const isFile = (v: FormDataEntryValue | null): v is File =>
  typeof v === "object" && v !== null && "arrayBuffer" in v && v.size > 0;

/**
 * يعيد ترميز الصورة على الخادم: تدوير صحيح، تصغير، وحذف كل البيانات الوصفية
 * (ومنها موقع التصوير الجغرافي — مهم لأسر تصوّر من بيوتها).
 * ملفات SVG تُحوَّل لصورة عادية بدقة عالية، فلا يُقدَّم أي SVG مرفوع كما هو.
 */
export async function saveImage(
  entry: FormDataEntryValue | null,
  { side = 1600 } = {},
): Promise<string | undefined> {
  if (!isFile(entry)) return undefined;
  if (entry.size > MAX_UPLOAD_BYTES) throw new UploadError("حجم الصورة كبير، الحد الأقصى ٦ ميجابايت.");
  let output: Buffer;
  try {
    const svg = entry.type === "image/svg+xml";
    output = await sharp(Buffer.from(await entry.arrayBuffer()), {
      limitInputPixels: 50_000_000,
      ...(svg ? { density: 300 } : {}),
    })
      .rotate()
      .resize({ width: side, height: side, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new UploadError("تعذّر قراءة إحدى الصور. جرّب صورة بصيغة JPG أو PNG.");
  }
  const name = `${newId()}${newId()}.webp`;
  must(await bucket().upload(name, output, { contentType: "image/webp", cacheControl: "31536000" }));
  return `/media/${name}`;
}

/** حذف صور مرفوعة (عند فشل النشر أو حذف الإعلان) */
export async function discardImages(sources: (string | undefined)[]) {
  const names = sources
    .map((src) => src?.replace(/^\/media\//, ""))
    .filter((name): name is string => Boolean(name && MEDIA_NAME.test(name)));
  if (names.length) must(await bucket().remove(names));
}

export async function readMedia(name: string) {
  if (!MEDIA_NAME.test(name)) return null;
  const { data, error } = await bucket().download(name);
  return error || !data ? null : Buffer.from(await data.arrayBuffer());
}
