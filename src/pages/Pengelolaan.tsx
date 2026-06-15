import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Wheat, 
  UtensilsCrossed, 
  Zap, 
  Droplets, 
  Package, 
  ArrowLeft, 
  FileText, 
  Download, 
  MessageCircle, 
  Star, 
  Send, 
  Check, 
  BookOpen, 
  ArrowRight, 
  Clock, 
  Calendar, 
  HelpCircle,
  Bot,
  Search,
  ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BrandBot from '../components/BrandBot';
import { getAllProducts, sendProductFeedback, Product, incrementProductViews } from '../services/dataService';
import { UserProfile } from '../services/authService';
import { toast } from 'sonner';
import { jsPDF } from "jspdf";

interface PengelolaanProps {
  setCurrentPage: (page: string) => void;
  userProfile?: UserProfile | null;
  setPrefilledChatInput?: (msg: string) => void;
}

const Pengelolaan: React.FC<PengelolaanProps> = ({ setCurrentPage, userProfile, setPrefilledChatInput }) => {
  const [activePengelolaanCategory, setActivePengelolaanCategory] = useState(() => {
    return localStorage.getItem('activePengelolaanCategory') || "all";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Terbaru");
  const [selectedGuide, setSelectedGuide] = useState<Product | null>(() => {
    const saved = localStorage.getItem('selectedGuide');
    return saved ? JSON.parse(saved) : null;
  });
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [activeSection, setActiveSection] = useState('persiapan');
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleChatNav = (input?: string) => {
    if (!userProfile?.id) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
      }, 1500);
    } else {
      if (input && setPrefilledChatInput) setPrefilledChatInput(input);
      setCurrentPage('Chat AI');
    }
  };

  useEffect(() => {
    localStorage.setItem('activePengelolaanCategory', activePengelolaanCategory);
  }, [activePengelolaanCategory]);

  useEffect(() => {
    if (selectedGuide) {
      localStorage.setItem('selectedGuide', JSON.stringify(selectedGuide));
    } else {
      localStorage.removeItem('selectedGuide');
    }
  }, [selectedGuide]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        // Only show published products to users
        setProducts(data.filter(p => p.status === 'Published'));
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSelectGuide = async (guide: Product) => {
    if (!userProfile?.id) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
      }, 1500);
      return;
    }
    try {
      await incrementProductViews(guide.id!, userProfile?.id);
      setProducts(prev => prev.map(p => p.id === guide.id ? { ...p, views: (p.views || 0) + 1 } : p));
    } catch (err) {
      console.error('Failed to increment product views:', err);
    }
    setSelectedGuide(guide);
  };

  useEffect(() => {
    if (selectedGuide) {
      const handleScroll = () => {
        const sections = (selectedGuide.steps || []).map(s => s.id).concat(['tips']);
        const current = sections.find(id => {
          const element = document.getElementById(id);
          if (element) {
            const rect = element.getBoundingClientRect();
            return rect.top >= 0 && rect.top <= 300;
          }
          return false;
        });
        if (current) setActiveSection(current);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [selectedGuide]);

  const categories = [
    { id: 'all', title: 'Semua Produk', icon: Grid },
    { id: 'tepung', title: 'Tepung Sorgum', icon: Wheat },
    { id: 'olahan', title: 'Makanan Olahan', icon: UtensilsCrossed },
    { id: 'snack', title: 'Sereal & Snack', icon: Zap },
    { id: 'minum', title: 'Minuman Sorgum', icon: Droplets },
    { id: 'pack', title: 'Packaging Produk', icon: Package },
  ];

  const guides = [
    { 
      id: 1, 
      title: 'Cara Membuat Tepung Sorgum Lebih Halus', 
      desc: 'Teknik penggilingan dan penyaringan tepung agar tekstur lebih lembut dan cocok untuk berbagai olahan makanan.',
      time: '7 menit',
      cat: 'tepung',
      catTitle: 'Tepung Sorgum',
      icon: Wheat
    },
    { 
      id: 2, 
      title: 'Brownies Sorgum Tetap Lembut & Tidak Bantat', 
      desc: 'Panduan mengolah tepung sorgum menjadi brownies dengan tekstur lembut dan rasa yang lebih stabil.',
      time: '5 menit',
      cat: 'olahan',
      catTitle: 'Makanan Olahan',
      icon: UtensilsCrossed
    },
    { 
      id: 3, 
      title: 'Cara Menjaga Kerenyahan Sereal Sorgum', 
      desc: 'Pelajari teknik penyimpanan dan pengolahan agar sereal tetap renyah lebih lama.',
      time: '8 menit',
      cat: 'snack',
      catTitle: 'Sereal & Snack',
      icon: Zap
    },
    { 
      id: 4, 
      title: 'Minuman Sorgum Sehat dengan Tekstur Lebih Creamy', 
      desc: 'Tips mengolah minuman sorgum agar memiliki rasa lebih lembut dan nikmat.',
      time: '6 menit',
      cat: 'minum',
      catTitle: 'Minuman Sorgum',
      icon: Droplets
    },
    { 
      id: 5, 
      title: 'Kemasan Produk Sorgum Agar Terlihat Premium', 
      desc: 'Panduan memilih desain dan jenis kemasan untuk meningkatkan daya tarik produk UMKM.',
      time: '10 menit',
      cat: 'pack',
      catTitle: 'Packaging Produk',
      icon: Package
    },
    { 
      id: 6, 
      title: 'Cookies Sorgum Tidak Mudah Hancur', 
      desc: 'Gunakan teknik pencampuran dan pemanggangan yang tepat agar cookies tetap renyah and tidak rapuh.',
      time: '9 menit',
      cat: 'olahan',
      catTitle: 'Makanan Olahan',
      icon: UtensilsCrossed
    }
  ];

  const filteredGuides = products
    .filter(g => (activePengelolaanCategory === 'all' || 
      g.category.toLowerCase().includes(activePengelolaanCategory.toLowerCase()) || 
      (activePengelolaanCategory === 'pack' && g.category === 'Packaging Produk') ||
      (activePengelolaanCategory === 'snack' && g.category === 'Sereal & Snack') ||
      (activePengelolaanCategory === 'minum' && g.category === 'Minuman Sorgum') ||
      (activePengelolaanCategory === 'olahan' && g.category === 'Makanan Olahan') ||
      (activePengelolaanCategory === 'tepung' && g.category === 'Tepung Sorgum')))
    .filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // Sort logic from Firestore is already desc by default, but we can refine
      if (sortBy === "Terbaru") return 0; // Already sorted in hook
      return a.title.localeCompare(b.title);
    });


  const handleFeedbackSubmit = async () => {
    if (!feedbackText || !selectedGuide) return;
    if (!userProfile?.id) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
      }, 1500);
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await sendProductFeedback({
        productId: selectedGuide.id!,
        productTitle: selectedGuide.title,
        senderName: userProfile?.name || 'Anonymous',
        senderEmail: userProfile?.email || 'No Email',
        message: feedbackText,
        status: 'BARU',
        userId: userProfile.id
      });
      setShowFeedbackToast(true);
      setFeedbackText("");
      setTimeout(() => setShowFeedbackToast(false), 3000);
      toast.success('Masukan berhasil dikirim!');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Gagal mengirim masukan');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleDownload = () => {
    if (!selectedGuide) return;
    
    toast.info(`Menyiapkan panduan PDF: ${selectedGuide.title}`);
    
    try {
      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("PANDUAN PENGELOLAAN SORGUM", 105, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.text(selectedGuide.title.toUpperCase(), 105, 30, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Kategori:`, 20, 45);
      doc.setFont("helvetica", "normal");
      doc.text(selectedGuide.category || "-", 50, 45);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Waktu Baca:`, 20, 52);
      doc.setFont("helvetica", "normal");
      doc.text(selectedGuide.readTime || "-", 50, 52);

      doc.setFont("helvetica", "bold");
      doc.text(`Deskripsi:`, 20, 62);
      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(selectedGuide.description || "-", 170);
      doc.text(splitDesc, 20, 68);
      
      let cursorY = 68 + (splitDesc.length * 7) + 10;
      
      doc.setFont("helvetica", "bold");
      doc.text("LANGKAH-LANGKAH PENGOLAHAN:", 20, cursorY);
      cursorY += 10;
      
      doc.setFont("helvetica", "normal");
      (selectedGuide.steps || []).forEach((step, index) => {
        if (cursorY > 260) {
          doc.addPage();
          cursorY = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${step.title}`, 20, cursorY);
        cursorY += 7;
        doc.setFont("helvetica", "normal");
        const splitStep = doc.splitTextToSize(step.content, 160);
        doc.text(splitStep, 25, cursorY);
        cursorY += (splitStep.length * 7) + 5;
      });
      
      if (cursorY > 240) {
        doc.addPage();
        cursorY = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.text("TIPS AHLI:", 20, cursorY);
      cursorY += 7;
      doc.setFont("helvetica", "normal");
      const splitTips = doc.splitTextToSize(selectedGuide.tips || "Ikuti langkah dengan seksama.", 170);
      doc.text(splitTips, 20, cursorY);
      
      doc.setFontSize(10);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 20, 285);
      doc.text(`© 2026 SORGUM HUB - App Pendamping Sorgum`, 105, 285, { align: "center" });

      doc.save(`Panduan-${selectedGuide.title.replace(/\s+/g, '-')}.pdf`);
      toast.success('Panduan PDF berhasil diunduh!');
    } catch (e) {
      console.error(e);
      toast.error('Gagal membuat PDF');
    }
  };


  if (selectedGuide) {
    const toc = (selectedGuide.steps || []).map((step, i) => ({
      id: step.id,
      title: `${i + 1}. ${step.title}`
    })).concat([{ id: 'tips', title: `${(selectedGuide.steps?.length || 0) + 1}. Tips Produksi` }]);

    const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <div className="bg-[#f8faf9] min-h-screen pt-32 pb-20 px-6 font-sans">
        <div className="max-w-[1400px] mx-auto">
          <div id="main-guides" className="flex flex-col lg:flex-row gap-10">
            
            {/* LEFT SIDEBAR - Daftar Isi */}
            <aside className="w-full lg:w-72 shrink-0">
              <div className="sticky top-32 space-y-6">
                <button 
                  type="button"
                  onClick={() => setSelectedGuide(null)}
                  className="flex items-center gap-2 text-gray-500 hover:text-brand-accent font-semibold mb-4 transition-colors group text-sm"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Kembali ke semua panduan
                </button>

                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-8 font-serif">Daftar Isi</h3>
                  <div className="space-y-4">
                    {(toc || []).map((item) => (
                      <button 
                        type="button"
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full text-left p-4 rounded-xl transition-all text-[13px] font-semibold border ${activeSection === item.id ? 'bg-[#f0f9ed] text-brand-primary border-brand-accent/20 shadow-sm' : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-brand-primary'}`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#f0f9ed] rounded-[24px] p-8 border border-brand-accent/10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-primary mb-6 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Unduh Panduan</h3>
                  <p className="text-gray-500 text-[11px] leading-relaxed mb-8">
                    Unduh versi PDF untuk dibaca kapan saja tanpa internet.
                  </p>
                  <button 
                    type="button"
                    onClick={handleDownload}
                    className="w-full bg-[#c5e69e] hover:bg-brand-accent text-brand-primary font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Unduh PDF
                  </button>
                </div>
              </div>
            </aside>

            {/* CENTER CONTENT */}
            <main className="flex-1 bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100">
              <div className="max-w-3xl mx-auto">
                <span className="bg-[#f0f9ed] text-brand-primary px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-6 inline-block" id="bahan">
                  {selectedGuide.category}
                </span>
                
                <h1 className="text-4xl md:text-5xl font-serif font-semibold text-gray-900 mb-6 leading-tight">
                  {selectedGuide.title}
                </h1>
                
                <p className="text-gray-500 text-lg mb-10 leading-relaxed">
                  {selectedGuide.description}
                </p>

                <div className="flex flex-wrap items-center gap-8 text-[12px] font-semibold text-gray-400 mb-12 border-b border-gray-50 pb-8">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-gray-300" />
                    {selectedGuide.readTime} membaca
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-gray-300" />
                    Terakhir diperbarui: {selectedGuide.updated_at ? new Date(selectedGuide.updated_at).toLocaleDateString('id-ID') : 'Mei 2026'}
                  </div>
                </div>

                <div className="rounded-[40px] overflow-hidden mb-16 shadow-lg border border-gray-100">
                   <img 
                     src={selectedGuide.image || selectedGuide.thumbnail || `https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=1200`} 
                     alt={selectedGuide.title} 
                     className="w-full h-[450px] object-cover"
                     referrerPolicy="no-referrer"
                   />
                </div>

                <div className="space-y-16">
                  {(selectedGuide.steps || []).map((step, idx) => (
                    <section key={step.id} id={step.id}>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6 font-serif">{idx + 1}. {step.title}</h2>
                      <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap">
                        {step.content}
                      </div>
                    </section>
                  ))}

                  <section id="tips">
                    <div className="bg-[#f0f9ed] border border-brand-accent/10 rounded-[24px] p-8 flex gap-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                           <Wheat className="w-6 h-6 text-brand-primary" strokeWidth={2.5} />
                        </div>
                        <div>
                           <h4 className="font-semibold text-gray-900 mb-2">Tips Produksi</h4>
                           <p className="text-[13px] text-gray-600 leading-relaxed font-medium italic">
                             "{selectedGuide.tips || "Selalu perhatikan kebersihan alat dan bahan untuk hasil terbaik."}"
                           </p>
                        </div>
                    </div>
                  </section>
                </div>
              </div>
            </main>

            {/* RIGHT SIDEBAR - Action & Related */}
            <div className="w-full lg:w-80 shrink-0 space-y-8">
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <BrandBot size="sm" />
                  <h3 className="text-[17px] font-semibold text-gray-900 font-serif">Butuh Bantuan?</h3>
                </div>
                <p className="text-gray-500 text-[13px] leading-relaxed mb-8">
                  Jika Anda mengalami kendala dalam pengolahan atau pengembangan produk sorgum, konsultasikan langsung dengan Sorgum AI untuk mendapatkan bantuan yang lebih spesifik.
                </p>
                <button 
                  type="button"
                  onClick={() => {
                    handleChatNav(`Halo Sorgum AI, saya sedang membaca panduan "${selectedGuide.title}". Saya mengalami kendala dalam pengolahannya, bisakah Anda membantu saya lebih spesifik?`);
                  }}
                  className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 translate-y-0"
                >
                  <MessageCircle className="w-5 h-5 text-brand-accent" />
                  Tanya AI Sekarang
                </button>
              </div>

              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <h3 className="text-[17px] font-semibold text-gray-900 mb-8 font-serif">Panduan Terkait</h3>
                <div className="space-y-8">
                  {(products || [])
                    .filter(g => g.id !== selectedGuide.id)
                    .sort((a, b) => {
                      if (a.category === selectedGuide.category && b.category !== selectedGuide.category) return -1;
                      if (a.category !== selectedGuide.category && b.category === selectedGuide.category) return 1;
                      return 0;
                    })
                    .slice(0, 3).map((g, i) => (
                    <div key={i} className="flex gap-4 cursor-pointer group" onClick={() => {
                      setSelectedGuide(g);
                      window.scrollTo(0, 0);
                    }}>
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-50 bg-gray-50">
                        <img src={g.thumbnail || `https://images.unsplash.com/photo-${1563514227147 + i}-6d2ff665a6a0?auto=format&fit=crop&q=80&w=300`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Thumbnail" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-accent transition-colors mb-1">{g.title}</h4>
                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{g.readTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-gray-900 font-serif">Beri Masukan</h3>
                </div>
                <p className="text-gray-500 text-[13px] leading-relaxed mb-6">Apakah panduan pengelolaan produk ini membantu meningkatkan kualitas produk Anda?</p>
                
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tulis masukan Anda di sini..."
                  className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-accent transition-all resize-none mb-4"
                />

                <button 
                  disabled={!feedbackText || isSubmittingFeedback}
                  onClick={handleFeedbackSubmit}
                  className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${!feedbackText ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-accent hover:bg-brand-highlight text-black shadow-lg shadow-brand-accent/20 active:scale-95'}`}
                >
                  {isSubmittingFeedback ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Masukan
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
        
        {/* Feedback Toast */}
        <AnimatePresence>
          {showFeedbackToast && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-semibold flex items-center gap-3 z-[100]"
            >
              <div className="w-6 h-6 bg-brand-accent rounded-full flex items-center justify-center text-black">
                <Check className="w-4 h-4" />
              </div>
              Terima kasih atas masukan Anda!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-[#f8faf9] min-h-screen font-sans">
      {/* Header Hero */}
      <div className="relative pt-44 pb-24 px-6 overflow-hidden bg-[#041d11]">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover" 
            alt="bg"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#041d11]/90" />
        
        <div className="max-w-[1400px] mx-auto relative z-10 grid lg:grid-cols-2 items-center gap-12">
          <div>
            <span className="text-brand-accent font-semibold uppercase tracking-widest text-[11px] mb-4 block">PENGELOLAAN SORGUM</span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-semibold text-white mb-6 leading-[1.1]">
              Panduan Pengelolaan <br /> <span className="text-brand-accent italic underline decoration-brand-accent/30 underline-offset-8">Produk</span>
            </h1>
            <p className="text-white/60 text-lg max-w-xl mb-10 leading-relaxed">
              Panduan komprehensif pengembangan produk turunan sorgum untuk UMKM, mulai dari pengolahan hingga strategi pemasaran.
            </p>
            
            <div className="relative max-w-md group">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-accent group-focus-within:scale-110 transition-transform" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari panduan..." 
                className="relative w-full bg-transparent py-5 pl-14 pr-6 text-white placeholder:text-white/30 focus:outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="hidden lg:flex justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-accent/20 blur-[100px] rounded-full" />
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot className="w-64 h-64 text-brand-accent opacity-90" strokeWidth={1} />
              </motion.div>
              <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-3xl shadow-2xl animate-bounce border border-gray-100">
                <BookOpen className="w-8 h-8 text-brand-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-8">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-6 px-2">Kategori</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button 
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setActivePengelolaanCategory(cat.id);
                      setSelectedGuide(null);
                    }}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all text-left group ${activePengelolaanCategory === cat.id ? 'bg-brand-accent/10 text-gray-900 border border-brand-accent/20' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <cat.icon className={`w-5 h-5 ${activePengelolaanCategory === cat.id ? 'text-brand-accent' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="text-[13px] font-semibold">{cat.title}</span>
                  </button>
                ))}
              </div>
            </div>

              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 flex items-center justify-center text-brand-accent mb-6">
                <HelpCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Butuh bantuan?</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-8">
                Butuh bantuan dalam pengelolaan produk sorgum? Tim kami siap membantu Anda menemukan solusi terbaik untuk produk UMKM Anda.
              </p>
              <button 
                type="button"
                onClick={() => handleChatNav()}
                className="w-full bg-brand-accent hover:bg-brand-highlight text-black font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 group"
              >
                <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Sorgum AI Support
              </button>
            </div>
          </aside>

          {/* Main Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 font-serif">
                {categories.find(c => c.id === activePengelolaanCategory)?.title || 'Semua Panduan'}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400">Urutkan:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 focus:outline-none focus:border-brand-accent transition-all cursor-pointer"
                >
                  <option>Terbaru</option>
                  <option>Nama (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-pulse">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl mb-8" />
                    <div className="h-6 bg-gray-100 rounded-lg w-3/4 mb-4" />
                    <div className="h-16 bg-gray-100 rounded-lg w-full mb-8" />
                    <div className="h-6 bg-gray-100 rounded-lg w-1/2" />
                  </div>
                ))
              ) : (filteredGuides || []).length > 0 ? (
                (filteredGuides || []).map((guide) => (
                  <motion.div 
                    layout
                    key={guide.id}
                    onClick={() => handleSelectGuide(guide)}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-[32px] p-0 shadow-sm border border-gray-100 hover:border-brand-accent/30 transition-all cursor-pointer group flex flex-col overflow-hidden"
                  >
                    <div className="h-48 w-full bg-gray-100 relative">
                       <img 
                        src={guide.thumbnail || guide.image || `https://images.unsplash.com/photo-${1563514227147}-6d2ff665a6a0?auto=format&fit=crop&q=80&w=600`} 
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                       />
                       <div className="absolute top-4 left-4">
                          <span className="bg-brand-accent/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                            {guide.category}
                          </span>
                       </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-[17px] font-semibold text-gray-900 mb-4 group-hover:text-brand-accent transition-colors font-serif line-clamp-2">
                        {guide.title}
                      </h3>
                      <p className="text-gray-500 text-[13px] leading-relaxed mb-8 line-clamp-2 flex-grow">
                        {guide.description}
                      </p>
                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                          <Clock className="w-4 h-4" />
                          {guide.readTime}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                          <div className="w-1 h-1 bg-gray-300 rounded-full" />
                          {guide.views || 0} Views
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-brand-accent group-hover:translate-x-1 transition-transform">
                          Lihat Detail <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-semibold">Tidak ada panduan ditemukan</p>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default Pengelolaan;
