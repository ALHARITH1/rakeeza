\set ON_ERROR_STOP on
begin;
do $$
declare pub jsonb;t text;a rakeeza_private.accounts;d jsonb;v jsonb;id text;bad boolean;
begin
 pub:=public.rakeeza_auth('register','0598888861','v2-photos-test-only','{"companyName":"Photos","crNumber":"9876543261","adminName":"Admin"}');t:=pub->>'token';a:=rakeeza_private.actor(t);
 d:='{"projects":[{"id":"p1","startDate":"2026-01-01"}],"boqItems":[{"id":"b1","projectId":"p1","description":"Item","contractQty":100,"executedQty":10,"unitPrice":10,"unit":"m"}]}'::jsonb;
 d:=rakeeza_private.workflow(a,d,'ppc.create','{"projectId":"p1","lines":[{"boqItemId":"b1","currentQty":5}],"submit":false}');id:=d->'ppcs'->0->>'id';
 d:=rakeeza_private.workflow(a,d,'ppc.update',jsonb_build_object('id',id,'lines','[{"boqItemId":"b1","currentQty":7}]'::jsonb,'submit',true));if jsonb_array_length(d->'ppcs')<>1 or d->'ppcs'->0->>'grossAmount'<>'70' then raise exception 'draft update failed';end if;
 bad:=false;begin perform rakeeza_private.workflow(a,d,'ppc.update',jsonb_build_object('id',id,'lines','[]'::jsonb));exception when others then bad:=true;end;if not bad then raise exception 'submitted edited';end if;
 d:=rakeeza_private.workflow(a,d,'dpr.create','{"projectId":"p1","date":"2026-10-31","sector":"Test","weatherCondition":"clear","tempC":25,"workforceCount":1,"equipmentCount":0,"items":[{"boqItemId":"b1","quantity":1}],"photos":["data:image/jpeg;base64,/9j/AAAA"],"submit":false}');if d->'dprs'->0->>'photosCount'<>'1' then raise exception 'photo dropped';end if;
 bad:=false;begin perform rakeeza_private.workflow(a,d,'dpr.create','{"projectId":"p1","date":"2026-10-31","sector":"Test","tempC":25,"workforceCount":1,"equipmentCount":0,"items":[{"boqItemId":"b1","quantity":1}],"photos":["data:image/svg+xml;base64,ABC"]}');exception when others then bad:=true;end;if not bad then raise exception 'SVG accepted';end if;
 raise notice 'PASS PPC draft update then lock, bounded photo preservation, active-content photo denial';
end $$;
rollback;
