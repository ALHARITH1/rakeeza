import { UserRole } from '../types';

export const roleLabels: Record<UserRole, string> = {
  executive_director: 'المدير التنفيذي',
  project_manager: 'مدير المشروع',
  site_engineer: 'مهندس الموقع',
  safety_officer: 'مسؤول السلامة',
  qaqc_manager: 'مدير الجودة',
  procurement_mgr: 'مدير المشتريات',
  hr_manager: 'مدير الموارد البشرية',
  worker: 'عامل / موظف',
  owner: 'المالك',
  consultant: 'الاستشاري',
  subcontractor: 'مقاول الباطن',
  supplier: 'المورد'
};

export const roleDescriptions: Record<UserRole, string> = {
  executive_director: 'كل الوحدات + المستخدمين والمشاريع + الاعتماد النهائي',
  project_manager: 'اعتماد التقارير الميدانية وطلبات المواد وإعداد المستخلصات وأوامر التغيير',
  site_engineer: 'التقرير الميداني، RFI، طلبات المواد، حضور فريقه',
  safety_officer: 'تصاريح العمل PTW، الحوادث، TBT، معدات الوقاية وبلاغات الخطر',
  qaqc_manager: 'الفحوصات المخبرية وتقارير عدم المطابقة ومحاضر الاستلام',
  procurement_mgr: 'أوامر الشراء PO، الاستلام GRN، والموردين',
  hr_manager: 'الكوادر، مسير الرواتب، الإجازات والسلف، نهاية الخدمة',
  worker: 'بوابة جوال: الحضور، الإجازات والسلف، الراتب، العهد، الوثائق، TBT، الإبلاغ عن خطر',
  owner: 'متابعة الإنجاز والـ S-Curve واعتماد المستخلصات وأوامر التغيير',
  consultant: 'اعتماد RFI والتقارير الميدانية والمستخلصات وأوامر التغيير وإصدار NCR',
  subcontractor: 'رفع المطالبات ومتابعتها مع الخصومات والعمالة',
  supplier: 'أوامر الشراء الموجهة له، تأكيد التوريد، إشعار التسليم والفاتورة'
};

/** Internal staff roles (company employees) vs external stakeholders */
export const internalRoles: UserRole[] = [
  'executive_director', 'project_manager', 'site_engineer', 'safety_officer',
  'qaqc_manager', 'procurement_mgr', 'hr_manager', 'worker'
];

/** Every screen of the platform */
export type TabId =
  | 'dashboard' | 'boq' | 'tendering' | 'dpr' | 'fleet' | 'utilities' | 'spoils' | 'emergency'
  | 'ppc' | 'procurement' | 'subcontractors' | 'hse' | 'training' | 'qaqc' | 'handover'
  | 'hr' | 'dms' | 'crm' | 'gov' | 'security' | 'users' | 'audit' | 'rfi' | 'team' | 'journey' | 'company'
  | 'worker_portal' | 'owner_portal' | 'consultant_portal' | 'sub_portal' | 'supplier_portal';

const ALL_INTERNAL: TabId[] = [
  'dashboard', 'boq', 'tendering', 'dpr', 'fleet', 'utilities', 'spoils', 'emergency', 'ppc',
  'procurement', 'subcontractors', 'hse', 'training', 'qaqc', 'handover', 'hr', 'dms', 'crm', 'gov',
  'security', 'rfi', 'team', 'journey', 'company', 'users', 'audit'
];

export const roleTabs: Record<UserRole, TabId[]> = {
  executive_director: ALL_INTERNAL,
  project_manager: [
    'dashboard', 'boq', 'tendering', 'dpr', 'rfi', 'team', 'journey', 'fleet', 'utilities', 'spoils', 'emergency',
    'ppc', 'procurement', 'subcontractors', 'hse', 'training', 'qaqc', 'handover', 'dms', 'crm', 'gov'
  ],
  site_engineer: ['dpr', 'rfi', 'procurement', 'team', 'journey', 'utilities', 'spoils', 'emergency'],
  safety_officer: ['hse', 'training', 'emergency', 'utilities', 'journey', 'gov'],
  qaqc_manager: ['qaqc', 'handover', 'rfi', 'dms', 'gov'],
  procurement_mgr: ['procurement', 'crm', 'subcontractors', 'gov'],
  hr_manager: ['hr', 'team', 'journey', 'training', 'gov'],
  worker: ['worker_portal'],
  owner: ['owner_portal'],
  consultant: ['consultant_portal', 'dpr', 'rfi', 'qaqc', 'ppc', 'tendering'],
  subcontractor: ['sub_portal'],
  supplier: ['supplier_portal']
};

