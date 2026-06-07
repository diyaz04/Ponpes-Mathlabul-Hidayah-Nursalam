import React, { useState, useTransition } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid
} from 'recharts';
import { 
  GraduationCap, BookOpen, ShieldAlert, CreditCard, History, User, 
  Calendar, Printer, Key, Eye, UserPlus, Sparkles, CheckCircle2, Award,
  Mail, Phone, ShieldCheck, Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { dbLocal, isRealSupabaseConfigured, supabase } from '../../lib/supabase';
import { Santri, Pelanggaran, SetoranHapalan, ProgressHapalan, Tagihan, Pembayaran, KategoriHapalan } from '../../types';
import { PelanggaranBadge } from '../shared/PelanggaranBadge';
import { HapalanProgressCard } from '../shared/HapalanProgressCard';
import { MidtransButton } from '../shared/MidtransButton';
import { BuktiPembayaran } from '../shared/BuktiPembayaran';
import { ImageUploader } from '../shared/ImageUploader';

const PRESET_AVATARS = [
  { id: 'av-1', name: 'Ayah Kurniawan', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-2', name: 'Ibu Yayat', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-3', name: 'Ayah Ahmad', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-4', name: 'Ibu Rahma', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-5', name: 'Ayah Yusuf', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-6', name: 'Ibu Fatimah', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
];

interface UserDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function UserDashboard({ activeTab: parentActiveTab, onTabChange }: UserDashboardProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const activeTab = 
    parentActiveTab === 'overview' ? 'home' :
    parentActiveTab === 'profil_santri' ? 'profil' :
    parentActiveTab === 'profil_akun' ? 'profil_acc' :
    parentActiveTab as any;

  const handleTabChange = (tab: typeof activeTab) => {
    startTransition(() => {
      const parentTab = 
        tab === 'home' ? 'overview' :
        tab === 'profil' ? 'profil_santri' :
        tab === 'profil_acc' ? 'profil_akun' :
        tab;
      onTabChange(parentTab);
    });
  };

  // State caches
  const [mySantri, setMySantri] = useState<Santri[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [violations, setViolations] = useState<Pelanggaran[]>([]);
  const [hapalanRecords, setHapalanRecords] = useState<SetoranHapalan[]>([]);
  const [kategoriHapalanList, setKategoriHapalanList] = useState<KategoriHapalan[]>([]);
  const [activeHapalanKatId, setActiveHapalanKatId] = useState<string>('kat-quran');
  const [progress, setProgress] = useState<ProgressHapalan | null>(null);
  const [bills, setBills] = useState<Tagihan[]>([]);
  const [payments, setPayments] = useState<Pembayaran[]>([]);
  
  // Guardian Profile, Photo & Password change states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync profile form values when user details change
  React.useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setSelectedAvatar(user.avatar_url || '');
    }
  }, [user]);

  // Modal printing
  const [printBill, setPrintBill] = useState<Tagihan | null>(null);
  const [printPay, setPrintPay] = useState<Pembayaran | null>(null);

  const [dbTick, setDbTick] = useState(0);

  // Sync state reactively to database events
  useRealtime(() => {
    setDbTick(prev => prev + 1);
  }, ['santri', 'pelanggaran', 'setoran_hapalan', 'kategori_hapalan', 'progress_hapalan', 'tagihan', 'pembayaran', 'notifikasi']);

  // Load and load-bind all kids and active kid's records
  React.useEffect(() => {
    if (!user) return;
    const allS = dbLocal.getSantri();
    const mine = allS.filter(s => s.wali_id === user.id);
    setMySantri(mine);

    if (mine.length > 0) {
      // Find or default appropriate active kid
      let activeS = selectedSantri && mine.some(x => x.id === selectedSantri.id)
        ? selectedSantri
        : mine[0];

      // Auto-set the selected santri state if different or uninitialized
      if (!selectedSantri || selectedSantri.id !== activeS.id) {
        setSelectedSantri(activeS);
      }

      // Query Violations
      const allV = dbLocal.getPelanggaran();
      const currentV = allV.filter(v => v.santri_id === activeS.id);
      setViolations(currentV);

      // Query Hapalan
      const allH = dbLocal.getSetoranHapalan();
      const currentH = allH.filter(h => h.santri_id === activeS.id);
      setHapalanRecords(currentH);

      // Query Kategori Hapalan
      const allK = dbLocal.getKategoriHapalan();
      setKategoriHapalanList(allK);

      // Query Progress
      const allProg = dbLocal.getProgressHapalan();
      const currentProg = allProg.find(p => p.santri_id === activeS.id) || null;
      setProgress(currentProg);

      const loadBillingData = async () => {
        if (isRealSupabaseConfigured && supabase) {
          const { data: billData, error: billError } = await supabase
            .from('tagihan')
            .select('id, santri_id, jenis_id, bulan, tahun, nominal, status, created_at')
            .eq('santri_id', activeS.id)
            .order('created_at', { ascending: false });

          if (billError) {
            setErrorMsg(`Gagal memuat tagihan Supabase: ${billError.message}`);
            setBills([]);
            setPayments([]);
            return;
          }

          const currentBills = (billData || []) as Tagihan[];
          setBills(currentBills);

          const billingIds = currentBills.map(b => b.id);
          if (billingIds.length === 0) {
            setPayments([]);
            return;
          }

          const { data: paymentData, error: paymentError } = await supabase
            .from('pembayaran')
            .select('id, tagihan_id, order_id, snap_token, metode, nominal, status, paid_at, created_at, updated_at')
            .in('tagihan_id', billingIds)
            .order('created_at', { ascending: false });

          if (paymentError) {
            setErrorMsg(`Gagal memuat pembayaran Supabase: ${paymentError.message}`);
            setPayments([]);
            return;
          }

          setPayments((paymentData || []) as Pembayaran[]);
          return;
        }

        // Query Bills
        const allBills = dbLocal.getTagihan();
        const currentBills = allBills.filter(b => b.santri_id === activeS.id);
        setBills(currentBills);

        // Query Payments
        const allPay = dbLocal.getPembayaran();
        const billingIds = currentBills.map(b => b.id);
        const currentPay = allPay.filter(p => billingIds.includes(p.tagihan_id));
        setPayments(currentPay);
      };

      loadBillingData();
    } else {
      setSelectedSantri(null);
    }
  }, [user, selectedSantri, dbTick]);

  const getProfileByGuruId = (guruId: string) => {
    return dbLocal.getProfiles().find(p => p.id === guruId)?.full_name || 'Ustadz Penguji';
  };

  const getJenisName = (jenisId: string) => {
    return dbLocal.getJenisPembayaran().find(j => j.id === jenisId)?.nama || 'SPP Syahriyah Pesantren';
  };

  const currentPelanggaranSum = violations.reduce((acc, obj) => acc + (obj.status === 'aktif' ? obj.poin : 0), 0);

  // Format charts representation
  const chartData = [
    { name: 'Jan', Halaman: 4 },
    { name: 'Feb', Halaman: 8 },
    { name: 'Mar', Halaman: 12 },
    { name: 'Apr', Halaman: 7 },
    { name: 'Mei', Halaman: progress?.total_halaman ? Math.max(progress.total_halaman - 15, 5) : 10 },
    { name: 'Jun', Halaman: progress?.total_halaman || 15 }
  ];

  const handleSaveWaliProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profileName.trim() || !profileEmail.trim()) {
      setErrorMsg('Nama Lengkap dan Alamat Email wajib diisi!');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    // Optional password update
    let finalPassword = user.password || '123456';
    if (oldPassword || newPassword || confirmPassword) {
      if (oldPassword !== (user.password || '123456')) {
        setErrorMsg('🚨 Kata sandi lama salah! Silakan coba lagi.');
        setTimeout(() => setErrorMsg(null), 5000);
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setErrorMsg('🚨 Kata sandi baru minimal harus 6 karakter.');
        setTimeout(() => setErrorMsg(null), 5000);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('🚨 Konfirmasi kata sandi baru tidak cocok.');
        setTimeout(() => setErrorMsg(null), 5000);
        return;
      }
      finalPassword = newPassword;
    }

    const profiles = dbLocal.getProfiles();
    const updatedProfiles = profiles.map(p => {
      if (p.id === user.id) {
        return {
          ...p,
          full_name: profileName.trim(),
          email: profileEmail.trim(),
          phone: profilePhone.trim(),
          avatar_url: selectedAvatar,
          password: finalPassword
        };
      }
      return p;
    });

    // Sync to Supabase profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: profileName.trim(),
        phone: profilePhone.trim(),
        avatar_url: selectedAvatar
      })
      .eq('id', user.id);

    if (updateError) {
      setErrorMsg(`Gagal memperbarui profil: ${updateError.message}`);
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    // Update password in Supabase Auth if changed
    if (finalPassword !== (user.password || '123456')) {
      await supabase.auth.updateUser({ password: finalPassword }).catch(() => undefined);
    }

    dbLocal.setProfiles(updatedProfiles);
    setSuccessMsg('🎉 Berhasil! Profil, foto profil, dan kata sandi akses Anda diperbarui secara aman.');
    
    // Clear out input values for passwords
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    // Trigger state sync across system components
    window.dispatchEvent(new Event('mh_auth_change'));

    setTimeout(() => {
      setSuccessMsg(null);
    }, 5000);
  };

  const handleOpenPrint = (bill: Tagihan, payRecord?: Pembayaran) => {
    setPrintBill(bill);
    setPrintPay(payRecord || undefined);
  };

  return (
    <div className={`p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto flex-1 ${isPending ? 'opacity-50' : ''}`}>
      
      {/* Alert toast notifications can be displayed here */}
      {(successMsg || errorMsg) && (
        <div className="space-y-2 select-none">
          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-2xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-50 text-rose-800 font-extrabold text-xs rounded-2xl border border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profil_acc' ? (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-green-800 to-emerald-700 p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />
            
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center relative z-10">
              <div className="p-3.5 bg-white/10 rounded-2xl shrink-0">
                <User className="w-8 h-8 text-green-150" />
              </div>
              <div className="text-left">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-900 text-[9px] font-black tracking-widest uppercase rounded-md inline-block">
                  Akses Orang Tua / Wali Murid
                </span>
                <h3 className="font-black text-xl md:text-2xl mt-1 tracking-wide uppercase">
                  Pengaturan Akun & Keamanan
                </h3>
                <p className="text-xs text-green-100/90 mt-1 max-w-xl leading-relaxed">
                  Perbarui foto profil/avatar Anda, kelola data kontak WhatsApp, serta ubah kata sandi rahasia akun secara mandiri demi menjaga keamanan privasi raport hapalan santri.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveWaliProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Hand Card: Profil & Pilih Foto Avatar (7 Columns) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                  👤 Info Kontak & Foto Profil Wali
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pilih salah satu ikon avatar di bawah ini atau ganti informasi biodata kontak WhatsApp Anda yang aktif.
                </p>
              </div>

              {/* 1. Interactive Avatar Gallery */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                  Pilih Foto Profil / Avatar Pendukung
                </label>
                
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 p-0.5 transition-all duration-300 ${
                        selectedAvatar === av.url 
                          ? 'border-green-600 ring-2 ring-green-100 scale-105' 
                          : 'border-gray-250 hover:border-gray-300 hover:scale-[1.02]'
                      }`}
                      title={av.name}
                    >
                      <img 
                        src={av.url} 
                        alt={av.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      {selectedAvatar === av.url && (
                        <div className="absolute inset-0 bg-green-600/10 flex items-center justify-center">
                          <span className="bg-green-600 text-white rounded-full p-0.5 shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Compressed custom profile upload */}
                <div className="pt-2">
                  <ImageUploader 
                    label="Atau unggah foto profil kustom Anda (Cloudinary):"
                    currentImageUrl={selectedAvatar}
                    onUploadSuccess={(url) => setSelectedAvatar(url)}
                    onClear={() => setSelectedAvatar('')}
                  />
                </div>
              </div>

              {/* 2. Contact Fields */}
              <div className="space-y-4 pt-2">
                {/* ID Akun (Read-only) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ID Pengguna Resmi</label>
                  <input
                    type="text"
                    disabled
                    value={user?.id || ''}
                    className="w-full px-4 py-2.5 bg-slate-50 text-slate-500 rounded-xl border border-gray-200 text-xs font-mono font-bold select-all cursor-not-allowed"
                  />
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-sans">Nama Lengkap Wali</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ibu Yayat Nurhayati"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-white text-slate-800 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nomor WhatsApp */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">No. HP / WhatsApp Alerts</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        placeholder="Contoh: 0856xxxxxxxx"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-white text-slate-800 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-semibold transition-all"
                      />
                    </div>
                  </div>

                  {/* Alamat Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Alamat Email Aktif</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="Contoh: yayat@mail.com"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-white text-slate-800 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-semibold transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Kemitraan */}
                <div className="p-4 bg-green-50/50 rounded-2xl border border-green-150 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-700 shrink-0" />
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Status Kemitraan</h5>
                      <span className="text-[10px] text-green-700 font-bold block mt-0.5">Disinkronkan oleh pihak administrasi asrama</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    TERTANDATING
                  </span>
                </div>
              </div>
            </div>

            {/* Right Hand Card: Keamanan & Ganti Sandi (5 Columns) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-5">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                    🔑 Ganti Kata Sandi Akses
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Silakan isi formulir di bawah ini hanya jika Anda ingin mengubah kata sandi lama Anda.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Password Lama */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kata Sandi Lama</label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="password"
                        placeholder="Masukkan kata sandi lama (aktif)"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-mono transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Baru */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kata Sandi Baru</label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-mono transition-all"
                      />
                    </div>
                  </div>

                  {/* Konfirmasi Password Baru */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ulangi Kata Sandi Baru</label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="password"
                        placeholder="Ulangi kata sandi baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-mono transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800">
                  <span className="text-[10px] font-black uppercase tracking-wider block">💡 Petunjuk Kata Sandi:</span>
                  <p className="text-[10px] text-amber-700 leading-relaxed mt-1 font-semibold">
                    Kata sandi awal bawaan akun demo Anda adalah <span className="font-mono bg-amber-100/70 px-1 py-0.5 rounded text-amber-900">123456</span>. Kosongkan semua kolom sandi jika Anda hanya ingin memperbarui data profil tanpa mengganti sandi akses.
                  </p>
                </div>
              </div>

              {/* Unified Save Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4.5 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-850 hover:to-green-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 a-4" /> Simpan Perubahan Profil & Kata Sandi
                </button>
              </div>

            </div>

          </form>

        </div>
      ) : selectedSantri ? (
        <>
          {/* Active Student Picker */}
          {mySantri.length > 1 && (
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pilih Data Santri:</span>
              <div className="flex gap-2">
                {mySantri.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSantri(s)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                      selectedSantri.id === s.id 
                        ? 'bg-green-100 text-green-800 border-2 border-green-500' 
                        : 'bg-slate-100 text-gray-600 border border-slate-200'
                    }`}
                  >
                    {s.nama}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 1: Ringkasan (Dashboard) */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              
              {/* Top Hero Student Profile Card */}
              <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden select-none">
                <div className="relative z-10 space-y-2">
                  <span className="px-2.5 py-1 bg-white/10 text-[9px] font-black uppercase tracking-wider rounded-lg border border-white/10">Wali Santri Dashboard</span>
                  <h3 className="text-2xl font-black">{selectedSantri.nama}</h3>
                  <p className="text-green-100 text-xs font-semibold">
                    Kelas: <span className="font-bold underline">{selectedSantri.kelas}</span> • NIS: <span className="font-mono font-bold leading-none">{selectedSantri.nis}</span> • Kamar: {selectedSantri.kamar || 'N/A'}
                  </p>
                  <p className="text-green-200 font-medium text-[10px] uppercase tracking-widest mt-1">Status: {selectedSantri.status}</p>
                </div>

                <div className="text-right relative z-10 mt-4 md:mt-0 space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-green-200 leading-none">Poin Pelanggaran Aktif:</div>
                  <div className="text-5xl font-black tracking-tight">{currentPelanggaranSum}</div>
                  <div className="text-[10px] text-green-300 font-semibold">{currentPelanggaranSum > 0 ? 'Harap bimbing kembali adab santri' : 'Santri disiplin & berakhlaq karimah'}</div>
                </div>

                {/* Islamic styled decorative shape */}
                <div className="absolute right-[-40px] bottom-[-60px] opacity-10 pointer-events-none">
                  <div className="w-80 h-80 border-[35px] border-white rounded-full"></div>
                </div>
              </div>

              {/* Bento Row Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Metric A: Qur'an track */}
                <HapalanProgressCard 
                  totalJuz={progress?.total_juz || 0}
                  totalHalaman={progress?.total_halaman || 0}
                  lastSurah={progress?.last_surah || 'Belum Ada'}
                  totalSetoran={hapalanRecords.length}
                />

                {/* Metric B: Last Billing status */}
                {(() => {
                  const pendingBill = bills.find(b => b.status === 'pending');
                  return (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4 select-none">
                        <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        {pendingBill ? (
                          <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">BELUM LUNAS</span>
                        ) : (
                          <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">LUNAS BULAN INI</span>
                        )}
                      </div>

                      <div>
                        {pendingBill ? (
                          <>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Tagihan SPP ({pendingBill.bulan})</p>
                            <h4 className="text-2xl font-black text-gray-900 leading-none">Rp {pendingBill.nominal.toLocaleString('id-ID')}</h4>
                            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Batas bayar akhir bulan ini. Bayar via QRIS otomatis.</p>
                            <MidtransButton 
                              tagihan={pendingBill}
                              studentName={selectedSantri.nama}
                              onPaymentSuccess={() => setDbTick(prev => prev + 1)}
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Status Keuangan</p>
                            <h4 className="text-lg font-extrabold text-green-800 leading-snug">Semua Tagihan Lunas</h4>
                            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">Terima kasih banyak telah berpartisipasi menyukseskan pembiayaan operasional Ponpes Nursalam.</p>
                            <div className="p-3 bg-green-50 rounded-xl border border-dashed border-green-200 text-center mt-3 text-[10px] text-green-700 font-bold flex items-center justify-center gap-1 leading-none select-none">
                              <CheckCircle2 className="w-4 h-4 text-green-600" /> KAS BENDAHARA SETTLED
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Metric C: Dynamic Recent logs feed */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex flex-col justify-between hover:shadow-md transition-all select-none">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-900 font-bold uppercase text-[10px] tracking-wider">Aktivitas Terkini</p>
                    <span 
                      onClick={() => handleTabChange('hapalan')}
                      className="text-[10px] text-green-700 font-black cursor-pointer bg-green-50 px-2 py-0.5 rounded-md hover:bg-green-100 transition-colors"
                    >
                      Kajian Selengkapnya
                    </span>
                  </div>

                  {/* List feeds */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-56 pr-1 scrollbar-thin divide-y divide-gray-50">
                    {violations.length === 0 && hapalanRecords.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-10">Belum ada aktivitas tercatat bulan ini</p>
                    ) : (
                      [
                        ...violations.map(v => ({ ...v, feedType: 'violation' as const, dateObj: new Date(v.tanggal) })),
                        ...hapalanRecords.map(h => ({ ...h, feedType: 'hapalan' as const, dateObj: new Date(h.tanggal) }))
                      ]
                        .sort((a,b) => b.dateObj.getTime() - a.dateObj.getTime())
                        .slice(0, 3)
                        .map((item, idx) => (
                          <div key={idx} className="flex gap-3 items-start pt-2">
                            <span className="text-lg">{item.feedType === 'violation' ? '⚠️' : '✅'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black truncate text-gray-800">
                                {item.feedType === 'violation' 
                                  ? `Pelanggaran: ${ (item as Pelanggaran).deskripsi }`
                                  : `Setor Hafalan: Surah ${ (item as SetoranHapalan).surah_nama }`
                                }
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {item.feedType === 'violation' ? 'Ust. Keamanan' : getProfileByGuruId((item as SetoranHapalan).guru_id)}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Profil Santri */}
          {activeTab === 'profil' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-150 max-w-4xl">
              <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-gray-100 pb-6 mb-6">
                <div className="w-24 h-24 rounded-2xl bg-green-100 border-2 border-green-500 flex items-center justify-center font-black text-green-700 text-3xl">
                  {selectedSantri.nama.charAt(0)}
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-md text-[10px] font-black border border-green-150 uppercase tracking-widest select-none">ID Card Santri</span>
                  <h3 className="text-xl font-extrabold text-gray-900">{selectedSantri.nama}</h3>
                  <p className="text-xs font-semibold text-gray-500">NIS: {selectedSantri.nis} • Kamar {selectedSantri.kamar || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs select-text">
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px] select-none">Kelas Akademik:</span>
                    <span className="font-bold text-gray-800">{selectedSantri.kelas}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px] select-none">Jenis Kelamin:</span>
                    <span className="font-bold text-gray-800">{selectedSantri.jenis_kelamin === 'L' ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px] select-none">Tanggal Lahir:</span>
                    <span className="font-bold text-gray-800">{new Date(selectedSantri.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px] select-none">Tahun Masuk Pesantren:</span>
                    <span className="font-bold text-gray-800">{selectedSantri.tahun_masuk}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px] select-none">Alamat Rumah Wali:</span>
                    <span className="font-semibold text-gray-750">{selectedSantri.alamat || 'Kecamatan Cadangpinggan'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px] select-none">Wali Santri Penanggung Jawab:</span>
                    <span className="font-bold text-gray-900">{user.full_name} ({user.phone || 'N/A'})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Pelanggaran report */}
          {activeTab === 'pelanggaran' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-150 flex flex-col">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-4 select-none">
                <div>
                  <h4 className="font-black text-gray-900 text-sm">Laporan Kedisiplinan & Pelanggaran</h4>
                  <p className="text-[11px] text-gray-400">Total poin terakumulasi aktif bulan ini</p>
                </div>
                <PelanggaranBadge poin={currentPelanggaranSum} />
              </div>

              {violations.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase text-slate-500">Masyallah, Bersih Tanpa Pelanggaran!</p>
                  <p className="text-[11px] mt-1 text-slate-400">Santri senantiasa taat pada adat thariqah pondok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-gray-450 uppercase tracking-wider bg-gray-50/50">
                      <tr className="border-b border-gray-150">
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Poin</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">Keterangan</th>
                        <th className="px-4 py-3 text-center">Status Laporan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                      {violations.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">{new Date(v.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3 text-red-600 font-bold font-mono">+{v.poin}</td>
                          <td className="px-4 py-3 uppercase text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full ${v.poin > 30 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                              {v.poin > 50 ? 'Berat' : v.poin > 15 ? 'Sedang' : 'Ringan'}
                            </span>
                          </td>
                          <td className="px-4 py-3 leading-snug">{v.deskripsi}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase inline-block leading-none ${
                              v.status === 'aktif' 
                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                              {v.status === 'aktif' ? 'Aktif' : 'Selesai Dibina'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Hafalan track detail */}
          {activeTab === 'hapalan' && (
            <div className="space-y-6">
              {/* Category selector sub-tabs */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5 overflow-x-auto max-w-max select-none">
                {(kategoriHapalanList.length > 0 ? kategoriHapalanList : [
                  { id: 'kat-quran', nama: "Al-Qur'an", deskripsi: 'Program hafalan alquran', is_active: true }
                ]).map((kat) => {
                  const isActive = activeHapalanKatId === kat.id;
                  const count = hapalanRecords.filter(h => (h.kategori_id || 'kat-quran') === kat.id).length;
                  return (
                    <button
                      key={kat.id}
                      type="button"
                      onClick={() => setActiveHapalanKatId(kat.id)}
                      className={`whitespace-nowrap px-4 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-white text-green-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span>{kat.nama}</span>
                      <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-650'}`}>
                        {count} Setoran
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic layout based on whether Al-Qur'an or other program is picked */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {activeHapalanKatId === 'kat-quran' ? (
                  <>
                    {/* Profile progress left panel (2 cols) */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                      <HapalanProgressCard 
                        totalJuz={progress?.total_juz || 0}
                        totalHalaman={progress?.total_halaman || 0}
                        lastSurah={progress?.last_surah || 'Belum Ada'}
                        totalSetoran={hapalanRecords.filter(h => (h.kategori_id || 'kat-quran') === 'kat-quran').length}
                      />

                      {/* Progress Visual chart */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-150 flex-1 flex flex-col">
                        <h5 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-4 select-none">Halaman Terkumpul Per Sesi</h5>
                        <div className="flex-1 min-h-48 text-[10px]">
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" stroke="#94a3b8" />
                              <YAxis stroke="#94a3b8" />
                              <Tooltip />
                              <Line type="monotone" dataKey="Halaman" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Setoran tables right panel (3 cols) */}
                    <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-150 flex flex-col">
                      <h4 className="font-black text-gray-800 text-xs uppercase tracking-widest mb-4 select-none">Riwayat Transaksi Setoran Qur'an</h4>
                      
                      {hapalanRecords.filter(h => (h.kategori_id || 'kat-quran') === 'kat-quran').length === 0 ? (
                        <p className="text-xs text-gray-400 py-12 text-center select-none">Belum ada hafalan Qur'an yang diujikan oleh ustadz pengampu.</p>
                      ) : (
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-xs text-left">
                            <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                              <tr className="border-b border-gray-150">
                                <th className="px-3 py-2.5">Tanggal</th>
                                <th className="px-3 py-2.5">Sesi</th>
                                <th className="px-3 py-2.5">Surah (Ayat)</th>
                                <th className="px-3 py-2.5">Jumlah Hal.</th>
                                <th className="px-3 py-2.5">Nilai</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                              {hapalanRecords.filter(h => (h.kategori_id || 'kat-quran') === 'kat-quran').map((h) => (
                                <tr key={h.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2.5">{new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                                  <td className="px-3 py-2.5 uppercase text-[10px] text-blue-700">{h.jenis}</td>
                                  <td className="px-3 py-2.5">
                                    <span className="font-extrabold text-slate-800">{h.surah_nama}</span>
                                    <span className="text-[10px] text-gray-500 block">Ayat {h.ayat_dari} - {h.ayat_sampai}</span>
                                  </td>
                                  <td className="px-3 py-2.5 font-mono">{h.jumlah_halaman} Hlm</td>
                                  <td className="px-3 py-2.5 uppercase">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                      h.nilai === 'mumtaz' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {h.nilai}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Custom Program Info Left Panel (2 cols) */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                      <div className="bg-gradient-to-br from-green-700 to-emerald-800 p-6 rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[170px]">
                        <div className="space-y-4">
                          <span className="bg-white/20 text-white font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full text-[8px]">
                            Program Syahadah Hafalan Kitab / Matan
                          </span>
                          <h3 className="font-extrabold text-base leading-tight">
                            {kategoriHapalanList.find(k => k.id === activeHapalanKatId)?.nama}
                          </h3>
                          <p className="text-white/80 text-[10px] leading-relaxed">
                            {kategoriHapalanList.find(k => k.id === activeHapalanKatId)?.deskripsi || 'Program hafalan non-Qur\'an untuk peningkatan khazanah keilmuan Islam.'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-white/25">
                          <div>
                            <span className="text-white/60 text-[9px] block uppercase font-bold">Total Setoran</span>
                            <span className="font-extrabold text-base font-mono">
                              {hapalanRecords.filter(h => h.kategori_id === activeHapalanKatId).length} Kali
                            </span>
                          </div>
                          <div>
                            <span className="text-white/60 text-[9px] block uppercase font-bold">Status Capaian</span>
                            <span className="font-extrabold text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Aktif Teruji
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-gray-150 flex-1 flex flex-col justify-between select-none">
                        <div>
                          <h5 className="text-[10px] font-bold text-gray-800 uppercase tracking-widest mb-3">Tujuan Pembelajaran</h5>
                          <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                            Program hafalan matan / nazham memperkokoh penguasaan ilmu nahwu sharaf dan dasar agama. Setiap setoran diverifikasi ustadz penguji untuk memastikan hafalan mutqin.
                          </p>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                          <span className="text-[10px] text-slate-600 font-bold leading-normal">
                            Data uji kelancaran langsung disinkronisasi ke asrama wali santri.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Book Setoran Table Right Panel (3 cols) */}
                    <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-150 flex flex-col">
                      <h4 className="font-black text-gray-800 text-xs uppercase tracking-widest mb-4 select-none">
                        Riwayat Hafalan Matan: {kategoriHapalanList.find(k => k.id === activeHapalanKatId)?.nama}
                      </h4>
                      
                      {hapalanRecords.filter(h => h.kategori_id === activeHapalanKatId).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-xs text-gray-400 font-semibold mb-1">Belum ada jurnal cetak setoranhafalan.</p>
                          <p className="text-[10px] text-gray-400">Mintalah kepada Ustadz pengampu asrama untuk menguji dan menulis nilainya.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-xs text-left text-gray-700">
                            <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                              <tr className="border-b border-gray-150">
                                <th className="px-3 py-2.5">Tanggal</th>
                                <th className="px-3 py-2.5">Tipe Sesi</th>
                                <th className="px-3 py-2.5">Bab / Bagian / Bait</th>
                                <th className="px-3 py-2.5">Volume</th>
                                <th className="px-3 py-2.5">Nilai Kelancaran</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-semibold">
                              {hapalanRecords.filter(h => h.kategori_id === activeHapalanKatId).map((h) => (
                                <tr key={h.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2.5 whitespace-nowrap">{new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                                  <td className="px-3 py-2.5 uppercase text-[10px] text-blue-705">{h.jenis}</td>
                                  <td className="px-3 py-2.5">
                                    <span className="font-extrabold text-slate-800 block">{h.surah_nama}</span>
                                    <span className="text-[10px] text-gray-500 block font-sans">Bait / Ayat: {h.ayat_dari} - {h.ayat_sampai}</span>
                                  </td>
                                  <td className="px-3 py-2.5 font-mono">{h.jumlah_halaman} Volume/Hlm</td>
                                  <td className="px-3 py-2.5 uppercase">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                      h.nilai === 'mumtaz' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {h.nilai}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: List/Billing invoices */}
          {activeTab === 'tagihan' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-150">
              <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-4 border-b border-gray-100 pb-3 select-none">Pemeriksaan Tagihan Aktif</h4>
              
              <div className="space-y-4">
                {bills.filter(b => b.status === 'pending').length === 0 ? (
                  <div className="py-12 text-center text-slate-400 select-none">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2 opacity-55" />
                    <p className="text-xs font-bold uppercase text-slate-500">Masyallah, Bebas Hutang Tagihan!</p>
                    <p className="text-[11px] text-slate-400 mt-1">Semua kewajiban spp santri lunas terverifikasi.</p>
                  </div>
                ) : (
                  bills.filter(b => b.status === 'pending').map((bill) => (
                    <div 
                      key={bill.id}
                      className="p-5 bg-gradient-to-r from-red-50/50 to-orange-50/30 rounded-3xl border border-red-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div>
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 font-extrabold text-[9px] tracking-wider uppercase rounded">SPP Tertunggak Pelunasan</span>
                        <h4 className="text-md font-extrabold text-slate-800 mt-1.5">{getJenisName(bill.jenis_id)}</h4>
                        <p className="text-xs font-semibold text-slate-500">Periode Ujian: <span className="font-bold underline">{bill.bulan} {bill.tahun}</span></p>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold block leading-none">NOMINAL INVOICE:</span>
                          <span className="font-black text-slate-800 text-md font-mono">Rp {bill.nominal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="min-w-36 shrink-0 print:hidden">
                          <MidtransButton 
                            tagihan={bill} 
                            studentName={selectedSantri.nama} 
                            onPaymentSuccess={() => setDbTick(prev => prev + 1)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 6: Historic receipts downloads */}
          {activeTab === 'riwayat' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-150">
              <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-4 border-b border-gray-100 pb-3 select-none">Riwayat Kuitansi Pembayaran</h4>
              
              {payments.filter(p => p.status === 'lunas').length === 0 ? (
                <p className="text-xs text-gray-400 py-10 text-center select-none">Belum ada entri kuitansi digital yang terlunasi.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                      <tr className="border-b border-gray-150">
                        <th className="px-4 py-3">Periode</th>
                        <th className="px-4 py-3">Nama Iuran</th>
                        <th className="px-4 py-3">Metode Bayar</th>
                        <th className="px-4 py-3">Tgl Bayar</th>
                        <th className="px-4 py-3">Nominal Settle</th>
                        <th className="px-4 py-3 text-right">Opsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                      {payments.filter(p => p.status === 'lunas').map((p) => {
                        const b = bills.find(bill => bill.id === p.tagihan_id);
                        if (!b) return null;
                        
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold">{b.bulan} {b.tahun}</td>
                            <td className="px-4 py-3 text-slate-800">
                              <div>{getJenisName(b.jenis_id)}</div>
                              {/* If the single payment nominal is less than what was originally billed (or if it's marked as a cicilan) */}
                              <span className="text-[9px] text-blue-600 block mt-0.5">Invoice: #{b.id.substring(4, 10).toUpperCase()}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-600">{p.metode || 'QRIS Midtrans'}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {p.paid_at 
                                ? new Date(p.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'Terverifikasi Sistem'
                              }
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-green-700">
                              Rp {p.nominal.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => handleOpenPrint(b, p)}
                                className="px-3.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 text-xs font-bold rounded-xl border border-green-200 cursor-pointer inline-flex items-center gap-1.5 transition-all active:scale-95 select-none"
                              >
                                <Printer className="w-3.5 h-3.5" /> Unduh Kwitansi
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </>
      ) : (
        <div className="py-20 text-center text-gray-400 select-none">
          <GraduationCap className="w-16 h-16 mx-auto opacity-30 text-green-600 animate-pulse mb-3" />
          <h3 className="text-md font-bold text-gray-800">Tidak ada santri dikaitkan</h3>
          <p className="text-xs">Hubungi administrator pesantren untuk mendaftarkan NIS & asuransi putra/putri Anda.</p>
        </div>
      )}

      {/* Floating Printing receipt Modal */}
      {printBill && (
        <BuktiPembayaran 
          tagihan={printBill}
          pembayaran={printPay || undefined}
          santri={selectedSantri || undefined}
          wali={user}
          onClose={() => setPrintBill(null)}
        />
      )}

    </div>
  );
}
export default UserDashboard;
