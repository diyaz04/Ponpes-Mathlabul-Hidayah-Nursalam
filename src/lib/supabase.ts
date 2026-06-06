import { createClient } from '@supabase/supabase-js';
import { 
  Profile, Santri, JenisPelanggaran, Pelanggaran, SetoranHapalan,
  ProgressHapalan, ProfilPesantren, Program, Berita, PSB,
  JenisPembayaran, NominalPembayaran, Tagihan, Pembayaran, Notifikasi, Pengumuman,
  KategoriHapalan
} from '../types';

// Read config from env (standard vite client prefix)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isRealSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// PRESET SEED DATA FOR DEMO & PLAYGROUND
// ==========================================

const INITIAL_PROFILES: Profile[] = [
  { id: 'p-admin', role: 'admin', full_name: 'Ustadz Ahmad Nur Salam, M.Pd.', email: 'adminnursalam@gmail.com', phone: '081234567890', is_active: true, password: 'admin', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
  { id: 'p-guru1', role: 'guru', full_name: 'Ust. Sholahuddin Fauzi, S.Th.I.', email: 'fauzi@mathlabulhidayah.sch.id', phone: '081299998888', is_active: true, password: 'guru', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
  { id: 'p-guru2', role: 'guru', full_name: 'Ustadzah Syarifah Aminah, S.Ag.', email: 'aminah@mathlabulhidayah.sch.id', phone: '081277776666', is_active: true, password: 'guru', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80' },
  { id: 'p-wali1', role: 'user', full_name: 'Bpk. Kurniawan Prasetyan', email: 'kurniawan@gmail.com', phone: '085611112222', is_active: true, password: '123456', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80' },
  { id: 'p-wali2', role: 'user', full_name: 'Ibu Yayat Nurhayati', email: 'yayatnurhayati202025@gmail.com', phone: '085633334444', is_active: true, password: '123456', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' },
];

const INITIAL_SANTRI: Santri[] = [
  { id: 's-santri1', nis: '202109012', nama: 'Ahmad Zidni Mubarok', kelas: 'IX - Tahfidz A', kamar: 'Abu Bakar Shiddiq', jenis_kelamin: 'L', tanggal_lahir: '2011-04-12', alamat: 'Kuningan, Jawa Barat', wali_id: 'p-wali1', foto_url: '', status: 'aktif', tahun_masuk: '2023', bulan_masuk: 'Januari' },
  { id: 's-santri2', nis: '202109015', nama: 'Fatimah Az-Zahra', kelas: 'VIII - Reguler B', kamar: 'Aisyah r.a.', jenis_kelamin: 'P', tanggal_lahir: '2012-08-25', alamat: 'Cirebon, Jawa Barat', wali_id: 'p-wali2', foto_url: '', status: 'aktif', tahun_masuk: '2024', bulan_masuk: 'Januari' },
  { id: 's-santri3', nis: '202109022', nama: 'Muhammad Al-Fatih', kelas: 'IX - Tahfidz A', kamar: 'Umar bin Khattab', jenis_kelamin: 'L', tanggal_lahir: '2011-12-02', alamat: 'Majalengka, Jawa Barat', wali_id: 'p-wali1', foto_url: '', status: 'aktif', tahun_masuk: '2023', bulan_masuk: 'Januari' },
];

const INITIAL_JENIS_PELANGGARAN: JenisPelanggaran[] = [
  { id: 'jp-1', nama: 'Terlambat Berjamaah', deskripsi: 'Terlambat menghadiri sholat berjamaah di masjid', poin_default: 5, kategori: 'ringan', is_active: true },
  { id: 'jp-2', nama: 'Tidak Berbahasa Resmi', deskripsi: 'Menggunakan bahasa non-resmi pada hari aktif bahasa', poin_default: 10, kategori: 'ringan', is_active: true },
  { id: 'jp-3', nama: 'Keluar Tanpa Izin', deskripsi: 'Melanggar batas pondok tanpa surat izin resmi', poin_default: 30, kategori: 'sedang', is_active: true },
  { id: 'jp-4', nama: 'Membawa Gadget', deskripsi: 'Membawa HP atau perangkat elektronik tanpa izin khusus', poin_default: 50, kategori: 'berat', is_active: true },
  { id: 'jp-5', nama: 'Merokok', deskripsi: 'Melakukan tindakan merokok di kawasan pondok', poin_default: 75, kategori: 'berat', is_active: true },
];

export const INITIAL_KATEGORI_HAPALAN: KategoriHapalan[] = [
  { id: 'kat-quran', nama: "Al-Qur'an", deskripsi: 'Program hafalan ayat-ayat suci Al-Qur\'an', is_active: true },
  { id: 'kat-jurumiyah', nama: 'Matan Al-Jurumiyah', deskripsi: 'Kitab matan ilmu nahwu tata bahasa Arab karangan Ibnu Ajurrum', is_active: true },
  { id: 'kat-imriti', nama: 'Matan Al-Imriti', deskripsi: 'Nadzom ilmu nahwu karangan Syeikh Syarafuddin Yahya Al-Imriti', is_active: true }
];

const INITIAL_PELANGGARAN: Pelanggaran[] = [
  { id: 'p-1', santri_id: 's-santri2', guru_id: 'p-guru1', jenis_id: 'jp-1', tanggal: '2026-06-01', deskripsi: 'Terlambat sholat Subuh berjamaah', poin: 5, status: 'aktif' },
  { id: 'p-2', santri_id: 's-santri1', guru_id: 'p-guru2', jenis_id: 'jp-2', tanggal: '2026-05-28', deskripsi: 'Bicara bahasa daerah di asrama', poin: 10, status: 'ditindaklanjuti', catatan_tindak_lanjut: 'Diberikan skorsing hafalan mufrodat' },
];

const INITIAL_SETORAN_HAPALAN: SetoranHapalan[] = [
  { id: 'h-1', santri_id: 's-santri1', guru_id: 'p-guru1', tanggal: '2026-06-03', jenis: 'ziyadah', surah_nama: 'Al-Kahf', surah_nomor: 18, ayat_dari: 1, ayat_sampai: 25, jumlah_halaman: 2.5, nilai: 'mumtaz', catatan: 'Pelafalan makhraj sangat baik.', kategori_id: 'kat-quran' },
  { id: 'h-2', santri_id: 's-santri1', guru_id: 'p-guru1', tanggal: '2026-06-01', jenis: 'murajaah', surah_nama: 'Al-Isra', surah_nomor: 17, ayat_dari: 1, ayat_sampai: 50, jumlah_halaman: 5.0, nilai: 'jayyid', catatan: 'Kembali lancarkan ayat 25-30.', kategori_id: 'kat-quran' },
  { id: 'h-3', santri_id: 's-santri2', guru_id: 'p-guru2', tanggal: '2026-06-04', jenis: 'ziyadah', surah_nama: 'An-Naba', surah_nomor: 78, ayat_dari: 1, ayat_sampai: 40, jumlah_halaman: 1.5, nilai: 'mumtaz', catatan: 'Mumtaz jamil.', kategori_id: 'kat-quran' },
];

const INITIAL_PROGRESS_HAPALAN: ProgressHapalan[] = [
  { id: 'ph-1', santri_id: 's-santri1', total_juz: 3.5, total_halaman: 35.0, last_surah: 'Al-Kahf', updated_at: '2026-06-03T10:00:00Z' },
  { id: 'ph-2', santri_id: 's-santri2', total_juz: 1.2, total_halaman: 12.0, last_surah: 'An-Naba', updated_at: '2026-06-04T09:00:00Z' },
  { id: 'ph-3', santri_id: 's-santri3', total_juz: 0.5, total_halaman: 5.0, last_surah: 'An-Nas', updated_at: '2026-05-15T11:00:00Z' },
];

const INITIAL_PROFIL_PESANTREN: ProfilPesantren = {
  id: 'pp-1',
  nama: 'Pondok Pesantren Mathlabul Hidayah Nursalam',
  tagline: 'Membentuk Generasi Qurani, Cerdas, dan Berkarakter Robbani',
  deskripsi: 'Pondok Pesantren Mathlabul Hidayah Nursalam hadir sebagai lembaga pendidikan Islam terpadu yang memadukan khazanah keilmuan pesantren salafiyah dengan sistem kurikulum modern. Di bawah bimbingan para asatidzah berkompeten, kami berkomitmen mendidik tunas bangsa yang berakhlak mulia, hafal Al-Qur\'an, dan menguasai ilmu pengetahuan kontemporer.',
  sejarah: 'Ponpes Mathlabul Hidayah Nursalam didirikan pada tahun 2012 atas prakarsa keluarga kyai Nur Salam sebagai wujud khidmah perjuangan menyebarkan syiar Islam di tatar Pasundan. Sejak awal berdiri, pesantren ini memprioritaskan integrasi program tahfidzul Qur\'an 30 Juz bersanad dan tarbiyatul mualimin.',
  visi: 'Terwujudnya pusat mercusuar pendidikan Islam yang unggul dalam melahirkan pakar sains, ulama Al-Qur\'an berwawasan global, serta bertakwa kokoh.',
  misi: '1. Menyelenggarakan program tahfidzul Qur\'an bersanad dengan bimbingan intensif.\n2. Mengintegrasikan pengajaran kitab kuning dengan muatan teknologi modern.\n3. Membiasakan disiplin thariqah ilmiyah dan akhlakul karimah di lingkungan asrama.',
  alamat: 'Jl. Raya KH. Nursalam No. 45, Kecamatan Cadangpinggan, Indramayu, Jawa Barat',
  telepon: '0231-88776655',
  email: 'info@mathlabulhidayah.sch.id',
  foto_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop',

  // Hero defaults
  hero_bg_color: 'linear-gradient(to bottom, #ecfdf5, #f8fafc)',
  hero_img_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop',
  hero_img_opacity: 0.12,
  hero_type: 'statis',

  // Stats defaults
  stats_santri_val: '450+',
  stats_santri_lbl: 'Santri Aktif Mukim',
  stats_halaqah_val: '22+',
  stats_halaqah_lbl: 'Halaqah Tahfidzul Quran',
  stats_spp_val: '100%',
  stats_spp_lbl: 'Lunas Verifikasi SPP Digital',
  stats_satisfaction_val: '98.5%',
  stats_satisfaction_lbl: 'Indeks Kepuasan Pengawasan',

  sejarah_sub: 'Sejarah & Semangat',
  sejarah_title: 'Cahaya Tarbiyah Islamiyah Sejak Tahun 1998',

  // Routines stringified JSON
  routines_json: JSON.stringify({
    shubuh: {
      title: 'Halaqah Shubuh (04:00 - 06:15)',
      description: 'Zikir pagi berjamaah dilanjutkan setoran hafalan hafalan baru (Sabqi) langsung di hadapan dewan asatidzah.',
      items: [
        { time: '04.00', activity: 'Shalat Shubuh Berjamaah & Dzikir Ma\'tsurat' },
        { time: '04.30', activity: 'Halaqah Tahfidz (Sabaq/Setoran Hafalan Baru)' },
        { time: '06.00', activity: 'Mandi Pagi & Makan Pagi Bersama' }
      ]
    },
    madrasah: {
      title: 'Madrasah Formal (07:15 - 12:45)',
      description: 'Pendidikan kurikulum menteri agama nasional dipadukan pengkajian kitab kuning klasik (turots).',
      items: [
        { time: '07.15', activity: 'KBM Formal (MTs / MA Mathla\'bul Hidayah)' },
        { time: '10.00', activity: 'Shalat Dhuha & Istirahat Sehat' },
        { time: '12.00', activity: 'Shalat Dzuhur Berjamaah & Makan Siang' }
      ]
    },
    tahfidz: {
      title: 'Murojaah & Pembinaan (15:45 - 17:30)',
      description: 'Pengulangan hafalan lama bersama partner santri (murojaah sabaq-manzil) guna mengunci hafalan agar mutqin.',
      items: [
        { time: '15.45', activity: 'Shalat Ashar Berjamaah & Dzikir Sore' },
        { time: '16.15', activity: 'Halaqah Murojaah Terpantau Pasangan Halaqah' },
        { time: '17.15', activity: 'Kajian Ringkas Akhlaq (Kitab Ta\'lim Muta\'allim)' }
      ]
    },
    malam: {
      title: 'Takrar Malam (18:30 - 21:30)',
      description: 'Penajaman bacaan Al-Quran, pengulangan hafalan mandiri, persiapan hafalan esok hari, dan istirahat asrama syar\'i.',
      items: [
        { time: '18.30', activity: 'Shalat Maghrib & Halaqah Al-Quran Tajwid Madrasah' },
        { time: '19.45', activity: 'Shalat Isya & Makan Malam Berjamaah' },
        { time: '20.15', activity: 'Takrar (Mempersiapkan setoran surah untuk subuh esok)' },
        { time: '21.30', activity: 'Istirahat Asrama Sehat (Jam Malam Matikan Lampu)' }
      ]
    }
  }),

  // Facilities stringified JSON
  facilities_json: JSON.stringify([
    {
      id: 0,
      title: 'Masjid Jami\' Al-Akbar',
      desc: 'Pusat ibadah harian berkapasitas 800 jamaah dengan tata udara sejuk dan perpustakaan literatur kitab klasik terlengkap.',
      icon: 'BookOpen',
      badge: 'Ibadah Pusat'
    },
    {
      id: 1,
      title: 'Halaqah Tahfidz Indoor & Outdoor',
      desc: 'Area belajar tahfidz dikelilingi pepohonan rindang dan taman asri yang mendukung ketenangan serta kemudahan konsentrasi.',
      icon: 'Sparkles',
      badge: 'Fokus Belajar'
    },
    {
      id: 2,
      title: 'Asrama Syar\'i & Sehat',
      desc: 'Kamar asrama yang higienis, berventilasi optimal, dilengkapi lemari pribadi, ranjang bertingkat berstandar, serta dipantau musyrif asrama.',
      icon: 'ShieldCheck',
      badge: 'Nyaman'
    },
    {
      id: 3,
      title: 'Lab Mutimedia & Bahasa Arab-Inggris',
      desc: 'Sarana modern untuk menunjang kecakapan bilingual interaktif berbasis immersion camp dan pemantauan sistem cloud operasional.',
      icon: 'GraduationCap',
      badge: 'Modern'
    }
  ]),

  // Testimonials stringified JSON
  testimonials_json: JSON.stringify([
    {
      id: 1,
      name: 'H. Kurniawan Adi',
      city: 'Bandung (Wali Santri Fatih)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?mx=100&q=80',
      rating: 5,
      words: 'Masyallah, lewat portal akademik Mathla\'bul Hidayah saya bisa memantau setoran hafalan Fatih setiap subuh meskipun saya tinggal jauh di Bandung. Berita asrama dan invoice SPP pun transparan tanpa perlu menebak-nebak.'
    },
    {
      id: 2,
      name: 'Ustadzah Aminah, M.Pd.',
      city: 'Cirebon (Akademisi & Tokoh Muslim)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?mx=100&q=80',
      rating: 5,
      words: 'Pondok Pesantren ini berhasil memadukan ruh kearifan luhur pesantren salafiyah dengan sistem digitalisasi pelaporan yang rapi. Memudahkan orang tua membangun rasa saling percaya demi keberhasilan tarbiyah santri.'
    },
    {
      id: 3,
      name: 'Drs. KH. Ahmad Fauzan',
      city: 'Indramayu (Komite Santri)',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?mx=100&q=80',
      rating: 5,
      words: 'Pengelolaan yang tertib amanah adalah kunci kemajuan. Fitur notifikasi pelanggaran, pelaporan SPP, sertifikat setoran hafalan menjadi jaminan akuntabilitas yang luar biasa tinggi untuk masyarakat luas.'
    }
  ])
};

const INITIAL_PROGRAMS: Program[] = [
  { id: 'prog-1', nama: 'Tahfidzul Qur\'an 30 Juz', deskripsi: 'Bimbingan intensif setoran harian mutqin dengan target lulus hafal 30 Juz bersanad.', icon: 'BookOpen', urutan: 1, is_active: true },
  { id: 'prog-2', nama: 'Kajian Kitab Kuning', deskripsi: 'Pendalaman dirasah islamiyah klasik dari ilmu tajwid, fiqh safinah, nahwu sharaf, hingga tafsir jami\'.', icon: 'Scroll', urutan: 2, is_active: true },
  { id: 'prog-3', nama: 'Bahasa Arab & Inggris Aktif', deskripsi: 'Penerapan wajib percakapan bahasa arab dan inggris sehari-hari di kawasan asrama pesantren.', icon: 'Languages', urutan: 3, is_active: true },
];

const INITIAL_BERITA: Berita[] = [
  { id: 'news-1', judul: 'Penerimaan Santri Baru (PSB) Tahun Ajaran 2026/2027 Diperpanjang', slug: 'psb-2026-diperpanjang', konten: 'Kabar gembira! Melihat tingginya antusiasme pendaftar dari berbagai daerah di Indonesia, panitia PSB Pondok Pesantren Mathlabul Hidayah Nursalam menyetujui masa perpanjangan gelombang kedua hingga akhir bulan Juni 2026. Persyaratan administrasi berkas dapat dikirimkan secara daring menggunakan dashboard pendaftaran.', penulis: 'Humas Hubungan Masyarakat', tanggal_publish: '2026-06-01', is_published: true },
  { id: 'news-2', judul: 'Kunjungan Studi Banding Dewan Pengawas Pendidikan Jawa Barat', slug: 'studi-banding-dpj', konten: 'Pondok Pesantren Mathlabul Hidayah Nursalam menerima kunjungan resmi dari tim evaluasi dewan pengawas jabar bidang keislaman. Apresiasi besar diberikan untuk percontohan sistem tracking hapalan santri online yang dinilai meminimalisasi ketimpangan koordinasi asatidzah dan orang tua.', penulis: 'Redaksi Berita', tanggal_publish: '2026-05-24', is_published: true },
];

const INITIAL_PSB: PSB = {
  id: 'psb-1',
  tahun_ajaran: '2026/2027',
  tanggal_buka: '2026-01-01',
  tanggal_tutup: '2026-06-30',
  kuota: 120,
  syarat: '1. Fotokopi NISN & Rapor terakhir\n2. Surat keterangan kelakuan baik\n3. Lulus tes membaca Al-Qur\'an panjang pendek\n4. Menandatangani pakta kesanggupan tata tertib',
  alur_pendaftaran: '1. Pembuatan akun pendaftaran\n2. Pengisian biodata lengkap\n3. Verifikasi dokumen fisik saat tes\n4. Ujian seleksi lisan & wawancara\n5. Pengumuman kelulusan & daftar ulang',
  biaya: 4200000,
  is_open: true
};

const INITIAL_JENIS_PEMBAYARAN: JenisPembayaran[] = [
  { id: 'pay-1', nama: 'SPP Syahriyah', deskripsi: 'Iuran bulanan operasional pembinaan asrama & konsumsi', is_active: true },
  { id: 'pay-2', nama: 'Uang Buku & Kitab', deskripsi: 'Pembelian paket kitab turats tahunan ganjil/genap', is_active: true },
  { id: 'pay-3', nama: 'Iuran Sarana Prasarana', deskripsi: 'Iuran pembangunan gedung asrama baru & sanitasi', is_active: true },
];

const INITIAL_NOMINAL_PEMBAYARAN: NominalPembayaran[] = [
  { id: 'nom-1', jenis_id: 'pay-1', kelas: 'IX - Tahfidz A', nominal: 750000, tahun_ajaran: '2026/2027' },
  { id: 'nom-2', jenis_id: 'pay-1', kelas: 'VIII - Reguler B', nominal: 650000, tahun_ajaran: '2026/2027' },
];

const INITIAL_TAGIHAN: Tagihan[] = [
  { id: 'tag-1', santri_id: 's-santri1', jenis_id: 'pay-1', bulan: 'Juni', tahun: '2026', nominal: 750000, status: 'pending' },
  { id: 'tag-2', santri_id: 's-santri1', jenis_id: 'pay-1', bulan: 'Mei', tahun: '2026', nominal: 750000, status: 'lunas' },
  { id: 'tag-3', santri_id: 's-santri2', jenis_id: 'pay-1', bulan: 'Juni', tahun: '2026', nominal: 650000, status: 'pending' },
  { id: 'tag-4', santri_id: 's-santri2', jenis_id: 'pay-1', bulan: 'Mei', tahun: '2026', nominal: 650000, status: 'lunas' },
];

const INITIAL_PEMBAYARAN: Pembayaran[] = [
  { id: 'trans-1', tagihan_id: 'tag-2', order_id: 'SPP-s-santri1-Mei-2026-1717320000', metode: 'BCA Virtual Account', nominal: 750000, status: 'lunas', paid_at: '2026-05-02T08:35:00Z', created_at: '2026-05-02T08:30:00Z' },
  { id: 'trans-2', tagihan_id: 'tag-4', order_id: 'SPP-s-santri2-Mei-2026-1717330000', metode: 'QRIS Gopay', nominal: 650000, status: 'lunas', paid_at: '2026-05-03T14:22:00Z', created_at: '2026-05-03T14:20:00Z' },
];

const INITIAL_NOTIFIKASI: Notifikasi[] = [
  { id: 'not-1', user_id: 'p-wali1', judul: 'Setoran Hapalan Ahmad', pesan: 'Setoran hapalan Ahmad Zidni Mubarok telah diinput: Surah Al-Kahf Ayat 1-25 (mumtaz).', tipe: 'hapalan', ref_id: 'h-1', is_read: false, created_at: '2026-06-03T10:05:00Z' },
  { id: 'not-2', user_id: 'p-wali1', judul: 'Tagihan Baru Tersedia', pesan: 'Tagihan SPP Syahriyah bulan Juni 2026 sebesar Rp 750.000 telah tersedia untuk Ahmad.', tipe: 'tagihan', ref_id: 'tag-1', is_read: false, created_at: '2026-06-01T08:00:00Z' },
  { id: 'not-3', user_id: 'p-wali2', judul: 'Pelanggaran Fatimah', pesan: 'Ada pelanggaran baru tercatat untuk Fatimah Az-Zahra: Terlambat Berjamaah (5 poin).', tipe: 'pelanggaran', ref_id: 'p-1', is_read: false, created_at: '2026-06-01T06:10:00Z' },
];

const INITIAL_PENGUMUMAN: Pengumuman[] = [
  { id: 'ann-1', judul: 'Persiapan Ujian Semester Ganjil', pesan: 'Diberitahukan kepada seluruh wali santri bahwa pelaksanaan Ujian Semester Ganjil akan dimulai tanggal 20 Juni 2026. Mohon bimbingannya agar santri menjaga kesehatan dan melafalkan murajaah rutin di kamarnya masing-masing.', target: 'semua', created_by: 'p-admin', created_at: '2026-06-01T12:00:00Z' }
];

// ==========================================
// STORE MANAGER (PERSISTENCE LAYER FALLBACK)
// ==========================================

class LocalStore {
  private get<T>(key: string, preset: T): T {
    const data = localStorage.getItem(`mh_nursalam_${key}`);
    if (!data) {
      localStorage.setItem(`mh_nursalam_${key}`, JSON.stringify(preset));
      return preset;
    }
    try {
      return JSON.parse(data) as T;
    } catch {
      return preset;
    }
  }

  private set<T>(key: string, val: T): void {
    localStorage.setItem(`mh_nursalam_${key}`, JSON.stringify(val));
    // Emit dynamic event to trigger state updates in components for local realtime simulation
    window.dispatchEvent(new Event('mh_local_store_change'));
  }

  // Active getters
  getProfiles() {
    const list = this.get<Profile[]>('profiles', INITIAL_PROFILES);
    const hasAdminNursalam = list.some(p => p.email.toLowerCase() === 'adminnursalam@gmail.com');
    if (!hasAdminNursalam) {
      const updatedList = [
        {
          id: 'p-admin',
          role: 'admin' as const,
          full_name: 'Ustadz Ahmad Nur Salam, M.Pd.',
          email: 'adminnursalam@gmail.com',
          phone: '081234567890',
          is_active: true,
          password: 'admin',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
        },
        ...list.filter(p => p.role !== 'admin' && p.email?.toLowerCase() !== 'adminnursalam@gmail.com')
      ];
      this.set('profiles', updatedList);
      return updatedList;
    }
    return list;
  }
  setProfiles(v: Profile[]) { this.set('profiles', v); }

  getSantri() { return this.get<Santri[]>('santri', INITIAL_SANTRI); }
  setSantri(v: Santri[]) { this.set('santri', v); }

  getJenisPelanggaran() { return this.get<JenisPelanggaran[]>('jenis_pelanggaran', INITIAL_JENIS_PELANGGARAN); }
  setJenisPelanggaran(v: JenisPelanggaran[]) { this.set('jenis_pelanggaran', v); }

  getPelanggaran() { return this.get<Pelanggaran[]>('pelanggaran', INITIAL_PELANGGARAN); }
  setPelanggaran(v: Pelanggaran[]) { this.set('pelanggaran', v); }

  getSetoranHapalan() { return this.get<SetoranHapalan[]>('setoran_hapalan', INITIAL_SETORAN_HAPALAN); }
  setSetoranHapalan(v: SetoranHapalan[]) { this.set('setoran_hapalan', v); }

  getKategoriHapalan() { return this.get<KategoriHapalan[]>('kategori_hapalan', INITIAL_KATEGORI_HAPALAN); }
  setKategoriHapalan(v: KategoriHapalan[]) { this.set('kategori_hapalan', v); }

  insertKategoriHapalan(katInput: Omit<KategoriHapalan, 'id'>) {
    const list = this.getKategoriHapalan();
    const newId = `kat-${Date.now()}`;
    const newRecord: KategoriHapalan = {
      ...katInput,
      id: newId,
      created_at: new Date().toISOString()
    };
    this.setKategoriHapalan([...list, newRecord]);
    return newRecord;
  }

  getProgressHapalan() { return this.get<ProgressHapalan[]>('progress_hapalan', INITIAL_PROGRESS_HAPALAN); }
  setProgressHapalan(v: ProgressHapalan[]) { this.set('progress_hapalan', v); }

  getProfilPesantren() { return this.get<ProfilPesantren>('profil_pesantren', INITIAL_PROFIL_PESANTREN); }
  setProfilPesantren(v: ProfilPesantren) { this.set('profil_pesantren', v); }

  getPrograms() { return this.get<Program[]>('programs', INITIAL_PROGRAMS); }
  setPrograms(v: Program[]) { this.set('programs', v); }

  getBerita() { return this.get<Berita[]>('berita', INITIAL_BERITA); }
  setBerita(v: Berita[]) { this.set('berita', v); }

  getPSB() { return this.get<PSB>('psb', INITIAL_PSB); }
  setPSB(v: PSB) { this.set('psb', v); }

  getJenisPembayaran() { return this.get<JenisPembayaran[]>('jenis_pembayaran', INITIAL_JENIS_PEMBAYARAN); }
  setJenisPembayaran(v: JenisPembayaran[]) { this.set('jenis_pembayaran', v); }

  getNominalPembayaran() { return this.get<NominalPembayaran[]>('nominal_pembayaran', INITIAL_NOMINAL_PEMBAYARAN); }
  setNominalPembayaran(v: NominalPembayaran[]) { this.set('nominal_pembayaran', v); }

  getTagihan() { return this.get<Tagihan[]>('tagihan', INITIAL_TAGIHAN); }
  setTagihan(v: Tagihan[]) { this.set('tagihan', v); }

  getPembayaran() { return this.get<Pembayaran[]>('pembayaran', INITIAL_PEMBAYARAN); }
  setPembayaran(v: Pembayaran[]) { this.set('pembayaran', v); }

  getNotifikasi() { return this.get<Notifikasi[]>('notifikasi', INITIAL_NOTIFIKASI); }
  setNotifikasi(v: Notifikasi[]) { this.set('notifikasi', v); }

  getPengumuman() { return this.get<Pengumuman[]>('pengumuman', INITIAL_PENGUMUMAN); }
  setPengumuman(v: Pengumuman[]) { this.set('pengumuman', v); }

  // ----------------------------------------------------
  // DATABSE TRIGGERS EMBEDDED LOCALLY
  // ----------------------------------------------------

  // 1. Trigger after INSERT pelanggaran
  insertPelanggaran(pelanggaranInput: Omit<Pelanggaran, 'id' | 'created_at'>) {
    const list = this.getPelanggaran();
    const newId = `p-${Date.now()}`;
    const newRecord: Pelanggaran = {
      ...pelanggaranInput,
      id: newId,
      created_at: new Date().toISOString()
    };
    
    // Save record
    this.setPelanggaran([...list, newRecord]);

    // TRIGGER BEHAVIOR: select santri & kind of violation
    const sList = this.getSantri();
    const sInfo = sList.find(s => s.id === pelanggaranInput.santri_id);
    const jList = this.getJenisPelanggaran();
    const jpInfo = jList.find(jp => jp.id === pelanggaranInput.jenis_id);

    if (sInfo && sInfo.wali_id) {
      const v_jp_name = jpInfo ? jpInfo.nama : 'Pelanggaran';
      this.insertNotification({
        user_id: sInfo.wali_id,
        judul: 'Ada pelanggaran baru tercatat',
        pesan: `Ada pelanggaran baru tercatat untuk ${sInfo.nama}: ${v_jp_name} (${pelanggaranInput.poin} poin).`,
        tipe: 'pelanggaran',
        ref_id: newId,
        is_read: false
      });
    }

    return newRecord;
  }

  // 2. Trigger after INSERT setoran_hapalan
  insertSetoranHapalan(setoranInput: Omit<SetoranHapalan, 'id' | 'created_at'>) {
    const list = this.getSetoranHapalan();
    const newId = `h-${Date.now()}`;
    const targetKategoriId = setoranInput.kategori_id || 'kat-quran';
    const newRecord: SetoranHapalan = {
      ...setoranInput,
      kategori_id: targetKategoriId,
      id: newId,
      created_at: new Date().toISOString()
    };
    
    // Save record
    this.setSetoranHapalan([...list, newRecord]);

    // TRIGGER BEHAVIOR: Update progress_hapalan + send notification
    const sList = this.getSantri();
    const sInfo = sList.find(s => s.id === setoranInput.santri_id);

    // Update progress (only if it is Al-Qur'an program)
    if (targetKategoriId === 'kat-quran') {
      const progressList = this.getProgressHapalan();
      const pages = Number(setoranInput.jumlah_halaman) || 0;
      const juzGained = pages / 20.0; // 20 pages = 1 juz approx

      const existingProgressIndex = progressList.findIndex(ph => ph.santri_id === setoranInput.santri_id);
      if (existingProgressIndex >= 0) {
        const current = progressList[existingProgressIndex];
        const updatedTotalJuz = Math.min(Number(current.total_juz) + juzGained, 30.00);
        const updatedTotalHalaman = Number(current.total_halaman) + pages;
        progressList[existingProgressIndex] = {
          ...current,
          total_juz: Number(updatedTotalJuz.toFixed(2)),
          total_halaman: Number(updatedTotalHalaman.toFixed(2)),
          last_surah: setoranInput.surah_nama,
          updated_at: new Date().toISOString()
        };
        this.setProgressHapalan([...progressList]);
      } else {
        const newProgress: ProgressHapalan = {
          id: `ph-${Date.now()}`,
          santri_id: setoranInput.santri_id,
          total_juz: Number(Math.min(juzGained, 30.00).toFixed(2)),
          total_halaman: pages,
          last_surah: setoranInput.surah_nama,
          updated_at: new Date().toISOString()
        };
        this.setProgressHapalan([...progressList, newProgress]);
      }
    }

    // Send notification
    if (sInfo && sInfo.wali_id) {
      let notifMsg = '';
      if (targetKategoriId === 'kat-quran') {
        notifMsg = `Setoran hapalan ${sInfo.nama} telah diinput: Surah ${setoranInput.surah_nama} Ayat ${setoranInput.ayat_dari}-${setoranInput.ayat_sampai} (${setoranInput.nilai}).`;
      } else {
        const katsList = this.getKategoriHapalan();
        const kat = katsList.find(k => k.id === targetKategoriId);
        const katName = kat ? kat.nama : 'Lainnya';
        notifMsg = `Setoran hafalan [${katName}] ${sInfo.nama} telah diinput: "${setoranInput.surah_nama}" Bab/Bait ${setoranInput.ayat_dari}-${setoranInput.ayat_sampai} (${setoranInput.nilai}).`;
      }

      this.insertNotification({
        user_id: sInfo.wali_id,
        judul: 'Setoran hapalan telah diinput',
        pesan: notifMsg,
        tipe: 'hapalan',
        ref_id: newId,
        is_read: false
      });
    }

    return newRecord;
  }

  // 3. Trigger after INSERT tagihan
  insertTagihan(tagihanInput: Omit<Tagihan, 'id' | 'created_at'>) {
    const list = this.getTagihan();
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const newId = `tag-${Date.now()}-${uniqueSuffix}`;
    const newRecord: Tagihan = {
      ...tagihanInput,
      id: newId,
      created_at: new Date().toISOString()
    };
    this.setTagihan([...list, newRecord]);

    // TRIGGER BEHAVIOR
    const sList = this.getSantri();
    const sInfo = sList.find(s => s.id === tagihanInput.santri_id);
    const jList = this.getJenisPembayaran();
    const jInfo = jList.find(j => j.id === tagihanInput.jenis_id);

    if (sInfo && sInfo.wali_id) {
      const payName = jInfo ? jInfo.nama : 'Iuran';
      this.insertNotification({
        user_id: sInfo.wali_id,
        judul: 'Tagihan baru telah tersedia',
        pesan: `Tagihan ${payName} bulan ${tagihanInput.bulan} ${tagihanInput.tahun} sebesar Rp ${tagihanInput.nominal.toLocaleString('id-ID')} telah tersedia untuk ${sInfo.nama}.`,
        tipe: 'tagihan',
        ref_id: newId,
        is_read: false
      });
    }

    return newRecord;
  }

  // Bulk Insert Tagihan Batch
  insertTagihanBatch(tagihansInput: Omit<Tagihan, 'id' | 'created_at'>[]) {
    if (tagihansInput.length === 0) return [];
    const list = this.getTagihan();
    const sList = this.getSantri();
    const jList = this.getJenisPembayaran();
    const newRecords: Tagihan[] = [];

    tagihansInput.forEach((tagihanInput, index) => {
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      const newId = `tag-${Date.now()}-${index}-${uniqueSuffix}`;
      const newRecord: Tagihan = {
        ...tagihanInput,
        id: newId,
        created_at: new Date().toISOString()
      };
      newRecords.push(newRecord);

      // Trigger notification for each
      const sInfo = sList.find(s => s.id === tagihanInput.santri_id);
      const jInfo = jList.find(j => j.id === tagihanInput.jenis_id);

      if (sInfo && sInfo.wali_id) {
        const payName = jInfo ? jInfo.nama : 'Iuran';
        this.insertNotification({
          user_id: sInfo.wali_id,
          judul: 'Tagihan baru telah tersedia',
          pesan: `Tagihan ${payName} bulan ${tagihanInput.bulan} ${tagihanInput.tahun} sebesar Rp ${tagihanInput.nominal.toLocaleString('id-ID')} telah tersedia untuk ${sInfo.nama}.`,
          tipe: 'tagihan',
          ref_id: newId,
          is_read: false
        });
      }
    });

    this.setTagihan([...list, ...newRecords]);
    return newRecords;
  }

  // 4. Trigger after UPDATE pembayaran SET status='lunas'
  confirmPayment(pembayaranId: string, method?: string) {
    const pList = this.getPembayaran();
    const pIdx = pList.findIndex(p => p.id === pembayaranId);
    if (pIdx >= 0) {
      const pRecord = pList[pIdx];
      pRecord.status = 'lunas';
      pRecord.metode = method || 'Midtrans Settle';
      pRecord.paid_at = new Date().toISOString();
      pRecord.updated_at = new Date().toISOString();
      pList[pIdx] = pRecord;
      this.setPembayaran([...pList]);

      // TRIGGER: Settle Tagihan
      const tList = this.getTagihan();
      const tIdx = tList.findIndex(t => t.id === pRecord.tagihan_id);
      if (tIdx >= 0) {
        const tRecord = tList[tIdx];
        
        const originalNominal = tRecord.nominal;
        const paidAmount = pRecord.nominal;
        let isCicilan = false;
        let sisa = 0;

        if (paidAmount < originalNominal) {
          isCicilan = true;
          sisa = originalNominal - paidAmount;
          tRecord.nominal = sisa; // update tagihan to remaining deficit
          tRecord.status = 'pending'; // remains pending for the sisa
        } else {
          tRecord.status = 'lunas';
        }
        
        tList[tIdx] = tRecord;
        this.setTagihan([...tList]);

        // TRIGGER: Notify Wali Santri
        const sList = this.getSantri();
        const sInfo = sList.find(s => s.id === tRecord.santri_id);
        const jList = this.getJenisPembayaran();
        const jInfo = jList.find(j => j.id === tRecord.jenis_id);

        if (sInfo && sInfo.wali_id) {
          const payName = jInfo ? jInfo.nama : 'Iuran';
          const msgPesan = isCicilan 
            ? `Pembayaran CICILAN ${payName} bulan ${tRecord.bulan}/${tRecord.tahun} sebesar Rp ${paidAmount.toLocaleString('id-ID')} telah dikonfirmasi diterima. Sisa kekurangan tunggakan: Rp ${sisa.toLocaleString('id-ID')}`
            : `Pembayaran tagihan ${payName} bulan ${tRecord.bulan}/${tRecord.tahun} sebesar Rp ${paidAmount.toLocaleString('id-ID')} telah dikonfirmasi LUNAS. Alhamdulillah!`;
            
          this.insertNotification({
            user_id: sInfo.wali_id,
            judul: isCicilan ? 'Cicilan Pembayaran Diterima' : 'Pembayaran Telah Lunas',
            pesan: msgPesan,
            tipe: 'pembayaran',
            ref_id: pRecord.id,
            is_read: false
          });
        }
      }
    }
  }

  // Helper notification creator
  insertNotification(notifInput: Omit<Notifikasi, 'id' | 'created_at'>) {
    const list = this.getNotifikasi();
    const newRecord: Notifikasi = {
      ...notifInput,
      id: `not-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.setNotifikasi([newRecord, ...list]);
  }
}

export const dbLocal = new LocalStore();
