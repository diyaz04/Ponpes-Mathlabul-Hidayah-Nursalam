import React, { useEffect, useState, useTransition } from 'react';
import { read, utils, write } from 'xlsx';
import { 
  Users, ShieldAlert, BookOpen, CreditCard, History, Settings, 
  Plus, Trash2, Edit, Save, Newspaper, Megaphone, HelpCircle, 
  DollarSign, Check, Activity, RefreshCw, Eye, Sparkles, UserCheck,
  AlertTriangle, Shield, CheckCircle2, Trash, X, Calendar, Lock, GraduationCap, Link, Phone, Mail, User, MapPin,
  Download, FileText, Search, Printer
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { db, dbLocal, insertNotification, isRealSupabaseConfigured, supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { 
  Santri, Profile, Tagihan, Pembayaran, JenisPembayaran, 
  ProfilPesantren, Berita, Pengumuman, Pelanggaran, SetoranHapalan, JenisPelanggaran, KategoriHapalan
} from '../../types';
import { ImageUploader } from '../shared/ImageUploader';
import { MATHLABUL_HIDAYAH_LOGO_URL } from '../../lib/branding';
import { RaportPanel, getRaportPredikat } from '../raport/RaportPanel';

export interface AdminDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

type SanctionRule = {
  id: 'aman' | 'pembinaan' | 'takzir';
  title: string;
  min: number;
  max: number | null;
  desc: string;
  tone: 'emerald' | 'amber' | 'red';
};

const DEFAULT_SANCTION_RULES: SanctionRule[] = [
  { id: 'aman', title: 'Aman', min: 0, max: 24, desc: 'Pemantauan rutin wali kelas dan guru pembina.', tone: 'emerald' },
  { id: 'pembinaan', title: 'Pembinaan', min: 25, max: 49, desc: 'Pemanggilan santri, nasihat tertulis, dan monitoring perilaku.', tone: 'amber' },
  { id: 'takzir', title: 'Kritis / Takzir', min: 50, max: null, desc: 'Tindak lanjut takzir, pemanggilan wali, atau rapat kedisiplinan.', tone: 'red' }
];

const DEFAULT_FOOTER_DESCRIPTION = 'Membentuk generasi Qurani, berakhlaqul karimah, mandiri, dan berwawasan iptek modern. Pendidikan salafiyah yang bersinergi dalam lingkungan modern kondusif.';
const DEFAULT_SOCIAL_LINKS_JSON = JSON.stringify([
  { platform: 'instagram', label: 'Instagram', url: '' },
  { platform: 'facebook', label: 'Facebook', url: '' },
  { platform: 'youtube', label: 'YouTube', url: '' },
  { platform: 'tiktok', label: 'TikTok', url: '' },
  { platform: 'whatsapp', label: 'WhatsApp', url: '' }
], null, 2);
const DEFAULT_PROGRAMS_JSON = JSON.stringify([
  { id: 1, title: 'Tahfidz Quran Mutqin', desc: 'Metode akselerasi talaqqi menyetor 1 halaman per hari bersertifikat sanad hafidz mutqin di bawah pengawasan asatidzah.', icon: 'BookOpen', badge: 'Sabaq, Sabqi, Manzil', tone: 'green' },
  { id: 2, title: 'Kajian Kitab Turots', desc: 'Pendalaman keilmuan madzhab Syafiiyyah, aqidah Asyariyah, dan tasawuf bersanad menggunakan khazanah kitab kuning utama.', icon: 'GraduationCap', badge: 'Fathul Qorib, Talim Mutaallim', tone: 'indigo' },
  { id: 3, title: 'Bilingual Immersion Camp', desc: 'Penerapan bahasa Arab dan Inggris harian asrama secara aktif dengan mutabaah mingguan.', icon: 'ShieldCheck', badge: 'Active Speaking & Debate', tone: 'amber' },
  { id: 4, title: 'Pendidikan Formal MTs/MA', desc: 'Madrasah Tsanawiyyah dan Madrasah Aliyah berakreditasi A untuk menunjang studi lanjut.', icon: 'Activity', badge: 'Kurikulum Kementerian Agama', tone: 'rose' }
], null, 2);
const DEFAULT_FAQ_JSON = JSON.stringify([
  { q: 'Bagaimana wali santri memantau perkembangan hafalan Al-Quran?', a: 'Wali santri dapat melihat rekam jejak setoran hafalan melalui akun Portal Wali masing-masing.' },
  { q: 'Apakah biaya SPP dan uang pendaftaran dapat dibayar cicil?', a: 'Ya, pembayaran dapat dikonfirmasi melalui Portal Wali dan diverifikasi oleh admin.' },
  { q: 'Bagaimana prosedur penanganan pelanggaran santri?', a: 'Pelanggaran dicatat dengan sistem poin kedisiplinan dan dapat dipantau oleh wali santri.' },
  { q: 'Apakah calon santri wajib memiliki hafalan sebelum mendaftar?', a: 'Tidak wajib. Santri baru akan mendapat pembinaan tahsin dan persiapan hafalan.' }
], null, 2);
const DEFAULT_SECTION_TITLES_JSON = JSON.stringify({
  program: { eyebrow: 'Kurikulum Khusus Terarah', title: '4 Pilar Kurikulum Unggulan Ponpes', desc: 'Dirancang seimbang untuk kesiapan santri berkhidmah dan melanjutkan studi.' },
  routine: { eyebrow: 'Agenda Harian', title: 'Bagaimana Keseharian Santri Mukim?', desc: 'Pembiasaan disiplin positif dengan keseimbangan ilmu, jasmani, gizi, dan istirahat.' },
  facilities: { eyebrow: 'Fasilitas Pesantren', title: 'Sarana Penunjang Terbaik Hafizh', desc: 'Sarana modern untuk asrama yang sehat, aman, dan nyaman.' },
  testimonials: { eyebrow: 'Testimoni Wali & Tokoh', title: 'Apa Kata Mereka Tentang Kami?', desc: 'Kepuasan, kejujuran, dan sinergi bimbingan harian tervalidasi.' },
  psb: { eyebrow: 'PENERIMAAN SANTRI BARU T.A 2026/2027', title: 'Formulir Pendaftaran Online', desc: 'Pendaftaran kelas MTs dan MA terakreditasi resmi Pemerintah.' },
  berita: { eyebrow: 'Rilis Kegiatan', title: 'Kajian & Warta Ponpes Terbaru', desc: 'Informasi autentik keseharian lingkungan asrama santri.' },
  faq: { eyebrow: 'Informasi Umum', title: 'Pertanyaan Yang Sering Diajukan (FAQ)', desc: 'Pertanyaan utama orang tua wali saat mendaftarkan putra-putrinya.' }
}, null, 2);

const createClientUuid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
};

const loadImageAsDataUrl = (src: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (_err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = `${src}${src.includes('?') ? '&' : '?'}v=${Date.now()}`;
  });
};

