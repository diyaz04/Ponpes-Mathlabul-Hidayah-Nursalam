import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Tagihan } from '../../types';
import { usePayment } from '../../hooks/usePayment';

interface MidtransButtonProps {
  tagihan: Tagihan;
  studentName: string;
  onPaymentSuccess: () => void;
}

export function MidtransButton({ tagihan, studentName, onPaymentSuccess }: MidtransButtonProps) {
  const { initiatePayment, loading, error } = usePayment();

  // Installment state
  const [showNominalModal, setShowNominalModal] = useState(false);
  const [payAmountType, setPayAmountType] = useState<'full' | 'cicil'>('full');
  const [customAmountText, setCustomAmountText] = useState(String(tagihan.nominal));
  const [errorInput, setErrorInput] = useState<string | null>(null);

  const handleOpenModal = () => {
    setPayAmountType('full');
    setCustomAmountText(String(tagihan.nominal));
    setErrorInput(null);
    setShowNominalModal(true);
  };

  const handlePay = async () => {
    setErrorInput(null);
    let selectedAmount = tagihan.nominal;

    if (payAmountType === 'cicil') {
      const amt = Number(customAmountText);
      if (isNaN(amt) || amt < 50000) {
        setErrorInput('Nominal cicilan minimal adalah Rp 50.000');
        return;
      }
      if (amt >= tagihan.nominal) {
        setErrorInput(
          `Nominal cicilan tidak boleh menyamai atau melebihi sisa tagihan (Rp ${tagihan.nominal.toLocaleString('id-ID')}). Gunakan opsi 'Bayar Penuh' untuk melunasi.`
        );
        return;
      }
      selectedAmount = amt;
    }

    setShowNominalModal(false);

    // ✅ initiatePayment akan otomatis buka Snap popup Midtrans asli
    await initiatePayment(
      tagihan,
      studentName,
      selectedAmount,
      (_pembId, _method, status) => {
        if (status === 'success') {
          onPaymentSuccess();
        }
      }
    );
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={loading}
        className="mt-4 w-full py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
      >
        {loading ? (
          <>
            <RotateCw className="w-3.5 h-3.5 animate-spin" /> Menghubungkan Midtrans...
          </>
        ) : (
          'Bayar / Cicil'
        )}
      </button>

      {error && (
        <p className="mt-2 text-[10px] text-red-600 font-semibold text-center">⚠️ {error}</p>
      )}

      {/* Modal pilih nominal — Snap popup asli dari Midtrans yang handle method pembayaran */}
      {showNominalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 select-none">
          <div className="bg-slate-50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">

            {/* Header */}
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-wider text-green-400">midtrans</span>
                <span className="text-xs text-white/70">Secure Payment Gateway</span>
              </div>
              <button
                onClick={() => setShowNominalModal(false)}
                className="text-white/80 hover:text-white text-sm font-bold bg-white/10 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </div>

            {/* Billing Summary */}
            <div className="bg-white px-6 py-4 border-b border-gray-150 flex justify-between items-center text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase text-[9px]">PONDOK PESANTREN</p>
                <h4 className="font-extrabold text-gray-800">MH Nursalam Keuangan</h4>
                <p className="text-gray-500 text-[10px] truncate max-w-[200px]">{studentName} ({tagihan.bulan})</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 font-bold uppercase text-[9px]">TAGIHAN</p>
                <h3 className="text-md font-extrabold text-green-700">
                  Rp {tagihan.nominal.toLocaleString('id-ID')}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Tentukan Jumlah Pembayaran
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Pilih bayar penuh (lunas) atau cicil sebagian. Metode pembayaran (QRIS, VA, dll) akan muncul di halaman Midtrans.
              </p>

              {/* Full payment */}
              <div
                onClick={() => { setPayAmountType('full'); setErrorInput(null); }}
                className={`p-4 bg-white rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  payAmountType === 'full'
                    ? 'border-green-600 ring-1 ring-green-100 bg-green-50/10 scale-[1.01]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" readOnly checked={payAmountType === 'full'} className="text-green-600" />
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-800">Bayar Penuh / Lunas</h5>
                    <p className="text-[10px] text-slate-400 font-medium">Lunasi seluruh tagihan bulan ini</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-black text-green-700">
                  Rp {tagihan.nominal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Installment */}
              <div
                onClick={() => { if (payAmountType !== 'cicil') { setPayAmountType('cicil'); setErrorInput(null); } }}
                className={`p-4 bg-white rounded-xl border space-y-3 transition-all cursor-pointer ${
                  payAmountType === 'cicil'
                    ? 'border-green-600 ring-1 ring-green-100 bg-green-50/10 scale-[1.01]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="radio" readOnly checked={payAmountType === 'cicil'} className="text-green-600" />
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-800">Cicil Pembayaran</h5>
                      <p className="text-[10px] text-slate-400 font-medium">Bayar sebagian, sisa tercatat sebagai tunggakan</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded-full font-bold uppercase">
                    Cicilan
                  </span>
                </div>
                {payAmountType === 'cicil' && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Nominal Cicilan (Rupiah):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        value={customAmountText}
                        onChange={(e) => { setCustomAmountText(e.target.value); setErrorInput(null); }}
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold font-mono text-zinc-800 focus:ring-1 focus:ring-green-500 outline-none"
                        placeholder="Masukkan nominal cicilan"
                      />
                    </div>
                    <p className="text-[9px] text-zinc-400">Kekurangan otomatis dicatat sebagai sisa tunggakan.</p>
                  </div>
                )}
              </div>

              {errorInput && (
                <div className="p-3 bg-red-50 border border-red-150 text-[10.5px] text-red-700 rounded-xl leading-normal font-bold">
                  ⚠️ {errorInput}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 select-none uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" /> Menghubungkan Gateway...
                  </>
                ) : (
                  'Lanjut ke Pembayaran Midtrans →'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
