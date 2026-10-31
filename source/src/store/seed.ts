import {
  AttendanceLog, AppUser, AuditEntry, AdvanceRequest, AppNotification, BoqItem, Company, CompanyDocument, DailyProgressReport,
  DisciplinaryViolation, EmergencyIncident, EndOfServiceSettlement, Equipment, HazardReport, LabTest, LeaveRequest,
  MaterialRequisition, NonConformanceReport, PermitToWork, ProgressPaymentCertificate, Project, ProjectTransmittal,
  Rfi, SpoilsAndBorrowTicket, Subcontractor, SubcontractorClaim, ToolboxTalk, UtilityClash, VariationOrder, Worker
} from '../types';
import * as M from '../data/mockData';
import { hashPassword } from './storage';

/* ------------------------------------------------------------------ */
/*  Data shape persisted per company                                   */
/* ------------------------------------------------------------------ */
export interface DB {
  version: number;
  companyId: string;
  seededAt: string;
  projects: Project[];
  boqItems: BoqItem[];
  dprs: DailyProgressReport[];
  ppcs: ProgressPaymentCertificate[];
  equipments: Equipment[];
  workers: Worker[];
  ptws: PermitToWork[];
  toolboxTalks: ToolboxTalk[];
  ncrs: NonConformanceReport[];
  labTests: LabTest[];
  companyDocs: CompanyDocument[];
  transmittals: ProjectTransmittal[];
  materialReqs: MaterialRequisition[];
  subcontractors: Subcontractor[];
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
  notifications: AppNotification[];
  notifReads: Record<string, string[]>; // userId → read derived-alert ids
  attendanceLogs?: AttendanceLog[];
  rolePermissions?: { tabs: Record<string, string[]>; actions: Record<string, any[]> };
  audit: AuditEntry[];
}

/** Global (cross-company) account registry */
export interface Accounts {
  version: number;
  companies: Company[];
  users: AppUser[];
}

export const DB_VERSION = 2;
export const DEMO_COMPANY_ID = 'co-demo';
export const DEMO_PASSWORD = '123456';

/* ------------------------------------------------------------------ */
/*  Date helpers — demo data is anchored to "today"                    */
/* ------------------------------------------------------------------ */
const DAY = 86400000;
export const todayIso = () => new Date().toISOString().slice(0, 10);
const MOCK_ANCHOR = new Date('2026-05-28T00:00:00Z'); // the "today" the original mock data was written for

function shiftStr(s: string, days: number): string {
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(.*)$/);
  if (!m) return s;
  const d = new Date(m[1] + 'T00:00:00Z');
  if (isNaN(d.getTime())) return s;
  return new Date(d.getTime() + days * DAY).toISOString().slice(0, 10) + m[2];
}

/** Shift only the listed event-date fields of each record */
function shift<T extends object>(rows: T[], fields: (keyof T)[], days: number): T[] {
  return rows.map((r) => {
    const c: any = { ...r };
    fields.forEach((f) => {
      if (typeof c[f] === 'string') c[f] = shiftStr(c[f], days);
    });
    return c;
  });
}

