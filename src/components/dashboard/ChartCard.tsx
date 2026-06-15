import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart, 
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface ChartCardProps {
  title: string;
  type: 'line' | 'bar' | 'area' | 'pie';
  data: any[];
  height?: number;
  isDarkMode?: boolean;
  onRangeChange?: (range: string) => void;
  currentRange?: string;
  hideTitle?: boolean;
}

const CHART_COLORS = ['#A3FF12', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#10B981'];

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  type, 
  data, 
  height = 280, 
  isDarkMode = true,
  onRangeChange,
  currentRange,
  hideTitle = false
}) => {
  const [localRange, setLocalRange] = React.useState(currentRange || '7 Hari Terakhir');

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLocalRange(val);
    if (onRangeChange) {
      onRangeChange(val);
    }
  };

  React.useEffect(() => {
    if (currentRange) {
      setLocalRange(currentRange);
    }
  }, [currentRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`border p-1.5 md:p-2 rounded-lg shadow-2xl transition-all duration-300 ${isDarkMode ? 'bg-[#1A231E] border-white/10' : 'bg-white border-gray-200'}`}>
          <p className={`text-[8px] md:text-[9px] font-black mb-0.5 uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{label}</p>
          <p className={`text-sm md:text-base font-serif font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const axisColor = isDarkMode ? '#ffffff30' : '#00000030';
  const gridColor = isDarkMode ? '#ffffff08' : '#00000005';

  return (
    <div className={`border rounded-xl md:rounded-2xl p-4 md:p-5 lg:p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40 hover:border-white/10' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50 hover:border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        {!hideTitle && (
          <h3 className={`font-serif font-bold text-xs md:text-sm lg:text-base transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        )}
        <div className={`relative px-2 py-1 rounded-lg transition-all ${isDarkMode ? 'bg-white/5 border border-white/5 focus-within:border-brand-accent/50' : 'bg-gray-50 border border-gray-200 shadow-xs focus-within:border-brand-primary/50'}`}>
          <select 
            value={localRange}
            onChange={handleRangeChange}
            className={`bg-transparent text-[8px] md:text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none px-1 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            <option value="7 Hari Terakhir" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>7 Hari</option>
            <option value="30 Hari Terakhir" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>30 Hari</option>
            <option value="3 Bulan Terakhir" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>3 Bulan</option>
            <option value="6 Bulan Terakhir" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>6 Bulan</option>
            <option value="1 Tahun Terakhir" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>1 Tahun</option>
          </select>
        </div>
      </div>

      <div className="w-full" style={{ height: window.innerWidth < 768 ? height * 0.8 : height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDarkMode ? '#A3FF12' : '#10B981'} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={isDarkMode ? '#A3FF12' : '#10B981'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke={axisColor} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ dy: 10, fill: axisColor }}
              />
              <YAxis 
                stroke={axisColor} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: axisColor }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isDarkMode ? '#A3FF12' : '#10B981'} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke={axisColor} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ dy: 10, fill: axisColor }}
              />
              <YAxis 
                stroke={axisColor} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: axisColor }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: axisColor }} />
              <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: axisColor }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke={isDarkMode ? '#FFFFFF' : '#3B82F6'} strokeWidth={4} dot={{ fill: isDarkMode ? '#FFFFFF' : '#3B82F6', r: 4 }} activeDot={{ r: 8, stroke: isDarkMode ? '#A3FF12' : '#10B981', strokeWidth: 2 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartCard;
