import React, { useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ isOpen, onClose }) => {
  const { selectedProject, boqItems, ppcs, dprs, selectedProjectId, company } = usePlatform();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const projectBoqs = boqItems.filter(b => b.projectId === selectedProjectId);
  const projectPpcs = ppcs.filter(p => p.projectId === selectedProjectId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white text-slate-900 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 my-auto print:p-0 print:m-0 print:max-w-none print:shadow-none print:text-black">
        {/* Modal Top Actions (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-800 text-sm">معاينة التقرير التنفيذي الشامل للطباعة والتصدير</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كملف PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE LETTERHEAD */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div className="flex items-start gap-3">
            {company?.logoDataUrl && <img src={company.logoDataUrl} alt="" className="h-14 max-w-[120px] object-contain" />}
            <div>
            <div className="text-xl font-black text-slate-900">
              {company?.name}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              سجل تجاري: <bdi dir="ltr">{company?.crNumber}</bdi>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              المملكة العربية السعودية
            </div>
            </div>
          </div>

          <div className="text-left font-mono text-xs text-slate-600">
            <div>التاريخ: {new Date().toLocaleDateString('ar-SA')}</div>
            <div>رقم التقرير: INFRA-REP-{new Date().getFullYear()}-089</div>
            <div className="font-bold text-slate-900 mt-1">نسخة معتمدة ومختومة</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-2 bg-slate-100 rounded-lg border border-slate-200">
          <h2 className="text-base font-extrabold text-slate-900">
            التقرير التشغيلي والفني الشامل لحالة المشروع الميدانية
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Operational & Technical Progress Evaluation Report
          </p>
        </div>

        {/* Project Meta Information */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-500 block text-[11px]">اسم المشروع:</span>
            <strong className="text-slate-900 block mt-0.5">{selectedProject.name}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">الجهة المالكة:</span>
            <strong className="text-slate-900 block mt-0.5">{selectedProject.client}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">استشاري الإشراف:</span>
            <strong className="text-slate-900 block mt-0.5">{selectedProject.consultant}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">القيمة التعاقدية:</span>
            <strong className="text-slate-900 font-mono block mt-0.5">{selectedProject.contractValue.toLocaleString()} ر.س</strong>
          </div>
        </div>

        {/* Progress Summary Strip */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px] block">نسبة الإنجاز المادي (Physical)</span>
            <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
              {selectedProject.physicalProgress}%
            </span>
            <span className="text-[10px] text-slate-500">المستهدف المخطط: {selectedProject.plannedProgress}%</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px] block">نسبة الإنجاز المالي (Financial)</span>
            <span className="text-lg font-black text-emerald-700 font-mono mt-1 block">
              {selectedProject.financialProgress}%
            </span>
            <span className="text-[10px] text-slate-500">بموجب المستخلصات المعتمدة</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px] block">مؤشر السلامة والصحة المهنية (HSE)</span>
            <span className="text-lg font-black text-blue-700 font-mono mt-1 block">
              {selectedProject.safetyHoursNoLti.toLocaleString()} ساعة
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">صفر حوادث هادفة (Zero LTI)</span>
          </div>
        </div>

        {/* BOQ Summary Table */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
            ملخص تقدم بنود جدول الكميات الرئيسية (BOQ Execution Progress):
          </h4>
          <table className="w-full text-right text-xs border border-slate-200">
            <thead className="bg-slate-100 font-bold text-slate-700">
              <tr>
                <th className="p-2 border-b border-slate-200">رقم البند</th>
                <th className="p-2 border-b border-slate-200">الوصف</th>
                <th className="p-2 border-b border-slate-200">الوحدة</th>
                <th className="p-2 border-b border-slate-200">الكمية التعاقدية</th>
                <th className="p-2 border-b border-slate-200">المنفذ حتى تاريخه</th>
                <th className="p-2 border-b border-slate-200">نسبة الإنجاز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {projectBoqs.map((boq) => (
                <tr key={boq.id}>
                  <td className="p-2 font-mono font-bold">{boq.code}</td>
                  <td className="p-2 max-w-xs">{boq.description}</td>
                  <td className="p-2">{boq.unit}</td>
                  <td className="p-2 font-mono">{boq.contractQty.toLocaleString()}</td>
                  <td className="p-2 font-mono font-bold text-emerald-700">{boq.executedQty.toLocaleString()}</td>
                  <td className="p-2 font-mono font-bold">{((boq.executedQty / boq.contractQty) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certified PPCs Table */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
            مستخلصات المالك المعتمدة والمصروفة (Payment Certificates):
          </h4>
          <table className="w-full text-right text-xs border border-slate-200">
            <thead className="bg-slate-100 font-bold text-slate-700">
              <tr>
                <th className="p-2 border-b border-slate-200">رقم المستخلص</th>
                <th className="p-2 border-b border-slate-200">إجمالي الأعمال</th>
                <th className="p-2 border-b border-slate-200">خصم الدفعة المقدمة (10%)</th>
                <th className="p-2 border-b border-slate-200">حجز حسن التنفيذ (5%)</th>
                <th className="p-2 border-b border-slate-200">صافي المستحق للصرف</th>
                <th className="p-2 border-b border-slate-200">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
              {projectPpcs.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 font-bold">{p.certificateNumber}</td>
                  <td className="p-2">{p.grossAmount.toLocaleString()} ر.س</td>
                  <td className="p-2 text-rose-600">-{p.advanceDeductionAmount.toLocaleString()} ر.س</td>
                  <td className="p-2 text-rose-600">-{p.retainageAmount.toLocaleString()} ر.س</td>
                  <td className="p-2 font-bold text-emerald-700">{p.netPayableAmount.toLocaleString()} ر.س</td>
                  <td className="p-2 text-slate-700">معتمد</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures & Seal Section */}
        <div className="pt-6 border-t border-slate-300 grid grid-cols-4 gap-4 text-center text-xs text-slate-700">
          <div className="space-y-8">
            <div className="font-bold">مهندس الموقع الميداني</div>
            <div className="border-b border-slate-400 w-32 mx-auto" />
            <div className="text-[10px] text-slate-500">التوقيع والتاريخ</div>
          </div>

          <div className="space-y-8">
            <div className="font-bold">مسؤول السلامة والصحة المهنية</div>
            <div className="border-b border-slate-400 w-32 mx-auto" />
            <div className="text-[10px] text-slate-500">التوقيع والتاريخ</div>
          </div>

          <div className="space-y-8">
            <div className="font-bold">مدير إدارة المشاريع والتنفيذ</div>
            <div className="border-b border-slate-400 w-32 mx-auto" />
            <div className="text-[10px] text-slate-500">التوقيع والتاريخ</div>
          </div>

          <div className="space-y-4">
            <div className="font-bold">ختم المؤسسة الرسمي</div>
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 mx-auto flex items-center justify-center text-[10px] text-slate-400">
              الختم الرسمي
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
