import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  Package, 
  Bot, 
  TrendingUp, 
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  UserPlus,
  Zap
} from 'lucide-react';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import UserTable from '../../components/dashboard/UserTable';
import ChatbotMonitor from '../../components/dashboard/ChatbotMonitor';
import ProductTable from '../../components/dashboard/ProductTable';
import NotificationPanel from '../../components/dashboard/NotificationPanel';
import EducationTable from '../../components/dashboard/EducationTable';
import FAQTable from '../../components/dashboard/FAQTable';
import SettingsPanel from '../../components/dashboard/SettingsPanel';

import AnalyticsPanel from '../../components/dashboard/AnalyticsPanel';
import Modal from '../../components/dashboard/Modal';
import {
  fetchDashboardUsersCount,
  fetchDashboardChatCount,
  fetchDashboardArticlesCount,
  fetchDashboardKnowledgeGaps,
  fetchDashboardActivityChart,
  fetchDashboardTopCategories,
  fetchDashboardActivityTypes,
  fetchDashboardPopularTopics,
  fetchDashboardRecentActivities,
  fetchDashboardAIStatus,
  fetchAdminDashboardActivityLogs,
  fetchAdminProfile,
} from '../../services/dataService';

interface DashboardProps {
  onNavigateHome: () => void;
  onNavigate: (page: string) => void;
  userProfile?: any;
  onUpdateUserProfile?: (profile: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateHome, onNavigate, userProfile, onUpdateUserProfile }) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('dashboardTab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('dashboardTab', activeTab);
  }, [activeTab]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalAIChats, setTotalAIChats] = useState<number | null>(null);
  const [totalArticles, setTotalArticles] = useState<number | null>(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState<number | null>(null);
  const [activityChartData, setActivityChartData] = useState<Array<{ name: string; value: number }>>([]);
  const [topCategoryData, setTopCategoryData] = useState<Array<{ name: string; value: number }>>([]);
  const [activityTypes, setActivityTypes] = useState<Array<any>>([]);
  const [popularTopics, setPopularTopics] = useState<Array<any>>([]);
  const [recentActivities, setRecentActivities] = useState<Array<any>>([]);
  const displayedRecentActivities = recentActivities.slice(0, 4);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalPage, setActivityModalPage] = useState(1);
  const [activityModalLogs, setActivityModalLogs] = useState<Array<any>>([]);
  const [activityModalTotalPages, setActivityModalTotalPages] = useState(1);
  const [activityModalLoading, setActivityModalLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ status: string; accuracy: number; avgResponse: string } | null>(null);
  const [dashboardError, setDashboardError] = useState(false);
  
  // Profile state to stay consistent across dashboard — fetched from DB
  const [profile, setProfile] = useState({
    name: userProfile?.name || 'Administrator',
    role: userProfile?.role === 'admin' ? 'Super Admin' : 'Admin',
    avatar: userProfile?.avatar || null,
    email: userProfile?.email || 'admin123@gmail.com',
    phone: userProfile?.phone || '+62 812-3456-7890'
  });

  // Fetch admin profile from database on mount
  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const adminData = await fetchAdminProfile();
        setProfile({
          name: adminData.name || 'Administrator',
          role: adminData.role === 'admin' ? 'Super Admin' : 'Admin',
          avatar: adminData.avatar || null,
          email: adminData.email || 'admin123@gmail.com',
          phone: adminData.phone || '',
        });
      } catch (err) {
        console.error('[Dashboard] Failed to fetch admin profile:', err);
      }
    };
    loadAdminProfile();
  }, []);
  
  // Independent chart ranges for Dashboard overview
  const [userActivityRange, setUserActivityRange] = useState('7 Hari Terakhir');
  const [categoryRange, setCategoryRange] = useState('7 Hari Terakhir');

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const fetchDashboard = async () => {
    setDashboardError(false);
    try {
      const [users, chats, articles, gaps, activity, categories, types, topics, recent, ai] = await Promise.all([
        fetchDashboardUsersCount(),
        fetchDashboardChatCount(),
        fetchDashboardArticlesCount(),
        fetchDashboardKnowledgeGaps(),
        fetchDashboardActivityChart(),
        fetchDashboardTopCategories(),
        fetchDashboardActivityTypes(),
        fetchDashboardPopularTopics(),
        fetchDashboardRecentActivities(),
        fetchDashboardAIStatus(),
      ]);

      setTotalUsers(users.totalUsers);
      setTotalAIChats(chats.totalAIChats);
      setTotalArticles(articles.totalArticles);
      setKnowledgeGaps(gaps.unanswered);
      setActivityChartData((activity || []).map((it: any) => ({
        name: it.label || it.day || it.name || 'N/A',
        value: typeof it.value === 'number' ? it.value : (typeof it.total === 'number' ? it.total : (typeof it.count === 'number' ? it.count : 0))
      })));
      setTopCategoryData((categories || []).map((item: any) => ({
        name: item.name || item.label || 'Kategori',
        value: typeof item.total === 'number' ? item.total : (typeof item.value === 'number' ? item.value : 0)
      })));
      setActivityTypes(types || []);
      setPopularTopics((topics || []).map((item: any) => ({
        name: item.name || item.title || 'Topik',
        total: typeof item.total === 'number' ? item.total : (typeof item.value === 'number' ? item.value : 0)
      })));
      setRecentActivities((recent || []).slice(0, 4));
      setAiStatus(ai || null);
    } catch (err) {
      console.error('[Dashboard] fetchDashboard error', err);
      setDashboardError(true);
    }
  };

  const fetchAIStatus = async () => {
    try {
      const data = await fetchDashboardAIStatus();
      setAiStatus(data || null);
    } catch (err) {
      console.error('[Dashboard] fetchAIStatus error', err);
      setAiStatus(null);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    // separate AI status polling
    fetchAIStatus();
    const aiInterval = setInterval(fetchAIStatus, 30000);
    return () => { clearInterval(interval); clearInterval(aiInterval); };
  }, []);

  const loadActivityModalPage = async (page = 1) => {
    setActivityModalLoading(true);
    try {
      const result = await fetchAdminDashboardActivityLogs(page, 10);
      setActivityModalLogs(result.items || []);
      setActivityModalTotalPages(result.totalPages || 1);
      setActivityModalPage(result.page || page);
    } catch (err) {
      console.error('[Dashboard] loadActivityModalPage error', err);
      setActivityModalLogs([]);
      setActivityModalTotalPages(1);
    } finally {
      setActivityModalLoading(false);
    }
  };

  const renderStatValue = (value: number | null) => {
    if (dashboardError || value === null) return 'Data tidak tersedia';
    return value.toLocaleString();
  };

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#0c1410]' : 'bg-[#f8faf9]'}`}>
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }} 
        onLogout={onNavigateHome} 
        isDarkMode={isDarkMode}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden">
        <DashboardHeader 
          activeTab={activeTab} 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          profile={profile}
          onLogout={() => {
            if(confirm('Kembali ke halaman utama?')) {
              onNavigateHome();
            }
          }}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 scroll-smooth no-scrollbar md:scrollbar-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 md:space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  <StatsCard 
                    title="Total Pengguna" 
                    value={renderStatValue(totalUsers)} 
                    change="+12%" 
                    isPositive={true} 
                    icon={Users} 
                    description="Total UMKM aktif terdaftar di platform."
                    isDarkMode={isDarkMode}
                  />
                  <StatsCard 
                    title="Konsultasi AI" 
                    value={renderStatValue(totalAIChats)} 
                    change="+24%" 
                    isPositive={true} 
                    icon={Bot} 
                    description="Jumlah chat dengan asisten AI hari ini."
                    isDarkMode={isDarkMode}
                  />
                  <StatsCard 
                    title="Artikel Edukasi" 
                    value={renderStatValue(totalArticles)} 
                    change="+2" 
                    isPositive={true} 
                    icon={BookOpen} 
                    description="Total materi solusi yang dipublish."
                    isDarkMode={isDarkMode}
                  />
                  <StatsCard 
                    title="Knowledge Gaps" 
                    value={renderStatValue(knowledgeGaps)} 
                    change={knowledgeGaps === 0 ? "Optimal" : `-${Math.min(knowledgeGaps, 5)}%`} 
                    isPositive={knowledgeGaps === 0} 
                    icon={AlertCircle} 
                    description="Pertanyaan pengguna belum terjawab AI."
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={`border rounded-[40px] p-6 sm:p-8 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40 hover:border-white/10' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50 hover:border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.35em] mb-2 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`}>Aktivitas</p>
                        <h3 className={`font-serif font-bold text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Aktivitas Pengguna</h3>
                      </div>
                      <div className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {userActivityRange}
                      </div>
                    </div>

                    <ChartCard 
                      title="Aktivitas Pengguna" 
                      type="area" 
                      data={activityChartData} 
                      isDarkMode={isDarkMode}
                      currentRange={userActivityRange}
                      onRangeChange={setUserActivityRange}
                      hideTitle={true}
                      height={260}
                    />

                    <div className="mt-8 border-t border-white/10 pt-6">
                      <p className={`text-sm font-semibold uppercase tracking-[0.2em] mb-5 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`}>Rincian Tipe Aktivitas Pengguna</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(dashboardError ? [
                          { title: 'Data tidak tersedia', value: '-', detail: 'Tidak dapat memuat detail tipe aktivitas.', badge: '-' }
                        ] : activityTypes).map((item: any, index: number) => (
                          <div key={index} className={`rounded-3xl p-4 transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-3 gap-3">
                              <div>
                                <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                                <p className={`text-[10px] uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{item.badge}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${isDarkMode ? 'bg-brand-accent text-black' : 'bg-brand-primary text-white'}`}>{item.value}</span>
                            </div>
                            <p className={`text-[12px] leading-5 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-[40px] p-6 sm:p-8 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40 hover:border-white/10' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50 hover:border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.35em] mb-2 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`}>Kategori</p>
                        <h3 className={`font-serif font-bold text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Kategori Paling Dicari</h3>
                      </div>
                      <div className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {categoryRange}
                      </div>
                    </div>

                    <ChartCard 
                      title="Kategori Paling Dicari" 
                      type="bar" 
                      data={topCategoryData} 
                      isDarkMode={isDarkMode}
                      currentRange={categoryRange}
                      onRangeChange={setCategoryRange}
                      hideTitle={true}
                      height={260}
                    />

                    <div className="mt-8 border-t border-white/10 pt-6">
                      <p className={`text-sm font-semibold uppercase tracking-[0.2em] mb-5 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`}>Rincian Topik Kategori Terpopuler</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(dashboardError ? [
                          { name: 'Data tidak tersedia', total: 0 }
                        ] : popularTopics).map((item: any, index: number) => {
                          const maxTotal = Math.max(1, ...(dashboardError ? [0] : popularTopics.map((topic: any) => topic.total || 0)));
                          const progress = item.total ? Math.min(100, Math.max(0, (item.total / maxTotal) * 100)) : 0;
                          return (
                            <div key={index} className={`rounded-3xl p-4 transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                              <div className="flex items-center justify-between mb-3 gap-3">
                                <div>
                                  <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</h4>
                                  <p className={`text-[10px] uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Total sesi</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${isDarkMode ? 'bg-brand-accent text-black' : 'bg-brand-primary text-white'}`}>{item.total ?? '-'}</span>
                              </div>
                              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-brand-accent" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className={`xl:col-span-2 border rounded-[40px] p-6 sm:p-8 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40 hover:border-white/10' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50 hover:border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className={`font-serif font-bold text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Aktivitas Terbaru</h3>
                      <button
                        type="button"
                        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${isDarkMode ? 'text-brand-accent hover:text-brand-highlight' : 'text-brand-primary hover:opacity-80'}`}
                        onClick={() => {
                          setIsActivityModalOpen(true);
                          loadActivityModalPage(1);
                        }}
                      >
                        View All <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-6">
                      {(dashboardError ? [
                        { icon: 'user', type: 'Data error', label: 'Tidak dapat memuat aktivitas terbaru.', time: '-' }
                      ] : displayedRecentActivities).map((activity: any, i: number) => {
                        const IconComponent: any = typeof activity.icon === 'string'
                          ? (activity.icon === 'bot' ? Bot : activity.icon === 'user' ? UserPlus : activity.icon === 'book' ? BookOpen : MessageSquare)
                          : activity.icon;
                        return (
                        <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <IconComponent className={`w-5 h-5 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{activity.type}</span>
                              <span className={`text-[10px] font-medium transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>{activity.time}</span>
                            </div>
                            <p className={`text-sm font-medium leading-relaxed transition-colors ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{activity.label}</p>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                  <Modal
                    isOpen={isActivityModalOpen}
                    onClose={() => setIsActivityModalOpen(false)}
                    title="Semua Aktivitas Terbaru"
                    isDarkMode={isDarkMode}
                    size="max-w-4xl"
                  >
                    {activityModalLoading ? (
                      <div className="py-16 text-center text-sm text-white/70">Memuat aktivitas terbaru...</div>
                    ) : activityModalLogs.length === 0 ? (
                      <div className="py-16 text-center text-sm text-white/60">Belum ada aktivitas terbaru yang tercatat.</div>
                    ) : (
                      <div className="space-y-4">
                        {activityModalLogs.map((activity: any, index: number) => {
                          const IconComponent: any = typeof activity.icon === 'string'
                            ? (activity.icon === 'bot' ? Bot : activity.icon === 'user' ? UserPlus : activity.icon === 'book' ? BookOpen : MessageSquare)
                            : activity.icon;
                          return (
                            <div key={index} className={`rounded-3xl p-4 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition-all`}>
                              <div className="flex items-start gap-4 mb-3">
                                <div className={`w-11 h-11 rounded-3xl flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                  <IconComponent className={`w-5 h-5 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                      <p className={`text-[11px] uppercase tracking-[0.22em] font-black ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>{activity.type}</p>
                                      <h4 className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activity.action}</h4>
                                    </div>
                                    <span className={`text-[10px] font-medium uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>{activity.time}</span>
                                  </div>
                                  {activity.details && <p className={`mt-3 text-sm leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>{activity.details}</p>}
                                  {(activity.user_email || activity.user_id) && (
                                    <p className={`mt-3 text-[11px] uppercase tracking-[0.18em] ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Pengguna: {activity.user_email || activity.user_id}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-6 flex items-center justify-between gap-3">
                      <span className={`text-xs uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                        Halaman {activityModalPage} dari {activityModalTotalPages}
                      </span>
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          disabled={activityModalPage <= 1}
                          className="rounded-full border border-white/10 bg-black/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => loadActivityModalPage(Math.max(1, activityModalPage - 1))}
                        >
                          Sebelumnya
                        </button>
                        <button
                          type="button"
                          disabled={activityModalPage >= activityModalTotalPages}
                          className="rounded-full border border-white/10 bg-black/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => loadActivityModalPage(Math.min(activityModalTotalPages, activityModalPage + 1))}
                        >
                          Berikutnya
                        </button>
                      </div>
                    </div>
                  </Modal>
                  <div className="bg-brand-accent rounded-[40px] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                      <Zap className="w-32 h-32 text-black" />
                    </div>
                    <div className="relative z-10 font-serif">
                      <h3 className="text-black font-black text-2xl mb-4 leading-tight">AI Status Monitoring</h3>
                      <div className="inline-flex items-center gap-3 rounded-3xl bg-black/10 px-4 py-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black/60">Status</span>
                        <span className="text-base font-black text-black">{aiStatus ? (aiStatus.status === 'online' ? 'Online' : 'Offline') : (dashboardError ? 'Offline' : 'Memuat...')}</span>
                      </div>
                    </div>
                    <div className="space-y-4 relative z-10">
                      <button type="button" className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-900 transition-all active:scale-95">Optimize AI Prompt</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <UserTable isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {activeTab === 'chatbot' && (
              <motion.div key="chatbot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ChatbotMonitor isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {activeTab === 'pengelolaan' && (
              <motion.div key="pengelolaan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ProductTable isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {activeTab === 'edukasi' && (
              <motion.div key="edukasi" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <EducationTable isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {activeTab === 'faq' && (
              <motion.div key="faq" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <FAQTable isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {activeTab === 'notifikasi' && (
              <motion.div key="notifikasi" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <NotificationPanel isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {activeTab === 'statistik' && (
              <motion.div key="statistik" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AnalyticsPanel isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {activeTab === 'pengaturan' && (
              <motion.div key="pengaturan" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                <SettingsPanel 
                  isDarkMode={isDarkMode} 
                  onToggleTheme={toggleTheme} 
                  adminProfile={profile}
                  onUpdateProfile={(newProfile) => {
                    const updatedProfile = { ...profile, ...newProfile };
                    setProfile(updatedProfile);
                    if (onUpdateUserProfile) {
                      onUpdateUserProfile(newProfile);
                    }
                    // Persist to localStorage session so it syncs across the app
                    try {
                      const sessionStr = localStorage.getItem('sorgummology_user_session');
                      if (sessionStr) {
                        const session = JSON.parse(sessionStr);
                        if (newProfile.name) session.name = newProfile.name;
                        if (newProfile.phone) session.phone = newProfile.phone;
                        if (newProfile.avatar !== undefined) session.avatar = newProfile.avatar;
                        localStorage.setItem('sorgummology_user_session', JSON.stringify(session));
                      }
                    } catch (e) {
                      // silently ignore
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
