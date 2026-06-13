import { createClient } from '@supabase/supabase-js';
import {
  Berita,
  JenisPelanggaran,
  JenisPembayaran,
  KategoriHapalan,
  Notifikasi,
  KelasMapel,
  KelasRaport,
  KelasSantri,
  MataPelajaran,
  NilaiSantri,
  Pembayaran,
  Pelanggaran,
  Pengumuman,
  Profile,
  ProfilPesantren,
  Program,
  ProgressHapalan,
  PSB,
  PSBPendaftar,
  Raport,
  Santri,
  SetoranHapalan,
  Tagihan
} from '../types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isRealSupabaseConfigured) {
  console.warn('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum dikonfigurasi.');
}

export const supabase = createClient(supabaseUrl || 'https://missing.supabase.co', supabaseAnonKey || 'missing-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export function requireSupabase() {
  if (!isRealSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const authUser = sessionData.session?.user;
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .single<Profile>();

  if (error) throw error;
  return data;
}

export async function fetchTable<T>(table: string, select = '*'): Promise<T[]> {
  const { data, error } = await supabase.from(table).select(select);
  if (error) throw error;
  return (data || []) as T[];
}

export const db = {
  profiles: () => fetchTable<Profile>('profiles'),
  santri: () => fetchTable<Santri>('santri'),
  jenisPelanggaran: () => fetchTable<JenisPelanggaran>('jenis_pelanggaran'),
  pelanggaran: () => fetchTable<Pelanggaran>('pelanggaran'),
  setoranHapalan: () => fetchTable<SetoranHapalan>('setoran_hapalan'),
  progressHapalan: () => fetchTable<ProgressHapalan>('progress_hapalan'),
  kategoriHapalan: () => fetchTable<KategoriHapalan>('kategori_hapalan'),
  profilPesantren: async () => {
    const { data, error } = await supabase
      .from('profil_pesantren')
      .select('*')
      .limit(1)
      .maybeSingle<ProfilPesantren>();
    if (error) throw error;
    return data;
  },
  programs: () => fetchTable<Program>('program'),
  berita: () => fetchTable<Berita>('berita'),
  psb: async () => {
    const { data, error } = await supabase
      .from('psb')
      .select('*')
      .limit(1)
      .maybeSingle<PSB>();
    if (error) throw error;
    return data;
  },
  psbPendaftar: () => fetchTable<PSBPendaftar>('psb_pendaftar'),
  jenisPembayaran: () => fetchTable<JenisPembayaran>('jenis_pembayaran'),
  nominalPembayaran: () => fetchTable('nominal_pembayaran'),
  tagihan: () => fetchTable<Tagihan>('tagihan'),
  pembayaran: () => fetchTable<Pembayaran>('pembayaran'),
  notifikasi: () => fetchTable<Notifikasi>('notifikasi'),
  pengumuman: () => fetchTable<Pengumuman>('pengumuman'),
  raportKelas: () => fetchTable<KelasRaport>('kelas'),
  mataPelajaran: () => fetchTable<MataPelajaran>('mata_pelajaran'),
  kelasSantri: () => fetchTable<KelasSantri>('kelas_santri'),
  kelasMapel: () => fetchTable<KelasMapel>('kelas_mapel'),
  nilaiSantri: () => fetchTable<NilaiSantri>('nilai_santri'),
  raport: () => fetchTable<Raport>('raport')
};

export async function insertNotification(notif: Omit<Notifikasi, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('notifikasi')
    .insert(notif)
    .select('*')
    .single<Notifikasi>();
  if (error) throw error;
  return data;
}

type SupabaseCache = {
  profiles: Profile[];
  santri: Santri[];
  jenis_pelanggaran: JenisPelanggaran[];
  pelanggaran: Pelanggaran[];
  setoran_hapalan: SetoranHapalan[];
  progress_hapalan: ProgressHapalan[];
  kategori_hapalan: KategoriHapalan[];
  profil_pesantren: ProfilPesantren | null;
  program: Program[];
  berita: Berita[];
  psb: PSB | null;
  psb_pendaftar: PSBPendaftar[];
  jenis_pembayaran: any[];
  nominal_pembayaran: any[];
  tagihan: Tagihan[];
  pembayaran: Pembayaran[];
  notifikasi: Notifikasi[];
  pengumuman: Pengumuman[];
  kelas: KelasRaport[];
  mata_pelajaran: MataPelajaran[];
  kelas_santri: KelasSantri[];
  kelas_mapel: KelasMapel[];
  nilai_santri: NilaiSantri[];
  raport: Raport[];
};

const cache: SupabaseCache = {
  profiles: [],
  santri: [],
  jenis_pelanggaran: [],
  pelanggaran: [],
  setoran_hapalan: [],
  progress_hapalan: [],
  kategori_hapalan: [],
  profil_pesantren: null,
  program: [],
  berita: [],
  psb: null,
  psb_pendaftar: [],
  jenis_pembayaran: [],
  nominal_pembayaran: [],
  tagihan: [],
  pembayaran: [],
  notifikasi: [],
  pengumuman: [],
  kelas: [],
  mata_pelajaran: [],
  kelas_santri: [],
  kelas_mapel: [],
  nilai_santri: [],
  raport: []
};

export async function refreshSupabaseCache() {
  const [
    profiles,
    santri,
    jenisPelanggaran,
    pelanggaran,
    setoranHapalan,
    progressHapalan,
    kategoriHapalan,
    profilPesantren,
    program,
    berita,
    psb,
    psbPendaftar,
    jenisPembayaran,
    nominalPembayaran,
    tagihan,
    pembayaran,
    notifikasi,
    pengumuman,
    raportKelas,
    mataPelajaran,
    kelasSantri,
    kelasMapel,
    nilaiSantri,
    raport
  ] = await Promise.all([
    db.profiles().catch(() => []),
    db.santri().catch(() => []),
    db.jenisPelanggaran().catch(() => []),
    db.pelanggaran().catch(() => []),
    db.setoranHapalan().catch(() => []),
    db.progressHapalan().catch(() => []),
    db.kategoriHapalan().catch(() => []),
    db.profilPesantren().catch(() => null),
    db.programs().catch(() => []),
    db.berita().catch(() => []),
    db.psb().catch(() => null),
    db.psbPendaftar().catch(() => []),
    db.jenisPembayaran().catch(() => []),
    db.nominalPembayaran().catch(() => []),
    db.tagihan().catch(() => []),
    db.pembayaran().catch(() => []),
    db.notifikasi().catch(() => []),
    db.pengumuman().catch(() => []),
    db.raportKelas().catch(() => []),
    db.mataPelajaran().catch(() => []),
    db.kelasSantri().catch(() => []),
    db.kelasMapel().catch(() => []),
    db.nilaiSantri().catch(() => []),
    db.raport().catch(() => [])
  ]);

  cache.profiles = profiles;
  cache.santri = santri;
  cache.jenis_pelanggaran = jenisPelanggaran;
  cache.pelanggaran = pelanggaran;
  cache.setoran_hapalan = setoranHapalan;
  cache.progress_hapalan = progressHapalan;
  cache.kategori_hapalan = kategoriHapalan;
  cache.profil_pesantren = profilPesantren;
  cache.program = program;
  cache.berita = berita;
  cache.psb = psb;
  cache.psb_pendaftar = psbPendaftar;
  cache.jenis_pembayaran = jenisPembayaran;
  cache.nominal_pembayaran = nominalPembayaran;
  cache.tagihan = tagihan;
  cache.pembayaran = pembayaran;
  cache.notifikasi = notifikasi;
  cache.pengumuman = pengumuman;
  cache.kelas = raportKelas;
  cache.mata_pelajaran = mataPelajaran;
  cache.kelas_santri = kelasSantri;
  cache.kelas_mapel = kelasMapel;
  cache.nilai_santri = nilaiSantri;
  cache.raport = raport;
}

const upsertMany = async (table: string, rows: any[]) => {
  const { error } = await supabase.from(table).upsert(rows);
  if (error) console.error(`[Supabase ${table} upsert failure]`, error);
  await refreshSupabaseCache().catch(() => undefined);
};

const replaceTable = async (table: string, rows: any[]) => {
  const ids = rows.map((row) => row.id).filter(Boolean);
  if (ids.length > 0) {
    const { error: deleteError } = await supabase.from(table).delete().not('id', 'in', `(${ids.join(',')})`);
    if (deleteError) console.error(`[Supabase ${table} replace delete failure]`, deleteError);
  }
  await upsertMany(table, rows);
};

const createLocalUuid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
};

