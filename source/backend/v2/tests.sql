\set ON_ERROR_STOP on
begin;
do $$
declare a rakeeza_private.accounts;c rakeeza_private.companies;d jsonb;v jsonb;pub jsonb;inv jsonb;accepted jsonb;rk jsonb;rol text;token text;bad boolean;
begin
 pub:=public.rakeeza_auth('register','0598888801','v2-local-only-password','{"companyName":"V2 Tests","crNumber":"9876543201","adminName":"V2 Admin"}');token:=pub->>'token';a:=rakeeza_private.actor(token);
 d:='{"version":2,"projects":[{"id":"p1","name":"Allowed","contractValue":999,"actualCost":888},{"id":"p2","name":"Hidden"}],"boqItems":[{"id":"b1","projectId":"p1","code":"B1","description":"Item","unit":"m","contractQty":100,"executedQty":0,"unitPrice":10,"totalPrice":1000,"costBreakdown":{"material":5}}],"workers":[{"id":"w1","projectId":"p1","name":"Self","iqamaNumber":"1999999999","basicSalary":9000},{"id":"w2","projectId":"p1","name":"Other","iqamaNumber":"1888888888","basicSalary":19000}],"ptws":[{"id":"pt1","projectId":"p1","status":"active","validUntil":"2099-01-01 00:00"}],"subcontractors":[{"id":"sub1","projectId":"p1","name":"Own","contractValue":5000},{"id":"sub2","projectId":"p1","name":"Other","contractValue":9000}],"subClaims":[],"materialReqs":[{"id":"m1","projectId":"p1","supplierName":"Own supplier","status":"po_issued"},{"id":"m2","projectId":"p1","supplierName":"Other supplier","status":"po_issued"}],"leaveRequests":[{"id":"l1","workerId":"w1","projectId":"p1"},{"id":"l2","workerId":"w2","projectId":"p1"}]}'::jsonb||jsonb_build_object('companyId',a.company_id);
 update rakeeza_private.companies set data=d where id=a.company_id;
 foreach rol in array array['project_manager','site_engineer','safety_officer','qaqc_manager','procurement_mgr','hr_manager','worker','owner','consultant','subcontractor','supplier'] loop
  a.profile:=jsonb_build_object('name','Test','role',rol,'projectIds',jsonb_build_array('p1'),'workerId','w1','subcontractorId','sub1','supplierName','Own supplier');
  v:=rakeeza_private.scoped_data(a,d);
  if jsonb_array_length(v->'projects')<>1 or v->'projects'->0->>'id'<>'p1' then raise exception 'project leak for %',rol;end if;
  if rol not in('hr_manager','worker') and v::text like '%1999999999%' then raise exception 'identity leak for %',rol;end if;
  if rol not in('hr_manager','worker') and v::text like '%19000%' then raise exception 'salary leak for %',rol;end if;
  if rol='worker' and (jsonb_array_length(v->'workers')<>1 or jsonb_array_length(v->'leaveRequests')<>1) then raise exception 'worker self scope failed';end if;
  if rol='supplier' and (jsonb_array_length(v->'materialReqs')<>1 or jsonb_array_length(v->'subcontractors')<>0) then raise exception 'supplier scope failed';end if;
  if rol='subcontractor' and jsonb_array_length(v->'subcontractors')<>1 then raise exception 'subcontractor scope failed';end if;
  if rakeeza_private.has_action(a,d,'users.manage') then raise exception 'member gained user management';end if;
 end loop;
 a:=rakeeza_private.actor(token);
 inv:=rakeeza_private.manage_member(token,'invite','{"name":"Site One","role":"site_engineer","phone":"0598888802","projectIds":["p1"]}');
 accepted:=rakeeza_private.accept_invite(inv->>'inviteCode','v2-local-only-password');
 if rakeeza_private.actor(accepted->>'token') is null then raise exception 'invite acceptance failed';end if;
 bad:=false;begin perform rakeeza_private.accept_invite(inv->>'inviteCode','v2-local-only-password');exception when others then bad:=true;end;if not bad then raise exception 'invite reused';end if;
 bad:=false;begin perform rakeeza_private.manage_member(accepted->>'token','invite','{}');exception when others then bad:=true;end;if not bad then raise exception 'member created invite';end if;
 rk:=rakeeza_private.recovery_key(accepted->>'token');v:=rakeeza_private.recover('0598888802',rk->>'recoveryKey','new-v2-local-only-password');if v->>'ok'<>'true' then raise exception 'recovery failed';end if;
 bad:=false;begin perform rakeeza_private.actor(accepted->>'token');exception when others then bad:=true;end;if not bad then raise exception 'old session survived recovery';end if;
 v:=rakeeza_private.recover('0598888802',rk->>'recoveryKey','another-local-only-password');if v->>'error' is null then raise exception 'recovery reused';end if;
 -- Sequential site -> PM -> consultant DPR approval with canonical posting.
 a.profile:=a.profile||'{"role":"site_engineer","projectIds":["p1"]}';
 d:=rakeeza_private.workflow(a,d,'dpr.create','{"projectId":"p1","date":"2026-10-31","sector":"Sector","weatherCondition":"clear","tempC":32,"workforceCount":4,"equipmentCount":1,"items":[{"boqItemId":"b1","quantity":10}],"submit":true}');
 v:=d->'dprs'->0;
 bad:=false;begin perform rakeeza_private.workflow(a,d,'dpr.consultant_approve',jsonb_build_object('id',v->>'id'));exception when others then bad:=true;end;if not bad then raise exception 'site approved own DPR';end if;
 a.profile:=a.profile||'{"role":"project_manager"}';d:=rakeeza_private.workflow(a,d,'dpr.pm_approve',jsonb_build_object('id',v->>'id'));
 a.profile:=a.profile||'{"role":"consultant"}';d:=rakeeza_private.workflow(a,d,'dpr.consultant_approve',jsonb_build_object('id',v->>'id'));
 if d->'boqItems'->0->>'executedQty'<>'10' then raise exception 'DPR posting incorrect';end if;
 bad:=false;begin perform rakeeza_private.workflow(a,d,'dpr.consultant_approve',jsonb_build_object('id',v->>'id'));exception when others then bad:=true;end;if not bad then raise exception 'DPR double posted';end if;
 a.profile:=a.profile||'{"role":"project_manager"}';d:=rakeeza_private.workflow(a,d,'ppc.create','{"projectId":"p1","submit":true,"lines":[{"boqItemId":"b1","currentQty":10}]}');v:=d->'ppcs'->0;
 if (v->>'grossAmount')::numeric<>100 then raise exception 'PPC total wrong';end if;
 a.profile:=a.profile||'{"role":"consultant"}';d:=rakeeza_private.workflow(a,d,'ppc.consultant_approve',jsonb_build_object('id',v->>'id'));
 a.profile:=a.profile||'{"role":"owner"}';d:=rakeeza_private.workflow(a,d,'ppc.owner_approve',jsonb_build_object('id',v->>'id'));
 a.profile:=a.profile||'{"role":"executive_director"}';d:=rakeeza_private.workflow(a,d,'ppc.disburse',jsonb_build_object('id',v->>'id'));
 raise notice 'PASS staged v2: 11-role read/project/HR boundaries, invite one-time use, recovery invalidates session/key, DPR chain and single posting, PPC chain and canonical totals';
end $$;
rollback;
