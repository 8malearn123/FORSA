"use client";

import { useState } from "react";

import { createOpportunity, type FormState } from "@/app/join/actions";
import {
  CATEGORIES,
  GOVERNORATES,
  OPPORTUNITY_TYPES,
  POSTER_TYPES,
  type OpportunityType,
} from "@/lib/taxonomy";
import type { Opportunity } from "@/lib/types";

import {
  ActionForm,
  Choices,
  ContactFields,
  FormSection,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
} from "../form";

const TITLE_PLACEHOLDER: Record<OpportunityType, string> = {
  job: "مثال: محاسب بدوام كامل، كاشير ومضيفون",
  task: "مثال: مصوّر لحفل تخرج، فني لصيانة مكيفات",
  order: "مثال: ضيافة لفعالية ٤٠ موظفاً، ١٢٠ هدية لضيوف مؤتمر",
  training: "مثال: تدريب تعاوني لطلاب المحاسبة",
  volunteer: "مثال: متطوعات لدروس تقوية في الرياضيات",
};

export function OpportunityForm({
  defaultType,
  initial,
  action,
}: {
  defaultType?: OpportunityType;
  /** عند التعديل: البيانات الحالية ودالة الحفظ */
  initial?: Opportunity;
  action?: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const editing = Boolean(initial);
  const [type, setType] = useState<OpportunityType | undefined>(initial?.type ?? defaultType);
  return (
    <ActionForm
      action={action ?? createOpportunity}
      submitLabel={editing ? "احفظ التعديلات" : "انشر الفرصة"}
      pendingLabel={editing ? "جارِ الحفظ…" : undefined}
      note={editing ? "" : undefined}
    >
      <FormSection step={1} title="من ينشر الفرصة؟">
        <Choices
          label="الناشر"
          name="posterType"
          defaultValue={initial?.poster.type ?? "individual"}
          options={POSTER_TYPES.map((p) => ({ value: p.slug, label: p.name }))}
        />
        <TextInput
          label="الاسم الظاهر"
          name="posterName"
          required
          maxLength={60}
          defaultValue={initial?.poster.name}
          placeholder="اسمك أو كنيتك، أو اسم الشركة أو الجهة"
        />
      </FormSection>

      <FormSection step={2} title="ما الفرصة؟">
        <Choices
          label="نوع الفرصة"
          name="type"
          columns
          defaultValue={initial?.type ?? defaultType}
          onValueChange={(v) => setType(v as OpportunityType)}
          options={OPPORTUNITY_TYPES.map((t) => ({ value: t.slug, label: t.name, hint: t.hint }))}
        />
        <TextInput
          label="عنوان واضح"
          name="title"
          required
          maxLength={90}
          defaultValue={initial?.title}
          placeholder={TITLE_PLACEHOLDER[type ?? "task"]}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectInput
            label="المجال"
            name="category"
            options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
            defaultValue={initial?.category ?? (type === "order" ? "catering" : undefined)}
          />
          <SelectInput
            label="المحافظة"
            name="governorate"
            defaultValue={initial?.governorate}
            options={GOVERNORATES.map((g) => ({ value: g.slug, label: g.name }))}
          />
        </div>
        <Toggle name="remote" label="يمكن إنجازها عن بُعد" defaultChecked={initial?.remote} />
      </FormSection>

      <FormSection step={3} title="التفاصيل" description="كلما كانت التفاصيل أوضح، وصلك الأنسب أسرع.">
        <TextArea
          label="اشرح الفرصة"
          name="description"
          required
          maxLength={1200}
          rows={5}
          defaultValue={initial?.description}
          placeholder="وش تحتاج بالضبط؟ ومتى؟ وأي تفاصيل تساعد من يتواصل معك."
          hint="من ٣٠ إلى ١٢٠٠ حرف."
        />
        <TextArea
          label={type === "order" ? "المطلوب بالتحديد" : "المتطلبات"}
          name="requirements"
          optional
          rows={3}
          className="min-h-24"
          defaultValue={initial?.requirements.join("\n")}
          placeholder={"كل متطلب في سطر\nمثال: خبرة سابقة\nالالتزام بالموعد"}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextInput
            label="الموعد"
            name="when"
            optional
            maxLength={60}
            defaultValue={initial?.when}
            placeholder="الخميس القادم، أو في أقرب وقت"
          />
          {type === "order" || type === "task" ? (
            <TextInput
              label="العدد أو الكمية"
              name="quantity"
              optional
              maxLength={40}
              defaultValue={initial?.quantity}
              placeholder="٤٠ شخصاً، ١٢٠ قطعة"
            />
          ) : null}
          <TextInput
            label={type === "job" ? "الراتب" : type === "training" ? "المكافأة" : "الميزانية"}
            name="budget"
            optional
            maxLength={60}
            defaultValue={initial?.budget}
            placeholder="حسب الاتفاق"
          />
        </div>
      </FormSection>

      <FormSection
        step={4}
        title="كيف يتواصلون معك؟"
        description="لا تظهر بياناتك في الصفحة مباشرة، بل لمن يطلبها فقط."
      >
        <ContactFields initial={initial?.contact} />
      </FormSection>
    </ActionForm>
  );
}
