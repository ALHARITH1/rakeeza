import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { EmergencyIncident } from '../../types';
import { 
  Flame, 
  AlertTriangle, 
  CloudRain, 
  CheckCircle2, 
  FileText, 
  Plus, 
  Scale, 
  ShieldAlert,
  Clock
} from 'lucide-react';

export const EmergencyCrisis: React.FC = () => {
  const { emergencyIncidents, selectedProjectId, selectedProject, addEmergencyIncident, can } = usePlatform();
  const [showAddModal, setShowAddModal] = useState(false);

  const [type, setType] = useState<EmergencyIncident['type']>('accidental_utility_strike');
  const [location, setLocation] = useState('');
  const [affectedService, setAffectedService] = useState('');
  const [description, setDescription] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [forceMajeure, setForceMajeure] = useState(false);
  const [liability, setLiability] = useState('');

  const projectIncidents = emergencyIncidents.filter(i => i.projectId === selectedProjectId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addEmergencyIncident({
      type,
      location,
      affectedUtilityOrService: affectedService,
      description,
      immediateActionsTaken: actionsTaken,
      contractualForceMajeureLogged: forceMajeure,
      legalLiabilityAssessment: liability
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <span>الطوارئ وغرفة العمليات الميدانية والأزمات التعاقدية (Emergency & Crisis)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — توثيق بلاغات قطع الخدمات العرضية وتوقفات الأحوال الجوية لحماية المؤسسة قانونياً ومالياً
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل بلاغ طارئ أو توقف جوي</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">سجل بلاغات قطع الخدمات العرضية</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {projectIncidents.filter(i => i.type === 'accidental_utility_strike').length} بلاغات (مُعالجة بالكامل)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">أيام التوقف الجوي القاهر (Force Majeure)</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {projectIncidents.filter(i => i.type === 'extreme_weather_stoppage').length} أيام موثقة
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">الحماية القانونية وتفادي غرامات التأخير</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            100% موثق بالمحاضر
          </span>
        </div>
      </div>

      {/* Incident Feed */}
      <div className="space-y-4">
        {projectIncidents.map((incident) => (
          <div key={incident.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-rose-400 text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {incident.incidentCode}
                </span>
                <span className="font-bold text-white text-xs">
                  {incident.type === 'accidental_utility_strike' ? 'قطع خدمة عرضي غير مدون بالمخطط' : 'توقف عن العمل بسبب الأحوال الجوية'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{incident.dateTime}</span>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-400 font-semibold">الموقع المتأثر:</span>
                <span className="font-medium text-white">{incident.location}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 font-semibold">الخدمة المتأثرة:</span>
                <span className="text-amber-400 font-medium">{incident.affectedUtilityOrService}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">تفاصيل الحادث والظروف المحيطة:</span>
                <p className="text-slate-200 mt-0.5 leading-relaxed">{incident.description}</p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                <span className="text-emerald-400 font-bold block">الإجراءات الفورية المتخذة لإخلاء المسؤولية:</span>
                <p className="text-slate-300">{incident.immediateActionsTaken}</p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Scale className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>التقييم القانوني والمسؤولية: <strong className="text-white font-medium">{incident.legalLiabilityAssessment}</strong></span>
                </div>
                {incident.contractualForceMajeureLogged && (
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px]">
                    مدرج بالمطالبة الزمنية (EOT)
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Emergency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">تسجيل بلاغ طارئ أو توقف جوي</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">إلغاء</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs"><fieldset disabled={!can('incident.create')} className="space-y-3 disabled:opacity-50">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">نوع البلاغ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="accidental_utility_strike">ملامسة أو قطع خدمة عرضي (Utility Strike)</option>
                  <option value="extreme_weather_stoppage">توقف عمل بسبب الظروف الجوية القاهرة (Weather Force Majeure)</option>
                  <option value="trench_collapse_nearmiss">مخاطر وشيكة وانهيار ترابي (Near Miss)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">موقع الحادث</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">الخدمة أو النشاط المتأثر</label>
                <input
                  type="text"
                  value={affectedService}
                  onChange={(e) => setAffectedService(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">وصف الحادث وأسبابه</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">الإجراءات الفورية المتخذة بالموقع</label>
                <input
                  type="text"
                  value={actionsTaken}
                  onChange={(e) => setActionsTaken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  id="chkForce"
                  checked={forceMajeure}
                  onChange={(e) => setForceMajeure(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="chkForce" className="text-slate-300 font-medium cursor-pointer">
                  تضمين الحادث ضمن المطالبات الزمنية الرسمية (EOT Force Majeure)
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg transition mt-2"
              >
                توثيق البلاغ في السجل القانوني للشركة
              </button>
            </fieldset></form>
          </div>
        </div>
      )}
    </div>
  );
};
