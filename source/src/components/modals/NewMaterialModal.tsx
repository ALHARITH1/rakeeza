import React, { useEffect, useMemo, useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Modal, Field, inputCls, Btn, fmt } from '../common/ui';

interface Props { isOpen: boolean; onClose: () => void }

const suppliers = [
  'شركة مصنع الرياض للأنابيب البلاستيكية',
  'كسارات الدهناء والتوريدات العامة',
  'مصنع كابلات الرياض',
  'الشركة السعودية لمنتجات الخرسانة'
];

export const NewMaterialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { boqItems, selectedProjectId, selectedProject, addMaterialReq, materialRemaining, toast, openItem } = usePlatform();
  const items = useMemo(() => boqItems.filter((b) => b.projectId === selectedProjectId), [boqItems, selectedProjectId]);
  const [boqId, setBoqId] = useState('');
  const [qty, setQty] = useState('');
  const [supplier, setSupplier] = useState(suppliers[0]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (isOpen) { setBoqId(items[0]?.id ?? ''); setQty(''); setNote(''); setErr(''); } }, [isOpen, items]);

  const b = items.find((x) => x.id === boqId);
  const remaining = b ? materialRemaining(b.id) : 0;
  const q = Number(qty) || 0;
  const unitCost = b?.costBreakdown.material ?? 0;
  const over = q > remaining;

  const submit = () => {
    setErr('');
    const r = addMaterialReq({ boqItemId: boqId, requestedQty: q, supplierName: supplier, note });
    if (!r.ok) { setErr(r.error); return; }
    toast('تم رفع طلب المواد لمدير المشروع');
    onClose();
    if (r.id) openItem('procurement', r.id);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="طلب مواد جديد (MR)" subtitle={selectedProject.name}
      footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn disabled={!b || q <= 0 || over} onClick={submit}>رفع لمدير المشروع</Btn></>}>
      <div className="space-y-3">
        <Field label="البند من جدول الكميات" hint="البند يحدد المادة والوحدة والمتبقي تلقائياً">
          <select className={inputCls} value={boqId} onChange={(e) => setBoqId(e.target.value)}>
            {items.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.description.slice(0, 70)}</option>)}
          </select>
        </Field>
        {b && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">الوحدة</div><b className="text-white">{b.unit}</b></div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">المتبقي المتاح للطلب</div><b className="text-emerald-400 font-mono" dir="ltr">{fmt(remaining)}</b></div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">تكلفة المادة للوحدة</div><b className="text-white font-mono" dir="ltr">{fmt(unitCost)}</b></div>
          </div>
        )}
        <Field label={`الكمية المطلوبة (${b?.unit ?? ''})`} error={over ? `تتجاوز المتبقي (${fmt(remaining)} ${b?.unit})` : undefined}>
          <input type="number" min={0} max={remaining} className={`${inputCls} font-mono text-left`} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="المورد المقترح">
          <select className={inputCls} value={supplier} onChange={(e) => setSupplier(e.target.value)}>{suppliers.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="ملاحظات (اختياري)"><textarea rows={2} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="flex justify-between text-xs bg-slate-950 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400">التكلفة التقديرية (الكمية × تكلفة الوحدة)</span>
          <b className="font-mono text-amber-400" dir="ltr">{fmt(q * unitCost)} ر.س</b>
        </div>
        {err && <div className="text-xs text-rose-400" role="alert">{err}</div>}
      </div>
    </Modal>
  );
};
