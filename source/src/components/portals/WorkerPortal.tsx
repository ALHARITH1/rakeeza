import React, { useState } from 'react';
import { LogIn, LogOut, CalendarDays, Wallet, Receipt, Package, FileText, GraduationCap, AlertOctagon, MapPin, CheckCircle2 } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Card, Btn, Field, inputCls, StatusBadge, Modal, fmt } from '../common/ui';

type Panel = null | 'leave' | 'advance' | 'hazard';

/** Simple mobile-first portal: the worker sees only his own data */
export const WorkerPortal: React.FC = () => {
  const { serverCommands, myWorker, checkIn, checkOut, requestLeave, requestAdvance, signTbt, reportHazard, toolboxTalks, leaveRequests, advances, toast, selectedProject } = usePlatform();
  const [panel, setPanel] = useState<Panel>(null);
  const [inside, setInside] = useState(true);
  const [leave, setLeave] = useState({ type: 'annual' as const, startDate: '', endDate: '', reason: '' });
  const [adv, setAdv] = useState({ amount: '', reason: '' });
  const [hz, setHz] = useState({ location: '', description: '', severity: 'medium' as const });
  const [err, setErr] = useState('');

  if (!myWorker) return <Card><div className="text-xs text-slate-300">حسابك غير مرتبط بسجل موظف. تواصل مع الموارد البشرية.</div></Card>;
  const w = myWorker;
  const today = serverCommands ? new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()) : new Date().toISOString().slice(0, 10);
  const log = w.attendanceLog?.find((l) => l.date === today);
  const isSaudi = w.nationality.includes('سعودي');
  const tbts = toolboxTalks.filter((t) => t.projectId === w.projectId);
  const done = (r: { ok: boolean; error?: string }, msg: string) => { if (!r.ok) { setErr((r as any).error); return false; } toast(msg); setPanel(null); setErr(''); return true; };

  return (
    <div className="max-w-xl mx-auto space-y-3">
      <div className="bg-gradient-to-br from-amber-500/15 to-slate-900 border border-amber-500/30 rounded-2xl p-4">
        <div className="text-xs text-slate-400">مرحباً</div>
        <div className="text-lg font-black text-white">{w.name}</div>
        <div className="text-[11px] text-slate-300">{w.role} · <span dir="ltr" className="font-mono">{w.empCode}</span></div>
        <div className="text-[11px] text-slate-400 mt-1">{selectedProject.name}</div>
      </div>

      {/* Attendance */}
      <Card title={<><MapPin className="w-4 h-4 text-emerald-400" /> الحضور والانصراف — <bdi dir="ltr">{today}</bdi></>}>
        {serverCommands ? <p className="text-xs text-slate-400 mb-3">يطلب المتصفح موقعًا حديثًا. يحسب الخادم المسافة والدقة. الموقع من المتصفح وليس ضمانًا ضد تزييف GPS. راقب تأكيد الخادم أعلى الصفحة.</p> : <label className="flex items-center gap-2 text-[11px] text-slate-300 mb-3">
          <input type="checkbox" checked={inside} onChange={(e) => setInside(e.target.checked)} />
          موقعي الحالي داخل النطاق الجغرافي للمشروع (يُحدد تلقائياً عبر GPS في تطبيق الجوال)
        </label>}
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="success" className="py-4 text-sm" disabled={!!log?.checkIn} icon={<LogIn className="w-5 h-5" />}
            onClick={() => { const r = checkIn(inside); toast(r.ok ? (serverCommands ? 'جارٍ طلب الموقع وتأكيد الخادم' : 'تم تسجيل الحضور') : r.error, r.ok ? 'success' : 'error'); }}>
            {log?.checkIn ? <>حضور <bdi dir="ltr">{log.checkIn}</bdi></> : 'تسجيل حضور'}
          </Btn>
          <Btn variant="danger" className="py-4 text-sm" disabled={!log?.checkIn || !!log?.checkOut} icon={<LogOut className="w-5 h-5" />}
            onClick={() => { const r = checkOut(); toast(r.ok ? (serverCommands ? 'جارٍ طلب الموقع وتأكيد الخادم' : 'تم تسجيل الانصراف') : r.error, r.ok ? 'success' : 'error'); }}>
            {log?.checkOut ? <>انصراف <bdi dir="ltr">{log.checkOut}</bdi></> : 'تسجيل انصراف'}
          </Btn>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <Btn variant="ghost" className="py-4 flex-col" icon={<CalendarDays className="w-5 h-5 text-sky-400" />} onClick={() => { setPanel('leave'); setErr(''); }}>طلب إجازة</Btn>
        <Btn variant="ghost" className="py-4 flex-col" icon={<Wallet className="w-5 h-5 text-amber-400" />} onClick={() => { setPanel('advance'); setErr(''); }}>طلب سلفة</Btn>
        <Btn variant="ghost" className="py-4 flex-col" icon={<AlertOctagon className="w-5 h-5 text-rose-400" />} onClick={() => { setPanel('hazard'); setErr(''); }}>إبلاغ عن خطر</Btn>
      </div>

      {/* Requests */}
      <Card title={<><CalendarDays className="w-4 h-4 text-sky-400" /> طلباتي</>}>
        <div className="text-[11px] text-slate-400 mb-2">رصيد الإجازات: <b className="text-white">{w.leaveBalanceDays}</b> يوم</div>
        <div className="space-y-1.5">
          {leaveRequests.map((l) => (
            <div key={l.id} data-entity={l.id} className="flex items-center justify-between text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <span>إجازة {l.daysCount} يوم · <bdi dir="ltr">{l.startDate}</bdi></span><StatusBadge status={l.status} />
            </div>
          ))}
          {advances.map((a) => (
            <div key={a.id} data-entity={a.id} className="flex items-center justify-between text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <span>سلفة <bdi dir="ltr" className="font-mono">{fmt(a.amount)}</bdi> ر.س · <bdi dir="ltr">{a.date}</bdi></span><StatusBadge status={a.status} />
            </div>
          ))}
          {leaveRequests.length + advances.length === 0 && <div className="text-xs text-slate-400">لا توجد طلبات</div>}
        </div>
      </Card>

      {/* Payslip */}
      <Card title={<><Receipt className="w-4 h-4 text-emerald-400" /> كشف راتبي</>}>
        {[
          ['الراتب الأساسي', w.basicSalary], ['بدل السكن', w.housingAllowance], ['بدل النقل', w.transportAllowance], ['بدل الموقع', w.siteAllowance],
          ['خصم التأمينات (GOSI)', -w.gosiDeduction]
        ].map(([l, v]) => (
          <div key={l as string} className="flex justify-between text-xs py-1 border-b border-slate-800/60"><span className="text-slate-400">{l}</span><bdi dir="ltr" className={`font-mono ${(v as number) < 0 ? 'text-rose-400' : 'text-slate-200'}`}>{fmt(v as number)}</bdi></div>
        ))}
        <div className="flex justify-between text-sm pt-2 font-bold"><span>الصافي</span><bdi dir="ltr" className="font-mono text-emerald-400">{fmt(w.basicSalary + w.housingAllowance + w.transportAllowance + w.siteAllowance - w.gosiDeduction)} ر.س</bdi></div>
      </Card>

      {/* Custody & documents */}
      <Card title={<><Package className="w-4 h-4 text-amber-400" /> عهدتي</>}>
        {w.assetsHandedOver.length ? <ul className="list-disc pr-5 text-xs text-slate-200 space-y-1">{w.assetsHandedOver.map((a) => <li key={a}>{a}</li>)}</ul> : <div className="text-xs text-slate-400">لا توجد عهد</div>}
        <div className="text-[11px] text-slate-400 mt-2">السلف والعهد النقدية: <bdi dir="ltr" className="font-mono text-white">{fmt(w.pettyCashBalance)}</bdi> ر.س</div>
      </Card>
      <Card title={<><FileText className="w-4 h-4 text-sky-400" /> وثائقي</>}>
        {[
          [isSaudi ? 'رقم الهوية' : 'رقم الإقامة', w.iqamaNumber, isSaudi ? null : w.iqamaExpiry],
          ['التأمين الطبي', '', w.medicalInsuranceExpiry],
          ['رخصة القيادة', '', w.drivingLicenseExpiry],
          ['عقد قوى', w.qiwaContractNumber, null]
        ].filter(([, , e], i) => i !== 2 || e).map(([l, n, e]) => {
          const days = e ? Math.ceil((new Date(e as string).getTime() - Date.now()) / 86400000) : null;
          return (
            <div key={l as string} className="flex justify-between text-xs py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">{l}</span>
              <span className="text-left">{n && <bdi dir="ltr" className="font-mono text-slate-200">{n}</bdi>}{e && <span className={`block text-[10px] ${days! < 30 ? 'text-rose-400' : 'text-slate-400'}`}>ينتهي <bdi dir="ltr">{e}</bdi></span>}</span>
            </div>
          );
        })}
      </Card>

      {/* TBT */}
      <Card title={<><GraduationCap className="w-4 h-4 text-purple-400" /> محاضرات السلامة (TBT)</>}>
        <div className="space-y-2">
          {tbts.map((t) => {
            const signed = t.signedWorkerIds?.includes(w.id);
            return (
              <div key={t.id} className="flex items-center justify-between gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-200">{t.topic}<span className="block text-[10px] text-slate-500"><bdi dir="ltr">{t.date}</bdi> · {t.conductorName}</span></span>
                {signed ? <span className="text-[11px] text-emerald-400 flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> موقّع</span>
                  : <Btn variant="info" className="shrink-0" onClick={() => { const r = signTbt(t.id); toast(r.ok ? 'تم توقيع الحضور' : r.error, r.ok ? 'success' : 'error'); }}>توقيع الحضور</Btn>}
              </div>
            );
          })}
          {tbts.length === 0 && <div className="text-xs text-slate-400">لا توجد محاضرات</div>}
        </div>
      </Card>

      <Modal open={panel === 'leave'} onClose={() => setPanel(null)} size="sm" title="طلب إجازة"
        footer={<><Btn variant="ghost" onClick={() => setPanel(null)}>إلغاء</Btn><Btn onClick={() => done(requestLeave(leave), 'تم إرسال طلب الإجازة للموارد البشرية')}>إرسال</Btn></>}>
        <div className="space-y-3">
          <Field label="النوع"><select className={inputCls} value={leave.type} onChange={(e) => setLeave({ ...leave, type: e.target.value as any })}><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="emergency">اضطرارية</option><option value="unpaid">بدون راتب</option></select></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="من"><input type="date" className={inputCls} value={leave.startDate} onChange={(e) => setLeave({ ...leave, startDate: e.target.value })} /></Field>
            <Field label="إلى"><input type="date" className={inputCls} value={leave.endDate} onChange={(e) => setLeave({ ...leave, endDate: e.target.value })} /></Field>
          </div>
          <Field label="السبب"><textarea rows={2} className={inputCls} value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} /></Field>
          {err && <div className="text-xs text-rose-400">{err}</div>}
        </div>
      </Modal>
      <Modal open={panel === 'advance'} onClose={() => setPanel(null)} size="sm" title="طلب سلفة"
        footer={<><Btn variant="ghost" onClick={() => setPanel(null)}>إلغاء</Btn><Btn onClick={() => done(requestAdvance({ amount: Number(adv.amount), reason: adv.reason }), 'تم إرسال طلب السلفة')}>إرسال</Btn></>}>
        <div className="space-y-3">
          <Field label="المبلغ (ر.س)" hint={`الحد الأعلى ${fmt(w.basicSalary)} ر.س`}><input type="number" className={`${inputCls} font-mono text-left`} value={adv.amount} onChange={(e) => setAdv({ ...adv, amount: e.target.value })} /></Field>
          <Field label="السبب"><textarea rows={2} className={inputCls} value={adv.reason} onChange={(e) => setAdv({ ...adv, reason: e.target.value })} /></Field>
          {err && <div className="text-xs text-rose-400">{err}</div>}
        </div>
      </Modal>
      <Modal open={panel === 'hazard'} onClose={() => setPanel(null)} size="sm" title="الإبلاغ عن خطر"
        footer={<><Btn variant="ghost" onClick={() => setPanel(null)}>إلغاء</Btn><Btn variant="danger" onClick={() => done(reportHazard(hz), 'تم إرسال البلاغ لمسؤول السلامة')}>إرسال البلاغ</Btn></>}>
        <div className="space-y-3">
          <Field label="الموقع"><input className={inputCls} value={hz.location} onChange={(e) => setHz({ ...hz, location: e.target.value })} /></Field>
          <Field label="وصف الخطر"><textarea rows={3} className={inputCls} value={hz.description} onChange={(e) => setHz({ ...hz, description: e.target.value })} /></Field>
          <Field label="الخطورة"><select className={inputCls} value={hz.severity} onChange={(e) => setHz({ ...hz, severity: e.target.value as any })}><option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية — خطر فوري</option></select></Field>
          {err && <div className="text-xs text-rose-400">{err}</div>}
        </div>
      </Modal>
    </div>
  );
};
