import React, { useEffect, useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Card, StatusBadge, Btn, Modal, Field, inputCls, Empty, History, fmt, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

/** PM review of subcontractor claims: approve (with amount) / reject / mark paid — feeds the computed reconciliation */
export const SubClaimsPanel: React.FC = () => {
  const { subClaims, subcontractors, selectedProjectId, can, subClaimAction, toast, focus } = usePlatform();
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { if (focus?.tab === 'subcontractors') setOpenId(focus.id); }, [focus]);
  useFocusHighlight(focus?.tab === 'subcontractors' ? focus.id : undefined, focus?.nonce);
  const list = subClaims.filter((c) => c.projectId === selectedProjectId);
  const c = list.find((x) => x.id === openId);
  useEffect(() => { setAmount(c ? String(c.amount) : ''); setNote(''); }, [openId]); // eslint-disable-line
  const act = (a: 'approve' | 'reject' | 'pay') => {
    const r = subClaimAction(c!.id, a, Number(amount), note || undefined);
    toast(r.ok ? 'تم تحديث المطالبة' : r.error, r.ok ? 'success' : 'error');
    if (r.ok) setOpenId(null);
  };
  return (
    <Card title={`مطالبات مقاولي الباطن (${list.length})`}>
      {list.length === 0 ? <Empty text="لا توجد مطالبات" /> : (
        <div className="space-y-2">{list.map((x) => (
          <button key={x.id} data-entity={x.id} onClick={() => setOpenId(x.id)} className="w-full text-right p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center justify-between gap-2">
            <span className="min-w-0"><CodeBdi code={x.code} className="text-amber-400 text-xs font-bold" /><span className="block text-xs text-white truncate">{x.description}</span><span className="block text-[10px] text-slate-400">{subcontractors.find((s) => s.id === x.subcontractorId)?.name}</span></span>
            <span className="text-left shrink-0"><bdi dir="ltr" className="font-mono text-xs block">{fmt(x.amount)}</bdi><StatusBadge status={x.status === 'pm_approved' ? 'approved' : x.status} /></span>
          </button>
        ))}</div>
      )}
      <Modal open={!!c} onClose={() => setOpenId(null)} title={c?.code ?? ''} subtitle={c?.description}
        footer={c && <>
          {c.status === 'submitted' && can('sub.claim_approve') && <><Btn variant="danger" onClick={() => act('reject')}>رفض</Btn><Btn variant="success" onClick={() => act('approve')}>اعتماد</Btn></>}
          {c.status === 'pm_approved' && can('sub.claim_approve') && <Btn variant="info" onClick={() => act('pay')}>تسجيل الصرف</Btn>}
          <Btn variant="ghost" onClick={() => setOpenId(null)}>إغلاق</Btn>
        </>}>
        {c && <div className="space-y-3">
          <div className="text-xs">المبلغ المطالب: <bdi dir="ltr" className="font-mono text-amber-400">{fmt(c.amount)} ر.س</bdi>{c.approvedAmount != null && <> · المعتمد <bdi dir="ltr" className="font-mono text-emerald-400">{fmt(c.approvedAmount)}</bdi></>}</div>
          {c.status === 'submitted' && can('sub.claim_approve') && <>
            <Field label="المبلغ المعتمد (ر.س)"><input type="number" className={`${inputCls} font-mono text-left`} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <Field label="ملاحظة (مطلوبة عند الرفض)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </>}
          <History items={c.history} />
        </div>}
      </Modal>
    </Card>
  );
};
