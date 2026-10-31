import React, { useMemo, useState, useRef, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  TrendingUp, 
  Wallet, 
  Truck, 
  ShieldCheck, 
  Clock, 
  Sun, 
  CheckCircle2, 
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  ChevronLeft,
  Download,
  FileText,
  Sheet
} from 'lucide-react';
import { NumBdi, CodeBdi } from '../common/NumBdi';
import { ProjectHealth } from '../dashboard/ProjectHealth';
import { SCurve } from '../dashboard/SCurve';
import { ProjectsMap } from '../dashboard/ProjectsMap';
import { CompletionForecast } from '../dashboard/CompletionForecast';
import { computeProjectHealth } from '../dashboard/healthMetrics';
import { exportCsv, exportPdf } from '../dashboard/exportReport';

interface ExecutiveDashboardProps {
  onOpenNewPpc: () => void;
  onOpenNewPtw: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onOpenNewPpc,
  onOpenNewPtw
}) => {
  const { 
    selectedProject, 
    projects, 
    ppcs, 
    equipments, 
    setActiveTab,
    ncrs,
    utilityClashes,
    materialReqs,
    dprs,
    subClaims,
    variationOrders,
    can,
    company
  } = usePlatform();

  const healthRows = useMemo(
    () => computeProjectHealth(projects, ncrs, utilityClashes, materialReqs),
    [projects, ncrs, utilityClashes, materialReqs]
  );

  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showExport) return;
    const close = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showExport]);

  // Pending PPC calculation
  const pendingPpcs = ppcs.filter(p => p.status === 'submitted' || p.status === 'consultant_approved');
  const pendingAmount = pendingPpcs.reduce((acc, curr) => acc + curr.netPayableAmount, 0);

  // Equipment operational rate
  const projEq = equipments.filter(e => e.projectId === selectedProject.id);
  const activeEqCount = projEq.filter(e => e.status === 'operational').length;
  const eqOperationalRate = projEq.length > 0 ? ((activeEqCount / projEq.length) * 100).toFixed(1) : '—';

  const totalContractValue = projects.reduce((sum, p) => sum + p.contractValue, 0);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">لوحة القيادة والمؤشرات التنفيذية</h1>
            <span className="text-[11px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
              تحديث عملياتي فوري
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة شاملة للأداء الميداني، المستخلصات المعتمدة، وساعات تشغيل الأسطول دون الدخول في الدفاتر المحاسبية العامة
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExport(!showExport)}
              aria-expanded={showExport}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 text-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير التقرير</span>
            </button>
            {showExport && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-1.5 text-right">
                <button
                  onClick={() => { exportPdf(healthRows, company ?? undefined); setShowExport(false); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-950 text-xs text-slate-200"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span><b className="block">تقرير PDF</b><span className="text-[10px] text-slate-400">جاهز للطباعة والمشاركة</span></span>
                </button>
                <button
                  onClick={() => { exportCsv(healthRows, company ?? undefined); setShowExport(false); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-950 text-xs text-slate-200"
                >
                  <Sheet className="w-4 h-4 text-emerald-400" />
                  <span><b className="block">ملف CSV</b><span className="text-[10px] text-slate-400">يفتح في Excel بالعربي</span></span>
                </button>
              </div>
            )}
          </div>
          {can('ppc.create') && <button
            onClick={() => setActiveTab('ppc')}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>مستخلص جديد (PPC)</span>
          </button>}
          {can('ptw.create') && <button
            onClick={onOpenNewPtw}
            className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>تصريح حفر (PTW)</span>
          </button>}
        </div>
      </div>

      {/* Project Health widget (summary cards + alerts + Budget vs Actuals) */}
      <ProjectHealth rows={healthRows} />

      {/* Projects map + AI completion forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectsMap rows={healthRows} />
        </div>
        <CompletionForecast />
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Contract Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">إجمالي قيمة العقود النشطة</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white">
              <NumBdi 
                value={totalContractValue} 
                unit="ر.س" 
                numClassName="font-mono tabular-nums font-bold text-xl text-white"
                unitClassName="text-slate-400 font-sans text-xs font-normal"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>{projects.length} مشاريع نشطة ضمن صلاحياتك</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
        </div>

        {/* KPI 2: Pending PPCs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">المستخلصات قيد الاعتماد</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white">
              <NumBdi 
                value={pendingAmount} 
                unit="ر.س" 
                numClassName="font-mono tabular-nums font-bold text-xl text-white"
                unitClassName="text-slate-400 font-sans text-xs font-normal"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-1">
              <Clock className="w-3 h-3" />
              <span>{pendingPpcs.length} مستخلصات لدى المالك والاستشاري</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
        </div>

        {/* KPI 3: Fleet rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">جاهزية أسطول المعدات</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white">
              <NumBdi 
                value={eqOperationalRate} unit={projEq.length ? '%' : ''} 
                numClassName="font-mono tabular-nums font-bold text-xl text-white"
                unitClassName="text-amber-400 font-sans text-sm font-bold"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
              <span>{activeEqCount} من {projEq.length} معدة تعمل بالقطاعات اليوم</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
        </div>

        {/* KPI 4: Safety Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">ساعات السلامة (Safe Man-Hours)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white">
              <NumBdi 
                value={selectedProject.safetyHoursNoLti} 
                unit="ساعة" 
                numClassName="font-mono tabular-nums font-bold text-xl text-white"
                unitClassName="text-slate-400 font-sans text-xs font-normal"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>صفر حوادث هادفة (Zero LTI) للشهر الحالي</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
        </div>
      </div>

      {/* Middle Grid: S-Curve Chart & Operational Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* S-Curve Comparison */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>منحنى الإنجاز التراكمي (S-Curve): المخطط مقابل المنفذ فعلياً</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedProject.name}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-sky-500 rounded" />
                <span className="text-slate-300">
                  المخطط الزمني (<NumBdi value={selectedProject.plannedProgress} unit="%" numClassName="font-mono tabular-nums font-bold text-sky-400" unitClassName="text-sky-400 font-bold" />)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-emerald-500 rounded" />
                <span className="text-slate-300">
                  المنجز الفعلي (<NumBdi value={selectedProject.physicalProgress} unit="%" numClassName="font-mono tabular-nums font-bold text-emerald-400" unitClassName="text-emerald-400 font-bold" />)
                </span>
              </div>
            </div>
          </div>

          {/* Cumulative S-Curve (planned logistic vs actual BOQ-based progress) */}
          <div className="py-3"><SCurve project={selectedProject} height={230} /></div>

          {/* 3 Main Physical Execution Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800 text-center">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-1">إجمالي الحفر الطولي</span>
              <NumBdi 
                value={selectedProject.trenchLengthMeters} 
                unit="م.ط" 
                numClassName="font-mono tabular-nums font-bold text-sm text-white"
                unitClassName="text-slate-400 font-sans text-xs"
              />
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-1">الكابلات المسحوبة المعتمدة</span>
              <NumBdi 
                value={selectedProject.cablesPulledMeters} 
                unit="م.ط" 
                numClassName="font-mono tabular-nums font-bold text-sm text-sky-400"
                unitClassName="text-slate-400 font-sans text-xs"
              />
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-1">إعادة الردم والأسفلت</span>
              <NumBdi 
                value={selectedProject.asphaltRestoredM2} 
                unit="م2" 
                numClassName="font-mono tabular-nums font-bold text-sm text-emerald-400"
                unitClassName="text-slate-400 font-sans text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Approvals & Weather Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>إجراءات الاعتماد الفوري</span>
              </h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                مطلوب اتخاذ قرار
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { n: dprs.filter(d => d.projectId === selectedProject.id && d.status === 'submitted').length, t: 'تقارير ميدانية بانتظار اعتماد مدير المشروع', tab: 'dpr' },
                { n: materialReqs.filter(m => m.projectId === selectedProject.id && m.status === 'pending_pm').length, t: 'طلبات مواد بانتظار الاعتماد', tab: 'procurement' },
                { n: subClaims.filter(c => c.projectId === selectedProject.id && c.status === 'submitted').length, t: 'مطالبات مقاولي باطن بانتظار المطابقة', tab: 'subcontractors' },
                { n: ppcs.filter(c => c.projectId === selectedProject.id && c.status === 'client_approved').length, t: 'مستخلصات معتمدة بانتظار تسجيل الصرف', tab: 'ppc' },
                { n: variationOrders.filter(v => v.projectId === selectedProject.id && v.status === 'proposed').length, t: 'أوامر تغيير مسودة لم ترفع', tab: 'tendering' }
              ].map((x) => (
                <div key={x.tab} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold ${x.n > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>{x.n}</span>
                    <span className="font-semibold text-slate-200">{x.t}</span>
                  </div>
                  <button onClick={() => setActiveTab(x.tab)} className="bg-sky-600/20 hover:bg-sky-600 text-sky-400 hover:text-white px-2.5 py-1 rounded text-xs font-semibold shrink-0">فتح</button>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Widget */}
          <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">حالة الطقس الميداني اليوم</div>
                <div className="text-[10px] text-slate-400">34°C - رياح هادئة / ملائم تماماً لصب الخرسانة والأسفلت</div>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
              مواقع نشطة
            </span>
          </div>
        </div>
      </div>

      {/* Projects Comparative Table - Horizontally Scrollable inside container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>المقارنة التشغيلية والمالية لكافة مشاريع المؤسسة</span>
          </h2>
          <button
            onClick={() => setActiveTab('boq')}
            className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>عرض جداول الكميات التفصيلية</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Container with Fixed Minimum Width */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[700px]">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-3">المشروع</th>
                <th className="p-3">المالك / الاستشاري</th>
                <th className="p-3">قيمة العقد</th>
                <th className="p-3">الإنجاز المادي</th>
                <th className="p-3">الإنجاز المالي</th>
                <th className="p-3">الحالة الميدانية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-bold text-white">{p.name}</td>
                  <td className="p-3 text-slate-300">
                    <div>{p.client}</div>
                    <div className="text-[10px] text-slate-500">{p.consultant}</div>
                  </td>
                  <td className="p-3 font-bold text-amber-400">
                    <NumBdi value={p.contractValue} unit="ر.س" numClassName="font-mono tabular-nums text-amber-400 font-bold" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-sky-500 h-1.5 rounded-full"
                          style={{ width: `${p.physicalProgress}%` }}
                        />
                      </div>
                      <NumBdi value={p.physicalProgress} unit="%" numClassName="font-mono tabular-nums font-bold text-sky-400" unitClassName="text-sky-400 font-bold" />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${p.financialProgress}%` }}
                        />
                      </div>
                      <NumBdi value={p.financialProgress} unit="%" numClassName="font-mono tabular-nums font-bold text-emerald-400" unitClassName="text-emerald-400 font-bold" />
                    </div>
                  </td>
                  <td className="p-3">
                    {p.status === 'ongoing' && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-semibold text-[10px] border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>منتظم وفق الجدول</span>
                      </span>
                    )}
                    {p.status === 'near_completion' && (
                      <span className="inline-flex items-center gap-1 text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full font-semibold text-[10px] border border-sky-500/20">
                        <CheckCircle2 className="w-3 h-3 text-sky-400" />
                        <span>مرحلة التسليم النهائي</span>
                      </span>
                    )}
                    {p.status === 'delayed' && (
                      <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full font-semibold text-[10px] border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>تأخير تصاريح حفر</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
