import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  Camera, 
  Users, 
  Calendar,
  ShieldCheck,
  FileBadge
} from 'lucide-react';

export const TrainingReadiness: React.FC = () => {
  const { toolboxTalks, selectedProjectId, selectedProject } = usePlatform();
  const [activeSubTab, setActiveSubTab] = useState<'tbt' | 'matrix' | 'certs'>('tbt');

  const projectTbts = toolboxTalks.filter(t => t.projectId === selectedProjectId);

  // Skill matrix mock data
  const skillMatrix = [
    { name: 'م. راشد الحربي', role: 'مهندس موقع', firstAid: true, fireSafety: true, highVoltageCert: true, clientApproved: true },
    { name: 'كومار ناتاراجان', role: 'فني كابلات جهد متوسط', firstAid: true, fireSafety: false, highVoltageCert: true, clientApproved: true },
    { name: 'سليم خان', role: 'مشغل حفار ثقيل', firstAid: false, fireSafety: true, heavyLicense: true, clientApproved: true },
    { name: 'بشير عبدالحفيظ', role: 'مشغل رافعة تلسكوبية 50 طن', firstAid: true, fireSafety: true, craneCert: true, clientApproved: true }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span>التدريب والجاهزية الميدانية ومصفوفة المهارات (TBT & Readiness)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — توثيق اجتماعات السلامة الصباحية (Toolbox Talks) وتطابق الشهادات مع كراسة الشروط
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('tbt')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'tbt' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            محاضرات السلامة (TBT)
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'matrix' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            مصفوفة المهارات (Skill Matrix)
          </button>
        </div>
      </div>

      {activeSubTab === 'tbt' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectTbts.map((tbt) => (
              <div key={tbt.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white text-xs">{tbt.topic}</span>
                  <span className="text-[11px] text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {tbt.date}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">المخاطر الرئيسية التي تمت مراجعتها:</span>
                  <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                    {tbt.keyHazardsDiscussed.map((hazard, idx) => (
                      <li key={idx} className="leading-relaxed">{hazard}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    الحضور: <strong className="text-white font-mono">{tbt.attendeesCount} عامل وفني</strong>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Camera className="w-3.5 h-3.5" />
                    مُوثق بالصور والتوقيعات
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-white">مصفوفة تأهيل الكوادر الفنية طبقاً لمعايير {selectedProject.client}</span>
            <span className="text-emerald-400 font-bold text-[11px]">نسبة تطابق المتطلبات: 98%</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">اسم الموظف / الفني</th>
                  <th className="p-3">المسمى الوظيفي</th>
                  <th className="p-3">دورة الإسعافات الأولية</th>
                  <th className="p-3">مكافحة الحرائق</th>
                  <th className="p-3">رخصة تشغيل / فحص فني</th>
                  <th className="p-3">اعتماد كراسة الشروط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {skillMatrix.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3 text-slate-300">{item.role}</td>
                    <td className="p-3">
                      {item.firstAid ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> سارية
                        </span>
                      ) : (
                        <span className="text-slate-500">غير مطلوب</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.fireSafety ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> سارية
                        </span>
                      ) : (
                        <span className="text-slate-500">مطلوب تجديد</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-sky-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> معتمد (TUV)
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-400 bg-emerald-500/10 font-bold px-2 py-0.5 rounded text-[10px]">
                        معتمد رسمياً
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
