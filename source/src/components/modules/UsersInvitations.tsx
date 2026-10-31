import React, { useMemo, useState } from 'react';
import { UserPlus, Users, Copy, Power, Search } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { UserRole } from '../../types';
import { roleLabels, roleDescriptions, internalRoles } from '../../store/permissions';
import { PageHeader, Card, Modal, Field, inputCls, Btn, StatusBadge } from '../common/ui';

const allRoles = Object.keys(roleLabels) as UserRole[];

export const UsersInvitations: React.FC = () => {
  const { users, currentUser, inviteUser, updateUser, allowedProjects, workers, subcontractors, toast, focus } = usePlatform();
  React.useEffect(() => { if (focus?.tab === 'users' && focus.id === 'invite') setOpen(true); }, [focus]); // eslint-disable-line
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [result, setResult] = useState<{ name: string; phone: string; pw: string } | null>(null);
  const [form, setForm] = useState({
    name: '', username: '', phone: '', email: '', role: 'site_engineer' as UserRole, projectIds: [] as string[], all: false,
    workerId: '', subcontractorId: '', supplierName: ''
  });
  const [err, setErr] = useState('');

  const list = useMemo(() => users.filter((u) => `${u.name} ${u.phone} ${u.email ?? ''} ${roleLabels[u.role]}`.includes(q.trim())), [users, q]);
  const projName = (id: string) => allowedProjects.find((p) => p.id === id)?.code ?? id;

  const submit = () => {
    setErr('');
    const r = inviteUser({
      name: form.name, username: form.username || undefined, phone: form.phone, email: form.email || undefined, role: form.role,
      projectIds: form.all ? 'all' : form.projectIds,
      workerId: form.workerId || undefined, subcontractorId: form.subcontractorId || undefined, supplierName: form.supplierName || undefined
    });
    if (!r.ok) { setErr(r.error); return; }
    setResult({ name: form.name, phone: form.phone, pw: (r as any).tempPassword });
    setOpen(false);
    setForm({ name: '', username: '', phone: '', email: '', role: 'site_engineer', projectIds: [], all: false, workerId: '', subcontractorId: '', supplierName: '' });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Users className="w-5 h-5 text-sky-400" />}
        title="المستخدمون والدعوات"
        subtitle="أضف أعضاء الفريق والأطراف الخارجية (المالك، الاستشاري، مقاولي الباطن، الموردين) وحدد المشاريع المسموحة لكل منهم"
        actions={<Btn icon={<UserPlus className="w-4 h-4" />} onClick={() => setOpen(true)}>دعوة مستخدم</Btn>}
      />

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>تمت دعوة <b>{result.name}</b>. بيانات الدخول: الجوال <b dir="ltr" className="font-mono">{result.phone}</b> — كلمة المرور المؤقتة <b dir="ltr" className="font-mono">{result.pw}</b></span>
          <Btn variant="ghost" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => { navigator.clipboard?.writeText(`الجوال: ${result.phone}\nكلمة المرور: ${result.pw}`); toast('تم النسخ'); }}>نسخ البيانات</Btn>
        </div>
      )}

      <Card title={<><Users className="w-4 h-4 text-amber-400" /> المستخدمون ({users.length})</>}
        actions={
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الجوال" className={`${inputCls} pr-8`} />
          </div>
        }>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[760px]">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr><th className="p-2">الاسم</th><th className="p-2">الجوال / البريد</th><th className="p-2">الدور</th><th className="p-2">المشاريع</th><th className="p-2">آخر دخول</th><th className="p-2">الحالة</th><th className="p-2"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {list.map((u) => (
                <tr key={u.id} data-entity={u.id}>
                  <td className="p-2 font-bold text-white">{u.name}{u.id === currentUser?.id && <span className="text-[10px] text-amber-400 mr-1">(أنت)</span>}</td>
                  <td className="p-2 text-slate-300">{u.username && <div className="text-[10px] text-amber-400">@{u.username}</div>}<bdi dir="ltr" className="font-mono">{u.phone}</bdi><div className="text-[10px] text-slate-500">{u.email}</div></td>
                  <td className="p-2">
                    <select disabled={u.id === currentUser?.id} value={u.role} onChange={(e) => { const r = updateUser(u.id, { role: e.target.value as UserRole }); if (!r.ok) toast(r.error, 'error'); else toast('تم تحديث الدور'); }}
                      className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-sky-300">
                      {allRoles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                    </select>
                  </td>
                  <td className="p-2 text-slate-300">{u.projectIds === 'all' ? 'كل المشاريع' : u.projectIds.map(projName).join('، ')}</td>
                  <td className="p-2 text-slate-400"><bdi dir="ltr">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</bdi></td>
                  <td className="p-2"><StatusBadge status={u.active ? 'approved' : 'rejected'} label={u.active ? 'مفعّل' : 'موقوف'} /></td>
                  <td className="p-2">
                    {u.id !== currentUser?.id && (
                      <button onClick={() => { const r = updateUser(u.id, { active: !u.active }); toast(r.ok ? (u.active ? 'تم إيقاف المستخدم' : 'تم تفعيل المستخدم') : r.error, r.ok ? 'success' : 'error'); }}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded ${u.active ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                        <Power className="w-3.5 h-3.5" /> {u.active ? 'إيقاف' : 'تفعيل'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="دعوة مستخدم جديد" subtitle="يُنشأ الحساب بكلمة مرور مؤقتة تشاركها مع المستخدم"
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>إلغاء</Btn><Btn onClick={submit}>إنشاء الحساب</Btn></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الاسم"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="الجوال"><input className={inputCls} dir="ltr" inputMode="tel" placeholder="05xxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="اسم المستخدم (اختياري)"><input className={inputCls} dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="البريد (اختياري)"><input className={inputCls} dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="الدور" hint={roleDescriptions[form.role]}>
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              <optgroup label="فريق الشركة">{allRoles.filter((r) => internalRoles.includes(r)).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}</optgroup>
              <optgroup label="أطراف خارجية">{allRoles.filter((r) => !internalRoles.includes(r)).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}</optgroup>
            </select>
          </Field>
          {form.role === 'worker' && (
            <Field label="سجل الموظف المرتبط" className="sm:col-span-2">
              <select className={inputCls} value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })}>
                <option value="">— اختر —</option>
                {workers.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.empCode})</option>)}
              </select>
            </Field>
          )}
          {form.role === 'subcontractor' && (
            <Field label="مقاول الباطن" className="sm:col-span-2">
              <select className={inputCls} value={form.subcontractorId} onChange={(e) => setForm({ ...form, subcontractorId: e.target.value })}>
                <option value="">— اختر —</option>
                {subcontractors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}
          {form.role === 'supplier' && (
            <Field label="اسم المورد (كما يظهر في أوامر الشراء)" className="sm:col-span-2"><input className={inputCls} value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} /></Field>
          )}
          <div className="sm:col-span-2">
            <span className="text-[11px] font-semibold text-slate-300">المشاريع المسموحة</span>
            <label className="flex items-center gap-2 mt-1 text-xs text-slate-200">
              <input type="checkbox" checked={form.all} onChange={(e) => setForm({ ...form, all: e.target.checked })} /> كل المشاريع (الحالية والمستقبلية)
            </label>
            {!form.all && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                {allowedProjects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-950 border border-slate-800 rounded-lg p-2">
                    <input type="checkbox" checked={form.projectIds.includes(p.id)}
                      onChange={(e) => setForm({ ...form, projectIds: e.target.checked ? [...form.projectIds, p.id] : form.projectIds.filter((x) => x !== p.id) })} />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        {err && <div className="text-xs text-rose-400 mt-3" role="alert">{err}</div>}
      </Modal>
    </div>
  );
};
