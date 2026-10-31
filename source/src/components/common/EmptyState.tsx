import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-slate-200">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-sm active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
