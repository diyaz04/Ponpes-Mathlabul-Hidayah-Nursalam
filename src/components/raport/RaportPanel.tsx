import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Download, FileText, GraduationCap, Plus, Save, Trash2, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { dbLocal } from '../../lib/supabase';
import {
  KelasMapel,
  KelasRaport,
  KelasSantri,
  MataPelajaran,
  NilaiSantri,
  Profile,
  Raport,
  Santri,
  SemesterRaport
} from '../../types';
import { downloadRaportPDF } from './RaportPDF';

type RaportPanelMode = 'admin' | 'guru' | 'wali';
type RaportSubTab = 'kelas' | 'mapel' | 'setup' | 'nilai' | 'finalisasi' | 'wali';

type RaportPanelProps = {
  mode: RaportPanelMode;
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
};

const defaultTahunAjaran = '2026/2027';

export const getRaportPredikat = (nilai: number) => {
  if (nilai >= 90) return 'A';
  if (nilai >= 80) return 'B';
  if (nilai >= 70) return 'C';
  if (nilai >= 60) return 'D';
  return 'E';
};

const hitungNilaiAkhir = (harian?: number | null, uas?: number | null) => {
  return Number((((harian || 0) * 0.6) + ((uas || 0) * 0.4)).toFixed(2));
};

