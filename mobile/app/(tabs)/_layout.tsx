import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { Search, Globe, Bookmark, User } from "lucide-react-native";

// Rotary brand colors
const COLORS = {
  primary: "#003366",
  inactive: "#737373",
  background: "#FFFFFF",
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
          backgroundColor: COLORS.background,
          borderTopColor: "#E5E5E3",
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navSearch"),
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: t("navNetwork"),
          tabBarIcon: ({ color, size }) => (
            <Globe color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("navSaved"),
          tabBarIcon: ({ color, size }) => (
            <Bookmark color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("navMe"),
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
