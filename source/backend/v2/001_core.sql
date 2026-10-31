-- STAGED v2. No public RPCs granted by this file. v1 release is unaffected.
create or replace function rakeeza_private.actor(t text) returns rakeeza_private.accounts language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts;
begin
 select x.* into a from rakeeza_private.accounts x join rakeeza_private.sessions s on s.account_id=x.id where s.token_hash=encode(extensions.digest(t,'sha256'),'hex') and s.expires_at>now() and x.active;
 if a.id is null then raise exception 'انتهت الجلسة';end if;
 return a;
end $$;
create or replace function rakeeza_private.allowed(a rakeeza_private.accounts,pid text) returns boolean language sql immutable set search_path='' as $$
 select coalesce(a.profile->>'projectIds'='all' or (a.profile->'projectIds') ? pid,false)
$$;
create or replace function rakeeza_private.actions(role text) returns jsonb language sql immutable set search_path='' as $$
 select case role
 when 'executive_director' then '["dpr.create","dpr.pm_approve","ppc.create","ppc.disburse","mr.create","mr.pm_approve","mr.issue_po","mr.grn","vo.create","rfi.create","ncr.issue","ncr.close","lab.create","ptw.create","incident.create","tbt.create","project.create","boq.edit","users.manage","audit.view","hr.manage","hr.leave_approve","team.attendance","sub.claim_approve","finance.view"]'::jsonb
 when 'project_manager' then '["dpr.create","dpr.pm_approve","ppc.create","mr.create","mr.pm_approve","vo.create","rfi.create","ncr.close","incident.create","boq.edit","team.attendance","sub.claim_approve","finance.view"]'::jsonb
 when 'site_engineer' then '["dpr.create","mr.create","rfi.create","team.attendance","incident.create"]'::jsonb
 when 'safety_officer' then '["ptw.create","incident.create","tbt.create"]'::jsonb
 when 'qaqc_manager' then '["ncr.issue","ncr.close","lab.create"]'::jsonb
 when 'procurement_mgr' then '["mr.issue_po","mr.grn"]'::jsonb
 when 'hr_manager' then '["hr.manage","hr.leave_approve","team.attendance","tbt.create"]'::jsonb
 when 'owner' then '["ppc.owner_approve","vo.owner_approve","finance.view"]'::jsonb
 when 'consultant' then '["dpr.consultant_approve","ppc.consultant_approve","vo.consultant_approve","rfi.answer","ncr.issue","finance.view"]'::jsonb
 when 'subcontractor' then '["sub.claim"]'::jsonb
 when 'supplier' then '["mr.supplier"]'::jsonb
 else '[]'::jsonb end
$$;
create or replace function rakeeza_private.has_action(a rakeeza_private.accounts,d jsonb,act text) returns boolean language plpgsql immutable set search_path='' as $$
declare perms jsonb;rol text:=a.profile->>'role';
begin
 if rol='executive_director' and act='users.manage' then return true;end if;
 perms:=coalesce(d->'rolePermissions'->'actions'->rol,rakeeza_private.actions(rol));
 -- Custom grants cannot cross external-party/HR trust boundaries.
 if rol in('worker','subcontractor','supplier','owner','consultant') then return rakeeza_private.actions(rol)?act and perms?act;end if;
 if act in('hr.manage','hr.leave_approve') and rol not in('executive_director','hr_manager') then return false;end if;
 if act='users.manage' and rol<>'executive_director' then return false;end if;
 return coalesce(perms?act,false) and rakeeza_private.actions(rol)?act;
end $$;
create or replace function rakeeza_private.require_action(a rakeeza_private.accounts,d jsonb,act text,pid text default null) returns void language plpgsql immutable set search_path='' as $$
begin
 if not rakeeza_private.has_action(a,d,act) then raise exception 'ليس لديك صلاحية';end if;
 if pid is not null and not rakeeza_private.allowed(a,pid) then raise exception 'المشروع خارج صلاحياتك';end if;
end $$;
create or replace function rakeeza_private.item(d jsonb,collection text,item_id text) returns jsonb language plpgsql immutable set search_path='' as $$
declare v jsonb;
begin
 select x into v from jsonb_array_elements(coalesce(d->collection,'[]')) x where x->>'id'=item_id;
 if v is null then raise exception 'السجل غير موجود';end if;
 return v;
end $$;
create or replace function rakeeza_private.put(d jsonb,collection text,item jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare arr jsonb;found boolean;
begin
 select coalesce(jsonb_agg(case when x->>'id'=item->>'id' then item else x end),'[]'::jsonb),coalesce(bool_or(x->>'id'=item->>'id'),false) into arr,found from jsonb_array_elements(coalesce(d->collection,'[]')) x;
 if not found then arr:=jsonb_build_array(item)||arr;end if;
 return jsonb_set(d,array[collection],arr,true);
end $$;
create or replace function rakeeza_private.fields(v jsonb,keys text[]) returns jsonb language sql immutable set search_path='' as $$select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(v) where key=any(keys)$$;
create or replace function rakeeza_private.num(v jsonb,k text,minval numeric default 0,maxval numeric default 1000000000000) returns numeric language plpgsql immutable set search_path='' as $$
declare n numeric;
begin
 if jsonb_typeof(v->k)<>'number' or v->k is null then raise exception 'قيمة عددية مطلوبة: %',k;end if;
 n:=(v->>k)::numeric;if n<minval or n>maxval then raise exception 'قيمة خارج النطاق: %',k;end if;return n;
end $$;
create or replace function rakeeza_private.text(v jsonb,k text,maxlen int default 2000) returns text language plpgsql immutable set search_path='' as $$
declare t text:=trim(v->>k);
begin if t is null or length(t)<1 or length(t)>maxlen then raise exception 'حقل مطلوب أو طويل: %',k;end if;return t;end $$;
create or replace function rakeeza_private.history(item jsonb,a rakeeza_private.accounts,act text,note text default null) returns jsonb language sql volatile set search_path='' as $$
 select jsonb_set(item,'{history}',coalesce(item->'history','[]')||jsonb_build_array(jsonb_build_object('at',now(),'byUserId',a.id,'byName',a.profile->>'name','role',a.profile->>'role','action',act,'note',left(note,2000))),true)
$$;
create or replace function rakeeza_private.audit(d jsonb,a rakeeza_private.accounts,act text,collection text,item jsonb) returns jsonb language sql volatile set search_path='' as $$
 select jsonb_set(d,'{audit}',(select coalesce(jsonb_agg(x),'[]') from(select x from jsonb_array_elements(jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'at',now(),'userId',a.id,'userName',a.profile->>'name','role',a.profile->>'role','action',act,'entityType',collection,'entityId',item->>'id','projectId',item->>'projectId'))||coalesce(d->'audit','[]')) x limit 2000) q),true)
$$;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
