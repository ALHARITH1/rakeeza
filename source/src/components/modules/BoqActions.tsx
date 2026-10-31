import React, { useState } from 'react';
import { FolderPlus, PlusCircle, FileUp, Download } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { BoqItem } from '../../types';
import { Modal, Field, inputCls, Btn, fmt } from '../common/ui';

type Row = { code: string; description: string; unit: string; contractQty: number; unitPrice: number };

/** Map common Arabic / English header names to our fields */
const headerMap: Record<string, keyof Row> = {
  'الرمز': 'code', 'رقم البند': 'code', 'البند': 'code', code: 'code', item: 'code',
  'الوصف': 'description', 'وصف البند': 'description', description: 'description',
  'الوحدة': 'unit', unit: 'unit',
  'الكمية': 'contractQty', 'الكمية التعاقدية': 'contractQty', qty: 'contractQty', quantity: 'contractQty',
  'سعر الوحدة': 'unitPrice', 'السعر الإفرادي': 'unitPrice', 'السعر': 'unitPrice', rate: 'unitPrice', 'unit price': 'unitPrice', price: 'unitPrice'
};

export const BoqActions: React.FC = () => {
  const { can, addProject, addBoqItem, importBoqRows, selectedProjectId, selectedProject, toast, focus, openItem } = usePlatform();
  React.useEffect(() => {
    if (focus?.tab !== 'boq') return;
    if (focus.id === 'new-project') setModal('project');
    if (focus.id === 'new-item') setModal('item');
    if (focus.id === 'import') setModal('import');
  }, [focus]); // eslint-disable-line
  const [modal, setModal] = useState<null | 'project' | 'item' | 'import'>(null);
  const [err, setErr] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [p, setP] = useState({ name: '', code: '', client: '', consultant: '', location: '', startDate: today, endDate: '' });
  const [it, setIt] = useState({ code: '', description: '', unit: 'م.ط', contractQty: '', unitPrice: '', cbsCategory: 'civil' as BoqItem['cbsCategory'] });
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState('');

  const close = () => { setModal(null); setErr(''); setRows([]); setFileName(''); };

  const parseFile = async (f?: File) => {
    if (!f) return;
    setErr(''); setFileName(f.name);
    try {
      const XLSX = await import('xlsx');
      const wb = /\.csv$/i.test(f.name) ? XLSX.read((await f.text()).replace(/^\uFEFF/, ''), { type: 'string' }) : XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      const out: Row[] = raw.map((r) => {
        const o: any = {};
        Object.entries(r).forEach(([k, v]) => {
          const key = headerMap[String(k).trim().toLowerCase()] ?? headerMap[String(k).trim()];
          if (key) o[key] = v;
        });
        return {
          code: String(o.code ?? '').trim(), description: String(o.description ?? '').trim(), unit: String(o.unit ?? '').trim(),
          contractQty: Number(String(o.contractQty).replace(/,/g, '')) || 0, unitPrice: Number(String(o.unitPrice).replace(/,/g, '')) || 0
        };
      }).filter((r) => r.code || r.description);
      if (!out.length) setErr('لم يتم التعرف على الأعمدة. استخدم العناوين: الرمز، الوصف، الوحدة، الكمية، سعر الوحدة');
      setRows(out);
    } catch {
      setErr('تعذر قراءة الملف. تأكد أنه ملف Excel (.xlsx / .xls) أو CSV');
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([['الرمز', 'الوصف', 'الوحدة', 'الكمية', 'سعر الوحدة'], ['4.01', 'مثال: حفر خنادق بعمق 1.5م', 'م.ط', 1000, 110]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
    XLSX.writeFile(wb, 'BOQ-template.xlsx');
  };

  return (
    <>
      {can('project.create') && <Btn variant="ghost" icon={<FolderPlus className="w-3.5 h-3.5 text-amber-400" />} onClick={() => setModal('project')}>مشروع جديد</Btn>}
      {can('boq.edit') && selectedProjectId && <Btn variant="ghost" icon={<PlusCircle className="w-3.5 h-3.5 text-sky-400" />} onClick={() => setModal('item')}>إضافة بند</Btn>}
      {can('boq.edit') && selectedProjectId && <Btn variant="ghost" icon={<FileUp className="w-3.5 h-3.5 text-emerald-400" />} onClick={() => setModal('import')}>استيراد من Excel</Btn>}

      <Modal open={modal === 'project'} onClose={close} title="مشروع جديد"
        footer={<><Btn variant="ghost" onClick={close}>إلغاء</Btn><Btn onClick={() => { setErr(''); const r = addProject(p); if (!r.ok) setErr(r.error); else { toast('تم إنشاء المشروع — الخطوة التالية: بنود جدول الكميات'); close(); setP({ ...p, name: '', code: '' }); setTimeout(() => openItem('boq', 'import'), 50); } }}>إنشاء</Btn></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="اسم المشروع" className="sm:col-span-2"><input className={inputCls} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
          <Field label="رمز المشروع (يظهر في أرقام المستندات)" hint="مثال: NEOM أو RYD2"><input className={inputCls} dir="ltr" value={p.code} onChange={(e) => setP({ ...p, code: e.target.value.toUpperCase().slice(0, 6) })} /></Field>
          <Field label="الموقع"><input className={inputCls} value={p.location} onChange={(e) => setP({ ...p, location: e.target.value })} /></Field>
          <Field label="المالك"><input className={inputCls} value={p.client} onChange={(e) => setP({ ...p, client: e.target.value })} /></Field>
          <Field label="الاستشاري"><input className={inputCls} value={p.consultant} onChange={(e) => setP({ ...p, consultant: e.target.value })} /></Field>
          <Field label="تاريخ البداية"><input type="date" className={inputCls} value={p.startDate} onChange={(e) => setP({ ...p, startDate: e.target.value })} /></Field>
          <Field label="تاريخ النهاية التعاقدي"><input type="date" className={inputCls} value={p.endDate} onChange={(e) => setP({ ...p, endDate: e.target.value })} /></Field>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">قيمة العقد تُحسب تلقائياً = مجموع البنود + أوامر التغيير المعتمدة.</p>
        {err && <div className="text-xs text-rose-400 mt-2" role="alert">{err}</div>}
      </Modal>

      <Modal open={modal === 'item'} onClose={close} title="إضافة بند" subtitle={selectedProject.name}
        footer={<><Btn variant="ghost" onClick={close}>إلغاء</Btn><Btn onClick={() => { setErr(''); const r = addBoqItem({ projectId: selectedProjectId, code: it.code, description: it.description, unit: it.unit, contractQty: Number(it.contractQty), unitPrice: Number(it.unitPrice), cbsCategory: it.cbsCategory }); if (!r.ok) setErr(r.error); else { toast('تمت إضافة البند'); close(); setIt({ ...it, code: '', description: '', contractQty: '', unitPrice: '' }); } }}>إضافة</Btn></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="رمز البند"><input className={inputCls} dir="ltr" value={it.code} onChange={(e) => setIt({ ...it, code: e.target.value })} /></Field>
          <Field label="الوحدة"><input className={inputCls} value={it.unit} onChange={(e) => setIt({ ...it, unit: e.target.value })} /></Field>
          <Field label="الوصف" className="col-span-2"><textarea rows={2} className={inputCls} value={it.description} onChange={(e) => setIt({ ...it, description: e.target.value })} /></Field>
          <Field label="الكمية التعاقدية"><input type="number" className={`${inputCls} font-mono text-left`} value={it.contractQty} onChange={(e) => setIt({ ...it, contractQty: e.target.value })} /></Field>
          <Field label="سعر الوحدة (ر.س)"><input type="number" className={`${inputCls} font-mono text-left`} value={it.unitPrice} onChange={(e) => setIt({ ...it, unitPrice: e.target.value })} /></Field>
          <Field label="التصنيف (CBS)" className="col-span-2">
            <select className={inputCls} value={it.cbsCategory} onChange={(e) => setIt({ ...it, cbsCategory: e.target.value as any })}>
              <option value="civil">أعمال مدنية</option><option value="electrical">كهرباء</option><option value="infrastructure">بنية تحتية</option><option value="mechanical">ميكانيكا</option>
            </select>
          </Field>
        </div>
        <div className="text-xs text-slate-300 mt-3">الإجمالي: <bdi dir="ltr" className="font-mono text-amber-400">{fmt((Number(it.contractQty) || 0) * (Number(it.unitPrice) || 0))} ر.س</bdi></div>
        {err && <div className="text-xs text-rose-400 mt-2" role="alert">{err}</div>}
      </Modal>

      <Modal open={modal === 'import'} onClose={close} size="lg" title="استيراد جدول الكميات من Excel" subtitle={selectedProject.name}
        footer={<><Btn variant="ghost" onClick={close}>إلغاء</Btn><Btn disabled={!rows.length} onClick={() => { const r = importBoqRows(selectedProjectId, rows); if (!r.ok) setErr(r.error); else { toast(`تم استيراد ${(r as any).count} بند (البنود المكررة بنفس الرمز تم تجاهلها)`); close(); } }}>استيراد {rows.length || ''} بند</Btn></>}>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
            <FileUp className="w-4 h-4" /> اختيار ملف Excel / CSV
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => parseFile(e.target.files?.[0])} />
          </label>
          <Btn variant="ghost" icon={<Download className="w-3.5 h-3.5" />} onClick={downloadTemplate}>تحميل القالب</Btn>
          {fileName && <span className="text-xs text-slate-400">{fileName}</span>}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">الأعمدة المطلوبة: الرمز، الوصف، الوحدة، الكمية، سعر الوحدة.</p>
        {rows.length > 0 && (
          <div className="overflow-x-auto mt-3 max-h-72">
            <table className="w-full text-right text-xs min-w-[600px]">
              <thead className="text-slate-400 border-b border-slate-800"><tr><th className="p-1.5">الرمز</th><th className="p-1.5">الوصف</th><th className="p-1.5">الوحدة</th><th className="p-1.5">الكمية</th><th className="p-1.5">السعر</th></tr></thead>
              <tbody className="divide-y divide-slate-800/70">
                {rows.map((r, i) => {
                  const bad = !r.code || !r.description || !r.unit || r.contractQty <= 0 || r.unitPrice <= 0;
                  return <tr key={i} className={bad ? 'text-rose-400' : 'text-slate-200'}><td className="p-1.5 font-mono">{r.code}</td><td className="p-1.5">{r.description}</td><td className="p-1.5">{r.unit}</td><td className="p-1.5 font-mono">{fmt(r.contractQty)}</td><td className="p-1.5 font-mono">{fmt(r.unitPrice)}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
        {err && <div className="text-xs text-rose-400 mt-2" role="alert">{err}</div>}
      </Modal>
    </>
  );
};
