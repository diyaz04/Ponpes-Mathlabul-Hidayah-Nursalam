import React, { useState, useTransition } from 'react';
import { read, utils, write } from 'xlsx';
import { 
  Users, ShieldAlert, BookOpen, CreditCard, History, Settings, 
  Plus, Trash2, Edit, Save, Newspaper, Megaphone, HelpCircle, 
  DollarSign, Check, Activity, RefreshCw, Eye, Sparkles, UserCheck,
  AlertTriangle, Shield, CheckCircle2, Trash, X, Calendar, Lock, GraduationCap, Link, Phone, Mail, User,
  Download, FileText, Search
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

export interface AdminDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

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
  const [cancelTargetId, setCancelTargetId] = useState('');

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
  const [reportFilterType, setReportFilterType] = useState<'bulan' | 'tanggal'>('bulan');
  const [filterBulan, setFilterBulan] = useState('Juni');
  const [filterTahun, setFilterTahun] = useState('2026');
  const [filterStartDate, setFilterStartDate] = useState('2026-05-01');
  const [filterEndDate, setFilterEndDate] = useState('2026-06-30');
  const [hapCatatan, setHapCatatan] = useState('');

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
    }
    setShowPupilModal(true);
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
              status: 'aktif',
              tahun_masuk: pTahunMasuk,
              bulan_masuk: pBulanMasuk
            }
          })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Gagal membuat wali dan santri.');
        }

        setActionDoneMsg('Santri baru berhasil didaftarkan dan akun Supabase Auth wali otomatis terbuat!');
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
          status: 'aktif',
          tahun_masuk: pTahunMasuk,
          bulan_masuk: pBulanMasuk
        });
        if (error) throw error;
        setActionDoneMsg('Santri baru berhasil didaftarkan di Supabase!');
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
          const birth = getFieldValFromRow(rowObj, ['tanggallahir', 'tgllahir', 'lahir']);
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
            birth: birth || '2011-01-01',
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
      eligibleStudents = selectedS ? [selectedS] : [];
    } else {
      eligibleStudents = bypassEntranceFilter 
        ? santriList 
        : santriList.filter(s => {
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

    const skippedCount = targetScope === 'santri' ? 0 : (santriList.length - eligibleStudents.length);

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
  const handleDownloadPDFReport = () => {
    // 1. Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // 2. Draw Simulated Professional Logo / Crest
    doc.setFillColor(4, 120, 87); // Emerald Hex
    doc.circle(22, 20, 10, 'F');
    
    doc.setDrawColor(245, 158, 11); // Gold Line
    doc.setLineWidth(0.5);
    doc.circle(22, 20, 10, 'D');

    // Initials in Crest
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('MHN', 22, 23.5, { align: 'center' });

    // 3. Header Text
    doc.setTextColor(15, 23, 42); 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(profilPP?.nama || 'Pondok Pesantren Mathlabul Hidayah Nursalam', 38, 15);
    
    doc.setTextColor(100, 116, 139); 
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(profilPP?.tagline || 'Membentuk Generasi Qurani, Cerdas, dan Berkarakter Robbani', 38, 20.2);
    doc.text(`${profilPP?.alamat || 'Jl. KH. Nursalam No. 45'} | Telp: ${profilPP?.telepon || '0231-88776655'}`, 38, 24.5);

    // Decorative separator line
    doc.setDrawColor(203, 213, 225); 
    doc.setLineWidth(0.8);
    doc.line(12, 29, 198, 29);

    // Title of Report
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('LAPORAN HASIL REKAPITULASI PENERIMAAN KAS KEUANGAN', 12, 38);

    // Metadata Subtitle Info Box background
    doc.setFillColor(248, 250, 252); 
    doc.rect(12, 42, 186, 18, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.rect(12, 42, 186, 18, 'D');

    doc.setTextColor(71, 85, 105); 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    const formattedBulan = `${filterBulan} ${filterTahun}`;
    const formattedTanggal = `${new Date(filterStartDate).toLocaleDateString('id-ID')} s.d. ${new Date(filterEndDate).toLocaleDateString('id-ID')}`;
    const filterDesc = reportFilterType === 'bulan' ? formattedBulan : formattedTanggal;

    doc.text(`Tipe Laporan: ${reportFilterType === 'bulan' ? 'Bulanan Terjadwal' : 'Custom Rentang Tanggal'}`, 16, 48);
    doc.text(`Parameter Filter: ${filterDesc}`, 16, 54);

    doc.text(`Dicetak Oleh: ${user?.email || 'Administrator'}`, 120, 48);
    doc.text(`Waktu Unduh: ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'})} WIB`, 120, 54);

    // Filter Payments
    const filtered = payments.filter(p => {
      if (p.status !== 'lunas') return false;
      
      const b = bills.find(t => t.id === p.tagihan_id);
      if (!b) return false;
      
      if (reportFilterType === 'bulan') {
        return b.bulan === filterBulan && b.tahun === filterTahun;
      } else {
        const pDateStr = p.paid_at || p.created_at || '';
        if (!pDateStr) return false;
        const pDate = pDateStr.substring(0, 10);
        return pDate >= filterStartDate && pDate <= filterEndDate;
      }
    });

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

    // Generate Table
    autoTable(doc, {
      startY: 65,
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
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFillColor(240, 253, 250); 
    doc.rect(130, finalY, 68, 16, 'F');
    doc.setDrawColor(204, 251, 241);
    doc.rect(130, finalY, 68, 16, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Jumlah Transaksi Lunas:', 134, finalY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(String(filtered.length), 188, finalY + 6, { align: 'right' });

    doc.text('Total Penerimaan Kas:', 134, finalY + 11.5);
    doc.setTextColor(4, 120, 87);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${totalRevenue.toLocaleString('id-ID')}`, 188, finalY + 11.5, { align: 'right' });

    // Decorative Signatures Box at bottom
    const sigY = finalY + 28;
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
    const filename = `Laporan_Penerimaan_${reportFilterType === 'bulan' ? filterBulan : 'Custom'}_2026.pdf`;
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
                  <th className="px-4 py-3 text-right">Opsi Operasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                {santriList.filter(s => s.nama.toLowerCase().includes(searchSantri.toLowerCase()) || s.kelas.toLowerCase().includes(searchSantri.toLowerCase())).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-gray-500">{s.nis}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-800">{s.nama}</td>
                    <td className="px-4 py-3">
                      <span>{s.kelas}</span>
                      <span className="text-[10px] text-gray-400 block font-normal">Kamar {s.kamar || 'Belum Ditunjuk'}</span>
                    </td>
                    <td className="px-4 py-3 text-green-700">{getWaliName(s.wali_id)}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button 
                        onClick={() => handleOpenPupilModal(s)}
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                      >
                        Edit
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

      {/* Tab: Pelanggaran (Data Pelanggaran) */}
      {activeTab === 'pelanggaran' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-150 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest">Data Pelanggaran Murid</h4>
              <p className="text-[11px] text-gray-400">Arsip pencatatan dan logs pembinaan kedisiplinan santri</p>
            </div>
            
            <button 
              onClick={handleOpenPelanggaranModal}
              className="px-4 py-2.5 bg-red-650 hover:bg-red-700 bg-red-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Input Pelanggaran Baru
            </button>
          </div>

          <div className="flex max-w-sm">
            <input 
              type="text"
              placeholder="Cari santri atau deskripsi..."
              value={searchPelanggaran}
              onChange={(e) => setSearchPelanggaran(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <tr className="border-b border-gray-150">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Santri</th>
                  <th className="px-4 py-3">Jenis Pelanggaran</th>
                  <th className="px-4 py-3">Bobot Poin</th>
                  <th className="px-4 py-3">Catatan / Guru</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                {violationsList.filter(v => getSantriNama(v.santri_id).toLowerCase().includes(searchPelanggaran.toLowerCase()) || v.deskripsi.toLowerCase().includes(searchPelanggaran.toLowerCase())).slice().reverse().map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-gray-500">{v.tanggal}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-800">
                      {getSantriNama(v.santri_id)}
                      <span className="text-[10px] block font-normal text-gray-400">{getSantriKelas(v.santri_id)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-800 font-bold">{getJenisVName(v.jenis_id)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                        v.poin >= 50 ? 'bg-red-50 text-red-700 border border-red-200' :
                        v.poin >= 20 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {v.poin} Poin
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 block">{v.deskripsi}</span>
                      <span className="text-[10px] font-normal text-gray-400 block mt-0.5">Oleh: {getGuruNama(v.guru_id)}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {v.status === 'aktif' ? (
                        <button 
                          onClick={() => handleResolveViolation(v.id)}
                          className="px-2 py-1 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg cursor-pointer transition-all"
                        >
                          Proses Takzir
                        </button>
                      ) : (
                        <span className="text-[10px] text-green-700 font-extrabold bg-green-50 px-2.5 py-1 rounded-full uppercase leading-none">
                          Ditindaklanjuti
                        </span>
                      )}
                      <button 
                        onClick={() => handleDeleteViolation(v.id)}
                        className="p-1 px-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer inline-flex items-center"
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
                    {santriList.map(s => (
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
                currentEligibleCount = targetSantriId ? 1 : 0;
              } else {
                currentEligibleCount = bypassEntranceFilter 
                  ? santriList.length 
                  : santriList.filter(s => {
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
                        : `${currentEligibleCount} dari ${santriList.length} Santri Aktif`
                      }
                    </span>
                  </div>
                  {targetScope === 'semua' && santriList.length - currentEligibleCount > 0 && (
                    <p className="text-[10px] text-amber-600 leading-normal font-medium">
                      ⚠️ ({santriList.length - currentEligibleCount} santri dilewati otomatis karena belum masuk/terdaftar pada periode {selBulan} {selTahun}).
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
                        Abaikan filter bulan masuk (Kirim tagihan ke seluruh santri tanpa pengecualian)
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
                    <th className="px-5 py-3.5 text-center w-40">Aksi / Kontrol</th>
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
                                <button
                                  type="button"
                                  onClick={() => handleManualSettleCash(b.id)}
                                  className="px-2 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-[9px] font-extrabold shadow-xs whitespace-nowrap"
                                  title="Tandai lunas cash / manual"
                                >
                                  <Check className="w-3.5 h-3.5" /> Lunas Cash
                                </button>
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
              
              {/* Card: Export PDF Laporan Professional */}
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
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setReportFilterType('bulan')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
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
                    className={`py-2 px-3 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      reportFilterType === 'tanggal' 
                        ? 'bg-blue-900 text-white border-blue-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    Custom Tanggal
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
              <div className="flex flex-col justify-center items-start p-3 bg-slate-50 border border-gray-150 rounded-2xl select-none">
                <span className="text-[9px] font-bold text-gray-450 uppercase tracking-widest">Transaksi Siap Cetak</span>
                <span className="text-sm font-black text-emerald-700 mt-1">
                  {payments.filter(p => {
                    if (p.status !== 'lunas') return false;
                    const b = bills.find(t => t.id === p.tagihan_id);
                    if (!b) return false;
                    if (reportFilterType === 'bulan') {
                      return b.bulan === filterBulan && b.tahun === filterTahun;
                    } else {
                      const pDateStr = p.paid_at || p.created_at || '';
                      if (!pDateStr) return false;
                      const pDate = pDateStr.substring(0, 10);
                      return pDate >= filterStartDate && pDate <= filterEndDate;
                    }
                  }).length} Lunas / Settled
                </span>
              </div>

            </div>
          </div>

          {/* Card: Riwayat Log Pembayaran Masuk (Kas Masuk) */}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <label className="text-[9px] font-black uppercase text-amber-800 block mb-1">Fasilitas Pesantren (Facilities) JSON:</label>
                    <textarea 
                      rows={4}
                      value={facilitiesJson}
                      onChange={(e) => setFacilitiesJson(e.target.value)}
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
                            PONDOK PESANTREN<br/>MATHLA'BUL HIDAYAH
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

    </div>
  );
}
export default AdminDashboard;
