import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Eye, 
  Target, 
  Check, 
  Bot, 
  Users, 
  Package, 
  BookOpen, 
  MapPin 
} from 'lucide-react';
import BrandBot from '../components/BrandBot';

interface TentangProps {
  setCurrentPage: (page: string) => void;
}

const Tentang: React.FC<TentangProps> = ({ setCurrentPage }) => {
  return (
    <div className="font-sans">
      {/* Hero Section */}
      <div className="relative min-h-[600px] lg:h-[70vh] flex items-center bg-[#040D09] pt-44 lg:pt-48 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <img 
             src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=2000" 
             className="w-full h-full object-cover" 
             referrerPolicy="no-referrer"
             alt="Background"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-[#040D09] via-[#040D09]/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-brand-accent font-bold uppercase tracking-widest text-[10px] mb-4 block">TENTANG SORGUM AI</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-6">
              Membangun Layanan <br /> Lebih <span className="text-brand-accent">Cerdas</span> <br /> dengan <span className="text-brand-accent">AI</span>
            </h1>
            <p className="text-white/70 text-lg max-w-lg mb-10 leading-relaxed">
              Sorgum AI menggabungkan teknologi CRM dan AI Chatbot untuk memberikan pengalaman layanan pelanggan yang lebih cepat, efisien, dan informatif.
            </p>
            <button onClick={() => setCurrentPage('Chat AI')} className="bg-brand-accent hover:bg-brand-highlight text-black px-8 py-4 rounded-xl font-bold transition-all shadow-xl flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              Coba Demo
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-brand-accent/10 border-[8px] border-white/5 backdrop-blur-md flex items-center justify-center">
               <BrandBot size="lg" className="!w-32 !h-32 md:!w-44 md:!h-44" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Apa itu Sorgum AI? */}
      <div className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 items-center gap-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand-accent font-bold uppercase tracking-widest text-xs mb-4 block">APA ITU SORGUM AI?</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6 leading-tight">
              Solusi Layanan Pelanggan <br /> Lebih Cerdas dan Efisien
            </h2>
            <div className="space-y-6 text-gray-500 text-base leading-relaxed">
              <p>
                Sorgum AI adalah platform Customer Relationship Management (CRM) berbasis AI yang dirancang untuk membantu bisnis mengelola hubungan dengan pelanggan secara lebih efektif.
              </p>
              <p>
                Dilengkapi dengan AI Chatbot yang responsif, sistem ini mampu memberikan jawaban otomatis, membantu proses pemesanan, melacak pesanan, hingga memberikan informasi produk secara real-time.
              </p>
              <p>
                Kami juga menyediakan fitur edukasi interaktif untuk membantu pengguna memahami setiap fitur dan layanan dengan lebih mudah.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-gray-100 shadow-2xl overflow-hidden"
          >
            <img src="https://images.unsplash.com/photo-1551288049-bbda3865c670?auto=format&fit=crop&q=80&w=1200" alt="Dashboard" className="w-full h-auto" />
          </motion.div>
        </div>
      </div>

      {/* Visi & Misi Kami */}
      <div className="py-24 bg-[#040D09]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Visi & Misi Kami</h2>
            <div className="w-24 h-1.5 bg-brand-accent mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-10 rounded-3xl flex gap-6 group hover:border-brand-accent/30 transition-all">
              <div className="w-14 h-14 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl flex items-center justify-center shrink-0 text-brand-accent group-hover:bg-brand-accent group-hover:text-black transition-all">
                <Eye className="w-7 h-7" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Visi</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  Menjadi solusi digital terdepan dalam mengintegrasikan layanan pelanggan dengan teknologi AI untuk menciptakan pengalaman yang lebih cerdas, efisien, dan berkelanjutan.
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 rounded-3xl flex gap-6 group hover:border-brand-accent/30 transition-all">
              <div className="w-14 h-14 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl flex items-center justify-center shrink-0 text-brand-accent group-hover:bg-brand-accent group-hover:text-black transition-all">
                <Target className="w-7 h-7" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Misi</h3>
                <ul className="space-y-3">
                  {[
                    "Mengembangkan sistem CRM yang mudah digunakan",
                    "Menyediakan AI Chatbot yang responsif dan informatif",
                    "Memberikan fitur edukasi interaktif bagi pengguna",
                    "Meningkatkan kualitas layanan pelanggan melalui teknologi"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                      <div className="w-4 h-4 bg-brand-accent rounded-full flex items-center justify-center text-[8px] text-black">
                        <Check className="w-2.5 h-2.5 font-bold" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fitur Utama */}
      <div className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">Fitur Utama <span className="text-brand-accent">Sorgum AI</span></h2>
            <div className="w-24 h-1.5 bg-brand-accent mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Bot, title: "AI Chatbot", desc: "Asisten virtual 24/7 yang siap menjawab pertanyaan pelanggan secara otomatis dan akurat." },
              { icon: Users, title: "CRM System", desc: "Kelola data pelanggan, interaksi, dan riwayat transaksi dalam satu sistem terintegrasi." },
              { icon: Package, title: "Manajemen Pesanan", desc: "Proses pemesanan, tracking, hingga pengiriman dapat dikelola dengan mudah." },
              { icon: BookOpen, title: "Edukasi Interaktif", desc: "Panduan lengkap dan materi edukasi untuk membantu pengguna memahami fitur dan layanan kami." }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-accent group-hover:text-black transition-all shadow-sm">
                  <item.icon className="w-8 h-8 text-brand-primary group-hover:text-black transition-colors" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-3">{item.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asisten Pintar */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mb-24">
        <div className="bg-[#041d11] rounded-[40px] p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/5 blur-[100px] rounded-full" />
          
          <div className="relative z-10 shrink-0">
             <div className="w-48 h-48 md:w-56 md:h-56 bg-brand-accent/10 rounded-full flex items-center justify-center border-4 border-white/5">
                <BrandBot size="lg" className="!w-40 !h-40 md:!w-44 md:!h-44" />
                <div className="absolute top-8 right-0 bg-white p-2.5 rounded-2xl shadow-xl">
                   <MessageSquare className="text-brand-accent w-6 h-6" />
                </div>
             </div>
          </div>

          <div className="relative z-10 flex-grow">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4"> Asisten Pintar <span className="text-brand-accent">24/7</span><br /> untuk Pelanggan Anda</h2>
            <p className="text-white/60 mb-10 max-w-xl">AI Chatbot Sorgum AI siap membantu pelanggan Anda kapan saja.</p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                { icon: MessageSquare, title: "Jawab Otomatis", desc: "Menjawab pertanyaan umum secara cepat dan akurat." },
                { icon: BookOpen, title: "Panduan Interaktif", desc: "Memberikan panduan langkah demi langkah penggunaan layanan." },
                { icon: MapPin, title: "Tracking Pesanan", desc: "Membantu melacak status pesanan secara real-time." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                   <item.icon className="w-5 h-5 text-brand-accent shrink-0 mt-1" />
                   <div>
                      <h5 className="font-semibold text-sm mb-1">{item.title}</h5>
                      <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Siap Meningkatkan Layanan Anda? */}
      <div className="py-24 text-center border-t border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
           <img src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="bg" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-6">
            Siap Meningkatkan <span className="text-brand-accent">Layanan Anda?</span>
          </h2>
          <p className="text-gray-500 mb-10 text-lg">Bergabunglah bersama ribuan bisnis yang telah menggunakan Sorgum AI.</p>
          <button onClick={() => setCurrentPage('Chat AI')} className="bg-brand-accent hover:bg-brand-highlight text-black px-10 py-5 rounded-2xl font-semibold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3 mx-auto">
             <MessageSquare className="w-6 h-6" />
             Coba Demo Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tentang;
