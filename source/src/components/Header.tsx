import React, { useEffect, useRef, useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import {
  HardHat, PlusCircle, Bell, Printer, Search, CheckCheck, Menu, X, ChevronDown, Settings, Contrast, LogOut,
  RotateCcw, AlertTriangle, CheckCircle2, Info, ShieldAlert, Building2
} from 'lucide-react';
import { CodeBdi } from './common/NumBdi';
import { ConfirmDialog } from './common/ui';
import { tabLabels } from '../store/permissions';

interface HeaderProps {
  onOpenNewDpr: () => void;
  onOpenPrintReport: () => void;
  onToggleSidebarMobile: () => void;
  isMobileSidebarOpen: boolean;
}

/** Initials rendered as a single isolated RTL string (fixes reversed avatar letters) */
const initials = (name: string) =>
  name.replace(/^(م\.|أ\.|د\.)\s*/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.replace(/^ال(?=..)/, '')[0]).join(' ');

const useOutside = (open: boolean, close: () => void, ...refs: React.RefObject<HTMLElement | null>[]) => {
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!refs.some((r) => r.current?.contains(e.target as Node))) close(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', h);
    window.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('keydown', k); };
  }, [open]); // eslint-disable-line
};

const ProjectSelect: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { selectedProjectId, setSelectedProjectId, allowedProjects } = usePlatform();
  if (allowedProjects.length === 0) return <span className="text-xs text-slate-400">لا توجد مشاريع</span>;
  return (
    <div className={`flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus-within:border-amber-500/60 min-w-0 ${compact ? 'w-full' : ''}`}>
      <span className="text-slate-400 shrink-0 select-none">المشروع:</span>
      <select
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer truncate w-full min-w-0 text-xs"
        aria-label="اختيار المشروع"
      >
        {allowedProjects.map((p) => (
          <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none shrink-0" />
    </div>
  );
};

const GlobalSearch: React.FC = () => {
  const { searchAll, openItem, setSelectedProjectId } = usePlatform();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(open, () => setOpen(false), ref);
  const results = searchAll(q);
  return (
    <div className="relative w-full" ref={ref}>
      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="بحث في البنود، التقارير، المستخلصات، الموظفين..."
        className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80"
        aria-label="البحث العام"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute top-full mt-1 right-0 left-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto p-1">
          {results.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">لا توجد نتائج ضمن صلاحياتك</div>
          ) : results.map((r) => (
            <button key={r.kind + r.id} onClick={() => { if (r.projectId) setSelectedProjectId(r.projectId); openItem(r.tab, r.id); setOpen(false); setQ(''); }}
              className="w-full text-right p-2 rounded-lg hover:bg-slate-950 flex items-start gap-2">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 shrink-0">{r.kind}</span>
              <span className="min-w-0">
                <span className="block text-xs text-slate-200 truncate">{r.label}</span>
                <span className="block text-[10px] text-slate-500">{r.code && <CodeBdi code={r.code} />} · {tabLabels[r.tab]}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ onOpenNewDpr, onOpenPrintReport, onToggleSidebarMobile, isMobileSidebarOpen }) => {
  const {
    currentUser, company, roleLabel, can, setActiveTab, notifications, unreadCount, markAllNotificationsAsRead,
    markNotificationAsRead, highContrast, setHighContrast, logout, resetDemoData, openItem, toast, canTab, setSelectedProjectId
  } = usePlatform();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  useOutside(showNotifications, () => setShowNotifications(false), notifRef);
  useOutside(showSettings, () => setShowSettings(false), settingsRef);

  if (!currentUser) return null;
  const home = () => setActiveTab(canTab('dashboard') ? 'dashboard' : (document.querySelector('[data-home-tab]')?.getAttribute('data-home-tab') ?? 'dashboard'));

  const icon = (t: string) =>
    t === 'urgent' ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : t === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : t === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-sky-400" />;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-2 min-w-0">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <button onClick={onToggleSidebarMobile} className="lg:hidden p-2 rounded-lg bg-slate-800/90 text-slate-300" aria-label="القائمة الجانبية" aria-expanded={isMobileSidebarOpen}>
            {isMobileSidebarOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>
          <button onClick={home} className="flex items-center gap-2 min-w-0" title="الرئيسية">
            {company?.logoDataUrl ? (
              <img src={company.logoDataUrl} alt={company.name} className="w-9 h-9 rounded-xl object-contain bg-white shrink-0" />
            ) : (
              <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <HardHat className="w-5 h-5" />
              </span>
            )}
            <span className="hidden sm:block text-right min-w-0">
              <span className="block text-sm font-black text-white leading-tight truncate max-w-[200px]">{company?.name}</span>
              <span className="block text-[10px] text-amber-400/90 truncate max-w-[200px] mt-0.5">إدارة عمليات المقاولات والبنية التحتية</span>
            </span>
          </button>
        </div>

        {/* Desktop middle */}
        <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 max-w-2xl">
          <div className="w-56 lg:w-64 shrink-0"><ProjectSelect /></div>
          <div className="flex-1 min-w-0"><GlobalSearch /></div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {can('finance.view') && (
            <button onClick={onOpenPrintReport} className="hidden lg:flex px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold items-center gap-1.5 border border-slate-700/60" title="التقرير الشامل">
              <Printer className="w-3.5 h-3.5" /> <span className="hidden xl:inline">تقرير شامل</span>
            </button>
          )}
          {can('dpr.create') && (
            <button onClick={onOpenNewDpr} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تقرير ميداني</span><span className="sm:hidden">DPR</span>
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} aria-label={`التنبيهات (${unreadCount} غير مقروء)`} aria-expanded={showNotifications}
              className={`p-2 rounded-lg relative border ${showNotifications ? 'bg-amber-500/10 text-amber-400 border-amber-500/40' : 'bg-slate-800/80 text-slate-300 border-slate-700/60'}`}>
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-rose-500 text-white font-mono text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-slate-900">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="fixed sm:absolute left-2 right-2 sm:right-auto sm:left-0 top-14 sm:top-full sm:mt-2 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[70vh] flex flex-col">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">التنبيهات ({notifications.length})</span>
                  {unreadCount > 0 && <button onClick={markAllNotificationsAsRead} className="text-[11px] text-sky-400 flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" /> تعليم الكل كمقروء</button>}
                </div>
                <div className="overflow-y-auto p-1">
                  {notifications.length === 0 && <div className="p-6 text-center text-xs text-slate-400">لا توجد تنبيهات</div>}
                  {notifications.map((n) => (
                    <button key={n.id} onClick={() => {
                      markNotificationAsRead(n.id);
                      if (n.projectId) setSelectedProjectId(n.projectId);
                      if (n.entityId) openItem(n.targetTab, n.entityId); else setActiveTab(n.targetTab);
                      setShowNotifications(false);
                    }} className={`w-full text-right p-2.5 rounded-lg flex gap-2 hover:bg-slate-950 ${n.isRead ? 'opacity-60' : ''}`}>
                      <span className="mt-0.5 shrink-0">{icon(n.type)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-slate-200">{n.title}</span>
                        {n.description && <span className="block text-[11px] text-slate-400 line-clamp-2">{n.description}</span>}
                        <span className="block text-[10px] text-slate-500 mt-0.5">{n.code && <CodeBdi code={n.code} className="text-amber-400/80" />} {n.code && '·'} {n.time}</span>
                      </span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={settingsRef}>
            <button onClick={() => setShowSettings(!showSettings)} aria-label="الحساب والإعدادات" aria-expanded={showSettings}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800">
              <span className="w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[11px] font-bold text-amber-400" dir="rtl">{initials(currentUser.name)}</span>
              <span className="hidden lg:block text-right">
                <span className="block text-[11px] font-bold text-slate-200 leading-tight max-w-[120px] truncate">{currentUser.name}</span>
                <span className="block text-[10px] text-slate-400">{roleLabel}</span>
              </span>
              <Settings className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>
            {showSettings && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-right">
                <div className="p-2 border-b border-slate-800 mb-1">
                  <div className="text-xs font-bold text-white">{currentUser.name}</div>
                  <div className="text-[11px] text-amber-400">{roleLabel}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" /> {company?.name}</div>
                </div>
                <div className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-950">
                  <span className="flex items-start gap-2">
                    <Contrast className="w-4 h-4 text-amber-400 mt-0.5" />
                    <span>
                      <span className="block text-xs font-bold text-slate-200">وضع التباين العالي</span>
                      <span className="block text-[10px] text-slate-400">لوضوح الشاشة تحت الشمس في الموقع</span>
                    </span>
                  </span>
                  <button type="button" role="switch" aria-checked={highContrast} aria-label="وضع التباين العالي" onClick={() => setHighContrast(!highContrast)}
                    className={`relative w-10 h-5 rounded-full shrink-0 ${highContrast ? 'bg-amber-500' : 'bg-slate-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${highContrast ? 'left-0.5' : 'left-[22px]'}`} />
                  </button>
                </div>
                {can('data.reset') && (
                  <button onClick={() => { setConfirmReset(true); setShowSettings(false); }} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-950 text-xs text-slate-200">
                    <RotateCcw className="w-4 h-4 text-sky-400" /> إعادة البيانات التجريبية
                  </button>
                )}
                <button onClick={logout} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-rose-500/10 text-xs text-rose-400 font-bold">
                  <LogOut className="w-4 h-4" /> تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile row: project + search (never overflows) */}
      <div className="md:hidden px-3 pb-2.5 pt-1 border-t border-slate-800/60 grid grid-cols-1 gap-2">
        <ProjectSelect compact />
        <GlobalSearch />
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="إعادة البيانات التجريبية"
        message="سيتم حذف كل التعديلات والرجوع للبيانات التجريبية الأصلية (بتواريخ محسوبة من اليوم). هل تريد المتابعة؟"
        confirmLabel="إعادة البيانات"
        tone="danger"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => { const r = resetDemoData(); setConfirmReset(false); toast(r.ok ? 'تمت إعادة البيانات التجريبية' : r.error, r.ok ? 'success' : 'error'); }}
      />
    </header>
  );
};
