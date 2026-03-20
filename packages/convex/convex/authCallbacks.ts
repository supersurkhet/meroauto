import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** Ensure a rider profile exists for this WorkOS user */
export const ensureRider = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { userId, name, email, phone }) => {
    const existing = await ctx.db
      .query("riders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      // Update profile with latest WorkOS data
      await ctx.db.patch(existing._id, {
        name: name || existing.name,
        email: email || existing.email,
      });
      return existing._id;
    }

    return await ctx.db.insert("riders", {
      userId,
      name,
      phone: phone || "9800000000",
      email,
      preferredLanguage: "en",
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

/** Ensure a driver profile exists for this WorkOS user */
export const ensureDriver = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { userId, name, email, phone }) => {
    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: name || existing.name,
        email: email || existing.email,
      });
      return existing._id;
    }

    return await ctx.db.insert("drivers", {
      userId,
      name,
      phone: phone || "9800000000",
      email,
      licenseNumber: "PENDING",
      licenseExpiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
      isOnline: false,
      isApproved: false,
      isSuspended: false,
      rating: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      preferredLanguage: "en",
      createdAt: Date.now(),
    });
  },
});
