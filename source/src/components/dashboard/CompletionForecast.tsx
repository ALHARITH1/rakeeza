import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, CalendarClock, History, Loader2, Sparkles } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { CompletionForecast as Forecast, forecastCompletion, formatDateAr } from './healthMetrics';

/**
 * مؤشر توقعات الإنجاز
 * 1) A local engine always produces a forecast from the current production rate
 *    blended with the actual-vs-planned durations of comparable historical projects.
 * 2) "تحليل بالذكاء الاصطناعي" sends the same data to Gemini via the server
 *    (/api/forecast) for a refined date and a short narrative. If the server or
 *    API key is unavailable, the local forecast stays in place.
 */
export const CompletionForecast: React.FC = () => {
  const { selectedProject } = usePlatform();
  const local = useMemo(() => forecastCompletion(selectedProject), [selectedProject]);
  const [ai, setAi] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAi(null);
    setError(null);
  }, [selectedProject.id]);

  const f = ai ?? local;
  const contractualEnd = new Date(selectedProject.endDate);
  const start = new Date(selectedProject.startDate);
  const today = new Date();

  // Timeline positions (0-100%) for start → today → contractual end → forecast
  const span = Math.max(f.latestDate.getTime(), contractualEnd.getTime()) - start.getTime();
  const pos = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / span) * 100));

  const runAi = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          localForecast: {
            forecastDate: local.forecastDate.toISOString().slice(0, 10),
            historicalFactor: local.historicalFactor,
            rateBasedDays: local.rateBasedDays,
            historyBasedDays: local.historyBasedDays
          },
          historical: local.comparables,
          today: today.toISOString().slice(0, 10)
        })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || `HTTP ${res.status}`);
      const data = await res.json();
      const fd = new Date(data.forecastDate);
      if (isNaN(fd.getTime())) throw new Error('استجابة غير صالحة من محرك الذكاء الاصطناعي');
      const DAY = 86400000;
      setAi({
        ...local,
        source: 'ai',
        forecastDate: fd,
        earliestDate: new Date(data.earliestDate ?? fd.getTime() - 15 * DAY),
        latestDate: new Date(data.latestDate ?? fd.getTime() + 15 * DAY),
        delayDays: Math.round((fd.getTime() - contractualEnd.getTime()) / DAY),
        confidence: Math.round(Number(data.confidence) || local.confidence),
        narrative: data.narrative
      });
    } catch (e: any) {
      setError(
        'تعذر الوصول لمحرك الذكاء الاصطناعي حالياً — يتم عرض التوقع المحسوب محلياً من البيانات التاريخية. ' +
          (e?.message ? `(${e.message})` : '')
      );
    } finally {
      setLoading(false);
    }
  };

  const late = f.delayDays > 0;
  const tone = f.delayDays > 30 ? 'rose' : f.delayDays > 0 ? 'amber' : 'emerald';
  const toneText = { rose: 'text-rose-400', amber: 'text-amber-400', emerald: 'text-emerald-400' }[tone];
  const toneBg = {
    rose: 'bg-rose-500/10 border-rose-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20'
  }[tone];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-amber-400" />
          <span>مؤشر توقعات الإنجاز</span>
        </h2>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
            f.source === 'ai' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-sky-400 bg-sky-500/10 border-sky-500/20'
          }`}
        >
          {f.source === 'ai' ? <Sparkles className="w-3 h-3" /> : <History className="w-3 h-3" />}
          {f.source === 'ai' ? 'تحليل Gemini' : 'نموذج تاريخي'}
        </span>
      </div>

      <div className="text-[11px] text-slate-400 truncate mb-2">{selectedProject.name}</div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] text-slate-400">موعد التسليم المتوقع</div>
          <div className="text-xl font-black text-white">{formatDateAr(f.forecastDate)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            النطاق: {formatDateAr(f.earliestDate)} — {formatDateAr(f.latestDate)}
          </div>
        </div>
        <div className={`text-center px-3 py-2 rounded-lg border ${toneBg}`}>
          <div className={`text-lg font-black font-mono ${toneText}`}>
            {late ? '+' : ''}
            {f.delayDays}
          </div>
          <div className={`text-[10px] font-bold ${toneText}`}>{late ? 'يوم تأخير' : 'يوم مبكراً'}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-5 mb-2 relative h-10" dir="ltr">
        <div className="absolute top-4 left-0 right-0 h-1.5 bg-slate-800 rounded-full" />
        <div className="absolute top-4 h-1.5 bg-sky-500/70 rounded-l-full" style={{ left: 0, width: `${pos(today)}%` }} />
        <div
          className="absolute top-3.5 h-2.5 bg-purple-500/30 rounded"
          style={{ left: `${pos(f.earliestDate)}%`, width: `${Math.max(1, pos(f.latestDate) - pos(f.earliestDate))}%` }}
        />
        {[
          { d: today, c: '#38bdf8', l: 'اليوم' },
          { d: contractualEnd, c: '#94a3b8', l: 'التعاقدي' },
          { d: f.forecastDate, c: late ? '#f43f5e' : '#10b981', l: 'المتوقع' }
        ].map((m) => (
          <div key={m.l} className="absolute top-2" style={{ left: `calc(${pos(m.d)}% - 5px)` }}>
            <div className="w-2.5 h-5 rounded-sm" style={{ background: m.c }} />
            <div className="text-[9px] text-slate-400 mt-0.5 -translate-x-1/3 whitespace-nowrap">{m.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">الثقة</div>
          <div className="text-sm font-bold font-mono text-white">{f.confidence}%</div>
        </div>
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">معامل التأخر التاريخي</div>
          <div className="text-sm font-bold font-mono text-white">×{f.historicalFactor.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">مشاريع مماثلة</div>
          <div className="text-sm font-bold font-mono text-white">{f.sampleSize}</div>
        </div>
      </div>

      {f.narrative && (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-300 bg-purple-500/5 border border-purple-500/20 rounded-lg p-2.5">
          {f.narrative}
        </p>
      )}
      {error && <p className="mt-3 text-[10px] text-amber-400 leading-relaxed">{error}</p>}

      <button
        onClick={runAi}
        disabled={loading}
        className="mt-3 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[.98]"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
        {loading ? 'جاري التحليل...' : f.source === 'ai' ? 'إعادة التحليل بالذكاء الاصطناعي' : 'تحليل بالذكاء الاصطناعي (Gemini)'}
      </button>
    </div>
  );
};
