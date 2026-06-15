import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, Edit2, ThumbsUp, ThumbsDown, Clock, Eye, Image as ImageIcon, AlertCircle, CheckCircle2, Bot, ArrowRight, User, X, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { 
  getAllArticles, 
  createArticle, 
  updateArticle, 
  deleteArticle, 
  getArticleFeedback,
  Article 
} from '../../services/dataService';

interface EducationTableProps {
  isDarkMode?: boolean;
}

const EducationTable: React.FC<EducationTableProps> = ({ isDarkMode = true }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete' | 'helpful_list' | 'not_helpful_list'>('add');
  const [selectedItem, setSelectedItem] = useState<Article | null>(null);
  const defaultFormData: Partial<Article> = {
    title: '',
    category: 'Masalah Tanah',
    status: 'Draft',
    author: 'Admin',
    views: 0,
    readTime: '5 Menit',
    badge: 'Solusi Baru',
    stepTitle: 'Langkah Penyelamatan',
    problem: '',
    cause: '',
    solutions: ['', ''],
    expertTips: '',
    thumbnail: '',
    helpful: 0,
    notHelpful: 0,
    helpfulUsers: [],
    notHelpfulUsers: []
  };

  const [formData, setFormData] = useState<Partial<Article>>(defaultFormData);
  const [validationError, setValidationError] = useState('');

  const fetchArticles = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const data = await getAllArticles();
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    const interval = setInterval(() => {
      fetchArticles(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredArticles = (articles || []).filter(article => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (article.title || '').toLowerCase().includes(searchLower) ||
      (article.category || '').toLowerCase().includes(searchLower) ||
      (article.status || '').toLowerCase().includes(searchLower)
    );
  });

  const handleOpenModal = async (type: 'add' | 'edit' | 'delete' | 'helpful_list' | 'not_helpful_list', item: Article | null = null) => {
    setModalType(type);
    setSelectedItem(item);
    setValidationError('');
    
    if (['helpful_list', 'not_helpful_list'].includes(type) && item?.id) {
      setIsFeedbackLoading(true);
      try {
        const feedback = await getArticleFeedback(item.id);
        const filtered = feedback.filter((f: any) => type === 'helpful_list' ? f.isHelpful : !f.isHelpful);
        setFeedbackList(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFeedbackLoading(false);
      }
    }

    if (type === 'edit' && item) {
      setFormData({
        ...defaultFormData,
        ...item
      });
    } else if (type === 'add') {
      setFormData(defaultFormData);
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Article, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSolutionChange = (index: number, value: string) => {
    const newSolutions = [...(formData.solutions || [])];
    newSolutions[index] = value;
    handleInputChange('solutions', newSolutions);
  };

  const addSolution = () => {
    if ((formData.solutions?.length || 0) < 10) {
      handleInputChange('solutions', [...(formData.solutions || []), '']);
    }
  };

  const removeSolution = (index: number) => {
    const newSolutions = (formData.solutions || []).filter((_, i) => i !== index);
    handleInputChange('solutions', newSolutions);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit to 2MB to prevent Payload Too Large errors
      if (file.size > 2 * 1024 * 1024) {
        setValidationError('Ukuran gambar terlalu besar. Maksimal 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(field, reader.result as string);
        setValidationError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const requiredFields: (keyof Article)[] = [
      'title', 'category', 'readTime', 'badge', 'stepTitle', 
      'problem', 'cause', 'expertTips', 'thumbnail'
    ];
    
    const isComplete = requiredFields.every(field => {
      const val = formData[field];
      return val !== undefined && val !== null && val !== '';
    });

    const solutionsNotEmpty = (formData.solutions || []).length > 0 && 
                             (formData.solutions || []).every(s => s.trim() !== '');

    if (!isComplete || !solutionsNotEmpty) {
      setValidationError('Mohon lengkapi seluruh isi form yang bertanda bintang (*)');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const dataToSave: any = {
        title: formData.title!,
        category: formData.category!,
        status: formData.status!,
        author: formData.author!,
        readTime: formData.readTime!,
        badge: formData.badge!,
        stepTitle: formData.stepTitle!,
        problem: formData.problem!,
        cause: formData.cause!,
        solutions: formData.solutions!,
        expertTips: formData.expertTips!,
        thumbnail: formData.thumbnail || '',
        content: formData.content || formData.problem || '',
        // Preserve data if editing
        ...(modalType === 'edit' && selectedItem ? { 
          views: selectedItem.views || 0,
          helpful: selectedItem.helpful || 0,
          notHelpful: selectedItem.notHelpful || 0,
          feedbackSessions: selectedItem.feedbackSessions || [],
          savedBy: selectedItem.savedBy || []
        } : {
          views: 0,
          helpful: 0,
          notHelpful: 0,
          feedbackSessions: [],
          savedBy: []
        })
      };

      if (modalType === 'add') {
        await createArticle(dataToSave);
      } else if (modalType === 'edit' && selectedItem?.id) {
        await updateArticle(selectedItem.id, dataToSave);
      }
      setIsModalOpen(false);
      fetchArticles();
    } catch (err) {
      console.error(err);
      setValidationError('Gagal menyimpan artikel. Pastikan koneksi terhubung.');
    }
  };

  const handleDelete = async () => {
    if (selectedItem?.id) {
      try {
        await deleteArticle(selectedItem.id);
        setIsModalOpen(false);
        fetchArticles();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getCategoryColor = (cat: string) => {
    const cats: Record<string, string> = {
      'Masalah Tanah': 'text-amber-500 bg-amber-500/10',
      'Masalah Penanaman': 'text-green-500 bg-green-500/10',
      'Masalah Hama': 'text-red-500 bg-red-500/10',
      'Masalah Panen': 'text-orange-500 bg-orange-500/10',
      'Masalah Penyimpanan': 'text-blue-500 bg-blue-500/10',
      'Masalah Usaha/Produk': 'text-purple-500 bg-purple-500/10',
    };
    return cats[cat] || 'text-gray-500 bg-gray-500/10';
  };

  return (
    <>
      <div className={`border rounded-2xl md:rounded-[40px] p-4 md:p-6 lg:p-8 shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-5 mb-6 md:mb-8">
          <div className="min-w-0">
            <h3 className={`font-serif font-semibold text-xl md:text-2xl mb-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Edukasi & Solusi</h3>
            <p className={`text-xs font-medium transition-colors line-clamp-1 ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>Kelola konten edukasi dan panduan solusi sorghum secara mendalam.</p>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
            <div className={`border rounded-xl px-4 py-2 flex items-center gap-3 transition-colors flex-1 min-w-0 sm:min-w-[240px] ${isDarkMode ? 'bg-white/5 border-white/5 focus-within:border-brand-accent/50' : 'bg-gray-50 border-gray-200 shadow-sm focus-within:border-brand-primary/50'}`}>
              <Search className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`} />
              <input 
                type="text" 
                placeholder="Cari artikel..." 
                className={`bg-transparent text-xs outline-none w-full min-w-0 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900 placeholder:text-gray-400'}`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="button"
              onClick={() => handleOpenModal('add')}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 w-full sm:w-auto active:scale-95 ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight' : 'bg-brand-primary text-white hover:opacity-90'}`}
            >
              <Plus className="w-4 h-4" /> <span className="whitespace-nowrap">Tambah Artikel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b transition-colors ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
                <th className={`pb-4 text-[10px] font-black uppercase tracking-widest pl-4 transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>Artikel</th>
                <th className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>Kategori</th>
                <th className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500 text-center'} text-center`}>Helpful 👍</th>
                <th className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500 text-center'} text-center`}>Not Helpful 👎</th>
                <th className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>Status</th>
                <th className={`pb-4 text-[10px] font-black uppercase tracking-widest text-right pr-4 transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-brand-accent' : 'text-brand-primary'}`} />
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Memuat Data...</p>
                  </td>
                </tr>
              ) : (filteredArticles || []).map((item) => (
                <tr key={item.id} className={`group transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'}`}>
                  <td className="py-5 pl-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 transition-colors ${isDarkMode ? 'bg-white/5 text-brand-accent' : 'bg-gray-100 text-brand-primary'}`}>
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[240px]">
                        <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                        <p className={`text-[10px] font-medium transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>
                          {item.views || 0} Views • {item.readTime}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getCategoryColor(item.category)}`}>
                      {(item.category || '').split(' ').pop()}
                    </span>
                  </td>
                  <td className="py-5 text-center">
                      <button 
                        type="button"
                        onClick={() => handleOpenModal('helpful_list', item)}
                        className={`inline-flex items-center gap-1.5 group/fb transition-colors px-3 py-1 rounded-full ${isDarkMode ? 'hover:bg-brand-accent/10 hover:text-brand-accent' : 'hover:bg-brand-primary/10 hover:text-brand-primary'}`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${isDarkMode ? 'text-white/20 group-hover/fb:text-brand-accent' : 'text-gray-500 group-hover/fb:text-brand-primary'}`} />
                        <span className={`text-[10px] font-black ${isDarkMode ? 'text-white/60 group-hover/fb:text-brand-accent' : 'text-gray-700 group-hover/fb:text-brand-primary'}`}>{item.helpful}</span>
                      </button>
                  </td>
                  <td className="py-5 text-center">
                      <button 
                        type="button"
                        onClick={() => handleOpenModal('not_helpful_list', item)}
                        className={`inline-flex items-center gap-1.5 group/fb transition-colors px-3 py-1 rounded-full ${isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} hover:text-red-500`}
                      >
                        <ThumbsDown className={`w-3 h-3 ${isDarkMode ? 'text-white/20 group-hover/fb:text-red-500' : 'text-gray-500 group-hover/fb:text-red-500'}`} />
                        <span className={`text-[10px] font-black ${isDarkMode ? 'text-white/60 group-hover/fb:text-red-500' : 'text-gray-700 group-hover/fb:text-red-500'}`}>{item.notHelpful}</span>
                      </button>
                  </td>
                  <td className="py-5">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      item.status === 'Published' ? 'bg-green-500/10 text-green-500' : (isDarkMode ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-500')
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-5 pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => handleOpenModal('edit', item)}
                        className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-white/20 hover:text-brand-accent hover:bg-brand-accent/5' : 'text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5'}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                         type="button"
                         onClick={() => handleOpenModal('delete', item)}
                         className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-white/20 hover:text-red-500 hover:bg-red-500/5' : 'text-gray-500 hover:text-red-500 hover:bg-red-500/5'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD & FEEDBACK MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isDarkMode={isDarkMode}
        title={
          modalType === 'add' ? 'Tambah Artikel Baru' : 
          modalType === 'edit' ? 'Edit Artikel' : 
          modalType === 'delete' ? 'Hapus Artikel' :
          modalType === 'helpful_list' ? 'Membantu 👍' : 'Tidak Membantu 👎'
        }
        size={['add', 'edit'].includes(modalType) ? 'md:max-w-[700px] sm:max-w-[600px] w-[95%]' : 'max-w-[400px]'}
      >
        {modalType === 'delete' ? (
          <div className="space-y-6">
            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              Apakah Anda yakin ingin menghapus artikel <span className="font-bold text-red-500">"{selectedItem?.title}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/5">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Batal
              </button>
              <button type="button" onClick={handleDelete} className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                Hapus
              </button>
            </div>
          </div>
        ) : ['helpful_list', 'not_helpful_list'].includes(modalType) ? (
          <div className="space-y-4">
            <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>Daftar Pengguna ({modalType === 'helpful_list' ? selectedItem?.helpful : selectedItem?.notHelpful})</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {isFeedbackLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
                </div>
              ) : (feedbackList || []).map((feedback, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-900 shadow-sm'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isDarkMode ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'}`}>
                    {(feedback.userEmail || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold">{feedback.userEmail || 'Anonymous'}</span>
                    <span className={`text-[9px] font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                      {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'Baru saja'}
                    </span>
                  </div>
                </div>
              ))}
              {!isFeedbackLoading && (feedbackList || []).length === 0 && (
                <p className={`text-center py-8 text-xs italic ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>Belum ada feedback.</p>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            {/* Form Content Only */}
            <div className="space-y-8 pb-4">
              {/* Section 1: Informasi Dasar */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-1 h-4 rounded-full ${isDarkMode ? 'bg-brand-accent' : 'bg-brand-primary'}`} />
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SECTION 1 — Informasi Dasar</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="sm:col-span-2">
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Judul Artikel <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-primary/50 shadow-sm placeholder:text-gray-400'} ${validationError && !formData.title ? 'border-red-500' : ''}`}
                      placeholder="Contoh: Cara Menanam Sorgum yang Benar"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Kategori <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.category || 'Masalah Tanah'}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-primary/50 shadow-sm'}`}
                    >
                      <option value="Masalah Tanah">Masalah Tanah</option>
                      <option value="Masalah Penanaman">Masalah Penanaman</option>
                      <option value="Masalah Hama">Masalah Hama</option>
                      <option value="Masalah Panen">Masalah Panen</option>
                      <option value="Masalah Penyimpanan">Masalah Penyimpanan</option>
                      <option value="Masalah Usaha/Produk">Masalah Usaha/Produk</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Status <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.status || 'Draft'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'}`}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Estimasi Waktu Baca <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.readTime || ''}
                      onChange={(e) => handleInputChange('readTime', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'} ${validationError && !formData.readTime ? 'border-red-500' : ''}`}
                      placeholder="5 Menit"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Badge / Label <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.badge || ''}
                      onChange={(e) => handleInputChange('badge', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'} ${validationError && !formData.badge ? 'border-red-500' : ''}`}
                      placeholder="Solusi Kilat"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Detail Artikel */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-1 h-4 rounded-full ${isDarkMode ? 'bg-brand-accent' : 'bg-brand-primary'}`} />
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SECTION 2 — Detail Artikel</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Judul Langkah <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.stepTitle || ''}
                      onChange={(e) => handleInputChange('stepTitle', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'} ${validationError && !formData.stepTitle ? 'border-red-500' : ''}`}
                      placeholder="4 Langkah Penyelamatan"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Masalah <span className="text-red-500">*</span></label>
                    <textarea 
                      value={formData.problem || ''}
                      onChange={(e) => handleInputChange('problem', e.target.value)}
                      rows={2}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'} ${validationError && !formData.problem ? 'border-red-500' : ''}`}
                      placeholder="Deskripsikan masalah utama"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Penyebab <span className="text-red-500">*</span></label>
                    <textarea 
                      value={formData.cause || ''}
                      onChange={(e) => handleInputChange('cause', e.target.value)}
                      rows={2}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'} ${validationError && !formData.cause ? 'border-red-500' : ''}`}
                      placeholder="Apa penyebab masalah tersebut?"
                    />
                  </div>
                  
                  {/* Dynamic Solutions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className={`block text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Solusi Langkah-demi-Langkah <span className="text-red-500">*</span></label>
                      <button 
                        type="button"
                        onClick={addSolution}
                        disabled={(formData.solutions?.length || 0) >= 10}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${(formData.solutions?.length || 0) >= 10 ? 'opacity-50 cursor-not-allowed' : (isDarkMode ? 'bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20' : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20')}`}
                      >
                        <Plus className="w-3 h-3" /> Tambah Langkah
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {(formData.solutions || []).map((sol, index) => (
                        <div key={index} className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-400'}`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <input 
                              type="text" 
                              value={sol || ''}
                              onChange={(e) => handleSolutionChange(index, e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'} ${validationError && !sol ? 'border-red-500' : ''}`}
                              placeholder={`Langkah ke-${index + 1}...`}
                            />
                          </div>
                          {formData.solutions && (formData.solutions?.length || 0) > 2 && (
                            <button 
                              type="button"
                              onClick={() => removeSolution(index)}
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Tips Ahli <span className="text-red-500">*</span></label>
                    <textarea 
                      value={formData.expertTips || ''}
                      onChange={(e) => handleInputChange('expertTips', e.target.value)}
                      rows={2}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'} ${validationError && !formData.expertTips ? 'border-red-500' : ''}`}
                      placeholder="Tips tambahan dari pakar"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Media */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-1 h-4 rounded-full ${isDarkMode ? 'bg-brand-accent' : 'bg-brand-primary'}`} />
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SECTION 3 — Media Thumbnail</h4>
                </div>
                
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Upload Thumbnail Artikel <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-4">
                    <div className={`relative flex-1 group/upload cursor-pointer border-2 border-dashed rounded-2xl p-4 transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-brand-accent/50' : 'bg-gray-50 border-gray-100 hover:border-brand-primary/50'} ${validationError && !formData.thumbnail ? 'border-red-500' : ''}`}>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => handleFileUpload(e, 'thumbnail')}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <ImageIcon className={`w-8 h-8 ${isDarkMode ? 'text-white/10 group-hover/upload:text-brand-accent' : 'text-gray-300 group-hover/upload:text-brand-primary'}`} />
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20 group-hover/upload:text-brand-accent' : 'text-gray-400 group-hover/upload:text-brand-primary'}`}>Klik untuk Upload Thumbnail</p>
                      </div>
                    </div>
                    {formData.thumbnail && (
                      <div className="relative group/thumb">
                        <div className={`w-32 h-24 rounded-2xl overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                          <img src={formData.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleInputChange('thumbnail', '')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover/thumb:scale-100 transition-transform"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {validationError && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-pulse bg-red-500/10 border-red-500/20`}>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest">{validationError}</p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end pt-8 border-t border-white/5 gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Batal
                </button>
                <button type="submit" className={`w-full sm:w-auto px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-accent/10 active:scale-95 ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-lg shadow-brand-accent/20' : 'bg-brand-primary text-white hover:opacity-90 shadow-lg shadow-brand-primary/20'}`}>
                  {modalType === 'add' ? 'Simpan' : 'Update'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default EducationTable;
