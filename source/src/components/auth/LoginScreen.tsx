import React, { useState } from 'react';
import { MapPin, HardHat, LogIn, KeyRound, Building2, ChevronLeft, Upload, Eye, EyeOff } from 'lucide-react';
import { readLogo, extractBrandColor } from '../../store/brand';
import { usePlatform } from '../../context/PlatformContext';
import { Field, inputCls, Btn } from '../common/ui';

type View = 'login' | 'forgot' | 'register';

export const LoginScreen: React.FC<{ initialView?: 'login' | 'register'; onBack?: () => void }> = ({ initialView = 'login', onBack }) => {
  const { login, requestPasswordReset, resetPassword, registerCompany, brand } = usePlatform();
  const [view, setView] = useState<View>(initialView);
  React.useEffect(() => setView(initialView), [initialView]);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // forgot
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');

  // register
  const [reg, setReg] = useState({ companyName: '', crNumber: '', adminName: '', phone: '', email: '', password: '', logoDataUrl: '', brandColor: '' });

  const doLogin = (id = identifier, pw = password) => {
    setError('');
    const r = login(id, pw, remember);
    if (!r.ok) setError(r.error);
  };

  const onLogo = async (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) { setError('حجم الشعار يجب أن يكون أقل من 2MB'); return; }
    try {
      const url = await readLogo(f);
      const color = await extractBrandColor(url);
      setReg((r) => ({ ...r, logoDataUrl: url, brandColor: color }));
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row" dir="rtl">
      {/* Brand side */}
      <div className="lg:w-[44%] bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-b lg:border-b-0 lg:border-l border-slate-800 p-6 lg:p-10 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          {brand?.logoDataUrl ? (
            <img src={brand.logoDataUrl} alt={brand.name} className="w-14 h-14 rounded-xl object-contain bg-white" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
              <HardHat className="w-6 h-6 text-amber-400" />
            </div>
          )}
          <div>
            <div className="text-lg font-black text-white">{brand?.name ?? 'منصة إدارة المقاولات'}</div>
            <div className="text-[11px] text-slate-400">إدارة عمليات المقاولات والبنية التحتية</div>
          </div>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-3xl font-black text-white leading-snug">منصة واحدة لكل أطراف المشروع</h1>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            الإدارة، الموقع، السلامة، الجودة، المشتريات، الموارد البشرية، المالك، الاستشاري، مقاولو الباطن والموردين —
            كل طرف يدخل ببوابته ويشوف بيانات مشاريعه فقط.
          </p>
        </div>
        <div className="hidden lg:block text-[11px] text-slate-500">© {new Date().getFullYear()} {brand?.name ?? ''}</div>
      </div>

      {/* Form side */}
      <div className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-start lg:justify-center overflow-y-auto">
        <div className="w-full max-w-md">
          {onBack && (
            <button onClick={onBack} className="mb-3 text-xs text-slate-400 hover:text-white flex items-center gap-1">→ العودة لتعريف المنصة</button>
          )}
          {view === 'login' && (
            <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">تسجيل الدخول</h2>
                <p className="text-xs text-slate-400 mt-0.5">أدخل اسم المستخدم أو الجوال أو البريد الإلكتروني وكلمة المرور</p>
              </div>
              <Field label="اسم المستخدم / الجوال / البريد">
                <input className={inputCls} value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" dir="auto" />
              </Field>
              <Field label="كلمة المرور">
                <div className="relative">
                  <input className={inputCls} type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-2 top-2 text-slate-400" aria-label="إظهار كلمة المرور">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                تذكرني على هذا الجهاز
              </label>
              {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2" role="alert">{error}</div>}
              {info && <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">{info}</div>}
              <Btn type="submit" className="w-full py-2.5" icon={<LogIn className="w-4 h-4" />}>دخول</Btn>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setView('forgot'); setError(''); setInfo(''); }} className="text-sky-400 hover:underline">نسيت كلمة المرور؟</button>
                <button type="button" onClick={() => { setView('register'); setError(''); }} className="text-amber-400 hover:underline flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> تسجيل شركة جديدة
                </button>
              </div>
            </form>
          )}

          {view === 'login' && (
            <button onClick={() => { window.location.hash = 'attendance'; }}
              className="mt-4 w-full flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/15 text-right transition">
              <span className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0"><MapPin className="w-6 h-6 text-emerald-400" /></span>
              <span>
                <span className="block text-sm font-bold text-white">بوابة الحضور والانصراف</span>
                <span className="block text-[11px] text-slate-300">للعمال والموظفين — برقم الهوية / الإقامة والموقع الجغرافي، بدون تسجيل دخول</span>
              </span>
            </button>
          )}

          {view === 'forgot' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <button onClick={() => setView('login')} className="text-xs text-slate-400 flex items-center gap-1 hover:text-white"><ChevronLeft className="w-4 h-4 rotate-180" /> رجوع</button>
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><KeyRound className="w-5 h-5 text-amber-400" /> استعادة كلمة المرور</h2>
              <Field label="الجوال أو البريد الإلكتروني">
                <input className={inputCls} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </Field>
              {!sentCode ? (
                <Btn className="w-full" onClick={() => {
                  setError('');
                  const r = requestPasswordReset(identifier);
                  if (!r.ok) setError(r.error!); else setSentCode(r.code!);
                }}>إرسال رمز التحقق</Btn>
              ) : (
                <>
                  <div className="text-[11px] text-sky-300 bg-sky-500/10 border border-sky-500/30 rounded-lg p-2">
                    نسخة تجريبية: في التشغيل الفعلي يُرسل الرمز برسالة SMS. رمزك هو <b dir="ltr" className="font-mono">{sentCode}</b>
                  </div>
                  <Field label="رمز التحقق"><input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" /></Field>
                  <Field label="كلمة المرور الجديدة"><input className={inputCls} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></Field>
                  <Btn className="w-full" onClick={() => {
                    setError('');
                    const r = resetPassword(identifier, code, newPw);
                    if (!r.ok) setError(r.error); else { setInfo('تم تغيير كلمة المرور — سجّل الدخول الآن'); setView('login'); setSentCode(null); setPassword(''); }
                  }}>تغيير كلمة المرور</Btn>
                </>
              )}
              {error && <div className="text-xs text-rose-400" role="alert">{error}</div>}
            </div>
          )}

          {view === 'register' && (
            <form onSubmit={(e) => {
              e.preventDefault(); setError('');
              const r = registerCompany({ ...reg, logoDataUrl: reg.logoDataUrl || undefined, brandColor: reg.brandColor || undefined });
              if (!r.ok) setError(r.error);
            }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <button type="button" onClick={() => setView('login')} className="text-xs text-slate-400 flex items-center gap-1 hover:text-white"><ChevronLeft className="w-4 h-4 rotate-180" /> رجوع</button>
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-400" /> تسجيل شركة جديدة</h2>
              <p className="text-[11px] text-slate-400">ينشئ مساحة عمل مستقلة للشركة وحساب المدير التنفيذي.</p>
              <Field label="اسم الشركة"><input className={inputCls} value={reg.companyName} onChange={(e) => setReg({ ...reg, companyName: e.target.value })} /></Field>
              <Field label="رقم السجل التجاري (10 أرقام)"><input className={inputCls} value={reg.crNumber} onChange={(e) => setReg({ ...reg, crNumber: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
              <Field label="شعار الشركة (اختياري)">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> رفع الشعار</span>
                  {reg.logoDataUrl && <img src={reg.logoDataUrl} alt="الشعار" className="w-9 h-9 rounded object-contain bg-white" />}
                  {reg.brandColor && <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-4 h-4 rounded" style={{ background: reg.brandColor }} /> لون الهوية</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
                </label>
              </Field>
              <div className="border-t border-slate-800 pt-3 text-xs font-bold text-slate-300">حساب المدير التنفيذي</div>
              <Field label="الاسم الكامل"><input className={inputCls} value={reg.adminName} onChange={(e) => setReg({ ...reg, adminName: e.target.value })} /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="الجوال"><input className={inputCls} value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" /></Field>
                <Field label="البريد (اختياري)"><input className={inputCls} value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} dir="ltr" /></Field>
              </div>
              <Field label="كلمة المرور (6 أحرف على الأقل)"><input className={inputCls} type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} /></Field>
              {error && <div className="text-xs text-rose-400" role="alert">{error}</div>}
              <Btn type="submit" className="w-full py-2.5">إنشاء الشركة والدخول</Btn>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
