-- Isolated online pilot. No access to the local demo registry.
create schema if not exists rakeeza_private;
revoke all on schema rakeeza_private from public, anon, authenticated;
create extension if not exists pgcrypto with schema extensions;
create table rakeeza_private.companies(id uuid primary key default gen_random_uuid(), profile jsonb not null, data jsonb not null, revision bigint not null default 0, created_at timestamptz not null default now());
create table rakeeza_private.accounts(id uuid primary key default gen_random_uuid(), company_id uuid not null references rakeeza_private.companies(id), phone text unique not null, password_hash text not null, profile jsonb not null, active boolean not null default true);
create table rakeeza_private.sessions(token_hash text primary key, account_id uuid not null references rakeeza_private.accounts(id), expires_at timestamptz not null);
create table rakeeza_private.versions(company_id uuid not null, revision bigint not null, data jsonb not null, created_at timestamptz not null default now(), primary key(company_id,revision));
create table rakeeza_private.throttle(bucket text primary key,n int not null,until_at timestamptz not null);
create or replace function rakeeza_private.rate_limit(k text,lim int) returns boolean language plpgsql security definer set search_path='' as $$
declare v int;
begin
 insert into rakeeza_private.throttle values(k,1,now()+interval '1 hour') on conflict(bucket) do update set n=case when rakeeza_private.throttle.until_at<now() then 1 else rakeeza_private.throttle.n+1 end,until_at=case when rakeeza_private.throttle.until_at<now() then now()+interval '1 hour' else rakeeza_private.throttle.until_at end returning n into v;
 return v<=lim;
