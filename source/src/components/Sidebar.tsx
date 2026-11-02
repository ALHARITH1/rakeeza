import React, { useState, useEffect, useMemo } from 'react';
import { usePlatform } from '../context/PlatformContext';
import {
  LayoutDashboard,
  ListOrdered,
  FileCheck2,
  Receipt,
  Truck,
  Users2,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  GitPullRequestDraft,
  ShoppingBag,
  Building2,
  Network,
  Shovel,
  ClipboardCheck,
  Flame,
  FolderArchive,
  Contact2,
  KeyRound,
  ChevronDown,
  Search,
  X,
  Layers,
  Smartphone,
  Landmark,
  Stamp,
  PackageCheck,
  MessageSquareText,
  UserCheck,
  UserPlus,
  History,
  MapPinned,
  Palette,
  ScrollText
} from 'lucide-react';
import { NumBdi } from './common/NumBdi';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { activeTab, setActiveTab, selectedProject, canTab } = usePlatform();
  const [filterQuery, setFilterQuery] = useState('');
  
  // Collapsible groups state (all groups open by default: 0, 1, 2, 3, 4)
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});

  const toggleGroup = (index: number) => {
    setOpenGroups(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Close on Escape key for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  const rawGroups = useMemo(() => {
    const groups = [
      {
        groupTitle: 'البوابات',
        items: [
          { id: 'worker_portal', label: 'بوابتي', icon: Smartphone },
          { id: 'owner_portal', label: 'بوابة المالك', icon: Landmark },
          { id: 'consultant_portal', label: 'بوابة الاستشاري — الاعتمادات', icon: Stamp },
          { id: 'sub_portal', label: 'بوابة مقاول الباطن', icon: Building2 },
          { id: 'supplier_portal', label: 'بوابة المورد', icon: PackageCheck }
        ]
      },
      {
        groupTitle: 'القيادة والمشاريع',
        items: [
          { id: 'dashboard', label: 'لوحة التحكم القيادية', icon: LayoutDashboard, badge: 'مباشر' },
          { id: 'boq', label: 'المشاريع وجدول الكميات (BOQ)', icon: ListOrdered },
          { id: 'tendering', label: 'المناقصات وأوامر التغيير (VO/EOT)', icon: GitPullRequestDraft }
        ]
      },
      {
        groupTitle: 'الميدان والتشغيل',
        items: [
          { id: 'dpr', label: 'التقرير الميداني اليومي (DPR)', icon: FileCheck2 },
          { id: 'rfi', label: 'طلبات الاستيضاح (RFI)', icon: MessageSquareText },
          { id: 'team', label: 'حضور الفريق', icon: UserCheck },
          { id: 'journey', label: 'خريطة الكوادر ورحلة الأدوار', icon: MapPinned },
          { id: 'fleet', label: 'المعدات والأسطول والديزل', icon: Truck },
          { id: 'utilities', label: 'تنسيق الخدمات وحرم الطرق', icon: Network },
          { id: 'spoils', label: 'ناتج الحفر والرمال والموازين', icon: Shovel },
          { id: 'emergency', label: 'الطوارئ والحوادث', icon: Flame }
        ]
      },
      {
        groupTitle: 'المستخلصات والمشتريات',
        items: [
          { id: 'ppc', label: 'المستخلصات والدفعات (PPC)', icon: Receipt },
          { id: 'procurement', label: 'المشتريات وطلبات المواد', icon: ShoppingBag },
          { id: 'subcontractors', label: 'إدارة مقاولي الباطن والخصومات', icon: Building2 }
        ]
      },
      {
        groupTitle: 'السلامة والجودة والتسليم',
        items: [
          { id: 'hse', label: 'السلامة وتصاريح العمل (PTW)', icon: ShieldAlert },
          { id: 'training', label: 'التدريب والتوعية (TBT)', icon: GraduationCap },
          { id: 'qaqc', label: 'ضبط الجودة وفحوصات المختبر', icon: Sparkles },
          { id: 'handover', label: 'الاختبارات والتسليم النهائي', icon: ClipboardCheck }
        ]
      },
      {
        groupTitle: 'الموارد والحوكمة',
        items: [
          { id: 'hr', label: 'الموارد البشرية ونهاية الخدمة', icon: Users2 },
          { id: 'dms', label: 'الأرشيف والمستندات الرسمية (DMS)', icon: FolderArchive },
          { id: 'gov', label: 'الحوكمة والأوراق الحكومية', icon: ScrollText },
          { id: 'crm', label: 'دليل الشركاء والموردين', icon: Contact2 },
          { id: 'company', label: 'هوية الشركة', icon: Palette },
          { id: 'users', label: 'المستخدمون والدعوات', icon: UserPlus },
          { id: 'security', label: 'الصلاحيات ومسارات الاعتماد', icon: KeyRound },
          { id: 'audit', label: 'سجل التدقيق', icon: History }
        ]
      }
    ];
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => canTab(i.id)) as { id: string; label: string; icon: any; badge?: string }[] }))
      .filter((g) => g.items.length > 0);
  }, [canTab]);

  // Filter items based on module search query
  const filteredGroups = useMemo(() => {
    if (!filterQuery.trim()) return rawGroups;
    const query = filterQuery.toLowerCase().trim();
    return rawGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      )
    })).filter(group => group.items.length > 0);
  }, [rawGroups, filterQuery]);

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed lg:static top-0 lg:top-[57px] bottom-0 right-0 z-40 w-72 bg-slate-900 border-l border-slate-800
        flex flex-col transition-transform duration-200 ease-out shrink-0
        ${isOpenMobile ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Header Inside Drawer */}
        <div className="lg:hidden p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>شاشات ووحدات المنصة</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Quick Overview Badge */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/50">
          <div className="text-[11px] text-slate-400 font-medium truncate mb-1">
            {selectedProject.client}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-bold truncate max-w-[170px]">
              {selectedProject.name}
            </span>
            <NumBdi 
              value={selectedProject.physicalProgress} 
              unit="%" 
              numClassName="font-mono tabular-nums font-bold text-amber-400"
              unitClassName="text-amber-400 text-xs font-bold"
            />
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${selectedProject.physicalProgress}%` }}
            />
          </div>
        </div>

        {/* Module Fast Search Input */}
        <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/90">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={`تصفية الشاشات (${rawGroups.reduce((a, g) => a + g.items.length, 0)} شاشة)...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-6 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/70 transition"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute left-2 top-2 text-slate-400 hover:text-slate-200 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation list with Collapsible Groups */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              لا توجد شاشات تطابق &quot;{filterQuery}&quot;
            </div>
          ) : (
            filteredGroups.map((group, idx) => {
              const isOpen = filterQuery.trim() ? true : openGroups[idx] ?? true;
              return (
                <div key={idx} className="space-y-1">
                  {/* Collapsible Group Header Button */}
                  <button
                    onClick={() => toggleGroup(idx)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition select-none group"
                    aria-expanded={isOpen}
                  >
                    <span className="tracking-normal uppercase">
                      {group.groupTitle}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                  </button>

                  {/* Group Items */}
                  {isOpen && (
                    <div className="space-y-0.5 pt-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition
                              ${isActive 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs' 
                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Statistics */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-xs shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>ساعات سلامة بدون حوادث:</span>
            <NumBdi
              value={selectedProject.safetyHoursNoLti}
              unit="ساعة"
              numClassName="font-mono tabular-nums font-bold text-emerald-400"
              unitClassName="text-slate-400 text-[10px]"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>العمالة النشطة اليوم:</span>
            <NumBdi
              value={selectedProject.activeWorkforce}
              unit="عامل"
              numClassName="font-mono tabular-nums font-bold text-white"
              unitClassName="text-slate-400 text-[10px]"
            />
          </div>
        </div>
      </aside>
    </>
  );
};
