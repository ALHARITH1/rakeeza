import React, { useState } from 'react';
import { VariationOrders } from './VariationOrders';
import { usePlatform } from '../../context/PlatformContext';
import { VariationOrder } from '../../types';
import { 
  GitPullRequestDraft, 
  FileSpreadsheet, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Plus
} from 'lucide-react';

export const TenderingRisk: React.FC = () => {
  const { variationOrders, selectedProjectId, selectedProject } = usePlatform();
  const [activeTab, setActiveTab] = useState<'vo' | 'eot' | 'pricing'>('vo');

  const projectVos = variationOrders.filter(v => v.projectId === selectedProjectId);

  const totalVoCost = projectVos.reduce((sum, v) => sum + v.costImpactSar, 0);
  const totalDays = projectVos.reduce((sum, v) => sum + v.timeExtensionDays, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <GitPullRequestDraft className="w-5 h-5 text-amber-400" />
            <span>المناقصات وأوامر التغيير والتمديد الزمني (VO & EOT Claims)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — حصر الأعمال الإضافية وتوثيق التعميدات الكتابية لحماية المؤسسة من غرامات التأخير (Liquidated Damages)
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('vo')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'vo' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            أوامر التغيير (VO)
          </button>
          <button
            onClick={() => setActiveTab('eot')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'eot' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            مطالبات التمديد الزمني (EOT)
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'pricing' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            أرشيف الأسعار التنافسية
          </button>
        </div>
      </div>

      {activeTab === 'vo' && <VariationOrders />}

      {activeTab === 'eot' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-white">سجل مطالبات التمديد الزمني وحساب إعاقات الموقع</h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex justify-between font-bold text-white">
                <span>مطالبة تمديد زمني رقم EOT-01: تأخر رخصة حفر شارع التخصصي</span>
                <span className="text-emerald-400 font-mono">18 يوماً معتمدة</span>
              </div>
              <p className="text-[11px] text-slate-400">
                بسبب تأخر أمانة منطقة الرياض في تدقيق المخطط المروري للتحويلة، تم توثيق تاريخ التقديم وتاريخ الاستلام لحساب التأخير وإعفاء المقاول من غرامة التأخير.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex justify-between font-bold text-white">
                <span>مطالبة تمديد زمني رقم EOT-02: توقفات الأمطار والعواصف الترابية</span>
                <span className="text-amber-400 font-mono">4 أيام قيد الاعتماد</span>
              </div>
              <p className="text-[11px] text-slate-400">
                مرفق بيانات المركز الوطني للأرصاد والدفاع المدني بموجب البند 19 (القوة القاهرة) من عقد المقاولات.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-white">قاعدة بيانات الأسعار التنافسية التاريخية للمناقصات</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-2.5">المادة / البند</th>
                  <th className="p-2.5">الوحدة</th>
                  <th className="p-2.5">متوسط سعر السوق الحالي</th>
                  <th className="p-2.5">أفضل عرض مورد تاريخي</th>
                  <th className="p-2.5">المورد الموصى به</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="p-2.5 font-bold text-white">كابل نحاسي 33 ك.ف 3x300</td>
                  <td className="p-2.5 text-slate-400 font-mono">م.ط</td>
                  <td className="p-2.5 font-mono text-slate-300">465 ر.س</td>
                  <td className="p-2.5 font-mono font-bold text-emerald-400">435 ر.س</td>
                  <td className="p-2.5 text-amber-300">شركة كابلات الرياض</td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="p-2.5 font-bold text-white">أنابيب HDPE قطر 160مم ضغط 10 بار</td>
                  <td className="p-2.5 text-slate-400 font-mono">م.ط</td>
                  <td className="p-2.5 font-mono text-slate-300">92 ر.س</td>
                  <td className="p-2.5 font-mono font-bold text-emerald-400">82 ر.س</td>
                  <td className="p-2.5 text-amber-300">مصنع الرياض للأنابيب البلاستيكية</td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="p-2.5 font-bold text-white">خرسانة جاهزة مقاومة C35</td>
                  <td className="p-2.5 text-slate-400 font-mono">م3</td>
                  <td className="p-2.5 font-mono text-slate-300">240 ر.س</td>
                  <td className="p-2.5 font-mono font-bold text-emerald-400">220 ر.س</td>
                  <td className="p-2.5 text-amber-300">شركة أسمنت الخرسانة الجاهزة</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
