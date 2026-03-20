import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const createPayment = mutation({
  args: {
    rideId: v.id("rides"),
    riderId: v.id("riders"),
    driverId: v.id("drivers"),
    amount: v.number(),
    method: v.union(
      v.literal("cash"),
      v.literal("khalti"),
      v.literal("esewa"),
      v.literal("fonepay"),
    ),
  },
  handler: async (ctx, args) => {
    // Check for existing payment
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_rideId", (q) => q.eq("rideId", args.rideId))
      .first();
    if (existing) throw new Error("Payment already exists for this ride");

    const now = Date.now();
    // Cash payments are immediately completed
    const isCash = args.method === "cash";

    return await ctx.db.insert("payments", {
      rideId: args.rideId,
      riderId: args.riderId,
      driverId: args.driverId,
      amount: args.amount,
      method: args.method,
      status: isCash ? "completed" : "pending",
      createdAt: now,
      completedAt: isCash ? now : undefined,
    });
  },
});

export const completePayment = mutation({
  args: {
    paymentId: v.id("payments"),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, { paymentId, transactionId }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "pending") throw new Error("Payment not pending");

    await ctx.db.patch(paymentId, {
      status: "completed",
      transactionId,
      completedAt: Date.now(),
    });
    return paymentId;
  },
});

export const failPayment = mutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "pending") throw new Error("Payment not pending");

    await ctx.db.patch(paymentId, { status: "failed" });
    return paymentId;
  },
});

export const refundPayment = mutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "completed") throw new Error("Can only refund completed payments");

    await ctx.db.patch(paymentId, { status: "refunded" });
    return paymentId;
  },
});

export const getPaymentByRide = query({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .first();
  },
});

export const getPaymentsByRider = query({
  args: {
    riderId: v.id("riders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { riderId, limit }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_riderId", (q) => q.eq("riderId", riderId))
      .order("desc")
      .take(limit ?? 20);
  },
});

export const getPaymentsByDriver = query({
  args: {
    driverId: v.id("drivers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { driverId, limit }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .order("desc")
      .take(limit ?? 20);
  },
});
