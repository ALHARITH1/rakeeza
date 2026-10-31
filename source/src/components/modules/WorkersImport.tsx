import React, { useState } from 'react';
import { FileUp, Download } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Modal, Btn } from '../common/ui';

type Row = { name: string; idNumber: string; nationality: string; role: string; joinDate?: string; basicSalary?: number; housingAllowance?: number; transportAllowance?: number; idExpiry?: string; insuranceExpiry?: string };

const map: Record<string, keyof Row> = {
  'الاسم': 'name', 'اسم الموظف': 'name', name: 'name',
  'رقم الهوية': 'idNumber', 'رقم الإقامة': 'idNumber', 'رقم الهوية / الإقامة': 'idNumber', 'الهوية/الإقامة': 'idNumber', id: 'idNumber', iqama: 'idNumber',
  'الجنسية': 'nationality', nationality: 'nationality',
  'المهنة': 'role', 'الوظيفة': 'role', 'المسمى': 'role', role: 'role',
  'تاريخ المباشرة': 'joinDate', 'join date': 'joinDate',
  'الراتب الأساسي': 'basicSalary', 'الأساسي': 'basicSalary', basic: 'basicSalary',
  'بدل السكن': 'housingAllowance', 'السكن': 'housingAllowance',
  'بدل النقل': 'transportAllowance', 'النقل': 'transportAllowance',
  'انتهاء الإقامة': 'idExpiry', 'انتهاء الهوية': 'idExpiry',
  'انتهاء التأمين': 'insuranceExpiry', 'انتهاء التأمين الطبي': 'insuranceExpiry'
};

const HEAD = ['الاسم', 'رقم الهوية / الإقامة', 'الجنسية', 'المهنة', 'تاريخ المباشرة', 'الراتب الأساسي', 'بدل السكن', 'بدل النقل', 'انتهاء الإقامة', 'انتهاء التأمين'];
const SAMPLE = ['محمد أحمد (مثال — احذفه)', '2xxxxxxxxx', 'مصري', 'فني كهرباء', '2026-11-01', 4000, 1000, 400, '2027-11-01', '2027-11-01'];

const toIso = (v: unknown) => {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10); // Excel serial date
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
};

