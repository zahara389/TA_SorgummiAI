import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  Search,
  MessageSquare,
  Clock,
  ChevronRight,
  Zap,
  Bot,
  ShoppingCart,
  Leaf,
  Droplets,
  Wind,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  Clipboard,
  Headset,
  Play,
  Mail,
  X,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Sprout,
  Box,
  Save,
  Loader2,
  Eye,
  BookOpen,
  BookmarkCheck
} from 'lucide-react';
import { 
  getAllArticles, 
  incrementArticleViews, 
  recordArticleFeedback, 
  toggleSaveArticle, 
  getUserSavedArticles,
  getUserArticleFeedback,
  Article 
} from '../services/dataService';
import { UserProfile } from '../services/authService';

interface EducationCard {
  id: string;
  category: string;
  title: string;
  description: string;
  duration: string;
  totalMateri: number;
  thumbnail: string;
  content?: string; // Full article content
}

interface PopularTopic {
  id: string;
  title: string;
  reads: string;
  icon: any;
}

// --- Data ---

const CATEGORY_ITEMS = [
  { name: "Semua Masalah", icon: HelpCircle },
  { name: "Masalah Tanah", icon: Leaf },
  { name: "Masalah Penanaman", icon: Sprout },
  { name: "Masalah Hama", icon: ShieldCheck },
  { name: "Masalah Panen", icon: Zap },
  { name: "Masalah Penyimpanan", icon: Box },
  { name: "Masalah Usaha/Produk", icon: TrendingUp },
];

