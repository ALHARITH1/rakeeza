import {
  Project,
  NonConformanceReport,
  UtilityClash,
  MaterialRequisition,
  HistoricalProject
} from '../../types';
import { historicalProjects, projectTypeMap } from '../../data/mockData';

export type HealthLevel = 'on_track' | 'at_risk' | 'delayed' | 'near_completion';

export interface ProjectAlert {
  id: string;
  projectId: string;
  kind: 'budget' | 'critical';
  title: string;
  detail: string;
  targetTab: string;
}

export interface ProjectHealthRow {
  project: Project;
  spi: number;               // Schedule Performance Index
  cpi: number;               // Cost Performance Index
  earnedValue: number;
  budgetUtilization: number; // actualCost / contractValue (%)
  overrunAmount: number;     // actualCost - earnedValue when > 0
  level: HealthLevel;
  alerts: ProjectAlert[];
}

export const healthLabels: Record<HealthLevel, string> = {
  on_track: 'منتظم وفق الجدول',
  at_risk: 'تحت المراقبة',
  delayed: 'متأخر / حرج',
  near_completion: 'مرحلة التسليم'
};

export const healthColors: Record<HealthLevel, string> = {
  on_track: '#10b981',
  at_risk: '#f59e0b',
  delayed: '#f43f5e',
  near_completion: '#0ea5e9'
};

export function computeProjectHealth(
  projects: Project[],
  ncrs: NonConformanceReport[],
  utilityClashes: UtilityClash[],
  materialReqs: MaterialRequisition[]
): ProjectHealthRow[] {
  return projects.map((p) => {
    const spi = p.plannedProgress > 0 ? p.physicalProgress / p.plannedProgress : 1;
    const earnedValue = (p.physicalProgress / 100) * p.contractValue;
    const cpi = p.actualCost > 0 ? earnedValue / p.actualCost : 1;
    const budgetUtilization = (p.actualCost / p.contractValue) * 100;
    const overrunAmount = Math.max(0, p.actualCost - earnedValue);

    const alerts: ProjectAlert[] = [];

    if (cpi < 1) {
      alerts.push({
        id: `${p.id}-budget`,
        projectId: p.id,
        kind: 'budget',
        title: 'تجاوز في الميزانية',
        detail: `التكلفة الفعلية تتجاوز القيمة المكتسبة بنسبة ${((1 / cpi - 1) * 100).toFixed(1)}% (CPI ${cpi.toFixed(2)})`,
        targetTab: 'ppc'
      });
    }
    if (spi < 0.97) {
      alerts.push({
        id: `${p.id}-schedule`,
        projectId: p.id,
        kind: 'critical',
        title: 'تأخر عن الجدول الزمني',
        detail: `الإنجاز الفعلي ${p.physicalProgress}% مقابل المخطط ${p.plannedProgress}% (SPI ${spi.toFixed(2)})`,
        targetTab: 'dpr'
      });
    }
    ncrs
      .filter((n) => n.projectId === p.id && n.status !== 'closed')
      .forEach((n) =>
        alerts.push({
          id: n.id,
          projectId: p.id,
          kind: 'critical',
          title: `تقرير عدم مطابقة مفتوح ${n.ncrNumber}`,
          detail: n.description,
          targetTab: 'qaqc'
        })
      );
    utilityClashes
      .filter((c) => c.projectId === p.id && c.status === 'identified')
      .forEach((c) =>
        alerts.push({
          id: c.id,
          projectId: p.id,
          kind: 'critical',
          title: `تعارض خدمات غير منسق ${c.clashCode}`,
          detail: c.locationStreet,
          targetTab: 'utilities'
        })
      );
    materialReqs
      .filter((m) => m.projectId === p.id && m.status === 'pending_pm')
      .forEach((m) =>
        alerts.push({
          id: m.id,
          projectId: p.id,
          kind: 'critical',
          title: 'طلب مواد بانتظار اعتماد مدير المشروع',
          detail: `${m.reqNumber} — ${m.materialName}`,
          targetTab: 'procurement'
        })
      );

    let level: HealthLevel = 'on_track';
    if (p.status === 'near_completion' && spi >= 0.97) level = 'near_completion';
    if (spi < 0.97 || cpi < 0.97) level = 'at_risk';
    if (p.status === 'delayed' || spi < 0.92) level = 'delayed';

    return { project: p, spi, cpi, earnedValue, budgetUtilization, overrunAmount, level, alerts };
  });
}

