-- Staged management helpers; not public until tested.
create table if not exists rakeeza_private.invites(id uuid primary key default gen_random_uuid(),company_id uuid not null references rakeeza_private.companies(id),phone text not null,profile jsonb not null,token_hash text not null unique,expires_at timestamptz not null,created_by uuid not null,accepted_at timestamptz);
create table if not exists rakeeza_private.recovery(account_id uuid primary key references rakeeza_private.accounts(id),key_hash text not null,created_at timestamptz not null default now());
alter table rakeeza_private.invites enable row level security;
alter table rakeeza_private.recovery enable row level security;
create or replace function rakeeza_private.validate_member(d jsonb,p jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare rol text:=p->>'role';pid text;v jsonb;
begin
 if rol not in('executive_director','project_manager','site_engineer','safety_officer','qaqc_manager','procurement_mgr','hr_manager','worker','owner','consultant','subcontractor','supplier') or rol is null then raise exception 'وظيفة غير صالحة';end if;
 perform rakeeza_private.text(p,'name',200);
 if p->>'projectIds'<>'all' or p->>'projectIds' is null then
  if jsonb_typeof(p->'projectIds') is distinct from 'array' then raise exception 'حدد المشاريع';end if;
  for pid in select jsonb_array_elements_text(p->'projectIds') loop perform rakeeza_private.item(d,'projects',pid);end loop;
 end if;
 if rol in('worker','subcontractor','supplier','owner','consultant') and p->>'projectIds'='all' then raise exception 'الأدوار الخارجية والعامل تحتاج مشاريع محددة';end if;
 if rol='worker' then
  v:=rakeeza_private.item(d,'workers',p->>'workerId');
  if p->>'projectIds'='all' or jsonb_array_length(p->'projectIds')<>1 or not (p->'projectIds') ? (v->>'projectId') then raise exception 'صلاحيات العامل يجب أن تطابق مشروعه';end if;
 elsif rol='subcontractor' then
  v:=rakeeza_private.item(d,'subcontractors',p->>'subcontractorId');
  if p->>'projectIds'='all' or jsonb_array_length(p->'projectIds')<>1 or not (p->'projectIds') ? (v->>'projectId') then raise exception 'صلاحيات مقاول الباطن يجب أن تطابق مشروعه';end if;
 elsif rol='supplier' then perform rakeeza_private.text(p,'supplierName',200);end if;
 return rakeeza_private.fields(p,array['name','role','projectIds','workerId','subcontractorId','supplierName']);
end $$;
create or replace function rakeeza_private.manage_member(t text,op text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts:=rakeeza_private.actor(t);target rakeeza_private.accounts;c rakeeza_private.companies;v jsonb;code text;i uuid;newpw text;
begin
 select * into c from rakeeza_private.companies where id=a.company_id for update;
 perform rakeeza_private.require_action(a,c.data,'users.manage');
 if op='invite' then
  if coalesce(p->>'phone','') !~ '^05[0-9]{8}$' then raise exception 'جوال غير صالح';end if;
  v:=rakeeza_private.validate_member(c.data,p);
  if exists(select 1 from rakeeza_private.accounts x where x.phone=p->>'phone') then raise exception 'الجوال مسجل';end if;
  code:=encode(extensions.gen_random_bytes(24),'hex');
  insert into rakeeza_private.invites(company_id,phone,profile,token_hash,expires_at,created_by) values(c.id,p->>'phone',v,encode(extensions.digest(code,'sha256'),'hex'),now()+interval '2 days',a.id) returning id into i;
  c.data:=rakeeza_private.audit(c.data,a,'إنشاء دعوة','invite',jsonb_build_object('id',i));
  update rakeeza_private.companies set data=c.data,revision=revision+1 where id=c.id;
  return jsonb_build_object('id',i,'inviteCode',code,'expiresInHours',48);
 elsif op in('update','reset') then
  select * into target from rakeeza_private.accounts where id=(p->>'id')::uuid and company_id=c.id for update;
  if target.id is null then raise exception 'المستخدم غير موجود';end if;
  if op='update' then
   if target.id=a.id and ((p->>'active')::boolean=false or coalesce(p->>'role',target.profile->>'role') is distinct from 'executive_director') then raise exception 'لا يمكنك تعطيل حسابك أو تغيير دورك';end if;
   v:=rakeeza_private.validate_member(c.data,target.profile||p);
   update rakeeza_private.accounts set profile=v,active=coalesce((p->>'active')::boolean,active) where id=target.id;
   delete from rakeeza_private.sessions where account_id=target.id and target.id<>a.id;
  else
   if target.profile->>'role'='executive_director' then raise exception 'المدير التنفيذي يستخدم مفتاح الاستعادة الخاص به';end if;
   newpw:=rakeeza_private.text(p,'password',72);if length(newpw)<8 or octet_length(newpw)>72 then raise exception 'كلمة مرور غير صالحة';end if;
   update rakeeza_private.accounts set password_hash=extensions.crypt(newpw,extensions.gen_salt('bf',12)) where id=target.id;
   delete from rakeeza_private.sessions where account_id=target.id;
  end if;
  c.data:=rakeeza_private.audit(c.data,a,case when op='reset' then 'إعادة تعيين كلمة مرور موظف' else 'تعديل حساب مستخدم' end,'user',jsonb_build_object('id',target.id));
  update rakeeza_private.companies set data=c.data,revision=revision+1 where id=c.id;
  return jsonb_build_object('ok',true);
 else raise exception 'طلب غير صالح';end if;
end $$;
create or replace function rakeeza_private.accept_invite(code text,password text) returns jsonb language plpgsql security definer set search_path='' as $$
declare inv rakeeza_private.invites;a rakeeza_private.accounts;c rakeeza_private.companies;tok text;
begin
 if password is null or length(password)<8 or octet_length(password)>72 then raise exception 'كلمة مرور غير صالحة';end if;
 select * into inv from rakeeza_private.invites where token_hash=encode(extensions.digest(code,'sha256'),'hex') and expires_at>now() and accepted_at is null for update;
 if inv.id is null then raise exception 'الدعوة غير صالحة أو منتهية';end if;
 select * into c from rakeeza_private.companies where id=inv.company_id for update;
 inv.profile:=rakeeza_private.validate_member(c.data,inv.profile);
 insert into rakeeza_private.accounts(company_id,phone,password_hash,profile) values(c.id,inv.phone,extensions.crypt(password,extensions.gen_salt('bf',12)),inv.profile) returning * into a;
 update rakeeza_private.invites set accepted_at=now() where id=inv.id;
 tok:=encode(extensions.gen_random_bytes(32),'hex');insert into rakeeza_private.sessions values(encode(extensions.digest(tok,'sha256'),'hex'),a.id,now()+interval '7 days');
 c.data:=rakeeza_private.audit(c.data,a,'قبول دعوة','user',jsonb_build_object('id',a.id));update rakeeza_private.companies set data=c.data,revision=revision+1 where id=c.id;
 return jsonb_build_object('token',tok,'companyId',c.id);
end $$;
create or replace function rakeeza_private.recovery_key(t text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts:=rakeeza_private.actor(t);k text;
begin
 k:=encode(extensions.gen_random_bytes(24),'hex');insert into rakeeza_private.recovery(account_id,key_hash) values(a.id,encode(extensions.digest(k,'sha256'),'hex')) on conflict(account_id) do update set key_hash=excluded.key_hash,created_at=now();
 return jsonb_build_object('recoveryKey',k,'notice','احفظه خارج المنصة. يظهر مرة واحدة. إنشاء مفتاح جديد يبطل السابق. لا توجد رسالة SMS.');
end $$;
create or replace function rakeeza_private.recover(phone text,key text,password text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts;
begin
 if password is null or length(password)<8 or octet_length(password)>72 then raise exception 'كلمة مرور غير صالحة';end if;
 if not rakeeza_private.rate_limit('recover:'||coalesce(phone,''),10) then return jsonb_build_object('error','طلبات كثيرة؛ حاول لاحقًا');end if;
 select x.* into a from rakeeza_private.accounts x join rakeeza_private.recovery r on r.account_id=x.id where x.phone=recover.phone and x.active and r.key_hash=encode(extensions.digest(key,'sha256'),'hex') for update of x;
 if a.id is null then return jsonb_build_object('error','بيانات الاستعادة غير صحيحة');end if;
 update rakeeza_private.accounts set password_hash=extensions.crypt(password,extensions.gen_salt('bf',12)) where id=a.id;
 delete from rakeeza_private.sessions where account_id=a.id;delete from rakeeza_private.recovery where account_id=a.id;
 return jsonb_build_object('ok',true,'notice','تم تغيير كلمة المرور وإلغاء الجلسات والمفتاح المستعمل');
end $$;
revoke all on all tables in schema rakeeza_private from public,anon,authenticated;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
