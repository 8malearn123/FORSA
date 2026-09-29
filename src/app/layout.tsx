import type { Metadata, Viewport } from "next";
import { Alyamama, IBM_Plex_Sans_Arabic } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

/** «اليمامة» للعناوين: عريض وواثق ودافئ مثل حروف الشعار */
const alyamama = Alyamama({
  variable: "--font-alyamama",
  subsets: ["arabic"],
  weight: "variable",
  display: "swap",
  adjustFontFallback: false,
});

/** «بلكس» للنصوص: واضح ومريح للقراءة الطويلة */
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "فرصة — اكتشف فرص جازان ومواهبها",
    template: "%s · فرصة",
  },
  description:
    "مبادرة مجتمعية مجانية تجمع أصحاب المهارات والأسر المنتجة بكل من يبحث عنهم في منطقة جازان. اكتشف، وتواصل مباشرة، بلا وسيط ولا عمولة.",
  applicationName: "فرصة",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "فرصة",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf5eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${alyamama.variable} ${plexArabic.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-xl bg-ink-900 px-4 py-2 text-sand-50 focus:not-sr-only focus:fixed focus:top-3 focus:right-3"
        >
          تخطَّ إلى المحتوى
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
