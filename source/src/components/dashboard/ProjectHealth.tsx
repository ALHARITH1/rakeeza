import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Activity, Bell, Briefcase, Gauge, ListChecks, TrendingDown, TrendingUp } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ProjectAlert, ProjectHealthRow, formatSar, healthColors, healthLabels } from './healthMetrics';

interface Props {
  rows: ProjectHealthRow[];
}

/* Bell with count + dropdown listing the alerts behind the number */
const AlertBell: React.FC<{ alerts: ProjectAlert[]; label: string }> = ({ alerts, label }) => {
  const { setActiveTab, setSelectedProjectId, projects } = usePlatform();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const count = alerts.length;
  const hasBudget = alerts.some((a) => a.kind === 'budget');

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`${label}: ${count} تنبيه`}
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center border transition ${
          count > 0
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            : 'bg-slate-950 text-slate-500 border-slate-800'
        }`}
      >
        <Bell className={`w-4 h-4 ${count > 0 ? 'animate-[wiggle_1.6s_ease-in-out_infinite]' : ''}`} />
        {count > 0 && (
          <span
            className={`absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold font-mono flex items-center justify-center ring-2 ring-slate-900 ${
              hasBudget ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
            }`}
          >
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 max-h-80 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-2 text-right">
          <div className="text-[11px] font-bold text-slate-300 px-2 py-1.5 border-b border-slate-800 mb-1">
            {label} — تتطلب تدخلاً فورياً
          </div>
          {count === 0 && <div className="text-xs text-slate-400 p-3 text-center">لا توجد تنبيهات حالياً</div>}
          {alerts.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setSelectedProjectId(a.projectId as any);
                setActiveTab(a.targetTab);
                setOpen(false);
              }}
              className="w-full text-right p-2 rounded-lg hover:bg-slate-950 transition flex gap-2 items-start"
            >
              <span
                className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.kind === 'budget' ? 'bg-rose-500' : 'bg-amber-500'}`}
              />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-200">{a.title}</span>
                <span className="block text-[10px] text-slate-400 truncate">{a.detail}</span>
                <span className="block text-[10px] text-slate-500 truncate">
                  {projects.find((p) => p.id === a.projectId)?.name}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* Circular progress gauge used as a visual indicator */
const Ring: React.FC<{ value: number; color: string; size?: number }> = ({ value, color, size = 56 }) => {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-slate-800" strokeWidth={6} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (v / 100) * c}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
};