export const WorkersImport: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { importWorkers, toast, allowedProjects } = usePlatform();
  const [pid, setPid] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [skipped, setSkipped] = useState<{ row: number; reason: string }[]>([]);

  const parse = async (f?: File) => {
    if (!f) return;
    setErr(''); setSkipped([]);
    try {
      const XLSX = await import('xlsx');
      const wb = /\.csv$/i.test(f.name) ? XLSX.read((await f.text()).replace(/^\uFEFF/, ''), { type: 'string' }) : XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true });
      const out = raw.map((r) => {
        const o: any = {};
        Object.entries(r).forEach(([k, v]) => { const key = map[String(k).trim()] ?? map[String(k).trim().toLowerCase()]; if (key) o[key] = v; });
        return {
          name: String(o.name ?? '').trim(), idNumber: String(o.idNumber ?? '').trim(), nationality: String(o.nationality ?? '').trim(), role: String(o.role ?? '').trim(),
          joinDate: toIso(o.joinDate), basicSalary: Number(o.basicSalary) || 0, housingAllowance: Number(o.housingAllowance) || 0, transportAllowance: Number(o.transportAllowance) || 0,
          idExpiry: toIso(o.idExpiry), insuranceExpiry: toIso(o.insuranceExpiry)
        } as Row;
      }).filter((r) => r.name || r.idNumber);
      if (!out.length) setErr('ما تعرفت على الأعمدة — استخدم القالب');
      setRows(out);
    } catch { setErr('تعذر قراءة الملف'); }
  };

  const template = async () => {
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet([HEAD, SAMPLE]);
      ws['!cols'] = HEAD.map((h) => ({ wch: Math.max(14, h.length + 4) }));
      const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] } as any;
      XLSX.utils.book_append_sheet(wb, ws, 'الموظفين');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a'); a.href = url; a.download = 'employees-template.xlsx'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast('تم تنزيل القالب — لو ما نزل، انسخ الأعمدة من الجدول تحت والصقها في Excel', 'info');
    } catch { toast('تعذر التنزيل — انسخ الأعمدة من الجدول تحت', 'error'); }
  };
  const copyTemplate = () => {
    navigator.clipboard?.writeText([HEAD, SAMPLE].map((r) => r.join('\t')).join('\n'));
    toast('تم نسخ أعمدة القالب — الصقها في أول خلية في Excel');
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setRows([]); setErr(''); setSkipped([]); }} size="lg" title="استيراد الموظفين من Excel" subtitle="الموظفين يتسجلون على الشركة، وربطهم بمشروع اختياري"
      footer={<><Btn variant="ghost" onClick={onClose}>إغلاق</Btn><Btn disabled={!rows.length} onClick={() => {
        const r = importWorkers(rows, pid);
        setSkipped(r.skipped);
        if (r.added) { toast(`تم استيراد ${r.added} موظف${r.skipped.length ? ` — وتجاهل ${r.skipped.length} صف` : ''}`); if (!r.skipped.length) { setRows([]); onClose(); } }
        else setErr(r.error ?? 'لم يُضف أحد');
      }}>استيراد {rows.length || ''} موظف</Btn></>}>
      <div className="flex flex-wrap gap-2 items-center">
        <label className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
          <FileUp className="w-4 h-4" /> اختيار ملف Excel
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { parse(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <Btn variant="info" icon={<Download className="w-3.5 h-3.5" />} onClick={template}>تحميل قالب الموظفين (Excel)</Btn>
        <select value={pid} onChange={(e) => setPid(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white" aria-label="المشروع">
          <option value="">بدون مشروع (على الشركة)</option>
          {allowedProjects.map((p) => <option key={p.id} value={p.id}>إسنادهم إلى: {p.name}</option>)}
        </select>
      </div>
      <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white">قالب الموظفين (أعمدة ملف Excel بالترتيب)</span>
          <button type="button" onClick={copyTemplate} className="text-[11px] text-sky-400 hover:underline">نسخ الأعمدة</button>
        </div>
        <div className="overflow-x-auto">
          <table className="text-[11px] min-w-[760px] w-full text-right">
            <thead><tr>{HEAD.map((h) => <th key={h} className="p-1.5 bg-emerald-600/20 text-emerald-200 border border-slate-800 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody><tr>{SAMPLE.map((v, i) => <td key={i} className="p-1.5 border border-slate-800 text-slate-400 whitespace-nowrap">{v}</td>)}</tr></tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-2">الأعمدة: الاسم، رقم الهوية / الإقامة (10 أرقام)، الجنسية، المهنة، تاريخ المباشرة، الراتب الأساسي، بدل السكن، بدل النقل، انتهاء الإقامة، انتهاء التأمين. بعد الاستيراد كل موظف يقدر يسجل حضوره من بوابة الحضور برقم هويته.</p>
      {rows.length > 0 && (
        <div className="overflow-x-auto mt-3 max-h-72">
          <table className="w-full text-right text-xs min-w-[640px]">
            <thead className="text-slate-400 border-b border-slate-800"><tr><th className="p-1.5">الاسم</th><th className="p-1.5">الهوية/الإقامة</th><th className="p-1.5">الجنسية</th><th className="p-1.5">المهنة</th><th className="p-1.5">الأساسي</th></tr></thead>
            <tbody className="divide-y divide-slate-800/70">
              {rows.map((r, i) => {
                const bad = !r.name || !/^[12]\d{9}$/.test(r.idNumber.replace(/\D/g, ''));
                return <tr key={i} className={bad ? 'text-rose-400' : 'text-slate-200'}><td className="p-1.5">{r.name}</td><td className="p-1.5 font-mono" dir="ltr">{r.idNumber}</td><td className="p-1.5">{r.nationality}</td><td className="p-1.5">{r.role}</td><td className="p-1.5 font-mono">{r.basicSalary}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
      {skipped.length > 0 && <div className="text-xs text-amber-300 mt-3">صفوف متجاهلة: {skipped.map((s) => `صف ${s.row} (${s.reason})`).join('، ')}</div>}
      {err && <div className="text-xs text-rose-400 mt-2" role="alert">{err}</div>}
    </Modal>
  );
};
