import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, PlusCircle, CheckCircle2, XCircle, FileText, PackageCheck } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { MaterialRequisition } from '../../types';
import { PageHeader, Card, Modal, StatusBadge, WorkflowStepper, History, Btn, ConfirmDialog, Empty, Field, inputCls, fmt, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

const steps = ['طلب MR', 'مدير المشروع', 'أمر شراء PO', 'تأكيد المورد', 'التسليم والفاتورة', 'استلام GRN'];
const idx: Record<MaterialRequisition['status'], number> = { draft: 0, pending_pm: 1, approved: 2, po_issued: 3, supplier_confirmed: 4, delivered: 5, grn_received: 6, rejected: 1 };

export const MrDetail: React.FC<{ mr: MaterialRequisition | null; onClose: () => void }> = ({ mr, onClose }) => {
  const { can, mrAction, toast, currentUser } = usePlatform();
  const [confirm, setConfirm] = useState<null | 'pm_approve' | 'reject' | 'issue_po' | 'supplier_confirm' | 'grn'>(null);
  const [deliver, setDeliver] = useState({ open: false, dn: '', inv: '', amount: '' });
  if (!mr) return null;
  const m = mr;
  const mine = currentUser?.supplierName === m.supplierName;
  const acts = {
    pm_approve: m.status === 'pending_pm' && can('mr.pm_approve'),
    reject: m.status === 'pending_pm' && can('mr.pm_approve'),
    issue_po: m.status === 'approved' && can('mr.issue_po'),
    supplier_confirm: m.status === 'po_issued' && can('mr.supplier') && mine,
    deliver: m.status === 'supplier_confirmed' && can('mr.supplier') && mine,
    grn: m.status === 'delivered' && can('mr.grn')
  };
  const labels: Record<string, string> = { pm_approve: 'اعتماد الطلب', reject: 'رفض الطلب', issue_po: 'إصدار أمر الشراء', supplier_confirm: 'تأكيد التوريد', grn: 'تسجيل الاستلام المخزني (GRN)' };
  const run = (a: any, payload?: any) => {
    const r = mrAction(m.id, a, payload);
    toast(r.ok ? 'تم تنفيذ الإجراء' : r.error, r.ok ? 'success' : 'error');
    if (r.ok) { setConfirm(null); setDeliver({ open: false, dn: '', inv: '', amount: '' }); onClose(); }
  };
  return (
    <>
      <Modal open onClose={onClose} size="lg" title={<span className="flex items-center gap-2"><CodeBdi code={m.poNumber ?? m.reqNumber} /> <StatusBadge status={m.status} /></span>} subtitle={m.materialName}
        footer={<>
          {acts.reject && <Btn variant="danger" icon={<XCircle className="w-4 h-4" />} onClick={() => setConfirm('reject')}>رفض</Btn>}
          {acts.pm_approve && <Btn variant="success" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setConfirm('pm_approve')}>اعتماد الطلب</Btn>}
          {acts.issue_po && <Btn icon={<FileText className="w-4 h-4" />} onClick={() => setConfirm('issue_po')}>إصدار أمر الشراء</Btn>}
          {acts.supplier_confirm && <Btn variant="success" onClick={() => setConfirm('supplier_confirm')}>تأكيد التوريد</Btn>}
          {acts.deliver && <Btn variant="info" onClick={() => setDeliver({ ...deliver, open: true, amount: String(m.estimatedCost) })}>رفع إشعار التسليم والفاتورة</Btn>}
          {acts.grn && <Btn variant="success" icon={<PackageCheck className="w-4 h-4" />} onClick={() => setConfirm('grn')}>استلام مخزني GRN</Btn>}
          <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
        </>}>
        <WorkflowStepper steps={steps} current={idx[m.status]} rejected={m.status === 'rejected'} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-3">
          {[
            ['رقم الطلب', <CodeBdi code={m.reqNumber} />],
            ['الكمية', <><bdi dir="ltr" className="font-mono">{fmt(m.requestedQty)}</bdi> {m.unit}</>],
            ['التكلفة التقديرية', <bdi dir="ltr" className="font-mono">{fmt(m.estimatedCost)} ر.س</bdi>],
            ['المورد', m.supplierName],
            ['أمر الشراء', m.poNumber ? <CodeBdi code={m.poNumber} /> : '—'],
            ['إشعار التسليم', m.deliveryNoteNumber ?? '—'],
            ['الفاتورة', m.invoiceNumber ? <>{m.invoiceNumber} — <bdi dir="ltr">{fmt(m.invoiceAmount ?? 0)}</bdi></> : '—'],
            ['GRN', m.grnNumber ? <CodeBdi code={m.grnNumber} /> : '—']
          ].map(([l, v], i) => (
            <div key={i} className="p-2 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">{l}</div><div className="text-slate-200 font-semibold truncate">{v}</div></div>
          ))}
        </div>
        <div className="mt-4"><div className="text-xs font-bold text-white mb-2">سجل الإجراءات</div><History items={m.history} /></div>
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title={confirm ? labels[confirm] : ''} message={`${confirm ? labels[confirm] : ''} — ${m.reqNumber}`}
        confirmLabel={confirm ? labels[confirm] : ''} tone={confirm === 'reject' ? 'danger' : 'success'} requireNote={confirm === 'reject'}
        onConfirm={(note) => run(confirm, { note })} />
      <Modal open={deliver.open} onClose={() => setDeliver({ ...deliver, open: false })} size="sm" title="إشعار التسليم والفاتورة"
        footer={<><Btn variant="ghost" onClick={() => setDeliver({ ...deliver, open: false })}>إلغاء</Btn><Btn onClick={() => run('deliver', { deliveryNoteNumber: deliver.dn, invoiceNumber: deliver.inv, invoiceAmount: Number(deliver.amount) })}>إرسال</Btn></>}>
        <div className="space-y-3">
          <Field label="رقم إشعار التسليم"><input className={inputCls} value={deliver.dn} onChange={(e) => setDeliver({ ...deliver, dn: e.target.value })} /></Field>
          <Field label="رقم الفاتورة"><input className={inputCls} value={deliver.inv} onChange={(e) => setDeliver({ ...deliver, inv: e.target.value })} /></Field>
          <Field label="مبلغ الفاتورة (ر.س)"><input type="number" className={`${inputCls} font-mono text-left`} value={deliver.amount} onChange={(e) => setDeliver({ ...deliver, amount: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  );
};

interface Props { onOpenNewMaterialModal: () => void }

export const ProcurementInventory: React.FC<Props> = ({ onOpenNewMaterialModal }) => {
  const { materialReqs, selectedProjectId, selectedProject, can, focus, boqItems } = usePlatform();
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  useEffect(() => { if (focus?.tab === 'procurement') setOpenId(focus.id); }, [focus]);
  useFocusHighlight(focus?.tab === 'procurement' ? focus.id : undefined, focus?.nonce);

  const reqs = useMemo(() => materialReqs.filter((m) => m.projectId === selectedProjectId), [materialReqs, selectedProjectId]);
  const list = reqs.filter((m) => filter === 'all' || m.status === filter);
  const open = reqs.filter((m) => !['grn_received', 'rejected'].includes(m.status));
  const committed = reqs.filter((m) => ['po_issued', 'supplier_confirmed', 'delivered', 'grn_received'].includes(m.status)).reduce((a, m) => a + m.estimatedCost, 0);
  const avgWaste = reqs.length ? reqs.reduce((a, m) => a + m.wastagePercentage, 0) / reqs.length : 0;

  return (
    <div className="space-y-4">
      <PageHeader icon={<ShoppingBag className="w-5 h-5 text-sky-400" />} title="المشتريات وطلبات المواد"
        subtitle={<>{selectedProject.name} — الدورة: MR ← مدير المشروع ← PO ← المورد ← GRN</>}
        actions={can('mr.create') && <Btn icon={<PlusCircle className="w-4 h-4" />} onClick={onOpenNewMaterialModal}>طلب مواد جديد</Btn>} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><div className="text-[11px] text-slate-400">طلبات مفتوحة</div><div className="text-xl font-black font-mono text-white">{open.length}</div></Card>
        <Card><div className="text-[11px] text-slate-400">قيمة أوامر الشراء الملتزم بها</div><div className="text-xl font-black font-mono text-sky-400" dir="ltr">{fmt(committed)} <span className="text-xs">ر.س</span></div></Card>
        <Card><div className="text-[11px] text-slate-400">متوسط نسبة الفاقد المقدرة</div><div className="text-xl font-black font-mono text-emerald-400" dir="ltr">{avgWaste.toFixed(1)}%</div><div className="text-[10px] text-slate-400">الحد المسموح بالعقد 3.0%</div></Card>
      </div>
      <Card title={`الطلبات وأوامر الشراء (${list.length})`} actions={
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputCls} w-44`}>
          <option value="all">كل الحالات</option>
          {Object.keys(idx).filter((k) => k !== 'draft').map((k) => <option key={k} value={k}>{statusLabel(k)}</option>)}
        </select>
      }>
        {list.length === 0 ? <Empty text="لا توجد طلبات" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[820px]">
              <thead className="text-slate-400 border-b border-slate-800"><tr><th className="p-2">الطلب / PO</th><th className="p-2">البند</th><th className="p-2">الكمية</th><th className="p-2">التكلفة</th><th className="p-2">المورد</th><th className="p-2">الحالة</th></tr></thead>
              <tbody className="divide-y divide-slate-800/70">
                {list.map((m) => (
                  <tr key={m.id} data-entity={m.id} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => setOpenId(m.id)}>
                    <td className="p-2"><CodeBdi code={m.reqNumber} className="text-amber-400 font-bold" />{m.poNumber && <div><CodeBdi code={m.poNumber} className="text-sky-400 text-[10px]" /></div>}</td>
                    <td className="p-2 text-slate-200 max-w-[260px] truncate"><b className="font-mono text-slate-400 ml-1" dir="ltr">{boqItems.find((b) => b.id === m.boqItemId)?.code}</b>{m.materialName}</td>
                    <td className="p-2 font-mono whitespace-nowrap"><bdi dir="ltr">{fmt(m.requestedQty)}</bdi> {m.unit}</td>
                    <td className="p-2 font-mono"><bdi dir="ltr">{fmt(m.estimatedCost)}</bdi></td>
                    <td className="p-2 text-slate-300">{m.supplierName}</td>
                    <td className="p-2"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <MrDetail mr={materialReqs.find((m) => m.id === openId) ?? null} onClose={() => setOpenId(null)} />
    </div>
  );
};

function statusLabel(s: string) {
  const m: Record<string, string> = { pending_pm: 'بانتظار مدير المشروع', approved: 'معتمد', po_issued: 'صدر PO', supplier_confirmed: 'أكد المورد', delivered: 'تم التسليم', grn_received: 'مستلم', rejected: 'مرفوض' };
  return m[s] ?? s;
}
