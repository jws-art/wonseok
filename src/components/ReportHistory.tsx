import React, { useState } from "react";
import { DailyReport } from "../types";
import { Search, Calendar, Copy, Check, RotateCcw, Trash2, FileText } from "lucide-react";

interface ReportHistoryProps {
  reports: DailyReport[];
  onLoadReport: (report: DailyReport) => void;
  onDeleteReport: (id: string) => void;
}

export default function ReportHistory({ reports, onLoadReport, onDeleteReport }: ReportHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          report.generatedText.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full" id="report-history-panel">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-emerald-600" />
        작성 이력 및 아카이브
      </h2>

      {/* Search and Filters */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="대상자 이름 또는 작성 내용 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-gray-50/30"
          id="input-history-search"
        />
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto max-h-[400px] md:max-h-none space-y-3 pr-1" id="history-items-list">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-1" />
            <p className="text-xs">이력이 비어 있습니다.</p>
            <p className="text-[10px] text-gray-400 mt-0.5">새로운 데일리 리포트를 생성하고 저장하세요.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isSelected = selectedReportId === report.id;
            return (
              <div
                key={report.id}
                className={`border rounded-xl transition-all overflow-hidden ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/10 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
                id={`history-card-${report.id}`}
              >
                {/* Header Summary */}
                <div 
                  className="p-3 cursor-pointer flex items-center justify-between gap-2"
                  onClick={() => setSelectedReportId(isSelected ? null : report.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{report.clientName} 대상자</span>
                      <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.date}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {report.generatedText.replace(/\n/g, " ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopy(report.id, report.generatedText)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="텍스트 복사"
                      id={`btn-history-copy-${report.id}`}
                    >
                      {copiedId === report.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("이 리포트의 키워드와 설정을 그대로 불러와서 새로 작성하시겠습니까? 현재 작성 중인 내용은 덮어써집니다.")) {
                          onLoadReport(report);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="데이터 다시 불러오기"
                      id={`btn-history-load-${report.id}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("이 작성 이력을 영구적으로 삭제하시겠습니까?")) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="이력 삭제"
                      id={`btn-history-delete-${report.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="border-t border-gray-100 bg-gray-50/30 p-4 text-xs text-gray-700 space-y-3 animate-fade-in">
                    <div className="bg-white border border-gray-100 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed text-gray-800">
                      {report.generatedText}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-mono">
                      <span>생성일시: {new Date(report.createdAt).toLocaleString()}</span>
                      <span className="text-right">리포트 ID: {report.id.slice(0, 8)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
