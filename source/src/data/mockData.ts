import {
  HistoricalProject,
  Project,
  BoqItem,
  DailyProgressReport,
  ProgressPaymentCertificate,
  Equipment,
  Worker,
  PermitToWork,
  ToolboxTalk,
  NonConformanceReport,
  LabTest,
  CompanyDocument,
  ProjectTransmittal,
  MaterialRequisition,
  Subcontractor,
  UtilityClash,
  SpoilsAndBorrowTicket,
  EmergencyIncident,
  VariationOrder,
  LeaveRequest,
  DisciplinaryViolation,
  EndOfServiceSettlement
} from '../types';

export const initialProjects: Omit<Project, 'code'>[] = [
  {
    id: 'p1',
    name: 'مشروع تمديد كابلات الجهد المتوسط 33 ك.ف - الرياض (القطاع 4)',
    client: 'الشركة السعودية للكهرباء (SEC)',
    consultant: 'شركة خطيب وعلمي للاستشارات الهندسية',
    contractValue: 24500000,
    startDate: '2026-01-15',
    endDate: '2026-12-30',
    physicalProgress: 72.4,
    plannedProgress: 75.0,
    financialProgress: 65.2,
    location: 'الرياض - قطاع شمال الرياض (طريق التخصصي وحي النرجس)',
    status: 'ongoing',
    safetyHoursNoLti: 142800,
    activeWorkforce: 48,
    activeEquipment: 14,
    trenchLengthMeters: 12450,
    cablesPulledMeters: 9820,
    asphaltRestoredM2: 11100,
    lat: 24.8270,
    lng: 46.6400,
    actualCost: 16850000,
    financialTimeline: [
      { month: 'يناير', budget: 1200000, actual: 1050000 },
      { month: 'فبراير', budget: 2900000, actual: 2700000 },
      { month: 'مارس', budget: 4800000, actual: 4650000 },
      { month: 'أبريل', budget: 6900000, actual: 6800000 },
      { month: 'مايو', budget: 8900000, actual: 9100000 },
      { month: 'يونيو', budget: 10800000, actual: 11050000 },
      { month: 'يوليو', budget: 12700000, actual: 12900000 },
      { month: 'أغسطس', budget: 14400000, actual: 14500000 },
      { month: 'سبتمبر', budget: 16000000, actual: 15900000 },
      { month: 'أكتوبر', budget: 17600000, actual: 16850000 }
    ]
  },
  {
    id: 'p2',
    name: 'مشروع إنارة وإعادة تأهيل طرق المجمعة الرئيسية',
    client: 'أمانة منطقة الرياض - بلدية المجمعة',
    consultant: 'المكتب الاستشاري السعودي للعمارة والهندسة',
    contractValue: 12000000,
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    physicalProgress: 88.0,
    plannedProgress: 85.0,
    financialProgress: 82.5,
    location: 'منطقة الرياض - محافظة المجمعة',
    status: 'near_completion',
    safetyHoursNoLti: 98500,
    activeWorkforce: 32,
    activeEquipment: 8,
    trenchLengthMeters: 8200,
    cablesPulledMeters: 7900,
    asphaltRestoredM2: 15400,
    lat: 25.9050,
    lng: 45.3450,
    actualCost: 11150000,
    financialTimeline: [
      { month: 'نوفمبر', budget: 2400000, actual: 2500000 },
      { month: 'ديسمبر', budget: 3700000, actual: 3950000 },
      { month: 'يناير', budget: 4900000, actual: 5300000 },
      { month: 'فبراير', budget: 6000000, actual: 6500000 },
      { month: 'مارس', budget: 7100000, actual: 7700000 },
      { month: 'أبريل', budget: 8100000, actual: 8800000 },
      { month: 'مايو', budget: 9000000, actual: 9700000 },
      { month: 'يونيو', budget: 9700000, actual: 10500000 },
      { month: 'يوليو', budget: 10200000, actual: 11150000 }
    ]
  },
  {
    id: 'p3',
    name: 'مشروع شبكة الألياف الضوئية FTTH - جدة حي الشاطئ',
    client: 'شركة الاتصالات السعودية (stc)',
    consultant: 'شركة دار الرياض للاستشارات',
    contractValue: 18500000,
    startDate: '2026-02-10',
    endDate: '2027-02-10',
    physicalProgress: 41.5,
    plannedProgress: 46.0,
    financialProgress: 35.0,
    location: 'جدة - الواجهة البحرية وحي الشاطئ',
    status: 'ongoing',
    safetyHoursNoLti: 64200,
    activeWorkforce: 28,
    activeEquipment: 6,
    trenchLengthMeters: 6200,
    cablesPulledMeters: 5100,
    asphaltRestoredM2: 4800,
    lat: 21.6050,
    lng: 39.1080,
    actualCost: 7350000,
    financialTimeline: [
      { month: 'مارس', budget: 900000, actual: 700000 },
      { month: 'أبريل', budget: 1900000, actual: 1600000 },
      { month: 'مايو', budget: 3000000, actual: 2700000 },
      { month: 'يونيو', budget: 4200000, actual: 3800000 },
      { month: 'يوليو', budget: 5400000, actual: 4900000 },
      { month: 'أغسطس', budget: 6600000, actual: 5800000 },
      { month: 'سبتمبر', budget: 7700000, actual: 6600000 },
      { month: 'أكتوبر', budget: 8500000, actual: 7350000 }
    ]
  }
];

