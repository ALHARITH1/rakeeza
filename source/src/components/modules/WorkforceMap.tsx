import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Compass,
  MapPin,
  Route,
  UserCheck,
  ShieldCheck,
  Users,
  HardHat,
  Truck,
  CheckCircle,
  Clock,
  Sparkles,
  Briefcase,
  FileText,
  AlertTriangle,
  Scale,
  Award,
  ChevronLeft,
  Search,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { FormattedNumber, CodeBadge, DateBadge } from '../common/Formatters';
import { Worker, UserRole } from '../../types';

const safeHtml = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

interface RoleJourneyStage {
  timeWindow: string;
  stageName: string;
  description: string;
  keyAction: string;
  targetTab: string;
}

interface RoleProfile {
  key: UserRole | 'field_operator';
  title: string;
  category: string;
  responsibility: string;
  approvalLimit: string;
  dailyStages: RoleJourneyStage[];
  kpis: Array<{ name: string; target: string }>;
  associatedTabs: Array<{ id: string; name: string }>;
}

const ROLE_PROFILES: RoleProfile[] = [
  {
    key: 'executive_director',
    title: 'المدير التنفيذي (CEO / Executive Director)',
    category: 'القيادة العليا والحوكمة',
    responsibility: 'الرقابة الاستراتيجية على محفظة المشاريع، التدفقات النقدية (Cashflow)، والاعتماد النهائي لمستخلصات المالك وتوقيع العقود.',
    approvalLimit: 'صلاحية مالية مطلقة بدون سقف للاعتماد المالي والتعاقدي',
    dailyStages: [
      {
        timeWindow: '08:00 - 09:00 ص',
        stageName: 'الموجز القيادي ومؤشرات EVM',
        description: 'مراجعة مؤشرات الأداء الزمني (SPI) والتكلفة (CPI) للمحفظة ورصد أي تجاوزات في الميزانية.',
        keyAction: 'مراجعة صحة المشاريع',
        targetTab: 'dashboard',
      },
      {
        timeWindow: '10:30 - 12:00 م',
        stageName: 'اعتماد مستخلصات المالك (Client PPC)',
        description: 'مراجعة المبالغ المعتمدة من الاستشاري وتوقيع أوامر الدفع والتحصيل البنكي.',
        keyAction: 'اعتماد الدفعات المرحلية',
        targetTab: 'ppc',
      },
      {
        timeWindow: '13:30 - 15:00 م',
        stageName: 'أوامر التغيير والتعاقدات (VO/EOT)',
        description: 'التفاوض على مطالبات التمديد الزمني ومراجعة أوامر التغيير الناتجة عن تعارضات الخدمات.',
        keyAction: 'مراجعة أوامر التغيير',
        targetTab: 'tendering',
      },
      {
        timeWindow: '16:00 - 17:00 م',
        stageName: 'التقرير التنفيذي الشامل والمخالصات',
        description: 'تصدير التقارير القيادية وتوقيع مخالصات نهاية الخدمة وإبراء الذمة (EOSB).',
        keyAction: 'تصدير التقرير التنفيذي',
        targetTab: 'dashboard',
      },
    ],
    kpis: [
      { name: 'مؤشر أداء التكلفة العام (CPI)', target: '≥ 1.00' },
      { name: 'معدل تحصيل المستخلصات', target: 'خلال 45 يوماً' },
      { name: 'صفر غرامات تأخير (Zero LD)', target: '100% نجاح' },
    ],
    associatedTabs: [
      { id: 'dashboard', name: 'لوحة القيادة' },
      { id: 'ppc', name: 'المستخلصات' },
      { id: 'tendering', name: 'أوامر التغيير' },
      { id: 'dms', name: 'الأرشيف والمستندات' },
    ],
  },
  {
    key: 'project_manager',
    title: 'مدير المشروع (Project Manager - PM)',
    category: 'إدارة العمليات والتنفيذ',
    responsibility: 'قيادة الموقع، الالتزام بالجدول الزمني، اعتماد التقارير اليومية (DPR)، مطابقة مطالبات مقاولي الباطن، وإدارة المشتريات.',
    approvalLimit: 'اعتماد مالي مباشر حتى 250,000 ر.س لطلبات المواد وأوامر الشراء',
    dailyStages: [
      {
        timeWindow: '07:00 - 08:00 ص',
        stageName: 'خطة تشغيل اليوم وتوزيع الفرق',
        description: 'مراجعة توزيع الكوادر والمعدات وتفقد تصاريح العمل (PTW) المفتوحة في القطاعات.',
        keyAction: 'تفقد الجاهزية الميدانية',
        targetTab: 'fleet',
      },
      {
        timeWindow: '11:00 - 13:00 م',
        stageName: 'اعتماد طلبات المواد الميدانية (MR)',
        description: 'مطابقة احتياج الموقع من الرمل والدفان والأنابيب مع الرصيد المتبقي بجدول الكميات.',
        keyAction: 'اعتماد طلبات المواد',
        targetTab: 'procurement',
      },
      {
        timeWindow: '14:00 - 15:30 م',
        stageName: 'تدقيق التقارير اليومية (DPR)',
        description: 'اعتماد كميات الحفر وسحب الكابلات المدخلة وترحيلها التلقائي للإنجاز التراكمي.',
        keyAction: 'تدقيق سجل DPR',
        targetTab: 'dpr',
      },
      {
        timeWindow: '16:00 - 17:30 م',
        stageName: 'مطابقة مستخلصات الباطن',
        description: 'مقارنة فواتير مقاولي الباطن مع الكميات المعتمدة واقتطاع ديزل وكهرباء المؤسسة.',
        keyAction: 'كشف تسوية الباطن',
        targetTab: 'subcontractors',
      },
    ],
    kpis: [
      { name: 'مؤشر الأداء الزمني (SPI)', target: '≥ 0.98' },
      { name: 'اعتماد تقارير DPR اليومية', target: 'خلال 4 ساعات' },
      { name: 'نسبة الهالك في المواد', target: '< 2.5%' },
    ],
    associatedTabs: [
      { id: 'dpr', name: 'التقرير اليومي' },
      { id: 'boq', name: 'جدول الكميات' },
      { id: 'procurement', name: 'المشتريات والمواد' },
      { id: 'subcontractors', name: 'مقاولو الباطن' },
    ],
  },
  {
    key: 'site_engineer',
    title: 'مهندس الموقع الميداني (Site Engineer)',
    category: 'الهندسة الميدانية والإنتاجية',
    responsibility: 'حصر الكميات الميدانية الفعلية (حفر، كابلات، أسفلت)، استدعاء استشاري الإشراف للفحص، وتنسيق تقاطعات الخدمات مع الجهات الخدمية.',
    approvalLimit: 'إصدار وتوقيع طلبات الفحص الميداني (RFI) وطلبات المواد الفنية',
    dailyStages: [
      {
        timeWindow: '06:30 - 07:30 ص',
        stageName: 'معاينة المسار وتأكيد التحويلات',
        description: 'فحص علامات السلامة، وإشارات المرور، وتحديد أمتار البدء للحفارات وفرق السحب.',
        keyAction: 'حرم الطريق والخدمات',
        targetTab: 'utilities',
      },
      {
        timeWindow: '09:00 - 11:30 ص',
        stageName: 'الإشراف على سحب الكابلات وتمديد الأنابيب',
        description: 'مراقبة جهاز الشد الميكانيكي، وعمق الفرشة الرملية، ووضع أشرطة التحذير الفوسفورية.',
        keyAction: 'توثيق كميات الموقع',
        targetTab: 'boq',
      },
      {
        timeWindow: '12:30 - 14:30 م',
        stageName: 'المعاينة المشتركة مع الاستشاري',
        description: 'حضور مهندس خطيب وعلمي لفحص خندق الحفر وتوقيع محضر الاستلام الميداني.',
        keyAction: 'محاضر الاستلام المشترك',
        targetTab: 'handover',
      },
      {
        timeWindow: '15:00 - 16:30 م',
        stageName: 'إدخال التقرير الميداني اليومي (DPR)',
        description: 'رفع أمتار الحفر والكابلات والصور الميدانية وبيانات العمالة المشغلة في النظام.',
        keyAction: 'إدخال كميات اليوم',
        targetTab: 'dpr',
      },
    ],
    kpis: [
      { name: 'معدل الحفر اليومي المنجز', target: '≥ 150 م.ط/يوم' },
      { name: 'دقة حصر كميات الـ DPR', target: '100% مطابقة' },
      { name: 'اعتماد محاضر الفحص (RFI)', target: 'صفر رفض' },
    ],
    associatedTabs: [
      { id: 'dpr', name: 'التقرير الميداني' },
      { id: 'utilities', name: 'الخدمات والطرق' },
      { id: 'qaqc', name: 'ضبط الجودة' },
      { id: 'handover', name: 'التسليم الميداني' },
    ],
  },
  {
    key: 'safety_officer',
    title: 'مسؤول السلامة والصحة المهنية (HSE Officer)',
    category: 'السلامة والبيئة المهنية',
    responsibility: 'حماية الأرواح والممتلكات، إصدار تصاريح الحفر العميق والأعمال الساخنة، إجراء محاضرات TBT، وضمان صفر حوادث مهدرة (Zero LTI).',
    approvalLimit: 'إيقاف الأعمال فوراً في حال رصد خطر داهم وإلغاء تصاريح العمل (PTW)',
    dailyStages: [
      {
        timeWindow: '06:30 - 07:15 ص',
        stageName: 'محاضرة السلامة الصباحية (TBT)',
        description: 'تجميع الكوادر وتوعيتهم بمخاطر العمل بالقرب من كابلات الجهد العالي والإجهاد الحراري.',
        keyAction: 'توثيق محاضرة TBT',
        targetTab: 'training',
      },
      {
        timeWindow: '07:15 - 08:30 ص',
        stageName: 'إصدار تصاريح الحفر والعمل (PTW)',
        description: 'التحقق من كواشف الكابلات المدفونة، صبات الحماية، ومعدات الحماية الشخصية (PPE).',
        keyAction: 'إصدار تصريح PTW',
        targetTab: 'hse',
      },
      {
        timeWindow: '10:00 - 13:00 م',
        stageName: 'التفتيش الميداني المستمر ورصد المخالفات',
        description: 'التأكد من التزام مشغلي المعدات بأحزمة الأمان، وعدم الاقتراب من الخدمات الحية.',
        keyAction: 'تسجيل مخالفة سلامة',
        targetTab: 'hr',
      },
      {
        timeWindow: '14:30 - 16:00 م',
        stageName: 'سجل ساعات السلامة وبلاغات الطوارئ',
        description: 'تحديث مؤشر ساعات العمل بدون حوادث (Man-Hours) وتوثيق أي بلاغات طارئة.',
        keyAction: 'غرفة عمليات الطوارئ',
        targetTab: 'emergency',
      },
    ],
    kpis: [
      { name: 'ساعات عمل آمنة بدون حوادث', target: 'Zero LTI' },
      { name: 'نسبة التزام الكوادر بالـ PPE', target: '100%' },
      { name: 'زمن إغلاق ملاحظات السلامة', target: 'خلال ساعة' },
    ],
    associatedTabs: [
      { id: 'hse', name: 'تصاريح PTW' },
      { id: 'training', name: 'تدريب TBT' },
      { id: 'emergency', name: 'الطوارئ' },
    ],
  },
  {
    key: 'qaqc_manager',
    title: 'مدير ضبط الجودة والفحوصات (QA/QC Manager)',
    category: 'الجودة والمواصفات القياسية',
    responsibility: 'مطابقة تنفيذ البنود مع مواصفات كراسة الشروط، التنسيق مع المختبرات المعتمدة، وإغلاق تقارير عدم المطابقة (NCR).',
    approvalLimit: 'إصدار تقارير عدم المطابقة ورفض المواد غير المعتمدة والصبات غير المتطابقة',
    dailyStages: [
      {
        timeWindow: '08:00 - 09:30 ص',
        stageName: 'التنسيق مع المختبر الفني المعتمد',
        description: 'جدولة أخذ عينات كبس مكعبات الخرسانة، واختبارات كثافة الدمك (Proctor 95%).',
        keyAction: 'نتائج فحوصات المختبر',
        targetTab: 'qaqc',
      },
      {
        timeWindow: '10:30 - 12:30 م',
        stageName: 'فحص اختبار عزل الكابلات (Megger Test)',
        description: 'قياس مقاومة عزل الكابل 33 ك.ف قبل وبعد السحب والتأكد من تجاوزها 1000 ميجا أوم.',
        keyAction: 'سجل فحوصات الجودة',
        targetTab: 'qaqc',
      },
      {
        timeWindow: '13:30 - 15:00 م',
        stageName: 'متابعة تقارير عدم المطابقة (NCR & CAPA)',
        description: 'التأكد من تنفيذ الإجراء التصحيحي مع مهندس الموقع والمقاول الباطن وإغلاق التقرير.',
        keyAction: 'إغلاق تقرير NCR',
        targetTab: 'qaqc',
      },
      {
        timeWindow: '15:30 - 17:00 م',
        stageName: 'تدقيق حزمة المخططات المنفذة (As-Built)',
        description: 'مراجعة المنسوب والعمق النهائي ومطابقتها مع الواقع لتجهيز ملف التسليم النهائي.',
        keyAction: 'أرشيف المخططات المعتمدة',
        targetTab: 'dms',
      },
    ],
    kpis: [
      { name: 'نسبة اجتياز فحوصات المختبر', target: '≥ 98%' },
      { name: 'متوسط زمن إغلاق تقارير NCR', target: 'خلال 72 ساعة' },
      { name: 'اكتمال شهادات ضمان المواد', target: '100%' },
    ],
    associatedTabs: [
      { id: 'qaqc', name: 'فحوصات الجودة و NCR' },
      { id: 'handover', name: 'التسليم الميداني' },
      { id: 'dms', name: 'المخططات التنفيذية' },
    ],
  },
  {
    key: 'procurement_mgr',
    title: 'مدير المشتريات والمستودعات (Procurement Manager)',
    category: 'سلاسل الإمداد والخدمات اللوجستية',
    responsibility: 'تأمين توريد الكابلات والأنابيب والرمال بالأسعار التنافسية، إصدار أوامر الشراء (PO)، ومراقبة نسب الهالك والتسريب.',
    approvalLimit: 'إصدار أوامر الشراء المعتمدة حتى 150,000 ر.س والتعاقد مع الكسارات المعتمدة',
    dailyStages: [
      {
        timeWindow: '08:00 - 09:30 ص',
        stageName: 'مراجعة طلبات المواد الميدانية (MR)',
        description: 'فحص الطلبات المحالة من مهندس الموقع ومدير المشروع ومقارنة الكميات مع الـ BOQ.',
        keyAction: 'مراجعة طلبات المواد',
        targetTab: 'procurement',
      },
      {
        timeWindow: '10:00 - 12:00 م',
        stageName: 'إصدار أوامر الشراء (PO) وتكليف الموردين',
        description: 'التعميد المباشر لمصانع الكابلات والكسارات المعتمدة مع جدولة توقيت وصول القلابات.',
        keyAction: 'أرشيف الأسعار والموردين',
        targetTab: 'tendering',
      },
      {
        timeWindow: '13:00 - 14:30 م',
        stageName: 'تدقيق مذكرات استلام الموقع (GRN) والموازين',
        description: 'مطابقة تذاكر الميزان الإلكتروني للقلابات وأوزان أطنان الرمل والدفان الوارد.',
        keyAction: 'سجل موازين الرمال',
        targetTab: 'spoils',
      },
      {
        timeWindow: '15:00 - 16:30 م',
        stageName: 'رصد مؤشر الهالك والفاقد الميداني',
        description: 'حساب الفارق بين الكميات الموردة والمنفذة وضمان عدم تجاوز الهالك نسبة 2.5%.',
        keyAction: 'مؤشر الفاقد المخزني',
        targetTab: 'procurement',
      },
    ],
    kpis: [
      { name: 'معدل الهالك الفعلي للمشروع', target: '< 2.0%' },
      { name: 'سرعة تلبية طلبات الموقع (MR)', target: 'خلال 24 ساعة' },
      { name: 'وفورات التسعير التنافسي', target: '5% - 8%' },
    ],
    associatedTabs: [
      { id: 'procurement', name: 'المشتريات والفاقد' },
      { id: 'spoils', name: 'تذاكر الموازين' },
      { id: 'boq', name: 'جدول الكميات' },
    ],
  },
  {
    key: 'field_operator',
    title: 'فني ومشغل المعدات والآليات (Field Crew & Operator)',
    category: 'التشغيل والتنفيذ المباشر',
    responsibility: 'التشغيل الآمن للحفار أو الرافعة، تسجيل الحضور بالبصمة الجغرافية، فحص مستويات الزيت والديزل، وتمديد الكابلات.',
    approvalLimit: 'إخلاء عهدة الموقع واستلام معدات الوقاية الشخصية وأدوات القطع واللحام',
    dailyStages: [
      {
        timeWindow: '06:30 - 07:00 ص',
        stageName: 'تسجيل الحضور بالبصمة (GPS Check-in)',
        description: 'تسجيل الدخول عند بوابة قطاع العمل والتحقق من التواجد داخل النطاق الجغرافي (Geofence).',
        keyAction: 'حضور وبصمة الموقع',
        targetTab: 'hr',
      },
      {
        timeWindow: '07:00 - 07:30 ص',
        stageName: 'فحص ما قبل التشغيل (Pre-start Checklist)',
        description: 'فحص سوائل المحرك، الفرامل، الباكت، والتأكد من خلو محيط الحفر من الخدمات الحية.',
        keyAction: 'ساعات تشغيل المحرك',
        targetTab: 'fleet',
      },
      {
        timeWindow: '07:30 - 14:30 م',
        stageName: 'التنفيذ الميداني وتمديد الكابلات',
        description: 'القيام بأعمال الحفر الطولي بدقة المنسوب المطلوب وسحب الكابلات تحت إشراف المراقب.',
        keyAction: 'الكميات المنفذة اليوم',
        targetTab: 'dpr',
      },
      {
        timeWindow: '15:00 - 15:30 م',
        stageName: 'تأمين المعدة وتسجيل ساعات العمل',
        description: 'إيقاف الحفار في الموقف الآمن، تسجيل قراءة عداد الساعات وتزويد خزان الديزل.',
        keyAction: 'سجل استهلاك الوقود',
        targetTab: 'fleet',
      },
    ],
    kpis: [
      { name: 'الالتزام الكامل بمتطلبات PPE', target: '100%' },
      { name: 'كفاءة تشغيل الآلية بدون أعطال', target: '≥ 95%' },
      { name: 'الحضور داخل النطاق الجغرافي', target: 'دقيق ويومي' },
    ],
    associatedTabs: [
      { id: 'fleet', name: 'أسطول المعدات' },
      { id: 'dpr', name: 'سجل DPR' },
      { id: 'hr', name: 'شؤون الكوادر' },
    ],
  },
];

