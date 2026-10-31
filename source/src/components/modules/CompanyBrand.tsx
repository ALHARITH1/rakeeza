import React, { useEffect, useState } from 'react';
import { Palette, Upload, Wand2, Trash2, Building2, Save } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { extractBrandColor, readLogo, DEFAULT_BRAND_COLOR, brandPalette } from '../../store/brand';
import { PageHeader, Card, Field, inputCls, Btn } from '../common/ui';

/** Company identity: name, CR, logo and brand colour — the whole platform re-themes from it */
export const CompanyBrand: React.FC = () => {
  const { onlineMode, company, updateCompany, toast, can, allowedProjects, openItem } = usePlatform();
  const hasProjects = allowedProjects.length > 0;
  const [name, setName] = useState('');
  const [cr, setCr] = useState('');
  const [logo, setLogo] = useState<string | undefined>();
  const [color, setColor] = useState(DEFAULT_BRAND_COLOR);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setName(company?.name ?? ''); setCr(company?.crNumber ?? ''); setLogo(company?.logoDataUrl); setColor(company?.brandColor ?? DEFAULT_BRAND_COLOR);
  }, [company?.id]); // eslint-disable-line
  if (!company) return null;
  const editable = can('users.manage');
  const pal = brandPalette(color);
  const dirty = name !== company.name || cr !== company.crNumber || logo !== company.logoDataUrl || color !== (company.brandColor ?? DEFAULT_BRAND_COLOR);

  const onLogo = async (f?: File) => {
    if (!f) return;
    if (onlineMode && f.type === 'image/svg+xml') { toast('استخدم شعار PNG أو JPEG أو WebP في النسخة المتصلة', 'error'); return; }
    if (f.size > 2_000_000) { toast('حجم الشعار يجب أن يكون أقل من 2MB', 'error'); return; }
    setBusy(true);
    try {
      const url = await readLogo(f);
      setLogo(url);
      setColor(await extractBrandColor(url));
      toast('تم استخراج لون الهوية من الشعار تلقائياً — راجع المعاينة واضغط حفظ', 'info');
    } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={<Palette className="w-5 h-5 text-amber-400" />} title="هوية الشركة"
        subtitle="ارفع شعار شركتك، والمنصة كاملة تاخذ اسمك ولون هويتك تلقائياً — الواجهة، بوابة الحضور، والتقارير المطبوعة" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={<><Building2 className="w-4 h-4 text-amber-400" /> بيانات الهوية</>}>
          <fieldset disabled={!editable} className="space-y-3">
            <Field label="اسم الشركة (يظهر في كل المنصة والتقارير)"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="رقم السجل التجاري"><input className={inputCls} dir="ltr" value={cr} onChange={(e) => setCr(e.target.value)} /></Field>
            <div>
              <span className="text-[11px] font-semibold text-slate-300">الشعار</span>
              <div className="mt-1 flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                  {logo ? <img src={logo} alt="شعار الشركة" className="max-w-full max-h-full object-contain" /> : <Building2 className="w-8 h-8 text-slate-400" />}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> {busy ? 'جاري المعالجة...' : logo ? 'تغيير الشعار' : 'رفع الشعار'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                  {logo && <button type="button" onClick={() => { setLogo(undefined); setColor(DEFAULT_BRAND_COLOR); }} className="text-[11px] text-rose-400 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> إزالة الشعار</button>}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{onlineMode ? 'PNG أو JPEG أو WebP. تأكيد الحفظ على الخادم يظهر أعلى الصفحة.' : 'PNG أو SVG بخلفية شفافة يعطي أفضل نتيجة.'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300">لون الهوية</span>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-lg bg-transparent border border-slate-700 cursor-pointer" aria-label="لون الهوية" />
                <bdi dir="ltr" className="font-mono text-xs text-slate-300">{color}</bdi>
                {logo && <Btn type="button" variant="ghost" icon={<Wand2 className="w-3.5 h-3.5" />} onClick={async () => setColor(await extractBrandColor(logo))}>استخراج من الشعار</Btn>}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">يُستخرج تلقائياً من الشعار، وتقدر تعدله يدوياً. درجاته تُضبط آلياً عشان تبقى واضحة على الخلفية الداكنة.</p>
            </div>
          </fieldset>
          {editable && (
            <div className="flex justify-end gap-2 mt-4">
              {!dirty && <span className="text-[11px] text-emerald-400 self-center ml-auto">{onlineMode ? '✓ الهوية مطبقة محليًا؛ راجع حالة الحفظ أعلى الصفحة' : '✓ الهوية محفوظة ومطبقة'}</span>}
              {!dirty && !hasProjects && <Btn onClick={() => openItem('boq', 'new-project')}>التالي: أنشئ أول مشروع ←</Btn>}
              <Btn variant="ghost" disabled={!dirty} onClick={() => { setName(company.name); setCr(company.crNumber); setLogo(company.logoDataUrl); setColor(company.brandColor ?? DEFAULT_BRAND_COLOR); }}>تراجع</Btn>
              <Btn icon={<Save className="w-4 h-4" />} disabled={!dirty || busy} onClick={() => {
                const r = updateCompany({ name, crNumber: cr, logoDataUrl: logo ?? null, brandColor: color });
                toast(r.ok ? 'تم تطبيق هوية الشركة على المنصة' : r.error, r.ok ? 'success' : 'error');
                if (r.ok && !hasProjects) setTimeout(() => openItem('boq', 'new-project'), 600);
              }}>حفظ وتطبيق الهوية</Btn>
            </div>
          )}
        </Card>

        <Card title="معاينة مباشرة">
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-slate-900 border-b border-slate-800">
              {logo ? <img src={logo} alt="" className="w-9 h-9 rounded-lg bg-white object-contain" /> : <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: pal['--color-amber-950'], color: pal['--color-amber-400'] }}><Building2 className="w-5 h-5" /></span>}
              <div>
                <div className="text-sm font-black text-white">{name || 'اسم الشركة'}</div>
                <div className="text-[10px] text-slate-400">إدارة عمليات المقاولات والبنية التحتية</div>
              </div>
              <span className="mr-auto px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950" style={{ background: pal['--color-amber-500'] }}>تقرير ميداني</span>
            </div>
            <div className="p-3 bg-slate-950 space-y-2">
              <div className="flex gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: pal['--color-amber-400'], borderColor: pal['--color-amber-600'] }}>بانتظار الاعتماد</span>
                <span className="text-xs font-bold" style={{ color: pal['--color-amber-400'] }}>PPC-SEC-006</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full w-2/3" style={{ background: pal['--color-amber-500'] }} /></div>
              <div className="flex gap-1">{Object.values(pal).map((c, i) => <span key={i} className="flex-1 h-6 rounded" style={{ background: c }} />)}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