// Historical (closed) projects used by the completion forecast engine
export const historicalProjects: HistoricalProject[] = [
  { id: 'h1', name: 'تمديد كابلات 13.8 ك.ف - حي الملقا', type: 'electrical', contractValue: 15800000, plannedDurationDays: 300, actualDurationDays: 334, midpointSpi: 0.94 },
  { id: 'h2', name: 'كابلات 33 ك.ف - طريق الملك سلمان', type: 'electrical', contractValue: 21000000, plannedDurationDays: 360, actualDurationDays: 381, midpointSpi: 0.96 },
  { id: 'h3', name: 'إنارة طريق الزلفي - المجمعة', type: 'roads_lighting', contractValue: 9500000, plannedDurationDays: 330, actualDurationDays: 322, midpointSpi: 1.03 },
  { id: 'h4', name: 'تأهيل طرق شقراء الداخلية', type: 'roads_lighting', contractValue: 11200000, plannedDurationDays: 365, actualDurationDays: 371, midpointSpi: 0.99 },
  { id: 'h5', name: 'ألياف FTTH - جدة حي الروضة', type: 'telecom', contractValue: 14300000, plannedDurationDays: 365, actualDurationDays: 418, midpointSpi: 0.89 },
  { id: 'h6', name: 'ألياف FTTH - الدمام حي الشاطئ', type: 'telecom', contractValue: 16700000, plannedDurationDays: 365, actualDurationDays: 402, midpointSpi: 0.91 },
  { id: 'h7', name: 'شبكة مياه - حي العارض', type: 'water', contractValue: 19800000, plannedDurationDays: 420, actualDurationDays: 455, midpointSpi: 0.93 }
];

export const projectTypeMap: Record<string, HistoricalProject['type']> = {
  p1: 'electrical',
  p2: 'roads_lighting',
  p3: 'telecom'
};

export const initialBoqItems: BoqItem[] = [
  {
    id: 'boq-1',
    projectId: 'p1',
    code: '1.01',
    description: 'حفر طولي بعمق 1.2م وعرض 0.6م في مختلف أنواع التربة مع نزو المياه وتجهيز الفرشة الترابية',
    unit: 'م.ط',
    contractQty: 15000,
    unitPrice: 120,
    totalPrice: 1800000,
    executedQty: 12450,
    cbsCategory: 'civil',
    costBreakdown: { material: 20, labor: 35, equipment: 40, subcontractor: 0, overheadProfit: 25 }
  },
  {
    id: 'boq-2',
    projectId: 'p1',
    code: '1.02',
    description: 'توريد وسحب كابلات نحاسية جهد متوسط 33 ك.ف مقطع 3x300 مم2 داخل الأنابيب المعتمدة',
    unit: 'م.ط',
    contractQty: 13500,
    unitPrice: 450,
    totalPrice: 6075000,
    executedQty: 9820,
    cbsCategory: 'electrical',
    costBreakdown: { material: 320, labor: 40, equipment: 25, subcontractor: 0, overheadProfit: 65 }
  },
  {
    id: 'boq-3',
    projectId: 'p1',
    code: '1.03',
    description: 'توريد وتركيب أنابيب بلاستيكية مقواة HDPE قطر 160مم لحماية الكابلات تحت الطرق والشوارع',
    unit: 'م.ط',
    contractQty: 15000,
    unitPrice: 85,
    totalPrice: 1275000,
    executedQty: 13100,
    cbsCategory: 'infrastructure',
    costBreakdown: { material: 45, labor: 15, equipment: 10, subcontractor: 0, overheadProfit: 15 }
  },
  {
    id: 'boq-4',
    projectId: 'p1',
    code: '1.04',
    description: 'أعمال إعادة الردم بطبقات الرمل النظيف والتكبيك والدمك بشدة 95% بروكتر معدل',
    unit: 'م3',
    contractQty: 10800,
    unitPrice: 65,
    totalPrice: 702000,
    executedQty: 8900,
    cbsCategory: 'civil',
    costBreakdown: { material: 25, labor: 12, equipment: 18, subcontractor: 0, overheadProfit: 10 }
  },
  {
    id: 'boq-5',
    projectId: 'p1',
    code: '1.05',
    description: 'إعادة كشط ورص الطبقة الأسفلتية الحاملة والسطحية سمك 5سم وإعادة الخطوط واللوحات المرورية',
    unit: 'م2',
    contractQty: 18000,
    unitPrice: 95,
    totalPrice: 1710000,
    executedQty: 11100,
    cbsCategory: 'infrastructure',
    costBreakdown: { material: 40, labor: 12, equipment: 22, subcontractor: 0, overheadProfit: 21 }
  },
  {
    id: 'boq-6',
    projectId: 'p1',
    code: '1.06',
    description: 'توريد وتركيب واختبار محطات تحويل مدمجة (Package Substation) قدرة 1000 ك.ف.أ شاملة المفاتيح الحلقية RMU',
    unit: 'عدد',
    contractQty: 12,
    unitPrice: 220000,
    totalPrice: 2640000,
    executedQty: 8,
    cbsCategory: 'electrical',
    costBreakdown: { material: 165000, labor: 15000, equipment: 10000, subcontractor: 5000, overheadProfit: 25000 }
  }
];

