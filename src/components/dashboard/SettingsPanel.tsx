import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Zap, 
  Lock, 
  Save, 
  Camera, 
  LogOut, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  RefreshCw,
  Database,
  Trash2,
  Power,
  Shield as ShieldIcon,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  fetchAdminProfile,
  updateAdminProfile,
  uploadAdminAvatar,
  fetchAdminSession,
  fetchAdminSecurity,
  fetchSystemVersion,
  changeAdminPassword,
  logoutAdminAllDevices,
  getAISystemStatus,
  toggleAISystem,
  updateAIBrain,
  refreshKnowledgeBase,
  resetAICache,
  optimizeDatabase,
  getKnowledgeIndexInfo,
  getActivityLog,
  fetchAdminSessions,
  logoutAdminSession,
  resendVerificationEmail,
  type AdminSessionData,
  type AdminSecurityData,
  type SystemVersionData,
} from '../../services/dataService';

interface SettingsPanelProps {
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  adminProfile: {
    id?: string;
    name: string;
    role: string;
    avatar: string | null;
    email: string;
    phone: string;
    verified?: boolean;
    created_at?: string;
    last_login?: string;
  };
  onUpdateProfile: (newProfile: Partial<{ name: string; avatar: string | null; phone: string }>) => void;
}

type SettingsTab = 'profile' | 'ai' | 'security' | 'activity';

interface ValidationErrors {
  name?: string;
  phone?: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isDarkMode = true, 
  adminProfile,
  onUpdateProfile 
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  
  // Profile local state
  const [localProfile, setLocalProfile] = useState({ ...adminProfile });
  
  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Session, security, version data from backend
  const [sessionData, setSessionData] = useState<AdminSessionData | null>(null);
  const [securityData, setSecurityData] = useState<AdminSecurityData | null>(null);
  const [versionData, setVersionData] = useState<SystemVersionData | null>(null);