export const dbLocal = {
  getProfiles: () => cache.profiles,
  setProfiles: (v: Profile[]) => { cache.profiles = v; upsertMany('profiles', v); },
  getSantri: () => cache.santri,
  setSantri: (v: Santri[]) => { cache.santri = v; upsertMany('santri', v); },
  getJenisPelanggaran: () => cache.jenis_pelanggaran,
  setJenisPelanggaran: (v: JenisPelanggaran[]) => { cache.jenis_pelanggaran = v; replaceTable('jenis_pelanggaran', v); },
  getPelanggaran: () => cache.pelanggaran,
  setPelanggaran: (v: Pelanggaran[]) => { cache.pelanggaran = v; replaceTable('pelanggaran', v); },
  getSetoranHapalan: () => cache.setoran_hapalan,
  setSetoranHapalan: (v: SetoranHapalan[]) => { cache.setoran_hapalan = v; replaceTable('setoran_hapalan', v); },
  getKategoriHapalan: () => cache.kategori_hapalan,
  setKategoriHapalan: (v: KategoriHapalan[]) => { cache.kategori_hapalan = v; upsertMany('kategori_hapalan', v); },
  getProgressHapalan: () => cache.progress_hapalan,
  setProgressHapalan: (v: ProgressHapalan[]) => { cache.progress_hapalan = v; upsertMany('progress_hapalan', v); },
  getProfilPesantren: () => cache.profil_pesantren,
  setProfilPesantren: (v: ProfilPesantren) => { cache.profil_pesantren = v; supabase.from('profil_pesantren').upsert(v).then(({ error }) => error && console.error(error)); },
  getPrograms: () => cache.program,
  setPrograms: (v: Program[]) => { cache.program = v; upsertMany('program', v); },
  getBerita: () => cache.berita,
  setBerita: (v: Berita[]) => { cache.berita = v; upsertMany('berita', v); },
  getPSB: () => cache.psb,
  setPSB: (v: PSB) => { cache.psb = v; supabase.from('psb').upsert(v).then(({ error }) => error && console.error(error)); },
  getPSBPendaftar: () => cache.psb_pendaftar,
  setPSBPendaftar: (v: PSBPendaftar[]) => { cache.psb_pendaftar = v; upsertMany('psb_pendaftar', v); },
  getJenisPembayaran: () => cache.jenis_pembayaran,
  setJenisPembayaran: (v: any[]) => { cache.jenis_pembayaran = v; upsertMany('jenis_pembayaran', v); },
  getNominalPembayaran: () => cache.nominal_pembayaran,
  setNominalPembayaran: (v: any[]) => { cache.nominal_pembayaran = v; upsertMany('nominal_pembayaran', v); },
  getTagihan: () => cache.tagihan,
  setTagihan: (v: Tagihan[]) => { cache.tagihan = v; replaceTable('tagihan', v); },
  getPembayaran: () => cache.pembayaran,
  setPembayaran: (v: Pembayaran[]) => { cache.pembayaran = v; upsertMany('pembayaran', v); },
  getNotifikasi: () => cache.notifikasi,
  setNotifikasi: (v: Notifikasi[]) => { cache.notifikasi = v; upsertMany('notifikasi', v); },
  getPengumuman: () => cache.pengumuman,
  setPengumuman: (v: Pengumuman[]) => { cache.pengumuman = v; upsertMany('pengumuman', v); },
  getRaportKelas: () => cache.kelas,
  setRaportKelas: (v: KelasRaport[]) => { cache.kelas = v; replaceTable('kelas', v); },
  getMataPelajaran: () => cache.mata_pelajaran,
  setMataPelajaran: (v: MataPelajaran[]) => { cache.mata_pelajaran = v; replaceTable('mata_pelajaran', v); },
  getKelasSantri: () => cache.kelas_santri,
  setKelasSantri: (v: KelasSantri[]) => { cache.kelas_santri = v; replaceTable('kelas_santri', v); },
  getKelasMapel: () => cache.kelas_mapel,
  setKelasMapel: (v: KelasMapel[]) => { cache.kelas_mapel = v; replaceTable('kelas_mapel', v); },
  getNilaiSantri: () => cache.nilai_santri,
  setNilaiSantri: (v: NilaiSantri[]) => {
    cache.nilai_santri = v.map(row => ({
      ...row,
      nilai_akhir: typeof row.nilai_akhir === 'number'
        ? row.nilai_akhir
        : Number((((row.nilai_harian || 0) * 0.6) + ((row.nilai_uas || 0) * 0.4)).toFixed(2))
    }));
    upsertMany('nilai_santri', v.map(({ nilai_akhir, ...row }) => row));
  },
  getRaport: () => cache.raport,
  setRaport: (v: Raport[]) => { cache.raport = v; upsertMany('raport', v); },
  insertKategoriHapalan: async (input: Omit<KategoriHapalan, 'id'>): Promise<KategoriHapalan> => {
    const { data, error } = await supabase
      .from('kategori_hapalan')
      .insert(input)
      .select('*')
      .single<KategoriHapalan>();
    if (error) throw error;
    await refreshSupabaseCache().catch(() => undefined);
    return data;
  },
  insertPelanggaran: async (input: Omit<Pelanggaran, 'id' | 'created_at'>): Promise<Pelanggaran> => {
    const { data, error } = await supabase
      .from('pelanggaran')
      .insert(input)
      .select('*')
      .single<Pelanggaran>();
    if (error) throw error;
    await refreshSupabaseCache().catch(() => undefined);
    return data;
  },
  insertSetoranHapalan: async (input: Omit<SetoranHapalan, 'id' | 'created_at'>): Promise<SetoranHapalan> => {
    const { data, error } = await supabase
      .from('setoran_hapalan')
      .insert(input)
      .select('*')
      .single<SetoranHapalan>();
    if (error) throw error;
    await refreshSupabaseCache().catch(() => undefined);
    return data;
  },
  insertTagihan: async (input: Omit<Tagihan, 'id' | 'created_at'>): Promise<Tagihan> => {
    const { data, error } = await supabase
      .from('tagihan')
      .insert(input)
      .select('*')
      .single<Tagihan>();
    if (error) throw error;
    await refreshSupabaseCache().catch(() => undefined);
    return data;
  },
  insertTagihanBatch: async (rows: Omit<Tagihan, 'id' | 'created_at'>[]): Promise<Tagihan[]> => {
    const { data, error } = await supabase
      .from('tagihan')
      .insert(rows)
      .select('*');
    if (error) throw error;
    await refreshSupabaseCache().catch(() => undefined);
    return (data || []) as Tagihan[];
  },
  insertPSBPendaftar: async (input: Omit<PSBPendaftar, 'id' | 'created_at'>): Promise<PSBPendaftar> => {
    const row = {
      id: createLocalUuid(),
      created_at: new Date().toISOString(),
      ...input
    } as PSBPendaftar;
    const { error } = await supabase
      .from('psb_pendaftar')
      .insert(row);
    if (error) throw error;
    await refreshSupabaseCache().catch(() => undefined);
    return row;
  },
  updatePSBPendaftar: async (id: string, input: Partial<PSBPendaftar>): Promise<PSBPendaftar> => {
    const { data, error } = await supabase
      .from('psb_pendaftar')
      .update(input)
      .eq('id', id)
      .select('*')
      .single<PSBPendaftar>();
    if (error) throw error;
    await refreshSupabaseCache().catch(() => undefined);
    return data;
  },
  deletePSBPendaftar: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('psb_pendaftar')
      .delete()
      .eq('id', id);
    if (error) throw error;
    cache.psb_pendaftar = cache.psb_pendaftar.filter((row) => row.id !== id);
    await refreshSupabaseCache().catch(() => undefined);
  },
  confirmPayment: (pembayaranId: string, method?: string) => {
    supabase
      .from('pembayaran')
      .update({ status: 'lunas', metode: method || 'Midtrans Settle', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', pembayaranId)
      .then(() => refreshSupabaseCache());
  },
  insertNotification
};

refreshSupabaseCache().catch((error) => {
  console.error('[Supabase Cache Initial Load Failure]', error);
});