export const initialDprs: Omit<DailyProgressReport, 'status' | 'posted' | 'history'>[] = [
  {
    id: 'dpr-101',
    projectId: 'p1',
    reportNumber: 'DPR-2026-094',
    date: '2026-05-28',
    sector: 'شارع التخصصي - المقطع رقم 04 (محطة التحويل 22)',
    weather: { tempC: 34, condition: 'مشمس ومستقر', isSuitableForWork: true },
    workforceCount: 48,
    equipmentCount: 14,
    itemsExecuted: [
      { boqItemId: 'boq-1', description: 'حفر طولي بعمق 1.2م', quantity: 180, unit: 'م.ط' },
      { boqItemId: 'boq-2', description: 'سحب كابلات 33 ك.ف', quantity: 220, unit: 'م.ط' },
      { boqItemId: 'boq-5', description: 'إعادة الأسفلت والردم', quantity: 140, unit: 'م2' }
    ],
    siteNotes: 'تم الانتهاء من عبور تقاطع الإشارة بعد وضع التحويلة المرورية وموافقة المرور وأمانة الرياض دون أية عوائق.',
    photosCount: 6,
    consultantStatus: 'approved',
    submittedBy: 'م. راشد الحربي (مهندس الموقع)',
    gpsCoordinates: '24.7136° N, 46.6753° E'
  },
  {
    id: 'dpr-102',
    projectId: 'p1',
    reportNumber: 'DPR-2026-093',
    date: '2026-05-27',
    sector: 'طريق عثمان بن عفان - المقطع رقم 02',
    weather: { tempC: 36, condition: 'حار جزئياً', isSuitableForWork: true },
    workforceCount: 46,
    equipmentCount: 12,
    itemsExecuted: [
      { boqItemId: 'boq-1', description: 'حفر طولي بعمق 1.2م', quantity: 140, unit: 'م.ط' },
      { boqItemId: 'boq-2', description: 'سحب كابلات 33 ك.ف', quantity: 190, unit: 'م.ط' },
      { boqItemId: 'boq-5', description: 'إعادة الأسفلت والردم', quantity: 110, unit: 'م2' }
    ],
    siteNotes: 'تم الكشف يدوياً عن أنبوب مياه قديم 200مم غير موثق بالمخططات وجرى تدعيمه والتنسيق مع شركة المياه.',
    photosCount: 4,
    consultantStatus: 'approved_with_comments',
    submittedBy: 'م. عبدالله الشهري (مدير التنفيذ)',
    gpsCoordinates: '24.7742° N, 46.7029° E'
  }
];

export const initialPpcs: Omit<ProgressPaymentCertificate, 'history'>[] = [
  {
    id: 'ppc-05',
    projectId: 'p1',
    certificateNumber: 'PPC-SEC-005',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    grossAmount: 1338000,
    advanceDeductionRate: 0.10,
    advanceDeductionAmount: 133800,
    retainageRate: 0.05,
    retainageAmount: 66900,
    penaltyDeductions: 0,
    vatRate: 0.15,
    vatAmount: 170595,
    netPayableAmount: 1307895,
    status: 'consultant_approved',
    items: [
      {
        boqItemId: 'boq-1',
        description: 'حفر طولي بعمق 1.2م',
        previousQty: 10000,
        currentQty: 2450,
        cumulativeQty: 12450,
        unitPrice: 120,
        totalAmount: 294000
      },
      {
        boqItemId: 'boq-2',
        description: 'توريد وسحب كابلات 33 ك.ف',
        previousQty: 7500,
        currentQty: 2320,
        cumulativeQty: 9820,
        unitPrice: 450,
        totalAmount: 1044000
      }
    ]
  },
  {
    id: 'ppc-04',
    projectId: 'p1',
    certificateNumber: 'PPC-SEC-004',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    grossAmount: 1450000,
    advanceDeductionRate: 0.10,
    advanceDeductionAmount: 145000,
    retainageRate: 0.05,
    retainageAmount: 72500,
    penaltyDeductions: 0,
    vatRate: 0.15,
    vatAmount: 184875,
    netPayableAmount: 1417375,
    status: 'disbursed',
    items: [
      {
        boqItemId: 'boq-1',
        description: 'حفر طولي بعمق 1.2م',
        previousQty: 7800,
        currentQty: 2200,
        cumulativeQty: 10000,
        unitPrice: 120,
        totalAmount: 264000
      },
      {
        boqItemId: 'boq-2',
        description: 'توريد وسحب كابلات 33 ك.ف',
        previousQty: 5200,
        currentQty: 2300,
        cumulativeQty: 7500,
        unitPrice: 450,
        totalAmount: 1035000
      }
    ]
  }
];

export const initialEquipments: Equipment[] = [
  {
    id: 'eq-1',
    projectId: 'p1',
    code: 'EQ-EXC-01',
    name: 'حفار كاتربيلر ثقيل Caterpillar 320D',
    category: 'excavator',
    plateNumber: 'أ ح ب 1092',
    engineHours: 1420,
    fuelConsumptionDailyLiters: 180,
    fuelEfficiencyStatus: 'optimal',
    operatorName: 'سليم خان الباكستاني',
    status: 'operational',
    lastServiceHours: 1250,
    nextServiceHours: 1500,
    insuranceExpiry: '2027-02-15',
    mvpiExpiry: '2026-11-20'
  },
  {
    id: 'eq-2',
    projectId: 'p1',
    code: 'EQ-GEN-04',
    name: 'مولد كهربائي كاتربيلر 500 ك.ف.أ عازل للصوت',
    category: 'generator',
    plateNumber: 'ط ر ق 4410',
    engineHours: 3890,
    fuelConsumptionDailyLiters: 320,
    fuelEfficiencyStatus: 'optimal',
    operatorName: 'محمود علي إسماعيل',
    status: 'operational',
    lastServiceHours: 3700,
    nextServiceHours: 4000,
    insuranceExpiry: '2026-12-01',
    mvpiExpiry: '2026-09-15'
  },
  {
    id: 'eq-3',
    projectId: 'p1',
    code: 'EQ-CMP-02',
    name: 'دكاك أسفلت وتربة اهتزازي Dynapac CA250',
    category: 'roller',
    plateNumber: 'ص م د 8821',
    engineHours: 2150,
    fuelConsumptionDailyLiters: 110,
    fuelEfficiencyStatus: 'excessive_consumption',
    operatorName: 'فهد المطيري',
    status: 'under_maintenance',
    lastServiceHours: 1800,
    nextServiceHours: 2000,
    insuranceExpiry: '2026-10-10',
    mvpiExpiry: '2026-06-30'
  },
  {
    id: 'eq-4',
    projectId: 'p1',
    code: 'EQ-CRN-01',
    name: 'رافعة تلسكوبية Tadano 50 Ton',
    category: 'crane',
    plateNumber: 'ن ر ج 3390',
    engineHours: 850,
    fuelConsumptionDailyLiters: 140,
    fuelEfficiencyStatus: 'optimal',
    operatorName: 'بشير عبدالحفيظ',
    status: 'operational',
    lastServiceHours: 800,
    nextServiceHours: 1000,
    insuranceExpiry: '2027-04-01',
    mvpiExpiry: '2027-03-15'
  }
];

