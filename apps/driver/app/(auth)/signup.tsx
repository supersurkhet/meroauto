import { Redirect } from 'expo-router';

// Signup uses the same OAuth flow as login
// Redirect to login screen which has the unified auth button
export default function SignupScreen() {
  return <Redirect href="/(auth)/login" />;
}
