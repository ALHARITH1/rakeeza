export type ProjectId = string;

export type UserRole = 
  | 'executive_director' // المدير التنفيذي
  | 'project_manager'   // مدير المشروع
  | 'site_engineer'     // مهندس الموقع
  | 'safety_officer'    // مسؤول السلامة والصحة المهنية (HSE)
  | 'qaqc_manager'      // مدير ضبط الجودة (QA/QC)
  | 'procurement_mgr'   // مدير المشتريات والمستودعات
  | 'hr_manager'        // مدير الموارد البشرية
  | 'worker'            // العامل / الموظف
  | 'owner'             // المالك
  | 'consultant'        // الاستشاري
  | 'subcontractor'     // مقاول الباطن
  | 'supplier';         // المورد

/* ---------- Accounts, audit & workflow history ---------- */
export interface Company {
  id: string;
  name: string;
  crNumber: string;
  logoDataUrl?: string;
  brandColor?: string; // extracted automatically from the logo, admin can override
  createdAt: string;
}

export interface AppUser {
  id: string;
  companyId: string;
  name: string;
  username?: string;
  phone: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  projectIds: ProjectId[] | 'all';
  active: boolean;
  workerId?: string;        // worker portal → linked HR record
  subcontractorId?: string; // subcontractor portal
  supplierName?: string;    // supplier portal
  invitedBy?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  entityCode?: string;
  projectId?: ProjectId;
  details?: string;
}

export interface WorkflowStep {
  at: string;
  byUserId: string;
  byName: string;
  role: UserRole;
  action: string; // e.g. submitted / approved / rejected
  note?: string;
}

export interface Project {
  id: ProjectId;
  code: string; // short code used in document numbers (SEC / MJM / STC)
  name: string;
  client: string;
  consultant: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  physicalProgress: number; // e.g. 72%
  plannedProgress: number;  // e.g. 76%
  financialProgress: number;// e.g. 65%
  location: string;
  status: 'ongoing' | 'near_completion' | 'delayed' | 'completed';
  safetyHoursNoLti: number;
  activeWorkforce: number;
  activeEquipment: number;
  trenchLengthMeters: number;
  cablesPulledMeters: number;
  asphaltRestoredM2: number;
  // Geo coordinates for the interactive projects map
  lat: number;
  lng: number;
  // Cumulative actual cost incurred to date (SAR)
  actualCost: number;
  // Monthly cumulative budget (planned) vs actual spend (SAR)
  financialTimeline: { month: string; budget: number; actual: number }[];
}

export interface HistoricalProject {
  id: string;
  name: string;
  type: 'electrical' | 'roads_lighting' | 'telecom' | 'water';
  contractValue: number;
  plannedDurationDays: number;
  actualDurationDays: number;
  // Average SPI recorded at ~50% physical progress
  midpointSpi: number;
}

export interface BoqItem {
  id: string;
  projectId: ProjectId;
  code: string;
  description: string;
  unit: string;
  contractQty: number;
  unitPrice: number;
  totalPrice: number;
  executedQty: number;
  cbsCategory: 'civil' | 'electrical' | 'infrastructure' | 'mechanical';
  costBreakdown: {
    material: number;
    labor: number;
    equipment: number;
    subcontractor: number;
    overheadProfit: number;
  };
}

export interface DailyProgressReport {
  id: string;
  projectId: ProjectId;
  reportNumber: string;
  date: string;
  sector: string;
  weather: {
    tempC: number;
    condition: string;
    isSuitableForWork: boolean;
  };
  workforceCount: number;
  equipmentCount: number;
  itemsExecuted: {
    boqItemId: string;
    description: string;
    quantity: number;
    unit: string;
  }[];
  siteNotes: string;
  photosCount: number;
  consultantStatus: 'pending' | 'approved' | 'approved_with_comments' | 'rejected';
  submittedBy: string;
  gpsCoordinates: string;
  // Workflow: draft → submitted → pm_approved → consultant_approved (posted to BOQ)
  status: 'draft' | 'submitted' | 'pm_approved' | 'consultant_approved' | 'rejected';
  posted: boolean;
  ptwNumber?: string;
  photos?: string[]; // small data-URL thumbnails
  createdByUserId?: string;
  history: WorkflowStep[];
}

