import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { HOUR, MINUTE, release, take } from "./rate-limit";
import { newToken } from "./store";
import { sendLoginCode, whatsappEnabled } from "./whatsapp";

/** مدة صلاحية الرمز، ويطابقها إعداد انتهاء الزر في قالب واتساب */
export const CODE_MINUTES = 10;
/** بعدها يُلغى الرمز ويلزم طلب غيره */
const MAX_TRIES = 5;

type Challenge = { phone: string; hash: Buffer; expires: number; tries: number };

/**
 * الرموز في الذاكرة فقط ولا تُكتب على القرص. إعادة تشغيل الخادم تعني طلب رمز جديد،
 * وتكفي لخادم واحد مثل حدود الطلبات في rate-limit.ts.
 */
const shared = globalThis as typeof globalThis & { __forsaCodes?: Map<string, Challenge> };
const challenges = (shared.__forsaCodes ??= new Map<string, Challenge>());

const digest = (id: string, code: string) => createHash("sha256").update(`${id}:${code}`).digest();

/** يحجز من كل الحدود معاً، وإن تجاوز أحدها يعيد ما حجزه */
function takeAll(limits: [key: string, limit: number, windowMs: number][]) {
  const taken: string[] = [];
  for (const [key, limit, windowMs] of limits) {
    if (!take(key, limit, windowMs)) {
      taken.forEach(release);
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
 * يولّد رمزاً من ٦ أرقام ويرسله إلى واتساب الرقم. الحدود تحمي أصحاب الأرقام من الإزعاج
 * وتحمي ميزانية الرسائل: دقيقة بين كل رمزين، و٥ رموز في الساعة لكل رقم، و١٠ لكل زائر.
 * أثناء التطوير، ودون إعداد واتساب، يُرجع الرمز ليظهر في الصفحة بدل إرساله.
 */
export async function issueCode(phone: string, visitor: string): Promise<Issued> {
  const wait = `code-wait:${phone}`;
  if (!take(wait, 1, MINUTE)) return { status: "wait" };
  const reserved = takeAll([
    [`code-phone:${phone}`, 5, HOUR],
    [`code-visitor:${visitor}`, 10, HOUR],
    ["code-all", 500, HOUR],
  ]);
  if (!reserved) return { status: "limited" };

  const now = Date.now();
  for (const [key, c] of challenges) if (c.expires <= now) challenges.delete(key);
  const id = newToken();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  challenges.set(id, { phone, hash: digest(id, code), expires: now + CODE_MINUTES * MINUTE, tries: 0 });
  // الرمز الجديد يلغي ما قبله لنفس الرقم، بعد التأكد من إرساله فقط
  const sent = () => {
    for (const [key, c] of challenges) if (c.phone === phone && key !== id) challenges.delete(key);
  };

  if (!whatsappEnabled() && process.env.NODE_ENV !== "production") {
    console.info(`[forsa] رمز الدخول للرقم ${phone}: ${code}`);
    sent();
    return { status: "sent", id, devCode: code };
  }
  try {
    if (await sendLoginCode(phone, code)) {
      sent();
      return { status: "sent", id };
    }
  } catch (error) {
    console.error("[forsa] whatsapp send failed", error);
  }
  if (!whatsappEnabled()) console.error("[forsa] WhatsApp is not configured, so login codes can't be sent");
  // لم يُرسل شيء، فلا نحسبه على صاحب الرقم
  challenges.delete(id);
  [wait, ...reserved].forEach(release);
  return { status: "failed" };
}

export type Checked = { status: "ok"; phone: string } | { status: "wrong" } | { status: "expired" };

/** يتحقق من الرمز. الرمز الصحيح يُستخدم مرة واحدة، والخطأ المتكرر يلغيه */
export function checkCode(id: string, code: string): Checked {
  const challenge = challenges.get(id);
  if (!challenge || challenge.expires <= Date.now()) {
    challenges.delete(id);
    return { status: "expired" };
  }
  if (!timingSafeEqual(challenge.hash, digest(id, code))) {
    challenge.tries += 1;
    if (challenge.tries < MAX_TRIES) return { status: "wrong" };
    challenges.delete(id);
    return { status: "expired" };
  }
  challenges.delete(id);
  return { status: "ok", phone: challenge.phone };
}