const EDUCATION_CARDS: Article[] = [
  {
    id: '1',
    category: 'Masalah Tanah',
    title: 'Tanah Keras & Tanaman Kerdil',
    description: 'Solusi pemulihan struktur tanah marginal yang keras agar pertumbuhan tanaman kembali optimal.',
    duration: 'Solusi 15 Menit',
    totalMateri: 4,
    thumbnail: 'https://images.unsplash.com/photo-1542382156909-6ae75043819b?q=80&w=2682&auto=format&fit=crop',
    content: `
      <div class="space-y-8">
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Masalah</h3>
          <p class="text-gray-600">Tanah terasa keras saat dicangkul, air sulit meresap, dan tanaman sorgum terlihat kerdil atau daun menguning prematur.</p>
        </section>
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Penyebab</h3>
          <p class="text-gray-600 font-medium">Degradasi bahan organik akibat penggunaan pupuk kimia berlebih dan kurangnya pengembalian sisa panen ke lahan.</p>
        </section>
        <section class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 class="text-lg font-semibold text-brand-primary mb-4">Solusi Langkah-Demi-Langkah</h3>
          <ul class="list-disc pl-5 space-y-3 text-gray-700">
            <li><strong>Aplikasi Organik:</strong> Berikan kompos matang minimal 5-10 ton per hektar sebelum masa tanam.</li>
            <li><strong>Lubang Tanam Berjarak:</strong> Gunakan pola lubang tanam searah kontur untuk menjaga aerasi tanah.</li>
            <li><strong>Aplikasi Agens Hayati:</strong> Gunakan Trichoderma untuk mempercepat dekomposisi bahan organik di tanah.</li>
          </ul>
        </section>
        <section class="p-4 bg-brand-accent/5 rounded-xl border-l-4 border-brand-accent">
          <h3 class="text-md font-semibold text-gray-900 mb-1 leading-none">💡 Tips Ahli</h3>
          <p class="text-gray-600 text-sm italic">Jangan membakar sisa panen! Cukup benamkan di tanah untuk membantu pembentukan humus alami.</p>
        </section>
      </div>
    `
  },
  {
    id: '2',
    category: 'Masalah Hama',
    title: 'Serangan Ulat Grayak Tanpa Henti',
    description: 'Panduan darurat menghentikan populasi ulat grayak yang memakan pucuk daun sorgum dalam semalam.',
    duration: 'Tindakan Cepat',
    totalMateri: 3,
    thumbnail: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2670&auto=format&fit=crop',
    content: `
      <div class="space-y-8">
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Masalah</h3>
          <p class="text-gray-600">Daun sorgum berlubang besar-besar, terutama pada bagian pucuk yang masih muda. Seringkali terlihat kotoran ulat berwarna cokelat di sela-sela daun.</p>
        </section>
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Penyebab</h3>
          <p class="text-gray-600 font-medium">Serangan larva <i>Spodoptera frugiperda</i> yang sangat menyukai kelembaban tinggi dan tanaman yang mendapatkan pupuk N (Urea) berlebih.</p>
        </section>
        <section class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 class="text-lg font-bold text-brand-primary mb-4">Solusi Penyelamatan</h3>
          <ul class="list-disc pl-5 space-y-3 text-gray-700">
            <li><strong>Waktu Semprot:</strong> Pastikan menyemprot HANYA pada sore hari (di atas jam 17:00) saat ulat keluar untuk makan.</li>
            <li><strong>Ramuan Nabati:</strong> Campurkan 5ml minyak mimba + 2ml sabun cair per liter air sebagai perekat dan anti-makan.</li>
            <li><strong>Pembersihan Manual:</strong> Jika serangan masih di skala kecil, ambil ulat secara manual untuk memutus siklus bertelur.</li>
          </ul>
        </section>
        <section class="p-4 bg-gray-50 rounded-xl">
          <h3 class="text-md font-bold text-gray-900 mb-1">💡 Tips Strategis</h3>
          <p class="text-gray-600 text-sm italic">Pasang jebakan lampu di malam hari untuk menarik dan mengumpulkan ngengat dewasa sebelum mereka sempat bertelur.</p>
        </section>
      </div>
    `
  },
  {
    id: '3',
    category: 'Masalah Penyimpanan',
    title: 'Biji Sorgum Apek & Berjamur',
    description: 'Langkah pencegahan kerusakan hasil panen di gudang akibat kelembaban tinggi dan sirkulasi udara buruk.',
    duration: 'Solusi Simpan',
    totalMateri: 5,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
    content: `
      <div class="space-y-8">
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Masalah</h3>
          <p class="text-gray-600">Biji yang disimpan mengeluarkan bau apek, warna kusam, dan muncul serbuk putih (jamur). Hal ini membuat harga jual turun drastis.</p>
        </section>
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Penyebab</h3>
          <p class="text-gray-600 font-medium">Kadar air biji saat disimpan masih di atas 13% atau gudang memiliki kelembaban (RH) di atas 70% tanpa ventilasi.</p>
        </section>
        <section class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 class="text-lg font-semibold text-brand-primary mb-4">Langkah Pengamanan Gudang</h3>
          <ul class="list-disc pl-5 space-y-3 text-gray-700">
            <li><strong>Penjemuran Ekstra:</strong> Pastikan biji dijemur hingga "bunyi gemerincing" saat diaduk (indikasi kadar air rendah).</li>
            <li><strong>Gunakan Palet:</strong> Jangan letakkan karung langsung di atas semen. Gunakan kayu palet minimal tinggi 15cm dari lantai.</li>
            <li><strong>Sirkulasi Udara:</strong> Pasang lubang ventilasi di bagian atas gudang agar udara panas tidak terperangkap.</li>
          </ul>
        </section>
        <section class="p-4 bg-brand-accent/10 rounded-xl">
          <h3 class="text-md font-semibold text-gray-900 mb-1 leading-none">💡 Tips Panen</h3>
          <p class="text-gray-600 text-sm">Gunakan karung plastik jenis hermetik (kedap udara) untuk penyimpanan jangka panjang di atas 3 bulan.</p>
        </section>
      </div>
    `
  },
  {
    id: '4',
    category: 'Masalah Usaha/Produk',
    title: 'Harga Jual Sorgum Rendah',
    description: 'Ide hilirisasi produk sorgum dari biji menjadi tepung atau beras untuk meningkatkan nilai jual di pasar.',
    duration: 'Solusi Bisnis',
    totalMateri: 3,
    thumbnail: 'https://images.unsplash.com/photo-1596558452288-038cbe22c83b?q=80&w=600&auto=format&fit=crop',
    content: `
      <div class="space-y-8">
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Masalah</h3>
          <p class="text-gray-600">Harga biji sorgum mentah di tingkat petani seringkali rendah saat panen raya karena oversupply ke tengkulak.</p>
        </section>
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Penyebab</h3>
          <p class="text-gray-600 font-medium">Petani hanya menjual bahan mentah (commodity) tanpa ada nilai tambah (value-added) atau pengolahan lebih lanjut.</p>
        </section>
        <section class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 class="text-lg font-semibold text-brand-primary mb-4">Solusi Penambahan Nilai</h3>
          <ul class="list-disc pl-5 space-y-3 text-gray-700">
            <li><strong>Sos (Beras) Sorgum:</strong> Lakukan penyosohan biji untuk menghilangkan kulit ari (tanin) yang pahit. Beras sorgum dihargai 2x lipat lebih mahal.</li>
            <li><strong>Tepung Gluten-Free:</strong> Giling biji menjadi tepung. Ini memiliki pasar besar bagi penderita autoimun atau diet sehat.</li>
            <li><strong>Produk Turunan:</strong> Jual limbah batang sorgum sebagai pakan ternak silase atau bahan bio-etanol.</li>
          </ul>
        </section>
        <section class="p-4 bg-gray-50 rounded-xl">
          <h3 class="text-md font-semibold text-gray-900 mb-1 text-brand-primary">💡 Tips Bisnis</h3>
          <p class="text-gray-600 text-sm">Targetkan pasar modern atau retail online dengan kemasan (packaging) yang bersih dan menarik untuk menaikkan citra produk.</p>
        </section>
      </div>
    `
  },
  {
    id: '5',
    category: 'Masalah Panen',
    title: 'Kematangan Biji Tidak Serata',
    description: 'Teknik penyeragaman waktu panen agar seluruh bulir matang bersamaan dan memudahkan operasional lahan.',
    duration: 'Strategi Lahan',
    totalMateri: 4,
    thumbnail: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=2689&auto=format&fit=crop',
    content: `
      <div class="space-y-8">
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Masalah</h3>
          <p class="text-gray-600">Dalam satu lahan, sebagian tanaman sudah siap panen (bulir merah/keras), namun sebagian lagi masih hijau atau baru berbunga. Hal ini menyulitkan pemangkasan massal.</p>
        </section>
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Penyebab</h3>
          <p class="text-gray-600 font-medium">Distribusi nutrisi yang tidak merata, kedalaman tanam benih yang berbeda-beda, atau penggunaan benih yang tidak seragam kelasnya.</p>
        </section>
        <section class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 class="text-lg font-semibold text-brand-primary mb-4">Solusi Penyeragaman</h3>
          <ul class="list-disc pl-5 space-y-3 text-gray-700">
            <li><strong>Kedalaman Tanam:</strong> Pastikan benih ditanam pada kedalaman yang sama (sekitar 3cm).</li>
            <li><strong>Pemupukan P & K:</strong> Fokus pada pemberian Kalium dan Fosfor saat fase primordial (pembentukan bunga) untuk memicu kematangan serentak.</li>
            <li><strong>Ajeksi Air:</strong> Pastikan pengairan merata ke seluruh petakan lahan, tidak ada area yang terlalu becek atau terlalu kering.</li>
          </ul>
        </section>
        <section class="p-4 bg-brand-accent/5 rounded-xl">
          <h3 class="text-md font-semibold text-gray-900 mb-1">💡 Tips Lahan</h3>
          <p class="text-gray-600 text-sm">Lakukan penyulaman benih yang tidak tumbuh maksimal 7 hari setelah tanam agar selisih usianya tidak terlalu jauh.</p>
        </section>
      </div>
    `
  },
  {
    id: '6',
    category: 'Masalah Penanaman',
    title: 'Busuk Akar Saat Musim Hujan',
    description: 'Cara menangani genangan air yang menyebabkan penyakit tular tanah pada akar tanaman sorgum muda.',
    duration: 'Tindakan Lahan',
    totalMateri: 3,
    thumbnail: 'https://images.unsplash.com/photo-1542382156909-6ae75043819b?q=80&w=2682&auto=format&fit=crop',
    content: `
      <div class="space-y-8">
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Masalah</h3>
          <p class="text-gray-600">Pangkal batang tanaman muda berubah warna menjadi kecokelatan, berbau busuk, dan tanaman mudah dicabut karena akarnya sudah hancur.</p>
        </section>
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Penyebab</h3>
          <p class="text-gray-600 font-medium">Drainase lahan yang buruk and curah hujan tinggi yang menyebabkan infeksi jamur <i>Pythium</i> atau <i>Fusarium</i>.</p>
        </section>
        <section class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 class="text-lg font-semibold text-brand-primary mb-4">Solusi Drastis</h3>
          <ul class="list-disc pl-5 space-y-3 text-gray-700">
            <li><strong>Perdalam Saluran:</strong> Segera perdalam parit drainase di sekeliling lahan agar air segera lari.</li>
            <li><strong>Aplikasi Kapur:</strong> Taburkan sedikit kapur dolomit di pangkal batang untuk menaikkan pH tanah dan menekan perkembangan jamur.</li>
            <li><strong>Fungisida Organik:</strong> Semprotkan larutan kunyit atau jahe yang difermentasi sebagai antimikroba alami.</li>
          </ul>
        </section>
        <section class="p-4 bg-gray-50 rounded-xl">
          <h3 class="text-md font-bold text-gray-900 mb-1">💡 Tips Lahan</h3>
          <p class="text-gray-600 text-sm">Gunakan pola tanam guludan (bedengan tinggi) jika menanam di musim hujan agar posisi akar tetap di atas permukaan air.</p>
        </section>
      </div>
    `
  },
  {
    id: '7',
    category: 'Masalah Usaha/Produk',
    title: 'Analisis Keuntungan Tanam Sorgum',
    description: 'Cara menghitung ROI (Return on Investment) budidaya sorgum dibandingkan tanaman palawija lainnya.',
    duration: 'Analisis Profit',
    totalMateri: 4,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
    content: `
      <div class="space-y-8">
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Masalah</h3>
          <p class="text-gray-600">Banyak petani ragu menanam sorgum karena belum paham detail biaya produksi dan potensi keuntungan bersihnya.</p>
        </section>
        <section>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Penyebab</h3>
          <p class="text-gray-600 font-medium">Kurangnya pencatatan finansial (log book) harian selama masa pra-tanam hingga pascapanen.</p>
        </section>
        <section class="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 class="text-lg font-semibold text-brand-primary mb-4">Langkah Analisis Mandiri</h3>
          <ul class="list-disc pl-5 space-y-3 text-gray-700">
            <li><strong>Hitung Biaya Tetap:</strong> Sewa lahan, pembelian benih, dan sewa traktor pengolahan tanah.</li>
            <li><strong>Hitung Biaya Variabel:</strong> Pupuk, pestisida, dan tenaga kerja harian.</li>
            <li><strong>Proyeksi Hasil:</strong> Kalikan target panen (misal 5 ton/ha) dengan harga pasar saat ini.</li>
          </ul>
        </section>
        <section class="p-4 bg-gray-50 rounded-xl">
          <h3 class="text-md font-bold text-gray-900 mb-1">💡 Tips Profit</h3>
          <p class="text-gray-600 text-sm italic">Sorgum memiliki keunggulan biaya air yang lebih rendah dari jagung. Masukkan penghematan biaya air ini ke dalam pembukuan Anda.</p>
        </section>
        <div class="pt-6 border-t border-gray-100">
          <p class="text-[13px] text-gray-500 font-bold">Butuh template Excel perhitungan? Mintalah formatnya lewat asisten AI kami.</p>
        </div>
      </div>
    `
  }
];

