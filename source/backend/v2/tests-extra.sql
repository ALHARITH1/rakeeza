\set ON_ERROR_STOP on
begin;
do $$
declare pub jsonb;t text;a rakeeza_private.accounts;c rakeeza_private.companies;d jsonb;v jsonb;x jsonb;archive jsonb;rev bigint;bad boolean;
begin
 pub:=public.rakeeza_auth('register','0598888811','v2-extra-test-only','{"companyName":"Extra","crNumber":"9876543211","adminName":"Admin"}');t:=pub->>'token';a:=rakeeza_private.actor(t);
 d:='{"version":2,"projects":[{"id":"p1","name":"P","code":"P","lat":24.71,"lng":46.67}],"workers":[],"boqItems":[],"ptws":[],"notifications":[]}'::jsonb||jsonb_build_object('companyId',a.company_id);
 d:=rakeeza_private.operation(a,d,'worker.create','{"projectId":"p1","name":"W","empCode":"W1","role":"operator","iqamaNumber":"1999999999","basicSalary":5000,"housingAllowance":1000,"transportAllowance":500}');x:=d->'workers'->0;
 a.profile:=a.profile||jsonb_build_object('role','worker','workerId',x->>'id','projectIds',jsonb_build_array('p1'));
 d:=rakeeza_private.operation(a,d,'leave.request','{"type":"annual","startDate":"2026-11-01","endDate":"2026-11-03","reason":"test"}');v:=d->'leaveRequests'->0;
 bad:=false;begin perform rakeeza_private.operation(a,d,'leave.review',jsonb_build_object('id',v->>'id','approve',true));exception when others then bad:=true;end;if not bad then raise exception 'worker self-approved leave';end if;
 a.profile:=a.profile||'{"role":"hr_manager"}';d:=rakeeza_private.operation(a,d,'leave.review',jsonb_build_object('id',v->>'id','approve',true));
 if d->'workers'->0->>'leaveBalanceDays'<>'18' then raise exception 'leave balance wrong';end if;
 a.profile:=a.profile||'{"role":"worker"}';
 bad:=false;begin perform rakeeza_private.attend(a,d,jsonb_build_object('type','clock_in','lat',0,'lng',0,'accuracy',5,'observedAt',now()));exception when others then bad:=true;end;if not bad then raise exception 'far GPS accepted';end if;
 d:=rakeeza_private.attend(a,d,jsonb_build_object('type','clock_in','lat',24.71,'lng',46.67,'accuracy',5,'observedAt',now()));
 bad:=false;begin perform rakeeza_private.attend(a,d,jsonb_build_object('type','clock_in','lat',24.71,'lng',46.67,'accuracy',5,'observedAt',now()));exception when others then bad:=true;end;if not bad then raise exception 'duplicate attendance accepted';end if;
 d:=rakeeza_private.attend(a,d,jsonb_build_object('type','clock_out','lat',24.71,'lng',46.67,'accuracy',5,'observedAt',now()));
 update rakeeza_private.companies set data=d where id=a.company_id;
 archive:=rakeeza_private.backup(t);select revision into rev from rakeeza_private.companies where id=a.company_id;
 v:=rakeeza_private.restore(t,rev,archive);if v->'data'->'workers'->0->>'name'<>'W' then raise exception 'restore data lost';end if;
 archive:=jsonb_set(archive,'{bundle,data,workers,0,name}','"tampered"');
 bad:=false;begin perform rakeeza_private.restore(t,rev+1,archive);exception when others then bad:=true;end;if not bad then raise exception 'tampered backup accepted';end if;
 raise notice 'PASS staged v2 extra: worker creation, own leave, HR review, no self approval, server geofence, duplicate attendance denied, checkout, signed backup restore and tamper rejection';
end $$;
rollback;
