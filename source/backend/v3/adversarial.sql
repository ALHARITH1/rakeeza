\set ON_ERROR_STOP on
begin;
do $$
declare t text;au jsonb;a rakeeza_private.accounts;c uuid;o jsonb;v jsonb;id text;bad boolean;archive jsonb;other uuid;
begin
 au:=public.rakeeza_auth('register','0595555590','modules-tests-only','{"companyName":"Module Negative","crNumber":"9898989890","adminName":"Admin"}');t:=au->>'token';a:=rakeeza_private.actor(t);c:=a.company_id;
 update rakeeza_private.companies set data=jsonb_build_object('version',2,'companyId',c,'projects','[{"id":"p1"}]'::jsonb,'workers','[{"id":"w1","projectId":"p1","name":"W","joinDate":"2021-01-01"}]'::jsonb) where companies.id=c;
 o:=rakeeza_private.modules(t,'modules.create','{"kind":"clearance","projectId":"p1","body":{"title":"Boundary","workerId":"w1","lastWorkingDay":"2025-12-31","reason":"resignation","lastWage":6000,"unusedLeaveDays":0,"additionalEntitlements":0,"deductions":0,"legalReviewNotes":"Full review with contract"}}');
 if abs((o->'body'->>'netPayable')::numeric-5000)>0.01 then raise exception 'exact five years resignation ratio wrong %',o;end if;
 o:=rakeeza_private.modules(t,'modules.create','{"kind":"document","projectId":"p1","body":{"title":"Original"}}');id:=o->>'id';
 o:=rakeeza_private.modules(t,'modules.update',jsonb_build_object('id',id,'revision',o->'revision','body','{"title":"Edited","status":"approved","approvedBy":"forged"}'::jsonb));if o->'body'->>'status'<>'draft' or o->'body'?'approvedBy' then raise exception 'status spoof';end if;
 bad:=false;begin perform rakeeza_private.modules(t,'modules.file.add',jsonb_build_object('id',id,'revision',o->'revision','filename','fake.pdf','mime','application/pdf','base64','YWJj'));exception when others then bad:=true;end;if not bad then raise exception 'fake pdf accepted';end if;
 o:=rakeeza_private.modules(t,'modules.file.add',jsonb_build_object('id',id,'revision',o->'revision','filename','real.txt','mime','text/plain','base64','YWJj'));
 archive:=rakeeza_private.backup(t);delete from rakeeza_private.module_files where company_id=c;delete from rakeeza_private.module_records where company_id=c;
 perform rakeeza_private.restore(t,(select revision from rakeeza_private.companies where companies.id=c),archive);if not exists(select 1 from rakeeza_private.module_files mf where mf.company_id=c and mf.bytes=convert_to('abc','UTF8')) then raise exception 'module backup bytes lost';end if;
 au:=public.rakeeza_auth('register','0595555591','modules-tests-only','{"companyName":"Other module company","crNumber":"9898989891","adminName":"Admin"}');
 v:=rakeeza_private.modules(au->>'token','modules.list','{"kind":"document"}');if jsonb_array_length(v->'records')<>0 then raise exception 'tenant leak';end if;
 bad:=false;begin perform rakeeza_private.modules(au->>'token','modules.action',jsonb_build_object('id',id,'revision',o->'revision','action','submit'));exception when others then bad:=true;end;if not bad then raise exception 'tenant write leak';end if;
 raise notice 'PASS exact five-year resignation, edit anti-spoof, fake attachment denial, signed module/file restore, tenant read/write isolation';
end $$;
rollback;
