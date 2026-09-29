const bootedAt = Date.now();

/** يجعل تواريخ المحتوى التجريبي نسبية لوقت تشغيل الخادم، فتبقى «حديثة» دائماً */
export const hoursAgo = (hours: number) => new Date(bootedAt - hours * 3_600_000).toISOString();
