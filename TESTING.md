# Testing Checklist — MeroAuto

Every agent MUST update this file with verification entries for every feature they implement.

## Convex Backend
- [ ] `createRider` mutation — creates rider record with userId, returns id
- [ ] `createDriver` mutation — creates driver record, isApproved defaults to false
- [ ] `updateDriverLocation` mutation — updates lat/lng/heading for driver
- [ ] `getNearbyDrivers` query — returns online drivers within radius, sorted by distance
- [ ] `createRideRequest` mutation — creates request with status "pending"
- [ ] `matchDriver` scheduled action — expands radius 2km→5km→10km, matches nearest online driver
- [ ] `acceptRideRequest` mutation — creates ride record, updates request to "accepted"
- [ ] `startRide` mutation — updates ride status to "in_progress"
- [ ] `completeRide` mutation — updates ride status to "completed", records fare
- [ ] `estimateFare` query — returns correct NPR amount based on distance + pricing config
- [ ] `submitRating` mutation — creates rating, updates driver average
- [ ] `approveDriver` mutation — sets isApproved to true
- [ ] `suspendDriver` mutation — sets isSuspended to true

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
