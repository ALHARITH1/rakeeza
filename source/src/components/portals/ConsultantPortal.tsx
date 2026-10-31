import {ModuleHub} from '../../ModuleHub';
import React, { useEffect, useState } from 'react';
import { Stamp, FileCheck2, Receipt, GitPullRequestDraft, MessageSquareText, FileWarning } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { PageHeader, Card, Empty, Btn, Modal, Field, inputCls, fmt, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';
import { DprDetail } from '../modules/DailySiteOperations';
import { PpcDetail } from '../modules/ProgressPayments';
import { VoDetail } from '../modules/VariationOrders';
import { RfiDetail } from '../modules/RfiModule';

type Kind = 'dpr' | 'ppc' | 'vo' | 'rfi';

export const ConsultantPortal: React.FC = () => {
  const { serverCommands, dprs, ppcs, variationOrders, rfis, selectedProjectId, selectedProject, focus, issueNcr, toast, transmittals, approveTransmittal } = usePlatform();
  const [open, setOpen] = useState<{ kind: Kind; id: string } | null>(null);
  const [ncr, setNcr] = useState({ open: false, description: '', location: '', rootCause: '' });
  useEffect(() => {
    if (focus?.tab !== 'consultant_portal') return;
    const kind: Kind = dprs.some((x) => x.id === focus.id) ? 'dpr' : ppcs.some((x) => x.id === focus.id) ? 'ppc' : variationOrders.some((x) => x.id === focus.id) ? 'vo' : 'rfi';
    setOpen({ kind, id: focus.id });
  }, [focus]); // eslint-disable-line
  useFocusHighlight(focus?.tab === 'consultant_portal' ? focus.id : undefined, focus?.nonce);

  const q = {
    dpr: dprs.filter((d) => d.projectId === selectedProjectId && d.status === 'pm_approved'),
    ppc: ppcs.filter((c) => c.projectId === selectedProjectId && c.status === 'submitted'),
    vo: variationOrders.filter((v) => v.projectId === selectedProjectId && v.status === 'under_evaluation'),
    rfi: rfis.filter((r) => r.projectId === selectedProjectId && r.status === 'submitted')
  };
  const subs = transmittals.filter((t) => t.projectId === selectedProjectId && t.type === 'material_submittal' && t.status === 'under_review');
  const total = q.dpr.length + q.ppc.length + q.vo.length + q.rfi.length + subs.length;

  const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; n: number }> = ({ icon, title, children, n }) => (
    <Card title={<>{icon} {title} <span className="text-[10px] bg-amber-500/15 text-amber-400 rounded-full px-2">{n}</span></>}>{n === 0 ? <Empty text="لا يوجد" /> : <div className="space-y-2">{children}</div>}</Card>
  );
  const Row: React.FC<{ id: string; kind: Kind; code: string; title: string; extra?: React.ReactNode }> = ({ id, kind, code, title, extra }) => (
    <button data-entity={id} onClick={() => setOpen({ kind, id })} className="w-full text-right p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center justify-between gap-2">
      <span className="min-w-0"><CodeBdi code={code} className="text-amber-400 text-xs font-bold" /><span className="block text-xs text-white truncate">{title}</span></span>
      {extra}
    </button>
  );

  return (
    <div className="space-y-4">
      <PageHeader icon={<Stamp className="w-5 h-5 text-sky-400" />} title="بوابة الاستشاري — قائمة الاعتمادات" subtitle={`${selectedProject.name} — ${total} عنصر بانتظار قرارك`}
        actions={<Btn variant="danger" icon={<FileWarning className="w-4 h-4" />} onClick={() => setNcr({ ...ncr, open: true })}>إصدار NCR</Btn>} />
      {serverCommands&&<ModuleHub kind="handover"/>}<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section icon={<FileCheck2 className="w-4 h-4 text-amber-400" />} title="تقارير ميدانية (اعتمدها مدير المشروع)" n={q.dpr.length}>
          {q.dpr.map((d) => <Row key={d.id} id={d.id} kind="dpr" code={d.reportNumber} title={d.sector} extra={<bdi dir="ltr" className="text-[11px] text-slate-400">{d.date}</bdi>} />)}
        </Section>
        <Section icon={<Receipt className="w-4 h-4 text-emerald-400" />} title="مستخلصات" n={q.ppc.length}>
          {q.ppc.map((c) => <Row key={c.id} id={c.id} kind="ppc" code={c.certificateNumber} title={`إجمالي ${fmt(c.grossAmount)} ر.س`} />)}
        </Section>
        <Section icon={<GitPullRequestDraft className="w-4 h-4 text-purple-400" />} title="أوامر تغيير" n={q.vo.length}>
          {q.vo.map((v) => <Row key={v.id} id={v.id} kind="vo" code={v.voNumber} title={v.title} extra={<bdi dir="ltr" className="font-mono text-xs">+{fmt(v.costImpactSar)}</bdi>} />)}
        </Section>
        <Section icon={<MessageSquareText className="w-4 h-4 text-sky-400" />} title="طلبات استيضاح RFI" n={q.rfi.length}>
          {q.rfi.map((r) => <Row key={r.id} id={r.id} kind="rfi" code={r.code} title={r.subject} />)}
        </Section>
        <Section icon={<FileCheck2 className="w-4 h-4 text-sky-400" />} title="اعتماد مواد (Material Submittals)" n={subs.length}>
          {subs.map((t) => (
            <div key={t.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
              <span className="min-w-0"><CodeBdi code={t.refNumber} className="text-amber-400 text-xs" /><span className="block text-xs text-white truncate">{t.subject}</span></span>
              <Btn variant="success" onClick={() => { approveTransmittal(t.id); toast('تم اعتماد المادة'); }}>اعتماد</Btn>
            </div>
          ))}
        </Section>
      </div>
      {open?.kind === 'dpr' && <DprDetail report={dprs.find((x) => x.id === open.id) ?? null} onClose={() => setOpen(null)} />}
      {open?.kind === 'ppc' && <PpcDetail ppc={ppcs.find((x) => x.id === open.id) ?? null} onClose={() => setOpen(null)} />}
      {open?.kind === 'vo' && <VoDetail vo={variationOrders.find((x) => x.id === open.id) ?? null} onClose={() => setOpen(null)} />}
      {open?.kind === 'rfi' && <RfiDetail rfi={rfis.find((x) => x.id === open.id) ?? null} onClose={() => setOpen(null)} />}
      <Modal open={ncr.open} onClose={() => setNcr({ ...ncr, open: false })} title="إصدار تقرير عدم مطابقة (NCR)"
        footer={<><Btn variant="ghost" onClick={() => setNcr({ ...ncr, open: false })}>إلغاء</Btn><Btn variant="danger" onClick={() => { const r = issueNcr(ncr); toast(r.ok ? 'تم إصدار NCR وإشعار المقاول' : r.error, r.ok ? 'success' : 'error'); if (r.ok) setNcr({ open: false, description: '', location: '', rootCause: '' }); }}>إصدار</Btn></>}>
        <div className="space-y-3">
          <Field label="الموقع"><input className={inputCls} value={ncr.location} onChange={(e) => setNcr({ ...ncr, location: e.target.value })} /></Field>
          <Field label="وصف عدم المطابقة"><textarea rows={3} className={inputCls} value={ncr.description} onChange={(e) => setNcr({ ...ncr, description: e.target.value })} /></Field>
          <Field label="السبب الجذري (إن وجد)"><input className={inputCls} value={ncr.rootCause} onChange={(e) => setNcr({ ...ncr, rootCause: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
};
