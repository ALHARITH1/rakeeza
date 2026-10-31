-- Domain dispatcher returns canonical data. It never trusts submitted histories or financial totals.
create or replace function rakeeza_private.workflow(a rakeeza_private.accounts,d jsonb,op text,p jsonb) returns jsonb language plpgsql set search_path='' as $$
declare x jsonb;b jsonb;z jsonb;q jsonb;pr jsonb;lines jsonb:='[]';id text:=gen_random_uuid()::text;pid text:=p->>'projectId';col text;act text;fromstate text;tostate text;label text;qty numeric;used numeric;prev numeric;gross numeric:=0;amount numeric;nowday text:=to_char(now() at time zone 'Asia/Riyadh','YYYY-MM-DD');note text:=left(p->>'note',2000);rol text:=a.profile->>'role';
begin
 if op in('dpr.pm_approve','dpr.consultant_approve','dpr.reject','dpr.submit','ppc.submit','ppc.consultant_approve','ppc.owner_approve','ppc.disburse','ppc.reject','vo.submit','vo.consultant_approve','vo.owner_approve','vo.reject','mr.pm_approve','mr.reject','mr.issue_po','mr.supplier_confirm','mr.deliver','mr.grn','rfi.answer','rfi.reject','ncr.close','sub.approve','sub.reject','sub.pay') then
  id:=p->>'id';
  col:=case split_part(op,'.',1) when 'dpr' then 'dprs' when 'ppc' then 'ppcs' when 'vo' then 'variationOrders' when 'mr' then 'materialReqs' when 'rfi' then 'rfis' when 'ncr' then 'ncrs' else 'subClaims' end;
  x:=rakeeza_private.item(d,col,id);pid:=x->>'projectId';
  if not rakeeza_private.allowed(a,pid) then raise exception 'المشروع خارج صلاحياتك';end if;
  case op
   when 'dpr.submit' then act:='dpr.create';fromstate:='draft';tostate:='submitted';
   when 'dpr.pm_approve' then act:='dpr.pm_approve';fromstate:='submitted';tostate:='pm_approved';
   when 'dpr.consultant_approve' then act:='dpr.consultant_approve';fromstate:='pm_approved';tostate:='consultant_approved';
   when 'dpr.reject' then act:=case x->>'status' when 'submitted' then 'dpr.pm_approve' when 'pm_approved' then 'dpr.consultant_approve' else 'invalid' end;fromstate:=x->>'status';tostate:='rejected';
   when 'ppc.submit' then act:='ppc.create';fromstate:='draft';tostate:='submitted';
   when 'ppc.consultant_approve' then act:='ppc.consultant_approve';fromstate:='submitted';tostate:='consultant_approved';
   when 'ppc.owner_approve' then act:='ppc.owner_approve';fromstate:='consultant_approved';tostate:='client_approved';
   when 'ppc.disburse' then act:='ppc.disburse';fromstate:='client_approved';tostate:='disbursed';
   when 'ppc.reject' then act:=case x->>'status' when 'submitted' then 'ppc.consultant_approve' when 'consultant_approved' then 'ppc.owner_approve' else 'invalid' end;fromstate:=x->>'status';tostate:='rejected';
   when 'vo.submit' then act:='vo.create';fromstate:='proposed';tostate:='under_evaluation';
   when 'vo.consultant_approve' then act:='vo.consultant_approve';fromstate:='under_evaluation';tostate:='consultant_approved';
   when 'vo.owner_approve' then act:='vo.owner_approve';fromstate:='consultant_approved';tostate:='approved_by_client';
   when 'vo.reject' then act:=case x->>'status' when 'under_evaluation' then 'vo.consultant_approve' when 'consultant_approved' then 'vo.owner_approve' else 'invalid' end;fromstate:=x->>'status';tostate:='rejected';
   when 'mr.pm_approve' then act:='mr.pm_approve';fromstate:='pending_pm';tostate:='approved';
   when 'mr.reject' then act:='mr.pm_approve';fromstate:='pending_pm';tostate:='rejected';
   when 'mr.issue_po' then act:='mr.issue_po';fromstate:='approved';tostate:='po_issued';
   when 'mr.supplier_confirm' then act:='mr.supplier';fromstate:='po_issued';tostate:='supplier_confirmed';
   when 'mr.deliver' then act:='mr.supplier';fromstate:='supplier_confirmed';tostate:='delivered';
   when 'mr.grn' then act:='mr.grn';fromstate:='delivered';tostate:='grn_received';
   when 'rfi.answer' then act:='rfi.answer';fromstate:='submitted';tostate:='answered';
   when 'rfi.reject' then act:='rfi.answer';fromstate:='submitted';tostate:='rejected';
   when 'ncr.close' then act:='ncr.close';fromstate:='open';tostate:='closed';
   when 'sub.approve' then act:='sub.claim_approve';fromstate:='submitted';tostate:='pm_approved';
   when 'sub.reject' then act:='sub.claim_approve';fromstate:='submitted';tostate:='rejected';
   when 'sub.pay' then act:='sub.claim_approve';fromstate:='pm_approved';tostate:='paid';
  end case;
  perform rakeeza_private.require_action(a,d,act,pid);
  if x->>'status' is distinct from fromstate then raise exception 'حالة السجل لا تسمح بهذا الإجراء';end if;
  if tostate='rejected' and coalesce(length(trim(note)),0)=0 then raise exception 'سبب الرفض مطلوب';end if;
  if op in('dpr.submit','dpr.consultant_approve') then
   if op='dpr.submit' and not exists(select 1 from jsonb_array_elements(coalesce(d->'ptws','[]')) t where t->>'projectId'=pid and t->>'status'='active' and (t->>'validUntil')::timestamp>now() at time zone 'UTC') then raise exception 'لا يوجد تصريح عمل ساري';end if;
   for z in select value from jsonb_array_elements(x->'itemsExecuted') loop
    b:=rakeeza_private.item(d,'boqItems',z->>'boqItemId');qty:=rakeeza_private.num(z,'quantity',0.000001);
    if b->>'projectId' is distinct from pid or (b->>'executedQty')::numeric+qty>(b->>'contractQty')::numeric then raise exception 'الكمية تتجاوز المتبقي أو البند خارج المشروع';end if;
    if op='dpr.consultant_approve' then b:=b||jsonb_build_object('executedQty',(b->>'executedQty')::numeric+qty);d:=rakeeza_private.put(d,'boqItems',b);end if;
   end loop;
  end if;
  if op='ppc.submit' then
   for z in select value from jsonb_array_elements(x->'items') loop
    b:=rakeeza_private.item(d,'boqItems',z->>'boqItemId');
    select coalesce(max((it->>'cumulativeQty')::numeric),0) into prev from jsonb_array_elements(coalesce(d->'ppcs','[]')) cert cross join lateral jsonb_array_elements(cert->'items') it where cert->>'id'<>id and cert->>'status' not in('draft','rejected') and it->>'boqItemId'=b->>'id';
    if prev<>(z->>'previousQty')::numeric or prev+(z->>'currentQty')::numeric>(b->>'executedQty')::numeric then raise exception 'كميات المسودة قديمة؛ أنشئ مستخلصًا محدثًا';end if;
   end loop;
  end if;
  if op='dpr.consultant_approve' then x:=x||'{"posted":true,"consultantStatus":"approved"}';end if;
  if op='dpr.reject' then x:=x||'{"posted":false,"consultantStatus":"rejected"}';end if;
  if op in('mr.supplier_confirm','mr.deliver') and (rol is distinct from 'supplier' or a.profile->>'supplierName' is distinct from x->>'supplierName') then raise exception 'أمر الشراء ليس موجها لك';end if;
  if op='mr.issue_po' then
   x:=x||jsonb_build_object('poNumber','PO-'||id);
   if nullif(trim(p->>'supplierName'),'') is not null then x:=x||jsonb_build_object('supplierName',rakeeza_private.text(p,'supplierName',200));end if;
  end if;
  if op='mr.deliver' then x:=x||jsonb_build_object('deliveryNoteNumber',rakeeza_private.text(p,'deliveryNoteNumber',100),'invoiceNumber',rakeeza_private.text(p,'invoiceNumber',100),'invoiceAmount',rakeeza_private.num(p,'invoiceAmount',0.01));end if;
  if op='mr.grn' then x:=x||jsonb_build_object('grnNumber','GRN-'||id);end if;
  if op in('rfi.answer','rfi.reject') then x:=x||jsonb_build_object('response',rakeeza_private.text(p,'response',5000));end if;
  if op='ncr.close' then x:=x||jsonb_build_object('correctiveAction',rakeeza_private.text(p,'correctiveAction',5000),'closedDate',nowday);end if;
  if op='sub.approve' then
   amount:=rakeeza_private.num(p,'approvedAmount',0.01,(x->>'amount')::numeric);x:=x||jsonb_build_object('approvedAmount',amount);
   b:=rakeeza_private.item(d,'subcontractors',x->>'subcontractorId');b:=b||jsonb_build_object('certifiedToDate',coalesce((b->>'certifiedToDate')::numeric,0)+amount,'invoicedToDate',coalesce((b->>'invoicedToDate')::numeric,0)+(x->>'amount')::numeric);d:=rakeeza_private.put(d,'subcontractors',b);
  end if;
  x:=rakeeza_private.history(x||jsonb_build_object('status',tostate),a,op,note);d:=rakeeza_private.put(d,col,x);return rakeeza_private.audit(d,a,op,col,x);
 end if;
 -- Creation commands accept only payload fields explicitly selected below.
 case op
 when 'dpr.create' then
  act:='dpr.create';col:='dprs';perform rakeeza_private.require_action(a,d,act,pid);pr:=rakeeza_private.item(d,'projects',pid);
  if coalesce((p->>'submit')::boolean,false) and not exists(select 1 from jsonb_array_elements(coalesce(d->'ptws','[]')) t where t->>'projectId'=pid and t->>'status'='active' and (t->>'validUntil')::timestamp>now() at time zone 'UTC') then raise exception 'لا يوجد تصريح عمل ساري';end if;
  if p->>'date' is null or (p->>'date')::date>nowday::date then raise exception 'تاريخ التقرير في المستقبل';end if;
  if jsonb_array_length(coalesce(p->'items','[]'))=0 then raise exception 'أدخل كميات';end if;
  if exists(select 1 from jsonb_array_elements(p->'items') elem group by elem->>'boqItemId' having count(*)>1) then raise exception 'بند مكرر';end if;
  for z in select value from jsonb_array_elements(p->'items') loop
   b:=rakeeza_private.item(d,'boqItems',z->>'boqItemId');qty:=rakeeza_private.num(z,'quantity',0.000001);
   select coalesce(sum((it->>'quantity')::numeric),0) into used from jsonb_array_elements(coalesce(d->'dprs','[]')) r cross join lateral jsonb_array_elements(r->'itemsExecuted') it where r->>'status' in('submitted','pm_approved') and it->>'boqItemId'=b->>'id';
   if b->>'projectId' is distinct from pid or qty+used+(b->>'executedQty')::numeric>(b->>'contractQty')::numeric then raise exception 'كمية غير متاحة أو بند خارج المشروع';end if;
   lines:=lines||jsonb_build_array(jsonb_build_object('boqItemId',b->>'id','description',b->>'description','quantity',qty,'unit',b->>'unit'));
  end loop;
  if jsonb_typeof(coalesce(p->'photos','[]'))<>'array' or jsonb_array_length(coalesce(p->'photos','[]'))>6 then raise exception 'ست صور كحد أقصى';end if;
  for z in select value from jsonb_array_elements(coalesce(p->'photos','[]')) loop if jsonb_typeof(z)<>'string' or length(z#>>'{}')>200000 or (z#>>'{}') !~ '^data:image/jpeg;base64,/9j/[A-Za-z0-9+/=]+$' then raise exception 'صورة JPEG غير صالحة أو كبيرة';end if;end loop;
  x:=jsonb_build_object('id',id,'projectId',pid,'reportNumber','DPR-'||id,'date',rakeeza_private.text(p,'date',10),'sector',rakeeza_private.text(p,'sector',500),'weather',jsonb_build_object('tempC',rakeeza_private.num(p,'tempC',-50,80),'condition',left(p->>'weatherCondition',200),'isSuitableForWork',(p->>'tempC')::numeric<48),'workforceCount',rakeeza_private.num(p,'workforceCount',0,100000),'equipmentCount',rakeeza_private.num(p,'equipmentCount',0,100000),'itemsExecuted',lines,'siteNotes',left(p->>'siteNotes',10000),'photosCount',jsonb_array_length(coalesce(p->'photos','[]')),'photos',coalesce(p->'photos','[]'),'consultantStatus','pending','submittedBy',a.profile->>'name','gpsCoordinates','لا يوجد موقع ملتقط للتقرير' ,'status',case when (p->>'submit')::boolean then 'submitted' else 'draft' end,'posted',false,'createdByUserId',a.id);
 when 'ppc.create','ppc.update' then
  if op='ppc.update' then x:=rakeeza_private.item(d,'ppcs',p->>'id');if x->>'status'<>'draft' then raise exception 'تعديل المسودة فقط';end if;pid:=x->>'projectId';id:=x->>'id';end if;
  act:='ppc.create';col:='ppcs';perform rakeeza_private.require_action(a,d,act,pid);pr:=rakeeza_private.item(d,'projects',pid);
  if exists(select 1 from jsonb_array_elements(coalesce(d->'ppcs','[]')) c where c->>'projectId'=pid and c->>'status'='draft' and c->>'id'<>id) then raise exception 'يوجد مستخلص مسودة';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(p->'lines','[]')) elem group by elem->>'boqItemId' having count(*)>1) then raise exception 'بند مكرر';end if;
  for z in select value from jsonb_array_elements(coalesce(p->'lines','[]')) loop
   b:=rakeeza_private.item(d,'boqItems',z->>'boqItemId');qty:=rakeeza_private.num(z,'currentQty',0);
   select coalesce(max((it->>'cumulativeQty')::numeric),0) into prev from jsonb_array_elements(coalesce(d->'ppcs','[]')) c cross join lateral jsonb_array_elements(c->'items') it where c->>'status' not in('draft','rejected') and it->>'boqItemId'=b->>'id';
   if b->>'projectId' is distinct from pid or qty+prev>least((b->>'executedQty')::numeric,(b->>'contractQty')::numeric) then raise exception 'كمية مستخلص غير متاحة';end if;
   amount:=qty*(b->>'unitPrice')::numeric;gross:=gross+amount;
   lines:=lines||jsonb_build_array(jsonb_build_object('boqItemId',b->>'id','description',b->>'description','previousQty',prev,'currentQty',qty,'cumulativeQty',prev+qty,'unitPrice',(b->>'unitPrice')::numeric,'totalAmount',amount));
  end loop;
  if gross<=0 then raise exception 'لا توجد كميات معتمدة جديدة';end if;
  x:=jsonb_build_object('id',id,'projectId',pid,'certificateNumber','PPC-'||id,'periodStart',pr->>'startDate','periodEnd',nowday,'grossAmount',gross,'advanceDeductionRate',0.1,'advanceDeductionAmount',round(gross*0.1),'retainageRate',0.05,'retainageAmount',round(gross*0.05),'penaltyDeductions',0,'vatRate',0.15,'vatAmount',round(gross*0.85*0.15),'netPayableAmount',round(gross*0.85*1.15),'status',case when (p->>'submit')::boolean then 'submitted' else 'draft' end,'createdByUserId',a.id,'items',lines);
 when 'mr.create' then
  act:='mr.create';col:='materialReqs';perform rakeeza_private.require_action(a,d,act,pid);b:=rakeeza_private.item(d,'boqItems',p->>'boqItemId');qty:=rakeeza_private.num(p,'requestedQty',0.000001);
  select coalesce(sum((m->>'requestedQty')::numeric),0) into used from jsonb_array_elements(coalesce(d->'materialReqs','[]')) m where m->>'boqItemId'=b->>'id' and m->>'status'<>'rejected';
  if b->>'projectId' is distinct from pid or qty+used>(b->>'contractQty')::numeric then raise exception 'كمية مواد غير متاحة';end if;
  amount:=coalesce((b->'costBreakdown'->>'material')::numeric,0);
  x:=jsonb_build_object('id',id,'projectId',pid,'reqNumber','MR-'||id,'date',nowday,'boqItemId',b->>'id','materialName',b->>'description','requestedQty',qty,'unit',b->>'unit','boqRemainingQty',(b->>'contractQty')::numeric-used-qty,'supplierName',rakeeza_private.text(p,'supplierName',200),'unitCost',amount,'estimatedCost',amount*qty,'status','pending_pm','wastagePercentage',1.5);
 when 'vo.create' then
  act:='vo.create';col:='variationOrders';perform rakeeza_private.require_action(a,d,act,pid);perform rakeeza_private.item(d,'projects',pid);
  x:=jsonb_build_object('id',id,'projectId',pid,'voNumber','VO-'||id,'title',rakeeza_private.text(p,'title',500),'reason',rakeeza_private.text(p,'reason',200),'costImpactSar',rakeeza_private.num(p,'costImpactSar',0.01),'timeExtensionDays',rakeeza_private.num(p,'timeExtensionDays',0,36500),'status',case when (p->>'submit')::boolean then 'under_evaluation' else 'proposed' end);
 when 'rfi.create' then
  act:='rfi.create';col:='rfis';perform rakeeza_private.require_action(a,d,act,pid);perform rakeeza_private.item(d,'projects',pid);
  x:=jsonb_build_object('id',id,'projectId',pid,'code','RFI-'||id,'subject',rakeeza_private.text(p,'subject',500),'question',rakeeza_private.text(p,'question',10000),'location',left(p->>'location',1000),'date',nowday,'raisedByName',a.profile->>'name','raisedByUserId',a.id,'status','submitted');
 when 'ncr.issue' then
  act:='ncr.issue';col:='ncrs';perform rakeeza_private.require_action(a,d,act,pid);perform rakeeza_private.item(d,'projects',pid);
  x:=jsonb_build_object('id',id,'projectId',pid,'ncrNumber','NCR-'||id,'date',nowday,'issuer',case when rol='consultant' then 'consultant' else 'internal_qaqc' end,'description',rakeeza_private.text(p,'description',10000),'location',left(p->>'location',1000),'rootCause',left(p->>'rootCause',5000),'correctiveAction','','status','open');
 when 'sub.claim' then
  act:='sub.claim';col:='subClaims';b:=rakeeza_private.item(d,'subcontractors',a.profile->>'subcontractorId');pid:=b->>'projectId';perform rakeeza_private.require_action(a,d,act,pid);amount:=rakeeza_private.num(p,'amount',0.01);
  select coalesce(sum(coalesce((c->>'approvedAmount')::numeric,(c->>'amount')::numeric)),0) into used from jsonb_array_elements(coalesce(d->'subClaims','[]')) c where c->>'subcontractorId'=b->>'id' and c->>'status'<>'rejected';
  if amount+used>(b->>'contractValue')::numeric then raise exception 'تتجاوز قيمة عقد الباطن';end if;
  x:=jsonb_build_object('id',id,'projectId',pid,'subcontractorId',b->>'id','code','SC-'||id,'description',rakeeza_private.text(p,'description',10000),'amount',amount,'date',nowday,'status','submitted');
 else raise exception 'الإجراء غير مدعوم: %',op;
 end case;
 x:=rakeeza_private.history(x,a,op,note);d:=rakeeza_private.put(d,col,x);return rakeeza_private.audit(d,a,op,col,x);
end $$;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
