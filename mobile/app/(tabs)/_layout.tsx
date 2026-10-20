import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Search, Globe, Bookmark, User } from "lucide-react-native";

// iOS-style colors
const COLORS = {
  primary: "#007AFF", // iOS blue
  inactive: "#8E8E93", // iOS gray
  background: "rgba(255, 255, 255, 0.85)",
  tabBarBorder: "rgba(0, 0, 0, 0.1)",
};

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "transparent" : COLORS.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: COLORS.tabBarBorder,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 64,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navSearch"),
          tabBarIcon: ({ color, focused }) => (
            <Search
              color={color}
              size={24}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: t("navNetwork"),
          tabBarIcon: ({ color, focused }) => (
            <Globe
              color={color}
              size={24}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("navSaved"),
          tabBarIcon: ({ color, focused }) => (
            <Bookmark
              color={color}
              size={24}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("navMe"),
          tabBarIcon: ({ color, focused }) => (
            <User
              color={color}
              size={24}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
    </Tabs>
  );
}
