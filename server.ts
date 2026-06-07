import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();

// ✅ FIX 1: PORT harus dari env var — Render.com inject PORT otomatis
const PORT = Number(process.env.PORT) || 3000;

const getSupabaseAdmin = () => {
    const supabaseUrl =
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
        return null;
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
};

const requireSupabaseAdmin = () => {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
        throw new Error(
            'SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi di server',
        );
    }
    return supabaseAdmin;
};

const verifyAdminRequest = async (req: express.Request) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : '';

    if (!token) {
        const error = new Error('Token admin tidak ditemukan');
        (error as any).statusCode = 401;
        throw error;
    }

    const supabaseAdmin = requireSupabaseAdmin();
    const { data: userData, error: userError } =
        await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
        const error = new Error('Token admin tidak valid');
        (error as any).statusCode = 401;
        throw error;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('user_id', userData.user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        const error = new Error('Hanya admin yang boleh menjalankan aksi ini');
        (error as any).statusCode = 403;
        throw error;
    }

    return { supabaseAdmin, authUser: userData.user, profile };
};

const settleSupabasePayment = async (
    orderId: string,
    method: string,
    status: 'lunas' | 'pending' | 'gagal',
) => {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY atau SUPABASE_URL belum dikonfigurasi untuk webhook Midtrans',
        );
    }

    const { data: payment, error: findPaymentError } = await supabaseAdmin
        .from('pembayaran')
        .select('id, tagihan_id, nominal, status')
        .eq('order_id', orderId)
        .single();

    if (findPaymentError || !payment) {
        throw new Error(
            `Pembayaran dengan order_id ${orderId} tidak ditemukan`,
        );
    }

    if (payment.status === 'lunas' && status === 'lunas') {
        return { paymentId: payment.id, alreadySettled: true };
    }

    const paymentUpdate: Record<string, string> = {
        status,
        metode: method,
        updated_at: new Date().toISOString(),
    };

    if (status === 'lunas') {
        paymentUpdate.paid_at = new Date().toISOString();
    }

    const { error: paymentUpdateError } = await supabaseAdmin
        .from('pembayaran')
        .update(paymentUpdate)
        .eq('id', payment.id);

    if (paymentUpdateError) {
        throw paymentUpdateError;
    }

    if (status === 'gagal') {
        return { paymentId: payment.id, tagihanUpdated: false };
    }

    if (status === 'lunas') {
        const { data: bill, error: findBillError } = await supabaseAdmin
            .from('tagihan')
            .select('id, nominal')
            .eq('id', payment.tagihan_id)
            .single();

        if (findBillError || !bill) {
            throw new Error(`Tagihan ${payment.tagihan_id} tidak ditemukan`);
        }

        const paidAmount = Number(payment.nominal);
        const billAmount = Number(bill.nominal);
        const remaining = Math.max(billAmount - paidAmount, 0);

        const { error: billUpdateError } = await supabaseAdmin
            .from('tagihan')
            .update({
                nominal: remaining > 0 ? remaining : billAmount,
                status: remaining > 0 ? 'pending' : 'lunas',
            })
            .eq('id', bill.id);

        if (billUpdateError) {
            throw billUpdateError;
        }
    }

    return { paymentId: payment.id, alreadySettled: false };
};

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. BACKEND API ENDPOINTS
// ==========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Mathlabul Hidayah Nursalam API is running smoothly!',
        port: PORT,
        env: process.env.NODE_ENV || 'development',
    });
});

