import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 1 minute: expire stale ride requests
crons.interval(
  "expire stale ride requests",
  { minutes: 1 },
  internal.cronHandlers.expireStaleRequests,
);

// Every 5 minutes: mark drivers offline if no location update in 2 minutes
crons.interval(
  "offline stale drivers",
  { minutes: 5 },
  internal.cronHandlers.offlineStaleDrivers,
);

export default crons;
