import { HrRequestsPanel, EmployeeProfile, probationPassed, idLabel } from './HrExtras';
import { WorkersImport } from './WorkersImport';
import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Worker, LeaveRequest, DisciplinaryViolation, EndOfServiceSettlement } from '../../types';
import { 
  Users, 
  MapPin, 
  Clock, 
  FileBadge, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign,
  Search,
  Plus,
  Calendar,
  Briefcase,
  Plane,
  Scale,
  Award,
  ShieldAlert,
  FileCheck2,
  Printer,
  ChevronDown,
  UserPlus,
  ShieldCheck,
  Receipt,
  FileText
,
  FileSpreadsheet
} from 'lucide-react';
import { NumBdi, CodeBdi, DateBdi } from '../common/NumBdi';
import { EmptyState } from '../common/EmptyState';

export const WorkforceHr: React.FC = () => {
  const { 
    workers, 
    selectedProjectId, 
    selectedProject, 
    toggleGeoFence,
    leaveRequests,
    disciplinaryViolations,
    settlements,
    addOnboardingWorker,
    addLeaveRequest,
    addDisciplinaryViolation,
    addSettlement
  } = usePlatform();

  // Sub-tabs for complete HR lifecycle
  const [profileId, setProfileId] = useState<string | null>(null);
  const { focus: hrFocus, company: hrCompany, toast: hrToast, allowedProjects: hrProjects } = usePlatform();
  const [importOpen, setImportOpen] = useState(false);
  React.useEffect(() => {
    if (hrFocus?.tab !== 'hr') return;
    if (hrFocus.id === 'onboarding') { setActiveTab('onboarding'); setShowOnboardModal(true); return; }
    if (hrFocus.id === 'import') { setImportOpen(true); return; }
    if (workers.some((x) => x.id === hrFocus.id)) setProfileId(hrFocus.id);
  }, [hrFocus]); // eslint-disable-line
  const [activeTab, setActiveTab] = useState<'directory' | 'onboarding' | 'attendance' | 'leaves' | 'payroll' | 'violations' | 'eosb'>('directory');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Drawers state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showViolModal, setShowViolModal] = useState(false);
  const [selectedSettlementForPrint, setSelectedSettlementForPrint] = useState<EndOfServiceSettlement | null>(null);

  // New Employee Onboarding Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('فني تمديدات كابلات');
  const [newNationality, setNewNationality] = useState('سعودي');
  const [newIqama, setNewIqama] = useState('');
  const [newIdExpiry, setNewIdExpiry] = useState('');
  const [newInsExpiry, setNewInsExpiry] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [onboardErr, setOnboardErr] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newContractType, setNewContractType] = useState<'fixed_term' | 'indefinite'>('fixed_term');
  const [newBasic, setNewBasic] = useState(4500);
  const [newHousing, setNewHousing] = useState(1200);
  const [newTransport, setNewTransport] = useState(500);
  const [newSiteAllow, setNewSiteAllow] = useState(800);
  const [newAssignedBoq, setNewAssignedBoq] = useState('1.01');

  // Leave Form State
  const [leaveWorkerId, setLeaveWorkerId] = useState(workers[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('annual');
  const [leaveStart, setLeaveStart] = useState('2026-06-15');
  const [leaveEnd, setLeaveEnd] = useState('2026-07-15');
  const [leaveDays, setLeaveDays] = useState(30);
  const [leaveReason, setLeaveReason] = useState('إجازة سنوية اعتيادية لزيارة الأهل');
  const [ticketProvided, setTicketProvided] = useState(true);
  const [ticketDest, setTicketDest] = useState('الرياض (RUH) ↔ مومباي (BOM)');

  // Violation Form State
  const [violWorkerId, setViolWorkerId] = useState(workers[0]?.id || '');
  const [violType, setViolType] = useState<DisciplinaryViolation['violationType']>('ppe_safety_breach');
  const [violDesc, setViolDesc] = useState('عدم ارتداء النظارات الواقية أثناء قطع الأنابيب.');
  const [violAction, setViolAction] = useState<DisciplinaryViolation['actionTaken']>('written_warning');
  const [violDeduct, setViolDeduct] = useState(0);

  // EOSB Interactive Live Calculator State
  const [eosbWorkerId, setEosbWorkerId] = useState(workers[0]?.id || '');
  const [eosbSeparationReason, setEosbSeparationReason] = useState<EndOfServiceSettlement['reasonForSeparation']>('contract_expiry');
  const [eosbLastDay, setEosbLastDay] = useState('2026-05-31');

  // HR is company-wide: employees don't have to belong to a project
  const [scope, setScope] = useState<string>('all'); // all | none | <projectId>
  const inHrScope = (pid: string) => scope === 'all' || (scope === 'none' ? !pid : pid === scope);
  const projectWorkers = workers.filter(w => inHrScope(w.projectId));
  const projectLeaves = leaveRequests.filter(l => inHrScope(l.projectId));
  const projectViols = disciplinaryViolations.filter(v => inHrScope(v.projectId));
  const projectSettlements = settlements.filter(s => inHrScope(s.projectId));

  const filteredWorkers = projectWorkers.filter(w => 
    !searchQuery || 
    w.name.includes(searchQuery) || 
    w.role.includes(searchQuery) || 
    w.empCode.includes(searchQuery) ||
    w.nationality.includes(searchQuery)
  );

  // Computed selected worker for EOSB Calculator
  const selectedWorkerForEosb = workers.find(w => w.id === eosbWorkerId) || workers[0];

  // Live EOSB Math based on Saudi Labor Law Articles 84 & 85
  const calculateEosb = () => {
    if (!selectedWorkerForEosb) {
      return {
        years: 0,
        months: 0,
        totalDays: 0,
        exactYears: 0,
        baseEosb: 0,
        ratio: 100,
        netEosb: 0,
        leaveCompensation: 0,
        deductions: 0,
        finalNet: 0
      };
    }
    
    const start = new Date(selectedWorkerForEosb.joinDate || '2021-01-01');
    const end = new Date(eosbLastDay);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const months = Math.floor(remainingDays / 30);
    const exactYears = totalDays / 365;

    const wage = selectedWorkerForEosb.totalMonthlySalary;

    // Article 84 base calculation: half month for first 5 years, full month thereafter
    let baseEosb = 0;
    if (exactYears <= 5) {
      baseEosb = exactYears * (wage / 2);
    } else {
      baseEosb = (5 * (wage / 2)) + ((exactYears - 5) * wage);
    }

    // Article 85 entitlement ratio in case of resignation
    let ratio = 100;
    if (eosbSeparationReason === 'resignation') {
      if (exactYears < 2) {
        ratio = 0; // أقل من سنتين: لا يستحق مكافأة
      } else if (exactYears <= 5) {
        ratio = 33.33; // من سنتين إلى خمس: ثلث المكافأة
      } else if (exactYears <= 10) {
        ratio = 66.67; // من خمس إلى عشر: ثلثي المكافأة
      } else {
        ratio = 100; // أكثر من عشر سنوات: المكافأة كاملة
      }
    } else if (eosbSeparationReason === 'article_80_dismissal') {
      ratio = 0; // فسخ بموجب المادة 80: حرمان من المكافأة
    }

    const netEosb = Math.round((baseEosb * ratio) / 100);

    // Unused leave compensation: (daily wage * unused leave days)
    const dailyWage = wage / 30;
    const leaveCompensation = Math.round(dailyWage * (selectedWorkerForEosb.leaveBalanceDays || 0));

    // Deduct petty cash balance
    const deductions = selectedWorkerForEosb.pettyCashBalance || 0;

    const finalNet = netEosb + leaveCompensation - deductions;

    return {
      years,
      months,
      totalDays,
      exactYears: Number(exactYears.toFixed(2)),
      baseEosb: Math.round(baseEosb),
      ratio,
      netEosb,
      leaveCompensation,
      deductions,
      finalNet: Math.max(0, finalNet)
    };
  };

  const eosbResults = calculateEosb();

  // Handlers
  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardErr('');
    const idn = newIqama.trim();
    if (!/^[12]\d{9}$/.test(idn)) { setOnboardErr('رقم الهوية/الإقامة لازم 10 أرقام ويبدأ بـ 1 (مواطن) أو 2 (مقيم)'); return; }
    if (workers.some((w) => w.iqamaNumber === idn)) { setOnboardErr('رقم الهوية/الإقامة مسجل لموظف آخر'); return; }
    if (!newName.trim()) { setOnboardErr('اسم الموظف مطلوب'); return; }
    if (!newInsExpiry) { setOnboardErr('تاريخ انتهاء التأمين الطبي مطلوب'); return; }
    if (!newNationality.includes('سعودي') && !newIdExpiry) { setOnboardErr('تاريخ انتهاء الإقامة مطلوب لغير السعودي'); return; }
    const gosi = newNationality === 'سعودي' ? (newBasic + newHousing) * 0.0975 : 100;
    const totalSal = newBasic + newHousing + newTransport + newSiteAllow;
    const empCode = `EMP-${String(1000 + workers.length + 1)}`;

    addOnboardingWorker({
      projectId: newProjectId,
      empCode,
      name: newName,
      role: newRole,
      nationality: newNationality,
      iqamaNumber: idn,
      iqamaExpiry: newIdExpiry || '2099-12-31',
      medicalInsuranceExpiry: newInsExpiry,
      isHeavyOperator: newRole.includes('مشغل') || newRole.includes('حفار'),
      status: 'absent',
      checkInTime: '',
      geoFenceStatus: 'outside_geofence',
      overtimeHoursThisMonth: 0,
      dailyRate: Math.round(totalSal / 30),
      assignedBoqCode: newAssignedBoq,
      pettyCashBalance: 0,
      joinDate: newJoinDate,
      contractType: newContractType,
      qiwaContractNumber: `QIWA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      probationEndDate: new Date(new Date(newJoinDate).getTime() + 90 * 86400000).toISOString().split('T')[0],
      isProbationPassed: false,
      basicSalary: Number(newBasic),
      housingAllowance: Number(newHousing),
      transportAllowance: Number(newTransport),
      siteAllowance: Number(newSiteAllow),
      gosiDeduction: Math.round(gosi),
      totalMonthlySalary: totalSal,
      leaveBalanceDays: 21,
      leavesTakenDays: 0,
      assetsHandedOver: ['خوذة سلامة معتمدة', 'حذاء حماية كهرومغناطيسي', 'سترة عاكسة للضوء', 'بطاقة تعريف موقع'],
      violationsCount: 0
    });

    setShowOnboardModal(false);
    setNewName(''); setNewIqama(''); setNewIdExpiry(''); setNewInsExpiry(''); setNewPhone('');
    hrToast(`تمت مباشرة ${newName} — يقدر يسجل حضوره من بوابة الحضور برقم هويته/إقامته`);
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find(w => w.id === leaveWorkerId);
    if (!worker) return;

    addLeaveRequest({
      projectId: selectedProjectId,
      workerId: leaveWorkerId,
      workerName: worker.name,
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      daysCount: Number(leaveDays),
      reason: leaveReason,
      flightTicketProvided: ticketProvided,
      ticketDestination: ticketProvided ? ticketDest : undefined,
      status: 'approved'
    });

    setShowLeaveModal(false);
  };

  const handleViolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find(w => w.id === violWorkerId);
    if (!worker) return;

    addDisciplinaryViolation({
      projectId: selectedProjectId,
      workerId: violWorkerId,
      workerName: worker.name,
      date: new Date().toISOString().split('T')[0],
      violationType: violType,
      description: violDesc,
      actionTaken: violAction,
      deductionAmountSar: Number(violDeduct),
      signedByWorker: true
    });

    setShowViolModal(false);
  };

  const handleSaveEosbSettlement = () => {
    if (!selectedWorkerForEosb) return;

    const newSettlement: Omit<EndOfServiceSettlement, 'id'> = {
      projectId: selectedProjectId,
      workerId: selectedWorkerForEosb.id,
      workerName: selectedWorkerForEosb.name,
      role: selectedWorkerForEosb.role,
      nationality: selectedWorkerForEosb.nationality,
      iqamaNumber: selectedWorkerForEosb.iqamaNumber,
      joinDate: selectedWorkerForEosb.joinDate,
      lastWorkingDay: eosbLastDay,
      yearsOfService: eosbResults.years,
      monthsOfService: eosbResults.months,
      daysOfService: eosbResults.totalDays % 30,
      contractType: selectedWorkerForEosb.contractType,
      lastMonthlySalary: selectedWorkerForEosb.totalMonthlySalary,
      reasonForSeparation: eosbSeparationReason,
      baseEosbAmount: eosbResults.baseEosb,
      entitlementRatio: eosbResults.ratio,
      netEosbAmount: eosbResults.netEosb,
      unusedLeaveDays: selectedWorkerForEosb.leaveBalanceDays,
      unusedLeaveCompensationSar: eosbResults.leaveCompensation,
      deductionsPettyCash: eosbResults.deductions,
      finalNetSettlementSar: eosbResults.finalNet,
      status: 'signed_discharged',
      clearanceSignatures: {
        siteSupervisor: true,
        hrManager: true,
        financeDirector: true,
        workerThumbprint: true
      }
    };

    addSettlement(newSettlement);
    hrToast(`تم إصدار واعتماد المخالصة النهائية للموظف: ${selectedWorkerForEosb.name} بصافي مستحق: ${eosbResults.finalNet.toLocaleString()} ر.س بموجب نظام العمل السعودي.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <span>نظام الموارد البشرية وشؤون الكوادر الميدانية (HR Operations & Lifecycle)</span>
            </h1>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
              دورة حياة الموظف كاملة
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — من مباشرة العمل والتهيئة والعهد، والورديات والأوفرتايم، وحتى احتساب حقوق نهاية الخدمة (EOSB) والمخالصة النهائية
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setImportOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>استيراد الموظفين + القالب</span>
          </button>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>مباشرة موظف جديد</span>
          </button>
          <button
            onClick={() => setShowLeaveModal(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>طلب إجازة وتذكرة</span>
          </button>
          <button
            onClick={() => setShowViolModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>تسجيل مخالفة/إنذار</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">الكوادر المسجلة بالموقع</span>
          <div className="mt-1">
            <NumBdi value={projectWorkers.length} unit="موظف وفني" numClassName="font-mono tabular-nums text-lg font-bold text-white" />
          </div>
          <span className="text-[10px] text-emerald-400 block mt-0.5">100% عقود قوى موثقة</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">الحضور بالبصمة الجغرافية</span>
          <div className="mt-1">
            <NumBdi value={projectWorkers.filter(w => w.geoFenceStatus === 'inside_geofence').length} unit="حاضرين" numClassName="font-mono tabular-nums text-lg font-bold text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">داخل نطاق محطة العمل</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">ساعات الأوفرتايم الميداني</span>
          <div className="mt-1">
            <NumBdi value={projectWorkers.reduce((acc, curr) => acc + curr.overtimeHoursThisMonth, 0)} unit="ساعة" numClassName="font-mono tabular-nums text-lg font-bold text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">محتسبة بمعامل 1.5x</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-medium">تحت فترة التجربة (Probation)</span>
          <div className="mt-1">
            <NumBdi value={projectWorkers.filter(w => !probationPassed(w)).length} unit="موظف جديد" numClassName="font-mono tabular-nums text-lg font-bold text-sky-400" />
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">متابعة الأداء قبل 90 يوماً</span>
        </div>
      </div>

      {/* Sub-Navigation Ribbon (7 Tabs covering full lifecycle) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">عرض الموظفين:</span>
        <select value={scope} onChange={(e) => setScope(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold">
          <option value="all">كل موظفي الشركة ({workers.length})</option>
          <option value="none">غير مسندين لمشروع ({workers.filter((w) => !w.projectId).length})</option>
          {hrProjects.map((p) => <option key={p.id} value={p.id}>{p.name} ({workers.filter((w) => w.projectId === p.id).length})</option>)}
        </select>
      </div>

      <HrRequestsPanel />

      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800 text-xs">
        {[
          { key: 'directory', label: '1. دليل الكوادر والمشرفين', icon: Users },
          { key: 'onboarding', label: '2. المباشرة والعهد والتهيئة', icon: Briefcase },
          { key: 'attendance', label: '3. الحضور والورديات والأوفرتايم', icon: Clock },
          { key: 'leaves', label: '4. الإجازات وتذاكر السفر', icon: Plane },
          { key: 'payroll', label: '5. مسيرات الأجور وحماية الأجور (WPS)', icon: DollarSign },
          { key: 'violations', label: '6. الجزاءات والمخالفات الميدانية', icon: ShieldAlert },
          { key: 'eosb', label: '7. حاسبة ومخالصة حقوق نهاية الخدمة (EOSB)', icon: Scale }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40 shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORKFORCE DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الموظف، المهنة، أو رقم الإقامة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="text-[11px] text-slate-400">
              إجمالي الكوادر: <strong className="text-white font-mono">{filteredWorkers.length}</strong>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[820px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3">كود / اسم الموظف</th>
                    <th className="p-3">المهنة والمسمى الميداني</th>
                    <th className="p-3">الجنسية</th>
                    <th className="p-3">تاريخ المباشرة</th>
                    <th className="p-3">نوع العقد / رقم قوى</th>
                    <th className="p-3">الراتب الإجمالي</th>
                    <th className="p-3">رصيد الإجازات</th>
                    <th className="p-3">فترة التجربة</th>
                    <th className="p-3 text-center">الحضور الجغرافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredWorkers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 whitespace-nowrap">
                        <CodeBdi code={w.empCode} className="text-amber-400 font-bold block text-xs" />
                        <button onClick={() => setProfileId(w.id)} className="font-bold text-white hover:text-amber-400 underline-offset-2 hover:underline" data-entity={w.id}>{w.name}</button>
                      </td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">
                        <div>{w.role}</div>
                        <span className="text-[10px] text-slate-500">{idLabel(w)}: <CodeBdi code={w.iqamaNumber} className="text-slate-400" /></span>
                      </td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">{w.nationality}</td>
                      <td className="p-3 whitespace-nowrap">
                        <DateBdi date={w.joinDate} />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-slate-300 block">{w.contractType === 'fixed_term' ? 'محدد المدة' : 'غير محدد المدة'}</span>
                        <CodeBdi code={w.qiwaContractNumber} className="text-[10px] text-emerald-400 font-semibold" />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <NumBdi value={w.totalMonthlySalary} unit="ر.س" numClassName="font-mono tabular-nums font-bold text-white" />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <NumBdi value={w.leaveBalanceDays} unit="يوم" numClassName="font-mono tabular-nums font-bold text-sky-400" />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {probationPassed(w) ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>مكتملة وناجحة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 font-bold px-2 py-0.5 rounded-full border border-amber-500/20 text-[10px]">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>سارية حتى <DateBdi date={w.probationEndDate} className="text-amber-300 font-mono text-[10px]" /></span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleGeoFence(w.id)}
                          className={`p-1 px-2.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                            w.geoFenceStatus === 'inside_geofence'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          {w.geoFenceStatus === 'inside_geofence' ? 'داخل النطاق' : 'خارج النطاق'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ONBOARDING & ASSETS HANDOVER */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">سجل إجراءات مباشرة العمل وتهيئة العمالة الميدانية</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">توثيق عقود منصة قوى، وفترات التجربة (90 يوماً)، وتسليم العهد الميدانية ومعدات السلامة</p>
              </div>
              <div className="flex gap-2">
              <button onClick={() => setImportOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">استيراد من Excel</button>
              <button
                onClick={() => setShowOnboardModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إصدار مباشرة عمل جديدة</span>
              </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectWorkers.map((w) => (
                <div key={w.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div>
                      <span className="font-bold text-white text-xs">{w.name}</span>
                      <span className="text-[10px] text-amber-400 block font-mono font-bold">{w.empCode} · {w.role}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">تاريخ المباشرة:</span>
                      <span className="font-mono font-bold text-white text-xs">{w.joinDate}</span>
                    </div>
                  </div>

                  {/* Qiwa & Probation status */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">عقد منصة قوى:</span>
                      <span className="text-emerald-400 font-bold font-mono">{w.qiwaContractNumber}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">فترة التجربة (90 يوم):</span>
                      <span className={probationPassed(w) ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold font-mono'}>
                        {probationPassed(w) ? 'مجتازة بنجاح' : `تنتهي: ${w.probationEndDate}`}
                      </span>
                    </div>
                  </div>

                  {/* Handover Assets Checklist */}
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                    <span className="text-slate-400 font-bold block text-[10px]">العهد المسلمة رسمياً وموقعة:</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {w.assetsHandedOver?.map((asset, idx) => (
                        <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-slate-700">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{asset}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & SHIFTS & OVERTIME */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-2 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-white text-xs">سجل الحضور والانصراف الميداني اليومي (GPS Geofence)</h3>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">تحديث حي من الأقمار الصناعية</span>
              </div>

              <div className="space-y-2">
                {projectWorkers.map((w) => (
                  <div key={w.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-[11px]">
                        {w.empCode.split('-')[1]}
                      </div>
                      <div>
                        <div className="font-bold text-white">{w.name}</div>
                        <div className="text-[10px] text-slate-400">{w.role} · الوردية الصباحية (06:30 ص - 03:30 م)</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">وقت تسجيل الدخول</span>
                        <span className="font-mono font-bold text-white text-[11px]">{w.checkInTime}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        w.geoFenceStatus === 'inside_geofence' 
                          ? 'text-emerald-400 bg-emerald-500/10' 
                          : 'text-rose-400 bg-rose-500/10'
                      }`}>
                        {w.geoFenceStatus === 'inside_geofence' ? 'داخل النطاق' : 'خارج النطاق'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overtime Calculator Widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between text-xs space-y-3">
              <div>
                <h3 className="font-bold text-white pb-2 border-b border-slate-800 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>معادلة أجر الأوفرتايم (المادة 107)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  يحتسب أجر ساعة العمل الإضافية بأجر الساعة الأساسي مضافاً إليه <strong>50%</strong> من أجره الأساسي.
                </p>

                <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">إجمالي ساعات الأوفرتايم:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {projectWorkers.reduce((acc, curr) => acc + curr.overtimeHoursThisMonth, 0)} ساعة
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">معامل الاحتساب النظامي:</span>
                    <span className="font-mono font-bold text-white">150% (1.5x)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                    <span className="text-white">المستحق المالي الميداني:</span>
                    <span className="font-mono text-emerald-400">5,840 ر.س</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-[10px] text-slate-400">
                مرتبط آلياً ببنود جدول الكميات الـ BOQ لاحتساب التكلفة الفعلية المباشرة للمشروع.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVES & FLIGHT TICKETS */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="font-bold text-white text-sm">إدارة الإجازات السنوية وتذاكر السفر الميدانية</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">رصيد الإجازات السنوية (المادة 109)، وتذاكر السفر المستحقة، وإشعارات مباشرة العمل بعد الإجازة</p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تقديم طلب إجازة وتذكرة</span>
            </button>
          </div>

          <div className="space-y-3">
            {projectLeaves.map((leave) => (
              <div key={leave.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{leave.workerName}</span>
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {leave.type === 'annual' ? 'إجازة سنوية اعتيادية' : 'إجازة طارئة'} ({leave.daysCount} يوماً)
                    </span>
                  </div>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20">
                    معتمدة ومصروفة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div>الفترة: <strong className="text-white font-mono">{leave.startDate}</strong> إلى <strong className="text-white font-mono">{leave.endDate}</strong></div>
                  <div>السبب: <span className="text-slate-300">{leave.reason}</span></div>
                  <div>تذكرة السفر: <strong className="text-amber-400">{leave.flightTicketProvided ? 'مؤمنة على حساب المؤسسة' : 'بدون تذكرة'}</strong></div>
                </div>

                {leave.ticketDestination && (
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-sky-400" />
                      خط السير المعتمد للتذكرة: <strong className="text-white">{leave.ticketDestination}</strong>
                    </span>
                    {leave.dutyResumedDate && (
                      <span className="text-emerald-400 font-bold">باشر العمل بتاريخ: {leave.dutyResumedDate}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PAYROLL & WAGE PROTECTION (WPS) */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="font-bold text-white text-sm">مسير الأجور الميداني المتوافق مع حماية الأجور (WPS / منصة مدد)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">تفصيل الراتب الأساسي، بدل السكن، بدل النقل، بدل الموقع، والأوفرتايم مع استقطاع التأمينات والسلف</p>
            </div>
            <button
              onClick={() => hrToast('تم تصدير ملف مسير الرواتب بصيغة SIF المتوافقة مع نظام حماية الأجور (WPS) والبنك السعودي.')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>تصدير ملف حماية الأجور (SIF File)</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3">الموظف / الكود</th>
                    <th className="p-3">الراتب الأساسي</th>
                    <th className="p-3">بدل السكن</th>
                    <th className="p-3">بدل النقل</th>
                    <th className="p-3">بدل الموقع</th>
                    <th className="p-3">أجر الأوفرتايم</th>
                    <th className="p-3">خصم التأمينات (GOSI)</th>
                    <th className="p-3">السلف / الجزاءات</th>
                    <th className="p-3">صافي الراتب المستحق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {projectWorkers.map((w) => {
                    const hourlyRate = w.totalMonthlySalary / 240;
                    const otPay = Math.round(w.overtimeHoursThisMonth * hourlyRate * 1.5);
                    const netSalary = (w.basicSalary + w.housingAllowance + w.transportAllowance + w.siteAllowance + otPay) - w.gosiDeduction;

                    return (
                      <tr key={w.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-sans font-bold text-white whitespace-nowrap">
                          <div>{w.name}</div>
                          <span className="font-mono text-amber-400 text-[10px]">{w.empCode}</span>
                        </td>
                        <td className="p-3 text-slate-200">{w.basicSalary.toLocaleString()} ر.س</td>
                        <td className="p-3 text-slate-400">{w.housingAllowance.toLocaleString()} ر.س</td>
                        <td className="p-3 text-slate-400">{w.transportAllowance.toLocaleString()} ر.س</td>
                        <td className="p-3 text-slate-400">{w.siteAllowance.toLocaleString()} ر.س</td>
                        <td className="p-3 text-amber-400 font-bold">+{otPay.toLocaleString()} ر.س</td>
                        <td className="p-3 text-rose-400">-{w.gosiDeduction.toLocaleString()} ر.س</td>
                        <td className="p-3 text-slate-500">0.00 ر.س</td>
                        <td className="p-3 font-bold text-emerald-400 text-sm whitespace-nowrap">
                          {netSalary.toLocaleString()} ر.س
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: VIOLATIONS & DISCIPLINARY */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="font-bold text-white text-sm">سجل الجزاءات والمخالفات الميدانية والتحقيق</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">طبقاً للائحة تنظيم العمل والجزاءات المعتمدة من وزارة الموارد البشرية (مخالفات السلامة، الغياب، والإهمال)</p>
            </div>
            <button
              onClick={() => setShowViolModal(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل مخالفة رسمية</span>
            </button>
          </div>

          <div className="space-y-3">
            {projectViols.map((viol) => (
              <div key={viol.id} className="p-4 bg-slate-900 border border-rose-500/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{viol.workerName}</span>
                    <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      مخالفة اشتراطات السلامة الميدانية
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">{viol.date}</span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">{viol.description}</p>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-amber-400 font-bold">
                    الإجراء المتخذ: {viol.actionTaken === 'written_warning' ? 'إنذار كتابي أول مع التعهد بعدم التكرار' : 'خصم أجر يوم'}
                  </span>
                  <span className="text-emerald-400 font-semibold">موقع ومبصوم من الموظف</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: END OF SERVICE (EOSB) CALCULATOR & FINAL SETTLEMENT */}
      {activeTab === 'eosb' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <span>حاسبة ومخالصة حقوق نهاية الخدمة (نظام العمل السعودي - المادتين 84 و 85)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  احتساب دقيق لمكافأة نهاية الخدمة، وتعويض رصيد الإجازات المتبقية، وخصم السلف وإصدار إبراء الذمة النهائي
                </p>
              </div>

              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 self-start sm:self-auto">
                مطابق للمادتين 84 و 85
              </span>
            </div>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">اختر الموظف المراد تصفية مستحقاته</label>
                <select
                  value={eosbWorkerId}
                  onChange={(e) => setEosbWorkerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role}) - الراتب: {w.totalMonthlySalary} ر.س
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">سبب انتهاء / إنهاء العلاقة العمالية</label>
                <select
                  value={eosbSeparationReason}
                  onChange={(e) => setEosbSeparationReason(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-amber-400 font-bold"
                >
                  <option value="contract_expiry">انتهاء مدة العقد محدد المدة (المادة 84 - مكافأة كاملة 100%)</option>
                  <option value="employer_termination">إنهاء العقد من صاحب العمل لغير سبب مشروع (مكافأة كاملة 100%)</option>
                  <option value="resignation">استقالة العامل (المادة 85 - تدرج حسب سنوات الخدمة)</option>
                  <option value="force_majeure">قوة قاهرة أو ترك العمل لخطأ صاحب العمل (المادة 81 - مكافأة كاملة)</option>
                  <option value="article_80_dismissal">فسخ العقد بموجب المادة 80 لسوء سلوك (بدون مكافأة 0%)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">تاريخ آخر يوم عمل (تاريخ التصفية)</label>
                <input
                  type="date"
                  value={eosbLastDay}
                  onChange={(e) => setEosbLastDay(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono font-bold"
                />
              </div>
            </div>

            {/* Live Calculation Breakdown Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Left 2 Cols: Details of Service & Formula */}
              <div className="lg:col-span-2 space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-xs border-b border-slate-800/80 pb-2">
                  تفاصيل مدة الخدمة والأجر الفعلي المعتمد للمكافأة:
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">تاريخ المباشرة:</span>
                    <strong className="text-white font-mono">{selectedWorkerForEosb?.joinDate}</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">مدة الخدمة المحسوبة:</span>
                    <strong className="text-amber-400 font-mono font-bold">
                      {eosbResults.years} سنة و {eosbResults.months} شهر
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">الأجر الشهري الأخير:</span>
                    <strong className="text-white font-mono">
                      {selectedWorkerForEosb?.totalMonthlySalary.toLocaleString()} ر.س
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">نسبة استحقاق المكافأة:</span>
                    <strong className="text-emerald-400 font-mono font-bold">{eosbResults.ratio}%</strong>
                  </div>
                </div>

                {/* Explanation rule */}
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="font-bold text-amber-300">نص وتطبيق المادة 84 والمادة 85 من نظام العمل:</div>
                  <p className="text-slate-400 leading-relaxed">
                    يستحق العامل أجر نصف شهر عن كل سنة من السنوات الخمس الأولى، وأجر شهر عن كل سنة من السنوات التالية. 
                    {eosbSeparationReason === 'resignation' && (
                      <span className="text-amber-400 block mt-1">
                        * نظراً لأن الحالة (استقالة)، ومدة الخدمة ({eosbResults.exactYears} سنة)، استحقاق العامل هو {eosbResults.ratio}% من أصل المكافأة.
                      </span>
                    )}
                  </p>
                </div>

                {/* Unused leaves and loans */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">رصيد الإجازات غير المستنفد ({selectedWorkerForEosb?.leaveBalanceDays} يوم):</span>
                    <strong className="text-emerald-400 font-mono font-bold">+{eosbResults.leaveCompensation.toLocaleString()} ر.س</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">العهد والسلف المتبقية بذمة العامل:</span>
                    <strong className="text-rose-400 font-mono font-bold">-{eosbResults.deductions.toLocaleString()} ر.س</strong>
                  </div>
                </div>
              </div>

              {/* Right Col: Grand Total & Final Clearance Action */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between text-xs space-y-4">
                <div>
                  <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                    ملخص التصفية المالية النهائية
                  </h4>

                  <div className="space-y-2 pt-3">
                    <div className="flex justify-between text-slate-300">
                      <span>أساس مكافأة نهاية الخدمة:</span>
                      <span className="font-mono">{eosbResults.baseEosb.toLocaleString()} ر.س</span>
                    </div>

                    <div className="flex justify-between text-slate-300">
                      <span>المكافأة المستحقة ({eosbResults.ratio}%):</span>
                      <span className="font-mono font-bold text-white">{eosbResults.netEosb.toLocaleString()} ر.س</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>تعويض رصيد الإجازات:</span>
                      <span className="font-mono text-emerald-400 font-bold">+{eosbResults.leaveCompensation.toLocaleString()} ر.س</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>خصم السلف والعهد:</span>
                      <span className="font-mono text-rose-400 font-bold">-{eosbResults.deductions.toLocaleString()} ر.س</span>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center font-bold">
                      <span className="text-white text-xs">صافي مبلغ المخالصة النهائية:</span>
                      <span className="text-emerald-400 font-mono text-base font-black">
                        {eosbResults.finalNet.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleSaveEosbSettlement}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد التصفية وحفظ المخالصة</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSettlementForPrint({
                        id: 'eosb-preview',
                        projectId: selectedProjectId,
                        workerId: selectedWorkerForEosb.id,
                        workerName: selectedWorkerForEosb.name,
                        role: selectedWorkerForEosb.role,
                        nationality: selectedWorkerForEosb.nationality,
                        iqamaNumber: selectedWorkerForEosb.iqamaNumber,
                        joinDate: selectedWorkerForEosb.joinDate,
                        lastWorkingDay: eosbLastDay,
                        yearsOfService: eosbResults.years,
                        monthsOfService: eosbResults.months,
                        daysOfService: eosbResults.totalDays % 30,
                        contractType: selectedWorkerForEosb.contractType,
                        lastMonthlySalary: selectedWorkerForEosb.totalMonthlySalary,
                        reasonForSeparation: eosbSeparationReason,
                        baseEosbAmount: eosbResults.baseEosb,
                        entitlementRatio: eosbResults.ratio,
                        netEosbAmount: eosbResults.netEosb,
                        unusedLeaveDays: selectedWorkerForEosb.leaveBalanceDays,
                        unusedLeaveCompensationSar: eosbResults.leaveCompensation,
                        deductionsPettyCash: eosbResults.deductions,
                        finalNetSettlementSar: eosbResults.finalNet,
                        status: 'signed_discharged',
                        clearanceSignatures: {
                          siteSupervisor: true,
                          hrManager: true,
                          financeDirector: true,
                          workerThumbprint: true
                        }
                      });
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-400" />
                    <span>معاينة وطباعة سند إبراء الذمة والمخالصة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Settled Employees Archive */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-white text-xs">أرشيف المخالصات وتصفيات نهاية الخدمة المعتمدة سابقاً</h4>
            <div className="space-y-2">
              {projectSettlements.map((st) => (
                <div key={st.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{st.workerName} ({st.role})</div>
                    <div className="text-[10px] text-slate-400">
                      مدة الخدمة: {st.yearsOfService} سنوات · تاريخ المخالصة: {st.lastWorkingDay}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {st.finalNetSettlementSar.toLocaleString()} ر.س
                    </span>
                    <button
                      onClick={() => setSelectedSettlementForPrint(st)}
                      className="text-sky-400 hover:text-sky-300 font-semibold p-1 px-2.5 rounded bg-slate-800"
                    >
                      طباعة السند
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: NEW WORKER ONBOARDING */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>إجراءات مباشرة وتعيين موظف جديد بالمشروع</span>
              </h3>
              <button onClick={() => setShowOnboardModal(false)} className="text-slate-400 hover:text-white text-xs">إلغاء</button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">اسم الموظف / العامل كاملاً</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: خالد محمد العتيبي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">المسمى الوظيفي والمهام</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">الجنسية</label>
                  <input
                    type="text"
                    value={newNationality}
                    onChange={(e) => setNewNationality(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">رقم الهوية / الإقامة</label>
                  <input
                    type="text"
                    value={newIqama}
                    onChange={(e) => setNewIqama(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    placeholder="10 أرقام"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">انتهاء الإقامة {newNationality.includes('سعودي') ? '(لا ينطبق)' : ''}</label>
                  <input type="date" value={newIdExpiry} disabled={newNationality.includes('سعودي')} onChange={(e) => setNewIdExpiry(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white disabled:opacity-40" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">انتهاء التأمين الطبي</label>
                  <input type="date" value={newInsExpiry} onChange={(e) => setNewInsExpiry(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">المشروع (اختياري)</label>
                  <select value={newProjectId} onChange={(e) => setNewProjectId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
                    <option value="">غير مسند — موظف على الشركة</option>
                    {hrProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تاريخ المباشرة</label>
                  <input
                    type="date"
                    value={newJoinDate}
                    onChange={(e) => setNewJoinDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">الراتب الأساسي</label>
                  <input
                    type="number"
                    value={newBasic}
                    onChange={(e) => setNewBasic(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">بدل سكن</label>
                  <input
                    type="number"
                    value={newHousing}
                    onChange={(e) => setNewHousing(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">بدل نقل</label>
                  <input
                    type="number"
                    value={newTransport}
                    onChange={(e) => setNewTransport(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">بدل موقع</label>
                  <input
                    type="number"
                    value={newSiteAllow}
                    onChange={(e) => setNewSiteAllow(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                <span className="font-bold text-white block">حزمة التهيئة والعهد المستلمة:</span>
                <span className="text-slate-400 block">
                  سيتم آلياً تسليم خوذة السلامة، حذاء العمل الكهرومغناطيسي، السترة العاكسة، وبطاقة تعريف الموقع، وتحديد فترة تجربة 90 يوماً.
                </span>
              </div>

              {onboardErr && <div role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">{onboardErr}</div>}
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg transition mt-2"
              >
                تأكيد المباشرة وإضافة الموظف لسجلات المشروع
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW LEAVE REQUEST */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plane className="w-4 h-4 text-sky-400" />
                <span>طلب إجازة وتذكرة سفر للموظف</span>
              </h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-white text-xs">إلغاء</button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">اختر الموظف</label>
                <select
                  value={leaveWorkerId}
                  onChange={(e) => setLeaveWorkerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {projectWorkers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} (رصيد الإجازات المتبقي: {w.leaveBalanceDays} يوم)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">نوع الإجازة</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="annual">إجازة سنوية اعتيادية</option>
                    <option value="emergency">إجازة طارئة</option>
                    <option value="sick">إجازة مرضية (تقرير صحتي)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">عدد الأيام</label>
                  <input
                    type="number"
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={ticketProvided}
                    onChange={(e) => setTicketProvided(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500"
                  />
                  <span className="text-slate-300 font-medium">تأمين تذكرة سفر ذهاب وعودة مستحقة</span>
                </label>
              </div>

              {ticketProvided && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">خط السير والوجهة</label>
                  <input
                    type="text"
                    value={ticketDest}
                    onChange={(e) => setTicketDest(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-lg transition mt-2"
              >
                اعتماد الإجازة وخصمها من الرصيد
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW VIOLATION */}
      {showViolModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>تسجيل مخالفة ميدانية وإجراء تأديبي</span>
              </h3>
              <button onClick={() => setShowViolModal(false)} className="text-slate-400 hover:text-white text-xs">إلغاء</button>
            </div>

            <form onSubmit={handleViolSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">اختر الموظف</label>
                <select
                  value={violWorkerId}
                  onChange={(e) => setViolWorkerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {projectWorkers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">نوع المخالفة</label>
                <select
                  value={violType}
                  onChange={(e) => setViolType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="ppe_safety_breach">مخالفة اشتراطات السلامة ومعدات الحماية (PPE)</option>
                  <option value="unauthorized_absence">غياب عن الموقع دون إذن مسبق</option>
                  <option value="equipment_mishandling">سوء استخدام معدة أو إتلاف أدوات العمل</option>
                  <option value="site_dispute">مشاجرة أو عدم الامتثال لتعليمات مهندس الموقع</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">وصف المخالفة</label>
                <textarea
                  value={violDesc}
                  onChange={(e) => setViolDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">الإجراء التأديبي</label>
                  <select
                    value={violAction}
                    onChange={(e) => setViolAction(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="written_warning">إنذار كتابي رسمي</option>
                    <option value="salary_deduction_1day">خصم أجر يوم من الراتب</option>
                    <option value="verbal_warning">لفت نظر شفوي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">قيمة الخصم إن وجد (ر.س)</label>
                  <input
                    type="number"
                    value={violDeduct}
                    onChange={(e) => setViolDeduct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg transition mt-2"
              >
                تثبيت المخالفة في الملف الوظيفي
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE OFFICIAL FINAL CLEARANCE & DISCHARGE (سند مخالصة نهائية وإبراء ذمة) */}
      {selectedSettlementForPrint && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 print:p-0 print:m-0 print:max-w-none print:shadow-none">
            {/* Header toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">سند مخالصة نهائية وتصفية مستحقات إلكتروني معتمد</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة السند الرسمي</span>
                </button>
                <button
                  onClick={() => setSelectedSettlementForPrint(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* PRINTABLE OFFICIAL CLEARANCE FORM */}
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div className="flex items-start gap-3">
                {hrCompany?.logoDataUrl && <img src={hrCompany.logoDataUrl} alt="" className="h-12 max-w-[110px] object-contain" />}
                <div>
                <h2 className="text-xl font-black text-slate-900">{hrCompany?.name}</h2>
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                  إدارة الموارد البشرية والشؤون القانونية · المملكة العربية السعودية
                </div>
                </div>
              </div>
              <div className="text-left font-mono text-xs text-slate-600">
                <div>الرقم المرجعي: EOSB-SETTLE-{new Date().getFullYear()}-042</div>
                <div>التاريخ: {selectedSettlementForPrint.lastWorkingDay}</div>
              </div>
            </div>

            <div className="text-center py-2 bg-slate-100 rounded-lg border border-slate-300">
              <h3 className="text-base font-extrabold text-slate-900">
                سند مخالصة نهائية وإبراء ذمة واستلام مستحقات نهاية الخدمة
              </h3>
              <p className="text-[11px] text-slate-600">وفقاً للمادتين (84) و (85) من نظام العمل والعمال السعودي</p>
            </div>

            {/* Employee details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">اسم الموظف:</span>
                <strong className="text-slate-900">{selectedSettlementForPrint.workerName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">المسمى الوظيفي:</span>
                <strong className="text-slate-900">{selectedSettlementForPrint.role}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">الجنسية / الإقامة:</span>
                <strong className="text-slate-900 font-mono">{selectedSettlementForPrint.nationality} ({selectedSettlementForPrint.iqamaNumber})</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">الأجر الشهري الأخير:</span>
                <strong className="text-slate-900 font-mono">{selectedSettlementForPrint.lastMonthlySalary.toLocaleString()} ر.س</strong>
              </div>
            </div>

            {/* Dates & Calculation breakdown */}
            <table className="w-full text-right text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-2 border-b border-slate-300">البيان</th>
                  <th className="p-2 border-b border-slate-300">التفاصيل والمدة</th>
                  <th className="p-2 border-b border-slate-300 text-left">المبلغ المستحق (ر.س)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900 font-mono">
                <tr>
                  <td className="p-2 font-sans font-semibold">مدة الخدمة الفعلية</td>
                  <td className="p-2 font-sans">من {selectedSettlementForPrint.joinDate} إلى {selectedSettlementForPrint.lastWorkingDay} ({selectedSettlementForPrint.yearsOfService} سنة و {selectedSettlementForPrint.monthsOfService} شهر)</td>
                  <td className="p-2 text-left font-bold">{selectedSettlementForPrint.netEosbAmount.toLocaleString()} ر.س</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-semibold">تعويض رصيد الإجازات السنوية</td>
                  <td className="p-2 font-sans">{selectedSettlementForPrint.unusedLeaveDays} يوماً مستحقة غير مستنفدة</td>
                  <td className="p-2 text-left font-bold text-emerald-700">+{selectedSettlementForPrint.unusedLeaveCompensationSar.toLocaleString()} ر.س</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-semibold">استقطاع السلف والعهد</td>
                  <td className="p-2 font-sans">تصفية العهد الميدانية والمالية</td>
                  <td className="p-2 text-left font-bold text-rose-600">-{selectedSettlementForPrint.deductionsPettyCash.toLocaleString()} ر.س</td>
                </tr>
                <tr className="bg-slate-50 font-bold text-sm">
                  <td colSpan={2} className="p-2.5 font-sans">صافي المبلغ المستلم نقداً / تحويلاً بنكياً:</td>
                  <td className="p-2.5 text-left text-emerald-800 text-base">{selectedSettlementForPrint.finalNetSettlementSar.toLocaleString()} ر.س</td>
                </tr>
              </tbody>
            </table>

            {/* Legal Statement */}
            <p className="text-[11px] text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200 text-justify">
              أقر أنا الموقع أدناه بأنني قد استلمت كافة مستحقاتي المالية والنظامية عن فترة عملي لدى المؤسسة من رواتب، وبدلات، ومكافأة نهاية خدمة، وبدل إجازات، وليس لي في ذمة المؤسسة أي حق مالي أو معنوي حالياً أو مستقبلاً، وأبرئ ذمة المؤسسة إبراءً شاملاً ونهائياً لا رجعة فيه.
            </p>

            {/* Signatures & Fingerprint */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-300 text-center text-xs text-slate-800">
              <div className="space-y-6">
                <div className="font-bold">الموظف / العامل</div>
                <div className="w-16 h-16 border-2 border-dashed border-slate-400 mx-auto rounded flex items-center justify-center text-[10px] text-slate-400">
                  البصمة
                </div>
                <div className="text-[10px] text-slate-500">التوقيع والبصمة</div>
              </div>

              <div className="space-y-10">
                <div className="font-bold">مشرف الموقع الميداني</div>
                <div className="border-b border-slate-400 w-24 mx-auto" />
                <div className="text-[10px] text-slate-500">إخلاء عهدة الموقع</div>
              </div>

              <div className="space-y-10">
                <div className="font-bold">مدير الموارد البشرية</div>
                <div className="border-b border-slate-400 w-24 mx-auto" />
                <div className="text-[10px] text-slate-500">المطابقة النظامية</div>
              </div>

              <div className="space-y-10">
                <div className="font-bold">المدير المالي والختم</div>
                <div className="border-b border-slate-400 w-24 mx-auto" />
                <div className="text-[10px] text-slate-500">الصرف والختم الرسمي</div>
              </div>
            </div>
          </div>
        </div>
      )}
      <EmployeeProfile workerId={profileId} onClose={() => setProfileId(null)} />
      <WorkersImport open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
};
