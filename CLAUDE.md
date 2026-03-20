# meroauto

Auto-rickshaw ride-sharing platform for Surkhet, Nepal.
Domain: auto.surkhet.app

## Project Structure

```
meroauto/
├── apps/
│   ├── rider/        # Expo (React Native) - Rider mobile app
│   ├── driver/       # Expo (React Native) - Driver mobile app
│   ├── desktop/      # Tauri + SvelteKit - Admin desktop app
│   └── web/          # SvelteKit - Landing page & web app
├── packages/
│   ├── convex/       # Convex backend (schema, functions, auth)
│   ├── shared/       # Shared types, constants, utilities
│   ├── ui/           # Shared Svelte UI components
│   └── config/       # Shared tsconfig
├── turbo.json
├── biome.jsonc
└── package.json
```

## Commands

```bash
bun run dev          # Start all apps via turbo
bun run build        # Build all apps
bun run lint         # Lint all with Biome
bun run check        # Type check all
bun run test         # Run all tests

# Individual apps
turbo dev --filter=web
turbo dev --filter=desktop
turbo dev --filter=rider
turbo dev --filter=driver

# Convex
cd packages/convex && bun run dev    # Start Convex dev server
cd packages/convex && bun run deploy # Deploy Convex to production
```

## Stack

- **Frontend (Web/Desktop)**: SvelteKit, shadcn-svelte, Tailwind v4, Lucide icons
- **Frontend (Mobile)**: Expo, React Native, NativeWind, react-native-maps
- **Desktop**: Tauri v2
- **Database/Backend**: Convex (real-time, serverless)
- **Auth**: WorkOS
- **Payments**: Khalti, eSewa, Fonepay, cash (@nabwin/paisa)
- **Hosting**: Cloudflare Workers (web)
- **Quality**: Biome (lint/format), Vitest (unit), Playwright (e2e)
- **CI/CD**: GitHub Actions
- **Package Manager**: bun
- **Monorepo**: Turborepo

## Conventions

- TypeScript strict mode everywhere
- Format with Biome (tabs, single quotes, no semicolons)
- Svelte components in `src/lib/components/`
- Use shadcn-svelte as base (web/desktop)
- Lucide for icons (lucide-svelte for web, lucide-react-native for mobile)
- Convex schema in `packages/convex/convex/schema.ts`
- Shared types in `packages/shared/src/types.ts`
- i18n: English + Nepali
- Dark mode + light mode support

## Convex Tables

drivers, riders, rides, rideRequests, driverLocations, pricing, ratings, vehicles, autoQrCodes, payments, zones

## Key Features

- Ride booking with map (react-native-maps)
- Nearest-driver matching: radius expansion 2km → 5km → 10km
- Live tracking via Convex real-time subscriptions
- QR instant ride: scan QR → book directly with that driver
- Multiple payment methods (Khalti, eSewa, Fonepay, cash)
- Driver online/offline toggle, ride requests, navigation deep link
- Admin panel: driver management, live rides map, pricing config
- Ride pooling (optional): share rides, split fare
