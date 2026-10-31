import React from 'react';
import {
  HardHat, LogIn, MapPin, Building2, FileCheck2, Receipt, ShoppingBag, ShieldAlert, Users2, Landmark, Stamp,
  PackageCheck, Smartphone, Palette, KeyRound, History, FileSpreadsheet, ArrowLeft, CheckCircle2, Sparkles, LineChart
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

interface Props { onLogin: () => void; onRegister: () => void; onAttendance: () => void }

const modules = [
  { icon: FileCheck2, t: 'التقارير الميدانية اليومية', d: 'كميات كل البنود، الطقس، الصور، والتحقق من تصريح العمل — والكميات ما تترحّل إلا بعد اعتماد مدير المشروع والاستشاري.' },
  { icon: Receipt, t: 'المستخلصات والدفعات', d: 'تُحسب من المنفذ المعتمد منذ آخر مستخلص، مع الخصومات والضريبة، ودورة: الاستشاري ← المالك ← الصرف.' },
  { icon: ShoppingBag, t: 'المشتريات والمواد', d: 'طلب المواد مربوط بجدول الكميات ويمنع التجاوز: MR ← مدير المشروع ← أمر شراء ← المورد ← الاستلام.' },
  { icon: ShieldAlert, t: 'السلامة والجودة', d: 'تصاريح العمل، الحوادث، محاضرات التوعية، بلاغات الخطر، الفحوصات المخبرية وتقارير عدم المطابقة.' },
  { icon: Users2, t: 'الموارد البشرية', d: 'ملف الموظف، الحضور الجغرافي، الإجازات والسلف، المسيرات، وتنبيهات انتهاء الإقامة والتأمين ونهاية الخدمة.' },
  { icon: LineChart, t: 'لوحة القيادة', d: 'منحنى الإنجاز التراكمي، الميزانية مقابل الصرف، خريطة المشاريع، وتوقع موعد التسليم.' }
];

const portals = [
  { icon: Landmark, t: 'المالك', d: 'يتابع الإنجاز ويعتمد المستخلصات وأوامر التغيير' },
  { icon: Stamp, t: 'الاستشاري', d: 'يعتمد التقارير والمستخلصات والـ RFI ويصدر NCR' },
  { icon: Building2, t: 'مقاول الباطن', d: 'يرفع مطالباته ويتابع خصوماته وعمالته' },
  { icon: PackageCheck, t: 'المورد', d: 'يستلم أوامر الشراء ويؤكد التوريد ويرفع الفاتورة' },
  { icon: Smartphone, t: 'العامل', d: 'حضوره وإجازاته وراتبه وعهدته من جواله' },
  { icon: HardHat, t: 'فريق الشركة', d: 'الإدارة، الموقع، السلامة، الجودة، المشتريات، الموارد البشرية' }
];

const features = [
  { icon: Palette, t: 'بهوية شركتك', d: 'ارفع شعارك والمنصة تاخذ اسمك ولونك تلقائياً' },
  { icon: KeyRound, t: 'صلاحيات تتحكم فيها', d: 'تحدد لكل وظيفة شاشاتها وأزرارها' },
  { icon: History, t: 'سجل تدقيق كامل', d: 'كل إجراء محفوظ: مين سواه ومتى' },
  { icon: FileSpreadsheet, t: 'استيراد من Excel', d: 'جدول الكميات من ملفك مباشرة، وتصدير التقارير PDF وCSV' }
];

export const LandingPage: React.FC<Props> = ({ onLogin, onRegister, onAttendance }) => {
  const { brand } = usePlatform();
  const name = brand?.name ?? 'منصة إدارة عمليات المقاولات';
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {brand?.logoDataUrl
              ? <img src={brand.logoDataUrl} alt={name} className="w-10 h-10 rounded-xl object-contain bg-white shrink-0" />
              : <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0"><HardHat className="w-5 h-5 text-amber-400" /></span>}
            <div className="min-w-0">
              <div className="text-sm font-black text-white truncate">{name}</div>
              <div className="text-[10px] text-slate-400 hidden sm:block">إدارة عمليات المقاولات والبنية التحتية</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onAttendance} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/10">
              <MapPin className="w-4 h-4" /> بوابة الحضور
            </button>
            <button onClick={onLogin} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400">
              <LogIn className="w-4 h-4" /> تسجيل الدخول
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
              <Sparkles className="w-3.5 h-3.5" /> منصة واحدة لكل أطراف المشروع
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mt-4">
              أدِر مشاريع المقاولات<br /><span className="text-amber-400">من الموقع إلى المستخلص</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-xl">
              التقرير اليومي، الاعتمادات، المستخلصات، المشتريات، السلامة، الجودة والموارد البشرية في نظام واحد —
              وكل طرف (الإدارة، الموقع، المالك، الاستشاري، مقاول الباطن، المورد، العامل) يدخل ببوابته ويشوف بيانات مشاريعه فقط.
            </p>
            <div className="flex flex-wrap gap-2 mt-7">
              <button onClick={onLogin} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400">
                <LogIn className="w-4 h-4" /> تسجيل الدخول
              </button>
              <button onClick={onRegister} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-slate-800 border border-slate-700 text-white hover:bg-slate-700">
                <Building2 className="w-4 h-4" /> سجّل شركتك
              </button>
              <button onClick={onAttendance} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/10">
                <MapPin className="w-4 h-4" /> بوابة الحضور والانصراف
              </button>
            </div>
          </div>

          {/* Workflow illustration */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <div className="text-xs font-bold text-slate-300 mb-4">كيف تمشي الكميات من الموقع إلى الدفع</div>
            <ol className="space-y-2.5">
              {[
                ['مهندس الموقع', 'يرفع التقرير اليومي بالكميات والصور'],
                ['مدير المشروع', 'يراجع ويعتمد'],
                ['الاستشاري', 'يعتمد ← تترحّل الكميات لجدول الكميات'],
                ['المستخلص', 'يُولَّد تلقائياً من المعتمد منذ آخر مستخلص'],
                ['المالك', 'يعتمد ← تسجيل الصرف']
              ].map(([who, what], i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                    <span className="block text-xs font-bold text-white">{who}</span>
                    <span className="block text-[11px] text-slate-400">{what}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-4 text-[11px] text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> كل خطوة تُسجَّل في سجل التدقيق وتوصل بتنبيه للشخص المعني</div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl sm:text-2xl font-black text-white">كل دورة المشروع في مكان واحد</h2>
        <p className="text-xs text-slate-400 mt-1">من المناقصة حتى التسليم النهائي</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {modules.map((m) => (
            <div key={m.t} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <m.icon className="w-6 h-6 text-amber-400" />
              <div className="text-sm font-bold text-white mt-2">{m.t}</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-black text-white">بوابة لكل طرف</h2>
          <p className="text-xs text-slate-400 mt-1">كل واحد يشوف اللي يخصه فقط، حسب الصلاحيات اللي تحددها</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {portals.map((p) => (
              <div key={p.t} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0"><p.icon className="w-5 h-5 text-amber-400" /></span>
                <span>
                  <span className="block text-sm font-bold text-white">{p.t}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{p.d}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((f) => (
            <div key={f.t} className="p-4 rounded-2xl border border-slate-800">
              <f.icon className="w-5 h-5 text-amber-400" />
              <div className="text-sm font-bold text-white mt-2">{f.t}</div>
              <p className="text-[11px] text-slate-400 mt-1">{f.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-gradient-to-l from-amber-500/15 to-slate-900 border border-amber-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-black text-white">جاهز تبدأ؟</div>
            <div className="text-xs text-slate-300 mt-1">سجّل شركتك، ارفع شعارك، وادعُ فريقك — خلال دقائق.</div>
          </div>
          <div className="flex gap-2">
            <button onClick={onRegister} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 flex items-center gap-1.5">سجّل شركتك <ArrowLeft className="w-4 h-4" /></button>
            <button onClick={onLogin} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800 border border-slate-700 text-white">دخول</button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-5 text-center text-[11px] text-slate-500">
        © {new Date().getFullYear()} {name}
      </footer>
    </div>
  );
};
