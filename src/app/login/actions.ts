"use server";

import { redirect } from "next/navigation";

import { safeNext, startSession } from "@/lib/auth";
import { checkCode, issueCode } from "@/lib/otp";
import { HOUR, take, visitorKey } from "@/lib/rate-limit";
import { localSaudiMobile, normalizeSaudiMobile, toLatinDigits } from "@/lib/text";

export type LoginState =
  | { step: "phone"; phone?: string; error?: string }
  | {
      step: "code";
      phone: string;
      challenge: string;
      remember?: boolean;
      error?: string;
      notice?: string;
      /** أثناء التطوير فقط، حين لا يكون واتساب مضبوطاً */
      devCode?: string;
    };

const NOT_SENT = {
  wait: "أرسلنا لك رمزاً قبل لحظات. انتظر دقيقة قبل طلب رمز جديد.",
  limited: "طلبت رموزاً كثيرة خلال وقت قصير. حاول مرة أخرى بعد ساعة.",
  failed: "تعذّر إرسال الرمز الآن. تأكد أن الرقم عليه واتساب، ثم حاول بعد قليل.",
};

/**
 * الدخول على خطوتين في نموذج واحد: رقم الواتساب، ثم الرمز الذي يصل إليه.
 * ما تحتاجه الخطوة الثانية يأتي في حقول مخفية، فيعمل النموذج قبل تحميل الجافاسكربت.
 * والرقم الذي ندخل به يُؤخذ من الرمز المحفوظ عندنا، لا من النموذج.
 */
export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const intent = String(fd.get("intent") ?? "send");
  const raw = String(fd.get("phone") ?? "")
    .trim()
    .slice(0, 30);
  if (intent === "restart") return { step: "phone", phone: raw };
  if (String(fd.get("website_url") ?? "") !== "") return { step: "phone", error: "تعذّر إرسال النموذج." };

  const phone = normalizeSaudiMobile(raw);
  if (!phone) return { step: "phone", phone: raw, error: "اكتب رقم جوال سعودي صحيح مثل 05xxxxxxxx" };
  const local = localSaudiMobile(phone);
  const challenge = String(fd.get("challenge") ?? "").slice(0, 64);
  const remember = fd.get("remember") === "on";
  const visitor = await visitorKey();

  if (intent === "verify") {
    const retry = (error: string): LoginState => ({ step: "code", phone: local, challenge, remember, error });
    const code = toLatinDigits(String(fd.get("code") ?? "")).replace(/\D/g, "");
    if (code.length !== 6) return retry("اكتب الرمز المكوّن من ٦ أرقام.");
    if (!(await take(`code-try:${visitor}`, 30, HOUR)))
      return retry("محاولات كثيرة خلال وقت قصير. حاول بعد قليل.");
    const result = await checkCode(challenge, code);
    if (result.status === "wrong") return retry("الرمز غير صحيح. تأكد من آخر رمز وصلك على واتساب.");
    if (result.status === "expired") return retry("انتهت صلاحية هذا الرمز. اطلب رمزاً جديداً.");
    await startSession(result.phone, remember);
    redirect(safeNext(fd.get("next")));
  }

  // إرسال الرمز أول مرة، أو إعادة إرساله
  const issued = await issueCode(phone, visitor);
  if (issued.status === "sent") {
    return {
      step: "code",
      phone: local,
      challenge: issued.id,
      remember,
      devCode: issued.devCode,
      notice: intent === "resend" ? "أرسلنا رمزاً جديداً، والرمز السابق لم يعد يعمل." : undefined,
    };
  }
  const error = NOT_SENT[issued.status];
  return challenge
    ? { step: "code", phone: local, challenge, remember, error }
    : { step: "phone", phone: raw, error };
}