export interface ProgressPaymentCertificate {
  id: string;
  projectId: ProjectId;
  certificateNumber: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  advanceDeductionRate: number; // e.g. 0.10
  advanceDeductionAmount: number;
  retainageRate: number; // e.g. 0.05
  retainageAmount: number;
  penaltyDeductions: number;
  vatRate: number; // 0.15
  vatAmount: number;
  netPayableAmount: number;
  status: 'draft' | 'submitted' | 'consultant_approved' | 'client_approved' | 'disbursed' | 'rejected';
  history: WorkflowStep[];
  createdByUserId?: string;
  items: {
    boqItemId: string;
    description: string;
    previousQty: number;
    currentQty: number;
    cumulativeQty: number;
    unitPrice: number;
    totalAmount: number;
  }[];
}

export interface Equipment {
  id: string;
  projectId: ProjectId;
  code: string;
  name: string;
  category: 'excavator' | 'generator' | 'roller' | 'crane' | 'truck';
  plateNumber: string;
  engineHours: number;
  fuelConsumptionDailyLiters: number;
  fuelEfficiencyStatus: 'optimal' | 'excessive_consumption' | 'suspected_leak';
  operatorName: string;
  status: 'operational' | 'under_maintenance' | 'standby';
  lastServiceHours: number;
  nextServiceHours: number;
  insuranceExpiry: string;
  mvpiExpiry: string; // الفحص الدوري
}

export interface Worker {
  id: string;
  projectId: ProjectId;
  empCode: string;
  name: string;
  role: string;
  nationality: string;
  iqamaNumber: string;
  iqamaExpiry: string;
  medicalInsuranceExpiry: string;
  drivingLicenseExpiry?: string;
  isHeavyOperator: boolean;
  status: 'present' | 'absent' | 'on_leave';
  checkInTime: string;
  geoFenceStatus: 'inside_geofence' | 'outside_geofence';
  overtimeHoursThisMonth: number;
  dailyRate: number;
  assignedBoqCode: string;
  pettyCashBalance: number;
  // Full HR Lifecycle Fields
  joinDate: string; // تاريخ المباشرة
  contractType: 'fixed_term' | 'indefinite'; // نوع العقد
  qiwaContractNumber: string; // رقم عقد قوى
  probationEndDate: string; // نهاية فترة التجربة
  isProbationPassed: boolean;
  basicSalary: number; // الراتب الأساسي
  housingAllowance: number; // بدل السكن
  transportAllowance: number; // بدل النقل
  siteAllowance: number; // بدل الموقع الميداني
  gosiDeduction: number; // خصم التأمينات
  totalMonthlySalary: number; // إجمالي الراتب
  leaveBalanceDays: number; // رصيد الإجازات المتبقية
  leavesTakenDays: number; // الإجازات المستنفدة
  assetsHandedOver: string[]; // العهد المسلمة
  violationsCount: number; // عدد المخالفات والإنذارات
  attendanceLog?: { date: string; checkIn?: string; checkOut?: string; insideGeofence: boolean }[];
  lat?: number;
  lng?: number;
  currentZone?: string;
  shift?: string;
}

