\set ON_ERROR_STOP on
begin;
do $$
declare au jsonb;t text;inv jsonb;mt text;v jsonb;o jsonb;role text;phone int:=10;bad boolean;c uuid;
begin
 au:=public.rakeeza_auth('register','0595555570','modules-tests-only','{"companyName":"Boundary Roles","crNumber":"9898989870","adminName":"Admin"}');t:=au->>'token';c:=(rakeeza_private.actor(t)).company_id;
 update rakeeza_private.companies set data=jsonb_build_object('version',2,'companyId',c,'projects','[{"id":"p1"},{"id":"p2"}]'::jsonb,'workers','[{"id":"w1","projectId":"p1","name":"Self","joinDate":"2020-01-01"},{"id":"w2","projectId":"p1","name":"Other","joinDate":"2020-01-01"}]'::jsonb) where companies.id=c;
 o:=rakeeza_private.modules(t,'modules.create','{"kind":"document","projectId":"p2","body":{"title":"Hidden project document","sharedWithConsultant":true}}');
 foreach role in array array['project_manager','site_engineer','safety_officer','qaqc_manager','procurement_mgr','hr_manager','worker','owner','consultant','subcontractor','supplier'] loop
  if role='subcontractor' then continue;end if;phone:=phone+1;
  inv:=rakeeza_private.manage_member(t,'invite',jsonb_build_object('name',role,'phone','05955555'||phone::text,'role',role,'projectIds','["p1"]'::jsonb,'workerId','w1','supplierName','Supplier'));mt:=rakeeza_private.accept_invite(inv->>'inviteCode','modules-tests-only')->>'token';
  v:=rakeeza_private.modules(mt,'modules.list','{"kind":"document"}');if jsonb_array_length(v->'records')<>0 then raise exception 'project boundary leak for %',role;end if;
  bad:=false;begin perform rakeeza_private.modules(mt,'modules.create','{"kind":"document","projectId":"p2","body":{"title":"Foreign"}}');exception when others then bad:=true;end;if not bad then raise exception 'project boundary write for %',role;end if;
  if role not in('hr_manager') then bad:=false;begin perform rakeeza_private.modules(mt,'modules.create','{"kind":"payroll","projectId":"p1","body":{"title":"Escalation"}}');exception when others then bad:=true;end;if not bad then raise exception 'payroll write escalation %',role;end if;end if;
  if role in('owner','consultant','supplier','worker') then bad:=false;begin perform rakeeza_private.modules(mt,'modules.location.list','{}');exception when others then bad:=true;end;if not bad then raise exception 'location read escalation %',role;end if;end if;
 end loop;
 raise notice 'PASS ten nonexecutive role module project boundaries, private payroll and live-location access denials';
end $$;
rollback;
