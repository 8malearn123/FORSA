-- رموز الدخول عبر رزان: نوع الإشعار (admin لفريق المبادرة، otp لرمز دخول) ووقت انتهائه
alter table public.forsa_notifications
  add column kind text not null default 'admin' check (kind in ('admin', 'otp')),
  add column expires_at timestamptz;
