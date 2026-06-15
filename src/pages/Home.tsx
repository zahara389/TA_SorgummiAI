import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, 
  HelpCircle, 
  Package, 
  Users, 
  Box, 
  MessageSquare, 
  ArrowRight 
} from 'lucide-react';
import BrandBot from '../components/BrandBot';
import { fetchPublicStats } from '../services/dataService';
import { toast } from 'sonner';

interface HomeProps {
  setCurrentPage: (page: string) => void;
  setActiveTab: (tab: string) => void;
  isLoggedIn?: boolean;
}

const Home: React.FC<HomeProps> = ({ setCurrentPage, setActiveTab, isLoggedIn }) => {
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalMateri: number;
    totalChats: number;
    averageRating: number;
    totalUsers?: number;
  } | null>(null);

  const handleChatNav = () => {
    if (!isLoggedIn) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
      }, 1500);
    } else {
      setCurrentPage('Chat AI');
    }
  };

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        const res = await fetchPublicStats();
        if (active && res) {
          setStats(res);
        }
      } catch (err) {
        console.error('[Home Landing] Failed to load public stats:', err);
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const displayUserCount = stats && stats.totalUsers !== undefined && stats.totalUsers > 0
    ? stats.totalUsers
    : 5;

  const statsList = [
    {
      label: "Otomasi",
      value: stats && stats.totalChats !== undefined && stats.totalChats > 0
        ? `${stats.totalChats}+ Chat`
        : "120+ Chat",
      sub: "Bantuan Otomatis AI"
    },
    {
      label: "Sesi AI",
      value: stats && stats.totalSessions !== undefined && stats.totalSessions > 0
        ? `${stats.totalSessions} Sesi`
        : "10+ Sesi",
      sub: "Intensitas Penggunaan"
    },
    {
      label: "Materi & Info",
      value: stats && stats.totalMateri !== undefined && stats.totalMateri > 0
        ? `${stats.totalMateri} Materi`
        : "15+ Materi",
      sub: "Edukasi & Pengelolaan"
    },
    {
      label: "Kepuasan",
      value: stats && stats.averageRating !== undefined && stats.averageRating > 0
        ? `${stats.averageRating.toFixed(1)}/5`
        : "4.9/5",
      sub: "Kepuasan Pengguna"
    },
  ];
  return (
    <div className="font-sans">
      {/* HERO SECTION */}
      <section className="relative min-h-[80vh] flex items-center pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-[#040D09]">
        {/* Background layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#040D09] via-[#040D09]/40 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#040D09] z-[1]" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-20 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6 bg-white/10 backdrop-blur-md border border-brand-accent/20 w-fit px-4 py-1.5 rounded-full shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
                <span className="text-[10px] font-semibold text-white uppercase tracking-[0.2em]">PLATFORM CRM BERBASIS AI</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-sans font-semibold text-white leading-[1.2] mb-6 tracking-tight">
                <span className="text-brand-accent">CRM</span> Cerdas untuk <br className="hidden md:block" /> UMKM <span className="text-brand-accent">Sorgum</span>
              </h1>
              
              <p className="text-white/60 text-sm md:text-lg max-w-xl mb-8 md:mb-12 leading-relaxed font-medium">
                SorgummiAI menghadirkan layanan bantuan berbasis AI untuk membantu UMKM sorgum dalam pengelolaan produk, solusi budidaya, dan dukungan pelanggan secara lebih cepat dan efisien.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button 
                  type="button"
                  onClick={handleChatNav} 
                  className="bg-brand-accent text-black border-2 border-brand-accent px-6 md:px-7 py-3 md:py-3.5 rounded-xl md:rounded-[16px] font-semibold text-sm md:text-base hover:bg-brand-highlight hover:border-brand-highlight transition-all shadow-xl shadow-brand-accent/20 active:scale-95 flex items-center justify-center gap-2.5"
                >
                  <Bot className="w-5 h-5 text-black" />
                  Tanya AI Sekarang
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrentPage('Tentang')} 
                  className="bg-white/5 border-2 border-white/10 text-white px-6 md:px-7 py-3 md:py-3.5 rounded-xl md:rounded-[16px] font-semibold text-sm md:text-base hover:bg-white hover:text-black transition-all active:scale-95"
                >
                  Jelajahi Fitur
                </button>
              </div>

              <div className="mt-16 flex items-center gap-8">
                <div className="flex -space-x-4">
                  {Array.from({ length: Math.min(displayUserCount, 4) }).map((_, i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-[#040D09] bg-gray-100 overflow-hidden shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${(i + 1) * 88}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-[#040D09] bg-brand-accent flex items-center justify-center text-black text-[10px] font-bold shadow-sm">
                    +{displayUserCount}
                  </div>
                </div>
                <p className="text-white/40 text-xs md:text-sm font-medium">
                  Digunakan oleh <span className="text-brand-accent font-semibold">{displayUserCount}+ Pelaku UMKM</span> sorgum untuk membantu <br /> layanan dan pengelolaan usaha secara digital.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="bg-white py-8 border-y border-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statsList.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <h3 className="text-xl font-serif font-semibold text-brand-primary mb-0.5">{stat.value}</h3>
                <p className="text-[10px] text-gray-500 font-medium">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN FEATURES */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-brand-accent font-semibold uppercase tracking-widest text-[8px] mb-2 block">FITUR PLATFORM</span>
            <h2 className="text-2xl md:text-3xl font-sans font-semibold text-brand-primary mb-3">Fitur CRM SorgummiAI</h2>
            <p className="text-gray-500 text-sm font-medium">Platform CRM berbasis AI untuk membantu UMKM sorgum dalam pelayanan, pengelolaan produk, dan dukungan usaha digital.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {
              [
                { 
                  icon: Bot, 
                  title: "AI Chatbot 24/7", 
                  desc: "Berikan respon cepat dan bantuan otomatis untuk berbagai kebutuhan pengguna dan UMKM sorgum.",
                  bg: "bg-[#f0f9ed]",
                  onClick: handleChatNav
                },
                { 
                  icon: HelpCircle, 
                  title: "Edukasi & Solusi", 
                  desc: "Temukan solusi cepat untuk berbagai kendala budidaya sorgum mulai dari tanah, hama, hingga panen.",
                  bg: "bg-blue-50",
                  onClick: () => { setCurrentPage('Edukasi'); setActiveTab('Semua Masalah'); }
                },
                { 
                  icon: Package, 
                  title: "Pengelolaan Produk", 
                  desc: "Kelola dan kembangkan produk sorgum mulai dari tepung, makanan olahan, minuman, hingga packaging produk.",
                  bg: "bg-purple-50",
                  onClick: () => { setCurrentPage('Edukasi'); setActiveTab('Masalah Usaha/Produk'); }
                },
                { 
                  icon: Users, 
                  title: "Dukungan UMKM", 
                  desc: "Membantu UMKM sorgum meningkatkan kualitas produk dan pelayanan melalui bantuan digital berbasis AI.",
                  bg: "bg-orange-50",
                  onClick: () => setCurrentPage('Tentang')
                },
                { 
                  icon: Box, 
                  title: "Penyimpanan & Kualitas", 
                  desc: "Panduan menjaga kualitas produk sorgum agar lebih tahan lama dan siap dipasarkan.",
                  bg: "bg-indigo-50",
                  onClick: () => { setCurrentPage('Edukasi'); setActiveTab('Masalah Penyimpanan'); }
                },
                { 
                  icon: MessageSquare, 
                  title: "Bantuan Cepat", 
                  desc: "Pengguna dapat langsung berkonsultasi dengan AI untuk mendapatkan solusi dan rekomendasi yang lebih spesifik.",
                  bg: "bg-rose-50",
                  onClick: handleChatNav
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -3 }}
                  onClick={feature.onClick}
                  className="p-5 md:p-7 rounded-[24px] md:rounded-[28px] border border-gray-100 bg-white hover:shadow-lg hover:border-brand-accent/20 transition-all group cursor-pointer"
                >
                  <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-brand-primary mb-2.5 font-serif">{feature.title}</h3>
                  <p className="text-gray-500 text-[12px] leading-relaxed font-medium mb-5">
                    {feature.desc}
                  </p>
                  <div className="flex items-center gap-2 text-brand-primary font-bold text-[9px] uppercase tracking-wider group-hover:gap-2.5 transition-all">
                    Lihat Detail <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>
              ))
            }
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-[#040D09] text-white relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <span className="text-brand-accent font-semibold uppercase tracking-widest text-[8px] mb-2 block">PROSES KERJA</span>
              <h2 className="text-2xl md:text-3xl font-sans font-semibold mb-3 md:mb-4 leading-tight">Cara Kerja SorgummiAI</h2>
              <p className="text-white/50 text-xs md:text-sm font-medium mb-6 md:mb-8 leading-relaxed">Hanya dalam beberapa langkah untuk mendapatkan solusi dan bantuan AI secara cepat.</p>
              
              <div className="space-y-6">
                {[
                  { step: "01", title: "Pilih Kebutuhan", desc: "Temukan solusi budidaya atau pengelolaan produk sesuai kebutuhan UMKM Anda." },
                  { step: "02", title: "Konsultasi dengan AI", desc: "Ajukan pertanyaan dan dapatkan rekomendasi secara cepat melalui Sorgum AI." },
                  { step: "03", title: "Terapkan Solusi", desc: "Gunakan panduan dan bantuan AI untuk membantu meningkatkan kualitas usaha dan produk sorgum Anda." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="text-2xl font-serif font-semibold text-white/10 group-hover:text-brand-accent transition-colors">{s.step}</div>
                    <div>
                      <h4 className="text-base font-semibold mb-0.5">{s.title}</h4>
                      <p className="text-white/40 text-[11px] leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2">
               <div className="relative">
                  <div className="absolute -inset-4 bg-brand-accent/5 blur-[40px] rounded-full" />
                  <div className="relative rounded-[24px] overflow-hidden border-[6px] border-white/5 shadow-2xl">
                     <img 
                       src="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=1200" 
                       alt="Dashboard Sorgummology" 
                       className="w-full h-auto"
                     />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-white flex justify-center items-center px-6">
        <div className="max-w-2xl w-full text-center">
          <BrandBot size="sm" className="mx-auto mb-6 shadow-md rounded-xl" />
          <h2 className="text-xl md:text-3xl font-sans font-semibold text-brand-primary mb-3 md:mb-4">Siap Mengembangkan UMKM Sorgum Anda?</h2>
          <p className="text-gray-500 text-sm md:text-base font-medium mb-6 md:mb-8 max-w-lg mx-auto">
            Gunakan teknologi CRM berbasis AI untuk membantu pengelolaan produk, layanan pengguna, dan pengembangan usaha sorgum secara lebih modern.
          </p>
          <button 
            type="button"
            onClick={handleChatNav}
            className="bg-brand-accent hover:bg-brand-highlight text-black px-8 py-4 rounded-[16px] font-semibold text-base shadow-lg shadow-brand-accent/10 flex items-center justify-center gap-3 mx-auto transition-all hover:scale-105 active:scale-95"
          >
            Mulai Sekarang
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
