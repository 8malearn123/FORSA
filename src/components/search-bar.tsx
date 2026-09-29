import Form from "next/form";
import { ChevronDown, MapPin, Search } from "lucide-react";

import { GOVERNORATES } from "@/lib/taxonomy";

import { cn } from "./cn";
import { SubmitButton } from "./submit-button";

/**
 * شريط البحث الرئيسي: ماذا تبحث عنه؟ وأين؟
 * يعمل كنموذج GET عادي، فيبقى صالحاً حتى قبل تحميل جافاسكربت.
 */
export function SearchBar({
  action = "/search",
  defaultQuery,
  defaultArea,
  size = "lg",
  placeholder = "وش تدوّر عليه؟ مصوّر، ضيافة، معلمة خصوصي…",
  className,
  hidden,
}: {
  action?: string;
  defaultQuery?: string;
  defaultArea?: string;
  size?: "lg" | "md";
  placeholder?: string;
  className?: string;
  /** حقول مخفية تحافظ على بقية الفلاتر عند البحث */
  hidden?: Record<string, string | undefined>;
}) {
  const lg = size === "lg";
  return (
    <Form
      // الحقول غير متحكَّم بها؛ عند تغيّر البحث من رابط أو فلتر نعيد إنشاءها بالقيم الجديدة
      key={JSON.stringify([defaultQuery, defaultArea, hidden])}
      action={action}
      role="search"
      className={cn(
        "flex flex-col gap-2 bg-white p-2 shadow-lift ring-1 ring-ink-100 sm:flex-row sm:items-center",
        lg ? "rounded-[26px] rounded-ee-[8px]" : "rounded-[22px] rounded-ee-[7px]",
        className,
      )}
    >
      {hidden
        ? Object.entries(hidden).map(([k, v]) =>
            v ? <input key={k} type="hidden" name={k} value={v} /> : null,
          )
        : null}
      <label className="flex flex-1 items-center gap-3 px-3">
        <Search className={cn("shrink-0 text-clay-600", lg ? "size-6" : "size-5")} />
        <span className="sr-only">ابحث</span>
        <input
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          enterKeyHint="search"
          className={cn(
            "w-full min-w-0 bg-transparent text-ink-900 outline-none placeholder:text-ink-500",
            lg ? "h-12 text-lg" : "h-10 text-base",
          )}
        />
      </label>
      <div className="hidden h-8 w-px bg-ink-100 sm:block" aria-hidden="true" />
      <label className="relative flex items-center gap-2 rounded-2xl bg-sand-100 px-3 sm:bg-transparent">
        <MapPin className="size-5 shrink-0 text-sage-600" />
        <span className="sr-only">المحافظة</span>
        <select
          name="area"
          defaultValue={defaultArea ?? ""}
          className={cn(
            "w-full cursor-pointer appearance-none bg-transparent pe-7 text-ink-800 outline-none sm:w-40",
            lg ? "h-12" : "h-10",
          )}
        >
          <option value="">كل منطقة جازان</option>
          {GOVERNORATES.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3 size-4 text-ink-400" />
      </label>
      <SubmitButton size={lg ? "lg" : "md"} className="sm:px-8" pendingLabel="جارِ البحث…">
        ابحث
      </SubmitButton>
    </Form>
  );
}
