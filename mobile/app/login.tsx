import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Mail, Globe } from "lucide-react-native";
import * as AppleAuthentication from "expo-apple-authentication";

import { useAppStore } from "@/lib/store/app";
import { isRTL, toggleLanguage } from "@/lib/i18n";
import {
  signInWithApple,
  useGoogleAuth,
  handleGoogleSignIn,
  isAppleSignInAvailable,
  type AuthUser,
} from "@/lib/auth/social";

// Rotary brand colors
const COLORS = {
  primary: "#003366",
  background: "#FAFAF8",
  text: "#1A1A1A",
  muted: "#737373",
  border: "#E5E5E3",
  card: "#FFFFFF",
  apple: "#000000",
  google: "#4285F4",
};

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const signIn = useAppStore((state) => state.signIn);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const rtl = isRTL();

  // Google auth hook
  const [googleRequest, googleResponse, promptGoogleAsync] = useGoogleAuth();

  // Check Apple Sign-In availability
  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (googleResponse?.type === "success" && googleResponse.authentication?.accessToken) {
      handleGoogleAuth(googleResponse.authentication.accessToken);
    }
  }, [googleResponse]);

  const handleAuthSuccess = (user: AuthUser) => {
    signIn({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      club: user.club,
      photo: user.photo,
      onboarded: user.onboarded,
    });

    if (user.onboarded) {
      router.replace("/");
    } else {
      // New user needs to complete registration
      router.push("/register/chat");
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithApple();
    setIsLoading(false);

    if (result.success && result.user) {
      handleAuthSuccess(result.user);
    } else if (result.error && result.error !== "cancelled") {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he"
          ? "ההתחברות עם Apple נכשלה"
          : "Apple Sign-In failed"
      );
    }
  };

  const handleGoogleAuth = async (accessToken: string) => {
    setIsLoading(true);
    const result = await handleGoogleSignIn(accessToken);
    setIsLoading(false);

    if (result.success && result.user) {
      handleAuthSuccess(result.user);
    } else if (result.error) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he"
          ? "ההתחברות עם Google נכשלה"
          : "Google Sign-In failed"
      );
    }
  };

  const handleGoogleSignInPress = () => {
    promptGoogleAsync();
  };

  const handleLogin = async () => {
    if (!emailOrPhone.trim()) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he"
          ? "נא להזין דוא״ל או מספר טלפון"
          : "Please enter email or phone number"
      );
      return;
    }

    setIsLoading(true);

    // In production, send OTP via API
    // For demo, simulate login
    setTimeout(() => {
      signIn({
        firstName: "Demo",
        lastName: "User",
        email: emailOrPhone.includes("@") ? emailOrPhone : `${emailOrPhone}@demo.com`,
        club: "tel-aviv",
        onboarded: true,
      });
      setIsLoading(false);
      router.replace("/");
    }, 1000);
  };

  const handleRegister = () => {
    router.push("/register/chat");
  };

  const handleToggleLanguage = async () => {
    const newLang = await toggleLanguage();
    setLanguage(newLang);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("signIn"),
          headerRight: () => (
            <TouchableOpacity onPress={handleToggleLanguage}>
              <Globe size={22} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: COLORS.primary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 32 }}>
                R
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.text }}>
              {t("appNameFull")}
            </Text>
          </View>

          {/* Social Sign-In Buttons */}
          <View style={{ gap: 12, marginBottom: 24 }}>
            {/* Apple Sign-In (iOS only) */}
            {appleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={{ height: 56 }}
                onPress={handleAppleSignIn}
              />
            )}

            {/* Google Sign-In */}
            <TouchableOpacity
              onPress={handleGoogleSignInPress}
              disabled={isLoading || !googleRequest}
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.card,
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                gap: 12,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {/* Google "G" icon */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: COLORS.google,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 14 }}>
                  G
                </Text>
              </View>
              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "600" }}>
                {language === "he" ? "התחברות עם Google" : "Sign in with Google"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            <Text style={{ marginHorizontal: 16, color: COLORS.muted }}>
              {language === "he" ? "או" : "or"}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          </View>

          {/* Email/Phone Input */}
          <View
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              backgroundColor: COLORS.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingHorizontal: 16,
              height: 56,
              marginBottom: 16,
            }}
          >
            <Mail size={20} color={COLORS.muted} />
            <TextInput
              style={{
                flex: 1,
                marginHorizontal: 12,
                fontSize: 16,
                color: COLORS.text,
                textAlign: rtl ? "right" : "left",
              }}
              placeholder={
                language === "he"
                  ? "דוא״ל או מספר טלפון"
                  : "Email or phone number"
              }
              placeholderTextColor={COLORS.muted}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Login button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={{
              backgroundColor: COLORS.primary,
              height: 56,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
                {t("signIn")}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 24,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            <Text style={{ marginHorizontal: 16, color: COLORS.muted }}>
              {language === "he" ? "חדשים ברוטרי?" : "New to Rotary?"}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          </View>

          {/* Register button */}
          <TouchableOpacity
            onPress={handleRegister}
            style={{
              backgroundColor: COLORS.card,
              height: 56,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "600" }}>
              {t("createAccount")}
            </Text>
          </TouchableOpacity>

          {/* Guest info */}
          <Text
            style={{
              fontSize: 13,
              color: COLORS.muted,
              textAlign: "center",
              marginTop: 24,
              lineHeight: 20,
            }}
          >
            {t("guestOneSearch")}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
