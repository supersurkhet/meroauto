import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  riders: defineTable({
    userId: v.string(),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    preferredLanguage: v.union(v.literal("en"), v.literal("ne")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_phone", ["phone"]),

  drivers: defineTable({
    userId: v.string(),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    licenseNumber: v.string(),
    licenseExpiry: v.number(),
    isOnline: v.boolean(),
    isApproved: v.boolean(),
    isSuspended: v.boolean(),
    rating: v.number(),
    totalRides: v.number(),
    totalEarnings: v.number(),
    preferredLanguage: v.union(v.literal("en"), v.literal("ne")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_phone", ["phone"])
    .index("by_isOnline", ["isOnline"])
    .index("by_isApproved", ["isApproved"]),

  vehicles: defineTable({
    driverId: v.id("drivers"),
    registrationNumber: v.string(),
    model: v.string(),
    color: v.string(),
    capacity: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_driverId", ["driverId"])
    .index("by_registrationNumber", ["registrationNumber"]),

  driverLocations: defineTable({
    driverId: v.id("drivers"),
    latitude: v.number(),
    longitude: v.number(),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_driverId", ["driverId"]),

  rideRequests: defineTable({
    riderId: v.id("riders"),
    pickupLatitude: v.number(),
    pickupLongitude: v.number(),
    pickupAddress: v.string(),
    dropoffLatitude: v.number(),
    dropoffLongitude: v.number(),
    dropoffAddress: v.string(),
    estimatedFare: v.number(),
    estimatedDistance: v.number(),
    estimatedDuration: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("matched"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    matchedDriverId: v.optional(v.id("drivers")),
    searchRadius: v.number(),
    isPooling: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_riderId", ["riderId"])
    .index("by_status", ["status"])
    .index("by_matchedDriverId", ["matchedDriverId"]),

  rides: defineTable({
    requestId: v.id("rideRequests"),
    riderId: v.id("riders"),
    driverId: v.id("drivers"),
    vehicleId: v.id("vehicles"),
    pickupLatitude: v.number(),
    pickupLongitude: v.number(),
    pickupAddress: v.string(),
    dropoffLatitude: v.number(),
    dropoffLongitude: v.number(),
    dropoffAddress: v.string(),
    status: v.union(
      v.literal("driver_arriving"),
      v.literal("driver_arrived"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    fare: v.number(),
    distance: v.number(),
    duration: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
    isPooling: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_riderId", ["riderId"])
    .index("by_driverId", ["driverId"])
    .index("by_status", ["status"]),

  payments: defineTable({
    rideId: v.id("rides"),
    riderId: v.id("riders"),
    driverId: v.id("drivers"),
    amount: v.number(),
    method: v.union(
      v.literal("cash"),
      v.literal("khalti"),
      v.literal("esewa"),
      v.literal("fonepay")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    transactionId: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_rideId", ["rideId"])
    .index("by_riderId", ["riderId"])
    .index("by_driverId", ["driverId"]),

  ratings: defineTable({
    rideId: v.id("rides"),
    fromUserId: v.string(),
    toUserId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_rideId", ["rideId"])
    .index("by_toUserId", ["toUserId"]),

  autoQrCodes: defineTable({
    driverId: v.id("drivers"),
    vehicleId: v.id("vehicles"),
    qrCode: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_qrCode", ["qrCode"])
    .index("by_driverId", ["driverId"]),

  pricing: defineTable({
    zoneId: v.optional(v.id("zones")),
    baseFare: v.number(),
    perKmRate: v.number(),
    perMinuteRate: v.number(),
    minimumFare: v.number(),
    surgePriceMultiplier: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_zoneId", ["zoneId"]),

  zones: defineTable({
    name: v.string(),
    nameNe: v.string(),
    centerLatitude: v.number(),
    centerLongitude: v.number(),
    radiusKm: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),
});
