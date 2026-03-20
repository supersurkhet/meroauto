# MeroAuto — Implementation Plan

Auto-rickshaw ride-sharing platform for Surkhet, Nepal.
**Domain**: auto.surkhet.app | **Repo**: supersurkhet/meroauto

## Overview

- **Business Value**: First digital ride-hailing platform for auto-rickshaws in Surkhet, connecting riders with drivers via mobile apps, QR instant booking, and multi-payment support (Khalti/eSewa/Fonepay/cash)
- **Success Metrics**: Rider booking → driver match in <30s, live tracking accuracy <10m, payment success rate >95%, driver approval turnaround <24h
- **Timeline**: 8 phases, ~12 working days with buffer
- **Priority**: MVP-first — auth, booking, matching, tracking, payments, then admin/extras

## Current State (Already Scaffolded)

| Component | Status | Notes |
|-----------|--------|-------|
| Monorepo | ✅ Done | Turborepo, bun, 4 apps, 4 packages |
| Convex schema | ✅ Done | 11 tables: riders, drivers, vehicles, driverLocations, rideRequests, rides, payments, ratings, autoQrCodes, pricing, zones |
| Shared types | ✅ Done | types.ts, constants.ts (SURKHET_CENTER, SEARCH_RADII, DEFAULT_PRICING) |
| Driver app scaffold | ✅ Rich | Theme, colors, i18n (en/ne), auth provider (mock), driver provider, tabs layout, home screen with status toggle, UI components (Button, Card, StatusToggle), format utils |
| Rider app | ⚠️ Minimal | Only _layout.tsx and index.tsx placeholder |
| Web app | ⚠️ Minimal | SvelteKit scaffold, no content |
| Desktop app | ⚠️ Minimal | Tauri + SvelteKit scaffold, no content |
| CI/CD | ✅ Done | GitHub Actions workflow |
| Git/GitHub | ✅ Done | Pushed to supersurkhet/meroauto |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Convex Backend                       │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │ Mutations│ │ Queries  │ │  Actions  │ │ Scheduled│  │
│  │ (writes) │ │ (reads)  │ │(3rd-party)│ │  (cron)  │  │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘  │
│                       ▲ ▼                                │
│              Real-time Subscriptions                     │
└────────┬──────────┬───────────┬──────────────┬──────────┘
         │          │           │              │
    ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐ ┌─────▼────┐
    │  Rider  │ │ Driver │ │  Admin  │ │   Web    │
    │  (Expo) │ │ (Expo) │ │ (Tauri) │ │(Svelte)  │
    └─────────┘ └────────┘ └─────────┘ └──────────┘
