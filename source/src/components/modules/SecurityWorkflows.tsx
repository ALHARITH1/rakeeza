import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { UserRole } from '../../types';
import { roleLabels, roleDescriptions } from '../../store/permissions';
import { RolePermissionsEditor } from './RolePermissionsEditor';
import { 
  KeyRound, 
  ShieldCheck, 
  GitBranch, 
  CheckCircle2, 
  UserCheck, 
  BellRing,
  Lock
} from 'lucide-react';

export const SecurityWorkflows: React.FC = () => {
  const { currentRole, roleLabel } = usePlatform();

  const roles = (Object.keys(roleLabels) as UserRole[]).map((key) => ({ key, title: roleLabels[key], desc: roleDescriptions[key] }));


  const approvalChains = [
    {
      title: 'مسار اعتماد طلبات المواد الميدانية (MR & PO)',
      steps: [
        { step: '1', role: 'مهندس الموقع', action: 'رفع الطلب بالكميات المطلوبة مع فحص رصيد الـ BOQ' },
        { step: '2', role: 'مدير المشروع', action: 'الموافقة الفنية والميدانية ومطابقة الاحتياج' },
        { step: '3', role: 'مدير المشتريات', action: 'إصدار أمر الشراء (PO) وتكليف المورد المعتمد' }
      ]
    },
    {
      title: 'مسار اعتماد مستخلصات المالك (Client PPC)',
      steps: [
        { step: '1', role: 'فريق الحصر الميداني', action: 'تجميع الكميات المعتمدة من التقارير اليومية (DPR)' },
        { step: '2', role: 'استشاري الإشراف', action: 'التدقيق الهندسي والموافقة على نسب الإنجاز' },
        { step: '3', role: 'المالك والمدير التنفيذي', action: 'الاعتماد النهائي وإصدار أمر الدفع والتحويل البنكي' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-400" />
            <span>إدارة الصلاحيات ومسارات الاعتماد الآلية (RBAC & Approvals)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            التحكم الدقيق بالصلاحيات بحسب المسمى الوظيفي، وبناء سلاسل الاعتماد الرقمية لكافة الإجراءات الميدانية
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            دورك الحالي: <strong className="text-amber-400">{roleLabel}</strong>
          </span>
        </div>
      </div>

      {/* Role Switcher Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>الأدوار الوظيفية (الدور يُحدد من حساب المستخدم في شاشة المستخدمون والدعوات)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {roles.map((r) => {
            const isCurrent = currentRole === r.key;
            return (
              <div
                key={r.key}
                className={`p-3.5 rounded-xl border transition space-y-1.5 ${
                  isCurrent 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-xs">{r.title}</h3>
                  {isCurrent && (
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                      دورك
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <RolePermissionsEditor />

      {/* Approval Chains */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-amber-400" />
          <span>شجرة مسارات الاعتماد الآلية (Automated Approval Chains)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {approvalChains.map((chain, idx) => (
            <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                {chain.title}
              </h3>

              <div className="space-y-2 text-xs">
                {chain.steps.map((st, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {st.step}
                    </span>
                    <div>
                      <span className="font-bold text-white text-[11px] block">{st.role}</span>
                      <span className="text-[10px] text-slate-400">{st.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
