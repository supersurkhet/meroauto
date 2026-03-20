/** Validation helpers for Convex mutations */

export function validateLatitude(lat: number): void {
  if (lat < -90 || lat > 90) throw new Error("Invalid latitude: must be -90 to 90");
}

export function validateLongitude(lng: number): void {
  if (lng < -180 || lng > 180) throw new Error("Invalid longitude: must be -180 to 180");
}

export function validateCoordinates(lat: number, lng: number): void {
  validateLatitude(lat);
  validateLongitude(lng);
}

export function validateNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} cannot be empty`);
  }
}

export function validatePhone(phone: string): void {
  // Nepal phone: 10 digits starting with 9
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  if (!/^(\+977)?9\d{9}$/.test(cleaned) && !/^9\d{9}$/.test(cleaned)) {
    throw new Error("Invalid phone number format (expected Nepal format: 9XXXXXXXXX)");
  }
}

export function validateRating(rating: number): void {
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
}

export function validateFare(fare: number): void {
  if (fare < 0) throw new Error("Fare cannot be negative");
  if (fare > 100000) throw new Error("Fare exceeds maximum (NPR 100,000)");
}

export function validateDistance(distance: number): void {
  if (distance < 0) throw new Error("Distance cannot be negative");
  if (distance > 500) throw new Error("Distance exceeds maximum (500km)");
}

export function validateSurgeMultiplier(multiplier: number): void {
  if (multiplier < 1 || multiplier > 5) {
    throw new Error("Surge multiplier must be between 1x and 5x");
  }
}

export function validateCapacity(capacity: number): void {
  if (capacity < 1 || capacity > 10) {
    throw new Error("Vehicle capacity must be between 1 and 10");
  }
}
