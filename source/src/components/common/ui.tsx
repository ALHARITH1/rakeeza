import React, { useEffect, useRef } from 'react';
import { X, Lock, CheckCircle2, Clock, XCircle, Circle } from 'lucide-react';
import { WorkflowStep } from '../../types';
import { roleLabels } from '../../store/permissions';

/* ---------------- Modal (Esc + backdrop close, focus trap-lite) ---------------- */
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, subtitle, size = 'md', children, footer }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus(), 30);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }[size];
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className={`relative w-full ${w} bg-slate-900 border border-slate-700 sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col`}>
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-800">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white">{title}</h2>
            {subtitle && <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="p-3 border-t border-slate-800 flex flex-wrap gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
};

/* ---------------- Confirm dialog with optional note ---------------- */
export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  tone?: 'success' | 'danger' | 'primary';
  requireNote?: boolean;
  notePlaceholder?: string;
  onConfirm: (note: string) => void;
  onClose: () => void;
}> = ({ open, title, message, confirmLabel, tone = 'primary', requireNote, notePlaceholder, onConfirm, onClose }) => {
  const [note, setNote] = React.useState('');
  useEffect(() => { if (open) setNote(''); }, [open]);
  const cls = { success: 'bg-emerald-600 hover:bg-emerald-500', danger: 'bg-rose-600 hover:bg-rose-500', primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950' }[tone];
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <button
          disabled={requireNote && !note.trim()}
          onClick={() => onConfirm(note)}
          className={`px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 ${cls}`}
        >{confirmLabel}</button>
      </>}>
      <div className="text-xs text-slate-300 leading-relaxed">{message}</div>
      <label className="block mt-3">
        <span className="text-[11px] text-slate-400">{requireNote ? 'الملاحظة / السبب (مطلوب)' : 'ملاحظة (اختياري)'}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={notePlaceholder}
          className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500" />
      </label>
    </Modal>
  );
};

/* ---------------- Buttons & inputs ---------------- */
export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'success' | 'danger' | 'ghost' | 'info'; icon?: React.ReactNode }> = ({ variant = 'primary', icon, className = '', children, ...rest }) => {
  const v = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    info: 'bg-sky-600 hover:bg-sky-500 text-white',
    ghost: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
  }[variant];
  return (
    <button {...rest} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${v} ${className}`}>
      {icon}{children}
    </button>
  );
};

export const Field: React.FC<{ label: string; hint?: React.ReactNode; error?: string; children: React.ReactNode; className?: string }> = ({ label, hint, error, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="text-[11px] font-semibold text-slate-300">{label}</span>
    <div className="mt-1">{children}</div>
    {hint && <span className="text-[10px] text-slate-400 block mt-0.5">{hint}</span>}
    {error && <span className="text-[10px] text-rose-400 block mt-0.5">{error}</span>}
  </label>
);

export const inputCls = 'w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 disabled:opacity-60';

/* ---------------- Status badge ---------------- */
const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: 'مسودة', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
  submitted: { label: 'مرفوع', cls: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  pm_approved: { label: 'اعتمده مدير المشروع', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  consultant_approved: { label: 'اعتمده الاستشاري', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  client_approved: { label: 'اعتمده المالك', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  disbursed: { label: 'مصروف', cls: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  rejected: { label: 'مرفوض', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  pending_pm: { label: 'بانتظار مدير المشروع', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  approved: { label: 'معتمد', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  po_issued: { label: 'صدر أمر الشراء', cls: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  supplier_confirmed: { label: 'أكد المورد التوريد', cls: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  delivered: { label: 'تم التسليم — بانتظار GRN', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  grn_received: { label: 'مستلم مخزنياً', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  proposed: { label: 'مسودة', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
  under_evaluation: { label: 'لدى الاستشاري', cls: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  approved_by_client: { label: 'معتمد من المالك', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  answered: { label: 'تم الرد', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  pending: { label: 'قيد المراجعة', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  paid: { label: 'مصروف', cls: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  open: { label: 'مفتوح', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  actioned: { label: 'تمت المعالجة', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  closed: { label: 'مغلق', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
};

export const StatusBadge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const s = statusMap[status] ?? { label: status, cls: 'text-slate-300 bg-slate-500/10 border-slate-500/30' };
  return <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${s.cls}`}>{label ?? s.label}</span>;
};

/* ---------------- Workflow stepper + history ---------------- */
export const WorkflowStepper: React.FC<{ steps: string[]; current: number; rejected?: boolean }> = ({ steps, current, rejected }) => (
  <ol className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
    {steps.map((s, i) => {
      const done = i < current, active = i === current;
      return (
        <li key={s} className="flex items-center gap-1 shrink-0">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
            rejected && active ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
              : done ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
              : active ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
              : 'border-slate-700 text-slate-500'}`}>
            {rejected && active ? <XCircle className="w-3 h-3" /> : done ? <CheckCircle2 className="w-3 h-3" /> : active ? <Clock className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            {s}
          </span>
          {i < steps.length - 1 && <span className="w-3 h-px bg-slate-700" />}
        </li>
      );
    })}
  </ol>
);

export const History: React.FC<{ items: WorkflowStep[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map((h, i) => (
      <li key={i} className="flex gap-2 text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
        <div>
          <span className="font-bold text-slate-200">{h.action}</span>
          <span className="text-slate-400"> — {h.byName} ({roleLabels[h.role]})</span>
          <span className="text-slate-500 block"><bdi dir="ltr">{new Date(h.at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</bdi></span>
          {h.note && <span className="text-slate-300 block bg-slate-950 border border-slate-800 rounded px-2 py-1 mt-0.5">{h.note}</span>}
        </div>
      </li>
    ))}
  </ul>
);

/* ---------------- Page header & empty / no-access ---------------- */
export const PageHeader: React.FC<{ icon?: React.ReactNode; title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }> = ({ icon, title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
    <div className="min-w-0">
      <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">{icon}<span>{title}</span></h1>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card: React.FC<{ title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, actions, children, className = '' }) => (
  <section className={`bg-slate-900 border border-slate-800 rounded-xl p-4 ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        {title && <h2 className="text-sm font-bold text-white flex items-center gap-2">{title}</h2>}
        {actions}
      </div>
    )}
    {children}
  </section>
);

export const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center text-xs text-slate-400 py-8 border border-dashed border-slate-700 rounded-xl">{text}</div>
);

export const NoAccess: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl" role="alert">
    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
      <Lock className="w-7 h-7 text-rose-400" />
    </div>
    <h1 className="text-lg font-bold text-white">ليس لديك صلاحية</h1>
    <p className="text-xs text-slate-400 mt-1 max-w-sm">هذه الشاشة غير متاحة لدورك الحالي. تواصل مع المدير التنفيذي إذا كنت تحتاج الوصول إليها.</p>
  </div>
);

export const fmt = (n: number, d = 0) => (Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 }) : '—');
export const pct = (n: number, d = 1) => `${Number.isFinite(n) ? n.toFixed(d) : '—'}%`;

/** Highlight + scroll to an element when opened from a notification / search */
export function useFocusHighlight(id: string | undefined, nonce: number | undefined) {
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-entity="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('entity-flash');
        setTimeout(() => el.classList.remove('entity-flash'), 2200);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [id, nonce]);
}
