export type UserRole = 'admin' | 'guru' | 'user';

export interface Profile {
  id: string;
  user_id?: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  password?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Santri {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  kamar?: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  alamat?: string;
  wali_id?: string; // profile id
  foto_url?: string;
  status: 'aktif' | 'alumni' | 'keluar';
  tahun_masuk: string;
  bulan_masuk?: string; // bulan masuk (e.g., 'Januari', ...)
  created_at?: string;
}

export interface JenisPelanggaran {
  id: string;
  nama: string;
  deskripsi?: string;
  poin_default: number;
  kategori: 'ringan' | 'sedang' | 'berat';
  is_active: boolean;
}

export interface Pelanggaran {
  id: string;
  santri_id: string;
  guru_id: string;
  jenis_id: string;
  tanggal: string;
  deskripsi: string;
  poin: number;
  status: 'aktif' | 'ditindaklanjuti';
  catatan_tindak_lanjut?: string;
  created_at?: string;
  // Joined fields
  santri_nama?: string;
  guru_nama?: string;
  jenis_nama?: string;
}

export interface KategoriHapalan {
  id: string;
  nama: string;
  deskripsi?: string;
  is_active: boolean;
  created_at?: string;
}

export type SemesterRaport = 'ganjil' | 'genap';
export type KategoriMapel = 'diniyah' | 'umum';
export type StatusRaport = 'draft' | 'published';

export interface KelasRaport {
  id: string;
  nama_kelas: string;
  tahun_ajaran: string;
  wali_kelas_id?: string;
  created_at?: string;
}

export interface MataPelajaran {
  id: string;
  nama_pelajaran: string;
  kategori: KategoriMapel;
  created_at?: string;
}

export interface KelasSantri {
  id: string;
  kelas_id: string;
  santri_id: string;
  semester: SemesterRaport;
  tahun_ajaran: string;
}

export interface KelasMapel {
  id: string;
  kelas_id: string;
  mapel_id: string;
  guru_id?: string;
}

export interface NilaiSantri {
  id: string;
  santri_id: string;
  kelas_mapel_id: string;
  semester: SemesterRaport;
  tahun_ajaran: string;
  nilai_harian?: number | null;
  nilai_uas?: number | null;
  nilai_akhir?: number | null;
  catatan_guru?: string;
}

export interface Raport {
  id: string;
  santri_id: string;
  kelas_id: string;
  semester: SemesterRaport;
  tahun_ajaran: string;
  catatan_wali_kelas?: string;
  status: StatusRaport;
  published_at?: string;
}

export interface SetoranHapalan {
  id: string;
  santri_id: string;
  guru_id: string;
  tanggal: string;
  jenis: 'ziyadah' | 'murajaah';
  surah_nama: string;
  surah_nomor: number;
  ayat_dari: number;
  ayat_sampai: number;
  jumlah_halaman: number;
  nilai: 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbul';
  catatan?: string;
  created_at?: string;
  kategori_id?: string; // category of memorization (e.g. 'kat-quran', 'kat-jurumiyah', etc.)
  // Joined fields
  santri_nama?: string;
  guru_nama?: string;
}

export interface ProgressHapalan {
  id: string;
  santri_id: string;
  total_juz: number;
  total_halaman: number;
  last_surah?: string;
  updated_at?: string;
}

export interface ProfilPesantren {
  id: string;
  nama: string;
  tagline?: string;
  deskripsi?: string;
  sejarah?: string;
  visi?: string;
  misi?: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  foto_url?: string;
  updated_at?: string;

  // Customizable hero settings
  hero_bg_color?: string;
  hero_img_url?: string;
  hero_img_opacity?: number;
  hero_type?: 'statis' | 'dinamis';

  // Customizable sections content
  stats_santri_val?: string;
  stats_santri_lbl?: string;
  stats_halaqah_val?: string;
  stats_halaqah_lbl?: string;
  stats_spp_val?: string;
  stats_spp_lbl?: string;
  stats_satisfaction_val?: string;
  stats_satisfaction_lbl?: string;

  sejarah_sub?: string;
  sejarah_title?: string;

  // JSON stringified fields for items
  routines_json?: string;
  facilities_json?: string;
  testimonials_json?: string;
}

export interface Program {
  id: string;
  nama: string;
  deskripsi: string;
  icon: string;
  urutan: number;
  is_active: boolean;
}

export interface Berita {
  id: string;
  judul: string;
  slug: string;
  konten: string;
  thumbnail_url?: string;
  penulis: string;
  tanggal_publish: string;
  is_published: boolean;
  created_at?: string;
}

export interface PSB {
  id: string;
  tahun_ajaran: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  kuota: number;
  syarat: string;
  alur_pendaftaran: string;
  biaya: number;
  is_open: boolean;
  created_at?: string;
}

export interface JenisPembayaran {
  id: string;
  nama: string;
  deskripsi?: string;
  is_active: boolean;
}

export interface NominalPembayaran {
  id: string;
  jenis_id: string;
  kelas: string;
  nominal: number;
  tahun_ajaran: string;
}

export interface Tagihan {
  id: string;
  santri_id: string;
  jenis_id: string;
  bulan: string;
  tahun: string;
  nominal: number;
  status: 'pending' | 'lunas' | 'gagal';
  created_at?: string;
  // Joined fields
  santri_nama?: string;
  jenis_nama?: string;
}

export interface Pembayaran {
  id: string;
  tagihan_id: string;
  order_id: string;
  snap_token?: string;
  metode?: string;
  nominal: number;
  status: string;
  paid_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notifikasi {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  tipe: 'pelanggaran' | 'hapalan' | 'tagihan' | 'pembayaran' | 'pengumuman';
  ref_id?: string;
  is_read: boolean;
  created_at?: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  pesan: string;
  target: 'semua' | 'kelas' | 'santri';
  target_value?: string;
  created_by?: string;
  created_at?: string;
}
