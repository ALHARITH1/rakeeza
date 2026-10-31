import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { CompanyDocument } from '../../types';
import { 
  FolderArchive, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  FileText,
  ExternalLink,
  RefreshCw,
  XCircle,
  FileCheck2,
  Filter
} from 'lucide-react';
import { NumBdi, CodeBdi, DateBdi } from '../common/NumBdi';
import { EmptyState } from '../common/EmptyState';

type DocStatusFilter = 'all' | 'valid' | 'expiring_soon' | 'expired';

export const DocumentArchive: React.FC = () => {
  const { companyDocs, transmittals, selectedProjectId, selectedProject } = usePlatform();
  const [activeSubTab, setActiveSubTab] = useState<'legal' | 'transmittals' | 'drawings'>('legal');
  const [docFilter, setDocFilter] = useState<DocStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filter & Sort company documents: Closest to expiration first (daysRemaining ascending)
  const sortedAndFilteredDocs = useMemo(() => {
    let docs = [...companyDocs];

    // Filter by quick status
    if (docFilter === 'valid') {
      docs = docs.filter(d => d.daysRemaining > 30);
    } else if (docFilter === 'expiring_soon') {
      docs = docs.filter(d => d.daysRemaining > 0 && d.daysRemaining <= 30);
    } else if (docFilter === 'expired') {
      docs = docs.filter(d => d.daysRemaining <= 0);
    }

    // Filter by text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      docs = docs.filter(d => 
        d.title.toLowerCase().includes(q) ||
        d.documentNumber.toLowerCase().includes(q) ||
        d.issuingAuthority.toLowerCase().includes(q)
      );
    }

    // Sort by daysRemaining ascending (closest to expire first)
    return docs.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [companyDocs, docFilter, searchQuery]);

  const projectTransmittals = useMemo(() => {
    return transmittals.filter(t => t.projectId === selectedProjectId);
  }, [transmittals, selectedProjectId]);

  const filteredTransmittals = useMemo(() => {
    if (!searchQuery.trim()) return projectTransmittals;
    const q = searchQuery.toLowerCase().trim();
    return projectTransmittals.filter(t => 
      t.subject.toLowerCase().includes(q) || 
      t.refNumber.toLowerCase().includes(q) ||
      t.sender.toLowerCase().includes(q) ||
      t.recipient.toLowerCase().includes(q)
    );
  }, [projectTransmittals, searchQuery]);

  const handleActionToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Action Toast Feedback */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-amber-400" />
            <span>إدارة الوثائق والمستندات والأرشيف الهندسي (DMS & Transmittals)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedProject.name} — متابعة صلاحية السجلات الرسمية مع رادار التنبيه المبكر، وسجل المراسلات والمخططات
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
          <button
            onClick={() => { setActiveSubTab('legal'); setSearchQuery(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'legal' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            السجلات الرسمية والشهادات
          </button>
          <button
            onClick={() => { setActiveSubTab('transmittals'); setSearchQuery(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'transmittals' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            سجل المراسلات (Transmittals)
          </button>
          <button
            onClick={() => { setActiveSubTab('drawings'); setSearchQuery(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'drawings' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            المخططات واعتمادات المواد
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Legal & Company Documents */}
      {activeSubTab === 'legal' && (
        <div className="space-y-4">
          {/* Radar Alert Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                رادار التنبيهات المبكرة: وثيقة تأمين أخطار المقاولين (CAR) يتبقى على انتهائها <strong>15 يوماً فقط</strong>.
              </span>
            </div>
            <button
              onClick={() => handleActionToast('تم إرسال طلب تجديد فوري لشركة التعاونية للتأمين وإشعار الإدارة المالية بنجاح')}
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>طلب تجديد فوري</span>
            </button>
          </div>

          {/* Quick Filter Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            {/* Quick Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-medium pl-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3 text-slate-500" />
                <span>الحالة:</span>
              </span>
              <button
                onClick={() => setDocFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                  docFilter === 'all' 
                    ? 'bg-slate-800 text-white border border-slate-700' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل ({companyDocs.length})
              </button>
              <button
                onClick={() => setDocFilter('valid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 shrink-0 ${
                  docFilter === 'valid' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>ساري ({companyDocs.filter(d => d.daysRemaining > 30).length})</span>
              </button>
              <button
                onClick={() => setDocFilter('expiring_soon')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 shrink-0 ${
                  docFilter === 'expiring_soon' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>قريب الانتهاء ({companyDocs.filter(d => d.daysRemaining > 0 && d.daysRemaining <= 30).length})</span>
              </button>
              <button
                onClick={() => setDocFilter('expired')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 shrink-0 ${
                  docFilter === 'expired' 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                <XCircle className="w-3 h-3 text-rose-400" />
                <span>منتهي ({companyDocs.filter(d => d.daysRemaining <= 0).length})</span>
              </button>
            </div>

            {/* Document Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الوثيقة أو الاسم أو الجهة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Document Cards Grid - Strict 5-Field Ordering */}
          {sortedAndFilteredDocs.length === 0 ? (
            <EmptyState
              icon={FolderArchive}
              title="لا توجد وثائق مطابقة"
              description="لم يتم العثور على أي وثيقة وفق معايير التصفية الحالية. يمكنك إعادة تعيين الفلتر للاطلاع على كافة الوثائق."
              actionLabel="إعادة تعيين الفلتر"
              onAction={() => { setDocFilter('all'); setSearchQuery(''); }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAndFilteredDocs.map((doc) => {
                const isExpired = doc.daysRemaining <= 0;
                const isExpiring = doc.daysRemaining > 0 && doc.daysRemaining <= 30;
                const isValid = doc.daysRemaining > 30;

                return (
                  <div 
                    key={doc.id}
                    className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition hover:border-slate-700 space-y-3.5 ${
                      isExpired 
                        ? 'border-rose-500/40 bg-rose-950/10' 
                        : isExpiring 
                          ? 'border-amber-500/40 bg-amber-950/10' 
                          : 'border-slate-800'
                    }`}
                  >
                    {/* 1. العنوان + الرقم */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-white text-xs leading-snug">
                          {doc.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>رقم الوثيقة:</span>
                        <CodeBdi code={doc.documentNumber} className="text-amber-400 font-semibold" />
                      </div>
                    </div>

                    {/* 2. الجهة المصدرة */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.issuingAuthority}</span>
                    </div>

                    {/* 3. الحالة مع الأيام المتبقية (Icon + Text) */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">حالة الصلاحية:</span>
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>منتهية الصلاحية</span>
                        </span>
                      ) : isExpiring ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>يقترب من الانتهاء (متبقي {doc.daysRemaining} يوم)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>سارية (متبقي {doc.daysRemaining} يوم)</span>
                        </span>
                      )}
                    </div>

                    {/* 4. تاريخ الإصدار وتاريخ الانتهاء */}
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <span>الإصدار:</span>
                        <DateBdi date={doc.issueDate} />
                      </div>
                      <div className="flex items-center gap-1 text-slate-200 text-[11px] font-semibold">
                        <span className="text-slate-400">الانتهاء:</span>
                        <DateBdi date={doc.expiryDate} className="text-amber-300 font-mono" />
                      </div>
                    </div>

                    {/* 5. زر الإجراء */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500">توثيق رقمي فوري</span>
                      <button
                        onClick={() => handleActionToast(`تم فتح وثيقة: ${doc.title} (${doc.documentNumber})`)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-semibold text-xs transition flex items-center gap-1 active:scale-95"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>معاينة الوثيقة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Transmittals Log */}
      {activeSubTab === 'transmittals' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الخطاب أو الموضوع أو الجهة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div className="text-xs text-slate-400">
              إجمالي الخطابات: <NumBdi value={filteredTransmittals.length} unit="خطاب" numClassName="font-mono tabular-nums text-white font-bold" />
            </div>
          </div>

          {filteredTransmittals.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="لا توجد مراسلات مسجلة"
              description="لم يتم العثور على أي خطابات أو مراسلات هندسية مطابقة لعبارة البحث الحالية."
              actionLabel="مسح البحث"
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <div className="space-y-3">
              {filteredTransmittals.map((tr) => (
                <div key={tr.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CodeBdi 
                        code={tr.refNumber} 
                        className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                      />
                      <span className="font-bold text-white text-xs">{tr.subject}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs shrink-0">
                      {tr.direction === 'outgoing' ? (
                        <span className="text-sky-400 bg-sky-500/10 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] border border-sky-500/20">
                          <ArrowUpRight className="w-3 h-3" /> صادر
                        </span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-500/10 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] border border-emerald-500/20">
                          <ArrowDownLeft className="w-3 h-3" /> وارد
                        </span>
                      )}
                      <DateBdi date={tr.date} className="text-slate-400 text-xs" />
                    </div>
                  </div>

                  <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                    <div>من: <strong className="text-white">{tr.sender}</strong> &larr; إلى: <strong className="text-white">{tr.recipient}</strong></div>
                    <div className="text-slate-400">الإجراء المطلوب: <strong className="text-amber-300 font-sans">{tr.actionRequired}</strong></div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/80">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>معتمد مع الملاحظات الهندسية</span>
                    </span>
                    <button
                      onClick={() => handleActionToast(`تم تنزيل الخطاب الرسمي ومرفقاته: ${tr.refNumber}`)}
                      className="text-sky-400 hover:text-sky-300 font-semibold text-xs flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>تحميل الخطاب والمرفقات (PDF)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Shop Drawings & Material Submittals */}
      {activeSubTab === 'drawings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">الأرشيف الهندسي للمخططات التنفيذية (Shop Drawings) واعتمادات المواد</h2>
              <p className="text-xs text-slate-400 mt-0.5">متابعة نسخ المخططات المعتمدة من الاستشاري والمواصفات الفنية للمشروع</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>كافة المخططات محدثة للمراجعة 03</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-start font-bold text-white">
                <span>مخطط مسار كابلات 33 ك.ف - شارع التخصصي (Rev 03)</span>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  معتمد
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <CodeBdi code="DWG-SEC-RYD-04-A" className="text-amber-400 font-semibold pl-1" />
                : يوضح عمق الدفن 1.2م وتفاصيل غرف السحب ومواقع المحولات.
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">تاريخ الاعتماد: <DateBdi date="2026-05-18" /></span>
                <button 
                  onClick={() => handleActionToast('تم فتح المخطط الهندسي DWG-SEC-RYD-04-A للمعاينة')}
                  className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>معاينة المخطط (DWG/PDF)</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-start font-bold text-white">
                <span>اعتماد مادة الأنابيب البلاستيكية HDPE قطر 160مم</span>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  Code A
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <CodeBdi code="SUB-MAT-HDPE-01" className="text-amber-400 font-semibold pl-1" />
                : شهادة مصنع الأنابيب السعودية واختبار الضغط الهيدروليكي 10 بار.
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">تاريخ الاعتماد: <DateBdi date="2026-05-10" /></span>
                <button 
                  onClick={() => handleActionToast('تم فتح شهادة ومواصفة اعتماد المادة SUB-MAT-HDPE-01')}
                  className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>معاينة ملف الاعتماد</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
