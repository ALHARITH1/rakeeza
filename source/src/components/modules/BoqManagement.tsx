import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { BoqItem } from '../../types';
import { 
  ListOrdered, 
  Download, 
  Search, 
  Layers, 
  TrendingUp,
  X,
  PieChart,
  CheckCircle2
} from 'lucide-react';
import { NumBdi, CodeBdi } from '../common/NumBdi';
import { EmptyState } from '../common/EmptyState';
import { BoqActions } from './BoqActions';

export const BoqManagement: React.FC = () => {
  const { boqItems, selectedProject, selectedProjectId } = usePlatform();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBoqForCbs, setSelectedBoqForCbs] = useState<BoqItem | null>(null);

  const filteredItems = useMemo(() => {
    return boqItems
      .filter(item => item.projectId === selectedProjectId)
      .filter(item => {
        if (categoryFilter === 'all') return true;
        return item.cbsCategory === categoryFilter;
      })
      .filter(item => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return item.description.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
      });
  }, [boqItems, selectedProjectId, categoryFilter, searchQuery]);

  const totalContract = useMemo(() => filteredItems.reduce((acc, curr) => acc + curr.totalPrice, 0), [filteredItems]);
  const totalExecuted = useMemo(() => filteredItems.reduce((acc, curr) => acc + (curr.executedQty * curr.unitPrice), 0), [filteredItems]);
  const executionRatio = totalContract > 0 ? ((totalExecuted / totalContract) * 100).toFixed(1) : '0';

  const categoryLabels: Record<string, string> = {
    all: 'كافة البنود',
    civil: 'الأعمال المدنية والترابية',
    electrical: 'تمديدات الجهد والكهرباء',
    infrastructure: 'أنابيب وحماية الطرق والأسفلت',
    mechanical: 'محطات التحويل والميكانيكا'
  };

  const handleExportCsv = () => {
    const headers = ['رقم البند', 'الوصف', 'الوحدة', 'الكمية التعاقدية', 'السعر الإفرادي (ر.س)', 'الإجمالي التعاقدي', 'المنفذ حتى تاريخه', 'الرصيد المتبقي', 'نسبة الإنجاز %'];
    const rows = filteredItems.map(item => [
      item.code,
      `"${item.description.replace(/"/g, '""')}"`,
      item.unit,
      item.contractQty,
      item.unitPrice,
      item.totalPrice,
      item.executedQty,
      item.contractQty - item.executedQty,
      `${((item.executedQty / item.contractQty) * 100).toFixed(1)}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BOQ_${selectedProject.name.substring(0, 15)}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-amber-400" />
            <span>جدول الكميات والتسعير وهيكل تجزئة التكاليف (BOQ & CBS)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — ربط كميات الميدان المنفذة بالأسعار التعاقدية لتحليل هامش الربح والتكلفة المباشرة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <BoqActions />
          <button
            onClick={handleExportCsv}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>تصدير Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">إجمالي القيمة التعاقدية للبنود المعروضة</span>
          <div className="text-lg font-bold text-white mt-1">
            <NumBdi value={totalContract} unit="ر.س" numClassName="font-mono tabular-nums text-lg text-white font-bold" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">المكافئ المالي للكميات المنفذة</span>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            <NumBdi value={totalExecuted} unit="ر.س" numClassName="font-mono tabular-nums text-lg text-emerald-400 font-bold" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">متوسط الإنجاز المالي لبنود المشروع</span>
          <div className="flex items-center gap-3 mt-1">
            <NumBdi value={executionRatio} unit="%" numClassName="font-mono tabular-nums text-lg text-amber-400 font-bold" unitClassName="text-amber-400 font-bold" />
            <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Number(executionRatio))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        {/* Categories */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                categoryFilter === key
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم البند أو الوصف..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Main Table - Horizontally Scrollable inside container */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="لا توجد بنود كميات مطابقة"
          description="لم يتم العثور على أي بند جدول كميات مطابق لمعايير البحث أو التصنيف المحدد."
          actionLabel="إعادة تعيين الفلتر"
          onAction={() => { setCategoryFilter('all'); setSearchQuery(''); }}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[850px]">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">رقم البند</th>
                  <th className="p-3">وصف البند ومواصفات التنفيذ</th>
                  <th className="p-3">الوحدة</th>
                  <th className="p-3">الكمية التعاقدية</th>
                  <th className="p-3">السعر الإفرادي</th>
                  <th className="p-3">الإجمالي التعاقدي</th>
                  <th className="p-3">المنفذ حتى تاريخه</th>
                  <th className="p-3">الرصيد المتبقي</th>
                  <th className="p-3">نسبة الإنجاز</th>
                  <th className="p-3 text-center">تحليل CBS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => {
                  const pct = ((item.executedQty / item.contractQty) * 100).toFixed(1);
                  const remaining = item.contractQty - item.executedQty;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 whitespace-nowrap">
                        <CodeBdi code={item.code} className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" />
                      </td>
                      <td className="p-3 font-medium text-slate-200 max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap font-medium">
                        {item.unit}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <NumBdi value={item.contractQty} numClassName="font-mono tabular-nums text-slate-300" />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <NumBdi value={item.unitPrice} unit="ر.س" numClassName="font-mono tabular-nums text-white font-medium" />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <NumBdi value={item.totalPrice} unit="ر.س" numClassName="font-mono tabular-nums text-white font-bold" />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <NumBdi value={item.executedQty} numClassName="font-mono tabular-nums text-emerald-400 font-bold" />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <NumBdi value={remaining} numClassName="font-mono tabular-nums text-slate-400" />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-400 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, Number(pct))}%` }} 
                            />
                          </div>
                          <NumBdi value={pct} unit="%" numClassName="font-mono tabular-nums text-amber-400 font-bold" unitClassName="text-amber-400 font-bold" />
                        </div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBoqForCbs(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-400 text-xs font-semibold transition"
                        >
                          تفاصيل CBS
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CBS Breakdown Drawer / Modal */}
      {selectedBoqForCbs && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400">
                  تحليل هيكل التكاليف (Cost Breakdown Structure)
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  بند <CodeBdi code={selectedBoqForCbs.code} className="text-amber-400" />: {selectedBoqForCbs.description.substring(0, 50)}...
                </h3>
              </div>
              <button
                onClick={() => setSelectedBoqForCbs(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center border border-slate-800">
                <span className="text-slate-400">السعر التعاقدي للبند:</span>
                <div className="text-white font-bold text-base">
                  <NumBdi value={selectedBoqForCbs.unitPrice} unit={`ر.س / ${selectedBoqForCbs.unit}`} numClassName="font-mono tabular-nums text-white text-base font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-400 font-semibold text-xs">توزيع التكلفة الميدانية المباشرة وغير المباشرة:</div>

                <div className="p-2.5 bg-slate-950 rounded-lg flex justify-between items-center border border-slate-800/80">
                  <span className="text-slate-300">1. تكلفة المواد والتوريدات (Materials):</span>
                  <NumBdi value={selectedBoqForCbs.costBreakdown.material} unit="ر.س" numClassName="font-mono tabular-nums font-bold text-white" />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg flex justify-between items-center border border-slate-800/80">
                  <span className="text-slate-300">2. تكلفة العمالة المباشرة (Direct Labor):</span>
                  <NumBdi value={selectedBoqForCbs.costBreakdown.labor} unit="ر.س" numClassName="font-mono tabular-nums font-bold text-white" />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg flex justify-between items-center border border-slate-800/80">
                  <span className="text-slate-300">3. تشغيل المعدات والديزل (Equipment & Fuel):</span>
                  <NumBdi value={selectedBoqForCbs.costBreakdown.equipment} unit="ر.س" numClassName="font-mono tabular-nums font-bold text-white" />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg flex justify-between items-center border border-slate-800/80">
                  <span className="text-slate-300">4. مصاريف غير مباشرة وهامش ربح (Overheads & Margin):</span>
                  <NumBdi value={selectedBoqForCbs.costBreakdown.overheadProfit} unit="ر.س" numClassName="font-mono tabular-nums font-bold text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBoqForCbs(null)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition active:scale-95"
              >
                إغلاق التحليل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