app.post('/api/admin/wali/create-with-santri-auth', async (req, res) => {
    let createdAuthUserId = '';

    try {
        const { supabaseAdmin } = await verifyAdminRequest(req);
        const { wali, santri } = req.body || {};

        if (!wali?.full_name || !wali?.email || !wali?.password) {
            return res
                .status(400)
                .json({ error: 'Nama, email, dan password wali wajib diisi.' });
        }

        if (
            !santri?.nis ||
            !santri?.nama ||
            !santri?.kelas ||
            !santri?.jenis_kelamin ||
            !santri?.tanggal_lahir ||
            !santri?.tahun_masuk
        ) {
            return res
                .status(400)
                .json({ error: 'Data santri belum lengkap.' });
        }

        const normalizedEmail = String(wali.email).trim().toLowerCase();

        console.log(`[Admin Wali Create] create user auth: ${normalizedEmail}`);
        const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
                email: normalizedEmail,
                password: String(wali.password),
                email_confirm: true,
                user_metadata: {
                    role: 'user',
                    full_name: wali.full_name,
                    phone: wali.phone || '',
                },
            });

        if (authError || !authData.user) {
            return res.status(409).json({
                error: authError?.message || 'Gagal membuat user Auth wali.',
            });
        }

        createdAuthUserId = authData.user.id;

        console.log(
            `[Admin Wali Create] load profile from trigger: ${createdAuthUserId}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 250));

        const { data: triggeredProfile, error: triggeredProfileError } =
            await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('user_id', createdAuthUserId)
                .maybeSingle();

        if (triggeredProfileError) {
            throw triggeredProfileError;
        }

        let profile = triggeredProfile;

        if (!profile) {
            console.log(
                `[Admin Wali Create] fallback upsert profile: ${createdAuthUserId}`,
            );
            const { data: upsertedProfile, error: upsertProfileError } =
                await supabaseAdmin
                    .from('profiles')
                    .upsert(
                        {
                            user_id: createdAuthUserId,
                            role: 'user',
                            full_name: wali.full_name,
                            phone: wali.phone || null,
                            email: normalizedEmail,
                            avatar_url: wali.avatar_url || null,
                            is_active: true,
                        },
                        { onConflict: 'user_id' },
                    )
                    .select('*')
                    .single();

            if (upsertProfileError || !upsertedProfile) {
                throw (
                    upsertProfileError ||
                    new Error('Gagal membuat profile wali.')
                );
            }

            profile = upsertedProfile;
        }

        console.log(
            `[Admin Wali Create] insert santri for profile: ${profile.id}`,
        );
        const { data: newSantri, error: santriError } = await supabaseAdmin
            .from('santri')
            .insert({
                nis: santri.nis,
                nama: santri.nama,
                kelas: santri.kelas,
                kamar: santri.kamar || null,
                jenis_kelamin: santri.jenis_kelamin,
                tanggal_lahir: santri.tanggal_lahir,
                alamat: santri.alamat || null,
                wali_id: profile.id,
                foto_url: santri.foto_url || null,
                status: santri.status || 'aktif',
                tahun_masuk: santri.tahun_masuk,
                bulan_masuk: santri.bulan_masuk || null,
            })
            .select('*')
            .single();

        if (santriError || !newSantri) {
            throw santriError || new Error('Gagal membuat data santri.');
        }

        return res.json({
            success: true,
            profile,
            santri: newSantri,
            auth_user_id: createdAuthUserId,
        });
    } catch (error: any) {
        const statusCode = Number(error.statusCode || error.status || 500);

        if (createdAuthUserId) {
            try {
                await requireSupabaseAdmin().auth.admin.deleteUser(
                    createdAuthUserId,
                );
            } catch (cleanupError) {
                console.error('[Supabase Cleanup Failure]', cleanupError);
            }
        }

        console.error('[Create Wali + Santri Error]', error);
        return res
            .status(statusCode)
            .json({ error: error.message || 'Gagal membuat wali dan santri.' });
    }
});

// Create Payment endpoint
app.post('/api/payment/create', async (req, res) => {
    try {
        const { santriId, santriName, tagihanId, amount, bulan, tahun } =
            req.body || {};

        if (!santriId || !tagihanId || !amount || !bulan || !tahun) {
            return res.status(400).json({
                error: 'Missing required billing parameters',
                received: {
                    santriId,
                    santriName,
                    tagihanId,
                    amount,
                    bulan,
                    tahun,
                },
            });
        }

        const numericAmount = Number(String(amount).replace(/[^\d]/g, ''));

        if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                error: 'Nominal pembayaran tidak valid',
                amount,
                numericAmount,
            });
        }

        const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

        if (
            !serverKey ||
            serverKey.trim() === '' ||
            serverKey === 'MY_MIDTRANS_SERVER_KEY'
        ) {
            return res.status(500).json({
                error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi. Isi .env dengan Server Key Midtrans sandbox/production.',
            });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const randomSuffix = Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase();

        const orderId = `SPP-${timestamp}-${randomSuffix}`;
        const customerEmail = 'test@example.com';

        const baseUrl = isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

        const payload = {
            transaction_details: {
                order_id: orderId,
                gross_amount: numericAmount,
            },
            customer_details: {
                first_name: santriName || 'Wali Santri',
                email: customerEmail,
            },
        };

        console.log('================ MIDTRANS REQUEST ================');
        console.log(
            '[Midtrans] Mode:',
            isProduction ? 'PRODUCTION' : 'SANDBOX',
        );
        console.log('[Midtrans] URL:', baseUrl);
        console.log('[Midtrans] Order ID:', orderId);
        console.log('[Midtrans] Amount:', numericAmount);
        console.log('[Midtrans] Payload:', JSON.stringify(payload, null, 2));
        console.log('==================================================');

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        console.log('================ MIDTRANS RESPONSE ===============');
        console.log('[Midtrans] HTTP Status:', response.status);
        console.log('[Midtrans] Body:', responseText);
        console.log('==================================================');

        let midtransBody: any = null;

        try {
            midtransBody = responseText ? JSON.parse(responseText) : null;
        } catch {
            midtransBody = responseText;
        }

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Midtrans API responded with status ${response.status}`,
                midtrans: midtransBody,
                request: {
                    order_id: orderId,
                    gross_amount: numericAmount,
                    customer_email: customerEmail,
                },
            });
        }

        return res.json({
            success: true,
            orderId,
            token: midtransBody?.token,
            redirect_url: midtransBody?.redirect_url,
            msg: 'Midtrans payment link created successfully.',
        });
    } catch (error: any) {
        console.error('[Create Payment Error]', error);

        return res.status(500).json({
            error: error.message || 'Failed to create payment',
        });
    }
});

