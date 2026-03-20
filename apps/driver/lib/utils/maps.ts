import { Platform, Linking } from 'react-native';

export function openMapsNavigation(lat: number, lng: number, label?: string) {
  const encodedLabel = encodeURIComponent(label ?? 'Destination');

  if (Platform.OS === 'ios') {
    // Try Apple Maps first, fall back to Google Maps
    const appleMapsUrl = `maps://app?daddr=${lat},${lng}&dirflg=d`;
    const googleMapsUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;

    Linking.canOpenURL(googleMapsUrl).then((supported) => {
      if (supported) {
        Linking.openURL(googleMapsUrl);
      } else {
        Linking.openURL(appleMapsUrl);
      }
    });
  } else {
    // Android: Google Maps intent
    const url = `google.navigation:q=${lat},${lng}&mode=d`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedLabel}&travelmode=driving`
        );
      }
    });
  }
}
