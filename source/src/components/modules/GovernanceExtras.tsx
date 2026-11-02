import React,{useContext,useEffect,useRef,useState} from 'react';
import {usePlatform} from '../../context/PlatformContext';
import {ModuleApi} from '../../ModuleHub';

const WRITE_ROLES=['executive_director','hr_manager'];
const input='block w-full bg-slate-950 text-white border border-slate-600 rounded p-3 mt-1';
type Rec={id:string;kind:string;projectId:string;body:any;revision:number;files:any[]};
function daysLeft(expiry:string){return Math.floor((new Date(expiry+'T23:59:59').getTime()-Date.now())/86400000)}
function expiryStatus(b:any):{label:string;cls:string}{
 if(!b.expiryDate)return {label:'بدون تاريخ انتهاء',cls:'border-sky-500 text-sky-300'};
 const d=daysLeft(b.expiryDate);const warn=Math.min(Math.max(parseInt(b.alertDays)||30,1),365);
 if(d<0)return {label:'منتهٍ منذ '+(-d)+' يوم',cls:'border-rose-500 text-rose-300'};
 if(d<=warn)return {label:'ينتهي خلال '+d+' يوم',cls:'border-amber-500 text-amber-300'};
 return {label:'ساري ('+d+' يوم)',cls:'border-emerald-500 text-emerald-300'};
}
function useKind(kind:string){
 const api=useContext(ModuleApi);
 const {currentUser}=usePlatform();
 const [records,setRecords]=useState<Rec[]>([]);
 const [error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const [open,setOpen]=useState(false),[editing,setEditing]=useState<Rec|null>(null),[form,setForm]=useState<any>({});
 const running=useRef(false);
 const canWrite=WRITE_ROLES.includes(currentUser?.role||'');
 const refresh=async()=>{const r=await api('modules.list',{kind});setRecords(r.records)};
 useEffect(()=>{refresh().catch(e=>setError(e.message))},[]);
 const run=async(fn:()=>Promise<any>,msg:string)=>{if(running.current)return false;running.current=true;setBusy(true);setError('');try{await fn();await refresh();setStatus(msg);return true}catch(e:any){setError(e.message);return false}finally{running.current=false;setBusy(false)}};
 const save=(e:React.FormEvent)=>{e.preventDefault();run(()=>api(editing?'modules.update':'modules.create',{kind,projectId:'',body:{...form},...(editing?{id:editing.id,revision:editing.revision}:{})}),'حُفظ السجل على الخادم').then(ok=>{if(ok){setOpen(false);setEditing(null);setForm({})}})};
 return {records,error,status,busy,canWrite,open,setOpen,editing,setEditing,form,setForm,save,run,refresh};
}
const Msgs=({error,status,busy}:any)=><>{error&&<p role="alert" className="text-rose-300 p-3 border border-rose-600 rounded">{error}</p>}<p role="status" className="text-emerald-300 text-sm">{busy?'جارٍ انتظار الخادم...':status}</p></>;

const TENDER_STATUS:Record<string,string>={preparing:'قيد التجهيز',submitted:'مُقدَّم',awarded:'مُرسى علينا',not_awarded:'لم تُرسَ',cancelled:'ملغاة'};
export function TendersSection(){
 const m=useKind('govtender');const {form,setForm}=m;
 const sorted=[...m.records].sort((a,b)=>(a.body.submissionDate||'9').localeCompare(b.body.submissionDate||'9'));
 return <section className="space-y-3">
  <div className="flex flex-wrap items-center gap-3"><h2 className="font-bold">متابعة المنافسات الحكومية ({m.records.length})</h2>
   {m.canWrite&&<button className="bg-amber-500 text-black p-2 rounded text-sm" onClick={()=>{m.setEditing(null);setForm({bidStatus:'preparing'});m.setOpen(!m.open)}}>إضافة منافسة</button>}</div>
  <p className="text-xs text-slate-400">سجل داخلي لمنافسات منصة اعتماد وغيرها: الجهة، تاريخ التقديم، القيمة، والحالة. لا يقدّم أي عطاء نيابة عنك.</p>
  <Msgs {...m}/>
  {m.open&&m.canWrite&&<form onSubmit={m.save} className="grid sm:grid-cols-2 gap-3 bg-slate-900 p-4 rounded-xl">
   <label className="text-sm">اسم المنافسة<input required className={input} value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/></label>
   <label className="text-sm">الجهة الحكومية<input required className={input} value={form.entity||''} onChange={e=>setForm({...form,entity:e.target.value})}/></label>
   <label className="text-sm">رقم المنافسة<input className={input} value={form.referenceNumber||''} onChange={e=>setForm({...form,referenceNumber:e.target.value})}/></label>
   <label className="text-sm">آخر موعد للتقديم<input type="date" className={input} value={form.submissionDate||''} onChange={e=>setForm({...form,submissionDate:e.target.value})}/></label>
   <label className="text-sm">قيمة العطاء (ريال)<input inputMode="decimal" className={input} value={form.bidValue||''} onChange={e=>setForm({...form,bidValue:e.target.value})}/></label>
   <label className="text-sm">الحالة<select className={input} value={form.bidStatus||'preparing'} onChange={e=>setForm({...form,bidStatus:e.target.value})}>{Object.entries(TENDER_STATUS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   <label className="text-sm sm:col-span-2">ملاحظات<textarea className={input} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
   <button disabled={m.busy} className="bg-amber-500 text-black rounded p-3 sm:col-span-2">{m.editing?'حفظ التعديل':'تسجيل المنافسة'}</button>
  </form>}
  {sorted.length===0&&<p className="p-4 border border-slate-700 rounded text-sm">لا منافسات مسجلة بعد.</p>}
  {sorted.map(x=>{const d=x.body.submissionDate?daysLeft(x.body.submissionDate):null;const live=x.body.bidStatus==='preparing';return <article key={x.id} className="bg-slate-900 p-4 rounded-xl space-y-2 break-words">
   <div className="flex flex-wrap items-center gap-3"><h3 className="font-bold">{x.body.title}</h3><span className="text-xs border border-slate-500 rounded px-2 py-1">{TENDER_STATUS[x.body.bidStatus]||'—'}</span>
    {live&&d!==null&&<span className={'text-xs border rounded px-2 py-1 '+(d<0?'border-rose-500 text-rose-300':d<=7?'border-amber-500 text-amber-300':'border-emerald-500 text-emerald-300')}>{d<0?'فات موعد التقديم':'باقي '+d+' يوم للتقديم'}</span>}</div>
   <p className="text-sm text-slate-300">{x.body.entity}{x.body.referenceNumber?' · رقم '+x.body.referenceNumber:''}{x.body.submissionDate?' · التقديم '+x.body.submissionDate:''}{x.body.bidValue?' · '+Number(x.body.bidValue).toLocaleString('en-US')+' ريال':''}</p>
   {x.body.notes&&<p className="text-sm whitespace-pre-wrap">{x.body.notes}</p>}
   {m.canWrite&&<button className="border rounded p-2 text-sm" onClick={()=>{m.setEditing(x);setForm({...x.body});m.setOpen(true)}}>تعديل / تحديث الحالة</button>}
  </article>})}
 </section>;
}

const G_TYPES:Record<string,string>={initial_bid:'ابتدائي (دخول منافسة)',performance:'حسن تنفيذ',advance_payment:'دفعة مقدمة',maintenance:'صيانة',retention:'استقطاع محتجز',other:'أخرى'};
export function GuaranteesSection(){
 const m=useKind('govguarantee');const {form,setForm}=m;
 const sorted=[...m.records].sort((a,b)=>(a.body.expiryDate||'9').localeCompare(b.body.expiryDate||'9'));
 const soon=m.records.filter(r=>{const s=expiryStatus(r.body);return s.cls.includes('rose')||s.cls.includes('amber')}).length;
 return <section className="space-y-3">
  <div className="flex flex-wrap items-center gap-3"><h2 className="font-bold">سجل الضمانات البنكية ({m.records.length})</h2>
   {m.canWrite&&<button className="bg-amber-500 text-black p-2 rounded text-sm" onClick={()=>{m.setEditing(null);setForm({guaranteeType:'performance',alertDays:'60'});m.setOpen(!m.open)}}>إضافة ضمان</button>}</div>
  <p className="text-xs text-slate-400">تتبّع خطابات الضمان: النوع، البنك، المبلغ، وتاريخ الانتهاء مع تنبيه. سجل داخلي ولا يتواصل مع البنك.</p>
  {soon>0&&<p role="alert" className="bg-rose-950 border border-rose-600 rounded p-3 text-sm">تنبيه: {soon} ضمان منتهٍ أو قارب على الانتهاء.</p>}
  <Msgs {...m}/>
  {m.open&&m.canWrite&&<form onSubmit={m.save} className="grid sm:grid-cols-2 gap-3 bg-slate-900 p-4 rounded-xl">
   <label className="text-sm">وصف الضمان<input required className={input} value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/></label>
   <label className="text-sm">النوع<select className={input} value={form.guaranteeType||'performance'} onChange={e=>setForm({...form,guaranteeType:e.target.value})}>{Object.entries(G_TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   <label className="text-sm">البنك<input className={input} value={form.bankName||''} onChange={e=>setForm({...form,bankName:e.target.value})}/></label>
   <label className="text-sm">المبلغ (ريال)<input inputMode="decimal" className={input} value={form.amount||''} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
   <label className="text-sm">تاريخ الإصدار<input type="date" className={input} value={form.issueDate||''} onChange={e=>setForm({...form,issueDate:e.target.value})}/></label>
   <label className="text-sm">تاريخ الانتهاء<input type="date" className={input} value={form.expiryDate||''} onChange={e=>setForm({...form,expiryDate:e.target.value})}/></label>
   <label className="text-sm">المشروع / الجهة المستفيدة<input className={input} value={form.projectName||''} onChange={e=>setForm({...form,projectName:e.target.value})}/></label>
   <label className="text-sm">نبّهني قبل (أيام)<input type="number" min={1} max={365} className={input} value={form.alertDays||'60'} onChange={e=>setForm({...form,alertDays:e.target.value})}/></label>
   <label className="text-sm sm:col-span-2">ملاحظات<textarea className={input} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
   <button disabled={m.busy} className="bg-amber-500 text-black rounded p-3 sm:col-span-2">{m.editing?'حفظ التعديل':'تسجيل الضمان'}</button>
  </form>}
  {sorted.length===0&&<p className="p-4 border border-slate-700 rounded text-sm">لا ضمانات مسجلة بعد.</p>}
  {sorted.map(x=>{const s=expiryStatus(x.body);return <article key={x.id} className="bg-slate-900 p-4 rounded-xl space-y-2 break-words">
   <div className="flex flex-wrap items-center gap-3"><h3 className="font-bold">{x.body.title}</h3><span className="text-xs border border-slate-500 rounded px-2 py-1">{G_TYPES[x.body.guaranteeType]||'—'}</span><span className={'text-xs border rounded px-2 py-1 '+s.cls}>{s.label}</span></div>
   <p className="text-sm text-slate-300">{x.body.bankName||''}{x.body.amount?' · '+Number(x.body.amount).toLocaleString('en-US')+' ريال':''}{x.body.projectName?' · '+x.body.projectName:''}{x.body.expiryDate?' · ينتهي '+x.body.expiryDate:''}</p>
   {x.body.notes&&<p className="text-sm whitespace-pre-wrap">{x.body.notes}</p>}
   {m.canWrite&&<button className="border rounded p-2 text-sm" onClick={()=>{m.setEditing(x);setForm({...x.body});m.setOpen(true)}}>تعديل / تمديد</button>}
  </article>})}
 </section>;
}
