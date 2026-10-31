import React, { useEffect, useMemo, useState } from 'react';
import { FileCheck2, PlusCircle, Sun, Users, Truck, Camera, MapPin, CheckCircle2, XCircle, Send } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { DailyProgressReport } from '../../types';
import { PageHeader, Card, Modal, StatusBadge, WorkflowStepper, History, Btn, ConfirmDialog, Empty, fmt, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

interface Props { onOpenNewDprModal: () => void }

const stepIndex: Record<DailyProgressReport['status'], number> = { draft: 0, submitted: 1, pm_approved: 2, consultant_approved: 4, rejected: 1 };
const steps = ['مسودة', 'مرفوع', 'اعتماد مدير المشروع', 'اعتماد الاستشاري', 'مُرحّل'];

export const DprDetail: React.FC<{ report: DailyProgressReport | null; onClose: () => void }> = ({ report, onClose }) => {
  const { can, dprAction, submitDpr, toast, currentUser } = usePlatform();
  const [confirm, setConfirm] = useState<null | 'pm_approve' | 'consultant_approve' | 'reject'>(null);
  if (!report) return null;
  const r = report;
  const canPm = r.status === 'submitted' && can('dpr.pm_approve');
  const canCons = r.status === 'pm_approved' && can('dpr.consultant_approve');
  const canSubmit = r.status === 'draft' && can('dpr.create') && r.createdByUserId === currentUser?.id;
  const run = (action: 'pm_approve' | 'consultant_approve' | 'reject', note: string) => {
    const res = dprAction(r.id, action, note || undefined);
    setConfirm(null);
    if (!res.ok) toast(res.error, 'error');
    else { toast(action === 'reject' ? 'تم رفض التقرير' : action === 'consultant_approve' ? 'تم الاعتماد وترحيل الكميات لجدول الكميات' : 'تم الاعتماد وإحالته للاستشاري'); onClose(); }
  };
  return (
    <>
      <Modal open onClose={onClose} size="lg" title={<span className="flex items-center gap-2"><CodeBdi code={r.reportNumber} /> <StatusBadge status={r.status} /></span>}
        subtitle={`${r.sector} — ${r.date}`}
        footer={<>
          {canSubmit && <Btn icon={<Send className="w-4 h-4" />} onClick={() => { const x = submitDpr(r.id); toast(x.ok ? 'تم رفع التقرير' : x.error, x.ok ? 'success' : 'error'); if (x.ok) onClose(); }}>رفع لمدير المشروع</Btn>}
          {(canPm || canCons) && <Btn variant="danger" icon={<XCircle className="w-4 h-4" />} onClick={() => setConfirm('reject')}>رفض</Btn>}
          {canPm && <Btn variant="success" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setConfirm('pm_approve')}>اعتماد مدير المشروع</Btn>}
          {canCons && <Btn variant="success" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setConfirm('consultant_approve')}>اعتماد الاستشاري وترحيل الكميات</Btn>}
          <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
        </>}>
        <WorkflowStepper steps={steps} current={stepIndex[r.status]} rejected={r.status === 'rejected'} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800"><Sun className="w-3.5 h-3.5 text-amber-400 inline ml-1" />{r.weather.condition} · <bdi dir="ltr">{r.weather.tempC}°C</bdi></div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800"><Users className="w-3.5 h-3.5 text-sky-400 inline ml-1" />{r.workforceCount} عامل</div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800"><Truck className="w-3.5 h-3.5 text-emerald-400 inline ml-1" />{r.equipmentCount} معدة</div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 truncate">PTW: {r.ptwNumber ? <CodeBdi code={r.ptwNumber} className="text-emerald-400" /> : <span className="text-rose-400">لا يوجد</span>}</div>
        </div>
        <table className="w-full text-xs mt-3 text-right">
          <thead className="text-slate-400 border-b border-slate-800"><tr><th className="p-2">البند</th><th className="p-2">الكمية</th></tr></thead>
          <tbody className="divide-y divide-slate-800/70">
            {r.itemsExecuted.map((i) => (
              <tr key={i.boqItemId}><td className="p-2 text-slate-200">{i.description}</td><td className="p-2 font-mono text-amber-400 whitespace-nowrap"><bdi dir="ltr">{fmt(i.quantity)}</bdi> {i.unit}</td></tr>
            ))}
          </tbody>
        </table>
        <div className={`text-[11px] mt-2 p-2 rounded-lg border ${r.posted ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>
          {r.posted ? 'تم ترحيل هذه الكميات إلى جدول الكميات وأصبحت متاحة للمستخلص.' : 'الكميات غير مرحّلة — تُرحَّل فقط بعد اعتماد الاستشاري.'}
        </div>
        {r.siteNotes && <p className="text-xs text-slate-300 mt-3 bg-slate-950 border border-slate-800 rounded-lg p-2">{r.siteNotes}</p>}
        {(r.photos?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">{r.photos!.map((p, i) => <img key={i} src={p} alt={`صورة ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-slate-700" />)}</div>
        )}
        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> <bdi dir="ltr">{r.gpsCoordinates}</bdi> · رفعه {r.submittedBy}</div>
        <div className="mt-4"><div className="text-xs font-bold text-white mb-2">سجل الإجراءات</div><History items={r.history} /></div>
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        title={confirm === 'reject' ? 'رفض التقرير' : 'تأكيد الاعتماد'}
        message={confirm === 'consultant_approve' ? 'سيتم اعتماد التقرير وترحيل كمياته نهائياً إلى جدول الكميات. هل أنت متأكد؟' : confirm === 'reject' ? 'سيُعاد التقرير لمهندس الموقع مع سبب الرفض.' : 'سيتم اعتماد التقرير وإحالته للاستشاري.'}
        confirmLabel={confirm === 'reject' ? 'رفض' : 'اعتماد'} tone={confirm === 'reject' ? 'danger' : 'success'} requireNote={confirm === 'reject'}
        onConfirm={(note) => confirm && run(confirm, note)} />
    </>
  );
};

