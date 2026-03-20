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

export default http;