export function AdminDashboard({ activeTab: externalActiveTab, onTabChange: externalOnTabChange }: AdminDashboardProps) {
  const { user } = useAuth();
  const [localActiveTab, setLocalActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  const activeTab = externalActiveTab || localActiveTab;

  const handleTabChange = (tab: string) => {
    startTransition(() => {
      if (externalOnTabChange) {
        externalOnTabChange(tab);
      } else {
        setLocalActiveTab(tab);
      }
    });
  };

  // State Caches
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [jPembayaranList, setJPembayaranList] = useState<JenisPembayaran[]>([]);
  const [bills, setBills] = useState<Tagihan[]>([]);
  const [payments, setPayments] = useState<Pembayaran[]>([]);
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [profilPP, setProfilPP] = useState<ProfilPesantren | null>(null);

  // New Data Cache for Pelanggaran & Hafalan
  const [violationsList, setViolationsList] = useState<Pelanggaran[]>([]);
  const [hapalanList, setHapalanList] = useState<SetoranHapalan[]>([]);
  const [vJenisList, setVJenisList] = useState<JenisPelanggaran[]>([]);

  // Status indicators
  const [actionDoneMsg, setActionDoneMsg] = useState<string | null>(null);

  // Forms: Pupil Create/Edit
  const [showPupilModal, setShowPupilModal] = useState(false);
  const [pupilId, setPupilId] = useState<string>('');
  const [pNis, setPNis] = useState('');
  const [pNama, setPNama] = useState('');
  const [pKelas, setPKelas] = useState('IX - Tahfidz A');
  const [pKamar, setPKamar] = useState('Abu Bakar Shiddiq');
  const [pJK, setPJK] = useState<'L' | 'P'>('L');
  const [pBirth, setPBirth] = useState('2011-04-12');
  const [pAlamat, setPAlamat] = useState('');
  const [pWaliId, setPWaliId] = useState('p-wali1');
  const [pBulanMasuk, setPBulanMasuk] = useState('Januari');
  const [pTahunMasuk, setPTahunMasuk] = useState('2026');
  const [pStatus, setPStatus] = useState<Santri['status']>('aktif');

  // Forms: Bulking Invoices Create
  const [selJenisId, setSelJenisId] = useState('');
  const [selBulan, setSelBulan] = useState('Juni');
  const [selTahun, setSelTahun] = useState('2026');
  const [selNominal, setSelNominal] = useState<number>(750000);
  const [bypassEntranceFilter, setBypassEntranceFilter] = useState(false);
  const [targetScope, setTargetScope] = useState<'semua' | 'santri'>('semua');
  const [targetSantriId, setTargetSantriId] = useState('');

  // Forms: Announcement Board
  const [annJudul, setAnnJudul] = useState('');
  const [annTarget, setAnnTarget] = useState<'semua' | 'kelas'>('semua');
  const [annTargetVal, setAnnTargetVal] = useState('');
  const [annPesan, setAnnPesan] = useState('');

  // CMS Settings Editor
  const [cmsModelNama, setCmsModelNama] = useState('');
  const [cmsTagline, setCmsTagline] = useState('');
  const [cmsVisi, setCmsVisi] = useState('');
  const [cmsMisi, setCmsMisi] = useState('');
  const [cmsAlamat, setCmsAlamat] = useState('');
  const [cmsTelepon, setCmsTelepon] = useState('');
  const [cmsEmail, setCmsEmail] = useState('');
  const [footerDescription, setFooterDescription] = useState('');
  const [footerCopyright, setFooterCopyright] = useState('');

  const [heroBgColor, setHeroBgColor] = useState('');
  const [heroImgUrl, setHeroImgUrl] = useState('');
  const [heroImgOpacity, setHeroImgOpacity] = useState<number>(0.12);
  const [heroType, setHeroType] = useState<'statis' | 'dinamis'>('statis');

  const [statsSantriVal, setStatsSantriVal] = useState('');
  const [statsSantriLbl, setStatsSantriLbl] = useState('');
  const [statsHalaqahVal, setStatsHalaqahVal] = useState('');
  const [statsHalaqahLbl, setStatsHalaqahLbl] = useState('');
  const [statsSppVal, setStatsSppVal] = useState('');
  const [statsSppLbl, setStatsSppLbl] = useState('');
  const [statsSatisfactionVal, setStatsSatisfactionVal] = useState('');
  const [statsSatisfactionLbl, setStatsSatisfactionLbl] = useState('');

  const [sejarahSub, setSejarahSub] = useState('');
  const [sejarahTitle, setSejarahTitle] = useState('');
  const [sejarahDesc, setSejarahDesc] = useState('');

  // Items stringified JSON
  const [routinesJson, setRoutinesJson] = useState('');
  const [facilitiesJson, setFacilitiesJson] = useState('');
  const [testimonialsJson, setTestimonialsJson] = useState('');
  const [programsJson, setProgramsJson] = useState('');
  const [faqJson, setFaqJson] = useState('');
  const [sectionTitlesJson, setSectionTitlesJson] = useState('');
  const [socialLinksJson, setSocialLinksJson] = useState('');

  // CMS Sub Tab & Berita Manager states
  const [cmsSubTab, setCmsSubTab] = useState<'profil_hero' | 'berita'>('profil_hero');
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsEditId, setNewsEditId] = useState<string | null>(null);
  const [newsJudul, setNewsJudul] = useState('');
  const [newsKonten, setNewsKonten] = useState('');
  const [newsPenulis, setNewsPenulis] = useState('');
  const [newsIsPublished, setNewsIsPublished] = useState(true);
  const [newsThumbnailUrl, setNewsThumbnailUrl] = useState('');

  // Forms: Pelanggaran Create
  const [showPelanggaranModal, setShowPelanggaranModal] = useState(false);
  const [petSId, setPetSId] = useState('');
  const [petJenisId, setPetJenisId] = useState('');
  const [petDesc, setPetDesc] = useState('');
  const [petPoint, setPetPoint] = useState<number>(5);
  const [petTanggal, setPetTanggal] = useState(new Date().toISOString().split('T')[0]);

  // Forms: Setoran Hafalan Create
  const [showHapalanModal, setShowHapalanModal] = useState(false);
  const [hapSId, setHapSId] = useState('');
  const [hapTanggal, setHapTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [hapJenis, setHapJenis] = useState<'ziyadah' | 'murajaah'>('ziyadah');
  const [hapSurah, setHapSurah] = useState('Al-Baqarah');
  const [hapAyatDari, setHapAyatDari] = useState<number>(1);
  const [hapAyatSampai, setHapAyatSampai] = useState<number>(10);
  const [hapPages, setHapPages] = useState<number>(1);
  const [hapValue, setHapValue] = useState<'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbul'>('mumtaz');

  // Custom Kategori Hafalan states
  const [hapKategoriList, setHapKategoriList] = useState<KategoriHapalan[]>([]);
  const [activeHapSubTab, setActiveHapSubTab] = useState<'setoran' | 'kategori'>('setoran');
  const [selectedHapKatId, setSelectedHapKatId] = useState<string>('kat-quran');
  const [showAddHapKatForm, setShowAddHapKatForm] = useState(false);
  const [newHapKatNama, setNewHapKatNama] = useState('');
  const [newHapKatDeskripsi, setNewHapKatDeskripsi] = useState('');

  // Custom added states: billing category creation
  const [newJenisNama, setNewJenisNama] = useState('');
  const [newJenisDeskripsi, setNewJenisDeskripsi] = useState('');
  
  // Custom states: active tagihan filters in pembayaran_config
  const [cfgTagihanSearch, setCfgTagihanSearch] = useState('');
  const [cfgTagihanStatusFilter, setCfgTagihanStatusFilter] = useState<'semua' | 'pending' | 'lunas'>('pending');
  const [cfgTagihanJenisFilter, setCfgTagihanJenisFilter] = useState('semua');
  const [cfgPaymentSearch, setCfgPaymentSearch] = useState('');
  const [rekapSubTab, setRekapSubTab] = useState<'riwayat' | 'tagihan_tersebar'>('riwayat');
  const [rekapRiwayatTab, setRekapRiwayatTab] = useState<'laporan' | 'kategori' | 'spp' | 'transaksi'>('laporan');
  const [rekapCategorySearch, setRekapCategorySearch] = useState('');
  const [sppRekapSearch, setSppRekapSearch] = useState('');
  const [cancelTargetId, setCancelTargetId] = useState('');
  const [cashInstallmentModal, setCashInstallmentModal] = useState<{
    isOpen: boolean;
    tagihanId: string;
    nominalText: string;
    error?: string;
  } | null>(null);

  // States for dynamic CSV/Excel Santri & Wali Import
  const [showImportForm, setShowImportForm] = useState(false);
  const [importRowsPreview, setImportRowsPreview] = useState<any[]>([]);
  const [importSelectedFileName, setImportSelectedFileName] = useState('');
  const [importError, setImportError] = useState('');

  // States for manual parent automatic account creation
  const [newWaliFullName, setNewWaliFullName] = useState('');
  const [newWaliPhone, setNewWaliPhone] = useState('');
  const [newWaliEmail, setNewWaliEmail] = useState('');
  const [newWaliPassword, setNewWaliPassword] = useState('123456');

  // Interactive robust confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [pdfChoiceModal, setPdfChoiceModal] = useState<{
    isOpen: boolean;
    santri: Santri;
    wali: { id: string; user_id?: string; full_name: string; email?: string; phone?: string; password?: string };
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // Custom added states: reports & range date filters
  const [reportFilterType, setReportFilterType] = useState<'bulan' | 'tanggal' | 'rentang'>('bulan');
  const [filterBulan, setFilterBulan] = useState('Juni');
  const [filterTahun, setFilterTahun] = useState('2026');
  const [sppRekapTahun, setSppRekapTahun] = useState('2026');
  const [filterSingleDate, setFilterSingleDate] = useState('2026-06-01');
  const [filterStartDate, setFilterStartDate] = useState('2026-05-01');
  const [filterEndDate, setFilterEndDate] = useState('2026-06-30');
  const [hapCatatan, setHapCatatan] = useState('');
  const [pelanggaranView, setPelanggaranView] = useState<'log' | 'analitik'>('log');
  const [pelanggaranLogTab, setPelanggaranLogTab] = useState<'riwayat' | 'kamus' | 'sanksi'>('riwayat');
  const [pelanggaranKelasFilter, setPelanggaranKelasFilter] = useState('semua');
  const [pelanggaranLevelFilter, setPelanggaranLevelFilter] = useState<'semua' | 'ringan' | 'sedang' | 'berat'>('semua');
  const [newViolationName, setNewViolationName] = useState('');
  const [newViolationDesc, setNewViolationDesc] = useState('');
  const [newViolationCategory, setNewViolationCategory] = useState<'ringan' | 'sedang' | 'berat'>('ringan');
  const [newViolationPoint, setNewViolationPoint] = useState<number>(5);
  const [sanctionRules, setSanctionRules] = useState<SanctionRule[]>(DEFAULT_SANCTION_RULES);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mh_sanction_rules');
      if (stored) {
        const parsed = JSON.parse(stored) as SanctionRule[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSanctionRules(parsed);
        }
      }
    } catch (_err) {
      setSanctionRules(DEFAULT_SANCTION_RULES);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('mh_sanction_rules', JSON.stringify(sanctionRules));
    } catch (_err) {
      // Browser storage can be unavailable in some privacy modes.
    }
  }, [sanctionRules]);

  // Forms: Account Create/Edit
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accId, setAccId] = useState('');
  const [accFullName, setAccFullName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accRole, setAccRole] = useState<'admin' | 'guru' | 'user'>('user');
  const [accIsActive, setAccIsActive] = useState(true);
  const [accPassword, setAccPassword] = useState('123456');

  // States for Admin-Side Wali/Santri Association Management
  const [adminSelectedWaliId, setAdminSelectedWaliId] = useState('p-wali1');
  const [adminLinkNis, setAdminLinkNis] = useState('');
  const [searchAlumni, setSearchAlumni] = useState('');
  const [alumniDetail, setAlumniDetail] = useState<Santri | null>(null);
  const [alumniDetailTab, setAlumniDetailTab] = useState<'biodata' | 'pembayaran' | 'raport' | 'hafalan' | 'pelanggaran'>('biodata');

  const refreshAdminData = async () => {
    try {
      const [
        santri,
        profiles,
        jenisPembayaran,
        tagihan,
        pembayaran,
        berita,
        pengumuman,
        pelanggaran,
        setoranHapalan,
        kategoriHapalan,
        jenisPelanggaran,
        pp
      ] = await Promise.all([
        db.santri(),
        db.profiles(),
        db.jenisPembayaran(),
        db.tagihan(),
        db.pembayaran(),
        db.berita(),
        db.pengumuman(),
        db.pelanggaran(),
        db.setoranHapalan(),
        db.kategoriHapalan(),
        db.jenisPelanggaran(),
        db.profilPesantren()
      ]);

      setSantriList(santri);
      setProfilesList(profiles);
      setJPembayaranList(jenisPembayaran);
      setBills(tagihan);
      setPayments(pembayaran);
      setBeritaList(berita);
      setAnnouncements(pengumuman);
      setViolationsList(pelanggaran);
      setHapalanList(setoranHapalan);
      setHapKategoriList(kategoriHapalan);
      setVJenisList(jenisPelanggaran);

    setProfilPP(pp);
    if (pp) {
      setCmsModelNama(pp.nama);
      setCmsTagline(pp.tagline || '');
      setCmsVisi(pp.visi || '');
      setCmsMisi(pp.misi || '');
      setCmsAlamat(pp.alamat || 'Cigalontang, Kabupaten Tasikmalaya, Jawa Barat');
      setCmsTelepon(pp.telepon || '');
      setCmsEmail(pp.email || '');
      setFooterDescription(pp.footer_description || DEFAULT_FOOTER_DESCRIPTION);
      setFooterCopyright(pp.footer_copyright || `Copyright 2026 ${pp.nama || 'Pondok Pesantren Mathlabul Hidayah Nursalam'}. All rights reserved.`);

      setHeroBgColor(pp.hero_bg_color || 'linear-gradient(to bottom, #ecfdf5, #f8fafc)');
      setHeroImgUrl(pp.hero_img_url || '');
      setHeroImgOpacity(pp.hero_img_opacity !== undefined ? pp.hero_img_opacity : 0.12);
      setHeroType(pp.hero_type || 'statis');

      setStatsSantriVal(pp.stats_santri_val || '');
      setStatsSantriLbl(pp.stats_santri_lbl || '');
      setStatsHalaqahVal(pp.stats_halaqah_val || '');
      setStatsHalaqahLbl(pp.stats_halaqah_lbl || '');
      setStatsSppVal(pp.stats_spp_val || '');
      setStatsSppLbl(pp.stats_spp_lbl || '');
      setStatsSatisfactionVal(pp.stats_satisfaction_val || '');
      setStatsSatisfactionLbl(pp.stats_satisfaction_lbl || '');

      setSejarahSub(pp.sejarah_sub || '');
      setSejarahTitle(pp.sejarah_title || '');
      setSejarahDesc(pp.sejarah || '');

      setRoutinesJson(pp.routines_json || '');
      setFacilitiesJson(pp.facilities_json || '');
      setTestimonialsJson(pp.testimonials_json || '');
      setProgramsJson(pp.programs_json || DEFAULT_PROGRAMS_JSON);
      setFaqJson(pp.faq_json || DEFAULT_FAQ_JSON);
      setSectionTitlesJson(pp.section_titles_json || DEFAULT_SECTION_TITLES_JSON);
      setSocialLinksJson(pp.social_links_json || DEFAULT_SOCIAL_LINKS_JSON);
    }
    } catch (error: any) {
      console.error('[Supabase Admin Load Failure]', error);
      setActionDoneMsg(`Gagal memuat data Supabase: ${error.message || error}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  useRealtime(
    refreshAdminData,
    ['profiles', 'santri', 'jenis_pembayaran', 'tagihan', 'pembayaran', 'berita', 'pengumuman', 'pelanggaran', 'setoran_hapalan', 'kategori_hapalan', 'jenis_pelanggaran', 'profil_pesantren']
  );

  const getWaliName = (id?: string) => {
    return profilesList.find(p => p.id === id)?.full_name || 'Tidak ada wali';
  };

  const getJenisName = (id: string) => {
    return jPembayaranList.find(j => j.id === id)?.nama || 'Jenis Pembayaran';
  };

  const monthNamesFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const getSppSyahriahJenisIds = () => {
    const strictMatches = jPembayaranList.filter(j => {
      const name = j.nama.toLowerCase();
      return name.includes('spp') && (name.includes('syahriah') || name.includes('syahriyah') || name.includes('syahriyyah'));
    });

    if (strictMatches.length > 0) {
      return strictMatches.map(j => j.id);
    }

    return jPembayaranList
      .filter(j => j.nama.toLowerCase().includes('spp'))
      .map(j => j.id);
  };

  const isSppBillPaid = (bill: Tagihan) => {
    return bill.status === 'lunas';
  };

  const isCashPayment = (payment: Pembayaran) => {
    const method = (payment.metode || '').toLowerCase();
    return method.includes('cash') || method.includes('tunai');
  };

  const getReportPayments = () => {
    return payments.filter(p => {
      if (p.status !== 'lunas') return false;

      const b = bills.find(t => t.id === p.tagihan_id);
      if (!b) return false;

      if (reportFilterType === 'bulan') {
        return b.bulan === filterBulan && b.tahun === filterTahun;
      }

      const pDateStr = p.paid_at || p.created_at || '';
      if (!pDateStr) return false;
      const pDate = pDateStr.substring(0, 10);

      if (reportFilterType === 'tanggal') {
        return pDate === filterSingleDate;
      }

      return pDate >= filterStartDate && pDate <= filterEndDate;
    });
  };

  const getFinancialCategorySummary = () => {
    const summaryMap = new Map<string, {
      jenisId: string;
      nama: string;
      total: number;
      midtrans: number;
      cash: number;
      transaksi: number;
    }>();

    getReportPayments().forEach((payment) => {
      const bill = bills.find(t => t.id === payment.tagihan_id);
      const jenisId = bill?.jenis_id || 'unknown';
      const nama = bill ? getJenisName(bill.jenis_id) : 'Kategori Tidak Ditemukan';
      const current = summaryMap.get(jenisId) || {
        jenisId,
        nama,
        total: 0,
        midtrans: 0,
        cash: 0,
        transaksi: 0
      };

      current.total += payment.nominal;
      current.transaksi += 1;
      if (isCashPayment(payment)) {
        current.cash += payment.nominal;
      } else {
        current.midtrans += payment.nominal;
      }
      summaryMap.set(jenisId, current);
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.total - a.total);
  };

  const handleOpenPupilModal = (s?: Santri) => {
    // Clear new wali automatic fields
    setNewWaliFullName('');
    setNewWaliPhone('');
    setNewWaliEmail('');
    setNewWaliPassword('123456');

    if (s) {
      setPupilId(s.id);
      setPNis(s.nis);
      setPNama(s.nama);
      setPKelas(s.kelas);
      setPKamar(s.kamar || '');
      setPJK(s.jenis_kelamin);
      setPBirth(s.tanggal_lahir);
      setPAlamat(s.alamat || '');
      setPWaliId(s.wali_id || 'p-wali1');
      setPBulanMasuk(s.bulan_masuk || 'Januari');
      setPTahunMasuk(s.tahun_masuk || '2026');
      setPStatus(s.status || 'aktif');
    } else {
      setPupilId('');
      setPNis('');
      setPNama('');
      setPKelas('IX - Tahfidz A');
      setPKamar('Abu Bakar Shiddiq');
      setPJK('L');
      setPBirth('2011-04-12');
      setPAlamat('');
      setPWaliId('__buat_baru__'); // Default to create new parent automagically
      setPBulanMasuk('Januari');
      setPTahunMasuk('2026');
      setPStatus('aktif');
    }
    setShowPupilModal(true);
  };

  // ============================================================
  // CETAK PDF BIODATA — buka modal pilihan (hanya biodata / reset+biodata)
  // ============================================================
  const resetAndPrintBiodata = async (santri: Santri) => {
    const wali = profilesList.find(p => p.id === santri.wali_id);
    if (!wali) {
      setActionDoneMsg('⚠️ Santri ini belum memiliki data wali. Hubungkan wali terlebih dahulu.');
      setTimeout(() => setActionDoneMsg(null), 4000);
      return;
    }
    if (!wali.user_id) {
      setActionDoneMsg('⚠️ Akun Supabase Auth wali belum ditemukan. Buat akun wali dulu.');
      setTimeout(() => setActionDoneMsg(null), 4000);
      return;
    }
    // Buka modal pilihan
    setPdfChoiceModal({ isOpen: true, santri, wali });
  };

  // Cetak biodata saja (tanpa reset password)
  const handlePrintBiodataOnly = async () => {
    if (!pdfChoiceModal) return;
    const { santri, wali } = pdfChoiceModal;
    setPdfChoiceModal(null);
    try {
      setActionDoneMsg('⏳ Menyiapkan PDF biodata...');
      generateBiodataPDF(
        { nis: santri.nis, nama: santri.nama, kelas: santri.kelas, kamar: santri.kamar,
          jenis_kelamin: santri.jenis_kelamin, tanggal_lahir: santri.tanggal_lahir,
          alamat: santri.alamat, tahun_masuk: santri.tahun_masuk, bulan_masuk: santri.bulan_masuk },
        { full_name: wali.full_name, email: wali.email || '-', phone: wali.phone, password: wali.password || '(lihat kartu lama)' },
        profilPP
      );
      setActionDoneMsg(`✅ PDF biodata "${santri.nama}" berhasil dicetak!`);
      setTimeout(() => setActionDoneMsg(null), 4000);
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal: ${err.message}`);
      setTimeout(() => setActionDoneMsg(null), 4000);
    }
  };

  // Reset password lalu cetak biodata
  const handleResetAndPrint = async () => {
    if (!pdfChoiceModal) return;
    const { santri, wali } = pdfChoiceModal;
    setPdfChoiceModal(null);
    try {
      setActionDoneMsg('⏳ Mereset password & menyiapkan PDF...');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const response = await fetch('/api/admin/account/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: wali.user_id })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal reset password.');

      generateBiodataPDF(
        { nis: santri.nis, nama: santri.nama, kelas: santri.kelas, kamar: santri.kamar,
          jenis_kelamin: santri.jenis_kelamin, tanggal_lahir: santri.tanggal_lahir,
          alamat: santri.alamat, tahun_masuk: santri.tahun_masuk, bulan_masuk: santri.bulan_masuk },
        { full_name: wali.full_name, email: wali.email || '-', phone: wali.phone, password: result.new_password },
        profilPP
      );

      setActionDoneMsg(`✅ Password direset & PDF biodata "${santri.nama}" berhasil dicetak!`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal: ${err.message}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  const printAllBiodata = async () => {
    const santriWithWali = santriList.filter(s => {
      const wali = profilesList.find(p => p.id === s.wali_id);
      return wali && wali.user_id;
    });

    if (santriWithWali.length === 0) {
      setActionDoneMsg('⚠️ Tidak ada santri dengan akun wali yang terdaftar.');
      setTimeout(() => setActionDoneMsg(null), 4000);
      return;
    }

    triggerConfirm(
      'Cetak Semua Biodata Santri',
      `Sistem akan mereset password seluruh ${santriWithWali.length} akun wali ke password baru, lalu mencetak PDF biodata satu per satu. Proses ini tidak bisa dibatalkan. Lanjutkan?`,
      async () => {
        setIsPrintingAll(true);
        setActionDoneMsg(`⏳ Memproses 0 / ${santriWithWali.length}...`);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token || '';
        let done = 0;
        const errors: string[] = [];

        for (const santri of santriWithWali) {
          const wali = profilesList.find(p => p.id === santri.wali_id)!;
          try {
            const response = await fetch('/api/admin/account/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ user_id: wali.user_id })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            // Delay kecil antar PDF supaya browser tidak nge-block download
            await new Promise(r => setTimeout(r, 600));

            generateBiodataPDF(
              { nis: santri.nis, nama: santri.nama, kelas: santri.kelas, kamar: santri.kamar,
                jenis_kelamin: santri.jenis_kelamin, tanggal_lahir: santri.tanggal_lahir,
                alamat: santri.alamat, tahun_masuk: santri.tahun_masuk, bulan_masuk: santri.bulan_masuk },
              { full_name: wali.full_name, email: wali.email || '-', phone: wali.phone, password: result.new_password },
              profilPP
            );
            done++;
            setActionDoneMsg(`⏳ Memproses ${done} / ${santriWithWali.length}...`);
          } catch (err: any) {
            errors.push(`${santri.nama}: ${err.message}`);
          }
        }

        setIsPrintingAll(false);
        const errMsg = errors.length > 0 ? ` | ⚠️ ${errors.length} gagal` : '';
        setActionDoneMsg(`✅ Selesai! ${done} PDF biodata berhasil dicetak.${errMsg}`);
        setTimeout(() => setActionDoneMsg(null), 8000);
      }
    );
  };

  // ============================================================
  // GENERATE BIODATA PDF SANTRI — otomatis setelah pendaftaran
  // ============================================================
  const generateBiodataPDF = (
    santri: {
      nis: string; nama: string; kelas: string; kamar?: string;
      jenis_kelamin: string; tanggal_lahir: string; alamat?: string;
      tahun_masuk: string; bulan_masuk?: string;
    },
    wali: { full_name: string; email: string; phone?: string; password: string },
    pesantren: { nama: string; alamat?: string; telepon?: string; email?: string } | null
  ) => {
    // Generate QR Code dari link website menggunakan QR API
    const siteUrl = window.location.origin;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}&bgcolor=ffffff&color=15803d&margin=4`;
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(qrImg, 0, 0, 200, 200);
      const qrBase64 = canvas.toDataURL('image/png');
      _renderBiodataPDF(santri, wali, pesantren, qrBase64);
    };
    qrImg.onerror = () => {
      _renderBiodataPDF(santri, wali, pesantren, null);
    };
    qrImg.src = qrApiUrl;
  };

  const _renderBiodataPDF = (
    santri: {
      nis: string; nama: string; kelas: string; kamar?: string;
      jenis_kelamin: string; tanggal_lahir: string; alamat?: string;
      tahun_masuk: string; bulan_masuk?: string;
    },
    wali: { full_name: string; email: string; phone?: string; password: string },
    pesantren: { nama: string; alamat?: string; telepon?: string; email?: string } | null,
    qrBase64: string | null
  ) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const GREEN_DARK  = [21, 128, 61]   as [number,number,number];
    const GREEN_LIGHT = [220, 252, 231] as [number,number,number];
    const GREEN_PALE  = [240, 253, 244] as [number,number,number];
    const GRAY_DARK   = [30, 41, 59]    as [number,number,number];
    const GRAY_MID    = [100, 116, 139] as [number,number,number];
    const WHITE       = [255, 255, 255] as [number,number,number];

    // ── HEADER BANNER ──────────────────────────────────────────
    doc.setFillColor(...GREEN_DARK);
    doc.rect(0, 0, W, 48, 'F');

    // Aksen garis bawah header
    doc.setFillColor(134, 239, 172);
    doc.rect(0, 46, W, 2, 'F');

    // Nama & info pesantren (kiri)
    const namaPesantren = pesantren?.nama || 'Pondok Pesantren';
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(namaPesantren, 14, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(187, 247, 208);
    if (pesantren?.alamat) {
      doc.text(pesantren.alamat.substring(0, 70), 14, 21);
    }
    if (pesantren?.telepon) {
      const kontakLine = `Telp: ${pesantren.telepon}${pesantren.email ? '  |  ' + pesantren.email : ''}`;
      doc.text(kontakLine, 14, 27);
    }

    // Badge KARTU BIODATA SANTRI
    doc.setFillColor(...GREEN_LIGHT);
    doc.roundedRect(14, 32, 80, 10, 2, 2, 'F');
    doc.setTextColor(...GREEN_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('KARTU BIODATA SANTRI', 54, 39, { align: 'center' });

    // QR Code kanan header
    if (qrBase64) {
      // Background putih untuk QR
      doc.setFillColor(...WHITE);
      doc.roundedRect(163, 3, 40, 40, 2, 2, 'F');
      doc.addImage(qrBase64, 'PNG', 165, 5, 36, 36);
    }
    // Label scan di bawah QR
    doc.setTextColor(187, 247, 208);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text('Scan untuk akses portal', 183, 45, { align: 'center' });

    // ── JUDUL DOKUMEN ──────────────────────────────────────────
    doc.setFillColor(...GREEN_PALE);
    doc.rect(0, 48, W, 13, 'F');
    doc.setTextColor(...GREEN_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BIODATA & AKUN PORTAL SANTRI', W / 2, 57, { align: 'center' });

    let y = 68;

    const drawSectionTitle = (title: string, yPos: number) => {
      doc.setFillColor(...GREEN_DARK);
      doc.roundedRect(14, yPos, 95, 7, 2, 2, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`  ${title}`, 16, yPos + 5);
    };

    const drawField = (label: string, value: string, xL: number, yPos: number, maxW = 75) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_MID);
      doc.text(label, xL, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...GRAY_DARK);
      doc.text(value || '-', xL, yPos + 5, { maxWidth: maxW });
    };

    const formatDate = (d: string) => {
      if (!d) return '-';
      try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }); }
      catch { return d; }
    };

    // ── SECTION: DATA DIRI ─────────────────────────────────────
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...GREEN_LIGHT);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, W - 28, 74, 3, 3, 'FD');
    drawSectionTitle('DATA DIRI SANTRI', y - 1);
    y += 11;

    // Baris 1
    drawField('NIS (Nomor Induk Santri)', santri.nis, 20, y);
    drawField('Kelas / Halaqah', santri.kelas, 115, y);
    y += 14;
    // Baris 2
    drawField('Nama Lengkap', santri.nama, 20, y);
    drawField('Kamar / Asrama', santri.kamar || '-', 115, y);
    y += 14;
    // Baris 3
    drawField('Jenis Kelamin', santri.jenis_kelamin === 'L' ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)', 20, y);
    drawField('Thn. Masuk Pondok', `${santri.bulan_masuk || ''} ${santri.tahun_masuk}`.trim(), 115, y);
    y += 14;
    // Baris 4
    drawField('Tanggal Lahir', formatDate(santri.tanggal_lahir), 20, y);
    y += 14;
    // Baris 5 — alamat full width
    drawField('Alamat Domisili', santri.alamat || '-', 20, y, 168);
    y += 16;

    // ── SECTION: DATA WALI ─────────────────────────────────────
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...GREEN_LIGHT);
    doc.roundedRect(14, y, W - 28, 40, 3, 3, 'FD');
    drawSectionTitle('DATA WALI / ORANG TUA', y - 1);
    y += 11;

    drawField('Nama Wali / Orang Tua', wali.full_name, 20, y);
    drawField('No. WhatsApp / Telepon', wali.phone || '-', 115, y);
    y += 14;
    drawField('Email Wali', wali.email, 20, y);
    y += 18;

    // ── SECTION: AKUN PORTAL ───────────────────────────────────
    doc.setFillColor(...GREEN_DARK);
    doc.roundedRect(14, y, W - 28, 44, 4, 4, 'F');

    doc.setTextColor(134, 239, 172);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('AKUN LOGIN PORTAL WALI SANTRI', W / 2, y + 8, { align: 'center' });

    doc.setFillColor(...GREEN_LIGHT);
    doc.roundedRect(20, y + 12, W - 40, 26, 3, 3, 'F');

    // Kolom kiri: Email
    doc.setTextColor(...GRAY_MID);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('USERNAME / EMAIL LOGIN', 28, y + 19);
    doc.setTextColor(...GREEN_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    // Truncate email panjang agar tidak nabrak password
    const emailDisplay = wali.email.length > 28 ? wali.email.substring(0, 26) + '..' : wali.email;
    doc.text(emailDisplay, 28, y + 27);

    // Divider vertikal
    doc.setDrawColor(...GREEN_DARK);
    doc.setLineWidth(0.3);
    doc.line(115, y + 15, 115, y + 35);

    // Kolom kanan: Password
    doc.setTextColor(...GRAY_MID);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('PASSWORD / KATA SANDI', 122, y + 19);
    doc.setTextColor(...GREEN_DARK);
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text(wali.password, 122, y + 28);

    y += 50;

    // ── SECTION: URL PORTAL ────────────────────────────────────
    doc.setFillColor(...GREEN_PALE);
    doc.setDrawColor(...GREEN_LIGHT);
    doc.roundedRect(14, y, W - 28, 20, 3, 3, 'FD');
    doc.setTextColor(...GRAY_MID);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Akses Portal Orang Tua / Wali Santri:', 20, y + 7);
    doc.setTextColor(...GREEN_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(window.location.origin, 20, y + 14);
    doc.setTextColor(...GRAY_MID);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Simpan dokumen ini dengan aman. Jangan bagikan kata sandi kepada pihak yang tidak berkepentingan.', 20, y + 19, { maxWidth: 180 });

    y += 26;

    // ── TANDA TANGAN & TANGGAL ─────────────────────────────────
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setTextColor(...GRAY_MID);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Diterbitkan pada: ${today}`, 20, y + 6);
    doc.setDrawColor(...GREEN_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(130, y + 24, W - 14, y + 24);
    doc.setTextColor(...GRAY_MID);
    doc.setFontSize(7);
    doc.text('Pimpinan / Administrator Pesantren', 162, y + 30, { align: 'center' });

    // ── FOOTER ─────────────────────────────────────────────────
    doc.setFillColor(...GREEN_DARK);
    doc.rect(0, 282, W, 15, 'F');
    doc.setTextColor(187, 247, 208);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${namaPesantren} — Dokumen Resmi Pesantren`, W / 2, 291, { align: 'center' });

    const safeName = santri.nama.replace(/\s+/g, '_');
    doc.save(`Biodata_${santri.nis}_${safeName}.pdf`);
  };

  const handleSavePupil = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalWaliId = pWaliId;

    try {
      if (pWaliId === '__buat_baru__' && !newWaliEmail.trim()) {
        alert('Email wali wajib diisi agar akun Supabase Auth dapat dibuat.');
        return;
      }

      if (!pupilId && pWaliId === '__buat_baru__') {
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await fetch('/api/admin/wali/create-with-santri-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session?.access_token || ''}`
          },
          body: JSON.stringify({
            wali: {
              full_name: newWaliFullName || `Wali dari ${pNama}`,
              phone: newWaliPhone,
              email: newWaliEmail.trim().toLowerCase(),
              password: newWaliPassword || '123456'
            },
            santri: {
              nis: pNis,
              nama: pNama,
              kelas: pKelas,
              kamar: pKamar,
              jenis_kelamin: pJK,
            tanggal_lahir: pBirth,
            alamat: pAlamat,
              status: pStatus,
              tahun_masuk: pTahunMasuk,
              bulan_masuk: pBulanMasuk
            }
          })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Gagal membuat wali dan santri.');
        }

        // 🖨️ Auto-generate biodata PDF
        generateBiodataPDF(
          { nis: pNis, nama: pNama, kelas: pKelas, kamar: pKamar, jenis_kelamin: pJK,
            tanggal_lahir: pBirth, alamat: pAlamat, tahun_masuk: pTahunMasuk, bulan_masuk: pBulanMasuk },
          { full_name: newWaliFullName || `Wali dari ${pNama}`, email: newWaliEmail.trim().toLowerCase(),
            phone: newWaliPhone, password: newWaliPassword || '123456' },
          profilPP
        );

        setActionDoneMsg('✅ Santri didaftarkan! Akun wali dibuat & biodata PDF otomatis terunduh.');
        await refreshAdminData();
        setTimeout(() => setActionDoneMsg(null), 5000);
        setShowPupilModal(false);
        return;
        await refreshAdminData();
        setTimeout(() => setActionDoneMsg(null), 5000);
        setShowPupilModal(false);
        return;
      }

      if (pupilId) {
        const { error } = await supabase
          .from('santri')
          .update({
            nis: pNis,
            nama: pNama,
            kelas: pKelas,
            kamar: pKamar || null,
            jenis_kelamin: pJK,
            tanggal_lahir: pBirth,
            alamat: pAlamat || null,
            wali_id: finalWaliId === '__buat_baru__' ? null : finalWaliId,
            status: pStatus,
            bulan_masuk: pBulanMasuk,
            tahun_masuk: pTahunMasuk
          })
          .eq('id', pupilId);
        if (error) throw error;
        setActionDoneMsg('Data santri berhasil diperbaharui!');
      } else {
        const { error } = await supabase.from('santri').insert({
          nis: pNis,
          nama: pNama,
          kelas: pKelas,
          kamar: pKamar || null,
          jenis_kelamin: pJK,
          tanggal_lahir: pBirth,
          alamat: pAlamat || null,
          wali_id: finalWaliId,
          status: pStatus,
          tahun_masuk: pTahunMasuk,
          bulan_masuk: pBulanMasuk
        });
        if (error) throw error;

        // 🖨️ Auto-generate biodata PDF (wali sudah ada, ambil dari profilesList)
        const existingWali = profilesList.find(p => p.id === finalWaliId);
        if (existingWali) {
          generateBiodataPDF(
            { nis: pNis, nama: pNama, kelas: pKelas, kamar: pKamar, jenis_kelamin: pJK,
              tanggal_lahir: pBirth, alamat: pAlamat, tahun_masuk: pTahunMasuk, bulan_masuk: pBulanMasuk },
            { full_name: existingWali.full_name, email: existingWali.email || '-',
              phone: existingWali.phone, password: '(gunakan password yang sudah ada)' },
            profilPP
          );
        }

        setActionDoneMsg('✅ Santri baru didaftarkan & biodata PDF otomatis terunduh!');
      }

      await refreshAdminData();
      setTimeout(() => setActionDoneMsg(null), 3000);
      setShowPupilModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setActionDoneMsg(`Gagal menyimpan santri: ${message}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };
  const handleDeletePupil = (id: string) => {
    triggerConfirm(
      'Hapus Data Santri',
      'Yakin ingin menghapus data santri ini secara permanen dari sistem? Ini juga akan menghapus semua tagihan & laporan terkait.',
      async () => {
        const { error } = await supabase.from('santri').delete().eq('id', id);
        if (error) {
          setActionDoneMsg(`Gagal menghapus santri: ${error.message}`);
        } else {
          setActionDoneMsg('Santri dihapus secara permanen.');
          await refreshAdminData();
        }
        setTimeout(() => setActionDoneMsg(null), 3000);
      }
    );
  };

  const handleChangeSantriStatus = (santri: Santri, status: Santri['status']) => {
    const label = status === 'aktif' ? 'aktifkan kembali' : status === 'alumni' ? 'jadikan alumni' : 'tandai keluar';
    triggerConfirm(
      'Ubah Status Santri',
      `Yakin ingin ${label} untuk ${santri.nama}? Data riwayat tetap tersimpan dan tagihan baru hanya akan berlaku untuk status aktif.`,
      async () => {
        const { error } = await supabase.from('santri').update({ status }).eq('id', santri.id);
        if (error) {
          setActionDoneMsg(`Gagal mengubah status santri: ${error.message}`);
        } else {
          setActionDoneMsg(`Status ${santri.nama} berhasil diubah menjadi ${status}.`);
          await refreshAdminData();
          if (alumniDetail?.id === santri.id) {
            setAlumniDetail(status === 'aktif' ? null : { ...santri, status });
          }
        }
        setTimeout(() => setActionDoneMsg(null), 4000);
      }
    );
  };

  const getSantriArchive = (santri: Santri) => {
    const santriBills = bills.filter(b => b.santri_id === santri.id);
    const billIds = santriBills.map(b => b.id);
    const santriPayments = payments.filter(p => billIds.includes(p.tagihan_id));
    const santriViolations = violationsList.filter(v => v.santri_id === santri.id);
    const santriHapalan = hapalanList.filter(h => h.santri_id === santri.id);
    const raportRows = dbLocal.getRaport().filter(r => r.santri_id === santri.id);

    return { santriBills, santriPayments, santriViolations, santriHapalan, raportRows };
  };

  const getRaportAverageForArchive = (raport: ReturnType<typeof dbLocal.getRaport>[number]) => {
    const kelasMapel = dbLocal.getKelasMapel().filter(km => km.kelas_id === raport.kelas_id);
    const nilai = dbLocal.getNilaiSantri().filter(n =>
      n.santri_id === raport.santri_id &&
      n.semester === raport.semester &&
      n.tahun_ajaran === raport.tahun_ajaran &&
      kelasMapel.some(km => km.id === n.kelas_mapel_id)
    );
    if (nilai.length === 0) return 0;
    return nilai.reduce((sum, item) => sum + Number(item.nilai_akhir || 0), 0) / nilai.length;
  };

  const downloadSantriArchivePDF = async (santri: Santri) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const logo = await loadImageAsDataUrl(MATHLABUL_HIDAYAH_LOGO_URL);
    const wali = profilesList.find(p => p.id === santri.wali_id);
    const { santriBills, santriPayments, santriViolations, santriHapalan, raportRows } = getSantriArchive(santri);
    const kelasListRaport = dbLocal.getRaportKelas();
    const mapelListRaport = dbLocal.getMataPelajaran();
    const kelasMapelListRaport = dbLocal.getKelasMapel();
    const nilaiListRaport = dbLocal.getNilaiSantri();

    const drawKop = () => {
      doc.setFillColor(6, 95, 70);
      doc.rect(0, 0, 210, 22, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 22, 210, 2, 'F');
      if (logo) doc.addImage(logo, 'PNG', 14, 31, 24, 24);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Pondok Pesantren Mathlabul Hidayah Nursalam', 44, 36);
      doc.setFontSize(9);
      doc.setTextColor(4, 120, 87);
      doc.text('ARSIP RIWAYAT SANTRI', 44, 43);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Cigalontang-Kabupaten Tasikmalaya-Jawa Barat', 44, 50);
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 62, 196, 62);
    };

    const addSectionTitle = (title: string, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(title, 14, y);
    };

    drawKop();
    let y = 73;

    addSectionTitle('Biodata Santri', y);
    autoTable(doc, {
      startY: y + 5,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1.8 },
      body: [
        ['NIS', santri.nis, 'Nama', santri.nama],
        ['Status', santri.status.toUpperCase(), 'Kelas/Kamar', `${santri.kelas} / ${santri.kamar || '-'}`],
        ['Jenis Kelamin', santri.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', 'Tanggal Lahir', santri.tanggal_lahir],
        ['Wali', wali?.full_name || '-', 'Kontak Wali', wali?.phone || wali?.email || '-'],
        ['Masuk Pondok', `${santri.bulan_masuk || '-'} ${santri.tahun_masuk || '-'}`, 'Alamat', santri.alamat || '-']
      ],
      columnStyles: { 0: { fontStyle: 'bold', textColor: [71, 85, 105] }, 2: { fontStyle: 'bold', textColor: [71, 85, 105] } }
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 28) + 12;
    addSectionTitle('Riwayat Pembayaran', y);
    autoTable(doc, {
      startY: y + 5,
      head: [['Periode', 'Jenis Tagihan', 'Nominal Tagihan', 'Status', 'Dibayar']],
      body: santriBills.length ? santriBills.map(b => {
        const paid = santriPayments.filter(p => p.tagihan_id === b.id && p.status === 'lunas').reduce((sum, p) => sum + p.nominal, 0);
        return [`${b.bulan} ${b.tahun}`, getJenisName(b.jenis_id), `Rp ${b.nominal.toLocaleString('id-ID')}`, b.status, `Rp ${paid.toLocaleString('id-ID')}`];
      }) : [['-', 'Belum ada riwayat tagihan', '-', '-', '-']],
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [6, 95, 70] }
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 20) + 12;
    addSectionTitle('Riwayat Raport', y);
    autoTable(doc, {
      startY: y + 5,
      head: [['Kelas', 'Semester', 'Tahun Ajaran', 'Status', 'Rata-rata', 'Predikat']],
      body: raportRows.length ? raportRows.map(r => {
        const avg = getRaportAverageForArchive(r);
        return [
          kelasListRaport.find(k => k.id === r.kelas_id)?.nama_kelas || '-',
          r.semester,
          r.tahun_ajaran,
          r.status,
          avg.toFixed(2),
          getRaportPredikat(avg)
        ];
      }) : [['-', 'Belum ada raport', '-', '-', '-', '-']],
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [6, 95, 70] }
    });

    doc.addPage();
    drawKop();
    y = 73;
    addSectionTitle('Riwayat Pelanggaran', y);
    autoTable(doc, {
      startY: y + 5,
      head: [['Tanggal', 'Jenis', 'Poin', 'Status', 'Deskripsi']],
      body: santriViolations.length ? santriViolations.map(v => [
        v.tanggal,
        getJenisVName(v.jenis_id),
        `${v.poin}`,
        v.status,
        v.deskripsi || '-'
      ]) : [['-', 'Tidak ada catatan pelanggaran', '-', '-', '-']],
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [127, 29, 29] }
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 20) + 12;
    addSectionTitle('Catatan Hafalan', y);
    autoTable(doc, {
      startY: y + 5,
      head: [['Tanggal', 'Program', 'Surah/Bab', 'Rentang', 'Volume', 'Nilai', 'Catatan']],
      body: santriHapalan.length ? santriHapalan.map(h => [
        h.tanggal,
        h.jenis,
        h.surah_nama,
        `${h.ayat_dari} - ${h.ayat_sampai}`,
        `${h.jumlah_halaman}`,
        h.nilai,
        h.catatan || '-'
      ]) : [['-', 'Belum ada catatan hafalan', '-', '-', '-', '-', '-']],
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175] }
    });

    if (raportRows.length > 0) {
      doc.addPage();
      drawKop();
      y = 73;
      addSectionTitle('Detail Nilai Raport', y);
      const detailRows = raportRows.flatMap(r => {
        const km = kelasMapelListRaport.filter(item => item.kelas_id === r.kelas_id);
        return km.map(item => {
          const nilai = nilaiListRaport.find(n =>
            n.santri_id === santri.id &&
            n.kelas_mapel_id === item.id &&
            n.semester === r.semester &&
            n.tahun_ajaran === r.tahun_ajaran
          );
          const akhir = Number(nilai?.nilai_akhir || 0);
          return [
            `${kelasListRaport.find(k => k.id === r.kelas_id)?.nama_kelas || '-'} / ${r.semester}`,
            mapelListRaport.find(m => m.id === item.mapel_id)?.nama_pelajaran || '-',
            `${nilai?.nilai_harian ?? 0}`,
            `${nilai?.nilai_uas ?? 0}`,
            akhir.toFixed(2),
            getRaportPredikat(akhir)
          ];
        });
      });
      autoTable(doc, {
        startY: y + 5,
        head: [['Kelas/Semester', 'Mata Pelajaran', 'Harian', 'UAS', 'Akhir', 'Predikat']],
        body: detailRows,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [6, 95, 70] }
      });
    }

    const safeName = santri.nama.replace(/\s+/g, '_');
    doc.save(`Arsip_Riwayat_${santri.nis}_${safeName}.pdf`);
  };

  // Dynamic Excel (.xlsx) Santri & Wali Import handlers
  const handleDownloadTemplate = () => {
    const headers = [
      'NIS', 
      'Nama Santri', 
      'Kelas', 
      'Kamar', 
      'Jenis Kelamin (L/P)', 
      'Tanggal Lahir (YYYY-MM-DD)', 
      'Alamat', 
      'Bulan Masuk', 
      'Tahun Masuk', 
      'Nama Wali (Orang Tua)', 
      'No HP Wali (Login)', 
      'Email Wali (Opsional)', 
      'Password Wali (Login)'
    ];

    const sample1 = [
      '10001', 'Zaidan Al-Fatih', 'IX - Tahfidz A', 'Abu Bakar Shiddiq', 'L', '2011-05-15', 
      'Jl. Sukajadi No. 45 Bandung', 'Januari', '2026', 'Bpk. Kurnia', '081234567890', 'kurnia@gmail.com', 'wali123'
    ];
    const sample2 = [
      '10002', 'Fatimah Az-Zahra', 'VIII - Reguler B', 'Aisyah Binti Abu Bakar', 'P', '2012-08-20', 
      'Jl. Kebon Jeruk No. 12 Jakarta', 'Januari', '2026', 'Ibu Aminah', '085698765432', 'aminah@gmail.com', 'wali456'
    ];

    const data = [headers, sample1, sample2];

    const ws = utils.aoa_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template Santri Wali');

    const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_santri_wali.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportSelectedFileName(file.name);
    setImportError('');
    setImportRowsPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!buffer) {
          setImportError('File kosong atau tidak dapat dibaca.');
          return;
        }

        const workbook = read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse Excel into objects mapping columns dynamically using key-headers
        const rows = utils.sheet_to_json<any>(worksheet);
        if (rows.length === 0) {
          setImportError('File Excel tidak memiliki data baris yang cukup.');
          return;
        }

        // Konversi Excel serial number ke format YYYY-MM-DD
        // Excel menyimpan tanggal sebagai angka hari sejak 1 Jan 1900
        const excelSerialToDate = (serial: any): string => {
          const str = String(serial).trim();
          // Kalau sudah format YYYY-MM-DD, langsung return
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
          // Kalau format DD/MM/YYYY atau DD-MM-YYYY
          if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(str)) {
            const parts = str.split(/[\/\-]/);
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          // Kalau angka (Excel serial date)
          const num = Number(str);
          if (!isNaN(num) && num > 1000) {
            // Excel epoch: 1 Jan 1900 = serial 1 (ada bug Excel: 1900 dianggap leap year)
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + num * 86400000);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
          return str || '2011-01-01';
        };

        const getFieldValFromRow = (rowObj: any, keysToTry: string[]): string => {
          if (!rowObj) return '';
          const objKeys = Object.keys(rowObj);
          for (const fallback of keysToTry) {
            const matchedKey = objKeys.find(k => {
              const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
              const cleanFallback = fallback.toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanKey.includes(cleanFallback) || cleanFallback.includes(cleanKey);
            });
            if (matchedKey !== undefined) {
              const val = rowObj[matchedKey];
              if (val === undefined || val === null) return '';
              return String(val).trim();
            }
          }
          return '';
        };

        const parsedRows: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const rowObj = rows[i];
          if (!rowObj) continue;

          const nis = getFieldValFromRow(rowObj, ['nis', 'nomorinduk', 'noinduk']);
          const nama = getFieldValFromRow(rowObj, ['namasantri', 'namalengkap', 'nama']);
          const kelas = getFieldValFromRow(rowObj, ['kelas']);
          const kamar = getFieldValFromRow(rowObj, ['kamar', 'asrama']);
          const jk = getFieldValFromRow(rowObj, ['jeniskelamin', 'gender', 'jk', 'kelamin']);
          const birth = excelSerialToDate(getFieldValFromRow(rowObj, ['tanggallahir', 'tgllahir', 'lahir']) || '2011-01-01');
          const alamat = getFieldValFromRow(rowObj, ['alamat', 'domisili']);
          const bulanMasuk = getFieldValFromRow(rowObj, ['bulanmasuk', 'bulan']);
          const tahunMasuk = getFieldValFromRow(rowObj, ['tahunmasuk', 'tahun']);
          const waliNama = getFieldValFromRow(rowObj, ['namawali', 'orangtua', 'namaortu', 'wali']);
          const waliPhone = getFieldValFromRow(rowObj, ['nohpwali', 'teleponwali', 'hpwali', 'nohp', 'telepon', 'whatsapp', 'wa', 'phone']);
          const waliEmail = getFieldValFromRow(rowObj, ['emailwali', 'emailortu', 'email']);
          const waliPassword = getFieldValFromRow(rowObj, ['passwordwali', 'password', 'pass']);

          if (!nis || !nama || !kelas) {
            continue; // Skip faulty pages, headers or incomplete records
          }

          parsedRows.push({
            nis,
            nama,
            kelas,
            kamar: kamar || 'Belum Ditunjuk',
            jk: (jk && jk.toUpperCase().startsWith('P')) ? 'P' : 'L',
            birth: birth,
            alamat: alamat || '',
            bulanMasuk: bulanMasuk || 'Januari',
            tahunMasuk: tahunMasuk || '2026',
            waliNama: waliNama || `Wali ${nama}`,
            waliPhone: waliPhone || `0851${Math.floor(10000000 + Math.random() * 90000000)}`,
            waliEmail: waliEmail || `${nama.toLowerCase().replace(/\s+/g, '')}@pesantren.com`,
            waliPassword: waliPassword || '123456'
          });
        }

        if (parsedRows.length === 0) {
          setImportError('Tidak ada data baris valid yang ditemukan atau format kolom tidak sesuai.');
        } else {
          setImportRowsPreview(parsedRows);
        }
      } catch (err) {
        setImportError('Gagal memproses file Excel. Pastikan file berformat Excel (.xlsx atau .xls) yang valid.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = () => {
    if (importRowsPreview.length === 0) return;

    triggerConfirm(
      'Konfirmasi Import Data Santri & Wali',
      `Apakah Anda yakin ingin memproses dan mengimpor ${importRowsPreview.length} data santri? Sistem juga akan secara otomatis membuat akun login bagi wali/orangtua masing-masing santri baru tersebut secara instan.`,
      async () => {
        setActionDoneMsg('⏳ Sedang memproses import... Harap tunggu.');

        const currentSantri = dbLocal.getSantri();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token || '';

        let createdStudentCount = 0;
        let createdWaliCount = 0;
        let createdBillCount = 0;
        const errors: string[] = [];

        for (const row of importRowsPreview) {
          // Skip duplicate NIS
          if (currentSantri.some(s => s.nis === row.nis)) continue;

          try {
            // Reuse the existing server endpoint that properly creates Supabase Auth + profile + santri
            const response = await fetch('/api/admin/wali/create-with-santri-auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                wali: {
                  full_name: row.waliNama,
                  phone: row.waliPhone,
                  email: row.waliEmail.trim().toLowerCase(),
                  password: row.waliPassword || '123456'
                },
                santri: {
                  nis: row.nis,
                  nama: row.nama,
                  kelas: row.kelas,
                  kamar: row.kamar || null,
                  jenis_kelamin: row.jk,
                  tanggal_lahir: row.birth,
                  alamat: row.alamat || null,
                  status: 'aktif',
                  tahun_masuk: row.tahunMasuk,
                  bulan_masuk: row.bulanMasuk
                }
              })
            });

            const result = await response.json();

            if (!response.ok) {
              // If wali email already exists (duplicate), try inserting santri only with existing wali
              if (response.status === 409 || (result.error || '').toLowerCase().includes('already')) {
                // Find existing wali by email from current profiles cache
                const existingWali = dbLocal.getProfiles().find(
                  p => p.email?.toLowerCase() === row.waliEmail.trim().toLowerCase()
                );
                if (existingWali) {
                  const { error: santriErr } = await supabase.from('santri').insert({
                    nis: row.nis,
                    nama: row.nama,
                    kelas: row.kelas,
                    kamar: row.kamar || null,
                    jenis_kelamin: row.jk,
                    tanggal_lahir: row.birth,
                    alamat: row.alamat || null,
                    wali_id: existingWali.id,
                    status: 'aktif',
                    tahun_masuk: row.tahunMasuk,
                    bulan_masuk: row.bulanMasuk
                  });
                  if (!santriErr) {
                    createdStudentCount++;
                  } else {
                    errors.push(`${row.nama}: ${santriErr.message}`);
                  }
                } else {
                  errors.push(`${row.nama}: ${result.error}`);
                }
              } else {
                errors.push(`${row.nama}: ${result.error}`);
              }
              continue;
            }

            createdStudentCount++;
            createdWaliCount++;

            // Auto-generate bills for month of entry
            const newSantriId = result.santri?.id;
            if (newSantriId) {
              const existingBills = dbLocal.getTagihan();
              const targetMonth = row.bulanMasuk || 'Juni';
              const targetYear = row.tahunMasuk || '2026';

              const matchingBills = existingBills.filter(b =>
                b.bulan.toLowerCase() === targetMonth.toLowerCase() &&
                String(b.tahun) === String(targetYear)
              );

              const uniqueCombos: { jenis_id: string; nominal: number }[] = [];
              matchingBills.forEach(b => {
                if (!uniqueCombos.some(u => u.jenis_id === b.jenis_id)) {
                  uniqueCombos.push({ jenis_id: b.jenis_id, nominal: b.nominal });
                }
              });

              if (uniqueCombos.length > 0) {
                try {
                  const newBills = await dbLocal.insertTagihanBatch(
                    uniqueCombos.map(combo => ({
                      santri_id: newSantriId,
                      jenis_id: combo.jenis_id,
                      bulan: targetMonth,
                      tahun: targetYear,
                      nominal: combo.nominal,
                      status: 'pending' as const
                    }))
                  );
                  createdBillCount += newBills.length;
                } catch (_billErr) {
                  // Bill generation failure is non-fatal
                }
              }
            }
          } catch (err: any) {
            errors.push(`${row.nama}: ${err.message || err}`);
          }
        }

        // Refresh data from Supabase
        await refreshAdminData();

        // Clean up import states
        setImportRowsPreview([]);
        setImportSelectedFileName('');
        setShowImportForm(false);

        const errSuffix = errors.length > 0 ? ` | ⚠️ ${errors.length} gagal: ${errors.slice(0, 3).join('; ')}` : '';
        setActionDoneMsg(`🎉 Sukses mengimpor ${createdStudentCount} santri baru, meregistrasi ${createdWaliCount} akun wali baru & menyusun ${createdBillCount} tagihan otomatis!${errSuffix}`);
        setTimeout(() => setActionDoneMsg(null), 8000);
      }
    );
  };

  // Generate Invoices in batch bulk
  const handleBulkGenerateTagihan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selJenisId || !selBulan || !selTahun || !selNominal) {
      setActionDoneMsg('⚠️ Harap isi lengkap seluruh parameter invoice!');
      setTimeout(() => setActionDoneMsg(null), 3000);
      return;
    }

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const parseYear = (value: string | number | undefined): number => {
      if (!value) return 2026;
      const str = String(value).trim();
      const match = str.match(/\d{4}/);
      if (match) return Number(match[0]);
      const parsed = Number(str);
      return isNaN(parsed) ? 2026 : parsed;
    };

    const targetMonthIdx = monthNames.findIndex(m => m.toLowerCase() === selBulan.toLowerCase());
    const targetYear = parseYear(selTahun);

    // Filter santris based on selected target scope (semua vs specific santri)
    let eligibleStudents: Santri[] = [];
    if (targetScope === 'santri') {
      if (!targetSantriId) {
        setActionDoneMsg('⚠️ Harap pilih santri spesifik penerima tagihan!');
        setTimeout(() => setActionDoneMsg(null), 3000);
        return;
      }
      const selectedS = santriList.find(s => s.id === targetSantriId);
      eligibleStudents = selectedS && selectedS.status === 'aktif' ? [selectedS] : [];
    } else {
      eligibleStudents = bypassEntranceFilter 
        ? santriList.filter(s => s.status === 'aktif')
        : santriList.filter(s => {
            if (s.status !== 'aktif') return false;
            const joinYear = parseYear(s.tahun_masuk);
            const joinMonthIdx = monthNames.findIndex(m => m.toLowerCase() === (s.bulan_masuk || 'Januari').toLowerCase());
            
            if (joinMonthIdx === -1) return true; // fallback if month name not matching standard
            if (targetYear > joinYear) return true;
            if (targetYear === joinYear && targetMonthIdx >= joinMonthIdx) return true;
            return false;
          });
    }

    if (eligibleStudents.length === 0) {
      setActionDoneMsg('⚠️ Tidak ada santri aktif yang memenuhi syarat masuk pada periode terdaftar!');
      setTimeout(() => setActionDoneMsg(null), 4000);
      return;
    }

    const activeStudentCount = santriList.filter(s => s.status === 'aktif').length;
    const skippedCount = targetScope === 'santri' ? 0 : (activeStudentCount - eligibleStudents.length);

    triggerConfirm(
      targetScope === 'santri' ? 'Konfirmasi Kirim Tagihan Spesifik' : 'Konfirmasi Kirim Tagihan Bulk',
      targetScope === 'santri'
        ? `Apakah Anda yakin ingin men-generate tagihan khusus [${getJenisName(selJenisId)}] periode ${selBulan} ${selTahun} sebesar Rp ${selNominal.toLocaleString('id-ID')} hanya untuk santri "${eligibleStudents[0].nama}"?`
        : `Apakah Anda yakin ingin men-generate tagihan bulk [${getJenisName(selJenisId)}] periode ${selBulan} ${selTahun} sebesar Rp ${selNominal.toLocaleString('id-ID')} untuk ${eligibleStudents.length} santri aktif?${skippedCount > 0 ? ` (${skippedCount} santri akan dilewati karena belum masuk pada bulan tersebut).` : ''}`,
      async () => {
        const batchData = eligibleStudents.map(s => ({
          santri_id: s.id,
          jenis_id: selJenisId,
          bulan: selBulan,
          tahun: selTahun,
          nominal: Number(selNominal),
          status: 'pending' as const
        }));

        try {
          const newCreated = await dbLocal.insertTagihanBatch(batchData);
          
          // Refresh from Supabase
          await refreshAdminData();

          setActionDoneMsg(
            targetScope === 'santri'
              ? `✅ Sukses memproses tagihan khusus untuk ${eligibleStudents[0].nama}!`
              : `✅ Sukses memproses ${newCreated.length} tagihan baru!${skippedCount > 0 ? ` (${skippedCount} santri dilewati otomatis)` : ''}`
          );
          setTimeout(() => setActionDoneMsg(null), 5000);
        } catch (err: any) {
          setActionDoneMsg(`❌ Gagal membuat tagihan: ${err.message || err}`);
          setTimeout(() => setActionDoneMsg(null), 5000);
        }
      }
    );
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annJudul || !annPesan) return;

    try {
      const { error: annError } = await supabase.from('pengumuman').insert({
        judul: annJudul,
        pesan: annPesan,
        target: annTarget,
        target_value: annTargetVal || 'semua',
        created_by: user?.id || null
      });

      if (annError) throw annError;

      // Send notifications to everyone
      const walis = profilesList.filter(p => p.role === 'user');
      for (const w of walis) {
        await dbLocal.insertNotification({
          user_id: w.id,
          judul: `Pengumuman: ${annJudul}`,
          pesan: annPesan,
          tipe: 'pengumuman',
          is_read: false
        });
      }

      await refreshAdminData();
      setActionDoneMsg('✅ Pengumuman diposting & disiarkan silang-notifikasi gratis!');
      setTimeout(() => setActionDoneMsg(null), 3000);

      setAnnJudul('');
      setAnnPesan('');
      setAnnTargetVal('');
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal posting pengumuman: ${err.message || err}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  // 1. Create customized Jenis Pembayaran billing category
  const handleCreateJenisPembayaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJenisNama.trim()) {
      alert('Nama jenis iuran tidak boleh kosong!');
      return;
    }
    const list = dbLocal.getJenisPembayaran();
    const duplicate = list.find(j => j.nama.toLowerCase() === newJenisNama.trim().toLowerCase());
    if (duplicate) {
      alert('Jenis pembayaran / iuran dengan nama ini sudah ada!');
      return;
    }
    try {
      const { error } = await supabase.from('jenis_pembayaran').insert({
        nama: newJenisNama.trim(),
        deskripsi: newJenisDeskripsi.trim() || null,
        is_active: true
      });
      if (error) throw error;
      await refreshAdminData();
      setNewJenisNama('');
      setNewJenisDeskripsi('');
      setActionDoneMsg('✅ Sukses menambahkan kategori iuran baru!');
      setTimeout(() => setActionDoneMsg(null), 3000);
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal menambahkan jenis pembayaran: ${err.message || err}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  // 2. Delete existing Jenis Pembayaran billing category
  const handleDeleteJenisPembayaran = (id: string) => {
    triggerConfirm(
      'Hapus Kategori Iuran',
      'Apakah Anda yakin ingin menghapus kategori iuran ini?',
      async () => {
        try {
          const { error } = await supabase.from('jenis_pembayaran').delete().eq('id', id);
          if (error) throw error;
          await refreshAdminData();
          setActionDoneMsg('🚨 Kategori iuran berhasil dihapus dari sistem.');
        } catch (err: any) {
          setActionDoneMsg(`❌ Gagal menghapus: ${err.message || err}`);
        }
        setTimeout(() => setActionDoneMsg(null), 3000);
      }
    );
  };

  // 2b. Delete a single Tagihan / Invoice active
  const handleDeleteTagihan = (id: string) => {
    triggerConfirm(
      'Hapus / Batalkan Tagihan',
      'Apakah Anda yakin ingin menarik kembali/membatalkan tagihan aktif ini? Hal ini juga akan menghapus data riwayat transaksi pembayaran jika ada.',
      async () => {
        try {
          // Delete associated payments first
          await supabase.from('pembayaran').delete().eq('tagihan_id', id);
          const { error } = await supabase.from('tagihan').delete().eq('id', id);
          if (error) throw error;
          await refreshAdminData();
          setActionDoneMsg('🚨 Tagihan berhasil ditarik kembali/dibatalkan dari server pesantren.');
        } catch (err: any) {
          setActionDoneMsg(`❌ Gagal menghapus tagihan: ${err.message || err}`);
        }
        setTimeout(() => setActionDoneMsg(null), 3000);
      }
    );
  };

  // 2b-bulk. Bulk delete pending bills currently matching the filter
  const handleBulkDeletePendingBillsByFilter = () => {
    // Collect the bills that match the current filters AND are pending
    const filteredPending = bills.filter(b => {
      if (b.status !== 'pending') return false;
      
      const sComp = santriList.find(s => s.id === b.santri_id);
      const studentName = sComp?.nama.toLowerCase() || '';
      const wName = getWaliName(sComp?.wali_id).toLowerCase();
      const sKelas = sComp?.kelas.toLowerCase() || '';
      const jName = getJenisName(b.jenis_id).toLowerCase();
      const q = cfgTagihanSearch.toLowerCase().trim();
      
      if (q) {
        const matchesSearch = studentName.includes(q) || wName.includes(q) || sKelas.includes(q) || jName.includes(q) || b.bulan.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      
      if (cfgTagihanJenisFilter !== 'semua') {
        if (b.jenis_id !== cfgTagihanJenisFilter) return false;
      }
      
      return true;
    });

    if (filteredPending.length === 0) {
      triggerConfirm(
        'Tarik Kembali Tagihan Massal',
        'Tidak ditemukan tagihan berstatus "Pending" yang sesuai dengan filter pencarian saat ini.',
        () => {}
      );
      return;
    }

    triggerConfirm(
      'Konfirmasi Tarik / Batalkan Massal',
      `Apakah Anda yakin ingin MENARIK KEMBALI & MEMBATALKAN seluruh ${filteredPending.length} tagihan pending (belum dibayar) yang terpilih sesuai filter? Tagihan-tagihan ini akan secara otomatis terhapus dari tagihan berjalan santri & wali.`,
      async () => {
        try {
          const excludeIds = filteredPending.map(f => f.id);
          // Delete associated payments first
          await supabase.from('pembayaran').delete().in('tagihan_id', excludeIds);
          const { error } = await supabase.from('tagihan').delete().in('id', excludeIds);
          if (error) throw error;
          await refreshAdminData();
          setActionDoneMsg(`🚨 Berhasil menarik/membatalkan ${filteredPending.length} tagihan pending massal!`);
        } catch (err: any) {
          setActionDoneMsg(`❌ Gagal: ${err.message || err}`);
        }
        setTimeout(() => setActionDoneMsg(null), 4000);
      }
    );
  };

  // 2b-direct-id. Can cancel/withdraw a bill directly by searching its exact or partial ID code
  const handleCancelTagihanByDirectID = (idToCancel: string) => {
    const cleanId = idToCancel.trim();
    if (!cleanId) {
      triggerConfirm(
        'Batal Tagihan per ID',
        'Silakan masukkan ID Tagihan terlebih dahulu.',
        () => {}
      );
      return;
    }

    const tList = dbLocal.getTagihan();
    const matched = tList.find(t => 
      t.id.toLowerCase() === cleanId.toLowerCase() || 
      t.id.toLowerCase().includes(cleanId.toLowerCase())
    );

    if (!matched) {
      triggerConfirm(
        'Tagihan Tidak Ditemukan',
        `Maaf, tidak ada data tagihan dengan ID atau mengandung kata "${cleanId}" yang ditemukan dalam database pesantren.`,
        () => {}
      );
      return;
    }

    const sComp = santriList.find(s => s.id === matched.santri_id);
    const labelS = sComp ? `${sComp.nama} (Kelas ${sComp.kelas})` : 'Santri Tidak Ditemukan';
    const jName = getJenisName(matched.jenis_id);

    triggerConfirm(
      'Konfirmasi Tarik / Batalkan per ID Tagihan',
      `Apakah Anda yakin ingin MENARIK KEMBALI & MEMBATALKAN tagihan tunggal berikut?\n\n• ID Invoice: ${matched.id}\n• Nama Santri: ${labelS}\n• Kategori Iuran: ${jName}\n• Periode Tagihan: ${matched.bulan} ${matched.tahun}\n• Jumlah Nominal: Rp ${matched.nominal.toLocaleString('id-ID')}\n• Status Iuran: ${matched.status.toUpperCase()}\n\nTindakan ini bersifat permanen dan tagihan akan ditarik dari portal wali santri.`,
      async () => {
        try {
          await supabase.from('pembayaran').delete().eq('tagihan_id', matched.id);
          const { error } = await supabase.from('tagihan').delete().eq('id', matched.id);
          if (error) throw error;
          await refreshAdminData();
          setCancelTargetId('');
          setActionDoneMsg(`🚨 Berhasil menarik tagihan ID #${matched.id.substring(4,10)}.. (${jName}) milik ${sComp?.nama || 'santri'}!`);
        } catch (err: any) {
          setActionDoneMsg(`❌ Gagal: ${err.message || err}`);
        }
        setTimeout(() => setActionDoneMsg(null), 4000);
      }
    );
  };

  // 2c. Manually settle (Lunas) a tagihan via Cash
  const handleManualSettleCash = (tabId: string) => {
    const tList = dbLocal.getTagihan();
    const tRecord = tList.find(t => t.id === tabId);
    if (tRecord) {
      triggerConfirm(
        'Konfirmasi Pembayaran Tunai',
        'Konfirmasi pembayaran tunai (CASH) untuk tagihan ini? Status tagihan akan diubah menjadi LUNAS.',
        async () => {
          try {
            // Update tagihan status
            const { error: tagihanErr } = await supabase
              .from('tagihan')
              .update({ status: 'lunas' })
              .eq('id', tabId);
            if (tagihanErr) throw tagihanErr;

            // Insert payment record
            const orderId = `CSR-${Date.now()}`;
            const { error: payErr } = await supabase.from('pembayaran').insert({
              tagihan_id: tabId,
              nominal: tRecord.nominal,
              status: 'lunas',
              metode: 'CASH / Tunai (Manual)',
              order_id: orderId,
              paid_at: new Date().toISOString()
            });
            if (payErr) throw payErr;

            // Insert notification for wali
            const sList = dbLocal.getSantri();
            const sInfo = sList.find(s => s.id === tRecord.santri_id);
            const jInfo = dbLocal.getJenisPembayaran().find(j => j.id === tRecord.jenis_id);
            if (sInfo && sInfo.wali_id) {
              const payName = jInfo ? jInfo.nama : 'Iuran';
              await dbLocal.insertNotification({
                user_id: sInfo.wali_id,
                judul: 'Pembayaran Tagihan Terverifikasi',
                pesan: `Alhamdulillah, pembayaran ${payName} bulan ${tRecord.bulan} ${tRecord.tahun} sebesar Rp ${tRecord.nominal.toLocaleString('id-ID')} untuk ${sInfo.nama} telah diverifikasi lunas secara CASH oleh Admin.`,
                tipe: 'pembayaran',
                ref_id: tabId,
                is_read: false
              });
            }

            await refreshAdminData();
            setActionDoneMsg('✅ Tagihan berhasil ditandai Lunas secara CASH / Tunai!');
          } catch (err: any) {
            setActionDoneMsg(`❌ Gagal: ${err.message || err}`);
          }
          setTimeout(() => setActionDoneMsg(null), 3000);
        }
      );
    }
  };

  const handleOpenCashInstallmentModal = (tagihanId: string) => {
    const tRecord = bills.find(t => t.id === tagihanId) || dbLocal.getTagihan().find(t => t.id === tagihanId);
    if (!tRecord) {
      setActionDoneMsg('Tagihan tidak ditemukan.');
      setTimeout(() => setActionDoneMsg(null), 3000);
      return;
    }

    if (tRecord.status !== 'pending') {
      setActionDoneMsg('Tagihan ini sudah lunas, tidak perlu cicilan cash lagi.');
      setTimeout(() => setActionDoneMsg(null), 3000);
      return;
    }

    setCashInstallmentModal({
      isOpen: true,
      tagihanId,
      nominalText: '',
      error: undefined
    });
  };

  const handleCashInstallmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashInstallmentModal) return;

    const tRecord = bills.find(t => t.id === cashInstallmentModal.tagihanId) || dbLocal.getTagihan().find(t => t.id === cashInstallmentModal.tagihanId);
    if (!tRecord) {
      setCashInstallmentModal(prev => prev ? { ...prev, error: 'Tagihan tidak ditemukan.' } : prev);
      return;
    }

    const paidAmount = Number(cashInstallmentModal.nominalText.replace(/[^\d]/g, ''));
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      setCashInstallmentModal(prev => prev ? { ...prev, error: 'Nominal cicilan cash wajib lebih dari Rp 0.' } : prev);
      return;
    }

    if (paidAmount > Number(tRecord.nominal)) {
      setCashInstallmentModal(prev => prev ? { ...prev, error: `Nominal cicilan tidak boleh melebihi sisa tagihan Rp ${tRecord.nominal.toLocaleString('id-ID')}.` } : prev);
      return;
    }

    const remaining = Math.max(Number(tRecord.nominal) - paidAmount, 0);
    const nextStatus = remaining > 0 ? 'pending' : 'lunas';

    try {
      const orderId = `CSC-${Date.now()}`;
      const { error: payErr } = await supabase.from('pembayaran').insert({
        tagihan_id: tRecord.id,
        nominal: paidAmount,
        status: 'lunas',
        metode: remaining > 0 ? 'CASH / Tunai (Cicilan)' : 'CASH / Tunai (Pelunasan)',
        order_id: orderId,
        paid_at: new Date().toISOString()
      });
      if (payErr) throw payErr;

      const { error: tagihanErr } = await supabase
        .from('tagihan')
        .update({
          nominal: remaining > 0 ? remaining : tRecord.nominal,
          status: nextStatus
        })
        .eq('id', tRecord.id);
      if (tagihanErr) throw tagihanErr;

      const sInfo = santriList.find(s => s.id === tRecord.santri_id) || dbLocal.getSantri().find(s => s.id === tRecord.santri_id);
      const jInfo = jPembayaranList.find(j => j.id === tRecord.jenis_id) || dbLocal.getJenisPembayaran().find(j => j.id === tRecord.jenis_id);
      if (sInfo && sInfo.wali_id) {
        const payName = jInfo ? jInfo.nama : 'Iuran';
        await dbLocal.insertNotification({
          user_id: sInfo.wali_id,
          judul: remaining > 0 ? 'Cicilan Cash Diterima' : 'Tagihan Cash Lunas',
          pesan: remaining > 0
            ? `Pembayaran cicilan cash ${payName} bulan ${tRecord.bulan} ${tRecord.tahun} sebesar Rp ${paidAmount.toLocaleString('id-ID')} untuk ${sInfo.nama} telah diterima. Sisa tagihan: Rp ${remaining.toLocaleString('id-ID')}.`
            : `Alhamdulillah, pembayaran cash ${payName} bulan ${tRecord.bulan} ${tRecord.tahun} sebesar Rp ${paidAmount.toLocaleString('id-ID')} untuk ${sInfo.nama} telah melunasi tagihan.`,
          tipe: 'pembayaran',
          ref_id: tRecord.id,
          is_read: false
        });
      }

      await refreshAdminData();
      setCashInstallmentModal(null);
      setActionDoneMsg(
        remaining > 0
          ? `Cicilan cash tercatat. Sisa tagihan sekarang Rp ${remaining.toLocaleString('id-ID')}.`
          : 'Cicilan cash tercatat dan tagihan otomatis LUNAS.'
      );
      setTimeout(() => setActionDoneMsg(null), 4000);
    } catch (err: any) {
      setCashInstallmentModal(prev => prev ? { ...prev, error: `Gagal menyimpan cicilan: ${err.message || err}` } : prev);
    }
  };

  // 3. Collect & Format Monthly Analytics Data for the Chart (Jan - Dec 2026)
  const getChartData = () => {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const chartMap = monthNames.map((name, idx) => {
      // Find invoices of 2026 for this specific month name
      const monthBills = bills.filter(b => b.bulan === name);
      const lunasNominal = monthBills.filter(b => b.status === 'lunas').reduce((sum, b) => sum + b.nominal, 0);
      const pendingNominal = monthBills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.nominal, 0);
      
      return {
        name: monthShort[idx],
        lunasVal: lunasNominal,
        tunggakanVal: pendingNominal,
        Lunas: lunasNominal,
        Tunggakan: pendingNominal,
      };
    });

    // Output all 12 months for 2026 to make it premium looking or filter to current active ones (Jan - Jul)
    return chartMap.slice(0, 7);
  };

  // 4. Download Professional PDF Recaps Report with customized and elegant styling
  const handleDownloadPDFReport = async () => {
    setActionDoneMsg('Menyiapkan PDF laporan keuangan...');
    const logoDataUrl = await loadImageAsDataUrl(MATHLABUL_HIDAYAH_LOGO_URL);

    // 1. Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');

    // 2. Modern kop laporan
    doc.setFillColor(4, 120, 87);
    doc.rect(0, 0, 210, 9, 'F');
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 9, 210, 1.2, 'F');

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(13, 15, 24, 24, 4, 4, 'F');
    doc.setDrawColor(220, 252, 231);
    doc.roundedRect(13, 15, 24, 24, 4, 4, 'D');

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 16, 18, 18, 18);
    } else {
      doc.setFillColor(4, 120, 87);
      doc.circle(25, 27, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('MH', 25, 29.5, { align: 'center' });
    }

    const pesantrenName = profilPP?.nama || 'Pondok Pesantren Mathlabul Hidayah Nursalam';
    const pesantrenNameLines = doc.splitTextToSize(pesantrenName, 104).slice(0, 2);

    doc.setTextColor(15, 23, 42); 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(pesantrenNameLines.length > 1 ? 12 : 14);
    doc.text(pesantrenNameLines, 42, 19);

    doc.setTextColor(4, 120, 87);
    doc.setFontSize(8);
    doc.text('SISTEM INFORMASI KEUANGAN PESANTREN', 42, pesantrenNameLines.length > 1 ? 28 : 25);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(profilPP?.tagline || 'Membentuk Generasi Qurani, Cerdas, dan Berkarakter Robbani', 42, pesantrenNameLines.length > 1 ? 33 : 30, { maxWidth: 104 });
    doc.text('Cigalontang-Kabupaten Tasikmalaya-Jawa Barat', 42, pesantrenNameLines.length > 1 ? 38 : 34.5, { maxWidth: 104 });

    doc.setFillColor(240, 253, 244);
    doc.roundedRect(151, 16, 46, 19, 4, 4, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(151, 16, 46, 19, 4, 4, 'D');
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('LAPORAN BULANAN', 174, 23, { align: 'center' });
    doc.setFontSize(10);
    doc.text('KEUANGAN', 174, 29, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(12, 43, 198, 43);

    // Title of Report
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('LAPORAN HASIL REKAPITULASI PENERIMAAN KAS KEUANGAN', 12, 51);

    // Metadata Subtitle Info Box background
    doc.setFillColor(248, 250, 252); 
    doc.roundedRect(12, 56, 186, 20, 3, 3, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(12, 56, 186, 20, 3, 3, 'D');

    doc.setTextColor(71, 85, 105); 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    const formattedBulan = `${filterBulan} ${filterTahun}`;
    const formattedTanggal = new Date(filterSingleDate).toLocaleDateString('id-ID');
    const formattedRentang = `${new Date(filterStartDate).toLocaleDateString('id-ID')} s.d. ${new Date(filterEndDate).toLocaleDateString('id-ID')}`;
    const filterDesc = reportFilterType === 'bulan' ? formattedBulan : reportFilterType === 'tanggal' ? formattedTanggal : formattedRentang;
    const filtered = getReportPayments();
    const categorySummary = getFinancialCategorySummary();
    const reportTypeLabel = reportFilterType === 'bulan' ? 'Bulanan Terjadwal' : reportFilterType === 'tanggal' ? 'Tanggal Harian' : 'Rentang Tanggal';

    doc.text(`Tipe Laporan: ${reportTypeLabel}`, 16, 64);
    doc.text(`Parameter Filter: ${filterDesc}`, 16, 70);

    doc.text(`Dicetak Oleh: ${user?.email || 'Administrator'}`, 116, 64);
    doc.text(`Kategori Masuk: ${categorySummary.length} kategori`, 116, 70);

    const rows = filtered.map((p, idx) => {
      const b = bills.find(t => t.id === p.tagihan_id);
      const s = santriList.find(stu => stu.id === b?.santri_id);
      const j = jPembayaranList.find(jp => jp.id === b?.jenis_id);
      const dateLabel = p.paid_at 
        ? new Date(p.paid_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) 
        : '-';

      return [
        idx + 1,
        p.order_id || p.id,
        s?.nama || 'N/A',
        s?.kelas || 'N/A',
        j?.nama || 'SPP Pesantren',
        dateLabel,
        p.metode || 'Transfer',
        `Rp ${p.nominal.toLocaleString('id-ID')}`
      ];
    });

    const totalRevenue = filtered.reduce((sum, item) => sum + item.nominal, 0);
    const totalMidtransRevenue = filtered.filter(p => !isCashPayment(p)).reduce((sum, item) => sum + item.nominal, 0);
    const totalCashRevenue = filtered.filter(isCashPayment).reduce((sum, item) => sum + item.nominal, 0);
    const categoryRows = categorySummary.map((item, idx) => [
      idx + 1,
      item.nama,
      item.transaksi,
      `Rp ${item.midtrans.toLocaleString('id-ID')}`,
      `Rp ${item.cash.toLocaleString('id-ID')}`,
      `Rp ${item.total.toLocaleString('id-ID')}`
    ]);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`RINGKASAN PEMASUKAN PER KATEGORI (${categorySummary.length} KATEGORI MASUK)`, 12, 82);

    autoTable(doc, {
      startY: 86,
      head: [['No', 'Kategori Iuran', 'Transaksi', 'Midtrans', 'Cash', 'Total Masuk']],
      body: categoryRows,
      theme: 'grid',
      styles: { fontSize: 7.2, font: 'helvetica', cellPadding: 2 },
      headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 12, right: 12 }
    });

    const detailTableY = ((doc as any).lastAutoTable?.finalY || 86) + 9;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DETAIL TRANSAKSI PEMBAYARAN LUNAS', 12, detailTableY - 3);

    // Generate detail table
    autoTable(doc, {
      startY: detailTableY,
      head: [['No', 'ID Transaksi / Order ID', 'Nama Santri', 'Kelas', 'Peruntukan Iuran', 'Tanggal Settle', 'Metode', 'Nominal']],
      body: rows,
      theme: 'striped',
      styles: { fontSize: 7.5, font: 'helvetica' },
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        7: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 12, right: 12 }
    });

    // Profit Box at bottom
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    if (finalY > 245) {
      doc.addPage();
      finalY = 18;
    }
    
    doc.setFillColor(240, 253, 250); 
    doc.rect(112, finalY, 86, 34, 'F');
    doc.setDrawColor(204, 251, 241);
    doc.rect(112, finalY, 86, 34, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Jumlah Transaksi Lunas:', 116, finalY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(String(filtered.length), 190, finalY + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Kategori Masuk:', 116, finalY + 12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${categorySummary.length} kategori`, 190, finalY + 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Masuk via Midtrans:', 116, finalY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${totalMidtransRevenue.toLocaleString('id-ID')}`, 190, finalY + 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Masuk via Cash:', 116, finalY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${totalCashRevenue.toLocaleString('id-ID')}`, 190, finalY + 24, { align: 'right' });

    doc.text('Total Penerimaan Kas:', 116, finalY + 30);
    doc.setTextColor(4, 120, 87);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${totalRevenue.toLocaleString('id-ID')}`, 190, finalY + 30, { align: 'right' });

    // Decorative Signatures Box at bottom
    const sigY = finalY + 46;
    if (sigY <= 265) {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Mengetahui,', 16, sigY);
      doc.text('Pimpinan Pondok Pesantren', 16, sigY + 4);
      
      doc.text('Dicetak oleh,', 145, sigY);
      doc.text('Bendahara / Administrator', 145, sigY + 4);

      doc.setDrawColor(203, 213, 225);
      doc.line(16, sigY + 20, 60, sigY + 20);
      doc.line(145, sigY + 20, 195, sigY + 20);

      doc.setTextColor(15, 23, 42);
      doc.text('KH. Ahmad Nursalam, M.Ag', 16, sigY + 24);
      doc.text(user?.email || 'Admin Keuangan', 145, sigY + 24);
    }

    // Save
    const filename = `Laporan_Penerimaan_${reportFilterType === 'bulan' ? filterBulan : reportFilterType === 'tanggal' ? filterSingleDate : 'Rentang'}_2026.pdf`;
    doc.save(filename);
    
    setActionDoneMsg(`🎉 Sukses mengunduh rekapitulasi ${filename}!`);
    setTimeout(() => setActionDoneMsg(null), 4000);
  };

  const handleUpdateCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profilPP) {
      const updatedPP = {
        ...profilPP,
        nama: cmsModelNama,
        tagline: cmsTagline,
        visi: cmsVisi,
        misi: cmsMisi,
        alamat: cmsAlamat,
        telepon: cmsTelepon,
        email: cmsEmail,
        footer_description: footerDescription,
        footer_copyright: footerCopyright,

        hero_bg_color: heroBgColor,
        hero_img_url: heroImgUrl,
        hero_img_opacity: Number(heroImgOpacity) || 0,
        hero_type: heroType,

        stats_santri_val: statsSantriVal,
        stats_santri_lbl: statsSantriLbl,
        stats_halaqah_val: statsHalaqahVal,
        stats_halaqah_lbl: statsHalaqahLbl,
        stats_spp_val: statsSppVal,
        stats_spp_lbl: statsSppLbl,
        stats_satisfaction_val: statsSatisfactionVal,
        stats_satisfaction_lbl: statsSatisfactionLbl,

        sejarah_sub: sejarahSub,
        sejarah_title: sejarahTitle,
        sejarah: sejarahDesc,

        routines_json: routinesJson,
        facilities_json: facilitiesJson,
        testimonials_json: testimonialsJson,
        programs_json: programsJson,
        faq_json: faqJson,
        section_titles_json: sectionTitlesJson,
        social_links_json: socialLinksJson,

        updated_at: new Date().toISOString()
      };
      try {
        const { error } = await supabase
          .from('profil_pesantren')
          .upsert(updatedPP);
        if (error) throw error;
        dbLocal.setProfilPesantren(updatedPP);
        setActionDoneMsg('✅ Pengaturan web pesantren berhasil disimpan.');
      } catch (err: any) {
        setActionDoneMsg(`❌ Gagal menyimpan: ${err.message || err}`);
      }
      setTimeout(() => setActionDoneMsg(null), 4000);
    }
  };

  const handleOpenNewsForm = (berita?: Berita) => {
    if (berita) {
      setNewsEditId(berita.id);
      setNewsJudul(berita.judul);
      setNewsKonten(berita.konten);
      setNewsPenulis(berita.penulis);
      setNewsIsPublished(berita.is_published);
      setNewsThumbnailUrl(berita.thumbnail_url || '');
    } else {
      setNewsEditId(null);
      setNewsJudul('');
      setNewsKonten('');
      setNewsPenulis('Redaksi Mathla\'bul Hidayah');
      setNewsIsPublished(true);
      setNewsThumbnailUrl('');
    }
    setShowNewsForm(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsJudul.trim() || !newsKonten.trim()) {
      alert('Judul dan konten berita tidak boleh kosong!');
      return;
    }

    const createdDate = new Date().toISOString().split('T')[0];
    const generatedSlug = newsJudul
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    try {
      if (newsEditId) {
        const { error } = await supabase.from('berita').update({
          judul: newsJudul,
          slug: generatedSlug,
          konten: newsKonten,
          penulis: newsPenulis,
          is_published: newsIsPublished,
          thumbnail_url: newsThumbnailUrl || null
        }).eq('id', newsEditId);
        if (error) throw error;
        setActionDoneMsg('✅ Berita berhasil diperbarui.');
      } else {
        const { error } = await supabase.from('berita').insert({
          judul: newsJudul,
          slug: generatedSlug,
          konten: newsKonten,
          penulis: newsPenulis,
          tanggal_publish: createdDate,
          is_published: newsIsPublished,
          thumbnail_url: newsThumbnailUrl || null
        });
        if (error) throw error;
        setActionDoneMsg('✅ Berita baru berhasil diterbitkan.');
      }
      await refreshAdminData();
      setShowNewsForm(false);
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal menyimpan berita: ${err.message || err}`);
    }
    setTimeout(() => setActionDoneMsg(null), 4000);
  };

  const handleDeleteNews = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus berita ini?')) {
      try {
        const { error } = await supabase.from('berita').delete().eq('id', id);
        if (error) throw error;
        await refreshAdminData();
        setActionDoneMsg('❌ Berita berhasil dihapus.');
      } catch (err: any) {
        setActionDoneMsg(`❌ Gagal menghapus: ${err.message || err}`);
      }
      setTimeout(() => setActionDoneMsg(null), 4000);
    }
  };

  // Profit calculations
  const totalLunasPaid = payments.filter(p => p.status === 'lunas').reduce((acc, obj) => acc + obj.nominal, 0);
  const totalPendingInvoiced = bills.filter(b => b.status === 'pending').reduce((acc, obj) => acc + obj.nominal, 0);

  // Live filter states
  const [searchSantri, setSearchSantri] = useState('');
  const [searchPelanggaran, setSearchPelanggaran] = useState('');
  const [searchHapalan, setSearchHapalan] = useState('');
  const [searchAkun, setSearchAkun] = useState('');

  // Helper getters
  const getSantriNama = (id: string) => {
    return santriList.find(s => s.id === id)?.nama || 'Santri';
  };

  const getSantriKelas = (id: string) => {
    return santriList.find(s => s.id === id)?.kelas || 'N/A';
  };

  const getGuruNama = (id: string) => {
    return profilesList.find(p => p.id === id)?.full_name || 'Ustadz Penguji';
  };

  const getJenisVName = (id: string) => {
    return vJenisList.find(jp => jp.id === id)?.nama || 'Pelanggaran';
  };

  const getSanctionRuleForPoint = (point: number) => {
    return sanctionRules.find(rule => point >= rule.min && (rule.max === null || point <= rule.max)) || sanctionRules[sanctionRules.length - 1] || DEFAULT_SANCTION_RULES[0];
  };

  const handleSaveJenisPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    const nama = newViolationName.trim();
    if (!nama) {
      setActionDoneMsg('Nama jenis pelanggaran wajib diisi.');
      setTimeout(() => setActionDoneMsg(null), 3000);
      return;
    }

    if (vJenisList.some(j => j.nama.toLowerCase() === nama.toLowerCase())) {
      setActionDoneMsg('Jenis pelanggaran dengan nama tersebut sudah ada.');
      setTimeout(() => setActionDoneMsg(null), 3000);
      return;
    }

    try {
      const newJenis: JenisPelanggaran = {
        id: createClientUuid(),
        nama,
        deskripsi: newViolationDesc.trim() || undefined,
        poin_default: Math.max(1, Number(newViolationPoint) || 1),
        kategori: newViolationCategory,
        is_active: true
      };

      dbLocal.setJenisPelanggaran([...vJenisList, newJenis]);
      setVJenisList(prev => [...prev, newJenis]);
      setNewViolationName('');
      setNewViolationDesc('');
      setNewViolationCategory('ringan');
      setNewViolationPoint(5);
      setActionDoneMsg('Jenis pelanggaran baru berhasil ditambahkan.');
      setTimeout(() => setActionDoneMsg(null), 3000);
    } catch (err: any) {
      setActionDoneMsg(`Gagal menambahkan jenis pelanggaran: ${err.message || err}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  const handleDeleteJenisPelanggaran = (id: string) => {
    const isUsed = violationsList.some(v => v.jenis_id === id);
    triggerConfirm(
      'Hapus Jenis Pelanggaran',
      isUsed
        ? 'Jenis pelanggaran ini sudah dipakai di riwayat. Jika dihapus, riwayat lama bisa kehilangan referensi jenisnya. Lanjutkan?'
        : 'Yakin ingin menghapus jenis pelanggaran ini dari kamus?',
      () => {
        try {
          const nextJenis = vJenisList.filter(jenis => jenis.id !== id);
          dbLocal.setJenisPelanggaran(nextJenis);
          setVJenisList(nextJenis);
          setActionDoneMsg('Jenis pelanggaran berhasil dihapus.');
        } catch (err: any) {
          setActionDoneMsg(`Gagal menghapus jenis pelanggaran: ${err.message || err}`);
        }
        setTimeout(() => setActionDoneMsg(null), 4000);
      }
    );
  };

  const updateSanctionRule = (ruleId: SanctionRule['id'], patch: Partial<SanctionRule>) => {
    setSanctionRules(prev => prev.map(rule => rule.id === ruleId ? { ...rule, ...patch } : rule));
  };

  const resetSanctionRules = () => {
    setSanctionRules(DEFAULT_SANCTION_RULES);
    setActionDoneMsg('Aturan sanksi dikembalikan ke default.');
    setTimeout(() => setActionDoneMsg(null), 3000);
  };

  const handleOpenPelanggaranModal = () => {
    setPetSId(santriList[0]?.id || '');
    setPetJenisId(vJenisList[0]?.id || '');
    setPetDesc('');
    const jp = vJenisList[0];
    setPetPoint(jp ? jp.poin_default : 5);
    setShowPelanggaranModal(true);
  };

  const handleSavePelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petSId || !petJenisId || !petDesc) {
      alert('Harap lengkapi semua kolom!');
      return;
    }
    try {
      await dbLocal.insertPelanggaran({
        santri_id: petSId,
        guru_id: user?.id || '',
        jenis_id: petJenisId,
        tanggal: petTanggal,
        deskripsi: petDesc,
        poin: petPoint,
        status: 'aktif'
      });
      await refreshAdminData();
      setActionDoneMsg('⚠️ Pelanggaran berhasil diinput!');
      setTimeout(() => setActionDoneMsg(null), 3000);
      setShowPelanggaranModal(false);
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal menyimpan pelanggaran: ${err.message || err}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  const handleDeleteViolation = (id: string) => {
    triggerConfirm(
      'Membatalkan Rekaman Pelanggaran',
      'Yakin ingin membatalkan rekaman pelanggaran ini?',
      async () => {
        try {
          const { error } = await supabase.from('pelanggaran').delete().eq('id', id);
          if (error) throw error;
          await refreshAdminData();
          setActionDoneMsg('🚨 Rekaman pelanggaran berhasil dibatalkan dari sistem.');
        } catch (err: any) {
          setActionDoneMsg(`❌ Gagal menghapus pelanggaran: ${err.message || err}`);
        }
        setTimeout(() => setActionDoneMsg(null), 3000);
      }
    );
  };

  const handleResolveViolation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pelanggaran')
        .update({
          status: 'ditindaklanjuti',
          catatan_tindak_lanjut: 'Telah diproses dan diberi takzir edukatif oleh Admin.'
        })
        .eq('id', id);
      if (error) throw error;
      await refreshAdminData();
      setActionDoneMsg('✅ Pelanggaran telah ditindaklanjuti!');
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal: ${err.message || err}`);
    }
    setTimeout(() => setActionDoneMsg(null), 3000);
  };

  const handleOpenHapalanModal = () => {
    setHapSId(santriList[0]?.id || '');
    setHapTanggal(new Date().toISOString().split('T')[0]);
    setSelectedHapKatId('kat-quran');
    setHapJenis('ziyadah');
    setHapSurah('Al-Baqarah');
    setHapAyatDari(1);
    setHapAyatSampai(10);
    setHapPages(1);
    setHapValue('mumtaz');
    setHapCatatan('');
    setShowHapalanModal(true);
  };

  const handleSaveHapalan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hapSId || !hapSurah) {
      alert('Harap isi data dengan lengkap!');
      return;
    }
    try {
      await dbLocal.insertSetoranHapalan({
        santri_id: hapSId,
        guru_id: user?.id || '',
        tanggal: hapTanggal,
        jenis: hapJenis,
        surah_nama: hapSurah,
        surah_nomor: 1,
        ayat_dari: Number(hapAyatDari),
        ayat_sampai: Number(hapAyatSampai),
        jumlah_halaman: Number(hapPages),
        nilai: hapValue,
        catatan: hapCatatan,
        kategori_id: selectedHapKatId
      });
      await refreshAdminData();
      setActionDoneMsg('📖 Setoran hafalan baru berhasil terekam!');
      setTimeout(() => setActionDoneMsg(null), 3000);
      setShowHapalanModal(false);
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal menyimpan setoran: ${err.message || err}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  const handleSaveHapKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHapKatNama.trim()) return;
    try {
      await dbLocal.insertKategoriHapalan({
        nama: newHapKatNama.trim(),
        deskripsi: newHapKatDeskripsi.trim() || 'Program hafalan materi / kitab kuno.',
        is_active: true
      });
      await refreshAdminData();
      setNewHapKatNama('');
      setNewHapKatDeskripsi('');
      setActionDoneMsg('📁 Kategori / Matan hafalan baru sukses ditambahkan!');
      setTimeout(() => setActionDoneMsg(null), 3000);
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal menyimpan kategori: ${err.message || err}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  const handleDeleteHapalan = (id: string) => {
    triggerConfirm(
      'Hapus Jurnal Setoran Hafalan',
      'Yakin ingin menghapus jurnal setoran hafalan murid ini?',
      async () => {
        try {
          const { error } = await supabase.from('setoran_hapalan').delete().eq('id', id);
          if (error) throw error;
          await refreshAdminData();
          setActionDoneMsg('🚨 Jurnal setoran hafalan murid terhapus.');
        } catch (err: any) {
          setActionDoneMsg(`❌ Gagal menghapus: ${err.message || err}`);
        }
        setTimeout(() => setActionDoneMsg(null), 3000);
      }
    );
  };

  const handleOpenAccountModal = (p?: Profile) => {
    if (p) {
      setAccId(p.id);
      setAccFullName(p.full_name);
      setAccEmail(p.email || '');
      setAccPhone(p.phone || '');
      setAccRole(p.role);
      setAccIsActive(p.is_active);
      setAccPassword(p.password || '123456');
    } else {
      setAccId('');
      setAccFullName('');
      setAccEmail('');
      setAccPhone('');
      setAccRole('user');
      setAccIsActive(true);
      setAccPassword('123456');
    }
    setShowAccountModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accFullName || !accEmail) {
      alert('Nama dan email wajib diisi!');
      return;
    }

    try {
      if (accId) {
        // UPDATE existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: accFullName,
            phone: accPhone,
            role: accRole,
            is_active: accIsActive
          })
          .eq('id', accId);

        if (updateError) {
          setActionDoneMsg(`❌ Gagal update profil: ${updateError.message}`);
          setTimeout(() => setActionDoneMsg(null), 5000);
          return;
        }
        setActionDoneMsg('✅ Akun pengguna berhasil diperbaharui!');
      } else {
        // CREATE new account — pakai server admin endpoint agar langsung aktif tanpa verifikasi email
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token || '';

        const response = await fetch('/api/admin/account/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            full_name: accFullName,
            email: accEmail.trim().toLowerCase(),
            phone: accPhone || '',
            password: accPassword || '123456',
            role: accRole
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Gagal membuat akun pengguna.');
        }

        setActionDoneMsg(`✅ Akun ${accRole === 'admin' ? 'Admin' : accRole === 'guru' ? 'Guru' : 'Wali'} baru berhasil dibuat dan langsung aktif!`);
      }

      await refreshAdminData();
      setTimeout(() => setActionDoneMsg(null), 4000);
      setShowAccountModal(false);
    } catch (error: any) {
      setActionDoneMsg(`❌ Gagal: ${error.message}`);
      setTimeout(() => setActionDoneMsg(null), 5000);
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (id === user?.id) {
      setActionDoneMsg('❌ Gagal! Anda tidak diizinkan menghapus akun yang sedang Anda gunakan.');
      setTimeout(() => setActionDoneMsg(null), 4000);
      return;
    }
    triggerConfirm(
      'Hapus Akun Pengguna',
      'Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen dari sistem?',
      async () => {
        try {
          const { error } = await supabase.from('profiles').delete().eq('id', id);
          if (error) throw error;
          await refreshAdminData();
          setActionDoneMsg('🚨 Akun berhasil dihapus permanent.');
        } catch (err: any) {
          setActionDoneMsg(`❌ Gagal menghapus akun: ${err.message || err}`);
        }
        setTimeout(() => setActionDoneMsg(null), 3000);
      }
    );
  };

  const handleAdminLinkSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNis = adminLinkNis.trim();
    if (!cleanNis) {
      alert('Masukkan nomor NIS terlebih dahulu.');
      return;
    }
    const allSantri = dbLocal.getSantri();
    const targetSantri = allSantri.find(s => s.nis === cleanNis);
    if (!targetSantri) {
      alert(`Gagal! Santri dengan NIS "${cleanNis}" tidak ditemukan dalam database.`);
      return;
    }
    if (targetSantri.wali_id === adminSelectedWaliId) {
      alert(`Santri "${targetSantri.nama}" sudah berstatus tertaut dengan wali terpilih.`);
      return;
    }
    try {
      const { error } = await supabase
        .from('santri')
        .update({ wali_id: adminSelectedWaliId })
        .eq('id', targetSantri.id);
      if (error) throw error;
      await refreshAdminData();
      setAdminLinkNis('');
      setActionDoneMsg(`🎉 Sukses mengaitkan ${targetSantri.nama} ke Wali tersebut!`);
    } catch (err: any) {
      setActionDoneMsg(`❌ Gagal mengaitkan: ${err.message || err}`);
    }
    setTimeout(() => setActionDoneMsg(null), 3500);
  };

  const handleAdminUnlinkSantri = async (santriId: string) => {
    const allSantri = dbLocal.getSantri();
    const targetSantri = allSantri.find(s => s.id === santriId);
    if (targetSantri) {
      try {
        const { error } = await supabase
          .from('santri')
          .update({ wali_id: null })
          .eq('id', santriId);
        if (error) throw error;
        await refreshAdminData();
        setActionDoneMsg(`Kaitan akademik santri "${targetSantri.nama}" berhasil dilepas.`);
      } catch (err: any) {
        setActionDoneMsg(`❌ Gagal melepas kaitan: ${err.message || err}`);
      }
      setTimeout(() => setActionDoneMsg(null), 3000);
    }
  };

  return (
    <div className={`p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto flex-1 ${isPending ? 'opacity-50' : ''}`}>
      
      {actionDoneMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-2xl border border-emerald-200 flex items-center gap-2 animate-bounce select-none">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionDoneMsg}</span>
        </div>
      )}

      {/* Tab: Overview (Kas Dashboard) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between select-none">
              <div className="p-3 bg-green-50 text-green-700 rounded-2xl w-fit">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">Total SPP Settle Terkonfirmasi</span>
                <h2 className="text-2xl font-black text-green-700 tracking-tight">Rp {totalLunasPaid.toLocaleString('id-ID')}</h2>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">Buku Kas Utama terintegrasi API otomatis.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between select-none">
              <div className="p-3 bg-red-50 text-red-700 rounded-2xl w-fit">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">Piutang SPP Tertunggak Orangtua</span>
                <h2 className="text-2xl font-black text-red-700 tracking-tight">Rp {totalPendingInvoiced.toLocaleString('id-ID')}</h2>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">Memerlukan kirim broadcast penagihan.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between select-none">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl w-fit">
                <Users className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">Total Terdaftar Akun Sistem</span>
                <h2 className="text-2xl font-black text-blue-700 tracking-tight">{profilesList.length} Akun Aktif</h2>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">Pengguna admin, asatidzah & wali santri.</p>
              </div>
            </div>
          </div>

          {/* Monthly Payment Analytics Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 select-none">
              <div className="text-left">
                <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest border-b border-gray-50 pb-2">📂 Analitik Grafik Pembayaran Bulanan (Tahun 2026)</h4>
                <p className="text-[11px] text-gray-400 mt-1">Lacak perbandingan volume dana SPP lunas (diterima) dengan akumulasi outstanding tunggakan.</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] uppercase font-bold">
                <span className="flex items-center gap-1.5 text-green-700">
                  <span className="w-2.5 h-2.5 bg-green-700 rounded-sm inline-block" /> Lunas / Diterima
                </span>
                <span className="flex items-center gap-1.5 text-red-650">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-sm inline-block" /> Tunggakan Pending
                </span>
              </div>
            </div>
            
            <div className="h-68 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp ${v >= 1000000 ? (v / 1000000) + 'jt' : (v / 1000) + 'rb'}`} />
                  <Tooltip 
                    formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`]}
                    contentStyle={{ borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                    labelStyle={{ fontWeight: 800, color: '#0f172a', fontSize: '11px' }}
                  />
                  <Bar dataKey="Lunas" fill="#15803d" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Tunggakan" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-150">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 mb-3">Sistem Ringkasan Cepat</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Platform admin asatidzah terintegrasi penuh dengan basis data real-time santri binaan Ponpes Mathlabul Hidayah Nursalam. Setiap perubahan data pelanggaran, iuran keuangan, maupun jurnal hapalan qurani terekam secara komprehensif dan didistribusikan langsung ke ponsel wali santri via push notification system.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-150">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 mb-3">Informasi Sekolah Nyata</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Gunakan menu sidebar atau tab navigasi di atas untuk berpindah modul. Menu di atas tersinkronisasi 100% dengan klik menu yang berada di panel samping Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: pupil list CRUD panel */}
      {activeTab === 'santri' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-150 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest">Manajemen Buku Data Induk Santri</h4>
              <p className="text-[11px] text-gray-400">Tambah baru, edit kelas atau asrama santri binaan</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-visible">
              <button 
                type="button"
                onClick={() => setShowImportForm(!showImportForm)}
                className={`px-4 py-2.5 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 border ${
                  showImportForm 
                    ? 'bg-rose-50 hover:bg-rose-105 text-rose-800 border-rose-200' 
                    : 'bg-slate-800 hover:bg-slate-900 text-white border-transparent shadow-sm'
                }`}
              >
                📥 {showImportForm ? 'Tutup Panel Import' : 'Import Excel (.xlsx)'}
              </button>
              <button 
                onClick={() => handleOpenPupilModal()}
                className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Tambah Santri Baru
              </button>
              <button
                onClick={printAllBiodata}
                disabled={isPrintingAll}
                className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                {isPrintingAll ? 'Mencetak...' : 'Cetak Semua PDF'}
              </button>
            </div>
          </div>

          {showImportForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 text-left transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none pb-3 border-b border-slate-200">
                <div>
                  <span className="font-extrabold text-xs text-slate-800 block">📥 Fasilitas Impor Data Masal Santri & Akun Wali</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Unggah berkas untuk mendaftarkan banyak santri sekaligus dan mengotomasi pembuatan akun wali santri.</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg text-[10px] font-extrabold border border-green-200 cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1"
                >
                  📄 Unduh Template Excel (.xlsx)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Upload Section */}
                <div className="md:col-span-1 border-2 border-dashed border-slate-300 bg-white hover:border-green-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative transition-all min-h-[140px] shadow-xs">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <span className="text-2xl block">📁</span>
                    <span className="text-[10px] font-bold text-slate-700 block text-ellipsis overflow-hidden max-w-[200px]">
                      {importSelectedFileName ? `Terpilih: ${importSelectedFileName}` : 'Pilih Berkas Excel Template (.xlsx)'}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Klik atau Seret Berkas ke Sini</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-150 text-xs text-slate-600 leading-relaxed font-sans space-y-2.5">
                  <span className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wider block">Panduan Penggunaan Template:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                    <li>Unduh template menggunakan tombol <strong className="text-green-850 font-extrabold">Unduh Template Excel</strong> di atas.</li>
                    <li>Isian kolom <strong className="text-slate-850 font-bold">NIS, Nama Santri, Kelas, Nama Wali, dan No HP Wali</strong> wajib diisi secara lengkap dalam format lembar kerja Excel (.xlsx).</li>
                    <li>Sistem akan mendeteksi apabila <strong className="text-slate-855 font-bold">No HP Wali</strong> sudah pernah terdaftar, lalu otomatis mengaitkan santri tersebut tanpa menduplikasi berkas akun wali (berguna untuk saudara sekandung).</li>
                    <li>Kolom <strong className="text-slate-850 font-bold">Jenis Kelamin</strong> diisi <code className="bg-slate-100 px-1 py-0.5 font-mono text-[9.5px]">L</code> untuk Laki-laki & <code className="bg-slate-100 px-1 py-0.5 font-mono text-[9.5px]">P</code> untuk Perempuan.</li>
                  </ul>
                </div>
              </div>

              {importError && (
                <div className="bg-red-50 text-red-700 text-[10px] font-bold p-3 rounded-xl border border-red-100 select-none">
                  ⚠️ Error: {importError}
                </div>
              )}

              {importRowsPreview.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      🔍 Pratinjau Data ({importRowsPreview.length} Santri Terdeteksi)
                    </span>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      🚀 Impor & Buat Akun Sekarang
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-56 rounded-xl border border-slate-200 animate-fade-in">
                    <table className="w-full text-left text-[11px] bg-white font-sans">
                      <thead className="bg-slate-100 font-bold text-slate-705 select-none border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">NIS</th>
                          <th className="px-3 py-2">Nama Santri</th>
                          <th className="px-3 py-2">Kelas / Kamar</th>
                          <th className="px-3 py-2">Wali Orang tua (Akun)</th>
                          <th className="px-3 py-2">No HP Login</th>
                          <th className="px-3 py-2">Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                        {importRowsPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-mono text-slate-400">{row.nis}</td>
                            <td className="px-3 py-2 font-bold text-slate-800">{row.nama}</td>
                            <td className="px-3 py-2">
                              <span>{row.kelas}</span> • <span className="text-slate-450">Kamar {row.kamar}</span>
                            </td>
                            <td className="px-3 py-2 text-green-700 font-bold">{row.waliNama}</td>
                            <td className="px-3 py-2 font-mono">{row.waliPhone}</td>
                            <td className="px-3 py-2 font-mono text-slate-400">{row.waliPassword}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex max-w-sm">
            <input 
              type="text"
              placeholder="Cari nama santri atau kelas..."
              value={searchSantri}
              onChange={(e) => setSearchSantri(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <tr className="border-b border-gray-150">
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Kelas / Kamar</th>
                  <th className="px-4 py-3">Wali Santri</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Opsi Operasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                {santriList.filter(s => s.status === 'aktif' && (s.nama.toLowerCase().includes(searchSantri.toLowerCase()) || s.kelas.toLowerCase().includes(searchSantri.toLowerCase()))).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-gray-500">{s.nis}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-800">{s.nama}</td>
                    <td className="px-4 py-3">
                      <span>{s.kelas}</span>
                      <span className="text-[10px] text-gray-400 block font-normal">Kamar {s.kamar || 'Belum Ditunjuk'}</span>
                    </td>
                    <td className="px-4 py-3 text-green-700">{getWaliName(s.wali_id)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => resetAndPrintBiodata(s)}
                        title="Reset password wali & cetak PDF biodata"
                        className="p-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer inline-flex items-center gap-1 font-bold text-[10px]"
                      >
                        <Printer className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button 
                        onClick={() => handleOpenPupilModal(s)}
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleChangeSantriStatus(s, 'alumni')}
                        className="p-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg cursor-pointer"
                      >
                        Jadikan Alumni
                      </button>
                      <button
                        onClick={() => handleChangeSantriStatus(s, 'keluar')}
                        className="p-1 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-lg cursor-pointer"
                      >
                        Keluar
                      </button>
                      <button 
                        onClick={() => handleDeletePupil(s.id)}
                        className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alumni' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-150 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest">Alumni & Arsip Santri</h4>
                <p className="text-[11px] text-gray-400 mt-1">Data santri alumni/keluar tetap tersimpan dan seluruh riwayatnya bisa dibuka kembali.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchAlumni}
                  onChange={(e) => setSearchAlumni(e.target.value)}
                  placeholder="Cari alumni, kelas, atau NIS..."
                  className="w-full lg:w-72 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
                {alumniDetail && (
                  <button
                    onClick={() => downloadSantriArchivePDF(alumniDetail)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> PDF Lengkap
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="space-y-3">
                {santriList.filter(s => s.status !== 'aktif' && (
                  s.nama.toLowerCase().includes(searchAlumni.toLowerCase()) ||
                  s.kelas.toLowerCase().includes(searchAlumni.toLowerCase()) ||
                  s.nis.toLowerCase().includes(searchAlumni.toLowerCase())
                )).map(s => {
                  const archive = getSantriArchive(s);
                  const isSelected = alumniDetail?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setAlumniDetail(s);
                        setAlumniDetailTab('biodata');
                      }}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        isSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-800 text-sm">{s.nama}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{s.nis} - {s.kelas}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                          s.status === 'alumni' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-4 text-center text-[10px]">
                        <div className="bg-slate-50 rounded-lg py-2"><b>{archive.santriBills.length}</b><span className="block text-slate-400">Tagihan</span></div>
                        <div className="bg-slate-50 rounded-lg py-2"><b>{archive.raportRows.length}</b><span className="block text-slate-400">Raport</span></div>
                        <div className="bg-slate-50 rounded-lg py-2"><b>{archive.santriHapalan.length}</b><span className="block text-slate-400">Hafalan</span></div>
                        <div className="bg-slate-50 rounded-lg py-2"><b>{archive.santriViolations.length}</b><span className="block text-slate-400">Pelanggaran</span></div>
                      </div>
                    </button>
                  );
                })}

                {santriList.filter(s => s.status !== 'aktif').length === 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-black text-slate-700 text-sm">Belum ada data alumni/keluar.</p>
                    <p className="text-xs text-slate-400 mt-1">Ubah status santri aktif menjadi alumni atau keluar dari Manajemen Santri.</p>
                  </div>
                )}
              </div>

              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden min-h-[520px]">
                {alumniDetail ? (() => {
                  const archive = getSantriArchive(alumniDetail);
                  const wali = profilesList.find(p => p.id === alumniDetail.wali_id);
                  const tabs = [
                    { id: 'biodata', label: 'Biodata' },
                    { id: 'pembayaran', label: 'Riwayat Pembayaran' },
                    { id: 'raport', label: 'Raport' },
                    { id: 'hafalan', label: 'Catatan Hafalan' },
                    { id: 'pelanggaran', label: 'Catatan Pelanggaran' }
                  ] as const;

                  return (
                    <div>
                      <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Detail Arsip Santri</p>
                          <h3 className="font-black text-slate-900 text-xl">{alumniDetail.nama}</h3>
                          <p className="text-xs text-slate-400">{alumniDetail.nis} - {alumniDetail.kelas} - Status {alumniDetail.status}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => downloadSantriArchivePDF(alumniDetail)} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2">
                            <Download className="w-4 h-4" /> Download PDF
                          </button>
                          <button onClick={() => handleChangeSantriStatus(alumniDetail, 'aktif')} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black">
                            Aktifkan Lagi
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto">
                        {tabs.map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setAlumniDetailTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap ${
                              alumniDetailTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="p-5">
                        {alumniDetailTab === 'biodata' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {[
                              ['NIS', alumniDetail.nis],
                              ['Nama Lengkap', alumniDetail.nama],
                              ['Status', alumniDetail.status.toUpperCase()],
                              ['Kelas Terakhir', alumniDetail.kelas],
                              ['Kamar', alumniDetail.kamar || '-'],
                              ['Jenis Kelamin', alumniDetail.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
                              ['Tanggal Lahir', alumniDetail.tanggal_lahir],
                              ['Wali Santri', wali?.full_name || '-'],
                              ['Kontak Wali', wali?.phone || wali?.email || '-'],
                              ['Masuk Pondok', `${alumniDetail.bulan_masuk || '-'} ${alumniDetail.tahun_masuk || '-'}`],
                              ['Alamat', alumniDetail.alamat || '-']
                            ].map(([label, value]) => (
                              <div key={label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase">{label}</p>
                                <p className="font-black text-slate-800 mt-1">{value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {alumniDetailTab === 'pembayaran' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 text-slate-500 uppercase">
                                <tr><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Dibayar</th><th className="px-4 py-3">Status</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {archive.santriBills.map(b => {
                                  const paid = archive.santriPayments.filter(p => p.tagihan_id === b.id && p.status === 'lunas').reduce((sum, p) => sum + p.nominal, 0);
                                  return <tr key={b.id}><td className="px-4 py-3">{b.bulan} {b.tahun}</td><td className="px-4 py-3 font-bold">{getJenisName(b.jenis_id)}</td><td className="px-4 py-3">Rp {b.nominal.toLocaleString('id-ID')}</td><td className="px-4 py-3">Rp {paid.toLocaleString('id-ID')}</td><td className="px-4 py-3 font-black">{b.status}</td></tr>;
                                })}
                                {archive.santriBills.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Belum ada riwayat pembayaran.</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {alumniDetailTab === 'raport' && (
                          <div className="space-y-3">
                            {archive.raportRows.map(r => {
                              const avg = getRaportAverageForArchive(r);
                              return (
                                <div key={r.id} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-black text-slate-800">{dbLocal.getRaportKelas().find(k => k.id === r.kelas_id)?.nama_kelas || 'Kelas'} - {r.semester}</p>
                                    <p className="text-xs text-slate-400">{r.tahun_ajaran} - Status {r.status}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-black text-emerald-700">{avg.toFixed(2)}</p>
                                    <p className="text-xs font-black text-slate-500">Predikat {getRaportPredikat(avg)}</p>
                                  </div>
                                </div>
                              );
                            })}
                            {archive.raportRows.length === 0 && <p className="text-center text-slate-400 text-xs py-12">Belum ada data raport.</p>}
                          </div>
                        )}

                        {alumniDetailTab === 'hafalan' && (
                          <div className="space-y-2">
                            {archive.santriHapalan.map(h => (
                              <div key={h.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between gap-3 text-xs">
                                <div><p className="font-black text-slate-800">{h.surah_nama}</p><p className="text-slate-400">{h.tanggal} - {h.jenis} - {h.ayat_dari}-{h.ayat_sampai}</p></div>
                                <span className="font-black text-blue-700">{h.nilai.replace(/_/g, ' ')}</span>
                              </div>
                            ))}
                            {archive.santriHapalan.length === 0 && <p className="text-center text-slate-400 text-xs py-12">Belum ada catatan hafalan.</p>}
                          </div>
                        )}

                        {alumniDetailTab === 'pelanggaran' && (
                          <div className="space-y-2">
                            {archive.santriViolations.map(v => (
                              <div key={v.id} className="bg-red-50/40 border border-red-100 rounded-2xl p-4 flex justify-between gap-3 text-xs">
                                <div><p className="font-black text-slate-800">{getJenisVName(v.jenis_id)}</p><p className="text-slate-500">{v.tanggal} - {v.deskripsi}</p></div>
                                <span className="font-black text-red-700">{v.poin} poin</span>
                              </div>
                            ))}
                            {archive.santriViolations.length === 0 && <p className="text-center text-slate-400 text-xs py-12">Tidak ada catatan pelanggaran.</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="h-full min-h-[520px] flex items-center justify-center text-center p-10">
                    <div>
                      <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-black text-slate-700">Pilih alumni untuk membuka arsip lengkap.</p>
                      <p className="text-xs text-slate-400 mt-1">Biodata, pembayaran, raport, hafalan, dan pelanggaran akan tampil di sini.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pelanggaran (Data Pelanggaran) */}
      {activeTab === 'pelanggaran' && (
        <div className="space-y-6">
          <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-150 select-none">
            <button
              type="button"
              onClick={() => setPelanggaranView('log')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                pelanggaranView === 'log'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" /> Log Pelanggaran
            </button>
            <button
              type="button"
              onClick={() => setPelanggaranView('analitik')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                pelanggaranView === 'analitik'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" /> Analitik & Radar
            </button>
          </div>

          {pelanggaranView === 'log' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-1.5 grid grid-cols-1 md:grid-cols-3 gap-1.5 select-none">
                {[
                  { id: 'riwayat', label: 'Riwayat Pelanggaran' },
                  { id: 'kamus', label: 'Kamus Pelanggaran' },
                  { id: 'sanksi', label: 'Aturan Sanksi' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPelanggaranLogTab(tab.id as any)}
                    className={`py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      pelanggaranLogTab === tab.id
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {pelanggaranLogTab === 'riwayat' && (() => {
                const kelasOptions = Array.from(new Set(santriList.map(s => s.kelas).filter(Boolean))).sort();
                const search = searchPelanggaran.toLowerCase().trim();
                const studentRows = santriList.map((santri) => {
                  const records = violationsList.filter(v => v.santri_id === santri.id);
                  const totalPoin = records.filter(v => v.status === 'aktif').reduce((sum, item) => sum + item.poin, 0);
                  const latest = records.slice().sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''))[0];
                  const sanctionRule = getSanctionRuleForPoint(totalPoin);
                  return { santri, records, totalPoin, latest, sanctionRule };
                }).filter(item => {
                  if (item.records.length === 0) return false;
                  if (search) {
                    const match = item.santri.nama.toLowerCase().includes(search) ||
                      item.santri.kelas.toLowerCase().includes(search) ||
                      item.records.some(v => v.deskripsi.toLowerCase().includes(search) || getJenisVName(v.jenis_id).toLowerCase().includes(search));
                    if (!match) return false;
                  }
                  if (pelanggaranKelasFilter !== 'semua' && item.santri.kelas !== pelanggaranKelasFilter) return false;
                  if (pelanggaranLevelFilter !== 'semua') {
                    const hasLevel = item.records.some(v => (vJenisList.find(j => j.id === v.jenis_id)?.kategori || 'ringan') === pelanggaranLevelFilter);
                    if (!hasLevel) return false;
                  }
                  return true;
                }).sort((a, b) => b.totalPoin - a.totalPoin || b.records.length - a.records.length);

                return (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari nama siswa / kelas / pelanggaran..."
                            value={searchPelanggaran}
                            onChange={(e) => setSearchPelanggaran(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-rose-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenPelanggaranModal}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Plus className="w-4 h-4" /> Lapor
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={pelanggaranKelasFilter}
                          onChange={(e) => setPelanggaranKelasFilter(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          <option value="semua">Semua Kelas</option>
                          {kelasOptions.map(kelas => <option key={kelas} value={kelas}>{kelas}</option>)}
                        </select>
                        <select
                          value={pelanggaranLevelFilter}
                          onChange={(e) => setPelanggaranLevelFilter(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          <option value="semua">Semua Tingkatan</option>
                          <option value="ringan">Ringan</option>
                          <option value="sedang">Sedang</option>
                          <option value="berat">Berat</option>
                        </select>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-500 flex items-center justify-between">
                          <span>{studentRows.length} siswa tercatat</span>
                          <span>10 / halaman</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {studentRows.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl py-10 text-center text-xs font-bold text-slate-400">
                          Belum ada riwayat pelanggaran yang cocok dengan filter.
                        </div>
                      ) : (
                        studentRows.slice(0, 10).map((item) => (
                          <div key={item.santri.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-rose-200 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-black text-slate-800 truncate">{item.santri.nama}</h5>
                                <p className="text-[11px] text-slate-400 font-bold mt-0.5">{item.santri.kelas} • {item.records.length} kasus</p>
                                {item.latest && (
                                  <p className="text-[10px] text-slate-400 mt-1 truncate">Terbaru: {getJenisVName(item.latest.jenis_id)} - {item.latest.tanggal}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 font-black uppercase block">Sanksi Aktif</span>
                                <span className={`text-sm font-black block ${
                                  item.sanctionRule.tone === 'red' ? 'text-red-600' :
                                  item.sanctionRule.tone === 'amber' ? 'text-amber-600' :
                                  'text-emerald-600'
                                }`}>
                                  {item.sanctionRule.title}
                                </span>
                                <span className="text-[11px] text-slate-400 font-black">{item.totalPoin} Poin</span>
                              </div>
                            </div>
                            <div className="mt-3 pl-16 space-y-2">
                              {item.records.slice().reverse().slice(0, 3).map((v) => (
                                <div key={v.id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2 text-[11px]">
                                  <div className="min-w-0">
                                    <span className="font-black text-slate-700 truncate block">{getJenisVName(v.jenis_id)}</span>
                                    <span className="text-slate-400 truncate block">{v.deskripsi}</span>
                                  </div>
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="font-mono text-slate-400">{v.tanggal}</span>
                                    <span className="font-black text-rose-600">{v.poin}p</span>
                                    {v.status === 'aktif' ? (
                                      <button onClick={() => handleResolveViolation(v.id)} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-black cursor-pointer">Proses</button>
                                    ) : (
                                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black">Selesai</span>
                                    )}
                                    <button onClick={() => handleDeleteViolation(v.id)} className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer">
                                      <Trash className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {pelanggaranLogTab === 'kamus' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <form onSubmit={handleSaveJenisPelanggaran} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-max">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Tambah Jenis Pelanggaran</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Atur nama pelanggaran, kategori, dan bobot poin default.</p>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Jenis Pelanggaran</label>
                      <input
                        type="text"
                        value={newViolationName}
                        onChange={(e) => setNewViolationName(e.target.value)}
                        placeholder="Contoh: Terlambat shalat berjamaah"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Deskripsi / Catatan Aturan</label>
                      <textarea
                        rows={3}
                        value={newViolationDesc}
                        onChange={(e) => setNewViolationDesc(e.target.value)}
                        placeholder="Tuliskan batasan pelanggaran dan contoh kasusnya..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Kategori</label>
                        <select
                          value={newViolationCategory}
                          onChange={(e) => setNewViolationCategory(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 capitalize"
                        >
                          <option value="ringan">Ringan</option>
                          <option value="sedang">Sedang</option>
                          <option value="berat">Berat</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Bobot Poin</label>
                        <input
                          type="number"
                          min={1}
                          value={newViolationPoint}
                          onChange={(e) => setNewViolationPoint(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Simpan Jenis Pelanggaran
                    </button>
                  </form>

                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Kamus Pelanggaran</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Daftar jenis pelanggaran, kategori, dan bobot poin default.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
                    {vJenisList.map((jenis) => (
                      <div key={jenis.id} className="rounded-2xl border border-slate-150 bg-white p-4 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="font-black text-sm text-slate-800">{jenis.nama}</h5>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{jenis.deskripsi || 'Belum ada deskripsi aturan rinci.'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[9px] uppercase font-black border ${
                            jenis.kategori === 'berat' ? 'bg-red-50 text-red-700 border-red-100' :
                            jenis.kategori === 'sedang' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {jenis.kategori}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                          <span className="text-slate-400 font-bold">Poin default</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-rose-600">{jenis.poin_default} poin</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteJenisPelanggaran(jenis.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer"
                              title="Hapus jenis pelanggaran"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              )}

              {pelanggaranLogTab === 'sanksi' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Konfigurasi Aturan Sanksi</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Atur ambang poin dan tindakan sanksi. Perubahan ini langsung dipakai di status riwayat dan analitik.</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetSanctionRules}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {sanctionRules.map((rule) => (
                      <div key={rule.id} className={`rounded-2xl p-5 border space-y-4 ${
                        rule.tone === 'red' ? 'bg-red-50 border-red-100' :
                        rule.tone === 'amber' ? 'bg-amber-50 border-amber-100' :
                        'bg-emerald-50 border-emerald-100'
                      }`}>
                        <div className="flex items-start gap-3">
                          <Shield className={`w-5 h-5 mt-0.5 ${
                            rule.tone === 'red' ? 'text-red-600' :
                            rule.tone === 'amber' ? 'text-amber-600' :
                            'text-emerald-600'
                          }`} />
                          <div className="flex-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Nama Sanksi</label>
                            <input
                              type="text"
                              value={rule.title}
                              onChange={(e) => updateSanctionRule(rule.id, { title: e.target.value })}
                              className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800"
                            />
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                              {rule.min} - {rule.max === null ? 'seterusnya' : rule.max} poin
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Min Poin</label>
                            <input
                              type="number"
                              min={0}
                              value={rule.min}
                              onChange={(e) => updateSanctionRule(rule.id, { min: Number(e.target.value) })}
                              className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Max Poin</label>
                            <input
                              type="number"
                              min={0}
                              value={rule.max ?? ''}
                              placeholder="Tanpa batas"
                              onChange={(e) => updateSanctionRule(rule.id, { max: e.target.value === '' ? null : Number(e.target.value) })}
                              className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Aturan / Tindakan Sanksi</label>
                          <textarea
                            rows={4}
                            value={rule.desc}
                            onChange={(e) => updateSanctionRule(rule.id, { desc: e.target.value })}
                            className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {pelanggaranView === 'analitik' && (() => {
            const totalKasus = violationsList.length;
            const totalPoin = violationsList.reduce((sum, item) => sum + item.poin, 0);
            const siswaBersanksi = new Set(violationsList.filter(v => v.status === 'aktif').map(v => v.santri_id)).size;
            const topStudent = santriList.map(s => ({
              santri: s,
              poin: violationsList.filter(v => v.santri_id === s.id && v.status === 'aktif').reduce((sum, v) => sum + v.poin, 0)
            })).sort((a, b) => b.poin - a.poin)[0];
            const topRule = getSanctionRuleForPoint(topStudent?.poin || 0);

            const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            const trendMap = monthShort.map((name, idx) => ({
              name,
              Kasus: violationsList.filter(v => {
                const d = new Date(v.tanggal);
                return !isNaN(d.getTime()) && d.getMonth() === idx;
              }).length
            })).filter(item => item.Kasus > 0);

            const dist = ['ringan', 'sedang', 'berat'].map((kategori) => {
              const data = violationsList.filter(v => (vJenisList.find(j => j.id === v.jenis_id)?.kategori || 'ringan') === kategori);
              return {
                kategori,
                count: data.length,
                poin: data.reduce((sum, item) => sum + item.poin, 0)
              };
            });
            const maxDist = Math.max(...dist.map(d => d.poin), 1);

            const typeStats = vJenisList.map(jenis => {
              const data = violationsList.filter(v => v.jenis_id === jenis.id);
              return { jenis, count: data.length, poin: data.reduce((sum, item) => sum + item.poin, 0) };
            }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);

            const classStats = Array.from(new Set(santriList.map(s => s.kelas))).map(kelas => {
              const ids = santriList.filter(s => s.kelas === kelas).map(s => s.id);
              const data = violationsList.filter(v => ids.includes(v.santri_id));
              return { kelas, count: data.length, poin: data.reduce((sum, item) => sum + item.poin, 0) };
            }).filter(item => item.count > 0).sort((a, b) => b.poin - a.poin);
            const maxClassPoint = Math.max(...classStats.map(c => c.poin), 1);

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Kasus</span>
                      <Activity className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-3xl font-black text-slate-700 mt-4">{totalKasus}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Poin</span>
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    </div>
                    <p className="text-3xl font-black text-rose-600 mt-4">{totalPoin}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Siswa Bersanksi</span>
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-3xl font-black text-amber-700 mt-4">{siswaBersanksi}</p>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sanksi Tertinggi</span>
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-black text-red-600 mt-5">{topStudent?.poin ? `${topStudent.poin}p` : '-'}</p>
                    {topStudent?.poin ? <p className="text-[10px] text-slate-500 font-bold mt-1 truncate">{topStudent.santri.nama}</p> : null}
                    {topStudent?.poin ? <p className="text-[10px] text-red-500 font-black mt-0.5 truncate">{topRule.title}</p> : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-600" /> Tren Pelanggaran Per Bulan</h4>
                    <div className="h-56 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendMap.length ? trendMap : [{ name: '-', Kasus: 0 }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip formatter={(value) => [`${value} kasus`, 'Kasus']} />
                          <Bar dataKey="Kasus" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-orange-600" /> Distribusi Kategori</h4>
                    <div className="space-y-4 mt-6">
                      {dist.map((item) => (
                        <div key={item.kategori}>
                          <div className="flex justify-between text-xs font-black text-slate-600 capitalize">
                            <span>{item.kategori}</span>
                            <span className="text-slate-400">{item.count}x • {item.poin} poin</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.kategori === 'berat' ? 'bg-red-500' : item.kategori === 'sedang' ? 'bg-orange-500' : 'bg-yellow-400'}`}
                              style={{ width: `${Math.max((item.poin / maxDist) * 100, item.poin > 0 ? 8 : 0)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Jenis Pelanggaran Terbanyak</h4>
                    <div className="mt-5 space-y-3">
                      {typeStats.slice(0, 6).map((item, idx) => (
                        <div key={item.jenis.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 text-center text-xs font-black text-slate-400">{idx + 1}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-700 truncate">{item.jenis.nama}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{item.jenis.kategori} • {item.jenis.poin_default} poin/kasus</p>
                            </div>
                          </div>
                          <span className="text-sm font-black text-rose-600">{item.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> Pelanggaran per Kelas</h4>
                    <div className="mt-5 space-y-3">
                      {classStats.slice(0, 8).map((item) => (
                        <div key={item.kelas} className="grid grid-cols-[58px_1fr_70px] items-center gap-3">
                          <span className="text-xs font-black text-slate-600">{item.kelas}</span>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max((item.poin / maxClassPoint) * 100, 8)}%` }} />
                          </div>
                          <span className="text-[11px] text-slate-500 font-bold text-right">{item.count}k • {item.poin}p</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Hapalan (Data Hapalan) */}
      {activeTab === 'hapalan' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-150 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none pb-2 border-b border-gray-100">
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest">Sistem Setup & Monitoring Setoran Hafalan</h4>
              <p className="text-[11px] text-gray-400 font-medium">Monitoring komprehensif harian, penambahan matan baru, dan evaluasi kelancaran murid</p>
            </div>
            
            <button 
              onClick={handleOpenHapalanModal}
              className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 shadow-sm transition-all active:scale-95 select-none"
            >
              <Plus className="w-4 h-4" /> Rekam Setoran Baru
            </button>
          </div>

          {/* Sub-tabs Selection */}
          <div className="flex border-b border-gray-150 select-none pb-1.5 gap-5">
            <button
              onClick={() => setActiveHapSubTab('setoran')}
              className={`pb-1 text-xs font-black tracking-wider transition-all relative cursor-pointer ${
                activeHapSubTab === 'setoran' ? 'text-green-700 font-extrabold border-b-2 border-green-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📖 JURNAL SETORAN HARIAN
            </button>
            <button
              onClick={() => setActiveHapSubTab('kategori')}
              className={`pb-1 text-xs font-black tracking-wider transition-all relative cursor-pointer ${
                activeHapSubTab === 'kategori' ? 'text-green-700 font-extrabold border-b-2 border-green-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📁 PROGRAM & KATEGORI HAFALAN ({hapKategoriList.length > 0 ? hapKategoriList.length : 1})
            </button>
          </div>

          {activeHapSubTab === 'setoran' && (
            <div className="space-y-4">
              <div className="flex max-w-sm">
                <input 
                  type="text"
                  placeholder="Cari nama santri atau subyek hafalan..."
                  value={searchHapalan}
                  onChange={(e) => setSearchHapalan(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                    <tr className="border-b border-gray-150">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Nama Santri</th>
                      <th className="px-4 py-3">Ustadz Penguji</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Materi / Subyek</th>
                      <th className="px-4 py-3">Banyak/Vol</th>
                      <th className="px-4 py-3">Kelancaran</th>
                      <th className="px-4 py-3 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                    {(hapalanList || []).filter(h => getSantriNama(h.santri_id).toLowerCase().includes(searchHapalan.toLowerCase()) || h.surah_nama.toLowerCase().includes(searchHapalan.toLowerCase())).slice().reverse().map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-gray-500">{h.tanggal}</td>
                        <td className="px-4 py-3 font-extrabold text-slate-800">
                          {getSantriNama(h.santri_id)}
                          <span className="text-[10px] block font-normal text-gray-400">{getSantriKelas(h.santri_id)}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{getGuruNama(h.guru_id)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black leading-none ${
                            h.jenis === 'ziyadah' ? 'bg-teal-50 text-teal-700 border border-teal-150' : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                          }`}>
                            {h.jenis}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-800 font-extrabold flex flex-col justify-center">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            {h.kategori_id && h.kategori_id !== 'kat-quran' ? (
                              <span className="bg-amber-100 text-amber-900 text-[8px] px-1.5 py-0.5 rounded font-black max-w-max uppercase tracking-wider">
                                {hapKategoriList.find(k => k.id === h.kategori_id)?.nama || 'Matan'}
                              </span>
                            ) : null}
                            <span>{h.surah_nama}</span>
                          </span>
                          <span className="text-[10px] block text-gray-500 font-normal mt-0.5">
                            {h.kategori_id && h.kategori_id !== 'kat-quran' ? 'Bait / Hal:' : 'Ayat:'} {h.ayat_dari} - {h.ayat_sampai}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-600">{h.jumlah_halaman} {h.kategori_id && h.kategori_id !== 'kat-quran' ? 'Bait / Hal' : 'Hlm'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase leading-none ${
                            h.nilai === 'mumtaz' ? 'bg-emerald-50 text-emerald-700' :
                            h.nilai === 'jayyid_jiddan' ? 'bg-cyan-50 text-cyan-700' :
                            h.nilai === 'jayyid' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {h.nilai.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteHapalan(h.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer transition-all hover:scale-105"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeHapSubTab === 'kategori' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 select-none">
              {/* Left Side: List of Categories */}
              <div className="md:col-span-2 space-y-3.5">
                <h5 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Daftar Program & Jenis Hafalan Yang Aktif</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(hapKategoriList.length > 0 ? hapKategoriList : [
                    { id: 'kat-quran', nama: "Al-Qur'an", deskripsi: "Program utama tahfidz dan murajaah Al-Qur'an dan juz-amma.", is_active: true }
                  ]).map((kat) => {
                    const countSetoran = (hapalanList || []).filter(h => (h.kategori_id || 'kat-quran') === kat.id).length;
                    return (
                      <div key={kat.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 relative hover:shadow-xs transition-all">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-xs text-slate-800 uppercase block">{kat.nama}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-green-150/40 text-green-800`}>
                            AKTIF
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{kat.deskripsi}</p>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-gray-500 font-bold">
                          <span>Materi Evaluasi</span>
                          <span className="text-green-700 font-extrabold font-mono">{countSetoran} Setoran Jurnal</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Add Category Form */}
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-5 select-none space-y-4 h-max">
                <div>
                  <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wide">Daftarkan Program Baru</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
                    Menambahkan jenis setoran hapalan baru otomatis di seluruh Guru & Wali Santri (cth: Matan Jurumiyah, Hadis Arbain, Imriti dll).
                  </p>
                </div>

                <form onSubmit={handleSaveHapKategori} className="space-y-3.5">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Nama Kategori / Kitab/ Matan:</label>
                    <input 
                      type="text"
                      required
                      value={newHapKatNama}
                      onChange={(e) => setNewHapKatNama(e.target.value)}
                      placeholder="cth: Matan Jurumiyah"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Deskripsi Singkat Program:</label>
                    <textarea
                      rows={3}
                      value={newHapKatDeskripsi}
                      onChange={(e) => setNewHapKatDeskripsi(e.target.value)}
                      placeholder="cth: Hafalan kaidah tata bahasa nahu matan Jurumiyah untuk mengasah kemahiran baca kitab gundul."
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Jurnalkan Program Baru
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'raport' && (
        <RaportPanel mode="admin" />
      )}

      {/* Tab: Create bulking billing tagihans */}
      {activeTab === 'pembayaran_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          <form onSubmit={handleBulkGenerateTagihan} className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-150 space-y-4">
            <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest border-b border-gray-100 pb-3 select-none">Bulk Generate Tagihan Baru</h4>
            <p className="text-[11px] text-gray-400 leading-normal mb-3 select-none">Isi parameter di bawah ini untuk membuat invoice SPP ke SEMUA wali murid serentak secara real-time.</p>
            
            {/* Pick Iuran Type */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Jenis Iuran Pokok:</label>
              <select 
                value={selJenisId}
                onChange={(e) => setSelJenisId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold"
                required
              >
                <option value="">-- Pilih Jenis Pembayaran --</option>
                {jPembayaranList.map(j => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </select>
            </div>

            {/* Nominal */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Nominal Tagihan (Rupiah):</label>
              <input 
                type="number"
                value={selNominal}
                onChange={(e) => setSelNominal(Number(e.target.value))}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-zinc-800 focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            {/* Term Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Bulan Periode:</label>
                <select 
                  value={selBulan}
                  onChange={(e) => setSelBulan(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold"
                  required
                >
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Tahun Ajaran:</label>
                <input 
                  type="text"
                  value={selTahun}
                  onChange={(e) => setSelTahun(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:ring-1 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            {/* Target Selection: All or Specific Student */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Target Penerima Tagihan:</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setTargetScope('semua')}
                  className={`py-1 px-3 text-[10px] sm:text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                    targetScope === 'semua'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-slate-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Semua Santri (Filter Masuk)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope('santri')}
                  className={`py-1 px-3 text-[10px] sm:text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                    targetScope === 'santri'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-slate-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Santri Tertentu Spesifik
                </button>
              </div>

              {targetScope === 'santri' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
                  <select
                    value={targetSantriId}
                    onChange={(e) => setTargetSantriId(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] focus:ring-1 focus:ring-green-500 font-semibold"
                    required
                  >
                    <option value="">-- Pilih Santri Penerima --</option>
                    {santriList.filter(s => s.status === 'aktif').map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.nis} - Kelas {s.kelas})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Live Target Filter calculation */}
            {(() => {
              const monthNamesLocal = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
              ];
              const parseYearLocal = (value: string | number | undefined): number => {
                if (!value) return 2026;
                const str = String(value).trim();
                const match = str.match(/\d{4}/);
                if (match) return Number(match[0]);
                const parsed = Number(str);
                return isNaN(parsed) ? 2026 : parsed;
              };
              
              const targetMonthIdxLocal = monthNamesLocal.findIndex(m => m.toLowerCase() === selBulan.toLowerCase());
              const targetYearLocal = parseYearLocal(selTahun);

              let currentEligibleCount = 0;
              if (targetScope === 'santri') {
                currentEligibleCount = targetSantriId && santriList.find(s => s.id === targetSantriId)?.status === 'aktif' ? 1 : 0;
              } else {
                currentEligibleCount = bypassEntranceFilter 
                  ? santriList.filter(s => s.status === 'aktif').length 
                  : santriList.filter(s => {
                      if (s.status !== 'aktif') return false;
                      const joinYear = parseYearLocal(s.tahun_masuk);
                      const joinMonthIdx = monthNamesLocal.findIndex(m => m.toLowerCase() === (s.bulan_masuk || 'Januari').toLowerCase());
                      
                      if (joinMonthIdx === -1) return true;
                      if (targetYearLocal > joinYear) return true;
                      if (targetYearLocal === joinYear && targetMonthIdxLocal >= joinMonthIdx) return true;
                      return false;
                    }).length;
              }

              return (
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-2 select-none text-left">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium font-sans">Target Penerima:</span>
                    <span className="font-extrabold text-green-700 font-mono">
                      {targetScope === 'santri' 
                        ? `${currentEligibleCount} Santri Terpilih`
                        : `${currentEligibleCount} dari ${santriList.filter(s => s.status === 'aktif').length} Santri Aktif`
                      }
                    </span>
                  </div>
                  {targetScope === 'semua' && santriList.filter(s => s.status === 'aktif').length - currentEligibleCount > 0 && (
                    <p className="text-[10px] text-amber-600 leading-normal font-medium">
                      ⚠️ ({santriList.filter(s => s.status === 'aktif').length - currentEligibleCount} santri aktif dilewati otomatis karena belum masuk/terdaftar pada periode {selBulan} {selTahun}).
                    </p>
                  )}
                  {targetScope === 'santri' && !targetSantriId && (
                    <p className="text-[10px] text-amber-600 leading-normal font-medium">
                      ⚠️ Silakan pilih nama santri di atas terlebih dahulu.
                    </p>
                  )}
                  
                  {targetScope === 'semua' && (
                    <label className="flex items-start gap-2 pt-1.5 border-t border-slate-100 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={bypassEntranceFilter}
                        onChange={(e) => setBypassEntranceFilter(e.target.checked)}
                        className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-[10px] text-gray-500 font-semibold leading-tight font-sans">
                        Abaikan filter bulan masuk (tetap hanya mengirim tagihan ke santri aktif)
                      </span>
                    </label>
                  )}
                </div>
              );
            })()}

            <button 
              type="submit"
              className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-black text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all text-center"
            >
              {targetScope === 'santri' ? 'Eksekusi Kirim Tagihan Spesifik' : 'Eksekusi Kirim Tagihan Bulk'}
            </button>
            <div className="text-[10px] text-slate-500 text-center leading-normal font-medium mt-1 select-none">
              💡 Daftar seluruh tagihan berjalan dapat langsung dipantau di <strong>Panel Monitoring</strong> di bagian bawah halaman ini.
            </div>
          </form>

          <div className="lg:col-span-3 space-y-6">
            
            {/* Form: Tambah Jenis Tagihan/Iuran Baru */}
            <form onSubmit={handleCreateJenisPembayaran} className="bg-white p-6 rounded-3xl border border-gray-150 space-y-4">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest border-b border-gray-100 pb-3 select-none">Tambah Jenis Iuran/Tagihan Baru</h4>
              <p className="text-[11px] text-gray-400 leading-normal select-none">Tambahkan berbagai macam iuran pondok lainnya (contoh: Uang Kitab, Seragam Baru, Kegiatan Rihlah, dsb).</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Nama Jenis Tagihan:</label>
                  <input 
                    type="text"
                    value={newJenisNama}
                    onChange={(e) => setNewJenisNama(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold text-gray-800"
                    placeholder="Contoh: Iuran Seragam Baru"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Deskripsi Tambahan:</label>
                  <input 
                    type="text"
                    value={newJenisDeskripsi}
                    onChange={(e) => setNewJenisDeskripsi(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold text-gray-800"
                    placeholder="Contoh: Paket baju seragam & jas almamater"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm active:scale-97 transition-all uppercase tracking-wider font-sans"
              >
                + Daftarkan Jenis Tagihan Baru
              </button>
            </form>

            {/* List: Macam-macam Tagihan Terdaftar */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest border-b border-gray-100 pb-3 mb-3 select-none text-left">Daftar Macam-Macam Iuran Terdaftar</h4>
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full text-xs text-left bg-white">
                  <thead className="bg-slate-50 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">ID Iuran</th>
                      <th className="px-4 py-2.5">Nama Jenis Iuran</th>
                      <th className="px-4 py-2.5">Keterangan</th>
                      <th className="px-4 py-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-650">
                    {jPembayaranList.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-gray-400">{j.id}</td>
                        <td className="px-4 py-3 font-black text-gray-900">{j.nama}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{j.deskripsi || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            type="button"
                            onClick={() => handleDeleteJenisPembayaran(j.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                            title="Hapus Jenis Iuran"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* PANEL TAGIHAN YANG SEDANG AKTIF / BERJALAN */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm text-left space-y-4">
            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
              <div>
                <h4 className="font-extrabold text-gray-905 font-black text-gray-900 text-xs uppercase tracking-widest">📋 Panel Monitoring Tagihan Berjalan / Sedang Aktif</h4>
                <p className="text-[11px] text-gray-400">Daftar semua invoice tagihan santri yang telah digenerate. Gunakan filter untuk pelacakan cepat dan aksi manual.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-sans">
                <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg">
                  Total Pending: {bills.filter(b => b.status === 'pending').length} iuran
                </span>
                <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg">
                  Total Lunas: {bills.filter(b => b.status === 'lunas').length} iuran
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  value={cfgTagihanSearch}
                  onChange={(e) => setCfgTagihanSearch(e.target.value)}
                  placeholder="Cari ID Tagihan (#xxxx), nama, kelas, atau iuran..."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold text-gray-800"
                />
              </div>

              {/* Filter Status */}
              <div>
                <select 
                  value={cfgTagihanStatusFilter}
                  onChange={(e) => setCfgTagihanStatusFilter(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:ring-1 focus:ring-green-500"
                >
                  <option value="semua">Semua Status (Lunas & Pending)</option>
                  <option value="pending">Status Pending (Tunggakan Aktif)</option>
                  <option value="lunas">Status Lunas (Lunas Settle/Cash)</option>
                </select>
              </div>

              {/* Filter Jenis Iuran */}
              <div>
                <select 
                  value={cfgTagihanJenisFilter}
                  onChange={(e) => setCfgTagihanJenisFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:ring-1 focus:ring-green-500"
                >
                  <option value="semua">Semua Macam Iuran</option>
                  {jPembayaranList.map(j => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Bulk & Single Tarik Operations Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Mass Withdrawal */}
              <div className="bg-amber-50/60 border border-amber-150 p-4 rounded-2xl flex flex-col justify-between gap-3 text-left">
                <div className="font-sans text-xs">
                  <span className="font-bold text-amber-900 block flex items-center gap-1">
                    ⚠️ Tarik Kembali / Batalkan Tagihan Massal
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium leading-relaxed block mt-1">
                    Membatalkan seluruh tagihan berstatus <strong className="text-amber-805 font-bold">Pending</strong> secara serentak berdasarkan pencarian/status/kategori iuran yang sedang Anda pilih di atas.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleBulkDeletePendingBillsByFilter}
                  className="w-full px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1 focus:ring-2 focus:ring-red-400 active:scale-95"
                >
                  🗑️ Batalkan & Tarik Tagihan Sesuai Filter
                </button>
              </div>

              {/* Box 2: Single ID Withdrawal */}
              <div className="bg-slate-50 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between gap-3 text-left">
                <div className="font-sans text-xs">
                  <span className="font-bold text-slate-800 block flex items-center gap-1">
                    🎯 Tarik / Batalkan per ID Tagihan Spesifik
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-relaxed block mt-1">
                    Masukkan ID Tagihan lengkap (contoh salin dari daftar tabel di bawah) untuk langsung mencari dan menarik kembali tagihan dari wali santri.
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cancelTargetId}
                    onChange={(e) => setCancelTargetId(e.target.value)}
                    placeholder="Contoh: tag-1717-0-abc..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-green-500 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleCancelTagihanByDirectID(cancelTargetId)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all active:scale-95 whitespace-nowrap"
                  >
                    Tarik Tagihan
                  </button>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto rounded-2xl border border-gray-150 bg-white shadow-xs">
              <table className="w-full text-xs text-left bg-white font-sans min-w-[1250px]">
                <thead className="bg-slate-50 text-[10px] text-gray-450 uppercase font-extrabold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5 w-32">ID Tagihan</th>
                    <th className="px-5 py-3.5">Nama Santri</th>
                    <th className="px-5 py-3.5">Kelas & Kamar</th>
                    <th className="px-5 py-3.5">Peruntukan Iuran</th>
                    <th className="px-5 py-3.5">Periode</th>
                    <th className="px-5 py-3.5">Nominal</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Tanggal Dibuat</th>
                    <th className="px-5 py-3.5 text-center w-56">Aksi / Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-650">
                  {(() => {
                    const filtered = bills.filter(b => {
                      const sComp = santriList.find(s => s.id === b.santri_id);
                      const studentName = sComp?.nama.toLowerCase() || '';
                      const wName = getWaliName(sComp?.wali_id).toLowerCase();
                      const sKelas = sComp?.kelas.toLowerCase() || '';
                      const jName = getJenisName(b.jenis_id).toLowerCase();
                      const q = cfgTagihanSearch.toLowerCase().trim();
                      if (q) {
                        const matchesSearch = studentName.includes(q) || wName.includes(q) || sKelas.includes(q) || jName.includes(q) || b.bulan.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
                        if (!matchesSearch) return false;
                      }
                      if (cfgTagihanStatusFilter !== 'semua') {
                        if (b.status !== cfgTagihanStatusFilter) return false;
                      }
                      if (cfgTagihanJenisFilter !== 'semua') {
                        if (b.jenis_id !== cfgTagihanJenisFilter) return false;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-gray-400 bg-slate-50/50 font-sans">
                            Tidak ada records tagihan yang cocok atau terdeteksi dalam database.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.slice().reverse().map((b, idx) => {
                      const s = santriList.find(stu => stu.id === b.santri_id);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/85 transition-all">
                          <td className="px-5 py-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md text-[9px] text-gray-500 font-bold block w-max" title={b.id}>
                              #{b.id.substring(4, 11)}..
                            </span>
                          </td>
                          <td className="px-5 py-3 text-left">
                            <span className="font-extrabold text-slate-800">{s?.nama || 'N/A'}</span>
                            <div className="text-[10px] text-gray-450 mt-0.5">Wali: {getWaliName(s?.wali_id)}</div>
                          </td>
                          <td className="px-5 py-3 text-left text-gray-600">
                            <div>{s?.kelas || 'N/A'}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">Kam: {s?.kamar || 'N/A'}</div>
                          </td>
                          <td className="px-5 py-3 text-left text-zinc-700 font-black">{getJenisName(b.jenis_id)}</td>
                          <td className="px-5 py-3 text-left text-gray-500 font-sans">{b.bulan} {b.tahun}</td>
                          <td className="px-5 py-3 font-mono text-emerald-700 font-extrabold">
                            Rp {b.nominal.toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase leading-none border ${
                              b.status === 'lunas'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center text-gray-450 font-mono text-[10px]">
                            {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                          </td>
                          <td className="px-5 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 font-sans whitespace-nowrap">
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCashInstallmentModal(b.id)}
                                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-[9px] font-extrabold shadow-xs whitespace-nowrap"
                                    title="Catat cicilan cash / tunai"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" /> Cicil Cash
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleManualSettleCash(b.id)}
                                    className="px-2 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-[9px] font-extrabold shadow-xs whitespace-nowrap"
                                    title="Tandai lunas cash / manual"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Lunas Cash
                                  </button>
                                </>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteTagihan(b.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg cursor-pointer transition-all border border-red-100 shadow-xs"
                                title="Hapus Tagihan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Sum of visible items */}
            {(() => {
              const filtered = bills.filter(b => {
                const sComp = santriList.find(s => s.id === b.santri_id);
                const studentName = sComp?.nama.toLowerCase() || '';
                const wName = getWaliName(sComp?.wali_id).toLowerCase();
                const sKelas = sComp?.kelas.toLowerCase() || '';
                const jName = getJenisName(b.jenis_id).toLowerCase();
                const q = cfgTagihanSearch.toLowerCase().trim();
                if (q) {
                  const matchesSearch = studentName.includes(q) || wName.includes(q) || sKelas.includes(q) || jName.includes(q) || b.bulan.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
                  if (!matchesSearch) return false;
                }
                if (cfgTagihanStatusFilter !== 'semua') {
                  if (b.status !== cfgTagihanStatusFilter) return false;
                }
                if (cfgTagihanJenisFilter !== 'semua') {
                  if (b.jenis_id !== cfgTagihanJenisFilter) return false;
                }
                return true;
              });

              if (filtered.length > 0) {
                return (
                  <div className="flex justify-between items-center text-[10px] text-gray-400 bg-slate-50 p-3 rounded-xl border border-gray-100 font-mono select-none">
                    <span>MENAMPILKAN {filtered.length} TAGIHAN TERPILIH</span>
                    <span className="font-bold text-slate-700 text-xs text-right animate-fade-in">
                      TOTAL KESELURUHAN: <span className="text-emerald-700 font-extrabold text-sm ml-1">Rp {filtered.reduce((sum, b) => sum + b.nominal, 0).toLocaleString('id-ID')}</span>
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

        </div>
      )}

      {/* Tab: Bills rekap & payments checker list */}
      {activeTab === 'rekap_pembayaran' && (
        <div className="space-y-6">
          
          {/* Sub Navigation Pages with clean responsive tabs */}
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-gray-150 flex flex-col md:flex-row gap-1.5 select-none">
            <button
              type="button"
              onClick={() => setRekapSubTab('riwayat')}
              className={`flex-1 text-center py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                rekapSubTab === 'riwayat'
                  ? 'bg-white text-green-700 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
              }`}
            >
              <span className="text-sm">💵</span>
              <span>Riwayat Log Pembayaran Masuk (Uang Masuk)</span>
            </button>
            <button
              type="button"
              onClick={() => setRekapSubTab('tagihan_tersebar')}
              className={`flex-1 text-center py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                rekapSubTab === 'tagihan_tersebar'
                  ? 'bg-white text-green-700 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
              }`}
            >
              <span className="text-sm">📂</span>
              <span>Arsip Log Tagihan Tersebar</span>
            </button>
          </div>

          {/* Conditional page render 1: Riwayat Log Pembayaran Masuk (Uang Masuk) */}
          {rekapSubTab === 'riwayat' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-2 border border-gray-150 flex flex-col xl:flex-row gap-2 select-none">
                {[
                  { id: 'laporan', label: 'Cetak Laporan', icon: FileText },
                  { id: 'kategori', label: 'Kategori Masuk', icon: Activity },
                  { id: 'spp', label: 'SPP Per Santri', icon: CheckCircle2 },
                  { id: 'transaksi', label: 'Log Transaksi', icon: Search }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = rekapRiwayatTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRekapRiwayatTab(tab.id as any)}
                      className={`flex-1 px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        active
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>
              
              {/* Card: Export PDF Laporan Professional */}
          {rekapRiwayatTab === 'laporan' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-150">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4 select-none">
              <div className="text-left">
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest">🖨️ Pusat Cetak Laporan & Dokumentasi PDF Keuangan</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Ekspor rekapitulasi data setoran SPP lunas secara berkala dalam format PDF profesional berlogo sekolah.</p>
              </div>
              <button 
                type="button"
                onClick={handleDownloadPDFReport}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-black text-xs rounded-xl shadow-sm active:scale-95 transition-all text-center self-stretch sm:self-auto cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export PDF Laporan Profesional
              </button>
            </div>

            {/* Config & Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-left">
              
              {/* Type Selection */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Tipe Laporan:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => setReportFilterType('bulan')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      reportFilterType === 'bulan' 
                        ? 'bg-blue-900 text-white border-blue-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    Bulanan
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReportFilterType('tanggal')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      reportFilterType === 'tanggal' 
                        ? 'bg-blue-900 text-white border-blue-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    Tanggal
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReportFilterType('rentang')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      reportFilterType === 'rentang' 
                        ? 'bg-blue-900 text-white border-blue-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    Rentang
                  </button>
                </div>
              </div>

              {/* Monthly Filter Panel */}
              {reportFilterType === 'bulan' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Bulan Acuan:</label>
                    <select 
                      value={filterBulan}
                      onChange={(e) => setFilterBulan(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-green-500"
                    >
                      {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Tahun Acuan:</label>
                    <input 
                      type="text"
                      value={filterTahun}
                      onChange={(e) => setFilterTahun(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:ring-1 focus:ring-green-500 text-gray-800"
                    />
                  </div>
                </>
              ) : reportFilterType === 'tanggal' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5 font-sans">Tanggal Transaksi:</label>
                    <input 
                      type="date"
                      value={filterSingleDate}
                      onChange={(e) => setFilterSingleDate(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-green-500 text-gray-800"
                    />
                  </div>
                  <div className="hidden md:block" />
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5 font-sans">Tanggal Mulai:</label>
                    <input 
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-green-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5 font-sans">Tanggal Selesai:</label>
                    <input 
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-green-500 text-gray-800"
                    />
                  </div>
                </>
              )}

              {/* Informative summary of filtered set */}
              {(() => {
                const reportPayments = getReportPayments();
                const midtransTotal = reportPayments.filter(p => !isCashPayment(p)).reduce((sum, p) => sum + p.nominal, 0);
                const cashTotal = reportPayments.filter(isCashPayment).reduce((sum, p) => sum + p.nominal, 0);

                return (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-gray-150 rounded-2xl select-none">
                    <div>
                      <span className="text-[9px] font-bold text-gray-450 uppercase tracking-widest block">Siap Cetak</span>
                      <span className="text-sm font-black text-emerald-700 mt-1 block">{reportPayments.length} Lunas</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-450 uppercase tracking-widest block">Midtrans</span>
                      <span className="text-xs font-black text-blue-800 mt-1 block">Rp {midtransTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-450 uppercase tracking-widest block">Cash</span>
                      <span className="text-xs font-black text-amber-700 mt-1 block">Rp {cashTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
          )}

          {/* Dashboard Keuangan Per Kategori */}
          {rekapRiwayatTab === 'kategori' && (() => {
            const rawCategorySummary = getFinancialCategorySummary();
            const categoryQuery = rekapCategorySearch.toLowerCase().trim();
            const categorySummary = rawCategorySummary.filter(item => {
              if (!categoryQuery) return true;
              return item.nama.toLowerCase().includes(categoryQuery);
            });
            const reportPayments = getReportPayments();
            const totalMasuk = categorySummary.reduce((sum, item) => sum + item.total, 0);
            const topCategory = categorySummary[0];
            const chartData = categorySummary.map(item => ({
              name: item.nama.length > 18 ? `${item.nama.substring(0, 17)}...` : item.nama,
              fullName: item.nama,
              Total: item.total,
              Midtrans: item.midtrans,
              Cash: item.cash
            }));

            return (
              <div className="bg-white rounded-3xl p-6 border border-gray-150 space-y-5">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4 select-none">
                  <div className="text-left">
                    <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-700" /> Dashboard Keuangan Per Kategori
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Pantau uang masuk berdasarkan kategori iuran yang dibuat admin, mengikuti filter tanggal/bulan di atas.</p>
                  </div>

                  <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-405" />
                    <input
                      type="text"
                      value={rekapCategorySearch}
                      onChange={(e) => setRekapCategorySearch(e.target.value)}
                      placeholder="Cari kategori iuran..."
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2 text-left min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 block">Total Masuk</span>
                      <span className="text-sm font-black text-emerald-700 block truncate">Rp {totalMasuk.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-3 py-2 text-left min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-800 block">Kategori</span>
                      <span className="text-sm font-black text-blue-800 block">{categorySummary.length} Masuk</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2 text-left min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 block">Transaksi</span>
                      <span className="text-sm font-black text-amber-800 block">{reportPayments.length} Lunas</span>
                    </div>
                  </div>
                </div>

                {categorySummary.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400">Belum ada pemasukan pada filter laporan ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                    <div className="xl:col-span-3 h-72 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -12, bottom: 22 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={45} />
                          <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp ${v >= 1000000 ? `${v / 1000000}jt` : `${v / 1000}rb`}`} />
                          <Tooltip
                            cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                            formatter={(value, name) => [`Rp ${Number(value).toLocaleString('id-ID')}`, name]}
                            labelFormatter={(label: string) => chartData.find(item => item.name === label)?.fullName || label}
                          />
                          <Bar dataKey="Total" fill="#047857" radius={[6, 6, 0, 0]} maxBarSize={42} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="xl:col-span-2 rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rincian Kategori Masuk</span>
                        {topCategory && (
                          <p className="text-[11px] text-slate-400 mt-0.5">Tertinggi: <span className="font-bold text-emerald-700">{topCategory.nama}</span></p>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {categorySummary.map((item, idx) => (
                          <div key={item.jenisId} className="p-4 hover:bg-slate-50 transition-all">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                  <h5 className="text-xs font-black text-slate-800 truncate">{item.nama}</h5>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">{item.transaksi} transaksi lunas</p>
                              </div>
                              <span className="text-xs font-black text-emerald-700 whitespace-nowrap">Rp {item.total.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] font-bold">
                              <div className="bg-blue-50 text-blue-800 rounded-xl px-3 py-2 border border-blue-100">
                                Midtrans<br/><span className="font-black">Rp {item.midtrans.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="bg-amber-50 text-amber-800 rounded-xl px-3 py-2 border border-amber-100">
                                Cash<br/><span className="font-black">Rp {item.cash.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Rekap SPP Syahriah Per Santri */}
          {rekapRiwayatTab === 'spp' && (() => {
            const sppJenisIds = getSppSyahriahJenisIds();
            const sppBillsForYear = bills.filter(b => sppJenisIds.includes(b.jenis_id) && b.tahun === sppRekapTahun);
            const santriIdsWithSpp = new Set(sppBillsForYear.map(b => b.santri_id));
            const sppQuery = sppRekapSearch.toLowerCase().trim();
            const rows = santriList
              .filter(s => s.status === 'aktif' || santriIdsWithSpp.has(s.id))
              .filter(s => {
                if (!sppQuery) return true;
                return s.nama.toLowerCase().includes(sppQuery) || s.nis.toLowerCase().includes(sppQuery) || s.kelas.toLowerCase().includes(sppQuery);
              })
              .slice()
              .sort((a, b) => a.nama.localeCompare(b.nama));
            const paidCount = rows.reduce((sum, santri) => {
              return sum + monthNamesFull.filter(month => sppBillsForYear.some(b => b.santri_id === santri.id && b.bulan === month && isSppBillPaid(b))).length;
            }, 0);

            return (
              <div className="bg-white rounded-3xl p-6 border border-gray-150 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="text-left">
                    <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Rekap SPP Syahriah Per Santri
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Centang muncul saat tagihan SPP Syahriah pada bulan tersebut sudah lunas.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-405" />
                      <input
                        type="text"
                        value={sppRekapSearch}
                        onChange={(e) => setSppRekapSearch(e.target.value)}
                        placeholder="Cari santri / NIS / kelas..."
                        className="w-full bg-slate-50 border border-slate-150 rounded-2xl pl-9 pr-3 py-3 text-xs font-semibold focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl px-4 py-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Tahun Rekap</span>
                      <input
                        type="text"
                        value={sppRekapTahun}
                        onChange={(e) => setSppRekapTahun(e.target.value)}
                        className="bg-transparent outline-none text-sm font-black text-slate-800 font-mono w-28"
                        placeholder="2026"
                      />
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2 min-w-36">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 block">Bulan Lunas</span>
                      <span className="text-sm font-black text-emerald-700">{paidCount} centang</span>
                    </div>
                  </div>
                </div>

                {sppJenisIds.length === 0 ? (
                  <div className="py-10 text-center bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-xs font-black text-amber-800">Kategori SPP Syahriah belum ditemukan.</p>
                    <p className="text-[11px] text-amber-700 mt-1">Pastikan nama jenis tagihan mengandung kata SPP dan Syahriah/Syahriyah.</p>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400">Belum ada santri/tagihan SPP Syahriah pada tahun {sppRekapTahun}.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-150">
                    <table className="w-full text-xs text-left min-w-[1080px] bg-white">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-black tracking-wider border-b border-slate-150">
                        <tr>
                          <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 min-w-60">Nama Santri</th>
                          <th className="px-3 py-3 text-center">Status</th>
                          {monthNamesFull.map(month => (
                            <th key={month} className="px-3 py-3 text-center min-w-20">{month.substring(0, 3)}</th>
                          ))}
                          <th className="px-3 py-3 text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map(santri => {
                          const paidMonths = monthNamesFull.filter(month => sppBillsForYear.some(b => b.santri_id === santri.id && b.bulan === month && isSppBillPaid(b)));
                          return (
                            <tr key={santri.id} className="hover:bg-slate-50/60">
                              <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-slate-100">
                                <span className="font-black text-slate-800 block">{santri.nama}</span>
                                <span className="text-[10px] text-slate-400">{santri.nis} - {santri.kelas}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                  santri.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' :
                                  santri.status === 'alumni' ? 'bg-amber-50 text-amber-700' :
                                  'bg-orange-50 text-orange-700'
                                }`}>
                                  {santri.status}
                                </span>
                              </td>
                              {monthNamesFull.map(month => {
                                const monthBills = sppBillsForYear.filter(b => b.santri_id === santri.id && b.bulan === month);
                                const paid = monthBills.some(isSppBillPaid);
                                const hasBill = monthBills.length > 0;
                                return (
                                  <td key={month} className="px-3 py-3 text-center">
                                    {paid ? (
                                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200" title={`${month} lunas`}>
                                        <Check className="w-4 h-4" />
                                      </span>
                                    ) : hasBill ? (
                                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100 font-black" title={`${month} belum lunas`}>
                                        -
                                      </span>
                                    ) : (
                                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-slate-50 text-slate-300 border border-slate-100" title={`${month} belum ada tagihan`}>
                                        -
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-3 text-center font-black text-emerald-700">
                                {paidMonths.length}/12
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Card: Riwayat Log Pembayaran Masuk (Kas Masuk) */}
          {rekapRiwayatTab === 'transaksi' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-150 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4 select-none">
              <div className="text-left">
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest flex items-center gap-2">
                  <span>💵 Riwayat Log Pembayaran Masuk (Uang Masuk)</span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Daftar rekaman semua pembayaran iuran santri yang telah LUNAS terverifikasi oleh sistem secara real-time.</p>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-150 px-4 py-2 rounded-2xl text-right animate-fade-in">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block font-mono">TOTAL PENDAPATAN LUNAS</span>
                <span className="text-sm font-black text-emerald-700">
                  Rp {payments.filter(p => p.status === 'lunas').reduce((sum, p) => sum + p.nominal, 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Filter Search */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs w-full max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-405" />
                <input 
                  type="text"
                  value={cfgPaymentSearch}
                  onChange={(e) => setCfgPaymentSearch(e.target.value)}
                  placeholder="Cari transaksi berdasarkan ID / Nama Santri / Wali / Jenis..."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold text-gray-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-150 bg-white shadow-xs">
              <table className="w-full text-xs text-left bg-white font-sans min-w-[950px]">
                <thead className="bg-slate-50 text-[10px] text-gray-450 uppercase font-extrabold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5 w-48">ID Transaksi / Order ID</th>
                    <th className="px-5 py-3.5 font-sans">Nama Santri & Wali</th>
                    <th className="px-5 py-3.5 font-sans">Peruntukan Iuran</th>
                    <th className="px-5 py-3.5 text-center">Metode</th>
                    <th className="px-5 py-3.5 text-center">Tanggal Bayar</th>
                    <th className="px-5 py-3.5 text-right w-40">Nominal Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-650">
                  {(() => {
                    const lunasPaymentsFiltered = payments.filter(p => {
                      if (p.status !== 'lunas') return false;
                      const b = bills.find(t => t.id === p.tagihan_id);
                      const s = b ? santriList.find(stu => stu.id === b.santri_id) : null;
                      const sName = s?.nama || '';
                      const wName = s ? getWaliName(s.wali_id) : '';
                      const jName = b ? getJenisName(b.jenis_id) : 'Iuran';
                      
                      const q = cfgPaymentSearch.toLowerCase().trim();
                      if (q) {
                        const match = sName.toLowerCase().includes(q) || 
                                      wName.toLowerCase().includes(q) || 
                                      jName.toLowerCase().includes(q) || 
                                      p.order_id.toLowerCase().includes(q) ||
                                      p.id.toLowerCase().includes(q) ||
                                      (b?.id || '').toLowerCase().includes(q);
                        if (!match) return false;
                      }
                      return true;
                    });

                    const sortedLunasPayments = lunasPaymentsFiltered.slice().sort((a, b) => {
                      const dateA = a.paid_at || a.created_at || '';
                      const dateB = b.paid_at || b.created_at || '';
                      return dateB.localeCompare(dateA);
                    });

                    if (sortedLunasPayments.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-400 bg-slate-50/50 font-sans">
                            Tidak ada data transaksi pembayaran masuk yang cocok.
                          </td>
                        </tr>
                      );
                    }

                    return sortedLunasPayments.map((p, idx) => {
                      const b = bills.find(t => t.id === p.tagihan_id);
                      const s = b ? santriList.find(stu => stu.id === b.santri_id) : null;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-all font-sans">
                          <td className="px-5 py-3.5 text-center text-gray-400 font-mono">{idx + 1}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[9px] text-gray-600 font-bold block w-max" title={p.id}>
                              {p.order_id || p.id}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-left">
                            <div className="font-bold text-slate-800">{s?.nama || 'N/A'}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-medium">Wali: {s ? getWaliName(s.wali_id) : 'N/A'}</div>
                          </td>
                          <td className="px-5 py-3.5 text-left text-slate-700">
                            <span className="font-bold">{b ? getJenisName(b.jenis_id) : 'Iuran'}</span>
                            <div className="text-[10px] text-gray-450 font-medium mt-0.5">{b ? `${b.bulan} ${b.tahun}` : '-'}</div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2 py-0.5 bg-slate-50 text-emerald-800 border border-slate-150 text-[10px] font-bold rounded-md uppercase">
                              {p.metode || 'Transfer'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono text-[10px] text-gray-500">
                            {(() => {
                              const dateVal = p.paid_at || p.created_at;
                              if (!dateVal) return '-';
                              const d = new Date(dateVal);
                              return d.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) + ' ' + d.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            })()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-emerald-700 font-black text-sm">
                            + Rp {p.nominal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
          )}
          </div>
          )}

          {/* Conditional page render 2: Arsip Log Tagihan Tersebar */}
          {rekapSubTab === 'tagihan_tersebar' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-150 space-y-4 animate-fade-in text-left">
              <div className="border-b border-gray-100 pb-4 select-none">
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest flex items-center gap-2">
                  <span>📂 Arsip Log Tagihan Tersebar (Sistem Billing)</span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Daftar rekaman seluruh invoice tagihan iuran santri yang diterbitkan oleh pesantren.</p>
              </div>

              {/* Total Summary Mini Badges */}
              <div className="flex flex-wrap gap-2 select-none text-[10px] font-sans pb-2">
                <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl font-bold">
                  Total Tagihan Pending: {bills.filter(b => b.status === 'pending').length} iuran (Rp {bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.nominal, 0).toLocaleString('id-ID')})
                </div>
                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl font-bold">
                  Total Tagihan Lunas: {bills.filter(b => b.status === 'lunas').length} iuran (Rp {bills.filter(b => b.status === 'lunas').reduce((sum, b) => sum + b.nominal, 0).toLocaleString('id-ID')})
                </div>
              </div>

              <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-sans">
                <thead className="text-[10px] uppercase text-gray-400 bg-gray-50/50">
                  <tr className="border-b border-gray-150">
                    <th className="px-4 py-3">ID Tagihan</th>
                    <th className="px-4 py-3">Nama Santri</th>
                    <th className="px-4 py-3">Periode</th>
                    <th className="px-4 py-3">Iuran</th>
                    <th className="px-4 py-3">Nominal</th>
                    <th className="px-4 py-3 text-right">Status Settle</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                  {bills.slice().reverse().map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 animate-fade-in">
                      <td className="px-4 py-3 font-mono text-gray-400">{b.id}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{getWaliName(santriList.find(s=>s.id === b.santri_id)?.wali_id)} • <span className="text-gray-400 font-medium">{santriList.find(s=>s.id === b.santri_id)?.nama}</span></td>
                      <td className="px-4 py-3">{b.bulan} {b.tahun}</td>
                      <td className="px-4 py-3">{getJenisName(b.jenis_id)}</td>
                      <td className="px-4 py-3 font-mono text-green-700">Rp {b.nominal.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase leading-none ${
                          b.status === 'lunas' 
                            ? 'bg-green-50 text-green-700 border border-green-150' 
                            : 'bg-red-50 text-red-700 border border-red-150 animate-pulse'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCashInstallmentModal(b.id)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-extrabold cursor-pointer transition-all active:scale-95 shadow-xs whitespace-nowrap"
                            title="Catat cicilan cash / tunai"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Cicil Cash
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-300 font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Tab: CMS configs manager */}
      {activeTab === 'cms' && (
        <div className="space-y-6 max-w-5xl">
          {/* Sub-navigation inside CMS tab */}
          <div className="flex border-b border-gray-150 select-none bg-slate-50 p-1.5 rounded-2xl gap-1 max-w-md">
            <button
              onClick={() => setCmsSubTab('profil_hero')}
              className={`flex-1 text-center py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                cmsSubTab === 'profil_hero'
                  ? 'bg-white text-green-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Kustomisasi Web & Layouts
            </button>
            <button
              onClick={() => setCmsSubTab('berita')}
              className={`flex-1 text-center py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                cmsSubTab === 'berita'
                  ? 'bg-white text-green-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Kelola Berita Pesantren
            </button>
          </div>

          {cmsSubTab === 'profil_hero' && (
            <form onSubmit={handleUpdateCMS} className="bg-white rounded-3xl p-6 border border-gray-150 space-y-6 text-left">
              <div className="border-b border-gray-100 pb-4">
                <h4 className="font-extrabold text-gray-900 text-sm uppercase tracking-wider">Pondok Pesantren CMS Manager</h4>
                <p className="text-xs text-slate-550 mt-1">Perbarui, kustomisasi, dan pantau konten landing page secara dinamis tanpa menyentuh kode program.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUMN 1: Profile & Hero Customizations */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-green-700" /> Profil Pokok & Semboyan Visi/Misi
                    </h5>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nama Yayasan Pontren:</label>
                      <input 
                        type="text"
                        value={cmsModelNama}
                        onChange={(e) => setCmsModelNama(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Tagline Semboyan:</label>
                      <input 
                        type="text"
                        value={cmsTagline}
                        onChange={(e) => setCmsTagline(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Visi Madrasah:</label>
                        <textarea 
                          rows={3}
                          value={cmsVisi}
                          onChange={(e) => setCmsVisi(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Misi Madrasah:</label>
                        <textarea 
                          rows={3}
                          value={cmsMisi}
                          onChange={(e) => setCmsMisi(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* HERO WALLPAPER CONFIG */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                      <Newspaper className="w-4 h-4 text-green-700" /> Pengaturan Hero Section (Banner Utama)
                    </h5>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Tipe Tampilan Hero:</label>
                        <select
                          value={heroType}
                          onChange={(e) => setHeroType(e.target.value as 'statis' | 'dinamis')}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-green-500"
                        >
                          <option value="statis">Statis (Sesuai Profil & Tagline)</option>
                          <option value="dinamis">Dinamis (Swap Berita yang Terpublish)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Warna Background Hero / Gradient:</label>
                        <input 
                          type="text"
                          placeholder="e.g. #f8fafc or linear-gradient(...)"
                          value={heroBgColor}
                          onChange={(e) => setHeroBgColor(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <ImageUploader
                        label="Latar Belakang Gambar Utama Hero / Wallpaper (Cloudinary)"
                        currentImageUrl={heroImgUrl}
                        onUploadSuccess={(url) => setHeroImgUrl(url)}
                        onClear={() => setHeroImgUrl('')}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Tingkat Opasitas Wallpaper Overlay: ({heroImgOpacity})</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={heroImgOpacity}
                          onChange={(e) => setHeroImgOpacity(parseFloat(e.target.value))}
                          className="flex-1 cursor-pointer accent-green-700"
                        />
                        <span className="text-xs font-black text-slate-700">{Math.round(heroImgOpacity * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-green-700" /> Footer, Kontak & Identitas Landing Page
                    </h5>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Alamat Footer:</label>
                      <textarea
                        rows={2}
                        value={cmsAlamat}
                        onChange={(e) => setCmsAlamat(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Telepon / WhatsApp:</label>
                        <input
                          type="text"
                          value={cmsTelepon}
                          onChange={(e) => setCmsTelepon(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Email:</label>
                        <input
                          type="email"
                          value={cmsEmail}
                          onChange={(e) => setCmsEmail(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Deskripsi Footer:</label>
                      <textarea
                        rows={3}
                        value={footerDescription}
                        onChange={(e) => setFooterDescription(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Copyright Footer:</label>
                      <input
                        type="text"
                        value={footerCopyright}
                        onChange={(e) => setFooterCopyright(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Stats Board & Custom Items JSON Content */}
                <div className="space-y-4">
                  {/* STATS BOARDS CONFIG */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-green-700" /> Konfigurasi 4 Papan Statistik (Stats Board)
                    </h5>

                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-gray-200/50">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Stat 1 Angka:</label>
                        <input 
                          type="text"
                          value={statsSantriVal}
                          onChange={(e) => setStatsSantriVal(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Stat 1 Label:</label>
                        <input 
                          type="text"
                          value={statsSantriLbl}
                          onChange={(e) => setStatsSantriLbl(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-gray-200/50">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Stat 2 Angka:</label>
                        <input 
                          type="text"
                          value={statsHalaqahVal}
                          onChange={(e) => setStatsHalaqahVal(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Stat 2 Label:</label>
                        <input 
                          type="text"
                          value={statsHalaqahLbl}
                          onChange={(e) => setStatsHalaqahLbl(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-gray-200/50">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Stat 3 Angka:</label>
                        <input 
                          type="text"
                          value={statsSppVal}
                          onChange={(e) => setStatsSppVal(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Stat 3 Label:</label>
                        <input 
                          type="text"
                          value={statsSppLbl}
                          onChange={(e) => setStatsSppLbl(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Stat 4 Angka:</label>
                        <input 
                          type="text"
                          value={statsSatisfactionVal}
                          onChange={(e) => setStatsSatisfactionVal(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Stat 4 Label:</label>
                        <input 
                          type="text"
                          value={statsSatisfactionLbl}
                          onChange={(e) => setStatsSatisfactionLbl(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEJARAH HEADER CONFIG */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-green-700" /> Header Section Sejarah & Profil Singkat
                    </h5>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Sub Judul Sejarah:</label>
                        <input 
                          type="text"
                          value={sejarahSub}
                          onChange={(e) => setSejarahSub(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Judul Utama Sejarah:</label>
                        <input 
                          type="text"
                          value={sejarahTitle}
                          onChange={(e) => setSejarahTitle(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Deskripsi Sejarah Lengkap:</label>
                      <textarea 
                        rows={3}
                        value={sejarahDesc}
                        onChange={(e) => setSejarahDesc(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ADVANCED STRINGIFIED JSON ITEMS (Routines, Facilities, Testimonials) */}
              <div className="p-4 bg-amber-50/50 hover:bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" /> Kustomisasi Lanjutan Konten List (Format JSON Data)
                  </h5>
                  <button 
                    type="button"
                    onClick={() => {
                      try {
                        const p = dbLocal.getProfilPesantren();
                        if (p) {
                          setRoutinesJson(p.routines_json || '');
                          setFacilitiesJson(p.facilities_json || '');
                          setTestimonialsJson(p.testimonials_json || '');
                          setProgramsJson(p.programs_json || DEFAULT_PROGRAMS_JSON);
                          setFaqJson(p.faq_json || DEFAULT_FAQ_JSON);
                          setSectionTitlesJson(p.section_titles_json || DEFAULT_SECTION_TITLES_JSON);
                          setSocialLinksJson(p.social_links_json || DEFAULT_SOCIAL_LINKS_JSON);
                          alert('Berhasil reset format JSON ke default profil saat ini.');
                        }
                      } catch (err) {}
                    }}
                    className="text-[10px] font-black text-amber-800 underline uppercase cursor-pointer"
                  >
                    Reset Default JSON
                  </button>
                </div>
                
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  *Catatan: Kolom-kolom di bawah menyimpan data layout list kompleks dlm format JSON. Harap pastikan keabsahan struktur kurung siku dan tanda kutip ganda agar tidak merusak tata letak landing page.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1">Agenda Harian (Routines) JSON:</label>
                    <textarea
                      rows={4}
                      value={routinesJson}
                      onChange={(e) => setRoutinesJson(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-[9px] font-mono leading-tight focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1">Program Unggulan JSON:</label>
                    <textarea
                      rows={4}
                      value={programsJson}
                      onChange={(e) => setProgramsJson(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-[9px] font-mono leading-tight focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1">Fasilitas Pesantren (Facilities) JSON:</label>
                    <textarea
                      rows={4}
                      value={facilitiesJson}
                      onChange={(e) => setFacilitiesJson(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-[9px] font-mono leading-tight focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1">FAQ Landing Page JSON:</label>
                    <textarea
                      rows={4}
                      value={faqJson}
                      onChange={(e) => setFaqJson(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-[9px] font-mono leading-tight focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1">Komentar Wali (Testimonials) JSON:</label>
                    <textarea
                      rows={4}
                      value={testimonialsJson}
                      onChange={(e) => setTestimonialsJson(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-[9px] font-mono leading-tight focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1">Judul/Subjudul Semua Section JSON:</label>
                    <textarea
                      rows={4}
                      value={sectionTitlesJson}
                      onChange={(e) => setSectionTitlesJson(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-[9px] font-mono leading-tight focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1">Link Media Sosial JSON:</label>
                    <textarea
                      rows={4}
                      value={socialLinksJson}
                      onChange={(e) => setSocialLinksJson(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-[9px] font-mono leading-tight focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[9px] text-amber-700 mt-1">Isi url untuk menampilkan tombol logo medsos di footer.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="submit"
                  className="px-6 py-3.5 bg-green-700 hover:bg-green-800 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" /> Simpan Konfigurasi Web Pesantren
                </button>
              </div>
            </form>
          )}

          {cmsSubTab === 'berita' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-green-700" /> Artikel & Berita Pesantren
                  </h4>
                  <p className="text-xs text-slate-550 mt-1">Edisi pembaruan kegiatan harian pesantren, pengumuman publik, warta prestasi, dan info wali santri.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenNewsForm()}
                  className="px-5 py-3/5 bg-green-700 hover:bg-green-800 text-white font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 self-start sm:self-center"
                >
                  <Plus className="w-4.5 h-4.5" /> Tulis Berita Baru
                </button>
              </div>

              {/* News List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {beritaList.map((b) => (
                  <div key={b.id} className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm flex flex-col hover:border-green-300 transition-all duration-300">
                    <div className="h-44 bg-slate-100 relative group overflow-hidden border-b border-gray-100">
                      {b.thumbnail_url ? (
                        <img 
                          src={b.thumbnail_url} 
                          alt={b.judul} 
                          referrerPolicy="no-referrer" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-green-800 px-4 text-center">
                          <Newspaper className="w-10 h-10 text-green-300 absolute" />
                          <span className="text-[10px] font-black uppercase text-green-800/40 relative z-10 p-5 leading-relaxed">
                            PONDOK PESANTREN<br/>MATHLABUL HIDAYAH
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`px-2.5 py-1 text-[9px] font-black tracking-wider uppercase rounded-full shadow-sm leading-none ${
                          b.is_published 
                            ? 'bg-green-600 text-white' 
                            : 'bg-yellow-500 text-white'
                        }`}>
                          {b.is_published ? 'Published' : 'Draft / Private'}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-[2px] rounded-lg px-2 py-1 text-[10px] font-medium text-white/95 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> {b.tanggal_publish}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                          <span>Oleh: <strong className="text-slate-600">{b.penulis}</strong></span>
                          <span>•</span>
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold truncate max-w-[150px]">/{b.slug}</span>
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2 hover:text-green-800 cursor-pointer">
                          {b.judul}
                        </h5>
                        <p className="text-[11px] text-slate-550 leading-relaxed line-clamp-3">
                          {b.konten}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleOpenNewsForm(b)}
                          className="px-3.5 py-2 hover:bg-slate-50 border border-gray-200 text-slate-700 font-bold text-[11px] rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <Edit className="w-3.5 h-3.5 text-green-700" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNews(b.id)}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 font-bold text-[11px] rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {beritaList.length === 0 && (
                  <div className="md:col-span-2 bg-slate-50 border border-dashed border-gray-200 rounded-3xl py-12 text-center text-slate-400">
                    <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-extrabold text-slate-550">Belum Ada Berita yang Ditulis</p>
                    <p className="text-[11px] text-slate-400 mt-1">Gunakan tombol 'Tulis Berita Baru' di atas untuk memulai tulisan perdana.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* News Write / Edit Modal Overlay */}
          {showNewsForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[999] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-left animate-in fade-in duration-200">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-5 flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Newspaper className="w-5 h-5 text-amber-400" /> {newsEditId ? 'Edit Berita Warta' : 'Terbitkan Tulisan Berita Baru'}
                    </h4>
                    <p className="text-[10px] text-green-100 mt-0.5">Semua data publik akan terupdate secara real-time di landing page utama.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowNewsForm(false)}
                    className="p-1.5 hover:bg-black/15 text-white/80 hover:text-white rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Content Scrollable */}
                <form onSubmit={handleSaveNews} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Judul Berita */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Judul Berita:</label>
                    <input 
                      type="text"
                      value={newsJudul}
                      onChange={(e) => setNewsJudul(e.target.value)}
                      placeholder="e.g. Wisuda Khataman Qur'an Angkatan XI Pondok Pesantren"
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Thumbnail URL */}
                  <div>
                    <ImageUploader
                      label="Gambar Utama / Thumbnail Berita (Cloudinary)"
                      currentImageUrl={newsThumbnailUrl}
                      onUploadSuccess={(url) => setNewsThumbnailUrl(url)}
                      onClear={() => setNewsThumbnailUrl('')}
                    />
                  </div>

                  {/* Isi Konten */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Isi Berita Lengkap:</label>
                    <textarea 
                      rows={8}
                      value={newsKonten}
                      onChange={(e) => setNewsKonten(e.target.value)}
                      placeholder="Tuliskan berita lengkap di sini secara informatif..."
                      className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white leading-relaxed"
                      required
                    />
                  </div>

                  {/* Grid: Penulis & Status Publish */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nama Penulis / Redaksi:</label>
                      <input 
                        type="text"
                        value={newsPenulis}
                        onChange={(e) => setNewsPenulis(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white"
                        required
                      />
                    </div>
                    
                    <div className="flex items-center h-full pt-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={newsIsPublished}
                          onChange={(e) => setNewsIsPublished(e.target.checked)}
                          className="w-4.5 h-4.5 rounded text-green-600 focus:ring-green-500 border-gray-300 accent-green-700 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-black text-slate-700">Publikasikan Langsung</span>
                          <p className="text-[10px] text-slate-400">Jika dicentang, berita instan tampil di halaman utama.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                    <button
                      type="button"
                      onClick={() => setShowNewsForm(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-extrabold rounded-xl cursor-pointer hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> {newsEditId ? 'Simpan Perubahan' : 'Terbitkan Berita'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Akun (Kelola Akun) */}
      {activeTab === 'akun' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Pane: Akun Pengguna Table List (2 Cols) */}
          <div className="xl:col-span-2 bg-white rounded-3xl p-6 border border-gray-150 space-y-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
              <div>
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest">Sistem Kelola Akun Pengguna</h4>
                <p className="text-[11px] text-gray-400">Daftarkan akun asatidzah baru, perbarui informasi guru & wali murid</p>
              </div>
              
              <button 
                onClick={() => handleOpenAccountModal()}
                className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Tambah Akun
              </button>
            </div>

            <div className="flex max-w-sm">
              <input 
                type="text"
                placeholder="Cari user berdasarkan nama atau e-mail..."
                value={searchAkun}
                onChange={(e) => setSearchAkun(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <tr className="border-b border-gray-150">
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">Username / E-mail</th>
                    <th className="px-4 py-3">No. WhatsApp</th>
                    <th className="px-4 py-3">Hak Akses / Role</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                  {profilesList.filter(p => p.full_name.toLowerCase().includes(searchAkun.toLowerCase()) || (p.email && p.email.toLowerCase().includes(searchAkun.toLowerCase()))).map((p) => {
                    const childrenCount = santriList.filter(s => s.wali_id === p.id).length;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-850 text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-205 flex items-center justify-center text-[10px] font-black text-green-800 col-span-1 shrink-0">
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt={p.full_name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                p.full_name.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold block leading-tight">{p.full_name}</span>
                              {p.role === 'user' && (
                                <span className="text-[10px] text-green-700 font-bold block">
                                  Putra-Putri: <span className="underline">{childrenCount} Anak Terhubung</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-505 font-medium">{p.email || 'Belum diatur'}</td>
                        <td className="px-4 py-3 font-mono text-indigo-750 font-bold">{p.phone || '-'}</td>
                        <td className="px-4 py-3 font-bold">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider leading-none border ${
                            p.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            p.role === 'guru' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-teal-50 text-teal-700 border-teal-200'
                          }`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black leading-none ${
                            p.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {p.is_active ? 'Aktif' : 'Non-aktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {p.role === 'user' && (
                            <button
                              type="button"
                              onClick={() => setAdminSelectedWaliId(p.id)}
                              className="p-1 px-2.5 bg-green-50 hover:bg-green-100 text-green-800 font-black rounded-lg cursor-pointer text-[10px]"
                              title="Kelola hubungan putra-putri wali ini"
                            >
                              Pilih Wali
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenAccountModal(p)}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-gray-755 font-bold rounded-lg cursor-pointer"
                          >
                            Ubah
                          </button>
                          <button 
                            onClick={() => handleDeleteAccount(p.id)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Pane: Kelola Hubungan Tautan Wali & Anak (1 Col) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 h-fit space-y-5 text-left select-none">
            
            <div className="border-b border-gray-100 pb-3">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Link className="w-4 h-4 text-green-700" /> Tautan Wali & Putra-Putri
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                Pilih wali di tabel kiri atau pilih dropdown berikut untuk menyelaraskan data anak yang tersambung di akun ponsel wali santri.
              </p>
            </div>

            {/* Selector dropdown for active parent */}
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">
                Pilih Orang Tua / Wali Aktif:
              </label>
              <select
                value={adminSelectedWaliId}
                onChange={(e) => setAdminSelectedWaliId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-sans"
              >
                {profilesList.filter(p => p.role === 'user').map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.phone || 'No WA'})
                  </option>
                ))}
              </select>
            </div>

            {/* List of currently bound children */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">
                Putra-Putri Berhasil Ditautkan:
              </label>
              
              {(() => {
                const linkedKids = santriList.filter(s => s.wali_id === adminSelectedWaliId);
                const activeWali = profilesList.find(p => p.id === adminSelectedWaliId);

                if (linkedKids.length === 0) {
                  return (
                    <div className="p-4 bg-amber-50/50 text-amber-800 font-bold text-[10px] rounded-xl border border-amber-200/60 leading-normal">
                      🔴 Belum ada data santri yang dikaitkan ke akun <b>{activeWali?.full_name || 'Wali Terpilih'}</b>. Gunakan simulator pencarian di bawah untuk me-link data.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {linkedKids.map((s) => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-205 flex items-center justify-between gap-1.5 hover:border-green-250 transition-all">
                        <div>
                          <h5 className="font-extrabold text-[11px] text-slate-800 leading-none uppercase">{s.nama}</h5>
                          <span className="block text-[9px] font-bold text-slate-400 leading-none mt-1">
                            NIS: <span className="font-mono text-green-700 font-bold">{s.nis}</span> • Kelas <span className="font-bold underline">{s.kelas}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdminUnlinkSantri(s.id)}
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-202 hover:border-rose-200 text-[9px] font-black rounded-lg uppercase cursor-pointer"
                        >
                          Putuskan
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Connect a student (Manual Association Form) */}
            <form onSubmit={handleAdminLinkSantri} className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-405 block mb-1">
                  Kaitkan Data Santri Baru (Ke Wali Murid Ini):
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Masukkan Nomor Induk Santri (NIS)"
                    value={adminLinkNis}
                    onChange={(e) => setAdminLinkNis(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-gray-205 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Sambungkan Data Santri
              </button>
            </form>

            {/* Testing NIS guideline Box */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-150 text-indigo-900 space-y-1.5 leading-normal">
              <span className="text-[10px] font-black text-indigo-850 uppercase block select-none">🚨 Simulator NIS Pengujian:</span>
              <p className="text-[10px] text-indigo-805 leading-relaxed select-text font-semibold">
                Klik salah satu NIS demo resmi santri asrama di bawah ini untuk mengisinya ke input otomatis dan melakukan pengaitan:
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setAdminLinkNis('202109012')}
                  className="w-full text-left p-1.5 bg-white hover:bg-indigo-100 text-[10px] rounded border border-indigo-200 flex justify-between font-semibold"
                >
                  <span>Ahmad Zidni M.</span>
                  <span className="font-mono text-indigo-750 font-bold bg-indigo-50 px-1 rounded">202109012</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminLinkNis('202109015')}
                  className="w-full text-left p-1.5 bg-white hover:bg-indigo-100 text-[10px] rounded border border-indigo-200 flex justify-between font-semibold"
                >
                  <span>Fatimah Az-Zahra</span>
                  <span className="font-mono text-indigo-750 font-bold bg-indigo-50 px-1 rounded">202109015</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminLinkNis('202109022')}
                  className="w-full text-left p-1.5 bg-white hover:bg-indigo-100 text-[10px] rounded border border-indigo-200 flex justify-between font-semibold"
                >
                  <span>Muhammad Al-Fatih</span>
                  <span className="font-mono text-indigo-750 font-bold bg-indigo-50 px-1 rounded">202109022</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab: Send announcments circular bulletins */}
      {activeTab === 'pengumuman' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form onSubmit={handlePostAnnouncement} className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-150 space-y-4">
            <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest border-b border-gray-100 pb-3 select-none">Siaran Maklumat Wali</h4>
            
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Topik / Judul Pengumuman:</label>
              <input 
                type="text"
                value={annJudul}
                onChange={(e) => setAnnJudul(e.target.value)}
                placeholder="cth: Pelaksanaan Libur Idul Adha"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Target Penyiaran:</label>
                <select 
                  value={annTarget}
                  onChange={(e) => setAnnTarget(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  required
                >
                  <option value="semua">Semua Wali Santri</option>
                  <option value="kelas">Grup Kelas Khusus</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Keterangan Kelas Target:</label>
                <input 
                  type="text"
                  value={annTargetVal}
                  onChange={(e) => setAnnTargetVal(e.target.value)}
                  placeholder="cth: IX - Tahfidz A"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Pesan Maklumat Lengkap:</label>
              <textarea 
                rows={4}
                value={annPesan}
                onChange={(e) => setAnnPesan(e.target.value)}
                placeholder="Isi pesan circular yang akan muncul di log dashboard..."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none font-semibold placeholder:font-medium"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Publikasikan & Siarkan Notifikasi
            </button>
          </form>

          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-150 flex flex-col select-none">
            <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest mb-4">Arsip Siaran Pengumuman</h4>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-80 pr-1">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-250 text-xs space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800 text-xs">{ann.judul}</span>
                    <span className="text-[9px] text-gray-400 uppercase font-bold">{ann.target === 'semua' ? 'Setiap Wali' : `Kelas ${ann.target_value}`}</span>
                  </div>
                  <p className="text-gray-600 leading-normal">{ann.pesan}</p>
                  <span className="text-[9px] text-gray-400 block mt-1">Siaran tanggal: {new Date(ann.created_at || '').toLocaleDateString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pupil Edit/Create Modal (Surgical Drawer) */}
      {showPupilModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 select-none">
          <form onSubmit={handleSavePupil} className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-150 leading-normal text-left flex flex-col max-h-[90vh]">
          <div className="p-6 pb-0 flex-shrink-0">
            <h3 className="font-extrabold text-gray-950 text-sm uppercase tracking-wide">
              {pupilId ? 'Koreksi Berkas Santri' : 'Register Berkas Santri'}
            </h3>
          </div>
          <div className="overflow-y-auto flex-1 p-6 pt-4 space-y-4">
            <h3 className="font-extrabold text-gray-950 text-sm uppercase tracking-wide">
              {pupilId ? 'Koreksi Berkas Santri' : 'Register Berkas Santri'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">NIS Santri (Unik):</label>
                <input 
                  type="text"
                  value={pNis}
                  onChange={(e) => setPNis(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Nama Lengkap Santri:</label>
                <input 
                  type="text"
                  value={pNama}
                  onChange={(e) => setPNama(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-205 rounded-xl px-3 py-1.5 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Kelas Binaan:</label>
                <select 
                  value={pKelas}
                  onChange={(e) => setPKelas(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-202 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="IX - Tahfidz A">IX - Tahfidz A</option>
                  <option value="VIII - Reguler B">VIII - Reguler B</option>
                  <option value="VII - Persiapan">VII - Persiapan</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Nama Kamar Asrama:</label>
                <input 
                  type="text"
                  value={pKamar}
                  onChange={(e) => setPKamar(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-202 rounded-xl px-3 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Jenis Kelamin:</label>
                <select 
                  value={pJK}
                  onChange={(e) => setPJK(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-202 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="L">Laki-laki (Ikhwan)</option>
                  <option value="P">Perempuan (Akhwat)</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Tanggal Lahir:</label>
                <input 
                  type="date"
                  value={pBirth}
                  onChange={(e) => setPBirth(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-202 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Wali Penanggung Jawab:</label>
              <select 
                value={pWaliId}
                onChange={(e) => setPWaliId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-green-800 focus:border-green-500"
              >
                <option value="__buat_baru__">⭐️ BUAT AKUN WALI BARU (Otomatis)</option>
                {profilesList.filter(p => p.role === 'user').map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.phone})</option>
                ))}
              </select>
            </div>

            {pWaliId === '__buat_baru__' && (
              <div className="bg-green-50/50 border border-green-200/65 rounded-2xl p-4 space-y-3 transition-all">
                <div className="text-left select-none mb-1 border-b border-green-150 pb-1.5">
                  <span className="font-extrabold text-green-900 text-xs block">✨ Informasi Akun Wali Baru</span>
                  <span className="text-[9px] text-green-600 block mt-0.5 leading-relaxed">
                    Sistem akan secara instan membuatkan akun Wali Santri agar bisa langsung login ke Dashboard Wali menggunakan nomor HP & password berikut.
                  </span>
                </div>
                
                <div>
                  <label className="text-[9px] font-black uppercase text-green-800 block mb-1">Nama Lengkap Orang Tua / Wali:</label>
                  <input
                    type="text"
                    value={newWaliFullName}
                    onChange={(e) => setNewWaliFullName(e.target.value)}
                    placeholder="Contoh: Bpk. Hidayatullah"
                    className="w-full bg-white border border-green-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                    required={pWaliId === '__buat_baru__'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-green-800 block mb-1">No. HP Wali (Login):</label>
                    <input
                      type="text"
                      value={newWaliPhone}
                      onChange={(e) => setNewWaliPhone(e.target.value)}
                      placeholder="Contoh: 0812XXXXXXXX"
                      className="w-full bg-white border border-green-200 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-slate-800"
                      required={pWaliId === '__buat_baru__'}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-green-800 block mb-1">Password Wali (Login):</label>
                    <input
                      type="text"
                      value={newWaliPassword}
                      onChange={(e) => setNewWaliPassword(e.target.value)}
                      placeholder="Default: 123456"
                      className="w-full bg-white border border-green-200 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-slate-800"
                      required={pWaliId === '__buat_baru__'}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-green-800 block mb-1">Email Wali (Opsional):</label>
                  <input
                    type="email"
                    value={newWaliEmail}
                    onChange={(e) => setNewWaliEmail(e.target.value)}
                    placeholder="wali@pesantren.com"
                    className="w-full bg-white border border-green-200 rounded-xl px-3 py-1.5 text-xs text-slate-850 font-bold"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Alamat Lengkap:</label>
              <input 
                type="text"
                value={pAlamat}
                onChange={(e) => setPAlamat(e.target.value)}
                className="w-full bg-slate-50 border border-gray-202 rounded-xl px-3 py-1.5 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Bulan Masuk Pondok:</label>
                <select 
                  value={pBulanMasuk}
                  onChange={(e) => setPBulanMasuk(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-202 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-green-500"
                >
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="text-[9px] text-gray-400 leading-none mt-1 block">Tagihan baru disebar mulai bulan ini</span>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Tahun Masuk Pondok:</label>
                <input 
                  type="number"
                  value={pTahunMasuk}
                  onChange={(e) => setPTahunMasuk(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-202 rounded-xl px-3 py-1.5 text-xs font-bold font-mono focus:ring-1 focus:ring-green-500"
                  placeholder="2026"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Status Santri:</label>
              <select
                value={pStatus}
                onChange={(e) => setPStatus(e.target.value as Santri['status'])}
                className="w-full bg-slate-50 border border-gray-202 rounded-xl px-3 py-1.5 text-xs font-black focus:ring-1 focus:ring-green-500"
              >
                <option value="aktif">Aktif</option>
                <option value="alumni">Alumni</option>
                <option value="keluar">Keluar</option>
              </select>
              <span className="text-[9px] text-gray-400 leading-none mt-1 block">Tagihan baru hanya dibuat untuk santri berstatus aktif.</span>
            </div>

            </div>{/* end scrollable area */}
            <div className="p-6 pt-4 border-t border-slate-100 flex-shrink-0 flex gap-3">
              <button 
                type="button"
                onClick={() => setShowPupilModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-gray-750 font-bold text-xs rounded-xl cursor-pointer"
              >
                Gagalkan
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Simpan Berkas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pelanggaran Modal Form Selection */}
      {showPelanggaranModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 select-none">
          <form onSubmit={handleSavePelanggaran} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-150 space-y-4 leading-normal text-left">
            <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
              Rekam Kedisiplinan / Pelanggaran
            </h3>
            
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Nama Santri Melanggar:</label>
              <select 
                value={petSId}
                onChange={(e) => setPetSId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                required
              >
                {santriList.map(s => (
                  <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Jenis Pelanggaran:</label>
              <select 
                value={petJenisId}
                onChange={(e) => {
                  setPetJenisId(e.target.value);
                  const target = vJenisList.find(jp => jp.id === e.target.value);
                  if (target) {
                    setPetPoint(target.poin_default);
                  }
                }}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                required
              >
                {vJenisList.map(v => (
                  <option key={v.id} value={v.id}>{v.nama} (default: {v.poin_default} poin)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Poin Pelanggaran:</label>
                <input 
                  type="number"
                  value={petPoint}
                  onChange={(e) => setPetPoint(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Tanggal Kejadian:</label>
                <input 
                  type="date"
                  value={petTanggal}
                  onChange={(e) => setPetTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Deskripsi & Kejadian Detail:</label>
              <textarea 
                rows={3}
                value={petDesc}
                onChange={(e) => setPetDesc(e.target.value)}
                placeholder="Tuliskan keterangan pelanggaran..."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none font-semibold placeholder:font-medium"
                required
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button"
                onClick={() => setShowPelanggaranModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-gray-750 font-bold text-xs rounded-xl cursor-pointer"
              >
                Gagalkan
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Input Pelanggaran
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Setoran Hafalan Modal Form Selection */}
      {showHapalanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 select-none">
          <form onSubmit={handleSaveHapalan} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-150 space-y-4 leading-normal text-left">
            <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
              Rekam Jurnal Setoran Hafalan
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Nama Santri:</label>
                <select 
                  value={hapSId}
                  onChange={(e) => setHapSId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  required
                >
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Kategori Hafalan:</label>
                <select 
                  value={selectedHapKatId}
                  onChange={(e) => {
                    setSelectedHapKatId(e.target.value);
                    if (e.target.value !== 'kat-quran') {
                      setHapSurah('Imriti Bab Mu\'rabat');
                    } else {
                      setHapSurah('Al-Baqarah');
                    }
                  }}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-green-700"
                  required
                >
                  {(hapKategoriList.length > 0 ? hapKategoriList : [
                    { id: 'kat-quran', nama: "Al-Qur'an", deskripsi: 'Program hafalan alquran', is_active: true }
                  ]).map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Tanggal Setoran:</label>
                <input 
                  type="date"
                  value={hapTanggal}
                  onChange={(e) => setHapTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Jenis Setoran:</label>
                <select 
                  value={hapJenis}
                  onChange={(e) => setHapJenis(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="ziyadah">Ziyadah (Hafalan Baru)</option>
                  <option value="murajaah">Muraajah (Mengulang)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">
                  {selectedHapKatId === 'kat-quran' ? 'Nama Surah:' : 'Nama Kitab / Bab / Bagian:'}
                </label>
                <input 
                  type="text"
                  value={hapSurah}
                  onChange={(e) => setHapSurah(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Nilai Kelancaran:</label>
                <select 
                  value={hapValue}
                  onChange={(e) => setHapValue(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="mumtaz">Mumtaz (Sangat Lancar)</option>
                  <option value="jayyid_jiddan">Jayyid Jiddan (Lancar)</option>
                  <option value="jayyid">Jayyid (Cukup Lancar)</option>
                  <option value="maqbul">Maqbul (Kurang Lancar)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">
                  {selectedHapKatId === 'kat-quran' ? 'Dari Ayat:' : 'Bab / Bait Dari:'}
                </label>
                <input 
                  type="number"
                  value={hapAyatDari}
                  onChange={(e) => setHapAyatDari(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">
                  {selectedHapKatId === 'kat-quran' ? 'Sampai:' : 'Sampai:'}
                </label>
                <input 
                  type="number"
                  value={hapAyatSampai}
                  onChange={(e) => setHapAyatSampai(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">
                  {selectedHapKatId === 'kat-quran' ? 'Volume (Hlm):' : 'Banyak Bait / Hal:'}
                </label>
                <input 
                  type="number"
                  step="0.1"
                  value={hapPages}
                  onChange={(e) => setHapPages(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Catatan Khas Penguji:</label>
              <textarea 
                rows={2}
                value={hapCatatan}
                onChange={(e) => setHapCatatan(e.target.value)}
                placeholder="cth: Tajwid fasih, makhraj makharijul huruf baik..."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none font-semibold placeholder:font-medium"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button"
                onClick={() => setShowHapalanModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-gray-750 font-bold text-xs rounded-xl cursor-pointer"
              >
                Gagalkan
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Simpan Setoran
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account Create/Edit Modal Selection */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 select-none">
          <form onSubmit={handleSaveAccount} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-150 space-y-4 leading-normal text-left">
            <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
              {accId ? 'Koreksi Data Pengguna' : 'Daftarkan Pengguna Baru'}
            </h3>
            
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Nama Lengkap Pengguna:</label>
              <input 
                type="text"
                value={accFullName}
                onChange={(e) => setAccFullName(e.target.value)}
                placeholder="cth: Ust. Abdul Somad, S.Ag."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Email / Username Sistem:</label>
              <input 
                type="email"
                value={accEmail}
                onChange={(e) => setAccEmail(e.target.value)}
                placeholder="name@mathlabulhidayah.sch.id"
                className="w-full bg-slate-50 border border-gray-205 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Nomor WhatsApp HP:</label>
              <input 
                type="text"
                value={accPhone}
                onChange={(e) => setAccPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full bg-slate-50 border border-gray-205 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Kata Sandi / Password Akses:</label>
              <input 
                type="text"
                value={accPassword}
                onChange={(e) => setAccPassword(e.target.value)}
                placeholder="Sandi default: 123456"
                className="w-full bg-slate-50 border border-gray-205 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Hak Akses / Role:</label>
                <select 
                  value={accRole}
                  onChange={(e) => setAccRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-205 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="user">Wali Santri (User)</option>
                  <option value="guru">Asatiddz / Guru</option>
                  <option value="admin">Administrator (Full)</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Status Akun:</label>
                <select 
                  value={accIsActive ? 'aktif' : 'pasif'}
                  onChange={(e) => setAccIsActive(e.target.value === 'aktif')}
                  className="w-full bg-slate-50 border border-gray-205 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="aktif">Aktif / Diaktifkan</option>
                  <option value="pasif">Ditangguhkan</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-750 font-bold text-xs rounded-xl cursor-pointer"
              >
                Gagalkan
              </button>
              <button 
                type="submit"
                className="flex-1 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Simpan Akun
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cash installment modal */}
      {cashInstallmentModal && cashInstallmentModal.isOpen && (() => {
        const bill = bills.find(b => b.id === cashInstallmentModal.tagihanId) || dbLocal.getTagihan().find(b => b.id === cashInstallmentModal.tagihanId);
        const student = bill ? santriList.find(s => s.id === bill.santri_id) : null;
        const jenisName = bill ? getJenisName(bill.jenis_id) : 'Iuran';

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <form onSubmit={handleCashInstallmentSubmit} className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-150 shadow-xl space-y-4 text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-900">Cicil Cash Tagihan</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Catat pembayaran tunai sebagian</p>
                </div>
              </div>

              {bill ? (
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                    <span className="block font-black uppercase text-slate-400 tracking-wider">Santri</span>
                    <span className="block text-xs font-extrabold text-slate-800 mt-1">{student?.nama || 'N/A'}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                    <span className="block font-black uppercase text-slate-400 tracking-wider">Sisa Tagihan</span>
                    <span className="block text-xs font-extrabold text-emerald-700 mt-1">Rp {bill.nominal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                    <span className="block font-black uppercase text-slate-400 tracking-wider">Peruntukan</span>
                    <span className="block text-xs font-extrabold text-slate-800 mt-1">{jenisName} - {bill.bulan} {bill.tahun}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold">
                  Tagihan tidak ditemukan.
                </div>
              )}

              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1.5">Nominal Cash Diterima:</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashInstallmentModal.nominalText}
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/[^\d]/g, '');
                      setCashInstallmentModal(prev => prev ? {
                        ...prev,
                        nominalText: rawDigits ? Number(rawDigits).toLocaleString('id-ID') : '',
                        error: undefined
                      } : prev);
                    }}
                    placeholder="Contoh: 250.000"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold font-mono text-zinc-800 focus:ring-1 focus:ring-amber-500 outline-none"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                  Setelah disimpan, nominal tagihan otomatis dikurangi sesuai uang cash yang diterima.
                </p>
              </div>

              {cashInstallmentModal.error && (
                <div className="p-3 bg-red-50 border border-red-150 text-[10.5px] text-red-700 rounded-xl leading-normal font-bold">
                  {cashInstallmentModal.error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCashInstallmentModal(null)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-xl cursor-pointer select-none transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!bill}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] rounded-xl cursor-pointer select-none transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan Cicilan Cash
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* Dynamic Custom Confirm Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-150 shadow-xl space-y-4 text-left transform scale-100 transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="text-xl">💡</span>
              <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-900">{confirmModal.title}</h4>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-xl cursor-pointer select-none transition-all"
              >
                Gagalkan / Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-black text-[11px] rounded-xl cursor-pointer select-none transition-all shadow-xs active:scale-95"
              >
                Konfirmasi / Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilihan Download PDF Biodata */}
      {pdfChoiceModal && pdfChoiceModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl space-y-4 text-left">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="text-xl">🖨️</span>
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-900">Cetak PDF Biodata</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{pdfChoiceModal.santri.nama}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pilih jenis PDF yang ingin dicetak:
            </p>

            {/* Pilihan 1: Biodata Saja */}
            <button
              type="button"
              onClick={handlePrintBiodataOnly}
              className="w-full text-left px-4 py-3.5 rounded-2xl border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-black text-[11px] text-slate-800 group-hover:text-green-800">Biodata Saja</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Cetak PDF dengan password yang sudah ada. Password wali tidak berubah.</p>
                </div>
              </div>
            </button>

            {/* Pilihan 2: Reset Password + Biodata */}
            <button
              type="button"
              onClick={handleResetAndPrint}
              className="w-full text-left px-4 py-3.5 rounded-2xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-black text-[11px] text-slate-800 group-hover:text-amber-800">Reset Password + Biodata</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Generate password baru otomatis, lalu cetak PDF dengan password terbaru.</p>
                </div>
              </div>
            </button>

            {/* Batal */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPdfChoiceModal(null)}
                className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px] rounded-xl cursor-pointer transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default AdminDashboard;
