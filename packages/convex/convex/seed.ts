import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

/** Seed the database with Surkhet zones and default pricing */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existingZone = await ctx.db.query("zones").first();
    if (existingZone) return "Already seeded";

    const now = Date.now();

    // Surkhet zones
    const surkhetId = await ctx.db.insert("zones", {
      name: "Surkhet City",
      nameNe: "सुर्खेत शहर",
      centerLatitude: 28.6,
      centerLongitude: 81.6167,
      radiusKm: 5,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("zones", {
      name: "Birendranagar",
      nameNe: "वीरेन्द्रनगर",
      centerLatitude: 28.5985,
      centerLongitude: 81.635,
      radiusKm: 3,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("zones", {
      name: "Latikoili",
      nameNe: "लतिकोइली",
      centerLatitude: 28.58,
      centerLongitude: 81.61,
      radiusKm: 4,
      isActive: true,
      createdAt: now,
    });

    // Default pricing (no zone)
    await ctx.db.insert("pricing", {
      baseFare: 50,
      perKmRate: 25,
      perMinuteRate: 3,
      minimumFare: 50,
      surgePriceMultiplier: 1.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Surkhet City zone pricing
    await ctx.db.insert("pricing", {
      zoneId: surkhetId,
      baseFare: 50,
      perKmRate: 25,
      perMinuteRate: 3,
      minimumFare: 50,
      surgePriceMultiplier: 1.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return "Seeded Surkhet zones and default pricing";
  },
});
