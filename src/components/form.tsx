"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { unstable_rethrow } from "next/navigation";
import { ChevronDown, CircleAlert, ImagePlus, Plus, Trash2, X } from "lucide-react";

import type { FormState } from "@/app/join/actions";
import { formatNumber } from "@/lib/format";
import type { Contact } from "@/lib/types";

import { Nuqta } from "./brand";
import { cn } from "./cn";
import { SubmitButton } from "./submit-button";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const IDLE: FormState = { status: "idle" };

/** أقل قليلاً من bodySizeLimit في next.config.ts، حتى نمنع الإرسال برسالة واضحة بدل خطأ عام */
const MAX_FORM_BYTES = 11 * 1024 * 1024;

const ErrorsContext = createContext<Record<string, string>>({});
const useFieldError = (name: string) => useContext(ErrorsContext)[name];

/** الصور التي ما زالت تُجهّز في المتصفح؛ لا يُرسل النموذج قبل انتهائها */
const PreparingContext = createContext<(delta: number) => void>(() => undefined);

const clientError = (message: string): FormState => ({ status: "error", message, errors: {} });

function formBytes(data: FormData) {
  let total = 0;
  for (const value of data.values()) total += typeof value === "string" ? value.length * 2 : value.size;
  return total;
}

/**
 * نموذج يعمل بدون جافاسكربت (إرسال عادي للـ Server Action)،
 * ومع جافاسكربت لا يمسح الحقول عند وجود خطأ، ويعرض الأخطاء بجانب كل حقل،
 * ولا يضيع ما كتبه الزائر إن انقطع الاتصال أثناء الإرسال.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "جارِ النشر…",
  note = "مجاناً بالكامل. تستطيع إخفاء إعلانك أو حذفه في أي وقت.",
  className,
}: {
  action: Action;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  note?: string;
  className?: string;
}) {
  // قبل تحميل الجافاسكربت يُرسل النموذج مباشرة، وتصل نتيجته هنا بعد إعادة عرض الصفحة
  const [serverState, formAction] = useActionState(action, IDLE);
  const [state, setState] = useState(serverState);
  const [pending, startSubmit] = useTransition();
  const [preparing, setPreparing] = useState(0);
  const trackPreparing = useCallback((delta: number) => setPreparing((n) => Math.max(0, n + delta)), []);
  const errors = state.status === "error" ? state.errors : {};
  const summary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "error") summary.current?.focus();
  }, [state]);

  return (
    <ErrorsContext value={errors}>
      <PreparingContext value={trackPreparing}>
        <form
          action={formAction}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (pending || preparing > 0) return;
            const data = new FormData(event.currentTarget);
            if (formBytes(data) > MAX_FORM_BYTES) {
              setState(clientError("مجموع أحجام الصور كبير. احذف صورة أو اختر صوراً أصغر ثم أعد المحاولة."));
              return;
            }
            startSubmit(async () => {
              let next: FormState;
              try {
                next = await action(state, data);
              } catch (error) {
                // الانتقال بعد النشر يمر من هنا كخطأ خاص يعالجه Next.js
                unstable_rethrow(error);
                next = clientError(
                  "تعذّر الإرسال. تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى، وما كتبته ما زال هنا.",
                );
              }
              startTransition(() => setState(next));
            });
          }}
          className={cn("flex flex-col gap-6", className)}
        >
          {/* حقل مخفي لاصطياد برامج السبام */}
          <div aria-hidden="true" className="sr-only">
            <label>
              لا تملأ هذا الحقل
              <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {children}

          <div ref={summary} tabIndex={-1} className="scroll-mt-28 outline-none" aria-live="polite">
            {state.status === "error" ? (
              <div className="flex items-start gap-3 rounded-2xl bg-clay-50 p-4 text-clay-900 ring-1 ring-clay-200">
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-clay-600" />
                <div>
                  <p className="font-semibold">{state.message}</p>
                  {Object.keys(errors).length > 0 ? (
                    <ul className="mt-1 list-inside list-disc text-sm text-clay-800">
                      {[...new Set(Object.values(errors))].slice(0, 5).map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SubmitButton
              size="lg"
              pending={pending}
              pendingLabel={pendingLabel}
              disabled={preparing > 0}
              className="sm:min-w-56"
            >
              {submitLabel}
            </SubmitButton>
            <p className="text-sm text-ink-500" aria-live="polite">
              {preparing > 0 ? "لحظات، نجهّز الصور قبل الإرسال…" : note}
            </p>
          </div>
        </form>
      </PreparingContext>
    </ErrorsContext>
  );
}

export function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-[30px] rounded-ee-[9px] bg-white p-6 ring-1 ring-ink-100 md:p-8">
      <legend className="sr-only">{title}</legend>
      <div className="mb-6 flex items-start gap-4">
        <span className="relative grid size-11 shrink-0 place-items-center" aria-hidden="true">
          <Nuqta className="absolute size-11 text-clay-100" rotate={-90} />
          <span className="relative font-display text-lg font-black text-clay-700">{formatNumber(step)}</span>
        </span>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink-900">{title}</h2>
          {description ? <p className="mt-1 text-ink-600">{description}</p> : null}
        </div>
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </fieldset>
  );
}

export const inputClass =
  "w-full rounded-2xl bg-sand-50 px-4 text-ink-900 ring-1 ring-ink-200 outline-none transition-shadow ring-inset placeholder:text-ink-500 focus:bg-white focus:ring-2 focus:ring-clay-500 aria-invalid:ring-2 aria-invalid:ring-clay-400";

export function Field({
  label,
  name,
  hint,
  optional,
  children,
  errorKey,
}: {
  label: string;
  name: string;
  hint?: string;
  optional?: boolean;
  errorKey?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const error = useFieldError(errorKey ?? name);
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-baseline gap-2 font-semibold text-ink-900">
        {label}
        {optional ? <span className="text-sm font-normal text-ink-500">(اختياري)</span> : null}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-clay-700">
          <CircleAlert className="size-4" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  label,
  name,
  hint,
  optional,
  className,
  ...props
}: React.ComponentProps<"input"> & { label: string; name: string; hint?: string; optional?: boolean }) {
  return (
    <Field label={label} name={name} hint={hint} optional={optional}>
      {(a11y) => <input name={name} className={cn(inputClass, "h-12", className)} {...a11y} {...props} />}
    </Field>
  );
}

export function TextArea({
  label,
  name,
  hint,
  optional,
  className,
  ...props
}: React.ComponentProps<"textarea"> & { label: string; name: string; hint?: string; optional?: boolean }) {
  return (
    <Field label={label} name={name} hint={hint} optional={optional}>
      {(a11y) => (
        <textarea
          name={name}
          className={cn(inputClass, "min-h-32 py-3 leading-relaxed", className)}
          {...a11y}
          {...props}
        />
      )}
    </Field>
  );
}

export function SelectInput({
  label,
  name,
  hint,
  options,
  placeholder = "اختر…",
  defaultValue,
}: {
  label: string;
  name: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <Field label={label} name={name} hint={hint}>
      {(a11y) => (
        <div className="relative">
          <select
            name={name}
            defaultValue={defaultValue ?? ""}
            className={cn(inputClass, "h-12 cursor-pointer appearance-none pe-10")}
            {...a11y}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        </div>
      )}
    </Field>
  );
}

/** خيارات على شكل «رقائق» — راديو أو اختيار متعدد */
export function Choices({
  label,
  name,
  options,
  multiple,
  hint,
  defaultValue,
  columns,
  onValueChange,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string; hint?: string }[];
  multiple?: boolean;
  hint?: string;
  defaultValue?: string | string[];
  columns?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  const error = useFieldError(name);
  const defaults = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold text-ink-900">{label}</legend>
      <div className={cn("flex flex-wrap gap-2", columns && "grid sm:grid-cols-2")}>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "relative flex cursor-pointer items-center gap-2.5 rounded-2xl bg-sand-50 px-4 py-3 ring-1 ring-ink-200 transition ring-inset",
              "has-[:checked]:bg-clay-50 has-[:checked]:ring-2 has-[:checked]:ring-clay-500 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-clay-600",
              error && "ring-clay-300",
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              defaultChecked={defaults.includes(o.value)}
              onChange={(e) => onValueChange?.(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                "grid size-5 shrink-0 place-items-center border-2 border-ink-300 bg-white transition peer-checked:border-clay-600 peer-checked:bg-clay-600",
                multiple ? "rounded-md" : "rounded-full",
              )}
            >
              <span className="size-1.5 rounded-full bg-white" />
            </span>
            <span className="flex flex-col">
              <span className="font-medium text-ink-900">{o.label}</span>
              {o.hint ? <span className="text-xs text-ink-500">{o.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-clay-700">
          <CircleAlert className="size-4" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function Toggle({
  name,
  label,
  hint,
  defaultChecked,
  onChange,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sand-50 p-4 ring-1 ring-ink-200 ring-inset has-[:checked]:bg-sage-50 has-[:checked]:ring-sage-300">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-ink-200 transition-colors peer-checked:bg-sage-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-clay-600 after:absolute after:top-0.5 after:right-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:-translate-x-5"
      />
      <span>
        <span className="font-semibold text-ink-900">{label}</span>
        {hint ? <span className="mt-0.5 block text-sm text-ink-500">{hint}</span> : null}
      </span>
    </label>
  );
}

/** صور PNG/WebP الصغيرة تُرفع كما هي، فيحفظ الخادم شفافيتها */
const PASSTHROUGH_BYTES = 2.5 * 1024 * 1024;

/**
 * يصغّر الصورة في المتصفح قبل الرفع، فيسرّع الإرسال على شبكات الجوال.
 * يرجع null إن لم يستطع المتصفح قراءة الملف كصورة.
 */
async function prepareImage(file: File, maxSide = 1600, quality = 0.82): Promise<File | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (file.type !== "image/jpeg" && scale === 1 && file.size <= PASSTHROUGH_BYTES) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    // JPEG لا يدعم الشفافية؛ نضع خلفية بيضاء بدل السوداء
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

export function ImageInput({
  name,
  label,
  className,
  compact,
  existing,
  keepName,
}: {
  name: string;
  label: string;
  className?: string;
  compact?: boolean;
  /** صورة محفوظة مسبقاً (عند التعديل) تبقى ما لم يُزِلها المستخدم أو يستبدلها */
  existing?: string;
  keepName?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const trackPreparing = useContext(PreparingContext);
  const [preview, setPreview] = useState<string | null>(null);
  const [keep, setKeep] = useState(Boolean(existing));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shown = preview ?? (keep ? existing : null);

  const showPreview = (file: File | null) =>
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file ? URL.createObjectURL(file) : null;
    });

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    trackPreparing(1);
    try {
      const prepared = await prepareImage(file);
      if (!input.current) return;
      if (!prepared) {
        input.current.value = "";
        showPreview(null);
        setError("تعذّر قراءة هذه الصورة. اختر صورة بصيغة JPG أو PNG.");
        return;
      }
      const dt = new DataTransfer();
      dt.items.add(prepared);
      input.current.files = dt.files;
      showPreview(prepared);
    } finally {
      setBusy(false);
      trackPreparing(-1);
    }
  };

  const clear = () => {
    if (input.current) input.current.value = "";
    setKeep(false);
    setError(null);
    showPreview(null);
  };

  return (
    <div className={cn("relative", className)}>
      <label
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl rounded-ee-[6px] border-2 border-dashed border-ink-200 bg-sand-50 text-center text-sm text-ink-600 transition-colors hover:border-clay-300 hover:bg-clay-50/50",
          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-clay-600",
          error && "border-clay-400",
          compact ? "aspect-square w-full" : "aspect-[4/3] w-full",
        )}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            <ImagePlus className="size-7 text-clay-500" strokeWidth={1.5} />
            <span className="px-2 font-medium">{label}</span>
          </>
        )}
        {busy ? (
          <span className="absolute inset-0 grid place-items-center bg-white/80 px-2 font-medium text-ink-700">
            جارِ التجهيز…
          </span>
        ) : null}
        <input
          ref={input}
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          aria-label={shown ? `${label} (تغيير الصورة)` : label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="sr-only"
        />
      </label>
      {keepName ? <input type="hidden" name={keepName} value={keep && existing ? existing : ""} /> : null}
      {shown ? (
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 left-2 grid size-8 place-items-center rounded-full bg-white/90 text-ink-800 shadow"
          aria-label="إزالة الصورة"
        >
          <X className="size-4" />
        </button>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-clay-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * قائمة صفوف تُضاف وتُحذف (الخدمات، المنتجات، الأعمال).
 * نمرّر لكل صف مفتاحاً ثابتاً لا يتغير عند حذف صف قبله،
 * فالصفوف الأولى (0 إلى initial-1) تقابل البيانات الحالية عند التعديل.
 */
export function Repeater({
  initial = 1,
  max,
  itemLabel,
  addLabel,
  render,
  errorKey,
}: {
  initial?: number;
  max: number;
  /** اسم الصف في عنوانه، مثل «المنتج» فيظهر «المنتج ٢» */
  itemLabel: string;
  addLabel: string;
  render: (rowKey: number) => ReactNode;
  errorKey?: string;
}) {
  const next = useRef(initial);
  const addButton = useRef<HTMLButtonElement>(null);
  const [rows, setRows] = useState(() => Array.from({ length: initial }, (_, i) => i));
  const error = useFieldError(errorKey ?? "");

  const remove = (key: number) => {
    setRows((r) => r.filter((k) => k !== key));
    // الزر المحذوف كان عليه التركيز؛ ننقله لزر الإضافة حتى لا يضيع مستخدم لوحة المفاتيح
    requestAnimationFrame(() => addButton.current?.focus());
  };

  return (
    <div className="flex flex-col gap-4">
      {rows.map((key, index) => {
        const title = `${itemLabel} ${formatNumber(index + 1)}`;
        return (
          <div
            key={key}
            role="group"
            aria-label={title}
            className="rounded-2xl rounded-ee-[6px] bg-sand-50/70 p-4 ring-1 ring-ink-100"
          >
            <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink-500">{title}</span>
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(key)}
                  className="-me-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-ink-500 hover:bg-white hover:text-clay-700"
                  aria-label={`حذف ${title}`}
                >
                  <Trash2 className="size-4" />
                  حذف
                </button>
              ) : null}
            </div>
            {render(key)}
          </div>
        );
      })}
      {error ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-clay-700">
          <CircleAlert className="size-4" />
          {error}
        </p>
      ) : null}
      {rows.length < max ? (
        <button
          ref={addButton}
          type="button"
          onClick={() => setRows((r) => [...r, next.current++])}
          className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 font-semibold text-clay-700 hover:bg-clay-50"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          {addLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ContactFields({
  instagram,
  website,
  initial,
}: {
  instagram?: boolean;
  website?: boolean;
  initial?: Contact;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="رقم الواتساب"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          dir="ltr"
          placeholder="05xxxxxxxx"
          autoComplete="tel"
          defaultValue={initial?.whatsapp}
          hint="الطريقة الأسهل والأسرع للتواصل."
          className="text-end"
        />
        <TextInput
          label="رقم للاتصال"
          name="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          placeholder="05xxxxxxxx"
          defaultValue={initial?.phone}
          optional
          className="text-end"
        />
        <TextInput
          label="البريد الإلكتروني"
          name="email"
          type="email"
          dir="ltr"
          placeholder="name@example.com"
          autoComplete="email"
          defaultValue={initial?.email}
          optional
          className="text-end"
        />
        {instagram ? (
          <TextInput
            label="حساب انستقرام"
            name="instagram"
            dir="ltr"
            placeholder="@username"
            defaultValue={initial?.instagram}
            optional
            className="text-end"
          />
        ) : null}
        {website ? (
          <TextInput
            label="رابط أعمالك"
            name="website"
            type="url"
            dir="ltr"
            placeholder="behance.net/..."
            defaultValue={initial?.website}
            optional
            hint="معرض أعمال أو حساب مهني."
            className="text-end"
          />
        ) : null}
      </div>
      <Consent defaultChecked={Boolean(initial)} />
    </>
  );
}

function Consent({ defaultChecked }: { defaultChecked?: boolean }) {
  const error = useFieldError("consent");
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-ink-700">
        <input
          type="checkbox"
          name="consent"
          defaultChecked={defaultChecked}
          className="mt-1 size-5 shrink-0 accent-clay-600"
        />
        <span>
          أوافق على عرض وسائل التواصل لمن يطلبها من زوار «فرصة»، وأتعهد بصحة المعلومات. أعرف أن «فرصة» لا
          تتدخل في أي اتفاق أو دفع.
        </span>
      </label>
      {error ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-clay-700">
          <CircleAlert className="size-4" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
