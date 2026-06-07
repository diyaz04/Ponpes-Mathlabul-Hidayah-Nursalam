import { useState } from 'react';
import { isRealSupabaseConfigured, supabase } from '../lib/supabase';
import { Tagihan, Pembayaran } from '../types';

// Extend Window type for Midtrans Snap
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settleSupabasePayment = async (
    pembayaranId: string,
    tagihan: Tagihan,
    paidAmount: number,
    method: string,
    status: 'lunas' | 'pending' | 'gagal'
  ) => {
    if (!isRealSupabaseConfigured || !supabase) {
      throw new Error('Supabase belum dikonfigurasi. Pembayaran Midtrans wajib disimpan ke database Supabase.');
    }

    const paymentUpdate: Record<string, string> = {
      status,
      metode: method,
      updated_at: new Date().toISOString()
    };

    if (status === 'lunas') {
      paymentUpdate.paid_at = new Date().toISOString();
    }

    const { error: paymentError } = await supabase
      .from('pembayaran')
      .update(paymentUpdate)
      .eq('id', pembayaranId);

    if (paymentError) {
      throw paymentError;
    }

    if (status !== 'lunas') {
      return;
    }

    const remaining = Math.max(Number(tagihan.nominal) - Number(paidAmount), 0);
    const { error: billError } = await supabase
      .from('tagihan')
      .update({
        nominal: remaining > 0 ? remaining : tagihan.nominal,
        status: remaining > 0 ? 'pending' : 'lunas'
      })
      .eq('id', tagihan.id);

    if (billError) {
      throw billError;
    }
  };

  /**
   * Membuat transaksi ke server, lalu membuka Midtrans Snap popup asli.
   * onSettled dipanggil ketika pembayaran sukses/pending dari Midtrans.
   */
  const initiatePayment = async (
    tagihan: Tagihan,
    studentName: string,
    customAmount?: number,
    onSettled?: (pembayaranId: string, method: string, status: 'success' | 'pending') => void
  ) => {
    setLoading(true);
    setError(null);
    try {
      if (!isRealSupabaseConfigured || !supabase) {
        throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sebelum memakai Midtrans.');
      }

      const finalAmount = customAmount !== undefined ? customAmount : tagihan.nominal;

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santriId: tagihan.santri_id,
          santriName: studentName,
          tagihanId: tagihan.id,
          amount: finalAmount,
          bulan: tagihan.bulan,
          tahun: tagihan.tahun
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || 'Gagal menghubungi server pembayaran');
      }

      const result = await response.json();

      const orderId =
        result.orderId ||
        `SPP-${tagihan.santri_id}-${tagihan.bulan}-${tagihan.tahun}-${Math.floor(Date.now() / 1000)}`;

      const { data: pendingTrans, error: insertError } = await supabase
        .from('pembayaran')
        .insert({
          tagihan_id: tagihan.id,
          order_id: orderId,
          snap_token: result.token || '',
          metode: 'Waiting Select',
          nominal: finalAmount,
          status: 'pending'
        })
        .select('id, tagihan_id, order_id, snap_token, metode, nominal, status, paid_at, created_at, updated_at')
        .single<Pembayaran>();

      if (insertError || !pendingTrans) {
        throw insertError || new Error('Gagal menyimpan transaksi pending ke Supabase.');
      }

      setLoading(false);

      // ✅ Buka Midtrans Snap popup asli jika snap.js tersedia & token ada
      if (result.token && typeof window.snap !== 'undefined') {
        window.snap.pay(result.token, {
          onSuccess: async (snapResult: any) => {
            console.log('[Midtrans] Pembayaran berhasil:', snapResult);
            const method = snapResult.payment_type || snapResult.transaction_status || 'Midtrans';
            try {
              await settleSupabasePayment(pendingTrans.id, tagihan, finalAmount, method, 'lunas');
              onSettled?.(pendingTrans.id, method, 'success');
            } catch (settleError: any) {
              console.error('[Midtrans] Gagal update Supabase:', settleError);
              setError(settleError.message || 'Pembayaran berhasil, tetapi update database gagal.');
            }
          },
          onPending: async (snapResult: any) => {
            console.log('[Midtrans] Pembayaran pending:', snapResult);
            const method = snapResult.payment_type || 'Midtrans';
            try {
              await settleSupabasePayment(pendingTrans.id, tagihan, finalAmount, method, 'pending');
              onSettled?.(pendingTrans.id, method, 'pending');
            } catch (settleError: any) {
              console.error('[Midtrans] Gagal update pending Supabase:', settleError);
              setError(settleError.message || 'Status pending gagal disimpan ke database.');
            }
          },
          onError: (snapResult: any) => {
            console.error('[Midtrans] Pembayaran error:', snapResult);
            setError('Pembayaran gagal. Silakan coba lagi.');
          },
          onClose: () => {
            console.log('[Midtrans] Popup ditutup sebelum pembayaran selesai.');
          }
        });
      } else if (!result.token) {
        // Tidak ada token — mungkin env tidak dikonfigurasi
        console.warn('[Midtrans] Token tidak diterima dari server.');
        setError('Token pembayaran tidak valid. Periksa konfigurasi MIDTRANS_SERVER_KEY.');
      } else {
        // snap.js belum load
        console.warn('[Midtrans] window.snap belum tersedia. Pastikan Snap.js sudah dimuat di index.html');
        setError('Midtrans Snap.js belum dimuat. Coba refresh halaman.');
      }

      return {
        success: true,
        transaction: pendingTrans,
        redirectUrl: result.redirect_url
      };
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Unknown integration error');
      return { success: false, error: err.message };
    }
  };

  /**
   * Hanya untuk keperluan testing/demo internal tanpa Midtrans.
   * JANGAN dipakai di flow payment normal.
   */
  const simulateSettlement = (pembayaranId: string, paymentMethod: string) => {
    console.warn('[Midtrans] simulateSettlement dinonaktifkan. Gunakan callback/webhook Supabase.', pembayaranId, paymentMethod);
  };

  return {
    initiatePayment,
    simulateSettlement,
    loading,
    error
  };
}
