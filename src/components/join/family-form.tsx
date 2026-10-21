"use client";

import { useState } from "react";

import { createFamily, type FormState } from "@/app/join/actions";
import { GOVERNORATES, PRODUCT_CATEGORIES } from "@/lib/taxonomy";
import type { Family } from "@/lib/types";

import {
  ActionForm,
  Choices,
  ContactFields,
  FormSection,
  ImageInput,
  Repeater,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
  inputClass,
} from "../form";

type Props = {
  initial?: Family;
  action?: (state: FormState, formData: FormData) => Promise<FormState>;
  /** عند النشر: رقم الحساب مقترحاً للواتساب */
  whatsapp?: string;
  /** فرصة يرجع إليها بعد النشر ليقدّم عليها */
  applyTo?: string;
};

export function FamilyForm({ initial, action, whatsapp, applyTo }: Props) {
  const editing = Boolean(initial);
  const [events, setEvents] = useState(Boolean(initial?.events));
  return (
    <ActionForm
      action={action ?? createFamily}
      submitLabel={editing ? "احفظ التعديلات" : "انشر صفحة أسرتنا"}
      pendingLabel={editing ? "جارِ الحفظ…" : undefined}
      note={editing ? "" : undefined}
    >
      {applyTo ? <input type="hidden" name="apply" value={applyTo} /> : null}
      <FormSection step={1} title="عرّفونا بأسرتكم" description="الاسم والوصف هما أول ما يراه الناس.">
        <TextInput
          label="اسم الأسرة أو المشروع"
          name="name"
          required
          maxLength={50}
          defaultValue={initial?.name}
          placeholder="مثال: مطبخ أم ريان، حلا الدار، خوص وطين"
        />
        <TextInput
          label="وصف مختصر"
          name="tagline"
          required
          maxLength={90}
          defaultValue={initial?.tagline}
          placeholder="مثال: أكلات جيزانية بيتية وضيافة للمناسبات"
        />
        <SelectInput
          label="المحافظة"
          name="governorate"
          defaultValue={initial?.governorate}
          options={GOVERNORATES.map((g) => ({ value: g.slug, label: g.name }))}
        />
        <Choices
          label="ماذا تقدمون؟"
          name="categories"
          multiple
          defaultValue={initial?.categories}
          options={PRODUCT_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          hint="اختاروا من تصنيف إلى ثلاثة."
        />
      </FormSection>

      <FormSection step={2} title="حكايتكم" description="الناس تحب تعرف من وراء المنتج.">
        <TextArea
          label="احكوا قصتكم باختصار"
          name="story"
          required
          maxLength={900}
          rows={5}
          defaultValue={initial?.story}
          placeholder="كيف بدأتم؟ وش يميز منتجاتكم؟ من يشتغل معكم؟"
          hint="من ٤٠ إلى ٩٠٠ حرف."
        />
        <div className="max-w-sm">
          <p className="mb-2 font-semibold text-ink-900">
            صورة الغلاف <span className="text-sm font-normal text-ink-500">(اختياري)</span>
          </p>
          <ImageInput
            name="cover"
            keepName="cover_keep"
            existing={initial?.cover}
            label="اختر صورة تمثّل أسرتكم أو منتجكم الأشهر"
          />
        </div>
      </FormSection>

      <FormSection
        step={3}
        title="المنتجات"
        description="أضيفوا من منتج إلى ثمانية منتجات، والصور تصنع الفرق."
      >
        <Repeater
          max={8}
          initial={Math.max(1, initial?.products.length ?? 0)}
          itemLabel="المنتج"
          addLabel="أضف منتجاً"
          errorKey="products"
          render={(i) => {
            const product = initial?.products[i];
            return (
              <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
                <input type="hidden" name="product_id" value={product?.id ?? ""} />
                <ImageInput
                  name="product_image"
                  keepName="product_keep"
                  existing={product?.image}
                  label="صورة المنتج"
                  compact
                />
                <div className="flex flex-col gap-3">
                  <input
                    name="product_name"
                    placeholder={i === 0 ? "اسم المنتج: لقيمات بدبس التمر" : "اسم المنتج"}
                    maxLength={60}
                    defaultValue={product?.name}
                    aria-label="اسم المنتج"
                    className={`${inputClass} h-11 bg-white`}
                  />
                  <input
                    name="product_description"
                    placeholder="وصف قصير (اختياري)"
                    maxLength={160}
                    defaultValue={product?.description}
                    aria-label="وصف المنتج"
                    className={`${inputClass} h-11 bg-white`}
                  />
                  <input
                    name="product_price"
                    placeholder="السعر التقريبي (اختياري)"
                    maxLength={40}
                    defaultValue={product?.priceHint}
                    aria-label="السعر التقريبي"
                    className={`${inputClass} h-11 bg-white`}
                  />
                </div>
              </div>
            );
          }}
        />
      </FormSection>

      <FormSection
        step={4}
        title="المناسبات والشركات"
        description="كثير من الشركات والجهات تبحث عن ضيافة وهدايا من أسر محلية."
      >
        <Toggle
          name="events"
          label="نستقبل طلبات المناسبات والشركات"
          hint="تظهر صفحتكم لمن يبحث عن ضيافة أو هدايا للفعاليات."
          defaultChecked={events}
          onChange={setEvents}
        />
        {events ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              label="أقصى عدد تقدرون عليه"
              name="capacity"
              maxLength={40}
              defaultValue={initial?.events?.capacity}
              placeholder="مثال: حتى ١٠٠ شخص"
              optional
            />
            <TextInput
              label="مدة الطلب المسبق"
              name="notice"
              maxLength={40}
              defaultValue={initial?.events?.notice}
              placeholder="مثال: قبل يومين"
              optional
            />
          </div>
        ) : null}
      </FormSection>

      <FormSection
        step={5}
        title="كيف يتواصلون معكم؟"
        description="لا تظهر بياناتكم في الصفحة مباشرة، بل لمن يطلبها فقط."
      >
        <ContactFields instagram initial={initial?.contact} whatsapp={whatsapp} />
      </FormSection>
    </ActionForm>
  );
}