export const UserJourneyMapTab: React.FC = () => {
  const { workers, selectedProjectId, selectedProject, setActiveTab, toggleGeoFence } = usePlatform();

  const [activeView, setActiveView] = useState<'journey_matrix' | 'live_map' | 'individual_dossier'>('live_map');
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('site_engineer');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [geofenceFilter, setGeofenceFilter] = useState<string>('all');
  const [workerSearch, setWorkerSearch] = useState('');

  const projectWorkers = useMemo(() => {
    return workers.filter((w) => w.projectId === selectedProjectId);
  }, [workers, selectedProjectId]);

  const filteredWorkers = useMemo(() => {
    return projectWorkers
      .filter((w) => {
        if (roleFilter === 'all') return true;
        if (roleFilter === 'engineer') return w.role.includes('مهندس');
        if (roleFilter === 'operator') return w.isHeavyOperator || w.role.includes('مشغل') || w.role.includes('سائق');
        if (roleFilter === 'technician') return w.role.includes('فني') || w.role.includes('عامل');
        if (roleFilter === 'safety') return w.role.includes('سلامة') || w.role.includes('HSE');
        return true;
      })
      .filter((w) => {
        if (geofenceFilter === 'all') return true;
        return w.geoFenceStatus === geofenceFilter;
      })
      .filter((w) => {
        if (!workerSearch.trim()) return true;
        const q = workerSearch.toLowerCase().trim();
        return (
          w.name.toLowerCase().includes(q) ||
          w.empCode.toLowerCase().includes(q) ||
          w.role.toLowerCase().includes(q) ||
          (w.currentZone && w.currentZone.toLowerCase().includes(q))
        );
      });
  }, [projectWorkers, roleFilter, geofenceFilter, workerSearch]);

  const selectedWorker = useMemo(() => {
    return projectWorkers.find((w) => w.id === selectedWorkerId) || projectWorkers[0];
  }, [projectWorkers, selectedWorkerId]);

  const activeRoleProfile = useMemo(() => {
    return ROLE_PROFILES.find((r) => r.key === selectedRoleKey) || ROLE_PROFILES[2];
  }, [selectedRoleKey]);

  // Leaflet Map Refs
  const staffMapContainerRef = useRef<HTMLDivElement>(null);
  const staffMapInstanceRef = useRef<L.Map | null>(null);
  const staffMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const geofenceCircleRef = useRef<L.Circle | null>(null);

  // Initialize Leaflet Staff Map
  useEffect(() => {
    if (activeView !== 'live_map' || !staffMapContainerRef.current) return;
    if (staffMapInstanceRef.current) {
      staffMapInstanceRef.current.invalidateSize();
      return;
    }

    const centerLat = selectedProject.lat || 24.827;
    const centerLng = selectedProject.lng || 46.640;

    const map = L.map(staffMapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false,
    }).setView([centerLat, centerLng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    staffMapInstanceRef.current = map;
    staffMarkersGroupRef.current = L.layerGroup().addTo(map);

    // Draw Site Work Geofence Perimeter (Riyadh north sector / trench zone)
    geofenceCircleRef.current = L.circle([centerLat, centerLng], {
      radius: 650, // 650 meters operational work perimeter
      color: '#00bb7f',
      weight: 2,
      fillColor: '#00bb7f',
      fillOpacity: 0.08,
      dashArray: '6 6',
    }).addTo(map);

    geofenceCircleRef.current.bindTooltip('نطاق العمل الميداني المعتمد (Work Geofence - 650m)', {
      direction: 'top',
      permanent: false,
    });

    const timer = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      staffMapInstanceRef.current = null;
    };
  }, [activeView, selectedProject]);

  // Update Worker Markers on Map
  useEffect(() => {
    if (activeView !== 'live_map' || !staffMapInstanceRef.current || !staffMarkersGroupRef.current) return;
    const group = staffMarkersGroupRef.current;
    group.clearLayers();

    filteredWorkers.forEach((w) => {
      const lat = w.lat || selectedProject.lat + (Math.random() - 0.5) * 0.006;
      const lng = w.lng || selectedProject.lng + (Math.random() - 0.5) * 0.006;
      const isInside = w.geoFenceStatus === 'inside_geofence';
      const isSelected = w.id === selectedWorkerId;
      const color = isInside ? '#10b981' : '#f43f5e';

      // Pulse ring for out-of-geofence or selected employee
      if (isSelected || !isInside) {
        L.marker([lat, lng], {
          interactive: false,
          icon: L.divIcon({
            className: '',
            html: `<span class="infra-pulse" style="--c: ${color}"></span>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        }).addTo(group);
      }

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 12 : 9,
        color: isSelected ? '#ffd400' : '#ffffff',
        weight: isSelected ? 3 : 2,
        fillColor: color,
        fillOpacity: 0.95,
      }).addTo(group);

      marker.bindTooltip(`${safeHtml(w.name)} (${safeHtml(w.role)})`, {
        direction: 'top',
        offset: [0, -8],
      });

      const popupContent = `
        <div dir="rtl" style="font-family: Cairo, sans-serif; min-width: 220px; color: #0f172a; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${safeHtml(w.name)}</div>
          <div style="font-size: 11px; color: #64748b; font-family: 'JetBrains Mono', monospace; margin-bottom: 6px;">${safeHtml(w.empCode)} · ${safeHtml(w.role)}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px; padding: 4px 6px; background: #f1f5f9; border-radius: 6px;">
            <span style="color: #475569;">حالة النطاق:</span>
            <b style="color: ${color};">${isInside ? 'داخل النطاق الميداني' : 'خارج النطاق الجغرافي'}</b>
          </div>
          <div style="font-size: 11px; margin-bottom: 3px;">المحطة: <b>${safeHtml(w.currentZone || 'المقطع 04')}</b></div>
          <div style="font-size: 11px; margin-bottom: 3px;">وقت الحضور: <b style="font-family: 'JetBrains Mono';">${safeHtml(w.checkInTime)}</b></div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">الوردية: ${safeHtml(w.shift || 'الصباحية')}</div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedWorkerId(w.id);
      });
    });
  }, [filteredWorkers, selectedWorkerId, activeView, selectedProject]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>خريطة المستخدم وسير عمل الكوادر (User & Employee Journey Map)</span>
            </h1>
            <span className="text-[11px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
              رصد حي ومسارات تشغيلية
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — خريطة التمركز الجغرافي الحي للكوادر، ومصفوفة رحلة العمل اليومية لكل دور وظيفي من البداية حتى الإغلاق
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setActiveView('live_map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeView === 'live_map' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>خريطة التمركز الميداني (Live GPS)</span>
          </button>
          <button
            onClick={() => setActiveView('journey_matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeView === 'journey_matrix' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>رحلة العمل ومسار اليوم (Role Matrix)</span>
          </button>
          <button
            onClick={() => setActiveView('individual_dossier')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeView === 'individual_dossier' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>ملف ومسار الفرد (Dossier)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Live Staff Geofence Map */}
      {activeView === 'live_map' && (
        <div className="space-y-4">
          {/* Map Controls & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">الكوادر في الموقع الميداني</span>
                <div className="text-lg font-bold text-white mt-0.5">
                  <FormattedNumber value={projectWorkers.length} unit="فرد" numClassName="font-mono tabular-nums text-white text-lg font-bold" />
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">داخل النطاق الجغرافي (Geofence)</span>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  <FormattedNumber
                    value={projectWorkers.filter((w) => w.geoFenceStatus === 'inside_geofence').length}
                    unit="حاضرين"
                    numClassName="font-mono tabular-nums text-emerald-400 text-lg font-bold"
                  />
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">خارج النطاق الميداني</span>
                <div className="text-lg font-bold text-rose-400 mt-0.5">
                  <FormattedNumber
                    value={projectWorkers.filter((w) => w.geoFenceStatus === 'outside_geofence').length}
                    unit="تنبيه انحراف"
                    numClassName="font-mono tabular-nums text-rose-400 text-lg font-bold"
                  />
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">نصف قطر نطاق العمل الميداني</span>
                <div className="text-lg font-bold text-amber-400 mt-0.5 font-mono">650 متر</div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Map Filters & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto text-xs">
              <span className="text-slate-400 font-medium">التصنيف:</span>
              {[
                { id: 'all', label: 'كافة الكوادر' },
                { id: 'engineer', label: 'المهندسون والإشراف' },
                { id: 'technician', label: 'فنيو الكابلات واللحام' },
                { id: 'operator', label: 'مشغلو المعدات الثقيلة' },
                { id: 'safety', label: 'مشرفو السلامة' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setRoleFilter(rf.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                    roleFilter === rf.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {rf.label}
                </button>
              ))}

              <span className="text-slate-600 px-1">|</span>

              <span className="text-slate-400 font-medium">النطاق:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'inside_geofence', label: 'داخل النطاق' },
                { id: 'outside_geofence', label: 'خارج النطاق' },
              ].map((gf) => (
                <button
                  key={gf.id}
                  onClick={() => setGeofenceFilter(gf.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                    geofenceFilter === gf.id
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {gf.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                placeholder="بحث باسم الكادر أو الكود..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Leaflet Map & Personnel Quick Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-semibold text-white">خريطة التواجد الميداني الحية (Live Geofenced Site Tracking)</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> داخل النطاق الميداني
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> خارج النطاق / غياب
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-amber-400 rounded-full" /> الكادر المحدد
                  </span>
                </div>
              </div>

              {/* Map Canvas */}
              <div ref={staffMapContainerRef} className="w-full h-[420px] rounded-xl overflow-hidden border border-slate-800 relative z-0" />

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  الموقع الميداني: <strong className="text-white">{selectedProject.location}</strong>
                </span>
                <span>النطاق الأخضر المتقطع يمثل محيط العمل المعتمد (Geofence Perimeter) لرصد التواجد وساعات العمل</span>
              </div>
            </div>

            {/* Selected / Staff List on Site */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 max-h-[520px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">قائمة الأفراد الميدانيين ({filteredWorkers.length})</span>
                <button
                  onClick={() => {
                    if (selectedWorker) toggleGeoFence(selectedWorker.id);
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                  title="محاكاة تبديل حالة التواجد داخل/خارج النطاق"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>محاكاة البصمة</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-xs">
                {filteredWorkers.map((w) => {
                  const isSelected = w.id === selectedWorkerId;
                  const isInside = w.geoFenceStatus === 'inside_geofence';

                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorkerId(w.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition space-y-1.5 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{w.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isInside ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          {isInside ? 'داخل النطاق' : 'خارج النطاق'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{w.role}</span>
                        <CodeBadge code={w.empCode} className="text-amber-400 font-mono text-[10px]" />
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span>المحطة: {w.currentZone || 'المقطع 04'}</span>
                        <span className="font-mono text-slate-400">{w.checkInTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedWorker && (
                <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 text-xs space-y-1.5 pt-2">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>الكادر المحدد: {selectedWorker.name}</span>
                    <button
                      onClick={() => setActiveView('individual_dossier')}
                      className="text-amber-400 hover:underline text-[11px] flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>عرض الملف</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    الراتب: <FormattedNumber value={selectedWorker.totalMonthlySalary} unit="ر.س" numClassName="font-mono text-slate-200" /> · الإجازات: {selectedWorker.leaveBalanceDays} يوم
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Role Journey & Workflow Matrix */}
      {activeView === 'journey_matrix' && (
        <div className="space-y-6">
          {/* Role Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
            {ROLE_PROFILES.map((rp) => {
              const isSelected = selectedRoleKey === rp.key;
              return (
                <button
                  key={rp.key}
                  onClick={() => setSelectedRoleKey(rp.key)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{rp.title.split(' (')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Role Overview Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">{activeRoleProfile.category}</span>
                <h2 className="text-base font-extrabold text-white mt-0.5">{activeRoleProfile.title}</h2>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400">سقف الصلاحية المالية: </span>
                <strong className="text-emerald-400 font-semibold">{activeRoleProfile.approvalLimit}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{activeRoleProfile.responsibility}</p>

            {/* Quick Navigation to Related Tabs */}
            <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-semibold">الشاشات والوحدات المرتبطة بهذا الدور:</span>
              {activeRoleProfile.associatedTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{tab.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Daily 4-Stage Workflow Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>مسار الرحلة اليومية ومحطات سير العمل (Daily Workflow Timeline)</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">خطوات العمل الميداني المتتالية</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeRoleProfile.dailyStages.map((stage, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-amber-500/50 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 font-mono font-bold flex items-center justify-center text-xs">
                        {sIdx + 1}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {stage.timeWindow}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1">{stage.stageName}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{stage.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setActiveTab(stage.targetTab)}
                      className="w-full bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer"
                    >
                      <span>{stage.keyAction}</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role KPIs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>مؤشرات قياس الأداء الرئيسية للدور (Key Performance Indicators)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeRoleProfile.kpis.map((kpi, kIdx) => (
                <div key={kIdx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">{kpi.name}</span>
                  <span className="text-xs font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {kpi.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Individual Dossier & Lifecycle Record */}
      {activeView === 'individual_dossier' && selectedWorker && (
        <div className="space-y-6">
          {/* Employee Selection Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
                {selectedWorker.empCode.split('-')[1]}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{selectedWorker.name}</h2>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedWorker.empCode} · {selectedWorker.role} · إقامة: {selectedWorker.iqamaNumber}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">اختيار موظف آخر:</span>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-bold cursor-pointer"
              >
                {projectWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dossier Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Lifecycle Timeline */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <Route className="w-4 h-4 text-amber-400" />
                <span>محطات دورة حياة الموظف من المباشرة وحتى الآن (Employee Lifecycle Track)</span>
              </h3>

              <div className="space-y-4 pt-1">
                {/* 1. Onboarding */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">المباشرة وتوثيق العقد عبر منصة قوى</span>
                      <DateBadge date={selectedWorker.joinDate} className="text-slate-400 font-mono text-[11px]" />
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      تم توثيق عقد العمل الإلكتروني برقم <CodeBadge code={selectedWorker.qiwaContractNumber} className="text-emerald-400 font-bold" /> بموجب نموذج وزارة الموارد البشرية.
                    </p>
                  </div>
                </div>

                {/* 2. Probation */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">فترة التجربة والتقييم الأولي (90 يوماً)</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedWorker.isProbationPassed ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                        {selectedWorker.isProbationPassed ? 'مجتازة ومكتملة' : `سارية حتى ${selectedWorker.probationEndDate}`}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      تقييم الكفاءة الميدانية ومطابقة اشتراطات رخص التشغيل وفحص السلامة.
                    </p>
                  </div>
                </div>

                {/* 3. Assets Handed Over */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex-1 space-y-2 text-xs">
                    <span className="font-bold text-white block">العهد والمعدات المسلمة رسمياً بذمته:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWorker.assetsHandedOver?.map((asset, aIdx) => (
                        <span key={aIdx} className="bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] border border-slate-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>{asset}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. EOSB Accrual */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">الاستحقاق التراكمي لمكافأة نهاية الخدمة (EOSB)</span>
                      <span className="text-amber-400 font-bold text-xs">المادتين 84 و 85</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      رصيد الإجازات المتبقي: <strong>{selectedWorker.leaveBalanceDays} يوماً</strong> · المخالفات: {selectedWorker.violationsCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Salary & Quick Actions */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                <h4 className="font-bold text-white border-b border-slate-800 pb-2">هيكل الأجر الشهري</h4>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الراتب الأساسي:</span>
                    <FormattedNumber value={selectedWorker.basicSalary} unit="ر.س" numClassName="font-mono text-white font-bold" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">بدل السكن:</span>
                    <FormattedNumber value={selectedWorker.housingAllowance} unit="ر.س" numClassName="font-mono text-slate-300" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">بدل النقل:</span>
                    <FormattedNumber value={selectedWorker.transportAllowance} unit="ر.س" numClassName="font-mono text-slate-300" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">بدل الموقع الميداني:</span>
                    <FormattedNumber value={selectedWorker.siteAllowance} unit="ر.س" numClassName="font-mono text-slate-300" />
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>خصم التأمينات (GOSI):</span>
                    <FormattedNumber value={-selectedWorker.gosiDeduction} unit="ر.س" numClassName="font-mono text-rose-400 font-bold" />
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                    <span>الراتب الشهري الإجمالي:</span>
                    <FormattedNumber value={selectedWorker.totalMonthlySalary} unit="ر.س" numClassName="font-mono text-emerald-400 font-bold text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-white border-b border-slate-800 pb-2">إجراءات سريعة على ملف الموظف</h4>
                <button
                  onClick={() => toggleGeoFence(selectedWorker.id)}
                  className={`w-full py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedWorker.geoFenceStatus === 'inside_geofence'
                      ? 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {selectedWorker.geoFenceStatus === 'inside_geofence'
                      ? 'تسجيل خروج من النطاق الجغرافي'
                      : 'تسجيل دخول داخل النطاق (Geofence In)'}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('hr')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>تصفية حقوق نهاية الخدمة (EOSB)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
