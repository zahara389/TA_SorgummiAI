import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { resetPassword } from '../services/authService';
import { toast } from 'sonner';

interface ResetPasswordFormProps {
  setCurrentPage: (page: string) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ setCurrentPage }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Extract token from query params
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Token reset password tidak ditemukan atau tidak valid.');
      return;
    }

    if (password.length < 8) {
      toast.error('Kata sandi minimal harus 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsResetting(true);

    try {
      await resetPassword(token, password);
      toast.success('Kata sandi berhasil diperbarui! Silakan login menggunakan kata sandi baru Anda.');
      
      // Redirect to login page
      setTimeout(() => {
        setCurrentPage('Login');
        // Clear query parameters from URL
        window.history.pushState({}, '', '/login');
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengatur ulang kata sandi. Token mungkin sudah kedaluwarsa.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="h-screen bg-[#0c1410] font-sans flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full flex flex-col lg:flex-row h-full">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative h-full items-center justify-center overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1200" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
            alt="Leaf background"
          />
          <div className="absolute inset-0 bg-[#0c1410]/60" />
          
          <div className="relative z-10 text-center flex flex-col items-center p-12">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#1A231E]/80 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center mb-6 md:mb-8">
              <Bot className="w-8 h-8 md:w-10 md:h-10 text-brand-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white mb-2 tracking-tight">Sorgummi AI</h2>
            <div className="w-12 md:w-16 h-1 bg-brand-accent mx-auto mb-6"></div>
            <p className="text-white/20 text-[10px] md:text-xs font-semibold tracking-[0.5em] uppercase">Intelligent CRM</p>
          </div>
        </div>

        {/* Right Panel (Form) */}
        <div className="w-full lg:w-1/2 bg-[#0c1410] flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 h-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md my-auto py-4"
          >
            <div className="mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold text-white mb-2">Set New Password</h1>
              <p className="text-white/40 text-xs font-medium">Please enter your new password details.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white mb-1 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••" 
                    className="w-full bg-transparent border-b border-brand-accent/30 py-3 pl-8 pr-10 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-700 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white mb-1 block">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••" 
                    className="w-full bg-transparent border-b border-brand-accent/30 py-3 pl-8 pr-10 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-700 text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-brand-accent text-black py-3 rounded-lg font-semibold text-[10px] uppercase tracking-widest hover:bg-brand-highlight transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button 
                type="button" 
                onClick={() => {
                  setCurrentPage('Login');
                  window.history.pushState({}, '', '/login');
                }}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Back to login
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
