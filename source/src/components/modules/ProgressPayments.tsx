import React, { useEffect, useMemo, useState } from 'react';
import { Receipt, PlusCircle, CheckCircle2, XCircle, Send, Banknote, Save, AlertTriangle } from 'lucide-react';
import { usePlatform, PpcDraftLine } from '../../context/PlatformContext';
import { ProgressPaymentCertificate } from '../../types';
import { PageHeader, Card, Modal, StatusBadge, WorkflowStepper, History, Btn, ConfirmDialog, Empty, fmt, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

const steps = ['مسودة', 'لدى الاستشاري', 'لدى المالك', 'معتمد', 'مصروف'];
const idx: Record<ProgressPaymentCertificate['status'], number> = { draft: 0, submitted: 1, consultant_approved: 2, client_approved: 3, disbursed: 4, rejected: 1 };

const Totals: React.FC<{ gross: number }> = ({ gross }) => {
  const adv = gross * 0.1, ret = gross * 0.05, sub = gross - adv - ret, vat = sub * 0.15;
  const row = (l: string, v: number, c = 'text-slate-200') => (
    <div className="flex justify-between py-1"><span className="text-slate-400">{l}</span><bdi dir="ltr" className={`font-mono ${c}`}>{fmt(v)} ر.س</bdi></div>
  );
  return (
    <div className="text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 divide-y divide-slate-800/60">
      {row('إجمالي الأعمال المنفذة للفترة', gross, 'text-white font-bold')}
      {row('استرداد الدفعة المقدمة (10%)', -adv, 'text-rose-400')}
      {row('محتجزات ضمان الأعمال (5%)', -ret, 'text-rose-400')}
      {row('ضريبة القيمة المضافة (15%)', vat, 'text-sky-400')}
      {row('صافي المستحق', sub + vat, 'text-emerald-400 font-black')}
    </div>
  );
};

/* -------- Editor for a new / draft certificate -------- */
const PpcEditor: React.FC<{ open: boolean; onClose: () => void; draftId?: string }> = ({ open, onClose, draftId }) => {
  const { buildPpcDraft, savePpc, ppcs, selectedProjectId, selectedProject, toast, openItem } = usePlatform();
  const [lines, setLines] = useState<PpcDraftLine[]>([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!open) return;
    setErr('');
    const base = buildPpcDraft(selectedProjectId);
    const draft = draftId ? ppcs.find((p) => p.id === draftId) : undefined;
    // when editing a draft, its own quantities are not "previous"
    setLines(base.map((l) => {
      const own = draft?.items.find((i) => i.boqItemId === l.boqItemId)?.currentQty;
      return own != null ? { ...l, currentQty: own } : l;
    }));
  }, [open, draftId, selectedProjectId]); // eslint-disable-line

  const gross = lines.reduce((a, l) => a + (Number(l.currentQty) || 0) * l.unitPrice, 0);
  const anyOver = lines.some((l) => l.currentQty > l.maxCurrent || l.currentQty < 0);
  const nothing = lines.every((l) => l.maxCurrent === 0);

  const save = (submit: boolean) => {
    setErr('');
    const r = savePpc(lines.map((l) => ({ boqItemId: l.boqItemId, currentQty: Number(l.currentQty) || 0 })), submit, draftId);
    if (!r.ok) { setErr(r.error); return; }
    toast(submit ? 'تم إصدار المستخلص ورفعه للاستشاري' : 'تم حفظ المستخلص كمسودة');
    onClose();
    if (r.id) openItem('ppc', r.id);
  };

  return (
    <Modal open={open} onClose={onClose} size="xl" title={draftId ? 'تعديل مسودة المستخلص' : 'توليد دورة مستخلص جديدة'}
      subtitle={<>{selectedProject.name} — الحالي = المنفذ المعتمد (المرحّل) منذ آخر مستخلص، والسابق = مجموع المستخلصات السابقة</>}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn variant="ghost" icon={<Save className="w-4 h-4" />} disabled={anyOver || gross <= 0} onClick={() => save(false)}>حفظ كمسودة</Btn>
        <Btn icon={<Send className="w-4 h-4" />} disabled={anyOver || gross <= 0} onClick={() => save(true)}>حفظ وإصدار للاستشاري</Btn>
      </>}>
      {nothing && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> لا توجد كميات معتمدة جديدة منذ آخر مستخلص. اعتمد تقارير ميدانية أولاً.
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs min-w-[860px]">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr><th className="p-2">البند</th><th className="p-2">كمية العقد</th><th className="p-2">المنفذ المعتمد</th><th className="p-2">السابق</th><th className="p-2 w-36">الحالي</th><th className="p-2">التراكمي</th><th className="p-2">سعر الوحدة</th><th className="p-2">قيمة الحالي</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {lines.map((l, i) => {
              const over = l.currentQty > l.maxCurrent || l.currentQty < 0;
              return (
                <tr key={l.boqItemId} className={over ? 'bg-rose-500/5' : ''}>
                  <td className="p-2 max-w-[260px]"><b className="text-amber-400 font-mono ml-1" dir="ltr">{l.code}</b><span className="text-slate-200 line-clamp-2">{l.description}</span></td>
                  <td className="p-2 font-mono"><bdi dir="ltr">{fmt(l.contractQty)}</bdi> <span className="text-slate-500">{l.unit}</span></td>
                  <td className="p-2 font-mono text-emerald-400"><bdi dir="ltr">{fmt(l.approvedExecuted)}</bdi></td>
                  <td className="p-2 font-mono text-slate-300"><bdi dir="ltr">{fmt(l.previousQty)}</bdi></td>
                  <td className="p-2">
                    <input type="number" min={0} max={l.maxCurrent} value={l.currentQty} aria-label={`الكمية الحالية ${l.code}`}
                      onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, currentQty: Number(e.target.value) } : x)))}
                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-left font-mono ${over ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'}`} />
                    <span className={`text-[10px] ${over ? 'text-rose-400' : 'text-slate-500'}`}>الحد الأقصى <bdi dir="ltr">{fmt(l.maxCurrent)}</bdi></span>
                  </td>
                  <td className="p-2 font-mono"><bdi dir="ltr">{fmt(l.previousQty + (Number(l.currentQty) || 0))}</bdi></td>
                  <td className="p-2 font-mono text-slate-300"><bdi dir="ltr">{fmt(l.unitPrice)}</bdi></td>
                  <td className="p-2 font-mono text-amber-400"><bdi dir="ltr">{fmt((Number(l.currentQty) || 0) * l.unitPrice)}</bdi></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 max-w-md mr-auto"><Totals gross={gross} /></div>
      {err && <div className="text-xs text-rose-400 mt-3 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2" role="alert">{err}</div>}
    </Modal>
  );
};

