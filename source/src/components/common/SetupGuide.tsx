import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowLeft, X, Rocket } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

/** Step-by-step company setup for the admin. Each step opens the exact screen + form it needs. */
export const SetupGuide: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { serverCommands, onlineMode, can, company, allowedProjects, boqItems, workers, users, rolePerms, openItem, setActiveTab } = usePlatform();
  const key = `infraops:setup-hidden:${company?.id}`;
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(key) === '1'; } catch { return false; } });
  if (!can('users.manage') || !company) return null;

  // every step is independent — do them in any order
  const steps = [
    { t: 'هوية الشركة', d: 'ارفع الشعار — المنصة تاخذ لونك تلقائياً', done: !!company.logoDataUrl, go: () => setActiveTab('company') },
    { t: 'الموظفين (الموارد البشرية)', d: 'سجّلهم أو استوردهم من Excel — ما يحتاج مشروع', done: workers.length > 0, go: () => openItem('hr', 'import') },
    { t: 'دعوة الفريق والأطراف', d: 'مستخدمين النظام وأدوارهم', done: users.length > 1, go: () => openItem('users', 'invite') },
    { t: 'المشاريع', d: 'أنشئ مشروع لما يكون عندك واحد', done: allowedProjects.length > 0, go: () => openItem('boq', 'new-project') },
    { t: 'جدول الكميات', d: 'بنود المشروع — يدوي أو من Excel', done: boqItems.length > 0, go: () => openItem('boq', allowedProjects.length ? 'import' : 'new-project') },
    { t: 'صلاحيات الوظائف', d: 'شاشات وأزرار كل وظيفة (اختياري)', done: rolePerms.customized, go: () => setActiveTab('security'), optional: true }
  ].filter(s => !(onlineMode || serverCommands) || !['دعوة الفريق والأطراف', 'صلاحيات الوظائف'].includes(s.t));

  const required = steps.filter((s) => !s.optional);
  const doneCount = required.filter((s) => s.done).length;
  const allDone = doneCount === required.length;
  const next = steps.find((s) => !s.done);
  if ((hidden || allDone) && !compact) return null;

  return (
    <section className="bg-gradient-to-l from-amber-500/10 to-slate-900 border border-amber-500/30 rounded-2xl p-4" aria-label="تجهيز المنصة">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-black text-white">تجهيز منصة {company.name}</h2>
            <p className="text-[11px] text-slate-400">{doneCount} من {required.length} خطوات مكتملة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {next && (
            <button onClick={next.go} className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5">
              التالي: {next.t} <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {!compact && (
            <button onClick={() => { setHidden(true); try { localStorage.setItem(key, '1'); } catch { /* ignore */ } }} className="p-1.5 text-slate-400 hover:text-white" aria-label="إخفاء دليل التجهيز" title="إخفاء">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden"><div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(doneCount / required.length) * 100}%` }} /></div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
        {steps.map((s, i) => (
          <li key={s.t}>
            <button onClick={s.go} className={`w-full text-right p-2.5 rounded-xl border flex items-start gap-2 transition ${s.done ? 'border-emerald-500/30 bg-emerald-500/5' : s === next ? 'border-amber-500/60 bg-slate-950' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
              {s.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <span className="min-w-0">
                <span className={`block text-xs font-bold ${s.done ? 'text-emerald-300' : 'text-white'}`}>{i + 1}. {s.t}{s.optional ? ' (اختياري)' : ''}</span>
                <span className="block text-[10px] text-slate-400">{s.d}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};
