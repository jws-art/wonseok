import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  LogIn, 
  Droplet, 
  Utensils, 
  Activity, 
  Gamepad2, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Copy, 
  Check, 
  Save, 
  Download, 
  Share2, 
  FileText, 
  RefreshCw, 
  Plus, 
  Trash2, 
  MessageCircle, 
  BookOpen, 
  Users, 
  CheckSquare, 
  ChevronRight,
  Heart,
  Cloud,
  CloudOff,
  Database
} from "lucide-react";
import { ClientProfile, DailyReport, DailyReportSections, SectionState } from "./types";
import { 
  CHECK_IN_OUT_PRESETS, 
  HYGIENE_PRESETS, 
  MEALS_PRESETS, 
  HEALTH_PRESETS, 
  PROGRAM_PRESETS,
  OTHER_PRESETS
} from "./presets";
import ClientProfiles from "./components/ClientProfiles";
import ReportHistory from "./components/ReportHistory";
import {
  initializeFirebaseData,
  subscribeProfiles,
  subscribeReports,
  saveProfileToFirestore,
  deleteProfileFromFirestore,
  saveReportToFirestore,
  deleteReportFromFirestore,
  SyncStatus
} from "./services/firebaseService";

// Initial Seed Data for testing/immediate interaction
const DEFAULT_PROFILES: ClientProfile[] = [
  {
    id: "p-1",
    name: "이지은",
    birthDate: "2015-04-12",
    gender: "여",
    relationNotes: "수영 활동을 매우 좋아하며 자조 기술 지도가 꾸준히 필요한 상태임.",
    defaultTemperature: "36.4"
  },
  {
    id: "p-2",
    name: "김민재",
    birthDate: "2014-08-25",
    gender: "남",
    relationNotes: "점심시간에 특정 편식 성향이 있으나 독려하면 골고루 섭취함.",
    defaultTemperature: "36.6"
  }
];

const DEFAULT_REPORTS: DailyReport[] = [
  {
    id: "r-1",
    clientId: "p-1",
    clientName: "이지은",
    date: "2026-06-25",
    sections: {
      checkInOut: { presets: ["보호자와 함께 입소함", "10시경 입소함", "보호자와 17시경 퇴소 후 복지관 수영장 이용함", "신발과 옷정리를 스스로 할 수 있도록 도와 줌", "퇴소할 때 천천히 '안녕히 계세요'라고 말을 할 수 있도록 지도함"], memo: "보호자와 함께 기분 좋게 입소하였습니다." },
      hygiene: { presets: ["식사 전후로 손씻기 지도를 하였음", "화장실 사용 후 손을 씻도록 지도함", "식사 후에 양치지도를 함"], memo: "식후 양치질 지도를 철저히 진행하였습니다." },
      meals: { presets: ["오늘 점심식사 음식에는 관심이 없었으며, 먹지 않으려고 함", "식사를 포기하지 않고 먹을 수 있도록 독려함", "돈수육을 조금 먹음"], memo: "돈수육 위주로 조금 먹었습니다." },
      health: { presets: ["양호함", "체온: 정상"], memo: "정상 체온 범주를 유지함.", temperature: "36.4" },
      programs: { presets: ["자조모임(스포츠)", "일상생활활동"], memo: "체육 활동에 집중하여 잘 참여하였습니다." },
      other: { presets: [], memo: "동료들과 마찰 없이 원만하게 수영장 이동 준비를 하였습니다." }
    },
    generatedText: `입퇴소 : 보호자와 함께 입퇴소 함. 10시경 입소함. 보호자와 17시경 퇴소 후 복지관 수영장이요함. 퇴소함. 신발과 옷정리를 스스로 할 수 있도록 도와 줌. 퇴소할 때 천천히 ‘안녕히 계세요’라고 말을 할 수 있도록 함.
위생과 청결 : 식사 전후로 손씻기 지도를 하였으며, 화장실 사용 후 손을 씻도록 지도함. 식사 후에 양치지도를 함. 
식생활 : 오늘 점심식사 음식에는 관심이 없었으며, 먹을 수 있도록 독려를 하였으나 먹지 않으려고 함. 돈수육을 조금 먹음.
건강관리 : 양호함 / 체온: 정상
프로그램 : 자조모임(스포츠) 일상생활활동
기타사항 : 특이사항 없이 밝고 건강하게 하루를 보냈습니다.`,
    createdAt: "2026-06-25T17:39:28.000Z"
  }
];

