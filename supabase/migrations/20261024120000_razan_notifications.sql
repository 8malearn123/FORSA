-- طابور إشعارات فريق المبادرة: رزان (مساعدة الواتساب في منصة قمة) تسحبها وترسلها، ثم تؤكد الإرسال أو الفشل
create table public.forsa_notifications (
  id bigint generated always as identity primary key,
  phone text not null,
  name text,
  text text not null check (char_length(text) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index forsa_notifications_pending on public.forsa_notifications (id) where status = 'pending';
alter table public.forsa_notifications enable row level security;
revoke all on public.forsa_notifications from anon, authenticated;

-- sent يُغلق الإشعار، وfailed يعيده للطابور حتى p_max_attempts ثم يُغلق. يرجع false إن لم يوجد الإشعار
create function public.forsa_ack_notification(p_id bigint, p_status text, p_error text, p_max_attempts int)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  n public.forsa_notifications;
begin
  select * into n from public.forsa_notifications where id = p_id for update;
  if not found then
    return false;
  end if;
  -- تكرار التأكيد على إشعار مُغلق لا يغيّر شيئاً
  if n.status <> 'pending' then
    return true;
  end if;
  if p_status = 'sent' then
    update public.forsa_notifications set status = 'sent', sent_at = now(), error = null where id = p_id;
  else
    update public.forsa_notifications
       set attempts = attempts + 1,
           error = left(p_error, 500),
           status = case when attempts + 1 >= p_max_attempts then 'failed' else 'pending' end
     where id = p_id;
  end if;
  return true;
end;
$$;

revoke all on function public.forsa_ack_notification(bigint, text, text, int) from public, anon, authenticated;
grant execute on function public.forsa_ack_notification(bigint, text, text, int) to service_role;
