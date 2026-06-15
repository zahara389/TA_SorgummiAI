import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive: boolean;
  icon: LucideIcon;
  description: string;
  isDarkMode?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, isPositive, icon: Icon, description, isDarkMode = true }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`border rounded-xl md:rounded-2xl p-4 md:p-5 shadow-xl relative overflow-hidden group transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}
    >
      <div className={`absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 blur-[30px] md:blur-[40px] rounded-full -mr-8 -mt-8 transition-all ${isDarkMode ? 'bg-brand-accent/5 group-hover:bg-brand-accent/10' : 'bg-brand-primary/5 group-hover:bg-brand-primary/10'}`} />
      
      <div className="flex justify-between items-start mb-3 md:mb-4 relative z-10">
        <div className={`w-9 h-9 md:w-11 md:h-11 border rounded-xl md:rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white/50 group-hover:bg-brand-accent group-hover:text-black' : 'bg-gray-50 border-gray-100 text-gray-400 group-hover:bg-brand-primary group-hover:text-white shadow-sm'}`}>
          <Icon className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
        </div>
        {change ? (
        <div className={`flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-bold shadow-lg transition-all ${
          isPositive 
          ? (isDarkMode ? 'bg-brand-accent text-black shadow-brand-accent/20' : 'bg-brand-primary text-white shadow-brand-primary/20') 
          : 'bg-red-500/10 text-red-500 shadow-red-500/10'
        }`}>
          {isPositive ? <TrendingUp className="w-2.5 h-2.5 md:w-3 h-3" /> : <TrendingDown className="w-2.5 h-2.5 md:w-3 h-3" />}
          {change}
        </div>
      ) : null}
      </div>
      
      <div className="relative z-10">
        <h3 className={`text-[8px] md:text-[9px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mb-1 transition-colors ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>{title}</h3>
        <p className={`text-xl md:text-2xl lg:text-3xl font-serif font-semibold mb-1.5 md:mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-[9px] md:text-[10px] leading-relaxed font-medium transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-600'}`}>{description}</p>
      </div>
    </motion.div>
  );
};

export default StatsCard;
