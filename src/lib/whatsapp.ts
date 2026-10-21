import "server-only";

/**
 * رموز الدخول تصل عبر واتساب (WhatsApp Cloud API من Meta) بقالب من فئة «المصادقة»
 * فيه زر «نسخ الرمز». يُضبط بالمتغيرات:
 * WHATSAPP_TOKEN، WHATSAPP_PHONE_NUMBER_ID، WHATSAPP_OTP_TEMPLATE،
 * واختيارياً WHATSAPP_OTP_LANGUAGE (افتراضياً ar) وWHATSAPP_API_VERSION.
 */
function config() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const template = process.env.WHATSAPP_OTP_TEMPLATE;
  if (!token || !phoneNumberId || !template) return null;
  return {
    token,
    phoneNumberId,
    template,
    language: process.env.WHATSAPP_OTP_LANGUAGE || "ar",
    version: process.env.WHATSAPP_API_VERSION || "v26.0",
  };
}

export const whatsappEnabled = () => config() !== null;

/** يرسل الرمز للرقم (بصيغة 966501234567)، ويرجع false إن رفضت Meta الطلب */
export async function sendLoginCode(phone: string, code: string) {
  const c = config();
  if (!c) return false;
  const response = await fetch(`https://graph.facebook.com/${c.version}/${c.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "template",
      template: {
        name: c.template,
        language: { code: c.language },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
        ],
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error("[forsa] whatsapp send failed", response.status, await response.text().catch(() => ""));
  }
  return response.ok;
}
