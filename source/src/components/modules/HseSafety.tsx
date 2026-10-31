import { HazardsPanel } from './HazardsPanel';
import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { PermitToWork } from '../../types';
import { 
  ShieldAlert, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText,
  HardHat,
  Search
} from 'lucide-react';
import { NumBdi, CodeBdi } from '../common/NumBdi';
import { EmptyState } from '../common/EmptyState';

interface HseSafetyProps {
  onOpenNewPtwModal: () => void;
}

export const HseSafety: React.FC<HseSafetyProps> = ({ onOpenNewPtwModal }) => {
  const { ptws, selectedProjectId, selectedProject, can } = usePlatform();
  const [filterType, setFilterType] = useState<string>('all');

  const projectPtws = useMemo(() => {
    return ptws.filter(p => p.projectId === selectedProjectId);
  }, [ptws, selectedProjectId]);

  const filtered = useMemo(() => {
    return projectPtws.filter(p => {
      if (filterType === 'all') return true;
      return p.type === filterType;
    });
  }, [projectPtws, filterType]);

  const typeLabels: Record<string, string> = {
    all: 'كافة التصاريح',
    deep_excavation: 'حفر عميق',
    hot_work: 'أعمال ساخنة ولحام',
    confined_space: 'أماكن مغلقة',
    high_voltage: 'جهد كهربائي عالي'
  };

  const activeCount = projectPtws.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>السلامة والصحة المهنية وتصاريح العمل (HSE & PTW)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — إصدار تصاريح الحفر الطولي والأعمال الساخنة والتحقق من اشتراطات الحماية الميدانية (JSA)
          </p>
        </div>

        {can('ptw.create') && <button
          onClick={onOpenNewPtwModal}
          className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>إصدار تصريح عمل جديد (PTW)</span>
        </button>}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">تصاريح العمل السارية حالياً</span>
          <div className="text-xl font-bold mt-1">
            <NumBdi value={activeCount} unit="تصريح نشط" numClassName="font-mono tabular-nums text-xl text-emerald-400 font-bold" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">ساعات عمل بدون حوادث (LTI)</span>
          <div className="text-xl font-bold mt-1">
            <NumBdi value={selectedProject.safetyHoursNoLti} unit="ساعة" numClassName="font-mono tabular-nums text-xl text-white font-bold" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">أجهزة كشف الكابلات المفحوصة</span>
          <div className="text-xl font-bold mt-1">
            <NumBdi value={100} unit="% مطابقة" numClassName="font-mono tabular-nums text-xl text-sky-400 font-bold" unitClassName="text-sky-400 font-bold text-xs" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">مخالفات السلامة المفتوحة (CAPA)</span>
          <div className="text-xl font-bold mt-1">
            <NumBdi value={0} unit="مخالفات" numClassName="font-mono tabular-nums text-xl text-emerald-400 font-bold" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              filterType === key
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* PTW Active Permits List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="لا توجد تصاريح عمل مطابقة"
          description="لم يتم العثور على أي تصريح عمل مطابق للتصنيف المحدد. يمكنك إصدار تصريح عمل جديد مباشرة."
          actionLabel="إصدار تصريح عمل"
          onAction={onOpenNewPtwModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ptw) => (
            <div key={ptw.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CodeBdi code={ptw.permitNumber} className="text-rose-400 font-bold text-xs bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20" />
                  <span className="font-bold text-white text-xs">
                    {typeLabels[ptw.type] || ptw.type}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>ساري حتى {ptw.validUntil.split(' ')[1] || '18:00'}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">الموقع المعتمد للتصريح:</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-relaxed">{ptw.location}</p>
              </div>

              {/* Safety Checklist verification */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block">متطلبات واشتراطات السلامة الميدانية:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>فحص جهاز كشف الكابلات</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>حواجز خرسانية وإشارات ضوئية</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>معدات حماية شخصية (PPE)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>تأمين خطوط طوارئ الإسعاف</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>مشرف التنفيذ: <strong className="text-slate-300 font-medium">{ptw.supervisor}</strong></span>
                <span>مسؤول السلامة: <strong className="text-rose-400 font-medium">{ptw.safetyOfficer}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
      <HazardsPanel />
    </div>
  );
};
