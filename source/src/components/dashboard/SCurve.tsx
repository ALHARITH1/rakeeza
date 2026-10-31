import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Project } from '../../types';
import { monthLabel } from '../../store/seed';

/**
 * Cumulative S-curve: planned (logistic over the contractual dates) vs actual
 * (shape follows the project's cumulative execution history, ending at the
 * current BOQ-based physical progress).
 */
export const SCurve: React.FC<{ project: Project; height?: number }> = ({ project, height = 240 }) => {
  const data = useMemo(() => {
    const s = new Date(project.startDate), e = new Date(project.endDate);
    const months: Date[] = [];
    for (let d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1)); d <= e; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) months.push(d);
    if (months.length < 2) months.push(e);
    const total = e.getTime() - s.getTime();
    const logistic = (t: number) => {
      const x = Math.max(0, Math.min(1, (t - s.getTime()) / Math.max(1, total)));
      const f = (v: number) => 1 / (1 + Math.exp(-10 * (v - 0.5)));
      return ((f(x) - f(0)) / (f(1) - f(0))) * 100;
    };
    const now = Date.now();
    const tl = project.financialTimeline;
    const lastBudget = tl.length ? tl[tl.length - 1].actual || 1 : 1;
    const elapsedIdx = months.findIndex((m) => m.getTime() > now);
    const lastActualIdx = elapsedIdx === -1 ? months.length - 1 : Math.max(0, elapsedIdx - 1);
    return months.map((m, i) => {
      const end = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getTime();
      let actual: number | null = null;
      if (i <= lastActualIdx) {
        const share = tl.length ? (tl[Math.min(i, tl.length - 1)].actual || 0) / lastBudget : (i + 1) / (lastActualIdx + 1);
        actual = i === lastActualIdx ? project.physicalProgress : Math.min(project.physicalProgress, share * project.physicalProgress);
      }
      return { month: monthLabel(m), planned: Number(logistic(end).toFixed(1)), actual: actual == null ? null : Number(actual.toFixed(1)) };
    });
  }, [project]);

  return (
    <div style={{ height }} dir="ltr" className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#334155" reversed interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#334155" width={36} orientation="right" unit="%" />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, direction: 'rtl', fontSize: 12 }} formatter={(v: any, n: any) => [`${v}%`, n]} />
          <Legend wrapperStyle={{ fontSize: 11, direction: 'rtl' }} />
          <ReferenceLine y={100} stroke="#334155" />
          <Line type="monotone" dataKey="planned" name="المخطط التراكمي" stroke="#38bdf8" strokeWidth={2} dot={false} strokeDasharray="6 3" />
          <Line type="monotone" dataKey="actual" name="المنفذ الفعلي التراكمي" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
