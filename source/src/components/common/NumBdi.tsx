import React from 'react';

interface NumBdiProps {
  value: number | string;
  unit?: string;
  prefix?: string;
  className?: string;
  numClassName?: string;
  unitClassName?: string;
}

/**
 * NumBdi: Formats numbers and currency with guaranteed LTR isolation and tabular numbers,
 * while keeping Arabic units (e.g. ر.س, م.ط, ساعة) strictly in the Cairo sans-serif font
 * with normal letter spacing to prevent disjointed Arabic characters.
 */
export const NumBdi: React.FC<NumBdiProps> = ({
  value,
  unit,
  prefix,
  className = '',
  numClassName = 'font-mono tabular-nums text-slate-100',
  unitClassName = 'font-sans font-normal text-slate-400 text-[0.85em] select-none'
}) => {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US') : value;

  // Percentages are rendered as one LTR token: "72.4%" (never "% 72.4")
  if (unit === '%') {
    return (
      <span className={`inline-flex items-center font-sans ${className}`}>
        {prefix && <span className="font-sans text-slate-400 font-normal ml-1">{prefix}</span>}
        <bdi dir="ltr" className={numClassName}>{formattedValue}%</bdi>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-sans ${className}`}>
      {prefix && <span className="font-sans text-slate-400 font-normal">{prefix}</span>}
      <bdi dir="ltr" className={numClassName}>
        {formattedValue}
      </bdi>
      {unit && <span className={unitClassName}>{unit}</span>}
    </span>
  );
};

interface CodeBdiProps {
  code: string;
  className?: string;
}

/**
 * CodeBdi: Isolates alphanumeric reference codes (e.g., CR-1010892019, PTW-088)
 * inside a <bdi dir="ltr"> with tabular monospace styling.
 */
export const CodeBdi: React.FC<CodeBdiProps> = ({ code, className = '' }) => {
  return (
    <bdi dir="ltr" className={`font-mono tabular-nums tracking-normal select-all ${className}`}>
      {code}
    </bdi>
  );
};

interface DateBdiProps {
  date: string;
  className?: string;
}

/**
 * DateBdi: Isolates dates (e.g. 2026-05-15) inside LTR bdi with tabular-nums.
 */
export const DateBdi: React.FC<DateBdiProps> = ({ date, className = 'font-mono tabular-nums text-slate-300' }) => {
  return (
    <bdi dir="ltr" className={className}>
      {date}
    </bdi>
  );
};
