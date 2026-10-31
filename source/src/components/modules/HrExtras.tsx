import React, { useMemo } from 'react';
import { Inbox, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Worker } from '../../types';
import { Card, Modal, StatusBadge, Btn, fmt } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';
import { roleLabels } from '../../store/permissions';

const today = () => new Date().toISOString().slice(0, 10);
/** Probation status is always computed from today's date */
export const probationPassed = (w: Worker) => !!w.probationEndDate && w.probationEndDate < today();
export const isSaudi = (w: { nationality: string }) => w.nationality.includes('سعودي');
export const idLabel = (w: { nationality: string }) => (isSaudi(w) ? 'هوية' : 'إقامة');
const daysTo = (d?: string) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);

/** Leave & advance requests coming from the worker portal */
export const HrRequestsPanel: React.FC = () => {
  const { leaveRequests, advances, selectedProjectId, leaveAction, advanceAction, can, toast, workers } = usePlatform();
  const leaves = leaveRequests.filter((l) => l.status === 'pending');
  const advs = advances.filter((a) => a.status === 'pending');
  const expiring = workers.flatMap((w) => {
    const out: { w: Worker; what: string; d: number }[] = [];
    const iq = daysTo(w.iqamaExpiry), ins = daysTo(w.medicalInsuranceExpiry);
    if (!isSaudi(w) && iq != null && iq <= 60) out.push({ w, what: 'الإقامة', d: iq });
    if (ins != null && ins <= 60) out.push({ w, what: 'التأمين الطبي', d: ins });
    return out;
  });
  if (!leaves.length && !advs.length && !expiring.length) return null;
  const done = (r: { ok: boolean; error?: string }, m: string) => toast(r.ok ? m : (r as any).error, r.ok ? 'success' : 'error');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {(leaves.length > 0 || advs.length > 0) && (
        <Card title={<><Inbox className="w-4 h-4 text-amber-400" /> طلبات الموظفين بانتظار قرارك ({leaves.length + advs.length})</>}>
          <div className="space-y-2">
            {leaves.map((l) => (
              <div key={l.id} data-entity={l.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span><b className="text-white">{l.workerName}</b> — إجازة {l.daysCount} يوم <span className="text-slate-400">(<bdi dir="ltr">{l.startDate}</bdi> → <bdi dir="ltr">{l.endDate}</bdi>)</span>{l.reason && <span className="block text-[10px] text-slate-400">{l.reason}</span>}</span>
                {can('hr.leave_approve') && <span className="flex gap-1 shrink-0"><Btn variant="danger" icon={<XCircle className="w-3.5 h-3.5" />} onClick={() => done(leaveAction(l.id, false), 'تم رفض الإجازة')}>رفض</Btn><Btn variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => done(leaveAction(l.id, true), 'تم اعتماد الإجازة')}>اعتماد</Btn></span>}
              </div>
            ))}
            {advs.map((a) => (
              <div key={a.id} data-entity={a.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span><b className="text-white">{a.workerName}</b> — سلفة <bdi dir="ltr" className="font-mono">{fmt(a.amount)}</bdi> ر.س{a.reason && <span className="block text-[10px] text-slate-400">{a.reason}</span>}</span>
                {can('hr.leave_approve') && <span className="flex gap-1 shrink-0"><Btn variant="danger" onClick={() => done(advanceAction(a.id, false), 'تم رفض السلفة')}>رفض</Btn><Btn variant="success" onClick={() => done(advanceAction(a.id, true), 'تم اعتماد السلفة')}>اعتماد</Btn></span>}
              </div>
            ))}
          </div>
        </Card>
      )}
      {expiring.length > 0 && (
        <Card title={<><AlertTriangle className="w-4 h-4 text-rose-400" /> وثائق قاربت على الانتهاء ({expiring.length})</>}>
          <div className="space-y-1.5">
            {expiring.map((e, i) => (
              <div key={i} className="flex justify-between text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg">
                <span>{e.w.name} — {e.what}</span>
                <span className={e.d < 15 ? 'text-rose-400 font-bold' : 'text-amber-400'}>{e.d < 0 ? `منتهية منذ ${-e.d} يوم` : `${e.d} يوم`}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

/** Employee file: personal data + every action recorded against the employee */
export const EmployeeProfile: React.FC<{ workerId: string | null; onClose: () => void }> = ({ workerId, onClose }) => {
  const { workers, leaveRequests, advances, disciplinaryViolations, settlements, audit, hazards, toolboxTalks, allowedProjects, assignWorker, can, toast } = usePlatform();
  const w = workers.find((x) => x.id === workerId);
  const timeline = useMemo(() => {
    if (!w) return [];
    return audit.filter((a) => a.entityId === w.id || a.entityCode === w.empCode || a.entityCode === w.name || a.details?.includes(w.name) || a.entityCode?.includes(w.name)).slice(0, 40);
  }, [audit, w]);
  if (!w) return null;
  const leaves = leaveRequests.filter((l) => l.workerId === w.id);
  const advs = advances.filter((a) => a.workerId === w.id);
  const viols = disciplinaryViolations.filter((v) => v.workerId === w.id);
  const eosb = settlements.filter((s) => s.workerId === w.id);
  const tbts = toolboxTalks.filter((t) => t.signedWorkerIds?.includes(w.id));
  const hz = hazards.filter((h) => h.reportedByWorkerId === w.id);
  const docs: [string, string | undefined][] = [
    [idLabel(w), isSaudi(w) ? undefined : w.iqamaExpiry], ['التأمين الطبي', w.medicalInsuranceExpiry], ['رخصة القيادة', w.drivingLicenseExpiry]
  ];
  return (
    <Modal open onClose={onClose} size="lg" title={<span>{w.name} <CodeBdi code={w.empCode} className="text-amber-400 text-xs" /></span>} subtitle={`${w.role} · ${w.nationality}`}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {[
          [`رقم ${idLabel(w)}`, <bdi dir="ltr" className="font-mono">{w.iqamaNumber}</bdi>],
          ['تاريخ المباشرة', <bdi dir="ltr">{w.joinDate}</bdi>],
          ['فترة التجربة', probationPassed(w) ? <span className="text-emerald-400">منتهية في <bdi dir="ltr">{w.probationEndDate}</bdi></span> : <span className="text-amber-400">سارية حتى <bdi dir="ltr">{w.probationEndDate}</bdi></span>],
          ['الراتب الإجمالي', <bdi dir="ltr" className="font-mono">{fmt(w.totalMonthlySalary)}</bdi>],
          ['رصيد الإجازات', `${w.leaveBalanceDays} يوم`],
          ['المخالفات', w.violationsCount],
          ['السلف/العهد النقدية', <bdi dir="ltr" className="font-mono">{fmt(w.pettyCashBalance)}</bdi>],
          ['عقد قوى', <bdi dir="ltr" className="font-mono">{w.qiwaContractNumber}</bdi>]
        ].map(([l, v], i) => <div key={i} className="p-2 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">{l}</div><div className="text-slate-200 font-semibold">{v}</div></div>)}
      </div>
      <label className="flex items-center gap-2 mt-3 text-xs">
        <span className="text-slate-400 shrink-0">المشروع:</span>
        <select disabled={!can('hr.manage')} value={w.projectId} onChange={(e) => { const r = assignWorker(w.id, e.target.value); toast(r.ok ? 'تم تحديث إسناد الموظف' : r.error, r.ok ? 'success' : 'error'); }}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white disabled:opacity-60">
          <option value="">غير مسند — موظف على الشركة</option>
          {allowedProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
        {docs.filter(([, d], i) => i === 0 || d).map(([l, d]) => {
          const n = daysTo(d);
          return <div key={l} className={`p-2 rounded-lg border text-xs ${n != null && n < 30 ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800 bg-slate-950'}`}><div className="text-[10px] text-slate-400">{l}</div>{d ? <><bdi dir="ltr">{d}</bdi> <span className={n! < 30 ? 'text-rose-400' : 'text-slate-400'}>({n! < 0 ? 'منتهية' : `${n} يوم`})</span></> : <span className="text-slate-400">لا تنتهي (مواطن)</span>}</div>;
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
        <div><div className="font-bold text-white mb-1">الإجازات ({leaves.length})</div>{leaves.map((l) => <div key={l.id} className="flex justify-between py-1 border-b border-slate-800/60"><span>{l.daysCount} يوم · <bdi dir="ltr">{l.startDate}</bdi></span><StatusBadge status={l.status} /></div>)}</div>
        <div><div className="font-bold text-white mb-1">السلف ({advs.length})</div>{advs.map((a) => <div key={a.id} className="flex justify-between py-1 border-b border-slate-800/60"><bdi dir="ltr" className="font-mono">{fmt(a.amount)}</bdi><StatusBadge status={a.status} /></div>)}</div>
        <div><div className="font-bold text-white mb-1">المخالفات ({viols.length})</div>{viols.map((v) => <div key={v.id} className="py-1 border-b border-slate-800/60"><bdi dir="ltr">{v.date}</bdi> — {v.description}</div>)}</div>
        <div><div className="font-bold text-white mb-1">محاضرات السلامة الموقعة ({tbts.length}) وبلاغات الخطر ({hz.length})</div>{tbts.map((t) => <div key={t.id} className="py-1 border-b border-slate-800/60">{t.topic}</div>)}{hz.map((h) => <div key={h.id} className="py-1 border-b border-slate-800/60 text-rose-300">{h.code}: {h.description}</div>)}</div>
        {eosb.length > 0 && <div className="md:col-span-2"><div className="font-bold text-white mb-1">مخالصات نهاية الخدمة</div>{eosb.map((e) => <div key={e.id} className="py-1"><bdi dir="ltr" className="font-mono">{fmt(e.finalNetSettlementSar)}</bdi> ر.س — <StatusBadge status={e.status === 'draft' ? 'draft' : 'approved'} /></div>)}</div>}
      </div>
      <div className="mt-4">
        <div className="font-bold text-white text-xs mb-1">سجل الإجراءات على الموظف</div>
        {timeline.length === 0 ? <div className="text-xs text-slate-400">لا توجد إجراءات مسجلة بعد</div> : timeline.map((a) => (
          <div key={a.id} className="text-[11px] py-1 border-b border-slate-800/60"><bdi dir="ltr" className="text-slate-500">{new Date(a.at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</bdi> — <b className="text-slate-200">{a.action}</b> <span className="text-slate-400">بواسطة {a.userName} ({roleLabels[a.role]})</span>{a.details && <span className="text-slate-400"> · {a.details}</span>}</div>
        ))}
      </div>
    </Modal>
  );
};
