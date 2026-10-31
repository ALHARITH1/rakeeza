import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { PermitToWork } from '../../types';
import { ShieldCheck, X, CheckSquare, Square } from 'lucide-react';

interface NewPtwModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPtwModal: React.FC<NewPtwModalProps> = ({ isOpen, onClose }) => {
  const { serverCommands, addPtw, selectedProject, setActiveTab } = usePlatform();

  const [type, setType] = useState<PermitToWork['type']>('deep_excavation');
  const [location, setLocation] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [safetyOfficer, setSafetyOfficer] = useState('');

  const [gasCheck, setGasCheck] = useState(false);
  const [barriers, setBarriers] = useState(false);
  const [cableDetected, setCableDetected] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [ppeGear, setPpeGear] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPtw({
      type,
      location,
      supervisor,
      safetyOfficer,
      checklist: {
        gasCheckPassed: gasCheck,
        barriersInstalled: barriers,
        undergroundCableDetected: cableDetected,
        flashingLightsActive: flashing,
        ppeFullGear: ppeGear
      }
    });
    setActiveTab('hse');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-sm">إصدار تصريح عمل ميداني جديد (Permit to Work)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">نوع التصريح المطلوب</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            >
              <option value="deep_excavation">تصريح حفر طولي عميق (Excavation & Trenching)</option>
              <option value="hot_work">تصريح أعمال ساخنة ولحام وقطع (Hot Work)</option>
              <option value="confined_space">تصريح دخول أماكن مغلقة وغرف محولات (Confined Space)</option>
              <option value="high_voltage">تصريح عمل بقرب كابلات الجهد المرتفع (High Voltage)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">الموقع المحدد للعمل</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">مشرف التنفيذ</label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">مسؤول السلامة (HSE)</label>
              <input
                type="text"
                value={safetyOfficer}
                onChange={(e) => setSafetyOfficer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <span className="font-bold text-white block text-[11px]">قائمة التحقق الميداني واشتراطات السلامة (JSA Checklist):</span>
            
            <div className="space-y-1.5 text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cableDetected}
                  onChange={(e) => setCableDetected(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
                />
                <span>فحص جهاز كشف الكابلات والخدمات المدفونة قبل البدء</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={barriers}
                  onChange={(e) => setBarriers(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
                />
                <span>تثبيت الصبات الخرسانية والحواجز والإنارة التحذيرية</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ppeGear}
                  onChange={(e) => setPpeGear(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
                />
                <span>ارتداء كامل معدات الوقاية الشخصية (خوذ، أحذية، عواكس)</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition"
            >
              اعتماد وإصدار التصريح (ساري 8 ساعات)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