export function RaportPanel({ mode }: RaportPanelProps) {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState<KelasRaport[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [kelasSantriList, setKelasSantriList] = useState<KelasSantri[]>([]);
  const [kelasMapelList, setKelasMapelList] = useState<KelasMapel[]>([]);
  const [nilaiList, setNilaiList] = useState<NilaiSantri[]>([]);
  const [raportList, setRaportList] = useState<Raport[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<RaportSubTab>(
    mode === 'wali' ? 'wali' : mode === 'guru' ? 'nilai' : 'kelas'
  );
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<SemesterRaport>('ganjil');
  const [selectedTahun, setSelectedTahun] = useState(defaultTahunAjaran);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [selectedMapelId, setSelectedMapelId] = useState('');
  const [selectedGuruId, setSelectedGuruId] = useState('');
  const [newKelasNama, setNewKelasNama] = useState('');
  const [newKelasTahun, setNewKelasTahun] = useState(defaultTahunAjaran);
  const [newKelasWaliId, setNewKelasWaliId] = useState('');
  const [newMapelNama, setNewMapelNama] = useState('');
  const [newMapelKategori, setNewMapelKategori] = useState<'diniyah' | 'umum'>('diniyah');
  const [catatanWali, setCatatanWali] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin = mode === 'admin';
  const isGuru = mode === 'guru';
  const isWali = mode === 'wali';

  const syncRaportData = () => {
    setKelasList(dbLocal.getRaportKelas());
    setMapelList(dbLocal.getMataPelajaran());
    setKelasSantriList(dbLocal.getKelasSantri());
    setKelasMapelList(dbLocal.getKelasMapel());
    setNilaiList(dbLocal.getNilaiSantri());
    setRaportList(dbLocal.getRaport());
    setSantriList(dbLocal.getSantri());
    setProfilesList(dbLocal.getProfiles());
  };

  useRealtime(syncRaportData, ['kelas', 'mata_pelajaran', 'kelas_santri', 'kelas_mapel', 'nilai_santri', 'raport', 'santri', 'profiles']);

  useEffect(syncRaportData, []);

  const teacherProfiles = profilesList.filter(profile => profile.role === 'guru' || profile.role === 'admin');

  const allowedKelas = useMemo(() => {
    if (!user || isAdmin || isWali) return kelasList;
    const kelasIds = new Set([
      ...kelasMapelList.filter(item => item.guru_id === user.id).map(item => item.kelas_id),
      ...kelasList.filter(item => item.wali_kelas_id === user.id).map(item => item.id)
    ]);
    return kelasList.filter(item => kelasIds.has(item.id));
  }, [isAdmin, isWali, kelasList, kelasMapelList, user]);

  useEffect(() => {
    if (!selectedKelasId && allowedKelas.length > 0) {
      setSelectedKelasId(allowedKelas[0].id);
    }
  }, [allowedKelas, selectedKelasId]);

  useEffect(() => {
    const currentRaport = raportList.find(item =>
      item.kelas_id === selectedKelasId &&
      item.semester === selectedSemester &&
      item.tahun_ajaran === selectedTahun &&
      item.santri_id === selectedSantriId
    );
    setCatatanWali(currentRaport?.catatan_wali_kelas || '');
  }, [raportList, selectedKelasId, selectedSemester, selectedTahun, selectedSantriId]);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  };

  const selectedKelas = kelasList.find(item => item.id === selectedKelasId);
  const selectedWaliSantri = isWali && user ? santriList.filter(santri => santri.wali_id === user.id) : [];

  const classStudentLinks = kelasSantriList.filter(item =>
    item.kelas_id === selectedKelasId &&
    item.semester === selectedSemester &&
    item.tahun_ajaran === selectedTahun
  );
  const classStudents = classStudentLinks
    .map(link => santriList.find(santri => santri.id === link.santri_id))
    .filter(Boolean) as Santri[];

  const classMapelsAll = kelasMapelList.filter(item => item.kelas_id === selectedKelasId);
  const classMapels = isGuru && user
    ? classMapelsAll.filter(item => item.guru_id === user.id)
    : classMapelsAll;

  const findNilai = (santriId: string, kelasMapelId: string) => {
    return nilaiList.find(item =>
      item.santri_id === santriId &&
      item.kelas_mapel_id === kelasMapelId &&
      item.semester === selectedSemester &&
      item.tahun_ajaran === selectedTahun
    );
  };

  const findRaport = (santriId: string, kelasId = selectedKelasId) => {
    return raportList.find(item =>
      item.santri_id === santriId &&
      item.kelas_id === kelasId &&
      item.semester === selectedSemester &&
      item.tahun_ajaran === selectedTahun
    );
  };

  const isPublished = (santriId: string) => findRaport(santriId)?.status === 'published';

  const saveKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKelasNama.trim()) return;
    const next: KelasRaport = {
      id: createId(),
      nama_kelas: newKelasNama.trim(),
      tahun_ajaran: newKelasTahun.trim() || defaultTahunAjaran,
      wali_kelas_id: newKelasWaliId || undefined
    };
    dbLocal.setRaportKelas([...kelasList, next]);
    setKelasList(prev => [...prev, next]);
    setNewKelasNama('');
    showNotice('Kelas raport berhasil ditambahkan.');
  };

  const saveMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapelNama.trim()) return;
    const next: MataPelajaran = {
      id: createId(),
      nama_pelajaran: newMapelNama.trim(),
      kategori: newMapelKategori
    };
    dbLocal.setMataPelajaran([...mapelList, next]);
    setMapelList(prev => [...prev, next]);
    setNewMapelNama('');
    showNotice('Mata pelajaran berhasil ditambahkan.');
  };

  const assignSantri = () => {
    if (!selectedKelasId || !selectedSantriId) return;
    const exists = kelasSantriList.some(item =>
      item.kelas_id === selectedKelasId &&
      item.santri_id === selectedSantriId &&
      item.semester === selectedSemester &&
      item.tahun_ajaran === selectedTahun
    );
    if (exists) {
      showNotice('Santri sudah masuk kelas/semester ini.');
      return;
    }
    const next: KelasSantri = {
      id: createId(),
      kelas_id: selectedKelasId,
      santri_id: selectedSantriId,
      semester: selectedSemester,
      tahun_ajaran: selectedTahun
    };
    dbLocal.setKelasSantri([...kelasSantriList, next]);
    setKelasSantriList(prev => [...prev, next]);
    showNotice('Santri berhasil dimasukkan ke kelas.');
  };

  const assignMapel = () => {
    if (!selectedKelasId || !selectedMapelId) return;
    const exists = kelasMapelList.some(item => item.kelas_id === selectedKelasId && item.mapel_id === selectedMapelId);
    if (exists) {
      showNotice('Mapel sudah terdaftar di kelas ini.');
      return;
    }
    const next: KelasMapel = {
      id: createId(),
      kelas_id: selectedKelasId,
      mapel_id: selectedMapelId,
      guru_id: selectedGuruId || undefined
    };
    dbLocal.setKelasMapel([...kelasMapelList, next]);
    setKelasMapelList(prev => [...prev, next]);
    showNotice('Mapel dan guru pengampu berhasil ditautkan.');
  };

  const saveNilai = (santriId: string, kelasMapelId: string, patch: Partial<NilaiSantri>) => {
    if (isPublished(santriId)) {
      showNotice('Nilai terkunci karena raport sudah dipublish.');
      return;
    }
    const existing = findNilai(santriId, kelasMapelId);
    const updated: NilaiSantri = {
      id: existing?.id || createId(),
      santri_id: santriId,
      kelas_mapel_id: kelasMapelId,
      semester: selectedSemester,
      tahun_ajaran: selectedTahun,
      nilai_harian: existing?.nilai_harian ?? 0,
      nilai_uas: existing?.nilai_uas ?? 0,
      catatan_guru: existing?.catatan_guru || '',
      ...patch
    };
    updated.nilai_akhir = hitungNilaiAkhir(updated.nilai_harian, updated.nilai_uas);
    const next = existing
      ? nilaiList.map(item => item.id === existing.id ? updated : item)
      : [...nilaiList, updated];
    dbLocal.setNilaiSantri(next);
    setNilaiList(next);
  };

  const publishRaport = (santriId: string, catatan = catatanWali) => {
    if (!selectedKelasId) return;
    const kelas = kelasList.find(item => item.id === selectedKelasId);
    const canPublish = isAdmin || (isGuru && kelas?.wali_kelas_id === user?.id);
    if (!canPublish) {
      showNotice('Hanya admin atau wali kelas yang bisa publish raport.');
      return;
    }
    const existing = findRaport(santriId);
    const nextRaport: Raport = {
      id: existing?.id || createId(),
      santri_id: santriId,
      kelas_id: selectedKelasId,
      semester: selectedSemester,
      tahun_ajaran: selectedTahun,
      catatan_wali_kelas: catatan,
      status: 'published',
      published_at: new Date().toISOString()
    };
    const next = existing
      ? raportList.map(item => item.id === existing.id ? nextRaport : item)
      : [...raportList, nextRaport];
    dbLocal.setRaport(next);
    setRaportList(next);
    showNotice('Raport berhasil dipublish dan bisa dilihat wali santri.');
  };

  const buildRows = (santriId: string, kelasId = selectedKelasId) => {
    return kelasMapelList
      .filter(km => km.kelas_id === kelasId)
      .map(km => {
        const mapel = mapelList.find(item => item.id === km.mapel_id);
        const nilai = nilaiList.find(item =>
          item.santri_id === santriId &&
          item.kelas_mapel_id === km.id &&
          item.semester === selectedSemester &&
          item.tahun_ajaran === selectedTahun
        );
        const akhir = nilai?.nilai_akhir ?? hitungNilaiAkhir(nilai?.nilai_harian, nilai?.nilai_uas);
        return {
          mapel: mapel?.nama_pelajaran || 'Mata Pelajaran',
          harian: Number(nilai?.nilai_harian || 0),
          uas: Number(nilai?.nilai_uas || 0),
          akhir,
          predikat: getRaportPredikat(akhir)
        };
      });
  };

  const downloadPdf = async (raport: Raport) => {
    const santri = santriList.find(item => item.id === raport.santri_id);
    const kelas = kelasList.find(item => item.id === raport.kelas_id);
    await downloadRaportPDF({
      santriNama: santri?.nama || 'Santri',
      kelasNama: kelas?.nama_kelas || '-',
      semester: raport.semester,
      tahunAjaran: raport.tahun_ajaran,
      catatan: raport.catatan_wali_kelas,
      rows: buildRows(raport.santri_id, raport.kelas_id)
    });
  };

  const removeById = <T extends { id: string },>(rows: T[], id: string): T[] => rows.filter(item => item.id !== id);

  const controlBar = !isWali && (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      <select value={selectedKelasId} onChange={(e) => setSelectedKelasId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
        <option value="">Pilih kelas</option>
        {allowedKelas.map(kelas => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas} - {kelas.tahun_ajaran}</option>)}
      </select>
      <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value as SemesterRaport)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
        <option value="ganjil">Semester Ganjil</option>
        <option value="genap">Semester Genap</option>
      </select>
      <input value={selectedTahun} onChange={(e) => setSelectedTahun(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" placeholder="Tahun ajaran" />
    </div>
  );

  const renderKelas = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <form onSubmit={saveKelas} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 h-max">
        <h3 className="font-black text-sm text-slate-800">Tambah Kelas</h3>
        <input value={newKelasNama} onChange={(e) => setNewKelasNama(e.target.value)} placeholder="Nama kelas" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
        <input value={newKelasTahun} onChange={(e) => setNewKelasTahun(e.target.value)} placeholder="Tahun ajaran" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
        <select value={newKelasWaliId} onChange={(e) => setNewKelasWaliId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
          <option value="">Pilih wali kelas</option>
          {teacherProfiles.map(profile => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}
        </select>
        <button className="w-full bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Simpan Kelas</button>
      </form>
      <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {kelasList.map(kelas => (
          <div key={kelas.id} className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-slate-800">{kelas.nama_kelas}</p>
              <p className="text-xs text-slate-400">{kelas.tahun_ajaran} - Wali: {profilesList.find(p => p.id === kelas.wali_kelas_id)?.full_name || '-'}</p>
            </div>
            <button onClick={() => { const next = removeById<KelasRaport>(kelasList, kelas.id); dbLocal.setRaportKelas(next); setKelasList(next); }} className="p-2 bg-red-50 text-red-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMapel = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <form onSubmit={saveMapel} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 h-max">
        <h3 className="font-black text-sm text-slate-800">Tambah Mata Pelajaran</h3>
        <input value={newMapelNama} onChange={(e) => setNewMapelNama(e.target.value)} placeholder="Nama mata pelajaran" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
        <select value={newMapelKategori} onChange={(e) => setNewMapelKategori(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
          <option value="diniyah">Diniyah</option>
          <option value="umum">Umum</option>
        </select>
        <button className="w-full bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Simpan Mapel</button>
      </form>
      <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        {mapelList.map(mapel => (
          <div key={mapel.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-black text-slate-800">{mapel.nama_pelajaran}</p>
              <p className="text-xs text-slate-400 capitalize">{mapel.kategori}</p>
            </div>
            <button onClick={() => { const next = removeById<MataPelajaran>(mapelList, mapel.id); dbLocal.setMataPelajaran(next); setMapelList(next); }} className="p-2 bg-red-50 text-red-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-5">
      {controlBar}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-sm text-slate-800">Assign Santri ke Kelas</h3>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <select value={selectedSantriId} onChange={(e) => setSelectedSantriId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
              <option value="">Pilih santri</option>
              {santriList.map(santri => <option key={santri.id} value={santri.id}>{santri.nama} - {santri.kelas}</option>)}
            </select>
            <button onClick={assignSantri} className="bg-emerald-600 text-white rounded-xl px-4 py-2 text-xs font-black">Tambah</button>
          </div>
          <div className="space-y-2">
            {classStudents.map(santri => (
              <div key={santri.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-xs">
                <span className="font-bold text-slate-700">{santri.nama}</span>
                <button onClick={() => { const next = kelasSantriList.filter(item => !(item.santri_id === santri.id && item.kelas_id === selectedKelasId && item.semester === selectedSemester && item.tahun_ajaran === selectedTahun)); dbLocal.setKelasSantri(next); setKelasSantriList(next); }} className="text-red-600 font-black">Hapus</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-sm text-slate-800">Assign Mapel + Guru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={selectedMapelId} onChange={(e) => setSelectedMapelId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
              <option value="">Pilih mapel</option>
              {mapelList.map(mapel => <option key={mapel.id} value={mapel.id}>{mapel.nama_pelajaran}</option>)}
            </select>
            <select value={selectedGuruId} onChange={(e) => setSelectedGuruId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
              <option value="">Guru pengampu</option>
              {teacherProfiles.map(profile => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}
            </select>
            <button onClick={assignMapel} className="bg-emerald-600 text-white rounded-xl px-4 py-2 text-xs font-black">Tambah</button>
          </div>
          <div className="space-y-2">
            {classMapelsAll.map(km => (
              <div key={km.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-xs">
                <span className="font-bold text-slate-700">{mapelList.find(m => m.id === km.mapel_id)?.nama_pelajaran} - {profilesList.find(p => p.id === km.guru_id)?.full_name || 'Belum ada guru'}</span>
                <button onClick={() => { const next = removeById<KelasMapel>(kelasMapelList, km.id); dbLocal.setKelasMapel(next); setKelasMapelList(next); }} className="text-red-600 font-black">Hapus</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNilai = () => (
    <div className="space-y-5">
      {controlBar}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Santri</th>
              <th className="px-4 py-3 text-left">Mapel</th>
              <th className="px-4 py-3">Harian</th>
              <th className="px-4 py-3">UAS</th>
              <th className="px-4 py-3">Akhir</th>
              <th className="px-4 py-3">Predikat</th>
              <th className="px-4 py-3 text-left">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.flatMap(santri => classMapels.map(km => {
              const nilai = findNilai(santri.id, km.id);
              const akhir = nilai?.nilai_akhir ?? hitungNilaiAkhir(nilai?.nilai_harian, nilai?.nilai_uas);
              const locked = isPublished(santri.id);
              return (
                <tr key={`${santri.id}-${km.id}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-black text-slate-800">{santri.nama}</td>
                  <td className="px-4 py-3 font-bold text-slate-600">{mapelList.find(m => m.id === km.mapel_id)?.nama_pelajaran}</td>
                  <td className="px-4 py-3"><input disabled={locked} type="number" min={0} max={100} value={nilai?.nilai_harian ?? ''} onChange={(e) => saveNilai(santri.id, km.id, { nilai_harian: Number(e.target.value) })} className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold disabled:bg-slate-100" /></td>
                  <td className="px-4 py-3"><input disabled={locked} type="number" min={0} max={100} value={nilai?.nilai_uas ?? ''} onChange={(e) => saveNilai(santri.id, km.id, { nilai_uas: Number(e.target.value) })} className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold disabled:bg-slate-100" /></td>
                  <td className="px-4 py-3 text-center font-black text-emerald-700">{akhir.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center font-black">{getRaportPredikat(akhir)}</td>
                  <td className="px-4 py-3"><input disabled={locked} value={nilai?.catatan_guru || ''} onChange={(e) => saveNilai(santri.id, km.id, { catatan_guru: e.target.value })} className="w-48 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold disabled:bg-slate-100" placeholder={locked ? 'Terkunci' : 'Catatan guru'} /></td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinalisasi = () => (
    <div className="space-y-5">
      {controlBar}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-black text-sm text-slate-800 mb-4">Review & Publish Raport</h3>
        <div className="space-y-3">
          {classStudents.map(santri => {
            const rows = buildRows(santri.id);
            const avg = rows.length ? rows.reduce((sum, row) => sum + row.akhir, 0) / rows.length : 0;
            const raport = findRaport(santri.id);
            const canPublish = isAdmin || (isGuru && selectedKelas?.wali_kelas_id === user?.id);
            const currentCatatan = selectedSantriId === santri.id ? catatanWali : raport?.catatan_wali_kelas || '';
            return (
              <div key={santri.id} className="border border-slate-200 rounded-2xl p-4 grid grid-cols-1 lg:grid-cols-[1fr_2fr_auto] gap-4 items-center">
                <div>
                  <p className="font-black text-slate-800">{santri.nama}</p>
                  <p className="text-xs text-slate-400">Rata-rata {avg.toFixed(2)} - {raport?.status || 'draft'}</p>
                </div>
                <textarea value={currentCatatan} onFocus={() => setSelectedSantriId(santri.id)} onChange={(e) => { setSelectedSantriId(santri.id); setCatatanWali(e.target.value); }} rows={2} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold resize-none" placeholder="Catatan wali kelas" />
                <div className="flex gap-2">
                  <button disabled={!canPublish || raport?.status === 'published'} onClick={() => { setSelectedSantriId(santri.id); publishRaport(santri.id, currentCatatan); }} className="px-4 py-2 bg-emerald-600 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-black">Publish</button>
                  {raport?.status === 'published' && <button onClick={() => downloadPdf(raport)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl"><Download className="w-4 h-4" /></button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderWali = () => {
    const publishedRaports = raportList.filter(item =>
      item.status === 'published' &&
      selectedWaliSantri.some(santri => santri.id === item.santri_id)
    );

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {publishedRaports.map(raport => {
            const santri = santriList.find(item => item.id === raport.santri_id);
            const kelas = kelasList.find(item => item.id === raport.kelas_id);
            const rows = buildRows(raport.santri_id, raport.kelas_id);
            const avg = rows.length ? rows.reduce((sum, row) => sum + row.akhir, 0) / rows.length : 0;
            return (
              <div key={raport.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-[10px] text-emerald-600 font-black uppercase">Raport Published</p>
                  <h3 className="font-black text-slate-800">{santri?.nama}</h3>
                  <p className="text-xs text-slate-400">{kelas?.nama_kelas} - {raport.semester} - {raport.tahun_ajaran}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-xs">
                  <div className="flex justify-between font-black"><span>Rata-rata</span><span>{avg.toFixed(2)}</span></div>
                  <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                    {rows.map(row => <div key={row.mapel} className="flex justify-between text-slate-500"><span>{row.mapel}</span><span className="font-bold">{row.akhir.toFixed(2)} / {row.predikat}</span></div>)}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{raport.catatan_wali_kelas || 'Belum ada catatan wali kelas.'}</p>
                <button onClick={() => downloadPdf(raport)} className="w-full bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-black flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download PDF</button>
              </div>
            );
          })}
        </div>
        {publishedRaports.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-black text-slate-700">Belum ada raport published</p>
            <p className="text-xs text-slate-400 mt-1">Raport akan tampil di sini setelah wali kelas/admin melakukan publish.</p>
          </div>
        )}
      </div>
    );
  };

  const tabs: Array<{ id: RaportSubTab; label: string; icon: any }> = isWali
    ? [{ id: 'wali' as RaportSubTab, label: 'Raport Santri', icon: FileText }]
    : [
        ...(isAdmin ? [{ id: 'kelas' as RaportSubTab, label: 'Kelas', icon: GraduationCap }, { id: 'mapel' as RaportSubTab, label: 'Mapel', icon: BookOpen }, { id: 'setup' as RaportSubTab, label: 'Setup Kelas', icon: Users }] : []),
        { id: 'nilai' as RaportSubTab, label: 'Input Nilai', icon: Save },
        { id: 'finalisasi' as RaportSubTab, label: 'Finalisasi', icon: CheckCircle2 }
      ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-emerald-600 font-black uppercase tracking-widest">Akademik Pesantren</p>
          <h2 className="text-2xl font-black text-slate-900">Raport Santri</h2>
          <p className="text-xs text-slate-400 mt-1">Kelola kelas, mata pelajaran, nilai, finalisasi, dan PDF raport.</p>
        </div>
        {notice && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black">{notice}</div>}
      </div>

      <div className="bg-slate-200/60 rounded-2xl p-1 flex flex-wrap gap-1 w-max max-w-full">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${activeSubTab === tab.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === 'kelas' && renderKelas()}
      {activeSubTab === 'mapel' && renderMapel()}
      {activeSubTab === 'setup' && renderSetup()}
      {activeSubTab === 'nilai' && renderNilai()}
      {activeSubTab === 'finalisasi' && renderFinalisasi()}
      {activeSubTab === 'wali' && renderWali()}
    </div>
  );
}

export default RaportPanel;
