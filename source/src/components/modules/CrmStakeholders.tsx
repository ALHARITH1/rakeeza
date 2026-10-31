import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Contact2, 
  Building, 
  Phone, 
  Mail, 
  Star, 
  ShieldCheck, 
  ExternalLink,
  Search
} from 'lucide-react';

export const CrmStakeholders: React.FC = () => {
  const { selectedProject, onlineMode } = usePlatform();
  const [searchTerm, setSearchTerm] = useState('');

  const stakeholders = [
    {
      id: 1,
      org: 'الشركة السعودية للكهرباء (SEC)',
      roleType: 'المالك والجهة المستفيدة',
      repName: 'م. فهد القحطاني',
      jobTitle: 'مدير إدارة مشاريع التوزيع بالقطاع الأوسط',
      phone: '+966 11 801 4455',
      email: 'fqahtani@se.com.sa',
      rating: 95,
      notes: 'سرعة استجابة عالية في اعتماد خطابات التكليف وتصاريح إطلاق التيار'
    },
    {
      id: 2,
      roleType: 'استشاري الإشراف الهندسي',
      org: 'شركة خطيب وعلمي للاستشارات الهندسية',
      repName: 'م. ماجد عبدالمحسن',
      jobTitle: 'مهندس الإشراف المقيم للمشروع',
      phone: '+966 50 491 8820',
      email: 'm.abdulmohsen@khatibalami.com',
      rating: 90,
      notes: 'تدقيق دوري للـ RFI والمخططات التنفيذية خلال 48 ساعة'
    },
    {
      id: 3,
      roleType: 'الجهة التنظيمية والبلدية',
      org: 'أمانة منطقة الرياض - إدارة تنسيق المشروعات وحرم الطرق',
      repName: 'م. تركي السليمان',
      jobTitle: 'رئيس قسم تصاريح الحفر والبنية التحتية',
      phone: '+966 11 411 9900',
      email: 'tsulaiman@alriyadh.gov.sa',
      rating: 88,
      notes: 'متابعة تصاريح منصة بلدي والتحويلات المرورية'
    },
    {
      id: 4,
      roleType: 'شركة مرافق ومياه',
      org: 'شركة المياه الوطنية (NWC)',
      repName: 'م. خالد الدوسري',
      jobTitle: 'منسق شبكات المياه والصرف الصحي',
      phone: '+966 55 332 1199',
      email: 'kdousari@nwc.com.sa',
      rating: 92,
      notes: 'تنسيق تقاطعات الأنابيب في شارع التخصصي'
    }
  ];

  const filtered = (onlineMode ? [] : stakeholders).filter(s => 
    !searchTerm || s.org.includes(searchTerm) || s.repName.includes(searchTerm) || s.roleType.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Contact2 className="w-5 h-5 text-amber-400" />
            <span>دليل الشركاء وعلاقات العملاء والاستشاريين (Stakeholder CRM)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — بيانات التواصل المباشر مع ممثلي المالك، الاستشاريين، والبلديات، وتقييم جودة التعاون
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالجهة، المسؤول، أو الصفة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Grid of Stakeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-amber-400 font-bold block">{s.roleType}</span>
                <h3 className="font-bold text-white text-sm">{s.org}</h3>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded text-xs border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{s.rating}%</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">المسؤول المفوض:</span>
                <span className="font-bold text-white">{s.repName} ({s.jobTitle})</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-400" /> الهاتف:</span>
                  <a href={`tel:${s.phone}`} className="text-slate-200 hover:text-white" dir="ltr">{s.phone}</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3 text-sky-400" /> البريد:</span>
                  <a href={`mailto:${s.email}`} className="text-sky-400 hover:underline">{s.email}</a>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                ملاحظات التقييم: <span className="text-slate-300">{s.notes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
