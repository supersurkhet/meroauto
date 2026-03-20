import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Payment webhook callback for Khalti/eSewa/Fonepay.
 * Called by payment gateways after transaction completes.
 *
 * Expected POST body: { paymentId, transactionId, status, provider }
 */
http.route({
  path: "/payment/callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { paymentId, transactionId, status, provider } = body;

      if (!paymentId || !status) {
        return new Response(JSON.stringify({ error: "Missing paymentId or status" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (status === "success" || status === "completed") {
        await ctx.runMutation(internal.paymentWebhook.processSuccess, {
          paymentId,
          transactionId: transactionId ?? `${provider}-${Date.now()}`,
        });
      } else {
        await ctx.runMutation(internal.paymentWebhook.processFailed, {
          paymentId,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

/**
 * Khalti-specific webhook format
 */
http.route({
  path: "/payment/khalti/verify",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      // Khalti sends: { pidx, transaction_id, amount, status }
      const { pidx, transaction_id, status } = body;

      if (status === "Completed") {
        await ctx.runMutation(internal.paymentWebhook.processSuccess, {
          paymentId: pidx,
          transactionId: transaction_id,
        });
      } else {
        await ctx.runMutation(internal.paymentWebhook.processFailed, {
          paymentId: pidx,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