const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const monthLabel = (d: Date) => `${arMonths[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;

/* ------------------------------------------------------------------ */
/*  Extra BOQ for Majmaah (p2) and Jeddah (p3)                         */
/* ------------------------------------------------------------------ */
const boq = (
  id: string, projectId: string, code: string, description: string, unit: string,
  contractQty: number, unitPrice: number, executedQty: number, cbsCategory: BoqItem['cbsCategory'], materialShare = 0.55
): BoqItem => ({
  id, projectId, code, description, unit, contractQty, unitPrice, totalPrice: contractQty * unitPrice, executedQty, cbsCategory,
  costBreakdown: {
    material: Math.round(unitPrice * materialShare),
    labor: Math.round(unitPrice * 0.15),
    equipment: Math.round(unitPrice * 0.1),
    subcontractor: 0,
    overheadProfit: Math.round(unitPrice * (0.2 - 0) - 0)
  }
});

const extraBoq: BoqItem[] = [
  boq('boq-p2-1', 'p2', '2.01', 'توريد وتركيب أعمدة إنارة مجلفنة ارتفاع 12م مع الأذرع والقواعد المعدنية', 'عدد', 420, 9500, 390, 'electrical'),
  boq('boq-p2-2', 'p2', '2.02', 'توريد وتركيب كشافات LED قدرة 250 واط مع وحدة تحكم ذكية', 'عدد', 840, 1850, 760, 'electrical'),
  boq('boq-p2-3', 'p2', '2.03', 'توريد وتمديد كابلات تغذية ألمنيوم 4x35 مم2 داخل مواسير حماية', 'م.ط', 26000, 62, 23500, 'electrical'),
  boq('boq-p2-4', 'p2', '2.04', 'كشط وإعادة سفلتة الطرق الرئيسية بسماكة 5سم مع التخطيط', 'م2', 42000, 68, 36000, 'infrastructure', 0.45),
  boq('boq-p2-5', 'p2', '2.05', 'صب قواعد خرسانية مسلحة لأعمدة الإنارة شاملة مسامير التثبيت', 'عدد', 420, 2400, 395, 'civil'),
  boq('boq-p2-6', 'p2', '2.06', 'توريد وتركيب لوحات توزيع وتحكم ذكي بالإنارة (SCADA Ready)', 'عدد', 24, 41000, 20, 'electrical'),
  boq('boq-p3-1', 'p3', '3.01', 'حفر وتمديد مجاري الألياف الضوئية بطريقة الحفر الدقيق (Micro-Trenching)', 'م.ط', 62000, 95, 31000, 'civil', 0.3),
  boq('boq-p3-2', 'p3', '3.02', 'توريد وسحب كابل ألياف ضوئية 144 شعيرة داخل المجاري', 'م.ط', 70000, 58, 26000, 'electrical'),
  boq('boq-p3-3', 'p3', '3.03', 'إنشاء غرف تفتيش خرسانية مسبقة الصب (Manholes) مع الأغطية', 'عدد', 520, 4800, 230, 'civil'),
  boq('boq-p3-4', 'p3', '3.04', 'توريد وتركيب خزائن توزيع الألياف (FDH) شاملة القواعد', 'عدد', 85, 26000, 28, 'infrastructure'),
  boq('boq-p3-5', 'p3', '3.05', 'تنفيذ توصيلات المنازل (Drop Cable) واختبارها حتى نقطة الإنهاء', 'عدد', 4200, 520, 1300, 'electrical'),
  boq('boq-p3-6', 'p3', '3.06', 'إعادة السفلتة والأرصفة بعد الحفر الدقيق', 'م2', 21000, 79, 6000, 'infrastructure', 0.45)
];

const projectCodes: Record<string, string> = { p1: 'SEC', p2: 'MJM', p3: 'STC' };

/* ------------------------------------------------------------------ */
/*  Builders                                                           */
/* ------------------------------------------------------------------ */
export function boqValue(items: BoqItem[], projectId: string) {
  return items.filter((b) => b.projectId === projectId).reduce((a, b) => a + b.contractQty * b.unitPrice, 0);
}

function makePpc(
  projectId: string, code: string, seq: number, items: BoqItem[], prevFrac: number, cumFrac: number,
  status: ProgressPaymentCertificate['status'], periodEnd: string
): ProgressPaymentCertificate {
  const rows = items.filter((b) => b.projectId === projectId).map((b) => {
    const prev = Math.floor(b.executedQty * prevFrac);
    const cum = Math.floor(b.executedQty * cumFrac);
    return {
      boqItemId: b.id, description: b.description, previousQty: prev, currentQty: cum - prev, cumulativeQty: cum,
      unitPrice: b.unitPrice, totalAmount: (cum - prev) * b.unitPrice
    };
  });
  const gross = rows.reduce((a, r) => a + r.totalAmount, 0);
  const adv = gross * 0.1, ret = gross * 0.05, vat = (gross - adv - ret) * 0.15;
  const end = new Date(periodEnd + 'T00:00:00Z');
  const start = new Date(end.getTime() - 29 * DAY).toISOString().slice(0, 10);
  return {
    id: `ppc-${projectId}-${seq}`, projectId, certificateNumber: `PPC-${code}-${String(seq).padStart(3, '0')}`,
    periodStart: start, periodEnd, grossAmount: gross, advanceDeductionRate: 0.1, advanceDeductionAmount: Math.round(adv),
    retainageRate: 0.05, retainageAmount: Math.round(ret), penaltyDeductions: 0, vatRate: 0.15, vatAmount: Math.round(vat),
    netPayableAmount: Math.round(gross - adv - ret + vat), status, items: rows,
    history: [{ at: periodEnd + 'T10:00:00Z', byUserId: 'u-pm', byName: 'م. خالد العتيبي', role: 'project_manager', action: 'رفع للاستشاري' }]
  };
}

/* ------------------------------------------------------------------ */
/*  Demo accounts                                                      */
/* ------------------------------------------------------------------ */
export interface DemoAccount {
  id: string; name: string; username?: string; password?: string; phone: string; email: string; role: AppUser['role']; projectIds: AppUser['projectIds'];
  workerId?: string; subcontractorId?: string; supplierName?: string;
}
export const demoAccounts: DemoAccount[] = [
  { id: 'u-ceo', name: 'مدير النظام', username: '1', password: '1', phone: '0500000001', email: 'ceo@demo.sa', role: 'executive_director', projectIds: 'all' },
  { id: 'u-pm', name: 'م. خالد العتيبي', phone: '0500000002', email: 'pm@demo.sa', role: 'project_manager', projectIds: ['p1', 'p2'] },
  { id: 'u-se', name: 'م. راشد الحربي', phone: '0500000003', email: 'site@demo.sa', role: 'site_engineer', projectIds: ['p1'] },
  { id: 'u-hse', name: 'م. طارق الزهراني', phone: '0500000004', email: 'hse@demo.sa', role: 'safety_officer', projectIds: ['p1', 'p2', 'p3'] },
  { id: 'u-qa', name: 'م. سامر القحطاني', phone: '0500000005', email: 'qa@demo.sa', role: 'qaqc_manager', projectIds: 'all' },
  { id: 'u-proc', name: 'أ. ماجد الدوسري', phone: '0500000006', email: 'proc@demo.sa', role: 'procurement_mgr', projectIds: 'all' },
  { id: 'u-hr', name: 'أ. نورة السبيعي', phone: '0500000007', email: 'hr@demo.sa', role: 'hr_manager', projectIds: 'all' },
  { id: 'u-wk', name: 'فهد الشمري', phone: '0500000008', email: 'worker@demo.sa', role: 'worker', projectIds: ['p1'], workerId: 'w-5' },
  { id: 'u-own', name: 'م. سعد القرني (الشركة السعودية للكهرباء)', phone: '0500000009', email: 'owner@demo.sa', role: 'owner', projectIds: ['p1'] },
  { id: 'u-cons', name: 'م. هشام علمي (خطيب وعلمي)', phone: '0500000010', email: 'consultant@demo.sa', role: 'consultant', projectIds: ['p1'] },
  { id: 'u-sub', name: 'مؤسسة السبيعي للحفر والردم', phone: '0500000011', email: 'sub@demo.sa', role: 'subcontractor', projectIds: ['p1'], subcontractorId: 'sub-1' },
  { id: 'u-sup', name: 'كسارات الدهناء والتوريدات العامة', phone: '0500000012', email: 'supplier@demo.sa', role: 'supplier', projectIds: ['p1'], supplierName: 'كسارات الدهناء والتوريدات العامة' }
];

export function buildDemoAccounts(): Accounts {
  const now = new Date().toISOString();
  return {
    version: DB_VERSION,
    companies: [{ id: DEMO_COMPANY_ID, name: 'شركة البنية المتكاملة للمقاولات', crNumber: '1010892019', createdAt: now }],
    users: demoAccounts.map(({ password, ...a }) => ({
      ...a, companyId: DEMO_COMPANY_ID, passwordHash: hashPassword(password ?? DEMO_PASSWORD), active: true, createdAt: now
    }))
  };
}

export function emptyDb(companyId: string): DB {
  return {
    version: DB_VERSION, companyId, seededAt: new Date().toISOString(), projects: [], boqItems: [], dprs: [], ppcs: [],
    equipments: [], workers: [], ptws: [], toolboxTalks: [], ncrs: [], labTests: [], companyDocs: [], transmittals: [],
    materialReqs: [], subcontractors: [], utilityClashes: [], spoilsTickets: [], emergencyIncidents: [], variationOrders: [],
    leaveRequests: [], disciplinaryViolations: [], settlements: [], rfis: [], hazards: [], advances: [], subClaims: [],
    notifications: [], notifReads: {}, audit: []
  };
}

/* ------------------------------------------------------------------ */
/*  Demo database                                                      */
/* ------------------------------------------------------------------ */
export function buildDemoDb(): DB {
  const today = new Date();
  const t = todayIso();
  const delta = Math.round((new Date(t + 'T00:00:00Z').getTime() - MOCK_ANCHOR.getTime()) / DAY);

  const boqItems: BoqItem[] = [...M.initialBoqItems, ...extraBoq];

  // Variation orders (VO-1 approved → part of contract value)
  const variationOrders: VariationOrder[] = [
    ...M.initialVariationOrders.map((v) => ({
      ...v,
      history: [
        { at: shiftStr('2026-05-10', delta) + 'T09:00:00Z', byUserId: 'u-pm', byName: 'م. خالد العتيبي', role: 'project_manager' as const, action: 'رفع للاستشاري' },
        ...(v.status === 'approved_by_client'
          ? [
              { at: shiftStr('2026-05-14', delta) + 'T09:00:00Z', byUserId: 'u-cons', byName: 'م. هشام علمي', role: 'consultant' as const, action: 'اعتماد الاستشاري' },
              { at: shiftStr('2026-05-18', delta) + 'T09:00:00Z', byUserId: 'u-own', byName: 'م. سعد القرني', role: 'owner' as const, action: 'اعتماد المالك' }
            ]
          : [])
      ]
    })),
    {
      id: 'vo-p3-1', projectId: 'p3', voNumber: 'VO-STC-001', title: 'إضافة مسار ألياف لمجمع الشاطئ السكني الجديد',
      reason: 'client_instruction', costImpactSar: 620000, timeExtensionDays: 25, status: 'under_evaluation',
      history: [{ at: t + 'T08:00:00Z', byUserId: 'u-pm', byName: 'م. خالد العتيبي', role: 'project_manager', action: 'رفع للاستشاري' }]
    }
  ];

  const projects: Project[] = M.initialProjects.map((p) => {
    const value = boqValue(boqItems, p.id) +
      variationOrders.filter((v) => v.projectId === p.id && v.status === 'approved_by_client').reduce((a, v) => a + v.costImpactSar, 0);
    const factor = value / p.contractValue;
    const start = new Date(p.startDate + 'T00:00:00Z');
    return {
      ...p,
      code: projectCodes[p.id],
      contractValue: value,
      actualCost: Math.round(p.actualCost * factor),
      financialTimeline: p.financialTimeline.map((pt, i) => ({
        month: monthLabel(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))),
        budget: Math.round(pt.budget * factor),
        actual: Math.round(pt.actual * factor)
      }))
    };
  });

  const ev = (d: string) => shiftStr(d, delta);

  // DPRs (approved ones are already posted to BOQ) + one awaiting the consultant
  const dprs: DailyProgressReport[] = [
    {
      id: 'dpr-103', projectId: 'p1', reportNumber: 'DPR-SEC-095', date: ev('2026-05-29'),
      sector: 'شارع التخصصي - المقطع رقم 05', weather: { tempC: 35, condition: 'مشمس', isSuitableForWork: true },
      workforceCount: 5, equipmentCount: 3,
      itemsExecuted: [
        { boqItemId: 'boq-1', description: 'حفر طولي بعمق 1.2م', quantity: 150, unit: 'م.ط' },
        { boqItemId: 'boq-3', description: 'أنابيب HDPE قطر 160مم', quantity: 120, unit: 'م.ط' }
      ],
      siteNotes: 'تقدم ممتاز في المقطع 05 بانتظار اعتماد الاستشاري.', photosCount: 0, consultantStatus: 'pending',
      submittedBy: 'م. راشد الحربي', gpsCoordinates: '24.7801° N, 46.6420° E', status: 'pm_approved', posted: false,
      ptwNumber: 'PTW-EXC-2026-088', createdByUserId: 'u-se',
      history: [
        { at: ev('2026-05-29') + 'T15:00:00Z', byUserId: 'u-se', byName: 'م. راشد الحربي', role: 'site_engineer', action: 'رفع التقرير' },
        { at: ev('2026-05-29') + 'T17:00:00Z', byUserId: 'u-pm', byName: 'م. خالد العتيبي', role: 'project_manager', action: 'اعتماد مدير المشروع' }
      ]
    },
    ...M.initialDprs.map((d, i) => ({
      ...d,
      reportNumber: `DPR-SEC-0${94 - i}`,
      date: ev(d.date),
      workforceCount: 5,
      equipmentCount: 3,
      status: 'consultant_approved' as const,
      posted: true,
      ptwNumber: 'PTW-EXC-2026-088',
      history: [
        { at: ev(d.date) + 'T15:00:00Z', byUserId: 'u-se', byName: 'م. راشد الحربي', role: 'site_engineer' as const, action: 'رفع التقرير' },
        { at: ev(d.date) + 'T17:00:00Z', byUserId: 'u-pm', byName: 'م. خالد العتيبي', role: 'project_manager' as const, action: 'اعتماد مدير المشروع' },
        { at: ev(d.date) + 'T19:00:00Z', byUserId: 'u-cons', byName: 'م. هشام علمي', role: 'consultant' as const, action: 'اعتماد الاستشاري وترحيل الكميات' }
      ]
    }))
  ];

  // PPCs: generated from BOQ so every project has its own, covering all its items
  const ppcs: ProgressPaymentCertificate[] = [
    makePpc('p1', 'SEC', 5, boqItems, 0.82, 1, 'consultant_approved', ev('2026-05-31')),
    makePpc('p1', 'SEC', 4, boqItems, 0.65, 0.82, 'disbursed', ev('2026-04-30')),
    makePpc('p2', 'MJM', 3, boqItems, 0.7, 0.95, 'client_approved', ev('2026-05-31')),
    makePpc('p3', 'STC', 1, boqItems, 0, 0.9, 'disbursed', ev('2026-05-31'))
  ];

  const ptws: PermitToWork[] = M.initialPtws.map((p, i) => ({
    ...p,
    issuedDate: `${t} 06:00`,
    validUntil: i === 0 ? `${shiftStr(t, 30)} 18:00` : `${t} 18:00`
  }));
  ptws.push({
    id: 'ptw-p3', projectId: 'p3', permitNumber: 'PTW-EXC-2026-101', type: 'deep_excavation',
    location: 'حي الشاطئ - شارع الأمير فيصل بن فهد', issuedDate: `${t} 06:00`, validUntil: `${shiftStr(t, 14)} 18:00`,
    status: 'active', supervisor: 'م. فيصل الغامدي', safetyOfficer: 'م. طارق الزهراني',
    safetyChecklist: { gasCheckPassed: true, barriersInstalled: true, undergroundCableDetected: true, flashingLightsActive: true, ppeFullGear: true }
  });

  const extraWorkers: Worker[] = [
    { ...M.initialWorkers[0], id: 'w-p2-1', projectId: 'p2', empCode: 'EMP-2041', name: 'رامي حسن الأحمد', nationality: 'سوري', iqamaNumber: '2398110021', status: 'present', assignedBoqCode: '2.01' },
    { ...M.initialWorkers[3], id: 'w-p3-1', projectId: 'p3', empCode: 'EMP-3012', name: 'أنور حسين', nationality: 'بنغلاديشي', iqamaNumber: '2501987745', status: 'present', assignedBoqCode: '3.01' },
    { ...M.initialWorkers[4], id: 'w-p3-2', projectId: 'p3', empCode: 'EMP-3013', name: 'بندر الزهراني', nationality: 'سعودي', iqamaNumber: '1098231190', status: 'absent', assignedBoqCode: '3.02', probationEndDate: shiftStr(t, 40), joinDate: shiftStr(t, -50) }
  ];

  const extraEquip: Equipment[] = [
    { ...M.initialEquipments[0], id: 'eq-p2-1', projectId: 'p2', code: 'EQ-LFT-02', name: 'رافعة سلة هيدروليكية لتركيب الأعمدة', plateNumber: 'م ج ع 2210', status: 'operational' },
    { ...M.initialEquipments[0], id: 'eq-p3-1', projectId: 'p3', code: 'EQ-TRN-05', name: 'ماكينة حفر دقيق Ditch Witch MT12', plateNumber: 'ج د ة 7781', status: 'operational' },
    { ...M.initialEquipments[2], id: 'eq-p3-2', projectId: 'p3', code: 'EQ-CMP-07', name: 'دكاك صغير اهتزازي', plateNumber: 'ج د ة 1290', status: 'standby' }
  ];

  const materialReqs: MaterialRequisition[] = M.initialMaterialReqs.map((m) => {
    const b = boqItems.find((x) => x.id === m.boqItemId)!;
    const unitCost = b.costBreakdown.material;
    return {
      ...m,
      date: ev(m.date),
      unitCost,
      estimatedCost: unitCost * m.requestedQty,
      boqRemainingQty: b.contractQty,
      poNumber: m.status === 'approved' ? undefined : undefined,
      history: [{ at: ev(m.date) + 'T08:00:00Z', byUserId: 'u-se', byName: 'م. راشد الحربي', role: 'site_engineer' as const, action: 'رفع طلب المواد' }]
    };
  });

  const subClaims: SubcontractorClaim[] = [
    {
      id: 'sc-1', projectId: 'p1', subcontractorId: 'sub-1', code: 'SC-SUB1-006', description: 'مطالبة أعمال حفر المقطع 04 — 1,200 م.ط',
      amount: 145000, date: ev('2026-05-27'), status: 'submitted',
      history: [{ at: ev('2026-05-27') + 'T09:00:00Z', byUserId: 'u-sub', byName: 'مؤسسة السبيعي', role: 'subcontractor', action: 'رفع المطالبة' }]
    },
    {
      id: 'sc-0', projectId: 'p1', subcontractorId: 'sub-1', code: 'SC-SUB1-005', description: 'مطالبة أعمال حفر المقطع 03',
      amount: 160000, approvedAmount: 152000, date: ev('2026-04-27'), status: 'paid',
      history: [{ at: ev('2026-04-27') + 'T09:00:00Z', byUserId: 'u-sub', byName: 'مؤسسة السبيعي', role: 'subcontractor', action: 'رفع المطالبة' }]
    }
  ];

  const rfis: Rfi[] = [
    {
      id: 'rfi-92', projectId: 'p1', code: 'RFI-SEC-092', subject: 'منسوب صب قواعد المحطة T-04',
      question: 'المخطط يوضح منسوب -1.20 بينما الطبيعة تظهر خط مياه على -1.10، نرجو تأكيد المنسوب المعتمد.',
      location: 'محطة T-04', date: ev('2026-05-26'), raisedByName: 'م. راشد الحربي', raisedByUserId: 'u-se', status: 'submitted',
      history: [{ at: ev('2026-05-26') + 'T10:00:00Z', byUserId: 'u-se', byName: 'م. راشد الحربي', role: 'site_engineer', action: 'رفع RFI' }]
    }
  ];

  const leaveRequests = shift(M.initialLeaveRequests, ['startDate', 'endDate', 'dutyResumedDate'], delta);

  const db: DB = {
    ...emptyDb(DEMO_COMPANY_ID),
    projects,
    boqItems,
    dprs,
    ppcs,
    equipments: [...M.initialEquipments, ...extraEquip],
    workers: [...M.initialWorkers, ...extraWorkers].map((w, i) => ({
      ...w,
      lat: (projects.find((p) => p.id === w.projectId)?.lat ?? 24.7) + ((i % 3) - 1) * 0.0035,
      lng: (projects.find((p) => p.id === w.projectId)?.lng ?? 46.6) + ((i % 4) - 1.5) * 0.004,
      currentZone: ['المقطع 04 - محطة التحويل T-04', 'المقطع 02 - مسار الحفر الطولي', 'كابينة الإشراف الميداني', 'المقطع 04 - أعمال الردم', 'نقطة التحويلة المرورية'][i % 5],
      shift: 'الوردية الصباحية (06:30 ص - 03:30 م)',
      // the demo worker account (w-5) starts the day not yet checked in, so the portal flow can be tried
      status: w.id === 'w-5' ? ('absent' as const) : w.status,
      checkInTime: w.status === 'present' && w.id !== 'w-5' ? w.checkInTime : '',
      attendanceLog: w.status === 'present' && w.id !== 'w-5' ? [{ date: t, checkIn: w.checkInTime || '06:30', insideGeofence: w.geoFenceStatus === 'inside_geofence' }] : []
    })),
    ptws,
    toolboxTalks: shift(M.initialToolboxTalks, ['date'], delta).map((x) => ({ ...x, signedWorkerIds: [] })),
    ncrs: shift(M.initialNcrs, ['date', 'closedDate'], delta),
    labTests: shift(M.initialLabTests, ['testDate'], delta),
    companyDocs: M.initialCompanyDocs.map((d) => {
      // keep the CAR insurance expiring in 15 days relative to today
      if (d.category === 'car_insurance') return { ...d, expiryDate: shiftStr(t, 15) };
      return d;
    }),
    transmittals: shift(M.initialTransmittals, ['date'], delta),
    materialReqs,
    subcontractors: M.initialSubcontractors.map((s) => s.id === 'sub-1' ? {
      ...s,
      workforce: [
        { name: 'محمد رفيق', trade: 'مشغل حفار', idNumber: '2398801123' },
        { name: 'عبدالرحمن آدم', trade: 'عامل حفر', idNumber: '2401187654' },
        { name: 'جاويد إقبال', trade: 'سائق قلاب', idNumber: '2387766120' },
        { name: 'سليمان موسى', trade: 'عامل حفر', idNumber: '2410093381' }
      ]
    } : s),
    utilityClashes: M.initialUtilityClashes,
    spoilsTickets: shift(M.initialSpoilsTickets, ['date'], delta),
    emergencyIncidents: shift(M.initialEmergencyIncidents, ['dateTime'], delta),
    variationOrders,
    leaveRequests,
    disciplinaryViolations: shift(M.initialDisciplinaryViolations, ['date'], delta),
    settlements: M.initialSettlements,
    rfis,
    subClaims,
    hazards: [],
    advances: [],
    notifications: []
  };
  return db;
}

export { DAY, shiftStr };
