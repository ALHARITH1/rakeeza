-- Staged wrappers: no public grants until every role is tested.
create or replace function rakeeza_private.snapshot_v2(t text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts:=rakeeza_private.actor(t);c rakeeza_private.companies;members jsonb;
begin
 select * into c from rakeeza_private.companies where id=a.company_id;
 if a.profile->>'role'='executive_director' then
  select coalesce(jsonb_agg(x.profile||jsonb_build_object('id',x.id,'companyId',x.company_id,'phone',x.phone,'active',x.active)),'[]') into members from rakeeza_private.accounts x where x.company_id=c.id;
 else members:=jsonb_build_array(a.profile||jsonb_build_object('id',a.id,'companyId',a.company_id,'phone',a.phone,'active',a.active));end if;
 return jsonb_build_object('company',c.profile||jsonb_build_object('id',c.id),'user',a.profile||jsonb_build_object('id',a.id,'companyId',c.id,'phone',a.phone,'active',a.active),'users',members,'data',rakeeza_private.scoped_data(a,c.data),'revision',c.revision);
end $$;
create or replace function rakeeza_private.command(t text,expected_revision bigint,op text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts:=rakeeza_private.actor(t);c rakeeza_private.companies;d jsonb;role text;k text;val jsonb;pid text;col text;nr text;nt text;
begin
 select * into c from rakeeza_private.companies where id=a.company_id for update;
 if c.revision is distinct from expected_revision then raise exception 'تعارض: تغييرات من جهاز آخر؛ حدّث أولًا';end if;
 if p is null or jsonb_typeof(p)<>'object' or length(p::text)>2000000 then raise exception 'طلب غير صالح';end if;
 if not rakeeza_private.rate_limit('cmd:'||a.id::text,1200) then return jsonb_build_object('error','طلبات كثيرة');end if;
 d:=c.data||jsonb_build_object('version',2,'companyId',c.id);
 if op='attendance' then d:=rakeeza_private.attend(a,d,p);
 elsif op='company.update' then
  perform rakeeza_private.require_action(a,d,'users.manage');
  if nullif(trim(p->>'name'),'') is null or coalesce(p->>'crNumber','') !~ '^[0-9]{10}$' or coalesce(p->>'brandColor','') !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'هوية غير صالحة';end if;
  if nullif(p->>'logoDataUrl','') is not null and (p->>'logoDataUrl') !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' then raise exception 'صيغة شعار غير صالحة';end if;
  c.profile:=c.profile||rakeeza_private.fields(p,array['name','crNumber','brandColor','logoDataUrl']);d:=rakeeza_private.audit(d,a,op,'company',jsonb_build_object('id',c.id));
 elsif op='permissions.update' then
  perform rakeeza_private.require_action(a,d,'users.manage');role:=p->>'role';
  if role='executive_director' or role not in('project_manager','site_engineer','safety_officer','qaqc_manager','procurement_mgr','hr_manager','worker','owner','consultant','subcontractor','supplier') then raise exception 'وظيفة غير قابلة للتعديل';end if;
  if jsonb_typeof(p->'tabs') is distinct from 'array' or jsonb_typeof(p->'actions') is distinct from 'array' then raise exception 'صلاحيات غير صالحة';end if;
  -- No privilege escalation beyond the reviewed role envelope.
  for k in select jsonb_array_elements_text(p->'actions') loop if not rakeeza_private.actions(role)?k then raise exception 'الإجراء خارج نطاق الوظيفة: %',k;end if;end loop;
  val:=coalesce(nullif(d->'rolePermissions','null'),'{}');val:=jsonb_set(val,'{tabs}',coalesce(val->'tabs','{}')||jsonb_build_object(role,p->'tabs'));val:=jsonb_set(val,'{actions}',coalesce(val->'actions','{}')||jsonb_build_object(role,p->'actions'));d:=jsonb_set(d,'{rolePermissions}',val,true);d:=rakeeza_private.audit(d,a,op,'permissions',jsonb_build_object('id',role));
 elsif op='permissions.reset' then perform rakeeza_private.require_action(a,d,'users.manage');d:=d-'rolePermissions';d:=rakeeza_private.audit(d,a,op,'permissions','{}');
 elsif op='notifications.read' then
  if jsonb_typeof(p->'ids') is distinct from 'array' or jsonb_array_length(p->'ids')>10000 then raise exception 'قائمة إشعارات غير صالحة';end if;
  val:=coalesce(d->'notifReads','{}');val:=val||jsonb_build_object(a.id::text,coalesce(p->'ids','[]'));d:=jsonb_set(d,'{notifReads}',val,true);
 else d:=rakeeza_private.operation(a,d,op,p);end if;
 -- Each recipient gets a role-appropriate tab. Notifications contain no financial or HR body.
 if op<>'notifications.read' then
  pid:=p->>'projectId';col:=case split_part(op,'.',1) when 'dpr' then 'dprs' when 'ppc' then 'ppcs' when 'mr' then 'materialReqs' when 'vo' then 'variationOrders' when 'rfi' then 'rfis' when 'ncr' then 'ncrs' when 'sub' then 'subClaims' when 'leave' then 'leaveRequests' when 'advance' then 'advances' else null end;
  if pid is null and col is not null and p->>'id' is not null then select it->>'projectId' into pid from jsonb_array_elements(coalesce(d->col,'[]')) it where it->>'id'=p->>'id';end if;
  for nr in select distinct x.profile->>'role' from rakeeza_private.accounts x where x.company_id=c.id and x.active and (x.profile->>'role'='executive_director' or (rakeeza_private.allowed(x,pid) and x.profile->>'role' in('project_manager',case when split_part(op,'.',1) in('dpr','ppc','vo','rfi','ncr') then 'consultant' else 'project_manager' end,case when split_part(op,'.',1) in('ppc','vo') then 'owner' else 'project_manager' end))) loop
   nt:=case nr when 'owner' then 'owner_portal' when 'consultant' then 'consultant_portal' else case split_part(op,'.',1) when 'dpr' then 'dpr' when 'ppc' then 'ppc' when 'mr' then 'procurement' when 'vo' then 'tendering' when 'rfi' then 'rfi' else 'dashboard' end end;
   d:=jsonb_set(d,'{notifications}',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'title','تحديث على المشروع: '||op,'description','','type','info','targetTab',nt,'projectId',pid,'toRoles',jsonb_build_array(nr),'createdAt',now(),'time',to_char(now() at time zone 'Asia/Riyadh','YYYY-MM-DD HH24:MI'),'isRead',false,'readBy','[]'::jsonb))||coalesce(d->'notifications','[]'),true);
  end loop;
 end if;
 insert into rakeeza_private.versions values(c.id,c.revision,c.data,now());
 update rakeeza_private.companies set data=d,profile=c.profile,revision=revision+1 where id=c.id;
 delete from rakeeza_private.versions where company_id=c.id and revision<c.revision-49;
 return rakeeza_private.snapshot_v2(t);
end $$;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
