"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Nuqta, Sparks } from "@/components/brand";
import { Button, ButtonLink, Container } from "@/components/ui";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <div className="relative">
        <Nuqta className="size-24 text-clay-100" rotate={-90} />
        <Sparks className="absolute -top-4 -left-6 w-12" />
      </div>
      <h1 className="mt-8 text-4xl font-black text-ink-900">صار خطأ غير متوقع</h1>
      <p className="mt-3 max-w-md text-lg text-ink-600">
        حصلت مشكلة أثناء تحميل الصفحة. جرّب مرة ثانية، وإذا استمرت المشكلة ارجع للصفحة الرئيسية.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>
          <RotateCcw className="size-4" />
          حاول مرة أخرى
        </Button>
        <ButtonLink href="/" variant="secondary">
          الصفحة الرئيسية
        </ButtonLink>
      </div>
    </Container>
  );
}
