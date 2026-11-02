import React,{useMemo,useState} from 'react';
import {TEMPLATES,TEMPLATE_CATS,Tpl} from './templateData';
const input='block w-full bg-slate-950 text-white border border-slate-600 rounded p-3 mt-1';
function copyText(t:string){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(t);const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve()}
function download(t:Tpl){const blob=new Blob(['﻿'+t.name+'\n\n'+t.body],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=t.name+'.txt';a.click();URL.revokeObjectURL(a.href)}
export function TemplateLibrary(){
 const [cat,setCat]=useState<string>('الكل');
 const [q,setQ]=useState('');
 const [copied,setCopied]=useState('');
 const list=useMemo(()=>TEMPLATES.filter(t=>(cat==='الكل'||t.cat===cat)&&(!q||(t.name+t.use+t.body).includes(q))),[cat,q]);
 return <section className="space-y-4 border border-slate-700 rounded-xl p-5 bg-slate-900">
  <h2 className="font-bold text-lg">مكتبة قوالب العقود والخطابات ({TEMPLATES.length} نموذجًا)</h2>
  <p className="text-xs text-slate-400">نماذج عربية جاهزة للمقاولين: عقود وخطابات بنكية وخطابات مشاريع ورسمية. انسخ النص، املأ ما بين الأقواس [ ]، ثم اطبعه على ورق شركتك الرسمي. النماذج استرشادية وليست استشارة قانونية؛ راجعها مع مستشارك القانوني قبل الاعتماد.</p>
  <div className="flex flex-wrap gap-2">
   {TEMPLATE_CATS.map(c=><button key={c} onClick={()=>setCat(c)} className={'border rounded px-3 py-2 text-sm '+(cat===c?'bg-amber-500 text-black border-amber-500':'border-slate-600')}>{c}</button>)}
  </div>
  <label className="block text-sm">البحث في النماذج<input className={input} value={q} onChange={e=>setQ(e.target.value)} placeholder="مثال: ضمان، مستخلص، تمديد..."/></label>
  {list.length===0&&<p className="p-4 border border-slate-700 rounded text-sm">لا نتائج مطابقة للبحث.</p>}
  <div className="grid gap-3">
   {list.map(t=><details key={t.id} className="border border-slate-700 rounded p-4 space-y-2">
    <summary className="cursor-pointer font-bold">{t.name} <span className="text-xs text-slate-400 font-normal">- {t.cat}</span></summary>
    <p className="text-xs text-slate-400 pt-2">متى تستخدمه: {t.use}</p>
    <pre className="whitespace-pre-wrap text-sm bg-slate-950 border border-slate-700 rounded p-4 max-h-96 overflow-y-auto font-sans leading-relaxed">{t.body}</pre>
    <div className="flex flex-wrap gap-3 pt-1">
     <button className="bg-amber-500 text-black rounded px-4 py-2 text-sm" onClick={()=>{copyText(t.name+'\n\n'+t.body).then(()=>{setCopied(t.id);setTimeout(()=>setCopied(''),2000)})}}>{copied===t.id?'تم النسخ':'نسخ النص'}</button>
     <button className="border border-slate-600 rounded px-4 py-2 text-sm" onClick={()=>download(t)}>تنزيل نص (TXT)</button>
    </div>
   </details>)}
  </div>
 </section>;
}
