import { useState } from 'react';
import { dbLocal } from '../lib/supabase';
import { Tagihan, Pembayaran } from '../types';

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generates or prepares a pending transaction
  const initiatePayment = async (tagihan: Tagihan, parentEmail: string, studentName: string, customAmount?: number) => {
    setLoading(true);
    setError(null);
    try {
      const finalAmount = customAmount !== undefined ? customAmount : tagihan.nominal;

      // POST to express payment route
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          santriId: tagihan.santri_id,
          santriName: studentName,
          tagihanId: tagihan.id,
          amount: finalAmount,
          bulan: tagihan.bulan,
          tahun: tagihan.tahun,
          parentEmail: parentEmail
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi server pembayaran');
      }

      const result = await response.json();
      
      // Save pending payment record locally to simulate Midtrans flow
      const orderId = result.orderId || `SPP-${tagihan.santri_id}-${tagihan.bulan}-${tagihan.tahun}-${Math.floor(Date.now() / 1000)}`;
      const pendingTrans: Pembayaran = {
        id: `pemb-${Date.now()}`,
        tagihan_id: tagihan.id,
        order_id: orderId,
        snap_token: result.token || 'mock-snap-token',
        metode: 'Waiting Select',
        nominal: finalAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const transactions = dbLocal.getPembayaran();
      dbLocal.setPembayaran([...transactions, pendingTrans]);

      setLoading(false);
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

  // Simulates Midtrans Checkout instant settlement for easier demoing in standard playground!
  const simulateSettlement = (pembayaranId: string, paymentMethod: string) => {
    dbLocal.confirmPayment(pembayaranId, paymentMethod);
  };

  return {
    initiatePayment,
    simulateSettlement,
    loading,
    error
  };
}
