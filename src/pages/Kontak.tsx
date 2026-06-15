import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  Check, 
  Instagram, 
  Twitter, 
  Facebook, 
  Linkedin,
  MessageCircle,
  Globe,
  Leaf,
  User,
  Bot,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { submitContactToFaq, getActiveFaqs } from '../services/dataService';
import { UserProfile } from '../services/authService';
import { toast } from 'sonner';

interface KontakProps {
  setCurrentPage: (page: string) => void;
  userProfile?: UserProfile | null;
}

const Kontak: React.FC<KontakProps> = ({ setCurrentPage, userProfile }) => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [showContactToast, setShowContactToast] = useState(false);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Template teks untuk WhatsApp
  const waTemplate = encodeURIComponent("Halo admin Sorgummi AI, saya ingin bertanya dan berkonsultasi mengenai sistem.");

  // BARU: Tautan langsung ke web Gmail Compose (pasti terbuka di browser tanpa butuh aplikasi mail bawaan)
  const gmailWebUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=adminsorgummi@gmail.com&su=Tanya%20Sorgummi%20AI";

  // Konstanta data kontak utama
  const CONTACT_INFO = {
    whatsappUrl: `https://wa.me/6282120974705?text=${waTemplate}`,
    emailUrl: gmailWebUrl, // Diarahkan ke Gmail Web
    mapsUrl: "https://maps.app.goo.gl/neqJShGJkDaU86rj9?g_st=aw"
  };

  const handleChatNav = () => {
    if (!userProfile?.id) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
      }, 1500);
    } else {
      setCurrentPage('Chat AI');
    }
  };

  useEffect(() => {
    const fetchActiveFaqsList = async () => {
      setLoadingFaqs(true);
      try {
        const data = await getActiveFaqs();
        setFaqs(data || []);
      } catch (err) {
        console.error('Failed to fetch active FAQs:', err);
      } finally {
        setLoadingFaqs(false);
      }
    };
    fetchActiveFaqsList();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
      }, 1500);
      return;
    }
    if (!contactForm.name || !contactForm.email || !contactForm.phone || !contactForm.message) {
      toast.error('Harap isi semua kolom formulir.');
      return;
    }
    setIsSubmittingContact(true);
    try {
      await submitContactToFaq({
        ...contactForm
      });
      toast.success('Pesan Anda berhasil dikirim! Tim kami akan segera meninjau pesan Anda.');
      setShowContactToast(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setShowContactToast(false), 5000);
    } catch (err) {
      console.error('Failed to submit contact form:', err);
      toast.error('Gagal mengirim pesan. Silakan coba kembali.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div className="font-sans min-h-screen bg-[#f8faf9]">
      {/* Hero Section */}
      <div className="bg-[#040D09] pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <span className="text-brand-accent font-bold uppercase tracking-[0.3em] text-[10px] mb-6 block">KONTAK KAMI</span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-semibold text-white mb-6 leading-tight max-w-4xl">
              Kami Siap <span className="text-brand-accent">Membantu</span> Anda
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8 font-medium">
              Hubungi kami untuk pertanyaan, bantuan penggunaan sistem, atau informasi lebih lanjut tentang Sorgum AI.
            </p>
            <div className="flex items-center gap-4 text-brand-accent">
              <div className="h-[1px] w-12 bg-brand-accent/30"></div>
              <Leaf className="w-5 h-5 fill-current" />
              <div className="h-[1px] w-12 bg-brand-accent/30"></div>
            </div>
          </motion.div>
        </div>

        {/* Floating Forms Area */}
        <div className="max-w-[1200px] mx-auto mt-20 relative z-20">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Form Card */}
            <motion.div 
               initial={{ opacity: 0, x: -30 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-[#111814] border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl"
            >
              <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
                Kirim Pesan
              </h2>
              <form onSubmit={handleContactSubmit} className="space-y-5">
                {showContactToast && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl flex items-center gap-3 text-brand-accent text-xs font-semibold"
                  >
                    <Check className="w-4 h-4 flex-shrink-0" />
                    Pesan berhasil dikirim! Tim kami akan meninjau dan merespons segera.
                  </motion.div>
                )}
                <div className="relative">
                  <User className="absolute left-5 top-5 w-4.5 h-4.5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Nama Lengkap" 
                    className="w-full bg-[#1A231E] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-600"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-5 top-5 w-4.5 h-4.5 text-gray-500" />
                  <input 
                    type="email" 
                    placeholder="Email Anda" 
                    className="w-full bg-[#1A231E] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-600"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-5 top-5 w-4.5 h-4.5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Nomor Telepon" 
                    className="w-full bg-[#1A231E] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-600"
                    value={contactForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setContactForm({ ...contactForm, phone: val });
                    }}
                    required
                  />
                </div>
                <div className="relative">
                  <textarea 
                    placeholder="Tulis pesan Anda di sini..." 
                    rows={4}
                    className="w-full bg-[#1A231E] border border-white/5 rounded-2xl py-4 px-6 text-sm font-medium text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-gray-600 resize-none"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmittingContact}
                  className="w-full bg-brand-accent hover:bg-brand-highlight text-black py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-brand-accent/20"
                >
                  {isSubmittingContact ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Pesan
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Info Card */}
            <motion.div 
               initial={{ opacity: 0, x: 30 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-[#111814] border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold text-white mb-8">Informasi Kontak</h2>
                <div className="space-y-8">
                  {[
                    { icon: Mail, label: 'EMAIL', value: 'adminsorgummi@gmail.com', sub: 'Kami akan merespons dalam 1x24 jam', link: CONTACT_INFO.emailUrl },
                    { icon: MessageCircle, label: 'WHATSAPP', value: '082120974705', sub: 'Chat langsung dengan tim kami', link: CONTACT_INFO.whatsappUrl },
                    { icon: MapPin, label: 'ALAMAT', value: 'Fakultas Ilmu Terapan, Jl. Telekomunikasi No.1', sub: 'Sukapura, Kec. Dayeuhkolot, Kabupaten Bandung, Jawa Barat 40257', link: CONTACT_INFO.mapsUrl },
                    { icon: Clock, label: 'JAM OPERASIONAL', value: 'Senin - Jumat: 08.00 - 17.00 WIB', sub: 'Sabtu - Minggu: Libur', link: null },
                  ].map((item, i) => {
                    const Content = () => (
                      <>
                        <div className="w-12 h-12 bg-[#1A231E] rounded-xl flex items-center justify-center text-brand-accent flex-shrink-0 group-hover:bg-brand-accent/10 transition-colors">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-brand-accent tracking-[0.2em] mb-1">{item.label}</p>
                          <p className="text-white font-bold mb-1 group-hover:text-brand-accent transition-colors">{item.value}</p>
                          <p className="text-gray-500 text-[11px] font-medium leading-relaxed">{item.sub}</p>
                        </div>
                      </>
                    );

                    return item.link ? (
                      <a 
                        key={i} 
                        href={item.link}
                        target="_blank" // Membuka tab baru untuk maps, wa, dan gmail web
                        rel="noopener noreferrer"
                        className="flex gap-5 group cursor-pointer text-left block"
                      >
                        <Content />
                      </a>
                    ) : (
                      <div key={i} className="flex gap-5">
                        <Content />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Support Section */}
      <div className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto text-center mb-16">
          <h2 className="text-3xl font-serif font-semibold text-brand-primary mb-4">Dukungan Cepat</h2>
          <div className="w-12 h-1 bg-brand-accent mx-auto rounded-full"></div>
        </div>

        <div className="max-w-[1200px] mx-auto grid md:grid-cols-3 gap-8 mb-24">
          {[
            { 
              icon: Bot, 
              title: 'Tanya Chat AI', 
              desc: 'Dapatkan bantuan cepat 24/7 melalui AI Chat AI kami.', 
              link: 'Mulai Chat', 
              highlight: true,
              action: () => handleChatNav(),
              isExternal: false
            },
            { 
              icon: Mail, 
              title: 'Kirim Email', 
              desc: 'Kirimkan pertanyaan atau masukan Anda melalui email.', 
              link: 'Kirim Email',
              action: CONTACT_INFO.emailUrl,
              isExternal: true
            },
            { 
              icon: MessageCircle, 
              title: 'Chat WhatsApp', 
              desc: 'Hubungi kami langsung melalui WhatsApp untuk respon lebih cepat.', 
              link: 'Chat Sekarang',
              action: CONTACT_INFO.whatsappUrl,
              isExternal: true
            }
          ].map((item, i) => (
            <motion.div 
               key={i}
               whileHover={{ y: -10 }}
               className="bg-white p-8 rounded-3xl border border-gray-100 group transition-all shadow-sm hover:shadow-xl hover:border-brand-accent/20 flex flex-col justify-between"
            >
              <div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all text-brand-primary`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                   <h3 className="text-lg font-semibold text-brand-primary">{item.title}</h3>
                   {item.highlight && <span className="text-[9px] font-semibold text-brand-primary px-2 py-0.5 rounded-full uppercase bg-brand-accent/10">Aktif 24/7</span>}
                </div>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {item.isExternal ? (
                <a 
                  href={item.action as string}
                  target="_blank" // Memastikan tautan Gmail web dan WA terbuka di tab baru dengan aman
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-primary font-bold text-xs hover:gap-3 transition-all mt-4 w-fit"
                >
                  {item.link} 
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <button 
                  type="button"
                  onClick={item.action as () => void}
                  className="flex items-center gap-2 text-brand-primary font-bold text-xs hover:gap-3 transition-all mt-4 text-left"
                >
                  {item.link} 
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-[#0c1410] rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-8">
              <div className="w-16 h-16 bg-[#1A231E] rounded-3xl flex items-center justify-center text-brand-accent">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-serif font-semibold text-white mb-1">Butuh bantuan cepat?</h2>
                 <p className="text-white/40 text-sm font-medium">AI Chat AI kami siap membantu Anda kapan saja.</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => handleChatNav()}
              className="relative z-10 bg-brand-accent hover:bg-brand-highlight text-black px-8 py-4 rounded-2xl font-semibold text-sm flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-brand-accent/20"
            >
              <MessageCircle className="w-5 h-5" />
              Tanya Chat AI
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-[#0c1410] py-24 px-6 border-t border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(163,255,18,0.03),transparent_40%)]" />
        <div className="max-w-[800px] mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-brand-accent font-bold uppercase tracking-[0.3em] text-[10px] mb-3 block">PERTANYAAN UMUM</span>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4">FAQ - Tanya Jawab</h2>
            <div className="w-12 h-1 bg-brand-accent mx-auto rounded-full"></div>
          </div>

          {loadingFaqs ? (
            <div className="text-center py-10">
              <div className="w-8.5 h-8.5 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Memuat FAQ...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-10 bg-white/2 rounded-3xl border border-white/5">
              <p className="text-white/40 text-sm font-semibold">Belum ada pertanyaan umum yang tersedia.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen 
                        ? 'bg-[#111814] border-brand-accent/30 shadow-[0_4px_20px_rgba(163,255,18,0.05)]' 
                        : 'bg-[#111814]/40 border-white/5 hover:border-brand-accent/20 hover:bg-[#111814]/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                    >
                      <span className={`font-semibold text-sm transition-colors duration-300 ${isOpen ? 'text-brand-accent font-bold' : 'text-white'}`}>
                        {faq.question}
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-brand-accent text-black rotate-45' : 'bg-white/5 text-white/40'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
                        </svg>
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 pb-6 pt-1 border-t border-white/5">
                            <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-medium">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Kontak;