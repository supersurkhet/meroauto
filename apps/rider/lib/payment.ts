import * as WebBrowser from 'expo-web-browser';

export type PaymentMethod = 'cash' | 'khalti' | 'esewa' | 'fonepay';

export type PaymentInfo = {
  method: PaymentMethod;
  label: string;
  icon: string;
  color: string;
};

export const PAYMENT_METHODS: PaymentInfo[] = [
  { method: 'cash', label: 'payment.cash', icon: 'cash', color: '#10B981' },
  { method: 'khalti', label: 'payment.khalti', icon: 'wallet', color: '#5C2D91' },
  { method: 'esewa', label: 'payment.esewa', icon: 'phone-portrait', color: '#60BB46' },
  { method: 'fonepay', label: 'payment.fonepay', icon: 'card', color: '#E31E24' },
];

export type PaymentResult = {
  success: boolean;
  transactionId?: string;
  method: PaymentMethod;
  error?: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const RETURN_URL = process.env.EXPO_PUBLIC_PAYMENT_RETURN_URL ?? 'meroauto-rider://payment/callback';

/**
 * Initiate a digital payment via our backend.
 * The backend uses @nabwin/paisa (EsewaClient / KhaltiClient) to generate
 * payment URLs with HMAC signatures. We open the URL in-app browser.
 *
 * Flow: App → Backend (paisa SDK) → Gateway URL → User pays → Redirect back
 */
async function payViaGateway(
  method: 'khalti' | 'esewa' | 'fonepay',
  amount: number,
  rideId: string,
  riderInfo?: { name?: string; email?: string; phone?: string },
): Promise<PaymentResult> {
  try {
    const response = await fetch(`${API_URL}/payments/${method}/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        rideId,
        returnUrl: RETURN_URL,
        riderName: riderInfo?.name,
        riderEmail: riderInfo?.email,
        riderPhone: riderInfo?.phone,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Payment initiation failed');
      return { success: false, method, error: text };
    }

    const data = await response.json();

    if (!data.paymentUrl) {
      return { success: false, method, error: 'No payment URL received' };
    }

    // Open gateway payment page in in-app browser
    const result = await WebBrowser.openAuthSessionAsync(data.paymentUrl, RETURN_URL);

    if (result.type === 'success' && result.url) {
      // Parse callback for transaction verification
      const url = new URL(result.url);
      const txnId = url.searchParams.get('transaction_id') ??
        url.searchParams.get('pidx') ??
        url.searchParams.get('refId') ??
        data.transactionId;

      return {
        success: true,
        transactionId: txnId ?? `${method}_${rideId}_${Date.now()}`,
        method,
      };
    }

    // User cancelled or dismissed
    return { success: false, method, error: 'Payment cancelled' };
  } catch (err: any) {
    return {
      success: false,
      method,
      error: err.message ?? `${method} payment failed`,
    };
  }
}

/**
 * Main payment dispatcher.
 * Cash: instant success.
 * Digital (Khalti/eSewa/Fonepay): backend-initiated via @nabwin/paisa SDK.
 */
export async function initiatePayment(
  method: PaymentMethod,
  amount: number,
  rideId: string,
  riderInfo?: { name?: string; email?: string; phone?: string },
): Promise<PaymentResult> {
  if (method === 'cash') {
    return { success: true, transactionId: `cash_${rideId}_${Date.now()}`, method: 'cash' };
  }
  return payViaGateway(method, amount, rideId, riderInfo);
}