/* -------- Read-only details + approvals -------- */
export const PpcDetail: React.FC<{ ppc: ProgressPaymentCertificate | null; onClose: () => void; onEdit?: (id: string) => void; hideInternal?: boolean }> = ({ ppc, onClose, onEdit }) => {
  const { can, ppcAction, toast, boqItems } = usePlatform();
  const [confirm, setConfirm] = useState<null | 'submit' | 'consultant_approve' | 'owner_approve' | 'disburse' | 'reject'>(null);
  if (!ppc) return null;
  const c = ppc;
  const acts = {
    submit: c.status === 'draft' && can('ppc.create'),
    consultant_approve: c.status === 'submitted' && can('ppc.consultant_approve'),
    owner_approve: c.status === 'consultant_approved' && can('ppc.owner_approve'),
    disburse: c.status === 'client_approved' && can('ppc.disburse'),
    reject: (c.status === 'submitted' && can('ppc.consultant_approve')) || (c.status === 'consultant_approved' && can('ppc.owner_approve'))
  };
  const labels = { submit: 'إصدار ورفع للاستشاري', consultant_approve: 'اعتماد الاستشاري', owner_approve: 'اعتماد المالك', disburse: 'تسجيل الصرف', reject: 'رفض' };
  const run = (a: keyof typeof labels, note: string) => {
    const r = ppcAction(c.id, a, note || undefined);
    setConfirm(null);
    toast(r.ok ? `تم: ${labels[a]}` : r.error, r.ok ? 'success' : 'error');
    if (r.ok) onClose();
  };
  return (
    <>
      <Modal open onClose={onClose} size="xl" title={<span className="flex items-center gap-2">مستخلص <CodeBdi code={c.certificateNumber} /> <StatusBadge status={c.status} /></span>}
        subtitle={<>الفترة <bdi dir="ltr">{c.periodStart}</bdi> → <bdi dir="ltr">{c.periodEnd}</bdi></>}
        footer={<>
          {c.status === 'draft' && onEdit && can('ppc.create') && <Btn variant="ghost" onClick={() => onEdit(c.id)}>تعديل المسودة</Btn>}
          {acts.reject && <Btn variant="danger" icon={<XCircle className="w-4 h-4" />} onClick={() => setConfirm('reject')}>رفض</Btn>}
          {acts.submit && <Btn icon={<Send className="w-4 h-4" />} onClick={() => setConfirm('submit')}>{labels.submit}</Btn>}
          {acts.consultant_approve && <Btn variant="success" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setConfirm('consultant_approve')}>{labels.consultant_approve}</Btn>}
          {acts.owner_approve && <Btn variant="success" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setConfirm('owner_approve')}>{labels.owner_approve}</Btn>}
          {acts.disburse && <Btn variant="info" icon={<Banknote className="w-4 h-4" />} onClick={() => setConfirm('disburse')}>{labels.disburse}</Btn>}
          <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
        </>}>
        <WorkflowStepper steps={steps} current={idx[c.status]} rejected={c.status === 'rejected'} />
        {c.status !== 'draft' && <div className="text-[11px] text-slate-400 mt-2">🔒 الكميات مقفلة بعد الرفع — أي تعديل يتطلب رفض المستخلص وإنشاء دورة جديدة.</div>}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-right text-xs min-w-[720px]">
            <thead className="text-slate-400 border-b border-slate-800"><tr><th className="p-2">البند</th><th className="p-2">السابق</th><th className="p-2">الحالي</th><th className="p-2">التراكمي</th><th className="p-2">سعر الوحدة</th><th className="p-2">القيمة</th></tr></thead>
            <tbody className="divide-y divide-slate-800/70">
              {c.items.map((i) => {
                const b = boqItems.find((x) => x.id === i.boqItemId);
                return (
                  <tr key={i.boqItemId}>
                    <td className="p-2 max-w-[280px]"><b className="text-amber-400 font-mono ml-1" dir="ltr">{b?.code}</b><span className="text-slate-200">{i.description.slice(0, 70)}</span></td>
                    <td className="p-2 font-mono"><bdi dir="ltr">{fmt(i.previousQty)}</bdi></td>
                    <td className="p-2 font-mono text-amber-400"><bdi dir="ltr">{fmt(i.currentQty)}</bdi></td>
                    <td className="p-2 font-mono"><bdi dir="ltr">{fmt(i.cumulativeQty)}</bdi> <span className="text-slate-500">{b?.unit}</span></td>
                    <td className="p-2 font-mono"><bdi dir="ltr">{fmt(i.unitPrice)}</bdi></td>
                    <td className="p-2 font-mono text-white"><bdi dir="ltr">{fmt(i.totalAmount)}</bdi></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Totals gross={c.grossAmount} />
          <div><div className="text-xs font-bold text-white mb-2">سجل الاعتمادات</div><History items={c.history} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title={confirm ? labels[confirm] : ''}
        message={confirm === 'reject' ? 'سيتم رفض المستخلص وإعادته لمدير المشروع مع الملاحظة.' : <>تأكيد <b>{confirm && labels[confirm]}</b> للمستخلص {c.certificateNumber} بصافي <bdi dir="ltr" className="font-mono">{fmt(c.netPayableAmount)}</bdi> ر.س؟</>}
        confirmLabel={confirm ? labels[confirm] : ''} tone={confirm === 'reject' ? 'danger' : 'success'} requireNote={confirm === 'reject'}
        onConfirm={(n) => confirm && run(confirm, n)} />
    </>
  );
};

export const ProgressPayments: React.FC = () => {
  const { ppcs, selectedProjectId, selectedProject, can, focus, subcontractors, subClaims } = usePlatform();
  const [editor, setEditor] = useState<{ open: boolean; draftId?: string }>({ open: false });
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => { if (focus?.tab === 'ppc') setOpenId(focus.id); }, [focus]);
  useFocusHighlight(focus?.tab === 'ppc' ? focus.id : undefined, focus?.nonce);

  const list = useMemo(() => ppcs.filter((p) => p.projectId === selectedProjectId).sort((a, b) => b.certificateNumber.localeCompare(a.certificateNumber)), [ppcs, selectedProjectId]);
  const certified = list.filter((p) => ['client_approved', 'disbursed'].includes(p.status)).reduce((a, p) => a + p.grossAmount, 0);
  const pending = list.filter((p) => ['submitted', 'consultant_approved'].includes(p.status)).reduce((a, p) => a + p.netPayableAmount, 0);
  const retention = list.filter((p) => p.status !== 'rejected' && p.status !== 'draft').reduce((a, p) => a + p.retainageAmount, 0);
  const draft = list.find((p) => p.status === 'draft');

  // subcontractor reconciliation (computed from approved claims and back-charges)
  const subs = subcontractors.filter((s) => s.projectId === selectedProjectId).map((s) => {
    const approved = subClaims.filter((c) => c.subcontractorId === s.id && (c.status === 'pm_approved' || c.status === 'paid')).reduce((a, c) => a + (c.approvedAmount ?? 0), 0);
    const paid = subClaims.filter((c) => c.subcontractorId === s.id && c.status === 'paid').reduce((a, c) => a + (c.approvedAmount ?? 0), 0);
    const back = s.dieselBackcharges + s.powerBackcharges;
    return { s, approved, paid, back, net: approved - paid - back };
  });

  return (
    <div className="space-y-4">
      <PageHeader icon={<Receipt className="w-5 h-5 text-emerald-400" />} title="المستخلصات والدفعات (PPC)"
        subtitle={<>{selectedProject.name} — الدورة: مسودة ← الاستشاري ← المالك ← الصرف</>}
        actions={can('ppc.create') && (draft
          ? <Btn variant="ghost" onClick={() => setEditor({ open: true, draftId: draft.id })}>إكمال المسودة {draft.certificateNumber}</Btn>
          : <Btn icon={<PlusCircle className="w-4 h-4" />} onClick={() => setEditor({ open: true })}>توليد دورة جديدة</Btn>)} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><div className="text-[11px] text-slate-400">إجمالي المعتمد من المالك</div><div className="text-xl font-black text-emerald-400 font-mono" dir="ltr">{fmt(certified)} <span className="text-xs">ر.س</span></div></Card>
        <Card><div className="text-[11px] text-slate-400">صافي قيد الاعتماد</div><div className="text-xl font-black text-amber-400 font-mono" dir="ltr">{fmt(pending)} <span className="text-xs">ر.س</span></div></Card>
        <Card><div className="text-[11px] text-slate-400">محتجزات الضمان المتراكمة</div><div className="text-xl font-black text-sky-400 font-mono" dir="ltr">{fmt(retention)} <span className="text-xs">ر.س</span></div></Card>
      </div>

      <Card title={`سجل المستخلصات (${list.length})`}>
        {list.length === 0 ? <Empty text="لا توجد مستخلصات لهذا المشروع بعد" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[700px]">
              <thead className="text-slate-400 border-b border-slate-800"><tr><th className="p-2">الرقم</th><th className="p-2">الفترة</th><th className="p-2">الإجمالي</th><th className="p-2">الصافي</th><th className="p-2">الحالة</th><th className="p-2"></th></tr></thead>
              <tbody className="divide-y divide-slate-800/70">
                {list.map((p) => (
                  <tr key={p.id} data-entity={p.id} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => setOpenId(p.id)}>
                    <td className="p-2"><CodeBdi code={p.certificateNumber} className="text-amber-400 font-bold" /></td>
                    <td className="p-2 text-slate-300"><bdi dir="ltr">{p.periodStart} → {p.periodEnd}</bdi></td>
                    <td className="p-2 font-mono"><bdi dir="ltr">{fmt(p.grossAmount)}</bdi></td>
                    <td className="p-2 font-mono text-emerald-400"><bdi dir="ltr">{fmt(p.netPayableAmount)}</bdi></td>
                    <td className="p-2"><StatusBadge status={p.status} /></td>
                    <td className="p-2 text-sky-400">عرض</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {subs.length > 0 && (
        <Card title="مطابقة مستحقات مقاولي الباطن (محسوبة)">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[680px]">
              <thead className="text-slate-400 border-b border-slate-800"><tr><th className="p-2">المقاول</th><th className="p-2">قيمة العقد</th><th className="p-2">المطالبات المعتمدة</th><th className="p-2">المصروف</th><th className="p-2">خصومات (ديزل/كهرباء)</th><th className="p-2">صافي المستحق</th></tr></thead>
              <tbody className="divide-y divide-slate-800/70">
                {subs.map(({ s, approved, paid, back, net }) => (
                  <tr key={s.id}>
                    <td className="p-2 text-white font-semibold">{s.name}</td>
                    <td className="p-2 font-mono"><bdi dir="ltr">{fmt(s.contractValue)}</bdi></td>
                    <td className="p-2 font-mono text-emerald-400"><bdi dir="ltr">{fmt(approved)}</bdi></td>
                    <td className="p-2 font-mono"><bdi dir="ltr">{fmt(paid)}</bdi></td>
                    <td className="p-2 font-mono text-rose-400"><bdi dir="ltr">{fmt(back)}</bdi></td>
                    <td className="p-2 font-mono font-bold text-amber-400"><bdi dir="ltr">{fmt(net)}</bdi></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <PpcEditor open={editor.open} draftId={editor.draftId} onClose={() => setEditor({ open: false })} />
      <PpcDetail ppc={ppcs.find((p) => p.id === openId) ?? null} onClose={() => setOpenId(null)} onEdit={(id) => { setOpenId(null); setEditor({ open: true, draftId: id }); }} />
    </div>
  );
};
