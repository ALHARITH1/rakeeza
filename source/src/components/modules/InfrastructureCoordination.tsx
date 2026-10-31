import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { UtilityClash } from '../../types';
import { 
  Network, 
  PlusCircle, 
  CheckCircle2, 
  Camera, 
  AlertTriangle, 
  Signpost, 
  ShieldCheck,
  PhoneCall
} from 'lucide-react';

interface InfrastructureCoordinationProps {
  onOpenNewClashModal: () => void;
}

export const InfrastructureCoordination: React.FC<InfrastructureCoordinationProps> = ({ onOpenNewClashModal }) => {
  const { utilityClashes, selectedProjectId, selectedProject } = usePlatform();
  const projectClashes = utilityClashes.filter(c => c.projectId === selectedProjectId);

  const utilityNames: Record<string, { name: string; color: string }> = {
    saudi_electricity_hv: { name: 'كابلات كهرباء جهد عالي (SEC)', color: 'text-amber-400 bg-amber-500/10' },
    nwc_water_mains: { name: 'خطوط مياه رئيسية (NWC)', color: 'text-sky-400 bg-sky-500/10' },
    telecom_fiber: { name: 'ألياف بصرية واتصالات (stc/Mobily)', color: 'text-purple-400 bg-purple-500/10' },
    stormwater_box_culvert: { name: 'عبارات تصريف سيول وأمطار', color: 'text-emerald-400 bg-emerald-500/10' }
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    identified: { label: 'تم الرصد والتحذير', color: 'text-rose-400 bg-rose-500/10' },
    coordinated_with_owner: { label: 'تم التنسيق مع الجهة المالكة', color: 'text-amber-400 bg-amber-500/10' },
    rerouted: { label: 'تم التدعيم أو التحويل', color: 'text-sky-400 bg-sky-500/10' },
    cleared: { label: 'تم الإنجاز وإغلاق التعارض', color: 'text-emerald-400 bg-emerald-500/10' }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-amber-400" />
            <span>تنسيق خدمات البنية التحتية وحرم الطرق (Utility Coordination & ROW)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — سجل تعارضات الكابلات والمياه، واعتماد التحويلات المرورية، وتصوير إثبات حالة الشوارع قبل وبعد الحفر
          </p>
        </div>

        <button
          onClick={onOpenNewClashModal}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>تسجيل تعارض خدمات ميداني جديد</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">التعارضات الميدانية المرصودة</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {projectClashes.length} تقاطعات
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">التحويلات المرورية المعتمدة من المرور والبلدية</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            100% معتمدة
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">توثيق إثبات الحالة الفوتوغرافي (تجنب الغرامات)</span>
          <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
            مكتمل ومؤرشف
          </span>
        </div>
      </div>

      {/* Clashes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projectClashes.map((clash) => {
          const util = utilityNames[clash.utilityType] || { name: clash.utilityType, color: 'text-slate-400' };
          const stat = statusLabels[clash.status] || { label: clash.status, color: 'text-slate-400' };

          return (
            <div key={clash.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {clash.clashCode}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${util.color}`}>
                    {util.name}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700/60 ${stat.color}`}>
                  {stat.label}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">الموقع والشارع:</span>
                <p className="text-xs font-semibold text-white mt-0.5">{clash.locationStreet}</p>
                <div className="text-[11px] text-slate-400 mt-1">
                  العمق المقاس: <strong className="text-sky-400 font-mono">{clash.depthMeters} م</strong> تحت منسوب الأسفلت
                </div>
              </div>

              {/* Protection & Stakeholder */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 font-semibold block text-[10px]">إجراءات الحماية والتدعيم:</span>
                <p className="text-slate-300 text-[11px]">{clash.protectionMeasures}</p>
                <div className="text-[10px] text-amber-400 pt-1 flex items-center gap-1">
                  <PhoneCall className="w-3 h-3" />
                  <span>جهة التواصل: {clash.stakeholderContact}</span>
                </div>
              </div>

              {/* Pre & Post Photographic Verification */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                <span className={`flex items-center gap-1 font-semibold ${clash.preTrenchPhotoTaken ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Camera className="w-3.5 h-3.5" />
                  <span>توثيق قبل الحفر {clash.preTrenchPhotoTaken ? '(مكتمل)' : '(مطلوب)'}</span>
                </span>
                <span className={`flex items-center gap-1 font-semibold ${clash.postPavingPhotoTaken ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Camera className="w-3.5 h-3.5" />
                  <span>توثيق بعد السفلتة {clash.postPavingPhotoTaken ? '(مكتمل)' : '(قيد التنفيذ)'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
