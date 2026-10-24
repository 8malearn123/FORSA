import "server-only";

import { createHash, randomInt } from "node:crypto";

import { queueLoginCode, razanEnabled } from "./notifications";
import { HOUR, MINUTE, release, take } from "./rate-limit";
import { newToken } from "./store";
import { db, must } from "./supabase";
import { sendLoginCode, whatsappEnabled } from "./whatsapp";

/** مدة صلاحية الرمز، ويطابقها إعداد انتهاء الزر في قالب واتساب */
export const CODE_MINUTES = 10;
/** بعدها يُلغى الرمز ويلزم طلب غيره */
const MAX_TRIES = 5;

/** الرموز في جدول forsa_codes ببصمتها فقط، لا بالرمز نفسه */
const digest = (id: string, code: string) => createHash("sha256").update(`${id}:${code}`).digest("hex");

/** يحجز من كل الحدود معاً، وإن تجاوز أحدها يعيد ما حجزه */
async function takeAll(limits: [key: string, limit: number, windowMs: number][]) {
  const taken: string[] = [];
  for (const [key, limit, windowMs] of limits) {
    if (!(await take(key, limit, windowMs))) {
      await Promise.all(taken.map(release));
      return null;
    }
    taken.push(key);
  }
  return taken;
}

export type Issued =
  | { status: "sent"; id: string; devCode?: string }
  | { status: "wait" }
  | { status: "limited" }
  | { status: "failed" };

/**
 * يولّد رمزاً من ٦ أرقام ويرسله إلى واتساب الرقم عبر رزان (FORSA_RAZAN_KEY)، وإلا عبر WhatsApp Cloud API.
 * الحدود تحمي أصحاب الأرقام من الإزعاج وتحمي رقم الإرسال: دقيقة بين كل رمزين، و٥ رموز في الساعة
 * لكل رقم، و١٠ لكل زائر. أثناء التطوير، ودون أي منهما، يُرجع الرمز ليظهر في الصفحة بدل إرساله.
 */
export async function issueCode(phone: string, visitor: string): Promise<Issued> {
  const wait = `code-wait:${phone}`;
  if (!(await take(wait, 1, MINUTE))) return { status: "wait" };
  const reserved = await takeAll([
    [`code-phone:${phone}`, 5, HOUR],
    [`code-visitor:${visitor}`, 10, HOUR],
    ["code-all", 500, HOUR],
  ]);
  if (!reserved) return { status: "limited" };

  const now = Date.now();
  const codes = () => db().from("forsa_codes");
  must(await codes().delete().lte("expires_at", new Date(now).toISOString()));
  const id = newToken();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expires_at = new Date(now + CODE_MINUTES * MINUTE).toISOString();
  must(await codes().insert({ id, phone, hash: digest(id, code), expires_at }));
  // الرمز الجديد يلغي ما قبله لنفس الرقم، بعد التأكد من إرساله فقط
  const sent = async () => must(await codes().delete().eq("phone", phone).neq("id", id));

  if (!razanEnabled() && !whatsappEnabled() && process.env.NODE_ENV !== "production") {
    console.info(`[forsa] رمز الدخول للرقم ${phone}: ${code}`);
    await sent();
    return { status: "sent", id, devCode: code };
  }
  try {
    const delivered = razanEnabled()
      ? await queueLoginCode(phone, code, expires_at)
      : await sendLoginCode(phone, code);
    if (delivered) {
      await sent();
      return { status: "sent", id };
    }
  } catch (error) {
    console.error("[forsa] login code send failed", error);
  }
  if (!razanEnabled() && !whatsappEnabled()) {
    console.error("[forsa] Neither Razan nor WhatsApp is configured, so login codes can't be sent");
  }
  // لم يُرسل شيء، فلا نحسبه على صاحب الرقم
  must(await codes().delete().eq("id", id));
  await Promise.all([wait, ...reserved].map(release));
  return { status: "failed" };
}

export type Checked = { status: "ok"; phone: string } | { status: "wrong" } | { status: "expired" };

/** يتحقق من الرمز. الرمز الصحيح يُستخدم مرة واحدة، والخطأ المتكرر يلغيه */
export async function checkCode(id: string, code: string): Promise<Checked> {
  const rows = must(
    await db().rpc("forsa_check_code", { p_id: id, p_hash: digest(id, code), p_max_tries: MAX_TRIES }),
  ) as { status: Checked["status"]; phone: string | null }[];
  const row = rows[0];
  if (row?.status === "ok" && row.phone) return { status: "ok", phone: row.phone };
  return { status: row?.status === "wrong" ? "wrong" : "expired" };
}