export const initialWorkers: Worker[] = [
  {
    id: 'w-1',
    projectId: 'p1',
    empCode: 'EMP-701',
    name: 'كومار ناتاراجان',
    role: 'فني سحب كابلات ولحام ألياف ضوئية',
    nationality: 'هندي',
    iqamaNumber: '2398471029',
    iqamaExpiry: '2027-11-14',
    medicalInsuranceExpiry: '2027-11-14',
    isHeavyOperator: false,
    status: 'present',
    checkInTime: '06:55 ص',
    geoFenceStatus: 'inside_geofence',
    overtimeHoursThisMonth: 18.5,
    dailyRate: 150,
    assignedBoqCode: '1.02',
    pettyCashBalance: 0,
    joinDate: '2021-03-10',
    contractType: 'fixed_term',
    qiwaContractNumber: 'QIWA-2021-88912',
    probationEndDate: '2021-06-10',
    isProbationPassed: true,
    basicSalary: 3200,
    housingAllowance: 800,
    transportAllowance: 400,
    siteAllowance: 600,
    gosiDeduction: 100,
    totalMonthlySalary: 5000,
    leaveBalanceDays: 28,
    leavesTakenDays: 60,
    assetsHandedOver: ['خوذة سلامة MSA', 'حذاء حماية كابلات 1000V', 'سترة عاكسة', 'أدوات قطع وتجريد كابلات'],
    violationsCount: 0
  },
  {
    id: 'w-2',
    projectId: 'p1',
    empCode: 'EMP-702',
    name: 'سليم خان الباكستاني',
    role: 'سائق معدات ثقيلة (حفار CAT-320)',
    nationality: 'باكستاني',
    iqamaNumber: '2281903841',
    iqamaExpiry: '2026-08-02',
    medicalInsuranceExpiry: '2026-08-02',
    drivingLicenseExpiry: '2027-01-20',
    isHeavyOperator: true,
    status: 'present',
    checkInTime: '07:02 ص',
    geoFenceStatus: 'inside_geofence',
    overtimeHoursThisMonth: 24.0,
    dailyRate: 180,
    assignedBoqCode: '1.01',
    pettyCashBalance: 500,
    joinDate: '2019-06-15',
    contractType: 'fixed_term',
    qiwaContractNumber: 'QIWA-2019-44120',
    probationEndDate: '2019-09-15',
    isProbationPassed: true,
    basicSalary: 3800,
    housingAllowance: 1000,
    transportAllowance: 500,
    siteAllowance: 700,
    gosiDeduction: 120,
    totalMonthlySalary: 6000,
    leaveBalanceDays: 21,
    leavesTakenDays: 120,
    assetsHandedOver: ['خوذة مشغل CAT', 'مفاتيح حفار CAT-320', 'بطاقة تشغيل معتمدة (SEC/TUV)'],
    violationsCount: 1
  },
  {
    id: 'w-3',
    projectId: 'p1',
    empCode: 'EMP-703',
    name: 'م. محمد عبدالمتعال',
    role: 'مهندس موقع بنية تحتية',
    nationality: 'مصري',
    iqamaNumber: '2410982314',
    iqamaExpiry: '2028-01-19',
    medicalInsuranceExpiry: '2028-01-19',
    drivingLicenseExpiry: '2028-01-19',
    isHeavyOperator: false,
    status: 'present',
    checkInTime: '06:45 ص',
    geoFenceStatus: 'inside_geofence',
    overtimeHoursThisMonth: 0,
    dailyRate: 350,
    assignedBoqCode: '1.01',
    pettyCashBalance: 3200,
    joinDate: '2022-09-01',
    contractType: 'indefinite',
    qiwaContractNumber: 'QIWA-2022-10923',
    probationEndDate: '2022-12-01',
    isProbationPassed: true,
    basicSalary: 7000,
    housingAllowance: 2000,
    transportAllowance: 1000,
    siteAllowance: 1500,
    gosiDeduction: 250,
    totalMonthlySalary: 11500,
    leaveBalanceDays: 18,
    leavesTakenDays: 45,
    assetsHandedOver: ['كمبيوتر محمول ميداني Dell Rugged', 'جهاز كشف كابلات Megger', 'سيارة هايلوكس موقع', 'شريحة اتصال بيانات'],
    violationsCount: 0
  },
  {
    id: 'w-4',
    projectId: 'p1',
    empCode: 'EMP-704',
    name: 'عثمان توري',
    role: 'عامل حفر ومساعد تمديد',
    nationality: 'مالي',
    iqamaNumber: '2384729103',
    iqamaExpiry: '2026-06-15',
    medicalInsuranceExpiry: '2026-06-15',
    isHeavyOperator: false,
    status: 'present',
    checkInTime: '06:50 ص',
    geoFenceStatus: 'inside_geofence',
    overtimeHoursThisMonth: 12.0,
    dailyRate: 110,
    assignedBoqCode: '1.01',
    pettyCashBalance: 0,
    joinDate: '2024-02-01',
    contractType: 'fixed_term',
    qiwaContractNumber: 'QIWA-2024-55190',
    probationEndDate: '2024-05-01',
    isProbationPassed: true,
    basicSalary: 2400,
    housingAllowance: 600,
    transportAllowance: 300,
    siteAllowance: 400,
    gosiDeduction: 80,
    totalMonthlySalary: 3700,
    leaveBalanceDays: 30,
    leavesTakenDays: 0,
    assetsHandedOver: ['خوذة سلامة صفراء', 'حذاء أمان', 'سترة عاكسة'],
    violationsCount: 0
  },
  {
    id: 'w-5',
    projectId: 'p1',
    empCode: 'EMP-705',
    name: 'فهد الشمري',
    role: 'مساعد مسؤول سلامة ميداني (HSE)',
    nationality: 'سعودي',
    iqamaNumber: '1098471203',
    iqamaExpiry: '2030-01-01',
    medicalInsuranceExpiry: '2027-03-15',
    drivingLicenseExpiry: '2029-05-20',
    isHeavyOperator: false,
    status: 'present',
    checkInTime: '06:40 ص',
    geoFenceStatus: 'inside_geofence',
    overtimeHoursThisMonth: 10.0,
    dailyRate: 260,
    assignedBoqCode: '1.01',
    pettyCashBalance: 1200,
    joinDate: '2026-04-01',
    contractType: 'fixed_term',
    qiwaContractNumber: 'QIWA-2026-90412',
    probationEndDate: '2026-07-01',
    isProbationPassed: false, // لا يزال في فترة التجربة
    basicSalary: 5500,
    housingAllowance: 1500,
    transportAllowance: 500,
    siteAllowance: 1000,
    gosiDeduction: 536.25, // 9.75% للسعودي
    totalMonthlySalary: 8500,
    leaveBalanceDays: 21,
    leavesTakenDays: 0,
    assetsHandedOver: ['جهاز لاسلكي موقع Motorola', 'خوذة بيضاء قيادية', 'حذاء حماية كهرومغناطيسي', 'حقيبة إسعافات أولية'],
    violationsCount: 0
  }
];

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    projectId: 'p1',
    workerId: 'w-1',
    workerName: 'كومار ناتاراجان',
    type: 'annual',
    startDate: '2026-06-10',
    endDate: '2026-07-10',
    daysCount: 30,
    reason: 'إجازة سنوية مستحقة لزيارة العائلة بالهند',
    flightTicketProvided: true,
    ticketDestination: 'الرياض (RUH) ↔ مومباي (BOM) على الخطوط السعودية',
    status: 'approved'
  },
  {
    id: 'leave-2',
    projectId: 'p1',
    workerId: 'w-2',
    workerName: 'سليم خان الباكستاني',
    type: 'emergency',
    startDate: '2026-03-01',
    endDate: '2026-03-14',
    daysCount: 14,
    reason: 'إجازة طارئة عائلية',
    flightTicketProvided: true,
    ticketDestination: 'الرياض ↔ إسلام آباد',
    status: 'approved',
    dutyResumedDate: '2026-03-15'
  }
];

