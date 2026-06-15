import React, { useMemo, useEffect } from "react";
import {
  Bot,
  Zap,
  AlertTriangle,
  CornerDownRight,
  User,
  BarChart3,
  Upload,
  RefreshCw,
  FileText,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Download,
  Eye,
  CheckCircle,
  Database,
  Loader,
  Copy,
  FileJson,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Modal from "./Modal";

import {
  getAIStatus,
  getChatbotInteractions,
  getKnowledgeGaps,
  retrainAI,
  exportChatbotData,
  uploadKnowledgeFile,
  getKnowledgeFiles,
  searchKnowledge,
  deleteKnowledgeFile,
  retrainKnowledge,
  getKnowledgeAnalytics,
  exportKnowledgeGaps,
  getChatbotInteractionDetail,
  getChatbotStats,
  KnowledgeFile,
  KnowledgeAnalytics,
  KnowledgeSearchResult,
} from "../../services/dataService";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

interface ChatbotMonitorProps {
  isDarkMode?: boolean;
}

const ChatbotMonitor: React.FC<ChatbotMonitorProps> = ({
  isDarkMode = true,
}) => {
  const [isTrainModalOpen, setIsTrainModalOpen] = React.useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [isUpdateBrainModalOpen, setIsUpdateBrainModalOpen] =
    React.useState(false);
  const [selectedChat, setSelectedChat] = React.useState<any>(null);
  const [selectedGap, setSelectedGap] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRetraining, setIsRetraining] = React.useState(false);
  const [aiStatus, setAiStatus] = React.useState<"ONLINE" | "OFFLINE" | "ERROR" | "MAINTENANCE">(
    "OFFLINE",
  );

  const [stats, setStats] = React.useState({
    avgLatency: "0ms",
    tokenMin: "0",
    successRate: "0%",
    totalInteractions: "0",
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("Semua");
  const [filterTime, setFilterTime] = React.useState("Semua");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const [chats, setChats] = React.useState<any[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = React.useState<any[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = React.useState<KnowledgeFile[]>([]);
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = React.useState("");
  const [knowledgeSearchResults, setKnowledgeSearchResults] = React.useState<KnowledgeSearchResult[]>([]);
  const [knowledgeAnalytics, setKnowledgeAnalytics] = React.useState<KnowledgeAnalytics | null>(null);
  const [trainingResult, setTrainingResult] = React.useState<any>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<string>("idle");
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [totalPages, setTotalPages] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);

  // New Dashboard States
  const [todayStats, setTodayStats] = React.useState({
    totalChat: 0,
    chatBerhasil: 0,
    chatGagal: 0,
    userAktif: 0,
    avgResponse: "0ms",
    avgToken: 0,
  });
  const [chart7Days, setChart7Days] = React.useState<any[]>([]);
  const [chart30Days, setChart30Days] = React.useState<any[]>([]);
  const [isRetrainConfirmOpen, setIsRetrainConfirmOpen] = React.useState(false);
  const [retrainProgress, setRetrainProgress] = React.useState<number | null>(null);

  const loadData = async (page = currentPage, isBackground = false) => {
    if (!isBackground) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const [statusData, interactionsData, gapsData, analyticsData] = await Promise.all([
        getAIStatus(),
        getChatbotInteractions(
          page,
          itemsPerPage,
          searchQuery,
          filterStatus,
          filterTime,
        ),
        getKnowledgeGaps(),
        getChatbotStats(),
      ]);

      if (statusData?.metrics) {
        setStats(statusData.metrics);
      }

      if (statusData?.gemini) {
        setAiStatus(statusData.gemini.status as any);
      }

      if (interactionsData?.data) {
        setChats(interactionsData.data || []);
        setTotalPages(interactionsData.totalPages || 1);
        setCurrentPage(interactionsData.page || page);
      } else if (Array.isArray(interactionsData)) {
        setChats(interactionsData);
        setTotalPages(1);
      }

      if (Array.isArray(gapsData)) {
        setKnowledgeGaps(gapsData);
      } else if (gapsData?.data) {
        setKnowledgeGaps(gapsData.data || []);
      }

      if (analyticsData) {
        if (analyticsData.today) {
          setTodayStats(analyticsData.today);
        }
        if (analyticsData.chart7Days) {
          setChart7Days(analyticsData.chart7Days);
        }
        if (analyticsData.chart30Days) {
          setChart30Days(analyticsData.chart30Days);
        }
        if (analyticsData.metrics) {
          setStats(analyticsData.metrics);
        }
      }
    } catch (e: any) {
      console.error("Error loading data:", e);
      const errorMsg = e.message || "Gagal mengambil data monitoring";
      if (!isBackground) {
        setError(errorMsg);
        toast.error(errorMsg);
        setAiStatus("OFFLINE");
      }
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  };

  const loadKnowledgeOverview = async () => {
    try {
      setError(null);
      const [files, analytics] = await Promise.all([
        getKnowledgeFiles(),
        getKnowledgeAnalytics(),
      ]);
      setKnowledgeFiles(files);
      setKnowledgeAnalytics(analytics);
    } catch (e: any) {
      console.error("Error loading knowledge overview:", e);
      toast.error(e.message || "Gagal memuat knowledge analytics.");
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadStatus("selected");
  };

  const handleUploadKnowledge = async () => {
    if (!selectedFile) {
      toast.error("Pilih file terlebih dahulu.");
      return;
    }
    setIsUploading(true);
    setUploadStatus("uploading");
    try {
      await uploadKnowledgeFile(selectedFile, "Administrator");
      setUploadStatus("completed");
      toast.success("File knowledge berhasil diunggah dan diindeks.");
      setSelectedFile(null);
      await loadKnowledgeOverview();
    } catch (e: any) {
      console.error("Upload knowledge failed:", e);
      setUploadStatus("failed");
      toast.error(e.message || "Gagal mengunggah knowledge file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      await deleteKnowledgeFile(id);
      toast.success("File knowledge berhasil dihapus.");
      await loadKnowledgeOverview();
    } catch (e: any) {
      console.error("Delete knowledge failed:", e);
      toast.error(e.message || "Gagal menghapus file knowledge.");
    }
  };

  const handleSearchKnowledge = async () => {
    try {
      const results = await searchKnowledge(knowledgeSearchQuery.trim());
      setKnowledgeSearchResults(results);
    } catch (e: any) {
      console.error("Search knowledge failed:", e);
      toast.error(e.message || "Gagal mencari knowledge.");
    }
  };

  const handleRetrainKnowledge = async () => {
    setIsRetraining(true);
    try {
      const result = await retrainKnowledge();
      setTrainingResult(result);
      toast.success("Retraining Knowledge berhasil.");
      await loadKnowledgeOverview();
    } catch (e: any) {
      console.error("Retrain knowledge failed:", e);
      toast.error(e.message || "Gagal melakukan retraining knowledge.");
    } finally {
      setIsRetraining(false);
    }
  };

  const handleExportKnowledgeGaps = async (
    format: "JSON" | "CSV" | "EXCEL",
  ) => {
    try {
      const blob = await exportKnowledgeGaps(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `knowledge_gaps_${new Date().toISOString().split("T")[0]}.${
        format === "EXCEL" ? "xlsx" : format === "CSV" ? "csv" : "json"
      }`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Export knowledge gaps berhasil.");
    } catch (e: any) {
      console.error("Export knowledge gaps failed:", e);
      toast.error(e.message || "Gagal mengekspor knowledge gaps.");
    }
  };

  React.useEffect(() => {
    loadData(1, false);
 
    // Auto Refresh setiap 5 detik as requested by requirement 8
    const interval = setInterval(() => {
      loadData(currentPage, true);
    }, 5000);
 
    return () => clearInterval(interval);
  }, [currentPage, searchQuery, filterStatus, filterTime]);

  React.useEffect(() => {
    if (isTrainModalOpen) {
      loadKnowledgeOverview();
    }
  }, [isTrainModalOpen]);

  const handleOpenDetail = async (chat: any) => {
    setIsLoading(true);
    try {
      const detail = await getChatbotInteractionDetail(chat.id);
      setSelectedChat(detail);
      setIsDetailModalOpen(true);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat detail interaksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBrain = (gap: any) => {
    setSelectedGap(gap);
    setIsUpdateBrainModalOpen(true);
  };

  const handleMarkAsHandled = async () => {
    if (selectedGap) {
      setIsRetraining(true);
      try {
        await retrainAI(selectedGap.id);
        const gapId = selectedGap.id;
        setKnowledgeGaps((prevGaps) => prevGaps.filter((gap) => gap.id !== gapId));
        toast.success("AI berhasil dilatih ulang");
        setIsUpdateBrainModalOpen(false);
        loadData();
      } catch (e: any) {
        toast.error(e.message || "Gagal melatih ulang AI");
      } finally {
        setIsRetraining(false);
      }
    }
  };

  const handleRetrainAI = async () => {
    setIsRetraining(true);
    setRetrainProgress(0);
    const timer = setInterval(() => {
      setRetrainProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 80) {
          clearInterval(timer);
          return 80;
        }
        return prev + 20;
      });
    }, 300);

    try {
      const result = await retrainKnowledge();
      clearInterval(timer);
      setRetrainProgress(100);
      setKnowledgeGaps([]);
      toast.success("AI berhasil dilatih ulang");
      setTrainingResult(result);
      await loadData(1);
      await loadKnowledgeOverview();
    } catch (e: any) {
      clearInterval(timer);
      setRetrainProgress(null);
      toast.error(e.message || "Gagal melakukan retraining AI");
    } finally {
      setIsRetraining(false);
    }
  };

  const getProgressStepText = (progress: number) => {
    if (progress === 0) return "Memulai sinkronisasi...";
    if (progress === 20) return "Menyelaraskan FAQ dari database...";
    if (progress === 40) return "Menyelaraskan Artikel Edukasi...";
    if (progress === 60) return "Menyelaraskan data Pengelolaan Lahan...";
    if (progress === 80) return "Meregenerasi embeddings di Gemini API...";
    if (progress === 100) return "Knowledge Base berhasil diperbarui!";
    return "";
  };

  const exportData = async (format: "CSV" | "EXCEL" | "PDF") => {
    try {
      const blob = await exportChatbotData(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = format === "EXCEL" ? "xlsx" : format === "PDF" ? "pdf" : "csv";
      const fileName = `ai_monitoring_${new Date().toISOString().split("T")[0]}.${extension}`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Data berhasil diunduh.");
    } catch (error: any) {
      console.error("Export failed:", error);
      toast.error(
        error?.message || "Gagal mengunduh file. Pastikan browser Anda mengizinkan unduhan.",
      );
    }
  };

  const handleCopyDetails = () => {
    if (!selectedChat) return;
    const text = `User: ${selectedChat.user} (${selectedChat.email || "Anonymous"})\nWaktu: ${new Date(selectedChat.timestamp || selectedChat.created_at || Date.now()).toLocaleString()}\nStatus: ${selectedChat.status}\nLatency: ${selectedChat.latency || 0}ms\nToken: ${selectedChat.tokens || 0}\nPertanyaan: ${selectedChat.message}\nJawaban AI: ${selectedChat.aiResponse}`;
    navigator.clipboard.writeText(text);
    toast.success("Detail percakapan disalin ke clipboard");
  };

  const handleExportJSON = () => {
    if (!selectedChat) return;
    const blob = new Blob([JSON.stringify(selectedChat, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat_detail_${selectedChat.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("JSON detail percakapan berhasil diunduh");
  };

  return (
    <>
      <div className="space-y-5 md:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 lg:gap-8">
          {/* Statistics Monitor */}
          <div
            className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 lg:p-7 shadow-xl transition-all ${isDarkMode ? "bg-[#111814] border-white/5 shadow-black/40" : "bg-white border-gray-100 shadow-sm shadow-gray-200/50"}`}
          >
            <div className="flex items-center justify-between gap-3 md:gap-4 mb-5 md:mb-6 lg:mb-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-lg md:rounded-xl flex items-center justify-center transition-all shadow-lg ${isDarkMode ? "bg-brand-accent text-black shadow-brand-accent/20" : "bg-brand-primary text-white shadow-brand-primary/20"}`}
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3
                    className={`font-serif font-bold text-sm md:text-base lg:text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Real-time Performance
                  </h3>
                  <p
                    className={`text-[10px] md:text-xs font-medium transition-colors ${isDarkMode ? "text-white/40" : "text-gray-400"}`}
                  >
                    Live monitoring of AI Agent latency and response.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <Loader className={`w-4 h-4 animate-spin ${isDarkMode ? "text-white/40" : "text-gray-400"}`} />
                )}
                <span
                  className={`px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
                    aiStatus === "ONLINE"
                      ? isDarkMode
                        ? "bg-green-500/10 border-green-500/20 text-green-500"
                        : "bg-green-50 border-green-200 text-green-600"
                      : aiStatus === "ERROR"
                        ? isDarkMode
                          ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
                          : "bg-red-50 border-red-200 text-red-600 animate-pulse"
                        : aiStatus === "MAINTENANCE"
                          ? isDarkMode
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                            : "bg-yellow-50 border-yellow-200 text-yellow-600"
                          : isDarkMode
                            ? "bg-red-500/10 border-red-500/20 text-red-500"
                            : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  AI {aiStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                { label: "Avg Latency", value: stats.avgLatency },
                { label: "Token/min", value: stats.tokenMin },
                { label: "Success Rate", value: stats.successRate },
                { label: "Total Interactions", value: stats.totalInteractions },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`border p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100 shadow-xs"}`}
                >
                  <span
                    className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest block mb-0.5 md:mb-1 ${isDarkMode ? "text-white/20" : "text-gray-400"}`}
                  >
                    {stat.label}
                  </span>
                  <span
                    className={`text-base md:text-lg lg:text-xl font-serif font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Chats Stream */}
          <div
            className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 shadow-xl flex flex-col h-full transition-all duration-300 ${isDarkMode ? "bg-[#111814] border-white/5 shadow-black/40" : "bg-white border-gray-100 shadow-sm shadow-gray-200/50"}`}
          >
            <div className="flex items-center justify-between mb-4 md:mb-5 lg:mb-6">
              <h3
                className={`font-serif font-bold text-sm md:text-base lg:text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Recent Interactions
              </h3>
              <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
                <button
                  onClick={() => loadData()}
                  disabled={isLoading}
                  className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${isDarkMode ? "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-50" : "bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 shadow-xs border border-gray-200 disabled:opacity-50"}`}
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => exportData("CSV")}
                  className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${isDarkMode ? "bg-white/5 text-white/40 hover:text-white hover:bg-white/10" : "bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 shadow-xs border border-gray-200"}`}
                  title="Unduh Percakapan (CSV)"
                >
                  <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => exportData("EXCEL")}
                  className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${isDarkMode ? "bg-white/5 text-white/40 hover:text-white hover:bg-white/10" : "bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 shadow-xs border border-gray-200"}`}
                  title="Unduh Percakapan (Excel)"
                >
                  <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                </button>
                <button
                  onClick={() => exportData("PDF")}
                  className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${isDarkMode ? "bg-white/5 text-white/40 hover:text-white hover:bg-white/10" : "bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 shadow-xs border border-gray-200"}`}
                  title="Unduh Percakapan (PDF)"
                >
                  <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2 lg:space-y-2.5 mb-4 lg:mb-5">
              <div
                className={`flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl border transition-all ${isDarkMode ? "bg-white/5 border-white/5 focus-within:border-brand-accent/50 group" : "bg-gray-50 border-gray-100 focus-within:border-brand-primary/50 shadow-xs"}`}
              >
                <Search
                  className={`w-3.5 h-3.5 transition-colors ${isDarkMode ? "text-white/20 group-focus-within:text-brand-accent" : "text-gray-400 group-focus-within:text-brand-primary"}`}
                />
                <input
                  type="text"
                  placeholder="Cari user atau pertanyaan..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`bg-transparent text-[8px] md:text-[9px] font-black tracking-widest uppercase outline-none w-full ${isDarkMode ? "text-white" : "text-gray-900 placeholder:text-gray-400"}`}
                />
              </div>
              <div className="flex gap-2">
                <div
                  className={`flex-1 flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 rounded-lg md:rounded-xl border transition-all ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100 shadow-xs"}`}
                >
                  <Filter
                    className={`w-3 h-3 ${isDarkMode ? "text-white/20" : "text-gray-400"}`}
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`bg-transparent text-[8px] md:text-[9px] font-black uppercase tracking-widest outline-none w-full cursor-pointer transition-all ${isDarkMode ? "text-white/60" : "text-gray-600"}`}
                  >
                    <option
                      className={isDarkMode ? "bg-[#111814]" : "bg-white"}
                      value="Semua"
                    >
                      Status
                    </option>
                    <option
                      className={isDarkMode ? "bg-[#111814]" : "bg-white"}
                      value="SUCCESS"
                    >
                      Success
                    </option>
                    <option
                      className={isDarkMode ? "bg-[#111814]" : "bg-white"}
                      value="FAILED"
                    >
                      Failed
                    </option>
                  </select>
                </div>
                <div
                  className={`flex-1 flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 rounded-lg md:rounded-xl border transition-all ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100 shadow-xs"}`}
                >
                  <select
                    value={filterTime}
                    onChange={(e) => {
                      setFilterTime(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`bg-transparent text-[8px] md:text-[9px] font-black uppercase tracking-widest outline-none w-full cursor-pointer transition-all ${isDarkMode ? "text-white/60" : "text-gray-600"}`}
                  >
                    <option
                      className={isDarkMode ? "bg-[#111814]" : "bg-white"}
                      value="Semua"
                    >
                      Waktu
                    </option>
                    <option
                      className={isDarkMode ? "bg-[#111814]" : "bg-white"}
                      value="Hari ini"
                    >
                      Hari Ini
                    </option>
                    <option
                      className={isDarkMode ? "bg-[#111814]" : "bg-white"}
                      value="Minggu ini"
                    >
                      7 Hari
                    </option>
                    <option
                      className={isDarkMode ? "bg-[#111814]" : "bg-white"}
                      value="30 Hari"
                    >
                      30 Hari
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className={`p-3 md:p-4 rounded-lg md:rounded-xl mb-4 ${isDarkMode ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                  ⚠️ {error}
                </p>
              </div>
            )}

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[300px] md:max-h-[360px] lg:max-h-[400px] pr-1.5 scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {isLoading && (
                  <div className="h-40 flex flex-col items-center justify-center text-center">
                    <Loader className={`w-6 h-6 md:w-8 md:h-8 mb-2 animate-spin ${isDarkMode ? "text-white/40" : "text-gray-400"}`} />
                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-gray-400"}`}>
                      Memuat data...
                    </p>
                  </div>
                )}
                {!isLoading && chats.map((chat) => (
                  <motion.div
                     layout
                     key={chat.id}
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.98 }}
                     className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl border transition-all group ${isDarkMode ? "bg-white/5 border-white/5 hover:border-brand-accent/20 hover:bg-white/[0.07]" : "bg-gray-50 border-gray-100 hover:border-brand-primary/20 shadow-xs"}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <User
                          className={`w-3 h-3 ${isDarkMode ? "text-white/40" : "text-gray-400"}`}
                        />
                        <span
                          className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-gray-600"}`}
                        >
                          {chat.user}
                        </span>
                      </div>
                      <span
                        className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-gray-300"}`}
                      >
                        {chat.time}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] md:text-[11px] leading-relaxed line-clamp-1 font-bold mb-2.5 ${isDarkMode ? "text-white/80" : "text-gray-700"}`}
                    >
                      {chat.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div
                        className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${chat.status === "SUCCESS" ? (isDarkMode ? "text-brand-accent" : "text-brand-primary") : chat.status === "FAILED" ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-white/40" : "text-gray-500")}`}
                      >
                        <span
                          className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse transition-all shadow-sm ${chat.status === "SUCCESS" ? (isDarkMode ? "bg-brand-accent shadow-brand-accent/20" : "bg-brand-primary shadow-brand-primary/20") : chat.status === "FAILED" ? "bg-red-500 shadow-red-500/20" : "bg-white/20 shadow-white/10"}`}
                        />
                        {chat.status}
                      </div>
                      <button
                        onClick={() => handleOpenDetail(chat)}
                        className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all ${isDarkMode ? "bg-white/5 text-white/40 hover:text-white hover:bg-white/10" : "bg-white text-gray-400 hover:text-gray-900 border border-gray-100 shadow-xs"}`}
                      >
                        <Eye className="w-3 h-3" /> Detail
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {!isLoading && chats.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-center">
                  <Bot
                    className={`w-6 h-6 md:w-8 md:h-8 mb-2 opacity-10 transition-colors ${isDarkMode ? "text-white" : "text-black"}`}
                  />
                  <p
                    className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-gray-400"}`}
                  >
                    Tidak ada interaksi
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 md:mt-6 flex items-center justify-between pt-3 md:pt-4 border-t border-white/5">
                <p
                  className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-gray-400"}`}
                >
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className={`p-1 md:p-1.5 rounded-lg transition-all disabled:opacity-10 ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-gray-100 text-gray-900 shadow-sm border border-gray-200"}`}
                  >
                    <ChevronLeft className="w-3 md:w-3.5 h-3 md:h-3.5" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      totalPages > 5 &&
                      Math.abs(page - currentPage) > 1 &&
                      page !== 1 &&
                      page !== totalPages
                    )
                      return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-6 h-6 md:w-7 md:h-7 rounded-lg text-[8px] md:text-[9px] font-black transition-all ${
                          currentPage === page
                            ? isDarkMode
                              ? "bg-brand-accent text-black font-black"
                              : "bg-brand-primary text-white"
                            : isDarkMode
                              ? "text-white/40 hover:bg-white/5"
                              : "text-gray-400 hover:bg-gray-100 border border-transparent"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`p-1 md:p-1.5 rounded-lg transition-all disabled:opacity-10 ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-gray-100 text-gray-900 shadow-sm border border-gray-200"}`}
                  >
                    <ChevronRight className="w-3 md:w-3.5 h-3 md:h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mt-5">
          {[
            { label: "Chat Hari Ini", value: todayStats.totalChat, desc: "Total chat masuk" },
            { label: "Chat Berhasil", value: todayStats.chatBerhasil, desc: "Status SUCCESS" },
            { label: "Chat Gagal", value: todayStats.chatGagal, desc: "Status FAILED" },
            { label: "User Aktif", value: todayStats.userAktif, desc: "Perangkat unik" },
            { label: "Avg Response", value: todayStats.avgResponse, desc: "Kecepatan AI" },
            { label: "Avg Token", value: todayStats.avgToken, desc: "Konsumsi token" },
          ].map((item, i) => (
            <div
              key={i}
              className={`border p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${isDarkMode ? "bg-[#111814] border-white/5 shadow-black/20" : "bg-white border-gray-100 shadow-sm shadow-gray-200/50"}`}
            >
              <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest block mb-0.5 md:mb-1 ${isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                {item.label}
              </span>
              <span className={`text-base md:text-lg lg:text-xl font-serif font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {item.value}
              </span>
              <span className={`text-[7px] md:text-[8px] block mt-1 font-medium transition-colors ${isDarkMode ? "text-white/20" : "text-gray-400"}`}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 lg:gap-8 mt-5">
          {/* 7 Days Area Chart */}
          <div className={`border rounded-xl md:rounded-2xl p-4 md:p-5 lg:p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${isDarkMode ? "bg-[#111814] border-white/5 shadow-black/40" : "bg-white border-gray-100 shadow-sm"}`}>
            <h3 className={`font-serif font-bold text-xs md:text-sm lg:text-base mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Jumlah Chat (7 Hari Terakhir)
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart7Days}>
                  <defs>
                    <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDarkMode ? '#A3FF12' : '#10B981'} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={isDarkMode ? '#A3FF12' : '#10B981'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff08' : '#00000005'} vertical={false} />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#ffffff30' : '#00000030'} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDarkMode ? '#ffffff30' : '#00000030'} fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#111814' : '#fff', borderColor: isDarkMode ? '#ffffff10' : '#e2e8f0', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="chats" stroke={isDarkMode ? '#A3FF12' : '#10B981'} strokeWidth={3} fillOpacity={1} fill="url(#colorChats)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 30 Days Bar Chart */}
          <div className={`border rounded-xl md:rounded-2xl p-4 md:p-5 lg:p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${isDarkMode ? "bg-[#111814] border-white/5 shadow-black/40" : "bg-white border-gray-100 shadow-sm"}`}>
            <h3 className={`font-serif font-bold text-xs md:text-sm lg:text-base mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Success Rate (30 Hari Terakhir)
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff08' : '#00000005'} vertical={false} />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#ffffff30' : '#00000030'} fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDarkMode ? '#ffffff30' : '#00000030'} fontSize={10} tickLine={false} axisLine={false} unit="%" />
                  <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#111814' : '#fff', borderColor: isDarkMode ? '#ffffff10' : '#e2e8f0', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill={isDarkMode ? '#A3FF12' : '#10B981'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Knowledge Management */}
        <div
          className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 lg:p-7 shadow-xl transition-all ${isDarkMode ? "bg-[#111814] border-white/5 shadow-black/40" : "bg-white border-gray-100 shadow-sm shadow-gray-200/50"}`}
        >
          <div className="flex items-center justify-between mb-5 md:mb-6 lg:mb-8 transition-all">
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className={`w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-lg md:rounded-xl flex items-center justify-center border transition-all shadow-sm ${isDarkMode ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-red-50 border-red-100 text-red-600"}`}
              >
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <h3
                  className={`font-serif font-bold text-sm md:text-base lg:text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Knowledge Gaps Detected
                </h3>
                <p
                  className={`text-[10px] md:text-xs font-medium transition-colors ${isDarkMode ? "text-white/40" : "text-gray-400"}`}
                >
                  Questions the AI couldn't answer accurately.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsTrainModalOpen(true)}
                className={`p-2 rounded-lg md:rounded-xl transition-all ${isDarkMode ? "bg-white/5 text-white/40 hover:text-white hover:bg-white/10" : "bg-white text-gray-400 hover:text-gray-900 border border-gray-200 shadow-xs"}`}
                title="Basis Pengetahuan"
              >
                <Database className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsRetrainConfirmOpen(true)}
                disabled={isRetraining}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[8px] md:text-[9px] lg:text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 ${isDarkMode ? "bg-brand-accent text-black hover:bg-brand-highlight shadow-brand-accent/20" : "bg-brand-primary text-white hover:opacity-90 shadow-brand-primary/20"}`}
              >
                {isRetraining && <Loader className="w-3 h-3 animate-spin" />}
                Latih AI Lagi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {knowledgeGaps.map((gap, i) => (
              <div
                key={i}
                className={`border p-4 md:p-5 rounded-xl md:rounded-2xl lg:rounded-[24px] relative overflow-hidden group transition-all ${isDarkMode ? "bg-white/5 border-white/5 hover:border-brand-accent/20 shadow-black/20" : "bg-gray-50 border-gray-100 hover:border-brand-primary/20 shadow-xs shadow-gray-200/50"}`}
              >
                <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <BarChart3
                    className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  />
                </div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex items-start gap-2 md:gap-2.5 mb-3 md:mb-4">
                    <CornerDownRight
                      className={`w-3.5 h-3.5 shrink-0 mt-1 transition-all ${isDarkMode ? "text-brand-accent" : "text-brand-primary"}`}
                    />
                    <div>
                      <p
                        className={`text-[11px] md:text-xs font-bold mb-1 md:mb-2 leading-relaxed italic line-clamp-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                      >
                        "{gap.text}"
                      </p>
                      <p
                        className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-gray-400"}`}
                      >
                        {gap.occurrences} MUNcul
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3 md:pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleUpdateBrain(gap)}
                      className={`w-full py-1.5 md:py-2 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all active:scale-[0.98] ${isDarkMode ? "bg-white/5 border-white/5 text-white/40 hover:text-brand-accent hover:border-brand-accent/30 hover:bg-brand-accent/5" : "bg-white border-gray-100 text-gray-500 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 shadow-xs"}`}
                    >
                      Update Brain
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {knowledgeGaps.length === 0 && (
              <div className={`col-span-full flex flex-col items-center justify-center py-8 text-center ${isDarkMode ? "bg-white/5 border border-white/5" : "bg-gray-50 border border-gray-100"} rounded-lg`}>
                <CheckCircle className={`w-8 h-8 md:w-10 md:h-10 mb-2 ${isDarkMode ? "text-green-500" : "text-green-600"}`} />
                <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Semua celah pengetahuan telah teratasi!
                </p>
                <p className={`text-xs ${isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                  AI dapat menjawab semua pertanyaan dengan baik
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isDarkMode={isDarkMode}
        title="Detail Interaksi"
      >
        {selectedChat && (
          <div className="space-y-5">
            <div
              className={`p-5 rounded-2xl lg:rounded-[32px] border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100 shadow-xs"}`}
            >
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-primary/10 text-brand-primary"}`}
                  >
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4
                      className={`text-xs md:text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {selectedChat.user}
                    </h4>
                    <p
                      className={`text-[9px] md:text-[10px] font-medium ${isDarkMode ? "text-white/40" : "text-gray-500"}`}
                    >
                      {selectedChat.email || "Anonymous"}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
                    selectedChat.status === "SUCCESS" || selectedChat.status === "Success"
                      ? isDarkMode
                        ? "bg-brand-accent/10 border-brand-accent/20 text-brand-accent"
                        : "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                      : isDarkMode
                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                        : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  {selectedChat.status}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4 mt-2">
                <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-100/50 border-gray-200"}`}>
                  <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest block mb-0.5 ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>Latency</span>
                  <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedChat.latency || 0}ms</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-100/50 border-gray-200"}`}>
                  <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest block mb-0.5 ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>Tokens</span>
                  <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedChat.tokens || 0}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-100/50 border-gray-200"}`}>
                  <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest block mb-0.5 ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>Waktu</span>
                  <span className={`text-[10px] font-bold ${isDarkMode ? "text-white" : "text-gray-900"} truncate block`} title={new Date(selectedChat.timestamp || selectedChat.created_at || Date.now()).toLocaleString("id-ID")}>
                    {new Date(selectedChat.timestamp || selectedChat.created_at || Date.now()).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative pl-5">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${isDarkMode ? "bg-white/5" : "bg-gray-200"}`}
                  />
                  <p
                    className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-white/30" : "text-gray-400"}`}
                  >
                    Pertanyaan User
                  </p>
                  <p
                    className={`text-[11px] md:text-xs font-medium leading-relaxed ${isDarkMode ? "text-white/80" : "text-gray-700"}`}
                  >
                    {selectedChat.message}
                  </p>
                </div>
                <div className="relative pl-5">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${isDarkMode ? "bg-brand-accent/30" : "bg-brand-primary/30"}`}
                  />
                  <p
                    className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-brand-accent/50" : "text-brand-primary/50"}`}
                  >
                    Jawaban AI
                  </p>
                  <p
                    className={`text-[11px] md:text-xs font-bold leading-relaxed ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {selectedChat.aiResponse || <span className="italic opacity-50">Tidak ada jawaban.</span>}
                  </p>
                </div>

                {/* Prompt Context Box */}
                <div className="relative pl-5 pt-2">
                  <div className={`absolute left-0 top-2 bottom-0 w-1 rounded-full ${isDarkMode ? "bg-white/5" : "bg-gray-200"}`} />
                  <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>
                    Prompt System & Context
                  </p>
                  <div className={`p-2.5 rounded-xl font-mono text-[9px] max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed ${isDarkMode ? "bg-black/20 text-white/50 border border-white/5" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                    {selectedChat.prompt || "N/A"}
                  </div>
                </div>

                {/* Gemini Raw Response */}
                <div className="relative pl-5 pt-2">
                  <div className={`absolute left-0 top-2 bottom-0 w-1 rounded-full ${isDarkMode ? "bg-white/5" : "bg-gray-200"}`} />
                  <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>
                    Gemini Raw Response JSON
                  </p>
                  <pre className={`p-2.5 rounded-xl font-mono text-[8px] max-h-32 overflow-y-auto leading-relaxed border ${isDarkMode ? "bg-black/30 text-emerald-400/80 border-white/5" : "bg-gray-100 text-emerald-700/80 border-gray-200"}`}>
                    <code>
                      {typeof selectedChat.raw_response === 'object' 
                        ? JSON.stringify(selectedChat.raw_response, null, 2) 
                        : String(selectedChat.raw_response || "N/A")}
                    </code>
                  </pre>
                </div>

                {/* Error Box if FAILED */}
                {(selectedChat.status === "FAILED" || selectedChat.status === "Failed") && (selectedChat.errorMessage || selectedChat.errorStack) && (
                  <div className={`p-3.5 rounded-xl border mt-3 ${isDarkMode ? "bg-red-950/20 border-red-900/30" : "bg-red-50 border-red-200"}`}>
                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest text-red-500 mb-1`}>
                      Error Details ({selectedChat.errorCode || "UNKNOWN"})
                    </p>
                    <p className={`text-[10px] font-bold ${isDarkMode ? "text-red-300" : "text-red-700"}`}>
                      {selectedChat.errorMessage}
                    </p>
                    {selectedChat.errorStack && (
                      <pre className={`mt-2 p-2 rounded font-mono text-[8px] overflow-x-auto leading-normal ${isDarkMode ? "bg-black/40 text-red-400/80" : "bg-red-100/50 text-red-600"}`}>
                        {selectedChat.errorStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 md:pt-4 border-t border-white/5">
              <button
                onClick={handleCopyDetails}
                className={`flex-1 py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${isDarkMode ? "bg-white/5 text-white hover:text-white hover:bg-white/10" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"}`}
              >
                <Copy className="w-3.5 h-3.5" /> Salin Detail
              </button>
              <button
                onClick={handleExportJSON}
                className={`flex-1 py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${isDarkMode ? "bg-white/5 text-white hover:text-white hover:bg-white/10" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"}`}
              >
                <FileJson className="w-3.5 h-3.5" /> Ekspor JSON
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className={`flex-1 py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${isDarkMode ? "bg-brand-accent text-black hover:bg-brand-highlight" : "bg-brand-primary text-white hover:opacity-90"}`}
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Retrain Confirmation Modal */}
      <Modal
        isOpen={isRetrainConfirmOpen}
        onClose={() => setIsRetrainConfirmOpen(false)}
        isDarkMode={isDarkMode}
        title="Latih Ulang AI"
      >
        <div className="space-y-5">
          <div
            className={`p-5 rounded-2xl border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-primary/10 text-brand-primary"}`}
              >
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className={`text-xs md:text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Apakah Anda yakin ingin melatih ulang kecerdasan AI?
                </p>
                <p className={`text-[10px] md:text-xs mt-1 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                  Tindakan ini akan menyelaraskan FAQ, Artikel Edukasi, dan Panduan Pengelolaan Produk dari database dan memperbarui ingatan AI di Gemini. Proses ini memerlukan waktu beberapa detik.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsRetrainConfirmOpen(false)}
              className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDarkMode ? "text-white/40 hover:text-white bg-white/5" : "text-gray-500 hover:text-gray-900 bg-gray-100 border border-gray-200"}`}
            >
              Batal
            </button>
            <button
              onClick={() => {
                setIsRetrainConfirmOpen(false);
                handleRetrainAI();
              }}
              className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDarkMode ? "bg-brand-accent text-black hover:bg-brand-highlight" : "bg-brand-primary text-white hover:opacity-90"}`}
            >
              Mulai Sinkronisasi
            </button>
          </div>
        </div>
      </Modal>

      {/* Retrain Progress Modal */}
      {retrainProgress !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`w-11/12 max-w-md p-6 rounded-2xl md:rounded-3xl border transition-all ${isDarkMode ? "bg-[#111814] border-white/5 text-white" : "bg-white border-gray-200 text-gray-950"}`}>
            <div className="flex flex-col items-center text-center">
              <Loader className={`w-8 h-8 mb-4 animate-spin ${isDarkMode ? "text-brand-accent" : "text-brand-primary"}`} />
              <h4 className="font-serif font-bold text-sm md:text-base mb-1">
                Menyelaraskan Knowledge Base
              </h4>
              <p className={`text-[10px] md:text-xs mb-6 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                {getProgressStepText(retrainProgress)}
              </p>
              
              {/* Progress Bar Container */}
              <div className={`w-full h-1.5 rounded-full overflow-hidden mb-3 ${isDarkMode ? "bg-white/10" : "bg-gray-100"}`}>
                <div 
                  className={`h-full transition-all duration-300 ${isDarkMode ? "bg-brand-accent" : "bg-brand-primary"}`}
                  style={{ width: `${retrainProgress}%` }}
                />
              </div>
              
              <span className={`text-[10px] md:text-xs font-black tracking-widest ${isDarkMode ? "text-brand-accent" : "text-brand-primary"}`}>
                {retrainProgress}% Selesai
              </span>

              {retrainProgress === 100 && (
                <button
                  onClick={() => setRetrainProgress(null)}
                  className={`mt-6 w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDarkMode ? "bg-brand-accent text-black hover:bg-brand-highlight" : "bg-brand-primary text-white"}`}
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Brain Modal */}
      <Modal
        isOpen={isUpdateBrainModalOpen}
        onClose={() => setIsUpdateBrainModalOpen(false)}
        isDarkMode={isDarkMode}
        title="Knowledge Action"
      >
        <div className="space-y-5">
          <div
            className={`p-5 rounded-2xl lg:rounded-[32px] border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100 shadow-xs"}`}
          >
            <div className="flex items-start gap-3 md:gap-4 mb-5 md:mb-6">
              <div
                className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}
              >
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p
                  className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-0.5 md:mb-1 ${isDarkMode ? "text-white/30" : "text-gray-400"}`}
                >
                  Knowledge Gap Detected
                </p>
                <p
                  className={`text-[12px] md:text-sm font-bold italic ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  "{selectedGap?.text}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setIsUpdateBrainModalOpen(false);
                  setIsTrainModalOpen(true);
                }}
                className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl lg:rounded-[24px] border transition-all text-left group active:scale-[0.98] ${isDarkMode ? "bg-white/5 border-white/5 hover:bg-brand-accent/5 hover:border-brand-accent/20" : "bg-white border-gray-100 hover:bg-brand-primary/5 hover:border-brand-primary/20 shadow-xs"}`}
              >
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${isDarkMode ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-primary/10 text-brand-primary"}`}
                >
                  <Database className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <span
                    className={`block text-[11px] md:text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Tambah ke Knowledge Base
                  </span>
                  <span
                    className={`text-[9px] md:text-[10px] font-medium opacity-40`}
                  >
                    Berikan artikel atau data pendukung.
                  </span>
                </div>
              </button>

              <button
                onClick={handleMarkAsHandled}
                className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl lg:rounded-[24px] border transition-all text-left group active:scale-[0.98] ${isDarkMode ? "bg-white/5 border-white/5 hover:bg-green-500/5 hover:border-green-500/20" : "bg-white border-gray-100 hover:bg-green-50 hover:border-green-500/20 shadow-xs"}`}
              >
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${isDarkMode ? "bg-green-500/10 text-green-500" : "bg-green-50 text-green-600"}`}
                >
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <span
                    className={`block text-[11px] md:text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Tandai Sudah Ditangani
                  </span>
                  <span
                    className={`text-[9px] md:text-[10px] font-medium opacity-40`}
                  >
                    Hapus dari daftar gap pengetahuan.
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setIsUpdateBrainModalOpen(false)}
              className={`w-full py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? "text-white/40 hover:text-white/60 bg-white/5" : "text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 shadow-xs"}`}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isTrainModalOpen}
        onClose={() => setIsTrainModalOpen(false)}
        isDarkMode={isDarkMode}
        title="Training & Knowledge"
      >
        <div className="space-y-6 md:space-y-8">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.txt,.json,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const droppedFile = event.dataTransfer.files?.[0];
              if (droppedFile) {
                setSelectedFile(droppedFile);
                setUploadStatus("selected");
              }
            }}
            className={`p-6 md:p-8 border-2 border-dashed rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDarkMode ? "border-white/10 hover:border-brand-accent/40 bg-white/5 shadow-black/20" : "border-gray-200 hover:border-brand-primary/40 bg-gray-50 shadow-xs"}`}
          >
            <div
              className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 transition-colors ${isDarkMode ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-primary/10 text-brand-primary shadow-sm"}`}
            >
              <Upload className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <h4
              className={`text-sm md:text-base font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Upload Knowledge Base
            </h4>
            <p
              className={`text-[10px] md:text-sm font-medium text-center max-w-[300px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}
            >
              Seret dan lepas dokumen PDF, Word, TXT, JSON, atau CSV untuk ditambahkan ke basis pengetahuan.
            </p>
            <p
              className={`text-[10px] md:text-[11px] mt-3 font-bold ${isDarkMode ? "text-white/80" : "text-gray-700"}`}
            >
              {selectedFile ? `Dipilih: ${selectedFile.name}` : "Tarik file di sini atau klik tombol di bawah"}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest ${isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-xs"}`}
              >
                Pilih File
              </button>
              <button
                type="button"
                onClick={handleUploadKnowledge}
                disabled={!selectedFile || isUploading}
                className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all ${isDarkMode ? "bg-brand-accent text-black hover:bg-brand-highlight disabled:opacity-50" : "bg-brand-primary text-white hover:opacity-90 disabled:opacity-50"}`}
              >
                {isUploading ? "Mengunggah..." : "Unggah & Index"}
              </button>
            </div>
            {uploadStatus === "failed" && (
              <p className="mt-3 text-[10px] text-red-400">Gagal mengunggah file. Coba ulangi.</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={`p-4 md:p-5 rounded-3xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-xs"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Knowledge Summary</h5>
                  <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Lihat status data ilmu, file, dan embedding.</p>
                </div>
                <button
                  onClick={loadKnowledgeOverview}
                  className={`p-2 rounded-lg ${isDarkMode ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                  type="button"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-2xl p-3 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">Files</p>
                  <p className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{knowledgeAnalytics?.totalKnowledgeFiles ?? 0}</p>
                </div>
                <div className={`rounded-2xl p-3 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">Chunks</p>
                  <p className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{knowledgeAnalytics?.totalChunks ?? 0}</p>
                </div>
                <div className={`rounded-2xl p-3 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">Embeddings</p>
                  <p className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{knowledgeAnalytics?.totalEmbeddings ?? 0}</p>
                </div>
                <div className={`rounded-2xl p-3 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">Last Training</p>
                  <p className={`text-xs font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{knowledgeAnalytics?.lastTrainingDate ? new Date(knowledgeAnalytics.lastTrainingDate).toLocaleDateString() : "Belum"}</p>
                </div>
              </div>
            </div>
            <div
              className={`p-4 md:p-5 rounded-3xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-xs"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Training Control</h5>
                  <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Jalankan retraining seluruh knowledge base.</p>
                </div>
              </div>
              <button
                onClick={handleRetrainKnowledge}
                disabled={isRetraining}
                className={`w-full py-3 rounded-2xl font-black uppercase tracking-widest ${isDarkMode ? "bg-brand-accent text-black hover:bg-brand-highlight disabled:opacity-50" : "bg-brand-primary text-white hover:opacity-90 disabled:opacity-50"}`}
                type="button"
              >
                {isRetraining ? "Proses retraining..." : "Retrain Knowledge"}
              </button>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["JSON", "CSV", "EXCEL"] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => handleExportKnowledgeGaps(format)}
                    className={`rounded-2xl py-2 text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border p-5 md:p-6 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-xs"}`}>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between mb-4">
              <div>
                <h5 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Cari Knowledge</h5>
                <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Temukan konten yang sudah terindeks.</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={knowledgeSearchQuery}
                  onChange={(e) => setKnowledgeSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan kata kunci..."
                  className={`min-w-[180px] rounded-2xl border px-3 py-2 text-sm w-full ${isDarkMode ? "bg-[#0f1910] border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                />
                <button
                  type="button"
                  onClick={handleSearchKnowledge}
                  className={`rounded-2xl px-4 py-2 font-black uppercase tracking-widest ${isDarkMode ? "bg-brand-accent text-black hover:bg-brand-highlight" : "bg-brand-primary text-white hover:opacity-90"}`}
                >
                  Search
                </button>
              </div>
            </div>
            {knowledgeSearchResults.length > 0 ? (
              <div className="grid gap-3">
                {knowledgeSearchResults.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{item.title}</p>
                        <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>{item.source}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-brand-accent">{item.category}</span>
                    </div>
                    <p className={`text-[10px] ${isDarkMode ? "text-white/70" : "text-gray-600"}`}>{item.snippet}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Hasil pencarian akan muncul di sini.</p>
            )}
          </div>

          <div className={`rounded-3xl border p-5 md:p-6 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-xs"}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h5 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Daftar Knowledge Files</h5>
                <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Kelola file-file yang telah Anda unggah.</p>
              </div>
              <span className={`text-[10px] uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>{knowledgeFiles.length} file</span>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1.5 scrollbar-thin">
              {knowledgeFiles.length === 0 && (
                <div className={`rounded-3xl p-5 text-center ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Belum ada file knowledge.</p>
                </div>
              )}
              {knowledgeFiles.map((file) => (
                <div
                  key={file.id}
                  className={`rounded-3xl p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isDarkMode ? "bg-black/10 border-white/10" : "bg-white border-gray-100"}`}
                >
                  <div>
                    <p className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{file.original_name}</p>
                    <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>{file.file_type} · {Math.round(file.file_size / 1024)} KB · v{file.version}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteKnowledge(file.id)}
                      className={`rounded-2xl px-3 py-2 text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "bg-red-500/10 text-red-400 hover:bg-red-500/15" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                    >
                      Hapus
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-2xl px-3 py-2 text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Buka
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {trainingResult && (
            <div className={`rounded-3xl border p-5 md:p-6 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-xs"}`}>
              <h5 className={`text-sm font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Ringkasan Retraining</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-4 bg-white/5">
                  <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Total File</p>
                  <p className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{trainingResult.totalKnowledgeFiles}</p>
                </div>
                <div className="rounded-2xl p-4 bg-white/5">
                  <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Total Embeddings</p>
                  <p className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{trainingResult.totalEmbeddings}</p>
                </div>
                <div className="rounded-2xl p-4 bg-white/5">
                  <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Durasi</p>
                  <p className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{trainingResult.duration}s</p>
                </div>
                <div className="rounded-2xl p-4 bg-white/5">
                  <p className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Status</p>
                  <p className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{trainingResult.success ? "Selesai" : "Gagal"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 md:pt-4 border-t border-white/5">
            <button
              onClick={() => setIsTrainModalOpen(false)}
              className={`w-full py-3 md:py-3.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${isDarkMode ? "bg-brand-accent text-black hover:bg-brand-highlight shadow-lg shadow-brand-accent/10" : "bg-brand-primary text-white hover:opacity-90 shadow-lg shadow-brand-primary/10"}`}
            >
              Selesai
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ChatbotMonitor;
