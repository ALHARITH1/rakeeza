\set ON_ERROR_STOP on
begin;
do $$
declare pub jsonb;a rakeeza_private.accounts;d jsonb;v jsonb;bad boolean;
begin
 pub:=public.rakeeza_auth('register','0598888821','v2-flow-test-only','{"companyName":"Flows","crNumber":"9876543221","adminName":"Admin"}');a:=rakeeza_private.actor(pub->>'token');
 d:='{"version":2,"projects":[{"id":"p1","code":"P","name":"P","startDate":"2026-01-01"}],"boqItems":[{"id":"b1","projectId":"p1","description":"Item","unit":"m","contractQty":100,"executedQty":10,"unitPrice":10,"costBreakdown":{"material":5}}],"subcontractors":[{"id":"s1","projectId":"p1","name":"Sub","contractValue":1000,"certifiedToDate":0,"invoicedToDate":0}]}'::jsonb||jsonb_build_object('companyId',a.company_id);
 a.profile:=a.profile||'{"role":"site_engineer","projectIds":["p1"]}';d:=rakeeza_private.workflow(a,d,'mr.create','{"projectId":"p1","boqItemId":"b1","requestedQty":10,"supplierName":"Supplier"}');v:=d->'materialReqs'->0;
 bad:=false;begin perform rakeeza_private.workflow(a,d,'mr.issue_po',jsonb_build_object('id',v->>'id'));exception when others then bad:=true;end;if not bad then raise exception 'site issued PO';end if;
 a.profile:=a.profile||'{"role":"project_manager"}';d:=rakeeza_private.workflow(a,d,'mr.pm_approve',jsonb_build_object('id',v->>'id'));
 a.profile:=a.profile||'{"role":"procurement_mgr"}';d:=rakeeza_private.workflow(a,d,'mr.issue_po',jsonb_build_object('id',v->>'id'));
 a.profile:=a.profile||'{"role":"supplier","supplierName":"Wrong supplier"}';bad:=false;begin perform rakeeza_private.workflow(a,d,'mr.supplier_confirm',jsonb_build_object('id',v->>'id'));exception when others then bad:=true;end;if not bad then raise exception 'wrong supplier confirmed';end if;
 a.profile:=a.profile||'{"supplierName":"Supplier"}';d:=rakeeza_private.workflow(a,d,'mr.supplier_confirm',jsonb_build_object('id',v->>'id'));d:=rakeeza_private.workflow(a,d,'mr.deliver',jsonb_build_object('id',v->>'id','deliveryNoteNumber','DN1','invoiceNumber','IN1','invoiceAmount',50));
 a.profile:=a.profile||'{"role":"procurement_mgr"}';d:=rakeeza_private.workflow(a,d,'mr.grn',jsonb_build_object('id',v->>'id'));
 if d->'materialReqs'->0->>'status'<>'grn_received' then raise exception 'MR chain failed';end if;
 a.profile:=a.profile||'{"role":"project_manager"}';d:=rakeeza_private.workflow(a,d,'vo.create','{"projectId":"p1","title":"Change","reason":"design_change","costImpactSar":100,"timeExtensionDays":2,"submit":true}');v:=d->'variationOrders'->0;
 a.profile:=a.profile||'{"role":"consultant"}';d:=rakeeza_private.workflow(a,d,'vo.consultant_approve',jsonb_build_object('id',v->>'id'));a.profile:=a.profile||'{"role":"owner"}';d:=rakeeza_private.workflow(a,d,'vo.owner_approve',jsonb_build_object('id',v->>'id'));
 a.profile:=a.profile||'{"role":"site_engineer"}';d:=rakeeza_private.workflow(a,d,'rfi.create','{"projectId":"p1","subject":"Question","question":"Details","location":"Site"}');v:=d->'rfis'->0;a.profile:=a.profile||'{"role":"consultant"}';d:=rakeeza_private.workflow(a,d,'rfi.answer',jsonb_build_object('id',v->>'id','response','Approved answer'));
 a.profile:=a.profile||'{"role":"subcontractor","subcontractorId":"s1"}';d:=rakeeza_private.workflow(a,d,'sub.claim','{"description":"Work","amount":200}');v:=d->'subClaims'->0;
 a.profile:=a.profile||'{"role":"project_manager"}';d:=rakeeza_private.workflow(a,d,'sub.approve',jsonb_build_object('id',v->>'id','approvedAmount',150));d:=rakeeza_private.workflow(a,d,'sub.pay',jsonb_build_object('id',v->>'id'));
 a.profile:=a.profile||'{"role":"qaqc_manager"}';d:=rakeeza_private.workflow(a,d,'ncr.issue','{"projectId":"p1","description":"Issue","location":"Site","rootCause":"Cause"}');v:=d->'ncrs'->0;d:=rakeeza_private.workflow(a,d,'ncr.close',jsonb_build_object('id',v->>'id','correctiveAction','Fixed'));
 raise notice 'PASS staged v2 workflows: MR full chain with wrong-supplier denial, VO consultant/owner chain, RFI answer, subcontractor claim/approval/payment, NCR issue/close';
end $$;
rollback;
