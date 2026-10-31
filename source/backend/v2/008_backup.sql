create table if not exists rakeeza_private.backup_keys(company_id uuid primary key references rakeeza_private.companies(id),secret bytea not null);
alter table rakeeza_private.backup_keys enable row level security;
create or replace function rakeeza_private.backup(t text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts:=rakeeza_private.actor(t);c rakeeza_private.companies;k bytea;bundle jsonb;
begin
 select * into c from rakeeza_private.companies where id=a.company_id;
 if a.profile->>'role'<>'executive_director' then raise exception 'النسخ الاحتياطي للمدير التنفيذي فقط';end if;
 insert into rakeeza_private.backup_keys values(c.id,extensions.gen_random_bytes(32)) on conflict do nothing;select secret into k from rakeeza_private.backup_keys where company_id=c.id;
 bundle:=jsonb_build_object('format','rakeeza-tenant-v2','companyId',c.id,'revision',c.revision,'exportedAt',now(),'profile',c.profile,'data',c.data||jsonb_build_object('version',2,'companyId',c.id));
 return jsonb_build_object('bundle',bundle,'signature',encode(extensions.hmac(convert_to(bundle::text,'UTF8'),k,'sha256'),'hex'),'notice','يتضمن الملف بيانات الشركة الحساسة. احفظه بمكان خاص. لا يشمل كلمات المرور أو استعادة الحسابات.');
end $$;
create or replace function rakeeza_private.restore(t text,expected_revision bigint,archive jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts:=rakeeza_private.actor(t);c rakeeza_private.companies;k bytea;bundle jsonb:=archive->'bundle';d jsonb;
begin
 select * into c from rakeeza_private.companies where id=a.company_id for update;
 if a.profile->>'role'<>'executive_director' then raise exception 'الاستعادة للمدير التنفيذي فقط';end if;
 if c.revision is distinct from expected_revision then raise exception 'تعارض: حدّث قبل الاستعادة';end if;
 select secret into k from rakeeza_private.backup_keys where company_id=c.id;
 if k is null or bundle->>'companyId' is distinct from c.id::text or bundle->>'format' is distinct from 'rakeeza-tenant-v2' or encode(extensions.hmac(convert_to(bundle::text,'UTF8'),k,'sha256'),'hex') is distinct from archive->>'signature' then raise exception 'نسخة معدلة أو لشركة أخرى';end if;
 d:=bundle->'data';if d->>'companyId' is distinct from c.id::text then raise exception 'نسخة غير صالحة';end if;
 -- Keep current access grants and accounts. Restoring data never rewinds security changes.
 d:=d-'rolePermissions';if c.data?'rolePermissions' then d:=d||jsonb_build_object('rolePermissions',c.data->'rolePermissions');end if;
 d:=rakeeza_private.audit(d,a,'استعادة نسخة احتياطية بإصدار جديد','backup',jsonb_build_object('id',bundle->>'revision'));
 insert into rakeeza_private.versions values(c.id,c.revision,c.data,now());
 update rakeeza_private.companies set data=d,profile=bundle->'profile',revision=revision+1 where id=c.id;
 return rakeeza_private.snapshot_v2(t);
end $$;
revoke all on all tables in schema rakeeza_private from public,anon,authenticated;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
