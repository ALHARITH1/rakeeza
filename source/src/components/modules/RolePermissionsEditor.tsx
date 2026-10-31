import React, { useEffect, useState } from 'react';
import { ShieldCheck, Save, RotateCcw, Lock } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { UserRole } from '../../types';
import { Action, roleLabels, roleDescriptions, tabLabels, TabId } from '../../store/permissions';
import { Card, Btn, ConfirmDialog } from '../common/ui';

export const actionLabels: Record<Action, string> = {
  'dpr.create': 'إنشاء ورفع التقرير الميداني',
  'dpr.pm_approve': 'اعتماد التقرير الميداني (مدير المشروع)',
  'dpr.consultant_approve': 'اعتماد التقرير الميداني (الاستشاري) وترحيل الكميات',
  'ppc.create': 'إعداد وإصدار المستخلص',
  'ppc.consultant_approve': 'اعتماد المستخلص (الاستشاري)',
  'ppc.owner_approve': 'اعتماد المستخلص (المالك)',
  'ppc.disburse': 'تسجيل صرف المستخلص',
  'mr.create': 'رفع طلب مواد',
  'mr.pm_approve': 'اعتماد/رفض طلب المواد',
  'mr.issue_po': 'إصدار أمر الشراء',
  'mr.supplier': 'تأكيد التوريد ورفع الفاتورة (المورد)',
  'mr.grn': 'الاستلام المخزني GRN',
  'vo.create': 'إنشاء ورفع أمر تغيير',
  'vo.consultant_approve': 'اعتماد أمر التغيير (الاستشاري)',
  'vo.owner_approve': 'اعتماد أمر التغيير (المالك)',
  'rfi.create': 'رفع طلب استيضاح RFI',
  'rfi.answer': 'الرد على RFI واعتماده',
  'ncr.issue': 'إصدار تقرير عدم مطابقة NCR',
  'ncr.close': 'إغلاق NCR',
  'lab.create': 'تسجيل الفحوصات المخبرية',
  'ptw.create': 'إصدار تصاريح العمل PTW ومعالجة بلاغات الخطر',
  'incident.create': 'تسجيل الحوادث والطوارئ',
  'tbt.create': 'محاضرات التوعية TBT',
  'project.create': 'إنشاء مشروع جديد',
  'boq.edit': 'إضافة واستيراد بنود جدول الكميات',
  'users.manage': 'إدارة المستخدمين والصلاحيات',
  'data.reset': 'إعادة البيانات التجريبية',
  'audit.view': 'عرض سجل التدقيق الكامل',
  'hr.manage': 'إدارة الموظفين والمخالفات ونهاية الخدمة',
  'hr.leave_approve': 'اعتماد الإجازات والسلف',
  'team.attendance': 'تسجيل حضور الفريق',
  'sub.claim': 'رفع مطالبات (مقاول الباطن)',
  'sub.claim_approve': 'اعتماد وصرف مطالبات مقاولي الباطن',
  'finance.view': 'عرض القيم المالية والتقرير الشامل'
};

const allRoles = Object.keys(roleLabels) as UserRole[];
const allTabs = Object.keys(tabLabels) as TabId[];
const allActions = Object.keys(actionLabels) as Action[];

export const RolePermissionsEditor: React.FC = () => {
  const { rolePerms, saveRolePermissions, resetRolePermissions, can, toast } = usePlatform();
  const [role, setRole] = useState<UserRole>('project_manager');
  const [tabs, setTabs] = useState<string[]>([]);
  const [acts, setActs] = useState<Action[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const editable = can('users.manage');

  useEffect(() => { setTabs(rolePerms.tabs[role]); setActs(rolePerms.actions[role]); }, [role, rolePerms.customized]); // eslint-disable-line
  const dirty = JSON.stringify([...tabs].sort()) !== JSON.stringify([...rolePerms.tabs[role]].sort()) || JSON.stringify([...acts].sort()) !== JSON.stringify([...rolePerms.actions[role]].sort());
  const locked = (t: string) => role === 'executive_director' && (t === 'users' || t === 'security' || t === 'company');
  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <Card title={<><ShieldCheck className="w-4 h-4 text-emerald-400" /> صلاحيات الوظائف — {editable ? 'قابلة للتعديل' : 'للعرض فقط'}</>}
      actions={editable && <Btn variant="ghost" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setConfirmReset(true)}>الإعدادات الافتراضية</Btn>}>
      <div className="flex flex-wrap gap-1.5 mb-3" role="tablist">
        {allRoles.map((r) => (
          <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${role === r ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' : 'bg-slate-950 text-slate-300 border-slate-800'}`}>
            {roleLabels[r]}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mb-3">{roleDescriptions[role]} — أول شاشة مختارة تكون الصفحة الرئيسية للوظيفة.</p>

      <fieldset disabled={!editable} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-bold text-white mb-2">الشاشات المسموحة ({tabs.length})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {allTabs.map((t) => (
              <label key={t} className={`flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer ${tabs.includes(t) ? 'border-emerald-500/40 bg-emerald-500/5 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                <input type="checkbox" checked={tabs.includes(t)} disabled={locked(t)} onChange={() => toggle(tabs, t, setTabs)} />
                <span className="flex-1">{tabLabels[t]}</span>
                {locked(t) && <Lock className="w-3 h-3 text-slate-500" />}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-white mb-2">الإجراءات والأزرار المسموحة ({acts.length})</div>
          <div className="grid grid-cols-1 gap-1.5">
            {allActions.map((a) => (
              <label key={a} className={`flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer ${acts.includes(a) ? 'border-sky-500/40 bg-sky-500/5 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                <input type="checkbox" checked={acts.includes(a)} disabled={role === 'executive_director' && a === 'users.manage'} onChange={() => toggle(acts, a, setActs)} />
                <span>{actionLabels[a]}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {editable && (
        <div className="flex items-center justify-end gap-2 mt-4 sticky bottom-0 bg-slate-900 py-2">
          {dirty && <span className="text-[11px] text-amber-400">تغييرات غير محفوظة</span>}
          <Btn variant="ghost" disabled={!dirty} onClick={() => { setTabs(rolePerms.tabs[role]); setActs(rolePerms.actions[role]); }}>تراجع</Btn>
          <Btn variant="success" icon={<Save className="w-4 h-4" />} disabled={!dirty}
            onClick={() => { const r = saveRolePermissions(role, tabs, acts); toast(r.ok ? `تم حفظ صلاحيات ${roleLabels[role]} — تطبق فوراً على كل مستخدمي هذه الوظيفة` : r.error, r.ok ? 'success' : 'error'); }}>
            حفظ صلاحيات {roleLabels[role]}
          </Btn>
        </div>
      )}
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} title="إرجاع الصلاحيات الافتراضية"
        message="سيتم إلغاء كل تعديلاتك على صلاحيات الوظائف والرجوع للتوزيع الافتراضي." confirmLabel="إرجاع" tone="danger"
        onConfirm={() => { const r = resetRolePermissions(); setConfirmReset(false); toast(r.ok ? 'تم إرجاع الصلاحيات الافتراضية' : r.error, r.ok ? 'success' : 'error'); }} />
    </Card>
  );
};