```

**Data Flow — Ride Lifecycle**:
1. Rider creates rideRequest → Convex mutation `createRideRequest`
2. Convex scheduled function `matchDriver` searches driverLocations by radius (2km→5km→10km)
3. Matched driver receives request via Convex subscription on rideRequests
4. Driver accepts → mutation `acceptRideRequest` → creates ride record
5. Real-time location: driver app pushes location → Convex mutation `updateDriverLocation`
6. Rider subscribes to `driverLocations` filtered by their ride's driverId
7. Ride completion → payment mutation → rating prompt

## Worker Assignments

| Worker | Surface | Scope |
|--------|---------|-------|
| **Convex** | 641 | All Convex functions: mutations, queries, actions, scheduled functions |
| **Rider-Expo** | 640 | Rider mobile app: booking flow, map, tracking, payments, ratings |
| **Driver-Expo** | 642 | Driver mobile app: already has scaffold, needs Convex integration, ride handling, earnings |
| **Tauri-Desktop** | 639 | Admin panel: driver management, live map, pricing config, analytics |
| **Web-SvelteKit** | 643 | Landing page, marketing site, web booking |

---

## Phase 1: Convex Backend Core (Days 1-2)

**Worker: Convex (surface:641)**
All other workers are blocked on this — backend functions must exist first.

### Task 1.1: Auth & User Management Functions
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Stack**: Convex mutations + queries + WorkOS integration
- **Files**:
  - `packages/convex/convex/users.ts` — mutations: `createRider`, `createDriver`, `updateRider`, `updateDriver`
  - `packages/convex/convex/users.ts` — queries: `getRiderByUserId`, `getDriverByUserId`, `getDriverByPhone`
  - `packages/convex/convex/auth.ts` — WorkOS token validation action
- **Acceptance Criteria**: Can create/read rider and driver records via Convex dashboard
- **Dependencies**: Schema (done)

### Task 1.2: Vehicle & QR Code Management
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex mutations + queries
- **Files**:
  - `packages/convex/convex/vehicles.ts` — mutations: `createVehicle`, `updateVehicle`, `deactivateVehicle`
  - `packages/convex/convex/vehicles.ts` — queries: `getVehicleByDriver`, `getVehicleByRegistration`
  - `packages/convex/convex/qrCodes.ts` — mutations: `generateQrCode`, `deactivateQrCode`; queries: `getQrByCode`, `getQrByDriver`
- **Acceptance Criteria**: Vehicle CRUD and QR code generation working
- **Dependencies**: Task 1.1

### Task 1.3: Driver Location Functions
- **Estimate**: 2h ±0.5h | **Priority**: Critical
- **Stack**: Convex mutations + queries with geospatial math
- **Files**:
  - `packages/convex/convex/locations.ts` — mutation: `updateDriverLocation`; queries: `getDriverLocation`, `getNearbyDrivers(lat, lng, radiusKm)`
  - `packages/shared/src/geo.ts` — Haversine distance formula utility
- **Acceptance Criteria**: `getNearbyDrivers` returns drivers within radius, sorted by distance
- **Dependencies**: Task 1.1

### Task 1.4: Ride Request & Matching Functions
- **Estimate**: 4h ±1h | **Priority**: Critical
- **Stack**: Convex mutations + queries + scheduled functions
- **Files**:
  - `packages/convex/convex/rideRequests.ts` — mutations: `createRideRequest`, `cancelRideRequest`, `expireRideRequest`; queries: `getRideRequestById`, `getActiveRequestForRider`, `getPendingRequestsForDriver`
  - `packages/convex/convex/matching.ts` — scheduled action: `matchDriver` (radius expansion 2km→5km→10km using `getNearbyDrivers`, respects SEARCH_RADII from shared constants)
  - `packages/convex/convex/rides.ts` — mutations: `acceptRideRequest` (creates ride), `startRide`, `completeRide`, `cancelRide`; queries: `getActiveRide`, `getRideHistory`
- **Acceptance Criteria**: Full ride lifecycle from request → match → accept → start → complete
- **Dependencies**: Task 1.3 (location queries)

### Task 1.5: Pricing & Fare Estimation
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex queries + actions
- **Files**:
  - `packages/convex/convex/pricing.ts` — query: `getActivePricing(zoneId?)`, `estimateFare(pickupLat, pickupLng, dropoffLat, dropoffLng)`; mutations: `updatePricing`, `setSurgeMultiplier`
- **Acceptance Criteria**: Fare estimation returns correct NPR amount based on distance + time + surge
- **Dependencies**: Task 1.3 (geo utils)

### Task 1.6: Payment Functions
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex mutations + actions (Khalti/eSewa/Fonepay via @nabwin/paisa)
- **Files**:
  - `packages/convex/convex/payments.ts` — mutations: `createPayment`, `completePayment`, `failPayment`; action: `initiateDigitalPayment(method, amount, rideId)` (calls @nabwin/paisa)
- **Acceptance Criteria**: Cash payment records created; digital payment initiation returns redirect URL
- **Dependencies**: Task 1.4

### Task 1.7: Ratings & Zone Functions
- **Estimate**: 1.5h ±0.5h | **Priority**: Medium
- **Stack**: Convex mutations + queries
- **Files**:
  - `packages/convex/convex/ratings.ts` — mutation: `submitRating`; query: `getRatingsForUser`, `getAverageRating`
  - `packages/convex/convex/zones.ts` — mutations: `createZone`, `updateZone`; query: `getActiveZones`, `getZoneForLocation`
- **Acceptance Criteria**: Ratings update driver's average; zones can be CRUD'd
- **Dependencies**: Task 1.4

### Task 1.8: Admin Queries
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex queries (admin-only, check role)
- **Files**:
  - `packages/convex/convex/admin.ts` — queries: `listDrivers(filter)`, `listRiders`, `getActiveRides`, `getDashboardStats`, `getRevenueReport`; mutations: `approveDriver`, `suspendDriver`, `unsuspendDriver`
- **Acceptance Criteria**: Admin can list/filter/approve/suspend drivers, see live rides
- **Dependencies**: Tasks 1.1-1.7

---

## Phase 2: Auth Flow — All Apps (Days 2-3)

**Workers: Convex + Rider-Expo + Driver-Expo + Web-SvelteKit**
Parallel work once Convex auth functions exist.

### Task 2.1: WorkOS Auth Integration (Convex)
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Worker**: Convex (surface:641)
- **Stack**: Convex + WorkOS SDK
- **Files**:
  - `packages/convex/convex/auth.ts` — action: `authenticateWithWorkOS(code)` → exchanges code for session, creates/gets user record
  - `packages/convex/convex/http.ts` — HTTP endpoint for WorkOS callback
- **Acceptance Criteria**: WorkOS OAuth code exchange returns valid Convex session
- **Dependencies**: Phase 1 complete

### Task 2.2: Rider App Auth Screens
- **Estimate**: 4h ±1h | **Priority**: Critical
- **Worker**: Rider-Expo (surface:640)
- **Stack**: Expo + WorkOS AuthKit redirect + Convex
- **Files**:
  - `apps/rider/app/(auth)/_layout.tsx` — auth layout
  - `apps/rider/app/(auth)/login.tsx` — login screen with WorkOS redirect
  - `apps/rider/app/(auth)/signup.tsx` — signup screen
  - `apps/rider/lib/providers/auth.tsx` — real WorkOS auth provider (replace placeholder)
  - `apps/rider/lib/providers/convex.tsx` — ConvexProvider with auth
- **Screenshot Should Show**: Login screen with MeroAuto branding, phone/email input, login button; after login → redirects to home
- **Dependencies**: Task 2.1

### Task 2.3: Driver App Auth — Replace Mock with WorkOS
- **Estimate**: 2h ±0.5h | **Priority**: Critical
- **Worker**: Driver-Expo (surface:642)
- **Stack**: Expo + WorkOS AuthKit + Convex
- **Files**:
  - Update `apps/driver/lib/providers/auth.tsx` — replace mock with real WorkOS flow
  - Add `apps/driver/lib/providers/convex.tsx` — ConvexProvider with auth
  - Update `apps/driver/app/_layout.tsx` — wrap with ConvexProvider
- **Screenshot Should Show**: Driver login screen, functional auth flow, redirect to home with status toggle
- **Dependencies**: Task 2.1
- **Note**: Existing auth.tsx has mock implementation — swap to WorkOS, keep same Provider API

### Task 2.4: Web App Auth
- **Estimate**: 2h ±0.5h | **Priority**: Medium
- **Worker**: Web-SvelteKit (surface:643)
- **Stack**: SvelteKit + WorkOS server-side + Convex
- **Files**:
  - `apps/web/src/lib/server/auth.ts` — WorkOS server client
  - `apps/web/src/routes/auth/callback/+server.ts` — OAuth callback
  - `apps/web/src/hooks.server.ts` — session middleware
- **Screenshot Should Show**: Login button on landing page, redirects to WorkOS, returns authenticated
- **Dependencies**: Task 2.1

---

## Phase 3: Rider App — Core Booking Flow (Days 3-5)

**Worker: Rider-Expo (surface:640)**

### Task 3.1: Rider App Scaffold — Tabs, Theme, i18n
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Stack**: Expo Router tabs, NativeWind, i18n
- **Files**:
  - `apps/rider/app/(tabs)/_layout.tsx` — Tab navigator (Home, Rides, Activity, Profile)
  - `apps/rider/lib/providers/theme.tsx` — Theme provider (mirror driver app pattern)
  - `apps/rider/constants/colors.ts` — Color scheme (rider uses emerald-500 primary)
  - `apps/rider/constants/typography.ts` — Typography system
  - `apps/rider/lib/i18n/en.ts`, `ne.ts`, `index.ts` — Translations
  - `apps/rider/components/ui/Button.tsx`, `Card.tsx` — UI primitives
- **Screenshot Should Show**: Rider app with 4-tab navigation, themed, bilingual
- **Dependencies**: Task 2.2

### Task 3.2: Map & Location Selection
- **Estimate**: 4h ±1h | **Priority**: Critical
- **Stack**: react-native-maps, Expo Location
- **Files**:
  - `apps/rider/app/(tabs)/index.tsx` — Home screen with map centered on SURKHET_CENTER
  - `apps/rider/components/MapView.tsx` — Full-screen map with current location marker
  - `apps/rider/components/LocationSearch.tsx` — Search bar with autocomplete (Google Places or local POI list)
  - `apps/rider/components/LocationPicker.tsx` — Draggable pin for pickup/dropoff selection
- **Screenshot Should Show**: Map centered on Surkhet, user location dot, search bar at top, "Where to?" input
- **Dependencies**: Task 3.1

### Task 3.3: Fare Estimation & Booking Confirmation
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Stack**: Convex queries (estimateFare), Bottom sheet UI
- **Files**:
  - `apps/rider/components/FareEstimate.tsx` — Shows estimated fare, distance, time after pickup/dropoff selected
  - `apps/rider/components/BookingSheet.tsx` — Bottom sheet: route summary, fare, payment method selector, "Book Auto" button
  - `apps/rider/app/booking/confirm.tsx` — Confirmation screen
- **Screenshot Should Show**: Bottom sheet showing "रू 150" fare, 3.2 km, ~12 min, payment method dropdown, green "Book Auto" button
- **Dependencies**: Task 3.2, Phase 1 (Convex pricing)

### Task 3.4: Ride Request & Driver Matching UI
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Stack**: Convex subscriptions (rideRequests), animated UI
- **Files**:
  - `apps/rider/app/ride/searching.tsx` — "Searching for driver..." screen with pulsing radius animation (2km→5km→10km indicator)
  - `apps/rider/app/ride/matched.tsx` — Driver matched: show driver name, photo, vehicle, rating, ETA
  - `apps/rider/lib/hooks/useRideRequest.ts` — Convex subscription for ride request status changes
- **Screenshot Should Show**: Pulsing search animation on map; then driver card slides up with name, vehicle plate, rating stars
- **Dependencies**: Task 3.3, Phase 1 (matching functions)

### Task 3.5: Live Tracking Screen
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Stack**: Convex subscription (driverLocations), react-native-maps
- **Files**:
  - `apps/rider/app/ride/[id].tsx` — Active ride screen with map showing driver position, route line, ETA
  - `apps/rider/components/DriverMarker.tsx` — Auto-rickshaw icon marker that rotates with heading
  - `apps/rider/lib/hooks/useDriverLocation.ts` — Convex subscription on driverLocations for active ride's driver
- **Screenshot Should Show**: Map with auto-rickshaw marker moving along route, "Driver is X min away" ETA label, driver info card at bottom
- **Dependencies**: Task 3.4

### Task 3.6: Ride Completion & Rating
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex mutations (submitRating, completePayment)
- **Files**:
  - `apps/rider/app/ride/complete.tsx` — Ride summary: fare, distance, duration, driver info
  - `apps/rider/components/RatingSheet.tsx` — 5-star rating + optional comment
  - `apps/rider/components/PaymentSummary.tsx` — Payment method used, amount, receipt
- **Screenshot Should Show**: "Ride Complete!" screen with fare summary, star rating input, "Rate Driver" button
- **Dependencies**: Task 3.5

### Task 3.7: QR Instant Ride
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: expo-camera (barcode scanner), Convex queries
- **Files**:
  - `apps/rider/app/(tabs)/scan.tsx` — OR add scan button to home screen
  - `apps/rider/components/QRScanner.tsx` — Camera viewfinder, scans QR → queries `getQrByCode` → shows driver info → one-tap book
- **Screenshot Should Show**: Camera viewfinder with "Scan auto QR code" overlay; after scan → driver details + "Book This Auto" button
- **Dependencies**: Task 3.3 (booking flow)

---

## Phase 4: Driver App — Convex Integration (Days 3-5)

**Worker: Driver-Expo (surface:642)**
Runs parallel with Phase 3.

### Task 4.1: Replace Mock Provider with Convex
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Stack**: Convex subscriptions + mutations
- **Files**:
  - Update `apps/driver/lib/providers/driver.tsx` — replace local state with Convex subscriptions:
    - `status` → Convex mutation `updateDriverStatus`
    - `currentRequest` → Convex subscription on `rideRequests` where `matchedDriverId == myId`
    - `activeRide` → Convex subscription on `rides` where `driverId == myId && status in [driver_arriving, driver_arrived, in_progress]`
    - `todayEarnings/todayRides` → Convex query `getDriverDailyStats`
  - Update `apps/driver/app/_layout.tsx` — add ConvexProvider
- **Screenshot Should Show**: Home screen with real-time stats from Convex, toggle works and persists
- **Dependencies**: Phase 1 complete, Task 2.3

### Task 4.2: Location Broadcasting
- **Estimate**: 2h ±0.5h | **Priority**: Critical
- **Stack**: Expo Location (background), Convex mutations
- **Files**:
  - `apps/driver/lib/hooks/useLocationBroadcast.ts` — when online, start background location updates → call `updateDriverLocation` mutation every 5s (LOCATION_UPDATE_INTERVAL_MS)
  - Update `apps/driver/lib/providers/driver.tsx` — start/stop location broadcasting on status toggle
- **Screenshot Should Show**: Driver goes online → location dot appears on map → location updates visible in Convex dashboard
- **Dependencies**: Task 4.1

### Task 4.3: Ride Request Notification & Accept/Reject
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Stack**: Convex subscriptions, animated UI, haptics
- **Files**:
  - `apps/driver/app/ride/request.tsx` — Full-screen ride request overlay: passenger name, pickup/dropoff, fare, distance, countdown timer
  - `apps/driver/components/RideRequestCard.tsx` — Card with Accept/Reject buttons, map preview showing pickup
  - Update `apps/driver/lib/providers/driver.tsx` — subscription triggers request screen
- **Screenshot Should Show**: Ride request slides up from bottom with map showing pickup pin, "NPR 150 • 3.2 km", Accept (green) / Reject (gray) buttons, 30s countdown
- **Dependencies**: Task 4.1

### Task 4.4: Active Ride Flow — Navigate, OTP, Complete
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Stack**: Convex mutations, deep linking (Google Maps/Apple Maps)
- **Files**:
  - `apps/driver/app/ride/[id].tsx` — Active ride screen: passenger info, pickup/dropoff addresses, navigation button, OTP input, complete button
  - `apps/driver/lib/utils/navigation.ts` — deep link to Google Maps/Apple Maps for turn-by-turn
  - `apps/driver/components/OTPInput.tsx` — 4-digit OTP input for ride verification
  - Status progression: driver_arriving → "Navigate" button → driver_arrived → OTP verify → in_progress → "Complete Ride"
- **Screenshot Should Show**: Active ride with passenger card, "Navigate to Pickup" button, OTP input after arrival, "Complete Ride" button
- **Dependencies**: Task 4.3

### Task 4.5: Earnings Tab — Connect to Convex
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex queries, chart library
- **Files**:
  - `apps/driver/app/(tabs)/earnings.tsx` — Earnings screen with daily/weekly/monthly toggle, total earnings, ride count, avg per ride
  - `apps/driver/lib/hooks/useEarnings.ts` — Convex queries for earnings data
- **Screenshot Should Show**: Earnings tab showing "NPR 2,450 today", ride count, bar chart of weekly earnings
- **Dependencies**: Task 4.1

### Task 4.6: Profile Tab — QR Code, Vehicle, Settings
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex queries, QR generation
- **Files**:
  - `apps/driver/app/(tabs)/profile.tsx` — Profile screen: avatar, name, rating, QR code display, vehicle details, settings (language, dark mode, notifications)
  - `apps/driver/components/QRDisplay.tsx` — Display driver's QR code (for riders to scan)
  - `apps/driver/components/VehicleCard.tsx` — Vehicle details card
- **Screenshot Should Show**: Profile with QR code, vehicle plate "Ba 12 Pa 3456", 4.8★ rating, language toggle
- **Dependencies**: Task 4.1

---

## Phase 5: Admin Desktop Panel (Days 5-7)

**Worker: Tauri-Desktop (surface:639)**

### Task 5.1: Desktop App Setup — SvelteKit + Tauri + shadcn-svelte
- **Estimate**: 3h ±1h | **Priority**: High
- **Stack**: Tauri, SvelteKit, shadcn-svelte, Tailwind v4
- **Files**:
  - `apps/desktop/src/routes/+layout.svelte` — App shell with sidebar navigation
  - `apps/desktop/src/lib/components/Sidebar.svelte` — Navigation: Dashboard, Drivers, Rides, Pricing, Zones, Analytics
  - `apps/desktop/src/lib/convex.ts` — Convex client setup
  - Install shadcn-svelte components: Table, Badge, Dialog, Sheet, Tabs, Chart
- **Screenshot Should Show**: Desktop app with sidebar, dark header "MeroAuto Admin", clean layout
- **Dependencies**: Phase 1

### Task 5.2: Dashboard — Live Stats
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex subscriptions, shadcn-svelte Card
- **Files**:
  - `apps/desktop/src/routes/+page.svelte` — Dashboard: active rides count, online drivers count, today's revenue, total riders
  - `apps/desktop/src/lib/components/StatCard.svelte` — Stat card component
  - Real-time via Convex subscriptions
- **Screenshot Should Show**: Dashboard with 4 stat cards (Active Rides: 12, Online Drivers: 8, Revenue: NPR 45,200, Riders: 234)
- **Dependencies**: Task 5.1, Task 1.8

### Task 5.3: Driver Management
- **Estimate**: 4h ±1h | **Priority**: High
- **Stack**: Convex queries + mutations, shadcn-svelte Table + Dialog
- **Files**:
  - `apps/desktop/src/routes/drivers/+page.svelte` — Driver list with filters (approved/pending/suspended), search
  - `apps/desktop/src/lib/components/DriverTable.svelte` — Table: name, phone, vehicle, rating, status, actions
  - `apps/desktop/src/lib/components/DriverDetailDialog.svelte` — Detail view: license, documents, ride history, approve/suspend buttons
- **Screenshot Should Show**: Table of drivers with status badges (green "Approved", yellow "Pending", red "Suspended"), action buttons, search bar
- **Dependencies**: Task 5.1, Task 1.8

### Task 5.4: Live Rides Map
- **Estimate**: 3h ±1h | **Priority**: High
- **Stack**: Convex subscriptions, Leaflet.js map
- **Files**:
  - `apps/desktop/src/routes/rides/+page.svelte` — Full-width map showing all active rides + online drivers
  - `apps/desktop/src/lib/components/LiveMap.svelte` — Leaflet map with driver markers (auto-rickshaw icon), ride routes
  - `apps/desktop/src/lib/components/RideDetailPanel.svelte` — Click ride → side panel with ride details
- **Screenshot Should Show**: Map of Surkhet with auto-rickshaw markers for active rides, side panel showing selected ride details
- **Dependencies**: Task 5.1, Task 1.8

### Task 5.5: Pricing Configuration
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Stack**: Convex mutations, shadcn-svelte Form + Input
- **Files**:
  - `apps/desktop/src/routes/pricing/+page.svelte` — Pricing config form: base fare, per km, per minute, minimum fare, surge multiplier per zone
  - `apps/desktop/src/lib/components/PricingForm.svelte` — Form with zone selector, number inputs, save button
- **Screenshot Should Show**: Pricing form showing "Base Fare: NPR 50", "Per KM: NPR 25", zone dropdown, save button
- **Dependencies**: Task 5.1, Task 1.5

### Task 5.6: Zone Management
- **Estimate**: 2h ±0.5h | **Priority**: Medium
- **Stack**: Convex mutations, Leaflet map for zone visualization
- **Files**:
  - `apps/desktop/src/routes/zones/+page.svelte` — Zone list + map with zone circles
  - `apps/desktop/src/lib/components/ZoneEditor.svelte` — Create/edit zone: name (en/ne), center lat/lng, radius
- **Screenshot Should Show**: Map of Surkhet with colored circles for zones, zone list alongside
- **Dependencies**: Task 5.4

### Task 5.7: Analytics Dashboard
- **Estimate**: 3h ±1h | **Priority**: Medium
- **Stack**: Convex queries, LayerChart for charts
- **Files**:
  - `apps/desktop/src/routes/analytics/+page.svelte` — Revenue over time, rides per day, popular routes, driver utilization
  - Charts: line chart (revenue), bar chart (rides/day), heat map (popular zones)
- **Screenshot Should Show**: Analytics page with line chart showing weekly revenue trend, bar chart of daily rides, KPI summary cards
- **Dependencies**: Task 5.2

---

## Phase 6: Landing Page & Web App (Days 5-7)

**Worker: Web-SvelteKit (surface:643)**
Runs parallel with Phase 5.

### Task 6.1: Landing Page Design
- **Estimate**: 4h ±1h | **Priority**: High
- **Stack**: SvelteKit, shadcn-svelte, Tailwind v4, svelte-motion
- **Files**:
  - `apps/web/src/routes/+page.svelte` — Hero section, features grid, how it works, download CTAs, footer
  - `apps/web/src/lib/components/Hero.svelte` — Hero with auto-rickshaw illustration, "Book your ride in Surkhet" tagline
  - `apps/web/src/lib/components/Features.svelte` — Feature cards: QR Booking, Live Tracking, Multiple Payments, Nepali Language
  - `apps/web/src/lib/components/HowItWorks.svelte` — 3-step: Open App → Set Destination → Ride
  - `apps/web/src/lib/components/Footer.svelte` — Links, social, Surkhet address
  - `apps/web/src/routes/+layout.svelte` — Layout with nav, fonts, toaster
- **Screenshot Should Show**: Beautiful landing page with Surkhet-themed hero, emerald color scheme, feature cards with icons, CTA buttons
- **Dependencies**: None (parallel)

### Task 6.2: SEO & Meta Tags
- **Estimate**: 1h ±0.5h | **Priority**: Medium
- **Stack**: svelte-meta-tags, SvelteKit
- **Files**:
  - `apps/web/src/lib/seo.ts` — Default meta: "MeroAuto — Auto-rickshaw rides in Surkhet"
  - `apps/web/src/routes/sitemap.xml/+server.ts` — Sitemap
  - `apps/web/static/robots.txt` — Robots
  - OG image for social sharing
- **Acceptance Criteria**: Meta tags render correctly, sitemap accessible
- **Dependencies**: Task 6.1

### Task 6.3: Web Booking Flow (Optional)
- **Estimate**: 3h ±1h | **Priority**: Low
- **Stack**: SvelteKit, Convex, Leaflet map
- **Files**:
  - `apps/web/src/routes/book/+page.svelte` — Web booking: map, location search, fare estimate, book button
  - `apps/web/src/routes/ride/[id]/+page.svelte` — Live tracking in browser
- **Screenshot Should Show**: Web booking page with map, pickup/dropoff inputs, "Book Auto" button
- **Dependencies**: Task 6.1, Phase 1

### Task 6.4: Driver Registration Page
- **Estimate**: 2h ±0.5h | **Priority**: Medium
- **Stack**: SvelteKit, Superforms + Zod, WorkOS
- **Files**:
  - `apps/web/src/routes/drive/+page.svelte` — "Become a Driver" page: benefits, registration form
  - `apps/web/src/routes/drive/register/+page.svelte` — Multi-step form: personal info, vehicle details, license upload, document submission
- **Screenshot Should Show**: "Become a MeroAuto Driver" page with benefits list, registration form with document upload
- **Dependencies**: Task 6.1

---

## Phase 7: Payments, Notifications & Polish (Days 7-9)

### Task 7.1: Payment Integration
- **Estimate**: 4h ±1h | **Priority**: Critical
- **Worker**: Convex (surface:641) + Rider-Expo (surface:640)
- **Stack**: @nabwin/paisa, Convex actions
- **Convex files**:
  - Update `packages/convex/convex/payments.ts` — implement `initiateDigitalPayment` action with @nabwin/paisa SDK for Khalti, eSewa, Fonepay
  - Add payment webhook handler for confirmation callbacks
- **Rider app files**:
  - `apps/rider/components/PaymentMethodSelector.tsx` — Payment method picker: cash (default), Khalti, eSewa, Fonepay with icons
  - `apps/rider/app/payment/[method].tsx` — Webview for digital payment gateway redirect
  - `apps/rider/lib/hooks/usePayment.ts` — Payment flow state management
- **Screenshot Should Show**: Payment method selector showing Khalti/eSewa/Fonepay logos with radio selection; Khalti webview payment screen
- **Dependencies**: Phases 3-4

### Task 7.2: Push Notifications
- **Estimate**: 3h ±1h | **Priority**: High
- **Worker**: Convex (surface:641) + Rider-Expo (surface:640) + Driver-Expo (surface:642)
- **Stack**: expo-notifications, Convex actions
- **Files**:
  - `packages/convex/convex/notifications.ts` — action: `sendPushNotification(userId, title, body)`; store push tokens
  - `apps/rider/lib/hooks/useNotifications.ts` — Register push token, handle incoming notifications
  - `apps/driver/lib/hooks/useNotifications.ts` — Same for driver
- **Notifications**: New ride request (driver), ride accepted (rider), driver arrived (rider), ride completed (both)
- **Dependencies**: Phases 3-4

### Task 7.3: Ride Pooling (Optional)
- **Estimate**: 4h ±1h | **Priority**: Low
- **Worker**: Convex (surface:641) + Rider-Expo (surface:640)
- **Stack**: Convex mutations + queries
- **Files**:
  - Update `packages/convex/convex/matching.ts` — pooling logic: find rides with similar routes, split fare
  - `apps/rider/components/PoolingToggle.tsx` — "Share ride" toggle in booking sheet
  - `apps/rider/components/CoRiders.tsx` — Show co-riders during active pooled ride
- **Dependencies**: Phases 3-4

### Task 7.4: i18n Polish — Rider App
- **Estimate**: 2h ±0.5h | **Priority**: High
- **Worker**: Rider-Expo (surface:640)
- **Stack**: react-i18next
- **Files**:
  - Ensure all rider app strings use `t()` translations
  - Complete `apps/rider/lib/i18n/ne.ts` with all Nepali strings
  - Language toggle in rider profile/settings
- **Dependencies**: Phase 3

### Task 7.5: Dark Mode Polish — All Apps
- **Estimate**: 2h ±0.5h | **Priority**: Medium
- **Worker**: All
- Verify dark mode looks good across all screens in rider, driver, desktop, web
- **Dependencies**: Phases 3-6

---

## Phase 8: Deploy & First Release (Days 9-10)

### Task 8.1: Convex Production Deploy
- **Estimate**: 1h ±0.5h | **Priority**: Critical
- **Worker**: Convex (surface:641)
- `cd packages/convex && npx convex deploy --prod`
- Set production env vars for WorkOS, @nabwin/paisa
- **Acceptance Criteria**: Convex production deployment accessible

### Task 8.2: Web Deploy to Cloudflare Workers
- **Estimate**: 2h ±1h | **Priority**: Critical
- **Worker**: Web-SvelteKit (surface:643)
- Configure wrangler.toml for auto.surkhet.app domain
- `wrangler deploy` from apps/web
- Set DNS records for auto.surkhet.app
- **Acceptance Criteria**: https://auto.surkhet.app shows landing page

### Task 8.3: Mobile App Builds
- **Estimate**: 3h ±1h | **Priority**: Critical
- **Worker**: Rider-Expo (surface:640) + Driver-Expo (surface:642)
- `eas build --platform ios` + `eas build --platform android` for both apps
- Create GitHub releases with APK downloads
- **Acceptance Criteria**: APK installable on Android, TestFlight build available

### Task 8.4: Desktop App Build
- **Estimate**: 2h ±1h | **Priority**: High
- **Worker**: Tauri-Desktop (surface:639)
- `bun run tauri build` → produces .dmg (macOS)
- Create GitHub release with binary
- **Acceptance Criteria**: Desktop app launches, connects to production Convex

### Task 8.5: Version Tag & Release
- **Estimate**: 0.5h | **Priority**: High
- `git tag v0.1.0 && git push --tags`
- `gh release create v0.1.0` with release notes and attached binaries
- **Acceptance Criteria**: GitHub release page shows v0.1.0 with all artifacts

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| react-native-maps complexity on Expo | Medium | High | Use expo-map-view as fallback; test early in Phase 3 |
| @nabwin/paisa SDK stability | Medium | High | Implement cash-first, add digital payments incrementally; have manual payment fallback |
| Convex geospatial queries performance | Low | Medium | Haversine in JS is fast enough for Surkhet-scale (<1000 drivers); add spatial indexing later if needed |
| WorkOS mobile OAuth redirect | Medium | Medium | Test AuthKit redirect flow early in Phase 2; fallback to phone OTP if needed |
| Tauri build issues | Low | Medium | SvelteKit web admin as fallback if Tauri builds fail |
| Background location on iOS | Medium | High | Request "always" permission; use significant-change location API as fallback |
| Nepali Unicode rendering | Low | Low | Test on real devices early; fonts already support Devanagari |

## Dependency Graph

```
Phase 1 (Convex Core)
  ├── Phase 2 (Auth) ──┬── Phase 3 (Rider App) ──┐
  │                     ├── Phase 4 (Driver App) ──┤
  │                     │                          ├── Phase 7 (Payments, Notifications)
  ├── Phase 5 (Admin Desktop) ─────────────────────┤
  └── Phase 6 (Landing Page) ──────────────────────┤
                                                   └── Phase 8 (Deploy & Release)
```

Phases 3+4 are parallel. Phases 5+6 are parallel. Phase 7 depends on 3+4. Phase 8 depends on everything.

## TESTING.md Entries (Created Per Phase)

Each phase's worker MUST update `/tmp/meroauto/TESTING.md` with verification entries for every feature they implement. See individual task "Screenshot Should Show" fields above for expected verification screenshots.
