import { promises as fs } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Image from "next/image";

import { PageHeader } from "@/components/browse";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "حقوق الصور",
  description: "مصادر الصور المستخدمة في «فرصة» وتراخيصها.",
};

type Credit = { file: string; title?: string; author?: string; source?: string; license?: string };

async function readCredits(): Promise<Credit[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public/images/credits.json"), "utf8");
    return (JSON.parse(raw) as Credit[]).sort((a, b) => a.file.localeCompare(b.file));
  } catch {
    return [];
  }
}

export default async function CreditsPage() {
  const credits = await readCredits();
  return (
    <>
      <PageHeader
        eyebrow="شكر وتقدير"
        title="حقوق الصور"
        description="نشكر المصورين الذين أتاحوا أعمالهم بتراخيص حرة. الصور هنا توضيحية للنسخة الأولى من «فرصة»."
      />
      <Container className="py-12">
        {credits.length === 0 ? (
          <p className="text-ink-600">ستظهر قائمة المصادر هنا.</p>
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {credits.map((c) => (
              <li
                key={c.file}
                className="flex gap-4 rounded-[22px] rounded-ee-[7px] bg-white p-3 ring-1 ring-ink-100"
              >
                <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl rounded-ss-[6px] bg-sand-200">
                  <Image src={c.file} alt={c.title ?? ""} fill sizes="80px" className="object-cover" />
                </span>
                <div className="min-w-0 py-1 text-sm">
                  <p dir="auto" className="truncate font-semibold text-ink-900">
                    {c.author || "مصور غير معروف"}
                  </p>
                  {c.title ? (
                    <p dir="auto" className="mt-0.5 truncate text-ink-600" title={c.title}>
                      {c.title}
                    </p>
                  ) : null}
                  <p dir="ltr" className="mt-0.5 truncate text-start text-ink-500">
                    {c.license}
                  </p>
                  {c.source ? (
                    <a
                      href={c.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-clay-700 underline-offset-4 hover:underline"
                    >
                      المصدر
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
