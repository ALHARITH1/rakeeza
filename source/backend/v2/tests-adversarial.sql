\set ON_ERROR_STOP on
begin;
do $$
declare pub jsonb;t text;a rakeeza_private.accounts;d jsonb;v jsonb;w jsonb;bad boolean;rev bigint;
begin
 pub:=public.rakeeza_auth('register','0598888841','v2-adversarial-only','{"companyName":"Adversarial","crNumber":"9876543241","adminName":"Admin"}');t:=pub->>'token';a:=rakeeza_private.actor(t);
 d:='{"version":2,"projects":[{"id":"p1","name":"P","code":"P","lat":24.7,"lng":46.7},{"id":"p2","name":"Other","code":"O"}],"boqItems":[{"id":"b1","projectId":"p1","description":"Existing","unit":"m","contractQty":100,"executedQty":0,"unitPrice":10,"costBreakdown":{"material":5}}],"workers":[{"id":"w1","projectId":"p1","name":"A"}],"notifications":[]}'::jsonb||jsonb_build_object('companyId',a.company_id);
 v:=rakeeza_private.operation(a,d,'boq.create','{"id":"b1","projectId":"p1","code":"NEW","description":"New","unit":"m","contractQty":20,"unitPrice":8}');if jsonb_array_length(v->'boqItems')<>2 then raise exception 'attacker overwrote BOQ via create ID';end if;
 a.profile:=a.profile||'{"role":"site_engineer","projectIds":["p1"]}';
 bad:=false;begin perform rakeeza_private.workflow(a,d,'rfi.create','{"projectId":"p2","subject":"x","question":"x"}');exception when others then bad:=true;end;if not bad then raise exception 'cross project creation';end if;
 bad:=false;begin perform rakeeza_private.operation(a,d,'worker.create','{"projectId":"p1","name":"Hacked","basicSalary":9000}');exception when others then bad:=true;end;if not bad then raise exception 'site created HR record';end if;
 a:=rakeeza_private.actor(t);update rakeeza_private.companies set data=d where id=a.company_id;
 select revision into rev from rakeeza_private.companies where id=a.company_id;
 bad:=false;begin perform rakeeza_private.command(t,rev,'permissions.update','{"role":"site_engineer","tabs":["hr"],"actions":["hr.manage"]}');exception when others then bad:=true;end;if not bad then raise exception 'custom role grants exceeded envelope';end if;
 bad:=false;begin perform rakeeza_private.manage_member(t,'invite','{"name":"Worker","phone":"0598888842","role":"worker","workerId":"w1","projectIds":["p1","p2"]}');exception when others then bad:=true;end;if not bad then raise exception 'worker invitation multiple projects';end if;
 bad:=false;begin perform rakeeza_private.command(t,null,'project.create','{}');exception when others then bad:=true;end;if not bad then raise exception 'null revision passed';end if;
 bad:=false;begin perform rakeeza_private.manage_member(t,'update',jsonb_build_object('id',a.id,'active',false));exception when others then bad:=true;end;if not bad then raise exception 'self disable passed';end if;
 raise notice 'PASS staged adversarial: create cannot overwrite ID, cross-project and HR escalation rejected, custom grant envelope, single worker project, null revision, self-disable';
end $$;
rollback;
