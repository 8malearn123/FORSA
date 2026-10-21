"use client";

import { createTalent, type FormState } from "@/app/join/actions";
import { EXPERIENCE, GOVERNORATES, SEEKING, SKILL_CATEGORIES } from "@/lib/taxonomy";
import type { Talent } from "@/lib/types";

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
  /** عند التعديل: البيانات الحالية ودالة الحفظ */
  initial?: Talent;
  action?: (state: FormState, formData: FormData) => Promise<FormState>;
  /** عند النشر: رقم الحساب مقترحاً للواتساب */
  whatsapp?: string;
  /** فرصة يرجع إليها بعد النشر ليقدّم عليها */
  applyTo?: string;
};

export function TalentForm({ initial, action, whatsapp, applyTo }: Props) {
  const editing = Boolean(initial);
  return (
    <ActionForm
      action={action ?? createTalent}
      submitLabel={editing ? "احفظ التعديلات" : "انشر ملفي"}
      pendingLabel={editing ? "جارِ الحفظ…" : undefined}
      note={editing ? "" : undefined}
    >
      {applyTo ? <input type="hidden" name="apply" value={applyTo} /> : null}
      <FormSection step={1} title="عرّفنا بنفسك" description="هذا ما يراه الناس أولاً في بطاقتك.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="الاسم كما تحب أن يظهر"
            name="name"
            required
            maxLength={40}
            autoComplete="name"
            defaultValue={initial?.name}
            hint="يكفي الاسم الأول والعائلة، أو كنية مثل «أبو سلطان»."
          />
          <Choices
            label="صياغة الملف"
            name="gender"
            defaultValue={initial?.gender}
            options={[
              { value: "m", label: "بصيغة المذكر" },
              { value: "f", label: "بصيغة المؤنث" },
            ]}
            hint="حتى نكتب «متاح» أو «متاحة» بشكل صحيح."
          />
        </div>
        <TextInput
          label="مهارتك الرئيسية أو مسماك"
          name="headline"
          required
          maxLength={60}
          defaultValue={initial?.headline}
          placeholder="مثال: مصممة هويات بصرية، فني تكييف، معلم رياضيات"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectInput
            label="المجال"
            name="category"
            defaultValue={initial?.category}
            options={SKILL_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          />
          <SelectInput
            label="المحافظة"
            name="governorate"
            defaultValue={initial?.governorate}
            options={GOVERNORATES.map((g) => ({ value: g.slug, label: g.name }))}
          />
        </div>
        <Toggle
          name="remote"
          label="أقدر أشتغل عن بُعد أيضاً"
          hint="يظهر ملفك لمن يبحث عن عمل عن بُعد."
          defaultChecked={initial?.remote}
        />
      </FormSection>

      <FormSection step={2} title="خبرتك ومهاراتك">
        <TextArea
          label="نبذة عنك"
          name="bio"
          required
          maxLength={800}
          rows={5}
          defaultValue={initial?.bio}
          placeholder="احكِ باختصار عن خبرتك، وما تحب تشتغل عليه، وما يميزك."
          hint="من ٤٠ إلى ٨٠٠ حرف. اكتب بأسلوبك، الناس تحب الصدق."
        />
        <TextInput
          label="المهارات"
          name="skills"
          required
          defaultValue={initial?.skills.join("، ")}
          placeholder="تصميم شعارات، هوية بصرية، تغليف منتجات"
          hint="افصل بين المهارات بفاصلة. حتى ١٠ مهارات."
        />
        <Choices
          label="سنوات الخبرة"
          name="experience"
          defaultValue={initial?.experience}
          options={EXPERIENCE.map((e) => ({ value: e.slug, label: e.name }))}
        />
      </FormSection>

      <FormSection step={3} title="وش تبحث عنه؟" description="اختر كل ما يناسبك.">
        <Choices
          label="أبحث عن"
          name="seeking"
          multiple
          columns
          defaultValue={initial?.seeking}
          options={SEEKING.map((s) => ({ value: s.slug, label: s.name }))}
        />
      </FormSection>

      <FormSection step={4} title="خدماتك وأعمالك" description="اختياري، لكنه يضاعف فرص التواصل معك.">
        <div>
          <p className="mb-3 font-semibold text-ink-900">الخدمات</p>
          <Repeater
            max={6}
            initial={Math.max(1, initial?.services.length ?? 0)}
            itemLabel="الخدمة"
            addLabel="أضف خدمة"
            render={(i) => (
              <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                <input
                  name="service_title"
                  placeholder="اسم الخدمة: تصميم شعار، حصة خصوصية…"
                  maxLength={80}
                  defaultValue={initial?.services[i]?.title}
                  aria-label="اسم الخدمة"
                  className={`${inputClass} h-11 bg-white`}
                />
                <input
                  name="service_price"
                  placeholder="السعر التقريبي (اختياري)"
                  maxLength={40}
                  defaultValue={initial?.services[i]?.priceHint}
                  aria-label="السعر التقريبي"
                  className={`${inputClass} h-11 bg-white`}
                />
              </div>
            )}
          />
        </div>
        <div>
          <p className="mb-3 font-semibold text-ink-900">صور من أعمالك</p>
          <Repeater
            max={4}
            initial={Math.max(1, initial?.work.length ?? 0)}
            itemLabel="الصورة"
            addLabel="أضف صورة أخرى"
            errorKey="work"
            render={(i) => (
              <div className="grid items-center gap-3 sm:grid-cols-[160px_1fr]">
                <ImageInput
                  name="work_image"
                  keepName="work_keep"
                  existing={initial?.work[i]?.image}
                  label="اختر صورة"
                  compact
                />
                <input
                  name="work_caption"
                  placeholder="وصف قصير للصورة"
                  maxLength={80}
                  defaultValue={initial?.work[i]?.caption}
                  aria-label="وصف الصورة"
                  className={`${inputClass} h-11 bg-white`}
                />
              </div>
            )}
          />
          <p className="mt-2 text-sm text-ink-500">نحذف تلقائياً أي بيانات موقع من الصور قبل نشرها.</p>
        </div>
      </FormSection>

      <FormSection
        step={5}
        title="كيف يتواصلون معك؟"
        description="لا تظهر بياناتك في الصفحة مباشرة، بل لمن يضغط «أظهر وسائل التواصل» فقط."
      >
        <ContactFields website initial={initial?.contact} whatsapp={whatsapp} />
      </FormSection>
    </ActionForm>
  );
}
