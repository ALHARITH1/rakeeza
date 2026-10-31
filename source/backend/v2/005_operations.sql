create or replace function rakeeza_private.operation(a rakeeza_private.accounts,d jsonb,op text,p jsonb) returns jsonb language plpgsql set search_path='' as $$
declare x jsonb;b jsonb;v jsonb;arr jsonb;z jsonb;pid text:=p->>'projectId';id text:=gen_random_uuid()::text;col text;act text;today text:=to_char(now() at time zone 'Asia/Riyadh','YYYY-MM-DD');days int;amount numeric;wid text:=a.profile->>'workerId';rol text:=a.profile->>'role';
begin
 case op
 when 'project.create' then
  act:='project.create';col:='projects';perform rakeeza_private.require_action(a,d,act);
  if (p->>'endDate')::date <= (p->>'startDate')::date then raise exception 'تواريخ غير صالحة';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(d->'projects','[]')) e where e->>'code'=upper(trim(p->>'code'))) then raise exception 'رمز مشروع مكرر';end if;
  x:=rakeeza_private.fields(p,array['client','consultant','location','startDate','endDate'])||jsonb_build_object('id',id,'code',upper(rakeeza_private.text(p,'code',20)),'name',rakeeza_private.text(p,'name',200),'contractValue',0,'physicalProgress',0,'plannedProgress',0,'financialProgress',0,'status','ongoing','safetyHoursNoLti',0,'activeWorkforce',0,'activeEquipment',0,'trenchLengthMeters',0,'cablesPulledMeters',0,'asphaltRestoredM2',0,'lat',(p->>'lat')::numeric,'lng',(p->>'lng')::numeric,'actualCost',0,'financialTimeline','[]'::jsonb);
  if abs((x->>'lat')::numeric)>90 or abs((x->>'lng')::numeric)>180 then raise exception 'إحداثيات غير صالحة';end if;
 when 'project.location' then
  col:='projects';x:=rakeeza_private.item(d,col,pid);perform rakeeza_private.require_action(a,d,'project.create',pid);x:=x||jsonb_build_object('lat',rakeeza_private.num(p,'lat',-90,90),'lng',rakeeza_private.num(p,'lng',-180,180));
 when 'boq.create' then
  act:='boq.edit';col:='boqItems';perform rakeeza_private.require_action(a,d,act,pid);perform rakeeza_private.item(d,'projects',pid);
  if exists(select 1 from jsonb_array_elements(coalesce(d->'boqItems','[]')) e where e->>'projectId'=pid and e->>'code'=trim(p->>'code')) then raise exception 'بند مكرر';end if;
  amount:=rakeeza_private.num(p,'unitPrice',0.01);days:=0;
  x:=jsonb_build_object('id',id,'projectId',pid,'code',rakeeza_private.text(p,'code',100),'description',rakeeza_private.text(p,'description',2000),'unit',rakeeza_private.text(p,'unit',100),'contractQty',rakeeza_private.num(p,'contractQty',0.000001),'unitPrice',amount,'totalPrice',amount*(p->>'contractQty')::numeric,'executedQty',0,'cbsCategory',coalesce(p->>'cbsCategory','civil'),'costBreakdown',jsonb_build_object('material',round(amount*.55),'labor',round(amount*.15),'equipment',round(amount*.1),'subcontractor',0,'overheadProfit',round(amount*.2)));
 when 'ptw.create' then
  act:='ptw.create';col:='ptws';perform rakeeza_private.require_action(a,d,act,pid);perform rakeeza_private.item(d,'projects',pid);
  if p->>'type' not in('deep_excavation','hot_work','confined_space','high_voltage') then raise exception 'نوع تصريح غير صالح';end if;
  if not coalesce((p->'checklist'->>'gasCheckPassed')::boolean,false) or not coalesce((p->'checklist'->>'barriersInstalled')::boolean,false) or not coalesce((p->'checklist'->>'undergroundCableDetected')::boolean,false) or not coalesce((p->'checklist'->>'flashingLightsActive')::boolean,false) or not coalesce((p->'checklist'->>'ppeFullGear')::boolean,false) then raise exception 'أكد قائمة فحص السلامة قبل إصدار تصريح نشط';end if;
  x:=jsonb_build_object('id',id,'projectId',pid,'permitNumber','PTW-'||id,'type',p->>'type','location',rakeeza_private.text(p,'location',1000),'supervisor',rakeeza_private.text(p,'supervisor',200),'safetyOfficer',a.profile->>'name','issuedDate',to_char(now() at time zone 'UTC','YYYY-MM-DD HH24:MI'),'validUntil',to_char((now()+interval '10 hours') at time zone 'UTC','YYYY-MM-DD HH24:MI'),'status','active','safetyChecklist',rakeeza_private.fields(coalesce(p->'checklist','{}'),array['gasCheckPassed','barriersInstalled','undergroundCableDetected','flashingLightsActive','ppeFullGear']));
 when 'lab.create' then
  act:='lab.create';col:='labTests';perform rakeeza_private.require_action(a,d,act,pid);perform rakeeza_private.item(d,'projects',pid);
  if p->>'result' not in('passed','failed') then raise exception 'نتيجة فحص غير صالحة';end if;
  x:=rakeeza_private.fields(p,array['testType','sampleLocation','requiredValue','achievedValue','result','certifiedLab'])||jsonb_build_object('id',id,'projectId',pid,'testNumber','LAB-'||id,'testDate',today);
 when 'incident.create' then
  act:='incident.create';col:='emergencyIncidents';perform rakeeza_private.require_action(a,d,act,pid);perform rakeeza_private.item(d,'projects',pid);
  x:=rakeeza_private.fields(p,array['type','location','affectedUtilityOrService','description','immediateActionsTaken','contractualForceMajeureLogged','legalLiabilityAssessment'])||jsonb_build_object('id',id,'projectId',pid,'incidentCode','EMERG-'||id,'dateTime',now());
 when 'utility.create' then
  col:='utilityClashes';if rol not in('executive_director','project_manager','site_engineer','safety_officer') then raise exception 'ليس لديك صلاحية';end if;
  if not rakeeza_private.allowed(a,pid) then raise exception 'مشروع خارج الصلاحية';end if;perform rakeeza_private.item(d,'projects',pid);
  x:=rakeeza_private.fields(p,array['utilityType','locationStreet','depthMeters','stakeholderContact','protectionMeasures'])||jsonb_build_object('id',id,'projectId',pid,'clashCode','UC-'||id,'status','identified','preTrenchPhotoTaken',false,'postPavingPhotoTaken',false);
 when 'spoils.create' then
  col:='spoilsTickets';if rol not in('executive_director','project_manager','site_engineer') then raise exception 'ليس لديك صلاحية';end if;
  if not rakeeza_private.allowed(a,pid) then raise exception 'مشروع خارج الصلاحية';end if;perform rakeeza_private.item(d,'projects',pid);
  x:=rakeeza_private.fields(p,array['type','truckPlate','volumeM3','weighbridgeWeightTons','sourceOrDestination','manifestBarcode'])||jsonb_build_object('id',id,'projectId',pid,'ticketNumber','MANIFEST-'||id,'date',now(),'inspectorApproved',false);
 when 'subcontractor.create' then
  col:='subcontractors';perform rakeeza_private.require_action(a,d,'sub.claim_approve',pid);perform rakeeza_private.item(d,'projects',pid);
  x:=jsonb_build_object('id',id,'projectId',pid,'name',rakeeza_private.text(p,'name',200),'scopeOfWork',rakeeza_private.text(p,'scopeOfWork',2000),'contractValue',rakeeza_private.num(p,'contractValue',0.01),'invoicedToDate',0,'certifiedToDate',0,'dieselBackcharges',0,'powerBackcharges',0,'performanceScore',100,'complianceStatus','compliant','workforce','[]'::jsonb);
 when 'tbt.create' then
  col:='toolboxTalks';perform rakeeza_private.require_action(a,d,'tbt.create',pid);perform rakeeza_private.item(d,'projects',pid);
  x:=jsonb_build_object('id',id,'projectId',pid,'topic',rakeeza_private.text(p,'topic',1000),'date',today,'attendeesCount',0,'conductorName',a.profile->>'name','keyHazardsDiscussed',coalesce(p->'keyHazardsDiscussed','[]'),'hasPhotos',false,'signedWorkerIds','[]'::jsonb);
 when 'violation.create' then
  col:='disciplinaryViolations';b:=rakeeza_private.item(d,'workers',p->>'workerId');pid:=b->>'projectId';perform rakeeza_private.require_action(a,d,'hr.manage',nullif(pid,''));
  if p->>'violationType' not in('ppe_safety_breach','unauthorized_absence','equipment_mishandling','site_dispute') or p->>'actionTaken' not in('verbal_warning','written_warning','salary_deduction_1day','investigation') then raise exception 'مخالفة غير صالحة';end if;
  x:=rakeeza_private.fields(p,array['violationType','description','actionTaken'])||jsonb_build_object('id',id,'projectId',pid,'workerId',b->>'id','workerName',b->>'name','date',today,'deductionAmountSar',rakeeza_private.num(p,'deductionAmountSar',0,coalesce((b->>'totalMonthlySalary')::numeric,0)),'signedByWorker',false);
  b:=b||jsonb_build_object('violationsCount',coalesce((b->>'violationsCount')::int,0)+1);d:=rakeeza_private.put(d,'workers',b);
 when 'settlement.create' then
  col:='settlements';b:=rakeeza_private.item(d,'workers',p->>'workerId');pid:=b->>'projectId';perform rakeeza_private.require_action(a,d,'hr.manage',nullif(pid,''));
  -- Stored as a draft calculation supplied by HR, not a legal determination or signed discharge.
  x:=rakeeza_private.fields(p,array['lastWorkingDay','yearsOfService','monthsOfService','daysOfService','reasonForSeparation','baseEosbAmount','entitlementRatio','netEosbAmount','unusedLeaveDays','unusedLeaveCompensationSar','deductionsPettyCash','finalNetSettlementSar'])||rakeeza_private.fields(b,array['name','role','nationality','iqamaNumber','joinDate','contractType'])||jsonb_build_object('id',id,'projectId',pid,'workerId',b->>'id','workerName',b->>'name','lastMonthlySalary',b->'totalMonthlySalary','status','draft','calculationSource','hr_manual_unreviewed','clearanceSignatures',jsonb_build_object('siteSupervisor',false,'hrManager',false,'financeDirector',false,'workerThumbprint',false));
  perform rakeeza_private.num(p,'netEosbAmount',0);perform rakeeza_private.num(p,'unusedLeaveCompensationSar',0);perform rakeeza_private.num(p,'deductionsPettyCash',0);
  x:=x||jsonb_build_object('finalNetSettlementSar',(p->>'netEosbAmount')::numeric+(p->>'unusedLeaveCompensationSar')::numeric-(p->>'deductionsPettyCash')::numeric);
 when 'leave.record' then
  col:='leaveRequests';b:=rakeeza_private.item(d,'workers',p->>'workerId');pid:=b->>'projectId';perform rakeeza_private.require_action(a,d,'hr.manage',nullif(pid,''));days:=(p->>'endDate')::date-(p->>'startDate')::date+1;
  if days<1 or days>366 then raise exception 'تواريخ إجازة غير صالحة';end if;
  x:=rakeeza_private.fields(p,array['type','startDate','endDate','reason','ticketDestination'])||jsonb_build_object('id',id,'projectId',pid,'workerId',b->>'id','workerName',b->>'name','daysCount',days,'flightTicketProvided',false,'status','pending','requestedViaPortal',false);
 when 'worker.create' then
  act:='hr.manage';col:='workers';perform rakeeza_private.require_action(a,d,act,nullif(pid,''));
  if nullif(pid,'') is not null then perform rakeeza_private.item(d,'projects',pid);end if;
  if coalesce(p->>'iqamaNumber','') !~ '^[12][0-9]{9}$' then raise exception 'هوية غير صالحة';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(d->'workers','[]')) e where e->>'iqamaNumber'=p->>'iqamaNumber') then raise exception 'هوية مكررة';end if;
  amount:=rakeeza_private.num(p,'basicSalary',0);
  x:=rakeeza_private.fields(p,array['empCode','role','nationality','iqamaNumber','iqamaExpiry','medicalInsuranceExpiry','drivingLicenseExpiry','isHeavyOperator','joinDate','contractType','qiwaContractNumber','probationEndDate'])||jsonb_build_object('id',id,'projectId',coalesce(pid,''),'name',rakeeza_private.text(p,'name',200),'nationality',coalesce(p->>'nationality','مقيم'),'role',coalesce(p->>'role','عامل'),'iqamaExpiry',coalesce(p->>'iqamaExpiry',''),'medicalInsuranceExpiry',coalesce(p->>'medicalInsuranceExpiry',''),'joinDate',coalesce(p->>'joinDate',today),'contractType',coalesce(p->>'contractType','fixed_term'),'status','absent','checkInTime','','geoFenceStatus','outside_geofence','overtimeHoursThisMonth',0,'dailyRate',round((amount+rakeeza_private.num(p,'housingAllowance',0)+rakeeza_private.num(p,'transportAllowance',0))/30),'assignedBoqCode','','pettyCashBalance',0,'isProbationPassed',false,'basicSalary',amount,'housingAllowance',(p->>'housingAllowance')::numeric,'transportAllowance',(p->>'transportAllowance')::numeric,'siteAllowance',coalesce((p->>'siteAllowance')::numeric,0),'gosiDeduction',0,'totalMonthlySalary',amount+(p->>'housingAllowance')::numeric+(p->>'transportAllowance')::numeric+coalesce((p->>'siteAllowance')::numeric,0),'leaveBalanceDays',21,'leavesTakenDays',0,'assetsHandedOver','[]'::jsonb,'violationsCount',0,'attendanceLog','[]'::jsonb);
 when 'worker.assign' then
  id:=p->>'id';
  col:='workers';x:=rakeeza_private.item(d,col,id);perform rakeeza_private.require_action(a,d,'hr.manage',nullif(x->>'projectId',''));
  if nullif(pid,'') is not null then perform rakeeza_private.require_action(a,d,'hr.manage',pid);perform rakeeza_private.item(d,'projects',pid);end if;
  x:=x||jsonb_build_object('projectId',coalesce(pid,''));
 when 'leave.request' then
  if rol<>'worker' then raise exception 'بوابة الموظف فقط';end if;b:=rakeeza_private.item(d,'workers',wid);pid:=b->>'projectId';if not rakeeza_private.allowed(a,pid) then raise exception 'المشروع خارج الصلاحية';end if;col:='leaveRequests';
  days:=(p->>'endDate')::date-(p->>'startDate')::date+1;
  if days<1 or days>366 or p->>'type' not in('annual','sick','emergency','unpaid','hajj','maternity','paternity','bereavement') then raise exception 'إجازة غير صالحة';end if;
  if p->>'type'='annual' and days>(b->>'leaveBalanceDays')::numeric then raise exception 'رصيد الإجازة غير كاف';end if;
  x:=rakeeza_private.fields(p,array['type','startDate','endDate','reason'])||jsonb_build_object('id',id,'projectId',pid,'workerId',wid,'workerName',b->>'name','daysCount',days,'flightTicketProvided',false,'status','pending','requestedViaPortal',true);
 when 'advance.request' then
  if rol<>'worker' then raise exception 'بوابة الموظف فقط';end if;b:=rakeeza_private.item(d,'workers',wid);pid:=b->>'projectId';if not rakeeza_private.allowed(a,pid) then raise exception 'المشروع خارج الصلاحية';end if;col:='advances';amount:=rakeeza_private.num(p,'amount',0.01,(b->>'basicSalary')::numeric);
  if exists(select 1 from jsonb_array_elements(coalesce(d->'advances','[]')) e where e->>'workerId'=wid and e->>'status'='pending') then raise exception 'يوجد طلب قيد المراجعة';end if;
  x:=jsonb_build_object('id',id,'projectId',pid,'workerId',wid,'workerName',b->>'name','amount',amount,'reason',left(p->>'reason',2000),'date',today,'status','pending');
 when 'leave.review','advance.review' then
  id:=p->>'id';
  col:=case when op='leave.review' then 'leaveRequests' else 'advances' end;x:=rakeeza_private.item(d,col,id);pid:=x->>'projectId';perform rakeeza_private.require_action(a,d,'hr.leave_approve',nullif(pid,''));
  if x->>'status'<>'pending' then raise exception 'الطلب ليس قيد المراجعة';end if;
  b:=rakeeza_private.item(d,'workers',x->>'workerId');
  if (p->>'approve')::boolean then
   if op='leave.review' and x->>'type'='annual' then
    if (x->>'daysCount')::numeric>(b->>'leaveBalanceDays')::numeric then raise exception 'رصيد الإجازة غير كاف';end if;
    b:=b||jsonb_build_object('leaveBalanceDays',(b->>'leaveBalanceDays')::numeric-(x->>'daysCount')::numeric,'leavesTakenDays',(b->>'leavesTakenDays')::numeric+(x->>'daysCount')::numeric);
   elsif op='advance.review' then b:=b||jsonb_build_object('pettyCashBalance',(b->>'pettyCashBalance')::numeric+(x->>'amount')::numeric);end if;
   d:=rakeeza_private.put(d,'workers',b);
  end if;
  x:=x||jsonb_build_object('status',case when (p->>'approve')::boolean then 'approved' else 'rejected' end);
 when 'hazard.report' then
  if rol not in('executive_director','project_manager','site_engineer','safety_officer','qaqc_manager','hr_manager','worker') then raise exception 'ليس لديك صلاحية';end if;
  if rol='worker' then b:=rakeeza_private.item(d,'workers',wid);pid:=b->>'projectId';if not rakeeza_private.allowed(a,pid) then raise exception 'المشروع خارج الصلاحية';end if;end if;
  if not rakeeza_private.allowed(a,pid) then raise exception 'مشروع خارج الصلاحية';end if;
  col:='hazards';x:=jsonb_build_object('id',id,'projectId',pid,'code','HZ-'||id,'reportedByWorkerId',case when rol='worker' then wid else null end,'reportedByName',a.profile->>'name','location',rakeeza_private.text(p,'location',1000),'description',rakeeza_private.text(p,'description',10000),'severity',rakeeza_private.text(p,'severity',20),'date',today,'status','open');
 when 'hazard.review' then
  id:=p->>'id';
  col:='hazards';x:=rakeeza_private.item(d,col,id);perform rakeeza_private.require_action(a,d,'ptw.create',x->>'projectId');
  if p->>'status' not in('open','actioned','closed') then raise exception 'حالة غير صالحة';end if;x:=x||jsonb_build_object('status',p->>'status');
 when 'tbt.sign' then
  id:=p->>'id';
  if rol<>'worker' then raise exception 'بوابة الموظف فقط';end if;b:=rakeeza_private.item(d,'workers',wid);col:='toolboxTalks';x:=rakeeza_private.item(d,col,id);
  if x->>'projectId' is distinct from b->>'projectId' then raise exception 'محاضرة خارج المشروع';end if;
  if x->'signedWorkerIds' ? wid then raise exception 'وقعت مسبقًا';end if;
  x:=x||jsonb_build_object('signedWorkerIds',coalesce(x->'signedWorkerIds','[]')||jsonb_build_array(wid),'attendeesCount',coalesce((x->>'attendeesCount')::int,0)+1);
 when 'attendance.manual' then
  id:=p->>'id';
  col:='workers';x:=rakeeza_private.item(d,col,id);pid:=x->>'projectId';perform rakeeza_private.require_action(a,d,'team.attendance',pid);
  if p->>'status' not in('present','absent','on_leave') then raise exception 'حالة غير صالحة';end if;
  -- Manual attendance is explicitly marked as manual, never as a verified GPS fix.
  x:=x||jsonb_build_object('status',p->>'status','attendanceSource','manual');
 when 'transmittal.approve' then
  id:=p->>'id';
  col:='transmittals';x:=rakeeza_private.item(d,col,id);perform rakeeza_private.require_action(a,d,'rfi.answer',x->>'projectId');x:=x||'{"status":"approved"}';
 else return rakeeza_private.workflow(a,d,op,p);
 end case;
 d:=rakeeza_private.put(d,col,x);return rakeeza_private.audit(d,a,op,col,x);
end $$;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
