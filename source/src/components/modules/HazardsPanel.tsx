import React, { useEffect, useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Card, StatusBadge, Btn, Empty, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';

export const HazardsPanel: React.FC = () => {
  const { hazards, selectedProjectId, hazardAction, can, toast, focus } = usePlatform();
  useFocusHighlight(focus?.tab === 'hse' ? focus.id : undefined, focus?.nonce);
  const list = hazards.filter((h) => h.projectId === selectedProjectId);
  const sev = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية' } as const;
  return (
    <Card title={<><AlertOctagon className="w-4 h-4 text-rose-400" /> بلاغات الخطر من الموقع ({list.filter((h) => h.status !== 'closed').length} مفتوح)</>}>
      {list.length === 0 ? <Empty text="لا توجد بلاغات" /> : (
        <div className="space-y-2">{list.map((h) => (
          <div key={h.id} data-entity={h.id} className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${h.severity === 'high' && h.status === 'open' ? 'border-rose-500/50 bg-rose-500/5' : 'border-slate-800 bg-slate-950'}`}>
            <div className="min-w-0 text-xs">
              <div className="flex items-center gap-2"><CodeBdi code={h.code} className="text-amber-400 font-bold" /><StatusBadge status={h.status} /><span className={h.severity === 'high' ? 'text-rose-400 font-bold' : 'text-slate-400'}>خطورة {sev[h.severity]}</span></div>
              <div className="text-white mt-1">{h.description}</div>
              <div className="text-[10px] text-slate-400">{h.location} · {h.reportedByName} · <bdi dir="ltr">{h.date}</bdi></div>
            </div>
            {can('ptw.create') && h.status !== 'closed' && (
              <div className="flex gap-1 shrink-0">
                {h.status === 'open' && <Btn variant="ghost" onClick={() => { hazardAction(h.id, 'actioned'); toast('تم تسجيل المعالجة'); }}>تمت المعالجة</Btn>}
                <Btn variant="success" onClick={() => { hazardAction(h.id, 'closed'); toast('تم إغلاق البلاغ'); }}>إغلاق</Btn>
              </div>
            )}
          </div>
        ))}</div>
      )}
    </Card>
  );
};
