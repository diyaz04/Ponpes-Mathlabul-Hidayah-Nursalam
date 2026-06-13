import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Clock, Heart, Award, CheckCircle2, 
  MapPin, Phone, Mail, LogIn, ChevronRight, GraduationCap, 
  User, ShieldAlert, CreditCard, ShieldCheck, Newspaper,
  ChevronDown, ArrowRight, Star, Activity, Check, Calendar,
  TrendingUp, ArrowUpRight, ArrowDownRight, Menu, X, Share2, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Footer } from '../layout/Footer';
import { db } from '../../lib/supabase';
import { ProfilPesantren } from '../../types';
import { MATHLABUL_HIDAYAH_LOGO_URL } from '../../lib/branding';

interface LandingPageProps {
  beritaList: any[];
  handleManualLogin: (e: React.FormEvent, email: string, pass: string) => void;
  loginError: string | null;
}

export function LandingPage({ 
  beritaList, 
  handleManualLogin, 
  loginError 
}: LandingPageProps) {
  
  const [profilPP, setProfilPP] = useState<ProfilPesantren | null>(null);

  useEffect(() => {
    db.profilPesantren()
      .then(setProfilPP)
      .catch((error) => console.error('[Supabase Profil Pesantren Load Failure]', error));
  }, []);

  // news index for dynamic hero news swap
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const activeBerita = (beritaList || []).filter(b => b.is_published);

  // Auto rotation of dynamic news swap
  useEffect(() => {
    if (profilPP?.hero_type === 'dinamis' && activeBerita.length > 1) {
      const interval = setInterval(() => {
        setCurrentNewsIndex((prev) => (prev + 1) % activeBerita.length);
      }, 7000); 
      return () => clearInterval(interval);
    }
  }, [profilPP?.hero_type, activeBerita.length]);

  // Current active page tab
  const [activeTab, setActiveTab] = useState<'beranda' | 'profil' | 'program' | 'berita' | 'faq' | 'psb' | 'masuk'>('beranda');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States for selected news and share toast
  const [selectedBerita, setSelectedBerita] = useState<any | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Share handler
  const handleShareBerita = async (e: React.MouseEvent, berita: any) => {
    e.stopPropagation();
    const title = berita.judul;
    const bodyText = berita.konten || berita.isi || '';
    const dateText = new Date(berita.tanggal_publish || berita.tanggal || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const textToCopy = `*${title}*\n📅 ${dateText}\n\n${bodyText.substring(0, 160)}...\n\nBaca warta lengkapnya di Portal Mathlabul Hidayah:\n${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: bodyText.substring(0, 140) + '...',
          url: window.location.origin
        });
        return;
      } catch (err) {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2200);
    } catch (err) {
      // clip read/write permission failed or unsupported
    }
  };

  // Local time greeting
  const [greeting, setGreeting] = useState('Selamat Datang');
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 11) setGreeting('Selamat Pagi 🌅');
    else if (hrs < 15) setGreeting('Selamat Siang ☀️');
    else if (hrs < 19) setGreeting('Selamat Sore 🌆');
    else setGreeting('Selamat Malam 🌙');
  }, []);

  // Login Form States (manual)
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  // Daily Routine Active Tab
  const [activeRoutineTab, setActiveRoutineTab] = useState<'shubuh' | 'madrasah' | 'tahfidz' | 'malam'>('shubuh');

  // FAQ Accordion States
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Active Facility Highlight State
  const [activeFacility, setActiveFacility] = useState<number | string>(0);

  // PSB State
  const [psbNama, setPsbNama] = useState('');
  const [psbNisn, setPsbNisn] = useState('');
  const [psbKelas, setPsbKelas] = useState('VII');
  const [psbWali, setPsbWali] = useState('');
  const [psbPhone, setPsbPhone] = useState('');
  const [psbSuccess, setPsbSuccess] = useState(false);

  // Interactive Huffazh Simulator (Previewing Dashboard power!)
  const [simSurah, setSimSurah] = useState('An-Naba\'');
  const [simAyat, setSimAyat] = useState('1 - 20');
  const [simStatus, setSimStatus] = useState<'Lancar' | 'Sedang' | 'Murojaah'>('Lancar');
  const [simHafalanList, setSimHafalanList] = useState([
    { id: 1, tanggal: 'Hari Ini', surah: 'An-Naba\'', ayat: '1 - 20', status: 'Lancar', ustadz: 'Ustadz Ahmad Fauzi' },
    { id: 2, tanggal: 'Kemarin', surah: 'An-Nazi\'at', ayat: '1 - 46', status: 'Sedang', ustadz: 'Ustadz Ahmad Fauzi' },
    { id: 3, tanggal: '3 Hari Lalu', surah: 'Abasa', ayat: '1 - 42', status: 'Murojaah', ustadz: 'Ustadz Ahmad Fauzi' }
  ]);

  const handleSimulateSetoran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSurah || !simAyat) return;
    const newRecord = {
      id: Date.now(),
      tanggal: 'Baru Saja',
      surah: simSurah,
      ayat: simAyat,
      status: simStatus,
      ustadz: 'Ustadz Ahmad Fauzi'
    };
    setSimHafalanList([newRecord, ...simHafalanList.slice(0, 2)]);
    setSimSurah('');
    setSimAyat('');
  };

  const handlePsbSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!psbNama || !psbNisn || !psbWali || !psbPhone) return;
    setPsbSuccess(true);
    setTimeout(() => {
      setPsbSuccess(false);
      setPsbNama('');
      setPsbNisn('');
      setPsbWali('');
      setPsbPhone('');
    }, 4000);
  };

  // Static Data lists
  const defaultRoutines = {
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
        { time: '07.15', activity: 'KBM Formal (MTs / MA Mathlabul Hidayah)' },
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
  };

  const defaultFacilities = [
    {
      id: 0,
      title: 'Masjid Jami\' Al-Akbar',
      desc: 'Pusat ibadah harian berkapasitas 800 jamaah dengan tata udara sejuk dan perpustakaan literatur kitab klasik terlengkap.',
      icon: BookOpen,
      badge: 'Ibadah Pusat'
    },
    {
      id: 1,
      title: 'Halaqah Tahfidz Indoor & Outdoor',
      desc: 'Area belajar tahfidz dikelilingi pepohonan rindang dan taman asri yang mendukung ketenangan serta kemudahan konsentrasi.',
      icon: Sparkles,
      badge: 'Fokus Belajar'
    },
    {
      id: 2,
      title: 'Asrama Syar\'i & Sehat',
      desc: 'Kamar asrama yang higienis, berventilasi optimal, dilengkapi lemari pribadi, ranjang bertingkat berstandar, serta dipantau musyrif asrama.',
      icon: ShieldCheck,
      badge: 'Nyaman'
    },
    {
      id: 3,
      title: 'Lab Mutimedia & Bahasa Arab-Inggris',
      desc: 'Sarana modern untuk menunjang kecakapan bilingual interaktif berbasis immersion camp dan pemantauan sistem cloud operasional.',
      icon: GraduationCap,
      badge: 'Modern'
    }
  ];

  const defaultTestimonials = [
    {
      id: 1,
      name: 'H. Kurniawan Adi',
      city: 'Bandung (Wali Santri Fatih)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?mx=100&q=80',
      rating: 5,
      words: 'Masyallah, lewat portal akademik Mathlabul Hidayah saya bisa memantau setoran hafalan Fatih setiap subuh meskipun saya tinggal jauh di Bandung. Berita asrama dan invoice SPP pun transparan tanpa perlu menebak-nebak.'
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
  ];

  const defaultPrograms = [
    {
      id: 1,
      title: 'Tahfidz Quran Mutqin',
      desc: 'Metode akselerasi talaqqi menyetor 1 halaman per hari bersertifikat sanad hafidz mutqin di bawah pengawasan asatidzah sanad Madinah.',
      icon: 'BookOpen',
      badge: 'Sabaq, Sabqi, Manzil',
      tone: 'green'
    },
    {
      id: 2,
      title: 'Kajian Kitab Turots',
      desc: 'Pendalaman keilmuan madzhab Syafiiyyah, aqidah Asyariyah, dan tasawuf bersanad menggunakan khazanah rujukan kitab kuning utama.',
      icon: 'GraduationCap',
      badge: 'Fathul Qorib, Talim Mutaallim',
      tone: 'indigo'
    },
    {
      id: 3,
      title: 'Bilingual Immersion Camp',
      desc: 'Penerapan bahasa Arab dan Inggris harian asrama secara aktif menggunakan asrama bahasa khusus dengan mutabaah mingguan.',
      icon: 'ShieldCheck',
      badge: 'Active Speaking & Debate',
      tone: 'amber'
    },
    {
      id: 4,
      title: 'Pendidikan Formal MTs/MA',
      desc: 'Lembaga Madrasah Tsanawiyyah dan Madrasah Aliyah berakreditasi A, membina ilmu umum eksakta modern penunjang studi lanjut.',
      icon: 'Activity',
      badge: 'Kurikulum Kementerian Agama',
      tone: 'rose'
    }
  ];

  const defaultFaqs = [
    {
      q: 'Bagaimana wali santri memantau perkembangan hafalan Al-Quran?',
      a: 'Setiap kali santri menyetor hafalan kepada Ustadz pengampu di halaqah subuh/ashar, data setoran langsung diinput ke sistem. Wali santri dapat melihat rekam jejak lengkap hafalan melalui akun Portal Wali masing-masing.'
    },
    {
      q: 'Apakah biaya SPP dan uang pendaftaran dapat dibayar cicil?',
      a: 'Ya, Mathlabul Hidayah menyediakan skema kuitansi digital transparan. Pembayaran dapat dikonfirmasi lewat upload tanda bukti transfer di Portal Wali.'
    },
    {
      q: 'Bagaimana prosedur penanganan pelanggaran santri?',
      a: 'Pesantren menggunakan sistem poin kedisiplinan yang berimbang. Laporan pelanggaran langsung tersinkronisasi ke dashboard wali santri sebagai media evaluasi bersama.'
    },
    {
      q: 'Apakah calon santri baru wajib memiliki hafalan Al-Quran sebelum mendaftar?',
      a: 'Tidak wajib. Kami memiliki program kelas persiapan selama 3 bulan pertama untuk memantapkan bacaan sesuai tajwid sebelum santri memulai menghafal Al-Quran.'
    }
  ];

  const defaultSectionTitles = {
    program: {
      eyebrow: 'Kurikulum Khusus Terarah',
      title: '4 Pilar Kurikulum Unggulan Ponpes',
      desc: 'Dirancang seimbang guna membidani kesiapan santri berkhidmah kepada masyarakat dan melanjutkan ke universitas ternama'
    },
    routine: {
      eyebrow: 'Agenda Harian',
      title: 'Bagaimana Keseharian Santri Mukim?',
      desc: 'Kami mengedepankan pembiasaan disiplin positif dan keseimbangan asupan ilmu, jasmani, gizi, dan waktu istirahat yang proporsional.'
    },
    facilities: {
      eyebrow: 'Fasilitas Pesantren',
      title: 'Sarana Penunjang Terbaik Hafizh',
      desc: 'Kami menginvestasikan sarana infrastruktur modern demi menjamin asrama yang sehat, aman, dan nyaman selama santri menempuh pendidikan.'
    },
    testimonials: {
      eyebrow: 'Testimoni Wali & Tokoh',
      title: 'Apa Kata Mereka Tentang Kami?',
      desc: 'Kami bangga mengutamakan kepuasan, kejujuran, dan sinergi bimbingan harian tervalidasi.'
    },
    psb: {
      eyebrow: 'PENERIMAAN SANTRI BARU T.A 2026/2027',
      title: 'Formulir Pendaftaran Online',
      desc: 'Pendaftaran kelas MTs (SMP) dan MA (SMA) terakreditasi resmi Pemerintah'
    },
    berita: {
      eyebrow: 'Rilis Kegiatan',
      title: 'Kajian & Warta Ponpes Terbaru',
      desc: 'Informasi autentik keseharian lingkungan asrama santri KH. Nursalam'
    },
    faq: {
      eyebrow: 'Informasi Umum',
      title: 'Pertanyaan Yang Sering Diajukan (FAQ)',
      desc: 'Kami mengumpulkan pertanyaan utama orangtua wali saat mendaftarkan putra-putrinya'
    }
  };

  const programToneClasses: Record<string, { box: string; icon: string; badge: string }> = {
    green: { box: 'bg-white border-slate-200/80', icon: 'bg-green-50 text-green-700 border-green-100', badge: 'text-green-700 bg-green-50' },
    indigo: { box: 'bg-white border-slate-200/80', icon: 'bg-indigo-50 text-indigo-700 border-indigo-100', badge: 'text-indigo-700 bg-indigo-50' },
    amber: { box: 'bg-white border-slate-200/80', icon: 'bg-amber-50 text-amber-700 border-amber-100', badge: 'text-amber-700 bg-amber-50' },
    rose: { box: 'bg-white border-slate-200/80', icon: 'bg-rose-50 text-rose-700 border-rose-100', badge: 'text-rose-700 bg-rose-50' }
  };

  const getProgramIcon = (icon?: string) => {
    if (icon === 'GraduationCap') return GraduationCap;
    if (icon === 'ShieldCheck') return ShieldCheck;
    if (icon === 'Activity') return Activity;
    if (icon === 'Sparkles') return Sparkles;
    return BookOpen;
  };

  const getRoutines = () => {
    if (profilPP?.routines_json) {
      try {
        return JSON.parse(profilPP.routines_json);
      } catch (e) {
        // fallback
      }
    }
    return defaultRoutines;
  };

  const getFacilities = () => {
    if (profilPP?.facilities_json) {
      try {
        const parsed = JSON.parse(profilPP.facilities_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            ...item,
            icon: item.icon === 'BookOpen' ? BookOpen :
                  item.icon === 'Sparkles' ? Sparkles :
                  item.icon === 'ShieldCheck' ? ShieldCheck :
                  item.icon === 'GraduationCap' ? GraduationCap : BookOpen
          }));
        }
      } catch (e) {
        // fallback
      }
    }
    return defaultFacilities;
  };

  const getTestimonials = () => {
    if (profilPP?.testimonials_json) {
      try {
        const parsed = JSON.parse(profilPP.testimonials_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return defaultTestimonials;
  };

  const getPrograms = () => {
    if (profilPP?.programs_json) {
      try {
        const parsed = JSON.parse(profilPP.programs_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return defaultPrograms;
  };

  const getFaqs = () => {
    if (profilPP?.faq_json) {
      try {
        const parsed = JSON.parse(profilPP.faq_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return defaultFaqs;
  };

  const getSectionTitles = () => {
    if (profilPP?.section_titles_json) {
      try {
        const parsed = JSON.parse(profilPP.section_titles_json);
        return Object.keys(defaultSectionTitles).reduce((acc: any, key) => ({
          ...acc,
          [key]: { ...(defaultSectionTitles as any)[key], ...(parsed?.[key] || {}) }
        }), {});
      } catch (e) {
        // fallback
      }
    }
    return defaultSectionTitles;
  };

  const routines = getRoutines();
  const facilities = getFacilities();
  const testimonials = getTestimonials();
  const programs = getPrograms();
  const faqs = getFaqs();
  const sectionTitles = getSectionTitles();
  const selectedFacility = facilities.find((fac: any) => fac.id === activeFacility) || facilities[0];

  return (
    <div className="flex flex-col flex-1 w-full relative bg-slate-50 overflow-x-hidden min-h-screen">
      
      {/* Header Sticky Floating Navigation Bar */}
      <nav className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-20 px-4 sm:px-6 lg:px-12 flex items-center justify-between z-40 select-none shadow-xs">
        <div 
          onClick={() => {
            setActiveTab('beranda');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
        >
          <div className="relative w-11 h-11 bg-gradient-to-tr from-green-50 to-emerald-100 p-0.5 rounded-2xl flex items-center justify-center shadow-md border border-green-500/20 group-hover:scale-105 transition-all duration-300">
            {/* Professional golden ring decoration wrapper */}
            <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/40 scale-[1.04]" />
            <img 
              src="https://lh3.googleusercontent.com/d/1HPt7BpZfaeWheB8rJCHwEcrfCQhkKdop" 
              alt="Logo Mathlabul Hidayah"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-xl relative z-10"
            />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-wider uppercase leading-tight text-slate-800">MATHLABUL HIDAYAH</h1>
            <p className="text-[9px] sm:text-[10px] text-green-700 font-extrabold uppercase tracking-widest leading-none mt-0.5">Nursalam Islamic Ponpes</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-7 text-xs font-bold text-slate-500">
          <button 
            onClick={() => setActiveTab('beranda')} 
            className={`transition-all uppercase tracking-wider cursor-pointer bg-transparent border-0 py-1 ${activeTab === 'beranda' ? 'text-green-700 font-black border-b-2 border-green-700' : 'hover:text-green-700 text-slate-500'}`}
          >
            Beranda
          </button>
          <button 
            onClick={() => setActiveTab('profil')} 
            className={`transition-all uppercase tracking-wider cursor-pointer bg-transparent border-0 py-1 ${activeTab === 'profil' ? 'text-green-700 font-black border-b-2 border-green-700' : 'hover:text-green-700 text-slate-500'}`}
          >
            Profil
          </button>
          <button 
            onClick={() => setActiveTab('program')} 
            className={`transition-all uppercase tracking-wider cursor-pointer bg-transparent border-0 py-1 ${activeTab === 'program' ? 'text-green-700 font-black border-b-2 border-green-700' : 'hover:text-green-700 text-slate-500'}`}
          >
            Program
          </button>
          <button 
            onClick={() => setActiveTab('berita')} 
            className={`transition-all uppercase tracking-wider cursor-pointer bg-transparent border-0 py-1 ${activeTab === 'berita' ? 'text-green-700 font-black border-b-2 border-green-700' : 'hover:text-green-700 text-slate-500'}`}
          >
            Berita & Kajian
          </button>
          <button 
            onClick={() => setActiveTab('faq')} 
            className={`transition-all uppercase tracking-wider cursor-pointer bg-transparent border-0 py-1 ${activeTab === 'faq' ? 'text-green-700 font-black border-b-2 border-green-700' : 'hover:text-green-700 text-slate-500'}`}
          >
            Tanya Jawab
          </button>
          <button 
            onClick={() => setActiveTab('psb')} 
            className={`transition-all uppercase tracking-wider px-3 py-1.5 rounded-full border cursor-pointer ${activeTab === 'psb' ? 'bg-emerald-600 text-white border-emerald-600 font-black' : 'text-emerald-800 bg-emerald-50 border-emerald-250/20 hover:bg-emerald-100/80'}`}
          >
            PSB Online
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('masuk')}
          className={`hidden lg:flex px-5 py-2.5 text-xs font-bold rounded-xl transition-all items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${activeTab === 'masuk' ? 'bg-green-800 text-white' : 'bg-green-700 hover:bg-green-800 text-white'}`}
        >
          <LogIn className="w-4 h-4" /> Masuk Portal
        </button>

        {/* Mobile Three-stripe hamburger button on the right */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 text-slate-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition cursor-pointer"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Drawer Navigation with overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-[2px]"
            />
            {/* Side Drawer Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-76 max-w-[85%] bg-white z-50 lg:hidden shadow-3xl flex flex-col p-6 text-left select-none overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10 bg-gradient-to-tr from-green-50 to-emerald-100 p-0.5 rounded-xl flex items-center justify-center shadow-xs border border-green-500/20">
                    <div className="absolute inset-0 rounded-xl border border-amber-400/40 scale-[1.04]" />
                    <img 
                      src="https://lh3.googleusercontent.com/d/1HPt7BpZfaeWheB8rJCHwEcrfCQhkKdop" 
                      alt="Logo Mathlabul Hidayah"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain rounded-lg relative z-10"
                    />
                  </div>
                  <div>
                    <h2 className="text-xs font-black tracking-wider uppercase text-slate-800">MATHLABUL HIDAYAH</h2>
                    <p className="text-[9px] text-green-700 font-bold uppercase tracking-widest leading-none mt-0.5">Nursalam</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-3">MENU UTAMA</span>
                  {[
                    { id: 'beranda', label: 'Beranda' },
                    { id: 'profil', label: 'Profil' },
                    { id: 'program', label: 'Program' },
                    { id: 'berita', label: 'Berita & Kajian' },
                    { id: 'faq', label: 'Tanya Jawab' },
                    { id: 'psb', label: 'PSB Online' },
                  ].map((menu) => {
                    const isActive = activeTab === menu.id;
                    return (
                      <button
                        key={menu.id}
                        onClick={() => {
                          setActiveTab(menu.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-green-50 text-green-800 font-black shadow-xs'
                            : 'text-slate-600 hover:bg-slate-55/40 hover:text-slate-900'
                        }`}
                      >
                        <span>{menu.label}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-green-700 translate-x-0.5' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-3">AKSES SISTEM</span>
                  <button
                    onClick={() => {
                      setActiveTab('masuk');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <LogIn className="w-4 h-4" /> Masuk Portal Akademik
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="flex-1 w-full flex flex-col"
        >
          {activeTab === 'beranda' && (
            <>
              {/* ========================================== */}
              {/* SECTION 1: HERO BANNER */}
              {/* ========================================== */}
              <section id="beranda" className="relative py-20 lg:py-32 px-6 lg:px-12 overflow-hidden" style={{
                background: profilPP?.hero_bg_color || 'linear-gradient(to bottom, #ecfdf5, #f8fafc, #f8fafc)'
              }}>
                {profilPP?.hero_img_url && (
                  <div 
                    className="absolute inset-0 pointer-events-none transition-all duration-700"
                    style={{
                      backgroundImage: `url(${profilPP.hero_img_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: profilPP.hero_img_opacity !== undefined ? Number(profilPP.hero_img_opacity) : 0.12,
                      zIndex: 0
                    }}
                  />
                )}
                <div className="max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center relative z-10">
                  
                  {profilPP?.hero_type === 'dinamis' && activeBerita.length > 0 && activeBerita[currentNewsIndex] ? (
                    // Dynamic News Hero Style
                    <motion.div 
                      key={activeBerita[currentNewsIndex].id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6 flex flex-col items-center w-full"
                    >
                      <span className="px-3.5 py-1.5 bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 inline-flex items-center gap-1.5 shadow-sm">
                        <Newspaper className="w-3.5 h-3.5 text-amber-700 shrink-0" /> BERITA TERKINI & PORTAL WARTA WAJIB ({currentNewsIndex + 1}/{activeBerita.length})
                      </span>
                      
                      <h1 className="text-3xl lg:text-5xl font-black text-slate-800 leading-tight tracking-tight max-w-3xl">
                        {activeBerita[currentNewsIndex].judul}
                      </h1>
                      
                      <p className="text-xs lg:text-sm font-medium text-slate-600 leading-relaxed max-w-2xl line-clamp-3">
                        {activeBerita[currentNewsIndex].konten}
                      </p>

                      <div className="flex flex-wrap justify-center gap-3.5 pt-2">
                        <button 
                          onClick={() => {
                            setSelectedBerita(activeBerita[currentNewsIndex]);
                          }}
                          className="px-6 py-3 bg-green-755/90 hover:bg-green-800 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                        >
                          Baca Berita Lengkap <ArrowUpRight className="w-4 h-4" />
                        </button>
                        {activeBerita.length > 1 && (
                          <button 
                            onClick={() => {
                              setCurrentNewsIndex((prev) => (prev + 1) % activeBerita.length);
                            }}
                            className="px-4 py-3 bg-white/90 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                          >
                            Warta Berikutnya <ChevronRight className="w-4 h-4 text-slate-550" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    // Static Hero Style
                    <div className="space-y-8 flex flex-col items-center">
                      <span className="px-3.5 py-1.5 bg-green-100/80 text-green-905 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200 inline-flex items-center gap-1.5 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-green-700 shrink-0" /> {profilPP?.nama || 'PONDOK PESANTREN MODERN KH. NURSALAM'}
                      </span>
                      
                      <h1 className="text-4xl lg:text-6xl font-black text-slate-800 leading-tight tracking-tight">
                        {profilPP?.tagline ? profilPP.tagline.split(',')[0] : 'Mendidik Akhlaqul Karimah'}, <br/>
                        <span className="bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                          {profilPP?.tagline && profilPP.tagline.split(',')[1] ? profilPP.tagline.split(',')[1].trim() : 'Membentuk Huffazh Mandiri'}
                        </span>
                      </h1>
                      
                      <p className="text-sm lg:text-base font-medium text-slate-550 leading-relaxed max-w-2xl">
                        {profilPP?.deskripsi || 'Sinergi bimbingan huffazh thariqah Ahlussunnah wal Jama\'ah terintegrasi kurikulum tahfidz unggulan, asrama binaan bilingual, dan kemudahan pengawasan akademik wali santri berbasis cloud.'}
                      </p>

                      <div className="flex flex-wrap justify-center gap-3.5 pt-2">
                        <button 
                          onClick={() => setActiveTab('psb')}
                          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg border border-emerald-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                        >
                          Daftar Santri Baru (PSB) <ArrowRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setActiveTab('masuk')}
                          className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                        >
                          Portal Akademik & Simulasi <LogIn className="w-4 h-4 text-green-700" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Informative Info Row */}
                  <div className="pt-8 border-t border-slate-200/80 w-full max-w-2xl grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-black text-slate-800">TERAKREDITASI A</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Kemenag RI</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-slate-800">BEASISWA PENUH</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Yatim & Dhuafa</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-slate-800">DIGITAL PORTAL</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Laporan Transparan</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ========================================== */}
              {/* SECTION 2: STATS SUMMARY BOARD */}
              {/* ========================================== */}
              <section className="py-12 bg-slate-900 text-white select-none relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_40%)]"></div>
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
                  <div>
                    <h4 className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                      {profilPP?.stats_santri_val || '450+'}
                    </h4>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mt-1.5">
                      {profilPP?.stats_santri_lbl || 'Santri Aktif Mukim'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                      {profilPP?.stats_halaqah_val || '22+'}
                    </h4>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mt-1.5">
                      {profilPP?.stats_halaqah_lbl || 'Halaqah Tahfidzul Quran'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                      {profilPP?.stats_spp_val || '100%'}
                    </h4>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mt-1.5">
                      {profilPP?.stats_spp_lbl || 'Lunas Verifikasi SPP Digital'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                      {profilPP?.stats_satisfaction_val || '98.5%'}
                    </h4>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mt-1.5">
                      {profilPP?.stats_satisfaction_lbl || 'Indeks Kepuasan Pengawasan'}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'profil' && (
            <>
              {/* ========================================== */}
              {/* SECTION 3: SEJARAH & PROFIL SINGKAT */}
              {/* ========================================== */}
              <section id="profil" className="py-20 bg-white px-6 lg:px-12 select-none">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                  <span className="text-green-700 text-xs font-black uppercase tracking-widest leading-none block">
                    {profilPP?.sejarah_sub || 'Sejarah & Semangat'}
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-snug">
                    {profilPP?.sejarah_title || 'Cahaya Tarbiyah Islamiyah Sejak Tahun 1998'}
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-500 max-w-2xl mx-auto whitespace-pre-line">
                    {profilPP?.sejarah || 'Bermula dari cita-cita luhur gurenda KH. Nursalam bin Hadi untuk menyediakan prasarana pendidikan yatim dhuafa dan thalabul ilmi gratis di pesisir Indramayu. Kini berkembang menjadi instrumen pendidikan modern terkemuka dengan sistem akademik harian tervalidasi.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">V</div>
                        <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Visi:</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                        {profilPP?.visi || 'Terwujudnya lembaga pendidikan islam percontohan nasional dalam membentuk pribadi muslim berkemampuan tahfidz handal, mandiri, berakhlaqul karimah, & berlandaskan aqidah Ahlussunnah wal Jama\'ah.'}
                      </p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">M</div>
                        <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Misi:</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                        {profilPP?.misi || 'Menyelenggarakan thariqah bimbingan tahfidzul quran bersahaja, menegakkan tradisi kedisiplinan akhlaq asrama pesantren, penyediaan makanan asri, dilaunching pengawasan sarana IT mutakhir terpercaya.'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'program' && (
            <>
              {/* ========================================== */}
              {/* SECTION 4: PROGRAM UNGGULAN (CURRICULUM) */}
              {/* ========================================== */}
      <section id="program" className="py-20 bg-slate-50 px-6 lg:px-12 select-none border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-green-700 text-xs font-black uppercase tracking-widest leading-none block">{sectionTitles.program.eyebrow}</span>
            <h2 className="text-3xl font-black text-slate-800">{sectionTitles.program.title}</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">{sectionTitles.program.desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {programs.map((program: any, index: number) => {
              const Icon = getProgramIcon(program.icon);
              const tone = programToneClasses[program.tone || 'green'] || programToneClasses.green;
              return (
                <div key={program.id || index} className={`${tone.box} p-6 rounded-3xl border space-y-4 hover:shadow-lg transition-all hover:-translate-y-1`}>
                  <div className={`p-3.5 w-fit rounded-2xl border ${tone.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">{program.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{program.desc}</p>
                  {program.badge && (
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block ${tone.badge}`}>{program.badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 5: INTERACTIVE DAILY ROUTINE DIARY */}
      {/* ========================================== */}
      <section className="py-20 bg-white px-6 lg:px-12 select-none border-b border-slate-200/50">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-green-700 text-xs font-black uppercase tracking-widest leading-none block">{sectionTitles.routine.eyebrow}</span>
            <h2 className="text-3xl font-black text-slate-800">{sectionTitles.routine.title}</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{sectionTitles.routine.desc}</p>
          </div>

          {/* Interactive tabs navigation */}
          <div className="flex justify-center flex-wrap gap-2">
            {(['shubuh', 'madrasah', 'tahfidz', 'malam'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveRoutineTab(tab)}
                className={`px-5 py-2.5 text-xs font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                  activeRoutineTab === tab 
                    ? 'bg-green-700 border-green-700 text-white shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab === 'shubuh' && '🌅 Subuh & Zikir'}
                {tab === 'madrasah' && '☀️ Madrasah'}
                {tab === 'tahfidz' && '🌇 Sore Murojaah'}
                {tab === 'malam' && '🌙 Takrar Malam'}
              </button>
            ))}
          </div>

          {/* Tab content display with list cards */}
          <div className="bg-slate-50 p-6 lg:p-8 rounded-3xl border border-slate-200 max-w-3xl mx-auto space-y-6">
            <div className="space-y-1 text-left">
              <h3 className="text-base font-black text-slate-800 uppercase flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-700 shrink-0" />
                {routines[activeRoutineTab].title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{routines[activeRoutineTab].description}</p>
            </div>

            <div className="space-y-3 text-left">
              {routines[activeRoutineTab].items.map((item, id) => (
                <div key={id} className="bg-white p-4 rounded-xl border border-slate-150 flex items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-green-50 text-green-900 border border-green-200 font-mono text-xs font-black rounded-lg">
                      {item.time}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{item.activity}</span>
                  </div>
                  <Check className="w-4 h-4 text-green-600 shrink-0 bg-green-50 p-0.5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
            </>
          )}

          {activeTab === 'profil' && (
            <>
              {/* ========================================== */}
              {/* SECTION 7: DETAILED COMPACT FACILITIES */}
              {/* ========================================== */}
      <section className="py-20 bg-white px-6 lg:px-12 select-none border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-green-700 text-xs font-black uppercase tracking-widest leading-none block">{sectionTitles.facilities.eyebrow}</span>
            <h2 className="text-3xl font-black text-slate-800">{sectionTitles.facilities.title}</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{sectionTitles.facilities.desc}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* List side: left side clickable menu-like card list */}
            <div className="lg:col-span-5 space-y-3">
              {facilities.map((fac) => {
                const Icon = fac.icon;
                const isSelected = activeFacility === fac.id;
                return (
                  <button
                    key={fac.id}
                    onClick={() => setActiveFacility(fac.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.01]'
                        : 'bg-slate-50 border-slate-205/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected ? 'bg-green-500 text-slate-950' : 'bg-green-50 text-green-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wide">{fac.title}</h4>
                        <span className={`text-[8px] font-bold uppercase px-1.5 rounded-full ${
                          isSelected ? 'bg-white/10 text-green-300' : 'bg-slate-200/60 text-slate-500'
                        }`}>{fac.badge}</span>
                      </div>
                      <p className={`text-[10px] leading-relaxed line-clamp-1 ${
                        isSelected ? 'text-slate-350' : 'text-slate-400'
                      }`}>{fac.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Display spotlight: right side beautiful layout of selected facility */}
            <div className="lg:col-span-7 bg-slate-50 p-6 lg:p-10 rounded-4xl border border-slate-200 shadow-inner relative overflow-hidden min-h-64 flex flex-col justify-between">
              
              <div className="space-y-4 text-left relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-[10px] text-green-700 font-extrabold uppercase tracking-widest">Detail Fasilitas Aktif & Terpelihara</span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 transition-all uppercase tracking-wide">
                  {selectedFacility?.title}
                </h3>
                
                <p className="text-xs text-slate-500 leading-relaxed font-semibold transition-all">
                  {selectedFacility?.desc}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4 items-center justify-between text-[11px] font-bold text-slate-400 relative z-10">
                <span>📍 Lokasi Kampus: Cadangpinggan</span>
                <span className="text-green-700 uppercase bg-green-50 px-2.5 py-1 rounded-full border border-green-150/40">Gedung Khas Pesantren</span>
              </div>
            </div>

          </div>
        </div>
      </section>
            </>
          )}

          {activeTab === 'beranda' && (
            <>
              {/* ========================================== */}
              {/* SECTION 8: REAL TESTIMONIALS */}
              {/* ========================================== */}
      <section className="py-20 bg-slate-50 px-6 lg:px-12 select-none border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 animate-fade-in">
            <span className="text-green-700 text-xs font-black uppercase tracking-widest leading-none block">{sectionTitles.testimonials.eyebrow}</span>
            <h2 className="text-3xl font-black text-slate-800">{sectionTitles.testimonials.title}</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{sectionTitles.testimonials.desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {testimonials.map((test) => (
              <div key={test.id} className="bg-white p-6 rounded-3xl border border-slate-205/80 shadow-md flex flex-col justify-between space-y-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 shrink-0" />
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-slate-550 leading-relaxed italic select-text">
                    "{test.words}"
                  </p>
                </div>

                <div className="flex items-center gap-3 border-t border-slate-100 pt-3.5">
                  <img 
                    src={test.avatar} 
                    alt={test.name} 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover shadow-inner border border-slate-200" 
                  />
                  <div>
                    <h5 className="text-[11px] font-black text-slate-800 uppercase leading-tight">{test.name}</h5>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{test.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
            </>
          )}

          {activeTab === 'psb' && (
            <>
              {/* ========================================== */}
              {/* SECTION 9: ONLINE PSB ADMISSION FORM */}
              {/* ========================================== */}
      <section id="psb" className="py-20 bg-gradient-to-b from-white to-slate-50 px-6 lg:px-12 border-b border-slate-200/40">
        <div className="max-w-3xl mx-auto bg-white p-8 lg:p-11 rounded-3xl border border-green-200 shadow-2xl space-y-6 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-emerald-600 to-green-700"></div>

          <div className="text-center space-y-2 select-none">
            <span className="px-3.5 py-1.5 bg-green-50 rounded-full border border-green-200 text-green-800 text-[9px] font-black uppercase tracking-widest inline-block">
              {sectionTitles.psb.eyebrow}
            </span>
            <h2 className="text-2xl font-black text-slate-800 uppercase leading-snug">{sectionTitles.psb.title}</h2>
            <p className="text-xs text-slate-400">{sectionTitles.psb.desc}</p>
          </div>

          {psbSuccess && (
            <div className="p-4 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200 text-center animate-bounce shadow-xs">
              🎉 Masyallah! Formulir PSB Sukses Terkirim! Panitia akan segera menghubungi No WhatsApp Orangtua dalam 1x24 jam untuk verifikasi dokumen.
            </div>
          )}

          <form onSubmit={handlePsbSubmit} className="space-y-4 text-xs text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Nama Lengkap Calon Santri:</label>
                <input 
                  type="text"
                  value={psbNama}
                  onChange={(e) => setPsbNama(e.target.value)}
                  placeholder="cth: Ahmad Fauzi Syafi'i"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">NISN / Nomor Ijazah SD/MI:</label>
                <input 
                  type="text"
                  value={psbNisn}
                  onChange={(e) => setPsbNisn(e.target.value)}
                  placeholder="cth: 3012903822"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-mono font-bold focus:bg-white focus:ring-1 focus:ring-green-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Jenjang Dituju:</label>
                <select 
                  value={psbKelas}
                  onChange={(e) => setPsbKelas(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold focus:bg-white outline-none"
                >
                  <option value="VII">MTs (SMP) - Kelas VII</option>
                  <option value="VIII">MTs (SMP) - Kelas VIII (Pindahan)</option>
                  <option value="X">MA (SMA) - Kelas X</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Nama Ayah / Ibu Wali:</label>
                <input 
                  type="text"
                  value={psbWali}
                  onChange={(e) => setPsbWali(e.target.value)}
                  placeholder="cth: H. Syafiuddin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">No WhatsApp Wali (Aktif):</label>
                <input 
                  type="text"
                  value={psbPhone}
                  onChange={(e) => setPsbPhone(e.target.value)}
                  placeholder="cth: 0812345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-mono font-bold focus:bg-white focus:ring-1 focus:ring-green-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 select-none">
              <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 p-3 rounded-xl border border-slate-150">
                ⚠️ Dengan menekan tombol pendaftaran, data calon santri akan terekam dalam database sementara PSB. Panitia menyeleksi kuota asrama yatim & dhuafa (gratis murni) atau beasiswa tahfidz pilihan mandiri.
              </p>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 bg-green-700 hover:bg-green-800 text-white font-extrabold rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 text-xs select-none uppercase tracking-wider"
            >
              Ajukan Berkas Pendaftaran Santri Baru (Online)
            </button>
          </form>

        </div>
      </section>
            </>
          )}

          {activeTab === 'berita' && (
            <>
              {/* ========================================== */}
              {/* SECTION 10: BERITA KAJIAN PESANTREN */}
              {/* ========================================== */}
      <section id="berita" className="py-20 bg-white px-6 lg:px-12 select-none border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-between flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-slate-100 pb-5">
            <div>
              <span className="text-green-700 text-xs font-black uppercase tracking-widest leading-none block mb-1">{sectionTitles.berita.eyebrow}</span>
              <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">{sectionTitles.berita.title}</h2>
            </div>
            <p className="text-xs text-slate-400">{sectionTitles.berita.desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {beritaList.length > 0 ? (
              beritaList.map((berita) => (
                <div 
                  key={berita.id} 
                  onClick={() => setSelectedBerita(berita)}
                  className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-lg hover:border-green-300 hover:scale-[1.01] transition-all duration-300 cursor-pointer group shadow-xs"
                >
                  <div className="w-full h-44 bg-gradient-to-br from-green-50 to-green-100/50 flex flex-col items-center justify-center text-green-800 p-6 text-center border-b border-slate-200 relative select-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-green-700/5 to-emerald-600/10 opacity-60"></div>
                    <div className="text-3xl mb-2 relative z-10 filter drop-shadow">📰</div>
                    <span className="font-extrabold text-xs text-slate-800 line-clamp-2 px-4 relative z-10 uppercase tracking-wide leading-relaxed">
                      {berita.judul}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase leading-tight select-text group-hover:text-green-700 transition-colors">
                        {berita.judul}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-3 select-text">
                        {berita.konten || berita.isi}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-[10px] font-bold">
                      <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        🗓️ {new Date(berita.tanggal_publish || berita.tanggal || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleShareBerita(e, berita)}
                          className="p-1.5 text-slate-500 hover:text-green-700 hover:bg-green-150/60 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          title="Bagikan berita"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedBerita(berita)}
                          className="px-2.5 py-1.5 bg-green-50 text-green-850 hover:bg-green-700 hover:text-white rounded-lg transition-all flex items-center gap-1 uppercase text-[9px] font-black tracking-wider shadow-2xs cursor-pointer"
                        >
                          Buka
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center p-12 bg-slate-50 border border-slate-200 rounded-3xl text-slate-400 text-xs font-bold">
                Belum ada kabar berita yang dirilis oleh admin pesantren.
              </div>
            )}
          </div>
        </div>
      </section>
            </>
          )}

          {activeTab === 'faq' && (
            <>
              {/* ========================================== */}
              {/* SECTION 11: EXPANDABLE ACCORDION FAQ */}
              {/* ========================================== */}
      <section id="faq" className="py-20 bg-slate-50 px-6 lg:px-12 select-none border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-green-700 text-xs font-black uppercase tracking-widest leading-none block">{sectionTitles.faq.eyebrow}</span>
            <h2 className="text-3xl font-black text-slate-800">{sectionTitles.faq.title}</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">{sectionTitles.faq.desc}</p>
          </div>

          <div className="space-y-3.5 max-w-3xl mx-auto">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-shadow"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs font-extrabold text-slate-800 leading-normal">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'transform rotate-180 text-green-700' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-slate-500 leading-relaxed font-semibold border-t border-slate-100 select-text">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
            </>
          )}

          {activeTab === 'masuk' && (
            <>
              {/* ========================================== */}
              {/* SECTION 12: MANUAL LOGIN FORM INSTRUCTIONS */}
              {/* ========================================== */}
      <section id="masuk" className="py-20 bg-slate-100 flex items-center justify-center px-6 border-b border-slate-200">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl"></div>

          <div className="text-center select-none space-y-3">
            <div className="mx-auto w-24 h-24 rounded-3xl bg-white border border-green-100 shadow-lg shadow-green-900/10 p-3 flex items-center justify-center">
              <img
                src={MATHLABUL_HIDAYAH_LOGO_URL}
                alt="Logo Mathlabul Hidayah"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Portal Mathlabul Hidayah</h3>
              <p className="text-[11px] text-slate-400 font-medium">Buku pantauan wali, asrama santri, & setoran tahfidz</p>
            </div>
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-50 text-red-800 font-bold text-xs rounded-xl border border-red-200 text-center leading-normal">
              ⚠️ {loginError}
            </div>
          )}

          <form 
            onSubmit={(e) => handleManualLogin(e, email, pass)} 
            className="space-y-4 text-xs text-left"
          >
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Alamat Email Terdaftar:</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@mathlabulhidayah.sch.id"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:bg-white outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Kata Sandi Akun:</label>
              <input 
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-700 outline-none"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-extrabold rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider shadow-md active:scale-95"
            >
              Verifikasi Sandi & Masuk Portal
            </button>
          </form>

        </div>
      </section>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <Footer profilPP={profilPP} onNavigate={setActiveTab} />

      {/* Selected News/Berita Dialog Modal */}
      <AnimatePresence>
        {selectedBerita && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBerita(null)}
              className="fixed inset-0 bg-slate-900/80 z-50 backdrop-blur-[4px] cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-[8%] md:top-[12%] md:max-w-xl mx-auto bg-white rounded-3xl z-50 shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh] text-left"
            >
              {/* Header Header Decoration */}
              <div className="bg-gradient-to-r from-green-700 to-emerald-700 px-6 py-5 flex items-center justify-between text-white select-none">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Newspaper className="w-5 h-5 text-green-100" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-green-200 leading-none">Berita & Kajian</h3>
                    <p className="text-[10px] text-green-100/80 font-bold mt-1">Mathlabul Hidayah</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBerita(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-100 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-5 flex-1 select-text">
                <div className="space-y-2">
                  <span className="px-2.5 py-1 bg-green-50 text-green-800 border border-green-200/50 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block select-none">
                    📅 {new Date(selectedBerita.tanggal_publish || selectedBerita.tanggal || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  
                  <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-wide leading-snug">
                    {selectedBerita.judul}
                  </h2>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold select-none uppercase">
                    <span>Penulis:</span>
                    <span className="text-green-700 font-black">{selectedBerita.penulis || 'Humas Pesantren'}</span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Body Content */}
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold whitespace-pre-line text-justify">
                  {selectedBerita.konten || selectedBerita.isi}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 select-none">
                <button
                  onClick={(e) => handleShareBerita(e, selectedBerita)}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 text-white rounded-xl font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Bagikan Berita
                </button>

                <button
                  onClick={() => setSelectedBerita(null)}
                  className="px-4 py-2.5 bg-white border border-slate-250 text-slate-600 hover:bg-slate-50 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Copy Success Notification Toast */}
      <AnimatePresence>
        {showCopiedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-55 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 text-xs font-bold font-sans"
          >
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Tautan & Ringkasan Berita berhasil disalin ke papan klip!</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
