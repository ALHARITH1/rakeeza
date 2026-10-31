import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppNotification, AppUser, AuditEntry, BoqItem, Company, DailyProgressReport, Project, ProjectId,
  ProgressPaymentCertificate, UserRole, WorkflowStep, MaterialRequisition, VariationOrder, Worker, LabTest,
  PermitToWork, UtilityClash, EmergencyIncident, SpoilsAndBorrowTicket, LeaveRequest, DisciplinaryViolation,
  EndOfServiceSettlement, AttendanceLog, Rfi, SubcontractorClaim, HazardReport, AdvanceRequest, NonConformanceReport, ToolboxTalk
} from '../types';
import { storage, DB_KEY, SESSION_KEY, hashPassword } from '../store/storage';
import {
  Accounts, DB, DB_VERSION, DEMO_COMPANY_ID, buildDemoAccounts, buildDemoDb, emptyDb, boqValue, todayIso, DAY, monthLabel
} from '../store/seed';
import { applyBrand, BrandInfo } from '../store/brand';
import { Action, TabId, homeTab, roleLabels, tabLabels, roleTabs, roleActions } from '../store/permissions';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */
export interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }
export interface Focus { tab: string; id: string; nonce: number }
export interface SearchResult { id: string; tab: TabId; label: string; code?: string; kind: string; projectId?: string }
export interface PpcDraftLine {
  boqItemId: string; code: string; description: string; unit: string; contractQty: number; approvedExecuted: number;
  previousQty: number; maxCurrent: number; currentQty: number; unitPrice: number;
}

type Result = { ok: true; id?: string } | { ok: false; error: string };

const ACCOUNTS_KEY = 'accounts:v4';
const dbKey = (companyId: string) => `${DB_KEY}:${companyId}`;
const nowIso = () => new Date().toISOString();
const clone = <T,>(x: T): T => (typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x)));
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const pad = (n: number, l = 3) => String(n).padStart(l, '0');
const fmtTime = () => new Date().toTimeString().slice(0, 5);

/* ================================================================== */
/*  Context interface                                                  */
/* ================================================================== */
interface PlatformContextType {
  // auth
  currentUser: AppUser | null;
  company: Company | null;
  users: AppUser[];
  login: (identifier: string, password: string, remember?: boolean) => Result;
  logout: () => void;
  brand: BrandInfo | null;
  updateCompany: (patch: { name?: string; crNumber?: string; logoDataUrl?: string | null; brandColor?: string }) => Result;
  registerCompany: (input: { companyName: string; crNumber: string; logoDataUrl?: string; brandColor?: string; adminName: string; phone: string; email?: string; password: string }) => Result;
  requestPasswordReset: (identifier: string) => { ok: boolean; code?: string; error?: string };
  resetPassword: (identifier: string, code: string, newPassword: string) => Result;
  inviteUser: (input: { name: string; username?: string; phone: string; email?: string; role: UserRole; projectIds: ProjectId[] | 'all'; password?: string; workerId?: string; subcontractorId?: string; supplierName?: string }) => Result & { tempPassword?: string };
  updateUser: (id: string, patch: Partial<AppUser>) => Result;
  can: (a: Action) => boolean;
  canTab: (tab: string) => boolean;
  currentRole: UserRole;
  roleLabel: string;
  onlineMode: boolean;

  // navigation
  selectedProjectId: ProjectId;
  setSelectedProjectId: (id: ProjectId) => void;
  selectedProject: Project;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  focus: Focus | null;
  openItem: (tab: string, id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchAll: (term: string) => SearchResult[];
  highContrast: boolean;
  setHighContrast: (on: boolean) => void;
  toasts: Toast[];
  toast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: number) => void;

  // data (scoped to the user's projects)
  allowedProjects: Project[];
  projects: Project[];
  boqItems: BoqItem[];
  dprs: DailyProgressReport[];
  ppcs: ProgressPaymentCertificate[];
  equipments: DB['equipments'];
  workers: Worker[];
  ptws: PermitToWork[];
  toolboxTalks: ToolboxTalk[];
  ncrs: NonConformanceReport[];
  labTests: LabTest[];
  companyDocs: DB['companyDocs'];
  transmittals: DB['transmittals'];
  materialReqs: MaterialRequisition[];
  subcontractors: DB['subcontractors'];
  utilityClashes: UtilityClash[];
  spoilsTickets: SpoilsAndBorrowTicket[];
  emergencyIncidents: EmergencyIncident[];
  variationOrders: VariationOrder[];
  leaveRequests: LeaveRequest[];
  disciplinaryViolations: DisciplinaryViolation[];
  settlements: EndOfServiceSettlement[];
  rfis: Rfi[];
  hazards: HazardReport[];
  advances: AdvanceRequest[];
  subClaims: SubcontractorClaim[];
  audit: AuditEntry[];
  myWorker: Worker | null;

  // notifications
  notifications: AppNotification[];
  unreadCount: number;
  markAllNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;

  // projects & BOQ
  addProject: (p: { name: string; code: string; client: string; consultant: string; location: string; startDate: string; endDate: string; lat?: number; lng?: number }) => Result;
  addBoqItem: (b: { projectId: string; code: string; description: string; unit: string; contractQty: number; unitPrice: number; cbsCategory: BoqItem['cbsCategory']; materialUnitCost?: number }) => Result;
  importBoqRows: (projectId: string, rows: { code: string; description: string; unit: string; contractQty: number; unitPrice: number }[]) => Result & { count?: number };

  // DPR
  saveDpr: (input: { date: string; sector: string; weatherCondition: string; tempC: number; workforceCount: number; equipmentCount: number; siteNotes: string; items: { boqItemId: string; quantity: number }[]; photos: string[] }, submit: boolean) => Result;
  submitDpr: (id: string) => Result;
  dprAction: (id: string, action: 'pm_approve' | 'consultant_approve' | 'reject', note?: string) => Result;
  validPtwFor: (projectId: string) => PermitToWork | undefined;

  // PPC
  buildPpcDraft: (projectId: string) => PpcDraftLine[];
  savePpc: (lines: { boqItemId: string; currentQty: number }[], submit: boolean, existingId?: string) => Result;
  ppcAction: (id: string, action: 'submit' | 'consultant_approve' | 'owner_approve' | 'disburse' | 'reject', note?: string) => Result;

  // MR / PO / GRN
  materialRemaining: (boqItemId: string, excludeId?: string) => number;
  addMaterialReq: (input: { boqItemId: string; requestedQty: number; supplierName: string; note?: string }) => Result;
  mrAction: (id: string, action: 'pm_approve' | 'reject' | 'issue_po' | 'supplier_confirm' | 'deliver' | 'grn', payload?: { supplierName?: string; deliveryNoteNumber?: string; invoiceNumber?: string; invoiceAmount?: number; note?: string }) => Result;

  // VO
  addVariationOrder: (input: { title: string; reason: VariationOrder['reason']; costImpactSar: number; timeExtensionDays: number }, submit: boolean) => Result;
  voAction: (id: string, action: 'submit' | 'consultant_approve' | 'owner_approve' | 'reject', note?: string) => Result;

  // RFI
  addRfi: (input: { subject: string; question: string; location: string }) => Result;
  answerRfi: (id: string, response: string, reject?: boolean) => Result;

  // subcontractor
  addSubClaim: (input: { description: string; amount: number }) => Result;
  subClaimAction: (id: string, action: 'approve' | 'reject' | 'pay', approvedAmount?: number, note?: string) => Result;

  // worker portal & HR
  checkIn: (insideGeofence: boolean) => Result;
  checkOut: () => Result;
  requestLeave: (input: { type: LeaveRequest['type']; startDate: string; endDate: string; reason: string }) => Result;
  requestAdvance: (input: { amount: number; reason: string }) => Result;
  signTbt: (tbtId: string) => Result;
  reportHazard: (input: { location: string; description: string; severity: HazardReport['severity'] }) => Result;
  leaveAction: (id: string, approve: boolean) => Result;
  advanceAction: (id: string, approve: boolean) => Result;
  hazardAction: (id: string, status: HazardReport['status']) => Result;
  setAttendance: (workerId: string, status: Worker['status']) => Result;

  // legacy-compatible actions (now audited & permission-checked)
  addPtw: (ptw: { type: PermitToWork['type']; location: string; supervisor: string; safetyOfficer: string; checklist: PermitToWork['safetyChecklist'] }) => void;
  addLabTest: (test: { testType: LabTest['testType']; sampleLocation: string; requiredValue: string; achievedValue: string; result: 'passed' | 'failed'; certifiedLab: string }) => void;
  addUtilityClash: (clash: { utilityType: UtilityClash['utilityType']; locationStreet: string; depthMeters: number; stakeholderContact: string; protectionMeasures: string }) => void;
  addEmergencyIncident: (incident: Omit<EmergencyIncident, 'id' | 'projectId' | 'incidentCode' | 'dateTime'>) => void;
  addSpoilsTicket: (ticket: Omit<SpoilsAndBorrowTicket, 'id' | 'projectId' | 'ticketNumber' | 'date' | 'inspectorApproved'>) => void;
  issueNcr: (input: { description: string; location: string; rootCause: string }) => Result;
  closeNcr: (ncrId: string, correctiveAction: string) => void;
  approveTransmittal: (id: string) => void;
  toggleGeoFence: (workerId: string) => void;
  addOnboardingWorker: (workerData: Omit<Worker, 'id'>) => void;
  assignWorker: (workerId: string, projectId: string) => Result;
  importWorkers: (rows: { name: string; idNumber: string; nationality: string; role: string; joinDate?: string; basicSalary?: number; housingAllowance?: number; transportAllowance?: number; idExpiry?: string; insuranceExpiry?: string }[], projectId?: string) => { ok: boolean; added: number; skipped: { row: number; reason: string }[]; error?: string };
  addLeaveRequest: (req: Omit<LeaveRequest, 'id'>) => void;
  addDisciplinaryViolation: (viol: Omit<DisciplinaryViolation, 'id'>) => void;
  addSettlement: (settlement: Omit<EndOfServiceSettlement, 'id'>) => void;
  updatePpcStatus: (id: string, status: ProgressPaymentCertificate['status']) => void;

  resetDemoData: () => Result;
  kiosk: { workers: Worker[]; projects: Project[]; attendanceLogs: AttendanceLog[]; companyName: string; logoDataUrl?: string };
  ensureKiosk: () => void;
  registerWorkerAttendance: (data: { iqamaNumber: string; type: 'clock_in' | 'clock_out'; lat: number; lng: number; accuracy: number; projectId: string; isInsideGeofence: boolean; distanceToProjectMeters: number; notes?: string }) => { success: boolean; message: string; workerName: string; code: string; isInsideGeofence: boolean };
  rolePerms: { tabs: Record<UserRole, string[]>; actions: Record<UserRole, Action[]>; customized: boolean };
  saveRolePermissions: (role: UserRole, tabs: string[], actions: Action[]) => Result;
  resetRolePermissions: () => Result;
  logAudit: (action: string, entityType: string, entityId?: string, entityCode?: string, details?: string, projectId?: string) => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

/* ================================================================== */
/*  Load persisted state                                               */
/* ================================================================== */
function loadAccounts(): Accounts {
  const a = storage.load<Accounts>(ACCOUNTS_KEY);
  if (a && a.version === DB_VERSION) return a;
  const fresh = buildDemoAccounts();
  storage.save(ACCOUNTS_KEY, fresh);
  return fresh;
}

function loadDb(companyId: string): DB {
  const d = storage.load<DB>(dbKey(companyId));
  if (d && d.version === DB_VERSION) return d;
  const fresh = companyId === DEMO_COMPANY_ID ? buildDemoDb() : emptyDb(companyId);
  storage.save(dbKey(companyId), fresh);
  return fresh;
}

/* ================================================================== */
/*  Provider                                                           */
/* ================================================================== */
export const PlatformProvider: React.FC<{ children: React.ReactNode; online?: { accounts: Accounts; db: DB; onState: (db: DB, company: Company | null) => void; logout: () => void } }> = ({ children, online }) => {
  const [accounts, setAccounts] = useState<Accounts>(() => online?.accounts ?? loadAccounts());
  // Session: kept for this tab only, unless the user ticked «تذكرني» (then kept on this device)
  const readSession = (): { userId: string; remember?: boolean } | null => {
    try { const t = sessionStorage.getItem('infraops:' + SESSION_KEY); if (t) return JSON.parse(t); } catch { /* ignore */ }
    const r = storage.load<{ userId: string; remember?: boolean }>(SESSION_KEY);
    return r?.remember ? r : null;
  };
  const [session, setSession] = useState<{ userId: string; remember?: boolean } | null>(() => online ? { userId: online.accounts.users[0].id } : readSession());
  const currentUser = useMemo(
    () => accounts.users.find((u) => u.id === session?.userId && u.active) ?? null,
    [accounts, session]
  );
  const company = useMemo(() => accounts.companies.find((c) => c.id === currentUser?.companyId) ?? null, [accounts, currentUser]);
  const [db, setDb] = useState<DB | null>(() => (online?.db ?? (currentUser ? loadDb(currentUser.companyId) : null)));

  /* ---------------- white-label brand: logged-in company, otherwise this device's last company ---------------- */
  const brandCompany = company ?? accounts.companies.find((c) => c.id === storage.load<string>('lastCompany')) ?? null;
  const brand: BrandInfo | null = brandCompany ? { name: brandCompany.name, logoDataUrl: brandCompany.logoDataUrl, brandColor: brandCompany.brandColor } : null;
  useEffect(() => { applyBrand(brand); }, [brand?.name, brand?.logoDataUrl, brand?.brandColor]); // eslint-disable-line

  // reset codes kept in memory only (demo – would be SMS/email in production)
  const resetCodes = useRef<Record<string, string>>({});

  useEffect(() => { if (!online) storage.save(ACCOUNTS_KEY, accounts); }, [accounts]);
  useEffect(() => { if (online) { if (db) online.onState(db, company); } else if (db) storage.save(dbKey(db.companyId), db); }, [db, company]);
  useEffect(() => {
    if (online) return;
    try {
      if (session) sessionStorage.setItem('infraops:' + SESSION_KEY, JSON.stringify(session));
      else sessionStorage.removeItem('infraops:' + SESSION_KEY);
    } catch { /* ignore */ }
    if (session?.remember) storage.save(SESSION_KEY, session); else storage.remove(SESSION_KEY);
  }, [session]);
  useEffect(() => {
    if (currentUser && (!db || db.companyId !== currentUser.companyId)) setDb(loadDb(currentUser.companyId));
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- UI state ---------------- */
  const role: UserRole = currentUser?.role ?? 'worker';
  const [activeTab, setActiveTabState] = useState<string>(() => homeTab(role));
  const [focus, setFocus] = useState<Focus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try { return localStorage.getItem('infraops_high_contrast') === '1'; } catch { return false; }
  });
  const setHighContrast = (on: boolean) => {
    setHighContrastState(on);
    try { localStorage.setItem('infraops_high_contrast', on ? '1' : '0'); } catch { /* ignore */ }
  };
  useEffect(() => { document.documentElement.classList.toggle('high-contrast', highContrast); }, [highContrast]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  /* ---------------- effective permissions (admin-editable, stored per company) ---------------- */
  const effTabs = useCallback((r: UserRole): string[] => {
    const t = (db?.rolePermissions?.tabs?.[r] ?? roleTabs[r]) as string[];
    // the executive director can never lock himself out of users & permissions
    return r === 'executive_director' ? Array.from(new Set([...t, 'users', 'security', 'company'])) : t;
  }, [db?.rolePermissions]);
  const effActions = useCallback((r: UserRole): Action[] => {
    const a = db?.rolePermissions?.actions?.[r] ?? roleActions[r];
    return r === 'executive_director' ? Array.from(new Set([...a, 'users.manage' as Action])) : a;
  }, [db?.rolePermissions]);
  const effHome = useCallback((r: UserRole) => effTabs(r)[0] ?? 'security', [effTabs]);
  const canAccessTab = (r: UserRole, tab: string) => effTabs(r).includes(tab);
  const can = useCallback((a: Action) => !!currentUser && effActions(currentUser.role).includes(a), [currentUser, effActions]);
  const canTab = useCallback((tab: string) => !!currentUser && effTabs(currentUser.role).includes(tab), [currentUser, effTabs]);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    try { if (window.location.hash.slice(1) !== tab) window.history.replaceState(null, '', `#${tab}`); } catch { /* ignore */ }
    // navigation always starts at the top of the page
    requestAnimationFrame(() => {
      document.querySelector('main')?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    });
  }, []);
  const openItem = useCallback((tab: string, id: string) => {
    setActiveTab(tab);
    setFocus({ tab, id, nonce: Date.now() });
  }, [setActiveTab]);

