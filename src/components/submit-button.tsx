"use client";

import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "./cn";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./ui";

export function SubmitButton({
  children,
  pendingLabel,
  variant,
  size,
  className,
  pending: pendingOverride,
  disabled,
  ...props
}: ComponentProps<"button"> & {
  pendingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** عند إرسال النموذج يدوياً لا يعرف useFormStatus بالحالة، فنمررها هنا */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={cn(buttonClass({ variant, size }), className)}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-5 animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
