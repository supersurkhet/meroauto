import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useLocation, DEFAULT_LOCATION } from '@/lib/location';
import { useConvex } from '@/lib/convex';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/Button';
import { DriverCard } from '@/components/DriverCard';
import { BottomSheet } from '@/components/ui/BottomSheet';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.65;

type ScannedDriverInfo = {
  qrCode: string;
  driver: {
    _id: any;
    name: string;
    phone: string;
    rating: number;
    isOnline: boolean;
  };
  vehicle: {
    registrationNumber: string;
    color: string;
    model: string;
  } | null;
};

function ScanScreenInner() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const convex = useConvex();
  const { location } = useLocation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedDriver, setScannedDriver] = useState<ScannedDriverInfo | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [isLooking, setIsLooking] = useState(false);
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (isLooking || showSheet) return;

      // QR code format: "MA-XXXXXXXX" or JSON with qrCode field
      let qrCode = '';
      try {
        const parsed = JSON.parse(data);
        qrCode = parsed.qrCode ?? parsed.code ?? '';
      } catch {
        // Plain text QR code
        if (data.startsWith('MA-')) {
          qrCode = data;
        }
      }

      if (!qrCode) return;

      setIsLooking(true);
      try {
        // Real Convex lookup
        const result = await convex.query(api.qrCodes.lookupQrCode, { qrCode });

        if (!result) {
          Alert.alert(t('qr.invalidQr'), 'This QR code is not registered or is inactive.');
          setIsLooking(false);
          return;
        }

        if (!result.driver.isOnline) {
          Alert.alert(t('common.error'), 'This driver is currently offline.');
          setIsLooking(false);
          return;
        }

        setScannedDriver({
          qrCode,
          driver: result.driver,
          vehicle: result.vehicle,
        });
        setShowSheet(true);
      } catch (err: any) {
        Alert.alert(t('common.error'), err.message ?? 'Failed to look up QR code');
      } finally {
        setIsLooking(false);
      }
    },
    [isLooking, showSheet, convex, t]
  );

  const handleBookDriver = () => {
    if (!scannedDriver) return;
    setShowSheet(false);

    const currentLocation2 = location ?? DEFAULT_LOCATION;
    // Navigate to booking confirm with QR data
    router.push({
      pathname: '/booking',
      params: {
        qrCode: scannedDriver.qrCode,
        driverId: String(scannedDriver.driver._id),
        driverName: scannedDriver.driver.name,
        skipMatching: 'true',
      },
    });
  };

  if (!permission?.granted) {
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: c.background, paddingTop: insets.top },
        ]}
      >
        <View style={[styles.permissionIcon, { backgroundColor: c.primaryLight }]}>
          <Ionicons name="camera" size={48} color={c.primary} />
        </View>
        <Text style={[styles.permissionTitle, { color: c.text }]}>
          {t('qr.cameraPermission')}
        </Text>
        <Button title={t('qr.grantPermission')} onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={showSheet || isLooking ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>{t('qr.title')}</Text>
        <Text style={styles.subtitle}>{t('qr.subtitle')}</Text>

        <View style={styles.scannerFrame}>
          {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => (
            <View
              key={corner}
              style={[
                styles.corner,
                corner.includes('top') ? { top: -2 } : { bottom: -2 },
                corner.includes('Left') ? { left: -2 } : { right: -2 },
                {
                  borderColor: '#10B981',
                  borderTopWidth: corner.includes('top') ? 3 : 0,
                  borderBottomWidth: corner.includes('bottom') ? 3 : 0,
                  borderLeftWidth: corner.includes('Left') ? 3 : 0,
                  borderRightWidth: corner.includes('Right') ? 3 : 0,
                },
              ]}
            />
          ))}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCAN_SIZE - 4],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {isLooking && (
          <Text style={styles.lookingText}>Looking up driver...</Text>
        )}
      </View>

      <BottomSheet visible={showSheet} onClose={() => setShowSheet(false)}>
        {scannedDriver && (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>{t('qr.driverInfo')}</Text>
            <DriverCard
              name={scannedDriver.driver.name}
              rating={scannedDriver.driver.rating}
              vehicleNumber={scannedDriver.vehicle?.registrationNumber ?? '—'}
              vehicleColor={scannedDriver.vehicle?.color}
            />
            <Button title={t('qr.bookThisAuto')} onPress={handleBookDriver} size="lg" />
            <Button
              title={t('qr.scanAgain')}
              onPress={() => {
                setShowSheet(false);
                setScannedDriver(null);
              }}
              variant="ghost"
            />
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

export default function ScanScreen() {
  return (
    <ScreenErrorBoundary>
      <ScanScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 20 },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  scannerFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    marginTop: 40,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  corner: { position: 'absolute', width: 30, height: 30 },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  lookingText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 24,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permissionTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  sheetContent: { gap: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
});