  // Active Sessions & Admin Activity logs state
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // AI Settings state
  const [aiStatus, setAiStatus] = useState(true);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiIndexInfo, setAiIndexInfo] = useState<any>(null);

  // Security state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all data on mount
  useEffect(() => {
    loadProfileData();
    loadSessionData();
    loadSecurityData();
    loadVersionData();
    loadAIIndexInfo();
    loadAIStatus();
    loadSessionsList();
    loadActivityLogs();
  }, []);

  // Poll AI index info, sessions, and activity logs every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAIIndexInfo();
      loadAIStatus();
      loadSessionsList();
      loadActivityLogs();
    }, 30000);
    return () => clearInterval(interval);
  }, [localProfile.id]);

  useEffect(() => {
    setLocalProfile({ ...adminProfile });
  }, [adminProfile]);

  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const profile = await fetchAdminProfile();
      const updatedProfile = {
        id: profile.id || '1',
        name: profile.name || '',
        role: profile.role || 'Super Admin',
        avatar: profile.avatar || null,
        email: profile.email || '',
        phone: profile.phone || '',
        verified: !!profile.verified,
        created_at: profile.created_at || '',
        last_login: profile.last_login || '',
      };
      setLocalProfile(updatedProfile);
      onUpdateProfile({
        name: profile.name,
        avatar: profile.avatar || null,
        phone: profile.phone || '',
      });
    } catch (err) {
      console.error('[Settings] Failed to load profile:', err);
      toast.error('Gagal mengambil data profil');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadSessionsList = async () => {
    setIsLoadingSessions(true);
    try {
      const adminId = localProfile.id || "1";
      const sessions = await fetchAdminSessions(adminId);
      setSessionsList(sessions || []);
    } catch (err) {
      console.error('[Settings] Failed to load sessions list:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadActivityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await getActivityLog(50);
      setActivityLogs(logs || []);
    } catch (err) {
      console.error('[Settings] Failed to load activity logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    try {
      const adminId = localProfile.id || "1";
      const res = await resendVerificationEmail(adminId);
      toast.success(res.message || 'Email verifikasi berhasil dikirim');
      // Reload profile to update verified status badge
      loadProfileData();
    } catch (err: any) {
      console.error('[Settings] Resend verification error:', err);
      toast.error(err.message || 'Gagal mengirim ulang verifikasi');
    } finally {
      setIsSendingVerification(false);
    }
  };

  const loadSessionData = async () => {
    try {
      const data = await fetchAdminSession();
      setSessionData(data);
    } catch (err) {
      console.error('[Settings] Failed to load session:', err);
    }
  };

  const loadSecurityData = async () => {
    try {
      const data = await fetchAdminSecurity();
      setSecurityData(data);
    } catch (err) {
      console.error('[Settings] Failed to load security:', err);
    }
  };

  const loadVersionData = async () => {
    try {
      const data = await fetchSystemVersion();
      setVersionData(data);
    } catch (err) {
      console.error('[Settings] Failed to load version:', err);
    }
  };

  const loadAIIndexInfo = async () => {
    try {
      const data = await getKnowledgeIndexInfo();
      setAiIndexInfo(data?.data || data);
    } catch (err) {
      console.error('[Settings] Failed to load AI index info:', err);
    }
  };

  const loadAIStatus = async () => {
    try {
      const data = await getAISystemStatus();
      if (data?.data?.ai_enabled !== undefined) {
        setAiStatus(data.data.ai_enabled);
      }
    } catch (err) {
      console.error('[Settings] Failed to load AI status:', err);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!localProfile.name || localProfile.name.trim().length < 3) {
      errors.name = 'Nama minimal 3 karakter';
    }

    if (localProfile.phone) {
      const phoneClean = localProfile.phone.replace(/[\s\-()]/g, '');
      const phonePattern = /^(\+62|62|0)?\d{9,15}$/;
      if (!phonePattern.test(phoneClean)) {
        errors.phone = 'Nomor HP harus angka, boleh diawali +62, minimal 10 digit';
      }
      const digitsOnly = phoneClean.replace(/^\+?62/, '0').replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        errors.phone = 'Nomor HP minimal 10 digit';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Hanya file JPG, JPEG, PNG, dan WEBP yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAdminAvatar(file);
      setLocalProfile({ ...localProfile, avatar: avatarUrl });
      onUpdateProfile({ avatar: avatarUrl });
      toast.success('Foto profil berhasil diunggah');
    } catch (err) {
      console.error('[Settings] Avatar upload error:', err);
      toast.error('Gagal mengunggah foto');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const updatedProfile = await updateAdminProfile({
        name: localProfile.name,
        phone: localProfile.phone,
      });
      
      onUpdateProfile({
        name: updatedProfile.name,
        avatar: updatedProfile.avatar || localProfile.avatar,
        phone: updatedProfile.phone,
      });

      // Also update localStorage session so it persists
      try {
        const sessionStr = localStorage.getItem('sorgummology_user_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          session.name = updatedProfile.name;
          session.phone = updatedProfile.phone;
          if (updatedProfile.avatar) session.avatar = updatedProfile.avatar;
          localStorage.setItem('sorgummology_user_session', JSON.stringify(session));
        }
      } catch (e) {
        // silently ignore localStorage errors
      }

      toast.success('Profil admin berhasil diperbarui!');
      
      // Refresh security data (verified identity might change)
      loadSecurityData();
    } catch (err) {
      console.error('[Settings] Save profile error:', err);
      toast.error('Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (actionName: string) => {
    setAiLoading(actionName);
    try {
      if (actionName === 'Update AI Brain') {
        await updateAIBrain();
        toast.success('AI Brain berhasil diperbarui');
      } else if (actionName === 'Refresh Knowledge Base') {
        await refreshKnowledgeBase();
        toast.success('Knowledge Base berhasil disinkronisasi');
        // Reload AI index info
        loadAIIndexInfo();
      } else if (actionName === 'Reset AI Cache') {
        await resetAICache();
        toast.success('AI Cache berhasil direset');
      } else if (actionName === 'Optimize Database') {
        await optimizeDatabase();
        toast.success('Database berhasil dioptimalkan');
      }
    } catch (err) {
      console.error('[Settings] Action error:', err);
      toast.error(`Gagal menjalankan ${actionName}`);
    } finally {
      setAiLoading(null);
    }
  };

  const handleToggleAI = async () => {
    const newStatus = !aiStatus;
    setAiStatus(newStatus);
    try {
      await toggleAISystem(newStatus);
      toast.success(`AI ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (err) {
      console.error('[Settings] Toggle AI error:', err);
      setAiStatus(!newStatus); // Revert on error
      toast.error('Gagal mengubah status AI');
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Semua field password harus diisi');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (passwords.new.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }

    // Check password strength
    const hasUppercase = /[A-Z]/.test(passwords.new);
    const hasNumber = /[0-9]/.test(passwords.new);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(passwords.new);

    if (!hasUppercase || !hasNumber || !hasSymbol) {
      toast.error('Password harus mengandung huruf besar, angka, dan simbol');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeAdminPassword(passwords.current, passwords.new);
      setPasswords({ current: '', new: '', confirm: '' });
      toast.success('Password berhasil diperbarui! Silakan login kembali.');
      setTimeout(() => {
        localStorage.removeItem('sorgummology_user_session');
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      console.error('[Settings] Change password error:', err);
      toast.error(err.message || 'Gagal mengubah password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Apakah Anda yakin ingin logout dari seluruh sesi aktif di semua perangkat?')) {
      return;
    }

    try {
      await logoutAdminAllDevices();
      toast.success('Seluruh sesi berhasil dihentikan');
      setTimeout(() => {
        localStorage.removeItem('sorgummology_user_session');
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      console.error('[Settings] Logout all devices error:', err);
      toast.error('Gagal logout dari semua perangkat');
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return;
    setIsUploadingAvatar(true);
    try {
      await updateAdminProfile({ avatar: "" });
      setLocalProfile(prev => ({ ...prev, avatar: null }));
      onUpdateProfile({ avatar: null });
      
      // Update local storage session
      try {
        const sessionStr = localStorage.getItem('sorgummology_user_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          session.avatar = "";
          localStorage.setItem('sorgummology_user_session', JSON.stringify(session));
        }
      } catch (e) {}

      toast.success('Foto profil berhasil dihapus');
      loadActivityLogs();
    } catch (err) {
      console.error('[Settings] Delete avatar error:', err);
      toast.error('Gagal menghapus foto profil');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogoutDevice = async (sessionId: string) => {
    const session = sessionsList.find(s => s.id === sessionId);
    const isCurrent = session?.current;
    
    if (isCurrent) {
      if (!confirm('Apakah Anda yakin ingin keluar dari perangkat saat ini?')) return;
    } else {
      if (!confirm('Apakah Anda yakin ingin menghentikan sesi perangkat ini?')) return;
    }

    try {
      const adminId = localProfile.id || "1";
      await logoutAdminSession(sessionId, adminId);
      toast.success(isCurrent ? 'Sesi ini telah dihentikan, silakan login kembali' : 'Sesi perangkat berhasil dihentikan');
      
      if (isCurrent) {
        localStorage.removeItem('sorgummology_user_session');
        window.location.href = '/login';
      } else {
        loadSessionsList();
        loadActivityLogs();
        loadSecurityData();
      }
    } catch (err) {
      console.error('[Settings] Logout device error:', err);
      toast.error('Gagal menghentikan sesi perangkat');
    }
  };

  // Verified Identity check
  const isVerified = !!localProfile.verified;

  // Format date to WIB
  const formatDateWIB = (isoString: string | null | undefined) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }) + ' WIB';
    } catch {
      return '-';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil Admin', icon: User },
    { id: 'ai', label: 'Konfigurasi AI', icon: Zap },
    { id: 'security', label: 'Keamanan', icon: Lock },
    { id: 'activity', label: 'Activity Log', icon: Clock },
  ];

  // Security status color helper
  const getSecurityStatusColor = (status: string) => {
    switch (status) {
      case 'Secure': return 'text-green-500';
      case 'Warning': return 'text-orange-500';
      case 'Critical': return 'text-red-500';
      default: return 'text-white/40';
    }
  };

  const getSecurityStatusIcon = (status: string) => {
    switch (status) {
      case 'Secure': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'Critical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default: return <ShieldIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 pb-10">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-3 space-y-2 md:space-y-3">
        <div className="mb-6 hidden lg:block">
          <h2 className={`text-xl font-serif font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Configuration Portal</p>
        </div>
        
        <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {tabs.map((tab) => (
            <button 
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex-shrink-0 lg:w-full flex items-center justify-between px-4 py-3 md:py-3.5 rounded-xl transition-all group border active:scale-95 ${
                activeTab === tab.id 
                ? (isDarkMode ? 'bg-brand-accent border-brand-accent text-black shadow-lg shadow-brand-accent/20' : 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20')
                : (isDarkMode ? 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm')
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-black' : (isDarkMode ? 'text-white/20 group-hover:text-brand-accent' : 'text-gray-400 group-hover:text-brand-primary')}`} />
                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap`}>{tab.label}</span>
              </div>
              <div className="hidden lg:block">
                {activeTab === tab.id && <motion.div layoutId="active-indicator"><CheckCircle2 className="w-4 h-4" /></motion.div>}
              </div>
            </button>
          ))}
        </div>

        <div className={`mt-6 p-6 rounded-[32px] relative overflow-hidden flex flex-col justify-between h-[160px] transition-all shadow-xl group border hidden lg:flex ${isDarkMode ? 'bg-brand-primary border-brand-primary shadow-black/40' : 'bg-brand-accent border-brand-accent shadow-brand-accent/20'}`}>
          <div className="relative z-10">
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-3 block ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Admin Portal</span>
            <h4 className={`text-lg font-serif font-black leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {versionData ? `V${versionData.version}` : 'V.3.0 Optimized'}
            </h4>
            {versionData && (
              <p className={`text-[8px] font-bold mt-1 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                Build {versionData.build}
              </p>
            )}
          </div>
          <div className={`relative z-10 w-full px-4 rounded-xl flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white/10 text-brand-accent' : 'bg-black/10 text-black'}`}>
            {sessionData ? (
              <div className="w-full py-2 space-y-0.5 text-center">
                <div className="text-[9px]">{sessionData.browser}</div>
                <div className="text-[8px] opacity-60">{sessionData.os} • {sessionData.ip}</div>
                <div className="text-[7px] opacity-40">{formatDateWIB(sessionData.loginTime)}</div>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center">Active Session</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`lg:col-span-9 border rounded-2xl md:rounded-[32px] p-6 md:p-8 lg:p-10 shadow-2xl transition-all ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                      <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center font-black text-3xl shadow-2xl transition-all border-4 overflow-hidden ${isDarkMode ? 'bg-white/5 text-brand-accent border-white/5 group-hover:border-brand-accent/40' : 'bg-brand-primary/5 text-brand-primary border-white group-hover:border-brand-primary/40'}`}>
                        {isUploadingAvatar ? (
                          <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
                        ) : localProfile.avatar ? (
                          <img src={localProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (localProfile.name || '').split(' ').map(n => n[0]).join('')
                        )}
                      </div>
                      <button 
                        type="button"
                        disabled={isUploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-white text-black' : 'bg-brand-primary text-white'}`}
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5" />
                        )}
                      </button>
                      {localProfile.avatar && !isUploadingAvatar && (
                        <button 
                          type="button"
                          onClick={handleDeleteAvatar}
                          className="absolute -bottom-2 -left-2 w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-red-500 text-white hover:bg-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <input 
                        ref={fileInputRef}
                        id="avatar-upload-input"
                        type="file" 
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h3 className={`text-2xl font-serif font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{localProfile.name || 'Administrator'}</h3>
                      <p className={`text-xs font-medium mb-4 ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>{localProfile.role || 'Super Admin'} • Sorgummology Control Center</p>
                      <div className="flex gap-3 justify-center md:justify-start items-center">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          isVerified 
                            ? (isDarkMode ? 'bg-white/5 text-brand-accent border border-brand-accent/20' : 'bg-brand-primary/5 text-brand-primary border border-brand-primary/20')
                            : (isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-500 border border-red-200')
                        }`}>
                          {isVerified ? 'Verified Identity' : 'Not Verified'}
                        </span>
                        {!isVerified && (
                          <button
                            type="button"
                            disabled={isSendingVerification}
                            onClick={handleResendVerification}
                            className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                              isDarkMode 
                                ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-sm' 
                                : 'bg-brand-primary text-white hover:opacity-90 shadow-sm'
                            }`}
                          >
                            {isSendingVerification ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            Kirim Ulang Verifikasi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Nama Admin</label>
                        <input 
                          type="text" 
                          value={localProfile.name}
                          onChange={(e) => {
                            setLocalProfile({...localProfile, name: e.target.value});
                            if (validationErrors.name) setValidationErrors({...validationErrors, name: undefined});
                          }}
                          className={`w-full h-12 bg-transparent border rounded-2xl px-4 text-sm font-bold outline-none transition-all ${
                            validationErrors.name 
                              ? 'border-red-500 focus:border-red-500' 
                              : (isDarkMode ? 'border-white/10 focus:border-brand-accent text-white hover:border-white/20' : 'border-gray-200 focus:border-brand-primary text-gray-900 hover:border-gray-300 shadow-sm')
                          }`}
                        />
                        {validationErrors.name && (
                          <p className="text-red-500 text-[10px] mt-1.5 font-bold">{validationErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Nomor Ponsel</label>
                        <input 
                          type="text" 
                          value={localProfile.phone}
                          onChange={(e) => {
                            setLocalProfile({...localProfile, phone: e.target.value});
                            if (validationErrors.phone) setValidationErrors({...validationErrors, phone: undefined});
                          }}
                          className={`w-full h-12 bg-transparent border rounded-2xl px-4 text-sm font-bold outline-none transition-all ${
                            validationErrors.phone 
                              ? 'border-red-500 focus:border-red-500' 
                              : (isDarkMode ? 'border-white/10 focus:border-brand-accent text-white hover:border-white/20' : 'border-gray-200 focus:border-brand-primary text-gray-900 hover:border-gray-300 shadow-sm')
                          }`}
                        />
                        {validationErrors.phone && (
                          <p className="text-red-500 text-[10px] mt-1.5 font-bold">{validationErrors.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Email Address</label>
                        <input 
                          type="email" 
                          value={localProfile.email}
                          disabled
                          className={`w-full h-12 bg-transparent border rounded-2xl px-4 text-sm font-bold outline-none cursor-not-allowed opacity-50 ${isDarkMode ? 'border-white/10 text-white' : 'border-gray-100 text-gray-900 bg-gray-50/50'}`}
                        />
                      </div>
                      <div className={`h-[84px] p-5 rounded-2xl border transition-all flex items-center justify-between group cursor-help ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100 shadow-sm text-gray-600'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-white text-gray-400 border border-gray-100'}`}>
                            {securityData ? getSecurityStatusIcon(securityData.securityStatus) : <ShieldIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Keamanan</p>
                            <p className={`text-[9px] font-medium mt-0.5 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                              Sistem Terenkripsi {securityData?.encryption || 'AES-256'}
                            </p>
                            {securityData && (
                              <p className={`text-[8px] font-bold mt-0.5 ${getSecurityStatusColor(securityData.securityStatus)}`}>
                                Status: {securityData.securityStatus} • {securityData.totalActiveSessions} Sesi Aktif
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Tanggal Bergabung</label>
                      <input 
                        type="text" 
                        value={formatDateWIB(localProfile.created_at)}
                        readOnly
                        className={`w-full h-12 bg-transparent border rounded-2xl px-4 text-sm font-bold outline-none cursor-default opacity-60 ${isDarkMode ? 'border-white/10 text-white bg-white/3' : 'border-gray-200 text-gray-700 bg-gray-50/30'}`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Last Login</label>
                      <input 
                        type="text" 
                        value={formatDateWIB(localProfile.last_login)}
                        readOnly
                        className={`w-full h-12 bg-transparent border rounded-2xl px-4 text-sm font-bold outline-none cursor-default opacity-60 ${isDarkMode ? 'border-white/10 text-white bg-white/3' : 'border-gray-200 text-gray-700 bg-gray-50/30'}`}
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex justify-end">
                    <button 
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveProfile}
                      className={`h-12 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-60 ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-brand-accent/20' : 'bg-brand-primary text-white hover:opacity-90 shadow-brand-primary/20'}`}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="font-serif">
                  <h3 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Konfigurasi AI Brain</h3>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>Manajemen performa dan logika asisten cerdas Sorgummi.</p>
                </div>
                <button 
                  type="button"
                  onClick={handleToggleAI}
                  disabled={aiLoading !== null}
                  className={`flex items-center gap-3 px-6 h-12 rounded-2xl transition-all active:scale-95 border-2 disabled:opacity-60 ${
                    aiStatus 
                    ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}
                >
                  <Power className={`w-4 h-4 ${aiStatus ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Status: {aiStatus ? 'ONLINE' : 'OFFLINE'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'brain', label: 'Update AI Brain', desc: 'Melakukan penyesuaian logika model bahasa.', icon: Zap, color: 'brand' },
                  { id: 'kb', label: 'Refresh Knowledge Base', desc: 'Sinkronisasi data edukasi dan FAQ terbaru.', icon: RefreshCw, color: 'blue' },
                  { id: 'cache', label: 'Reset AI Cache', desc: 'Membersihkan memori percakapan sementara.', icon: Trash2, color: 'red' },
                  { id: 'db', label: 'Optimize Database', desc: 'Meningkatkan kecepatan query pencarian sorgum.', icon: Database, color: 'green' },
                ].map((item) => (
                  <button 
                    key={item.id}
                    disabled={aiLoading !== null}
                    onClick={() => handleAction(item.label)}
                    className={`p-6 rounded-[32px] border transition-all text-left group relative overflow-hidden active:scale-95 ${
                      isDarkMode ? 'bg-white/5 border-white/5 hover:border-brand-accent/40' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-brand-primary/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        item.color === 'brand' ? (isDarkMode ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary') :
                        item.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                        item.color === 'red' ? 'bg-red-500/10 text-red-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {aiLoading === item.label ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <item.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div>
                        <h4 className={`text-xs md:text-sm font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.label}</h4>
                        <p className={`text-[10px] font-medium leading-relaxed ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>{item.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className={`p-8 rounded-[40px] border relative overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-brand-primary/5 border-brand-primary/10 text-brand-primary'}`}>
                 <div className="flex items-center gap-4 mb-4">
                    <Database className={`w-5 h-5 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Learning Index Information</span>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { l: 'Data Nodes', v: aiIndexInfo?.data_nodes?.toString() || '0' },
                      { l: 'Avg Latency', v: aiIndexInfo?.avg_latency_ms ? `${aiIndexInfo.avg_latency_ms}ms` : '-' },
                      { l: 'Consistency', v: aiIndexInfo?.consistency_percent ? `${aiIndexInfo.consistency_percent}%` : '-' },
                      { l: 'Tokens Processed', v: aiIndexInfo?.tokens_processed ? `${(aiIndexInfo.tokens_processed / 1000000).toFixed(1)}M` : '-' },
                    ].map(stat => (
                      <div key={stat.l}>
                        <p className={`text-[9px] font-black uppercase mb-1 ${isDarkMode ? 'text-white/30' : 'text-brand-primary/40'}`}>{stat.l}</p>
                        <p className={`text-lg font-serif font-black ${isDarkMode ? 'text-white' : 'text-brand-primary'}`}>{stat.v}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="font-serif">
                <h3 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Autentikasi & Keamanan</h3>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>Manajemen kata sandi dan sesi aktif administrator.</p>
              </div>

              <div className={`p-8 rounded-[40px] border space-y-8 ${isDarkMode ? 'bg-white/3 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        className={`w-full h-12 bg-transparent border rounded-2xl px-4 pr-12 text-sm font-bold outline-none transition-all ${isDarkMode ? 'border-white/10 focus:border-brand-accent text-white' : 'border-gray-200 focus:border-brand-primary text-gray-900 shadow-sm'}`}
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/20 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block opacity-0 hidden md:block`}>Spacer</label>
                    <div className={`p-3.5 px-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold leading-relaxed`}>
                      Gunakan minimal 8 karakter dengan kombinasi angka dan simbol.
                      {securityData?.passwordLastChanged && (
                        <span className="block mt-1 opacity-70">
                          Password terakhir diubah: {formatDateWIB(securityData.passwordLastChanged)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>New Password</label>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className={`w-full h-12 bg-transparent border rounded-2xl px-4 text-sm font-bold outline-none transition-all ${isDarkMode ? 'border-white/10 focus:border-brand-accent text-white' : 'border-gray-200 focus:border-brand-primary text-gray-900 shadow-sm'}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Confirm Password</label>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className={`w-full h-12 bg-transparent border rounded-2xl px-4 text-sm font-bold outline-none transition-all ${isDarkMode ? 'border-white/10 focus:border-brand-accent text-white' : 'border-gray-200 focus:border-brand-primary text-gray-900 shadow-sm'}`}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    disabled={!passwords.new || passwords.new !== passwords.confirm || isChangingPassword}
                    onClick={handleChangePassword}
                    className={`h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center gap-2 ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-lg shadow-brand-accent/20' : 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:opacity-90'}`}
                  >
                    {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    Update Password
                  </button>
                </div>
              </div>

              {/* Active Sessions List */}
              <div className={`p-8 rounded-[40px] border space-y-6 ${isDarkMode ? 'bg-white/3 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Daftar Sesi Perangkat Aktif</h4>
                    <p className={`text-[10px] font-medium mt-1 ${isDarkMode ? 'text-white/35' : 'text-gray-400'}`}>Sesi aktif Anda di semua browser dan perangkat saat ini.</p>
                  </div>
                  {isLoadingSessions && <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />}
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'border-white/5 text-white/45' : 'border-gray-200 text-gray-400'}`}>
                        <th className="py-3 px-4">Perangkat & OS</th>
                        <th className="py-3 px-4">Browser</th>
                        <th className="py-3 px-4">Alamat IP</th>
                        <th className="py-3 px-4">Lokasi</th>
                        <th className="py-3 px-4">Aktif Terakhir</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className={`text-[10px] font-bold ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                      {sessionsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-white/30">Tidak ada sesi aktif ditemukan</td>
                        </tr>
                      ) : (
                        sessionsList.map((session) => (
                          <tr 
                            key={session.id} 
                            className={`border-b transition-colors ${
                              isDarkMode 
                                ? 'border-white/5 hover:bg-white/5' 
                                : 'border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${session.current ? 'bg-green-500' : 'bg-white/20'}`} />
                                <span className={isDarkMode ? 'text-white font-black' : 'text-gray-900 font-black'}>
                                  {session.device || 'Desktop'} • {session.os || 'Unknown OS'}
                                </span>
                                {session.current && (
                                  <span className={`ml-2 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                                    isDarkMode ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'
                                  }`}>
                                    Sesi Ini
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">{session.browser || 'Unknown Browser'}</td>
                            <td className="py-4 px-4 font-mono text-[9px]">{session.ip || 'Unknown IP'}</td>
                            <td className="py-4 px-4">{session.location || 'Unknown Location'}</td>
                            <td className="py-4 px-4 font-mono text-[9px]">{formatDateWIB(session.last_active)}</td>
                            <td className="py-4 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleLogoutDevice(session.id)}
                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                  session.current 
                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                                    : (isDarkMode ? 'bg-white/5 text-white/50 hover:bg-red-500/10 hover:text-red-500' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500')
                                }`}
                              >
                                Logout
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`p-8 rounded-[40px] border flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6 transition-colors ${isDarkMode ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50 border-red-100 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <LogOut className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Session Management</h4>
                    <p className={`text-[11px] font-medium ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>Logout dari semua perangkat dan reset token akses.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="h-12 px-8 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  Logout All Devices
                </button>
              </div>

              {/* Build Info Card */}
              {versionData && (
                <div className={`p-8 rounded-[40px] border relative overflow-hidden ${isDarkMode ? 'bg-white/3 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <ShieldIcon className={`w-5 h-5 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
                    <div>
                      <h4 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System & Build Information</h4>
                      <p className={`text-[10px] font-medium mt-0.5 ${isDarkMode ? 'text-white/35' : 'text-gray-400'}`}>Detail informasi lingkungan server dan status build saat ini.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[10px] font-bold">
                    {[
                      { label: 'Versi Aplikasi', value: versionData.version },
                      { label: 'Nomor Build', value: versionData.build },
                      { label: 'Tanggal Build', value: formatDateWIB(versionData.build_date) },
                      { label: 'Sistem Operasi', value: versionData.os },
                      { label: 'Browser Client', value: versionData.browser },
                      { label: 'Web Server', value: versionData.server || 'Express Dev Server' }
                    ].map((item, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5 text-white/80' : 'bg-white border-gray-100 text-gray-700'}`}>
                        <p className={`text-[8px] font-black uppercase tracking-wider mb-1 ${isDarkMode ? 'text-white/35' : 'text-gray-400'}`}>{item.label}</p>
                        <p className={`font-mono text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.value || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div 
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="font-serif">
                  <h3 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Log Aktivitas Sistem</h3>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white/30' : 'text-gray-500'}`}>Histori aktivitas administratif dan perubahan konfigurasi sistem.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    loadActivityLogs();
                    toast.success('Log aktivitas diperbarui');
                  }}
                  disabled={isLoadingLogs}
                  className={`flex items-center gap-2 px-4 h-10 rounded-xl transition-all border active:scale-95 text-[10px] font-black uppercase tracking-widest cursor-pointer ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  Refresh Log
                </button>
              </div>

              <div className={`p-8 rounded-[40px] border space-y-6 ${isDarkMode ? 'bg-white/3 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
                  </div>
                ) : (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'border-white/5 text-white/45' : 'border-gray-200 text-gray-400'}`}>
                          <th className="py-3 px-4">Waktu (WIB)</th>
                          <th className="py-3 px-4">Admin/Pengguna</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4">Aktivitas</th>
                          <th className="py-3 px-4">Detail</th>
                        </tr>
                      </thead>
                      <tbody className={`text-[10px] font-bold ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                        {activityLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-white/30">Tidak ada log aktivitas ditemukan</td>
                          </tr>
                        ) : (
                          activityLogs.map((log) => (
                            <tr 
                              key={log.id} 
                              className={`border-b transition-colors ${
                                isDarkMode 
                                  ? 'border-white/5 hover:bg-white/5' 
                                  : 'border-gray-100 hover:bg-gray-50'
                              }`}
                            >
                              <td className="py-4 px-4 font-mono text-[9px] whitespace-nowrap">
                                {formatDateWIB(log.created_at)}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                  {log.user_email || 'System'}
                                </span>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                  log.type === 'Admin Security' || log.type === 'Authentication'
                                    ? 'bg-red-500/10 text-red-500'
                                    : log.type === 'AI Configuration' || log.type === 'Knowledge Base'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : (isDarkMode ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary')
                                }`}>
                                  {log.type}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-extrabold whitespace-nowrap text-white/90">
                                {log.action}
                              </td>
                              <td className="py-4 px-4 max-w-xs truncate" title={log.details || ''}>
                                {log.details || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPanel;