// Create any account (admin/guru/user) — pakai admin SDK agar langsung aktif tanpa verifikasi email
app.post('/api/admin/account/create', async (req, res) => {
    try {
        const { supabaseAdmin } = await verifyAdminRequest(req);
        const { full_name, email, phone, password, role } = req.body || {};

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
        }

        const validRoles = ['admin', 'guru', 'user'];
        const finalRole = validRoles.includes(role) ? role : 'user';
        const normalizedEmail = String(email).trim().toLowerCase();

        console.log(`[Admin Account Create] Creating ${finalRole}: ${normalizedEmail}`);

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            password: String(password),
            email_confirm: true,
            user_metadata: {
                role: finalRole,
                full_name,
                phone: phone || ''
            }
        });

        if (authError || !authData.user) {
            return res.status(409).json({
                error: authError?.message || 'Gagal membuat akun pengguna.'
            });
        }

        const authUserId = authData.user.id;
        await new Promise(resolve => setTimeout(resolve, 250));

        // Upsert profile — trigger supabase mungkin sudah buat, tapi pastikan role benar
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                user_id: authUserId,
                role: finalRole,
                full_name,
                phone: phone || null,
                email: normalizedEmail,
                is_active: true
            }, { onConflict: 'user_id' })
            .select('*')
            .single();

        if (profileError) {
            console.warn('[Admin Account Create] Profile upsert warning:', profileError.message);
        }

        console.log(`[Admin Account Create] Success: ${normalizedEmail} (${finalRole})`);
        return res.json({ success: true, profile, auth_user_id: authUserId });
    } catch (error: any) {
        const statusCode = Number(error.statusCode || error.status || 500);
        console.error('[Admin Account Create Error]', error);
        return res.status(statusCode).json({ error: error.message || 'Gagal membuat akun.' });
    }
});

