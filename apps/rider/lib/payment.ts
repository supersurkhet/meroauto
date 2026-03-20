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

export async function initiatePayment(
  method: PaymentMethod,
  amount: number,
  rideId: string
): Promise<{ success: boolean; transactionId?: string }> {
  if (method === 'cash') {
    return { success: true, transactionId: `cash_${rideId}` };
  }

  // Stub for digital payment gateway integration
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const response = await fetch(`${apiUrl}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, amount, rideId }),
    });
    return await response.json();
  } catch {
    return { success: false };
  }
}