export const initialDisciplinaryViolations: DisciplinaryViolation[] = [
  {
    id: 'viol-1',
    projectId: 'p1',
    workerId: 'w-2',
    workerName: 'سليم خان الباكستاني',
    date: '2026-05-12',
    violationType: 'ppe_safety_breach',
    description: 'تشغيل الحفار دون ربط حزام الأمان وخلع الخوذة داخل كابينة التشغيل في منطقة حفر نشطة.',
    actionTaken: 'written_warning',
    deductionAmountSar: 0,
    signedByWorker: true
  }
];

export const initialSettlements: EndOfServiceSettlement[] = [
  {
    id: 'eosb-1',
    projectId: 'p1',
    workerId: 'w-prev-1',
    workerName: 'بشير عبدالحفيظ',
    role: 'مشغل رافعة تلسكوبية 50 طن',
    nationality: 'سوداني',
    iqamaNumber: '2109847120',
    joinDate: '2020-04-01',
    lastWorkingDay: '2026-04-30',
    yearsOfService: 6,
    monthsOfService: 1,
    daysOfService: 0,
    contractType: 'fixed_term',
    lastMonthlySalary: 6500,
    reasonForSeparation: 'contract_expiry',
    baseEosbAmount: 22750, // (5 * 3250) + (1.08 * 6500)
    entitlementRatio: 100,
    netEosbAmount: 22750,
    unusedLeaveDays: 14,
    unusedLeaveCompensationSar: 3033,
    deductionsPettyCash: 0,
    finalNetSettlementSar: 25783,
    status: 'signed_discharged',
    clearanceSignatures: {
      siteSupervisor: true,
      hrManager: true,
      financeDirector: true,
      workerThumbprint: true
    }
  }
];

export const initialPtws: PermitToWork[] = [
  {
    id: 'ptw-1',
    projectId: 'p1',
    permitNumber: 'PTW-EXC-2026-088',
    type: 'deep_excavation',
    location: 'شارع التخصصي - المقطع 04 (تقاطع العروبة)',
    issuedDate: '2026-05-28 07:00',
    validUntil: '2026-05-28 18:00',
    status: 'active',
    supervisor: 'م. راشد الحربي',
    safetyOfficer: 'م. طارق الزهراني',
    safetyChecklist: {
      gasCheckPassed: true,
      barriersInstalled: true,
      undergroundCableDetected: true,
      flashingLightsActive: true,
      ppeFullGear: true
    }
  },
  {
    id: 'ptw-2',
    projectId: 'p1',
    permitNumber: 'PTW-HOT-2026-042',
    type: 'hot_work',
    location: 'غرفة المحولات T-04 (أعمال لحام نهايات الكابلات)',
    issuedDate: '2026-05-28 08:30',
    validUntil: '2026-05-28 16:30',
    status: 'active',
    supervisor: 'م. أحمد الشريف',
    safetyOfficer: 'م. طارق الزهراني',
    safetyChecklist: {
      gasCheckPassed: true,
      barriersInstalled: true,
      undergroundCableDetected: false,
      flashingLightsActive: false,
      ppeFullGear: true
    }
  }
];

