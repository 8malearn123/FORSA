import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // الصور تُصغّر في المتصفح قبل الرفع، وهذا الحد يكفي لعدة صور في نموذج واحد
      bodySizeLimit: "12mb",
    },
  },
  poweredByHeader: false,
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      {
        // روابط الإدارة القديمة سرية (وقد تمر عبر صفحة الدخول): لا نرسلها في ترويسة Referer لأي موقع
        source: "/manage/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      {
        source: "/login",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
