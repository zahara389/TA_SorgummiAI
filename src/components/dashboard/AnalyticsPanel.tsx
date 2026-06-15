import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Bot,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Zap,
  Clock,
  AlertCircle,
  Download,
  FileText,
  Eye,
  ArrowUpRight,
  Filter,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import StatsCard from './StatsCard';
import ChartCard from './ChartCard';
import {
  fetchAnalyticsDashboard,
  fetchAnalyticsUsers,
  fetchAnalyticsAI,
  fetchAnalyticsArticles,
  fetchAnalyticsEducation,
  fetchAnalyticsFeedback,
  fetchAnalyticsCharts,
  exportAnalyticsCSV,
  exportAnalyticsPDF,
} from '../../services/dataService';

interface AnalyticsPanelProps {
  isDarkMode?: boolean;
}

interface AnalyticsDashboardData {
  periodLabel: string;
  users: {
    totalUsers: number;
    activeToday: number;
    newThisMonth: number;
    retentionRate: number;
  };
  ai: {
    totalInteractions: number;
    successRate: number;
    avgLatency: number;
    totalFailed: number;
      totalUnanswered?: number;
  };
  articles: {
    totalArticles: number;
    totalArticleViews: number;
    topArticles: Array<{ id?: string; title: string; views: number; growth?: string }>;
  };
  education: {
    totalEducation: number;
    totalEducationViews: number;
    topEducation: Array<{ id?: string; title: string; views: number; rating?: number }>;
  };
  feedback: {
    totalFeedback: number;
    positive: number;
    neutral: number;
    negative: number;
    sentimentScore: number;
  };
}

interface AnalyticsChartPoint {
  label: string;
  value: number;
}