  // land on the deep-linked screen (#tab) or the role's home tab after login
  useEffect(() => {
    if (!currentUser) return;
    const h = window.location.hash.slice(1);
    setActiveTabState(h && h in tabLabels && effTabs(currentUser.role).includes(h) ? h : effHome(currentUser.role));
  }, [currentUser?.id, db?.companyId]); // eslint-disable-line
  useEffect(() => {
    const onHash = () => { const h = window.location.hash.slice(1); if (h && h in tabLabels) setActiveTabState(h); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* ---------------- project scoping ---------------- */
  const data: DB = db ?? emptyDb('none');
  const allowedIds = useMemo<string[]>(() => {
    if (!currentUser) return [];
    if (currentUser.projectIds === 'all') return data.projects.map((p) => p.id);
    return currentUser.projectIds.filter((id) => data.projects.some((p) => p.id === id));
  }, [currentUser, data.projects]);

  const [selectedProjectIdState, setSelectedProjectId] = useState<ProjectId>('p1');
  const selectedProjectId = allowedIds.includes(selectedProjectIdState) ? selectedProjectIdState : allowedIds[0] ?? '';

  /* ---------------- derived projects (computed KPIs) ---------------- */
  const projectsDerived = useMemo<Project[]>(() => {
    return data.projects.map((p) => {
      const items = data.boqItems.filter((b) => b.projectId === p.id);
      const boqTotal = boqValue(data.boqItems, p.id);
      const approvedVo = data.variationOrders
        .filter((v) => v.projectId === p.id && v.status === 'approved_by_client')
        .reduce((a, v) => a + v.costImpactSar, 0);
      const contractValue = boqTotal + approvedVo;
      const earned = items.reduce((a, b) => a + Math.min(b.executedQty, b.contractQty) * b.unitPrice, 0);
      const certified = data.ppcs
        .filter((c) => c.projectId === p.id && (c.status === 'client_approved' || c.status === 'disbursed'))
        .reduce((a, c) => a + c.grossAmount, 0);
      const workforce = data.workers.filter((w) => w.projectId === p.id && w.status === 'present').length;
      const equipment = data.equipments.filter((e) => e.projectId === p.id && e.status === 'operational').length;
      const physical = boqTotal > 0 ? Number(((earned / boqTotal) * 100).toFixed(1)) : 0;
      // planned progress from an S-curve on the contractual dates
      const s = new Date(p.startDate).getTime(), e = new Date(p.endDate).getTime();
      const x = Math.max(0, Math.min(1, (Date.now() - s) / Math.max(1, e - s)));
      const planned = Number((100 / (1 + Math.exp(-10 * (x - 0.5)))).toFixed(1));
      return {
        ...p,
        contractValue,
        physicalProgress: physical,
        plannedProgress: boqTotal > 0 ? planned : p.plannedProgress,
        financialProgress: contractValue > 0 ? Number(((certified / contractValue) * 100).toFixed(1)) : 0,
        activeWorkforce: workforce,
        activeEquipment: equipment
      };
    });
  }, [data.projects, data.boqItems, data.variationOrders, data.ppcs, data.workers, data.equipments]);

  const allowedProjects = useMemo(() => projectsDerived.filter((p) => allowedIds.includes(p.id)), [projectsDerived, allowedIds]);
  const emptyProject: Project = {
    id: '', code: '—', name: 'لا يوجد مشروع', client: '—', consultant: '—', contractValue: 0, startDate: todayIso(), endDate: todayIso(),
    physicalProgress: 0, plannedProgress: 0, financialProgress: 0, location: '—', status: 'ongoing', safetyHoursNoLti: 0,
    activeWorkforce: 0, activeEquipment: 0, trenchLengthMeters: 0, cablesPulledMeters: 0, asphaltRestoredM2: 0, lat: 24.7, lng: 46.7,
    actualCost: 0, financialTimeline: []
  };
  const selectedProject = allowedProjects.find((p) => p.id === selectedProjectId) ?? allowedProjects[0] ?? emptyProject;

  const inScope = useCallback(<T extends { projectId: string }>(rows: T[]) => rows.filter((r) => allowedIds.includes(r.projectId)), [allowedIds]);

  const myWorker = useMemo(() => (currentUser?.workerId ? data.workers.find((w) => w.id === currentUser.workerId) ?? null : null), [currentUser, data.workers]);

  /* ---------------- mutation helpers ---------------- */
  const actor = (): WorkflowStep => ({
    at: nowIso(), byUserId: currentUser?.id ?? 'system', byName: currentUser?.name ?? 'النظام', role, action: ''
  });
  const step = (action: string, note?: string): WorkflowStep => ({ ...actor(), action, note });

  const pushAudit = (d: DB, action: string, entityType: string, entityId?: string, entityCode?: string, details?: string, projectId?: string) => {
    d.audit.unshift({
      id: uid('aud'), at: nowIso(), userId: currentUser?.id ?? 'system', userName: currentUser?.name ?? 'النظام', role,
      action, entityType, entityId, entityCode, details, projectId
    });
    if (d.audit.length > 2000) d.audit.length = 2000;
  };

  const pushNotif = (d: DB, n: { title: string; description: string; type: AppNotification['type']; tab: string; entityId?: string; code?: string; projectId?: string; toRoles?: UserRole[]; toUserIds?: string[] }) => {
    d.notifications.unshift({
      id: uid('ntf'), title: n.title, description: n.description, type: n.type, targetTab: n.tab, entityId: n.entityId, code: n.code,
      projectId: n.projectId, toRoles: n.toRoles, toUserIds: n.toUserIds, isRead: false, readBy: [], createdAt: nowIso(),
      time: new Date().toLocaleString('ar-SA-u-ca-gregory-nu-latn', { dateStyle: 'short', timeStyle: 'short' })
    });
    if (d.notifications.length > 500) d.notifications.length = 500;
  };

  const mutate = (fn: (d: DB) => void) => {
    setDb((prev) => {
      if (!prev) return prev;
      const d = clone(prev);
      fn(d);
      return d;
    });
  };

  const deny = (a: Action): Result | null => (can(a) ? null : { ok: false, error: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });

  const logAudit = (action: string, entityType: string, entityId?: string, entityCode?: string, details?: string, projectId?: string) =>
    mutate((d) => pushAudit(d, action, entityType, entityId, entityCode, details, projectId));

  /* ================================================================== */
  /*  AUTH                                                               */
  /* ================================================================== */
  const findUser = (identifier: string) => {
    const id = identifier.trim().toLowerCase();
    return accounts.users.find((u) => u.username?.toLowerCase() === id || u.phone === id || u.email?.toLowerCase() === id);
  };

  const login = (identifier: string, password: string, remember = false): Result => {
    const u = findUser(identifier);
    if (!u || u.passwordHash !== hashPassword(password)) return { ok: false, error: 'بيانات الدخول غير صحيحة' };
    if (!u.active) return { ok: false, error: 'تم إيقاف هذا الحساب — راجع المدير التنفيذي' };
    setAccounts((a) => ({ ...a, users: a.users.map((x) => (x.id === u.id ? { ...x, lastLoginAt: nowIso() } : x)) }));
    const d = loadDb(u.companyId);
    storage.save('lastCompany', u.companyId);
    pushAudit(d, 'تسجيل دخول', 'session');
    d.audit[0] = { ...d.audit[0], userId: u.id, userName: u.name, role: u.role };
    setDb(d);
    setSession({ userId: u.id, remember });
    const home = ((d.rolePermissions?.tabs?.[u.role] ?? roleTabs[u.role]) as string[])[0] ?? 'security';
    try { window.history.replaceState(null, '', '#' + home); } catch { /* ignore */ }
    setActiveTabState(home);
    return { ok: true };
  };

  const logout = () => {
    if (online) { online.logout(); return; }
    if (currentUser) logAudit('تسجيل خروج', 'session');
    setTimeout(() => { setSession(null); setSearchTerm(''); }, 0);
  };

  const registerCompany: PlatformContextType['registerCompany'] = (input) => {
    if (!input.companyName.trim() || !input.crNumber.trim()) return { ok: false, error: 'اسم الشركة والسجل التجاري مطلوبة' };
    if (!/^\d{10}$/.test(input.crNumber.trim())) return { ok: false, error: 'رقم السجل التجاري يجب أن يكون 10 أرقام' };
    if (!/^05\d{8}$/.test(input.phone.trim())) return { ok: false, error: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' };
    if (input.password.length < 6) return { ok: false, error: 'كلمة المرور 6 أحرف على الأقل' };
    if (findUser(input.phone) || (input.email && findUser(input.email))) return { ok: false, error: 'الجوال أو البريد مسجل مسبقاً' };
    const companyId = uid('co');
    const userId = uid('u');
    const comp: Company = { id: companyId, name: input.companyName.trim(), crNumber: input.crNumber.trim(), logoDataUrl: input.logoDataUrl, brandColor: input.brandColor, createdAt: nowIso() };
    storage.save('lastCompany', companyId);
    const user: AppUser = {
      id: userId, companyId, name: input.adminName.trim(), phone: input.phone.trim(), email: input.email?.trim() || undefined,
      passwordHash: hashPassword(input.password), role: 'executive_director', projectIds: 'all', active: true, createdAt: nowIso()
    };
    setAccounts((a) => ({ ...a, companies: [...a.companies, comp], users: [...a.users, user] }));
    const d = emptyDb(companyId);
    d.audit.unshift({ id: uid('aud'), at: nowIso(), userId, userName: user.name, role: 'executive_director', action: 'تسجيل شركة جديدة', entityType: 'company', entityId: companyId, entityCode: comp.crNumber });
    storage.save(dbKey(companyId), d);
    setDb(d);
    setSession({ userId });
    return { ok: true, id: companyId };
  };

  const requestPasswordReset = (identifier: string) => {
    if (online) return { ok: false, error: 'استعادة كلمة المرور الذاتية غير مفعلة بعد' };
    const u = findUser(identifier);
    if (!u) return { ok: false, error: 'لا يوجد حساب بهذا الجوال أو البريد' };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes.current[u.id] = code;
    return { ok: true, code };
  };

  const resetPassword = (identifier: string, code: string, newPassword: string): Result => {
    if (online) return { ok: false, error: 'استعادة كلمة المرور الذاتية غير مفعلة بعد' };
    const u = findUser(identifier);
    if (!u || resetCodes.current[u.id] !== code.trim()) return { ok: false, error: 'رمز التحقق غير صحيح' };
    if (newPassword.length < 6) return { ok: false, error: 'كلمة المرور 6 أحرف على الأقل' };
    setAccounts((a) => ({ ...a, users: a.users.map((x) => (x.id === u.id ? { ...x, passwordHash: hashPassword(newPassword) } : x)) }));
    delete resetCodes.current[u.id];
    return { ok: true };
  };

  const updateCompany: PlatformContextType['updateCompany'] = (patch) => {
    if (!currentUser || !can('users.manage')) return { ok: false, error: 'ليس لديك صلاحية لتعديل بيانات الشركة' };
    if (patch.name !== undefined && !patch.name.trim()) return { ok: false, error: 'اسم الشركة مطلوب' };
    if (patch.crNumber !== undefined && !/^\d{10}$/.test(patch.crNumber.trim())) return { ok: false, error: 'رقم السجل التجاري يجب أن يكون 10 أرقام' };
    if (patch.brandColor !== undefined && !/^#[0-9a-f]{6}$/i.test(patch.brandColor)) return { ok: false, error: 'لون غير صالح' };
    setAccounts((a) => ({
      ...a,
      companies: a.companies.map((c) => c.id !== currentUser.companyId ? c : {
        ...c,
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.crNumber !== undefined ? { crNumber: patch.crNumber.trim() } : {}),
        ...(patch.logoDataUrl !== undefined ? { logoDataUrl: patch.logoDataUrl ?? undefined } : {}),
        ...(patch.brandColor !== undefined ? { brandColor: patch.brandColor } : {})
      })
    }));
    mutate((d) => pushAudit(d, 'تحديث هوية الشركة', 'company', currentUser.companyId, undefined, Object.keys(patch).map((k) => ({ name: 'الاسم', crNumber: 'السجل', logoDataUrl: 'الشعار', brandColor: 'اللون' } as any)[k]).join('، ')));
    return { ok: true };
  };

  const users = useMemo(() => accounts.users.filter((u) => u.companyId === currentUser?.companyId), [accounts, currentUser]);

  const inviteUser: PlatformContextType['inviteUser'] = (input) => {
    if (online) return { ok: false, error: 'هذه الخاصية متاحة في العرض التجريبي فقط؛ لم تُفعّل أدوار الموظفين على الخادم بعد' };
    const den = deny('users.manage'); if (den) return den;
    if (!input.name.trim()) return { ok: false, error: 'الاسم مطلوب' };
    if (!/^05\d{8}$/.test(input.phone.trim())) return { ok: false, error: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' };
    if (findUser(input.phone) || (input.email && findUser(input.email))) return { ok: false, error: 'الجوال أو البريد مسجل مسبقاً' };
    if (input.username?.trim() && findUser(input.username)) return { ok: false, error: 'اسم المستخدم مستخدم مسبقاً' };
    if (input.role === 'worker' && !input.workerId) return { ok: false, error: 'اختر سجل الموظف المرتبط بحساب العامل' };
    if (input.role === 'subcontractor' && !input.subcontractorId) return { ok: false, error: 'اختر مقاول الباطن' };
    if (input.role === 'supplier' && !input.supplierName?.trim()) return { ok: false, error: 'اسم المورد مطلوب' };
    if (input.projectIds !== 'all' && input.projectIds.length === 0) return { ok: false, error: 'اختر مشروعاً واحداً على الأقل' };
    const tempPassword = input.password?.trim() || String(Math.floor(100000 + Math.random() * 900000));
    const user: AppUser = {
      id: uid('u'), companyId: currentUser!.companyId, name: input.name.trim(), username: input.username?.trim() || undefined, phone: input.phone.trim(), email: input.email?.trim() || undefined,
      passwordHash: hashPassword(tempPassword), role: input.role, projectIds: input.projectIds, active: true, workerId: input.workerId,
      subcontractorId: input.subcontractorId, supplierName: input.supplierName?.trim(), invitedBy: currentUser!.id, createdAt: nowIso()
    };
    setAccounts((a) => ({ ...a, users: [...a.users, user] }));
    mutate((d) => pushAudit(d, 'دعوة مستخدم', 'user', user.id, user.phone, `${user.name} — ${roleLabels[user.role]}`));
    return { ok: true, id: user.id, tempPassword };
  };

  const updateUser = (id: string, patch: Partial<AppUser>): Result => {
    if (online) return { ok: false, error: 'هذه الخاصية متاحة في العرض التجريبي فقط؛ لم تُفعّل أدوار الموظفين على الخادم بعد' };
    const den = deny('users.manage'); if (den) return den;
    if (id === currentUser?.id && (patch.active === false || (patch.role && patch.role !== currentUser.role)))
      return { ok: false, error: 'لا يمكنك إيقاف حسابك أو تغيير دورك' };
    const target = accounts.users.find((u) => u.id === id);
    if (!target || target.companyId !== currentUser?.companyId) return { ok: false, error: 'المستخدم غير موجود' };
    setAccounts((a) => ({ ...a, users: a.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
    const what = patch.active === false ? 'إيقاف مستخدم' : patch.active === true ? 'تفعيل مستخدم' : 'تعديل مستخدم';
    mutate((d) => pushAudit(d, what, 'user', id, target.phone, target.name));
    return { ok: true };
  };

  /* ================================================================== */
  /*  PROJECTS & BOQ                                                     */
  /* ================================================================== */
  const addProject: PlatformContextType['addProject'] = (p) => {
    const den = deny('project.create'); if (den) return den;
    if (!p.name.trim() || !p.code.trim()) return { ok: false, error: 'اسم المشروع ورمزه مطلوبان' };
    const code = p.code.trim().toUpperCase();
    if (data.projects.some((x) => x.code === code)) return { ok: false, error: 'رمز المشروع مستخدم' };
    if (p.endDate <= p.startDate) return { ok: false, error: 'تاريخ النهاية يجب أن يكون بعد البداية' };
    const id = uid('p');
    mutate((d) => {
      d.projects.push({
        id, code, name: p.name.trim(), client: p.client, consultant: p.consultant, contractValue: 0, startDate: p.startDate, endDate: p.endDate,
        physicalProgress: 0, plannedProgress: 0, financialProgress: 0, location: p.location, status: 'ongoing', safetyHoursNoLti: 0,
        activeWorkforce: 0, activeEquipment: 0, trenchLengthMeters: 0, cablesPulledMeters: 0, asphaltRestoredM2: 0,
        lat: p.lat ?? 24.71, lng: p.lng ?? 46.67, actualCost: 0,
        financialTimeline: [{ month: monthLabel(new Date(p.startDate)), budget: 0, actual: 0 }]
      });
      pushAudit(d, 'إنشاء مشروع', 'project', id, code, p.name, id);
    });
    setSelectedProjectId(id);
    return { ok: true, id };
  };

  const addBoqItem: PlatformContextType['addBoqItem'] = (b) => {
    const den = deny('boq.edit'); if (den) return den;
    if (!b.code.trim() || !b.description.trim() || !b.unit.trim()) return { ok: false, error: 'الرمز والوصف والوحدة مطلوبة' };
    if (!(b.contractQty > 0) || !(b.unitPrice > 0)) return { ok: false, error: 'الكمية وسعر الوحدة يجب أن تكون أكبر من صفر' };
    if (data.boqItems.some((x) => x.projectId === b.projectId && x.code === b.code.trim())) return { ok: false, error: 'رمز البند مكرر في هذا المشروع' };
    const id = uid('boq');
    const mat = b.materialUnitCost ?? Math.round(b.unitPrice * 0.55);
    mutate((d) => {
      d.boqItems.push({
        id, projectId: b.projectId, code: b.code.trim(), description: b.description.trim(), unit: b.unit.trim(), contractQty: b.contractQty,
        unitPrice: b.unitPrice, totalPrice: b.contractQty * b.unitPrice, executedQty: 0, cbsCategory: b.cbsCategory,
        costBreakdown: { material: mat, labor: Math.round(b.unitPrice * 0.15), equipment: Math.round(b.unitPrice * 0.1), subcontractor: 0, overheadProfit: Math.max(0, b.unitPrice - mat - Math.round(b.unitPrice * 0.25)) }
      });
      pushAudit(d, 'إضافة بند', 'boq', id, b.code, b.description, b.projectId);
    });
    return { ok: true, id };
  };

  const importBoqRows: PlatformContextType['importBoqRows'] = (projectId, rows) => {
    const den = deny('boq.edit'); if (den) return den;
    const valid = rows.filter((r) => r.code && r.description && r.unit && r.contractQty > 0 && r.unitPrice > 0);
    if (!valid.length) return { ok: false, error: 'لم يتم العثور على بنود صالحة. الأعمدة المطلوبة: الرمز، الوصف، الوحدة، الكمية، سعر الوحدة' };
    const existing = new Set(data.boqItems.filter((b) => b.projectId === projectId).map((b) => b.code));
    const fresh = valid.filter((r) => !existing.has(String(r.code)));
    mutate((d) => {
      fresh.forEach((r) => {
        d.boqItems.push({
          id: uid('boq'), projectId, code: String(r.code), description: String(r.description), unit: String(r.unit), contractQty: r.contractQty,
          unitPrice: r.unitPrice, totalPrice: r.contractQty * r.unitPrice, executedQty: 0, cbsCategory: 'civil',
          costBreakdown: { material: Math.round(r.unitPrice * 0.55), labor: Math.round(r.unitPrice * 0.15), equipment: Math.round(r.unitPrice * 0.1), subcontractor: 0, overheadProfit: Math.round(r.unitPrice * 0.2) }
        });
      });
      pushAudit(d, 'استيراد جدول كميات من Excel', 'boq', undefined, undefined, `${fresh.length} بند`, projectId);
    });
    return { ok: true, count: fresh.length };
  };

  /* ================================================================== */
  /*  DPR                                                                */
  /* ================================================================== */
  const validPtwFor = (projectId: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    return data.ptws.find((p) => p.projectId === projectId && p.status === 'active' && p.validUntil >= now);
  };

  // pending (not yet posted) DPR quantities per BOQ item
  const pendingDprQty = (boqItemId: string, excludeId?: string) =>
    data.dprs
      .filter((r) => !r.posted && r.status !== 'rejected' && r.status !== 'draft' && r.id !== excludeId)
      .reduce((a, r) => a + (r.itemsExecuted.find((i) => i.boqItemId === boqItemId)?.quantity ?? 0), 0);

  const saveDpr: PlatformContextType['saveDpr'] = (input, submit) => {
    const den = deny('dpr.create'); if (den) return den;
    const pid = selectedProjectId;
    if (!pid) return { ok: false, error: 'لا يوجد مشروع محدد' };
    const items = input.items.filter((i) => i.quantity > 0);
    if (!input.sector.trim()) return { ok: false, error: 'حدد القطاع / موقع العمل' };
    if (!items.length) return { ok: false, error: 'أدخل كمية منفذة لبند واحد على الأقل' };
    if (input.date > todayIso()) return { ok: false, error: 'لا يمكن أن يكون تاريخ التقرير في المستقبل' };
    for (const i of items) {
      const b = data.boqItems.find((x) => x.id === i.boqItemId);
      if (!b) return { ok: false, error: 'بند غير موجود' };
      const room = b.contractQty - b.executedQty - pendingDprQty(b.id);
      if (i.quantity > room) return { ok: false, error: `الكمية للبند ${b.code} تتجاوز المتبقي من العقد (${room.toLocaleString('en-US')} ${b.unit})` };
    }
    const ptw = validPtwFor(pid);
    if (submit && !ptw) return { ok: false, error: 'لا يوجد تصريح عمل (PTW) ساري لهذا المشروع — لا يمكن رفع التقرير' };
    const proj = data.projects.find((p) => p.id === pid)!;
    const seq = data.dprs.filter((r) => r.projectId === pid).length + 1;
    const id = uid('dpr');
    const code = `DPR-${proj.code}-${pad(seq + 94)}`;
    mutate((d) => {
      d.dprs.unshift({
        id, projectId: pid, reportNumber: code, date: input.date, sector: input.sector.trim(),
        weather: { tempC: input.tempC, condition: input.weatherCondition, isSuitableForWork: input.tempC < 48 },
        workforceCount: input.workforceCount, equipmentCount: input.equipmentCount,
        itemsExecuted: items.map((i) => {
          const b = d.boqItems.find((x) => x.id === i.boqItemId)!;
          return { boqItemId: b.id, description: b.description, quantity: i.quantity, unit: b.unit };
        }),
        siteNotes: input.siteNotes, photosCount: input.photos.length, photos: input.photos, consultantStatus: 'pending',
        submittedBy: currentUser!.name, gpsCoordinates: `${proj.lat.toFixed(4)}° N, ${proj.lng.toFixed(4)}° E`,
        status: submit ? 'submitted' : 'draft', posted: false, ptwNumber: ptw?.permitNumber, createdByUserId: currentUser!.id,
        history: [step(submit ? 'رفع التقرير لمدير المشروع' : 'حفظ كمسودة')]
      });
      pushAudit(d, submit ? 'رفع تقرير ميداني' : 'حفظ تقرير ميداني كمسودة', 'dpr', id, code, undefined, pid);
      if (submit) pushNotif(d, { title: `تقرير ميداني بانتظار اعتمادك ${code}`, description: `${input.sector} — رفعه ${currentUser!.name}`, type: 'warning', tab: 'dpr', entityId: id, code, projectId: pid, toRoles: ['project_manager'] });
    });
    return { ok: true, id };
  };

  const submitDpr = (id: string): Result => {
    const den = deny('dpr.create'); if (den) return den;
    const r = data.dprs.find((x) => x.id === id);
    if (!r || r.status !== 'draft') return { ok: false, error: 'التقرير غير قابل للرفع' };
    const ptw = validPtwFor(r.projectId);
    if (!ptw) return { ok: false, error: 'لا يوجد تصريح عمل (PTW) ساري لهذا المشروع' };
    mutate((d) => {
      const x = d.dprs.find((y) => y.id === id)!;
      x.status = 'submitted'; x.ptwNumber = ptw.permitNumber; x.history.push(step('رفع التقرير لمدير المشروع'));
      pushAudit(d, 'رفع تقرير ميداني', 'dpr', id, x.reportNumber, undefined, x.projectId);
      pushNotif(d, { title: `تقرير ميداني بانتظار اعتمادك ${x.reportNumber}`, description: x.sector, type: 'warning', tab: 'dpr', entityId: id, code: x.reportNumber, projectId: x.projectId, toRoles: ['project_manager'] });
    });
    return { ok: true };
  };

  const dprAction: PlatformContextType['dprAction'] = (id, action, note) => {
    const r = data.dprs.find((x) => x.id === id);
    if (!r) return { ok: false, error: 'التقرير غير موجود' };
    if (action === 'pm_approve') { const den = deny('dpr.pm_approve'); if (den) return den; if (r.status !== 'submitted') return { ok: false, error: 'التقرير ليس بانتظار مدير المشروع' }; }
    if (action === 'consultant_approve') { const den = deny('dpr.consultant_approve'); if (den) return den; if (r.status !== 'pm_approved') return { ok: false, error: 'التقرير لم يعتمده مدير المشروع بعد' }; }
    if (action === 'reject') {
      const okRole = (r.status === 'submitted' && can('dpr.pm_approve')) || (r.status === 'pm_approved' && can('dpr.consultant_approve'));
      if (!okRole) return { ok: false, error: 'ليس لديك صلاحية لرفض هذا التقرير' };
      if (!note?.trim()) return { ok: false, error: 'سبب الرفض مطلوب' };
    }
    // validate posting room again at final approval
    if (action === 'consultant_approve') {
      for (const it of r.itemsExecuted) {
        const b = data.boqItems.find((x) => x.id === it.boqItemId);
        if (b && b.executedQty + it.quantity > b.contractQty) return { ok: false, error: `ترحيل البند ${b.code} يتجاوز كمية العقد` };
      }
    }
    mutate((d) => {
      const x = d.dprs.find((y) => y.id === id)!;
      if (action === 'pm_approve') {
        x.status = 'pm_approved'; x.history.push(step('اعتماد مدير المشروع', note));
        pushAudit(d, 'اعتماد تقرير ميداني (مدير المشروع)', 'dpr', id, x.reportNumber, note, x.projectId);
        pushNotif(d, { title: `تقرير ميداني بانتظار اعتماد الاستشاري ${x.reportNumber}`, description: x.sector, type: 'warning', tab: 'consultant_portal', entityId: id, code: x.reportNumber, projectId: x.projectId, toRoles: ['consultant'] });
      } else if (action === 'consultant_approve') {
        x.status = 'consultant_approved'; x.consultantStatus = note ? 'approved_with_comments' : 'approved'; x.posted = true;
        x.history.push(step('اعتماد الاستشاري وترحيل الكميات', note));
        // posting to BOQ happens ONLY here
        x.itemsExecuted.forEach((it) => {
          const b = d.boqItems.find((y) => y.id === it.boqItemId);
          if (b) b.executedQty += it.quantity;
        });
        const p = d.projects.find((y) => y.id === x.projectId);
        if (p) p.safetyHoursNoLti += x.workforceCount * 10;
        pushAudit(d, 'اعتماد الاستشاري وترحيل الكميات', 'dpr', id, x.reportNumber, x.itemsExecuted.map((i) => `${i.quantity} ${i.unit}`).join('، '), x.projectId);
        pushNotif(d, { title: `تم اعتماد وترحيل ${x.reportNumber}`, description: 'الكميات أصبحت متاحة للمستخلص القادم', type: 'success', tab: 'dpr', entityId: id, code: x.reportNumber, projectId: x.projectId, toRoles: ['project_manager'], toUserIds: x.createdByUserId ? [x.createdByUserId] : undefined });
      } else {
        x.status = 'rejected'; x.consultantStatus = 'rejected'; x.history.push(step('رفض', note));
        pushAudit(d, 'رفض تقرير ميداني', 'dpr', id, x.reportNumber, note, x.projectId);
        pushNotif(d, { title: `تم رفض التقرير ${x.reportNumber}`, description: note ?? '', type: 'urgent', tab: 'dpr', entityId: id, code: x.reportNumber, projectId: x.projectId, toUserIds: x.createdByUserId ? [x.createdByUserId] : undefined });
      }
    });
    return { ok: true };
  };

  /* ================================================================== */
  /*  PPC                                                                */
  /* ================================================================== */
  // "Previous" = cumulative certified quantity of the latest issued (non-draft, non-rejected) certificate
  const certifiedSoFar = (projectId: string, boqItemId: string, excludeId?: string) =>
    data.ppcs
      .filter((c) => c.projectId === projectId && c.id !== excludeId && c.status !== 'rejected' && c.status !== 'draft')
      .reduce((a, c) => Math.max(a, c.items.find((i) => i.boqItemId === boqItemId)?.cumulativeQty ?? 0), 0);

  const buildPpcDraft = (projectId: string, excludeId?: string): PpcDraftLine[] =>
    data.boqItems.filter((b) => b.projectId === projectId).map((b) => {
      const prev = certifiedSoFar(projectId, b.id, excludeId);
      const approved = Math.min(b.executedQty, b.contractQty);
      const max = Math.max(0, approved - prev);
      return {
        boqItemId: b.id, code: b.code, description: b.description, unit: b.unit, contractQty: b.contractQty, approvedExecuted: approved,
        previousQty: prev, maxCurrent: max, currentQty: max, unitPrice: b.unitPrice
      };
    });

  const computePpc = (projectId: string, lines: { boqItemId: string; currentQty: number }[], excludeId?: string) => {
    const draft = buildPpcDraft(projectId, excludeId);
    const items = draft.map((l) => {
      const cur = lines.find((x) => x.boqItemId === l.boqItemId)?.currentQty ?? 0;
      return { boqItemId: l.boqItemId, description: l.description, previousQty: l.previousQty, currentQty: cur, cumulativeQty: l.previousQty + cur, unitPrice: l.unitPrice, totalAmount: cur * l.unitPrice, max: l.maxCurrent, code: l.code, unit: l.unit };
    });
    const bad = items.find((i) => i.currentQty < 0 || i.currentQty > i.max);
    const gross = items.reduce((a, i) => a + i.totalAmount, 0);
    const adv = gross * 0.1, ret = gross * 0.05, vat = (gross - adv - ret) * 0.15;
    return { items, bad, gross, adv, ret, vat, net: gross - adv - ret + vat };
  };

  const savePpc: PlatformContextType['savePpc'] = (lines, submit, existingId) => {
    const den = deny('ppc.create'); if (den) return den;
    const pid = existingId ? data.ppcs.find((c) => c.id === existingId)?.projectId ?? selectedProjectId : selectedProjectId;
    if (existingId) {
      const ex = data.ppcs.find((c) => c.id === existingId);
      if (!ex || ex.status !== 'draft') return { ok: false, error: 'لا يمكن تعديل مستخلص بعد رفعه' };
    } else if (data.ppcs.some((c) => c.projectId === pid && c.status === 'draft')) {
      return { ok: false, error: 'يوجد مستخلص مسودة لهذا المشروع — أكمله أو ارفعه أولاً' };
    }
    const c = computePpc(pid, lines, existingId);
    if (c.bad) return { ok: false, error: `الكمية الحالية للبند ${c.bad.code} تتجاوز المنفذ المعتمد غير المستخلص (${c.bad.max.toLocaleString('en-US')} ${c.bad.unit})` };
    if (c.gross <= 0) return { ok: false, error: 'لا توجد كميات معتمدة جديدة منذ آخر مستخلص' };
    const proj = data.projects.find((p) => p.id === pid)!;
    const id = existingId ?? uid('ppc');
    const seq = existingId ? 0 : Math.max(0, ...data.ppcs.filter((x) => x.projectId === pid).map((x) => Number(x.certificateNumber.split('-').pop()) || 0)) + 1;
    const code = existingId ? data.ppcs.find((x) => x.id === existingId)!.certificateNumber : `PPC-${proj.code}-${pad(seq)}`;
    const last = data.ppcs.filter((x) => x.projectId === pid && x.status !== 'draft').sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
    const periodStart = last ? new Date(new Date(last.periodEnd).getTime() + DAY).toISOString().slice(0, 10) : proj.startDate;
    mutate((d) => {
      const rec: ProgressPaymentCertificate = {
        id, projectId: pid, certificateNumber: code, periodStart, periodEnd: todayIso(), grossAmount: c.gross,
        advanceDeductionRate: 0.1, advanceDeductionAmount: Math.round(c.adv), retainageRate: 0.05, retainageAmount: Math.round(c.ret),
        penaltyDeductions: 0, vatRate: 0.15, vatAmount: Math.round(c.vat), netPayableAmount: Math.round(c.net),
        status: submit ? 'submitted' : 'draft', createdByUserId: currentUser!.id,
        items: c.items.map(({ max, code: _c, unit: _u, ...rest }) => rest),
        history: [...(existingId ? d.ppcs.find((x) => x.id === id)!.history : []), step(submit ? 'إصدار ورفع للاستشاري' : 'حفظ كمسودة')]
      };
      d.ppcs = existingId ? d.ppcs.map((x) => (x.id === id ? rec : x)) : [rec, ...d.ppcs];
      pushAudit(d, submit ? 'إصدار مستخلص ورفعه للاستشاري' : 'حفظ مستخلص كمسودة', 'ppc', id, code, `${Math.round(c.gross).toLocaleString('en-US')} ر.س`, pid);
      if (submit) pushNotif(d, { title: `مستخلص بانتظار اعتمادك ${code}`, description: `إجمالي ${Math.round(c.gross).toLocaleString('en-US')} ر.س`, type: 'warning', tab: 'consultant_portal', entityId: id, code, projectId: pid, toRoles: ['consultant'] });
    });
    return { ok: true, id };
  };

  const ppcAction: PlatformContextType['ppcAction'] = (id, action, note) => {
    const c = data.ppcs.find((x) => x.id === id);
    if (!c) return { ok: false, error: 'المستخلص غير موجود' };
    const rules: Record<string, { perm: Action; from: ProgressPaymentCertificate['status']; to: ProgressPaymentCertificate['status']; label: string }> = {
      submit: { perm: 'ppc.create', from: 'draft', to: 'submitted', label: 'إصدار ورفع للاستشاري' },
      consultant_approve: { perm: 'ppc.consultant_approve', from: 'submitted', to: 'consultant_approved', label: 'اعتماد الاستشاري' },
      owner_approve: { perm: 'ppc.owner_approve', from: 'consultant_approved', to: 'client_approved', label: 'اعتماد المالك' },
      disburse: { perm: 'ppc.disburse', from: 'client_approved', to: 'disbursed', label: 'تسجيل الصرف' }
    };
    if (action === 'reject') {
      const okRole = (c.status === 'submitted' && can('ppc.consultant_approve')) || (c.status === 'consultant_approved' && can('ppc.owner_approve'));
      if (!okRole) return { ok: false, error: 'ليس لديك صلاحية لرفض هذا المستخلص' };
      if (!note?.trim()) return { ok: false, error: 'سبب الرفض مطلوب' };
    } else {
      const r = rules[action];
      const den = deny(r.perm); if (den) return den;
      if (c.status !== r.from) return { ok: false, error: 'حالة المستخلص لا تسمح بهذا الإجراء' };
    }
    mutate((d) => {
      const x = d.ppcs.find((y) => y.id === id)!;
      if (action === 'reject') {
        x.status = 'rejected'; x.history.push(step('رفض', note));
        pushAudit(d, 'رفض مستخلص', 'ppc', id, x.certificateNumber, note, x.projectId);
        pushNotif(d, { title: `تم رفض المستخلص ${x.certificateNumber}`, description: note ?? '', type: 'urgent', tab: 'ppc', entityId: id, code: x.certificateNumber, projectId: x.projectId, toRoles: ['project_manager', 'executive_director'] });
        return;
      }
      const r = rules[action];
      x.status = r.to; x.history.push(step(r.label, note));
      pushAudit(d, `${r.label} — مستخلص`, 'ppc', id, x.certificateNumber, note, x.projectId);
      if (r.to === 'submitted') pushNotif(d, { title: `مستخلص بانتظار اعتمادك ${x.certificateNumber}`, description: '', type: 'warning', tab: 'consultant_portal', entityId: id, code: x.certificateNumber, projectId: x.projectId, toRoles: ['consultant'] });
      if (r.to === 'consultant_approved') pushNotif(d, { title: `مستخلص بانتظار اعتمادك ${x.certificateNumber}`, description: `صافي ${x.netPayableAmount.toLocaleString('en-US')} ر.س`, type: 'warning', tab: 'owner_portal', entityId: id, code: x.certificateNumber, projectId: x.projectId, toRoles: ['owner'] });
      if (r.to === 'client_approved') pushNotif(d, { title: `اعتمد المالك المستخلص ${x.certificateNumber}`, description: 'جاهز لتسجيل الصرف', type: 'success', tab: 'ppc', entityId: id, code: x.certificateNumber, projectId: x.projectId, toRoles: ['executive_director', 'project_manager'] });
    });
    return { ok: true };
  };

  const updatePpcStatus = (id: string, status: ProgressPaymentCertificate['status']) => {
    const map: Record<string, any> = { submitted: 'submit', consultant_approved: 'consultant_approve', client_approved: 'owner_approve', disbursed: 'disburse', rejected: 'reject' };
    const r = ppcAction(id, map[status], status === 'rejected' ? 'رفض' : undefined);
    if (!r.ok) toast(r.error, 'error');
  };

  /* ================================================================== */
  /*  MATERIAL REQUISITIONS                                              */
  /* ================================================================== */
  const materialRemaining = (boqItemId: string, excludeId?: string) => {
    const b = data.boqItems.find((x) => x.id === boqItemId);
    if (!b) return 0;
    const requested = data.materialReqs
      .filter((m) => m.boqItemId === boqItemId && m.status !== 'rejected' && m.id !== excludeId)
      .reduce((a, m) => a + m.requestedQty, 0);
    return Math.max(0, b.contractQty - requested);
  };

  const addMaterialReq: PlatformContextType['addMaterialReq'] = (input) => {
    const den = deny('mr.create'); if (den) return den;
    const b = data.boqItems.find((x) => x.id === input.boqItemId && x.projectId === selectedProjectId);
    if (!b) return { ok: false, error: 'اختر بنداً من جدول كميات المشروع' };
    if (!(input.requestedQty > 0)) return { ok: false, error: 'الكمية يجب أن تكون أكبر من صفر' };
    const remaining = materialRemaining(b.id);
    if (input.requestedQty > remaining) return { ok: false, error: `الكمية المطلوبة تتجاوز المتبقي للبند (${remaining.toLocaleString('en-US')} ${b.unit})` };
    if (!input.supplierName.trim()) return { ok: false, error: 'حدد المورد المقترح' };
    const proj = data.projects.find((p) => p.id === selectedProjectId)!;
    const seq = data.materialReqs.filter((m) => m.projectId === proj.id).length + 44;
    const code = `MR-${proj.code}-${pad(seq)}`;
    const id = uid('mr');
    const unitCost = b.costBreakdown.material;
    mutate((d) => {
      d.materialReqs.unshift({
        id, projectId: proj.id, reqNumber: code, date: todayIso(), boqItemId: b.id, materialName: b.description, requestedQty: input.requestedQty,
        unit: b.unit, boqRemainingQty: remaining - input.requestedQty, supplierName: input.supplierName.trim(), unitCost,
        estimatedCost: unitCost * input.requestedQty, status: 'pending_pm', wastagePercentage: 1.5,
        history: [step('رفع طلب المواد', input.note)]
      });
      pushAudit(d, 'رفع طلب مواد', 'mr', id, code, `${input.requestedQty} ${b.unit}`, proj.id);
      pushNotif(d, { title: `طلب مواد بانتظار اعتمادك ${code}`, description: `${input.requestedQty.toLocaleString('en-US')} ${b.unit} — ${b.code}`, type: 'warning', tab: 'procurement', entityId: id, code, projectId: proj.id, toRoles: ['project_manager'] });
    });
    return { ok: true, id };
  };

  const mrAction: PlatformContextType['mrAction'] = (id, action, payload = {}) => {
    const m = data.materialReqs.find((x) => x.id === id);
    if (!m) return { ok: false, error: 'الطلب غير موجود' };
    const flow: Record<string, { perm: Action; from: MaterialRequisition['status'][]; to: MaterialRequisition['status']; label: string }> = {
      pm_approve: { perm: 'mr.pm_approve', from: ['pending_pm'], to: 'approved', label: 'اعتماد مدير المشروع' },
      reject: { perm: 'mr.pm_approve', from: ['pending_pm'], to: 'rejected', label: 'رفض الطلب' },
      issue_po: { perm: 'mr.issue_po', from: ['approved'], to: 'po_issued', label: 'إصدار أمر شراء' },
      supplier_confirm: { perm: 'mr.supplier', from: ['po_issued'], to: 'supplier_confirmed', label: 'تأكيد التوريد من المورد' },
      deliver: { perm: 'mr.supplier', from: ['supplier_confirmed'], to: 'delivered', label: 'رفع إشعار التسليم والفاتورة' },
      grn: { perm: 'mr.grn', from: ['delivered'], to: 'grn_received', label: 'استلام مخزني (GRN)' }
    };
    const f = flow[action];
    const den = deny(f.perm); if (den) return den;
    if (!f.from.includes(m.status)) return { ok: false, error: 'حالة الطلب لا تسمح بهذا الإجراء' };
    if ((action === 'supplier_confirm' || action === 'deliver') && currentUser?.supplierName !== m.supplierName) return { ok: false, error: 'هذا الأمر ليس موجهاً لك' };
    if (action === 'reject' && !payload.note?.trim()) return { ok: false, error: 'سبب الرفض مطلوب' };
    if (action === 'deliver' && (!payload.deliveryNoteNumber?.trim() || !payload.invoiceNumber?.trim() || !(payload.invoiceAmount! > 0))) return { ok: false, error: 'رقم إشعار التسليم ورقم الفاتورة ومبلغها مطلوبة' };
    mutate((d) => {
      const x = d.materialReqs.find((y) => y.id === id)!;
      x.status = f.to;
      if (action === 'issue_po') {
        const proj = d.projects.find((p) => p.id === x.projectId)!;
        x.poNumber = `PO-${proj.code}-${pad(d.materialReqs.filter((y) => y.poNumber).length + 120)}`;
        if (payload.supplierName?.trim()) x.supplierName = payload.supplierName.trim();
      }
      if (action === 'deliver') { x.deliveryNoteNumber = payload.deliveryNoteNumber; x.invoiceNumber = payload.invoiceNumber; x.invoiceAmount = payload.invoiceAmount; }
      if (action === 'grn') x.grnNumber = `GRN-${x.reqNumber.split('-').slice(1).join('-')}`;
      x.history.push(step(f.label, payload.note));
      pushAudit(d, f.label, 'mr', id, x.poNumber ?? x.reqNumber, payload.note, x.projectId);
      const code = x.poNumber ?? x.reqNumber;
      if (action === 'pm_approve') pushNotif(d, { title: `طلب مواد معتمد — أصدر أمر الشراء ${x.reqNumber}`, description: x.materialName.slice(0, 60), type: 'info', tab: 'procurement', entityId: id, code: x.reqNumber, projectId: x.projectId, toRoles: ['procurement_mgr'] });
      if (action === 'issue_po') {
        const sup = accounts.users.filter((u) => u.role === 'supplier' && u.supplierName === x.supplierName).map((u) => u.id);
        pushNotif(d, { title: `أمر شراء جديد ${x.poNumber}`, description: `${x.requestedQty.toLocaleString('en-US')} ${x.unit}`, type: 'warning', tab: 'supplier_portal', entityId: id, code: x.poNumber, projectId: x.projectId, toUserIds: sup });
      }
      if (action === 'supplier_confirm' || action === 'deliver') pushNotif(d, { title: `${f.label} — ${code}`, description: x.supplierName, type: 'info', tab: 'procurement', entityId: id, code, projectId: x.projectId, toRoles: ['procurement_mgr'] });
      if (action === 'reject') pushNotif(d, { title: `تم رفض طلب المواد ${x.reqNumber}`, description: payload.note ?? '', type: 'urgent', tab: 'procurement', entityId: id, code: x.reqNumber, projectId: x.projectId, toRoles: ['site_engineer'] });
    });
    return { ok: true };
  };

  /* ================================================================== */
  /*  VARIATION ORDERS                                                   */
  /* ================================================================== */
  const addVariationOrder: PlatformContextType['addVariationOrder'] = (input, submit) => {
    const den = deny('vo.create'); if (den) return den;
    if (!input.title.trim()) return { ok: false, error: 'عنوان أمر التغيير مطلوب' };
    if (!(input.costImpactSar > 0)) return { ok: false, error: 'الأثر المالي يجب أن يكون أكبر من صفر' };
    const proj = data.projects.find((p) => p.id === selectedProjectId)!;
    const seq = data.variationOrders.filter((v) => v.projectId === proj.id).length + 1;
    const code = `VO-${proj.code}-${pad(seq)}`;
    const id = uid('vo');
    mutate((d) => {
      d.variationOrders.unshift({
        id, projectId: proj.id, voNumber: code, title: input.title.trim(), reason: input.reason, costImpactSar: input.costImpactSar,
        timeExtensionDays: input.timeExtensionDays || 0, status: submit ? 'under_evaluation' : 'proposed',
        history: [step(submit ? 'رفع للاستشاري' : 'حفظ كمسودة')]
      });
      pushAudit(d, submit ? 'رفع أمر تغيير للاستشاري' : 'إنشاء أمر تغيير', 'vo', id, code, `${input.costImpactSar.toLocaleString('en-US')} ر.س`, proj.id);
      if (submit) pushNotif(d, { title: `أمر تغيير بانتظار اعتمادك ${code}`, description: input.title, type: 'warning', tab: 'consultant_portal', entityId: id, code, projectId: proj.id, toRoles: ['consultant'] });
    });
    return { ok: true, id };
  };

  const voAction: PlatformContextType['voAction'] = (id, action, note) => {
    const v = data.variationOrders.find((x) => x.id === id);
    if (!v) return { ok: false, error: 'أمر التغيير غير موجود' };
    const flow: Record<string, { perm: Action; from: VariationOrder['status']; to: VariationOrder['status']; label: string }> = {
      submit: { perm: 'vo.create', from: 'proposed', to: 'under_evaluation', label: 'رفع للاستشاري' },
      consultant_approve: { perm: 'vo.consultant_approve', from: 'under_evaluation', to: 'consultant_approved', label: 'اعتماد الاستشاري' },
      owner_approve: { perm: 'vo.owner_approve', from: 'consultant_approved', to: 'approved_by_client', label: 'اعتماد المالك' }
    };
    if (action === 'reject') {
      const okRole = (v.status === 'under_evaluation' && can('vo.consultant_approve')) || (v.status === 'consultant_approved' && can('vo.owner_approve'));
      if (!okRole) return { ok: false, error: 'ليس لديك صلاحية لرفض أمر التغيير' };
      if (!note?.trim()) return { ok: false, error: 'سبب الرفض مطلوب' };
    } else {
      const f = flow[action];
      const den = deny(f.perm); if (den) return den;
      if (v.status !== f.from) return { ok: false, error: 'حالة أمر التغيير لا تسمح بهذا الإجراء' };
    }
    mutate((d) => {
      const x = d.variationOrders.find((y) => y.id === id)!;
      if (action === 'reject') {
        x.status = 'rejected'; x.history.push(step('رفض', note));
        pushAudit(d, 'رفض أمر تغيير', 'vo', id, x.voNumber, note, x.projectId);
        pushNotif(d, { title: `تم رفض أمر التغيير ${x.voNumber}`, description: note ?? '', type: 'urgent', tab: 'tendering', entityId: id, code: x.voNumber, projectId: x.projectId, toRoles: ['project_manager', 'executive_director'] });
        return;
      }
      const f = flow[action];
      x.status = f.to; x.history.push(step(f.label, note));
      pushAudit(d, `${f.label} — أمر تغيير`, 'vo', id, x.voNumber, note, x.projectId);
      if (f.to === 'under_evaluation') pushNotif(d, { title: `أمر تغيير بانتظار اعتمادك ${x.voNumber}`, description: x.title, type: 'warning', tab: 'consultant_portal', entityId: id, code: x.voNumber, projectId: x.projectId, toRoles: ['consultant'] });
      if (f.to === 'consultant_approved') pushNotif(d, { title: `أمر تغيير بانتظار اعتمادك ${x.voNumber}`, description: x.title, type: 'warning', tab: 'owner_portal', entityId: id, code: x.voNumber, projectId: x.projectId, toRoles: ['owner'] });
      if (f.to === 'approved_by_client') pushNotif(d, { title: `اعتمد المالك أمر التغيير ${x.voNumber}`, description: `أضيف ${x.costImpactSar.toLocaleString('en-US')} ر.س لقيمة العقد`, type: 'success', tab: 'tendering', entityId: id, code: x.voNumber, projectId: x.projectId, toRoles: ['executive_director', 'project_manager'] });
    });
    return { ok: true };
  };

  /* ================================================================== */
  /*  RFI                                                                */
  /* ================================================================== */
  const addRfi: PlatformContextType['addRfi'] = (input) => {
    const den = deny('rfi.create'); if (den) return den;
    if (!input.subject.trim() || !input.question.trim()) return { ok: false, error: 'الموضوع والسؤال مطلوبان' };
    const proj = data.projects.find((p) => p.id === selectedProjectId)!;
    const code = `RFI-${proj.code}-${pad(data.rfis.filter((r) => r.projectId === proj.id).length + 92)}`;
    const id = uid('rfi');
    mutate((d) => {
      d.rfis.unshift({ id, projectId: proj.id, code, subject: input.subject.trim(), question: input.question.trim(), location: input.location, date: todayIso(), raisedByName: currentUser!.name, raisedByUserId: currentUser!.id, status: 'submitted', history: [step('رفع RFI')] });
      pushAudit(d, 'رفع طلب استيضاح RFI', 'rfi', id, code, input.subject, proj.id);
      pushNotif(d, { title: `طلب استيضاح جديد ${code}`, description: input.subject, type: 'warning', tab: 'consultant_portal', entityId: id, code, projectId: proj.id, toRoles: ['consultant'] });
    });
    return { ok: true, id };
  };

  const answerRfi = (id: string, response: string, reject = false): Result => {
    const den = deny('rfi.answer'); if (den) return den;
    const r = data.rfis.find((x) => x.id === id);
    if (!r || r.status !== 'submitted') return { ok: false, error: 'الطلب غير متاح للرد' };
    if (!response.trim()) return { ok: false, error: 'اكتب الرد أو سبب الرفض' };
    mutate((d) => {
      const x = d.rfis.find((y) => y.id === id)!;
      x.status = reject ? 'rejected' : 'answered'; x.response = response.trim(); x.history.push(step(reject ? 'رفض' : 'اعتماد ورد', response));
      pushAudit(d, reject ? 'رفض RFI' : 'الرد على RFI', 'rfi', id, x.code, response, x.projectId);
      pushNotif(d, { title: `${reject ? 'رفض' : 'رد الاستشاري على'} ${x.code}`, description: response.slice(0, 80), type: reject ? 'urgent' : 'success', tab: 'rfi', entityId: id, code: x.code, projectId: x.projectId, toUserIds: x.raisedByUserId ? [x.raisedByUserId] : undefined, toRoles: ['project_manager'] });
    });
    return { ok: true };
  };

  /* ================================================================== */
  /*  SUBCONTRACTOR CLAIMS                                               */
  /* ================================================================== */
  const addSubClaim: PlatformContextType['addSubClaim'] = (input) => {
    const den = deny('sub.claim'); if (den) return den;
    const sub = data.subcontractors.find((s) => s.id === currentUser?.subcontractorId);
    if (!sub) return { ok: false, error: 'حسابك غير مرتبط بمقاول باطن' };
    if (!input.description.trim() || !(input.amount > 0)) return { ok: false, error: 'الوصف والمبلغ مطلوبان' };
    const claimed = data.subClaims.filter((c) => c.subcontractorId === sub.id && c.status !== 'rejected').reduce((a, c) => a + (c.approvedAmount ?? c.amount), 0);
    if (claimed + input.amount > sub.contractValue) return { ok: false, error: `المطالبة تتجاوز قيمة عقد الباطن المتبقية (${(sub.contractValue - claimed).toLocaleString('en-US')} ر.س)` };
    const code = `SC-${sub.id.toUpperCase().replace('-', '')}-${pad(data.subClaims.filter((c) => c.subcontractorId === sub.id).length + 5)}`;
    const id = uid('sc');
    mutate((d) => {
      d.subClaims.unshift({ id, projectId: sub.projectId, subcontractorId: sub.id, code, description: input.description.trim(), amount: input.amount, date: todayIso(), status: 'submitted', history: [step('رفع المطالبة')] });
      pushAudit(d, 'رفع مطالبة مقاول باطن', 'sub_claim', id, code, `${input.amount.toLocaleString('en-US')} ر.س`, sub.projectId);
      pushNotif(d, { title: `مطالبة مقاول باطن ${code}`, description: `${sub.name} — ${input.amount.toLocaleString('en-US')} ر.س`, type: 'warning', tab: 'subcontractors', entityId: id, code, projectId: sub.projectId, toRoles: ['project_manager'] });
    });
    return { ok: true, id };
  };

  const subClaimAction: PlatformContextType['subClaimAction'] = (id, action, approvedAmount, note) => {
    const den = deny('sub.claim_approve'); if (den) return den;
    const c = data.subClaims.find((x) => x.id === id);
    if (!c) return { ok: false, error: 'المطالبة غير موجودة' };
    if (action !== 'pay' && c.status !== 'submitted') return { ok: false, error: 'المطالبة ليست بانتظار المراجعة' };
    if (action === 'pay' && c.status !== 'pm_approved') return { ok: false, error: 'المطالبة غير معتمدة' };
    if (action === 'approve' && (!(approvedAmount! > 0) || approvedAmount! > c.amount)) return { ok: false, error: 'المبلغ المعتمد يجب أن يكون بين 1 وقيمة المطالبة' };
    if (action === 'reject' && !note?.trim()) return { ok: false, error: 'سبب الرفض مطلوب' };
    mutate((d) => {
      const x = d.subClaims.find((y) => y.id === id)!;
      const sub = d.subcontractors.find((s) => s.id === x.subcontractorId)!;
      if (action === 'approve') { x.status = 'pm_approved'; x.approvedAmount = approvedAmount; sub.certifiedToDate += approvedAmount!; sub.invoicedToDate += x.amount; }
      if (action === 'reject') { x.status = 'rejected'; x.note = note; }
      if (action === 'pay') x.status = 'paid';
      x.history.push(step(action === 'approve' ? 'اعتماد' : action === 'reject' ? 'رفض' : 'صرف', note));
      pushAudit(d, `${action === 'approve' ? 'اعتماد' : action === 'reject' ? 'رفض' : 'صرف'} مطالبة مقاول باطن`, 'sub_claim', id, x.code, note, x.projectId);
      const subUsers = accounts.users.filter((u) => u.subcontractorId === x.subcontractorId).map((u) => u.id);
      pushNotif(d, { title: `تحديث مطالبتك ${x.code}`, description: action === 'approve' ? `اعتمد ${approvedAmount!.toLocaleString('en-US')} ر.س` : action === 'reject' ? `رفض: ${note}` : 'تم الصرف', type: action === 'reject' ? 'urgent' : 'success', tab: 'sub_portal', entityId: id, code: x.code, projectId: x.projectId, toUserIds: subUsers });
    });
    return { ok: true };
  };

  /* ================================================================== */
  /*  WORKER PORTAL & HR                                                 */
  /* ================================================================== */
  const workerGuard = (): Result | Worker => {
    if (role !== 'worker' || !myWorker) return { ok: false, error: 'هذا الإجراء متاح من بوابة الموظف فقط' };
    return myWorker;
  };

  const checkIn = (inside: boolean): Result => {
    const w = workerGuard(); if ('ok' in w) return w;
    if (!inside) return { ok: false, error: 'أنت خارج النطاق الجغرافي للموقع — لا يمكن تسجيل الحضور' };
    const t = todayIso();
    if (w.attendanceLog?.some((l) => l.date === t && l.checkIn)) return { ok: false, error: 'تم تسجيل حضورك اليوم مسبقاً' };
    const time = fmtTime();
    mutate((d) => {
      const x = d.workers.find((y) => y.id === w.id)!;
      x.status = 'present'; x.checkInTime = time; x.geoFenceStatus = 'inside_geofence';
      x.attendanceLog = [{ date: t, checkIn: time, insideGeofence: true }, ...(x.attendanceLog ?? []).filter((l) => l.date !== t)];
      pushAudit(d, 'تسجيل حضور (بوابة الموظف)', 'attendance', w.id, w.empCode, time, w.projectId);
    });
    return { ok: true };
  };

  const checkOut = (): Result => {
    const w = workerGuard(); if ('ok' in w) return w;
    const t = todayIso();
    const today = w.attendanceLog?.find((l) => l.date === t);
    if (!today?.checkIn) return { ok: false, error: 'سجّل الحضور أولاً' };
    if (today.checkOut) return { ok: false, error: 'تم تسجيل الانصراف مسبقاً' };
    const time = fmtTime();
    mutate((d) => {
      const x = d.workers.find((y) => y.id === w.id)!;
      x.attendanceLog = (x.attendanceLog ?? []).map((l) => (l.date === t ? { ...l, checkOut: time } : l));
      pushAudit(d, 'تسجيل انصراف (بوابة الموظف)', 'attendance', w.id, w.empCode, time, w.projectId);
    });
    return { ok: true };
  };

  const requestLeave: PlatformContextType['requestLeave'] = (input) => {
    const w = workerGuard(); if ('ok' in w) return w;
    if (!input.startDate || !input.endDate || input.endDate < input.startDate) return { ok: false, error: 'تحقق من تواريخ الإجازة' };
    const days = Math.round((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / DAY) + 1;
    if (input.type === 'annual' && days > w.leaveBalanceDays) return { ok: false, error: `رصيدك ${w.leaveBalanceDays} يوم فقط` };
    const id = uid('leave');
    mutate((d) => {
      d.leaveRequests.unshift({ id, projectId: w.projectId, workerId: w.id, workerName: w.name, type: input.type, startDate: input.startDate, endDate: input.endDate, daysCount: days, reason: input.reason, flightTicketProvided: false, status: 'pending', requestedViaPortal: true });
      pushAudit(d, 'طلب إجازة (بوابة الموظف)', 'leave', id, w.empCode, `${days} يوم`, w.projectId);
      pushNotif(d, { title: `طلب إجازة جديد — ${w.name}`, description: `${days} يوم من ${input.startDate}`, type: 'warning', tab: 'hr', entityId: id, code: w.empCode, projectId: w.projectId, toRoles: ['hr_manager'] });
    });
    return { ok: true, id };
  };

  const requestAdvance: PlatformContextType['requestAdvance'] = (input) => {
    const w = workerGuard(); if ('ok' in w) return w;
    if (!(input.amount > 0) || input.amount > w.basicSalary) return { ok: false, error: `السلفة بين 1 و ${w.basicSalary.toLocaleString('en-US')} ر.س (الراتب الأساسي)` };
    if (data.advances.some((a) => a.workerId === w.id && a.status === 'pending')) return { ok: false, error: 'لديك طلب سلفة قيد المراجعة' };
    const id = uid('adv');
    mutate((d) => {
      d.advances.unshift({ id, projectId: w.projectId, workerId: w.id, workerName: w.name, amount: input.amount, reason: input.reason, date: todayIso(), status: 'pending' });
      pushAudit(d, 'طلب سلفة (بوابة الموظف)', 'advance', id, w.empCode, `${input.amount} ر.س`, w.projectId);
      pushNotif(d, { title: `طلب سلفة — ${w.name}`, description: `${input.amount.toLocaleString('en-US')} ر.س`, type: 'warning', tab: 'hr', entityId: id, code: w.empCode, projectId: w.projectId, toRoles: ['hr_manager'] });
    });
    return { ok: true, id };
  };

  const signTbt = (tbtId: string): Result => {
    const w = workerGuard(); if ('ok' in w) return w;
    const t = data.toolboxTalks.find((x) => x.id === tbtId);
    if (!t || t.projectId !== w.projectId) return { ok: false, error: 'المحاضرة غير متاحة' };
    if (t.signedWorkerIds?.includes(w.id)) return { ok: false, error: 'تم التوقيع مسبقاً' };
    mutate((d) => {
      const x = d.toolboxTalks.find((y) => y.id === tbtId)!;
      x.signedWorkerIds = [...(x.signedWorkerIds ?? []), w.id];
      x.attendeesCount += 1;
      pushAudit(d, 'توقيع حضور محاضرة TBT', 'tbt', tbtId, w.empCode, x.topic, w.projectId);
    });
    return { ok: true };
  };

  const reportHazard: PlatformContextType['reportHazard'] = (input) => {
    if (!currentUser) return { ok: false, error: 'سجّل الدخول' };
    if (!input.description.trim() || !input.location.trim()) return { ok: false, error: 'الموقع والوصف مطلوبان' };
    const pid = myWorker?.projectId ?? selectedProjectId;
    const proj = data.projects.find((p) => p.id === pid)!;
    const code = `HZ-${proj.code}-${pad(data.hazards.filter((h) => h.projectId === pid).length + 1)}`;
    const id = uid('hz');
    mutate((d) => {
      d.hazards.unshift({ id, projectId: pid, code, reportedByWorkerId: myWorker?.id, reportedByName: currentUser.name, location: input.location, description: input.description, severity: input.severity, date: todayIso(), status: 'open' });
      pushAudit(d, 'إبلاغ عن خطر', 'hazard', id, code, input.description, pid);
      pushNotif(d, { title: `بلاغ خطر ${input.severity === 'high' ? 'عالي الخطورة' : ''} ${code}`, description: `${input.location}: ${input.description.slice(0, 60)}`, type: input.severity === 'high' ? 'urgent' : 'warning', tab: 'hse', entityId: id, code, projectId: pid, toRoles: ['safety_officer', 'project_manager'] });
    });
    return { ok: true, id };
  };

  const leaveAction = (id: string, approve: boolean): Result => {
    const den = deny('hr.leave_approve'); if (den) return den;
    const l = data.leaveRequests.find((x) => x.id === id);
    if (!l || l.status !== 'pending') return { ok: false, error: 'الطلب ليس قيد المراجعة' };
    mutate((d) => {
      const x = d.leaveRequests.find((y) => y.id === id)!;
      x.status = approve ? 'approved' : 'rejected';
      if (approve) {
        const w = d.workers.find((y) => y.id === x.workerId);
        if (w && x.type === 'annual') { w.leaveBalanceDays = Math.max(0, w.leaveBalanceDays - x.daysCount); w.leavesTakenDays += x.daysCount; }
      }
      pushAudit(d, approve ? 'اعتماد إجازة' : 'رفض إجازة', 'leave', id, x.workerName, `${x.daysCount} يوم`, x.projectId);
      const wu = accounts.users.filter((u) => u.workerId === x.workerId).map((u) => u.id);
      pushNotif(d, { title: approve ? 'تم اعتماد إجازتك' : 'تم رفض طلب إجازتك', description: `${x.startDate} → ${x.endDate}`, type: approve ? 'success' : 'urgent', tab: 'worker_portal', entityId: id, projectId: x.projectId, toUserIds: wu });
    });
    return { ok: true };
  };

  const advanceAction = (id: string, approve: boolean): Result => {
    const den = deny('hr.leave_approve'); if (den) return den;
    const a = data.advances.find((x) => x.id === id);
    if (!a || a.status !== 'pending') return { ok: false, error: 'الطلب ليس قيد المراجعة' };
    mutate((d) => {
      const x = d.advances.find((y) => y.id === id)!;
      x.status = approve ? 'approved' : 'rejected';
      if (approve) { const w = d.workers.find((y) => y.id === x.workerId); if (w) w.pettyCashBalance += x.amount; }
      pushAudit(d, approve ? 'اعتماد سلفة' : 'رفض سلفة', 'advance', id, x.workerName, `${x.amount} ر.س`, x.projectId);
      const wu = accounts.users.filter((u) => u.workerId === x.workerId).map((u) => u.id);
      pushNotif(d, { title: approve ? 'تم اعتماد السلفة' : 'تم رفض طلب السلفة', description: `${x.amount.toLocaleString('en-US')} ر.س`, type: approve ? 'success' : 'urgent', tab: 'worker_portal', entityId: id, projectId: x.projectId, toUserIds: wu });
    });
    return { ok: true };
  };

  const hazardAction = (id: string, status: HazardReport['status']): Result => {
    if (!can('ptw.create')) return { ok: false, error: 'ليس لديك صلاحية' };
    mutate((d) => {
      const x = d.hazards.find((y) => y.id === id); if (!x) return;
      x.status = status;
      pushAudit(d, 'تحديث بلاغ خطر', 'hazard', id, x.code, status, x.projectId);
    });
    return { ok: true };
  };

  const setAttendance = (workerId: string, status: Worker['status']): Result => {
    const den = deny('team.attendance'); if (den) return den;
    const w = data.workers.find((x) => x.id === workerId);
    if (!w || !allowedIds.includes(w.projectId)) return { ok: false, error: 'الموظف خارج مشاريعك' };
    mutate((d) => {
      const x = d.workers.find((y) => y.id === workerId)!;
      x.status = status;
      const t = todayIso();
      if (status === 'present') {
        x.checkInTime = x.checkInTime || fmtTime();
        x.attendanceLog = [{ date: t, checkIn: x.checkInTime, insideGeofence: true }, ...(x.attendanceLog ?? []).filter((l) => l.date !== t)];
      }
      pushAudit(d, 'تحديث حضور', 'attendance', workerId, x.empCode, status, x.projectId);
    });
    return { ok: true };
  };

  /* ================================================================== */
  /*  Legacy module actions (now scoped, audited and permission-checked) */
  /* ================================================================== */
  const guardToast = (a: Action) => { if (!can(a)) { toast('ليس لديك صلاحية لتنفيذ هذا الإجراء', 'error'); return false; } return true; };
  const projCode = () => data.projects.find((p) => p.id === selectedProjectId)?.code ?? 'GEN';

  const addPtw: PlatformContextType['addPtw'] = (input) => {
    if (!guardToast('ptw.create')) return;
    const now = new Date();
    const permitNumber = `PTW-${input.type.substring(0, 3).toUpperCase()}-${now.getFullYear()}-${pad(data.ptws.length + 90)}`;
    mutate((d) => {
      const id = uid('ptw');
      d.ptws.unshift({
        id, projectId: selectedProjectId, permitNumber, type: input.type, location: input.location,
        issuedDate: now.toISOString().replace('T', ' ').substring(0, 16), validUntil: new Date(now.getTime() + 10 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 16),
        status: 'active', supervisor: input.supervisor, safetyOfficer: input.safetyOfficer, safetyChecklist: input.checklist
      });
      pushAudit(d, 'إصدار تصريح عمل', 'ptw', id, permitNumber, input.location, selectedProjectId);
    });
    toast(`تم إصدار التصريح ${permitNumber}`);
  };

  const addLabTest: PlatformContextType['addLabTest'] = (t) => {
    if (!guardToast('lab.create')) return;
    const testNumber = `LAB-${t.testType.substring(0, 3).toUpperCase()}-${pad(data.labTests.length + 90)}`;
    mutate((d) => {
      const id = uid('lab');
      d.labTests.unshift({ id, projectId: selectedProjectId, testNumber, testDate: todayIso(), ...t });
      pushAudit(d, 'تسجيل فحص مخبري', 'lab', id, testNumber, t.result, selectedProjectId);
      if (t.result === 'failed') pushNotif(d, { title: `فحص مخبري راسب ${testNumber}`, description: t.sampleLocation, type: 'urgent', tab: 'qaqc', entityId: id, code: testNumber, projectId: selectedProjectId, toRoles: ['project_manager', 'qaqc_manager'] });
    });
  };

  const addUtilityClash: PlatformContextType['addUtilityClash'] = (c) => {
    if (!currentUser || !canTab('utilities')) { toast('ليس لديك صلاحية', 'error'); return; }
    const clashCode = `UC-${projCode()}-${pad(data.utilityClashes.length + 45)}`;
    mutate((d) => {
      const id = uid('clash');
      d.utilityClashes.unshift({ id, projectId: selectedProjectId, clashCode, status: 'identified', preTrenchPhotoTaken: true, postPavingPhotoTaken: false, ...c });
      pushAudit(d, 'تسجيل تعارض خدمات', 'clash', id, clashCode, c.locationStreet, selectedProjectId);
      pushNotif(d, { title: `تعارض خدمات جديد ${clashCode}`, description: c.locationStreet, type: 'warning', tab: 'utilities', entityId: id, code: clashCode, projectId: selectedProjectId, toRoles: ['project_manager', 'safety_officer'] });
    });
  };

  const addEmergencyIncident: PlatformContextType['addEmergencyIncident'] = (i) => {
    if (!guardToast('incident.create')) return;
    const incidentCode = `EMERG-${projCode()}-${pad(data.emergencyIncidents.length + 10)}`;
    mutate((d) => {
      const id = uid('emerg');
      d.emergencyIncidents.unshift({ id, projectId: selectedProjectId, incidentCode, dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16), ...i });
      pushAudit(d, 'تسجيل حادث / طارئ', 'incident', id, incidentCode, i.description, selectedProjectId);
      pushNotif(d, { title: `حادث طارئ ${incidentCode}`, description: i.location, type: 'urgent', tab: 'emergency', entityId: id, code: incidentCode, projectId: selectedProjectId, toRoles: ['executive_director', 'project_manager', 'safety_officer'] });
    });
  };

  const addSpoilsTicket: PlatformContextType['addSpoilsTicket'] = (t) => {
    if (!currentUser || !canTab('spoils')) { toast('ليس لديك صلاحية', 'error'); return; }
    const ticketNumber = `MANIFEST-${projCode()}-${pad(data.spoilsTickets.length + 80)}`;
    mutate((d) => {
      const id = uid('sp');
      d.spoilsTickets.unshift({ id, projectId: selectedProjectId, ticketNumber, date: new Date().toISOString().replace('T', ' ').substring(0, 16), inspectorApproved: true, ...t });
      pushAudit(d, 'تسجيل بطاقة ميزان', 'spoils', id, ticketNumber, undefined, selectedProjectId);
    });
  };

  const issueNcr = (input: { description: string; location: string; rootCause: string }): Result => {
    const den = deny('ncr.issue'); if (den) return den;
    if (!input.description.trim()) return { ok: false, error: 'وصف عدم المطابقة مطلوب' };
    const ncrNumber = `NCR-${projCode()}-${new Date().getFullYear()}-${pad(data.ncrs.length + 12)}`;
    const id = uid('ncr');
    mutate((d) => {
      d.ncrs.unshift({ id, projectId: selectedProjectId, ncrNumber, date: todayIso(), issuer: role === 'consultant' ? 'consultant' : 'internal_qaqc', description: input.description, location: input.location, rootCause: input.rootCause, correctiveAction: '', status: 'open' });
      pushAudit(d, 'إصدار تقرير عدم مطابقة', 'ncr', id, ncrNumber, input.description, selectedProjectId);
      pushNotif(d, { title: `تقرير عدم مطابقة ${ncrNumber}`, description: input.description.slice(0, 70), type: 'urgent', tab: 'qaqc', entityId: id, code: ncrNumber, projectId: selectedProjectId, toRoles: ['project_manager', 'qaqc_manager'] });
    });
    return { ok: true, id };
  };

  const closeNcr = (ncrId: string, correctiveAction: string) => {
    if (!guardToast('ncr.close')) return;
    mutate((d) => {
      const x = d.ncrs.find((n) => n.id === ncrId); if (!x) return;
      x.status = 'closed'; x.correctiveAction = correctiveAction; x.closedDate = todayIso();
      pushAudit(d, 'إغلاق تقرير عدم مطابقة', 'ncr', ncrId, x.ncrNumber, correctiveAction, x.projectId);
    });
  };

  const approveTransmittal = (id: string) => {
    if (!guardToast('rfi.answer') && !can('users.manage')) return;
    mutate((d) => {
      const x = d.transmittals.find((t) => t.id === id); if (!x) return;
      x.status = 'approved';
      pushAudit(d, 'اعتماد مراسلة', 'transmittal', id, x.refNumber, undefined, x.projectId);
    });
  };

  const toggleGeoFence = (workerId: string) => {
    if (!guardToast('team.attendance')) return;
    mutate((d) => {
      const w = d.workers.find((x) => x.id === workerId); if (!w) return;
      w.geoFenceStatus = w.geoFenceStatus === 'inside_geofence' ? 'outside_geofence' : 'inside_geofence';
      pushAudit(d, 'تحديث الحضور الجغرافي', 'attendance', workerId, w.empCode, w.geoFenceStatus, w.projectId);
    });
  };

  const addOnboardingWorker = (w: Omit<Worker, 'id'>) => {
    if (!guardToast('hr.manage')) return;
    mutate((d) => {
      const id = uid('w');
      d.workers.unshift({ ...w, id, projectId: w.projectId ?? '' });
      pushAudit(d, 'مباشرة موظف جديد', 'worker', id, w.empCode, w.name, w.projectId);
    });
  };

  const importWorkers: PlatformContextType['importWorkers'] = (rows, projectIdForImport) => {
    if (!can('hr.manage')) return { ok: false, added: 0, skipped: [], error: 'ليس لديك صلاحية' };
    const seen = new Set(data.workers.map((w) => w.iqamaNumber));
    const skipped: { row: number; reason: string }[] = [];
    const fresh: Worker[] = [];
    const target = projectIdForImport ?? '';
    rows.forEach((r, i) => {
      const idn = String(r.idNumber ?? '').replace(/\D/g, '');
      if (!r.name?.trim()) return skipped.push({ row: i + 2, reason: 'الاسم فارغ' });
      if (!/^[12]\d{9}$/.test(idn)) return skipped.push({ row: i + 2, reason: 'رقم الهوية/الإقامة غير صحيح' });
      if (seen.has(idn)) return skipped.push({ row: i + 2, reason: 'رقم مكرر' });
      seen.add(idn);
      const basic = Number(r.basicSalary) || 0, housing = Number(r.housingAllowance) || 0, transport = Number(r.transportAllowance) || 0;
      const saudi = (r.nationality || '').includes('سعودي') || idn.startsWith('1');
      const join = r.joinDate && !isNaN(new Date(r.joinDate).getTime()) ? new Date(r.joinDate).toISOString().slice(0, 10) : todayIso();
      fresh.push({
        id: uid('w'), projectId: target, empCode: `EMP-${1000 + data.workers.length + fresh.length + 1}`, name: r.name.trim(),
        role: r.role?.trim() || 'عامل', nationality: r.nationality?.trim() || (saudi ? 'سعودي' : 'مقيم'), iqamaNumber: idn,
        iqamaExpiry: r.idExpiry || '2099-12-31', medicalInsuranceExpiry: r.insuranceExpiry || '2099-12-31', isHeavyOperator: /مشغل|حفار|سائق/.test(r.role || ''),
        status: 'absent', checkInTime: '', geoFenceStatus: 'outside_geofence', overtimeHoursThisMonth: 0, dailyRate: Math.round((basic + housing + transport) / 30),
        assignedBoqCode: '', pettyCashBalance: 0, joinDate: join, contractType: 'fixed_term', qiwaContractNumber: '',
        probationEndDate: new Date(new Date(join).getTime() + 90 * DAY).toISOString().slice(0, 10), isProbationPassed: false,
        basicSalary: basic, housingAllowance: housing, transportAllowance: transport, siteAllowance: 0,
        gosiDeduction: Math.round(saudi ? (basic + housing) * 0.0975 : 0), totalMonthlySalary: basic + housing + transport,
        leaveBalanceDays: 21, leavesTakenDays: 0, assetsHandedOver: [], violationsCount: 0, attendanceLog: []
      });
    });
    if (fresh.length) mutate((d) => { d.workers.push(...fresh); pushAudit(d, 'استيراد موظفين من Excel', 'worker', undefined, undefined, `${fresh.length} موظف`, target || undefined); });
    return { ok: fresh.length > 0, added: fresh.length, skipped, error: fresh.length ? undefined : 'لم يُضف أي موظف — راجع الأعمدة والأرقام' };
  };

  const assignWorker = (workerId: string, projectId: string): Result => {
    const den = deny('hr.manage'); if (den) return den;
    mutate((d) => {
      const w = d.workers.find((x) => x.id === workerId); if (!w) return;
      w.projectId = projectId;
      pushAudit(d, projectId ? 'إسناد موظف لمشروع' : 'إلغاء إسناد موظف', 'worker', w.id, w.empCode, d.projects.find((p) => p.id === projectId)?.name ?? 'بدون مشروع', projectId || undefined);
    });
    return { ok: true };
  };

  const addLeaveRequest = (req: Omit<LeaveRequest, 'id'>) => {
    if (!guardToast('hr.manage')) return;
    mutate((d) => {
      const id = uid('leave');
      d.leaveRequests.unshift({ ...req, id });
      if (req.status === 'approved') {
        const w = d.workers.find((x) => x.id === req.workerId);
        if (w) { w.leaveBalanceDays = Math.max(0, w.leaveBalanceDays - req.daysCount); w.leavesTakenDays += req.daysCount; }
      }
      pushAudit(d, 'تسجيل إجازة', 'leave', id, req.workerName, `${req.daysCount} يوم`, req.projectId);
    });
  };

  const addDisciplinaryViolation = (v: Omit<DisciplinaryViolation, 'id'>) => {
    if (!guardToast('hr.manage')) return;
    mutate((d) => {
      const id = uid('viol');
      d.disciplinaryViolations.unshift({ ...v, id });
      const w = d.workers.find((x) => x.id === v.workerId); if (w) w.violationsCount += 1;
      pushAudit(d, 'تسجيل مخالفة', 'violation', id, v.workerName, v.description, v.projectId);
    });
  };

  const addSettlement = (s: Omit<EndOfServiceSettlement, 'id'>) => {
    if (!guardToast('hr.manage')) return;
    mutate((d) => {
      const id = uid('eosb');
      d.settlements.unshift({ ...s, id });
      const w = d.workers.find((x) => x.id === s.workerId); if (w) w.status = 'absent';
      pushAudit(d, 'اعتماد مخالصة نهاية خدمة', 'eosb', id, s.workerName, `${s.finalNetSettlementSar} ر.س`, s.projectId);
    });
  };

  /* ================================================================== */
  /*  Public attendance kiosk (no login: ID/iqama number + live GPS)     */
  /* ================================================================== */
  const kioskCompanyId = currentUser?.companyId ?? storage.load<string>('lastCompany') ?? DEMO_COMPANY_ID;
  const [kioskDbState, setKioskDb] = useState<DB | null>(null);
  const kioskDb = db && db.companyId === kioskCompanyId ? db : kioskDbState?.companyId === kioskCompanyId ? kioskDbState : null;
  const ensureKiosk = () => { if (online) return; if (!kioskDb) setKioskDb(loadDb(kioskCompanyId)); };
  const kiosk = {
    workers: kioskDb?.workers ?? [],
    projects: kioskDb?.projects ?? [],
    attendanceLogs: kioskDb?.attendanceLogs ?? [],
    companyName: accounts.companies.find((c) => c.id === kioskCompanyId)?.name ?? '',
    logoDataUrl: accounts.companies.find((c) => c.id === kioskCompanyId)?.logoDataUrl
  };
  const registerWorkerAttendance: PlatformContextType['registerWorkerAttendance'] = (input) => {
    if (online) return { success: false, message: 'بوابة الحضور المتصلة غير مفعلة بعد', workerName: '', code: '', isInsideGeofence: false };
    const base = kioskDb ?? loadDb(kioskCompanyId);
    const idn = input.iqamaNumber.trim();
    const w = base.workers.find((x) => x.iqamaNumber === idn || x.empCode.toLowerCase() === idn.toLowerCase());
    const fail = (message: string) => ({ success: false, message, workerName: w?.name ?? '', code: '', isInsideGeofence: input.isInsideGeofence });
    if (!w) return fail('رقم الهوية / الإقامة غير مسجل لدى الموارد البشرية — راجع مشرفك');
    if (w.projectId && base.projects.length && w.projectId !== input.projectId) return fail('أنت مسند لمشروع آخر — اختر مشروعك الصحيح');
    if (!base.projects.length) input = { ...input, isInsideGeofence: true, distanceToProjectMeters: 0 }; // no sites yet → no geofence check
    const t = todayIso();
    const today = w.attendanceLog?.find((l) => l.date === t);
    if (input.type === 'clock_in' && today?.checkIn) return fail(`تم تسجيل حضورك اليوم مسبقاً الساعة ${today.checkIn}`);
    if (input.type === 'clock_out' && !today?.checkIn) return fail('لا يوجد تسجيل حضور اليوم — سجّل الحضور أولاً');
    if (input.type === 'clock_out' && today?.checkOut) return fail(`تم تسجيل انصرافك مسبقاً الساعة ${today.checkOut}`);
    const proj = base.projects.find((p) => p.id === (w.projectId || input.projectId)) ?? { id: '', code: 'HQ', name: 'مقر الشركة' } as Project;
    const code = `ATT-${proj.code}-${Math.floor(1000 + Math.random() * 9000)}`;
    const time = fmtTime();
    const d = clone(base);
    const x = d.workers.find((y) => y.id === w.id)!;
    if (input.isInsideGeofence) {
      if (input.type === 'clock_in') {
        x.status = 'present'; x.checkInTime = time;
        x.attendanceLog = [{ date: t, checkIn: time, insideGeofence: true }, ...(x.attendanceLog ?? []).filter((l) => l.date !== t)];
      } else {
        x.attendanceLog = (x.attendanceLog ?? []).map((l) => (l.date === t ? { ...l, checkOut: time } : l));
      }
      x.geoFenceStatus = 'inside_geofence';
    } else {
      x.geoFenceStatus = 'outside_geofence';
    }
    x.lat = input.lat; x.lng = input.lng;
    d.attendanceLogs = [{
      id: uid('att'), iqamaNumber: idn, workerId: w.id, workerName: w.name, workerCode: w.empCode, role: w.role, projectId: proj.id, projectName: proj.name,
      type: input.type, timestamp: `اليوم ${time}`, at: nowIso(), lat: input.lat, lng: input.lng, accuracyMeters: Math.round(input.accuracy),
      isInsideGeofence: input.isInsideGeofence, distanceMeters: Math.round(input.distanceToProjectMeters), verificationCode: code,
      status: (input.isInsideGeofence ? 'approved' : 'outside_geofence_flagged') as AttendanceLog['status'], notes: input.notes
    } as AttendanceLog, ...(d.attendanceLogs ?? [])].slice(0, 1000);
    const label = input.type === 'clock_in' ? 'تسجيل حضور' : 'تسجيل انصراف';
    d.audit.unshift({ id: uid('aud'), at: nowIso(), userId: `worker:${w.id}`, userName: w.name, role: 'worker', action: `${label} (بوابة الحضور) ${input.isInsideGeofence ? '' : '— خارج النطاق'}`.trim(), entityType: 'attendance', entityId: w.id, entityCode: w.empCode, details: `${Math.round(input.distanceToProjectMeters)}م من الموقع · ${code}`, projectId: proj.id });
    if (!input.isInsideGeofence) {
      d.notifications.unshift({ id: uid('ntf'), title: `محاولة ${label} خارج نطاق الموقع — ${w.name}`, description: `على بعد ${Math.round(input.distanceToProjectMeters)}م من ${proj.name}`, type: 'warning', targetTab: 'team', entityId: w.id, code: w.empCode, projectId: proj.id, toRoles: ['hr_manager', 'site_engineer', 'project_manager'], isRead: false, readBy: [], createdAt: nowIso(), time: `اليوم ${time}` });
    }
    if (db && db.companyId === d.companyId) setDb(d); else { setKioskDb(d); storage.save(dbKey(d.companyId), d); }
    return input.isInsideGeofence
      ? { success: true, message: `تم ${label} بنجاح`, workerName: w.name, code, isInsideGeofence: true }
      : { success: true, message: `سُجّلت المحاولة لكنك خارج نطاق الموقع — لم يُحتسب ${label}، وتم إشعار المشرف`, workerName: w.name, code, isInsideGeofence: false };
  };

  /* ================================================================== */
  /*  Role permissions editor (admin)                                    */
  /* ================================================================== */
  const allRoles = Object.keys(roleLabels) as UserRole[];
  const rolePerms = {
    tabs: Object.fromEntries(allRoles.map((r) => [r, effTabs(r)])) as Record<UserRole, string[]>,
    actions: Object.fromEntries(allRoles.map((r) => [r, effActions(r)])) as Record<UserRole, Action[]>,
    customized: !!data.rolePermissions
  };
  const saveRolePermissions = (r: UserRole, tabs: string[], actions: Action[]): Result => {
    if (online) return { ok: false, error: 'هذه الخاصية متاحة في العرض التجريبي فقط؛ لم تُفعّل أدوار الموظفين على الخادم بعد' };
    const den = deny('users.manage'); if (den) return den;
    if (!tabs.length) return { ok: false, error: 'اختر شاشة واحدة على الأقل لهذه الوظيفة' };
    mutate((d) => {
      const base = d.rolePermissions ?? { tabs: { ...roleTabs } as Record<UserRole, string[]>, actions: { ...roleActions } as Record<UserRole, Action[]> };
      base.tabs = { ...base.tabs, [r]: tabs };
      base.actions = { ...base.actions, [r]: actions };
      d.rolePermissions = base;
      pushAudit(d, 'تعديل صلاحيات وظيفة', 'permissions', r, roleLabels[r], `${tabs.length} شاشة · ${actions.length} إجراء`);
    });
    return { ok: true };
  };
  const resetRolePermissions = (): Result => {
    if (online) return { ok: false, error: 'هذه الخاصية متاحة في العرض التجريبي فقط؛ لم تُفعّل أدوار الموظفين على الخادم بعد' };
    const den = deny('users.manage'); if (den) return den;
    mutate((d) => { delete d.rolePermissions; pushAudit(d, 'إرجاع الصلاحيات للوضع الافتراضي', 'permissions'); });
    return { ok: true };
  };

  /* ================================================================== */
  /*  Reset demo data                                                    */
  /* ================================================================== */
  const resetDemoData = (): Result => {
    if (online) return { ok: false, error: 'هذه الخاصية متاحة في العرض التجريبي فقط؛ لم تُفعّل أدوار الموظفين على الخادم بعد' };
    const den = deny('data.reset'); if (den) return den;
    if (currentUser!.companyId !== DEMO_COMPANY_ID) {
      const fresh = emptyDb(currentUser!.companyId);
      setDb(fresh);
    } else {
      const fresh = buildDemoDb();
      fresh.audit.unshift({ id: uid('aud'), at: nowIso(), userId: currentUser!.id, userName: currentUser!.name, role, action: 'إعادة البيانات التجريبية', entityType: 'system' });
      setDb(fresh);
      setAccounts((a) => {
        const demo = buildDemoAccounts();
        // keep users created by the company but restore demo accounts & passwords
        const extra = a.users.filter((u) => !demo.users.some((x) => x.id === u.id));
        return { ...a, users: [...demo.users, ...extra] };
      });
    }
    return { ok: true };
  };

  /* ================================================================== */
  /*  Notifications: targeted events + live system alerts               */
  /* ================================================================== */
  const derivedAlerts = useMemo<AppNotification[]>(() => {
    if (!currentUser) return [];
    const out: AppNotification[] = [];
    const t = new Date();
    const days = (iso: string) => Math.ceil((new Date(iso).getTime() - t.getTime()) / DAY);
    if (['executive_director'].includes(role)) {
      data.companyDocs.forEach((doc) => {
        const n = days(doc.expiryDate);
        if (n <= 30) out.push({ id: `al-doc-${doc.id}`, title: `وثيقة ${n < 0 ? 'منتهية' : 'قاربت على الانتهاء'}: ${doc.title.slice(0, 40)}`, description: n < 0 ? `انتهت منذ ${-n} يوم` : `يتبقى ${n} يوم`, type: n < 7 ? 'urgent' : 'warning', targetTab: 'dms', entityId: doc.id, code: doc.documentNumber, isRead: false, time: 'تنبيه نظام' });
      });
    }
    if (['executive_director', 'project_manager'].includes(role)) {
      data.equipments.filter((e) => allowedIds.includes(e.projectId) && e.engineHours >= e.nextServiceHours).forEach((e) =>
        out.push({ id: `al-eq-${e.id}`, title: `صيانة مستحقة: ${e.name.slice(0, 40)}`, description: `تجاوز ${e.engineHours - e.nextServiceHours} ساعة عن موعد الصيانة`, type: 'urgent', targetTab: 'fleet', entityId: e.id, code: e.code, isRead: false, time: 'تنبيه نظام', projectId: e.projectId })
      );
    }
    if (['executive_director', 'hr_manager'].includes(role)) {
      data.workers.filter((w) => allowedIds.includes(w.projectId)).forEach((w) => {
        const isSaudi = w.nationality.includes('سعودي');
        if (!isSaudi) {
          const n = days(w.iqamaExpiry);
          if (n <= 60) out.push({ id: `al-iq-${w.id}`, title: `إقامة ${n < 0 ? 'منتهية' : 'قاربت على الانتهاء'}: ${w.name}`, description: n < 0 ? `منتهية منذ ${-n} يوم` : `يتبقى ${n} يوم`, type: n < 15 ? 'urgent' : 'warning', targetTab: 'hr', entityId: w.id, code: w.empCode, isRead: false, time: 'تنبيه نظام', projectId: w.projectId });
        }
        const m = days(w.medicalInsuranceExpiry);
        if (m <= 60) out.push({ id: `al-ins-${w.id}`, title: `تأمين طبي ${m < 0 ? 'منتهي' : 'قارب على الانتهاء'}: ${w.name}`, description: m < 0 ? `منتهي منذ ${-m} يوم` : `يتبقى ${m} يوم`, type: m < 15 ? 'urgent' : 'warning', targetTab: 'hr', entityId: w.id, code: w.empCode, isRead: false, time: 'تنبيه نظام', projectId: w.projectId });
      });
    }
    return out;
  }, [currentUser, role, data.companyDocs, data.equipments, data.workers, allowedIds]);

  const notifications = useMemo<AppNotification[]>(() => {
    if (!currentUser) return [];
    const reads = new Set(data.notifReads[currentUser.id] ?? []);
    const mine = data.notifications.filter((n) => {
      const targeted = (n.toUserIds?.includes(currentUser.id)) || (n.toRoles?.includes(role) && (!n.projectId || allowedIds.includes(n.projectId)));
      return targeted && canAccessTab(role, n.targetTab);
    }).map((n) => ({ ...n, isRead: n.readBy?.includes(currentUser.id) ?? false }));
    const alerts = derivedAlerts.filter((a) => canAccessTab(role, a.targetTab)).map((a) => ({ ...a, isRead: reads.has(a.id) }));
    return [...mine, ...alerts];
  }, [currentUser, role, data.notifications, data.notifReads, derivedAlerts, allowedIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationAsRead = (id: string) => {
    if (!currentUser) return;
    mutate((d) => {
      const n = d.notifications.find((x) => x.id === id);
      if (n) n.readBy = Array.from(new Set([...(n.readBy ?? []), currentUser.id]));
      else d.notifReads[currentUser.id] = Array.from(new Set([...(d.notifReads[currentUser.id] ?? []), id]));
    });
  };
  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    const ids = notifications.map((n) => n.id);
    mutate((d) => {
      d.notifications.forEach((n) => { if (ids.includes(n.id)) n.readBy = Array.from(new Set([...(n.readBy ?? []), currentUser.id])); });
      d.notifReads[currentUser.id] = Array.from(new Set([...(d.notifReads[currentUser.id] ?? []), ...ids.filter((i) => i.startsWith('al-'))]));
    });
  };

  /* ================================================================== */
  /*  Search (permission-aware)                                          */
  /* ================================================================== */
  const scoped = {
    boqItems: inScope(data.boqItems),
    dprs: inScope(data.dprs),
    ppcs: inScope(data.ppcs),
    equipments: inScope(data.equipments),
    workers: role === 'worker' ? data.workers.filter((w) => w.id === currentUser?.workerId) : data.workers.filter((w) => allowedIds.includes(w.projectId) || (!w.projectId && (can('hr.manage') || can('users.manage') || can('team.attendance')))),
    ptws: inScope(data.ptws),
    toolboxTalks: inScope(data.toolboxTalks),
    ncrs: inScope(data.ncrs),
    labTests: inScope(data.labTests),
    transmittals: inScope(data.transmittals),
    materialReqs: role === 'supplier' ? inScope(data.materialReqs).filter((m) => m.supplierName === currentUser?.supplierName && m.poNumber) : inScope(data.materialReqs),
    subcontractors: role === 'subcontractor' ? data.subcontractors.filter((s) => s.id === currentUser?.subcontractorId) : inScope(data.subcontractors),
    utilityClashes: inScope(data.utilityClashes),
    spoilsTickets: inScope(data.spoilsTickets),
    emergencyIncidents: inScope(data.emergencyIncidents),
    variationOrders: inScope(data.variationOrders),
    leaveRequests: role === 'worker' ? data.leaveRequests.filter((l) => l.workerId === currentUser?.workerId) : inScope(data.leaveRequests),
    disciplinaryViolations: role === 'worker' ? data.disciplinaryViolations.filter((l) => l.workerId === currentUser?.workerId) : inScope(data.disciplinaryViolations),
    settlements: inScope(data.settlements),
    rfis: inScope(data.rfis),
    hazards: inScope(data.hazards),
    advances: role === 'worker' ? data.advances.filter((l) => l.workerId === currentUser?.workerId) : inScope(data.advances),
    subClaims: role === 'subcontractor' ? data.subClaims.filter((c) => c.subcontractorId === currentUser?.subcontractorId) : inScope(data.subClaims)
  };

  const searchAll = (term: string): SearchResult[] => {
    const q = term.trim().toLowerCase();
    if (q.length < 2 || !currentUser) return [];
    const out: SearchResult[] = [];
    const add = (tab: TabId, kind: string, id: string, label: string, code?: string, projectId?: string) => {
      if (!canAccessTab(role, tab)) return;
      if (`${label} ${code ?? ''}`.toLowerCase().includes(q)) out.push({ id, tab, kind, label, code, projectId });
    };
    const pick = (cands: TabId[]) => cands.find((t) => canAccessTab(role, t)) ?? cands[0];
    allowedProjects.forEach((p) => add(pick(['boq', 'owner_portal']), 'مشروع', p.id, p.name, p.code, p.id));
    scoped.boqItems.forEach((b) => add('boq', 'بند', b.id, b.description, b.code, b.projectId));
    scoped.dprs.forEach((r) => add(pick(['dpr', 'consultant_portal']), 'تقرير ميداني', r.id, r.sector, r.reportNumber, r.projectId));
    scoped.ppcs.forEach((c) => add(pick(['ppc', 'consultant_portal', 'owner_portal']), 'مستخلص', c.id, `مستخلص ${c.certificateNumber}`, c.certificateNumber, c.projectId));
    scoped.materialReqs.forEach((m) => add(pick(['procurement', 'supplier_portal']), 'طلب مواد', m.id, m.materialName, `${m.reqNumber} ${m.poNumber ?? ''}`, m.projectId));
    scoped.variationOrders.forEach((v) => add(pick(['tendering', 'consultant_portal', 'owner_portal']), 'أمر تغيير', v.id, v.title, v.voNumber, v.projectId));
    scoped.equipments.forEach((e) => add('fleet', 'معدة', e.id, e.name, e.code, e.projectId));
    scoped.workers.forEach((w) => add(pick(['hr', 'team']), 'موظف', w.id, w.name, w.empCode, w.projectId));
    scoped.ptws.forEach((p) => add('hse', 'تصريح عمل', p.id, p.location, p.permitNumber, p.projectId));
    scoped.ncrs.forEach((n) => add('qaqc', 'NCR', n.id, n.description, n.ncrNumber, n.projectId));
    scoped.rfis.forEach((r) => add(pick(['rfi', 'consultant_portal']), 'RFI', r.id, r.subject, r.code, r.projectId));
    scoped.subClaims.forEach((c) => add(pick(['subcontractors', 'sub_portal']), 'مطالبة باطن', c.id, c.description, c.code, c.projectId));
    scoped.hazards.forEach((h) => add('hse', 'بلاغ خطر', h.id, h.description, h.code, h.projectId));
    return out.slice(0, 25);
  };

  // derived project list for consumers (scoped)
  const value: PlatformContextType = {
    currentUser, company, brand, updateCompany, users, login, logout, registerCompany, requestPasswordReset, resetPassword, inviteUser, updateUser,
    can, canTab, currentRole: role, roleLabel: roleLabels[role],
    selectedProjectId, setSelectedProjectId, selectedProject, activeTab, setActiveTab, focus, openItem, searchTerm, setSearchTerm, searchAll,
    highContrast, setHighContrast, toasts, toast, dismissToast,
    allowedProjects, projects: allowedProjects, ...scoped,
    companyDocs: role === 'executive_director' || role === 'project_manager' || role === 'qaqc_manager' ? data.companyDocs : [],
    audit: can('audit.view') ? data.audit : data.audit.filter((a) => a.userId === currentUser?.id),
    myWorker,
    notifications, unreadCount, markAllNotificationsAsRead, markNotificationAsRead,
    addProject, addBoqItem, importBoqRows,
    saveDpr, submitDpr, dprAction, validPtwFor,
    buildPpcDraft: (pid) => buildPpcDraft(pid), savePpc, ppcAction, updatePpcStatus,
    materialRemaining, addMaterialReq, mrAction,
    addVariationOrder, voAction, addRfi, answerRfi, addSubClaim, subClaimAction,
    checkIn, checkOut, requestLeave, requestAdvance, signTbt, reportHazard, leaveAction, advanceAction, hazardAction, setAttendance,
    addPtw, addLabTest, addUtilityClash, addEmergencyIncident, addSpoilsTicket, issueNcr, closeNcr, approveTransmittal, toggleGeoFence,
    addOnboardingWorker, importWorkers, assignWorker, addLeaveRequest, addDisciplinaryViolation, addSettlement,
    onlineMode: !!online, resetDemoData, logAudit, kiosk, ensureKiosk, registerWorkerAttendance, rolePerms, saveRolePermissions, resetRolePermissions
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) throw new Error('usePlatform must be used within a PlatformProvider');
  return context;
};

export { tabLabels };
