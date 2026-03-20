# MeroAuto 🛺

**Auto-rickshaw ride-sharing platform for Surkhet, Nepal**

MeroAuto connects riders with auto-rickshaw drivers in Surkhet through mobile apps, a web platform, and an admin desktop application. Built with real-time tracking, QR instant rides, and support for Nepali payment gateways.

**Domain**: [auto.surkhet.app](https://auto.surkhet.app)

## Apps

| App | Tech | Description |
|-----|------|-------------|
| **Rider** (`apps/rider`) | Expo / React Native | Book rides, live tracking, QR scan, payments |
| **Driver** (`apps/driver`) | Expo / React Native | Accept rides, navigation, earnings, QR code |
| **Admin** (`apps/desktop`) | Tauri v2 + SvelteKit | Driver management, live map, pricing, analytics |
| **Web** (`apps/web`) | SvelteKit | Landing page, fare calculator, driver registration |
| **Backend** (`packages/convex`) | Convex | Real-time database, serverless functions, auth |

## Tech Stack

- **Mobile**: Expo SDK 55, React Native, react-native-maps, NativeWind
- **Desktop**: Tauri v2, SvelteKit, shadcn-svelte, Leaflet
- **Web**: SvelteKit, Tailwind v4, shadcn-svelte, Cloudflare Workers
- **Backend**: Convex (real-time DB, mutations, queries, scheduled functions)
- **Auth**: WorkOS AuthKit
- **Payments**: Khalti, eSewa, Fonepay, Cash
- **i18n**: English + Nepali (नेपाली)
- **Monorepo**: Turborepo + bun workspaces
- **Quality**: Biome (lint/format), TypeScript strict mode
- **CI/CD**: GitHub Actions

## Architecture

```
                    ┌─────────────────────┐
                    │   Convex Backend     │
                    │  (Real-time DB +     │
                    │   Serverless Fns)    │
                    └──┬───┬───┬───┬──────┘
                       │   │   │   │
          ┌────────────┘   │   │   └────────────┐
          │                │   │                │
     ┌────▼────┐    ┌─────▼──▼─────┐    ┌─────▼─────┐
     │  Rider  │    │    Driver    │    │   Admin   │
     │  (Expo) │    │    (Expo)   │    │  (Tauri)  │
     └─────────┘    └─────────────┘    └───────────┘
                           │
                    ┌──────▼──────┐
                    │  Web (SK)   │
                    │ CloudFlare  │
                    └─────────────┘
```

### Key Data Flows

**Ride Booking**: Rider selects destination → `estimateFare` → `createRideRequest` → `matchDriver` (radius 2km→5km→10km) → driver accepts → live tracking → complete → rate

**QR Instant Ride**: Rider scans auto QR → `lookupQrCode` → driver info displayed → one-tap book (skip matching)

**Live Tracking**: Driver broadcasts location every 5s via `updateDriverLocation` → rider subscribes via Convex real-time → auto-rickshaw marker moves on map

## Project Structure

```
meroauto/
├── apps/
│   ├── rider/              # Expo rider mobile app
│   │   ├── app/            # Expo Router screens
│   │   │   ├── (auth)/     # Login, signup
│   │   │   ├── (tabs)/     # Home (map), rides, scan, profile
│   │   │   ├── booking/    # Pickup/dropoff, fare estimate, confirm
│   │   │   └── ride/       # Matching, tracking, payment, rating
│   │   ├── components/     # UI primitives, driver card, rating stars
│   │   └── lib/            # Auth, theme, i18n, Convex client
│   │
│   ├── driver/             # Expo driver mobile app
│   │   ├── app/            # Expo Router screens
│   │   │   ├── (auth)/     # Login, signup
│   │   │   ├── (tabs)/     # Home (toggle), rides, earnings, profile
│   │   │   └── ride/       # Request modal, active ride [id]
│   │   ├── components/     # Status toggle, ride cards, QR display
│   │   └── lib/            # Auth, driver provider, i18n, notifications
│   │
│   ├── desktop/            # Tauri admin desktop app
│   │   ├── src/
│   │   │   ├── routes/     # Dashboard, drivers, rides, pricing, zones, QR
│   │   │   └── lib/        # Convex client, i18n, stores, components
│   │   └── src-tauri/      # Tauri Rust backend
│   │
│   └── web/                # SvelteKit web app
│       └── src/
│           ├── routes/     # Landing, register, pricing, coverage, safety
│           └── lib/        # i18n, theme, Navbar, Footer, LeafletMap
│
├── packages/
│   ├── convex/             # Convex backend
│   │   └── convex/
│   │       ├── schema.ts   # 11 tables
│   │       ├── users.ts    # Rider/driver CRUD
│   │       ├── rides.ts    # Ride lifecycle
│   │       ├── matching.ts # Driver matching (radius expansion)
│   │       ├── locations.ts # Real-time driver locations
│   │       ├── pricing.ts  # Fare estimation
│   │       ├── payments.ts # Payment records
│   │       ├── pooling.ts  # Ride pooling
│   │       ├── crons.ts    # Scheduled jobs
│   │       └── http.ts     # Payment webhooks
│   │
│   ├── shared/             # Shared types, constants, geo utils
│   ├── ui/                 # Shared UI components
│   └── config/             # Shared tsconfig
│
├── turbo.json
├── biome.jsonc
├── CLAUDE.md
├── PROJECT_PLAN.md
└── TESTING.md
```

## Convex Schema (11 Tables)

| Table | Purpose |
|-------|---------|
| `riders` | Rider profiles (userId, name, phone, language) |
| `drivers` | Driver profiles (license, rating, approval status, earnings) |
| `vehicles` | Auto-rickshaw details (registration, model, color, capacity) |
| `driverLocations` | Real-time GPS positions (lat, lng, heading, speed) |
| `rideRequests` | Booking requests (pickup/dropoff, fare, status, search radius) |
| `rides` | Active/completed rides (full lifecycle with state machine) |
| `payments` | Payment records (cash, Khalti, eSewa, Fonepay) |
| `ratings` | Rider/driver ratings (1-5 stars + comments) |
| `autoQrCodes` | QR codes for instant ride booking |
| `pricing` | Fare configuration per zone (base, per km, per min, surge) |
| `zones` | Surkhet service areas (name in en/ne, center, radius) |

## Features

### Rider App
- Map-based ride booking with fare estimates
- Nearest-driver matching (radius expansion: 2km → 5km → 10km)
- Real-time driver tracking on map
- QR code scanning for instant rides
- Multiple payment methods (Khalti, eSewa, Fonepay, Cash)
- Ride history and ratings
- English + Nepali language support
- Dark mode

### Driver App
- Online/offline toggle with background location broadcasting
- Incoming ride request notifications with countdown timer
- Turn-by-turn navigation via Google Maps / Apple Maps deep link
- OTP verification at pickup
- Earnings dashboard (daily/weekly/monthly)
- QR code display for passengers
- Push notifications for ride requests
- English + Nepali, dark mode

### Admin Desktop
- Dashboard with real-time stats (active rides, online drivers, revenue)
- Driver management (approve, suspend, view details)
- Live rides map (Leaflet with auto-rickshaw markers)
- Pricing configuration per zone with surge multiplier
- Zone management with map editor
- QR code management (generate, deactivate, print)
- Analytics with charts
- CSV data export
- English + Nepali

### Web
- Landing page with features, how-it-works, stats
- Driver registration with multi-step form
- Interactive fare calculator
- Service coverage map
- Safety information page
- SEO optimized (meta tags, sitemap, JSON-LD)
- Fully responsive, dark mode

## Setup

### Prerequisites

- [bun](https://bun.sh) (v1.3+)
- [Node.js](https://nodejs.org) (v22+)
- [Convex CLI](https://docs.convex.dev) (`bun add -g convex`)
- [Rust](https://rustup.rs) (for Tauri desktop app)
- Xcode / Android Studio (for mobile apps)

### Install

```bash
git clone https://github.com/supersurkhet/meroauto.git
cd meroauto
bun install
```

### Environment Variables

Create `.env.local` at the project root:

```env
CONVEX_DEPLOYMENT=your_deployment_name
CONVEX_URL=https://your-deployment.convex.cloud

# WorkOS Auth
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...

# Mobile apps
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_WORKOS_CLIENT_ID=client_...
```

### Development

```bash
# Start all apps
bun run dev

# Individual apps
turbo dev --filter=web        # Web (http://localhost:5173)
turbo dev --filter=desktop    # Desktop (Tauri window)
turbo dev --filter=rider      # Rider (Expo dev server)
turbo dev --filter=driver     # Driver (Expo dev server)

# Convex backend
cd packages/convex && bun run dev

# Seed default data (zones + pricing)
# Call seedDefaults mutation from Convex dashboard
```

### Build

```bash
bun run build                      # Build all
cd apps/web && bun run build       # Web (Cloudflare Workers)
cd apps/desktop && bun run tauri build  # Desktop (.dmg/.exe)
cd apps/rider && eas build         # Rider (iOS/Android)
cd apps/driver && eas build        # Driver (iOS/Android)
```

### Deploy

```bash
# Web → Cloudflare Workers
cd apps/web && wrangler deploy

# Convex → Production
cd packages/convex && npx convex deploy --prod

# Mobile → EAS
cd apps/rider && eas build --platform all
cd apps/driver && eas build --platform all
```

## Pricing

Default pricing for Surkhet (configurable via admin panel):

| Component | Rate |
|-----------|------|
| Base Fare | NPR 50 |
| Per KM | NPR 25 |
| Per Minute | NPR 3 |
| Minimum Fare | NPR 50 |
| Surge (default) | 1.0x |

## License

Private — All rights reserved.

---

Built for Surkhet, Nepal 🇳🇵
