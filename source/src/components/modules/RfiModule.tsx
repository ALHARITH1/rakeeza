import React, { useEffect, useState } from 'react';
import { MessageSquareText, PlusCircle } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Rfi } from '../../types';
import { PageHeader, Card, Modal, StatusBadge, History, Btn, Empty, Field, inputCls, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

export const RfiDetail: React.FC<{ rfi: Rfi | null; onClose: () => void }> = ({ rfi, onClose }) => {
  const { can, answerRfi, toast } = usePlatform();
  const [resp, setResp] = useState('');
  useEffect(() => setResp(''), [rfi?.id]);
  if (!rfi) return null;
  const canAnswer = rfi.status === 'submitted' && can('rfi.answer');
  const act = (reject: boolean) => { const r = answerRfi(rfi.id, resp, reject); toast(r.ok ? (reject ? 'تم رفض الطلب' : 'تم إرسال الرد') : r.error, r.ok ? 'success' : 'error'); if (r.ok) onClose(); };
  return (
    <Modal open onClose={onClose} title={<span className="flex items-center gap-2"><CodeBdi code={rfi.code} /> <StatusBadge status={rfi.status} /></span>} subtitle={rfi.subject}
      footer={<>
        {canAnswer && <><Btn variant="danger" disabled={!resp.trim()} onClick={() => act(true)}>رفض</Btn><Btn variant="success" disabled={!resp.trim()} onClick={() => act(false)}>اعتماد وإرسال الرد</Btn></>}
        <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
      </>}>
      <div className="text-xs space-y-2">
        <div className="text-slate-400">الموقع: <span className="text-slate-200">{rfi.location || '—'}</span> · <bdi dir="ltr">{rfi.date}</bdi> · {rfi.raisedByName}</div>
        <p className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 leading-relaxed">{rfi.question}</p>
        {rfi.response && <p className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-3 text-emerald-200 leading-relaxed"><b>رد الاستشاري: </b>{rfi.response}</p>}
        {canAnswer && <Field label="الرد / سبب الرفض"><textarea rows={3} className={inputCls} value={resp} onChange={(e) => setResp(e.target.value)} /></Field>}
        <div className="pt-2"><History items={rfi.history} /></div>
      </div>
    </Modal>
  );
};

export const RfiModule: React.FC = () => {
  const { rfis, selectedProjectId, selectedProject, can, addRfi, toast, focus } = usePlatform();
  const [openId, setOpenId] = useState<string | null>(null);
  const [f, setF] = useState({ open: false, subject: '', question: '', location: '' });
  const [err, setErr] = useState('');
  useEffect(() => { if (focus?.tab === 'rfi') setOpenId(focus.id); }, [focus]);
  useFocusHighlight(focus?.tab === 'rfi' ? focus.id : undefined, focus?.nonce);
  const list = rfis.filter((r) => r.projectId === selectedProjectId);
  return (
    <div className="space-y-4">
      <PageHeader icon={<MessageSquareText className="w-5 h-5 text-sky-400" />} title="طلبات الاستيضاح الفني (RFI)" subtitle={`${selectedProject.name} — يرفعها الموقع ويعتمدها/يرد عليها الاستشاري`}
        actions={can('rfi.create') && <Btn icon={<PlusCircle className="w-4 h-4" />} onClick={() => setF({ ...f, open: true })}>RFI جديد</Btn>} />
      <Card title={`الطلبات (${list.length})`}>
        {list.length === 0 ? <Empty text="لا توجد طلبات" /> : (
          <div className="space-y-2">
            {list.map((r) => (
              <button key={r.id} data-entity={r.id} onClick={() => setOpenId(r.id)} className="w-full text-right p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl">
                <span className="flex items-center justify-between gap-2"><CodeBdi code={r.code} className="text-amber-400 text-xs font-bold" /><StatusBadge status={r.status} /></span>
                <span className="block text-xs font-bold text-white mt-1">{r.subject}</span>
                <span className="block text-[11px] text-slate-400"><bdi dir="ltr">{r.date}</bdi> · {r.raisedByName}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
      <Modal open={f.open} onClose={() => setF({ ...f, open: false })} title="طلب استيضاح جديد"
        footer={<><Btn variant="ghost" onClick={() => setF({ ...f, open: false })}>إلغاء</Btn><Btn onClick={() => { setErr(''); const r = addRfi(f); if (!r.ok) setErr(r.error); else { toast('تم رفع الطلب للاستشاري'); setF({ open: false, subject: '', question: '', location: '' }); } }}>رفع للاستشاري</Btn></>}>
        <div className="space-y-3">
          <Field label="الموضوع"><input className={inputCls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
          <Field label="الموقع"><input className={inputCls} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
          <Field label="السؤال / الاستيضاح"><textarea rows={4} className={inputCls} value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} /></Field>
          {err && <div className="text-xs text-rose-400">{err}</div>}
        </div>
      </Modal>
      <RfiDetail rfi={rfis.find((r) => r.id === openId) ?? null} onClose={() => setOpenId(null)} />
    </div>
  );
};
