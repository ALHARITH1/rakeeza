import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { SpoilsAndBorrowTicket } from '../../types';
import { 
  Shovel, 
  Truck, 
  Scale, 
  Plus, 
  CheckCircle2, 
  QrCode, 
  Calendar,
  FileText
} from 'lucide-react';

export const SpoilsBorrowPits: React.FC = () => {
  const { spoilsTickets, selectedProjectId, selectedProject, addSpoilsTicket } = usePlatform();
  const [showAddModal, setShowAddModal] = useState(false);

  const [ticketType, setTicketType] = useState<SpoilsAndBorrowTicket['type']>('spoils_dump');
  const [truckPlate, setTruckPlate] = useState('ق ل ب 9021');
  const [volumeM3, setVolumeM3] = useState(24);
  const [weightTons, setWeightTons] = useState(38.4);
  const [destination, setDestination] = useState('المرمى الرسمي لأمانة منطقة الرياض (السلي)');

  const projectTickets = spoilsTickets.filter(t => t.projectId === selectedProjectId);

  const totalDumpVolume = projectTickets
    .filter(t => t.type === 'spoils_dump')
    .reduce((sum, t) => sum + t.volumeM3, 0);

  const totalBorrowVolume = projectTickets
    .filter(t => t.type !== 'spoils_dump')
    .reduce((sum, t) => sum + t.volumeM3, 0);

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    addSpoilsTicket({
      type: ticketType,
      truckPlate,
      volumeM3: Number(volumeM3),
      weighbridgeWeightTons: Number(weightTons),
      sourceOrDestination: destination,
      manifestBarcode: `MANIFEST-${Math.floor(10000 + Math.random() * 90000)}`
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Shovel className="w-5 h-5 text-amber-400" />
            <span>إدارة ناتج الحفر وموازين الدفان والرمال (Spoils & Borrow Materials)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — توثيق نقلات القلابات للمرامي الرسمية المعتمدة ومطابقة وزنيات الكسارات (Weighbridge Tickets)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل تذكرة قلاب أو ميزان</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">إجمالي ناتج الحفر المفرغ بالمرامي المعتمدة</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {totalDumpVolume.toLocaleString()} م3
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">إجمالي الدفان والرمل المغسول الوارد</span>
          <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
            {totalBorrowVolume.toLocaleString()} م3
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">مطابقة تذاكر الميزان الإلكتروني</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            100% موثقة بالباركود
          </span>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-3">رقم التذكرة / المانيفست</th>
                <th className="p-3">نوع الحركة</th>
                <th className="p-3">رقم لوحة القلاب</th>
                <th className="p-3">الحجم التقديري</th>
                <th className="p-3">وزن الميزان الفعلي</th>
                <th className="p-3">الوجهة أو مصدر الكسارة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">حالة اعتماد المفتش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projectTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                    {ticket.ticketNumber}
                    <span className="text-[10px] text-slate-500 block">{ticket.manifestBarcode}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {ticket.type === 'spoils_dump' ? (
                      <span className="text-rose-400 bg-rose-500/10 font-bold px-2 py-0.5 rounded text-[10px]">
                        تصريف ناتج حفر
                      </span>
                    ) : (
                      <span className="text-sky-400 bg-sky-500/10 font-bold px-2 py-0.5 rounded text-[10px]">
                        توريد رمل/دفان
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                    {ticket.truckPlate}
                  </td>
                  <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                    {ticket.volumeM3} م3
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {ticket.weighbridgeWeightTons} طن
                  </td>
                  <td className="p-3 text-slate-300">
                    {ticket.sourceOrDestination}
                  </td>
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                    {ticket.date}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      معتمد بالميزان
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">تسجيل تذكرة ميزان أو قلاب جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">إلغاء</button>
            </div>
            <form onSubmit={handleAddTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">نوع الشحنة والحركة</label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="spoils_dump">تصريف ناتج حفر للمرمى الرسمي (Dump Ticket)</option>
                  <option value="borrow_sand_import">توريد رمل مغسول للفرشة (Clean Sand)</option>
                  <option value="borrow_subbase_import">توريد طبقة تحت الأساس (Subbase A)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">رقم لوحة القلاب أو الشاحنة</label>
                <input
                  type="text"
                  value={truckPlate}
                  onChange={(e) => setTruckPlate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">الحجم التقديري (م3)</label>
                  <input
                    type="number"
                    value={volumeM3}
                    onChange={(e) => setVolumeM3(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">وزن الميزان الفعلي (طن)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightTons}
                    onChange={(e) => setWeightTons(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-400 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">المرمى المعتمد أو اسم الكسارة</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg transition mt-2"
              >
                تأكيد وتسجيل التذكرة في السجل الرسمي
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
