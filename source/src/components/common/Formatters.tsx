import React from 'react';

interface FormattedNumberProps {
  value: number | string;
  unit?: string;
  prefix?: string;
  className?: string;
  numClassName?: string;
  unitClassName?: string;
}

export const FormattedNumber: React.FC<FormattedNumberProps> = ({
  value,
  unit,
  prefix,
  className = '',
  numClassName = 'font-mono tabular-nums text-slate-100',
  unitClassName = 'font-sans font-normal text-slate-400 text-[0.85em] select-none',
}) => {
  const formatted = typeof value === 'number' ? value.toLocaleString('en-US') : value;
  return (
    <span className={`inline-flex items-center gap-1 font-sans ${className}`}>
      {prefix && <span className="font-sans text-slate-400 font-normal">{prefix}</span>}
      <bdi dir="ltr" className={numClassName}>
        {formatted}
      </bdi>
      {unit && <span className={unitClassName}>{unit}</span>}
    </span>
  );
};

export const CodeBadge: React.FC<{ code: string; className?: string }> = ({ code, className = '' }) => (
  <bdi dir="ltr" className={`font-mono tabular-nums tracking-normal select-all ${className}`}>
    {code}
  </bdi>
);

export const DateBadge: React.FC<{ date: string; className?: string }> = ({
  date,
  className = 'font-mono tabular-nums text-slate-300',
}) => (
  <bdi dir="ltr" className={className}>
    {date}
  </bdi>
);
