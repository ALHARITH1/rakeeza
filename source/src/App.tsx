/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Breadcrumbs } from './components/common/Breadcrumbs';
import { NoAccess } from './components/common/ui';
import { SetupGuide } from './components/common/SetupGuide';
import { LoginScreen } from './components/auth/LoginScreen';
import { LandingPage } from './components/auth/LandingPage';
import { CompanyBrand } from './components/modules/CompanyBrand';
import { AttendanceKiosk } from './components/portals/AttendanceKiosk';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Module Components
import { ExecutiveDashboard } from './components/modules/ExecutiveDashboard';
import { BoqManagement } from './components/modules/BoqManagement';
import { DailySiteOperations } from './components/modules/DailySiteOperations';
import { ProgressPayments } from './components/modules/ProgressPayments';
import { EquipmentFleet } from './components/modules/EquipmentFleet';
import { WorkforceHr } from './components/modules/WorkforceHr';
import { HseSafety } from './components/modules/HseSafety';
import { TrainingReadiness } from './components/modules/TrainingReadiness';
import { QualityControl } from './components/modules/QualityControl';
import { HandoverProtocols } from './components/modules/HandoverProtocols';
import { ProcurementInventory } from './components/modules/ProcurementInventory';
import { SubcontractorManagement } from './components/modules/SubcontractorManagement';
import { InfrastructureCoordination } from './components/modules/InfrastructureCoordination';
import { SpoilsBorrowPits } from './components/modules/SpoilsBorrowPits';
import { EmergencyCrisis } from './components/modules/EmergencyCrisis';
import { DocumentArchive } from './components/modules/DocumentArchive';
import { TenderingRisk } from './components/modules/TenderingRisk';
import { CrmStakeholders } from './components/modules/CrmStakeholders';
import { SecurityWorkflows } from './components/modules/SecurityWorkflows';
import { UsersInvitations } from './components/modules/UsersInvitations';
import { AuditLog } from './components/modules/AuditLog';
import { RfiModule } from './components/modules/RfiModule';
import { TeamAttendance } from './components/modules/TeamAttendance';
import { UserJourneyMapTab } from './components/modules/WorkforceMap';
import { WorkerPortal } from './components/portals/WorkerPortal';
import { OwnerPortal } from './components/portals/OwnerPortal';
import { ConsultantPortal } from './components/portals/ConsultantPortal';
import { SubcontractorPortal } from './components/portals/SubcontractorPortal';
import { SupplierPortal } from './components/portals/SupplierPortal';

// Modals
import { NewDprModal } from './components/modals/NewDprModal';
import { NewPtwModal } from './components/modals/NewPtwModal';
import { NewMaterialModal } from './components/modals/NewMaterialModal';
import { NewClashModal } from './components/modals/NewClashModal';
import { PrintReportModal } from './components/modals/PrintReportModal';