export const initialToolboxTalks: ToolboxTalk[] = [
  {
    id: 'tbt-1',
    projectId: 'p1',
    topic: 'إجراءات السلامة عند الاقتراب من كابلات الجهد العالي والخدمات الحية المدفونة',
    date: '2026-05-28',
    attendeesCount: 42,
    conductorName: 'م. طارق الزهراني (مسؤول HSE)',
    keyHazardsDiscussed: [
      'التأكد من تشغيل جهاز كشف الكابلات (Cable Detector) قبل الحفر الميكانيكي',
      'الحفر اليدوي الدقيق بعمق 50سم عند ظهور شريط التحذير الأصفر أو الأحمر',
      'ارتداء القفازات العازلة 1000 فولت والأحذية المعتمدة'
    ],
    hasPhotos: true
  },
  {
    id: 'tbt-2',
    projectId: 'p1',
    topic: 'الوقاية من الإجهاد الحراري والضربات الشمسية في فصل الصيف بالرياض',
    date: '2026-05-25',
    attendeesCount: 48,
    conductorName: 'م. طارق الزهراني',
    keyHazardsDiscussed: [
      'الالتزام بجدول فترات الراحة وشرب ما لا يقل عن 3 لترات ماء مدعم بالأملاح',
      'توفير مظلات استراحة مكيفة ومظللة في مقاطع العمل'
    ],
    hasPhotos: true
  }
];

export const initialNcrs: NonConformanceReport[] = [
  {
    id: 'ncr-1',
    projectId: 'p1',
    ncrNumber: 'NCR-SEC-2026-012',
    date: '2026-05-22',
    issuer: 'consultant',
    description: 'نسبة الدمك (Compaction) في الطبقة الرملية الثانية بالمقطع 02 سجلت 91.8% وهي أقل من 95% التعاقدية.',
    location: 'طريق عثمان بن عفان - المحطة 03+200',
    rootCause: 'عدم تروية التربة بالماء الكافي قبل تشغيل الدكاك الاهتزازي، وسرعة فرد الطبقة بدون قياس الرطوبة المثلى.',
    correctiveAction: 'إعادة كشط الطبقة بسمك 20سم ورش المياه بنسبة الرطوبة المثلى وإعادة الدمك بدكاك 10 طن وإجراء فحص جديد.',
    status: 'closed',
    closedDate: '2026-05-26'
  },
  {
    id: 'ncr-2',
    projectId: 'p1',
    ncrNumber: 'NCR-SEC-2026-013',
    date: '2026-05-26',
    issuer: 'internal_qaqc',
    description: 'غياب صبات خرسانية (New Jersey Barriers) في طرف التحويلة الجنوبية لشارع التخصصي.',
    location: 'شارع التخصصي - المقطع 04',
    rootCause: 'تأخر شاحنة توريد الحواجز الخرسانية من مصنع المورد.',
    correctiveAction: 'تم توريد وتركيب 14 صبة خرسانية فوراً مع وضع عواكس فسفورية وإنارة تحذيرية.',
    status: 'under_review'
  }
];

export const initialLabTests: LabTest[] = [
  {
    id: 'test-1',
    projectId: 'p1',
    testNumber: 'LAB-MEG-044',
    testType: 'megger_cable_insulation',
    sampleLocation: 'كابل 33 ك.ف - القطاع 4 (بين محطة 12 ومحطة 13)',
    testDate: '2026-05-26',
    requiredValue: '> 1000 MΩ @ 5kV',
    achievedValue: '4800 MΩ (مقاومة عزل ممتازة)',
    result: 'passed',
    certifiedLab: 'المختبر الفني المعتمد للشركة السعودية للكهرباء'
  },
  {
    id: 'test-2',
    projectId: 'p1',
    testNumber: 'LAB-CMP-089',
    testType: 'soil_compaction',
    sampleLocation: 'طريق عثمان بن عفان - عمق 80سم',
    testDate: '2026-05-25',
    requiredValue: '≥ 95% Modified Proctor',
    achievedValue: '96.8%',
    result: 'passed',
    certifiedLab: 'مختبر التربة والمواد المتطورة (FUGRO)'
  },
  {
    id: 'test-3',
    projectId: 'p1',
    testNumber: 'LAB-CONC-021',
    testType: 'concrete_compression',
    sampleLocation: 'قواعد محطات التحويل T-04 (عينات كبس 28 يوم)',
    testDate: '2026-05-20',
    requiredValue: '≥ 35 N/mm2 (C35)',
    achievedValue: '38.4 N/mm2',
    result: 'passed',
    certifiedLab: 'مختبر الرياض الوطني'
  }
];

