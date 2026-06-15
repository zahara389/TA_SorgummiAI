import React, { useState } from 'react';
import { Send, Bot, MapPin, Instagram, Facebook, Twitter, Phone, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { subscribeToNewsletter } from '../services/dataService';
import { motion, AnimatePresence } from 'motion/react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer = ({ onNavigate }: FooterProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await subscribeToNewsletter(email);
      setIsSuccess(true);
      setEmail('');
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err: any) {
      if (err.message === 'ALREADY_SUBSCRIBED') {
        setErrorMessage('Anda sudah berlangganan!');
        setTimeout(() => setErrorMessage(''), 5000);
      } else {
        console.error('Gagal berlangganan:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#041a0d] text-white/80 py-16 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Newsletter Section */}
        <div className="bg-[#0b331a] rounded-[32px] p-8 md:p-12 mb-20 border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-semibold flex items-center gap-3 mb-2 font-sans">
              Tetap Terupdate <span className="text-2xl">🌱</span>
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
              UPDATE BULANAN TENTANG PERTANIAN SORGUM & TEKNOLOGI AI
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 sm:gap-2 bg-black/10 sm:bg-black/20 rounded-2xl sm:rounded-full p-2 sm:p-1.5 border border-white/10">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Alamat Email Anda..." 
              className="bg-black/20 sm:bg-transparent px-6 py-3 sm:py-2 rounded-xl sm:rounded-none flex-grow lg:w-80 outline-none text-sm placeholder:text-white/20 font-medium"
            />
            <button 
              type="submit"
              disabled={isSubmitting || isSuccess || !!errorMessage}
              className={`font-semibold py-3 px-8 rounded-xl sm:rounded-full flex items-center justify-center gap-2 text-[11px] tracking-widest uppercase transition-all active:scale-95 shadow-xl whitespace-nowrap ${
                isSuccess 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : errorMessage
                ? 'bg-orange-500 text-white shadow-orange-500/20'
                : 'bg-brand-accent hover:bg-brand-highlight text-black shadow-brand-accent/20'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : errorMessage ? (
                <span className="text-lg leading-none">!</span>
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isSuccess ? 'BERLANGGANAN!' : errorMessage ? 'SUDAH TERDAFTAR!' : 'LANGGANAN SEKARANG'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand & Map */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigate('Home')}>
              <div className="w-10 h-10 bg-brand-accent flex items-center justify-center rounded-xl shadow-lg shadow-brand-accent/20">
                <Bot className="w-6 h-6 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-semibold tracking-tight text-white font-sans">
                Sorgummi<span className="text-brand-accent">AI</span>
              </span>
            </div>
            
            <a 
              href="https://maps.app.goo.gl/neqJShGJkDaU86rj9?g_st=aw" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative aspect-video rounded-[24px] overflow-hidden border border-white/5 group cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
                className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" 
                alt="Peta Lokasi"
              />
              <div className="absolute inset-0 bg-[#041a0d]/40 flex flex-col items-center justify-center p-4">
                <MapPin className="w-6 h-6 text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-white/80 text-center">LIHAT PETA LOKASI</span>
              </div>
            </a>

            <div className="flex gap-5 pt-2">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <button key={i} type="button" className="text-white/40 hover:text-brand-accent transition-colors">
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Tautan Pintas */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-8 border-b border-white/10 pb-4 tracking-wider uppercase">Tautan Pintas</h4>
            <ul className="space-y-4 font-semibold text-[11px] tracking-widest uppercase text-white/50">
              {[
                { label: 'BERANDA', page: 'Beranda' },
                { label: 'TENTANG', page: 'Tentang' },
                { label: 'EDUKASI', page: 'Edukasi' },
                { label: 'PENGELOLAAN', page: 'Pengelolaan' },
                { label: 'CHAT AI', page: 'Chat AI' },
                { label: 'KONTAK', page: 'Kontak' }
              ].map((item) => (
                <li 
                  key={item.label} 
                  className="cursor-pointer hover:text-brand-accent transition-colors"
                  onClick={() => onNavigate(item.page)}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Layanan */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-8 border-b border-white/10 pb-4 tracking-wider uppercase">Layanan</h4>
            <ul className="space-y-4 font-medium text-sm text-white/50">
              <li className="cursor-pointer hover:text-brand-accent transition-colors" onClick={() => onNavigate('Chat AI')}>Layanan Konsultasi Cerdas</li>
              <li className="cursor-pointer hover:text-brand-accent transition-colors" onClick={() => onNavigate('Edukasi')}>Layanan Pusat Edukasi</li>
              <li className="cursor-pointer hover:text-brand-accent transition-colors" onClick={() => onNavigate('Kontak')}>Layanan Interaktif User Feedback</li>
              <li className="cursor-pointer hover:text-brand-accent transition-colors" onClick={() => onNavigate('Pengelolaan')}>Layanan Manajemen Lahan</li>
              <li className="cursor-pointer hover:text-brand-accent transition-colors" onClick={() => onNavigate('Profil')}>Layanan Pusat Informasi Akun</li>
            </ul>
          </div>

          {/* Alamat & Kontak */}
          <div className="space-y-10">
            <div>
              <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Alamat</h4>
              <div className="flex gap-4 text-sm text-white/50 leading-relaxed">
                <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <p>Fakultas Ilmu Terapan, Jl. Telekomunikasi No.1, Sukapura, Kec. Dayeuhkolot, Kabupaten Bandung, Jawa Barat 40257</p>
              </div>
            </div>
            <div className="space-y-5">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Kontak</h4>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-brand-accent" />
                </div>
                <p className="font-semibold tracking-tight text-white/80">082120974705</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-brand-accent" />
                </div>
                <p className="font-medium text-white/60">adminsorgummi@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-semibold tracking-widest text-white/20 uppercase">
          <p>© 2026 SORGUMAI. HAK CIPTA DILINDUNGI UNDANG-UNDANG.</p>
          <div className="flex gap-10">
            <span className="hover:text-white cursor-pointer transition-colors">KEBIJAKAN PRIVASI</span>
            <span className="hover:text-white cursor-pointer transition-colors">SYARAT & KETENTUAN</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;