end $$;
create or replace function public.rakeeza_auth(action text,phone text,password text,profile jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts; c rakeeza_private.companies; tok text; p text:=trim(phone);
begin
 if p is null or password is null or p !~ '^05[0-9]{8}$' or length(password)<8 or octet_length(password)>72 then raise exception 'رقم جوال أو كلمة مرور غير صالحة (٨ أحرف على الأقل)'; end if;
 if not rakeeza_private.rate_limit('auth:'||p,30) then return jsonb_build_object('error','طلبات كثيرة؛ حاول بعد ساعة');end if;
 if length(profile::text)>200000 then raise exception 'بيانات كبيرة جدًا';end if;
 if coalesce(profile->>'brandColor','#bf8b39') !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'لون غير صالح';end if;
 if nullif(profile->>'logoDataUrl','') is not null and (profile->>'logoDataUrl') !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' then raise exception 'صيغة الشعار غير مدعومة';end if;
 if action='register' then
  if exists(select 1 from rakeeza_private.accounts x where x.phone=p) then return jsonb_build_object('error','الجوال مسجل بالفعل');end if;
  if coalesce(length(trim(profile->>'companyName')),0)<2 or coalesce(profile->>'crNumber','') !~ '^[0-9]{10}$' or coalesce(length(trim(profile->>'adminName')),0)<2 then raise exception 'اسم الشركة والمدير والسجل التجاري مطلوبة';end if;
  insert into rakeeza_private.companies(profile,data) values(jsonb_build_object('name',trim(profile->>'companyName'),'crNumber',profile->>'crNumber','brandColor',coalesce(profile->>'brandColor','#bf8b39'),'logoDataUrl',profile->>'logoDataUrl'),'{}') returning * into c;
  insert into rakeeza_private.accounts(company_id,phone,password_hash,profile) values(c.id,p,extensions.crypt(password,extensions.gen_salt('bf',12)),jsonb_build_object('name',trim(profile->>'adminName'),'role','executive_director','projectIds','all')) returning * into a;
 elsif action='login' then
  select * into a from rakeeza_private.accounts x where x.phone=p and x.active;
  if a.id is null or extensions.crypt(password,a.password_hash)<>a.password_hash then return jsonb_build_object('error','بيانات الدخول غير صحيحة');end if;
 else raise exception 'طلب غير صالح';end if;
 if (a.profile->>'role') is distinct from 'executive_director' then raise exception 'الدور غير مفعّل في النسخة المتصلة';end if;
 tok:=encode(extensions.gen_random_bytes(32),'hex');
 delete from rakeeza_private.sessions where expires_at<now();
 insert into rakeeza_private.sessions values(encode(extensions.digest(tok,'sha256'),'hex'),a.id,now()+interval '7 days');
 return jsonb_build_object('token',tok,'companyId',a.company_id,'user',a.profile||jsonb_build_object('id',a.id,'companyId',a.company_id,'phone',a.phone,'active',true));
end $$;
create or replace function public.rakeeza_snapshot(token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts;c rakeeza_private.companies;
begin
 select x.* into a from rakeeza_private.accounts x join rakeeza_private.sessions s on s.account_id=x.id where s.token_hash=encode(extensions.digest(token,'sha256'),'hex') and s.expires_at>now() and x.active;
 if a.id is null then raise exception 'انتهت الجلسة؛ سجل الدخول';end if;
 if (a.profile->>'role') is distinct from 'executive_director' then raise exception 'الدور غير مفعّل في النسخة المتصلة';end if;
 select * into c from rakeeza_private.companies where id=a.company_id;
 return jsonb_build_object('company',c.profile||jsonb_build_object('id',c.id),'user',a.profile||jsonb_build_object('id',a.id,'companyId',c.id,'phone',a.phone,'active',true),'data',c.data,'revision',c.revision);
end $$;
create or replace function public.rakeeza_save(token text,expected_revision bigint,data jsonb,profile jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts;c rakeeza_private.companies;
begin
 select x.* into a from rakeeza_private.accounts x join rakeeza_private.sessions s on s.account_id=x.id where s.token_hash=encode(extensions.digest(token,'sha256'),'hex') and s.expires_at>now() and x.active;
 if a.id is null then raise exception 'انتهت الجلسة';end if;
 if (a.profile->>'role') is distinct from 'executive_director' then raise exception 'الدور غير مفعّل في النسخة المتصلة';end if;
 if profile is not null then
  if length(profile::text)>200000 or (profile->>'brandColor' is not null and profile->>'brandColor' !~ '^#[0-9A-Fa-f]{6}$') then raise exception 'هوية غير صالحة';end if;
  if nullif(profile->>'logoDataUrl','') is not null and profile->>'logoDataUrl' !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' then raise exception 'صيغة الشعار غير مدعومة';end if;
 end if;
 if (data->>'companyId') is distinct from a.company_id::text or length(data::text)>4000000 then raise exception 'بيانات غير صالحة';end if;
 if not rakeeza_private.rate_limit('save:'||a.id::text,1200) then return jsonb_build_object('error','طلبات كثيرة؛ حاول لاحقًا');end if;
 select * into c from rakeeza_private.companies where id=a.company_id for update;
 if c.revision is distinct from expected_revision then raise exception 'تعارض: توجد تغييرات من جهاز آخر. حدّث قبل المحاولة';end if;
 insert into rakeeza_private.versions(company_id,revision,data) values(c.id,c.revision,c.data);
 update rakeeza_private.companies set data=rakeeza_save.data,revision=revision+1,profile=case when rakeeza_save.profile is null then companies.profile else companies.profile||jsonb_build_object('name',rakeeza_save.profile->>'name','crNumber',rakeeza_save.profile->>'crNumber','brandColor',rakeeza_save.profile->>'brandColor','logoDataUrl',rakeeza_save.profile->>'logoDataUrl') end where id=c.id;
 delete from rakeeza_private.versions where company_id=c.id and revision<c.revision-49;
 return jsonb_build_object('revision',c.revision+1);
end $$;
create or replace function public.rakeeza_logout(token text) returns void language sql security definer set search_path='' as $$delete from rakeeza_private.sessions where token_hash=encode(extensions.digest(token,'sha256'),'hex')$$;
revoke all on all tables in schema rakeeza_private from public,anon,authenticated;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
revoke all on function public.rakeeza_auth(text,text,text,jsonb),public.rakeeza_snapshot(text),public.rakeeza_save(text,bigint,jsonb,jsonb),public.rakeeza_logout(text) from public;
grant execute on function public.rakeeza_auth(text,text,text,jsonb),public.rakeeza_snapshot(text),public.rakeeza_save(text,bigint,jsonb,jsonb),public.rakeeza_logout(text) to anon,authenticated;

alter table rakeeza_private.companies enable row level security;
alter table rakeeza_private.accounts enable row level security;
alter table rakeeza_private.sessions enable row level security;
alter table rakeeza_private.versions enable row level security;
alter table rakeeza_private.throttle enable row level security;
