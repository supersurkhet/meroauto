import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function generateQrCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MA-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Create a QR code for a driver's vehicle */
export const createQrCode = mutation({
  args: {
    driverId: v.id("drivers"),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, { driverId, vehicleId }) => {
    // Deactivate existing QR for this vehicle
    const existing = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    for (const qr of existing) {
      await ctx.db.patch(qr._id, { isActive: false });
    }

    const qrCode = generateQrCode();
    return await ctx.db.insert("autoQrCodes", {
      driverId,
      vehicleId,
      qrCode,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

/** Look up a QR code → get driver and vehicle info */
export const lookupQrCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, { qrCode }) => {
    const qr = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", qrCode))
      .unique();

    if (!qr || !qr.isActive) return null;

    const driver = await ctx.db.get(qr.driverId);
    const vehicle = await ctx.db.get(qr.vehicleId);

    if (!driver) return null;

    return {
      qrId: qr._id,
      driver: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        rating: driver.rating,
        isOnline: driver.isOnline,
        isApproved: driver.isApproved,
      },
      vehicle,
    };
  },
});

/** Get QR code for a driver */
export const getDriverQrCode = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    return await ctx.db
      .query("autoQrCodes")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

/** Deactivate a QR code */
export const deactivateQrCode = mutation({
  args: { qrId: v.id("autoQrCodes") },
  handler: async (ctx, { qrId }) => {
    await ctx.db.patch(qrId, { isActive: false });
    return qrId;
  },
});

/** List all QR codes (admin) */
export const listAllQrCodes = query({
  args: {},
  handler: async (ctx) => {
    const codes = await ctx.db.query("autoQrCodes").collect();
    const results = [];
    for (const qr of codes) {
      const driver = await ctx.db.get(qr.driverId);
      const vehicle = await ctx.db.get(qr.vehicleId);
      results.push({
        ...qr,
        driverName: driver?.name,
        vehicleRegistration: vehicle?.registrationNumber,
      });
    }
    return results;
  },
});
