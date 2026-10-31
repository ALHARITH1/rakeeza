import React, { useEffect, useMemo, useState } from 'react';
import { Camera, ShieldCheck, ShieldX, Trash2 } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Modal, Field, inputCls, Btn, fmt } from '../common/ui';

interface Props { isOpen: boolean; onClose: () => void }

/** Downscale a photo to a small JPEG thumbnail so it fits in local storage */
const toThumb = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 360;
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = reject;
    img.src = url;
  });

const today = () => new Date().toISOString().slice(0, 10);

export const NewDprModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { boqItems, dprs, selectedProject, selectedProjectId, saveDpr, validPtwFor, toast, openItem } = usePlatform();
  const items = useMemo(() => boqItems.filter((b) => b.projectId === selectedProjectId), [boqItems, selectedProjectId]);
  const ptw = validPtwFor(selectedProjectId);

  const blank = () => ({ date: today(), sector: '', weatherCondition: 'مشمس', tempC: '' as number | '', workforceCount: '' as number | '', equipmentCount: '' as number | '', siteNotes: '' });
  const [f, setF] = useState(blank);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => { if (isOpen) { setF(blank()); setQty({}); setPhotos([]); setErr(''); } }, [isOpen, selectedProjectId]);

  const pending = (id: string) => dprs.filter((r) => !r.posted && r.status !== 'rejected' && r.status !== 'draft')
    .reduce((a, r) => a + (r.itemsExecuted.find((i) => i.boqItemId === id)?.quantity ?? 0), 0);

  const submit = (send: boolean) => {
    setErr('');
    const r = saveDpr({
      date: f.date, sector: f.sector, weatherCondition: f.weatherCondition, tempC: Number(f.tempC) || 0,
      workforceCount: Number(f.workforceCount) || 0, equipmentCount: Number(f.equipmentCount) || 0, siteNotes: f.siteNotes,
      items: items.map((b) => ({ boqItemId: b.id, quantity: Number(qty[b.id]) || 0 })), photos
    }, send);
    if (!r.ok) { setErr(r.error); return; }
    toast(send ? 'تم رفع التقرير لمدير المشروع — الكميات لن تُرحّل إلا بعد اعتماد الاستشاري' : 'تم حفظ التقرير كمسودة');
    onClose();
    if (r.id) openItem('dpr', r.id);
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="lg" title="تقرير ميداني يومي جديد (DPR)" subtitle={selectedProject.name}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn variant="ghost" onClick={() => submit(false)}>حفظ كمسودة</Btn>
        <Btn disabled={!ptw} onClick={() => submit(true)} title={!ptw ? 'لا يوجد تصريح عمل ساري' : ''}>رفع لمدير المشروع</Btn>
      </>}>
      <div className={`flex items-center gap-2 text-xs rounded-lg p-2 mb-3 border ${ptw ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-300 bg-rose-500/10 border-rose-500/30'}`}>
        {ptw ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}
        {ptw ? <>تصريح العمل الساري: <b dir="ltr" className="font-mono">{ptw.permitNumber}</b> — صالح حتى <bdi dir="ltr">{ptw.validUntil}</bdi></> : 'لا يوجد تصريح عمل (PTW) ساري لهذا المشروع — يمكنك الحفظ كمسودة فقط حتى يصدر مسؤول السلامة تصريحاً'}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="تاريخ التقرير"><input type="date" max={today()} className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="القطاع / موقع العمل" className="col-span-2"><input className={inputCls} value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })} placeholder="مثال: شارع التخصصي - المقطع 05" /></Field>
        <Field label="حالة الطقس">
          <select className={inputCls} value={f.weatherCondition} onChange={(e) => setF({ ...f, weatherCondition: e.target.value })}>
            {['مشمس', 'غائم جزئياً', 'رياح نشطة', 'غبار / عاصفة رملية', 'أمطار', 'حرارة شديدة'].map((w) => <option key={w}>{w}</option>)}
          </select>
        </Field>
        <Field label="الحرارة °C"><input type="number" className={inputCls} value={f.tempC} onChange={(e) => setF({ ...f, tempC: e.target.value === '' ? '' : Number(e.target.value) })} /></Field>
        <Field label="العمالة بالموقع"><input type="number" min={0} className={inputCls} value={f.workforceCount} onChange={(e) => setF({ ...f, workforceCount: e.target.value === '' ? '' : Number(e.target.value) })} /></Field>
        <Field label="المعدات العاملة"><input type="number" min={0} className={inputCls} value={f.equipmentCount} onChange={(e) => setF({ ...f, equipmentCount: e.target.value === '' ? '' : Number(e.target.value) })} /></Field>
      </div>

      <div className="mt-4">
        <div className="text-xs font-bold text-white mb-2">الكميات المنفذة اليوم — كل بنود المشروع ({items.length})</div>
        <div className="space-y-1.5">
          {items.map((b) => {
            const room = b.contractQty - b.executedQty - pending(b.id);
            const v = Number(qty[b.id]) || 0;
            return (
              <div key={b.id} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border ${v > room ? 'border-rose-500/50 bg-rose-500/5' : 'border-slate-800 bg-slate-950'}`}>
                <div className="col-span-12 sm:col-span-7 min-w-0">
                  <div className="text-[11px] text-slate-200 truncate" title={b.description}><b className="text-amber-400 font-mono ml-1" dir="ltr">{b.code}</b>{b.description}</div>
                  <div className="text-[10px] text-slate-400">المتبقي من العقد: <bdi dir="ltr" className="font-mono">{fmt(room)}</bdi> {b.unit}</div>
                </div>
                <div className="col-span-12 sm:col-span-5 flex items-center gap-1.5">
                  <input type="number" min={0} max={room} inputMode="decimal" placeholder="0" aria-label={`كمية ${b.code}`}
                    className={`${inputCls} text-left font-mono`} value={qty[b.id] ?? ''} onChange={(e) => setQty({ ...qty, [b.id]: e.target.value })} />
                  <span className="text-[11px] text-slate-400 w-10 shrink-0">{b.unit}</span>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <div className="text-xs text-slate-400">لا توجد بنود لهذا المشروع — أضفها من جدول الكميات أولاً.</div>}
        </div>
      </div>

      <Field label="ملاحظات الموقع" className="mt-4">
        <textarea rows={3} className={inputCls} value={f.siteNotes} onChange={(e) => setF({ ...f, siteNotes: e.target.value })} />
      </Field>

      <div className="mt-3">
        <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200">
          <Camera className="w-4 h-4" /> إرفاق صور ({photos.length}/6)
          <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 6 - photos.length);
            try { const t = await Promise.all(files.map(toThumb)); setPhotos((p) => [...p, ...t]); } catch { toast('تعذر قراءة الصورة', 'error'); }
            e.target.value = '';
          }} />
        </label>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} alt={`صورة ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -top-1.5 -left-1.5 bg-rose-600 rounded-full p-1" aria-label="حذف الصورة"><Trash2 className="w-3 h-3 text-white" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      {err && <div className="text-xs text-rose-400 mt-3 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2" role="alert">{err}</div>}
    </Modal>
  );
};
