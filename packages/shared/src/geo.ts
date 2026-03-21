const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180
}

/** Haversine distance between two lat/lng points in kilometers */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const dLat = toRadians(lat2 - lat1)
	const dLng = toRadians(lng2 - lng1)
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
	return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/** Estimate travel duration in minutes based on distance (assumes ~20km/h avg speed) */
export function estimateDuration(distanceKm: number): number {
	return Math.round((distanceKm / 20) * 60)
}
