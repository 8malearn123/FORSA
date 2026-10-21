"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";

import { cn } from "@/components/cn";
import { Toggle, inputClass } from "@/components/form";
import { WhatsApp } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { formatSaudiMobile, normalizeSaudiMobile } from "@/lib/text";

import { login, type LoginState } from "./actions";

/** في الخطوة الثانية ثلاثة أزرار؛ يظهر الانتظار على الزر الذي ضُغط فقط */
function IntentButton({
  intent,
  pendingLabel,
  className,
  children,
}: {
  intent: "send" | "verify" | "resend" | "restart";
  pendingLabel?: string;
  className: string;
  children: ReactNode;
}) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("intent") === intent;
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      aria-busy={mine}
      className={className}
    >
      {mine ? <LoaderCircle className="size-5 animate-spin" /> : null}
      {mine && pendingLabel ? pendingLabel : children}
    </button>
  );
}

function Message({ error, notice }: { error?: string; notice?: string }) {
  return (
    <div aria-live="polite">
      {error ? (
        <p className="flex items-start gap-2 rounded-2xl bg-clay-50 p-4 text-sm font-medium text-clay-900 ring-1 ring-clay-200">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-clay-600" />
          {error}
        </p>
      ) : notice ? (
        <p className="flex items-start gap-2 rounded-2xl bg-sage-50 p-4 text-sm font-medium text-sage-900 ring-1 ring-sage-200">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-sage-600" />
          {notice}
        </p>
      ) : null}
    </div>
  );
}

const PRIMARY = cn(buttonClass({ size: "lg" }), "w-full");
const LINK = "inline-flex items-center gap-2 font-semibold disabled:opacity-60";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(login, { step: "phone" });
  const international = state.step === "code" ? normalizeSaudiMobile(state.phone) : null;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      {/* حقل مخفي لاصطياد برامج السبام */}
      <div aria-hidden="true" className="sr-only">
        <label>
          لا تملأ هذا الحقل
          <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.step === "phone" ? (
        <>
          <label className="flex flex-col gap-2">
            <span className="font-semibold text-ink-900">رقم الواتساب</span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="05xxxxxxxx"
              defaultValue={state.phone}
              aria-invalid={state.error ? true : undefined}
              className={cn(inputClass, "h-14 text-end text-lg")}
            />
            <span className="text-sm text-ink-500">رقم جوال سعودي عليه واتساب، ويصلك عليه رمز الدخول.</span>
          </label>
          <Message error={state.error} />
          <IntentButton intent="send" pendingLabel="جارِ الإرسال…" className={PRIMARY}>
            <WhatsApp className="size-5" />
            أرسل الرمز على واتساب
          </IntentButton>
        </>
      ) : (
        <>
          <input type="hidden" name="phone" value={state.phone} />
          <input type="hidden" name="challenge" value={state.challenge} />
          <p className="leading-relaxed text-ink-700">
            أرسلنا رمزاً من ٦ أرقام إلى واتساب الرقم{" "}
            <span dir="ltr" className="font-semibold whitespace-nowrap text-ink-900">
              {international ? formatSaudiMobile(international) : state.phone}
            </span>
            .
          </p>
          {state.devCode ? (
            <p className="rounded-2xl bg-sand-200 p-4 text-sm text-ink-800 ring-1 ring-sand-300">
              وضع التطوير: واتساب غير مضبوط، فيظهر الرمز هنا بدل إرساله:{" "}
              <strong dir="ltr" className="font-mono text-base">
                {state.devCode}
              </strong>
            </p>
          ) : null}
          <label className="flex flex-col gap-2">
            <span className="font-semibold text-ink-900">رمز الدخول</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              maxLength={6}
              placeholder="••••••"
              autoFocus
              aria-invalid={state.error ? true : undefined}
              className={cn(inputClass, "h-14 text-center font-mono text-2xl tracking-[0.5em]")}
            />
          </label>
          <Toggle
            name="remember"
            label="تذكّرني على هذا الجهاز"
            hint="فعّله إن كان الجوال لك وحدك. بدونه نُخرجك تلقائياً بعد ١٢ ساعة."
            defaultChecked={state.remember}
          />
          <Message error={state.error} notice={state.notice} />
          <IntentButton intent="verify" pendingLabel="جارِ الدخول…" className={PRIMARY}>
            ادخل
          </IntentButton>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <IntentButton intent="resend" className={cn(LINK, "text-clay-700 hover:text-clay-800")}>
              لم يصلك؟ أعد إرسال الرمز
            </IntentButton>
            <IntentButton intent="restart" className={cn(LINK, "text-ink-500 hover:text-ink-800")}>
              غيّر الرقم
            </IntentButton>
          </div>
        </>
      )}
    </form>
  );
}
