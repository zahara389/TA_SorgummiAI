import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loginUser, registerUser, forgotPassword } from '../services/authService';
import AuthModal from '../components/auth/AuthModal';
import { toast } from 'sonner';

interface LoginProps {
  setIsLoggedIn: (val: boolean) => void;
  setCurrentPage: (page: string) => void;
  setUserProfile: (profile: any) => void;
}

const Login: React.FC<LoginProps> = ({ setIsLoggedIn, setCurrentPage, setUserProfile }) => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ type: 'success' | 'error', title: string, description: string }>({
    type: 'success',
    title: '',
    description: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      if (isForgotPassword) {
        await forgotPassword(loginForm.email);
        toast.success("Link reset password telah dikirim ke email Anda! Silakan cek kotak masuk atau spam.");
        setIsForgotPassword(false);
      } else if (isRegistering) {
        if (!loginForm.name) {
          setModalConfig({
            type: 'error',
            title: 'Registrasi Gagal',
            description: 'Nama wajib diisi.'
          });
          setIsModalOpen(true);
          setIsLoggingIn(false);
          return;
        }
        const userProfile = await registerUser(loginForm.name, loginForm.email, loginForm.password);
        
        setIsLoggedIn(true);
        setUserProfile(userProfile);
        
        setModalConfig({
          type: 'success',
          title: 'Berhasil Membuat Akun',
          description: 'Selamat datang di Sorgummology Smart Apps'
        });
        setIsModalOpen(true);
 
        // Delay redirect as requested
        setTimeout(() => {
          setCurrentPage('Beranda');
        }, 3000);
      } else {
        const userProfile = await loginUser(loginForm.email, loginForm.password);
        
        setIsLoggedIn(true);
        setUserProfile(userProfile);
 
        if (userProfile.role === 'admin') {
          setModalConfig({
            type: 'success',
            title: 'Login Admin Berhasil',
            description: 'Selamat datang kembali, Admin'
          });
          setIsModalOpen(true);
          setTimeout(() => setCurrentPage('Dashboard'), 1500);
        } else {
          setModalConfig({
            type: 'success',
            title: 'Login Berhasil',
            description: 'Selamat datang kembali'
          });
          setIsModalOpen(true);
          setTimeout(() => setCurrentPage('Beranda'), 1500);
        }
      }
    } catch (err: any) {
      if (isForgotPassword) {
        toast.error(err.message || 'Email tidak terdaftar atau terjadi kesalahan.');
      } else if (isRegistering) {
        setModalConfig({
          type: 'error',
          title: 'Registrasi Gagal',
          description: err.message || 'Terjadi kesalahan saat pendaftaran.'
        });
        setIsModalOpen(true);
      } else {
        setModalConfig({
          type: 'error',
          title: 'Login Gagal',
          description: 'Email atau kata sandi salah.'
        });
        setIsModalOpen(true);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="h-screen bg-[#0c1410] font-sans flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full flex flex-col lg:flex-row h-full">
        {/* Left Panel */}
        <motion.div 
          layout
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className={`hidden lg:flex lg:w-1/2 relative h-full items-center justify-center overflow-hidden ${isRegistering ? 'lg:order-2' : 'lg:order-1'}`}
        >
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
        </motion.div>

        {/* Right Panel (Form) */}
        <motion.div 
          layout
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className={`w-full lg:w-1/2 bg-[#0c1410] flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 h-full ${isRegistering ? 'lg:order-1' : 'lg:order-2'}`}
        >
          <div className="w-full max-w-md my-auto py-4">
            <div className="mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold text-white mb-2">
                {isForgotPassword ? 'Reset Password' : isRegistering ? 'Create account' : 'Welcome back'}
              </h1>
              <p className="text-white/40 text-xs font-medium">
                {isForgotPassword ? 'Please enter your email to reset password.' : 'Please enter your details.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {isRegistering && (
                    <motion.div 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="space-y-2"
                    >
                      <label className="text-xs font-medium text-white mb-1 block">Name</label>
                      <div className="relative">
                        <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                        <input 
                          type="text" 
                          required
                          placeholder="Enter your name" 
                          className="w-full bg-transparent border-b border-brand-accent/30 py-3 pl-8 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-700 text-sm"
                          value={loginForm.name}
                          onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white mb-1 block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your e-mail" 
                      className="w-full bg-transparent border-b border-brand-accent/30 py-3 pl-8 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-700 text-sm"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white mb-1 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        placeholder="••••••••" 
                        className="w-full bg-transparent border-b border-brand-accent/30 py-3 pl-8 pr-10 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-700 text-sm"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
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
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      className="w-4 h-4 rounded border-brand-accent/30 bg-transparent text-brand-accent focus:ring-brand-accent" 
                    />
                    <label htmlFor="remember" className="text-xs text-white/40 font-medium">Remember me</label>
                  </div>
                  {!isRegistering && !isForgotPassword && (
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-white/40 hover:text-white transition-colors"
                    >
                      Forgot your password?
                    </button>
                  )}
                  {isForgotPassword && (
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(false)}
                      className="text-xs text-white/40 hover:text-white transition-colors"
                    >
                      Back to login
                    </button>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-brand-accent text-black py-3 rounded-lg font-semibold text-[10px] uppercase tracking-widest hover:bg-brand-highlight transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>{isForgotPassword ? 'Reset' : isRegistering ? 'Sign up' : 'Log in'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-white/40 font-medium">
                  {isRegistering ? 'Already a member?' : "Don't have an account?"}{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setIsForgotPassword(false);
                    }}
                    className="text-white hover:underline transition-all"
                  >
                    {isRegistering ? 'Sign in here' : 'Register here'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

      <AuthModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        description={modalConfig.description}
      />
    </div>
  );
};

export default Login;
