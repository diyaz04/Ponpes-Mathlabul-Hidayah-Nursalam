import React, { useState } from 'react';
import { CreditCard, Wallet, Smartphone, ShieldCheck, CheckCircle2, RotateCw } from 'lucide-react';
import { Tagihan } from '../../types';
import { usePayment } from '../../hooks/usePayment';

interface MidtransButtonProps {
  tagihan: Tagihan;
  studentName: string;
  parentEmail: string;
  onPaymentSuccess: () => void;
}

export function MidtransButton({ tagihan, studentName, parentEmail, onPaymentSuccess }: MidtransButtonProps) {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'nominal_selection' | 'methods' | 'qris' | 'va' | 'completing' | 'success'>('nominal_selection');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const { initiatePayment, simulateSettlement, loading } = usePayment();
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [currentPembId, setCurrentPembId] = useState<string>('');

  // Installments state controls
  const [payAmountType, setPayAmountType] = useState<'full' | 'cicil'>('full');
  const [customAmountText, setCustomAmountText] = useState(String(tagihan.nominal));
  const [activeNominal, setActiveNominal] = useState(tagihan.nominal);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  const handleOpenCheckout = () => {
    setPayAmountType('full');
    setCustomAmountText(String(tagihan.nominal));
    setActiveNominal(tagihan.nominal);
    setErrorInput(null);
    setPaymentStep('nominal_selection');
    setShowCheckoutModal(true);
  };

  const handleProceedToMethods = async () => {
    setErrorInput(null);
    let selectedAmount = tagihan.nominal;

    if (payAmountType === 'cicil') {
      const amt = Number(customAmountText);
      if (isNaN(amt) || amt < 50000) {
        setErrorInput('Nominal cicilan minimal adalah Rp 50.000');
        return;
      }
      if (amt >= tagihan.nominal) {
        setErrorInput(`Nominal cicilan tidak boleh menyamai atau melebihi sisa tagihan (Rp ${tagihan.nominal.toLocaleString('id-ID')}). Untuk membayar penuh, silakan pilih opsi 'Bayar Penuh'.`);
        return;
      }
      selectedAmount = amt;
    }

    setActiveNominal(selectedAmount);

    // Call initiate payment with customized installment amount
    const res = await initiatePayment(tagihan, parentEmail, studentName, selectedAmount);
    if (res && res.success && res.transaction) {
      setCurrentOrderId(res.transaction.order_id);
      setCurrentPembId(res.transaction.id);
      setPaymentStep('methods');
    } else {
      setErrorInput(res.error || 'Gagal menghubungi server pembayaran');
    }
  };

  const handleSelectQRIS = () => {
    setPaymentStep('qris');
  };

  const handleSelectVA = (bankName: string) => {
    setSelectedBank(bankName);
    setPaymentStep('va');
  };

  const executeSettle = (methodName: string) => {
    setPaymentStep('completing');
    setTimeout(() => {
      // Settle payment locally inside dbLocal triggers
      simulateSettlement(currentPembId, methodName);
      setPaymentStep('success');
      setTimeout(() => {
        setShowCheckoutModal(false);
        onPaymentSuccess();
      }, 1800);
    }, 1200);
  };

  return (
    <>
      <button
        onClick={handleOpenCheckout}
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

      {/* MIDTRANS SNAP POPUP SIMULATOR */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 select-none">
          <div className="bg-slate-50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Header Simulator */}
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-wider text-green-400">midtrans</span>
                <span className="text-xs text-white/70">Secure Payment Gateway</span>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-white/80 hover:text-white text-sm font-bold bg-white/10 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </div>

            {/* Merchant / Billing Summary */}
            <div className="bg-white px-6 py-4 border-b border-gray-150 flex justify-between items-center text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase text-[9px]">PONDOK PESANTREN</p>
                <h4 className="font-extrabold text-gray-800">MH Nursalam Keuangan</h4>
                <p className="text-gray-500 text-[10px] truncate max-w-[200px]">{studentName} ({tagihan.bulan})</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 font-bold uppercase text-[9px]">TOTAL YANG DIBAYAR</p>
                <h3 className="text-md font-extrabold text-green-700">Rp {activeNominal.toLocaleString('id-ID')}</h3>
              </div>
            </div>

            {/* View Steps */}
            <div className="p-6">
              
              {/* Step 0: Nominal Selection & Choice to Pay Installment / Cicilan */}
              {paymentStep === 'nominal_selection' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Tentukan Jumlah Pembayaran</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Orang tua santri dapat melakukan pembayaran iuran secara penuh (Pelunasan) atau memberikan cicilan (Nyicil) untuk dicatat sisa tunggakannya di asrama.
                  </p>
                  
                  <div className="space-y-3 font-sans">
                    {/* Full Payment Choice */}
                    <div 
                      onClick={() => {
                        setPayAmountType('full');
                        setCustomAmountText(String(tagihan.nominal));
                        setErrorInput(null);
                      }}
                      className={`p-4 bg-white rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        payAmountType === 'full' ? 'border-green-600 ring-1 ring-green-100 bg-green-50/10 scale-[1.01]' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio"
                          name="payAmountType"
                          checked={payAmountType === 'full'}
                          readOnly
                          className="text-green-600 focus:ring-green-600"
                        />
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-800">Bayar Penuh / Lunas</h5>
                          <p className="text-[10px] text-slate-400 font-medium">Lunasi seluruh tagihan iuran bulan ini</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-black text-green-700">Rp {tagihan.nominal.toLocaleString('id-ID')}</span>
                    </div>

                    {/* Installment Choice */}
                    <div 
                      onClick={() => {
                        if (payAmountType !== 'cicil') {
                          setPayAmountType('cicil');
                          setCustomAmountText(String(Math.min(tagihan.nominal / 2, 350000)));
                          setErrorInput(null);
                        }
                      }}
                      className={`p-4 bg-white rounded-xl border space-y-3 transition-all cursor-pointer ${
                        payAmountType === 'cicil' ? 'border-green-600 ring-1 ring-green-100 bg-green-50/10 scale-[1.01]' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio"
                            name="payAmountType"
                            checked={payAmountType === 'cicil'}
                            readOnly
                            className="text-green-600 focus:ring-green-600"
                          />
                          <div>
                            <h5 className="text-xs font-extrabold text-slate-800">Cicil Pembayaran (Nyicil)</h5>
                            <p className="text-[10px] text-slate-400 font-medium">Beri cicilan pembayaran kustom dari tagihan ini</p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded-full font-bold uppercase">Cicilan</span>
                      </div>

                      {payAmountType === 'cicil' && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 flex flex-col" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Nominal Cicilan Anda (Rupiah):</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                            <input 
                              type="number"
                              value={customAmountText}
                              onChange={(e) => {
                                setCustomAmountText(e.target.value);
                                setErrorInput(null);
                              }}
                              className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold font-mono text-zinc-800 focus:ring-1 focus:ring-green-500 outline-none"
                              placeholder="Cek nominal cicilan"
                            />
                          </div>
                          <p className="text-[9px] text-zinc-400 text-left leading-normal">Kekurangan pembayaran Anda otomatis ditambahkan sebagai sisa tunggakan.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {errorInput && (
                    <div className="p-3 bg-red-50 border border-red-150 text-[10.5px] text-red-700 rounded-xl leading-normal font-bold">
                      ⚠️ {errorInput}
                    </div>
                  )}

                  <button 
                    onClick={handleProceedToMethods}
                    disabled={loading}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 select-none uppercase tracking-wider font-sans"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" /> Menghubungkan Gateway...
                      </>
                    ) : (
                      'Pilih Cara Pembayaran'
                    )}
                  </button>
                </div>
              )}

              {/* Method Selection */}
              {paymentStep === 'methods' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pilih Metode Pembayaran</h4>
                  
                  {/* QRIS */}
                  <div 
                    onClick={handleSelectQRIS}
                    className="p-3 bg-white hover:bg-green-50/50 border border-slate-200 hover:border-green-500 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="text-left animate-fade-in">
                        <h5 className="text-xs font-bold text-gray-800">QRIS (GoPay, OVO, ShopeePay)</h5>
                        <p className="text-[10px] text-gray-400 font-medium">Scan QR Code instan langsung terverifikasi</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-700">PILIH</span>
                  </div>

                  {/* BANK VIRTUAL ACCOUNTS */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-450 uppercase tracking-widest text-left">Transfer Virtual Account (VA)</p>
                    
                    {['BCA', 'BNI', 'BRI', 'Mandiri'].map((bank) => (
                      <div 
                        key={bank}
                        onClick={() => handleSelectVA(bank)}
                        className="p-3 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-500 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-xs text-blue-800 border border-slate-200">
                            {bank}
                          </div>
                          <div className="text-left animate-fade-in">
                            <h5 className="text-xs font-bold text-gray-800">Virtual Account {bank}</h5>
                            <p className="text-[10px] text-gray-400 font-medium">ATM, Mobile Banking atau Internet Banking</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-700">PILIH</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => setPaymentStep('nominal_selection')}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Ubah Jumlah Bayar
                    </button>
                  </div>
                </div>
              )}

              {/* QRIS Scan Screen */}
              {paymentStep === 'qris' && (
                <div className="text-center space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">PINDAI QRIS BERIKUT</h4>
                  
                  {/* Generated QR Mock */}
                  <div className="w-48 h-48 mx-auto border-2 border-slate-200 p-2 bg-white rounded-2xl flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-[150px] h-[150px] text-slate-800">
                      <path d="M0,0 h20 v10 h-10 v10 h-10 z" />
                      <path d="M100,0 h-20 v10 h10 v10 h10 z" transform="rotate(90 50 50)" />
                      <path d="M0,100 h-20 v-10 h10 v-10 h10 z" transform="rotate(-90 50 50)" />
                      <rect x="20" y="20" width="10" height="10" />
                      <rect x="50" y="10" width="20" height="20" />
                      <rect x="20" y="60" width="20" height="20" />
                      <rect x="60" y="65" width="20" height="20" />
                      <circle cx="50" cy="50" r="10" fill="#16a34a" />
                      <text x="50" y="53" textAnchor="middle" fill="white" fontSize="9" fontWeight="900">QR</text>
                    </svg>
                  </div>

                  <p className="text-[10px] text-gray-400 font-medium">Gunakan GoPay, OVO, LinkAja, Dana, atau BCA Mobile Anda.</p>
                  
                  <div className="pt-3 border-t border-gray-150 flex gap-2">
                    <button 
                      onClick={() => setPaymentStep('methods')}
                      className="flex-1 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={() => executeSettle('QRIS GoPay')}
                      className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Konfirmasi Bayar Settle
                    </button>
                  </div>
                </div>
              )}

              {/* Virtual Account Screen */}
              {paymentStep === 'va' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest text-center">RINCIAN TRANSFER BANK</h4>
                  
                  {/* VA Number Details Card */}
                  <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">Bank Penerima:</span>
                      <span className="font-extrabold text-blue-900 uppercase">{selectedBank} Virtual Account</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs font-bold">Nomor VA:</span>
                      <span className="font-mono text-sm font-black text-slate-800 select-all tracking-wider">8877600{activeNominal / 1000}2299</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">Atas Nama Rekening:</span>
                      <span className="font-bold text-gray-800">MH Nursalam / {studentName}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-150 text-[10px] text-blue-700 rounded-xl leading-relaxed text-left font-medium">
                    <strong>Pemberitahuan:</strong> Pembayaran Anda akan otomatis divalidasi oleh sistem asuransi asrama dalam jangka maksimal 2 menit tanpa perlu membagikan kuitansi manual.
                  </div>

                  <div className="pt-3 border-t border-gray-150 flex gap-2">
                    <button 
                      onClick={() => setPaymentStep('methods')}
                      className="flex-1 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={() => executeSettle(`${selectedBank} VA`)}
                      className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Konfirmasi Transfer Selesai
                    </button>
                  </div>
                </div>
              )}

              {/* Loader Settle Step */}
              {paymentStep === 'completing' && (
                <div className="py-8 text-center space-y-3">
                  <RotateCw className="w-10 h-10 text-green-600 animate-spin mx-auto" />
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest">Memproses Settle Bank...</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Verifikasi secure digital signature key API dan mutasi kas bank.</p>
                </div>
              )}

              {/* Payment Success */}
              {paymentStep === 'success' && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-extrabold text-green-700 uppercase tracking-widest">TRANSAKSI METODE SETTLED</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Pembayaran sukses! Sistem asrama otomatis memperbaharui status kuitansi Anda dan mengurangi sisa tunggakan.</p>
                </div>
              )}

            </div>

            {/* Footer lock symbol */}
            <div className="bg-slate-100 px-6 py-3 text-center border-t border-slate-200 text-slate-400 text-[10px] flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Protected under 3-D Secure Standard Tokenizer</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
