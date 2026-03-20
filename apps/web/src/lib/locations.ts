// Surkhet Valley locations with real coordinates
export const surkhetLocations = [
	{ name: 'Birendranagar Chowk', coords: [28.6083, 81.6368] as [number, number], type: 'hub' as const, description: 'Central hub - highest driver availability' },
	{ name: 'Mangalgadhi', coords: [28.5920, 81.6280] as [number, number], type: 'active' as const, description: 'Residential area, high morning demand' },
	{ name: 'Itram', coords: [28.6200, 81.6500] as [number, number], type: 'active' as const, description: 'Market area, busy throughout the day' },
	{ name: 'Latikoili', coords: [28.5830, 81.6400] as [number, number], type: 'active' as const, description: 'Southern residential zone' },
	{ name: 'Airport Road', coords: [28.5860, 81.6550] as [number, number], type: 'active' as const, description: 'Surkhet Airport area' },
	{ name: 'Ghatgau', coords: [28.6150, 81.6150] as [number, number], type: 'active' as const, description: 'Western suburbs' },
	{ name: 'Maintada', coords: [28.6250, 81.6600] as [number, number], type: 'active' as const, description: 'Eastern area near hospital' },
	{ name: 'Mehelkuna', coords: [28.6300, 81.6100] as [number, number], type: 'active' as const, description: 'Northwest area' },
	{ name: 'Dullu Road', coords: [28.5750, 81.6200] as [number, number], type: 'active' as const, description: 'South highway connector' },
	{ name: 'Chhinchu', coords: [28.6400, 81.6700] as [number, number], type: 'coming-soon' as const, description: 'Planned Q3 2026 expansion' },
	{ name: 'Babiyachaur', coords: [28.5600, 81.6100] as [number, number], type: 'coming-soon' as const, description: 'Planned Q4 2026 expansion' },
] as const;

export const surkhetZones = [
	{ name: 'Zone A - Birendranagar Core', center: [28.6083, 81.6368] as [number, number], radius: 1500, color: '#10b981', fillOpacity: 0.15 },
	{ name: 'Zone B - Extended', center: [28.6050, 81.6350] as [number, number], radius: 3000, color: '#10b981', fillOpacity: 0.08 },
	{ name: 'Zone C - Surkhet Valley', center: [28.6030, 81.6330] as [number, number], radius: 5500, color: '#10b981', fillOpacity: 0.04 },
];

// Haversine distance calculation between two coordinates
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371; // Earth radius in km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function toRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

// Calculate fare based on distance and zone
export function calculateFare(distanceKm: number, zone: 'A' | 'B' | 'C' = 'A'): {
	baseFare: number;
	distanceFare: number;
	total: number;
	perKm: number;
} {
	const rates = {
		A: { base: 50, perKm: 25 },
		B: { base: 60, perKm: 30 },
		C: { base: 80, perKm: 35 },
	};

	const rate = rates[zone];
	const chargeableDistance = Math.max(0, distanceKm - 1); // First 1km included in base
	const distanceFare = Math.round(chargeableDistance * rate.perKm);

	return {
		baseFare: rate.base,
		distanceFare,
		total: rate.base + distanceFare,
		perKm: rate.perKm,
	};
}

// Determine zone from distance to center
export function getZone(distanceFromCenter: number): 'A' | 'B' | 'C' {
	if (distanceFromCenter <= 1.5) return 'A';
	if (distanceFromCenter <= 3) return 'B';
	return 'C';
}

// Road distance multiplier (roads are not straight lines)
export function estimateRoadDistance(straightLineKm: number): number {
	return straightLineKm * 1.35; // Average road factor for small city
}