export const ProjectHealth: React.FC<Props> = ({ rows }) => {
  const { selectedProjectId } = usePlatform();
  const [chartScope, setChartScope] = useState<'selected' | 'portfolio'>('selected');

  const active = rows.filter((r) => r.project.status !== 'completed');
  const totalContract = active.reduce((a, r) => a + r.project.contractValue, 0);
  const totalActual = active.reduce((a, r) => a + r.project.actualCost, 0);
  const totalEarned = active.reduce((a, r) => a + r.earnedValue, 0);
  const utilization = totalContract > 0 ? (totalActual / totalContract) * 100 : 0;
  const portfolioCpi = totalActual > 0 ? totalEarned / totalActual : 1;

  const budgetAlerts = rows.flatMap((r) => r.alerts.filter((a) => a.kind === 'budget'));
  const criticalAlerts = rows.flatMap((r) => r.alerts.filter((a) => a.kind === 'critical'));
  const atRiskProjects = rows.filter((r) => r.level === 'at_risk' || r.level === 'delayed');
  const projectAlerts = rows.flatMap((r) =>
    r.level === 'at_risk' || r.level === 'delayed'
      ? [
          {
            id: `${r.project.id}-lvl`,
            projectId: r.project.id,
            kind: (r.cpi < 1 ? 'budget' : 'critical') as ProjectAlert['kind'],
            title: healthLabels[r.level],
            detail: `SPI ${r.spi.toFixed(2)} · CPI ${r.cpi.toFixed(2)}`,
            targetTab: 'dashboard'
          }
        ]
      : []
  );

  const levelCounts = (['on_track', 'near_completion', 'at_risk', 'delayed'] as const).map((l) => ({
    level: l,
    count: rows.filter((r) => r.level === l).length
  }));

  // Budget vs actuals data
  const chartData = useMemo(() => {
    if (chartScope === 'selected') {
      const p = rows.find((r) => r.project.id === selectedProjectId)?.project;
      return (p?.financialTimeline ?? []).map((pt) => ({
        month: pt.month,
        budget: pt.budget / 1_000_000,
        actual: pt.actual / 1_000_000
      }));
    }
    // Portfolio: align by month index from each project's start
    const maxLen = Math.max(...rows.map((r) => r.project.financialTimeline.length));
    return Array.from({ length: maxLen }, (_, i) => ({
      month: `الشهر ${i + 1}`,
      budget: rows.reduce((a, r) => a + (r.project.financialTimeline[Math.min(i, r.project.financialTimeline.length - 1)]?.budget ?? 0), 0) / 1_000_000,
      actual: rows.reduce((a, r) => a + (r.project.financialTimeline[Math.min(i, r.project.financialTimeline.length - 1)]?.actual ?? 0), 0) / 1_000_000
    }));
  }, [chartScope, rows, selectedProjectId]);

  const last = chartData[chartData.length - 1];
  const variance = last ? last.actual - last.budget : 0;
  const selectedName = rows.find((r) => r.project.id === selectedProjectId)?.project.name;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4" aria-label="صحة المشاريع">
      <style>{`@keyframes wiggle{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(14deg)}90%{transform:rotate(-12deg)}95%{transform:rotate(8deg)}}`}</style>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>صحة المشاريع (Project Health)</span>
        </h2>
        <span className="text-[10px] text-slate-400">محسوبة آلياً من القيمة المكتسبة EVM وسجلات الجودة والتعارضات</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Active projects */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400">المشاريع النشطة</span>
            </div>
            <AlertBell alerts={projectAlerts} label="مشاريع تحت المراقبة" />
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-3xl font-black text-white font-mono tabular-nums">{active.length}</div>
            <div className="text-[11px] text-slate-400">{atRiskProjects.length} تحت المراقبة</div>
          </div>
          {/* Segmented status bar */}
          <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-slate-800 gap-0.5" role="img" aria-label="توزيع حالات المشاريع">
            {levelCounts.filter((l) => l.count > 0).map((l) => (
              <div key={l.level} style={{ flex: l.count, background: healthColors[l.level] }} title={`${healthLabels[l.level]}: ${l.count}`} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
            {levelCounts.filter((l) => l.count > 0).map((l) => (
              <span key={l.level} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: healthColors[l.level] }} />
                {healthLabels[l.level]} ({l.count})
              </span>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
        </div>

        {/* Card 2: Budget utilization */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400">استهلاك الميزانية الإجمالية</span>
            </div>
            <AlertBell alerts={budgetAlerts} label="تجاوزات الميزانية" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative">
              <Ring value={utilization} color={portfolioCpi >= 1 ? '#10b981' : '#f59e0b'} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono text-white">
                {utilization.toFixed(0)}%
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white font-mono tabular-nums" dir="ltr">
                {formatSar(totalActual)} <span className="text-[10px] text-slate-400 font-sans">ر.س</span>
              </div>
              <div className="text-[10px] text-slate-400">
                من <bdi dir="ltr">{formatSar(totalContract)}</bdi> ر.س
              </div>
              <div className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${portfolioCpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {portfolioCpi >= 1 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                CPI {portfolioCpi.toFixed(2)} · {portfolioCpi >= 1 ? 'ضمن الميزانية' : 'تجاوز'}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
        </div>

        {/* Card 3: Critical tasks */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <ListChecks className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400">المهام الحرجة</span>
            </div>
            <AlertBell alerts={criticalAlerts} label="المهام الحرجة" />
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className={`text-3xl font-black font-mono tabular-nums ${criticalAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {criticalAlerts.length}
            </div>
            <div className="text-[11px] text-slate-400">مهمة تتطلب إجراء</div>
          </div>
          <div className="mt-3 space-y-1.5">
            {rows.map((r) => {
              const n = r.alerts.filter((a) => a.kind === 'critical').length;
              const max = Math.max(1, ...rows.map((x) => x.alerts.filter((a) => a.kind === 'critical').length));
              return (
                <div key={r.project.id} className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400 truncate w-24 shrink-0" title={r.project.name}>
                    {r.project.location.split(' - ')[0]}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                  <span className="font-mono text-slate-300 w-4 text-left">{n}</span>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
        </div>
      </div>

      {/* Budget vs Actuals line chart */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-white">الميزانية المخططة مقابل الصرف الفعلي (Budget vs. Actuals)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {chartScope === 'selected' ? selectedName : 'المحفظة الكاملة — تراكمي من بداية كل مشروع'} · بالمليون ر.س
            </p>
          </div>
          <div className="flex items-center gap-2">
            {last && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  variance > 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                {variance > 0 ? 'تجاوز' : 'وفر'} <bdi dir="ltr">{Math.abs(variance).toFixed(2)}M</bdi>
              </span>
            )}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              {(['selected', 'portfolio'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setChartScope(s)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    chartScope === s ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s === 'selected' ? 'المشروع المحدد' : 'كل المشاريع'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" reversed />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" width={40} orientation="right" unit="M" />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, direction: 'rtl', fontSize: 12 }}
                labelStyle={{ color: '#fff', fontWeight: 700 }}
                formatter={(v: any, name: any) => [`${Number(v).toFixed(2)} مليون ر.س`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, direction: 'rtl' }} />
              {last && <ReferenceLine y={last.budget} stroke="#334155" strokeDasharray="4 4" />}
              <Line type="monotone" dataKey="budget" name="الميزانية المخططة" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="6 3" />
              <Line type="monotone" dataKey="actual" name="الصرف الفعلي" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
