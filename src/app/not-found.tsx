import { Nuqta, Sparks } from "@/components/brand";
import { SearchBar } from "@/components/search-bar";
import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <div className="relative">
        <Nuqta className="size-28 text-sand-300" rotate={-90} />
        <Sparks className="absolute -top-4 -left-6 w-14" animated />
      </div>
      <p className="mt-8 font-display text-6xl font-black text-clay-600">٤٠٤</p>
      <h1 className="mt-3 text-3xl font-black text-ink-900 md:text-4xl">هذه الصفحة غير موجودة</h1>
      <p className="mt-3 max-w-md text-lg text-ink-600">
        ربما حُذف الإعلان، أو أخفاه صاحبه، أو أن الرابط غير صحيح. الفرص كثيرة، ابحث عن غيرها:
      </p>
      <SearchBar size="md" className="mt-8 w-full max-w-2xl text-start" />
      <ButtonLink href="/" variant="ghost" className="mt-6">
        العودة للصفحة الرئيسية
      </ButtonLink>
    </Container>
  );
}
