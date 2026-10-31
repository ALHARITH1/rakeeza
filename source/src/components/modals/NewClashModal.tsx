import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { UtilityClash } from '../../types';
import { Network, X } from 'lucide-react';

interface NewClashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewClashModal: React.FC<NewClashModalProps> = ({ isOpen, onClose }) => {
  const { addUtilityClash, setActiveTab } = usePlatform();

  const [utilityType, setUtilityType] = useState<UtilityClash['utilityType']>('nwc_water_mains');
  const [locationStreet, setLocationStreet] = useState('');
  const [depthMeters, setDepthMeters] = useState(1.1);
  const [stakeholderContact, setStakeholderContact] = useState('');
  const [protectionMeasures, setProtectionMeasures] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addUtilityClash({
      utilityType,
      locationStreet,
      depthMeters: Number(depthMeters),
      stakeholderContact,
      protectionMeasures
    });
    setActiveTab('utilities');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">توثيق تعارض خدمات بنية تحتية (Utility Clash)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">نوع الخدمة المتقاطعة</label>
            <select
              value={utilityType}
              onChange={(e) => setUtilityType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            >
              <option value="nwc_water_mains">أنبوب مياه رئيسي (شركة المياه الوطنية NWC)</option>
              <option value="saudi_electricity_hv">كابل كهرباء أرضي حي (الشركة السعودية للكهرباء SEC)</option>
              <option value="telecom_fiber">مسار ألياف بصرية (شركة الاتصالات stc)</option>
              <option value="stormwater_box_culvert">عبارة تصريف مياه أمطار وسيول (الأمانة)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">الشارع والموقع بالتحديد</label>
            <input
              type="text"
              value={locationStreet}
              onChange={(e) => setLocationStreet(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">العمق المقاس (متر تحت الأسفلت)</label>
            <input
              type="number"
              step="0.1"
              value={depthMeters}
              onChange={(e) => setDepthMeters(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sky-400 font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">اسم منسق الجهة وممثل الخدمة</label>
            <input
              type="text"
              value={stakeholderContact}
              onChange={(e) => setStakeholderContact(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">إجراءات الحماية والتدعيم المتفق عليها</label>
            <textarea
              value={protectionMeasures}
              onChange={(e) => setProtectionMeasures(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              required
            />
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
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
            >
              توثيق التعارض في سجل الميدان
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