const POPULAR_TOPICS: PopularTopic[] = [
  { id: '1', title: 'Atasi Hama Ulat Grayak', reads: '900+ solusi dicari', icon: ShieldCheck },
  { id: '2', title: 'Simpan Sorgum Tanpa Jamur', reads: '750+ panduan dilihat', icon: Box },
  { id: '3', title: 'Cegah Biji Apek/Berbau', reads: '500+ masalah selesai', icon: Wind },
];

// --- Components ---

const FloatingIcon = ({ icon: Icon, top, left, delay = 0 }: { icon: any, top: string, left: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
    transition={{ 
      opacity: { duration: 0.5, delay },
      scale: { duration: 0.5, delay },
      y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay }
    }}
    style={{ top, left, transform: 'translate(-50%, -50%)' }}
    className="absolute z-20 w-16 h-16 bg-brand-accent/20 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center text-brand-text shadow-2xl"
  >
    <Icon className="w-7 h-7" />
  </motion.div>
);

const Hero = ({ onSearch, searchValue }: { onSearch: (val: string) => void, searchValue: string }) => (
  <div className="relative min-h-[600px] lg:h-[70vh] flex items-center bg-[#040D09] pt-40 lg:pt-48 pb-16 lg:pb-24 z-20 overflow-hidden">
    {/* Background layer */}
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img 
        src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=2071" 
        alt="Sorghum Field" 
        className="w-full h-full object-cover opacity-60 brightness-[0.6] scale-105"
        referrerPolicy="no-referrer"
      />
      
      {/* Dynamic Gradients - Dark on left for text readability, clear on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#040D09] via-[#040D09]/60 to-transparent z-[2]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#040D09] via-transparent to-[#040D09]/40 z-[2]" />
      
      {/* Floating Icons Display */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20 lg:opacity-100">
        <FloatingIcon icon={MessageSquare} top="30%" left="65%" delay={0.2} />
        <FloatingIcon icon={Clipboard} top="25%" left="85%" delay={0.6} />
        <FloatingIcon icon={Headset} top="60%" left="78%" delay={0.4} />
        <FloatingIcon icon={ShoppingCart} top="40%" left="92%" delay={0.8} />
      </div>
    </div>
 
    <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 lg:pl-20 flex items-center">
      <div className="max-w-4xl text-left">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
          <div className="mb-6 flex justify-start">
            <span className="text-brand-accent font-semibold uppercase tracking-[0.3em] text-[10px] bg-brand-accent/10 px-5 py-2.5 rounded-full border border-brand-accent/20">
              PUSAT BANTUAN SORGUM
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-semibold leading-[1.05] mb-6 text-white tracking-tighter text-left">
            Ada Kendala <span className="text-brand-accent">Sorgum?</span>,<br />
            Kami Punya <span className="text-brand-accent">Solusinya</span>
          </h1>

          <p className="text-white/70 text-sm md:text-base max-w-lg mb-8 leading-relaxed text-left">
            Cari solusi cepat untuk setiap permasalahan teknis lahan dan pascapanen Anda. Tim bantuan kami siap memastikan pertumbuhan tanaman Anda tetap optimal.
          </p>

          <div className="flex flex-wrap items-center gap-6 md:gap-10 border-l-2 border-brand-accent/30 pl-8 opacity-90 mb-10">
            <div>
              <div className="text-xl lg:text-3xl font-semibold text-white tracking-tight">24/7</div>
              <div className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mt-1">Dukungan AI</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div>
              <div className="text-xl lg:text-3xl font-semibold text-white tracking-tight">450+</div>
              <div className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mt-1">Masalah Selesai</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div>
              <div className="text-xl lg:text-3xl font-semibold text-white tracking-tight">98%</div>
              <div className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mt-1">Puas</div>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="relative max-w-[340px] text-left group">
            <div className="relative flex items-center bg-white rounded-full p-1 shadow-[0_25px_60px_rgba(0,0,0,0.4)] focus-within:ring-2 ring-brand-accent/25 transition-all">
              <div className="pl-4 flex-shrink-0">
                <Search className="w-4 h-4 text-gray-400 group-focus-within:text-brand-accent transition-colors" />
              </div>
              <input 
                type="text" 
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                placeholder='Cari masalah atau solusi...' 
                className="flex-1 min-w-0 bg-transparent py-3 px-3 focus:outline-none text-gray-900 placeholder:text-gray-400 font-medium text-[13px]"
              />
              <button type="submit" className="flex-shrink-0 bg-brand-accent w-9 h-9 rounded-full text-black cursor-pointer hover:brightness-110 hover:scale-105 transition-all flex items-center justify-center shadow-lg active:scale-95 group/btn">
                 <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  </div>
);

const CategoryTabs = ({ active, onChange }: { active: string, onChange: (v: string) => void }) => (
  <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
    {CATEGORY_ITEMS.map((cat) => (
      <button
        key={cat.name}
        onClick={() => onChange(cat.name)}
        className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-full text-[12px] font-semibold transition-all border ${
          active === cat.name 
            ? "bg-black text-white border-black shadow-md" 
            : "bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:bg-gray-50 shadow-sm"
        }`}
      >
        <cat.icon className={`w-3.5 h-3.5 ${active === cat.name ? "text-brand-accent" : "text-gray-400"}`} />
        {cat.name}
      </button>
    ))}
  </div>
);

const EduCard: React.FC<{ card: Article, isSaved: boolean, onToggleSave: (e: React.MouseEvent) => void, onClick: () => void }> = ({ card, isSaved, onToggleSave, onClick }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    onClick={onClick}
    className="bg-white rounded-[24px] overflow-hidden flex flex-col group border border-gray-100 hover:border-brand-accent/20 transition-all duration-300 h-full shadow-sm hover:shadow-xl relative cursor-pointer"
  >
    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
      <img 
        src={card.thumbnail || card.image || 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=800'} 
        alt={card.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        referrerPolicy="no-referrer"
      />
      
      {/* Category Tag Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-brand-accent/90 backdrop-blur-md text-black px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-sm">
          {card.category}
        </span>
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
    </div>
    
    <div className="p-4 flex flex-col flex-grow">
      <h3 className="font-semibold text-[16px] mb-2.5 group-hover:text-brand-accent transition-colors leading-tight line-clamp-2 text-gray-900 min-h-[40px]">
        {card.title}
      </h3>
      <p className="text-gray-500 text-[12px] mb-5 leading-relaxed line-clamp-3 flex-grow">
        {card.content}
      </p>

      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Eye className="w-3.5 h-3.5 text-gray-300" />
            <span>{card.views || 0} Views</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />
            <span>TERVERIFIKASI</span>
          </div>
        </div>
        
        <div className="flex-shrink-0 bg-brand-accent/10 p-2.5 rounded-full group-hover:bg-brand-accent group-hover:text-black transition-all shadow-sm">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  </motion.div>
);

const SidebarItem: React.FC<{ item: Article, onClick: () => void }> = ({ item, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-brand-accent/10 transition-all cursor-pointer group mb-2 border border-gray-100 hover:border-brand-accent/20"
  >
    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:bg-brand-accent group-hover:text-black transition-all shadow-sm flex-shrink-0">
      <TrendingUp className="w-4 h-4 text-brand-primary" />
    </div>
    <div className="flex-grow min-w-0">
      <h4 className="text-[12px] font-semibold mb-0.5 group-hover:text-brand-accent transition-colors text-gray-900 leading-tight truncate">{item.title}</h4>
      <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-widest">{item.views || 0} Pembaca</span>
    </div>
    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-brand-accent flex-shrink-0" />
  </div>
);

// --- Main component ---

interface EdukasiProps {
  setCurrentPage: (page: string) => void;
  userProfile?: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setPrefilledChatInput: (input: string) => void;
}

const Edukasi: React.FC<EdukasiProps> = ({ 
  setCurrentPage, 
  userProfile,
  activeTab, 
  setActiveTab, 
  setPrefilledChatInput 
}) => {
  const [eduSearch, setEduSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(() => {
    const saved = localStorage.getItem('selectedArticle');
    return saved ? JSON.parse(saved) : null;
  });
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not-helpful' | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const handleChatNav = (input?: string) => {
    if (!userProfile?.id) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
      }, 1500);
    } else {
      if (input) setPrefilledChatInput(input);
      setCurrentPage('Chat AI');
    }
  };

  useEffect(() => {
    if (selectedArticle) {
      localStorage.setItem('selectedArticle', JSON.stringify(selectedArticle));
    } else {
      localStorage.removeItem('selectedArticle');
    }
  }, [selectedArticle]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getAllArticles();
        setArticles(data);

        if (userProfile?.id) {
          const saved = await getUserSavedArticles(userProfile.id);
          setSavedArticleIds(new Set(saved.map((s: any) => s.article_id || s.id)));
        }
      } catch (err) {
        console.error('Error fetching education data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userProfile?.id]);

  const handleHelpful = async (id: string, type: 'helpful' | 'not-helpful') => {
    if (feedbackGiven || !userProfile?.id) return;
    try {
      await recordArticleFeedback(id, type === 'helpful', userProfile.id, userProfile.email);
      setFeedbackGiven(type);
      
      // Update local state for counts
      setArticles(prev => prev.map(a => {
        if (a.id === id) {
          return {
            ...a,
            helpful: type === 'helpful' ? (a.helpful || 0) + 1 : (a.helpful || 0),
            notHelpful: type === 'not-helpful' ? (a.notHelpful || 0) + 1 : (a.notHelpful || 0)
          };
        }
        return a;
      }));
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    if (!userProfile?.id) {
      toast.error('Silakan login untuk menyimpan artikel');
      setCurrentPage('Login');
      return;
    }

    const isCurrentlySaved = savedArticleIds.has(article.id!);
    try {
      await toggleSaveArticle(userProfile.id, article, isCurrentlySaved);
      const newSavedIds = new Set(savedArticleIds);
      if (isCurrentlySaved) {
        newSavedIds.delete(article.id!);
      } else {
        newSavedIds.add(article.id!);
      }
      setSavedArticleIds(newSavedIds);
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleArticleOpen = async (article: Article) => {
    if (!userProfile?.id) {
      toast.error("Akses Dibatasi: Silakan login terlebih dahulu untuk membaca detail dan beraktivitas!");
      setTimeout(() => {
        setCurrentPage('Login');
      }, 1500);
      return;
    }
    setSelectedArticle(article);
    incrementArticleViews(article.id!, userProfile?.id);
    
    // Update local articles state to reflect the incremented view
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, views: (a.views || 0) + 1 } : a));

    setFeedbackGiven(null);

    // Filter by published status for users
    if (article.status !== 'Published') {
       return;
    }

    // Check if user already gave feedback
    if (userProfile?.id) {
      try {
        const userFeedback = await getUserArticleFeedback(article.id!, userProfile.id);
        if (userFeedback) {
          setFeedbackGiven(userFeedback.isHelpful ? 'helpful' : 'not-helpful');
        }
      } catch (err) {
        console.error('Error checking feedback status:', err);
      }
    }
  };

  const handleShare = (article: Article) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.problem || article.content,
        url: window.location.href,
      });
    } else {
      toast.success("Link artikel telah disalin ke clipboard!");
    }
  };

  const publishedArticles = articles.filter(a => a.status === 'Published');

  const popularArticles = [...publishedArticles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);

  const filteredByTab = activeTab === "Semua Masalah" 
    ? publishedArticles 
    : publishedArticles.filter(card => card.category === activeTab);
  
  const filteredCards = (filteredByTab || []).filter(card => 
    (card.title || '').toLowerCase().includes(eduSearch.toLowerCase()) ||
    (card.content || '').toLowerCase().includes(eduSearch.toLowerCase())
  );

  return (
    <>
      <Hero onSearch={setEduSearch} searchValue={eduSearch} />
      <div className="relative z-30 bg-[#F9FBFA] pb-12">
        <main className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">
            <div className="flex-grow pt-8 lg:pt-10 min-w-0">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Pusat Bantuan Sorgum</h2>
                  <div className="hidden md:block h-px flex-1 bg-gray-100 mx-6" />
                </div>
                <CategoryTabs active={activeTab} onChange={setActiveTab} />
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-[24px] h-[350px] animate-pulse" />
                  ))}
                </div>
              ) : (filteredCards || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  <AnimatePresence mode="popLayout">
                  {(filteredCards || []).map((card) => (
                      <EduCard 
                        key={card.id} 
                        card={card} 
                        isSaved={savedArticleIds.has(card.id!)}
                        onToggleSave={(e) => handleToggleSave(e, card)}
                        onClick={() => handleArticleOpen(card)} 
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Solusi Tidak Ditemukan</h3>
                  <p className="text-gray-500 text-sm">Coba gunakan kata kunci permasalahan yang berbeda.</p>
                </div>
              )}
            </div>
            
            <aside className="w-full lg:w-[280px] xl:w-[320px] flex-shrink-0 relative z-30">
              <div className="sticky top-28 space-y-5 pt-0 lg:-mt-32 xl:-mt-40">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-[#0b1c12] to-[#1a3825] p-6 lg:p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute -right-6 -bottom-6 w-44 opacity-30 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <img 
                      src="https://img.freepik.com/premium-photo/3d-render-cute-white-ai-assistant-robot-with-green-leaf-branding-isolated-transparent-background_924233-255.jpg" 
                      alt="AI Robot"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-xl text-white mb-2">Tanya Sorgum AI</h3>
                    <p className="text-white/50 text-[12px] font-medium leading-relaxed mb-6 max-w-[180px]">
                      Punya pertanyaan spesifik? Asisten AI kami siap memberikan jawaban instan.
                    </p>
                    <button 
                      type="button"
                      onClick={() => handleChatNav()}
                      className="bg-brand-accent text-black hover:bg-brand-highlight transition-all rounded-2xl w-full py-3.5 flex items-center justify-center gap-3 font-semibold text-sm shadow-xl active:scale-95 group/btn"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Mulai Obrolan
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
  
                <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-accent/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-brand-accent" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">Populer</h2>
                    </div>
                    <span className="text-[10px] bg-red-50 text-red-500 px-2.5 py-1 rounded-full font-semibold animate-pulse">LIVE</span>
                  </div>
                  <div className="space-y-1">
                    {(popularArticles || []).map((topic) => (
                      <SidebarItem 
                        key={topic.id} 
                        item={topic} 
                        onClick={() => handleArticleOpen(topic)} 
                      />
                    ))}
                  </div>
                </div>
  
                <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Pusat Bantuan</h3>
                  <p className="text-gray-400 text-[12px] mb-6 leading-relaxed">Tim dukungan kami siap membantu operasional Anda.</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div 
                      onClick={() => handleChatNav()}
                      className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 group cursor-pointer hover:border-brand-accent/30 hover:bg-white transition-all"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-black transition-all shadow-sm">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-gray-900">AI Support</span>
                        <span className="text-[10px] text-gray-400 font-medium">Aktif 24/7</span>
                      </div>
                    </div>
                    <a 
                      href="mailto:halo@sorgummi.ai"
                      className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 group cursor-pointer hover:border-brand-accent/30 hover:bg-white transition-all"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-black transition-all shadow-sm">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-gray-900">Email Utama</span>
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">halo@sorgummi.ai</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
      
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-10 pointer-events-none"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-[32px] overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
            >
              <div className="absolute top-6 right-6 z-10">
                <button 
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="relative h-[250px] lg:h-[350px]">
                  <img 
                    src={selectedArticle.thumbnail || selectedArticle.image || 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=800'} 
                    alt={selectedArticle.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="bg-brand-accent text-black px-3 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest mb-3 inline-block">
                      {selectedArticle.category}
                    </span>
                    <h1 className="text-2xl lg:text-4xl font-serif font-semibold text-[#040D09] tracking-tight leading-tight">
                      {selectedArticle.title}
                    </h1>
                  </div>
                </div>
                
                  <div className="px-8 py-10">
                    <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-brand-accent" />
                        <span className="text-sm font-semibold text-gray-500">{selectedArticle.badge || 'Panduan Terverifikasi'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-brand-accent" />
                        <span className="text-sm font-semibold text-gray-500">{selectedArticle.readTime || '5 Menit'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {selectedArticle.problem && (
                        <section>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Masalah</h3>
                          <p className="text-gray-600 leading-relaxed font-medium">{selectedArticle.problem}</p>
                        </section>
                      )}

                      {selectedArticle.cause && (
                        <section>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Penyebab</h3>
                          <p className="text-gray-600 leading-relaxed">{selectedArticle.cause}</p>
                        </section>
                      )}

                      {selectedArticle.solutions && (selectedArticle.solutions?.length || 0) > 0 && (
                        <section className="bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                          <h3 className="text-lg font-black text-brand-primary mb-5 uppercase tracking-widest flex items-center gap-2">
                             <Zap className="w-5 h-5" /> {selectedArticle.stepTitle || 'Solusi Penyelamatan'}
                          </h3>
                          <div className="space-y-4">
                            {(selectedArticle.solutions || []).map((step, idx) => (
                              <div key={idx} className="flex gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-black shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                  {idx + 1}
                                </div>
                                <p className="text-gray-700 font-medium pt-1 leading-relaxed">{step}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {selectedArticle.expertTips && (
                        <section className="p-5 bg-brand-accent/5 rounded-2xl border-l-[6px] border-brand-accent shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-5 h-5 text-brand-accent" />
                            <h3 className="text-md font-black text-gray-900 uppercase tracking-widest leading-none">💡 Tips Ahli</h3>
                          </div>
                          <p className="text-gray-600 text-sm italic font-medium leading-relaxed">{selectedArticle.expertTips}</p>
                        </section>
                      )}

                      {selectedArticle.content && !selectedArticle.problem && (
                         <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed edu-article-content">
                           <p>{selectedArticle.content}</p>
                         </div>
                      )}

                      {/* Tanya AI Section */}
                      <section className="bg-[#0b1c12] p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden group/ai mt-12">
                        <div className="absolute -right-6 -bottom-6 w-40 opacity-20 group-hover/ai:scale-110 transition-transform duration-700 pointer-events-none">
                          <img 
                            src="https://img.freepik.com/premium-photo/3d-render-cute-white-ai-assistant-robot-with-green-leaf-branding-isolated-transparent-background_924233-255.jpg" 
                            alt="AI Robot"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="max-w-md">
                            <h3 className="font-semibold text-lg text-white mb-2">Punya pertanyaan lebih lanjut?</h3>
                            <p className="text-white/50 text-[11px] font-medium leading-relaxed">
                              Biarkan asisten AI kami membantu Anda memahami topik <span className="text-brand-accent font-bold">"{selectedArticle.title}"</span> secara lebih mendalam.
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              handleChatNav(`Saya ingin bertanya tentang artikel "${selectedArticle.title}". Bisakah Anda menjelaskan lebih lanjut mengenai topik ini?`);
                            }}
                            className="bg-brand-accent text-black hover:bg-brand-highlight transition-all rounded-2xl px-8 py-4 flex items-center justify-center gap-4 font-bold text-sm shadow-xl active:scale-95 group/btn-ai shrink-0"
                          >
                            <Bot className="w-5 h-5" />
                            Tanya AI Sekarang
                            <ArrowRight className="w-4 h-4 group-hover/btn-ai:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </section>
                    </div>

                    <div className="mt-16 pt-10 border-t border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Apakah artikel ini membantu?</h4>
                        <div className="flex gap-4">
                          <button 
                            disabled={!!feedbackGiven}
                            onClick={() => handleHelpful(selectedArticle.id!, 'helpful')}
                            className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-95 ${
                              feedbackGiven === 'helpful' 
                              ? 'bg-brand-accent text-black scale-105 shadow-lg' 
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <ThumbsUp className="w-5 h-5" />
                            Membantu
                          </button>
                          <button 
                            disabled={!!feedbackGiven}
                            onClick={() => handleHelpful(selectedArticle.id!, 'not-helpful')}
                            className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-95 ${
                              feedbackGiven === 'not-helpful'
                              ? 'bg-red-500 text-white scale-105 shadow-lg'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <ThumbsDown className="w-5 h-5" />
                            Tidak
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={(e) => handleToggleSave(e, selectedArticle)}
                          className={`p-4 rounded-xl border transition-all active:scale-90 ${
                            savedArticleIds.has(selectedArticle.id!)
                            ? 'bg-brand-accent/10 border-brand-accent text-brand-accent'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-brand-accent'
                          }`}
                          title="Simpan Artikel"
                        >
                          <Bookmark className={`w-6 h-6 ${savedArticleIds.has(selectedArticle.id!) ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => handleShare(selectedArticle)}
                          className="p-4 rounded-xl border border-gray-200 text-gray-400 hover:border-brand-accent hover:text-brand-accent transition-all active:scale-90"
                          title="Bagikan"
                        >
                          <Share2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Edukasi;
