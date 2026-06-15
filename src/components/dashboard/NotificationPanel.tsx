import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from './Modal';
import { 
  Bell, 
  Send, 
  History, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Save, 
  Clock, 
  BookOpen, 
  Target, 
  Info, 
  AlertCircle, 
  Megaphone, 
  RefreshCcw,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Download,
  Trash2,
  Mail,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { toast } from 'sonner';
import { 
  getAllSubscribers, 
  createNotification, 
  deleteNotification, 
  getAllNotifications, 
  deleteSubscriber,
  uploadNotificationImage,
  getNotificationAnalytics,
  markNotificationRead,
} from '../../services/dataService';

interface NotificationPanelProps {
  isDarkMode?: boolean;
}

type InternalTab = 'riwayat' | 'kirim' | 'subscribers';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  status: 'Active' | 'Unsubscribed';
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  target: string;
  status: 'Terkirim' | 'Draft' | 'Terjadwal' | 'Gagal';
  date: string;
  imageUrl?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  scheduled_at?: string | null;
  sent_at?: string | null;
}

interface HistoryItem extends NotificationItem {}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('riwayat');
  const [searchHistory, setSearchHistory] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua Tipe');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [searchSubscriber, setSearchSubscriber] = useState('');
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<HistoryItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<{
    total: number;
    sent: number;
    scheduled?: number;
    failed?: number;
    read: number;
    unread: number;
    readRate: number;
    deliveryRate?: number;
    conversionRate: number;
    byType?: Array<{ type: string; total: number; read: number; unread: number }>;
    charts?: {
      typeDistribution: Array<{ name: string; value: number }>;
      statusDistribution: Array<{ name: string; value: number }>;
      readUnreadData: Array<{ name: string; value: number }>;
    };
  } | null>(null);

  // Subscribers State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // Notification State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isProcessingNotification, setIsProcessingNotification] = useState(false);

  // Fetch Subscribers from Firestore
  const fetchSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      const data = await getAllSubscribers();
      const mapped = data.map(s => ({
        id: s.id || Math.random().toString(),
        email: s.email,
        subscribedAt: s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : 'Recent',
        status: 'Active' as const // Defaulting all new ones to active
      }));
      setSubscribers(mapped);
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  const fetchNotifications = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getAllNotifications();
      const mapped = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type,
        target: item.target,
        status: item.status,
        imageUrl: item.image_url || item.imageUrl || null,
        is_read: item.is_read || false,
        scheduled_at: item.scheduled_at || null,
        sent_at: item.sent_at || item.created_at || null,
        read_at: item.read_at || null,
        date: item.created_at ? new Date(item.created_at).toLocaleString() : new Date().toLocaleString(),
      }));
      setHistory(mapped.reverse());
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      toast.error('Gagal memuat riwayat notifikasi.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subscribers') {
      fetchSubscribers();
    }
    if (activeTab === 'riwayat') {
      fetchNotifications();
      // Auto-fetch analytics when viewing history
      const fetchAnalytics = async () => {
        try {
          const analyticsData = await getNotificationAnalytics();
          console.log('[Analytics] Auto-fetch on history tab:', analyticsData);
          setAnalytics(analyticsData);
        } catch (err) {
          console.error('[Analytics] Failed to load analytics on history tab:', err);
          setAnalytics(null);
        }
      };
      fetchAnalytics();
    }
  }, [activeTab]);

  // Form State
  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'Semua User',
    selectedUsers: [] as string[],
    type: 'Info',
    schedule: 'Kirim Sekarang',
    date: '',
    time: '',
    mediaType: 'none' as 'none' | 'upload' | 'link',
    mediaUrl: '',
    mediaPreview: null as string | null
  });

  const dummyUsers = [
    { id: 'u1', name: 'Rahmat Santoso', email: 'rahmat@example.com' },
    { id: 'u2', name: 'Siti Aminah', email: 'siti@example.com' },
    { id: 'u3', name: 'Budi Hartono', email: 'budi@example.com' },
    { id: 'u4', name: 'Ani Wijaya', email: 'ani@example.com' },
    { id: 'u5', name: 'Dedi Kurniawan', email: 'dedi@example.com' },
  ];

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchHistory.toLowerCase());
      const matchesType = typeFilter === 'Semua Tipe' || item.type === typeFilter;
      const matchesStatus =
        statusFilter === 'Semua Status' ||
        statusFilter === 'Dibaca' && item.is_read ||
        statusFilter === 'Belum Dibaca' && !item.is_read && item.status === 'Terkirim' ||
        statusFilter === 'Terkirim' && item.status === 'Terkirim' && !item.is_read ||
        statusFilter === 'Terjadwal' && item.status === 'Terjadwal' ||
        statusFilter === 'Gagal' && item.status === 'Gagal';
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [history, searchHistory, statusFilter, typeFilter]);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => 
      sub.email.toLowerCase().includes(searchSubscriber.toLowerCase())
    );
  }, [subscribers, searchSubscriber]);

  const subscriberStats = useMemo(() => {
    return {
      total: subscribers.length,
      active: subscribers.filter(s => s.status === 'Active').length,
      unsubscribed: subscribers.filter(s => s.status === 'Unsubscribed').length
    };
  }, [subscribers]);

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('id-ID', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Email', 'Subscribed At', 'Status'];
      const dataRows = subscribers.map(sub => [sub.email, sub.subscribedAt, sub.status]);
      const csvContent = [headers, ...dataRows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Gagal mengekspor data.');
    }
  };

  const handleViewSubscriber = (sub: Subscriber) => {
    setSelectedNotification(null);
    setSelectedSubscriber(sub);
    setIsViewModalOpen(true);
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus subscriber ini?')) {
      try {
        await deleteSubscriber(id);
        setSubscribers(subscribers.filter(s => s.id !== id));
      } catch (err) {
        console.error('Failed to delete subscriber:', err);
        toast.error('Gagal menghapus subscriber.');
      }
    }
  };

  const handleOpenNotification = async (item: HistoryItem) => {
    setSelectedSubscriber(null);
    setSelectedNotification(item);
    setIsViewModalOpen(true);

    if (!item.is_read) {
      try {
        const updatedNotification = await markNotificationRead(item.id);
        setHistory(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true, read_at: updatedNotification.read_at } : n));
        setSelectedNotification(prev => prev ? { ...prev, is_read: true, read_at: updatedNotification.read_at } : prev);
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
  };

  const handleResendNotification = async (item: HistoryItem) => {
    if (!confirm('Kirim ulang notifikasi ini?')) return;
    setIsProcessingNotification(true);
    try {
      const payload = {
        title: item.title,
        content: item.content,
        type: item.type,
        target: item.target,
        status: 'Terkirim',
        imageUrl: item.imageUrl || null
      };
      const response = await createNotification(payload);
      if (response && (response.id || response.data || typeof response === 'object')) {
        toast.success('Notifikasi dikirim ulang.');
        fetchNotifications();
      } else {
        toast.error('Gagal mengirim ulang notifikasi.');
      }
    } catch (err) {
      console.error('Failed to resend notification:', err);
      toast.error('Gagal mengirim ulang notifikasi.');
    } finally {
      setIsProcessingNotification(false);
    }
  };

  const handleOpenAnalytics = async () => {
    setIsAnalyticsOpen(true);
    setIsLoadingAnalytics(true);
    try {
      const analyticsData = await getNotificationAnalytics();
      console.log('[Analytics] API Response:', analyticsData);
      
      if (analyticsData) {
        setAnalytics(analyticsData);
        console.log('[Analytics] Data successfully loaded:', {
          total: analyticsData.total,
          sent: analyticsData.sent,
          scheduled: analyticsData.scheduled,
          failed: analyticsData.failed,
          read: analyticsData.read,
          unread: analyticsData.unread,
          readRate: analyticsData.readRate,
          deliveryRate: analyticsData.deliveryRate
        });
      } else {
        console.warn('[Analytics] API returned empty data');
        setAnalytics(null);
      }
    } catch (err) {
      console.error('[Analytics] Failed to load analytics:', err);
      toast.error('Gagal memuat analytics notifikasi.');
      setAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Hapus notifikasi ini dari riwayat?')) return;
    setIsProcessingNotification(true);
    try {
      await deleteNotification(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Notifikasi berhasil dihapus.');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      toast.error('Gagal menghapus notifikasi.');
    } finally {
      setIsProcessingNotification(false);
    }
  };

  const handleNotificationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Hanya file JPG, JPEG, PNG, dan WEBP yang diperbolehkan.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, mediaPreview: reader.result as string, mediaType: 'upload' }));
    };
    reader.readAsDataURL(file);

    try {
      const imageUrl = await uploadNotificationImage(file);
      setForm(prev => ({ ...prev, mediaUrl: imageUrl, mediaType: 'upload' }));
      toast.success('Foto notifikasi berhasil diunggah.');
    } catch (err: any) {
      console.error('Upload notification image failed:', err);
      toast.error(err?.message || 'Gagal mengunggah foto notifikasi.');
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = form.selectedUsers.includes(userId)
      ? form.selectedUsers.filter(id => id !== userId)
      : [...form.selectedUsers, userId];
    setForm({ ...form, selectedUsers: newSelected });
  };

  const handleSendNotification = async () => {
    if (!form.title || !form.message) {
      toast.error('Judul dan Pesan wajib diisi!');
      return;
    }

    if (form.schedule === 'Jadwalkan') {
      if (!form.date || !form.time) {
        toast.error('Tanggal dan waktu jadwal wajib diisi.');
        return;
      }
      const scheduledDate = new Date(`${form.date}T${form.time}`);
      if (isNaN(scheduledDate.getTime())) {
        toast.error('Format tanggal atau waktu tidak valid.');
        return;
      }
      if (scheduledDate <= new Date()) {
        toast.error('Tanggal dan waktu jadwal tidak boleh di masa lalu.');
        return;
      }
    }

    setIsProcessingNotification(true);
    try {
      const targetLabel = form.target === 'Custom' ? `User Tertentu (${form.selectedUsers.length})` : (form.target === 'Semua' ? 'Semua User' : form.target);
      const payload: any = {
        title: form.title,
        content: form.message,
        type: form.type,
        target: targetLabel,
        imageUrl: form.mediaUrl || null,
        scheduleType: form.schedule === 'Jadwalkan' ? 'scheduled' : 'now',
      };

      if (form.schedule === 'Jadwalkan') {
        payload.scheduledAt = `${form.date}T${form.time}`;
      }

      const response = await createNotification(payload);
      if (response && (response.id || response.data || typeof response === 'object')) {
        toast.success(form.schedule === 'Jadwalkan' ? 'Notifikasi berhasil dijadwalkan!' : 'Notifikasi berhasil dikirim!');
        setActiveTab('riwayat');
        fetchNotifications();
        setForm({
          title: '',
          message: '',
          target: 'Semua User',
          selectedUsers: [],
          type: 'Info',
          schedule: 'Kirim Sekarang',
          date: '',
          time: '',
          mediaType: 'none',
          mediaUrl: '',
          mediaPreview: null
        });
      } else {
        toast.error('Gagal mengirim notifikasi.');
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
      toast.error('Gagal mengirim notifikasi.');
    } finally {
      setIsProcessingNotification(false);
    }
  };

  return (
    <div className={`space-y-6 md:space-y-8`}>
      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className={`text-lg md:text-xl lg:text-2xl font-serif font-black mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manajemen Notifikasi</h2>
          <p className={`text-[10px] md:text-xs font-medium transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Kirim pengumuman dan kelola riwayat komunikasi.</p>
        </div>
        
        <div className={`p-1 rounded-xl md:rounded-2xl flex gap-0.5 md:gap-1 transition-colors overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
          <button 
            onClick={() => setActiveTab('riwayat')}
            className={`px-3 md:px-5 py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 ${activeTab === 'riwayat' ? (isDarkMode ? 'bg-brand-accent text-black' : 'bg-brand-primary text-white shadow-sm') : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900')}`}
          >
            <History className="w-3 h-3 md:w-3.5 md:h-3.5" />
            Riwayat
          </button>
          <button 
            onClick={() => setActiveTab('kirim')}
            className={`px-3 md:px-5 py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 ${activeTab === 'kirim' ? (isDarkMode ? 'bg-brand-accent text-black' : 'bg-brand-primary text-white shadow-sm') : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900')}`}
          >
            <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
            Kirim
          </button>
          <button 
            onClick={() => setActiveTab('subscribers')}
            className={`px-3 md:px-5 py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 ${activeTab === 'subscribers' ? (isDarkMode ? 'bg-brand-accent text-black' : 'bg-brand-primary text-white shadow-sm') : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900')}`}
          >
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
            Subscribers
          </button>
        </div>
      </div>

      {activeTab === 'riwayat' ? (
        <div className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 lg:p-7 shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
          <div className="flex flex-col xl:flex-row gap-3 md:gap-4 lg:gap-6 mb-5 md:mb-6 lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 flex-1">
              <div className={`relative flex-1 group w-full`}>
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-brand-accent' : 'text-gray-400 group-focus-within:text-brand-primary'}`} />
                <input 
                  type="text" 
                  placeholder="Cari judul..." 
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className={`w-full bg-transparent border rounded-lg md:rounded-xl py-2 md:py-2.5 pl-9 md:pl-11 pr-4 text-[10px] md:text-[11px] font-bold outline-none transition-all ${isDarkMode ? 'border-white/5 focus:border-brand-accent text-white' : 'border-gray-100 focus:border-brand-primary text-gray-900 shadow-sm placeholder:text-gray-400'}`}
                />
              </div>
              <div className={`relative w-full sm:min-w-[180px] sm:w-auto`}>
                <Filter className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`} />
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`w-full bg-transparent border rounded-lg md:rounded-xl py-2 md:py-2.5 pl-9 md:pl-11 pr-7 text-[9px] md:text-[10px] font-black uppercase tracking-widest appearance-none outline-none transition-all cursor-pointer ${isDarkMode ? 'border-white/5 focus:border-brand-accent text-white' : 'border-gray-100 focus:border-brand-primary text-gray-900 shadow-sm'}`}
                >
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Semua Tipe</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Info</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Promo</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Warning</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Update</option>
                </select>
              </div>
              <div className={`relative w-full sm:min-w-[180px] sm:w-auto`}>
                <Filter className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`} />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full bg-transparent border rounded-lg md:rounded-xl py-2 md:py-2.5 pl-9 md:pl-11 pr-7 text-[9px] md:text-[10px] font-black uppercase tracking-widest appearance-none outline-none transition-all cursor-pointer ${isDarkMode ? 'border-white/5 focus:border-brand-accent text-white' : 'border-gray-100 focus:border-brand-primary text-gray-900 shadow-sm'}`}
                >
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Semua Status</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Terkirim</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Dibaca</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Belum Dibaca</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Terjadwal</option>
                  <option className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Gagal</option>
                </select>
              </div>
            </div>
            <button className={`p-2.5 rounded-xl transition-colors border self-end sm:self-auto ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-900 shadow-xs'}`}>
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                  <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Thumbnail</th>
                  <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Judul</th>
                  <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Tipe</th>
                  <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Target</th>
                  <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Status</th>
                  <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Dikirim</th>
                  <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Dibaca</th>
                  <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-right text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent text-[10px] md:text-[11px]">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={6} className={`py-14 text-center ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
                        <span>Memuat riwayat notifikasi...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`py-14 text-center ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                      Tidak ada riwayat notifikasi.
                    </td>
                  </tr>
                ) : filteredHistory.map((item) => (
                  <tr key={item.id} className={`group hover:bg-white/[0.02] transition-all ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                    <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className={`w-12 h-12 rounded-xl object-cover ${isDarkMode ? 'border-white/10 border' : 'border-gray-100 border'}`} />
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-gray-100 border border-gray-100'}`}>
                          <Bell className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5 font-bold">
                      <p className={`line-clamp-1 ${isDarkMode ? 'text-white group-hover:text-brand-accent' : 'text-gray-900 group-hover:text-brand-primary'}`}>{item.title}</p>
                    </td>
                    <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5">
                      <span className={`px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5 font-semibold">
                      {item.target}
                    </td>
                    <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5">
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            item.status === 'Terkirim' ? 'bg-green-500' :
                            item.status === 'Terjadwal' ? 'bg-blue-500' :
                            item.status === 'Gagal' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                          <span className={`font-black uppercase tracking-widest text-[7px] md:text-[8px] ${
                            item.status === 'Terkirim' ? 'text-green-500' :
                            item.status === 'Terjadwal' ? 'text-blue-500' :
                            item.status === 'Gagal' ? 'text-red-500' :
                            (isDarkMode ? 'text-white/40' : 'text-gray-400')
                          }`}>{item.status}</span>
                        </div>
                        {item.is_read && item.read_at && (
                          <span className={`text-[8px] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Dibaca: {formatDate(item.read_at)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5 font-mono text-[9px] md:text-[10px]">
                      {item.sent_at ? formatDate(item.sent_at) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5 font-mono text-[9px] md:text-[10px]">
                      {item.read_at ? formatDate(item.read_at) : <span className="text-gray-400">Belum dibaca</span>}
                    </td>
                    <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-1.5 transition-opacity">
                        <button
                          onClick={() => handleOpenNotification(item)}
                          className={`p-1 md:p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}
                          title="Lihat detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleResendNotification(item)}
                          disabled={isProcessingNotification}
                          className={`p-1 md:p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'} ${isProcessingNotification ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title="Kirim ulang"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(item.id)}
                          disabled={isProcessingNotification}
                          className={`p-1 md:p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-red-500/40 hover:text-red-500' : 'hover:bg-red-50 text-red-400 hover:text-red-500'} ${isProcessingNotification ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title="Hapus notifikasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'subscribers' ? (
        <div className="space-y-5 md:space-y-6 lg:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {[
              { label: 'Total Subscribers', value: subscriberStats.total, icon: Mail, color: 'brand' },
              { label: 'Active Subscribers', value: subscriberStats.active, icon: CheckCircle2, color: 'green' },
              { label: 'Unsubscribed', value: subscriberStats.unsubscribed, icon: X, color: 'red' },
            ].map((stat, i) => (
            <div key={i} className={`p-5 md:p-6 rounded-xl md:rounded-2xl border transition-all ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-xl shadow-black/40' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50'}`}>
              <div className="flex items-center gap-3 md:gap-4 mb-4">
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all ${
                  stat.color === 'brand' ? (isDarkMode ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary shadow-xs') :
                  stat.color === 'green' ? (isDarkMode ? 'bg-green-500/10 text-green-500' : 'bg-green-50 text-green-600 shadow-xs') : 
                  (isDarkMode ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600 shadow-xs')
                }`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-0.5 md:mb-1 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{stat.label}</p>
              <p className={`text-xl md:text-2xl lg:text-3xl font-serif font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
            </div>
          ))}
        </div>

          <div className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 lg:p-7 shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
            <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:gap-6 mb-5 md:mb-6 lg:items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4 flex-1">
                <div className={`relative flex-1 group`}>
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-brand-accent' : 'text-gray-400 group-focus-within:text-brand-primary'}`} />
                  <input 
                    type="text" 
                    placeholder="Cari email subscriber..." 
                    value={searchSubscriber}
                    onChange={(e) => setSearchSubscriber(e.target.value)}
                    className={`w-full bg-transparent border rounded-lg md:rounded-xl py-2 md:py-2.5 pl-9 md:pl-11 pr-4 text-[10px] md:text-[11px] font-bold outline-none transition-all ${isDarkMode ? 'border-white/5 focus:border-brand-accent text-white' : 'border-gray-100 focus:border-brand-primary text-gray-900 placeholder:text-gray-400 shadow-sm'}`}
                  />
                </div>
              </div>
              <button 
                onClick={() => {
                  fetchSubscribers();
                }}
                className={`p-2.5 rounded-xl transition-colors border ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-900 shadow-xs'}`}
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingSubscribers ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleExportCSV}
                className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 md:gap-2 border ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-xs'}`}
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Subscriber</th>
                    <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Tanggal</th>
                    <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-left text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Status</th>
                    <th className={`px-2 py-3 md:px-3 md:py-4 lg:py-5 text-right text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent text-[10px] md:text-[11px]">
                  {isLoadingSubscribers ? (
                    <tr>
                      <td colSpan={4} className={`py-12 md:py-16 text-center text-[10px] italic ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
                          <span>Memuat data subscriber...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className={`group hover:bg-white/[0.02] transition-colors ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                      <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5">
                        <div className="flex items-center gap-2 md:gap-2.5">
                          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5 text-brand-accent' : 'bg-gray-100 text-brand-primary shadow-xs'}`}>
                             <Mail className="w-3.5 h-3.5" />
                          </div>
                          <p className={`font-bold line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900 group-hover:text-brand-primary'}`}>{sub.email}</p>
                        </div>
                      </td>
                      <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5">
                        <span className="font-mono text-[9px] md:text-[10px]">{sub.subscribedAt}</span>
                      </td>
                      <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5">
                        <span className={`px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest ${
                          sub.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 md:px-3 md:py-4 lg:py-5 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-1.5 transition-opacity">
                          <button 
                            className={`p-1 md:p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`} 
                            title="Detail"
                            onClick={() => handleViewSubscriber(sub)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            className={`p-1 md:p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-red-500/40 hover:text-red-500' : 'hover:bg-red-50 text-red-400 hover:text-red-500'}`} 
                            title="Hapus"
                            onClick={() => handleDeleteSubscriber(sub.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSubscribers.length === 0 && (
                    <tr>
                      <td colSpan={4} className={`py-12 md:py-16 text-center text-[10px] italic ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
                        Tidak ada subscriber yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 lg:gap-8">
          {/* Form Side */}
          <div className={`lg:col-span-8 border rounded-xl md:rounded-2xl lg:rounded-[32px] p-4 md:p-6 lg:p-8 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div className="space-y-4 md:space-y-5">
                <div>
                  <label className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 md:mb-2 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Judul</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Info Pemeliharaan"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={`w-full bg-transparent border rounded-lg md:rounded-xl p-2.5 md:p-3 text-[11px] md:text-sm font-bold outline-none transition-all focus:ring-0 focus:outline-none ${isDarkMode ? 'border-white/5 focus:border-brand-accent text-white' : 'border-gray-200 focus:border-brand-primary text-gray-900 shadow-xs placeholder:text-gray-400'}`}
                  />
                </div>
                <div>
                  <label className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 md:mb-2 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Tipe</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                    {['Info', 'Promo', 'Warning', 'Update'].map((type) => (
                      <button 
                        key={type}
                        onClick={() => setForm({ ...form, type })}
                        className={`px-2 py-2 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 ${form.type === type ? (isDarkMode ? 'bg-brand-accent border-brand-accent text-black font-black' : 'bg-brand-primary border-brand-primary text-white shadow-xs') : (isDarkMode ? 'bg-white/5 border-white/5 text-white/40 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-900 shadow-xs')}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 md:mb-2 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Target Pengiriman</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Semua', 'Premium', 'Regular', 'Custom'].map((target) => (
                      <button 
                        key={target}
                        onClick={() => setForm({ ...form, target })}
                        className={`px-3 py-2 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 ${form.target === target ? (isDarkMode ? 'bg-white/10 border-brand-accent/50 text-brand-accent font-black' : 'bg-brand-primary/5 border-brand-primary text-brand-primary shadow-xs font-bold') : (isDarkMode ? 'bg-white/5 border-white/5 text-white/40 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-900 shadow-xs')}`}
                      >
                        {target}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:space-y-5">
                <div>
                  <label className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 md:mb-2 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Pesan Notifikasi</label>
                  <textarea 
                    placeholder="Tulis pesan..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    className={`w-full bg-transparent border rounded-lg md:rounded-xl p-2.5 md:p-3 text-[11px] md:text-sm font-bold outline-none transition-all resize-none shadow-xs focus:ring-0 focus:outline-none ${isDarkMode ? 'border-white/5 focus:border-brand-accent text-white placeholder:text-white/20' : 'border-gray-200 focus:border-brand-primary text-gray-900 placeholder:text-gray-400'}`}
                  ></textarea>
                </div>
                
                <div>
                  <label className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 md:mb-2 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Penjadwalan</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Sekarang', 'Jadwal'].map((rule) => (
                      <button 
                        key={rule}
                        onClick={() => setForm({ ...form, schedule: rule === 'Sekarang' ? 'Kirim Sekarang' : 'Jadwalkan' })}
                        className={`px-3 py-2 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 ${(rule === 'Sekarang' && form.schedule === 'Kirim Sekarang') || (rule === 'Jadwal' && form.schedule === 'Jadwalkan') ? (isDarkMode ? 'bg-white/10 border-brand-accent/50 text-brand-accent font-black' : 'bg-brand-primary/5 border-brand-primary text-brand-primary shadow-xs font-bold') : (isDarkMode ? 'bg-white/5 border-white/5 text-white/40 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-900 shadow-xs')}`}
                      >
                        {rule}
                      </button>
                    ))}
                  </div>
                  {form.schedule === 'Jadwalkan' && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-2 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Tanggal</label>
                        <input
                          type="date"
                          value={form.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className={`w-full bg-transparent border rounded-lg md:rounded-xl p-2.5 text-[10px] md:text-[11px] font-bold outline-none transition-all ${isDarkMode ? 'border-white/5 focus:border-brand-accent text-white' : 'border-gray-200 focus:border-brand-primary text-gray-900 shadow-xs placeholder:text-gray-400'}`}
                        />
                      </div>
                      <div>
                        <label className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-2 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Waktu</label>
                        <input
                          type="time"
                          value={form.time}
                          onChange={(e) => setForm({ ...form, time: e.target.value })}
                          className={`w-full bg-transparent border rounded-lg md:rounded-xl p-2.5 text-[10px] md:text-[11px] font-bold outline-none transition-all ${isDarkMode ? 'border-white/5 focus:border-brand-accent text-white' : 'border-gray-200 focus:border-brand-primary text-gray-900 shadow-xs placeholder:text-gray-400'}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Media Optional */}
            <div className="mb-6 md:mb-8">
              <label className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-2 md:mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Lampiran Media (Opsional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleNotificationImageUpload}
                className="hidden"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
                <div 
                  onClick={() => {
                    setForm({ ...form, mediaType: 'upload' });
                    fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${form.mediaType === 'upload' ? (isDarkMode ? 'bg-brand-accent/5 border-brand-accent text-brand-accent' : 'bg-brand-primary/5 border-brand-primary text-brand-primary shadow-xs') : (isDarkMode ? 'bg-white/5 border-white/5 text-white/20 hover:text-white/40 hover:bg-white/[0.07]' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100')}`}
                >
                  <ImageIcon className="w-5 h-5 md:w-6 md:h-6 mb-1.5 md:mb-2" />
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Upload Foto</span>
                </div>
                <div 
                  onClick={() => setForm({ ...form, mediaType: 'link' })}
                  className={`border-2 border-dashed rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${form.mediaType === 'link' ? (isDarkMode ? 'bg-brand-accent/5 border-brand-accent text-brand-accent' : 'bg-brand-primary/5 border-brand-primary text-brand-primary shadow-xs') : (isDarkMode ? 'bg-white/5 border-white/5 text-white/20 hover:text-white/40 hover:bg-white/[0.07]' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100')}`}
                >
                  <LinkIcon className="w-5 h-5 md:w-6 md:h-6 mb-1.5 md:mb-2" />
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Link Foto</span>
                </div>
                {(form.mediaPreview || form.mediaUrl) ? (
                  <div className={`relative p-2 md:p-2.5 rounded-xl md:rounded-2xl border flex items-center justify-center overflow-hidden transition-all ${isDarkMode ? 'bg-white/5 border-white/10 shadow-black/20' : 'bg-gray-50 border-gray-100 shadow-xs'}`}>
                    <div className="relative w-full h-full aspect-video rounded-lg overflow-hidden group">
                      <img src={form.mediaPreview || form.mediaUrl || ''} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => {
                           e.stopPropagation();
                           setForm({ ...form, mediaPreview: null, mediaUrl: '', mediaType: 'none' });
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                   <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl flex items-center justify-center border border-transparent ${isDarkMode ? 'bg-white/5 text-white/10' : 'bg-gray-50 text-gray-200'}`}>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest italic">Kosong</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <button 
                onClick={() => toast.info('Pratinjau...')}
                className={`flex-1 py-2.5 md:py-3.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 md:gap-2 border ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-900 shadow-xs'}`}
              >
                <Eye className="w-3.5 h-3.5" />
                Pratinjau
              </button>
              <button 
                onClick={handleSendNotification}
                disabled={isProcessingNotification}
                className={`flex-[2] py-2.5 md:py-3.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 md:gap-3 active:scale-[0.98] ${isProcessingNotification ? 'opacity-60 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-brand-accent/10' : 'bg-brand-primary text-white hover:opacity-95 shadow-brand-primary/20'}`}
              >
                {form.schedule === 'Kirim Sekarang' ? <Send className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {form.schedule === 'Kirim Sekarang' ? 'Kirim Notifikasi' : 'Jadwalkan Notifikasi'}
              </button>
            </div>
          </div>

          {/* Tips / Info Side */}
          <div className="lg:col-span-4 space-y-5 md:space-y-6">
            <div className={`border rounded-xl md:rounded-2xl lg:rounded-[32px] p-5 md:p-6 lg:p-7 transition-colors ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/20' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5">
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary Shadow-xs'}`}>
                  <Megaphone className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Engagement Tips</h4>
              </div>
              <ul className="space-y-2.5 md:space-y-3">
                {[
                  'Gunakan judul yang singkat & padat.',
                  'Waktu terbaik: 08:00 - 10:00 WIB.',
                  'Personalisasi meningkatkan klik.',
                  'Sertakan gambar untuk promo.',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2 md:gap-3">
                    <div className={`mt-1.5 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-brand-accent shadow-[0_0_8px_rgba(180,255,61,0.4)]' : 'bg-brand-primary'}`} />
                    <p className={`text-[9px] md:text-[10px] leading-relaxed transition-colors ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`rounded-xl md:rounded-2xl lg:rounded-[32px] p-5 md:p-6 lg:p-8 text-white relative overflow-hidden flex flex-col justify-between h-[180px] md:h-[220px] lg:h-[240px] group ${isDarkMode ? 'bg-brand-accent shadow-xl shadow-brand-accent/10' : 'bg-brand-primary shadow-xl shadow-brand-primary/20'}`}>
              <div className="absolute top-0 right-0 p-4 transform translate-x-4 -translate-y-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Target className={`w-24 h-24 md:w-32 md:h-32 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
              <div className="relative z-10">
                <h3 className={`text-base md:text-lg lg:text-xl font-serif font-black leading-tight mb-1.5 md:mb-2 ${isDarkMode ? 'text-black' : 'text-white'}`}>Tingkatkan Konversi</h3>
                <p className={`text-[10px] md:text-[11px] font-medium ${isDarkMode ? 'text-black/60' : 'text-white/70'}`}>Notifikasi "Promo" memiliki conversion rate tertinggi minggu ini.</p>
              </div>
              <button onClick={handleOpenAnalytics} className={`relative z-10 w-full py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${isDarkMode ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-brand-primary hover:bg-gray-50 shadow-xs'}`}>
                Lihat Detail
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Subscriber View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Subscriber"
        isDarkMode={isDarkMode}
        size="max-w-md"
      >
        {selectedSubscriber && (
          <div className="space-y-5">
            <div className={`flex items-center gap-4 p-4 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'}`}>
                <Mail className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Alamat Email</p>
                <p className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className={`p-4 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Status</p>
                <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                  selectedSubscriber.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {selectedSubscriber.status}
                </span>
              </div>
              <div className={`p-4 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Tanggal Subscribe</p>
                <p className={`text-[10px] md:text-xs font-bold font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.subscribedAt}</p>
              </div>
            </div>

            <div className={`p-5 md:p-6 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <h4 className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Info className="w-3.5 h-3.5" />
                Informasi Tambahan
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] md:text-[10px] font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Sumber:</span>
                  <span className={`text-[9px] md:text-[10px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Website Footer (Newsletter)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] md:text-[10px] font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Aktivitas Terakhir:</span>
                  <span className={`text-[9px] md:text-[10px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Memperbarui preferensi</span>
                </div>
              </div>
            </div>

            <div className="pt-2 md:pt-4 flex gap-3">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className={`flex-1 py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  handleDeleteSubscriber(selectedSubscriber.id);
                  setIsViewModalOpen(false);
                }}
                className={`flex-1 py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-[0.98]`}
              >
                Hapus Subscriber
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isViewModalOpen && !!selectedNotification}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Notifikasi"
        isDarkMode={isDarkMode}
        size="max-w-md"
      >
        {selectedNotification && (
          <div className="space-y-5">
            <div className={`flex items-center gap-4 p-4 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'}`}>
                <Megaphone className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Judul Notifikasi</p>
                <p className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedNotification.title}</p>
              </div>
            </div>

            <div className={`p-5 md:p-6 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Isi Pesan</p>
              <p className={`text-[11px] md:text-sm leading-relaxed ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>{selectedNotification.content}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className={`p-4 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Target</p>
                <p className={`text-[10px] md:text-[11px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedNotification.target}</p>
              </div>
              <div className={`p-4 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Status</p>
                <p className={`text-[10px] md:text-[11px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedNotification.status}</p>
              </div>
            </div>

            <div className={`pt-2 md:pt-4 flex gap-3`}>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className={`flex-1 py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  handleResendNotification(selectedNotification);
                  setIsViewModalOpen(false);
                }}
                className={`flex-1 py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight' : 'bg-brand-primary text-white hover:opacity-95'}`}
              >
                Kirim Ulang
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        title="Analytics Notifikasi"
        isDarkMode={isDarkMode}
        size="max-w-2xl"
      >
        <div className="space-y-5">
          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin">
                <div className={`w-8 h-8 border-4 rounded-full ${isDarkMode ? 'border-brand-accent/20 border-t-brand-accent' : 'border-gray-200 border-t-brand-primary'}`} />
              </div>
            </div>
          ) : analytics ? (
            <div className="space-y-5">
              {/* Key Stats Grid */}
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4`}>
                {[
                  { label: 'Total Notifikasi', value: analytics.total, icon: '📊' },
                  { label: 'Terkirim', value: analytics.sent, icon: '✉️' },
                  { label: 'Terjadwal', value: analytics.scheduled, icon: '📅' },
                  { label: 'Gagal', value: analytics.failed, icon: '❌' }
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-2xl mb-1 ${stat.icon}`} />
                    <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{stat.label}</p>
                    <p className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4`}>
                {[
                  { label: 'Dibaca', value: analytics.read, icon: '👁️' },
                  { label: 'Belum Dibaca', value: analytics.unread, icon: '🔔' },
                  { label: 'Read Rate', value: `${analytics.readRate}%`, icon: '📈' },
                  { label: 'Delivery Rate', value: `${analytics.deliveryRate}%`, icon: '🎯' }
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-2xl mb-1 ${stat.icon}`} />
                    <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{stat.label}</p>
                    <p className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Engagement Rates */}
              <div className={`p-5 md:p-6 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <h4 className={`text-sm md:text-base font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Engagement Metrics</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Read Rate', value: analytics.readRate, color: 'from-blue-500 to-blue-600' },
                    { label: 'Delivery Rate', value: analytics.deliveryRate, color: 'from-purple-500 to-purple-600' },
                    { label: 'Conversion Rate', value: analytics.conversionRate, color: 'from-green-500 to-green-600' }
                  ].map((metric, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>{metric.label}</span>
                        <span className={`text-base md:text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{metric.value}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}>
                        <div className={`h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(metric.value, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown by Type */}
              <div className={`p-5 md:p-6 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <h4 className={`text-sm md:text-base font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Breakdown Per Tipe</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analytics.byType && analytics.byType.map((typeData, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-xs'}`}>
                      <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{typeData.type}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] md:text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>Total</span>
                          <span className={`font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{typeData.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] md:text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>Dibaca</span>
                          <span className={`font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{typeData.read}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] md:text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>Belum Dibaca</span>
                          <span className={`font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{typeData.unread}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className={`grid grid-cols-2 gap-3 md:gap-4`}>
                <div className={`p-4 md:p-5 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Read Rate</p>
                  <p className={`text-2xl md:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{analytics.readRate}%</p>
                  <p className={`text-[9px] md:text-[10px] mt-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{analytics.read} dari {analytics.sent} dibaca</p>
                </div>
                <div className={`p-4 md:p-5 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Unread</p>
                  <p className={`text-2xl md:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{analytics.unread}</p>
                  <p className={`text-[9px] md:text-[10px] mt-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{Math.round((analytics.unread / analytics.sent) * 100) || 0}% dari terkirim</p>
                </div>
              </div>

              {/* Summary Info */}
              <div className={`p-5 md:p-6 rounded-xl md:rounded-2xl border-l-4 ${isDarkMode ? 'bg-brand-accent/5 border-brand-accent text-white' : 'bg-brand-primary/5 border-brand-primary text-gray-900'}`}>
                <p className="text-sm md:text-base leading-relaxed">
                  <span className="font-black">Total Notifikasi: {analytics.total}</span> telah dikirim dengan engagement rate mencapai <span className="font-black">{analytics.readRate}%</span>. Fokus pada peningkatan read rate dengan timing dan personalisasi konten yang lebih baik.
                </p>
              </div>
            </div>
          ) : isLoadingAnalytics ? null : analytics === null || analytics.total === 0 ? (
            <div className={`p-8 rounded-xl border text-center ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
              <p className="text-sm md:text-base">Tidak ada data notifikasi tersedia</p>
              <p className={`text-[10px] md:text-xs mt-2 ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>Mulai buat notifikasi baru untuk melihat analytics.</p>
            </div>
          ) : (
            <div className={`p-8 rounded-xl border text-center ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
              <p className="text-sm md:text-base">⚠️ Gagal memuat data analytics</p>
              <p className={`text-[10px] md:text-xs mt-2 ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>Silakan coba lagi atau hubungi support.</p>
            </div>
          )}
        </div>
        <div className={`grid grid-cols-2 gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        </div>
      </Modal>
    </div>
  );
};

export default NotificationPanel;