const PERIOD_OPTIONS = [
  { label: '7 Hari Terakhir', value: '7d' },
  { label: '30 Hari Terakhir', value: '30d' },
  { label: '3 Bulan Terakhir', value: '90d' },
  { label: '6 Bulan Terakhir', value: '180d' },
  { label: '1 Tahun Terakhir', value: '365d' },
];

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ isDarkMode = true }) => {
  const [period, setPeriod] = useState('7 Hari Terakhir');
  const [dashboardSummary, setDashboardSummary] = useState<AnalyticsDashboardData | null>(null);
  const [aiAnalytics, setAiAnalytics] = useState<AnalyticsDashboardData['ai'] | null>(null);
  const [articlesAnalytics, setArticlesAnalytics] = useState<AnalyticsDashboardData['articles'] | null>(null);
  const [educationAnalytics, setEducationAnalytics] = useState<AnalyticsDashboardData['education'] | null>(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<AnalyticsDashboardData['feedback'] | null>(null);
  const [charts, setCharts] = useState<{
    users: AnalyticsChartPoint[];
    ai: AnalyticsChartPoint[];
    articles: AnalyticsChartPoint[];
    education: AnalyticsChartPoint[];
    feedback: AnalyticsChartPoint[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodValue = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.label === period)?.value ?? '7d',
    [period]
  );

  const loadAnalytics = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
      setError(null);
    }
    try {
      const [dashboard, users, ai, articles, education, feedback, chartsData] = await Promise.all([
        fetchAnalyticsDashboard(periodValue),
        fetchAnalyticsUsers(periodValue),
        fetchAnalyticsAI(periodValue),
        fetchAnalyticsArticles(periodValue),
        fetchAnalyticsEducation(periodValue),
        fetchAnalyticsFeedback(periodValue),
        fetchAnalyticsCharts(periodValue),
      ]);

      setDashboardSummary(dashboard);
      setAiAnalytics(ai);
      setArticlesAnalytics(articles);
      setEducationAnalytics(education);
      setFeedbackAnalytics(feedback);
      setCharts(chartsData);
    } catch (fetchError) {
      console.error('[AnalyticsPanel] loadAnalytics error', fetchError);
      if (!isBackground) {
        setError('Gagal memuat data analytics. Silakan coba lagi.');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(() => {
      loadAnalytics(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [periodValue]);

  const downloadBlob = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportAnalyticsCSV(periodValue);
      downloadBlob(blob, `analytics_export_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (exportError) {
      console.error('[AnalyticsPanel] export CSV failed', exportError);
      toast.error('Gagal mengunduh CSV analytics.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportAnalyticsPDF(periodValue);
      downloadBlob(blob, `analytics_export_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (exportError) {
      console.error('[AnalyticsPanel] export PDF failed', exportError);
      toast.error('Gagal mengunduh PDF analytics.');
    }
  };

  const summaryCards = [
    {
      title: 'Total Pengguna',
      value: dashboardSummary ? dashboardSummary.users.totalUsers.toLocaleString() : '—',
      change: 'Aktual',
      isPositive: true,
      icon: Users,
      description: 'Total anggota terdaftar.',
    },
    {
      title: 'Aktif Hari Ini',
      value: dashboardSummary ? dashboardSummary.users.activeToday.toLocaleString() : '—',
      change: 'Aktual',
      isPositive: true,
      icon: TrendingUp,
      description: 'Pengguna aktif 24 jam terakhir.',
    },
    {
      title: 'Baru Bulan Ini',
      value: dashboardSummary ? dashboardSummary.users.newThisMonth.toLocaleString() : '—',
      change: 'Aktual',
      isPositive: true,
      icon: UserPlus,
      description: 'Pendaftaran baru bulan ini.',
    },
    {
      title: 'Tingkat Retensi',
      value: dashboardSummary ? `${dashboardSummary.users.retentionRate}%` : '—',
      change: 'Aktual',
      isPositive: dashboardSummary ? dashboardSummary.users.retentionRate >= 0 : true,
      icon: Zap,
      description: 'Persentase pengguna kembali.',
    },
  ];

  const aiCards = [
    {
      title: 'Total Chat',
      value: aiAnalytics ? aiAnalytics.totalInteractions.toLocaleString() : '—',
      change: 'Aktual',
      isPositive: true,
      icon: Bot,
      description: 'Percakapan diproses AI.',
    },
    {
      title: 'Success Rate',
      value: aiAnalytics ? `${aiAnalytics.successRate}%` : '—',
      change: 'Aktual',
      isPositive: aiAnalytics ? aiAnalytics.successRate >= 80 : true,
      icon: TrendingUp,
      description: 'Persentase interaksi berhasil.',
    },
    {
      title: 'Rata-rata Latensi',
      value: aiAnalytics ? `${(aiAnalytics.avgLatency / 1000).toFixed(1)}s` : '—',
      change: 'Aktual',
      isPositive: aiAnalytics ? aiAnalytics.avgLatency < 2500 : true,
      icon: Clock,
      description: 'Waktu respon rata-rata.',
    },
    {
      title: 'Tak Terjawab',
      value: aiAnalytics ? String(aiAnalytics.totalUnanswered ?? aiAnalytics.totalFailed).toLocaleString() : '—',
      change: 'Aktual',
      isPositive: false,
      icon: AlertCircle,
      description: 'Percakapan gagal, fallback, atau tidak terjawab.',
    },
  ];

  const topArticles = articlesAnalytics?.topArticles ?? [];
  const topEducation = educationAnalytics?.topEducation ?? [];

  const feedbackCards = [
    {
      title: 'Total Feedback',
      value: feedbackAnalytics ? feedbackAnalytics.totalFeedback.toLocaleString() : '—',
      change: 'Aktual',
      isPositive: true,
      icon: MessageSquare,
      description: 'Jumlah masukan pengguna.',
    },
  ];

  const userGrowthData = charts?.users ?? [];
  const chatVolumeData = charts?.ai ?? [];
  const viewData = charts?.articles ?? [];
  const productViewData = charts?.education ?? [];

  const hasAnyData =
    !!dashboardSummary &&
    (dashboardSummary.users.totalUsers > 0 ||
      dashboardSummary.ai.totalInteractions > 0 ||
      dashboardSummary.articles.totalArticleViews > 0 ||
      dashboardSummary.education.totalEducationViews > 0 ||
      dashboardSummary.feedback.totalFeedback > 0 ||
      userGrowthData.some((point) => point.value > 0) ||
      chatVolumeData.some((point) => point.value > 0) ||
      viewData.some((point) => point.value > 0) ||
      productViewData.some((point) => point.value > 0));

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 md:mb-4">
        <div>
          <h2 className={`text-lg md:text-xl lg:text-2xl font-serif font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Statistik & Analitik</h2>
          <p className={`text-[9px] md:text-[10px] font-medium uppercase tracking-[0.15em] md:tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>Wawasan & ikhtisar performa platform</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className={`relative px-3 py-1.5 md:py-2 rounded-xl flex items-center gap-2 md:gap-3 transition-all ${isDarkMode ? 'bg-white/5 border border-white/5 focus-within:border-brand-accent/50' : 'bg-gray-50 border border-gray-200 shadow-xs focus-within:border-brand-primary/50'}`}>
            <Filter className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={`bg-transparent text-[8px] md:text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none pr-5 md:pr-6 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.label} value={option.label} className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:text-brand-accent hover:bg-brand-accent/5 hover:border-brand-accent/30' : 'bg-white text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 shadow-xs border border-gray-200'}`}
            >
              <Download className="w-3 md:w-3.5 h-3 md:h-3.5" /> CSV
            </button>
            <button
              onClick={handleExportPDF}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-brand-accent/20' : 'bg-brand-primary text-white hover:opacity-95 shadow-brand-primary/20'}`}
            >
              <FileText className="w-3 md:w-3.5 h-3 md:h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="border rounded-2xl p-5 bg-[#ffeded] text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadAnalytics()}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-red-700"
          >
            Muat Ulang
          </button>
        </div>
      ) : null}

      {!loading && dashboardSummary && !hasAnyData ? (
        <div className="rounded-2xl border border-dashed px-5 py-8 text-center bg-white/5 text-sm text-white/80">
          Belum ada data statistik tersedia.
        </div>
      ) : null}

      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>01 — Statistik Pengguna</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {summaryCards.map((card) => (
            <StatsCard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              isPositive={card.isPositive}
              icon={card.icon}
              description={card.description}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>02 — Performa AI</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {aiCards.map((card) => (
            <StatsCard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              isPositive={card.isPositive}
              icon={card.icon}
              description={card.description}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 lg:gap-8">
        <div className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 shadow-xl transition-all ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40 hover:border-white/10' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50 hover:border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className={`font-serif font-bold text-sm md:text-base lg:text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Artikel Terpopuler</h3>
            <button className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-brand-accent hover:text-brand-highlight' : 'text-brand-primary hover:opacity-80'}`}>Kelola</button>
          </div>
          <div className="space-y-2 md:space-y-3">
            {loading ? (
              <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Memuat artikel terpopuler...</p>
            ) : topArticles.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Belum ada data artikel.</p>
            ) : (
              topArticles.map((article, i) => (
                <div key={article.id || i} className={`flex items-center justify-between p-2.5 md:p-3.5 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 hover:border-brand-accent/20' : 'bg-gray-50 border-gray-100 hover:border-brand-primary/20 shadow-xs'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center font-serif font-black text-xs md:text-sm ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-white text-gray-500 shadow-xs border border-gray-50'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className={`text-[11px] md:text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{article.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
                        <Eye className="w-2.5 h-2.5 text-gray-500" />
                        <span className={`text-[8px] md:text-[9px] font-medium ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>{article.views.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`}>
                    <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3" /> {article.growth || 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 shadow-xl transition-all ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40 hover:border-white/10' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50 hover:border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className={`font-serif font-bold text-sm md:text-base lg:text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Edukasi Terpopuler</h3>
            <button className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-brand-accent hover:text-brand-highlight' : 'text-brand-primary hover:opacity-80'}`}>Lihat</button>
          </div>
          <div className="space-y-2 md:space-y-3">
            {loading ? (
              <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Memuat edukasi terpopuler...</p>
            ) : topEducation.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Belum ada data edukasi.</p>
            ) : (
              topEducation.map((edu, i) => (
                <div key={edu.id || i} className={`flex items-center justify-between p-2.5 md:p-3.5 rounded-xl border transition-all cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/5 hover:border-brand-accent/20' : 'bg-gray-50 border-gray-100 hover:border-brand-primary/20 shadow-xs'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary shadow-xs'}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-[11px] md:text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{edu.title}</p>
                      <p className={`text-[8px] md:text-[9px] font-medium mt-0.5 md:mt-1 ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>
                        {edu.views.toLocaleString()} views • Rating {edu.rating ? edu.rating.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button className={`p-1.5 md:p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-gray-100/50'}`}>
                    <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 lg:p-7 shadow-xl transition-all ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40 hover:border-white/10' : 'bg-white border-gray-100 shadow-gray-200/50 hover:border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className={`font-serif font-black text-sm md:text-base lg:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Analisis Feedback & Sentimen</h3>
          <ArrowUpRight className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`} />
        </div>
        <div className="grid grid-cols-1 md:max-w-md gap-3 md:gap-5">
          {feedbackCards.map((card) => (
            <div key={card.title} className={`p-3.5 md:p-5 rounded-xl md:rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100 shadow-xs'}`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-brand-accent text-black shadow-brand-accent/20' : 'bg-brand-primary text-white shadow-brand-primary/10'}`}>
                  <card.icon className="w-3 md:w-3.5 h-3 md:h-3.5" />
                </div>
                <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{card.title}</span>
              </div>
              <p className={`text-xl md:text-2xl lg:text-3xl font-serif font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
              <p className={`text-[8px] md:text-[9px] font-bold mt-1 md:mt-1.5 ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>03 — Grafik Tren Pertumbuhan</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <ChartCard
            title="Pertumbuhan Pengguna Terdaftar"
            type="area"
            data={userGrowthData}
            isDarkMode={isDarkMode}
            height={320}
            currentRange={period}
            onRangeChange={setPeriod}
          />
          <ChartCard
            title="Volume Chat AI"
            type="bar"
            data={chatVolumeData}
            isDarkMode={isDarkMode}
            height={320}
            currentRange={period}
            onRangeChange={setPeriod}
          />
          <ChartCard
            title="Tren Artikel Dibaca"
            type="line"
            data={viewData}
            isDarkMode={isDarkMode}
            height={320}
            currentRange={period}
            onRangeChange={setPeriod}
          />
          <ChartCard
            title="Aktivitas Penayangan Edukasi"
            type="line"
            data={productViewData}
            isDarkMode={isDarkMode}
            height={320}
            currentRange={period}
            onRangeChange={setPeriod}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