// ✅ FIX 2: Webhook diubah jadi async handler yang proper
// Bug lama: handler sync tapi pakai .then()/.catch() — bisa bikin race condition
// dan response kadang ga kekirim sebelum Midtrans timeout
app.post('/api/payment/webhook', async (req, res) => {
    try {
        const {
            order_id,
            status_code,
            transaction_status,
            gross_amount,
            payment_type,
            signature_key,
        } = req.body;

        const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

        if (!serverKey) {
            console.error('[Midtrans Webhook] MIDTRANS_SERVER_KEY tidak ada!');
            return res.status(500).json({
                error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi untuk verifikasi webhook',
            });
        }

        // ✅ FIX 3: gross_amount dari Midtrans dikirim sebagai string (misal "150000.00")
        // Signature harus pakai nilai string PERSIS seperti yang dikirim Midtrans
        // tanpa dikonversi ke number terlebih dulu
        const expectedSignature = crypto
            .createHash('sha512')
            .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
            .digest('hex');

        if (!signature_key || signature_key !== expectedSignature) {
            console.warn(
                `[Midtrans Webhook Rejected] Invalid signature for order ${order_id}`,
            );
            console.warn(`[Midtrans Webhook] Expected: ${expectedSignature}`);
            console.warn(`[Midtrans Webhook] Received: ${signature_key}`);
            console.warn(`[Midtrans Webhook] Components: order_id=${order_id}, status_code=${status_code}, gross_amount=${gross_amount}`);
            return res
                .status(401)
                .json({ error: 'Invalid Midtrans signature_key' });
        }

        console.log(
            `[Midtrans Webhook OK] Order: ${order_id} | Status: ${transaction_status} | Type: ${payment_type} | Amount: ${gross_amount}`,
        );

        const paymentMethod = payment_type || 'Midtrans';

        if (['capture', 'settlement'].includes(transaction_status)) {
            const result = await settleSupabasePayment(order_id, paymentMethod, 'lunas');
            return res.status(200).json({ status: 'success', received: true, ...result });
        }

        if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
            const result = await settleSupabasePayment(order_id, paymentMethod, 'gagal');
            return res.status(200).json({ status: 'success', received: true, ...result });
        }

        if (transaction_status === 'pending') {
            const result = await settleSupabasePayment(order_id, paymentMethod, 'pending');
            return res.status(200).json({ status: 'success', received: true, ...result });
        }

        return res.status(200).json({ status: 'ignored', received: true, transaction_status });
    } catch (error: any) {
        console.error('[Midtrans Webhook Error]', error);
        return res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. VITE MIDDLEWARE & FRONTEND INTEGRATION
// ==========================================

async function setupFrontend() {
    if (process.env.NODE_ENV !== 'production') {
        // Vite Dev Server middleware
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        // Serve static files in production build
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        // ✅ FIX 4: Wildcard route harus SETELAH semua API routes
        // Pastikan ga ada API route yang ketimpa oleh catch-all ini
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Server] running on http://0.0.0.0:${PORT}`);
        console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        console.log(`[Server] Midtrans mode: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'PRODUCTION' : 'SANDBOX'}`);

        // Reset password wali + return password baru (untuk cetak ulang PDF biodata)
app.post('/api/admin/account/reset-password', async (req, res) => {
    try {
        const { supabaseAdmin } = await verifyAdminRequest(req);
        const { user_id, new_password } = req.body || {};

        if (!user_id) {
            return res.status(400).json({ error: 'user_id wajib diisi.' });
        }

        // Generate password baru jika tidak disuplai
        const finalPassword = new_password || Math.random().toString(36).slice(2, 8).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
            password: String(finalPassword)
        });

        if (error || !data.user) {
            return res.status(500).json({ error: error?.message || 'Gagal reset password.' });
        }

        console.log(`[Reset Password] user_id=${user_id} password baru di-set`);
        return res.json({ success: true, new_password: finalPassword, user_id });
    } catch (error: any) {
        const statusCode = Number(error.statusCode || error.status || 500);
        console.error('[Reset Password Error]', error);
        return res.status(statusCode).json({ error: error.message || 'Gagal reset password.' });
    }
});

        // KeepAlive: self-ping setiap 10 menit supaya Render free tier tidak sleep
        const APP_URL = process.env.APP_URL || `https://ponpes-mathlabul-hidayah-nursalam.onrender.com`;
        if (process.env.NODE_ENV === 'production') {
            setInterval(async () => {
                try {
                    const res = await fetch(`${APP_URL}/api/health`);
                    console.log(`[KeepAlive] Ping OK — ${new Date().toISOString()}`);
                } catch (err: any) {
                    console.warn(`[KeepAlive] Ping gagal: ${err.message}`);
                }
            }, 10 * 60 * 1000);
            console.log(`[KeepAlive] Self-ping aktif setiap 10 menit ke ${APP_URL}/api/health`);
        }
    });
}

setupFrontend();
