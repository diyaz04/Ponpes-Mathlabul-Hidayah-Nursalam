import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. BACKEND API ENDPOINTS
// ==========================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Mathlabul Hidayah Nursalam API is running smoothly!" });
});

// Create Payment endpoint (Express Server side)
app.post("/api/payment/create", async (req, res) => {
  try {
    const { santriId, santriName, tagihanId, amount, bulan, tahun, parentEmail } = req.body;

    if (!santriId || !tagihanId || !amount || !bulan || !tahun) {
      return res.status(400).json({ error: "Missing required billing parameters" });
    }

    // Generate a unique orderId
    const timestamp = Math.floor(Date.now() / 1000);
    const orderId = `SPP-${santriId}-${bulan}-${tahun}-${timestamp}`;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (serverKey && serverKey.trim() !== "" && serverKey !== "MY_MIDTRANS_SERVER_KEY") {
      // Real Midtrans Snap endpoint
      const baseUrl = isProduction 
        ? "https://app.midtrans.com/snap/v1/transactions"
        : "https://app.sandbox.midtrans.com/snap/v1/transactions";

      // Basic Authentication header (ServerKey encoded in base64)
      const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: Number(amount)
        },
        credit_card: {
          secure: true
        },
        customer_details: {
          first_name: santriName || "Wali Santri",
          email: parentEmail || "wali@parent.com"
        },
        item_details: [
          {
            id: tagihanId,
            price: Number(amount),
            quantity: 1,
            name: `Pembayaran SPP Bulan ${bulan} ${tahun}`
          }
        ]
      };

      console.log(`[Midtrans] Sending genuine payment request for order: ${orderId}...`);
      
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Midtrans Error] Failed to fetch token: ${errorText}`);
        throw new Error(`Midtrans API responded with status ${response.status}: ${errorText}`);
      }

      const snapResponse: any = await response.json();
      console.log(`[Midtrans Success] Token generated: ${snapResponse.token}`);

      return res.json({
        success: true,
        orderId,
        token: snapResponse.token,
        redirect_url: snapResponse.redirect_url,
        msg: "Genuine Midtrans payment link created successfully."
      });
    }

    // We generate a fallback sandbox simulation Token when MIDTRANS_SERVER_KEY is not defined!
    // This supports instant zero-friction sandbox testing inside our preview.
    console.log(`[Midtrans Mock] Key missing. Using seamless sandbox simulator for ${orderId}`);
    const mockSnapToken = `snap-token-${Math.random().toString(36).substring(2, 15)}`;
    const mockRedirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockSnapToken}`;

    res.json({
      success: true,
      orderId,
      token: mockSnapToken,
      redirect_url: mockRedirectUrl,
      msg: "Payment link created successfully (Sandbox Simulation)."
    });
  } catch (error: any) {
    console.error("[Create Payment Error]", error);
    res.status(500).json({ error: error.message || "Failed to create payment" });
  }
});

// Direct Webhook Receiver endpoint from Midtrans
app.post("/api/payment/webhook", (req, res) => {
  try {
    const { order_id, transaction_status, gross_amount, payment_type, signature_key } = req.body;
    
    // In production, verify the signature_key: 
    // SHA512(order_id + status_code + gross_amount + serverKey)
    console.log(`[Midtrans Webhook Received] Order ID: ${order_id}, Status: ${transaction_status}, Type: ${payment_type}, Amount: ${gross_amount}`);
    
    // We acknowledge receipt with status 200 OK so Midtrans stops retrying
    res.status(200).json({ status: "success", received: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. VITE MIDDLEWARE & FRONTEND INTEGRATION
// ==========================================

async function setupFrontend() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production build
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://0.0.0.0:${PORT}`);
  });
}

setupFrontend();