/** Fine-grained actions (buttons) */
export type Action =
  | 'dpr.create' | 'dpr.pm_approve' | 'dpr.consultant_approve'
  | 'ppc.create' | 'ppc.consultant_approve' | 'ppc.owner_approve' | 'ppc.disburse'
  | 'mr.create' | 'mr.pm_approve' | 'mr.issue_po' | 'mr.supplier' | 'mr.grn'
  | 'vo.create' | 'vo.consultant_approve' | 'vo.owner_approve'
  | 'rfi.create' | 'rfi.answer'
  | 'ncr.issue' | 'ncr.close' | 'lab.create'
  | 'ptw.create' | 'incident.create' | 'tbt.create'
  | 'project.create' | 'boq.edit'
  | 'users.manage' | 'data.reset' | 'audit.view'
  | 'hr.manage' | 'hr.leave_approve' | 'team.attendance'
  | 'sub.claim' | 'sub.claim_approve'
  | 'finance.view'; // contract values, costs, CBS, salaries

export const roleActions: Record<UserRole, Action[]> = {
  executive_director: [
    'dpr.create', 'dpr.pm_approve', 'ppc.create', 'ppc.disburse', 'mr.create', 'mr.pm_approve', 'mr.issue_po', 'mr.grn',
    'vo.create', 'rfi.create', 'ncr.issue', 'ncr.close', 'lab.create', 'ptw.create', 'incident.create', 'tbt.create',
    'project.create', 'boq.edit', 'users.manage', 'data.reset', 'audit.view', 'hr.manage', 'hr.leave_approve',
    'team.attendance', 'sub.claim_approve', 'finance.view'
  ],
  project_manager: [
    'dpr.create', 'dpr.pm_approve', 'ppc.create', 'mr.create', 'mr.pm_approve', 'vo.create', 'rfi.create',
    'ncr.close', 'incident.create', 'boq.edit', 'team.attendance', 'sub.claim_approve', 'finance.view'
  ],
  site_engineer: ['dpr.create', 'mr.create', 'rfi.create', 'team.attendance', 'incident.create'],
  safety_officer: ['ptw.create', 'incident.create', 'tbt.create'],
  qaqc_manager: ['ncr.issue', 'ncr.close', 'lab.create'],
  procurement_mgr: ['mr.issue_po', 'mr.grn'],
  hr_manager: ['hr.manage', 'hr.leave_approve', 'team.attendance', 'tbt.create'],
  worker: [],
  owner: ['ppc.owner_approve', 'vo.owner_approve'],
  consultant: ['dpr.consultant_approve', 'ppc.consultant_approve', 'vo.consultant_approve', 'rfi.answer', 'ncr.issue'],
  subcontractor: ['sub.claim'],
  supplier: ['mr.supplier']
};

export const canAccessTab = (role: UserRole, tab: string) => (roleTabs[role] as string[]).includes(tab);
export const can = (role: UserRole, action: Action) => roleActions[role].includes(action);
export const homeTab = (role: UserRole): TabId => roleTabs[role][0];

export const tabLabels: Record<TabId, string> = {
  dashboard: 'لوحة التحكم القيادية',
  boq: 'المشاريع وجدول الكميات',
  tendering: 'المناقصات وأوامر التغيير',
  dpr: 'التقرير الميداني اليومي',
  fleet: 'المعدات والأسطول',
  utilities: 'تنسيق الخدمات وحرم الطرق',
  spoils: 'ناتج الحفر والموازين',
  emergency: 'الطوارئ والحوادث',
  ppc: 'المستخلصات والدفعات',
  procurement: 'المشتريات وطلبات المواد',
  subcontractors: 'مقاولو الباطن',
  hse: 'السلامة وتصاريح العمل',
  training: 'التدريب والتوعية (TBT)',
  qaqc: 'ضبط الجودة والمختبر',
  handover: 'الاختبارات والتسليم',
  hr: 'الموارد البشرية',
  dms: 'الأرشيف والمستندات',
  crm: 'دليل الشركاء والموردين',
  gov: 'الحوكمة والأوراق الحكومية',
  security: 'الصلاحيات ومسارات الاعتماد',
  users: 'المستخدمون والدعوات',
  audit: 'سجل التدقيق',
  rfi: 'طلبات الاستيضاح (RFI)',
  team: 'حضور الفريق',
  journey: 'خريطة الكوادر ورحلة الأدوار',
  company: 'هوية الشركة',
  worker_portal: 'بوابتي',
  owner_portal: 'بوابة المالك',
  consultant_portal: 'بوابة الاستشاري',
  sub_portal: 'بوابة مقاول الباطن',
  supplier_portal: 'بوابة المورد'
};
