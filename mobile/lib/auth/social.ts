import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// Configure web browser for auth
WebBrowser.maybeCompleteAuthSession();

// API base URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Google OAuth client IDs - you'll need to replace these with your own
const GOOGLE_CONFIG = {
  iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
  androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
  webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
};

export type AuthUser = {
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
  club: string;
  onboarded: boolean;
  provider: "apple" | "google";
};

export type AuthResult = {
  success: boolean;
  user?: AuthUser;
  error?: string;
};

/**
 * Sign in with Apple
 */
export async function signInWithApple(): Promise<AuthResult> {
  try {
    // Check if Apple auth is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: "Apple Sign-In is not available on this device",
      };
    }

    // Request Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Apple only provides email and name on first sign-in
    // For subsequent sign-ins, we only get the user ID
    const { user: providerId, email, fullName } = credential;

    if (!providerId) {
      return {
        success: false,
        error: "Failed to get Apple user ID",
      };
    }

    // Send to backend
    const response = await fetch(`${API_URL}/api/auth/social`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "apple",
        providerId,
        email: email || `${providerId}@privaterelay.appleid.com`,
        firstName: fullName?.givenName || undefined,
        lastName: fullName?.familyName || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Authentication failed",
      };
    }

    const data = await response.json();
    return {
      success: true,
      user: data.user,
    };
  } catch (error: any) {
    // User cancelled
    if (error.code === "ERR_REQUEST_CANCELED") {
      return {
        success: false,
        error: "cancelled",
      };
    }

    console.error("Apple Sign-In error:", error);
    return {
      success: false,
      error: error.message || "Apple Sign-In failed",
    };
  }
}

/**
 * Hook for Google Sign-In
 * Usage:
 *   const [request, response, promptAsync] = useGoogleAuth();
 *
 *   useEffect(() => {
 *     if (response?.type === 'success') {
 *       handleGoogleResponse(response);
 *     }
 *   }, [response]);
 *
 *   const handleSignIn = () => promptAsync();
 */
export function useGoogleAuth() {
  return Google.useAuthRequest({
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    webClientId: GOOGLE_CONFIG.webClientId,
    scopes: ["profile", "email"],
  });
}

/**
 * Exchange Google auth response for user profile
 */
export async function handleGoogleSignIn(
  accessToken: string
): Promise<AuthResult> {
  try {
    // Fetch user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/userinfo/v2/me",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!userInfoResponse.ok) {
      return {
        success: false,
        error: "Failed to get Google user info",
      };
    }

    const userInfo = await userInfoResponse.json();

    // Send to backend
    const response = await fetch(`${API_URL}/api/auth/social`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "google",
        providerId: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        photo: userInfo.picture,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Authentication failed",
      };
    }

    const data = await response.json();
    return {
      success: true,
      user: data.user,
    };
  } catch (error: any) {
    console.error("Google Sign-In error:", error);
    return {
      success: false,
      error: error.message || "Google Sign-In failed",
    };
  }
}

/**
 * Check if Apple Sign-In is available (iOS only)
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") {
    return false;
  }
  return AppleAuthentication.isAvailableAsync();
}
