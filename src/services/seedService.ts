import { createArticle, getAllArticles, createProduct, getAllProducts } from './dataService';

const DUMMY_PRODUCTS = [
  {
    title: 'Cookies Sorgum Tidak Mudah Hancur',
    category: 'Makanan Olahan',
    description: 'Gunakan teknik pencampuran dan pemanggangan yang tepat agar cookies tetap renyah and tidak pecah saat pengemasan.',
    status: 'Published',
    author: 'Chef Sorgum',
    readTime: '9 menit',
    thumbnail: 'https://images.unsplash.com/photo-1499636136210-6560b0df5fd1?q=80&w=800'
  },
  {
    title: 'Kemasan Produk Sorgum Agar Terlihat Premium',
    category: 'Packaging Produk',
    description: 'Panduan memilih desain dan jenis kemasan untuk meningkatkan daya tarik produk di pasar ritel modern.',
    status: 'Published',
    author: 'Design Pro',
    readTime: '10 menit',
    thumbnail: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=800'
  },
  {
    title: 'Minuman Sorgum Sehat dengan Tekstur Lebih Creamy',
    category: 'Minuman Sorgum',
    description: 'Tips mengolah minuman sorgum agar memiliki rasa lebih lembut dan nikmat tanpa bahan pengawet.',
    status: 'Published',
    author: 'Healthy Life',
    readTime: '6 menit',
    thumbnail: 'https://images.unsplash.com/photo-1556767667-0716dc1f0388?q=80&w=800'
  }
];

