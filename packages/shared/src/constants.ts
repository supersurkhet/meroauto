// Surkhet center coordinates
export const SURKHET_CENTER = {
	latitude: 28.6,
	longitude: 81.6167,
} as const

// Search radius expansion steps (km)
export const SEARCH_RADII = [2, 5, 10] as const

// Default pricing (NPR)
export const DEFAULT_PRICING = {
	baseFare: 50,
	perKmRate: 25,
	perMinuteRate: 3,
	minimumFare: 50,
	surgePriceMultiplier: 1.0,
} as const

// Auto-rickshaw capacity
export const MAX_PASSENGERS = 6
export const DEFAULT_CAPACITY = 3

// Ride request expiry (ms)
export const RIDE_REQUEST_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

// Driver location update interval (ms)
export const LOCATION_UPDATE_INTERVAL_MS = 5000 // 5 seconds

// App config
export const APP_NAME = 'MeroAuto'
export const APP_DOMAIN = 'auto.surkhet.app'
export const CURRENCY = 'NPR'
export const CURRENCY_SYMBOL = 'रू'
