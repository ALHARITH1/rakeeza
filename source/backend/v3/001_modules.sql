-- Independent modules, no changes to live v2 workflow behavior.
create table if not exists rakeeza_private.module_records(id uuid primary key default gen_random_uuid(),company_id uuid not null references rakeeza_private.companies(id),kind text not null,project_id text not null,body jsonb not null,revision bigint not null default 1,created_by uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists rakeeza_private.module_files(id uuid primary key default gen_random_uuid(),company_id uuid not null references rakeeza_private.companies(id),record_id uuid not null references rakeeza_private.module_records(id),filename text not null,mime text not null,bytes bytea not null,sha256 text not null,created_by uuid not null,created_at timestamptz not null default now());
create table if not exists rakeeza_private.live_positions(account_id uuid primary key references rakeeza_private.accounts(id),company_id uuid not null references rakeeza_private.companies(id),project_id text not null,worker_id text not null,lat numeric not null,lng numeric not null,accuracy numeric not null,observed_at timestamptz not null,expires_at timestamptz not null);
alter table rakeeza_private.module_records enable row level security;
alter table rakeeza_private.module_files enable row level security;
alter table rakeeza_private.live_positions enable row level security;
create or replace function rakeeza_private.module_access(a rakeeza_private.accounts,k text,pid text,b jsonb,writing boolean default false) returns boolean language plpgsql stable set search_path='' as $$
declare r text:=a.profile->>'role';
begin
 if not rakeeza_private.allowed(a,pid) then return false;end if;
 if r='executive_director' then return true;end if;
 if k='document' then return r in('project_manager','qaqc_manager') or (not writing and r='consultant' and b->>'sharedWithConsultant'='true');end if;
 if k='contact' then return r in('project_manager','procurement_mgr');end if;
 if k='equipment' then return r='project_manager' or (not writing and r in('site_engineer','safety_officer'));end if;
 if k='training' then return r in('hr_manager','safety_officer') or (not writing and r='project_manager') or (not writing and r='worker' and b->>'workerId'=a.profile->>'workerId' and b->>'status'='approved');end if;
 if k='handover' then return r in('project_manager','qaqc_manager') or (not writing and r in('owner','consultant'));end if;
 if k in('payroll','clearance') then return r='hr_manager' or (not writing and r='worker' and b->>'workerId'=a.profile->>'workerId' and b->>'status'<>'draft');end if;
 return false;
end $$;
create or replace function rakeeza_private.modules(t text,op text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts:=rakeeza_private.actor(t);c rakeeza_private.companies;x rakeeza_private.module_records;f rakeeza_private.module_files;b jsonb;v jsonb;rows jsonb:='[]';k text:=p->>'kind';pid text:=p->>'projectId';r text:=a.profile->>'role';act text:=p->>'action';w jsonb;data bytea;status text;yearfrac numeric;startdate date;enddate date;anniversary date;salary numeric;amount numeric;ratio numeric;days int;
begin
 select * into c from rakeeza_private.companies where id=a.company_id;
 if op not in('modules.list','modules.file.get','modules.location.list','modules.location.share','modules.location.stop') then select * into c from rakeeza_private.companies where id=a.company_id for update;end if;
 if not rakeeza_private.rate_limit('modules:'||a.id::text,2400) then raise exception 'طلبات كثيرة';end if;
 if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>3000000 then raise exception 'طلب غير صالح أو كبير';end if;
 if op='modules.list' then
  for x in select * from rakeeza_private.module_records m where m.company_id=c.id and m.kind=k and rakeeza_private.module_access(a,m.kind,m.project_id,m.body) order by m.updated_at desc limit 1000 loop
   if rakeeza_private.module_access(a,x.kind,x.project_id,x.body) then rows:=rows||jsonb_build_array(jsonb_build_object('id',x.id,'kind',x.kind,'projectId',x.project_id,'body',x.body,'revision',x.revision,'createdAt',x.created_at,'updatedAt',x.updated_at,'files',(select coalesce(jsonb_agg(jsonb_build_object('id',mf.id,'filename',mf.filename,'mime',mf.mime,'size',octet_length(mf.bytes),'sha256',mf.sha256)),'[]') from rakeeza_private.module_files mf where mf.record_id=x.id)));end if;
  end loop;return jsonb_build_object('records',rows);
 elsif op='modules.file.get' then
  select * into f from rakeeza_private.module_files mf where mf.id=(p->>'id')::uuid and mf.company_id=c.id;
  select * into x from rakeeza_private.module_records m where m.id=f.record_id and m.company_id=c.id;
  if x.id is null or not rakeeza_private.module_access(a,x.kind,x.project_id,x.body) then raise exception 'ملف غير متاح';end if;
  return jsonb_build_object('filename',f.filename,'mime',f.mime,'base64',encode(f.bytes,'base64'),'sha256',f.sha256);
 elsif op='modules.location.list' then
  if r not in('executive_director','project_manager','safety_officer','hr_manager') then raise exception 'ليس لديك صلاحية';end if;
  select coalesce(jsonb_agg(jsonb_build_object('workerId',l.worker_id,'projectId',l.project_id,'lat',l.lat,'lng',l.lng,'accuracy',l.accuracy,'observedAt',l.observed_at,'expiresAt',l.expires_at,'name',ac.profile->>'name')),'[]') into rows from rakeeza_private.live_positions l join rakeeza_private.accounts ac on ac.id=l.account_id where l.company_id=c.id and l.expires_at>now() and ac.active and rakeeza_private.allowed(a,l.project_id);
  return jsonb_build_object('positions',rows,'serverTime',now());
 elsif op='modules.location.stop' then delete from rakeeza_private.live_positions where account_id=a.id;return jsonb_build_object('ok',true);
 elsif op='modules.location.share' then
  if r<>'worker' then raise exception 'بوابة الموظف فقط';end if;w:=rakeeza_private.item(c.data,'workers',a.profile->>'workerId');pid:=w->>'projectId';
  if not rakeeza_private.allowed(a,pid) then raise exception 'المشروع خارج الصلاحية';end if;
  if abs(extract(epoch from now()-(p->>'observedAt')::timestamptz))>60 or p->>'observedAt' is null then raise exception 'الموقع غير حديث';end if;
  insert into rakeeza_private.live_positions values(a.id,c.id,pid,w->>'id',rakeeza_private.num(p,'lat',-90,90),rakeeza_private.num(p,'lng',-180,180),rakeeza_private.num(p,'accuracy',0,100),(p->>'observedAt')::timestamptz,now()+interval '120 seconds') on conflict(account_id) do update set project_id=excluded.project_id,worker_id=excluded.worker_id,lat=excluded.lat,lng=excluded.lng,accuracy=excluded.accuracy,observed_at=excluded.observed_at,expires_at=excluded.expires_at;
  return jsonb_build_object('ok',true,'expiresAt',now()+interval '120 seconds');
 end if;
 if op in('modules.create','modules.update') then
  if op='modules.update' then
   select * into x from rakeeza_private.module_records m where m.id=(p->>'id')::uuid and m.company_id=c.id for update;
   if x.id is null or x.body->>'status'<>'draft' or x.revision is distinct from (p->>'revision')::bigint then raise exception 'السجل مقفل أو نسخة قديمة';end if;k:=x.kind;pid:=x.project_id;
  end if;
  if k not in('document','contact','equipment','training','handover','payroll','clearance') then raise exception 'نوع غير صالح';end if;
  perform rakeeza_private.item(c.data,'projects',pid);b:=coalesce(p->'body','{}');if not rakeeza_private.module_access(a,k,pid,b,true) then raise exception 'ليس لديك صلاحية';end if;
  b:=rakeeza_private.fields(b,case k
   when 'document' then array['title','documentNumber','category','issueDate','expiryDate','issuingAuthority','direction','sender','recipient','sharedWithConsultant']
   when 'contact' then array['title','org','repName','jobTitle','phone','email','notes']
   when 'equipment' then array['title','plateNumber','category','operatorName','engineHours','nextServiceHours','insuranceExpiry','mvpiExpiry','condition']
   when 'training' then array['title','workerId','trainer','trainingDate','expiryDate','result','notes']
   when 'handover' then array['title','inspectionDate','notes','snags']
   when 'payroll' then array['title','workerId','period','basicSalary','housingAllowance','otherEarnings','deductions','iban','bankReference','notes']
   else array['title','workerId','lastWorkingDay','reason','lastWage','unusedLeaveDays','deductions','additionalEntitlements','legalReviewNotes'] end);
  perform rakeeza_private.text(b,'title',500);
  if k in('training','payroll','clearance') then w:=rakeeza_private.item(c.data,'workers',b->>'workerId');if w->>'projectId' is distinct from pid then raise exception 'العامل خارج المشروع';end if;b:=b||jsonb_build_object('workerName',w->>'name');end if;
  if k='equipment' then perform rakeeza_private.text(b,'plateNumber',100);perform rakeeza_private.num(b,'engineHours',0);perform rakeeza_private.num(b,'nextServiceHours',0);end if;
  if k='handover' then
   if jsonb_typeof(b->'snags') is distinct from 'array' or jsonb_array_length(b->'snags')>100 then raise exception 'قائمة ملاحظات غير صالحة';end if;
   select coalesce(jsonb_agg(jsonb_build_object('id',gen_random_uuid(),'title',rakeeza_private.text(sn,'title',1000),'closed',false)),'[]') into v from jsonb_array_elements(b->'snags') sn;b:=jsonb_set(b,'{snags}',v);
  end if;
  if k='payroll' and exists(select 1 from rakeeza_private.module_records mr where mr.company_id=c.id and mr.kind='payroll' and mr.body->>'workerId'=b->>'workerId' and mr.body->>'period'=b->>'period' and mr.id is distinct from x.id) then raise exception 'يوجد مسير لهذا الموظف في الشهر نفسه';end if;
  if k='training' and (b->>'trainingDate' is null or (b->>'trainingDate')::date>current_date or b->>'result' is null or b->>'result' not in('passed','failed')) then raise exception 'تاريخ أو نتيجة تدريب غير صالحة';end if;
  if k='contact' and coalesce(b->>'email','')<>'' and b->>'email' !~ '^[^ @]+@[^ @]+[.][^ @]+$' then raise exception 'بريد غير صالح';end if;
  if k='payroll' then
   if not rakeeza_private.valid_sa_iban(b->>'iban') then raise exception 'آيبان سعودي غير صالح؛ لا يتحقق النظام من اسم مالك الحساب';end if;
   if b->>'period' is null or b->>'period' !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then raise exception 'شهر غير صالح';end if;
   amount:=rakeeza_private.num(b,'basicSalary',0)+rakeeza_private.num(b,'housingAllowance',0)+rakeeza_private.num(b,'otherEarnings',0)-rakeeza_private.num(b,'deductions',0);if amount<0 then raise exception 'صافي الأجر سالب';end if;
   b:=b||jsonb_build_object('netPayable',round(amount,2),'officialWpsSubmitted',false,'moneyTransferred',false);
  elsif k='clearance' then
   if b->>'lastWorkingDay' is null or w->>'joinDate' is null then raise exception 'تواريخ الخدمة مطلوبة';end if;
   days:=(b->>'lastWorkingDay')::date-(w->>'joinDate')::date+1;if days<1 then raise exception 'تواريخ الخدمة غير صالحة';end if;
   startdate:=(w->>'joinDate')::date;enddate:=(b->>'lastWorkingDay')::date+1;yearfrac:=extract(year from age(enddate,startdate));anniversary:=(startdate+make_interval(years=>yearfrac::int))::date;yearfrac:=yearfrac+(enddate-anniversary)::numeric/((anniversary+interval '1 year')::date-anniversary);salary:=rakeeza_private.num(b,'lastWage',0.01);amount:=salary*(least(yearfrac,5)/2+greatest(yearfrac-5,0));
   ratio:=case when b->>'reason'='resignation' then case when yearfrac<2 then 0 when yearfrac<=5 then 1.0/3 when yearfrac<10 then 2.0/3 else 1 end when b->>'reason' in('contract_expiry','employer_termination') then 1 else null end;
   if ratio is null then raise exception 'سبب يحتاج مراجعة قانونية خاصة، لا حكم آلي';end if;
   b:=b||jsonb_build_object('serviceDays',days,'joinDate',w->>'joinDate','baseEosb',round(amount,2),'entitlementRatio',ratio,'eosb',round(amount*ratio,2),'leaveCompensation',round(salary/30*rakeeza_private.num(b,'unusedLeaveDays',0,366),2),'netPayable',round(amount*ratio+salary/30*(b->>'unusedLeaveDays')::numeric+rakeeza_private.num(b,'additionalEntitlements',0)-rakeeza_private.num(b,'deductions',0),2),'legalStatus','internal_review_required','paymentDueBy',((b->>'lastWorkingDay')::date+case when b->>'reason'='resignation' then 14 else 7 end)::text,'moneyTransferred',false);
  end if;
  if k='clearance' and (b->>'netPayable')::numeric<0 then raise exception 'صافي التسوية سالب؛ يلزم مراجعة الحقوق والديون';end if;
  b:=b||jsonb_build_object('status','draft','history',jsonb_build_array(jsonb_build_object('action','create','by',a.id,'name',a.profile->>'name','at',now())));
  if op='modules.update' then
   b:=b||jsonb_build_object('history',x.body->'history'||jsonb_build_array(jsonb_build_object('action','edit','by',a.id,'name',a.profile->>'name','at',now())));
   update rakeeza_private.module_records set body=b,revision=revision+1,updated_at=now() where module_records.id=x.id returning * into x;
  else insert into rakeeza_private.module_records(company_id,kind,project_id,body,created_by) values(c.id,k,pid,b,a.id) returning * into x;end if;
 elsif op in('modules.action','modules.file.add') then
  select * into x from rakeeza_private.module_records m where m.id=(p->>'id')::uuid and m.company_id=c.id for update;
  if x.id is null or not rakeeza_private.module_access(a,x.kind,x.project_id,x.body) then raise exception 'السجل غير متاح';end if;
  if x.revision is distinct from (p->>'revision')::bigint then raise exception 'تعارض: حدّث السجل أولًا';end if;
  b:=x.body;k:=x.kind;pid:=x.project_id;status:=b->>'status';
  if op='modules.file.add' then
   if status not in('draft','approved','external_recorded') or (status='approved' and k<>'payroll') then raise exception 'الملف مقفل بعد رفع السجل؛ أنشئ سجلًا جديدًا للتعديل';end if;
   if not rakeeza_private.module_access(a,k,pid,b,true) then raise exception 'ليس لديك صلاحية';end if;
   
   if p->>'mime' not in('application/pdf','image/jpeg','image/png','text/plain','text/csv') then raise exception 'صيغة غير مدعومة';end if;
   data:=decode(p->>'base64','base64');if octet_length(data)>2000000 or octet_length(data)<1 then raise exception 'الحد الأقصى للملف ٢ ميجابايت';end if;
   if (select coalesce(sum(octet_length(mf.bytes)),0) from rakeeza_private.module_files mf where mf.company_id=c.id)+octet_length(data)>50000000 then raise exception 'حد تخزين ملفات الشركة ٥٠ ميجابايت في هذا الإصدار';end if;
   if p->>'mime'='application/pdf' and substring(data from 1 for 5)<>convert_to('%PDF-','UTF8') then raise exception 'ليس ملف PDF';end if;
   if p->>'mime'='image/jpeg' and encode(substring(data from 1 for 3),'hex')<>'ffd8ff' then raise exception 'ليس JPEG';end if;
   if p->>'mime'='image/png' and encode(substring(data from 1 for 8),'hex')<>'89504e470d0a1a0a' then raise exception 'ليس PNG';end if;
   insert into rakeeza_private.module_files(company_id,record_id,filename,mime,bytes,sha256,created_by) values(c.id,x.id,regexp_replace(rakeeza_private.text(p,'filename',200),'[^[:alnum:]. _-]','_','g'),p->>'mime',data,encode(extensions.digest(data,'sha256'),'hex'),a.id);
   act:='file.add';
  elsif act='submit' then
   if status<>'draft' or not rakeeza_private.module_access(a,k,pid,b,true) then raise exception 'الإجراء غير مسموح';end if;
   b:=b||jsonb_build_object('status','submitted');
  elsif act='reject' then
   if status<>'submitted' or not ((k='handover' and r='consultant') or (k in('payroll','clearance') and r='executive_director') or (k in('document','contact','equipment','training') and rakeeza_private.module_access(a,k,pid,b,true))) then raise exception 'ليس لديك صلاحية رفض';end if;
   b:=b||jsonb_build_object('status','draft','reviewNote',rakeeza_private.text(p,'note',2000));
  elsif act='approve' then
   if status<>'submitted' then raise exception 'يلزم الرفع أولًا';end if;
   if not ((k in('document','equipment','contact','training') and rakeeza_private.module_access(a,k,pid,b,true)) or (k='handover' and r='consultant') or (k in('payroll','clearance') and r='executive_director')) then raise exception 'ليس لديك صلاحية اعتماد';end if;
   if k in('training','handover') and not exists(select 1 from rakeeza_private.module_files mf where mf.record_id=x.id) then raise exception 'أرفق دليل التدريب أو المعاينة قبل الاعتماد';end if;
   if k='training' and b->>'result' is distinct from 'passed' then raise exception 'لا شهادة اجتياز لنتيجة غير ناجحة';end if;
   if k='clearance' and length(coalesce(b->>'legalReviewNotes',''))<10 then raise exception 'دوّن أساس المراجعة القانونية قبل الاعتماد';end if;
   if k='handover' and exists(select 1 from jsonb_array_elements(coalesce(b->'snags','[]')) sn where sn->>'closed'<>'true') then raise exception 'توجد ملاحظات مفتوحة';end if;
   b:=b||jsonb_build_object('status','approved','approvedBy',a.id,'approvedAt',now());
  elsif act='accept' then
   if status<>'approved' or not ((k='handover' and r='owner') or (k='clearance' and r='worker' and b->>'workerId'=a.profile->>'workerId')) then raise exception 'ليس لديك صلاحية قبول';end if;
   if coalesce(p->>'confirmation','')<>'أوافق على المحتوى' then raise exception 'يلزم تأكيد صريح للمحتوى';end if;
   b:=b||jsonb_build_object('status','accepted','acceptedBy',a.id,'acceptedAt',now(),'signatureType','authenticated_account_acknowledgement_not_certified_signature');
  elsif act='record_external' then
   if not rakeeza_private.module_access(a,k,pid,b,true) or k<>'payroll' or status not in('approved','external_recorded') then raise exception 'ليس لديك صلاحية';end if;
   if not exists(select 1 from rakeeza_private.module_files mf where mf.record_id=x.id) then raise exception 'أرفق ملف البنك أو إيصال مدد أولًا';end if;
   b:=b||jsonb_build_object('status','external_recorded','externalReference',rakeeza_private.text(p,'reference',200),'externalEvidenceStatus','user_recorded_not_independently_verified');
  elsif act='close_snag' then
   if k<>'handover' or status<>'draft' or not rakeeza_private.module_access(a,k,pid,b,true) then raise exception 'الإجراء غير مسموح';end if;
   select coalesce(jsonb_agg(case when sn->>'id'=p->>'snagId' then sn||jsonb_build_object('closed',true,'closedBy',a.id,'closedAt',now()) else sn end),'[]') into v from jsonb_array_elements(coalesce(b->'snags','[]')) sn;b:=jsonb_set(b,'{snags}',v);
  else raise exception 'إجراء غير صالح';end if;
  b:=b||jsonb_build_object('history',coalesce(b->'history','[]')||jsonb_build_array(jsonb_build_object('action',act,'by',a.id,'name',a.profile->>'name','at',now())));
  update rakeeza_private.module_records set body=b,revision=revision+1,updated_at=now() where module_records.id=x.id returning * into x;
 else raise exception 'طلب غير صالح';end if;
 -- Tenant audit entry, not a new company revision: module revisions are independent.
 update rakeeza_private.companies set data=rakeeza_private.audit(companies.data,a,op||':'||coalesce(act,k),'module',jsonb_build_object('id',x.id,'projectId',pid)) where companies.id=c.id;
 return jsonb_build_object('ok',true,'id',x.id,'revision',x.revision,'body',x.body);
end $$;
revoke all on all tables in schema rakeeza_private from public,anon,authenticated;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
-- Intentionally no public grants yet. Private review and tests precede activation.
