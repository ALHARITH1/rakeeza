import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  FileCheck, 
  Award, 
  ShieldCheck, 
  Layers, 
  AlertCircle,
  FileSignature
} from 'lucide-react';

export const HandoverProtocols: React.FC = () => {
  const { selectedProject, toast: hoToast } = usePlatform();

  const [snagItems, setSnagItems] = useState([
    { id: 1, item: 'إعادة دهان المطبات المرورية وممرات المشاة في شارع التخصصي', cleared: true },
    { id: 2, item: 'تسليم كتالوجات ومفاتيح محطة التحويل T-04 لمهندس التشغيل بالشركة السعودية للكهرباء', cleared: true },
    { id: 3, item: 'إعادة تسوية رصيف المشاة بجوار غرفة المحول T-02', cleared: false }
  ]);

  const toggleSnag = (id: number) => {
    setSnagItems(prev => prev.map(s => s.id === id ? { ...s, cleared: !s.cleared } : s));
  };

  const clearedCount = snagItems.filter(s => s.cleared).length;
  const isReadyForHandover = clearedCount === snagItems.length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <span>الاختبارات الحقلية ومحاضر التسليم النهائي (Handover & Joint Inspection)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — محاضر المعاينة المشتركة، حزمة المخططات المنفذة (As-Built)، وتصفية الملاحظات للإفراج عن المحجوزات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
            تصفية الملاحظات: <strong className="text-emerald-400 font-mono font-bold">{clearedCount} / {snagItems.length}</strong>
          </span>
        </div>
      </div>

      {/* Grid: Handover Package components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Joint Inspection Protocols */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <FileSignature className="w-4 h-4 text-sky-400" />
              <span>محاضر الاستلام الفني المشترك (Joint Protocols)</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              3 محاضر معتمدة
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center font-bold text-white">
                <span>محضر معاينة وسحب كابلات 33 ك.ف - القطاع 4</span>
                <span className="text-emerald-400 font-mono text-[11px]">موقع ومعتمد</span>
              </div>
              <p className="text-[11px] text-slate-400">
                بحضور ممثل الشركة السعودية للكهرباء ومكتب خطيب وعلمي. تم التأكد من مسافات السحب والشد الميكانيكي.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center font-bold text-white">
                <span>محضر استلام إعادة سفلتة الشوارع الرئيسية</span>
                <span className="text-emerald-400 font-mono text-[11px]">موقع ومعتمد</span>
              </div>
              <p className="text-[11px] text-slate-400">
                بحضور مندوب أمانة منطقة الرياض - إدارة صيانة الطرق وإشعار المرور بفتح المسارات كاملة.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center font-bold text-white">
                <span>محضر اختبار الجهد المرتفع وإطلاق التيار (Energization Protocol)</span>
                <span className="text-amber-400 font-mono text-[11px]">مجدول الأسبوع القادم</span>
              </div>
              <p className="text-[11px] text-slate-400">
                التنسيق مع محطة التحويل الرئيسية 132/33 ك.ف لإجراء الإطلاق التجريبي بحضور فريق العمليات.
              </p>
            </div>
          </div>
        </div>

        {/* Handover Requirements Checklist & Retainage Release */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>حزمة التسليم النهائي وقائمة الملاحظات (Snag List)</span>
              </h2>
              <span className="text-[10px] text-slate-400">انقر لتأكيد التصفية</span>
            </div>

            <div className="space-y-2 text-xs">
              {snagItems.map((snag) => (
                <div 
                  key={snag.id}
                  onClick={() => toggleSnag(snag.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    snag.cleared 
                      ? 'bg-slate-950 border-slate-800 text-slate-300' 
                      : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {snag.cleared ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-[11px]">{snag.item}</span>
                  </div>
                  <span className="text-[10px] font-bold">
                    {snag.cleared ? 'مكتمل' : 'معلق'}
                  </span>
                </div>
              ))}
            </div>

            {/* As-Built and Warranties status */}
            <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <span className="font-bold text-white block text-[11px]">جاهزية وثائق التسليم النهائي:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> مخططات As-Built مكتملة</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> شهادات ضمان المحولات (10 سنوات)</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> سجل فحوصات المختبر المعتمد</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> مخالصة البلدية وإغلاق التصريح</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4">
            <button
              disabled={!isReadyForHandover}
              onClick={() => hoToast('تم إصدار طلب شهادة الإنجاز النهائي والإفراج عن محجوزات حسن التنفيذ بقيمة 1,225,000 ر.س!')}
              className={`w-full py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                isReadyForHandover 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>إصدار شهادة الإنجاز النهائي والإفراج عن محجوز حسن التنفيذ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
