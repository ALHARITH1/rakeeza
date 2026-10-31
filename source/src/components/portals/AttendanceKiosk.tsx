import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  ArrowRight,
  HardHat,
  Fingerprint,
  QrCode,
  Printer,
  Smartphone,
  Navigation,
  UserCheck,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Worker } from '../../types';

interface EmployeeAttendancePortalProps {
  onBackToApp?: () => void;
}

// Distance helper function (Haversine formula in meters)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const AttendanceKiosk: React.FC<EmployeeAttendancePortalProps> = ({ onBackToApp }) => {
  const { kiosk, ensureKiosk, registerWorkerAttendance } = usePlatform();
  useEffect(() => { ensureKiosk(); }, []); // eslint-disable-line
  const { workers, projects, attendanceLogs, companyName, logoDataUrl } = kiosk;
  const [hasFix, setHasFix] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [iqamaInput, setIqamaInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  useEffect(() => { if (!selectedProjectId && projects[0]) setSelectedProjectId(projects[0].id); }, [projects]); // eslint-disable-line
  const [actionType, setActionType] = useState<'clock_in' | 'clock_out'>('clock_in');
  const [notes, setNotes] = useState('');
  const [ppeChecked, setPpeChecked] = useState(true);

  // GPS State
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number }>({ lat: 0, lng: 0, accuracy: 0 });
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('اضغط «تحديد موقعي» للسماح بقراءة GPS');

  // UI State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<{
    code: string;
    workerName: string;
    iqama: string;
    role: string;
    action: string;
    time: string;
    projectName: string;
    isInsideGeofence: boolean;
    distanceMeters: number;
    lat: number;
    lng: number;
  } | null>(null);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Selected project coordinates
  const currentProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0] || { id: '', name: '—', location: '—', lat: 24.7, lng: 46.7 },
    [projects, selectedProjectId]
  );

  // Default project center coords (fallbacks to Riyadh Sector 4 if not set)
  const projectCenter = useMemo(() => {
    return {
      lat: currentProject.lat || 24.8271,
      lng: currentProject.lng || 46.6402,
    };
  }, [currentProject]);

  // Calculate distance from worker to project center
  const distanceToProject = useMemo(() => {
    return calculateDistanceMeters(gpsCoords.lat, gpsCoords.lng, projectCenter.lat, projectCenter.lng);
  }, [gpsCoords, projectCenter]);

  // Geofence limit in meters (e.g. 1500 meters radius from site)
  const GEOFENCE_RADIUS_METERS = 1500;
  // no project sites yet → attendance is recorded without a geofence check
  const noSites = projects.length === 0;
  const isInsideGeofence = noSites || distanceToProject <= GEOFENCE_RADIUS_METERS;

  // Real browser geolocation fetch
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('خاصية تحديد الموقع غير مدعومة في هذا المتصفح');
      return;
    }

    setIsLocating(true);
    setLocationStatus('جاري الاتصال بالأقمار الصناعية (GPS)...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 10),
        });
        setHasFix(true);
        setLocationStatus('تم تحديد موقعك الجغرافي الفعلي بدقة عبر GPS الجوال');
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus(`تعذر قراءة GPS تلقائياً (${err.message}) - تم الإبقاء على الإحداثيات الميدانية`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // request GPS automatically when the page opens
  useEffect(() => { handleGetLiveLocation(); }, []); // eslint-disable-line

  // Live worker match by Iqama
  const matchedWorker: Worker | undefined = useMemo(() => {
    const clean = iqamaInput.trim();
    if (clean.length < 5) return undefined;
    return workers.find((w) => w.iqamaNumber === clean || w.empCode.toLowerCase() === clean.toLowerCase());
  }, [workers, iqamaInput]);

  // Copy direct portal link to share via SMS/WhatsApp
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#attendance`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!iqamaInput.trim() || iqamaInput.trim().length < 5) {
      setFormError('يرجى إدخال رقم الإقامة أو الهوية الوطنية بشكل صحيح.');
      return;
    }
    if (!hasFix) {
      setFormError('لازم تحديد موقعك عبر GPS قبل التسجيل — اضغط «تحديد موقعي» واسمح للمتصفح بالوصول للموقع.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = registerWorkerAttendance({
        iqamaNumber: iqamaInput.trim(),
        type: actionType,
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        accuracy: gpsCoords.accuracy,
        projectId: selectedProjectId,
        isInsideGeofence,
        distanceToProjectMeters: distanceToProject,
        notes: notes.trim(),
      });

      setIsSubmitting(false);
      if (!res.success) { setFormError(res.message); return; }

      const timeStr = currentTime.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setSubmissionReceipt({
        code: res.code,
        workerName: res.workerName,
        iqama: iqamaInput.trim(),
        role: matchedWorker ? matchedWorker.role : 'فني / عامل ميداني',
        action: actionType === 'clock_in' ? 'تسجيل حضور ميداني (Clock-In)' : 'تسجيل انصراف ميداني (Clock-Out)',
        time: `${timeStr} - ${currentTime.toLocaleDateString('ar-SA')}`,
        projectName: currentProject.name,
        isInsideGeofence: res.isInsideGeofence,
        distanceMeters: Math.round(distanceToProject),
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt={companyName} className="w-10 h-10 rounded-xl object-contain bg-white shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white">
                  بوابة الحضور والانصراف الميداني الذاتية
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  GPS مباشر
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                التحقق برقم الهوية/الإقامة والموقع الجغرافي — {companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="نسخ الرابط المباشر لمشاركته مع العمالة والمهندسين عبر واتساب"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">تم نسخ الرابط!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px]">نسخ رابط البوابة</span>
                  <span className="sm:hidden text-[11px]">نسخ</span>
                </>
              )}
            </button>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>العودة للمنصة</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6">
        {/* Direct Link Share Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200">
                الرابط المباشر لبوابة حضور الموظفين الميدانيين
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 break-all">
                {window.location.origin}{window.location.pathname}#attendance
              </div>
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ لمشاركته في الموقع</span>
          </button>
        </div>

        {/* Live Clock & Shift Status Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">الوقت المعتمد في الموقع الآن:</div>
              <div className="text-lg sm:text-xl font-mono font-black text-amber-400 ">
                {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="text-slate-400 font-medium">
              {currentTime.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-bold">الوردية الصباحية الميدانية نشطة</span>
            </div>
          </div>
        </div>

        {/* SUCCESS RECEIPT VIEW (IF SUBMITTED) */}
        {submissionReceipt ? (
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40">
                تم اعتماد التسجيل بنجاح
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
                إيصال الحضور الميداني الرقمي
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تم توثيق بصمة الإقامة وإحداثيات الـ GPS في سجلات المشروع الرسمية
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 text-right space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <span className="text-slate-400">الرقم المرجعي للإيصال:</span>
                <span className="font-mono font-black text-amber-400 text-sm">{submissionReceipt.code}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">نوع الحركة:</span>
                <span className="font-bold text-white">{submissionReceipt.action}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">اسم الموظف / الصفة:</span>
                <span className="font-bold text-slate-200">{submissionReceipt.workerName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">رقم الإقامة / الهوية:</span>
                <span className="font-mono text-slate-200">{submissionReceipt.iqama}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">المشروع:</span>
                <span className="text-slate-200 font-semibold truncate max-w-[220px]">{submissionReceipt.projectName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">وقت التسجيل:</span>
                <span className="text-slate-200 font-mono">{submissionReceipt.time}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">حالة السياج الجغرافي:</span>
                {submissionReceipt.isInsideGeofence ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>داخل نطاق المشروع ({submissionReceipt.distanceMeters}م)</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>خارج السياج ({submissionReceipt.distanceMeters}م)</span>
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500">إحداثيات GPS:</span>
                <span className="font-mono text-slate-400">
                  {submissionReceipt.lat.toFixed(5)}, {submissionReceipt.lng.toFixed(5)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>طباعة إيصال الحضور</span>
              </button>

              <button
                onClick={() => {
                  setSubmissionReceipt(null);
                  setIqamaInput('');
                  setNotes('');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>تسجيل حركة جديدة لموظف آخر</span>
              </button>
            </div>
          </div>
        ) : (
          /* ATTENDANCE REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            {/* Step 1: Action Type (Clock In vs Clock Out) */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-2">
                1. حدد نوع الحركة الميدانية:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActionType('clock_in')}
                  className={`py-3.5 px-4 rounded-2xl border text-center font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                    actionType === 'clock_in'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-black shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span>تسجيل حضور (بدء العمل)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('clock_out')}
                  className={`py-3.5 px-4 rounded-2xl border text-center font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                    actionType === 'clock_out'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30 font-black shadow-lg shadow-rose-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span>تسجيل انصراف (نهاية العمل)</span>
                </button>
              </div>
            </div>

            {/* Step 2: Iqama / National ID */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1.5">
                2. رقم الإقامة أو الهوية الوطنية للموظف:
              </label>
              <div className="relative">
                <Fingerprint className="w-5 h-5 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={iqamaInput}
                  onChange={(e) => setIqamaInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="أدخل 10 أرقام للإقامة أو الهوية (مثال: 2410982314)"
                  maxLength={10}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono  font-bold"
                  required
                />
              </div>

              {/* Matched worker card preview */}
              {matchedWorker && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{matchedWorker.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          {matchedWorker.empCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {matchedWorker.role} • الجنسية: {matchedWorker.nationality}
                      </div>
                    </div>
                  </div>
                  <div className="text-left text-[11px]">
                    <span className="text-emerald-400 font-bold block">سجل معتمد</span>
                    <span className="text-slate-500 text-[10px]">تأمين ساري</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Project Selector */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1.5">
                3. اختر مشروع موقع العمل:
              </label>
              {noSites && <div className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3">ما فيه مواقع مشاريع مسجلة بعد — يُسجّل حضورك على الشركة بدون تحقق من النطاق الجغرافي.</div>}
              {!noSites && <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name} ({p.location})
                  </option>
                ))}
              </select>}
            </div>

            {/* Step 4: Live GPS & Geofence Verification */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-300">
                  4. التحقق الجغرافي الحي (GPS & Geofence):
                </label>
                <button
                  type="button"
                  onClick={handleGetLiveLocation}
                  disabled={isLocating}
                  className="px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLocating ? 'جاري الاتصال بالأقمار...' : 'تحديد موقعي الفعلي بالجوال'}</span>
                </button>
              </div>

              {/* Geofence Status Card */}
              <div
                className={`p-4 rounded-2xl border transition ${
                  isInsideGeofence
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-950/20 border-amber-500/50 text-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {isInsideGeofence ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-black text-xs sm:text-sm">
                        {isInsideGeofence
                          ? '✅ داخل نطاق سياج المشروع الميداني المعتمد'
                          : '⚠️ تنبيه: خارج السياج الجغرافي المعتمد'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        يبعد موقعك الحالي مسافة{' '}
                        <strong className={isInsideGeofence ? 'text-emerald-300' : 'text-amber-300'}>
                          {distanceToProject < 1000
                            ? `${Math.round(distanceToProject)} متراً`
                            : `${(distanceToProject / 1000).toFixed(1)} كم`}
                        </strong>{' '}
                        عن مركز المشروع المعتمد ({currentProject.name}).
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{locationStatus}</div>
                    </div>
                  </div>

                  <div className="text-left font-mono text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800 shrink-0">
                    <div>LAT: {gpsCoords.lat.toFixed(5)}</div>
                    <div>LNG: {gpsCoords.lng.toFixed(5)}</div>
                    <div className="text-slate-500 mt-0.5">الدقة: ±{gpsCoords.accuracy}م</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Step 5: Safety PPE Pledge */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={ppeChecked}
                  onChange={(e) => setPpeChecked(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  required
                />
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <span>أتعهد بارتداء مهمات الوقاية الشخصية (PPE): الخوذة، الحذاء الواقي، والسترة الفوسفورية</span>
                </span>
              </label>

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات ميدانية إضافية أو رقم المقطع (اختياري)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 mt-1"
                />
              </div>
            </div>

            {/* Submit Button */}
            {formError && (
              <div role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{formError}</div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                actionType === 'clock_in'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-rose-500/20'
              } disabled:opacity-50 active:scale-98`}
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <MapPin className="w-5 h-5 stroke-[2.5]" />
              )}
              <span>
                {actionType === 'clock_in'
                  ? 'تأكيد تسجيل الحضور وتوثيق الموقع الجغرافي'
                  : 'تأكيد تسجيل الانصراف وإنهاء الوردية'}
              </span>
            </button>
          </form>
        )}

        {/* Recent Attendance Logs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>آخر حركات الحضور والانصراف المسجلة بالموقع:</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              إجمالي: {attendanceLogs.length} حركة
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {attendanceLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      log.type === 'clock_in' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate flex items-center gap-1.5">
                      <span>{log.workerName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {log.role} • {log.timestamp}
                    </div>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      log.isInsideGeofence
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {log.isInsideGeofence ? 'داخل السياج' : 'خارج السياج'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{companyName} • نظام الحضور الذاتي والتحقق الجغرافي</span>

        </div>
      </footer>
    </div>
  );
};