export const DailySiteOperations: React.FC<Props> = ({ onOpenNewDprModal }) => {
  const { dprs, selectedProjectId, selectedProject, can, focus } = usePlatform();
  const [filter, setFilter] = useState<'all' | 'pending' | 'posted' | 'draft' | 'rejected'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => dprs.filter((d) => d.projectId === selectedProjectId).filter((d) =>
    filter === 'all' ? true : filter === 'pending' ? ['submitted', 'pm_approved'].includes(d.status) : filter === 'posted' ? d.posted : d.status === filter
  ), [dprs, selectedProjectId, filter]);

  useEffect(() => { if (focus?.tab === 'dpr') setOpenId(focus.id); }, [focus]);
  useFocusHighlight(focus?.tab === 'dpr' ? focus.id : undefined, focus?.nonce);

  const all = dprs.filter((d) => d.projectId === selectedProjectId);
  const counts = {
    pending: all.filter((d) => ['submitted', 'pm_approved'].includes(d.status)).length,
    posted: all.filter((d) => d.posted).length,
    draft: all.filter((d) => d.status === 'draft').length,
    rejected: all.filter((d) => d.status === 'rejected').length
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={<FileCheck2 className="w-5 h-5 text-amber-400" />} title="التقارير الميدانية اليومية (DPR)"
        subtitle={<>{selectedProject.name} — الدورة: مسودة ← مرفوع ← اعتماد مدير المشروع ← اعتماد الاستشاري ← ترحيل الكميات</>}
        actions={can('dpr.create') && <Btn icon={<PlusCircle className="w-4 h-4" />} onClick={onOpenNewDprModal}>تقرير جديد</Btn>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { k: 'pending', l: 'بانتظار الاعتماد', c: 'text-amber-400' },
          { k: 'posted', l: 'مرحّلة', c: 'text-emerald-400' },
          { k: 'draft', l: 'مسودات', c: 'text-slate-300' },
          { k: 'rejected', l: 'مرفوضة', c: 'text-rose-400' }
        ].map((s) => (
          <button key={s.k} onClick={() => setFilter(filter === s.k ? 'all' : (s.k as any))}
            className={`text-right bg-slate-900 border rounded-xl p-3 ${filter === s.k ? 'border-amber-500/60' : 'border-slate-800'}`}>
            <div className="text-[11px] text-slate-400">{s.l}</div>
            <div className={`text-2xl font-black font-mono ${s.c}`}>{(counts as any)[s.k]}</div>
          </button>
        ))}
      </div>

      <Card title={`التقارير (${list.length})`}>
        {list.length === 0 ? <Empty text="لا توجد تقارير مطابقة" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map((r) => (
              <button key={r.id} data-entity={r.id} onClick={() => setOpenId(r.id)}
                className="text-right p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl transition space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CodeBdi code={r.reportNumber} className="text-amber-400 font-bold text-xs" />
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-xs font-bold text-white truncate">{r.sector}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                  <span><bdi dir="ltr">{r.date}</bdi></span>
                  <span>{r.itemsExecuted.length} بند</span>
                  <span>{r.workforceCount} عامل</span>
                  {(r.photos?.length ?? 0) > 0 && <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{r.photos!.length}</span>}
                  <span>{r.submittedBy}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
      <DprDetail report={dprs.find((d) => d.id === openId) ?? null} onClose={() => setOpenId(null)} />
    </div>
  );
};