const DUMMY_ARTICLES = [
  {
    title: 'Cara Menanam Sorgum dengan Benar',
    category: 'Masalah Penanaman',
    status: 'Published',
    author: 'Tani Muda',
    readTime: '7 Menit',
    badge: 'Panduan Dasar',
    stepTitle: 'Proses Penanaman Standard',
    problem: 'Tanaman sorgum tidak tumbuh optimal, pertumbuhan tidak seragam, dan hasil panen rendah.',
    cause: 'Kesalahan dalam teknik penanaman awal, kedalaman benih yang tidak tepat, dan pengolahan tanah yang kurang maksimal.',
    solutions: [
      'Lakukan pengolahan tanah (bajak) sedalam 20-30 cm.',
      'Gunakan benih unggul bersertifikat.',
      'Tanam pada kedalaman 3-5 cm dengan jarak tanam 70x20 cm.',
      'Pastikan kelembaban tanah cukup saat penanaman.'
    ],
    expertTips: 'Gunakan pola tanam baris ganda untuk populasi tanaman yang lebih optimal.',
    thumbnail: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=2671&auto=format&fit=crop',
    content: 'Panduan lengkap langkah demi langkah menanam sorgum dari persiapan lahan hingga bibit muncul di permukaan.'
  },
  {
    title: 'Cara Mengatasi Hama Ulat Sorgum',
    category: 'Masalah Hama',
    status: 'Published',
    author: 'Dr. Sorgum',
    readTime: '5 Menit',
    badge: 'Solusi Kilat',
    stepTitle: '4 Langkah Penyelamatan Tanaman',
    problem: 'Daun sorgum berlubang dan pucuk layu akibat serangan ulat grayak.',
    cause: 'Telur ulat yang menetas di malam hari dan suhu lembab yang ekstrem.',
    solutions: [
      'Lakukan sanitasi lahan dari gulma yang menjadi inang ulat.',
      'Gunakan pestisida nabati dari campuran tembakau dan bawang putih.',
      'Lakukan penyemprotan rutin pada sore hari saat ulat mulai aktif.',
      'Gunakan perangkap lampu (light trap) di pinggir lahan.'
    ],
    expertTips: 'Jangan menyemprot pestisida saat matahari terik karena efektivitas menurun.',
    thumbnail: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2000&auto=format&fit=crop',
    content: 'Panduan lengkap mendeteksi dan membasmi hama ulat grayak pada tanaman sorgum dengan cara organik dan praktis.'
  },
  {
    title: 'Tanah Keras & Tanaman Kerdil',
    category: 'Masalah Tanah',
    status: 'Published',
    author: 'Ani Budiman',
    readTime: '4 Menit',
    badge: 'Tips Tani',
    stepTitle: 'Langkah Pemulihan Tanah',
    problem: 'Tanah terasa keras saat dicangkul, air sulit meresap, dan tanaman sorgum terlihat kerdil.',
    cause: 'Degradasi bahan organik akibat penggunaan pupuk kimia berlebih dan kurangnya pengembalian sisa panen.',
    solutions: [
      'Berikan kompos matang minimal 5-10 ton per hektar.',
      'Gunakan pola lubang tanam searah kontur.',
      'Aplikasi Agens Hayati untuk mempercepat dekomposisi.'
    ],
    expertTips: 'Jangan membakar sisa panen! Benamkan di tanah untuk membantu pembentukan humus.',
    thumbnail: 'https://images.unsplash.com/photo-1542382156909-6ae75043819b?q=80&w=2682&auto=format&fit=crop',
    content: 'Solusi pemulihan struktur tanah marginal yang keras agar pertumbuhan tanaman kembali optimal.'
  },
  {
    title: 'Biji Sorgum Apek & Berjamur',
    category: 'Masalah Penyimpanan',
    status: 'Published',
    author: 'Rahmat Taufik',
    readTime: '6 Menit',
    badge: 'Pascapanen',
    stepTitle: 'Teknik Penyimpanan Aman',
    problem: 'Biji yang disimpan mengeluarkan bau apek, warna kusam, dan muncul serbuk putih (jamur).',
    cause: 'Kadar air biji saat disimpan masih di atas 13% atau gudang memiliki kelembaban tinggi.',
    solutions: [
      'Pastikan biji dijemur hingga bunyi gemerincing.',
      'Gunakan palet kayu untuk alas karung.',
      'Pasang ventilasi di bagian atas gudang.'
    ],
    expertTips: 'Gunakan karung plastik hermetik untuk penyimpanan di atas 3 bulan.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
    content: 'Mencegah kerusakan hasil panen di gudang akibat kelembaban tinggi dan sirkulasi udara buruk.'
  },
  {
    title: 'Harga Jual Sorgum Rendah',
    category: 'Masalah Usaha/Produk',
    status: 'Published',
    author: 'Budi Hartono',
    readTime: '8 Menit',
    badge: 'Strategi Bisnis',
    stepTitle: 'Hilirisasi Produk Sorgum',
    problem: 'Harga biji sorgum mentah di tingkat petani seringkali rendah saat panen raya.',
    cause: 'Petani hanya menjual bahan mentah tanpa ada nilai tambah atau pengolahan lebih lanjut.',
    solutions: [
      'Olah menjadi beras sorgum (penyosohan).',
      'Giling menjadi tepung gluten-free.',
      'Targetkan pasar modern dengan kemasan menarik.'
    ],
    expertTips: 'Targetkan pasar penderita autoimun atau diet sehat untuk harga premium.',
    thumbnail: 'https://images.unsplash.com/photo-1596558452288-038cbe22c83b?q=80&w=600&auto=format&fit=crop',
    content: 'Ide peningkatan nilai jual sorgum dari komoditas mentah menjadi produk olahan bernilai tinggi.'
  },
  {
    title: 'Waktu Terbaik Pemupukan',
    category: 'Masalah Penanaman',
    status: 'Published',
    author: 'Siti Aminah',
    readTime: '3 Menit',
    badge: 'Nutrisi Tanaman',
    stepTitle: 'Jadwal Pemupukan Presisi',
    problem: 'Pertumbuhan tanaman terhambat dan daun menguning.',
    cause: 'Kekurangan unsur Nitrogen pada fase vegetatif awal.',
    solutions: [
      'Berikan pupuk dasar saat olah tanah.',
      'Pupuk susulan pertama di umur 2 minggu.',
      'Pupuk susulan kedua di umur 5-6 minggu.'
    ],
    expertTips: 'Kandungan humus tanah menentukan dosis urea yang diperlukan.',
    thumbnail: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=2574&auto=format&fit=crop',
    content: 'Panduan jadwal dan dosis pemupukan sorgum untuk hasil panen yang melimpah.'
  },
  {
    title: 'Kematangan Biji Tidak Serata',
    category: 'Masalah Panen',
    status: 'Published',
    author: 'Andi Wijaya',
    readTime: '5 Menit',
    badge: 'Efisiensi Panen',
    stepTitle: 'Penyeragaman Kematangan',
    problem: 'Dalam satu lahan, sebagian tanaman sudah siap panen namun sebagian lagi masih hijau.',
    cause: 'Distribusi nutrisi tidak merata atau kedalaman tanam benih berbeda-beda.',
    solutions: [
      'Pastikan kedalaman tanam seragam (3cm).',
      'Fokus pemupukan P & K saat fase primordial.',
      'Pastikan pengairan merata ke seluruh petakan.'
    ],
    expertTips: 'Lakukan penyulaman benih maksimal 7 hari setelah tanam.',
    thumbnail: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=2689&auto=format&fit=crop',
    content: 'Teknik memastikan seluruh bulir sorgum matang bersamaan untuk memudahkan panen massal.'
  },
  {
    title: 'Busuk Akar di Musim Hujan',
    category: 'Masalah Penanaman',
    status: 'Published',
    author: 'Dr. Sorgum',
    readTime: '4 Menit',
    badge: 'Penyelamatan',
    stepTitle: 'Manajemen Drainase',
    problem: 'Pangkal batang tanaman muda berubah warna cokelat dan berbau busuk.',
    cause: 'Drainase buruk dan curah hujan tinggi memicu infeksi jamur Pythium.',
    solutions: [
      'Perdalam parit drainase sekeliling lahan.',
      'Taburkan kapur dolomit di pangkal batang.',
      'Gunakan bedengan tinggi saat menanam.'
    ],
    expertTips: 'Gunakan pola tanam guludan jika menanam tepat di puncak musim hujan.',
    thumbnail: 'https://images.unsplash.com/photo-1542382156909-6ae75043819b?q=80&w=2682&auto=format&fit=crop',
    content: 'Menangani genangan air yang menyebabkan busuk akar pada bibit sorgum.'
  },
  {
    title: 'Analisis Keuntungan 2024',
    category: 'Masalah Usaha/Produk',
    status: 'Published',
    author: 'Financial Tani',
    readTime: '7 Menit',
    badge: 'Cerdas Finansial',
    stepTitle: 'Perhitungan ROI',
    problem: 'Petani ragu menanam sorgum karena belum paham unit ekonomi budidayanya.',
    cause: 'Kurangnya pencatatan finansial harian dari pra-tanam hingga panen.',
    solutions: [
      'Hitung biaya tetap (sewa, benih, traktor).',
      'Hitung biaya variabel (pupuk, tenaga kerja).',
      'Proyeksikan hasil panen x harga pasar.'
    ],
    expertTips: 'Sorgum lebih hemat air dibanding jagung, masukkan penghematan ini ke perhitungan.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
    content: 'Bedah tuntas margin keuntungan budidaya sorgum skala hektar untuk petani modern.'
  }
];

export const seedDatabase = async () => {
  try {
    // Seed Articles
    const existingArticles = await getAllArticles();
    if (existingArticles.length === 0) {
      console.log('Seeding articles...');
      for (const article of DUMMY_ARTICLES) {
        await createArticle(article as any);
      }
    }

    // Seed Products
    const existingProducts = await getAllProducts();
    if (existingProducts.length === 0) {
      console.log('Seeding products...');
      for (const product of DUMMY_PRODUCTS) {
        await createProduct(product as any);
      }
    }
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
