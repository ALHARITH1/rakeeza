import React, { useState } from 'react';
import { Building2, PlusCircle, Users, MinusCircle } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { PageHeader, Card, Btn, Modal, Field, inputCls, StatusBadge, Empty, History, fmt } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

export const SubcontractorPortal: React.FC = () => {
  const { subcontractors, subClaims, currentUser, addSubClaim, toast } = usePlatform();
  const sub = subcontractors.find((s) => s.id === currentUser?.subcontractorId);
  const [f, setF] = useState({ open: false, description: '', amount: '' });
  const [err, setErr] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  if (!sub) return <Card><div className="text-xs">حسابك غير مرتبط بمقاول باطن.</div></Card>;
  const claims = subClaims.filter((c) => c.subcontractorId === sub.id);
  const approved = claims.filter((c) => ['pm_approved', 'paid'].includes(c.status)).reduce((a, c) => a + (c.approvedAmount ?? 0), 0);
  const paid = claims.filter((c) => c.status === 'paid').reduce((a, c) => a + (c.approvedAmount ?? 0), 0);
  const back = sub.dieselBackcharges + sub.powerBackcharges;
  const open = claims.find((c) => c.id === openId);
  return (
    <div className="space-y-4">
      <PageHeader icon={<Building2 className="w-5 h-5 text-amber-400" />} title="بوابة مقاول الباطن" subtitle={`${sub.name} — ${sub.scopeOfWork}`}
        actions={<Btn icon={<PlusCircle className="w-4 h-4" />} onClick={() => setF({ ...f, open: true })}>رفع مطالبة</Btn>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><div className="text-[11px] text-slate-400">قيمة العقد</div><div className="text-lg font-black font-mono" dir="ltr">{fmt(sub.contractValue)}</div></Card>
        <Card><div className="text-[11px] text-slate-400">المعتمد</div><div className="text-lg font-black font-mono text-emerald-400" dir="ltr">{fmt(approved)}</div></Card>
        <Card><div className="text-[11px] text-slate-400">الخصومات</div><div className="text-lg font-black font-mono text-rose-400" dir="ltr">-{fmt(back)}</div></Card>
        <Card><div className="text-[11px] text-slate-400">صافي المستحق غير المصروف</div><div className="text-lg font-black font-mono text-amber-400" dir="ltr">{fmt(approved - paid - back)}</div></Card>
      </div>
      <Card title="مطالباتي">
        {claims.length === 0 ? <Empty text="لا توجد مطالبات" /> : (
          <div className="space-y-2">{claims.map((c) => (
            <button key={c.id} data-entity={c.id} onClick={() => setOpenId(c.id)} className="w-full text-right p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
              <span className="min-w-0"><CodeBdi code={c.code} className="text-amber-400 text-xs font-bold" /><span className="block text-xs text-white truncate">{c.description}</span>{c.note && <span className="block text-[10px] text-rose-300">{c.note}</span>}</span>
              <span className="text-left shrink-0"><bdi dir="ltr" className="font-mono text-xs block">{fmt(c.amount)}</bdi>{c.approvedAmount != null && <bdi dir="ltr" className="font-mono text-[10px] text-emerald-400 block">معتمد {fmt(c.approvedAmount)}</bdi>}<StatusBadge status={c.status === 'pm_approved' ? 'approved' : c.status} /></span>
            </button>
          ))}</div>
        )}
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={<><MinusCircle className="w-4 h-4 text-rose-400" /> الخصومات</>}>
          <div className="flex justify-between text-xs py-1.5 border-b border-slate-800"><span className="text-slate-400">استهلاك الديزل من المقاول الرئيسي</span><bdi dir="ltr" className="font-mono text-rose-400">{fmt(sub.dieselBackcharges)}</bdi></div>
          <div className="flex justify-between text-xs py-1.5"><span className="text-slate-400">الكهرباء والمرافق</span><bdi dir="ltr" className="font-mono text-rose-400">{fmt(sub.powerBackcharges)}</bdi></div>
        </Card>
        <Card title={<><Users className="w-4 h-4 text-sky-400" /> عمالتي المسجلة ({sub.workforce?.length ?? 0})</>}>
          {(sub.workforce ?? []).map((w) => <div key={w.idNumber} className="flex justify-between text-xs py-1.5 border-b border-slate-800/60"><span>{w.name} <span className="text-slate-500">— {w.trade}</span></span><bdi dir="ltr" className="font-mono text-slate-400">{w.idNumber}</bdi></div>)}
          {!sub.workforce?.length && <Empty text="لا توجد عمالة مسجلة" />}
        </Card>
      </div>
      <Modal open={f.open} onClose={() => setF({ ...f, open: false })} title="رفع مطالبة جديدة"
        footer={<><Btn variant="ghost" onClick={() => setF({ ...f, open: false })}>إلغاء</Btn><Btn onClick={() => { setErr(''); const r = addSubClaim({ description: f.description, amount: Number(f.amount) }); if (!r.ok) setErr(r.error); else { toast('تم رفع المطالبة لمدير المشروع'); setF({ open: false, description: '', amount: '' }); } }}>رفع</Btn></>}>
        <div className="space-y-3">
          <Field label="وصف الأعمال المنفذة"><textarea rows={3} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="المبلغ المطالب (ر.س)"><input type="number" className={`${inputCls} font-mono text-left`} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          {err && <div className="text-xs text-rose-400">{err}</div>}
        </div>
      </Modal>
      <Modal open={!!open} onClose={() => setOpenId(null)} title={open?.code ?? ''} subtitle={open?.description}>{open && <History items={open.history} />}</Modal>
    </div>
  );
};