export const initialCompanyDocs: CompanyDocument[] = [
  {
    id: 'doc-1',
    title: 'السجل التجاري الرئيسي للمؤسسة',
    category: 'commercial_registration',
    documentNumber: 'CR-1010892019',
    issueDate: '2020-04-10',
    expiryDate: '2027-04-09',
    daysRemaining: 343,
    status: 'valid',
    issuingAuthority: 'وزارة التجارة - المملكة العربية السعودية'
  },
  {
    id: 'doc-2',
    title: 'شهادة تصنيف المقاولين (الدرجة الأولى - أعمال الطاقة والكهرباء)',
    category: 'contractor_classification',
    documentNumber: 'CLASS-KSA-8831',
    issueDate: '2024-02-01',
    expiryDate: '2027-02-01',
    daysRemaining: 276,
    status: 'valid',
    issuingAuthority: 'وكالة تنظيم المشتريات وتصنيف المقاولين (بلدي)'
  },
  {
    id: 'doc-3',
    title: 'شهادة الزكاة والضريبة والجمارك (ZATCA)',
    category: 'zakat',
    documentNumber: 'ZATCA-2026-9041',
    issueDate: '2026-01-01',
    expiryDate: '2027-04-30',
    daysRemaining: 364,
    status: 'valid',
    issuingAuthority: 'هيئة الزكاة والضريبة والجمارك'
  },
  {
    id: 'doc-4',
    title: 'شهادة السعودة والالتزام بنطاقات (النطاق الأخضر المرتفع)',
    category: 'saudization',
    documentNumber: 'SAUDI-7721-QIWA',
    issueDate: '2026-03-01',
    expiryDate: '2026-09-01',
    daysRemaining: 123,
    status: 'valid',
    issuingAuthority: 'وزارة الموارد البشرية والتنمية الاجتماعية (قوى)'
  },
  {
    id: 'doc-5',
    title: 'وثيقة تأمين أخطار المقاولين الشاملة (Contractor All Risks - CAR)',
    category: 'car_insurance',
    documentNumber: 'CAR-TAWUNIYA-44019',
    issueDate: '2025-06-15',
    expiryDate: '2026-06-15',
    daysRemaining: 15,
    status: 'expiring_soon',
    issuingAuthority: 'شركة التعاونية للتأمين'
  }
];

export const initialTransmittals: ProjectTransmittal[] = [
  {
    id: 'tr-1',
    projectId: 'p1',
    refNumber: 'TR-SEC-OUT-081',
    direction: 'outgoing',
    sender: 'مؤسسة المقاولات المعتمدة',
    recipient: 'استشاري خطيب وعلمي',
    subject: 'مخططات Shop Drawings لتقاطع شارع التخصصي مع كابلات 33 ك.ف',
    date: '2026-05-24',
    type: 'shop_drawing',
    status: 'approved_with_notes',
    actionRequired: 'تحديث المسار طبقاً لتعليق الكهرباء وإعادة الرفع'
  },
  {
    id: 'tr-2',
    projectId: 'p1',
    refNumber: 'TR-SEC-IN-142',
    direction: 'incoming',
    sender: 'الشركة السعودية للكهرباء',
    recipient: 'المقاول العام',
    subject: 'خطاب اعتماد تصريح الحفر الطولي الصادر من أمانة منطقة الرياض والمرور',
    date: '2026-05-22',
    type: 'official_letter',
    status: 'approved',
    actionRequired: 'لا يوجد - تم التعميم على الموقع للبدء'
  },
  {
    id: 'tr-3',
    projectId: 'p1',
    refNumber: 'TR-SEC-OUT-083',
    direction: 'outgoing',
    sender: 'المقاول العام',
    recipient: 'استشاري خطيب وعلمي',
    subject: 'اعتماد مواد كابلات نحاسية 33 ك.ف إنتاج مصنع كابلات الرياض',
    date: '2026-05-18',
    type: 'material_submittal',
    status: 'approved',
    actionRequired: 'معتمد نهائياً للتوريد'
  }
];

export const initialMaterialReqs: Omit<MaterialRequisition, 'history'>[] = [
  {
    id: 'mr-1',
    projectId: 'p1',
    reqNumber: 'MR-2026-044',
    date: '2026-05-27',
    boqItemId: 'boq-3',
    materialName: 'أنابيب بلاستيكية HDPE مقواة قطر 160مم ضغط 10 بار',
    requestedQty: 1500,
    unit: 'م.ط',
    boqRemainingQty: 1900,
    supplierName: 'شركة مصنع الرياض للأنابيب البلاستيكية',
    estimatedCost: 127500,
    status: 'approved',
    wastagePercentage: 2.1
  },
  {
    id: 'mr-2',
    projectId: 'p1',
    reqNumber: 'MR-2026-045',
    date: '2026-05-28',
    boqItemId: 'boq-4',
    materialName: 'رمل أحمر دفان نظيف مغسول خالي من الأملاح والحجارة',
    requestedQty: 800,
    unit: 'م3',
    boqRemainingQty: 1900,
    supplierName: 'كسارات الدهناء والتوريدات العامة',
    estimatedCost: 52000,
    status: 'pending_pm',
    wastagePercentage: 1.4
  }
];

export const initialSubcontractors: Subcontractor[] = [
  {
    id: 'sub-1',
    projectId: 'p1',
    name: 'مؤسسة السبيعي لأعمال الحفر والردم',
    scopeOfWork: 'تنفيذ أعمال الحفر الطولي ونقل المخلفات للمرامي الرسمية',
    contractValue: 950000,
    invoicedToDate: 640000,
    certifiedToDate: 610000,
    dieselBackcharges: 18500,
    powerBackcharges: 4200,
    performanceScore: 92,
    complianceStatus: 'compliant'
  },
  {
    id: 'sub-2',
    projectId: 'p1',
    name: 'شركة الصخور المتطورة لأعمال كشط وسفلتة الطرق',
    scopeOfWork: 'أعمال كشط وإعادة سفلتة الطرق السطحية وتخطيط المسارات',
    contractValue: 1200000,
    invoicedToDate: 720000,
    certifiedToDate: 690000,
    dieselBackcharges: 12000,
    powerBackcharges: 1500,
    performanceScore: 88,
    complianceStatus: 'compliant'
  }
];

