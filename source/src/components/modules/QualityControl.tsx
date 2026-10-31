import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { NonConformanceReport, LabTest } from '../../types';
import { 
  Sparkles, 
  FlaskConical, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ShieldCheck,
  Search
} from 'lucide-react';

export const QualityControl: React.FC = () => {
  const { ncrs, labTests, selectedProjectId, selectedProject, closeNcr, addLabTest, can } = usePlatform();
  const [activeTab, setActiveTab] = useState<'tests' | 'ncr'>('tests');
  const [closingNcrId, setClosingNcrId] = useState<string | null>(null);
  const [correctiveText, setCorrectiveText] = useState('');

  // New Lab test inline modal
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [testType, setTestType] = useState<LabTest['testType']>('soil_compaction');
  const [sampleLocation, setSampleLocation] = useState('شارع التخصصي - محطة 04+100');
  const [requiredVal, setRequiredVal] = useState('≥ 95% Modified Proctor');
  const [achievedVal, setAchievedVal] = useState('96.4%');
  const [labName, setLabName] = useState('مختبر التربة والمواد المتطورة (FUGRO)');

  const projectNcrs = ncrs.filter(n => n.projectId === selectedProjectId);
  const projectTests = labTests.filter(t => t.projectId === selectedProjectId);

  const testTypeLabels: Record<string, string> = {
    soil_compaction: 'دك التربة والردم (Compaction)',
    concrete_compression: 'كبس مكعبات الخرسانة (28 يوم)',
    asphalt_marshall: 'فحص كثافة الأسفلت (Marshall)',
    megger_cable_insulation: 'فحص عزل الكابلات (Megger Test)',
    otdr_fiber: 'فحص انكسار الألياف الضوئية (OTDR)'
  };

  const handleCloseNcrSubmit = (id: string) => {
    closeNcr(id, correctiveText || 'تم إنجاز التصحيح الميداني واستدعاء المختبر وإغلاق الملاحظة.');
    setClosingNcrId(null);
    setCorrectiveText('');
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    addLabTest({
      testType,
      sampleLocation,
      requiredValue: requiredVal,
      achievedValue: achievedVal,
      result: 'passed',
      certifiedLab: labName
    });
    setShowNewTestModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>إدارة وضبط الجودة والفحوصات المخبرية (QA/QC Management)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — متابعة نتائج اختبارات المختبر المعتمد (التربة، الخرسانة، والميجر) وإغلاق تقارير عدم المطابقة (NCR)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'tests' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              نتائج الفحوصات المختبرية ({projectTests.length})
            </button>
            <button
              onClick={() => setActiveTab('ncr')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'ncr' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              تقارير عدم المطابقة NCR ({projectNcrs.length})
            </button>
          </div>

          {activeTab === 'tests' && (
            <button
              onClick={() => setShowNewTestModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل فحص مختبر</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'tests' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projectTests.map((test) => (
              <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono font-bold text-amber-400 text-xs">{test.testNumber}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ناجح ومطابق (PASSED)
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-xs">{testTypeLabels[test.testType] || test.testType}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">الموقع: {test.sampleLocation}</p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">القيمة المطلوبة بالكود:</span>
                    <span className="text-slate-300 font-mono">{test.requiredValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">القيمة المحققة فعلياً:</span>
                    <span className="text-emerald-400 font-mono font-bold">{test.achievedValue}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>المختبر: {test.certifiedLab}</span>
                  <span className="font-mono">{test.testDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {projectNcrs.map((ncr) => (
              <div 
                key={ncr.id}
                className={`p-4 bg-slate-900 border rounded-xl space-y-3 ${
                  ncr.status === 'open' ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-400 text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {ncr.ncrNumber}
                    </span>
                    <span className="font-bold text-white text-xs">{ncr.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 text-[11px] font-mono">{ncr.date}</span>
                    {ncr.status === 'closed' ? (
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        مُغلق رسمياً ({ncr.closedDate})
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        تحت الإجراء والمعالجة
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">ملاحظة عدم المطابقة:</span>
                    <p className="text-slate-200 mt-0.5 font-medium">{ncr.description}</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-1">
                    <span className="text-amber-400 font-semibold block">السبب الجوهري (Root Cause):</span>
                    <p className="text-slate-300">{ncr.rootCause}</p>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-semibold block text-[11px]">الإجراء التصحيحي المتخذ (CAPA):</span>
                    <p className="text-slate-300 mt-0.5">{ncr.correctiveAction}</p>
                  </div>
                </div>

                {ncr.status !== 'closed' && (
                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    {closingNcrId === ncr.id ? (
                      <div className="flex items-center gap-2 w-full max-w-md">
                        <input
                          type="text"
                          value={correctiveText}
                          onChange={(e) => setCorrectiveText(e.target.value)}
                          placeholder="اكتب الإجراء التصحيحي للإغلاق..."
                          className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => handleCloseNcrSubmit(ncr.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-xs"
                        >
                          تأكيد الإغلاق
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setClosingNcrId(ncr.id)}
                        className="bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white px-3 py-1 rounded text-xs font-bold transition"
                      >
                        إغلاق تقرير الـ NCR
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Lab Test Modal */}
      {showNewTestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">تسجيل نتيجة فحص مختبري جديد</h3>
              <button onClick={() => setShowNewTestModal(false)} className="text-slate-400 hover:text-white text-xs">إلغاء</button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-3 text-xs"><fieldset disabled={!can('lab.create')} className="space-y-3 disabled:opacity-50">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">نوع الاختبار المخبري</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="soil_compaction">دك التربة والردم (Soil Compaction 95%)</option>
                  <option value="concrete_compression">كبس مكعبات الخرسانة (Concrete Cube 28 Days)</option>
                  <option value="megger_cable_insulation">عزل كابلات الجهد المتوسط (Megger Test)</option>
                  <option value="asphalt_marshall">كثافة الطبقة الأسفلتية (Marshall Density)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">موقع أخذ العينة</label>
                <input
                  type="text"
                  value={sampleLocation}
                  onChange={(e) => setSampleLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">القيمة المطلوبة</label>
                  <input
                    type="text"
                    value={requiredVal}
                    onChange={(e) => setRequiredVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">النتيجة المحققة</label>
                  <input
                    type="text"
                    value={achievedVal}
                    onChange={(e) => setAchievedVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-400 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">اسم المختبر الفني المعتمد</label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition mt-2"
              >
                اعتماد وحفظ تقرير المختبر
              </button>
            </fieldset></form>
          </div>
        </div>
      )}
    </div>
  );
};
