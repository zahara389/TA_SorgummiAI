import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Package, 
  Bot, 
  HelpCircle, 
  MessageSquare, 
  BarChart3, 
  Bell, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isDarkMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  isDarkMode = true,
  isOpen,
  onClose
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Manajemen Pengguna', icon: Users },
    { id: 'edukasi', label: 'Edukasi & Solusi', icon: BookOpen },
    { id: 'pengelolaan', label: 'Pengelolaan', icon: Package },
    { id: 'chatbot', label: 'AI Chatbot Monitoring', icon: Bot },
    { id: 'faq', label: 'Manajemen FAQ', icon: HelpCircle },
    { id: 'statistik', label: 'Statistik & Analitik', icon: BarChart3 },
    { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
    { id: 'pengaturan', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`w-64 md:w-72 border-r h-screen flex flex-col fixed left-0 top-0 z-[150] transition-all duration-300 lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isDarkMode ? 'bg-[#0c1410] border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/20'}`}>
      <div className="p-5 md:p-6 lg:p-7 flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-colors ${isDarkMode ? 'bg-brand-accent shadow-brand-accent/20' : 'bg-brand-primary shadow-brand-primary/20'}`}>
            <Bot className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-black' : 'text-white'}`} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className={`text-sm md:text-base lg:text-lg font-serif font-black tracking-tight transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sorgummi <span className={isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}>AI</span></h1>
            <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>ADMIN PORTAL</p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onClose}
          className="lg:hidden p-2 text-white/40 hover:text-white"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-1.5 md:space-y-2 scrollbar-thin scroll-smooth no-scrollbar md:scrollbar-auto">
        {menuItems.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-2.5 md:gap-3 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl transition-all group relative border ${
              activeTab === item.id 
              ? (isDarkMode ? 'bg-brand-accent border-brand-accent/20 text-black font-black uppercase text-[10px] md:text-[11px] tracking-widest shadow-lg shadow-brand-accent/10' : 'bg-brand-primary border-brand-primary text-white font-black uppercase text-[10px] md:text-[11px] tracking-widest shadow-xl shadow-brand-primary/20')
              : (isDarkMode ? 'text-white/40 border-transparent hover:text-white hover:bg-white/5 font-bold text-xs md:text-sm' : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-50 font-bold text-xs md:text-sm')
            }`}
          >
            <item.icon className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
            <span className="whitespace-nowrap">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="sidebar-active"
                className="absolute right-3 md:right-4"
              >
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              </motion.div>
            )}
          </button>
        ))}
      </div>
      
      <div className={`p-4 md:p-5 border-t flex-shrink-0 transition-colors ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
        <button 
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-black uppercase text-[10px] md:text-[11px] tracking-widest"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5 font-bold" />
          <span className="whitespace-nowrap">Keluar</span>
        </button>
      </div>
    </div>
  );
};


export default DashboardSidebar;