export interface AdvanceRequest {
  id: string;
  projectId: ProjectId;
  workerId: string;
  workerName: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface HazardReport {
  id: string;
  projectId: ProjectId;
  code: string;
  reportedByWorkerId?: string;
  reportedByName: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  date: string;
  status: 'open' | 'actioned' | 'closed';
}

export interface Rfi {
  id: string;
  projectId: ProjectId;
  code: string;
  subject: string;
  question: string;
  location: string;
  date: string;
  raisedByName: string;
  raisedByUserId?: string;
  status: 'submitted' | 'answered' | 'rejected';
  response?: string;
  history: WorkflowStep[];
}

export interface SubcontractorClaim {
  id: string;
  projectId: ProjectId;
  subcontractorId: string;
  code: string;
  description: string;
  amount: number;
  date: string;
  status: 'submitted' | 'pm_approved' | 'rejected' | 'paid';
  approvedAmount?: number;
  note?: string;
  history: WorkflowStep[];
}

export interface LeaveRequest {
  id: string;
  projectId: ProjectId;
  workerId: string;
  workerName: string;
  type: 'annual' | 'sick' | 'emergency' | 'unpaid';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  flightTicketProvided: boolean;
  ticketDestination?: string;
  status: 'approved' | 'pending' | 'rejected';
  dutyResumedDate?: string; // تاريخ مباشرة العمل بعد الإجازة
  requestedViaPortal?: boolean;
}

export interface DisciplinaryViolation {
  id: string;
  projectId: ProjectId;
  workerId: string;
  workerName: string;
  date: string;
  violationType: 'ppe_safety_breach' | 'unauthorized_absence' | 'equipment_mishandling' | 'site_dispute';
  description: string;
  actionTaken: 'verbal_warning' | 'written_warning' | 'salary_deduction_1day' | 'investigation';
  deductionAmountSar: number;
  signedByWorker: boolean;
}

export interface EndOfServiceSettlement {
  id: string;
  projectId: ProjectId;
  workerId: string;
  workerName: string;
  role: string;
  nationality: string;
  iqamaNumber: string;
  joinDate: string;
  lastWorkingDay: string;
  yearsOfService: number;
  monthsOfService: number;
  daysOfService: number;
  contractType: 'fixed_term' | 'indefinite';
  lastMonthlySalary: number; // الأجر الأخير المعتمد للمكافأة
  reasonForSeparation: 
    | 'employer_termination' // إنهاء العقد من صاحب العمل (المادة 84 - مكافأة كاملة)
    | 'contract_expiry'      // انتهاء مدة العقد محدد المدة (المادة 84 - مكافأة كاملة)
    | 'resignation'          // استقالة العامل (المادة 85 - تدرج الاستحقاق)
    | 'force_majeure'        // قوة قاهرة / مادة 81 ترك العمل بسبب خطأ صاحب العمل (مكافأة كاملة)
    | 'article_80_dismissal';// فسخ العقد بموجب المادة 80 لسوء سلوك (حرمان من المكافأة)
  baseEosbAmount: number; // الحساب الأساسي قبل نسبة الاستقالة
  entitlementRatio: number; // نسبة الاستحقاق: 0%, 33.3%, 66.7%, 100%
  netEosbAmount: number; // مكافأة نهاية الخدمة المستحقة
  unusedLeaveDays: number;
  unusedLeaveCompensationSar: number; // تعويض رصيد الإجازات
  deductionsPettyCash: number; // خصم السلف والعهد
  finalNetSettlementSar: number; // صافي المخالصة النهائية
  status: 'draft' | 'approved' | 'signed_discharged';
  clearanceSignatures: {
    siteSupervisor: boolean;
    hrManager: boolean;
    financeDirector: boolean;
    workerThumbprint: boolean;
  };
}

export interface PermitToWork {
  id: string;
  projectId: ProjectId;
  permitNumber: string;
  type: 'deep_excavation' | 'hot_work' | 'confined_space' | 'high_voltage';
  location: string;
  issuedDate: string;
  validUntil: string;
  status: 'active' | 'pending_approval' | 'expired' | 'suspended';
  supervisor: string;
  safetyOfficer: string;
  safetyChecklist: {
    gasCheckPassed: boolean;
    barriersInstalled: boolean;
    undergroundCableDetected: boolean;
    flashingLightsActive: boolean;
    ppeFullGear: boolean;
  };
}

export interface ToolboxTalk {
  id: string;
  projectId: ProjectId;
  topic: string;
  date: string;
  attendeesCount: number;
  conductorName: string;
  keyHazardsDiscussed: string[];
  hasPhotos: boolean;
  signedWorkerIds?: string[];
}

export interface NonConformanceReport {
  id: string;
  projectId: ProjectId;
  ncrNumber: string;
  date: string;
  issuer: 'consultant' | 'internal_qaqc';
  description: string;
  location: string;
  rootCause: string;
  correctiveAction: string;
  status: 'open' | 'under_review' | 'closed';
  closedDate?: string;
}

export interface LabTest {
  id: string;
  projectId: ProjectId;
  testNumber: string;
  testType: 'concrete_compression' | 'soil_compaction' | 'asphalt_marshall' | 'megger_cable_insulation' | 'otdr_fiber';
  sampleLocation: string;
  testDate: string;
  requiredValue: string;
  achievedValue: string;
  result: 'passed' | 'failed' | 'pending';
  certifiedLab: string;
}

export interface CompanyDocument {
  id: string;
  title: string;
  category: 'commercial_registration' | 'zakat' | 'saudization' | 'contractor_classification' | 'car_insurance' | 'chamber_commerce';
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'valid' | 'expiring_soon' | 'expired';
  issuingAuthority: string;
}

export interface ProjectTransmittal {
  id: string;
  projectId: ProjectId;
  refNumber: string;
  direction: 'incoming' | 'outgoing';
  sender: string;
  recipient: string;
  subject: string;
  date: string;
  type: 'shop_drawing' | 'material_submittal' | 'official_letter' | 'rfi' | 'mom';
  status: 'approved' | 'approved_with_notes' | 'under_review' | 'rejected';
  actionRequired: string;
}

export interface MaterialRequisition {
  id: string;
  projectId: ProjectId;
  reqNumber: string;
  date: string;
  boqItemId: string;
  materialName: string;
  requestedQty: number;
  unit: string;
  boqRemainingQty: number;
  supplierName: string;
  estimatedCost: number;
  // MR → PM approval → PO → supplier confirmation → delivery note & invoice → GRN
  status: 'draft' | 'pending_pm' | 'approved' | 'po_issued' | 'supplier_confirmed' | 'delivered' | 'grn_received' | 'rejected';
  wastagePercentage: number;
  unitCost?: number;
  poNumber?: string;
  deliveryNoteNumber?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  grnNumber?: string;
  history: WorkflowStep[];
}

export interface Subcontractor {
  id: string;
  projectId: ProjectId;
  name: string;
  scopeOfWork: string;
  contractValue: number;
  invoicedToDate: number;
  certifiedToDate: number;
  dieselBackcharges: number;
  powerBackcharges: number;
  performanceScore: number; // 0 - 100
  complianceStatus: 'compliant' | 'minor_violations' | 'warning';
  workforce?: { name: string; trade: string; idNumber: string }[];
}

export interface UtilityClash {
  id: string;
  projectId: ProjectId;
  clashCode: string;
  utilityType: 'saudi_electricity_hv' | 'nwc_water_mains' | 'telecom_fiber' | 'stormwater_box_culvert';
  locationStreet: string;
  depthMeters: number;
  status: 'identified' | 'coordinated_with_owner' | 'rerouted' | 'cleared';
  stakeholderContact: string;
  protectionMeasures: string;
  preTrenchPhotoTaken: boolean;
  postPavingPhotoTaken: boolean;
}

export interface SpoilsAndBorrowTicket {
  id: string;
  projectId: ProjectId;
  ticketNumber: string;
  type: 'spoils_dump' | 'borrow_sand_import' | 'borrow_subbase_import';
  truckPlate: string;
  volumeM3: number;
  weighbridgeWeightTons: number;
  sourceOrDestination: string;
  date: string;
  manifestBarcode: string;
  inspectorApproved: boolean;
}

export interface EmergencyIncident {
  id: string;
  projectId: ProjectId;
  incidentCode: string;
  type: 'accidental_utility_strike' | 'extreme_weather_stoppage' | 'trench_collapse_nearmiss';
  dateTime: string;
  location: string;
  affectedUtilityOrService: string;
  description: string;
  immediateActionsTaken: string;
  contractualForceMajeureLogged: boolean;
  legalLiabilityAssessment: string;
}

export interface VariationOrder {
  id: string;
  projectId: ProjectId;
  voNumber: string;
  title: string;
  reason: 'client_instruction' | 'unforeseen_utility_conflict' | 'design_modification';
  costImpactSar: number;
  timeExtensionDays: number;
  // proposed (draft) → under_evaluation (consultant) → consultant_approved → approved_by_client
  status: 'proposed' | 'under_evaluation' | 'consultant_approved' | 'approved_by_client' | 'rejected';
  history: WorkflowStep[];
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'urgent' | 'warning' | 'success' | 'info';
  targetTab: string;
  isRead: boolean;
  code?: string;
  createdAt?: string;
  projectId?: ProjectId;
  toRoles?: UserRole[];
  toUserIds?: string[];
  entityId?: string;
  readBy?: string[];
}


export interface AttendanceLog {
  id: string;
  iqamaNumber: string;
  workerId?: string;
  workerName: string;
  workerCode?: string;
  role: string;
  projectId: string;
  projectName: string;
  type: 'clock_in' | 'clock_out';
  timestamp: string;
  at: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  isInsideGeofence: boolean;
  distanceMeters: number;
  verificationCode: string;
  status: 'approved' | 'outside_geofence_flagged';
  notes?: string;
}
