import React, { useState, useTransition, useEffect } from 'react';
import { 
  Users, ShieldAlert, BookOpen, AlertCircle, Sparkles, 
  Trash2, Edit, Save, PlusCircle, Check, MapPin, Eye, GraduationCap,
  Key, ShieldCheck, User, Mail, Phone
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { dbLocal } from '../../lib/supabase';
import { Santri, Pelanggaran, SetoranHapalan, JenisPelanggaran, Profile, KategoriHapalan } from '../../types';
import { ImageUploader } from '../shared/ImageUploader';

const TEACHER_AVATARS = [
  { id: 'av-g1', name: 'Ust. Fauzi', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-g2', name: 'Ustadzah Fatimah', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-g3', name: 'Ust. Sholahuddin', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-g4', name: 'Ustadzah Rahma', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-g5', name: 'Ust. Ahmad', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80' },
  { id: 'av-g6', name: 'Ustadzah Aminah', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' },
];

interface GuruDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function GuruDashboard({ activeTab: parentActiveTab, onTabChange }: GuruDashboardProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const activeTab = 
    parentActiveTab === 'santri_binaan' ? 'santri' :
    parentActiveTab === 'input_pelanggaran' ? 'pelanggaran' :
    parentActiveTab === 'input_hapalan' ? 'hapalan' :
    parentActiveTab === 'rekap_santri' ? 'monitoring' :
    parentActiveTab as any;

  const handleTabChange = (tab: typeof activeTab) => {
    startTransition(() => {
      const parentTab = 
        tab === 'santri' ? 'santri_binaan' :
        tab === 'pelanggaran' ? 'input_pelanggaran' :
        tab === 'hapalan' ? 'input_hapalan' :
        tab === 'monitoring' ? 'rekap_santri' :
        tab;
      onTabChange(parentTab);
    });
  };

  // State Caches
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [vJenisList, setVJenisList] = useState<JenisPelanggaran[]>([]);
  const [myViolations, setMyViolations] = useState<Pelanggaran[]>([]);
  const [myHapalan, setMyHapalan] = useState<SetoranHapalan[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');

  // Profile Settings State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setSelectedAvatar(user.avatar_url || '');
    }
  }, [user]);

  // Form Inputs: Pelanggaran
  const [pSantriId, setPSantriId] = useState('');
  const [pJenisId, setPJenisId] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPoint, setPPoint] = useState<number>(5);
  const [pTanggal, setPTanggal] = useState(new Date().toISOString().split('T')[0]);

  // Form Inputs: Hapalan Setoran
  const [hSantriId, setHSantriId] = useState('');
  const [hTanggal, setHTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [hJenis, setHJenis] = useState<'ziyadah' | 'murajaah'>('ziyadah');
  const [hSurahNama, setHSurahNama] = useState('Al-Baqarah');
  const [hAyatDari, setHAyatDari] = useState<number>(1);
  const [hAyatSampai, setHAyatSampai] = useState<number>(10);
  const [hPages, setHPages] = useState<number>(0.5);
  const [hValue, setHValue] = useState<'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbul'>('mumtaz');
  const [hCatatan, setHCatatan] = useState('');
  const [hKategoriList, setHKategoriList] = useState<KategoriHapalan[]>([]);
  const [selectedHKatId, setSelectedHKatId] = useState<string>('kat-quran');

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Monitor panel pupil selected
  const [monPupil, setMonPupil] = useState<Santri | null>(null);

  useRealtime(() => {
    const listS = dbLocal.getSantri();
    setSantriList(listS);

    const listJP = dbLocal.getJenisPelanggaran();
    setVJenisList(listJP);

    const listKat = dbLocal.getKategoriHapalan();
    setHKategoriList(listKat);

    if (user) {
      const allV = dbLocal.getPelanggaran();
      // Guru gets to view list they logged
      setMyViolations(allV.filter(v => v.guru_id === user.id));

      const allH = dbLocal.getSetoranHapalan();
      setMyHapalan(allH.filter(h => h.guru_id === user.id));
    }
  });

  const getSantriName = (id: string) => {
    return santriList.find(s => s.id === id)?.nama || 'Santri';
  };

  const getSutriKelas = (id: string) => {
    return santriList.find(s => s.id === id)?.kelas || 'N/A';
  };

  const getJenisVName = (id: string) => {
    return vJenisList.find(v => v.id === id)?.nama || 'Pelanggaran';
  };

  const handleJenisChange = (id: string) => {
    setPJenisId(id);
    const target = vJenisList.find(jp => jp.id === id);
    if (target) {
      setPPoint(target.poin_default);
    }
  };

  // Submit new infraction trigger notification inside!
  const handleSubmitPelanggaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pSantriId || !pJenisId || !pDesc) {
      alert('Harap lengkapi isian formulir pelanggaran!');
      return;
    }
    if (!user) return;

    dbLocal.insertPelanggaran({
      santri_id: pSantriId,
      guru_id: user.id,
      jenis_id: pJenisId,
      tanggal: pTanggal,
      deskripsi: pDesc,
      poin: pPoint,
      status: 'aktif'
    });

    setSuccessMsg('⚠️ Pelanggaran berhasil diinput & notifikasi wali dikirim!');
    setTimeout(() => setSuccessMsg(null), 3000);

    // Reset Form
    setPDesc('');
    setPJenisId('');
    setPSantriId('');
  };

  // Submit new hafalan - triggers update calculations + notify!
  const handleSubmitHapalan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hSantriId || !hSurahNama || !hAyatDari || !hAyatSampai || !hPages) {
      alert('Harap lengkapi biodata setoran!');
      return;
    }
    if (!user) return;

    dbLocal.insertSetoranHapalan({
      santri_id: hSantriId,
      guru_id: user.id,
      tanggal: hTanggal,
      jenis: hJenis,
      surah_nama: hSurahNama,
      surah_nomor: 1, // simplified index
      ayat_dari: Number(hAyatDari),
      ayat_sampai: Number(hAyatSampai),
      jumlah_halaman: Number(hPages),
      nilai: hValue,
      catatan: hCatatan,
      kategori_id: selectedHKatId
    });

    setSuccessMsg('📖 Hafalan berhasil diinput & terekam di wali santri!');
    setTimeout(() => setSuccessMsg(null), 3000);

    // Reset Form fields
    setHCatatan('');
    setHSantriId('');
  };

  const handleDeleteHapalan = (id: string) => {
    if (confirm('Yakin ingin menghapus rekaman setoran ini?')) {
      const list = dbLocal.getSetoranHapalan();
      dbLocal.setSetoranHapalan(list.filter(h => h.id !== id));
    }
  };

  const handleDeleteViolations = (id: string) => {
    if (confirm('Yakin ingin membatalkan logs kedisiplinan ini?')) {
      const list = dbLocal.getPelanggaran();
      dbLocal.setPelanggaran(list.filter(v => v.id !== id));
    }
  };

  const handleSaveGuruProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileErrorMsg('Nama Lengkap dan Alamat Email wajib diisi!');
      setTimeout(() => setProfileErrorMsg(null), 4000);
      return;
    }

    // Optional password update
    let finalPassword = user.password || 'guru';
    if (oldPassword || newPassword || confirmPassword) {
      if (oldPassword !== (user.password || 'guru')) {
        setProfileErrorMsg('🚨 Kata sandi lama salah! Silakan coba lagi.');
        setTimeout(() => setProfileErrorMsg(null), 5000);
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setProfileErrorMsg('🚨 Kata sandi baru minimal harus 6 karakter.');
        setTimeout(() => setProfileErrorMsg(null), 5000);
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileErrorMsg('🚨 Konfirmasi kata sandi baru tidak cocok.');
        setTimeout(() => setProfileErrorMsg(null), 5000);
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

    dbLocal.setProfiles(updatedProfiles);
    setSuccessMsg('🎉 Berhasil! Profil, foto profil, dan kata sandi akses Anda diperbarui secara aman.');
    
    // Clear out input values for passwords
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    // Trigger state sync across system components
    window.dispatchEvent(new Event('mh_auth_change'));
    window.dispatchEvent(new Event('mh_local_store_change'));

    setTimeout(() => {
      setSuccessMsg(null);
    }, 5000);
  };

  // Monitor profile compilation
  const handleOpenMonitoring = (s: Santri) => {
    setMonPupil(s);
    handleTabChange('monitoring');
  };

  return (
    <div className={`p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto flex-1 ${isPending ? 'opacity-50' : ''}`}>
      
      {/* Dynamic Notifications toasts */}
      {(successMsg || profileErrorMsg) && (
        <div className="space-y-2 select-none">
          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-2xl border border-emerald-200 flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
          {profileErrorMsg && (
            <div className="p-4 bg-rose-50 text-rose-800 font-extrabold text-xs rounded-2xl border border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab: Overview (Dashboard) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
            
            {/* Pupil count card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Total Santri Binaan</span>
                <span className="text-xl font-black text-gray-800">{santriList.length} Anak</span>
              </div>
            </div>

            {/* Violation counts logged */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Pelanggaran Tercatat (Anda)</span>
                <span className="text-xl font-black text-gray-800">{myViolations.length} Logs</span>
              </div>
            </div>

            {/* Setorans counts logged */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Hafalan Tervalidasi</span>
                <span className="text-xl font-black text-gray-800">{myHapalan.length} Sesi</span>
              </div>
            </div>

          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-150">
            <h4 className="font-bold text-gray-950 text-xs uppercase tracking-widest mb-4 select-none">Aktivitas Terakhir Diinput Oleh Anda</h4>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {myHapalan.length === 0 && myViolations.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center select-none">Belum ada data diinput hari ini.</p>
              ) : (
                [
                  ...myViolations.map(v => ({ ...v, type: 'violation' as const, dateObj: new Date(v.tanggal) })),
                  ...myHapalan.map(h => ({ ...h, type: 'hapalan' as const, dateObj: new Date(h.tanggal) }))
                ]
                  .sort((a,b) => b.dateObj.getTime() - a.dateObj.getTime())
                  .slice(0, 5)
                  .map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 select-none">
                      <span className="text-sm">{item.type === 'violation' ? '⚠️' : '📖'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-800 leading-snug">
                          {item.type === 'violation' 
                            ? `Pelanggaran Santri: ${getSantriName((item as Pelanggaran).santri_id)}`
                            : `Setoran Hapalan Santri: ${getSantriName((item as SetoranHapalan).santri_id)}`
                          }
                        </p>
                        <p className="text-[10px] text-gray-450 mt-1">
                          {item.type === 'violation' 
                            ? `Keterangan: ${(item as Pelanggaran).deskripsi} (Poin: ${(item as Pelanggaran).poin})`
                            : `Surah ${(item as SetoranHapalan).surah_nama} Ayat ${(item as SetoranHapalan).ayat_dari}-${(item as SetoranHapalan).ayat_sampai} (Hlm: ${(item as SetoranHapalan).jumlah_halaman})`
                          }
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-450 font-bold">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: pupils list */}
      {activeTab === 'santri' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-150">
          <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-4">Daftar Santri Pontren Mathlabul Hidayah</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase text-gray-400 bg-gray-50/50">
                <tr className="border-b border-gray-150">
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nama Santri</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Asrama (Kamar)</th>
                  <th className="px-4 py-3">Jenis Kelamin</th>
                  <th className="px-4 py-3 text-right">Monitoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                {santriList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-gray-500">{s.nis}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-800">{s.nama}</td>
                    <td className="px-4 py-3 text-slate-700">{s.kelas}</td>
                    <td className="px-4 py-3">{s.kamar || 'Kamar Mandiri'}</td>
                    <td className="px-4 py-3 uppercase text-[10px]">{s.jenis_kelamin === 'L' ? 'Ikhwan' : 'Akhwat'}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleOpenMonitoring(s)}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl border border-green-200 cursor-pointer inline-flex items-center gap-1.5 transition-all select-none"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Progres
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: input pelanggaran */}
      {activeTab === 'pelanggaran' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Form (2 cols) */}
          <form onSubmit={handleSubmitPelanggaran} className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-150 space-y-4">
            <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest border-b border-gray-100 pb-3 select-none">Log Pelanggaran Santri</h4>
            
            {/* Pick Santri */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Pilih Santri Terkait:</label>
              <select 
                value={pSantriId}
                onChange={(e) => setPSantriId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold"
                required
              >
                <option value="">-- Pilih Santri --</option>
                {santriList.map(s => (
                  <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                ))}
              </select>
            </div>

            {/* Pick Jenis Pelanggaran */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Jenis Pelanggaran:</label>
              <select 
                value={pJenisId}
                onChange={(e) => handleJenisChange(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold"
                required
              >
                <option value="">-- Kategori Pelanggaran --</option>
                {vJenisList.map(v => (
                  <option key={v.id} value={v.id}>{v.nama} (Poin: {v.poin_default})</option>
                ))}
              </select>
            </div>

            {/* Poin value custom override */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Poin Pelanggaran:</label>
                <input 
                  type="number"
                  value={pPoint}
                  onChange={(e) => setPPoint(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Tanggal Kejadian:</label>
                <input 
                  type="date"
                  value={pTanggal}
                  onChange={(e) => setPTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Keterangan / Kronologi Kejadian:</label>
              <textarea 
                rows={3}
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                placeholder="cth: Santri terlambat menghadiri kajian subuh asrama selama 15 menit."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold placeholder:font-medium resize-none"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              Simpan & Hubungkan Wali
            </button>
          </form>

          {/* Right Log List (3 cols) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-150 flex flex-col select-none">
            <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest mb-4">Riwayat Log Keamanan (Oleh Anda)</h4>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-gray-400 bg-gray-50/50 uppercase tracking-widest">
                  <tr className="border-b border-gray-150">
                    <th className="px-4 py-2.5">Santri</th>
                    <th className="px-4 py-2.5">Jenis</th>
                    <th className="px-4 py-2.5">Poin</th>
                    <th className="px-4 py-2.5 text-right">Batalkan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-55 font-semibold text-gray-700">
                  {myViolations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-900">{getSantriName(v.santri_id)}</td>
                      <td className="px-4 py-2.5">{getJenisVName(v.jenis_id)}</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold font-mono">{v.poin}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button 
                          onClick={() => handleDeleteViolations(v.id)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md cursor-pointer transition-colors"
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

        </div>
      )}

      {/* Tab: input hapalan */}
      {activeTab === 'hapalan' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Form (2 cols) */}
          <form onSubmit={handleSubmitHapalan} className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-150 space-y-4">
            <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest border-b border-gray-100 pb-3 select-none">Checklist Setoran Hapalan</h4>
            
            {/* Pick Santri & Pick Program */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Pilih Santri:</label>
                <select 
                  value={hSantriId}
                  onChange={(e) => setHSantriId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold"
                  required
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Program Hafalan:</label>
                <select 
                  value={selectedHKatId}
                  onChange={(e) => {
                    setSelectedHKatId(e.target.value);
                    if (e.target.value !== 'kat-quran') {
                      setHSurahNama('Alfiyah Bab Kalam');
                    } else {
                      setHSurahNama('Al-Baqarah');
                    }
                  }}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-green-700 focus:ring-1 focus:ring-green-500"
                  required
                >
                  {(hKategoriList.length > 0 ? hKategoriList : [
                    { id: 'kat-quran', nama: "Al-Qur'an", deskripsi: 'Hafalan Al-Quran', is_active: true }
                  ]).map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Setoran fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Kategori Setoran:</label>
                <select 
                  value={hJenis}
                  onChange={(e) => setHJenis(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-green-500"
                  required
                >
                  <option value="ziyadah">Ziyadah (Hafalan Baru)</option>
                  <option value="murajaah">Murajaah (Mengulang)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  {selectedHKatId === 'kat-quran' ? "Surah Qur'an:" : 'Nama Kitab / Bab:'}
                </label>
                <input 
                  type="text"
                  value={hSurahNama}
                  onChange={(e) => setHSurahNama(e.target.value)}
                  placeholder="cth: Al-Isra"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  {selectedHKatId === 'kat-quran' ? 'Ayat Mulai:' : 'Mulai Bait/Hal:'}
                </label>
                <input 
                  type="number"
                  value={hAyatDari}
                  onChange={(e) => setHAyatDari(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  {selectedHKatId === 'kat-quran' ? 'Ayat Akhir:' : 'Sampai:'}
                </label>
                <input 
                  type="number"
                  value={hAyatSampai}
                  onChange={(e) => setHAyatSampai(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  {selectedHKatId === 'kat-quran' ? 'Halaman:' : 'Banyak Bait/Hal:'}
                </label>
                <input 
                  type="number"
                  step="0.1"
                  value={hPages}
                  onChange={(e) => setHPages(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Grade Nilai Ujian:</label>
                <select 
                  value={hValue}
                  onChange={(e) => setHValue(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 focus:ring-1 focus:ring-green-500 uppercase"
                  required
                >
                  <option value="mumtaz">Mumtaz (Istimewa)</option>
                  <option value="jayyid_jiddan">Jayyid Jiddan (Sangat Baik)</option>
                  <option value="jayyid">Jayyid (Baik)</option>
                  <option value="maqbul">Maqbul (Cukup)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Tanggal Ujian:</label>
                <input 
                  type="date"
                  value={hTanggal}
                  onChange={(e) => setHTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Catatan Pendidik untuk Wali:</label>
              <textarea 
                rows={2}
                value={hCatatan}
                onChange={(e) => setHCatatan(e.target.value)}
                placeholder="cth: Alhamdulillah lancar, harap murojaah makhroj dhomah"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-green-500 font-semibold placeholder:font-medium resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              Posting Validasi Hapalan
            </button>
          </form>

          {/* Right Log List (3 cols) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-150 flex flex-col select-none">
            <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-widest mb-4">Riwayat Verifikasi Ujian Berakhir (Anda)</h4>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-gray-400 bg-gray-50/50 uppercase tracking-widest">
                  <tr className="border-b border-gray-150">
                    <th className="px-3 py-2.5">Santri</th>
                    <th className="px-3 py-2.5">Materi</th>
                    <th className="px-3 py-2.5">Evaluasi</th>
                    <th className="px-3 py-2.5 text-right">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-55 font-semibold text-gray-700">
                  {myHapalan.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <span className="text-slate-900 block font-bold truncate max-w-[120px]">{getSantriName(h.santri_id)}</span>
                        <span className="text-[10px] text-gray-450">{getSutriKelas(h.santri_id)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1 flex-wrap">
                          {h.kategori_id && h.kategori_id !== 'kat-quran' ? (
                            <span className="bg-amber-100 text-amber-900 text-[8px] px-1 py-0.5 rounded font-black uppercase">
                              {hKategoriList.find(k => k.id === h.kategori_id)?.nama || 'Matan'}
                            </span>
                          ) : null}
                          <span className="text-slate-800 font-extrabold">{h.surah_nama}</span>
                        </span>
                        <span className="text-[10px] text-gray-450 block mt-0.5">
                          {h.kategori_id && h.kategori_id !== 'kat-quran' ? 'Bait / Hal:' : 'Ayat:'} {h.ayat_dari} - {h.ayat_sampai}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold uppercase text-[10px]">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">{h.nilai}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button 
                          onClick={() => handleDeleteHapalan(h.id)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md cursor-pointer transition-colors"
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

        </div>
      )}

      {/* Tab: Monitoring & detail rekap */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="font-extrabold text-gray-950 text-xs uppercase tracking-widest select-none">Pemeriksaan Monitoring Personal Santri</h4>
              <p className="text-[11px] text-gray-400">Pilih nama anak didik untuk meneliti lembar mutaba'ah lengkap</p>
            </div>
            
            <select 
              value={monPupil?.id || ''}
              onChange={(e) => {
                const trg = santriList.find(s => s.id === e.target.value);
                setMonPupil(trg || null);
              }}
              className="bg-slate-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <option value="">-- Pilih Nama Santri --</option>
              {santriList.map(s => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          </div>

          {monPupil ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box A: violations tracking */}
              <div className="bg-white p-6 rounded-3xl border border-gray-150 flex flex-col">
                <h5 className="font-black text-gray-900 text-xs uppercase tracking-widest border-b border-gray-100 pb-3 mb-3">
                  Log Kedisiplinan: {monPupil.nama}
                </h5>
                <div className="overflow-y-auto max-h-80 space-y-3 pr-1">
                  {dbLocal.getPelanggaran().filter(v => v.santri_id === monPupil.id).length === 0 ? (
                    <p className="text-xs text-gray-405 text-center py-10">Masyallah, bersih tanpa catatan pelanggaran!</p>
                  ) : (
                    dbLocal.getPelanggaran().filter(v => v.santri_id === monPupil.id).map(v => (
                      <div key={v.id} className="p-3 bg-red-50/40 rounded-xl border border-red-50 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-black text-red-900 truncate max-w-[200px]">{v.deskripsi}</p>
                          <span className="text-[10px] text-gray-450 block mt-1">{v.tanggal} • Oleh Pendidik</span>
                        </div>
                        <span className="font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px]">+{v.poin} Poin</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Box B: setoran track */}
              <div className="bg-white p-6 rounded-3xl border border-gray-150 flex flex-col">
                <h5 className="font-black text-gray-900 text-xs uppercase tracking-widest border-b border-gray-100 pb-3 mb-3">
                  Kumpulan Hafalan: {monPupil.nama}
                </h5>
                <div className="overflow-y-auto max-h-80 space-y-3 pr-1">
                  {dbLocal.getSetoranHapalan().filter(h => h.santri_id === monPupil.id).length === 0 ? (
                    <p className="text-xs text-gray-405 text-center py-10">Belum memiliki riwayat setoran tahfidz.</p>
                  ) : (
                    dbLocal.getSetoranHapalan().filter(h => h.santri_id === monPupil.id).map(h => (
                      <div key={h.id} className="p-3 bg-blue-50/40 rounded-xl border border-blue-50 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-black text-slate-800">Surah {h.surah_nama}</p>
                          <span className="text-[10px] text-gray-450 block mt-1">Ayat {h.ayat_dari}-{h.ayat_sampai} • Hlm: {h.jumlah_halaman} • {h.tanggal}</span>
                        </div>
                        <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px] uppercase">{h.nilai}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center bg-white border border-gray-150 rounded-3xl text-gray-400 select-none">
              <Users className="w-12 h-12 text-green-600 opacity-30 mx-auto animate-pulse mb-2" />
              <p className="text-xs">Sila tentukan nama santri terlebih dahulu untuk melihat rekam jejak lengkap.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Profil Guru */}
      {activeTab === 'profil' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-green-700 p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden select-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />
            
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center relative z-10">
              <div className="p-3.5 bg-white/10 rounded-2xl shrink-0">
                <User className="w-8 h-8 text-green-150" />
              </div>
              <div className="text-left">
                <span className="px-2.5 py-0.5 bg-yellow-400 text-slate-900 text-[9px] font-black tracking-widest uppercase rounded-md inline-block">
                  Akses Pendidik / Asatidzah
                </span>
                <h3 className="font-black text-xl md:text-2xl mt-1 tracking-wide uppercase">
                  Pengaturan Akun & Keamanan Pendidik
                </h3>
                <p className="text-xs text-green-100/95 mt-1 max-w-xl leading-relaxed">
                  Perbarui biodata asatidzah, kelola nomor kontak WhatsApp koordinasi asrama, serta atur password keamanan akun Anda secara berkala.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveGuruProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Hand Card: Profil & Pilih Foto Avatar (7 Columns) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 select-none">
                  👤 Biodata Kontak & Foto Profil Asatidzah
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 select-none">
                  Tentukan avatar resmi Anda demi memudahkan pengenalan profil oleh Wali Murid pada kuitansi & progress raport.
                </p>
              </div>

              {/* 1. Interactive Avatar Gallery */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans select-none">
                  Pilih Foto Profil / Avatar Asatidzah:
                </label>
                
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {TEACHER_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 p-0.5 transition-all duration-300 cursor-pointer ${
                        selectedAvatar === av.url 
                          ? 'border-green-600 ring-2 ring-green-100 scale-105' 
                          : 'border-slate-202 hover:border-slate-250 hover:scale-[1.02]'
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
                        <div className="absolute inset-0 bg-green-600/15 flex items-center justify-center">
                          <span className="bg-green-600 text-white rounded-full p-0.5 shadow-sm">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom compressed profile upload for Asatidzah */}
                <div className="pt-3 border-t border-dashed border-gray-150 mt-4">
                  <ImageUploader 
                    label="Atau unggah foto profil kustom Asatidzah (Cloudinary):"
                    currentImageUrl={selectedAvatar}
                    onUploadSuccess={(url) => setSelectedAvatar(url)}
                    onClear={() => setSelectedAvatar('')}
                  />
                </div>
              </div>

              {/* 2. Text Input Info */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans mb-1.5 select-none">
                    Nama Lengkap Asatidzah (Gelar Lengkap):
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Cth: Ustadz M. Sholahuddin, S.Pd.I"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-202 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans mb-1.5 select-none">
                      Nomor Koordinasi WhatsApp:
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="Cth: 0812XXXXXXXX"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-202 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-semibold transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans mb-1.5 select-none">
                      Alamat Email (Username Log In):
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="alamat@email.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-202 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-semibold transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Hand Card: Safe Password Change (5 Columns) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 select-none">
                    🔑 Keamanan & Ganti Kata Sandi
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 select-none font-medium leading-relaxed">
                    Kosongkan kolom sandi berikut jika Anda hanya berniat memperbarui data biodata kontak umum tanpa mengganti password login.
                  </p>
                </div>

                {/* Password field elements */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans mb-1.5 select-none">
                      Kata Sandi Lama Anda:
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Masukkan sandi saat ini"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-805 rounded-xl border border-slate-202 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans mb-1.5 select-none">
                      Kata Sandi Baru (Min. 6 Karakter):
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter unik"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-805 rounded-xl border border-slate-202 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans mb-1.5 select-none">
                      Konfirmasi Kata Sandi Baru:
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kembali sandi baru"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-850 rounded-xl border border-slate-202 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    if (user) {
                      setProfileName(user.full_name || '');
                      setProfileEmail(user.email || '');
                      setProfilePhone(user.phone || '');
                      setSelectedAvatar(user.avatar_url || '');
                    }
                  }}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs cursor-pointer select-none transition-all active:scale-95 text-center border border-slate-202"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-black text-xs cursor-pointer shadow-sm select-none transition-all active:scale-95 text-center"
                >
                  Simpan Perubahan
                </button>
              </div>

            </div>

          </form>

        </div>
      )}

    </div>
  );
}
export default GuruDashboard;
