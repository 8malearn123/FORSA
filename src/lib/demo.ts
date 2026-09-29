/** المحتوى التجريبي مفعّل افتراضياً في النسخة الأولى، ويُطفأ عند الإطلاق بـ FORSA_DEMO=off */
export const demoEnabled = () => process.env.FORSA_DEMO !== "off";
