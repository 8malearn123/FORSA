import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { UPLOADS_DIR, newId } from "./store";

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
export const MEDIA_NAME = /^[a-z0-9]{8,40}\.webp$/;

export class UploadError extends Error {}

const isFile = (v: FormDataEntryValue | null): v is File =>
  typeof v === "object" && v !== null && "arrayBuffer" in v && v.size > 0;

/**
 * يعيد ترميز الصورة على الخادم: تدوير صحيح، تصغير، وحذف كل البيانات الوصفية
 * (ومنها موقع التصوير الجغرافي — مهم لأسر تصوّر من بيوتها).
 */
export async function saveImage(entry: FormDataEntryValue | null): Promise<string | undefined> {
  if (!isFile(entry)) return undefined;
  if (entry.size > MAX_UPLOAD_BYTES) throw new UploadError("حجم الصورة كبير، الحد الأقصى ٦ ميجابايت.");
  let output: Buffer;
  try {
    output = await sharp(Buffer.from(await entry.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new UploadError("تعذّر قراءة إحدى الصور. جرّب صورة بصيغة JPG أو PNG.");
  }
  const name = `${newId()}${newId()}.webp`;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, name), output);
  return `/media/${name}`;
}

/** حذف صور مرفوعة (عند فشل النشر أو حذف الإعلان) */
export async function discardImages(sources: (string | undefined)[]) {
  for (const src of sources) {
    const name = src?.replace(/^\/media\//, "");
    if (name && MEDIA_NAME.test(name)) await fs.rm(path.join(UPLOADS_DIR, name), { force: true });
  }
}

export async function readMedia(name: string) {
  if (!MEDIA_NAME.test(name)) return null;
  try {
    return await fs.readFile(path.join(UPLOADS_DIR, name));
  } catch {
    return null;
  }
}
