import React from 'react';
import { SubClaimsPanel } from './SubClaimsPanel';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Building2, 
  Fuel, 
  Zap, 
  Star, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { NumBdi } from '../common/NumBdi';
import { EmptyState } from '../common/EmptyState';

export const SubcontractorManagement: React.FC = () => {
  const { subcontractors, selectedProjectId, selectedProject, subClaims } = usePlatform();
  const projectSubs = subcontractors.filter(s => s.projectId === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <span>إدارة مقاولي الباطن والخصومات المشتركة (Subcontractors & Backcharges)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — تقييم الأداء، اقتطاع استهلاك الديزل والكهرباء من المؤسسة، ومنع ازدواجية المطالبات
          </p>
        </div>

        <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 self-start sm:self-auto">
          <span>المقاولون المسجلون بالموقع: </span>
          <NumBdi value={projectSubs.length} unit="مقاولين" numClassName="font-mono tabular-nums text-amber-400 font-bold" />
        </div>
      </div>

      {projectSubs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="لا يوجد مقاولو باطن مسجلون"
          description="لم يتم تعيين أي مقاول باطن لهذا المشروع حتى الآن."
        />
      ) : (
        /* Cards for each subcontractor */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectSubs.map((sub) => {
            const totalBackcharges = sub.dieselBackcharges + sub.powerBackcharges;
            const netPayable = sub.certifiedToDate - totalBackcharges;

            return (
              <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 flex flex-col justify-between">
                <div className="flex items-start justify-between pb-2 border-b border-slate-800 gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{sub.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{sub.scopeOfWork}</p>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 font-bold px-2.5 py-1 rounded-full text-xs border border-amber-500/20 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <NumBdi value={sub.performanceScore} unit="/ 100" numClassName="font-mono tabular-nums text-amber-400 font-bold" unitClassName="text-amber-400 font-bold text-xs" />
                  </div>
                </div>

                {/* Financial Progress Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-1">قيمة العقد الإجمالية</span>
                    <NumBdi value={sub.contractValue} unit="ر.س" numClassName="font-mono tabular-nums font-bold text-white text-xs" />
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-1">المعتمد للصرف حتى تاريخه</span>
                    <NumBdi value={sub.certifiedToDate} unit="ر.س" numClassName="font-mono tabular-nums font-bold text-emerald-400 text-xs" />
                  </div>
                </div>

                {/* Shared Backcharges Breakdown */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <span className="text-slate-400 font-bold block text-xs">
                    الخصومات المشتركة المحتسبة (Backcharges):
                  </span>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>استهلاك ديزل من تانك المؤسسة:</span>
                    </span>
                    <NumBdi value={-sub.dieselBackcharges} unit="ر.س" numClassName="font-mono tabular-nums text-rose-400 font-bold" />
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>استهلاك كهرباء من مولدات الموقع:</span>
                    </span>
                    <NumBdi value={-sub.powerBackcharges} unit="ر.س" numClassName="font-mono tabular-nums text-rose-400 font-bold" />
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold">
                    <span className="text-white text-xs">الصافي بعد اقتطاع الخدمات المشتركة:</span>
                    <NumBdi value={netPayable} unit="ر.س" numClassName="font-mono tabular-nums text-emerald-400 font-bold text-sm" />
                  </div>
                </div>

                {/* Status and Action */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <div className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{subClaims.filter((c) => c.subcontractorId === sub.id && c.status === 'submitted').length} مطالبات بانتظار المراجعة</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <SubClaimsPanel />
    </div>
  );
};