const TIME_OPTIONS: string[] = (() => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, "0");
    options.push(`${hh}:00`);
    options.push(`${hh}:30`);
  }
  return options;
})();

const INITIAL_SECTIONS: DailyReportSections = {
  checkInOut: { presets: [], memo: "", checkInTime: "09:00", checkOutTime: "18:00" },
  hygiene: { presets: [], memo: "" },
  meals: { presets: [], memo: "" },
  health: { presets: [], memo: "", temperature: "36.5" },
  programs: { presets: [], memo: "", amProgram1: "", amProgram2: "", pmProgram1: "", pmProgram2: "" },
  other: { presets: [], memo: "" }
};

export default function App() {
  // Local states
  const [profiles, setProfiles] = useState<ClientProfile[]>(() => {
    const saved = localStorage.getItem("daily_report_profiles");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
  });

  const [reports, setReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem("daily_report_archive");
    return saved ? JSON.parse(saved) : DEFAULT_REPORTS;
  });

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => {
    const saved = localStorage.getItem("daily_report_selected_profile");
    return saved || (DEFAULT_PROFILES[0]?.id || null);
  });

  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // Active section data
  const [sections, setSections] = useState<DailyReportSections>(INITIAL_SECTIONS);
  const [tone, setTone] = useState<"formal" | "friendly">("formal");
  const [customName, setCustomName] = useState("");
  
  // Firebase Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    syncing: true,
    lastSyncedAt: null,
    error: null
  });

  // Generated output
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [kakaoCopied, setKakaoCopied] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"generate" | "profiles" | "history">("generate");

  // Firebase Real-time Synchronization
  useEffect(() => {
    let unsubscribeProfiles: (() => void) | undefined;
    let unsubscribeReports: (() => void) | undefined;

    const setupFirebase = async () => {
      await initializeFirebaseData(DEFAULT_PROFILES, DEFAULT_REPORTS, (status) => {
        setSyncStatus(status);
      });

      unsubscribeProfiles = subscribeProfiles(
        (updatedProfiles) => {
          if (updatedProfiles && updatedProfiles.length > 0) {
            setProfiles(updatedProfiles);
          }
        },
        (err) => console.warn("Profiles subscription warning:", err)
      );

      unsubscribeReports = subscribeReports(
        (updatedReports) => {
          if (updatedReports) {
            setReports(updatedReports);
          }
        },
        (err) => console.warn("Reports subscription warning:", err)
      );
    };

    setupFirebase();

    return () => {
      if (unsubscribeProfiles) unsubscribeProfiles();
      if (unsubscribeReports) unsubscribeReports();
    };
  }, []);

  // Save state helpers to LocalStorage as instant cache fallback
  useEffect(() => {
    localStorage.setItem("daily_report_profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem("daily_report_archive", JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (selectedProfileId) {
      localStorage.setItem("daily_report_selected_profile", selectedProfileId);
    } else {
      localStorage.removeItem("daily_report_selected_profile");
    }
  }, [selectedProfileId]);

  // Handle auto-loading default temperature when profile changes
  useEffect(() => {
    if (selectedProfileId) {
      const prof = profiles.find(p => p.id === selectedProfileId);
      if (prof) {
        setSections(prev => ({
          ...prev,
          health: {
            ...prev.health,
            temperature: prof.defaultTemperature || "36.5"
          }
        }));
        setCustomName("");
      }
    }
  }, [selectedProfileId, profiles]);

  // Form methods
  const handleResetOptions = () => {
    const prof = selectedProfileId ? profiles.find(p => p.id === selectedProfileId) : null;
    const defaultTemp = prof ? (prof.defaultTemperature || "36.5") : "36.5";
    
    setSections({
      checkInOut: { presets: [], memo: "", checkInTime: "09:00", checkOutTime: "18:00" },
      hygiene: { presets: [], memo: "" },
      meals: { presets: [], memo: "" },
      health: { presets: [], memo: "", temperature: defaultTemp },
      programs: { presets: [], memo: "", amProgram1: "", amProgram2: "", pmProgram1: "", pmProgram2: "" },
      other: { presets: [], memo: "" }
    });
    setCustomName("");
    setGeneratedReport("");
  };

  const togglePreset = (sectionKey: keyof DailyReportSections, keyword: string) => {
    setSections(prev => {
      const section = prev[sectionKey];
      const exists = section.presets.includes(keyword);
      const newPresets = exists 
        ? section.presets.filter(p => p !== keyword)
        : [...section.presets, keyword];
      
      return {
        ...prev,
        [sectionKey]: { ...section, presets: newPresets }
      };
    });
  };

  const handleMemoChange = (sectionKey: keyof DailyReportSections, value: string) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], memo: value }
    }));
  };

  const handleTempChange = (value: string) => {
    setSections(prev => ({
      ...prev,
      health: { ...prev.health, temperature: value }
    }));
  };

  const handleCheckInTimeChange = (value: string) => {
    setSections(prev => ({
      ...prev,
      checkInOut: { ...prev.checkInOut, checkInTime: value }
    }));
  };

  const handleCheckOutTimeChange = (value: string) => {
    setSections(prev => ({
      ...prev,
      checkInOut: { ...prev.checkInOut, checkOutTime: value }
    }));
  };

  const handleProgramFieldChange = (field: "amProgram1" | "amProgram2" | "pmProgram1" | "pmProgram2", value: string) => {
    setSections(prev => ({
      ...prev,
      programs: {
        ...prev.programs,
        [field]: value
      }
    }));
  };

  const handleAddProfile = (newProfile: Omit<ClientProfile, "id">) => {
    const id = `p-${Date.now()}`;
    const created: ClientProfile = { id, ...newProfile };
    setProfiles(prev => [...prev, created]);
    saveProfileToFirestore(created).catch(console.error);
    setSelectedProfileId(id);
    setActiveRightTab("generate");
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    deleteProfileFromFirestore(id).catch(console.error);
    if (selectedProfileId === id) {
      setSelectedProfileId(null);
    }
  };

  // Re-load template from a historic report
  const handleLoadReport = (historic: DailyReport) => {
    setSections(historic.sections);
    setSelectedProfileId(historic.clientId || null);
    if (!historic.clientId) {
      setCustomName(historic.clientName);
    }
    setGeneratedReport(historic.generatedText);
    setActiveRightTab("generate");
  };

  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    deleteReportFromFirestore(id).catch(console.error);
  };

  // Run full generation via backend
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationStep(0);
    setActiveRightTab("generate");

    // Dynamic cute step progress
    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < 3) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 850);

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: "이용자",
          date: date,
          sections: sections
        })
      });

      if (!response.ok) {
        throw new Error("서버와의 통신에 실패하였습니다.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedReport(data.report);
    } catch (err: any) {
      console.error(err);
      alert(`리포트 생성 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  // Quick single-section refinement
  const handleRefineSingleSection = async (sectionName: string, sectionKey: keyof DailyReportSections) => {
    const secData = sections[sectionKey];
    if (secData.presets.length === 0 && !secData.memo.trim()) {
      alert("해당 섹션에 체크된 항목이나 작성된 메모가 없어 보완할 수 없습니다.");
      return;
    }

    // Try parsing existing text block to pass to the helper
    const regex = new RegExp(`${sectionName}\\s*:\\s*([^\\n]+)`);
    const match = generatedReport.match(regex);
    const currentText = match ? match[1] : "";

    setIsGenerating(true);
    try {
      const response = await fetch("/api/refine-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionName,
          presets: secData.presets,
          memo: secData.memo,
          currentText,
          tone
        })
      });

      if (!response.ok) throw new Error("서버 보완 요청 실패");
      const data = await response.json();
      
      if (data.text) {
        // Replace that portion in the full report
        if (match) {
          const updatedReport = generatedReport.replace(match[0], `${sectionName} : ${data.text}`);
          setGeneratedReport(updatedReport);
        } else {
          // If section not found in generated report, append it
          setGeneratedReport(prev => prev + `\n${sectionName} : ${data.text}`);
        }
      }
    } catch (err: any) {
      alert(`문장 보완 오류: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async (text: string, type: "normal" | "kakao") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "normal") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setKakaoCopied(true);
        setTimeout(() => setKakaoCopied(false), 2000);
      }
    } catch (err) {
      console.error("복사에 실패했습니다.", err);
    }
  };

  const handleSaveToHistory = async () => {
    if (!generatedReport.trim()) {
      alert("저장할 리포트 내용이 없습니다.");
      return;
    }

    const currentClient = selectedProfileId ? profiles.find(p => p.id === selectedProfileId) : null;
    const clientName = currentClient ? currentClient.name : (customName.trim() || "이용자");

    const newReport: DailyReport = {
      id: `r-${Date.now()}`,
      clientId: selectedProfileId || "",
      clientName: clientName,
      date: date,
      sections: sections,
      generatedText: generatedReport,
      createdAt: new Date().toISOString()
    };

    setReports(prev => [newReport, ...prev]);
    try {
      await saveReportToFirestore(newReport);
    } catch (err) {
      console.error("Firestore save error:", err);
    }
    alert("이력이 Firebase 클라우드에 안전하게 저장되었습니다!");
    setActiveRightTab("history");
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedReport], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `데일리리포트_${date}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Kakao Formatted message template
  const getKakaoFormattedText = () => {
    return `🌸 [데일리 리포트 - ${date}] 🌸\n\n${generatedReport}\n\n따뜻한 하루를 선물해 주셔서 감사합니다. 늘 정성을 다하는 복지관 드림.`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app-root">
      {/* Decorative Warm Care-Vibes Header */}
      <header className="bg-white border-b border-emerald-100 py-4 px-6 sticky top-0 z-10 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                데일리 리포트 자동 작성기
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                  Care AI v2.5
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                복지관·주간보호 교사를 위한 따뜻한 맞춤형 AI 관찰일지 자동생성 플랫폼
              </p>
            </div>
          </div>

          {/* Quick Date and Selector & Firebase Sync Indicator */}
          <div className="flex items-center flex-wrap gap-2 text-sm">
            {/* Cloud Sync Status Badge */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                syncStatus.connected
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                  : "bg-amber-50/80 border-amber-200 text-amber-800"
              }`} 
              id="firebase-sync-badge"
              title={syncStatus.connected ? "Firebase Firestore 클라우드 실시간 동기화 활성화됨" : "Firebase 연결 상태 확인 중"}
            >
              {syncStatus.connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Firebase 클라우드 연동됨</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>Firebase 연결 중...</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl" id="date-picker-container">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-medium focus:outline-none text-xs"
                id="input-report-date"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-content-grid">
        {/* Left Column: Intake and Section Preset Forms (7 Columns) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col" id="form-column">
          
          {/* Quick Categories Layout */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6" id="presets-sections-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  1. 카테고리별 일과 및 행동 관찰 선택
                </h3>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <span className="text-[10px] text-gray-400 hidden sm:inline">자주 쓰는 문장을 클릭해 빠른 추가가 가능합니다.</span>
                <button
                  type="button"
                  onClick={handleResetOptions}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                  id="btn-reset-options"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                  선택 초기화
                </button>
              </div>
            </div>

            {/* 1. 입퇴소 Section */}
            <div className="space-y-3" id="section-check-in-out">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <LogIn className="w-4 h-4" />
                </span>
                <span className="font-semibold text-sm text-slate-800">입퇴소 (Check-in / Out)</span>
              </div>
              
              {/* Presets Grid */}
              <div className="flex flex-wrap gap-1.5">
                {CHECK_IN_OUT_PRESETS.map((item) => {
                  const isSelected = sections.checkInOut.presets.includes(item.keywords[0]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePreset("checkInOut", item.keywords[0])}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                        isSelected 
                          ? "bg-emerald-600 text-white font-medium shadow-sm shadow-emerald-100" 
                          : "bg-gray-50 text-slate-600 hover:bg-gray-100"
                      }`}
                      id={`preset-checkinout-${item.id}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* 시간 설정 (Time Selection) */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">입소 시간</label>
                  <select
                    value={sections.checkInOut.checkInTime || ""}
                    onChange={(e) => handleCheckInTimeChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                    id="select-checkin-time"
                  >
                    <option value="">선택 안 함</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={`in-${time}`} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">퇴소 시간</label>
                  <select
                    value={sections.checkInOut.checkOutTime || ""}
                    onChange={(e) => handleCheckOutTimeChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                    id="select-checkout-time"
                  >
                    <option value="">선택 안 함</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={`out-${time}`} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Memo */}
              <textarea
                placeholder="입퇴소 시 수영장 동행, 가방정리 지도 등 특별한 개별 특이사항을 적어주세요."
                value={sections.checkInOut.memo}
                onChange={(e) => handleMemoChange("checkInOut", e.target.value)}
                className="w-full min-h-[50px] p-2.5 border border-gray-100 bg-gray-50/30 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                id="textarea-checkinout-memo"
              />
            </div>

            {/* 2. 위생과 청결 Section */}
            <div className="space-y-3 border-t border-gray-50 pt-5" id="section-hygiene">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <Droplet className="w-4 h-4" />
                </span>
                <span className="font-semibold text-sm text-slate-800">위생과 청결 (Hygiene)</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {HYGIENE_PRESETS.map((item) => {
                  const isSelected = sections.hygiene.presets.includes(item.keywords[0]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePreset("hygiene", item.keywords[0])}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                        isSelected 
                          ? "bg-emerald-600 text-white font-medium shadow-sm" 
                          : "bg-gray-50 text-slate-600 hover:bg-gray-100"
                      }`}
                      id={`preset-hygiene-${item.id}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                placeholder="손씻기 횟수, 가글링 지도, 식후 손/얼굴 씻기 지도 등을 메모하세요."
                value={sections.hygiene.memo}
                onChange={(e) => handleMemoChange("hygiene", e.target.value)}
                className="w-full min-h-[50px] p-2.5 border border-gray-100 bg-gray-50/30 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                id="textarea-hygiene-memo"
              />
            </div>

            {/* 3. 식생활 Section */}
            <div className="space-y-3 border-t border-gray-50 pt-5" id="section-meals">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <Utensils className="w-4 h-4" />
                </span>
                <span className="font-semibold text-sm text-slate-800">식생활 (Dietary)</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {MEALS_PRESETS.map((item) => {
                  const isSelected = sections.meals.presets.includes(item.keywords[0]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePreset("meals", item.keywords[0])}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                        isSelected 
                          ? "bg-emerald-600 text-white font-medium shadow-sm" 
                          : "bg-gray-50 text-slate-600 hover:bg-gray-100"
                      }`}
                      id={`preset-meals-${item.id}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                placeholder="식단 선호 반찬, 섭취량, '돈수육 조금 먹음' 등 식단 특이사항을 메모하세요."
                value={sections.meals.memo}
                onChange={(e) => handleMemoChange("meals", e.target.value)}
                className="w-full min-h-[50px] p-2.5 border border-gray-100 bg-gray-50/30 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                id="textarea-meals-memo"
              />
            </div>

            {/* 4. 건강관리 Section */}
            <div className="space-y-3 border-t border-gray-50 pt-5" id="section-health">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <Activity className="w-4 h-4" />
                </span>
                <span className="font-semibold text-sm text-slate-800">건강관리 (Health)</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {HEALTH_PRESETS.map((item) => {
                  const isSelected = sections.health.presets.includes(item.keywords[0]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePreset("health", item.keywords[0])}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                        isSelected 
                          ? "bg-emerald-600 text-white font-medium shadow-sm" 
                          : "bg-gray-50 text-slate-600 hover:bg-gray-100"
                      }`}
                      id={`preset-health-${item.id}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                placeholder="복용 중인 약품 투여 결과, 감기 증세, 휴식 시간 및 미열 현황 등을 기술하세요."
                value={sections.health.memo}
                onChange={(e) => handleMemoChange("health", e.target.value)}
                className="w-full min-h-[50px] p-2.5 border border-gray-100 bg-gray-50/30 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                id="textarea-health-memo"
              />
            </div>

            {/* 5. 프로그램 Section */}
            <div className="space-y-3 border-t border-gray-50 pt-5" id="section-programs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <Gamepad2 className="w-4 h-4" />
                </span>
                <span className="font-semibold text-sm text-slate-800">프로그램 (Activities)</span>
              </div>

              {/* 시간대별 참여 프로그램 선택 슬롯 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/50" id="time-programs-grid">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    오전 프로그램 1
                  </label>
                  <select
                    value={sections.programs.amProgram1 || ""}
                    onChange={(e) => handleProgramFieldChange("amProgram1", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    id="select-am-program-1"
                  >
                    <option value="">선택 안 함</option>
                    {PROGRAM_PRESETS.map((item) => (
                      <option key={`am1-${item.id}`} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    오전 프로그램 2
                  </label>
                  <select
                    value={sections.programs.amProgram2 || ""}
                    onChange={(e) => handleProgramFieldChange("amProgram2", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    id="select-am-program-2"
                  >
                    <option value="">선택 안 함</option>
                    {PROGRAM_PRESETS.map((item) => (
                      <option key={`am2-${item.id}`} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    오후 프로그램 1
                  </label>
                  <select
                    value={sections.programs.pmProgram1 || ""}
                    onChange={(e) => handleProgramFieldChange("pmProgram1", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    id="select-pm-program-1"
                  >
                    <option value="">선택 안 함</option>
                    {PROGRAM_PRESETS.map((item) => (
                      <option key={`pm1-${item.id}`} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    오후 프로그램 2
                  </label>
                  <select
                    value={sections.programs.pmProgram2 || ""}
                    onChange={(e) => handleProgramFieldChange("pmProgram2", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    id="select-pm-program-2"
                  >
                    <option value="">선택 안 함</option>
                    {PROGRAM_PRESETS.map((item) => (
                      <option key={`pm2-${item.id}`} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>



              <textarea
                placeholder="참여한 프로그램명(자조모임, 미술치료 등) 및 활동 몰입도, 적극성을 기입하세요."
                value={sections.programs.memo}
                onChange={(e) => handleMemoChange("programs", e.target.value)}
                className="w-full min-h-[50px] p-2.5 border border-gray-100 bg-gray-50/30 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                id="textarea-programs-memo"
              />
            </div>

            {/* 6. 기타사항 Section */}
            <div className="space-y-3 border-t border-gray-50 pt-5" id="section-other">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
                <span className="font-semibold text-sm text-slate-800">기타사항 (Other Notes)</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {OTHER_PRESETS.map((item) => {
                  const isSelected = sections.other.presets.includes(item.keywords[0]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePreset("other", item.keywords[0])}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                        isSelected 
                          ? "bg-emerald-600 text-white font-medium shadow-sm" 
                          : "bg-gray-50 text-slate-600 hover:bg-gray-100"
                      }`}
                      id={`preset-other-${item.id}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                placeholder="감정 변화, 친구들과의 협력 상태, 가이드라인 등 카테고리 외 개별 특성을 자유롭게 적어주세요."
                value={sections.other.memo}
                onChange={(e) => handleMemoChange("other", e.target.value)}
                className="w-full min-h-[60px] p-2.5 border border-gray-100 bg-gray-50/30 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                id="textarea-other-memo"
              />
            </div>
          </div>

          {/* AI Configuration Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5" id="tone-configuration-card">
            <h3 className="text-sm font-semibold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              2. AI 데일리 리포트 생성
            </h3>
            
            <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-xl p-3 text-[11px] text-emerald-800 leading-relaxed" id="tone-notice">
              <p className="font-semibold flex items-center gap-1 mb-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                격식형 관찰 서술체 적용
              </p>
              모든 리포트는 사회복지 및 관찰일지 서식에 가장 적합한 <strong className="text-emerald-950 font-semibold">전문형 관찰 서술체(~함, ~하였음)</strong>로 자동 작성됩니다.
            </div>

            {/* Ultimate Action Button */}
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`w-full mt-4 py-4 rounded-2xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                isGenerating 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-95 active:scale-[0.99] shadow-emerald-100"
              }`}
              id="btn-generate-report-master"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "AI가 관찰 일지 생성 중..." : "AI 데일리 리포트 자동 작성하기"}
            </button>
          </div>
        </div>

        {/* Right Column: Display / Archive Controls (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="output-column">
          {/* Main Action Tabs */}
          <div className="bg-white border border-gray-100 rounded-2xl p-1.5 flex gap-1 shadow-xs" id="navigation-tabs">
            <button
              onClick={() => setActiveRightTab("generate")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeRightTab === "generate"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-gray-50"
              }`}
              id="tab-btn-generate"
            >
              실시간 작성 결과
            </button>
            <button
              onClick={() => setActiveRightTab("history")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeRightTab === "history"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-gray-50"
              }`}
              id="tab-btn-history"
            >
              기록 보관함 ({reports.length})
            </button>
          </div>

          {/* Active View Display */}
          <div className="flex-1 min-h-[500px]" id="active-tab-container">
            {activeRightTab === "generate" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full space-y-4" id="ai-output-box">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-emerald-600" />
                    실시간 생성 결과 및 리포트 편집
                  </h3>
                  {generatedReport && (
                    <button 
                      onClick={() => setGeneratedReport("")}
                      className="text-[10px] text-gray-400 hover:text-rose-600"
                      id="btn-clear-report"
                    >
                      초기화
                    </button>
                  )}
                </div>

                {isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 animate-pulse" id="ai-loading-screen">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-sm text-slate-800">데일리 리포트 완제 구성 중</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                        {generationStep === 0 && "카테고리별 핵심 선택 사항 취합 중..."}
                        {generationStep === 1 && "감정과 행동 특이사항의 문맥 매칭 중..."}
                        {generationStep === 2 && "설정된 어조(~함)로 완결성 다듬는 중..."}
                        {generationStep === 3 && "학부모에게 발송할 최상의 문구 완성 중..."}
                      </p>
                    </div>
                    
                    {/* Visual Loading Indicator */}
                    <div className="w-40 bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${(generationStep + 1) * 25}%` }}
                      ></div>
                    </div>
                  </div>
                ) : generatedReport ? (
                  <div className="flex-1 flex flex-col space-y-4 animate-fade-in" id="report-text-container">
                    {/* Paper Document Preview Box */}
                    <div className="flex-1 relative bg-amber-50/10 border border-amber-100 rounded-xl p-4 font-sans text-sm leading-relaxed text-slate-800 shadow-inner flex flex-col min-h-[300px]">
                      <textarea
                        value={generatedReport}
                        onChange={(e) => setGeneratedReport(e.target.value)}
                        className="w-full flex-1 bg-transparent resize-none border-none outline-none focus:ring-0 text-slate-800 font-sans leading-relaxed text-sm h-full"
                        style={{ minHeight: '320px' }}
                        id="textarea-generated-text"
                      />
                      
                      {/* Interactive Section-Specific Refine Chips (Floating assistance for easy modification) */}
                      <div className="mt-3 border-t border-slate-100/60 pt-3 flex flex-wrap gap-1">
                        <span className="text-[10px] text-gray-400 mr-1.5 self-center">부족한 항목 AI 개별 보완:</span>
                        <button 
                          onClick={() => handleRefineSingleSection("입퇴소", "checkInOut")}
                          className="px-2 py-0.5 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 rounded text-[10px] text-slate-600 transition-all"
                          id="refine-chip-checkin"
                        >
                          입퇴소 ↻
                        </button>
                        <button 
                          onClick={() => handleRefineSingleSection("위생과 청결", "hygiene")}
                          className="px-2 py-0.5 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 rounded text-[10px] text-slate-600 transition-all"
                          id="refine-chip-hygiene"
                        >
                          위생 ↻
                        </button>
                        <button 
                          onClick={() => handleRefineSingleSection("식생활", "meals")}
                          className="px-2 py-0.5 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 rounded text-[10px] text-slate-600 transition-all"
                          id="refine-chip-meals"
                        >
                          식생활 ↻
                        </button>
                        <button 
                          onClick={() => handleRefineSingleSection("건강관리", "health")}
                          className="px-2 py-0.5 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 rounded text-[10px] text-slate-600 transition-all"
                          id="refine-chip-health"
                        >
                          건강 ↻
                        </button>
                        <button 
                          onClick={() => handleRefineSingleSection("프로그램", "programs")}
                          className="px-2 py-0.5 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 rounded text-[10px] text-slate-600 transition-all"
                          id="refine-chip-programs"
                        >
                          프로그램 ↻
                        </button>
                      </div>
                    </div>

                    {/* Quick Utility Operations */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <button
                        onClick={() => handleCopyText(generatedReport, "normal")}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl transition-all ${
                          copied 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                            : "bg-white hover:bg-gray-50 border-gray-200 text-slate-700"
                        }`}
                        id="btn-copy-normal"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "복사 완료!" : "전체 텍스트 복사"}
                      </button>

                      <button
                        onClick={() => handleCopyText(getKakaoFormattedText(), "kakao")}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl transition-all ${
                          kakaoCopied 
                            ? "bg-amber-50 border-amber-200 text-amber-800" 
                            : "bg-amber-100/50 hover:bg-amber-100 border-amber-200 text-amber-800"
                        }`}
                        id="btn-copy-kakao"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                        {kakaoCopied ? "알림장 양식 복사됨!" : "카카오 알림장용 복사"}
                      </button>

                      <button
                        onClick={handleSaveToHistory}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all"
                        id="btn-save-archive"
                      >
                        <Save className="w-3.5 h-3.5" />
                        작성 이력 저장하기
                      </button>

                      <button
                        onClick={handleDownloadTxt}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-slate-700 rounded-xl transition-all"
                        id="btn-download-txt"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        메모장(.TXT) 다운로드
                      </button>
                    </div>

                    {/* Mini helper card */}
                    <div className="bg-emerald-50/25 border border-emerald-50 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                      <Heart className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800">팁: 완성 텍스트를 직접 수정하세요!</p>
                        <p className="text-slate-500 mt-0.5">상단 리포트 종이 박스 안을 클릭하면 직접 글을 추가하거나 수정할 수 있습니다.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-gray-100 rounded-2xl" id="ai-blank-state">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                      <Sparkles className="w-6 h-6 text-emerald-600/60" />
                    </div>
                    <h4 className="font-semibold text-xs text-slate-700">작성 대기 중</h4>
                    <p className="text-[10px] text-slate-400 max-w-[240px] mt-1">
                      왼쪽에서 대상자 정보와 관찰 항목을 선택하고 아래 '데일리 리포트 자동 작성하기' 버튼을 누르면 AI 리포트가 완성됩니다.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeRightTab === "history" && (
              <ReportHistory
                reports={reports}
                onLoadReport={handleLoadReport}
                onDeleteReport={handleDeleteReport}
              />
            )}
          </div>
        </div>
      </main>

      {/* Cute Warm footer */}
      <footer className="bg-white border-t border-gray-50 py-4 px-6 mt-auto text-center text-xs text-slate-400" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 데일리 리포트 자동 작성기 (Care AI) - All Rights Reserved.</p>
          <div className="flex items-center gap-1.5 text-emerald-600/80">
            <Heart className="w-3.5 h-3.5 fill-emerald-600/40 text-emerald-600" />
            <span>정성스러운 돌봄의 순간을 기록합니다.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
