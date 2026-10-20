import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { I18nManager, View } from "react-native";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import i18n, { loadSavedLanguage, isRTL } from "@/lib/i18n";
import { useAppStore } from "@/lib/store/app";
import { LoadingScreen } from "@/components/LoadingScreen";
import "../global.css";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  anchor: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [i18nReady, setI18nReady] = useState(false);

  // Load saved language and configure RTL
  useEffect(() => {
    async function initLanguage() {
      const lang = await loadSavedLanguage();
      const shouldBeRTL = lang === "he";

      // Configure RTL if needed
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        I18nManager.allowRTL(shouldBeRTL);
      }

      // Update store
      useAppStore.getState().setLanguage(lang);
      setI18nReady(true);
    }

    initLanguage();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, i18nReady]);

  if (!fontsLoaded || !i18nReady) {
    return <LoadingScreen />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <View style={{ flex: 1, direction: isRTL() ? "rtl" : "ltr" }}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#FAFAF8" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="member/[id]"
              options={{
                headerShown: true,
                title: "",
                headerBackTitle: "",
              }}
            />
            <Stack.Screen
              name="search/[query]"
              options={{
                headerShown: true,
                title: "",
                headerBackTitle: "",
              }}
            />
            <Stack.Screen
              name="login"
              options={{
                presentation: "modal",
                headerShown: true,
                title: "",
              }}
            />
            <Stack.Screen
              name="register/chat"
              options={{
                headerShown: true,
                title: "",
                headerBackTitle: "",
              }}
            />
            <Stack.Screen
              name="register/form"
              options={{
                headerShown: true,
                title: "",
                headerBackTitle: "",
              }}
            />
          </Stack>
        </View>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
