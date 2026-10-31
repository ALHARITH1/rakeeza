import React from 'react';
import { UserCheck, MapPin } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Worker } from '../../types';
import { PageHeader, Card, Empty } from '../common/ui';

const opts: { v: Worker['status']; l: string; c: string }[] = [
  { v: 'present', l: 'حاضر', c: 'bg-emerald-600 text-white' },
  { v: 'absent', l: 'غائب', c: 'bg-rose-600 text-white' },
  { v: 'on_leave', l: 'إجازة', c: 'bg-sky-600 text-white' }
];

export const TeamAttendance: React.FC = () => {
  const { workers, selectedProjectId, selectedProject, setAttendance, can, toast } = usePlatform();
  // project team + company employees not assigned to any project
  const team = workers.filter((w) => (selectedProjectId && w.projectId === selectedProjectId) || !w.projectId);
  const today = new Date().toISOString().slice(0, 10);
  const present = team.filter((w) => w.status === 'present').length;
  return (
    <div className="space-y-4">
      <PageHeader icon={<UserCheck className="w-5 h-5 text-emerald-400" />} title="حضور الفريق اليومي" subtitle={`${selectedProjectId ? selectedProject.name + ' + الموظفين غير المسندين' : 'كل موظفي الشركة'} — ${today}`}
        actions={<button onClick={() => { const u = `${location.origin}${location.pathname}#attendance`; navigator.clipboard?.writeText(u); toast('تم نسخ رابط بوابة الحضور — شاركه مع العمال عبر واتساب'); }} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"><MapPin className="w-4 h-4" /> نسخ رابط بوابة الحضور</button>} />
      <div className="grid grid-cols-3 gap-3">
        <Card><div className="text-[11px] text-slate-400">الفريق</div><div className="text-2xl font-black font-mono">{team.length}</div></Card>
        <Card><div className="text-[11px] text-slate-400">حاضر</div><div className="text-2xl font-black font-mono text-emerald-400">{present}</div></Card>
        <Card><div className="text-[11px] text-slate-400">نسبة الحضور</div><div className="text-2xl font-black font-mono text-amber-400" dir="ltr">{team.length ? Math.round((present / team.length) * 100) : 0}%</div></Card>
      </div>
      <Card title="الكشف">
        {team.length === 0 ? <Empty text="لا يوجد موظفون مسندون لهذا المشروع" /> : (
          <div className="space-y-2">
            {team.map((w) => {
              const log = w.attendanceLog?.find((l) => l.date === today);
              return (
                <div key={w.id} data-entity={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">{w.name} <span className="text-slate-500 font-mono" dir="ltr">{w.empCode}</span></div>
                    <div className="text-[11px] text-slate-400">{w.role}{!w.projectId && <span className="text-sky-400"> · غير مسند لمشروع</span>}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> الحضور الجغرافي: {w.geoFenceStatus === 'inside_geofence' ? <span className="text-emerald-400">داخل نطاق الموقع</span> : <span className="text-rose-400">خارج النطاق</span>}
                      {log?.checkIn && <> · دخول <bdi dir="ltr">{log.checkIn}</bdi></>}{log?.checkOut && <> · خروج <bdi dir="ltr">{log.checkOut}</bdi></>}
                    </div>
                  </div>
                  <div className="flex gap-1" role="group" aria-label={`حالة ${w.name}`}>
                    {opts.map((o) => (
                      <button key={o.v} disabled={!can('team.attendance')}
                        onClick={() => { const r = setAttendance(w.id, o.v); if (!r.ok) toast(r.error, 'error'); }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${w.status === o.v ? o.c + ' border-transparent' : 'bg-slate-900 border-slate-700 text-slate-400'} disabled:opacity-50`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