const Toasts: React.FC = () => {
  const { toasts, dismissToast } = usePlatform();
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-[80] space-y-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role={t.type === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-2 p-3 rounded-xl border shadow-2xl text-xs font-semibold bg-slate-900 ${
            t.type === 'error' ? 'border-rose-500/50 text-rose-300' : t.type === 'info' ? 'border-sky-500/50 text-sky-300' : 'border-emerald-500/50 text-emerald-300'}`}>
          {t.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : t.type === 'info' ? <Info className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} aria-label="إغلاق"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
    </div>
  );
};

export function MainApp() {
  const { onlineMode, activeTab, currentUser, canTab, allowedProjects, setActiveTab: setTab } = usePlatform();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDprModalOpen, setIsDprModalOpen] = useState(false);
  const [isPtwModalOpen, setIsPtwModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isClashModalOpen, setIsClashModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  // Public attendance portal: opens from /#attendance (no login needed)
  const [kioskOpen, setKioskOpen] = useState(() => window.location.hash === '#attendance');
  // Public pages before login: intro (landing) → #login / #register
  const [pub, setPub] = useState(() => window.location.hash.slice(1));
  React.useEffect(() => {
    const h = () => { setKioskOpen(window.location.hash === '#attendance'); setPub(window.location.hash.slice(1)); };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  if (kioskOpen && onlineMode) return <div dir="rtl" className="p-8 text-white bg-slate-950 min-h-screen">بوابة الحضور متاحة في العرض التجريبي فقط. <button onClick={() => {window.location.hash='';setKioskOpen(false)}}>العودة</button></div>;
  if (kioskOpen) return <AttendanceKiosk onBackToApp={() => { window.location.hash = currentUser ? 'team' : ''; setKioskOpen(false); }} />;
  if (!currentUser) {
    const go = (h: string) => { window.location.hash = h; window.scrollTo({ top: 0 }); };
    if (pub === 'login' || pub === 'register') return <><LoginScreen initialView={pub} onBack={() => go('')} /><Toasts /></>;
    return <><LandingPage onLogin={() => go('login')} onRegister={() => go('register')} onAttendance={() => go('attendance')} /><Toasts /></>;
  }

  const screens: Record<string, React.ReactNode> = {
    dashboard: <ExecutiveDashboard onOpenNewPpc={() => (window.location.hash = '')} onOpenNewPtw={() => setIsPtwModalOpen(true)} />,
    boq: <BoqManagement />,
    dpr: <DailySiteOperations onOpenNewDprModal={() => setIsDprModalOpen(true)} />,
    ppc: <ProgressPayments />,
    fleet: <EquipmentFleet />,
    hr: <WorkforceHr />,
    hse: <HseSafety onOpenNewPtwModal={() => setIsPtwModalOpen(true)} />,
    training: <TrainingReadiness />,
    qaqc: <QualityControl />,
    handover: <HandoverProtocols />,
    procurement: <ProcurementInventory onOpenNewMaterialModal={() => setIsMaterialModalOpen(true)} />,
    subcontractors: <SubcontractorManagement />,
    utilities: <InfrastructureCoordination onOpenNewClashModal={() => setIsClashModalOpen(true)} />,
    spoils: <SpoilsBorrowPits />,
    emergency: <EmergencyCrisis />,
    dms: <DocumentArchive />,
    tendering: <TenderingRisk />,
    crm: <CrmStakeholders />,
    security: <SecurityWorkflows />,
    company: <CompanyBrand />,
    users: <UsersInvitations />,
    audit: <AuditLog />,
    rfi: <RfiModule />,
    team: <TeamAttendance />,
    journey: <UserJourneyMapTab />,
    worker_portal: <WorkerPortal />,
    owner_portal: <OwnerPortal />,
    consultant_portal: <ConsultantPortal />,
    sub_portal: <SubcontractorPortal />,
    supplier_portal: <SupplierPortal />
  };

  const needsProject = !['company', 'users', 'audit', 'security', 'dms', 'crm', 'boq', 'hr', 'team', 'journey', 'worker_portal'].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      <Header
        onOpenNewDpr={() => setIsDprModalOpen(true)}
        onOpenPrintReport={() => setIsPrintModalOpen(true)}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
      <div className="flex-1 flex overflow-hidden min-w-0">
        <Sidebar isOpenMobile={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 bg-slate-950 min-w-0">
          <div className="max-w-7xl mx-auto space-y-4 min-w-0">
            <Breadcrumbs />
            {!(needsProject && allowedProjects.length === 0) && <SetupGuide />}
            {onlineMode && ['users','security'].includes(activeTab) ? (<section dir="rtl" className="p-6 text-amber-300 border border-amber-600 rounded-lg">دعوة الموظفين وصلاحيات بقية الأدوار لم تُفعّل على الخادم بعد. استخدم العرض التجريبي لاستكشافها فقط، وليس لإضافة حسابات فعلية.</section>) : !canTab(activeTab) ? (
              <NoAccess />
            ) : needsProject && allowedProjects.length === 0 ? (
              canTab('boq') ? (
                <SetupGuide compact />
              ) : (
                <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-slate-300">لا توجد مشاريع مسندة لحسابك بعد. تواصل مع المدير التنفيذي.</div>
              )
            ) : (
              screens[activeTab] ?? <NoAccess />
            )}
          </div>
        </main>
      </div>

      <NewDprModal isOpen={isDprModalOpen} onClose={() => setIsDprModalOpen(false)} />
      <NewPtwModal isOpen={isPtwModalOpen} onClose={() => setIsPtwModalOpen(false)} />
      <NewMaterialModal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} />
      <NewClashModal isOpen={isClashModalOpen} onClose={() => setIsClashModalOpen(false)} />
      <PrintReportModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <PlatformProvider>
      <MainApp />
    </PlatformProvider>
  );
}
