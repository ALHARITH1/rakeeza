import React, { useEffect, useState } from 'react';
import { PlusCircle, CheckCircle2, XCircle, Send } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { VariationOrder } from '../../types';
import { Card, Modal, StatusBadge, WorkflowStepper, History, Btn, ConfirmDialog, Empty, Field, inputCls, fmt, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

const steps = ['مسودة', 'الاستشاري', 'المالك', 'معتمد'];
const idx: Record<VariationOrder['status'], number> = { proposed: 0, under_evaluation: 1, consultant_approved: 2, approved_by_client: 4, rejected: 1 };
const reasonLabel: Record<VariationOrder['reason'], string> = {
  client_instruction: 'تعليمات المالك',
  unforeseen_utility_conflict: 'تعارض خدمات غير متوقع',
  design_modification: 'تعديل تصميمي'
};

export const VoDetail: React.FC<{ vo: VariationOrder | null; onClose: () => void }> = ({ vo, onClose }) => {
  const { can, voAction, toast } = usePlatform();
  const [confirm, setConfirm] = useState<null | 'submit' | 'consultant_approve' | 'owner_approve' | 'reject'>(null);
  if (!vo) return null;
  const v = vo;
  const acts = {
    submit: v.status === 'proposed' && can('vo.create'),
    consultant_approve: v.status === 'under_evaluation' && can('vo.consultant_approve'),
    owner_approve: v.status === 'consultant_approved' && can('vo.owner_approve'),
    reject: (v.status === 'under_evaluation' && can('vo.consultant_approve')) || (v.status === 'consultant_approved' && can('vo.owner_approve'))
  };
  const labels = { submit: 'رفع للاستشاري', consultant_approve: 'اعتماد الاستشاري', owner_approve: 'اعتماد المالك', reject: 'رفض' };
  const approved = v.status === 'approved_by_client';
  return (
    <>
      <Modal open onClose={onClose} title={<span className="flex items-center gap-2"><CodeBdi code={v.voNumber} /> <StatusBadge status={v.status} /></span>} subtitle={v.title}
        footer={<>
          {acts.reject && <Btn variant="danger" icon={<XCircle className="w-4 h-4" />} onClick={() => setConfirm('reject')}>رفض</Btn>}
          {acts.submit && <Btn icon={<Send className="w-4 h-4" />} onClick={() => setConfirm('submit')}>رفع للاستشاري</Btn>}
          {acts.consultant_approve && <Btn variant="success" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setConfirm('consultant_approve')}>اعتماد الاستشاري</Btn>}
          {acts.owner_approve && <Btn variant="success" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setConfirm('owner_approve')}>اعتماد المالك</Btn>}
          <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
        </>}>
        <WorkflowStepper steps={steps} current={idx[v.status]} rejected={v.status === 'rejected'} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mt-3">
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">السبب</div>{reasonLabel[v.reason]}</div>
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400">{approved ? 'الأثر المالي المعتمد' : 'الأثر المالي المطلوب'}</div>
            <b className={`font-mono ${approved ? 'text-emerald-400' : 'text-amber-400'}`} dir="ltr">+{fmt(v.costImpactSar)} ر.س</b>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">{approved ? 'التمديد المعتمد' : 'التمديد المطلوب'}</div><b className="font-mono" dir="ltr">+{v.timeExtensionDays}</b> يوم</div>
        </div>
        <div className="mt-4"><div className="text-xs font-bold text-white mb-2">سجل الاعتمادات</div><History items={v.history} /></div>
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title={confirm ? labels[confirm] : ''}
        message={confirm === 'owner_approve' ? <>باعتماد المالك تُضاف <bdi dir="ltr" className="font-mono">{fmt(v.costImpactSar)}</bdi> ر.س إلى قيمة العقد. متابعة؟</> : `${confirm ? labels[confirm] : ''} — ${v.voNumber}`}
        confirmLabel={confirm ? labels[confirm] : ''} tone={confirm === 'reject' ? 'danger' : 'success'} requireNote={confirm === 'reject'}
        onConfirm={(note) => { const r = voAction(v.id, confirm!, note || undefined); setConfirm(null); toast(r.ok ? 'تم تنفيذ الإجراء' : r.error, r.ok ? 'success' : 'error'); if (r.ok) onClose(); }} />
    </>
  );
};

