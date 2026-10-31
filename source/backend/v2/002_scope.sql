-- Explicit allowlists. Financial/HR data never rely on hidden UI buttons.
create or replace function rakeeza_private.scoped_data(a rakeeza_private.accounts,d jsonb) returns jsonb language plpgsql stable set search_path='' as $$
declare rol text:=a.profile->>'role';res jsonb:=jsonb_build_object('version',2,'companyId',a.company_id,'seededAt',d->>'seededAt');k text;x jsonb;rows jsonb;visible boolean;cols text[];finance boolean:=rakeeza_private.has_action(a,d,'finance.view');hr boolean:=rol in('executive_director','hr_manager');
begin
 foreach k in array array['projects','boqItems','dprs','ppcs','equipments','workers','ptws','toolboxTalks','ncrs','labTests','companyDocs','transmittals','materialReqs','subcontractors','utilityClashes','spoilsTickets','emergencyIncidents','variationOrders','leaveRequests','disciplinaryViolations','settlements','rfis','hazards','advances','subClaims','notifications','attendanceLogs','audit'] loop
 rows:='[]';
 for x in select value from jsonb_array_elements(coalesce(d->k,'[]')) loop
  visible:=case when k='projects' then rakeeza_private.allowed(a,x->>'id') when k='companyDocs' then rol in('executive_director','hr_manager','qaqc_manager') when k='notifications' then ((x->'toUserIds')?a.id::text or (x->'toRoles')?rol) and (nullif(x->>'projectId','') is null or rakeeza_private.allowed(a,x->>'projectId')) when k='audit' then rakeeza_private.has_action(a,d,'audit.view') and (nullif(x->>'projectId','') is null or rakeeza_private.allowed(a,x->>'projectId')) else rakeeza_private.allowed(a,x->>'projectId') or (hr and nullif(x->>'projectId','') is null and k in('workers','leaveRequests','disciplinaryViolations','settlements','advances')) end;
  if rol in('project_manager','site_engineer','safety_officer','qaqc_manager','procurement_mgr','hr_manager') then
   cols:=case rol
    when 'project_manager' then array['projects','boqItems','dprs','ppcs','equipments','workers','ptws','toolboxTalks','ncrs','labTests','transmittals','materialReqs','subcontractors','utilityClashes','spoilsTickets','emergencyIncidents','variationOrders','rfis','hazards','subClaims','notifications']
    when 'site_engineer' then array['projects','boqItems','dprs','workers','ptws','materialReqs','utilityClashes','spoilsTickets','emergencyIncidents','rfis','hazards','notifications']
    when 'safety_officer' then array['projects','workers','ptws','toolboxTalks','utilityClashes','emergencyIncidents','hazards','notifications']
    when 'qaqc_manager' then array['projects','ncrs','labTests','transmittals','rfis','companyDocs','notifications']
    when 'procurement_mgr' then array['projects','boqItems','materialReqs','subcontractors','subClaims','notifications']
    else array['projects','workers','toolboxTalks','leaveRequests','disciplinaryViolations','settlements','advances','hazards','attendanceLogs','notifications'] end;
   visible:=visible and k=any(cols);
  end if;
  if rol='worker' then
   visible:=case when k='projects' then rakeeza_private.allowed(a,x->>'id') when k='workers' then x->>'id'=a.profile->>'workerId' when k in('leaveRequests','disciplinaryViolations','settlements','advances','attendanceLogs') then x->>'workerId'=a.profile->>'workerId' when k='toolboxTalks' then visible when k='hazards' then x->>'reportedByWorkerId'=a.profile->>'workerId' when k='notifications' then visible else false end;
  elsif rol='supplier' then
   visible:=visible and case when k='materialReqs' then x->>'supplierName'=a.profile->>'supplierName' and x->>'status' in('po_issued','supplier_confirmed','delivered','grn_received') when k in('projects','notifications') then true else false end;
  elsif rol='subcontractor' then
   visible:=visible and case when k='subcontractors' then x->>'id'=a.profile->>'subcontractorId' when k='subClaims' then x->>'subcontractorId'=a.profile->>'subcontractorId' when k in('projects','notifications') then true else false end;
  elsif rol='owner' then
   visible:=visible and k in('projects','boqItems','dprs','ppcs','variationOrders','notifications');
  elsif rol='consultant' then
   visible:=visible and k in('projects','boqItems','dprs','ppcs','variationOrders','ptws','rfis','ncrs','labTests','transmittals','notifications');
  end if;
  if k in('leaveRequests','disciplinaryViolations','settlements','advances') and not hr and rol<>'worker' then visible:=false;end if;
  if k='ppcs' and not finance then visible:=false;end if;
  if k='toolboxTalks' and rol='worker' then x:=jsonb_set(x,'{signedWorkerIds}',case when x->'signedWorkerIds' ? (a.profile->>'workerId') then jsonb_build_array(a.profile->>'workerId') else '[]' end);end if;
  if k='workers' and not hr and rol<>'worker' then
   x:=rakeeza_private.fields(x,array['id','projectId','empCode','name','role','status','checkInTime','geoFenceStatus','currentZone','shift','attendanceLog']);
  end if;
  if k='projects' and not finance then
   x:=x||'{"contractValue":0,"actualCost":0,"financialProgress":0,"financialTimeline":[]}'::jsonb;
  end if;
  if k='boqItems' and not finance then
   x:=x||'{"unitPrice":0,"totalPrice":0,"costBreakdown":{"material":0,"labor":0,"equipment":0,"subcontractor":0,"overheadProfit":0}}'::jsonb;
  elsif k='boqItems' and rol in('owner','consultant') then
   x:=x||'{"costBreakdown":{"material":0,"labor":0,"equipment":0,"subcontractor":0,"overheadProfit":0}}'::jsonb;
  end if;
  if k='projects' and rol in('owner','consultant') then x:=x||'{"actualCost":0,"financialTimeline":[]}'::jsonb;end if;
  if k='variationOrders' and not finance then x:=x||'{"costImpactSar":0}'::jsonb;end if;
  if k='materialReqs' and rol not in('executive_director','project_manager','procurement_mgr','supplier') then x:=x||'{"unitCost":0,"estimatedCost":0,"invoiceAmount":0}'::jsonb;end if;
  if k in('subcontractors','subClaims') and rol not in('executive_director','project_manager','procurement_mgr','subcontractor') then visible:=false;end if;
  if k='attendanceLogs' and rol not in('executive_director','hr_manager','worker') then visible:=false;end if;
  if not finance and not hr then x:=x-'history';end if;
  if k='notifications' and not finance then x:=x-'description';end if;
  if visible then rows:=rows||jsonb_build_array(x);end if;
 end loop;
 res:=res||jsonb_build_object(k,rows);
 end loop;
 res:=res||jsonb_build_object('notifReads',jsonb_build_object(a.id::text,coalesce(d->'notifReads'->a.id::text,'[]')));
 -- UI permissions are presentation hints. Mutation RPCs re-check these independently.
 if d?'rolePermissions' and d->'rolePermissions'<>'null'::jsonb then res:=res||jsonb_build_object('rolePermissions',d->'rolePermissions');end if;
 return res;
end $$;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