export const initialUtilityClashes: UtilityClash[] = [
  {
    id: 'clash-1',
    projectId: 'p1',
    clashCode: 'UC-RYD-041',
    utilityType: 'nwc_water_mains',
    locationStreet: 'شارع التخصصي مقابل تقاطع طريق الملك عبدالله',
    depthMeters: 1.4,
    status: 'coordinated_with_owner',
    stakeholderContact: 'م. خالد الدوسري (شركة المياه الوطنية NWC)',
    protectionMeasures: 'تركيب قمصان خرسانية مسلحة لحماية الأنبوب وتثبيت عوازل اهتزاز',
    preTrenchPhotoTaken: true,
    postPavingPhotoTaken: false
  },
  {
    id: 'clash-2',
    projectId: 'p1',
    clashCode: 'UC-RYD-042',
    utilityType: 'telecom_fiber',
    locationStreet: 'طريق عثمان بن عفان محطة 02+450',
    depthMeters: 0.9,
    status: 'rerouted',
    stakeholderContact: 'م. سامي الحربي (شركة الاتصالات stc)',
    protectionMeasures: 'تم عمل خندق يدوي وحماية الكابل بماسورة معدنية مشقوقة ومعاينة ممثل stc',
    preTrenchPhotoTaken: true,
    postPavingPhotoTaken: true
  }
];

export const initialSpoilsTickets: SpoilsAndBorrowTicket[] = [
  {
    id: 'sp-1',
    projectId: 'p1',
    ticketNumber: 'MANIFEST-DUMP-8819',
    type: 'spoils_dump',
    truckPlate: 'ق ل ب 9021',
    volumeM3: 24,
    weighbridgeWeightTons: 38.4,
    sourceOrDestination: 'المرمى الرسمي المعتمد لأمانة منطقة الرياض (السلي)',
    date: '2026-05-28 09:15',
    manifestBarcode: 'MAN-99812-RYD',
    inspectorApproved: true
  },
  {
    id: 'sp-2',
    projectId: 'p1',
    ticketNumber: 'WEIGH-BORROW-4412',
    type: 'borrow_sand_import',
    truckPlate: 'ر م ل 3318',
    volumeM3: 28,
    weighbridgeWeightTons: 44.8,
    sourceOrDestination: 'كسارة النور للرمل المغسول - ميزان الخرج',
    date: '2026-05-28 11:30',
    manifestBarcode: 'WEIGH-4412-SEC',
    inspectorApproved: true
  }
];

export const initialEmergencyIncidents: EmergencyIncident[] = [
  {
    id: 'em-1',
    projectId: 'p1',
    incidentCode: 'EMERG-STRIKE-003',
    type: 'accidental_utility_strike',
    dateTime: '2026-05-14 14:10',
    location: 'شارع التخصصي محطة 01+150',
    affectedUtilityOrService: 'أنبوب مياه ري فرعي تابع لأمانة الرياض قطر 110مم',
    description: 'ملامسة سن باكت الحفار للأنبوب الفرعي أثناء العمل بسبب عدم تطابق العمق مع المخطط المعتمد (العمق الفعلي 40سم مقابل 100سم بالمخطط).',
    immediateActionsTaken: 'تم إيقاف الحفر فوراً، إغلاق صمام التحكم، وتكليف فريق السباكة الطارئ بالإصلاح خلال 90 دقيقة وإشعار استشاري المشروع.',
    contractualForceMajeureLogged: false,
    legalLiabilityAssessment: 'غير مسؤولية المقاول نظراً لعدم تطابق منسوب الدفن مع المخطط المعتمد للبلدية ومحضر المعاينة موقع.'
  },
  {
    id: 'em-2',
    projectId: 'p1',
    incidentCode: 'WEATHER-HALT-008',
    type: 'extreme_weather_stoppage',
    dateTime: '2026-04-20 11:00',
    location: 'كافة قطاعات العمل الميداني بالرياض',
    affectedUtilityOrService: 'الأعمال الحفرية وتمديد الكابلات',
    description: 'توقف العمل بموجب التنبيه الجوي الأحمر الصادر من المركز الوطني للأرصاد والدفاع المدني (عواصف رملية شديدة وسرعة رياح تجاوزت 65 كم/س).',
    immediateActionsTaken: 'تأمين الحفريات بالصبات الخرسانية، إيقاف الرافعات وتنزيل البومات، إجلاء العمالة لسكن الموقع.',
    contractualForceMajeureLogged: true,
    legalLiabilityAssessment: 'مُوثقة بالإنذار الرسمي للمطالبة بتمديد زمني (EOT) بموجب البند 19 من شروط عقد فيديك / نظام المنافسات الحكومية.'
  }
];

export const initialVariationOrders: Omit<VariationOrder, 'history'>[] = [
  {
    id: 'vo-1',
    projectId: 'p1',
    voNumber: 'VO-SEC-001',
    title: 'تعديل مسار الكابلات وتفادي خط الصرف الصحي الرئيسي بطريق العروبة',
    reason: 'unforeseen_utility_conflict',
    costImpactSar: 340000,
    timeExtensionDays: 14,
    status: 'approved_by_client'
  },
  {
    id: 'vo-2',
    projectId: 'p1',
    voNumber: 'VO-SEC-002',
    title: 'إضافة محطة تحويل مدمجة إضافية رقم T-13 لتغذية المجمع التجاري الجديد',
    reason: 'client_instruction',
    costImpactSar: 480000,
    timeExtensionDays: 20,
    status: 'under_evaluation'
  }
];