export const VariationOrders: React.FC = () => {
  const { variationOrders, selectedProjectId, selectedProject, can, addVariationOrder, toast, focus } = usePlatform();
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ open: false, title: '', reason: 'client_instruction' as VariationOrder['reason'], cost: '', days: '' });
  const [err, setErr] = useState('');
  useEffect(() => { if (focus?.tab === 'tendering') setOpenId(focus.id); }, [focus]);
  useFocusHighlight(focus?.tab === 'tendering' ? focus.id : undefined, focus?.nonce);

  const list = variationOrders.filter((v) => v.projectId === selectedProjectId);
  const approved = list.filter((v) => v.status === 'approved_by_client');
  const requested = list.filter((v) => !['approved_by_client', 'rejected'].includes(v.status));
  const save = (submit: boolean) => {
    setErr('');
    const r = addVariationOrder({ title: form.title, reason: form.reason, costImpactSar: Number(form.cost), timeExtensionDays: Number(form.days) || 0 }, submit);
    if (!r.ok) { setErr(r.error); return; }
    toast(submit ? 'تم رفع أمر التغيير للاستشاري' : 'تم حفظ أمر التغيير كمسودة');
    setForm({ open: false, title: '', reason: 'client_instruction', cost: '', days: '' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><div className="text-[11px] text-slate-400">قيمة العقد الحالية (البنود + المعتمد)</div><div className="text-xl font-black font-mono text-white" dir="ltr">{fmt(selectedProject.contractValue)} <span className="text-xs">ر.س</span></div></Card>
        <Card><div className="text-[11px] text-slate-400">أوامر تغيير معتمدة ومضافة للعقد</div><div className="text-xl font-black font-mono text-emerald-400" dir="ltr">+{fmt(approved.reduce((a, v) => a + v.costImpactSar, 0))}</div><div className="text-[10px] text-slate-400">{approved.length} أمر · +{approved.reduce((a, v) => a + v.timeExtensionDays, 0)} يوم</div></Card>
        <Card><div className="text-[11px] text-slate-400">الأثر المالي المطلوب (غير معتمد بعد)</div><div className="text-xl font-black font-mono text-amber-400" dir="ltr">{fmt(requested.reduce((a, v) => a + v.costImpactSar, 0))}</div><div className="text-[10px] text-slate-400">{requested.length} أمر قيد الاعتماد</div></Card>
      </div>
      <Card title={`أوامر التغيير (${list.length})`} actions={can('vo.create') && <Btn icon={<PlusCircle className="w-4 h-4" />} onClick={() => setForm({ ...form, open: true })}>أمر تغيير جديد</Btn>}>
        {list.length === 0 ? <Empty text="لا توجد أوامر تغيير" /> : (
          <div className="space-y-2">
            {list.map((v) => {
              const ok = v.status === 'approved_by_client';
              return (
                <button key={v.id} data-entity={v.id} onClick={() => setOpenId(v.id)} className="w-full text-right p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2"><CodeBdi code={v.voNumber} className="text-amber-400 font-bold text-xs" /><StatusBadge status={v.status} /></span>
                    <span className="block text-xs font-bold text-white mt-1 truncate">{v.title}</span>
                  </span>
                  <span className="text-xs shrink-0 text-left">
                    <span className="text-[10px] text-slate-400 block">{ok ? 'الأثر المالي المعتمد' : 'الأثر المالي المطلوب'}</span>
                    <b className={`font-mono ${ok ? 'text-emerald-400' : 'text-amber-400'}`} dir="ltr">+{fmt(v.costImpactSar)} ر.س</b>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
      <Modal open={form.open} onClose={() => setForm({ ...form, open: false })} title="أمر تغيير جديد" subtitle={selectedProject.name}
        footer={<><Btn variant="ghost" onClick={() => setForm({ ...form, open: false })}>إلغاء</Btn><Btn variant="ghost" onClick={() => save(false)}>حفظ كمسودة</Btn><Btn onClick={() => save(true)}>رفع للاستشاري</Btn></>}>
        <div className="space-y-3">
          <Field label="عنوان أمر التغيير"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="السبب"><select className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value as any })}>{Object.entries(reasonLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الأثر المالي المطلوب (ر.س)"><input type="number" className={`${inputCls} font-mono text-left`} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
            <Field label="التمديد الزمني المطلوب (يوم)"><input type="number" className={`${inputCls} font-mono text-left`} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></Field>
          </div>
          {err && <div className="text-xs text-rose-400" role="alert">{err}</div>}
        </div>
      </Modal>
      <VoDetail vo={variationOrders.find((v) => v.id === openId) ?? null} onClose={() => setOpenId(null)} />
    </div>
  );
};
