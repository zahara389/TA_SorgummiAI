import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Search, ChevronDown, ChevronUp, Edit2, Trash2, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Modal from './Modal';
import { getAllFaqs, createFaq, updateFaq, deleteFaq, replyContactMessage, Faq } from '../../services/dataService';
import { toast } from 'sonner';

interface FAQTableProps {
  isDarkMode?: boolean;
}

const parseQuestion = (questionStr?: string) => {
  if (!questionStr) return { name: '', email: '', message: '' };
  const match = questionStr.match(/^\[Pesan dari (.+?) - (.+?)\]:\s*(.+)$/s);
  if (match) {
    return { name: match[1], email: match[2], message: match[3] };
  }
  return { name: 'Pengguna', email: '', message: questionStr };
};

const FAQTable: React.FC<FAQTableProps> = ({ isDarkMode = true }) => {
  const [activeSubTab, setActiveSubTab] = useState<'faq' | 'pesan'>(() => {
    return (localStorage.getItem('activeFAQSubTab') as 'faq' | 'pesan') || 'faq';
  });
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedItem, setSelectedItem] = useState<Faq | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [formData, setFormData] = useState<Partial<Faq>>({
    question: '',
    answer: '',
    category: 'Umum',
    status: 'Active'
  });

  useEffect(() => {
    localStorage.setItem('activeFAQSubTab', activeSubTab);
    setCurrentPage(1);
  }, [activeSubTab]);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const data = await getAllFaqs();
      setFaqs(data);
    } catch (err) {
      toast.error('Gagal mengambil data FAQ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleOpenModal = async (type: 'add' | 'edit' | 'delete', item: Faq | null = null) => {
    setModalType(type);
    setSelectedItem(item);
    if (type === 'edit' && item) {
      const initialStatus = item.status || 'Active';
      setFormData({
        question: item.question || '',
        answer: item.answer || '',
        category: item.category || 'Umum',
        status: initialStatus
      });

      // Auto-transition UNREAD contact messages to READ when opened
      if (item.category?.toUpperCase() === 'KONTAK' && initialStatus === 'UNREAD') {
        try {
          await updateFaq(item.id, { ...item, status: 'READ' });
          setFaqs(prev => prev.map(f => f.id === item.id ? { ...f, status: 'READ' } : f));
          setFormData(prev => ({ ...prev, status: 'READ' }));
        } catch (err) {
          console.error('Failed to auto-mark message as read:', err);
        }
      }
    } else {
      setFormData({
        question: '',
        answer: '',
        category: 'Umum',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (modalType === 'edit' && selectedItem?.category?.toUpperCase() === 'KONTAK' && selectedItem?.id) {
      if (!formData.answer || formData.answer.trim() === '' || formData.answer.startsWith('Belum dijawab')) {
        toast.error('Jawaban admin wajib diisi untuk membalas pesan');
        return;
      }

      setIsReplying(true);
      try {
        const parsed = parseQuestion(selectedItem.question);
        const emailUser = parsed.email;
        if (!emailUser) {
          throw new Error('Format email pengirim tidak ditemukan pada pesan');
        }

        await replyContactMessage(selectedItem.id, emailUser, formData.answer);
        toast.success('Jawaban berhasil dikirim ke email pengguna!');
        setIsModalOpen(false);
        fetchFaqs();
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengirim jawaban via email');
      } finally {
        setIsReplying(false);
      }
      return;
    }

    if (!formData.question || !formData.answer) {
      toast.error('Pertanyaan dan jawaban wajib diisi');
      return;
    }

    try {
      if (modalType === 'add') {
        await createFaq(formData);
        toast.success('FAQ berhasil ditambahkan');
      } else if (modalType === 'edit' && selectedItem?.id) {
        const finalData = { ...formData };
        if (selectedItem.category?.toUpperCase() === 'KONTAK') {
          // If answer is changed from default "Belum dijawab", status becomes REPLIED
          if (finalData.answer && !finalData.answer.startsWith('Belum dijawab')) {
            finalData.status = 'REPLIED';
          }
        }
        await updateFaq(selectedItem.id, finalData);
        toast.success('FAQ berhasil diperbarui');
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      toast.error('Gagal menyimpan FAQ');
    }
  };

  const handleDelete = async () => {
    if (selectedItem?.id) {
      try {
        await deleteFaq(selectedItem.id);
        toast.success('FAQ berhasil dihapus');
        setIsModalOpen(false);
        fetchFaqs();
      } catch (err) {
        toast.error('Gagal menghapus FAQ');
      }
    }
  };

  const filteredFaqs = faqs
    .filter(faq => {
      const isKontak = faq.category?.toUpperCase() === 'KONTAK';
      if (activeSubTab === 'faq') {
        return !isKontak;
      } else {
        return isKontak;
      }
    })
    .sort((a, b) => Number(b.id) - Number(a.id));

  const totalItems = filteredFaqs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedFaqs = filteredFaqs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <div className={`border rounded-2xl md:rounded-[40px] p-4 md:p-6 lg:p-8 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/20' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h3 className={`font-serif font-bold text-xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {activeSubTab === 'faq' ? 'Manajemen FAQ' : 'Pesan Masuk Kontak'}
            </h3>
            <p className={`text-xs font-medium transition-colors ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
              {activeSubTab === 'faq' 
                ? 'Kelola pertanyaan yang sering diajukan untuk bantuan mandiri pengguna.' 
                : 'Lihat dan jawab pesan masuk dari pengguna melalui form kontak.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeSubTab === 'faq' && (
              <button 
                type="button"
                onClick={() => handleOpenModal('add')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-brand-accent/20' : 'bg-brand-primary text-white hover:opacity-90 shadow-brand-primary/20'}`}
              >
                <Plus className="w-4 h-4" /> Tambah FAQ
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/5 mb-6 gap-6 relative">
          <button
            type="button"
            onClick={() => setActiveSubTab('faq')}
            className={`pb-4 px-1 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] relative transition-all ${
              activeSubTab === 'faq'
                ? (isDarkMode ? 'text-brand-accent font-black' : 'text-brand-primary font-black')
                : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-gray-500 hover:text-gray-900')
            }`}
          >
            MANAJEMEN FAQ
            {activeSubTab === 'faq' && (
              <motion.div 
                layoutId="faq-subtab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-full shadow-[0_0_8px_rgba(97,154,1,0.4)]" 
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('pesan')}
            className={`pb-4 px-1 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] relative transition-all ${
              activeSubTab === 'pesan'
                ? (isDarkMode ? 'text-brand-accent font-black' : 'text-brand-primary font-black')
                : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-gray-500 hover:text-gray-900')
            }`}
          >
            PESAN MASUK
            {activeSubTab === 'pesan' && (
              <motion.div 
                layoutId="faq-subtab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-full shadow-[0_0_8px_rgba(97,154,1,0.4)]" 
              />
            )}
          </button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
              <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Memuat data...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100 shadow-xs'}`}>
              <HelpCircle className={`w-10 h-10 mx-auto mb-3 opacity-20 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                Tidak ada {activeSubTab === 'faq' ? 'FAQ' : 'pesan masuk'} yang ditemukan.
              </p>
            </div>
          ) : (
            paginatedFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 hover:border-brand-accent/20' : 'bg-gray-50 border-gray-100 hover:border-brand-primary/20 shadow-xs'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${isDarkMode ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'}`}>
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{faq.question}</h4>
                      <p className={`text-xs leading-relaxed max-w-2xl ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>{faq.answer}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40' : 'bg-white border-gray-200 text-gray-500 shadow-xs'}`}>
                          {faq.category}
                        </span>
                        {(() => {
                          const isKontak = faq.category?.toUpperCase() === 'KONTAK';
                          if (isKontak) {
                            if (faq.status?.toUpperCase() === 'UNREAD') {
                              return (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${isDarkMode ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-orange-50 border-orange-200 text-orange-600'}`}>
                                  BELUM DIBACA
                                </span>
                              );
                            } else if (faq.status?.toUpperCase() === 'READ') {
                              return (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${isDarkMode ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-green-50 border-green-200 text-green-600'}`}>
                                  SUDAH DIBACA
                                </span>
                              );
                            } else if (faq.status?.toUpperCase() === 'REPLIED') {
                              return (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                  TERJAWAB
                                </span>
                              );
                            } else {
                              return (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40' : 'bg-white border-gray-200 text-gray-500 shadow-xs'}`}>
                                  {faq.status}
                                </span>
                              );
                            }
                          } else {
                            // Standard FAQ Badge
                            const isActive = faq.status === 'Active';
                            return (
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${isActive ? (isDarkMode ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-green-50 border-green-200 text-green-600') : (isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-red-50 border-red-200 text-red-600')}`}>
                                {faq.status}
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {!(activeSubTab === 'pesan' && faq.status?.toUpperCase() === 'REPLIED') && (
                      <button 
                        type="button"
                        onClick={() => handleOpenModal('edit', faq)}
                        className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-white/40 hover:text-brand-accent hover:bg-brand-accent/5' : 'text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5'}`}
                        title={activeSubTab === 'pesan' ? 'Jawab Pesan' : 'Edit FAQ'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => handleOpenModal('delete', faq)}
                      className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-white/40 hover:text-red-500 hover:bg-red-500/5' : 'text-gray-400 hover:text-red-500 hover:bg-red-500/5'}`}
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalItems > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
              Menampilkan {paginatedFaqs.length} dari {totalItems} {activeSubTab === 'faq' ? 'FAQ' : 'Pesan'}
            </p>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className={`p-2 rounded-xl transition-all disabled:opacity-20 ${isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                    safeCurrentPage === i + 1
                      ? (isDarkMode ? 'bg-brand-accent text-black font-black' : 'bg-brand-primary text-white font-black')
                      : (isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100')
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className={`p-2 rounded-xl transition-all disabled:opacity-20 ${isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isDarkMode={isDarkMode}
        size={modalType === 'delete' ? 'max-w-[400px]' : 'md:max-w-[700px] sm:max-w-[600px] w-[95%]'}
        title={
          modalType === 'add' 
            ? 'Tambah FAQ Baru' 
            : modalType === 'edit' 
              ? (formData.category?.toUpperCase() === 'KONTAK' ? 'Jawab Pesan Masuk' : 'Edit FAQ') 
              : (selectedItem?.category?.toUpperCase() === 'KONTAK' ? 'Hapus Pesan Masuk' : 'Hapus FAQ')
        }
      >
        {modalType === 'delete' ? (
          <div className="space-y-6">
            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              Apakah Anda yakin ingin menghapus {selectedItem?.category?.toUpperCase() === 'KONTAK' ? 'pesan masuk' : 'pertanyaan'} <span className="font-bold text-red-500">"{selectedItem?.question}"</span>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className={`w-full sm:w-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-500'}`}>Batal</button>
              <button 
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            {formData.category?.toUpperCase() === 'KONTAK' ? (
              <div className="space-y-6">
                {(() => {
                  const parsed = parseQuestion(formData.question);
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                            Nama Pengirim
                          </label>
                          <div className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-white/80' : 'bg-gray-50 border-gray-200 text-gray-700 shadow-sm'}`}>
                            {parsed.name || 'Pengguna'}
                          </div>
                        </div>
                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                            Email Pengirim
                          </label>
                          <div className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-white/80' : 'bg-gray-50 border-gray-200 text-gray-700 shadow-sm'}`}>
                            {parsed.email || '-'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                          Pesan dari Pengguna
                        </label>
                        <div className={`px-4 py-3 rounded-xl border text-sm min-h-[80px] whitespace-pre-wrap leading-relaxed transition-all ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-white/60' : 'bg-gray-50 border-gray-200 text-gray-600 shadow-sm'}`}>
                          "{parsed.message}"
                        </div>
                      </div>
                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                          Jawaban Admin (Akan dikirim ke email pengirim)
                        </label>
                        <textarea 
                          rows={5}
                          name="answer"
                          value={formData.answer && formData.answer.startsWith('Belum dijawab') ? '' : formData.answer || ''}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-primary/50 shadow-sm'}`}
                          placeholder="Tulis tanggapan atau jawaban Anda untuk pesan ini..."
                          required
                        ></textarea>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                    Pertanyaan
                  </label>
                  <input 
                    type="text" 
                    name="question"
                    value={formData.question || ''}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-primary/50 shadow-sm'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                    Jawaban
                  </label>
                  <textarea 
                    rows={4}
                    name="answer"
                    value={formData.answer || ''}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-primary/50 shadow-sm'}`}
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Kategori</label>
                    <select 
                      name="category"
                      value={formData.category || 'Umum'}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${
                        isDarkMode 
                          ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-primary/50 shadow-sm'
                      }`}
                    >
                      <option value="Umum">Umum</option>
                      <option value="Teknis">Teknis</option>
                      <option value="Produk">Produk</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Status</label>
                    <select 
                      name="status"
                      value={formData.status || 'Active'}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 border-t transition-all gap-2 md:gap-3 border-white/5">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 shadow-sm'}`}
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={isReplying}
                className={`w-full sm:w-auto px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-brand-accent/20' 
                    : 'bg-brand-primary text-white hover:opacity-90 shadow-brand-primary/20'
                } ${isReplying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isReplying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  formData.category?.toUpperCase() === 'KONTAK' ? 'Kirim Jawaban' : 'Simpan'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default FAQTable;
