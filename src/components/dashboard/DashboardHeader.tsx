import React, { useState } from 'react';
import { Bell, Grid, ExternalLink, Zap, Sun, Moon, LogOut, HelpCircle, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardHeaderProps {
  activeTab: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  profile: {
    name: string;
    avatar: string | null;
    role: string;
  };
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  activeTab, 
  isDarkMode, 
  toggleTheme, 
  onLogout, 
  onToggleSidebar,
  profile
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className={`h-14 md:h-16 backdrop-blur-xl border-b sticky top-0 z-40 px-3 md:px-6 flex items-center justify-between transition-colors duration-300 ${isDarkMode ? 'bg-[#0c1410]/80 border-white/5 shadow-black/20' : 'bg-white/80 border-gray-100 shadow-sm'}`}>
      <div className="flex items-center gap-3 md:gap-5 min-w-0">
        <button 
          type="button"
          onClick={onToggleSidebar}
          className={`lg:hidden w-9 h-9 rounded-xl border flex-shrink-0 flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:text-brand-accent' : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-brand-primary shadow-xs'}`}
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <h2 className={`font-serif font-black text-sm md:text-lg capitalize transition-colors truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {activeTab.replace('-', ' ')}
        </h2>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Theme Toggle */}
        <button 
          type="button"
          onClick={toggleTheme}
          className={`w-8 h-8 md:w-9 md:h-9 rounded-xl border flex items-center justify-center transition-all group ${isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:text-brand-accent' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-brand-primary shadow-xs'}`}
          title={isDarkMode ? "Lampu Nyala" : "Mode Gelap"}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-brand-accent/5 border border-brand-accent/10 rounded-full">
          <Zap className="w-2.5 h-2.5 text-brand-accent animate-pulse" />
          <span className="text-[8px] md:text-[9px] font-black text-brand-accent uppercase tracking-widest">AI Online</span>
        </div>
        
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative w-8 h-8 md:w-9 md:h-9 rounded-xl border flex items-center justify-center transition-all group shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white/60 hover:text-brand-accent shadow-black/20' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-brand-primary shadow-xs'}`}
          >
            <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full border-1.5 ${isDarkMode ? 'bg-brand-accent border-[#0c1410]' : 'bg-brand-primary border-white'}`} />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute right-0 mt-3 w-64 md:w-72 p-4 md:p-5 rounded-2xl md:rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#111814] border-white/10 shadow-black/60' : 'bg-white border-gray-200 shadow-gray-200/50'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notifikasi Baru</h4>
                  <button type="button" onClick={() => setShowNotifications(false)} className={`transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className={`p-2.5 md:p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100 shadow-xs'}`}>
                      <p className={`text-[10px] md:text-[11px] font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sistem Anomali</p>
                      <p className={`text-[9px] md:text-[10px] transition-colors ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Model AI memberikan respon rendah.</p>
                    </div>
                  ))}
                </div>
                <button type="button" className={`w-full mt-4 py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all ${isDarkMode ? 'bg-brand-accent/5 text-brand-accent border-brand-accent/10 hover:bg-brand-accent/10' : 'bg-brand-primary/5 text-brand-primary border-brand-primary/10 hover:bg-brand-primary/10'}`}>Lihat Semua</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className={`w-px h-6 md:h-7 mx-1 transition-colors ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`} />
        
        <div className="relative">
          <div className="flex items-center gap-2 md:gap-2.5 pl-1.5 group cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className={`text-[11px] md:text-xs font-black transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.name}</p>
              <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>{profile.role}</p>
            </div>
            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl border flex items-center justify-center font-black text-[10px] md:text-[11px] shadow-lg transition-all overflow-hidden ${isDarkMode ? 'bg-white border-white/10 text-black shadow-black/20' : 'bg-brand-primary border-brand-primary text-white shadow-brand-primary/10'}`}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (profile.name || '').split(' ').map(n => n[0]).join('')
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


export default DashboardHeader;
