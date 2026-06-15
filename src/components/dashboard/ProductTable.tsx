import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Eye, 
  Clock, 
  ChevronRight, 
  PlusCircle, 
  MinusCircle, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  MessageSquare,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Modal from './Modal';
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getAllProductFeedback, 
  updateFeedbackStatus as updateFeedbackStatusService,
  Product as ProductType,
  ProductFeedback
} from '../../services/dataService';
import { toast } from 'sonner';

interface ProductTableProps {
  isDarkMode?: boolean;
}

const ProductTable: React.FC<ProductTableProps> = ({ isDarkMode = true }) => {
  const [activeSubTab, setActiveSubTab] = useState<'produk' | 'masukan'>(() => {
    return (localStorage.getItem('activeSubProductTab') as 'produk' | 'masukan') || 'produk';
  });
  const [activeCategory, setActiveCategory] = useState('Semua Produk');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(() => {
    return localStorage.getItem('isProductModalOpen') === 'true';
  });
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete' | 'preview'>(() => {
    return (localStorage.getItem('productModalType') as any) || 'add';
  });
  const [selectedItem, setSelectedItem] = useState<ProductType | null>(() => {
    const saved = localStorage.getItem('selectedProduct');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('activeSubProductTab', activeSubTab);
  }, [activeSubTab]);

  useEffect(() => {
    localStorage.setItem('isProductModalOpen', isModalOpen.toString());
  }, [isModalOpen]);

  useEffect(() => {
    localStorage.setItem('productModalType', modalType);
  }, [modalType]);

  useEffect(() => {
    if (selectedItem) {
      localStorage.setItem('selectedProduct', JSON.stringify(selectedItem));
    } else {
      localStorage.removeItem('selectedProduct');
    }
  }, [selectedItem]);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('Semua');
  const [isLoading, setIsLoading] = useState(false);

  // Pagination states
  const [productPage, setProductPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const itemsPerPage = 10;

  const [products, setProducts] = useState<ProductType[]>([]);
  const [feedbacks, setFeedbacks] = useState<ProductFeedback[]>([]);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const [productsData, feedbackData] = await Promise.all([
        getAllProducts(),
        getAllProductFeedback()
      ]);
      setProducts(productsData);
      setFeedbacks(feedbackData);
    } catch (err) {
      if (!isBackground) toast.error('Gagal mengambil data');
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    'Semua Produk',
    'Tepung Sorgum',
    'Makanan Olahan',
    'Sereal & Snack',
    'Minuman Sorgum',
    'Packaging Produk'
  ];

  const initialForm: Partial<ProductType> = {
    title: '',
    category: 'Tepung Sorgum',
    status: 'Draft',
    description: '',
    readTime: '',
    level: 'Pemula',
    tocTitle: '',
    steps: [
      { id: '1', title: '', content: '' },
      { id: '2', title: '', content: '' }
    ],
    tips: '',
    image: '',
    views: 0,
    author: 'Admin'
  };

  const [formData, setFormData] = useState<Partial<ProductType>>(initialForm);
  const [validationError, setValidationError] = useState('');

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchesCategory = activeCategory === 'Semua Produk' || p.category === activeCategory;
      const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.status || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * itemsPerPage;
    return (filteredProducts || []).slice(start, start + itemsPerPage);
  }, [filteredProducts, productPage]);

  const filteredFeedbacks = useMemo(() => {
    return (feedbacks || []).filter(f => {
      const searchLower = feedbackSearch.toLowerCase();
      const matchesSearch = (f.senderName || '').toLowerCase().includes(searchLower) || 
                            (f.productTitle || '').toLowerCase().includes(searchLower) ||
                            (f.message || '').toLowerCase().includes(searchLower);
      const matchesFilter = feedbackFilter === 'Semua' || f.status === feedbackFilter;
      return matchesSearch && matchesFilter;
    });
  }, [feedbacks, feedbackSearch, feedbackFilter]);

  const paginatedFeedbacks = useMemo(() => {
    const start = (feedbackPage - 1) * itemsPerPage;
    return (filteredFeedbacks || []).slice(start, start + itemsPerPage);
  }, [filteredFeedbacks, feedbackPage]);

  const handleOpenModal = (type: 'add' | 'edit' | 'delete' | 'preview', item: ProductType | null = null) => {
    setModalType(type);
    setSelectedItem(item);
    setValidationError('');
    if ((type === 'edit' || type === 'preview') && item) {
      setFormData({ 
        ...initialForm,
        ...item,
        steps: item.steps || [...(initialForm.steps || [])]
      });
    } else {
      setFormData({ ...initialForm });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof ProductType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (index: number, field: 'title' | 'content', value: string) => {
    const newSteps = [...(formData.steps || [])];
    if (!newSteps[index]) return;
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    const currentSteps = formData.steps || [];
    if (currentSteps.length < 10) {
      setFormData(prev => ({
        ...prev,
        steps: [...(prev.steps || []), { id: Math.random().toString(36).substr(2, 9), title: '', content: '' }]
      }));
    }
  };

  const removeStep = (index: number) => {
    const currentSteps = formData.steps || [];
    if (currentSteps.length > 1) {
      const newSteps = [...currentSteps];
      newSteps.splice(index, 1);
      setFormData(prev => ({ ...prev, steps: newSteps }));
    }
  };

  const validateForm = () => {
    const currentSteps = formData.steps || [];
    // Requirement: Ensure everything is filled before publishing or saving
    const isEmpty = !formData.title || !formData.description || !formData.readTime || !formData.tocTitle || !formData.tips || !formData.image;
    const stepsIncomplete = currentSteps.length === 0 || currentSteps.some(s => !s.title || !s.content);
    
    if (isEmpty || stepsIncomplete) {
      setValidationError('Semua kolom (Judul, Deskripsi, Waktu, Daftar Isi, Tips, Media, & Langkah) wajib diisi lengkap');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (modalType === 'add') {
        const createdProduct = await createProduct(formData);
        setProducts([createdProduct, ...products]);
        toast.success('Produk berhasil ditambahkan');
      } else if (selectedItem?.id) {
        await updateProduct(selectedItem.id, formData);
        setProducts(products.map(p => p.id === selectedItem.id ? { ...formData, id: selectedItem.id } : p));
        toast.success('Produk berhasil diperbarui');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Gagal menyimpan produk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedItem?.id) {
      setIsLoading(true);
      try {
        await deleteProduct(selectedItem.id);
        setProducts(products.filter(p => p.id !== selectedItem.id));
        toast.success('Produk berhasil dihapus');
        setIsModalOpen(false);
      } catch (err) {
        toast.error('Gagal menghapus produk');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const [selectedFeedback, setSelectedFeedback] = useState<ProductFeedback | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const viewFeedbackDetails = (feedback: ProductFeedback) => {
    setSelectedFeedback(feedback);
    setIsFeedbackModalOpen(true);
  };

  const updateFeedbackStatus = async (id: string, newStatus: ProductFeedback['status']) => {
    try {
      await updateFeedbackStatusService(id, newStatus);
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: newStatus } : f));
      if (selectedFeedback && selectedFeedback.id === id) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus });
      }
      toast.success('Status masukan diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui status');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('image', reader.result as string);
        handleInputChange('thumbnail', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className={`p-1 rounded-[24px] flex flex-wrap md:flex-nowrap w-fit transition-all overflow-x-auto no-scrollbar gap-1 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
        <button
          type="button"
          onClick={() => setActiveSubTab('produk')}
          className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-sm ${
            activeSubTab === 'produk'
              ? (isDarkMode ? 'bg-brand-accent text-black shadow-brand-accent/10' : 'bg-brand-primary text-white shadow-brand-primary/10')
              : (isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white')
          }`}
        >
          Pengelolaan
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('masukan')}
          className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-sm ${
            activeSubTab === 'masukan'
              ? (isDarkMode ? 'bg-brand-accent text-black shadow-brand-accent/10' : 'bg-brand-primary text-white shadow-brand-primary/10')
              : (isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white')
          }`}
        >
          Masukan Pengguna
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'produk' ? (
          <motion.div 
            key="produk-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`border rounded-2xl md:rounded-[40px] p-4 md:p-6 lg:p-8 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/40'}`}
          >
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
              <div className="flex-1 min-w-0">
                <h3 className={`font-serif font-bold text-2xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Daftar Produk Sorgum</h3>
                <p className={`text-xs font-medium transition-colors ${isDarkMode ? 'text-white/40' : 'text-gray-500'} truncate`}>Kelola edukasi, panduan giling, dan variasi olahan produk.</p>
              </div>
              
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
                <div className={`border rounded-2xl px-4 py-2.5 flex items-center gap-3 transition-all flex-1 min-w-0 sm:min-w-[240px] ${isDarkMode ? 'bg-white/5 border-white/5 focus-within:border-brand-accent/50 group' : 'bg-gray-50 border-gray-200 focus-within:border-brand-primary/50 shadow-xs'}`}>
                  <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-brand-accent' : 'text-gray-400 group-focus-within:text-brand-primary'}`} />
                  <input 
                    type="text" 
                    placeholder="Cari produk..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setProductPage(1);
                    }}
                    className={`bg-transparent text-xs font-bold outline-none w-full transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900 placeholder:text-gray-400'}`} 
                  />
                </div>

                <div className={`border rounded-2xl px-4 py-2.5 flex items-center gap-3 transition-colors flex-shrink-0 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200 shadow-xs'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Kategori:</span>
                  <select 
                    value={activeCategory}
                    onChange={(e) => {
                      setActiveCategory(e.target.value);
                      setProductPage(1);
                    }}
                    className={`bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer ${isDarkMode ? 'text-white/60' : 'text-gray-900'}`}
                  >
                    {categories.map(cat => <option key={cat} value={cat} className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>{cat}</option>)}
                  </select>
                </div>

                <button 
                  type="button"
                  onClick={() => handleOpenModal('add')}
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap w-full sm:w-auto ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-brand-accent/20' : 'bg-brand-primary text-white hover:opacity-90 shadow-brand-primary/20'}`}
                >
                  <Plus className="w-4 h-4 flex-shrink-0" /> <span className="sm:inline">Tambah</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className={`border-b transition-colors ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest pl-4 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Judul Produk</th>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Kategori</th>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Status</th>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Views</th>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest text-right pr-4 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-white/5' : 'divide-gray-50'}`}>
                  {paginatedProducts.map((item) => (
                    <tr key={item.id} className={`group transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'}`}>
                      <td className="py-5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl overflow-hidden border transition-all ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50 shadow-xs'}`}>
                            {item.thumbnail || item.image ? (
                              <img src={item.thumbnail || item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className={`w-5 h-5 mx-auto mt-3.5 transition-colors ${isDarkMode ? 'opacity-20 text-white' : 'opacity-20 text-black'}`} />
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>{item.level}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                         <span className={`text-xs font-bold ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>{item.category}</span>
                      </td>
                      <td className="py-5">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          item.status === 'Published' 
                           ? (isDarkMode ? 'bg-brand-accent/20 border-brand-accent/40 text-brand-accent' : 'bg-brand-primary/20 border-brand-primary/40 text-brand-primary shadow-xs') 
                           : (isDarkMode ? 'bg-white/10 border-white/20 text-white/50' : 'bg-gray-100 border-gray-200 text-gray-500 shadow-xs')
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-5">
                         <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                           <span className="font-black">{item.views || 0}</span>
                         </div>
                      </td>
                      <td className="py-5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => handleOpenModal('preview', item)}
                            title="Preview"
                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 shadow-xs'}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                           <button 
                            type="button"
                            onClick={() => handleOpenModal('edit', item)}
                            title="Edit"
                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:text-brand-accent hover:bg-brand-accent/10' : 'bg-gray-50 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 border border-transparent hover:border-brand-primary/20 shadow-xs'}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenModal('delete', item)}
                            title="Hapus"
                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10' : 'bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-500/20 shadow-xs'}`}
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

            {/* Pagination Products */}
            <div className="mt-8 flex items-center justify-between">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
                Menampilkan {(paginatedProducts || []).length} dari {(filteredProducts || []).length} produk
              </p>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                  disabled={productPage === 1}
                  className={`p-2 rounded-xl transition-all disabled:opacity-20 ${isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                {Array.from({ length: Math.ceil((filteredProducts?.length || 0) / itemsPerPage) }).map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setProductPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                      productPage === i + 1
                        ? (isDarkMode ? 'bg-brand-accent text-black' : 'bg-brand-primary text-white')
                        : (isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100')
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  type="button"
                  onClick={() => setProductPage(prev => Math.min(Math.ceil((filteredProducts?.length || 0) / itemsPerPage), prev + 1))}
                  disabled={productPage === Math.ceil((filteredProducts?.length || 0) / itemsPerPage)}
                  className={`p-2 rounded-xl transition-all disabled:opacity-20 ${isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="masukan-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`border rounded-2xl md:rounded-[40px] p-4 md:p-6 lg:p-8 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-sm shadow-gray-200/50'}`}
          >
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
              <div className="flex-1 min-w-0">
                <h3 className={`font-serif font-bold text-2xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Masukan Pengguna</h3>
                <p className={`text-xs font-medium transition-colors ${isDarkMode ? 'text-white/40' : 'text-gray-500'} truncate`}>Pantau feedback user dari tombol "Beri Masukan" di aplikasi.</p>
              </div>
              
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
                <div className={`border rounded-2xl px-4 py-2.5 flex items-center gap-3 transition-all flex-1 min-w-0 sm:min-w-[200px] ${isDarkMode ? 'bg-white/5 border-white/5 focus-within:border-brand-accent/50 group' : 'bg-gray-50 border-gray-200 focus-within:border-brand-primary/50 shadow-xs'}`}>
                  <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-brand-accent' : 'text-gray-400 group-focus-within:text-brand-primary'}`} />
                  <input 
                    type="text" 
                    placeholder="Cari masukan..." 
                    value={feedbackSearch}
                    onChange={(e) => {
                      setFeedbackSearch(e.target.value);
                      setFeedbackPage(1);
                    }}
                    className={`bg-transparent text-xs font-bold outline-none w-full transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900 placeholder:text-gray-400'}`} 
                  />
                </div>
                <div className={`border rounded-2xl px-4 py-2.5 flex items-center gap-3 transition-colors w-full sm:w-auto flex-shrink-0 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200 shadow-xs'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Filter Status:</span>
                  <select 
                    value={feedbackFilter}
                    onChange={(e) => {
                      setFeedbackFilter(e.target.value);
                      setFeedbackPage(1);
                    }}
                    className={`bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer ${isDarkMode ? 'text-white/60' : 'text-gray-700'}`}
                  >
                    <option value="Semua" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Semua</option>
                    <option value="BARU" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Baru</option>
                    <option value="DITINJAU" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Ditinjau</option>
                    <option value="SELESAI" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>Selesai</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className={`border-b transition-colors ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest pl-4 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Pengirim</th>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Produk/Artikel</th>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Tanggal</th>
                    <th className={`pb-4 text-[10px] font-black uppercase tracking-widest text-right pr-4 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Status & Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-white/5' : 'divide-gray-50'}`}>
                  {(paginatedFeedbacks || []).map((f) => (
                    <tr key={f.id} className={`group transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'}`}>
                      <td className="py-5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-brand-accent' : 'bg-gray-100 text-brand-primary shadow-xs'}`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{f.senderName}</span>
                            <span className={`text-[9px] ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>{f.senderEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{f.productTitle}</span>
                      </td>
                      <td className="py-5">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                          {f.created_at ? new Date(f.created_at).toLocaleDateString('id-ID') : '-'}
                        </span>
                      </td>
                      <td className="py-5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            type="button"
                            onClick={() => viewFeedbackDetails(f)}
                            className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100 shadow-xs border border-transparent hover:border-gray-200'}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <select 
                            value={f.status}
                            disabled={f.status === 'SELESAI'}
                            onChange={(e) => updateFeedbackStatus(f.id!, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all outline-none ${
                              f.status === 'BARU' ? (isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600') :
                              f.status === 'DITINJAU' ? (isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-600') :
                              (isDarkMode ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent' : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary')
                            } ${f.status === 'SELESAI' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          >
                            <option value="BARU" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>BARU</option>
                            <option value="DITINJAU" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>DITINJAU</option>
                            <option value="SELESAI" className={isDarkMode ? 'bg-[#111814]' : 'bg-white'}>SELESAI</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Feedbacks */}
            <div className="mt-8 flex items-center justify-between">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
                Menampilkan {(paginatedFeedbacks || []).length} dari {(filteredFeedbacks || []).length} masukan
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFeedbackPage(prev => Math.max(1, prev - 1))}
                  disabled={feedbackPage === 1}
                  className={`p-2 rounded-xl transition-all disabled:opacity-20 ${isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                {Array.from({ length: Math.ceil((filteredFeedbacks?.length || 0) / itemsPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFeedbackPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                      feedbackPage === i + 1
                        ? (isDarkMode ? 'bg-brand-accent text-black' : 'bg-brand-primary text-white')
                        : (isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100')
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setFeedbackPage(prev => Math.min(Math.ceil((filteredFeedbacks?.length || 0) / itemsPerPage), prev + 1))}
                  disabled={feedbackPage === Math.ceil((filteredFeedbacks?.length || 0) / itemsPerPage)}
                  className={`p-2 rounded-xl transition-all disabled:opacity-20 ${isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isDarkMode={isDarkMode}
        size={modalType === 'delete' ? 'max-w-[400px]' : (modalType === 'preview' ? 'md:w-[70%] md:max-w-[900px] md:min-w-[600px] w-[92%]' : 'max-w-[700px]')}
        title={
          modalType === 'add' ? 'Tambah Panduan Pengelolaan' : 
          modalType === 'edit' ? 'Edit Konten Pengelolaan' : 
          modalType === 'delete' ? 'Hapus Data' : 
          'Detail Produk & Panduan'
        }
      >
        {modalType === 'delete' ? (
          <div className="space-y-6">
            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              Hapus panduan <span className="font-bold text-red-500">"{selectedItem?.title}"</span>? Data tidak dapat dikembalikan.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/5">
              <button type="button" onClick={() => setIsModalOpen(false)} className={`w-full sm:w-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-500'}`}>Batal</button>
              <button type="button" onClick={handleDelete} className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animation-all active:scale-95">Hapus Permanen</button>
            </div>
          </div>
        ) : modalType === 'preview' ? (
          <div className="space-y-8 pb-4">
            {/* Header Content */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'}`}>
                  {formData.category}
                </span>
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                   <Clock className="w-3.5 h-3.5" /> {formData.readTime || '0 menit'}
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                   {formData.views || '0'} Views
                </div>
              </div>
              <h2 className={`text-2xl md:text-3xl font-serif font-bold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formData.title || 'Untitled Product'}
              </h2>
            </div>

            {/* Media - Proportional */}
            <div className={`aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl overflow-hidden border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
              {formData.image ? (
                <img src={formData.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10">
                  <ImageIcon className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="space-y-8">
              {/* Description & Level */}
              <div className="space-y-4">
                 <p className={`text-base leading-relaxed font-medium italic ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                   "{formData.description || 'Tidak ada deskripsi.'}"
                 </p>
                 <div className="flex items-center gap-4">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Tingkat Kesulitan:</span>
                   <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isDarkMode ? 'bg-white/5 border-white/10 text-brand-accent' : 'bg-white border-gray-100 text-brand-primary'}`}>
                     {formData.level}
                   </span>
                 </div>
              </div>

              {/* Steps Panduan */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-brand-accent rounded-full" />
                  <h3 className={`text-lg font-serif font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formData.tocTitle || 'Panduan Pengolahan'}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(formData.steps || []).map((step, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-brand-accent/30' : 'bg-white border-gray-100 hover:border-brand-primary/20 shadow-sm'}`}>
                      <div className="flex items-start gap-4">
                        <span className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-black transition-all ${isDarkMode ? 'bg-brand-accent text-black' : 'bg-brand-primary text-white'}`}>
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {step.title || `Langkah ${idx + 1}`}
                          </h4>
                          <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                            {step.content || 'Isi langkah belum diisi.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips Section */}
              <div className={`p-6 md:p-8 rounded-[32px] border border-dashed transition-all ${isDarkMode ? 'bg-brand-accent/5 border-brand-accent/20' : 'bg-brand-primary/5 border-brand-primary/20'}`}>
                <div className="flex items-center gap-3 mb-4 text-brand-accent">
                  <TrendingUp className="w-5 h-5" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Tips Ahli Produksi</h4>
                </div>
                <p className={`text-sm leading-relaxed font-bold italic ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                  "{formData.tips || 'Tidak ada tips produksi.'}"
                </p>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end pt-6 border-t border-white/5">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className={`w-full sm:w-auto px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isDarkMode ? 'bg-brand-accent text-black shadow-brand-accent/20 hover:bg-brand-highlight' : 'bg-brand-primary text-white shadow-brand-primary/20 hover:opacity-90'}`}
              >
                Tutup Detail
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-10 pb-4">
            {/* SECTION 1 - INFORMASI DASAR */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-brand-accent rounded-full" />
                <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>SECTION 1 — Informasi Dasar</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="col-span-2">
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Judul Produk</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all text-sm font-semibold ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'}`} 
                    placeholder="Contoh: Cookies Sorgum Tidak Mudah Hancur" 
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Kategori</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-bold appearance-none cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                  >
                    {categories.filter(c => c !== 'Semua Produk').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-bold appearance-none cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Deskripsi Singkat</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                    className={`w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-medium resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50'}`}
                    placeholder="Gunakan teknik pencampuran dan pemanggangan yang tepat..."
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Estimasi Waktu Baca</label>
                  <input 
                    type="text" 
                    value={formData.readTime}
                    onChange={(e) => handleInputChange('readTime', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-semibold ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} 
                    placeholder="Contoh: 9 menit" 
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Level Kesulitan</label>
                  <select 
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-bold appearance-none cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                  >
                    <option value="Pemula">Pemula</option>
                    <option value="Menengah">Menengah</option>
                    <option value="Ahli">Ahli</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2 - DETAIL PENGELOLAAN */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-brand-accent rounded-full" />
                <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>SECTION 2 — Detail Pengelolaan</h4>
              </div>
              <div className="space-y-6">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Judul Daftar Isi</label>
                  <input 
                    type="text" 
                    value={formData.tocTitle}
                    onChange={(e) => handleInputChange('tocTitle', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-semibold ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} 
                    placeholder="Contoh: Proses Pengolahan" 
                  />
                </div>
                
                <div className="space-y-4">
                  {(formData.steps || []).map((step, index) => (
                    <div key={step.id} className={`p-6 rounded-[32px] border relative group ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <button 
                        type="button"
                        onClick={() => removeStep(index)}
                        className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white items-center justify-center shadow-lg transition-all scale-0 group-hover:scale-100 ${(formData.steps || []).length > 1 ? 'flex' : 'hidden'}`}
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 gap-4">
                         <div className="flex items-center gap-3">
                           <span className="w-6 h-6 rounded-full bg-brand-accent text-black text-[10px] font-black flex items-center justify-center">L{index + 1}</span>
                           <input 
                            type="text" 
                            value={step.title}
                            onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                            placeholder={`Judul Langkah ${index + 1}`}
                            className={`flex-1 bg-transparent border-b outline-none text-sm font-bold py-1 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
                          />
                         </div>
                         <textarea 
                          value={step.content}
                          onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                          placeholder="Isi langkah detail..."
                          rows={3}
                          className={`w-full bg-transparent outline-none text-sm font-medium resize-none ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}
                        />
                      </div>
                    </div>
                  ))}

                  {formData.steps.length < 10 && (
                    <button 
                      type="button"
                      onClick={addStep}
                      className={`w-full py-4 rounded-[32px] border-2 border-dashed flex items-center justify-center gap-3 transition-all ${isDarkMode ? 'border-white/10 text-white/20 hover:text-brand-accent hover:border-brand-accent/50 hover:bg-brand-accent/5' : 'border-gray-200 text-gray-400 hover:text-brand-primary hover:border-brand-primary/50 hover:bg-brand-primary/5'}`}
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Tambah Langkah Baru</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3 - TIPS PRODUKSI */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-brand-accent rounded-full" />
                <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>SECTION 3 — Tips Produksi</h4>
              </div>
              <textarea 
                value={formData.tips}
                onChange={(e) => handleInputChange('tips', e.target.value)}
                rows={3}
                className={`w-full px-6 py-5 rounded-[32px] border outline-none text-sm font-bold resize-none ${isDarkMode ? 'bg-brand-accent/5 border-brand-accent/20 text-brand-accent' : 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary'}`}
                placeholder="Tips: Selalu gunakan tepung sorgum yang sudah diayak..."
              />
            </div>

            {/* SECTION 4 - MEDIA */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-brand-accent rounded-full" />
                <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>SECTION 4 — Media</h4>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className={`relative border-2 border-dashed rounded-[32px] h-32 flex flex-col items-center justify-center gap-2 group cursor-pointer transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-brand-accent/50' : 'bg-gray-50 border-gray-200 hover:border-brand-primary/50'}`}>
                    <input type="file" id="prod-image-upload" title="Upload Foto" accept="image/jpeg,image/png,image/jpg" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <ImageIcon className={`w-8 h-8 ${isDarkMode ? 'text-white/10 group-hover:text-brand-accent' : 'text-gray-300 group-hover:text-brand-primary'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-20 text-center px-4">Klik untuk pilih foto (Hanya 1 Foto)</span>
                  </div>
                  <div className={`h-32 rounded-[32px] border-4 border-dashed relative overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    {formData.image || formData.thumbnail ? (
                      <>
                        <img src={formData.image || formData.thumbnail} alt="" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => {
                            handleInputChange('image', '');
                            handleInputChange('thumbnail', '');
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-95"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-10">Preview Image</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Feedback */}
            {validationError && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-pulse ${isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-bold">{validationError}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end pt-8 border-t border-white/5 gap-2 md:gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className={`w-full sm:w-auto px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}>Batal</button>
              <button 
                type="submit"
                className={`w-full sm:w-auto px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all ${isDarkMode ? 'bg-brand-accent text-black shadow-brand-accent/20 hover:bg-brand-highlight' : 'bg-brand-primary text-white shadow-brand-primary/20 hover:opacity-90'}`}
              >
                {modalType === 'add' ? 'Terbitkan' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        isDarkMode={isDarkMode}
        title="Detail Masukan Pengguna"
      >
        {selectedFeedback && (
          <div className="space-y-8">
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 text-brand-accent' : 'bg-gray-100 text-brand-primary'}`}>
                  <User className="w-6 h-6" />
                </div>
                <div>
                   <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedFeedback.senderName}</h4>
                   <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
                       {selectedFeedback.created_at ? new Date(selectedFeedback.created_at).toLocaleDateString('id-ID') : '-'}
                    </p>
                </div>
             </div>

             <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-4 text-brand-accent">
                  <Package className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Produk Terkait</span>
                </div>
                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedFeedback.productTitle}</p>
             </div>

             <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-4 text-brand-accent">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Isi Masukan</span>
                </div>
                <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>{selectedFeedback.message}</p>
             </div>

             <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Update Status:</span>
                   <select 
                    value={selectedFeedback.status}
                    disabled={selectedFeedback.status === 'SELESAI'}
                    onChange={(e) => updateFeedbackStatus(selectedFeedback.id!, e.target.value as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all outline-none ${
                      selectedFeedback.status === 'BARU' ? (isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600') :
                      selectedFeedback.status === 'DITINJAU' ? (isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-600') :
                      (isDarkMode ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent' : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary')
                    } ${selectedFeedback.status === 'SELESAI' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                  >
                    <option value="BARU">BARU</option>
                    <option value="DITINJAU">DITINJAU</option>
                    <option value="SELESAI">SELESAI</option>
                  </select>
                </div>
                <button onClick={() => setIsFeedbackModalOpen(false)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg ${isDarkMode ? 'bg-brand-accent text-black shadow-brand-accent/20' : 'bg-brand-primary text-white shadow-brand-primary/20'}`}>Tutup</button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductTable;
