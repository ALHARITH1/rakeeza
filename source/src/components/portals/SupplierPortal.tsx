import React, { useEffect, useState } from 'react';
import { PackageCheck } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { PageHeader, Card, StatusBadge, Empty, fmt, useFocusHighlight } from '../common/ui';
import { CodeBdi } from '../common/NumBdi';
import { MrDetail } from '../modules/ProcurementInventory';

export const SupplierPortal: React.FC = () => {
  const { materialReqs, currentUser, focus } = usePlatform();
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => { if (focus?.tab === 'supplier_portal') setOpenId(focus.id); }, [focus]);
  useFocusHighlight(focus?.tab === 'supplier_portal' ? focus.id : undefined, focus?.nonce);
  const pos = materialReqs.filter((m) => m.supplierName === currentUser?.supplierName && m.poNumber);
  const action = pos.filter((m) => ['po_issued', 'supplier_confirmed'].includes(m.status));
  return (
    <div className="space-y-4">
      <PageHeader icon={<PackageCheck className="w-5 h-5 text-emerald-400" />} title="بوابة المورد" subtitle={`${currentUser?.supplierName} — أوامر الشراء الموجهة لك فقط`} />
      <div className="grid grid-cols-2 gap-3">
        <Card><div className="text-[11px] text-slate-400">أوامر تحتاج إجراء</div><div className="text-2xl font-black font-mono text-amber-400">{action.length}</div></Card>
        <Card><div className="text-[11px] text-slate-400">إجمالي أوامر الشراء</div><div className="text-lg font-black font-mono" dir="ltr">{fmt(pos.reduce((a, m) => a + m.estimatedCost, 0))} ر.س</div></Card>
      </div>
      <Card title={`أوامر الشراء (${pos.length})`}>
        {pos.length === 0 ? <Empty text="لا توجد أوامر شراء موجهة لك" /> : (
          <div className="space-y-2">{pos.map((m) => (
            <button key={m.id} data-entity={m.id} onClick={() => setOpenId(m.id)} className="w-full text-right p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center justify-between gap-2">
              <span className="min-w-0"><CodeBdi code={m.poNumber!} className="text-amber-400 text-xs font-bold" /><span className="block text-xs text-white truncate">{m.materialName}</span><span className="block text-[11px] text-slate-400"><bdi dir="ltr">{fmt(m.requestedQty)}</bdi> {m.unit}</span></span>
              <StatusBadge status={m.status} />
            </button>
          ))}</div>
        )}
      </Card>
      <MrDetail mr={materialReqs.find((m) => m.id === openId) ?? null} onClose={() => setOpenId(null)} />
    </div>
  );
};
