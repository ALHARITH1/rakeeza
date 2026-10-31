import {PlatformContextType,Result} from '../context/PlatformContext';
export function commands(send:(op:string,p:object)=>void,projectId:()=>string):Partial<PlatformContextType>{
 const queue=(op:string,p:object):Result=>{send(op,p);return {ok:true}};
 const pid=(p:object)=>({...p,projectId:projectId()});
 const gps=(type:string):Result=>{if(!navigator.geolocation)return {ok:false,error:'المتصفح لا يدعم الموقع'};navigator.geolocation.getCurrentPosition(pos=>send('attendance',{type,lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy,observedAt:new Date(pos.timestamp).toISOString()}),()=>send('__error',{message:'تعذر الحصول على موقعك. اسمح بالوصول للموقع وحاول مجددًا'}),{enableHighAccuracy:true,timeout:20000,maximumAge:0});return {ok:true}};
 return {
 addProject:p=>queue('project.create',p),addBoqItem:p=>queue('boq.create',p),
 importBoqRows:(id,rows)=>{rows.forEach(r=>send('boq.create',{...r,projectId:id}));return {ok:true,count:rows.length}},
 saveDpr:(p,submit)=>queue('dpr.create',pid({...p,items:p.items.filter(i=>i.quantity>0),submit})),submitDpr:id=>queue('dpr.submit',{id}),dprAction:(id,act,note)=>queue('dpr.'+act,{id,note}),
 savePpc:(lines,submit,existingId)=>queue(existingId?'ppc.update':'ppc.create',pid({lines,submit,id:existingId})),ppcAction:(id,act,note)=>queue('ppc.'+act,{id,note}),updatePpcStatus:(id,status)=>send('ppc.'+({submitted:'submit',consultant_approved:'consultant_approve',client_approved:'owner_approve',disbursed:'disburse',rejected:'reject'} as any)[status],{id}),
 addMaterialReq:p=>queue('mr.create',pid(p)),mrAction:(id,act,p)=>queue('mr.'+act,{...p,id}),
 addVariationOrder:(p,submit)=>queue('vo.create',pid({...p,submit})),voAction:(id,act,note)=>queue('vo.'+act,{id,note}),
 addRfi:p=>queue('rfi.create',pid(p)),answerRfi:(id,response,reject)=>queue(reject?'rfi.reject':'rfi.answer',{id,response,note:reject?response:undefined}),
 addSubClaim:p=>queue('sub.claim',p),subClaimAction:(id,act,approvedAmount,note)=>queue('sub.'+act,{id,approvedAmount,note}),
 checkIn:()=>gps('clock_in'),checkOut:()=>gps('clock_out'),requestLeave:p=>queue('leave.request',p),requestAdvance:p=>queue('advance.request',p),signTbt:id=>queue('tbt.sign',{id}),reportHazard:p=>queue('hazard.report',pid(p)),leaveAction:(id,approve)=>queue('leave.review',{id,approve}),advanceAction:(id,approve)=>queue('advance.review',{id,approve}),hazardAction:(id,status)=>queue('hazard.review',{id,status}),setAttendance:(id,status)=>queue('attendance.manual',{id,status}),
 addPtw:p=>send('ptw.create',pid(p)),addLabTest:p=>send('lab.create',pid(p)),addUtilityClash:p=>send('utility.create',pid(p)),addEmergencyIncident:p=>send('incident.create',pid(p)),addSpoilsTicket:p=>send('spoils.create',pid(p)),issueNcr:p=>queue('ncr.issue',pid(p)),closeNcr:(id,correctiveAction)=>send('ncr.close',{id,correctiveAction}),approveTransmittal:id=>send('transmittal.approve',{id}),toggleGeoFence:()=>send('__error',{message:'لا يمكن تحويل الموقع الحقيقي إلى داخل النطاق يدويًا. استخدم الحضور اليدوي المعلّم كمصدر يدوي'}),
 addOnboardingWorker:p=>send('worker.create',p),assignWorker:(id,projectId)=>queue('worker.assign',{id,projectId}),
 importWorkers:(rows,projectId)=>{rows.forEach((r,i)=>send('worker.create',{...r,projectId:projectId||'',iqamaNumber:r.idNumber,empCode:'EMP-'+Date.now()+'-'+i,housingAllowance:r.housingAllowance||0,transportAllowance:r.transportAllowance||0,basicSalary:r.basicSalary||0}));return {ok:true,added:rows.length,skipped:[]}},
 updateCompany:p=>queue('company.update',p),saveRolePermissions:(role,tabs,actions)=>queue('permissions.update',{role,tabs,actions}),resetRolePermissions:()=>queue('permissions.reset',{}),
 inviteUser:()=>({ok:false,error:'استخدم لوحة الدعوات الآمنة أعلى الصفحة'}),updateUser:()=>({ok:false,error:'استخدم لوحة المستخدمين الآمنة أعلى الصفحة'}),
 addLeaveRequest:p=>send('leave.record',p),addDisciplinaryViolation:p=>send('violation.create',p),addSettlement:p=>send('settlement.create',p),resetDemoData:()=>({ok:false,error:'حذف بيانات الشركة غير متاح؛ استخدم النسخ والاستعادة'}),logAudit:()=>{},
 };
}
