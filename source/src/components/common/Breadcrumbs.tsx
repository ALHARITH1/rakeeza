import { tabLabels } from '../../store/permissions';
import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { ChevronLeft, Home, Building2, Layers } from 'lucide-react';

interface ModuleMeta {
  group: string;
  name: string;
}

const moduleDirectory: Record<string, ModuleMeta> = {
  dashboard: { group: 'القيادة والمشاريع', name: 'لوحة التحكم القيادية' },
  boq: { group: 'القيادة والمشاريع', name: 'المشاريع وجدول الكميات (BOQ)' },
  tendering: { group: 'القيادة والمشاريع', name: 'المناقصات وأوامر التغيير (VO/EOT)' },
  dpr: { group: 'الميدان والتشغيل', name: 'التقرير الميداني اليومي (DPR)' },
  fleet: { group: 'الميدان والتشغيل', name: 'المعدات والأسطول والديزل' },
  utilities: { group: 'الميدان والتشغيل', name: 'تنسيق الخدمات وحرم الطرق' },
  spoils: { group: 'الميدان والتشغيل', name: 'ناتج الحفر والرمال والموازين' },
  emergency: { group: 'الميدان والتشغيل', name: 'الطوارئ والتعليق الجوي' },
  ppc: { group: 'المستخلصات والمشتريات', name: 'المستخلصات والدفعات (PPC)' },
  procurement: { group: 'المستخلصات والمشتريات', name: 'المشتريات والمستودعات والفاقد' },
  subcontractors: { group: 'المستخلصات والمشتريات', name: 'إدارة مقاولي الباطن والخصومات' },
  hse: { group: 'السلامة والجودة والتسليم', name: 'السلامة وتصاريح الحفر (PTW)' },
  training: { group: 'السلامة والجودة والتسليم', name: 'التدريب والجاهزية الميدانية (TBT)' },
  qaqc: { group: 'السلامة والجودة والتسليم', name: 'ضبط الجودة وفحوصات المختبر' },
  handover: { group: 'السلامة والجودة والتسليم', name: 'الاختبارات والتسليم النهائي' },
  hr: { group: 'الموارد والحوكمة', name: 'الموارد البشرية ونهاية الخدمة (EOSB)' },
  dms: { group: 'الموارد والحوكمة', name: 'الأرشيف والمستندات الرسمية (DMS)' },
  crm: { group: 'الموارد والحوكمة', name: 'دليل الشركاء وتقييم الأداء' },
  security: { group: 'الموارد والحوكمة', name: 'الصلاحيات ومسارات الاعتماد' },
};

export const Breadcrumbs: React.FC = () => {
  const { activeTab, setActiveTab, selectedProject } = usePlatform();
  const current = moduleDirectory[activeTab] || { group: activeTab.endsWith('portal') ? 'البوابات' : 'الحوكمة والتشغيل', name: (tabLabels as Record<string, string>)[activeTab] ?? 'الشاشة الحالية' };

  return (
    <nav 
      aria-label="مسار التنقل" 
      className="flex items-center gap-1.5 text-xs text-slate-400 py-1.5 px-3 bg-slate-900/60 border border-slate-800/80 rounded-lg overflow-x-auto whitespace-nowrap mb-4"
    >
      <button
        onClick={() => setActiveTab('dashboard')}
        className="flex items-center gap-1 hover:text-amber-400 transition shrink-0 font-medium"
        title="الانتقال إلى لوحة التحكم الرئيسية"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">الرئيسية</span>
      </button>

      <ChevronLeft className="w-3.5 h-3.5 text-slate-600 shrink-0" />

      <div className="flex items-center gap-1 text-slate-400 shrink-0">
        <Building2 className="w-3.5 h-3.5 text-amber-500/80" />
        <span className="truncate max-w-[140px] sm:max-w-none text-slate-300">
          {selectedProject.name}
        </span>
      </div>

      <ChevronLeft className="w-3.5 h-3.5 text-slate-600 shrink-0" />

      <span className="text-slate-500 hidden md:inline shrink-0">
        {current.group}
      </span>

      <ChevronLeft className="w-3.5 h-3.5 text-slate-600 hidden md:inline shrink-0" />

      <span className="font-semibold text-amber-400 truncate shrink-0 flex items-center gap-1">
        <Layers className="w-3 h-3 md:hidden text-amber-400" />
        {current.name}
      </span>
    </nav>
  );
};
