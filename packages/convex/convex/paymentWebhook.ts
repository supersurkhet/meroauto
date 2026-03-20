import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** Process successful payment from webhook callback */
export const processSuccess = internalMutation({
  args: {
    paymentId: v.string(),
    transactionId: v.string(),
  },
  handler: async (ctx, { paymentId, transactionId }) => {
    // Try to find payment by ID or by transactionId
    const payment = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Match by transactionId or by _id string
    const matched = payment.find(
      (p) => p._id.toString() === paymentId || p.transactionId === paymentId,
    );

    if (!matched) {
      // Payment not found — might be a duplicate callback, ignore
      return;
    }

    await ctx.db.patch(matched._id, {
      status: "completed",
      transactionId,
      completedAt: Date.now(),
    });
  },
});

/** Process failed payment from webhook callback */
export const processFailed = internalMutation({
  args: {
    paymentId: v.string(),
  },
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const matched = payment.find(
      (p) => p._id.toString() === paymentId || p.transactionId === paymentId,
    );

    if (!matched) return;

    await ctx.db.patch(matched._id, { status: "failed" });
  },
});
