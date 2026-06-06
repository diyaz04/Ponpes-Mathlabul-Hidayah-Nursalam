import React from 'react';
import { Printer, Calendar, DollarSign, User, Check, Award } from 'lucide-react';
import { Tagihan, Pembayaran, Santri, Profile } from '../../types';
import { dbLocal } from '../../lib/supabase';

interface BuktiPembayaranProps {
  tagihan: Tagihan;
  pembayaran?: Pembayaran;
  santri?: Santri;
  wali?: Profile;
  onClose: () => void;
}

export function BuktiPembayaran({ tagihan, pembayaran, santri, wali, onClose }: BuktiPembayaranProps) {
  const transactionId = pembayaran?.order_id || `SPP-${santri?.id || 's'}-${tagihan.bulan}-${tagihan.tahun}-${Math.floor(Date.now() / 1000)}`;
  const payMethod = pembayaran?.metode || 'QRIS Midtrans';
  const payDate = pembayaran?.paid_at 
    ? new Date(pembayaran.paid_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const nominalBayar = pembayaran ? pembayaran.nominal : tagihan.nominal;
  const isPartial = pembayaran && tagihan ? pembayaran.nominal < (tagihan.nominal + pembayaran.nominal) * 0.99 : false; // quick check or default helper

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const getJenisName = (jenisId: string) => {
    return dbLocal.getJenisPembayaran().find(j => j.id === jenisId)?.nama || tagihan.jenis_nama || 'SPP Syahriyah Pesantren';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        
        {/* Header toolbar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-150 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bukti Pembayaran Digital</span>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Bukti (PDF)
            </button>
            <button 
              onClick={onClose}
              className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="section-to-print" className="p-8 space-y-6 flex-1 text-gray-800 bg-white relative overflow-hidden font-sans">
          
          {/* Stempel DIGITAL LUNAS - absolute overlay */}
          <div className="absolute top-10 right-10 border-4 border-dashed border-green-600 rounded-full w-28 h-28 flex flex-col items-center justify-center text-green-600 rotate-12 opacity-85 select-none print:opacity-100">
            <div className="text-center font-black uppercase text-[9px] tracking-widest leading-none">PONDOK PESANTREN</div>
            <div className="text-lg font-black tracking-widest leading-tight">LUNAS</div>
            <div className="text-[9px] font-bold text-green-600 leading-none">{payDate.split(',')[0]}</div>
            <Check className="w-5 h-5 mt-0.5" />
          </div>

          {/* School Brand Header */}
          <div className="flex items-center gap-4 pb-5 border-b border-gray-200">
            <div className="w-14 h-14 bg-gradient-to-tr from-green-600 to-emerald-700 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md rotate-3 select-none">
              M
            </div>
            <div>
              <h2 className="text-md font-extrabold text-gray-900 tracking-wide uppercase leading-tight">YAYASAN MATHLABUL HIDAYAH NURSALAM</h2>
              <p className="text-[9px] font-black uppercase tracking-widest text-green-700">Pendidikan Tarbiyah Qur'ani Modern & Salafiyah</p>
              <p className="text-[10px] text-gray-450 leading-none mt-1">Jl. Raya KH. Nursalam No. 45, Cadangpinggan, Indramayu, Jawa Barat</p>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[9px]">Nomor Transaksi (Order ID):</span>
              <span className="font-mono font-bold text-gray-850 break-all">{transactionId}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[9px]">Tanggal Settle:</span>
              <span className="font-bold text-gray-800">{payDate}</span>
            </div>
          </div>

          {/* Student & Parent Info card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold">Nama Santri:</span>
              <span className="font-bold text-gray-900">{santri?.nama || 'Ahmad Zidni Mubarok'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold">NIS / Kelas:</span>
              <span className="font-mono text-gray-800">{santri?.nis || '202109012'} ({santri?.kelas || 'IX'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold">Wali Penanggung Jawab:</span>
              <span className="font-bold text-gray-800">{wali?.full_name || 'Bpk. Kurniawan Prasetyan'}</span>
            </div>
          </div>

          {/* Fee Item Details Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Rincian Pembayaran</h4>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-450 font-bold uppercase text-[9px]">
                  <th className="py-2">Item Pembayaran</th>
                  <th className="py-2 text-center">Bulan / Periode</th>
                  <th className="py-2 text-right">Nominal Settle</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">
                    <div>{getJenisName(tagihan.jenis_id)}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-450">Metode: {payMethod}</span>
                      {isPartial && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-extrabold text-[8px] tracking-wider uppercase rounded">Cicilan Sebagian</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-center text-gray-800">{tagihan.bulan} {tagihan.tahun}</td>
                  <td className="py-3 text-right text-gray-950 font-bold font-mono">{formatRupiah(nominalBayar)}</td>
                </tr>
                {/* Total Billing */}
                <tr>
                  <td colSpan={2} className="py-3 font-bold text-gray-800 text-right">Total Transaksi Settle:</td>
                  <td className="py-3 text-right font-black font-mono text-green-700 text-sm border-t border-gray-200">{formatRupiah(nominalBayar)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* QR code simulation & Footer verify details */}
          <div className="flex gap-4 items-center justify-between pt-4 border-t border-gray-100 mt-2">
            <div className="flex items-center gap-3">
              {/* Simulated QR Code SVG directly */}
              <div className="w-16 h-16 border border-slate-200 p-1.5 rounded-xl bg-white select-none">
                <svg viewBox="0 0 100 100" className="w-full h-full text-gray-900">
                  {/* Outer Frame */}
                  <path d="M0,0 h30 v10 h-20 v20 h-10 z" fill="currentColor" />
                  <path d="M100,0 h-30 v10 h-20 v20 h10 z" fill="currentColor" transform="rotate(90 50 50)" />
                  <path d="M0,100 h30 v-10 h-20 v-20 h-10 z" fill="currentColor" transform="rotate(-90 50 50)" />
                  <path d="M100,100 h-30 v-10 h-20 v-20 h10 z" fill="currentColor" transform="rotate(180 50 50)" />
                  {/* Inner random pixels */}
                  <rect x="20" y="20" width="10" height="10" fill="currentColor" />
                  <rect x="40" y="20" width="15" height="10" fill="currentColor" />
                  <rect x="20" y="40" width="10" height="15" fill="currentColor" />
                  <rect x="60" y="20" width="15" height="15" fill="currentColor" />
                  <rect x="60" y="60" width="20" height="20" fill="currentColor" />
                  <rect x="35" y="55" width="15" height="10" fill="currentColor" />
                  <rect x="25" y="75" width="20" height="10" fill="currentColor" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-450 leading-relaxed font-medium">
                Pindai kode QR untuk memverifikasi keabsahan lembar kwitansi digital ini di sistem server administrasi Nursalam.
              </p>
            </div>
            
            {/* Printed signature mock */}
            <div className="text-right">
              <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">BENDAHARA KEUANGAN</span>
              <div className="h-7 w-24 bg-no-repeat bg-contain inline-block my-1 opacity-70">
                <span className="text-xs font-serif italic text-green-700 pr-5">Hadi Nursalam</span>
              </div>
              <span className="text-[10px] text-gray-700 block font-bold leading-none">H. Hadi Nursalam, S.E.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
