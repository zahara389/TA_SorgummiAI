import React, { useState } from 'react';
import { Bot, User, LogOut, LayoutDashboard, Menu, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  isLoggedIn: boolean;
  userEmail: string;
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  onLogout: () => void;
}

const Navbar = ({ onNavigate, currentPage, isLoggedIn, userEmail, userName, userAvatar, userRole, onLogout }: NavbarProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = ['Beranda', 'Tentang', 'Edukasi', 'Pengelolaan', 'Chat AI', 'Kontak'];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] bg-brand-primary/95 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-3 text-brand-text">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('Beranda')}>
          <div className="w-8 h-8 bg-brand-accent flex items-center justify-center rounded-xl shadow-lg shadow-brand-accent/20">
            <Bot className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-lg md:text-xl font-sans font-semibold tracking-tight text-white">
            Sorgummi <span className="text-brand-accent">AI</span>
          </span>
        </div>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <button 
              type="button"
              key={link}
              onClick={() => onNavigate(link)}
              className={`px-3 py-1.5 text-xs md:text-[13px] font-sans font-semibold transition-all duration-300 relative ${
                currentPage === link ? 'text-brand-accent' : 'text-brand-text/60 hover:text-brand-accent'
              }`}
            >
              {link}
              {currentPage === link && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-accent rounded-full" 
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 md:gap-4 relative">
          {isLoggedIn ? (
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-brand-accent transition-all active:scale-95 group overflow-hidden shadow-inner"
              >
                <div className="w-full h-full flex items-center justify-center bg-gray-100/5 group-hover:bg-brand-accent/10">
                  <img 
                    src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-[#0d1511] border border-white/10 rounded-3xl shadow-2xl overflow-hidden py-0 z-10"
                    >
                      <div className="px-6 py-5 border-b border-white/5 bg-white/2 cursor-default flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 flex-shrink-0">
                          <img 
                            src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="overflow-hidden">
                           <p className="text-white font-bold text-sm truncate">{userName || 'User'}</p>
                           <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] truncate">{userEmail || 'PENGGUNA'}</p>
                        </div>
                      </div>
                      <div className="p-2">
                        {userRole === 'admin' ? (
                          <button 
                            type="button"
                            onClick={() => {
                              onNavigate('Dashboard');
                              setShowDropdown(false);
                            }}
                            className="w-full px-5 py-4 text-left text-sm font-bold text-white hover:bg-white/5 rounded-2xl transition-all flex items-center gap-4 group"
                          >
                            <LayoutDashboard className="w-5 h-5 text-white/70 group-hover:text-white" />
                            Dashboard Admin
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => {
                              onNavigate('Profil');
                              setShowDropdown(false);
                            }}
                            className="w-full px-5 py-4 text-left text-sm font-bold text-white hover:bg-white/5 rounded-2xl transition-all flex items-center gap-4 group"
                          >
                            <User className="w-5 h-5 text-white/70 group-hover:text-white" />
                            Profil Saya
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => {
                            onLogout();
                            setShowDropdown(false);
                          }}
                          className="w-full px-5 py-4 text-left text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-all flex items-center gap-4 group"
                        >
                          <LogOut className="w-5 h-5 text-red-500/70 group-hover:text-red-400" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => onNavigate('Login')} 
              className="bg-brand-accent hover:bg-brand-highlight text-black px-6 md:px-8 py-2 md:py-3 rounded-xl font-bold transition-all shadow-[0_10px_20px_rgba(163,255,18,0.2)] flex items-center gap-2 group active:scale-95"
            >
              <User className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-xs md:text-sm">Login</span>
            </button>
          )}

          {/* Hamburger Menu Icon */}
          <button 
            type="button"
            className="lg:hidden w-10 h-10 flex items-center justify-center text-white/70 hover:text-brand-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bg-black/60 backdrop-blur-sm z-[-1]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-[#0d1511] border-b border-white/5 overflow-hidden z-20 shadow-2xl"
            >
              <div className="flex flex-col p-4 space-y-1">
                {navLinks.map((link) => (
                  <button
                    type="button"
                    key={link}
                    onClick={() => handleNavigate(link)}
                    className={`w-full px-4 py-3 text-left text-sm font-bold tracking-tight rounded-xl transition-all ${
                      currentPage === link ? 'bg-brand-accent/10 text-brand-accent' : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    {link}
                  </button>
                ))}
                
                {isLoggedIn ? (
                  <div className="pt-2 mt-2 border-t border-white/5 space-y-1">
                    {userRole === 'admin' ? (
                      <button
                        type="button"
                        onClick={() => handleNavigate('Dashboard')}
                        className={`w-full px-4 py-3 text-left text-sm font-bold tracking-tight rounded-xl flex items-center gap-3 transition-all ${
                          currentPage === 'Dashboard' ? 'bg-brand-accent/10 text-brand-accent' : 'text-brand-accent/60 hover:bg-white/5'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard Admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNavigate('Profil')}
                        className={`w-full px-4 py-3 text-left text-sm font-bold tracking-tight rounded-xl flex items-center gap-3 transition-all ${
                          currentPage === 'Profil' ? 'bg-brand-accent/10 text-brand-accent' : 'text-white/60 hover:bg-white/5'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Profil Saya
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-bold tracking-tight rounded-xl flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 mt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleNavigate('Login')}
                      className="w-full px-4 py-4 text-center text-sm font-black uppercase tracking-widest bg-brand-accent text-black rounded-xl"
                    >
                      Login / Create Account
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
