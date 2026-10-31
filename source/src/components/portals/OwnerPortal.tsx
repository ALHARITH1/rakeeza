import {ModuleHub} from '../../ModuleHub';
import React, { useEffect, useState } from 'react';
import { Landmark, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { PageHeader, Card, StatusBadge, Empty, fmt, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';
import { SCurve } from '../dashboard/SCurve';
import { PpcDetail } from '../modules/ProgressPayments';
import { VoDetail } from '../modules/VariationOrders';

/** Owner (client) view: progress & approvals only — no internal costs, salaries or CBS */
export const OwnerPortal: React.FC = () => {
  const { serverCommands, selectedProject: p, ppcs, variationOrders, selectedProjectId, focus } = usePlatform();
  const [open, setOpen] = useState<{ kind: 'ppc' | 'vo'; id: string } | null>(null);
  useEffect(() => {
    if (focus?.tab === 'owner_portal') setOpen({ kind: ppcs.some((x) => x.id === focus.id) ? 'ppc' : 'vo', id: focus.id });
  }, [focus]); // eslint-disable-line
  useFocusHighlight(focus?.tab === 'owner_portal' ? focus.id : undefined, focus?.nonce);

  const myPpcs = ppcs.filter((c) => c.projectId === selectedProjectId && c.status !== 'draft');
  const myVos = variationOrders.filter((v) => v.projectId === selectedProjectId && v.status !== 'proposed');
  const queuePpc = myPpcs.filter((c) => c.status === 'consultant_approved');
  const queueVo = myVos.filter((v) => v.status === 'consultant_approved');
  const certified = myPpcs.filter((c) => ['client_approved', 'disbursed'].includes(c.status)).reduce((a, c) => a + c.netPayableAmount, 0);
  const delta = p.physicalProgress - p.plannedProgress;

  return (
    <div className="space-y-4">
      <PageHeader icon={<Landmark className="w-5 h-5 text-amber-400" />} title="بوابة المالك" subtitle={`${p.name} — ${p.client}`} />
      {serverCommands&&<ModuleHub kind="handover"/>}<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><div className="text-[11px] text-slate-400">الإنجاز الفعلي</div><div className="text-2xl font-black font-mono text-emerald-400" dir="ltr">{p.physicalProgress}%</div></Card>
        <Card><div className="text-[11px] text-slate-400">المخطط حتى اليوم</div><div className="text-2xl font-black font-mono text-sky-400" dir="ltr">{p.plannedProgress}%</div><div className={`text-[10px] ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} dir="ltr">{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</div></Card>
        <Card><div className="text-[11px] text-slate-400">قيمة العقد</div><div className="text-lg font-black font-mono text-white" dir="ltr">{fmt(p.contractValue)}</div></Card>
        <Card><div className="text-[11px] text-slate-400">المعتمد للصرف</div><div className="text-lg font-black font-mono text-amber-400" dir="ltr">{fmt(certified)}</div></Card>
      </div>
      <Card title={<><TrendingUp className="w-4 h-4 text-emerald-400" /> منحنى الإنجاز التراكمي (S-Curve)</>}><SCurve project={p} height={260} /></Card>

      <Card title={<><Clock className="w-4 h-4 text-amber-400" /> بانتظار قرارك ({queuePpc.length + queueVo.length})</>}>
        {queuePpc.length + queueVo.length === 0 ? <Empty text="لا توجد عناصر بانتظار اعتمادك" /> : (
          <div className="space-y-2">
            {queuePpc.map((c) => (
              <button key={c.id} data-entity={c.id} onClick={() => setOpen({ kind: 'ppc', id: c.id })} className="w-full text-right p-3 bg-amber-500/5 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2">
                <span><span className="text-[10px] text-amber-400 font-bold block">مستخلص</span><CodeBdi code={c.certificateNumber} className="text-xs font-bold" /></span>
                <bdi dir="ltr" className="font-mono text-sm text-white">{fmt(c.netPayableAmount)} ر.س</bdi>
              </button>
            ))}
            {queueVo.map((v) => (
              <button key={v.id} data-entity={v.id} onClick={() => setOpen({ kind: 'vo', id: v.id })} className="w-full text-right p-3 bg-amber-500/5 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2">
                <span className="min-w-0"><span className="text-[10px] text-amber-400 font-bold block">أمر تغيير</span><span className="text-xs text-white truncate block">{v.title}</span></span>
                <bdi dir="ltr" className="font-mono text-sm text-white shrink-0">+{fmt(v.costImpactSar)}</bdi>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={<><CheckCircle2 className="w-4 h-4 text-emerald-400" /> المستخلصات</>}>
          <div className="space-y-1.5">{myPpcs.map((c) => (
            <button key={c.id} onClick={() => setOpen({ kind: 'ppc', id: c.id })} className="w-full flex items-center justify-between text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <CodeBdi code={c.certificateNumber} /><span className="flex items-center gap-2"><bdi dir="ltr" className="font-mono">{fmt(c.netPayableAmount)}</bdi><StatusBadge status={c.status} /></span>
            </button>
          ))}</div>
        </Card>
        <Card title="أوامر التغيير">
          <div className="space-y-1.5">{myVos.map((v) => (
            <button key={v.id} onClick={() => setOpen({ kind: 'vo', id: v.id })} className="w-full flex items-center justify-between gap-2 text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="truncate">{v.voNumber} — {v.title}</span><StatusBadge status={v.status} />
            </button>
          ))}{myVos.length === 0 && <Empty text="لا توجد أوامر تغيير" />}</div>
        </Card>
      </div>
      {open?.kind === 'ppc' && <PpcDetail ppc={ppcs.find((x) => x.id === open.id) ?? null} onClose={() => setOpen(null)} />}
      {open?.kind === 'vo' && <VoDetail vo={variationOrders.find((x) => x.id === open.id) ?? null} onClose={() => setOpen(null)} />}
    </div>
  );
};
