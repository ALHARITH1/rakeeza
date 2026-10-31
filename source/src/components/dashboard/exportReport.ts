import { ProjectHealthRow, forecastCompletion, formatDateAr, healthLabels } from './healthMetrics';

const statusAr: Record<string, string> = {
  ongoing: 'جاري التنفيذ',
  near_completion: 'قرب الإنجاز',
  delayed: 'متأخر',
  completed: 'مكتمل'
};

const stamp = () => new Date().toISOString().slice(0, 10);

function download(name: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export — UTF-8 with BOM so Excel shows Arabic correctly */
export function exportCsv(rows: ProjectHealthRow[], company?: { name: string; logoDataUrl?: string; brandColor?: string }) {
  const lines: string[] = [];
  lines.push([`تقرير مؤشرات المشاريع والبيانات المالية — ${company?.name ?? ''}`, `تاريخ التصدير: ${stamp()}`].map(csvCell).join(','));
  lines.push('');
  lines.push(
    [
      'المشروع', 'الموقع', 'المالك', 'الاستشاري', 'قيمة العقد (ر.س)', 'التكلفة الفعلية (ر.س)',
      'القيمة المكتسبة (ر.س)', 'استهلاك الميزانية %', 'الإنجاز المادي %', 'الإنجاز المخطط %',
      'الإنجاز المالي %', 'SPI', 'CPI', 'الحالة', 'مؤشر الصحة', 'عدد التنبيهات',
      'تاريخ البداية', 'تاريخ الانتهاء التعاقدي', 'التسليم المتوقع', 'أيام التأخير المتوقعة'
    ].map(csvCell).join(',')
  );
  rows.forEach((r) => {
    const p = r.project;
    const f = forecastCompletion(p);
    lines.push(
      [
        p.name, p.location, p.client, p.consultant, p.contractValue, p.actualCost,
        Math.round(r.earnedValue), r.budgetUtilization.toFixed(1), p.physicalProgress, p.plannedProgress,
        p.financialProgress, r.spi.toFixed(2), r.cpi.toFixed(2), statusAr[p.status], healthLabels[r.level],
        r.alerts.length, p.startDate, p.endDate, f.forecastDate.toISOString().slice(0, 10), f.delayDays
      ].map(csvCell).join(',')
    );
  });

  lines.push('');
  lines.push(['الميزانية مقابل الصرف الفعلي (تراكمي)'].map(csvCell).join(','));
  lines.push(['المشروع', 'الشهر', 'الميزانية المخططة (ر.س)', 'الصرف الفعلي (ر.س)', 'الفرق (ر.س)'].map(csvCell).join(','));
  rows.forEach((r) =>
    r.project.financialTimeline.forEach((t) =>
      lines.push([r.project.name, t.month, t.budget, t.actual, t.actual - t.budget].map(csvCell).join(','))
    )
  );

  lines.push('');
  lines.push(['التنبيهات المفتوحة'].map(csvCell).join(','));
  lines.push(['المشروع', 'النوع', 'العنوان', 'التفاصيل'].map(csvCell).join(','));
  rows.forEach((r) =>
    r.alerts.forEach((a) =>
      lines.push([r.project.name, a.kind === 'budget' ? 'ميزانية' : 'مهمة حرجة', a.title, a.detail].map(csvCell).join(','))
    )
  );

  download(`Projects-Report-${stamp()}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n));
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/**
 * PDF export — renders a print-ready Arabic RTL report in a new window and opens
 * the browser's "Save as PDF" dialog (keeps Arabic shaping perfect, no font embedding issues).
 */
export function exportPdf(rows: ProjectHealthRow[], company?: { name: string; logoDataUrl?: string; brandColor?: string }) {
  const totalContract = rows.reduce((a, r) => a + r.project.contractValue, 0);
  const totalActual = rows.reduce((a, r) => a + r.project.actualCost, 0);
  const totalEv = rows.reduce((a, r) => a + r.earnedValue, 0);
  const alerts = rows.flatMap((r) => r.alerts.map((a) => ({ ...a, project: r.project.name })));

  const projectRows = rows
    .map((r) => {
      const p = r.project;
      const f = forecastCompletion(p);
      return `<tr>
        <td><b>${esc(p.name)}</b><div class="muted">${esc(p.location)}</div></td>
        <td class="num">${fmt(p.contractValue)}</td>
        <td class="num">${fmt(p.actualCost)}</td>
        <td class="num">${r.budgetUtilization.toFixed(1)}%</td>
        <td class="num">${p.physicalProgress}% / ${p.plannedProgress}%</td>
        <td class="num">${r.spi.toFixed(2)}</td>
        <td class="num ${r.cpi < 1 ? 'bad' : 'good'}">${r.cpi.toFixed(2)}</td>
        <td>${healthLabels[r.level]}</td>
        <td>${formatDateAr(f.forecastDate)}<div class="muted">${f.delayDays > 0 ? '+' : ''}${f.delayDays} يوم</div></td>
      </tr>`;
    })
    .join('');

  const finRows = rows
    .map(
      (r) => `<h3>${esc(r.project.name)}</h3>
      <table><thead><tr><th>الشهر</th><th>الميزانية المخططة</th><th>الصرف الفعلي</th><th>الفرق</th></tr></thead><tbody>
      ${r.project.financialTimeline
        .map(
          (t) => `<tr><td>${t.month}</td><td class="num">${fmt(t.budget)}</td><td class="num">${fmt(t.actual)}</td>
          <td class="num ${t.actual > t.budget ? 'bad' : 'good'}">${fmt(t.actual - t.budget)}</td></tr>`
        )
        .join('')}
      </tbody></table>`
    )
    .join('');

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
  <title>${esc(company?.name ?? 'Report')} — ${stamp()}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    @page{size:A4 landscape;margin:14mm}
    body{font-family:Cairo,Tahoma,sans-serif;color:#0f172a;font-size:11px;margin:0}
    h1{font-size:18px;margin:0}h2{font-size:13px;margin:18px 0 6px;border-bottom:2px solid ${company?.brandColor ?? '#f59e0b'};padding-bottom:4px}
    h3{font-size:11px;margin:10px 0 4px}
    .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #0f172a;padding-bottom:8px}
    .muted{color:#64748b;font-size:9.5px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
    .kpi{border:1px solid #cbd5e1;border-radius:8px;padding:8px}.kpi b{display:block;font-size:15px}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    th{background:#0f172a;color:#fff;font-weight:600;padding:5px;text-align:right}
    td{border-bottom:1px solid #e2e8f0;padding:5px;vertical-align:top}
    .num{font-family:Consolas,monospace;direction:ltr;text-align:right;white-space:nowrap}
    .bad{color:#e11d48;font-weight:700}.good{color:#059669;font-weight:700}
    .fin{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  </style></head><body>
  <div class="head"><div style="display:flex;gap:10px;align-items:center">${company?.logoDataUrl ? `<img src="${esc(company.logoDataUrl)}" style="height:46px;max-width:120px;object-fit:contain">` : ''}<div><h1>تقرير مؤشرات المشاريع والبيانات المالية</h1>
  <div class="muted">${esc(company?.name ?? '')}</div></div></div>
  <div class="muted">تاريخ التقرير: ${formatDateAr(new Date())}</div></div>
  <div class="kpis">
    <div class="kpi">المشاريع النشطة<b>${rows.length}</b></div>
    <div class="kpi">إجمالي قيمة العقود<b class="num">${fmt(totalContract)} ر.س</b></div>
    <div class="kpi">استهلاك الميزانية<b>${((totalActual / totalContract) * 100).toFixed(1)}%</b><span class="muted">${fmt(totalActual)} ر.س</span></div>
    <div class="kpi">مؤشر أداء التكلفة CPI<b class="${totalEv / totalActual < 1 ? 'bad' : 'good'}">${(totalEv / totalActual).toFixed(2)}</b></div>
  </div>
  <h2>المقارنة التشغيلية والمالية</h2>
  <table><thead><tr><th>المشروع</th><th>قيمة العقد</th><th>التكلفة الفعلية</th><th>الاستهلاك</th><th>الإنجاز فعلي/مخطط</th><th>SPI</th><th>CPI</th><th>الصحة</th><th>التسليم المتوقع</th></tr></thead>
  <tbody>${projectRows}</tbody></table>
  <h2>الميزانية مقابل الصرف الفعلي (ر.س تراكمي)</h2><div class="fin">${finRows}</div>
  <h2>التنبيهات المفتوحة (${alerts.length})</h2>
  <table><thead><tr><th>المشروع</th><th>النوع</th><th>التنبيه</th><th>التفاصيل</th></tr></thead><tbody>
  ${alerts.map((a) => `<tr><td>${esc(a.project)}</td><td class="${a.kind === 'budget' ? 'bad' : ''}">${a.kind === 'budget' ? 'ميزانية' : 'مهمة حرجة'}</td><td>${esc(a.title)}</td><td>${esc(a.detail)}</td></tr>`).join('')}
  </tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    // Popup blocked → fall back to downloading the HTML report
    download(`Projects-Report-${stamp()}.html`, html, 'text/html;charset=utf-8');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
