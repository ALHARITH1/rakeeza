import React from 'react';

interface SkeletonProps {
  className?: string;
  rows?: number;
}

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => {
  return (
    <div className={`animate-pulse bg-slate-800/60 rounded-lg ${className}`} />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = 'h-36' }) => {
  return (
    <div className={`p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-pulse ${className}`}>
      <div className="flex justify-between items-center">
        <div className="h-4 w-1/3 bg-slate-800 rounded" />
        <div className="h-4 w-16 bg-slate-800 rounded" />
      </div>
      <div className="h-5 w-2/3 bg-slate-800 rounded" />
      <div className="h-8 w-full bg-slate-800/70 rounded" />
    </div>
  );
};

export const SkeletonTable: React.FC<SkeletonProps> = ({ rows = 4, className = '' }) => {
  return (
    <div className={`border border-slate-800 rounded-xl bg-slate-900 p-4 space-y-3 animate-pulse ${className}`}>
      <div className="h-6 w-1/4 bg-slate-800 rounded mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-4 w-12 bg-slate-800 rounded" />
          <div className="h-4 flex-1 bg-slate-800 rounded" />
          <div className="h-4 w-24 bg-slate-800 rounded" />
          <div className="h-4 w-20 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
};
