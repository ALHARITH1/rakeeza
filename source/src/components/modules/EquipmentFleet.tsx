import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Truck, 
  Fuel, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  Wrench,
  Clock
} from 'lucide-react';
import { NumBdi, CodeBdi } from '../common/NumBdi';
import { EmptyState } from '../common/EmptyState';

export const EquipmentFleet: React.FC = () => {
  const { equipments, selectedProjectId, selectedProject } = usePlatform();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const projectEquipments = useMemo(() => {
    return equipments.filter(eq => eq.projectId === selectedProjectId);
  }, [equipments, selectedProjectId]);

  const filtered = useMemo(() => {
    return projectEquipments
      .filter(eq => filterCategory === 'all' || eq.status === filterCategory)
      .filter(eq => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return eq.name.toLowerCase().includes(q) || eq.plateNumber.toLowerCase().includes(q) || eq.code.toLowerCase().includes(q);
      });
  }, [projectEquipments, filterCategory, searchQuery]);

  const totalFuelLiters = useMemo(() => projectEquipments.reduce((sum, e) => sum + e.fuelConsumptionDailyLiters, 0), [projectEquipments]);
  const underMaintenanceCount = useMemo(() => projectEquipments.filter(e => e.status === 'under_maintenance').length, [projectEquipments]);
  const operationalCount = useMemo(() => projectEquipments.filter(e => e.status === 'operational').length, [projectEquipments]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>إدارة أسطول المعدات والآليات والديزل الميداني</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — مراقبة ساعات تشغيل المحرك (Engine Hours)، استهلاك الوقود، وجدول الصيانة الدورية
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            <span>إجمالي استهلاك الديزل: </span>
            <NumBdi value={totalFuelLiters} unit="لتر/يوم" numClassName="font-mono tabular-nums text-amber-400 font-bold" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">معدات تعمل في الموقع الآن</span>
          <div className="text-xl font-bold mt-1">
            <NumBdi value={operationalCount} unit="معدة عاملة" numClassName="font-mono tabular-nums text-xl text-emerald-400 font-bold" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">معدات تحت الصيانة أو بانتظار قطع غيار</span>
          <div className="text-xl font-bold mt-1">
            <NumBdi value={underMaintenanceCount} unit="معدة بالصيانة" numClassName="font-mono tabular-nums text-xl text-rose-400 font-bold" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">كفاءة استهلاك الديزل الميداني</span>
          <div className="text-xl font-bold mt-1">
            <NumBdi value={projectEquipments.length ? ((projectEquipments.filter(e => e.fuelEfficiencyStatus === 'optimal').length / projectEquipments.length) * 100).toFixed(1) : '—'} unit={projectEquipments.length ? '% كفاءة' : 'لا توجد معدات'} numClassName="font-mono tabular-nums text-xl text-amber-400 font-bold" unitClassName="text-amber-400 font-bold text-xs" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {[
            { id: 'all', label: 'كافة المعدات' },
            { id: 'operational', label: 'تعمل في الموقع' },
            { id: 'under_maintenance', label: 'صيانة طارئة / دورية' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterCategory(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                filterCategory === item.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالمعدة، اللوحة، أو الكود..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Equipment Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="لا توجد معدات مطابقة"
          description="لم يتم العثور على أي معدة أو آلية وفق معايير التصفية والبحث الحالية."
          actionLabel="إعادة تعيين الفلتر"
          onAction={() => { setFilterCategory('all'); setSearchQuery(''); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((eq) => {
            const hoursUntilService = eq.nextServiceHours - eq.engineHours;
            const isServiceDue = hoursUntilService <= 100;

            return (
              <div 
                key={eq.id}
                className={`bg-slate-900 border rounded-xl p-4 space-y-3 transition flex flex-col justify-between ${
                  eq.status === 'under_maintenance' ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-800 gap-2">
                  <div>
                    <CodeBdi code={eq.code} className="text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" />
                    <h3 className="font-bold text-white text-xs mt-1 leading-snug">{eq.name}</h3>
                  </div>
                  {eq.status === 'operational' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>تعمل بالموقع</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                      <Wrench className="w-3 h-3 text-rose-400" />
                      <span>تحت الصيانة</span>
                    </span>
                  )}
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                      <Gauge className="w-3 h-3 text-sky-400" />
                      <span>ساعات المحرك</span>
                    </div>
                    <NumBdi value={eq.engineHours} unit="ساعة" numClassName="font-mono tabular-nums font-bold text-white text-xs" />
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                      <Fuel className="w-3 h-3 text-amber-400" />
                      <span>الديزل اليومي</span>
                    </div>
                    <NumBdi value={eq.fuelConsumptionDailyLiters} unit="لتر" numClassName="font-mono tabular-nums font-bold text-amber-400 text-xs" />
                  </div>
                </div>

                {/* Maintenance & Warning Alert */}
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">الصيانة الوقائية القادمة:</span>
                    <NumBdi 
                      value={eq.nextServiceHours} 
                      unit="ساعة" 
                      prefix="عند"
                      numClassName={`font-mono tabular-nums font-bold ${isServiceDue ? 'text-rose-400' : 'text-slate-200'}`} 
                    />
                  </div>
                  {eq.fuelEfficiencyStatus === 'excessive_consumption' && (
                    <div className="text-[10px] text-rose-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-800/60">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>رصد استهلاك وقود مرتفع (احتمال تلف رشاشات أو هدر)</span>
                    </div>
                  )}
                </div>

                {/* Bottom Driver and Plate Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="truncate">السائق: <strong className="text-slate-300 font-medium">{eq.operatorName}</strong></span>
                  <CodeBdi code={eq.plateNumber} className="text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded text-[10px]" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
