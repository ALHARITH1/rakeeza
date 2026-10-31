\set ON_ERROR_STOP on
begin;
do $$
declare au jsonb;tok text; a rakeeza_private.accounts;c uuid;pid text:='p1';o jsonb;v jsonb;id text;rev bigint;inv jsonb;ct text;ot text;wt text;ht text;bad boolean;k text;
begin
 au:=public.rakeeza_auth('register','0595555500','modules-tests-only','{"companyName":"Modules Tests","crNumber":"9898989898","adminName":"Admin"}');tok:=au->>'token';a:=rakeeza_private.actor(tok);c:=a.company_id;
 update rakeeza_private.companies set data=jsonb_build_object('companyId',c,'version',2,'projects','[{"id":"p1","name":"Project"},{"id":"p2","name":"Other"}]'::jsonb,'workers','[{"id":"w1","projectId":"p1","name":"Worker","joinDate":"2020-01-01"}]'::jsonb) where companies.id=c;
 inv:=rakeeza_private.manage_member(tok,'invite','{"name":"Consultant","phone":"0595555501","role":"consultant","projectIds":["p1"]}');ct:=rakeeza_private.accept_invite(inv->>'inviteCode','modules-tests-only')->>'token';
 inv:=rakeeza_private.manage_member(tok,'invite','{"name":"Owner","phone":"0595555502","role":"owner","projectIds":["p1"]}');ot:=rakeeza_private.accept_invite(inv->>'inviteCode','modules-tests-only')->>'token';
 inv:=rakeeza_private.manage_member(tok,'invite','{"name":"Worker","phone":"0595555503","role":"worker","projectIds":["p1"],"workerId":"w1"}');wt:=rakeeza_private.accept_invite(inv->>'inviteCode','modules-tests-only')->>'token';
 inv:=rakeeza_private.manage_member(tok,'invite','{"name":"HR","phone":"0595555504","role":"hr_manager","projectIds":["p1"]}');ht:=rakeeza_private.accept_invite(inv->>'inviteCode','modules-tests-only')->>'token';
 foreach k in array array['document','contact','equipment','training','handover','payroll','clearance'] loop
  v:=case k when 'document' then '{"title":"Doc","sharedWithConsultant":true}' when 'contact' then '{"title":"Real Contact","email":"a@example.com"}' when 'equipment' then '{"title":"Excavator","plateNumber":"ABC123","engineHours":100,"nextServiceHours":500}' when 'training' then '{"title":"Safety training","workerId":"w1","trainingDate":"2026-10-31","result":"passed"}' when 'handover' then '{"title":"Handover","snags":[{"title":"Fix item","closed":true}]}' when 'payroll' then '{"title":"October","workerId":"w1","period":"2026-10","iban":"SA0380000000608010167519","basicSalary":5000,"housingAllowance":1000,"otherEarnings":200,"deductions":100}' else '{"title":"Clearance","workerId":"w1","lastWorkingDay":"2026-10-31","reason":"contract_expiry","lastWage":6000,"unusedLeaveDays":10,"deductions":100,"additionalEntitlements":500,"legalReviewNotes":"Reviewed source entitlement and signed contract"}' end;
  o:=rakeeza_private.modules(tok,'modules.create',jsonb_build_object('kind',k,'projectId',pid,'body',v));id:=o->>'id';
  if k='payroll' and o->'body'->>'netPayable'<>'6100.00' then raise exception 'payroll calculation wrong';end if;
  if k in('document','training','handover') then o:=rakeeza_private.modules(tok,'modules.file.add',jsonb_build_object('id',id,'revision',o->'revision','filename','private.txt','mime','text/plain','base64','YWJj'));end if;
  if k='handover' then
   if o->'body'->'snags'->0->>'closed'<>'false' then raise exception 'forged closed accepted';end if;
   o:=rakeeza_private.modules(tok,'modules.action',jsonb_build_object('id',id,'revision',o->'revision','action','close_snag','snagId',o->'body'->'snags'->0->>'id'));
  end if;
  o:=rakeeza_private.modules(tok,'modules.action',jsonb_build_object('id',id,'revision',o->'revision','action','submit'));
  if k='handover' then o:=rakeeza_private.modules(ct,'modules.action',jsonb_build_object('id',id,'revision',o->'revision','action','approve'));o:=rakeeza_private.modules(ot,'modules.action',jsonb_build_object('id',id,'revision',o->'revision','action','accept','confirmation','أوافق على المحتوى'));
  else o:=rakeeza_private.modules(tok,'modules.action',jsonb_build_object('id',id,'revision',o->'revision','action','approve'));end if;
  if k='clearance' then o:=rakeeza_private.modules(wt,'modules.action',jsonb_build_object('id',id,'revision',o->'revision','action','accept','confirmation','أوافق على المحتوى'));end if;
  bad:=false;begin perform rakeeza_private.modules(tok,'modules.action',jsonb_build_object('id',id,'revision',1,'action','submit'));exception when others then bad:=true;end;if not bad then raise exception 'stale revision allowed';end if;
  bad:=false;begin perform rakeeza_private.modules(wt,'modules.file.add',jsonb_build_object('id',id,'revision',o->'revision','filename','x.txt','mime','text/plain','base64','YWJj'));exception when others then bad:=true;end;if not bad then raise exception 'worker file write allowed';end if;
  if k='document' then
   v:=rakeeza_private.modules(ct,'modules.list','{"kind":"document"}');if jsonb_array_length(v->'records')<>1 then raise exception 'consultant share failed';end if;
   v:=rakeeza_private.modules(ct,'modules.file.get',jsonb_build_object('id',v->'records'->0->'files'->0->>'id'));if v->>'base64'<>'YWJj' then raise exception 'bytes changed';end if;
   v:=rakeeza_private.modules(ot,'modules.list','{"kind":"document"}');if jsonb_array_length(v->'records')<>0 then raise exception 'owner document leak';end if;
  end if;
 end loop;
 bad:=false;begin perform rakeeza_private.modules(ct,'modules.create','{"kind":"contact","projectId":"p1","body":{"title":"Forged"}}');exception when others then bad:=true;end;if not bad then raise exception 'consultant CRM write';end if;
 v:=rakeeza_private.modules(wt,'modules.location.share',jsonb_build_object('lat',24.7,'lng',46.7,'accuracy',5,'observedAt',now()));v:=rakeeza_private.modules(ht,'modules.location.list','{}');if jsonb_array_length(v->'positions')<>1 then raise exception 'live location missing';end if;
 update rakeeza_private.live_positions set expires_at=now()-interval '1 second' where company_id=c;v:=rakeeza_private.modules(ht,'modules.location.list','{}');if jsonb_array_length(v->'positions')<>0 then raise exception 'expired GPS shown';end if;
 perform rakeeza_private.modules(wt,'modules.location.stop','{}');v:=rakeeza_private.modules(ht,'modules.location.list','{}');if jsonb_array_length(v->'positions')<>0 then raise exception 'location not stopped';end if;
 raise notice 'PASS modules: all seven create/review flows, handover consultant-owner, clearance worker acknowledgement, private file bytes/shared scope, stale revisions, role denial, opt-in live position and stop';
end $$;
rollback;
