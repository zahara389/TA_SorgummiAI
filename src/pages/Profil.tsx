import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Settings2,
  Check,
  Bot,
  FileText,
  Wheat,
  Mail,
  Phone,
  Plus,
  Trash2,
  Lock,
  Globe,
  Moon,
  Bell,
  Zap,
  Droplets,
  ShieldCheck,
  Bookmark,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  Camera,
  Pencil,
  Users,
  Activity,
  History,
  Clock,
  Shield as ShieldIcon,
  LogOut,
  Monitor,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { logoutUser } from '../services/authService';
import {
  getUserSavedArticles,
  Article,
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getUserFields,
  addUserField,
  deleteUserField,
  getUserNotifications,
  markNotificationRead,
  changeUserPassword,
  deleteUserAccount,
  saveUserSettings,
  uploadFile
} from '../services/dataService';
import Modal from '../components/dashboard/Modal';
import { toast } from 'sonner';

interface ProfilProps {
  setCurrentPage: (page: string) => void;
  setIsLoggedIn: (val: boolean) => void;
  userEmail: string;
  userId?: string;
  userProfile?: any;
  setUserProfile?: (profile: any) => void;
}

const Profil: React.FC<ProfilProps> = ({ setCurrentPage, setIsLoggedIn, userEmail, userId, userProfile, setUserProfile }) => {
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [stats, setStats] = useState<{ aiChatCount: number; articlesReadCount: number }>({ aiChatCount: 0, articlesReadCount: 0 });
  const [lahanList, setLahanList] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setIsLoadingArticles(true);
      setIsLoadingNotifications(true);
      try {
        const [articles, fields, notifs, profile] = await Promise.all([
          getUserSavedArticles(userId),
          getUserFields(userId),
          getUserNotifications(userId),
          getUserProfile(userId)
        ]);

        setSavedArticles(articles || []);
        setLahanList(fields || []);
        setNotifications(notifs || []);
        setUnreadNotificationCount(
          (notifs || []).filter((notif: any) => !notif.is_read).length,
        );

        if (profile && setUserProfile) {
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoadingArticles(false);
        setIsLoadingNotifications(false);
      }
    };

    const fetchStats = async () => {
      if (!userId) return;
      try {
        const userStats = await getUserStats(userId);
        setStats(userStats || { aiChatCount: 0, articlesReadCount: 0 });
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
        setStats({ aiChatCount: 0, articlesReadCount: 0 });
      }
    };

    fetchData();
    fetchStats();
  }, [userId]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Local edit state
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    avatar: ""
  });

  useEffect(() => {
    if (userProfile) {
      setEditData({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        avatar: userProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + userProfile.email
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsUpdating(true);
    try {
      await updateUserProfile(userId, editData);
      if (setUserProfile) {
        setUserProfile({ ...userProfile, ...editData });
      }
      setIsEditingProfile(false);
      toast.success("Profil berhasil diperbarui");
    } catch (err) {
      toast.error("Gagal memperbarui profil");
    } finally {
      setIsUpdating(false);
    }
  };

  const [activeProfileTab, setActiveProfileTab] = useState("Ringkasan");
  const [activeAdminTab, setActiveAdminTab] = useState("Ringkasan");

  const [showAddLahanModal, setShowAddLahanModal] = useState(false);
  const [newLahan, setNewLahan] = useState({ name: '', size: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [profileLanguage, setProfileLanguage] = useState(userProfile?.language || "Bahasa Indonesia");
  const [darkMode, setDarkMode] = useState(userProfile?.dark_mode || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfileLanguage(userProfile.language || "Bahasa Indonesia");
      setDarkMode(!!userProfile.dark_mode);
    }
  }, [userProfile]);

  const handleAddLahan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newLahan.name || !newLahan.size) return;

    try {
      const resp = await addUserField(userId, newLahan.name, newLahan.size);
      setLahanList(prev => [...prev, resp]);
      setShowAddLahanModal(false);
      setNewLahan({ name: '', size: '' });
      toast.success("Lahan berhasil ditambahkan");
    } catch (err) {
      toast.error("Gagal menambahkan lahan");
    }
  };

  const handleDeleteLahan = async (id: string) => {
    try {
      await deleteUserField(id);
      setLahanList(prev => prev.filter(l => l.id !== id));
      toast.success("Lahan dihapus");
    } catch (err) {
      toast.error("Gagal menghapus lahan");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (passwordData.new !== passwordData.confirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    try {
      await changeUserPassword(userId, passwordData.old, passwordData.new);
      toast.success("Kata sandi diperbarui");
      setShowPasswordModal(false);
      setPasswordData({ old: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui kata sandi");
    }
  };

  const handleToggleDarkMode = async () => {
    if (!userId) return;
    const newVal = !darkMode;
    setDarkMode(newVal);
    try {
      await saveUserSettings(userId, profileLanguage, newVal);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    if (!userId) return;
    setProfileLanguage(lang);
    try {
      await saveUserSettings(userId, lang, darkMode);
      setShowLanguageModal(false);
      toast.success("Bahasa diperbarui");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    try {
      await deleteUserAccount(userId);
      toast.success("Akun berhasil dihapus");
      setShowDeleteConfirm(false);
      if (setUserProfile) setUserProfile(null);
      handleLogoutAction();
    } catch (err) {
      toast.error("Gagal menghapus akun");
    }
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    setIsLoadingNotifications(true);
    try {
      const notifs = await getUserNotifications(userId);
      setNotifications(notifs || []);
      setUnreadNotificationCount(
        (notifs || []).filter((notif: any) => !notif.is_read).length,
      );
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const getNotificationImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : window.location.origin;

    if (cleanPath.startsWith('/uploads/')) {
      return `${baseUrl}${cleanPath}`;
    }
    return `${baseUrl}/uploads/notifications${cleanPath}`;
  };

  const handleOpenNotification = async (notif: any) => {
    setSelectedNotification(notif);
    setIsNotificationModalOpen(true);

    if (notif && !notif.is_read && userId) {
      try {
        await markNotificationRead(notif.id, userId);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notif.id
              ? { ...item, is_read: true, read_at: new Date().toISOString() }
              : item,
          ),
        );
        setUnreadNotificationCount((prev) => Math.max(prev - 1, 0));
        setSelectedNotification((prev) =>
          prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : prev,
        );
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
  };

  const closeNotificationModal = () => {
    setIsNotificationModalOpen(false);
    setSelectedNotification(null);
  };

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userId) {
      try {
        const url = await uploadFile(file);
        const updatedProfile = { ...editData, avatar: url };
        setEditData(updatedProfile);
        // Update both local state and parent state immediately
        await updateUserProfile(userId, updatedProfile);
        if (setUserProfile) {
          setUserProfile((prev: any) => ({ ...prev, avatar: url }));
        }
        setShowAvatarMenu(false);
        toast.success("Foto profil diperbarui");
      } catch (err) {
        toast.error("Gagal mengunggah foto");
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userId) return;
    try {
      const updatedProfile = { ...editData, avatar: "" };
      setEditData(updatedProfile);
      await updateUserProfile(userId, updatedProfile);
      if (setUserProfile) {
        setUserProfile((prev: any) => ({ ...prev, avatar: "" }));
      }
      setShowAvatarMenu(false);
      toast.success("Foto profil dihapus");
    } catch (err) {
      toast.error("Gagal menghapus foto profil");
    }
  };

  // Password visibility states
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const isAdmin = userEmail === 'admin123@gmail.com';

  const handleLogoutAction = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setCurrentPage('Beranda');
    } catch (err) {
      toast.error("Gagal logout");
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 bg-[#fdfdfd] font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-[#0c1a12] rounded-[48px] p-10 md:p-14 mb-10 relative overflow-hidden shadow-2xl shadow-black/20 border border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-14">

            {/* Avatar Section */}
            <div className="relative">
              <div className="w-52 h-52 rounded-full border-[6px] border-white/5 overflow-hidden shadow-2xl relative bg-white/5 group">
                <img
                  src={editData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`}
                  alt="Profile"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Preview</div>
                </div>
              </div>

              {/* Avatar Menu Trigger */}
              <div className="absolute -bottom-1 left-4 flex items-center">
                <button
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  className="w-16 h-16 bg-[#76a111] border-[4px] border-[#0c1a12] rounded-full flex items-center justify-center cursor-pointer shadow-xl hover:shadow-[#76a111]/30 hover:scale-110 active:scale-95 transition-all z-20"
                >
                  <Pencil className="w-8 h-8 text-black" strokeWidth={2.5} />
                </button>

                <AnimatePresence>
                  {showAvatarMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAvatarMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute bottom-20 -left-4 w-48 bg-[#1a2e21] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-20"
                      >
                        <label className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                          <Camera className="w-4 h-4 text-brand-accent" />
                          <span className="text-xs font-bold text-white uppercase tracking-widest">Tambahkan Foto</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                        {editData.avatar && editData.avatar !== "" && (
                          <button
                            onClick={handleRemoveAvatar}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Hapus Foto</span>
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="flex-1 text-center md:text-left mt-8 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-3xl md:text-4xl font-sans font-bold text-white tracking-tight mb-3">
                    {userProfile?.name || 'User'}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <span className="bg-[#76a111] text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-[#76a111]/20">
                      {isAdmin ? 'System Admin' : (userProfile?.role === 'admin' ? 'Administrator' : 'PREMIUM MEMBER')}
                    </span>
                    <div className="flex items-center gap-2 text-white/40 text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-white/20" />
                      <span className="opacity-80">{userProfile?.location || 'belum diisi'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-white/60 text-lg font-medium italic mt-6 max-w-xl leading-relaxed">
                {userProfile?.bio || "tambahkan bio anda"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {(isAdmin ? ['Ringkasan', 'Pengaturan', 'Keamanan', 'Aktivitas'] : ['Ringkasan', 'Lahan Saya', 'Pengaturan', 'Pemberitahuan']).map((tab) => (
            <button
              key={tab}
              onClick={() => isAdmin ? setActiveAdminTab(tab) : setActiveProfileTab(tab)}
              className={`px-8 py-4 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all border flex items-center gap-2 ${(isAdmin ? activeAdminTab === tab : activeProfileTab === tab)
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20'
                  : 'bg-white text-gray-400 border-gray-100 hover:border-brand-primary/30 hover:text-brand-primary'
                }`}
            >
              {tab === 'Pemberitahuan' ? (
                <Bell className="w-5 h-5" />
              ) : tab === 'Keamanan' ? (
                <ShieldIcon className="w-4 h-4" />
              ) : tab === 'Aktivitas' ? (
                <Activity className="w-4 h-4" />
              ) : tab}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {isAdmin ? (
              <>
                {activeAdminTab === 'Ringkasan' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Admin Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Total User', value: '1,284', icon: Users, color: 'brand' },
                        { label: 'Total Chat AI', value: stats.aiChatCount, icon: Bot, color: 'blue' },
                        { label: 'Total Artikel', value: stats.articlesReadCount, icon: FileText, color: 'green' },
                        { label: 'System Status', value: 'Online ✅', icon: Activity, color: 'accent' }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${stat.color === 'brand' ? 'bg-brand-primary/5 text-brand-primary' :
                              stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                                stat.color === 'green' ? 'bg-green-50 text-green-500' :
                                  'bg-brand-accent/10 text-brand-accent'
                            }`}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest block mb-1">{stat.label}</span>
                          <span className="text-xl font-bold text-brand-primary">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                      <h3 className="text-xl font-serif font-semibold text-brand-primary mb-6">Portal Administrator</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        Selamat datang di dashboard manajemen sistem. Sebagai administrator, Anda memiliki wewenang penuh untuk memantau aktivitas pengguna,
                        mengelola konten AI, dan mengawasi kesehatan infrastruktur SORGUMMI Smart Apps.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">Terakhir Login</h4>
                          <p className="text-sm font-semibold text-gray-700">15 Mei 2026, 08:12 WIB</p>
                          <p className="text-[10px] text-gray-400 mt-1">IP: 192.168.1.1 (Jakarta, ID)</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">Versi Platform</h4>
                          <p className="text-sm font-semibold text-gray-700">v2.4.0-build.89</p>
                          <p className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-wider">Paling Terbaru</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeAdminTab === 'Pengaturan' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[40px] border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-serif font-semibold text-brand-primary">Pengaturan Profil Admin</h3>
                      <button type="button" className="bg-brand-accent text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-accent/20 hover:scale-105 transition-all">
                        Simpan Perubahan
                      </button>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-2">Nama Admin</label>
                          <input type="text" value={editData.name} onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-2">Email Administrator</label>
                          <input type="email" value={editData.email} onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-2">Lokasi Sistem</label>
                        <input type="text" value={editData.location} onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 transition-all" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-brand-primary" />
                            <div>
                              <p className="text-xs font-bold text-brand-primary">Bahasa Sistem</p>
                              <p className="text-[10px] text-gray-400">{profileLanguage}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => setShowLanguageModal(true)} className="text-brand-accent text-[9px] font-black uppercase tracking-widest hover:underline">Ubah</button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <Moon className="w-5 h-5 text-brand-primary" />
                            <div>
                              <p className="text-xs font-bold text-brand-primary">Mode Gelap</p>
                              <p className="text-[10px] text-gray-400">Aktifkan tema gelap</p>
                            </div>
                          </div>
                          <div
                            onClick={handleToggleDarkMode}
                            className={`w-10 h-5 ${darkMode ? 'bg-brand-primary' : 'bg-gray-200'} rounded-full relative cursor-pointer transition-colors`}
                          >
                            <div className={`absolute ${darkMode ? 'right-0.5' : 'left-0.5'} top-0.5 w-4 h-4 bg-white rounded-full transition-all`} />
                          </div>
                        </div>
                      </div>
                      <button type="submit" style={{ display: 'none' }} />
                    </form>
                  </motion.div>
                )}

                {activeAdminTab === 'Keamanan' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white p-10 rounded-[40px] border border-gray-100">
                      <h3 className="text-xl font-serif font-semibold text-brand-primary mb-8">Manajemen Keamanan</h3>
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Ganti Password</h4>
                            <div className="space-y-4">
                              <input type="password" placeholder="Password Lama" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-brand-accent transition-all" />
                              <input type="password" placeholder="Password Baru" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-brand-accent transition-all" />
                              <button className="w-full md:w-auto bg-brand-primary text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary transition-all">Perbarui Password</button>
                            </div>
                          </div>
                          <div className="hidden md:block w-px bg-gray-100" />
                          <div className="flex-1 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Keamanan Tambahan</h4>
                            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                              <div>
                                <p className="text-xs font-bold text-brand-primary">2-Factor Authentication (2FA)</p>
                                <p className="text-[10px] text-gray-400">Gunakan Google Authenticator</p>
                              </div>
                              <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all" />
                              </div>
                            </div>
                            <button
                              onClick={handleLogoutAction}
                              className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout dari Semua Perangkat
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeAdminTab === 'Aktivitas' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[40px] border border-gray-100">
                    <h3 className="text-xl font-serif font-semibold text-brand-primary mb-8">Log Aktivitas Sistem</h3>
                    <div className="space-y-8">
                      {[
                        { title: 'Mengirim notifikasi broadcast ke seluruh pengguna', time: '10 Menit yang lalu', icon: Bell, category: 'Communication' },
                        { title: 'Menghapus data pengguna uji coba (Dev Account)', time: '2 Jam yang lalu', icon: Trash2, category: 'User Management' },
                        { title: 'Menambahkan artikel edukasi: "Pasar Sorgum Digital"', time: '1 Hari yang lalu', icon: Plus, category: 'Education' },
                        { title: 'Login ke Dashboard Administrator', time: '1 Hari yang lalu', icon: LogOut, category: 'Access' }
                      ].map((log, i) => (
                        <div key={i} className="flex gap-6 group">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center relative z-10 group-hover:bg-brand-accent/20 transition-colors">
                              <log.icon className="w-5 h-5 text-brand-primary" />
                            </div>
                            {i !== 3 && <div className="absolute top-12 left-6 w-0.5 h-12 bg-gray-100 -z-0" />}
                          </div>
                          <div className="pt-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded-md text-gray-500">{log.category}</span>
                              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {log.time}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700 leading-relaxed group-hover:text-brand-primary transition-colors">{log.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                {activeProfileTab === 'Ringkasan' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { label: 'Analisis AI', value: stats.aiChatCount, icon: Bot },
                        { label: 'Artikel Dibaca', value: stats.articlesReadCount, icon: FileText }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                          <div className="relative z-10">
                            <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                              <stat.icon className={`w-6 h-6 text-brand-primary`} />
                            </div>
                            <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-1">{stat.label}</span>
                            <span className="text-2xl font-semibold text-brand-primary">{stat.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Contact Information Section with Integrated Edit */}
                    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-serif font-semibold text-brand-primary flex items-center gap-3">
                          <User className="w-5 h-5 text-brand-accent" />
                          Informasi Profil & Kontak
                        </h3>
                        <button
                          onClick={() => {
                            if (isEditingProfile) {
                              handleSaveProfile();
                            } else {
                              setIsEditingProfile(true);
                            }
                          }}
                          disabled={isUpdating}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all flex items-center gap-2 ${isEditingProfile
                              ? 'bg-brand-accent text-black shadow-lg shadow-brand-accent/20'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isEditingProfile ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Settings2 className="w-3.5 h-3.5" />
                          )}
                          {isEditingProfile ? 'Simpan' : 'Edit'}
                        </button>
                      </div>

                      <div className="space-y-6">
                        {[
                          { label: 'Nama Lengkap', value: editData.name, icon: User, type: 'name' },
                          { label: 'Bio / Tentang Saya', value: editData.bio, icon: FileText, type: 'bio', isMultiline: true },
                          { label: 'Alamat Email', value: editData.email, icon: Mail, type: 'email' },
                          { label: 'Nomor Telepon', value: editData.phone, icon: Phone, type: 'phone' },
                          { label: 'Lokasi', value: editData.location, icon: MapPin, type: 'location' }
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-6 group">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                              <item.icon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5 block">{item.label}</span>
                              {isEditingProfile ? (
                                item.isMultiline ? (
                                  <textarea
                                    className="w-full bg-gray-50 border-b-2 border-brand-accent/30 focus:border-brand-accent focus:outline-none py-1 font-semibold text-brand-primary transition-all text-sm resize-none"
                                    value={item.value}
                                    onChange={(e) => setEditData(prev => ({ ...prev, [item.type as keyof typeof editData]: e.target.value }))}
                                    rows={2}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    className="w-full bg-gray-50 border-b-2 border-brand-accent/30 focus:border-brand-accent focus:outline-none py-1 font-semibold text-brand-primary transition-all text-sm"
                                    value={item.value}
                                    onChange={(e) => setEditData(prev => ({ ...prev, [item.type as keyof typeof editData]: e.target.value }))}
                                  />
                                )
                              ) : (
                                <p className={`font-semibold text-brand-primary text-sm ${item.isMultiline ? 'leading-relaxed' : ''}`}>
                                  {item.value || (item.type === 'bio' ? 'Belum ada bio' : '-')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeProfileTab === 'Lahan Saya' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[40px] border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-serif font-semibold text-brand-primary">Daftar Lahan Terdaftar</h3>
                      <button
                        onClick={() => setShowAddLahanModal(true)}
                        className="text-brand-accent font-semibold text-xs uppercase tracking-widest hover:text-brand-primary transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Lahan
                      </button>
                    </div>
                    <div className="space-y-4">
                      {lahanList.length > 0 ? lahanList.map((lahan) => (
                        <div key={lahan.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-brand-accent translate-x-0 hover:translate-x-2 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${lahan.color === 'green' ? 'bg-green-500' : 'bg-orange-500'} shadow-lg`} />
                            <div>
                              <p className="font-semibold text-brand-primary">{lahan.name}</p>
                              <p className="text-xs text-gray-400">{lahan.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-semibold uppercase tracking-widest py-1 px-3 rounded-full bg-white border border-gray-200 text-gray-500`}>
                              {lahan.status}
                            </span>
                            <button
                              onClick={() => handleDeleteLahan(lahan.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <p className="text-gray-400 text-sm font-medium">Belum ada lahan terdaftar.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeProfileTab === 'Pengaturan' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {[
                      { title: 'Keamanan Akun', desc: 'Ubah kata sandi dan aktifkan 2FA', icon: Lock, action: () => setShowPasswordModal(true) },
                      { title: 'Hapus Akun', desc: 'Menghapus seluruh data pribadi Anda secara permanen', icon: Trash2, danger: true, action: () => setShowDeleteConfirm(true) }
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={item.action}
                        className={`w-full text-left p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between hover:border-gray-300 transition-all group`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 ${item.danger ? 'bg-red-50' : 'bg-gray-50'} rounded-2xl flex items-center justify-center`}>
                            <item.icon className={`w-5 h-5 ${item.danger ? 'text-red-500' : 'text-brand-primary'}`} />
                          </div>
                          <div>
                            <p className={`font-semibold ${item.danger ? 'text-red-500' : 'text-brand-primary'}`}>{item.title}</p>
                            <p className="text-xs text-gray-400">{item.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-primary transition-colors" />
                      </button>
                    ))}
                  </motion.div>
                )}

                {activeProfileTab === 'Pemberitahuan' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[40px] border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                      <div>
                        <h3 className="text-xl font-serif font-semibold text-brand-primary">Pemberitahuan Terbaru</h3>
                        <p className="text-sm text-gray-500 mt-1">Semua pemberitahuan yang ditujukan untuk akun Anda.</p>
                      </div>
                      <div className="inline-flex items-center gap-3 rounded-3xl bg-brand-primary/10 px-4 py-3 border border-brand-primary/20">
                        <Bell className="w-4 h-4 text-brand-primary" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-primary">Belum dibaca</p>
                          <p className="text-lg font-serif font-black text-brand-primary">{unreadNotificationCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {isLoadingNotifications ? (
                        <div className="p-8 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                          Memuat pemberitahuan...
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notif, i) => (
                          <button
                            key={notif.id || i}
                            type="button"
                            onClick={() => handleOpenNotification(notif)}
                            className={`w-full text-left flex items-start gap-4 p-4 rounded-3xl border transition-all ${notif.is_read ? 'border-gray-100 bg-gray-50 hover:border-brand-primary/30' : 'border-brand-primary/20 bg-brand-primary/5 shadow-sm hover:border-brand-primary'} focus:outline-none`}
                          >
                             {notif.image_url || notif.imageUrl ? (
                               <img 
                                 src={getNotificationImageUrl(notif.image_url || notif.imageUrl)} 
                                 alt={notif.title} 
                                 className="w-14 h-14 rounded-3xl object-cover flex-shrink-0" 
                               />
                             ) : (
                               <div className={`w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0 ${notif.is_read ? 'bg-gray-100 text-gray-600' : 'bg-brand-primary text-white'}`}>
                                 <Bell className="w-6 h-6" />
                               </div>
                             )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className={`font-semibold ${notif.is_read ? 'text-gray-900' : 'text-brand-primary'}`}>{notif.title}</p>
                                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.content}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 font-semibold">{new Date(notif.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-gray-100 text-gray-600">{notif.type || 'Info'}</span>
                                <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-gray-100 text-gray-600">{notif.target || 'Semua User'}</span>
                                {!notif.is_read && <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-brand-accent/20 text-brand-primary">Baru</span>}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-10 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                          <p className="font-semibold">Belum ada pemberitahuan.</p>
                          <p className="text-sm mt-2">Semua pemberitahuan akan muncul di sini setelah dikirim.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Sidebar / Quick Actions */}
          <div className="space-y-8">
            {isAdmin ? (
              <div className="bg-brand-primary p-10 rounded-[40px] border border-white/10 shadow-2xl shadow-brand-primary/20 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 blur-[80px]" />
                <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 relative z-10">Monitoring Cepat</h4>
                <div className="space-y-4 relative z-10">
                  {[
                    { label: 'Uptime Server', value: '99.98%', icon: Monitor },
                    { label: 'API Latency', value: '24ms', icon: Activity },
                    { label: 'Queue Tasks', value: '0 Pending', icon: Zap }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-brand-accent" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-white transition-all border border-white/10">
                  Lihat Log Sistem Lengkap
                </button>
              </div>
            ) : (
              <>
                <div className="bg-brand-primary text-white p-10 rounded-[40px] shadow-2xl shadow-brand-primary/20 relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-accent/20 blur-3xl" />
                  <h4 className="text-xl font-serif font-semibold mb-4 relative z-10">Bantuan AI Siaga</h4>
                  <p className="text-white/50 text-xs leading-relaxed mb-8 relative z-10">
                    Dapatkan bantuan instan mengenai pengelolaan lahan atau akun Anda melalui chatbot cerdas kami.
                  </p>
                  <button
                    onClick={() => setCurrentPage('Chat AI')}
                    className="w-full bg-brand-accent hover:bg-white text-black py-4 rounded-2xl font-semibold text-[10px] uppercase tracking-widest transition-all relative z-10"
                  >
                    Tanya SORGUMMI AI
                  </button>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100">
                  <h4 className="text-sm font-semibold text-brand-primary uppercase tracking-widest mb-6">Artikel Tersimpan</h4>
                  <div className="space-y-4">
                    {isLoadingArticles ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-brand-accent" />
                      </div>
                    ) : (savedArticles?.length || 0) > 0 ? (
                      (savedArticles || []).map((art) => (
                        <div
                          key={art.id}
                          onClick={() => setCurrentPage('Edukasi')}
                          className="flex items-center gap-4 group cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-brand-accent/10 transition-colors">
                            <Bookmark className="w-4 h-4 text-gray-400 group-hover:text-brand-accent transition-colors" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-600 group-hover:text-brand-primary line-clamp-1 transition-colors">{art.title}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{art.category}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-center text-gray-400 italic py-4">Belum ada artikel yang disimpan.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Modals Container */}
      <AnimatePresence>
        {/* Add Lahan Modal */}
        {showAddLahanModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddLahanModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 blur-[60px] rounded-full" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-xl font-serif font-semibold text-brand-primary">Tambah Lahan Baru</h3>
                <button onClick={() => setShowAddLahanModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddLahan} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-2">Nama Lahan</label>
                  <input
                    type="text" required placeholder="Contoh: Kebun Sorgum Cianjur"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold text-brand-primary outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 transition-all"
                    value={newLahan.name}
                    onChange={(e) => setNewLahan(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-2">Luas Lahan (Hektar)</label>
                  <input
                    type="text" required placeholder="Contoh: 1.5 Hektar"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold text-brand-primary outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 transition-all"
                    value={newLahan.size}
                    onChange={(e) => setNewLahan(prev => ({ ...prev, size: e.target.value }))}
                  />
                </div>
                <button type="submit" className="w-full bg-brand-primary text-white py-4 rounded-2xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Simpan Lahan
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => {
                setShowPasswordModal(false);
                setShowOldPass(false);
                setShowNewPass(false);
                setShowConfirmPass(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-serif font-semibold text-brand-primary">Ubah Kata Sandi</h3>
                <button onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ old: '', new: '', confirm: '' });
                  setShowOldPass(false);
                  setShowNewPass(false);
                  setShowConfirmPass(false);
                }} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-2">Kata Sandi Lama</label>
                  <div className="relative">
                    <input
                      type={showOldPass ? "text" : "password"}
                      required
                      value={passwordData.old}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, old: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold text-black outline-none focus:border-brand-accent transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
                    >
                      {showOldPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-2">Kata Sandi Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={passwordData.new}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold text-black outline-none focus:border-brand-accent transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
                    >
                      {showNewPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-2">Ulangi Kata Sandi Baru</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-semibold text-black outline-none focus:border-brand-accent transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-brand-primary text-white py-4 rounded-2xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all">
                  Perbarui Kata Sandi
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Language Modal */}
        {showLanguageModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLanguageModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl"
            >
              <h3 className="text-xl font-serif font-semibold text-brand-primary mb-8 px-2">Preferensi Bahasa</h3>
              <div className="space-y-4">
                {['Bahasa Indonesia', 'English', 'Basa Sunda', 'Basa Jawa'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`w-full p-6 rounded-3xl border text-left font-semibold transition-all flex items-center justify-between ${profileLanguage === lang
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-brand-accent hover:text-brand-primary'
                      }`}
                  >
                    {lang}
                    {profileLanguage === lang && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-red-950/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-brand-primary mb-4">Hapus Akun Anda?</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Tindakan ini tidak dapat dibatalkan. Seluruh data lahan dan riwayat chat Anda akan terhapus selamanya.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleDeleteAccount}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all"
                >
                  Ya, Hapus Permanen
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full bg-gray-50 text-gray-400 py-4 rounded-2xl font-semibold text-[10px] uppercase tracking-widest hover:text-brand-primary transition-all"
                >
                  Batalkan
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <Modal
          isOpen={isNotificationModalOpen}
          onClose={closeNotificationModal}
          title={selectedNotification?.title || 'Detail Pemberitahuan'}
          isDarkMode={false}
          size="max-w-xl"
        >
          {selectedNotification ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{selectedNotification.type || 'Info'}</p>
                  <p className="text-sm text-gray-400">{selectedNotification.target || 'Semua User'}</p>
                </div>
              </div>

              <div className="space-y-3">
                {(selectedNotification.image_url || selectedNotification.imageUrl) && (
                  <img 
                    src={getNotificationImageUrl(selectedNotification.image_url || selectedNotification.imageUrl)} 
                    className="w-full max-h-60 object-cover rounded-lg mb-4" 
                    alt={selectedNotification.title} 
                  />
                )}
                <p className="text-sm text-gray-700 leading-relaxed">{selectedNotification.content}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-3xl bg-gray-50">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Tanggal</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedNotification.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-gray-50">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Status Baca</p>
                    <p className="font-semibold text-gray-900">{selectedNotification.is_read ? 'Dibaca' : 'Belum dibaca'}</p>
                    {selectedNotification.read_at && (
                      <p className="text-xs text-gray-500 mt-1">{new Date(selectedNotification.read_at).toLocaleString('id-ID')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Memuat konten pemberitahuan...</p>
          )}
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default Profil;
