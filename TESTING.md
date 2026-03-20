# Testing Checklist — MeroAuto

Every agent MUST update this file with verification entries for every feature they implement.

## Convex Backend
- [x] `createRider` mutation — creates rider record with userId, returns id (users.ts)
- [x] `createDriver` mutation — creates driver record, isApproved defaults to false (users.ts)
- [x] `updateDriverLocation` mutation — updates lat/lng/heading for driver (locations.ts)
- [x] `getNearbyDrivers` query — returns online drivers within radius, sorted by distance (locations.ts)
- [x] `createRideRequest` mutation — creates request with status "pending", schedules matching (rideRequests.ts)
- [x] `matchDriver` scheduled action — expands radius 2km→5km→10km, matches nearest online driver (matching.ts)
- [x] `acceptRideRequest` mutation — creates ride record, updates request to "accepted" (rides.ts)
- [x] `startRide` mutation — updates ride status to "in_progress" (rides.ts)
- [x] `completeRide` mutation — updates ride status to "completed", records fare + driver stats (rides.ts)
- [x] `estimateFare` query — returns correct NPR amount based on distance + zone pricing (pricing.ts)
- [x] `submitRating` mutation — creates rating, updates driver average (ratings.ts)
- [x] `approveDriver` mutation — sets isApproved to true (admin.ts)
- [x] `suspendDriver` mutation — sets isSuspended to true, sets isOnline to false (admin.ts)
- [x] `cancelRideRequest` mutation — cancels pending/matched requests, releases driver (rideRequests.ts)
- [x] `cancelRide` mutation — cancels active ride with reason (rides.ts)
- [x] `driverArrived` mutation — transitions ride to driver_arrived (rides.ts)
- [x] `createPayment` mutation — records payment, cash auto-completes (payments.ts)
- [x] `completePayment` mutation — marks digital payment as completed (payments.ts)
- [x] `getDashboardStats` query — rides/drivers/riders/revenue stats (admin.ts)
- [x] `getRevenueReport` query — revenue by date range and payment method (admin.ts)
- [x] `getActiveRides` query — enriched active rides with driver locations (admin.ts)
- [x] `createZone` / `updateZone` mutations — zone CRUD (zones.ts)
- [x] `getZoneForLocation` query — finds zone containing lat/lng (zones.ts)
- [x] `lookupQrCode` query — QR → driver + vehicle info (qrCodes.ts)
- [x] `registerVehicle` mutation — vehicle registration (vehicles.ts)
- [x] `seedDefaults` mutation — seeds Surkhet zones + default pricing (seed.ts)
- [x] `haversineDistance` utility — shared geo calculation (packages/shared/src/geo.ts)

### Phase 2 — Enhanced Features
- [x] `verifyOtp` mutation — checks 4-digit OTP before transitioning ride to in_progress (rides.ts)
- [x] `autoExpireRequest` scheduled — auto-expires ride requests after 5min (rideRequests.ts)
- [x] OTP generation — 4-digit OTP created when ride is accepted (rides.ts)
- [x] `subscribeDriverLocation` query — optimized single-driver location for rider tracking (locations.ts)
- [x] `subscribeActiveRides` query — all active rides with driver locations for admin map (locations.ts)
- [x] `createQrRideRequest` mutation — QR scan → skip matching → create ride directly (qrCodes.ts)
- [x] `getDriverStats` query — today's rides/earnings, vehicle, QR code (driverStats.ts)
- [x] `getDriverEarnings` query — daily/weekly/monthly with chart data + payment breakdown (driverStats.ts)
- [x] Load-balanced matching — prefers drivers with fewer rides today (matching.ts)
- [x] Payment webhook HTTP routes — POST /payment/callback + /payment/khalti/verify (http.ts)
- [x] `processSuccess` / `processFailed` internal mutations for webhook callbacks (paymentWebhook.ts)
- [x] `savePushToken` mutation — upsert push notification token (pushTokens.ts)
- [x] `getPushTokens` query — get all tokens for a user (pushTokens.ts)
- [x] `removePushToken` mutation — remove token on logout (pushTokens.ts)
- [x] `pushTokens` table added to schema with indexes (schema.ts)
- [x] `otp` + `isQrRide` fields added to rides schema (schema.ts)

## Auth
- [ ] Rider login — WorkOS redirect, returns to app authenticated
- [ ] Rider signup — creates account, creates rider record in Convex
- [ ] Driver login — WorkOS redirect, returns to app authenticated
- [ ] Driver signup — creates account, creates driver record (pending approval)
- [ ] Logout — clears session, redirects to login screen
- [ ] Protected routes — unauthenticated user redirected to login

## Rider App
- [ ] Home screen — map centered on Surkhet, search bar visible
- [ ] Location search — type address, see suggestions, select
- [ ] Pickup/dropoff selection — draggable pins on map
- [ ] Fare estimate — shows NPR amount after locations selected
- [ ] Book ride — tap "Book Auto" → creates ride request
- [ ] Searching animation — pulsing radius while matching
- [ ] Driver matched — driver card slides up with name, vehicle, rating
- [ ] Live tracking — auto-rickshaw marker moves on map in real-time
- [ ] Ride completion — fare summary, rating prompt
- [ ] QR scan — camera opens, scans QR, shows driver info, one-tap book
- [ ] Payment method — can select cash/Khalti/eSewa/Fonepay
- [ ] Ride history — list of past rides with fare and date
- [ ] Profile — name, phone, language toggle, dark mode toggle
- [ ] Nepali language — all strings display correctly in Nepali

## Driver App
- [ ] Home screen — status toggle (online/offline), today's stats
- [ ] Go online — toggle to online, location broadcasting starts
- [ ] Ride request — slide-up card with pickup, fare, accept/reject
- [ ] Accept ride — creates active ride, shows navigation
- [ ] Navigate button — deep links to Google Maps/Apple Maps
- [ ] OTP input — 4-digit input, verifies against ride OTP
- [ ] Complete ride — marks ride as completed, updates earnings
- [ ] Earnings tab — daily/weekly/monthly earnings with chart
- [ ] Profile — QR code display, vehicle details, settings
- [ ] Nepali language — all strings display correctly in Nepali
- [ ] Dark mode — all screens render correctly in dark mode

## Admin Desktop
- [ ] Dashboard — stat cards (active rides, online drivers, revenue, riders)
- [ ] Driver list — table with filters, search, status badges
- [ ] Approve driver — click approve → driver status changes to approved
- [ ] Suspend driver — click suspend → driver status changes to suspended
- [ ] Live map — auto-rickshaw markers for active rides on Surkhet map
- [ ] Pricing config — edit base fare, per km, per minute, save
- [ ] Zone management — create/edit zones on map
- [ ] Analytics — revenue chart, rides per day chart

## Web Landing Page
- [ ] Hero section — "MeroAuto" heading, tagline, CTA buttons
- [ ] Features section — 4 feature cards with icons
- [ ] How it works — 3-step flow
- [ ] Footer — links, social, address
- [ ] Responsive — looks good on mobile, tablet, desktop
- [ ] Meta tags — correct title, description, OG image
- [ ] Dark mode — landing page supports dark mode

## Payments
- [ ] Cash payment — records payment as cash, marks completed
- [ ] Khalti — redirects to Khalti gateway, returns with confirmation
- [ ] eSewa — redirects to eSewa gateway, returns with confirmation
- [ ] Fonepay — redirects to Fonepay gateway, returns with confirmation

## Push Notifications
- [ ] Driver receives notification on new ride request
- [ ] Rider receives notification when driver accepts
- [ ] Rider receives notification when driver arrives
- [ ] Both receive notification on ride completion
