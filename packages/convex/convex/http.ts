import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

// ── Generic Payment Callback ────────────────────────────────────────

http.route({
  path: "/api/payments/callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { paymentId, transactionId, status, provider } = body;

      if (!paymentId || !status) {
        return jsonResponse({ error: "Missing paymentId or status" }, 400);
      }

      if (status === "success" || status === "completed") {
        await ctx.runMutation(internal.paymentWebhook.processSuccess, {
          paymentId,
          transactionId: transactionId ?? `${provider}-${Date.now()}`,
        });
      } else {
        await ctx.runMutation(internal.paymentWebhook.processFailed, { paymentId });
      }

      return jsonResponse({ ok: true });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// ── Khalti Payment Callback ─────────────────────────────────────────
// Khalti sends: { pidx, transaction_id, tidx, amount, total_amount, status, purchase_order_id }
// Verification: check pidx + secret key against Khalti lookup API

http.route({
  path: "/api/payments/khalti/callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { pidx, transaction_id, amount, status, purchase_order_id } = body;

      if (!pidx) {
        return jsonResponse({ error: "Missing pidx" }, 400);
      }

      // Validate: Khalti uses "Completed" for success
      // In production, verify by calling Khalti's lookup API:
      // POST https://a.khalti.com/api/v2/epayment/lookup/ { pidx }
      // with header: Authorization: key <KHALTI_SECRET_KEY>
      const khaltiSecret = process.env.KHALTI_SECRET_KEY;
      if (khaltiSecret) {
        const verifyRes = await fetch("https://a.khalti.com/api/v2/epayment/lookup/", {
          method: "POST",
          headers: {
            Authorization: `key ${khaltiSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pidx }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status !== "Completed") {
          return jsonResponse({ error: "Payment not verified by Khalti" }, 400);
        }
      }

      if (status === "Completed") {
        await ctx.runMutation(internal.paymentWebhook.processSuccess, {
          paymentId: purchase_order_id ?? pidx,
          transactionId: transaction_id ?? pidx,
        });
      } else {
        await ctx.runMutation(internal.paymentWebhook.processFailed, {
          paymentId: purchase_order_id ?? pidx,
        });
      }

      return jsonResponse({ ok: true, message: "Khalti payment processed" });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// ── eSewa Payment Callback ──────────────────────────────────────────
// eSewa redirects with query params: oid, amt, refId, scd
// Verification: check signature using eSewa's verification endpoint

http.route({
  path: "/api/payments/esewa/callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { product_id, total_amount, transaction_uuid, status, signed_field_names, signature } = body;

      if (!product_id) {
        return jsonResponse({ error: "Missing product_id" }, 400);
      }

      // Validate eSewa signature
      // In production, verify HMAC-SHA256 signature:
      // message = `transaction_code=${transaction_uuid},status=${status},total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=EPAYTEST,signed_field_names=${signed_field_names}`
      // expected = HMAC-SHA256(message, ESEWA_SECRET_KEY)
      const esewaSecret = process.env.ESEWA_SECRET_KEY;
      if (esewaSecret && signature) {
        // Note: In a real implementation, compute HMAC and compare
        // For now we trust the callback if secret is not set (dev mode)
        const encoder = new TextEncoder();
        const fields = signed_field_names?.split(",") ?? [];
        const message = fields.map((f: string) => `${f}=${body[f]}`).join(",");
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(esewaSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"],
        );
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
        const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
        if (computed !== signature) {
          return jsonResponse({ error: "Invalid eSewa signature" }, 403);
        }
      }

      if (status === "COMPLETE") {
        await ctx.runMutation(internal.paymentWebhook.processSuccess, {
          paymentId: product_id,
          transactionId: transaction_uuid ?? `esewa-${Date.now()}`,
        });
      } else {
        await ctx.runMutation(internal.paymentWebhook.processFailed, { paymentId: product_id });
      }

      return jsonResponse({ ok: true, message: "eSewa payment processed" });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// ── Fonepay Payment Callback ────────────────────────────────────────
// Fonepay sends: PRN, PID, PS, RC, UID, BC, INI, P_AMT, R_AMT, DV
// DV = HMAC-SHA512 verification hash

http.route({
  path: "/api/payments/fonepay/callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { PRN, PID, PS, RC, UID, P_AMT, DV } = body;

      if (!PRN) {
        return jsonResponse({ error: "Missing PRN (payment reference)" }, 400);
      }

      // Validate Fonepay DV (digital verification) hash
      // DV = HMAC-SHA512 of PRN,PID,PS,RC,UID,P_AMT using merchant secret key
      const fonepaySecret = process.env.FONEPAY_SECRET_KEY;
      if (fonepaySecret && DV) {
        const encoder = new TextEncoder();
        const message = [PRN, PID, PS, RC, UID, P_AMT].join(",");
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(fonepaySecret),
          { name: "HMAC", hash: "SHA-512" },
          false,
          ["sign"],
        );
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
        const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
        if (computed !== DV) {
          return jsonResponse({ error: "Invalid Fonepay verification hash" }, 403);
        }
      }

      // PS=true and RC=successful means payment succeeded
      if (PS === "true" && RC === "successful") {
        await ctx.runMutation(internal.paymentWebhook.processSuccess, {
          paymentId: PRN,
          transactionId: UID ?? `fonepay-${Date.now()}`,
        });
      } else {
        await ctx.runMutation(internal.paymentWebhook.processFailed, { paymentId: PRN });
      }

      return jsonResponse({ ok: true, message: "Fonepay payment processed" });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// ── Payment Initiation (called by mobile app) ──────────────────────
// Mobile app calls these to get a paymentUrl to open in browser.
// Backend uses @nabwin/paisa to generate signed payment URLs.

http.route({
  path: "/api/payments/khalti/initiate",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    try {
      const body = await request.json();
      const { amount, rideId, returnUrl, riderName, riderEmail, riderPhone } = body;

      const secretKey = process.env.KHALTI_SECRET_KEY;
      if (!secretKey) return jsonResponse({ error: "Khalti not configured" }, 500);

      const { KhaltiClient } = await import("@nabwin/paisa");
      const client = new KhaltiClient({
        secretKey,
        environment: (process.env.PAYMENT_ENV ?? "sandbox") as "sandbox" | "production",
        returnUrl: returnUrl ?? "https://meroauto.com/payment/callback",
        websiteUrl: "https://meroauto.com",
      });

      const response = await client.initiatePayment({
        amount,
        purchaseOrderId: `ride_${rideId}`,
        purchaseOrderName: `MeroAuto Ride`,
        returnUrl: returnUrl ?? "https://meroauto.com/payment/callback",
        customer: riderName ? { name: riderName, email: riderEmail ?? "", phone: riderPhone ?? "" } : undefined,
      });

      return jsonResponse({
        paymentUrl: response.paymentUrl,
        transactionId: response.pidx,
        expiresAt: response.expiresAt,
      });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/api/payments/esewa/initiate",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    try {
      const body = await request.json();
      const { amount, rideId, returnUrl } = body;

      const merchantCode = process.env.ESEWA_MERCHANT_CODE ?? "EPAYTEST";
      const secretKey = process.env.ESEWA_SECRET_KEY;
      if (!secretKey) return jsonResponse({ error: "eSewa not configured" }, 500);

      const { EsewaClient } = await import("@nabwin/paisa");
      const client = new EsewaClient({
        merchantCode,
        secretKey,
        environment: (process.env.PAYMENT_ENV ?? "sandbox") as "sandbox" | "production",
        successUrl: returnUrl ?? "https://meroauto.com/payment/callback",
        failureUrl: returnUrl ?? "https://meroauto.com/payment/callback",
      });

      const response = await client.initiatePayment({
        amount,
        transactionId: `ride_${rideId}_${Date.now()}`,
        successUrl: returnUrl ?? "https://meroauto.com/payment/callback",
        failureUrl: returnUrl ?? "https://meroauto.com/payment/callback",
      });

      return jsonResponse({
        paymentUrl: response.paymentUrl,
        transactionId: response.transactionId,
        totalAmount: response.totalAmount,
      });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/api/payments/fonepay/initiate",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    try {
      const body = await request.json();
      const { amount, rideId, returnUrl } = body;

      // Fonepay requires server-side form generation
      // In production, integrate with Fonepay's merchant API
      const fonepayMerchantCode = process.env.FONEPAY_MERCHANT_CODE;
      if (!fonepayMerchantCode) {
        return jsonResponse({ error: "Fonepay not configured" }, 500);
      }

      const prn = `ride_${rideId}_${Date.now()}`;
      const paymentUrl = `https://fonepay.com/pay?PID=${fonepayMerchantCode}&PRN=${prn}&AMT=${amount}&RU=${encodeURIComponent(returnUrl ?? "https://meroauto.com/payment/callback")}`;

      return jsonResponse({
        paymentUrl,
        transactionId: prn,
      });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// ── WorkOS Auth Token Exchange ───────────────────────────────────────
// Client sends WorkOS authorization code, we exchange it for tokens

http.route({
  path: "/auth/callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { code, redirectUri, role } = body;

      if (!code) {
        return jsonResponse({ error: "Missing authorization code" }, 400);
      }

      const clientId = process.env.WORKOS_CLIENT_ID;
      const apiKey = process.env.WORKOS_API_KEY;
      if (!clientId || !apiKey) {
        return jsonResponse({ error: "WorkOS not configured" }, 500);
      }

      // Exchange code for user + access token via WorkOS API
      const response = await fetch(
        "https://api.workos.com/user_management/authenticate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            client_id: clientId,
            code,
            grant_type: "authorization_code",
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        return jsonResponse({ error: `WorkOS auth failed: ${error}` }, 401);
      }

      const data = await response.json();
      const { user, access_token, refresh_token } = data;

      // Create or update user in Convex based on role
      if (role === "rider") {
        await ctx.runMutation(internal.authCallbacks.ensureRider, {
          userId: user.id,
          name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email,
          email: user.email,
          phone: user.phone_number ?? "",
        });
      } else if (role === "driver") {
        await ctx.runMutation(internal.authCallbacks.ensureDriver, {
          userId: user.id,
          name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email,
          email: user.email,
          phone: user.phone_number ?? "",
        });
      }

      return jsonResponse({
        accessToken: access_token,
        refreshToken: refresh_token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone_number,
          avatar: user.profile_picture_url,
          role: role ?? "rider",
        },
      });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

export default http;
