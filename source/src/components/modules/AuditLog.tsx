import React, { useMemo, useState } from 'react';
import { History, Download } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { roleLabels } from '../../store/permissions';
import { PageHeader, Card, inputCls, Btn, Empty } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

export const AuditLog: React.FC = () => {
  const { audit, allowedProjects } = usePlatform();
  const [q, setQ] = useState('');
  const [proj, setProj] = useState('all');
  const rows = useMemo(() => audit.filter((a) =>
    (proj === 'all' || a.projectId === proj) &&
    `${a.action} ${a.userName} ${a.entityCode ?? ''} ${a.details ?? ''}`.includes(q.trim())
  ), [audit, q, proj]);

  const exportCsv = () => {
    const head = ['التاريخ والوقت', 'المستخدم', 'الدور', 'الإجراء', 'المرجع', 'المشروع', 'التفاصيل'];
    const esc = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const lines = [head, ...rows.map((a) => [new Date(a.at).toLocaleString('en-GB'), a.userName, roleLabels[a.role], a.action, a.entityCode, allowedProjects.find((p) => p.id === a.projectId)?.code, a.details])].map((r) => r.map(esc).join(','));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a'); el.href = url; el.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`; el.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={<History className="w-5 h-5 text-sky-400" />} title="سجل التدقيق" subtitle="كل إجراء في المنصة مسجل مع اسم من نفّذه ودوره ووقته"
        actions={<Btn variant="ghost" icon={<Download className="w-4 h-4" />} onClick={exportCsv}>تصدير CSV</Btn>} />
      <Card title={`العمليات (${rows.length})`} actions={
        <div className="flex gap-2">
          <select value={proj} onChange={(e) => setProj(e.target.value)} className={`${inputCls} w-36`}>
            <option value="all">كل المشاريع</option>
            {allowedProjects.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className={`${inputCls} w-40 sm:w-56`} />
        </div>
      }>
        {rows.length === 0 ? <Empty text="لا توجد عمليات" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[720px]">
              <thead className="text-slate-400 border-b border-slate-800"><tr><th className="p-2">الوقت</th><th className="p-2">المستخدم</th><th className="p-2">الإجراء</th><th className="p-2">المرجع</th><th className="p-2">التفاصيل</th></tr></thead>
              <tbody className="divide-y divide-slate-800/70">
                {rows.slice(0, 400).map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 text-slate-400 whitespace-nowrap"><bdi dir="ltr">{new Date(a.at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</bdi></td>
                    <td className="p-2"><span className="text-slate-200 font-semibold">{a.userName}</span><div className="text-[10px] text-slate-500">{roleLabels[a.role]}</div></td>
                    <td className="p-2 text-white font-semibold">{a.action}</td>
                    <td className="p-2">{a.entityCode ? <CodeBdi code={a.entityCode} className="text-amber-400" /> : '—'}</td>
                    <td className="p-2 text-slate-300 max-w-[280px] truncate" title={a.details}>{a.details ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
