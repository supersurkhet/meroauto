import { mutation } from "./_generated/server";

/** Seed the database with Surkhet zones and default pricing */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingZones = await ctx.db.query("zones").first();
    if (existingZones) return "Already seeded";

    // ── Surkhet zones ─────────────────────────────────────────────
    const surkhetCenter = await ctx.db.insert("zones", {
      name: "Surkhet City",
      nameNe: "सुर्खेत शहर",
      center: { lat: 28.6042, lng: 81.6200 },
      radiusKm: 5,
      isActive: true,
      baseFare: 50,
      perKmRate: 25,
      minimumFare: 50,
      surgeMultiplier: 1.0,
      createdAt: Date.now(),
    });

    const birendranagar = await ctx.db.insert("zones", {
      name: "Birendranagar",
      nameNe: "वीरेन्द्रनगर",
      center: { lat: 28.5985, lng: 81.6350 },
      radiusKm: 3,
      isActive: true,
      baseFare: 40,
      perKmRate: 20,
      minimumFare: 40,
      surgeMultiplier: 1.0,
      createdAt: Date.now(),
    });

    await ctx.db.insert("zones", {
      name: "Latikoili",
      nameNe: "लतिकोइली",
      center: { lat: 28.5800, lng: 81.6100 },
      radiusKm: 4,
      isActive: true,
      baseFare: 45,
      perKmRate: 22,
      minimumFare: 45,
      surgeMultiplier: 1.0,
      createdAt: Date.now(),
    });

    // ── Default pricing ───────────────────────────────────────────
    await ctx.db.insert("pricing", {
      vehicleType: "auto_rickshaw",
      baseFare: 50,
      perKmRate: 25,
      perMinuteRate: 2,
      minimumFare: 50,
      surgeMultiplier: 1.0,
      isDefault: true,
      effectiveFrom: Date.now(),
      createdAt: Date.now(),
    });

    await ctx.db.insert("pricing", {
      vehicleType: "e_rickshaw",
      baseFare: 40,
      perKmRate: 20,
      perMinuteRate: 1.5,
      minimumFare: 40,
      surgeMultiplier: 1.0,
      isDefault: true,
      effectiveFrom: Date.now(),
      createdAt: Date.now(),
    });

    // Zone-specific pricing for Surkhet City
    await ctx.db.insert("pricing", {
      zoneId: surkhetCenter,
      vehicleType: "auto_rickshaw",
      baseFare: 50,
      perKmRate: 25,
      perMinuteRate: 2,
      minimumFare: 50,
      surgeMultiplier: 1.0,
      isDefault: false,
      effectiveFrom: Date.now(),
      createdAt: Date.now(),
    });

    return "Seeded zones and pricing for Surkhet";
  },
});