/* ------------------------------------------------------------------ */
/*  Completion forecast engine (historical-data based)                 */
/* ------------------------------------------------------------------ */

export interface CompletionForecast {
  projectId: string;
  forecastDate: Date;
  earliestDate: Date;
  latestDate: Date;
  delayDays: number;          // vs contractual end date (negative = ahead)
  confidence: number;         // 0-100
  historicalFactor: number;   // avg actual/planned duration for similar projects
  rateBasedDays: number;
  historyBasedDays: number;
  sampleSize: number;
  comparables: HistoricalProject[];
  source: 'local' | 'ai';
  narrative?: string;
}

const DAY = 24 * 60 * 60 * 1000;

export function forecastCompletion(p: Project, today: Date = new Date()): CompletionForecast {
  const start = new Date(p.startDate);
  const end = new Date(p.endDate);
  const plannedDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY));
  const elapsedDays = Math.max(1, Math.round((today.getTime() - start.getTime()) / DAY));
  const progress = Math.max(1, Math.min(100, p.physicalProgress));

  const type = projectTypeMap[p.id];
  const comparables = historicalProjects.filter((h) => h.type === type);
  const pool = comparables.length ? comparables : historicalProjects;
  const ratios = pool.map((h) => h.actualDurationDays / h.plannedDurationDays);
  const historicalFactor = ratios.reduce((a, b) => a + b, 0) / ratios.length;

  // Adjust the historical factor by how the current project performs vs. its peers at midpoint
  const peerSpi = pool.reduce((a, h) => a + h.midpointSpi, 0) / pool.length;
  const currentSpi = p.plannedProgress > 0 ? p.physicalProgress / p.plannedProgress : 1;
  const adjustedFactor = historicalFactor * Math.pow(peerSpi / Math.max(0.5, currentSpi), 0.5);

  const rateBasedDays = elapsedDays / (progress / 100);
  const historyBasedDays = plannedDays * adjustedFactor;

  // The more progress is achieved, the more weight the actual production rate receives
  const w = progress / 100;
  let forecastDays = w * rateBasedDays + (1 - w) * historyBasedDays;
  // Never forecast earlier than today when work remains
  const minDays = elapsedDays + (progress < 100 ? 7 : 0);
  forecastDays = Math.max(forecastDays, minDays);

  // Spread of ratios → uncertainty band
  const mean = historicalFactor;
  const variance = ratios.reduce((a, r) => a + (r - mean) ** 2, 0) / ratios.length;
  const std = Math.sqrt(variance);
  const remaining = Math.max(0, forecastDays - elapsedDays);
  const bandDays = Math.round(remaining * (0.08 + std) + 5);

  const forecastDate = new Date(start.getTime() + forecastDays * DAY);
  const earliestDate = new Date(Math.max(today.getTime(), forecastDate.getTime() - bandDays * DAY));
  const latestDate = new Date(forecastDate.getTime() + bandDays * DAY);
  const delayDays = Math.round((forecastDate.getTime() - end.getTime()) / DAY);

  const confidence = Math.round(
    Math.min(95, Math.max(45, 55 + progress * 0.35 + Math.min(pool.length, 5) * 2 - std * 100))
  );

  return {
    projectId: p.id,
    forecastDate,
    earliestDate,
    latestDate,
    delayDays,
    confidence,
    historicalFactor,
    rateBasedDays: Math.round(rateBasedDays),
    historyBasedDays: Math.round(historyBasedDays),
    sampleSize: pool.length,
    comparables: pool,
    source: 'local'
  };
}

export const formatDateAr = (d: Date) =>
  d.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

export const formatSar = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n));
