import React,{useContext,useEffect,useRef,useState} from 'react';
import {usePlatform} from '../../context/PlatformContext';
import {ModuleApi} from '../../ModuleHub';

type GovPaper={id:string;name:string;issuer:string;renewal:string;note:string};
export const GOV_PAPERS:GovPaper[]=[
 {id:'cr',name:'السجل التجاري',issuer:'وزارة التجارة',renewal:'سنوي',note:'التجديد إلكتروني عبر بوابة وزارة التجارة. أساس بقية الأوراق.'},
 {id:'classification',name:'شهادة تصنيف المقاولين',issuer:'وزارة البلديات والإسكان (منصة بلدي)',renewal:'سنتان',note:'تتطلب قوائم مالية (ميزانية معتمدة)، كادرًا فنيًا وإداريًا، وسجل مشاريع. إعادة التصنيف قبل الانتهاء بتسعين يومًا.'},
 {id:'sca',name:'عضوية الهيئة السعودية للمقاولين',issuer:'الهيئة السعودية للمقاولين',renewal:'سنوي',note:'مطلوبة عند تقديم طلبات التصنيف.'},
 {id:'muqawil',name:'اشتراك منصة مقاول',issuer:'منصة مقاول',renewal:'سنوي',note:'يتطلب سجلًا تجاريًا ساريًا بأنشطة مقاولات وشهادة التزام تأمينات توضح عدد الموظفين. الرسوم حسب حجم المنشأة.'},
 {id:'zakat',name:'شهادة الزكاة والضريبة',issuer:'هيئة الزكاة والضريبة والجمارك',renewal:'سنوي بعد الإقرار',note:'تصدر بعد تقديم الإقرار وسداد الالتزامات؛ شرط لدى معظم الجهات.'},
 {id:'vat',name:'شهادة ضريبة القيمة المضافة',issuer:'هيئة الزكاة والضريبة والجمارك',renewal:'تسجيل دائم',note:'إلزامية عند تجاوز حد التسجيل؛ تُحدَّث عند تغير البيانات.'},
 {id:'gosi',name:'شهادة التأمينات الاجتماعية',issuer:'المؤسسة العامة للتأمينات الاجتماعية',renewal:'تتجدد دوريًا',note:'تتطلب سداد الاشتراكات؛ تطلبها جهات التأهيل.'},
 {id:'chamber',name:'اشتراك الغرفة التجارية',issuer:'الغرفة التجارية',renewal:'سنوي',note:'مطلوب لإصدار وتجديد عدة تراخيص.'},
 {id:'balady',name:'رخصة البلدية',issuer:'الأمانة عبر منصة بلدي',renewal:'سنوي',note:'رخصة مزاولة النشاط للمقر.'},
 {id:'civildefense',name:'شهادة سلامة الدفاع المدني',issuer:'المديرية العامة للدفاع المدني',renewal:'سنوي',note:'متطلبات سلامة للمقر والمستودعات.'},
 {id:'nataddress',name:'العنوان الوطني',issuer:'البريد السعودي (سبل)',renewal:'تسجيل دائم',note:'يُحدَّث عند تغيّر المقر؛ مطلوب في معظم الخدمات.'},
 {id:'saudization',name:'شهادة السعودة (نطاقات)',issuer:'وزارة الموارد البشرية (منصة قوى)',renewal:'تتجدد دوريًا',note:'تطلبها جهات التأهيل والتمويل.'},
 {id:'wps',name:'الالتزام بحماية الأجور',issuer:'منصة مُدد / وزارة الموارد البشرية',renewal:'التزام مستمر',note:'رفع ملف الأجور شهريًا عبر البنك؛ ركيزة تجهز البيانات فقط ولا ترفع نيابة عنك.'},
 {id:'etimad',name:'تسجيل منصة اعتماد',issuer:'مركز تحقيق كفاءة الإنفاق (اعتماد)',renewal:'اشتراك سنوي',note:'إلزامي للدخول في المنافسات الحكومية.'},
 {id:'size',name:'شهادة حجم المنشأة',issuer:'منشآت',renewal:'تُحدَّث دوريًا',note:'مجانية؛ تثبت تصنيف المنشأة (صغيرة/متوسطة) ويشترطها تأهيل جدير.'},
 {id:'jadeer',name:'شهادة جدير (التأهيل المسبق)',issuer:'منشآت',renewal:'تتجدد دوريًا',note:'مجانية؛ تتطلب بيانات حكومية سارية (التجارة والزكاة والتأمينات) وشهادة حجم المنشأة، وتفتح فرص القطاعين العام والخاص.'},
 {id:'iso',name:'شهادات الأيزو 9001 / 14001 / 45001',issuer:'جهات منح معتمدة',renewal:'كل 3 سنوات مع تدقيق سنوي',note:'تطلبها الشركات الكبرى في التأهيل.'},
 {id:'ccc',name:'شهادة الامتثال للأمن السيبراني (CCC)',issuer:'الهيئة الوطنية للأمن السيبراني',renewal:'تتجدد دوريًا',note:'مطلوبة لدى بعض الجهات الكبرى مثل أرامكو.'},
 {id:'profession',name:'رخصة مزاولة المهنة أو النشاط',issuer:'حسب النشاط (مثل الهيئة السعودية للمهندسين للمكاتب)',renewal:'سنوي',note:'للأنشطة الهندسية والمهنية المقيدة.'},
 {id:'environment',name:'التصريح البيئي',issuer:'المركز الوطني للرقابة على الالتزام البيئي',renewal:'حسب النشاط',note:'للأنشطة ذات الأثر البيئي.'},
 {id:'transport',name:'ترخيص نشاط النقل',issuer:'الهيئة العامة للنقل',renewal:'حسب النشاط',note:'لأساطيل وشاحنات النقل التجاري.'}
];
const WRITE_ROLES=['executive_director','hr_manager'];
const input='block w-full bg-slate-950 text-white border border-slate-600 rounded p-3 mt-1';
type Rec={id:string;kind:string;projectId:string;body:any;revision:number;files:any[];updatedAt?:string};
function daysLeft(expiry:string){return Math.floor((new Date(expiry+'T23:59:59').getTime()-Date.now())/86400000)}
function statusOf(b:any):{key:string;label:string;cls:string}{
 if(!b.expiryDate)return {key:'permanent',label:'دائمة / بدون انتهاء',cls:'border-sky-500 text-sky-300'};
 const d=daysLeft(b.expiryDate);const warn=Math.min(Math.max(parseInt(b.alertDays)||30,1),365);
 if(d<0)return {key:'expired',label:'منتهية منذ '+(-d)+' يوم',cls:'border-rose-500 text-rose-300'};
 if(d<=warn)return {key:'expiring',label:'تنتهي خلال '+d+' يوم',cls:'border-amber-500 text-amber-300'};
 return {key:'valid',label:'سارية ('+d+' يوم)',cls:'border-emerald-500 text-emerald-300'};
}
export function GovernanceModule(){
 const api=useContext(ModuleApi);
 const {serverCommands,currentUser,company}=usePlatform();
 const [records,setRecords]=useState<Rec[]>([]);
 const [form,setForm]=useState<any>({});
 const [error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const [open,setOpen]=useState(false),[editing,setEditing]=useState<Rec|null>(null);
 const [search,setSearch]=useState('');
 const running=useRef(false);
 const role=currentUser?.role||'',canWrite=WRITE_ROLES.includes(role);
 const refresh=async()=>{const r=await api('modules.list',{kind:'govdoc'});setRecords(r.records)};
 useEffect(()=>{refresh().catch(e=>setError(e.message))},[]);
 const run=async(fn:()=>Promise<any>,msg:string)=>{if(running.current)return false;running.current=true;setBusy(true);setError('');try{await fn();await refresh();setStatus(msg);return true}catch(e:any){setError(e.message);return false}finally{running.current=false;setBusy(false)}};
 if(!serverCommands)return <section dir="rtl" className="p-6 border border-amber-500 rounded-xl bg-slate-900"><h1 className="text-xl font-bold mb-2">الحوكمة والأوراق الحكومية</h1><p className="text-sm text-slate-300">سجل الأوراق الحكومية وتنبيهات الانتهاء متاح في النسخة المتصلة من ركيزة (بحساب شركة فعلي)، وليس في هذا العرض التجريبي المحلي.</p></section>;
 const paper=(id:string)=>GOV_PAPERS.find(p=>p.id===id);
 const registeredIds=new Set(records.map(r=>r.body.paperType).filter(Boolean));
 const counts={expired:0,expiring:0,valid:0,permanent:0};
 records.forEach(r=>{(counts as any)[statusOf(r.body).key]++});
 const unregistered=GOV_PAPERS.filter(p=>!registeredIds.has(p.id));
 const startRegister=(p:GovPaper)=>{setEditing(null);setForm({paperType:p.id,title:p.name,issuingAuthority:p.issuer,renewalCycle:p.renewal,alertDays:'30',notes:''});setOpen(true);window.scrollTo(0,0)};
 const list=records.filter(r=>!search||JSON.stringify(r.body).includes(search)).sort((a,b)=>{const ea=a.body.expiryDate,eb=b.body.expiryDate;if(!ea&&!eb)return 0;if(!ea)return 1;if(!eb)return -1;return ea.localeCompare(eb)});
 const save=(e:React.FormEvent)=>{e.preventDefault();const b={...form};if(b.paperType!=='custom'){const p=paper(b.paperType);if(p){b.title=p.name;b.renewalCycle=p.renewal;if(!b.issuingAuthority)b.issuingAuthority=p.issuer}}run(()=>api(editing?'modules.update':'modules.create',{kind:'govdoc',projectId:'',body:b,...(editing?{id:editing.id,revision:editing.revision}:{})}),'حُفظ السجل على الخادم').then(ok=>{if(ok){setOpen(false);setEditing(null);setForm({})}})};
 const fileAdd=(x:Rec,f:File)=>run(async()=>{if(f.size>2000000)throw Error('حد الملف ٢ ميجابايت');const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(f)});await api('modules.file.add',{id:x.id,revision:x.revision,filename:f.name,mime:f.type||'text/plain',base64:data})},'حُفظ الملف الخاص على الخادم');
 const getFile=(x:Rec,f:any)=>run(async()=>{const out=await api('modules.file.get',{id:f.id});const raw=atob(out.base64.replace(/\s/g,''));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([Uint8Array.from(raw,c=>c.charCodeAt(0))],{type:out.mime}));a.download=out.filename;a.click()},'نُزّل الملف من الخادم');
 return <section dir="rtl" className="space-y-4">
 <header className="bg-slate-900 p-5 rounded-xl space-y-3">
  <h1 className="text-xl font-bold">الحوكمة والأوراق الحكومية</h1>
  <p className="text-slate-400 text-sm">سجل شركة {company?.name} لأوراقها الحكومية وشهاداتها: أرقامها وتواريخها وحالتها، مع تنبيه قبل الانتهاء. السجل داخلي خاص بشركتك ولا يرسل أو يجدد شيئًا لدى أي جهة.</p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
   <div className="border border-rose-500 rounded p-3"><p className="text-2xl font-bold text-rose-300">{counts.expired}</p><p className="text-xs">منتهية</p></div>
   <div className="border border-amber-500 rounded p-3"><p className="text-2xl font-bold text-amber-300">{counts.expiring}</p><p className="text-xs">تنتهي قريبًا</p></div>
   <div className="border border-emerald-500 rounded p-3"><p className="text-2xl font-bold text-emerald-300">{counts.valid}</p><p className="text-xs">سارية</p></div>
   <div className="border border-sky-500 rounded p-3"><p className="text-2xl font-bold text-sky-300">{counts.permanent}</p><p className="text-xs">دائمة</p></div>
  </div>
  {(counts.expired>0||counts.expiring>0)&&<p role="alert" className="bg-rose-950 border border-rose-600 rounded p-3 text-sm">تنبيه: {counts.expired>0?counts.expired+' ورقة منتهية ':''}{counts.expired>0&&counts.expiring>0?'و':''}{counts.expiring>0?counts.expiring+' ورقة تنتهي قريبًا':''} — راجع القائمة وجدّد تواريخها بعد التجديد الفعلي لدى الجهة.</p>}
  <div className="flex flex-wrap gap-3">
   <button disabled={busy} onClick={()=>run(refresh,'حُمّلت أحدث البيانات')} className="border p-3 rounded">تحديث</button>
   {canWrite&&<button onClick={()=>{setEditing(null);setForm({paperType:'cr',alertDays:'30'});setOpen(!open)}} className="bg-amber-500 text-black p-3 rounded">تسجيل ورقة</button>}
  </div>
 </header>
 {error&&<p role="alert" className="text-rose-300 p-3 border border-rose-600 rounded">{error}</p>}
 <p role="status" className="text-emerald-300 text-sm">{busy?'جارٍ انتظار الخادم...':status}</p>
 {open&&canWrite&&<form onSubmit={save} className="grid sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl">
  <label className="text-sm">الورقة أو الشهادة
   <select aria-label="الورقة" required className={input} value={form.paperType||''} onChange={e=>{const p=paper(e.target.value);setForm({...form,paperType:e.target.value,...(p?{title:p.name,issuingAuthority:p.issuer,renewalCycle:p.renewal}:{renewalCycle:''})})}}>
    {GOV_PAPERS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
    <option value="custom">أخرى (ورقة مخصصة)</option>
   </select>
  </label>
  {form.paperType==='custom'&&<>
   <label className="text-sm">اسم الورقة<input required className={input} value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/></label>
   <label className="text-sm">الجهة المصدرة<input className={input} value={form.issuingAuthority||''} onChange={e=>setForm({...form,issuingAuthority:e.target.value})}/></label>
  </>}
  <label className="text-sm">رقم المستند<input className={input} value={form.documentNumber||''} onChange={e=>setForm({...form,documentNumber:e.target.value})}/></label>
  <label className="text-sm">تاريخ الإصدار<input type="date" className={input} value={form.issueDate||''} onChange={e=>setForm({...form,issueDate:e.target.value})}/></label>
  <label className="text-sm">تاريخ الانتهاء (يُترك فارغًا للأوراق الدائمة)<input type="date" className={input} value={form.expiryDate||''} onChange={e=>setForm({...form,expiryDate:e.target.value})}/></label>
  <label className="text-sm">نبّهني قبل الانتهاء بـ (أيام)<input type="number" min={1} max={365} className={input} value={form.alertDays||'30'} onChange={e=>setForm({...form,alertDays:e.target.value})}/></label>
  <label className="text-sm sm:col-span-2">ملاحظات<textarea className={input} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
  <button disabled={busy} className="bg-amber-500 text-black rounded p-3 sm:col-span-2">{editing?'حفظ التعديل على الخادم':'تسجيل على الخادم'}</button>
 </form>}
 <label className="block text-sm">البحث<input className={input} value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <h2 className="font-bold">الأوراق المسجلة ({list.length})</h2>
 {list.length===0&&<p className="p-6 border border-slate-700 rounded">لا توجد أوراق مسجلة بعد. ابدأ بتسجيل أوراق شركتك من الدليل أدناه.</p>}
 {list.map(x=>{const s=statusOf(x.body);return <article key={x.id} className="bg-slate-900 p-4 rounded-xl space-y-3 break-words">
  <div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-bold">{x.body.title}</h3><span className={'text-xs border rounded px-2 py-1 '+s.cls}>{s.label}</span></div>
  <dl className="grid sm:grid-cols-2 gap-3 text-sm">
   {x.body.documentNumber&&<div><dt className="text-xs text-slate-400">رقم المستند</dt><dd>{x.body.documentNumber}</dd></div>}
   {x.body.issuingAuthority&&<div><dt className="text-xs text-slate-400">الجهة</dt><dd>{x.body.issuingAuthority}</dd></div>}
   {x.body.issueDate&&<div><dt className="text-xs text-slate-400">الإصدار</dt><dd>{x.body.issueDate}</dd></div>}
   {x.body.expiryDate&&<div><dt className="text-xs text-slate-400">الانتهاء</dt><dd>{x.body.expiryDate}</dd></div>}
   {x.body.renewalCycle&&<div><dt className="text-xs text-slate-400">دورة التجديد</dt><dd>{x.body.renewalCycle}</dd></div>}
   {x.body.notes&&<div className="sm:col-span-2"><dt className="text-xs text-slate-400">ملاحظات</dt><dd className="whitespace-pre-wrap">{x.body.notes}</dd></div>}
  </dl>
  <div className="flex flex-wrap gap-3">
   {canWrite&&<button className="border rounded p-2" onClick={()=>{setEditing(x);setForm({...x.body});setOpen(true);window.scrollTo(0,0)}}>تعديل / تجديد التواريخ</button>}
   {canWrite&&<label className="border rounded p-2 cursor-pointer">إرفاق نسخة (٢MB)<input className="hidden" type="file" accept=".pdf,.jpg,.jpeg,.png,.txt,.csv" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)fileAdd(x,f);e.target.value=''}}/></label>}
  </div>
  {x.files?.map(f=><button key={f.id} className="block underline text-sky-300 text-sm" disabled={busy} onClick={()=>getFile(x,f)}>{f.filename} ({Math.ceil(f.size/1024)} KB) - تنزيل خاص</button>)}
  <details><summary className="text-sm cursor-pointer">سجل الإجراءات</summary>{(x.body.history||[]).map((h:any,i:number)=><p className="text-xs text-slate-400" key={i}>{({create:'تسجيل',edit:'تعديل','file.add':'إرفاق ملف'} as any)[h.action]||h.action} - {h.name} - {new Date(h.at).toLocaleString('ar-SA')}</p>)}</details>
 </article>})}
 <h2 className="font-bold">دليل الأوراق — غير مسجلة بعد ({unregistered.length})</h2>
 <p className="text-xs text-slate-400">المعلومات استرشادية عن كل ورقة وجهتها ومتطلباتها الشائعة؛ تحقق من متطلبات الجهة الحالية عند التقديم.</p>
 <div className="grid sm:grid-cols-2 gap-3">
  {unregistered.map(p=><div key={p.id} className="border border-slate-700 rounded p-4 space-y-2">
   <h3 className="font-bold">{p.name}</h3>
   <p className="text-xs text-slate-400">{p.issuer} · التجديد: {p.renewal}</p>
   <p className="text-sm">{p.note}</p>
   {canWrite&&<button className="text-amber-300 underline text-sm" onClick={()=>startRegister(p)}>تسجيل هذه الورقة</button>}
  </div>)}
 </div>
 </section>;
}
