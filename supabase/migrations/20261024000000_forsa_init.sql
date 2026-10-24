-- كل الجداول للخادم فقط: RLS مفعّل بلا سياسات، والوصول بمفتاح service_role
create table public.forsa_store (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.forsa_store (id) values (1);
alter table public.forsa_store enable row level security;

create table public.forsa_hits (
  id bigint generated always as identity primary key,
  key text not null,
  at timestamptz not null default clock_timestamp()
);
create index forsa_hits_key_at on public.forsa_hits (key, at desc);
create index forsa_hits_at on public.forsa_hits (at);
alter table public.forsa_hits enable row level security;

create table public.forsa_codes (
  id text primary key,
  phone text not null,
  hash text not null,
  expires_at timestamptz not null,
  tries int not null default 0
);
create index forsa_codes_phone on public.forsa_codes (phone);
create index forsa_codes_expires on public.forsa_codes (expires_at);
alter table public.forsa_codes enable row level security;

-- يكتب المخزن فقط إن لم يتغير منذ قراءته، ويرجع الإصدار الجديد أو null عند التعارض
create function public.forsa_save(p_data jsonb, p_version bigint)
returns bigint language sql security invoker set search_path = '' as $$
  update public.forsa_store
     set data = p_data, version = version + 1, updated_at = now()
   where id = 1 and version = p_version
  returning version;
$$;

-- يحجز محاولة ضمن الحد ذرياً، ويرجع false إن تجاوزه
create function public.forsa_take(p_key text, p_limit int, p_window_ms bigint)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  n int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));
  if random() < 0.01 then
    delete from public.forsa_hits where at < clock_timestamp() - interval '1 day';
  end if;
  select count(*) into n from public.forsa_hits
   where key = p_key and at > clock_timestamp() - make_interval(secs => p_window_ms / 1000.0);
  if n >= p_limit then
    return false;
  end if;
  insert into public.forsa_hits (key) values (p_key);
  return true;
end;
$$;

-- يعيد آخر محاولة محجوزة
create function public.forsa_release(p_key text)
returns void language sql security invoker set search_path = '' as $$
  delete from public.forsa_hits
   where id = (select id from public.forsa_hits where key = p_key order by at desc, id desc limit 1);
$$;

-- يتحقق من الرمز: الصحيح يُستخدم مرة واحدة، والخطأ المتكرر يلغيه
create function public.forsa_check_code(p_id text, p_hash text, p_max_tries int)
returns table (status text, phone text) language plpgsql security invoker set search_path = '' as $$
declare
  c public.forsa_codes;
begin
  select * into c from public.forsa_codes where id = p_id for update;
  if not found or c.expires_at <= now() then
    delete from public.forsa_codes where id = p_id;
    return query select 'expired'::text, null::text;
    return;
  end if;
  if c.hash <> p_hash then
    if c.tries + 1 < p_max_tries then
      update public.forsa_codes set tries = tries + 1 where id = p_id;
      return query select 'wrong'::text, null::text;
    else
      delete from public.forsa_codes where id = p_id;
      return query select 'expired'::text, null::text;
    end if;
    return;
  end if;
  delete from public.forsa_codes where id = p_id;
  return query select 'ok'::text, c.phone;
end;
$$;

revoke all on function public.forsa_save(jsonb, bigint) from public, anon, authenticated;
revoke all on function public.forsa_take(text, int, bigint) from public, anon, authenticated;
revoke all on function public.forsa_release(text) from public, anon, authenticated;
revoke all on function public.forsa_check_code(text, text, int) from public, anon, authenticated;
grant execute on function public.forsa_save(jsonb, bigint) to service_role;
grant execute on function public.forsa_take(text, int, bigint) to service_role;
grant execute on function public.forsa_release(text) to service_role;
grant execute on function public.forsa_check_code(text, text, int) to service_role;

revoke all on public.forsa_store, public.forsa_hits, public.forsa_codes from anon, authenticated;

-- الصور المرفوعة: حاوية خاصة تُقدَّم عبر مسار /media في التطبيق
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 6291456, array['image/webp']);
