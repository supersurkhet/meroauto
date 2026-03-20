import { Redirect } from 'expo-router';

// WorkOS handles signup via the same OAuth flow as login
// Redirect to login screen which has the unified auth button
export default function SignupScreen() {
  return <Redirect href="/(auth)/login" />;
}
