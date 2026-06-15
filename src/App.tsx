import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ChatAI from './pages/Chat AI';
import Tentang from './pages/Tentang';
import Edukasi from './pages/Edukasi';
import Pengelolaan from './pages/Pengelolaan';
import Kontak from './pages/Kontak';
import Login from './pages/Login';
import Profil from './pages/Profil';
import Dashboard from './pages/dashboard/Dashboard';
import ActivityLog from './pages/dashboard/ActivityLog';
import ResetPasswordForm from './pages/ResetPasswordForm';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToAuthChanges, logoutUser, UserProfile } from './services/authService';
import { seedDatabase } from './services/seedService';
import { Toaster, toast } from 'sonner';

// --- Main App ---

const mapPathToPage = (path: string) => {
  const normalized = path.toLowerCase();
  if (normalized === '/admin/activity') return 'Activity Log';
  if (normalized === '/admin/dashboard') return 'Dashboard';
  if (normalized === '/tentang') return 'Tentang';
  if (normalized === '/pengelolaan') return 'Pengelolaan';
  if (normalized === '/edukasi') return 'Edukasi';
  if (normalized === '/kontak') return 'Kontak';
  if (normalized === '/profil' || normalized === '/profile') return 'Profil';
  if (normalized === '/login') return 'Login';
  if (normalized === '/chat-ai') return 'Chat AI';
  if (normalized === '/reset-password-form') return 'Reset Password Form';
  return 'Beranda';
};

const mapPageToPath = (page: string) => {
  switch (page) {
    case 'Activity Log':
      return '/admin/activity';
    case 'Dashboard':
      return '/admin/dashboard';
    case 'Tentang':
      return '/tentang';
    case 'Pengelolaan':
      return '/pengelolaan';
    case 'Edukasi':
      return '/edukasi';
    case 'Kontak':
      return '/kontak';
    case 'Profil':
      return '/profil';
    case 'Login':
      return '/login';
    case 'Chat AI':
      return '/chat-ai';
    case 'Reset Password Form':
      return '/reset-password-form';
    default:
      return '/';
  }
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const path = window.location.pathname;
    const pathPage = mapPathToPage(path);
    const storedPage = localStorage.getItem('currentPage');
    if (pathPage !== 'Beranda') {
      return pathPage;
    }
    return storedPage || pathPage || 'Beranda';
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || "Semua Masalah";
  });
  const [prefilledChatInput, setPrefilledChatInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(mapPathToPage(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((profile) => {
      if (profile) {
        setIsLoggedIn(true);
        setUserProfile(profile);
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setUserProfile(null);
      navigateToPage('Beranda');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navigateToPage = (page: string) => {
    const restrictedPages = ['Chat AI', 'Profil', 'Dashboard', 'Activity Log'];
    if (restrictedPages.includes(page) && !isLoggedIn) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
        const loginPath = mapPageToPath('Login');
        if (window.location.pathname !== loginPath) {
          window.history.pushState({}, '', loginPath);
        }
      }, 1500);
      return;
    }
    const path = mapPageToPath(page);
    setCurrentPage(page);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      const restrictedPages = ['Chat AI', 'Profil', 'Dashboard', 'Activity Log'];
      if (restrictedPages.includes(currentPage) && !isLoggedIn) {
        toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
        setTimeout(() => {
          navigateToPage('Login');
        }, 1500);
      }
    }
  }, [isLoading, isLoggedIn, currentPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c1410] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-0 font-sans bg-white flex flex-col">
      <Toaster position="top-right" richColors closeButton />
      {currentPage !== 'Login' && currentPage !== 'Dashboard' && currentPage !== 'Reset Password Form' && (
        <Navbar 
          onNavigate={navigateToPage} 
          currentPage={currentPage} 
          isLoggedIn={isLoggedIn} 
          userEmail={userProfile?.email || ""}
          userRole={userProfile?.role}
          userName={userProfile?.name}
          userAvatar={userProfile?.avatar}
          onLogout={handleLogout}
        />
      )}
      
      <ChatAI 
        isOpen={currentPage === 'Chat AI'} 
        userProfile={userProfile}
        onClose={() => {
          setCurrentPage('Edukasi');
          setPrefilledChatInput("");
        }} 
        prefilledMessage={prefilledChatInput}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="grow"
        >
          {currentPage === 'Beranda' && (
            <Home 
              setCurrentPage={setCurrentPage} 
              setActiveTab={setActiveTab} 
              isLoggedIn={isLoggedIn}
            />
          )}
          {currentPage === 'Tentang' && <Tentang setCurrentPage={setCurrentPage} />}
          {currentPage === 'Pengelolaan' && <Pengelolaan setCurrentPage={setCurrentPage} userProfile={userProfile} setPrefilledChatInput={setPrefilledChatInput} />}
          {currentPage === 'Edukasi' && (
            <Edukasi 
              setCurrentPage={setCurrentPage}
              userProfile={userProfile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setPrefilledChatInput={setPrefilledChatInput}
            />
          )}
          {currentPage === 'Kontak' && <Kontak setCurrentPage={setCurrentPage} userProfile={userProfile} />}
          {currentPage === 'Login' && (
            <Login 
              setIsLoggedIn={setIsLoggedIn} 
              setCurrentPage={setCurrentPage} 
              setUserProfile={setUserProfile} 
            />
          )}
          {currentPage === 'Reset Password Form' && (
            <ResetPasswordForm 
              setCurrentPage={setCurrentPage} 
            />
          )}
          {currentPage === 'Profil' && (
            <Profil 
              setCurrentPage={setCurrentPage} 
              setIsLoggedIn={setIsLoggedIn} 
              userEmail={userProfile?.email || ""} 
              userId={userProfile?.id}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
            />
          )}
          {currentPage === 'Dashboard' && (
            userProfile ? (
              userProfile.role === 'admin' ? (
                <Dashboard 
                  onNavigateHome={() => navigateToPage('Beranda')} 
                  onNavigate={navigateToPage} 
                  userProfile={userProfile} 
                  onUpdateUserProfile={(newProfile: any) => {
                    setUserProfile((prev: any) => prev ? { ...prev, ...newProfile } : null);
                  }}
                />
              ) : (() => {
                toast.error('Akses khusus admin');
                navigateToPage('Beranda');
                return null;
              })()
            ) : (
              <div className="min-h-screen bg-[#0c1410] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
              </div>
            )
          )}
          {currentPage === 'Activity Log' && (
            userProfile && userProfile.role === 'admin' ? (
              <ActivityLog onBack={() => navigateToPage('Dashboard')} />
            ) : (
              <div className="min-h-screen bg-[#0c1410] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
              </div>
            )
          )}
          {currentPage === 'Chat AI' && <div className="h-screen" />} {/* Placeholder for chatbot space */}
        </motion.div>
      </AnimatePresence>

      {currentPage !== 'Chat AI' && currentPage !== 'Login' && currentPage !== 'Dashboard' && currentPage !== 'Reset Password Form' && (
        <Footer onNavigate={setCurrentPage} />
      )}
    </div>
  );
}
