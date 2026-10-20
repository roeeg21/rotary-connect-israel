import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  User,
  Settings,
  Globe,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Bookmark,
} from "lucide-react-native";

import { useAppStore, useAccount, useSavedContacts } from "@/lib/store/app";
import { isRTL, toggleLanguage } from "@/lib/i18n";

// Rotary brand colors
const COLORS = {
  primary: "#003366",
  background: "#FAFAF8",
  text: "#1A1A1A",
  muted: "#737373",
  border: "#E5E5E3",
  card: "#FFFFFF",
  destructive: "#DC2626",
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const account = useAccount();
  const savedContacts = useSavedContacts();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const signOut = useAppStore((state) => state.signOut);
  const rtl = isRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  const handleToggleLanguage = async () => {
    const newLang = await toggleLanguage();
    setLanguage(newLang);
  };

  const handleSignOut = () => {
    Alert.alert(
      t("signOut"),
      language === "he"
        ? "האם אתה בטוח שברצונך להתנתק?"
        : "Are you sure you want to sign out?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("signOut"),
          style: "destructive",
          onPress: () => {
            signOut();
            router.replace("/");
          },
        },
      ]
    );
  };

  // Not signed in
  if (!account) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: `${COLORS.primary}15`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <User size={48} color={COLORS.primary} />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "600",
              color: COLORS.text,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {t("notSignedIn")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 32,
            }}
          >
            {t("notSignedInHint")}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 48,
              paddingVertical: 16,
              borderRadius: 12,
              marginBottom: 12,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
              {t("signIn")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register/chat")}
            style={{
              backgroundColor: COLORS.card,
              paddingHorizontal: 48,
              paddingVertical: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "600" }}>
              {t("createAccount")}
            </Text>
          </TouchableOpacity>

          {/* Language toggle */}
          <TouchableOpacity
            onPress={handleToggleLanguage}
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              marginTop: 32,
            }}
          >
            <Globe size={18} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, marginStart: 8, fontSize: 15 }}>
              {language === "he" ? "English" : "עברית"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Signed in - show profile
  const initials = `${account.firstName?.charAt(0) || ""}${account.lastName?.charAt(0) || ""}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Profile header */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 32,
            paddingBottom: 24,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 36, fontWeight: "bold" }}>
              {initials}
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.text }}>
            {account.firstName} {account.lastName}
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.muted, marginTop: 4 }}>
            {account.email}
          </Text>
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 20,
            paddingHorizontal: 40,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.text }}>
              {savedContacts.length}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.muted }}>{t("saved")}</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={{ paddingTop: 16 }}>
          {/* Edit Profile */}
          <TouchableOpacity
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${COLORS.primary}15`,
                alignItems: "center",
                justifyContent: "center",
                marginEnd: 16,
              }}
            >
              <Settings size={20} color={COLORS.primary} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, color: COLORS.text }}>
              {t("editProfile")}
            </Text>
            <ChevronIcon size={20} color={COLORS.muted} />
          </TouchableOpacity>

          {/* Saved contacts */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/saved")}
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${COLORS.primary}15`,
                alignItems: "center",
                justifyContent: "center",
                marginEnd: 16,
              }}
            >
              <Bookmark size={20} color={COLORS.primary} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, color: COLORS.text }}>
              {t("savedTitle")}
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.muted, marginEnd: 8 }}>
              {savedContacts.length}
            </Text>
            <ChevronIcon size={20} color={COLORS.muted} />
          </TouchableOpacity>

          {/* Language */}
          <TouchableOpacity
            onPress={handleToggleLanguage}
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${COLORS.primary}15`,
                alignItems: "center",
                justifyContent: "center",
                marginEnd: 16,
              }}
            >
              <Globe size={20} color={COLORS.primary} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, color: COLORS.text }}>
              {t("language")}
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.muted, marginEnd: 8 }}>
              {language === "he" ? "עברית" : "English"}
            </Text>
            <ChevronIcon size={20} color={COLORS.muted} />
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 20,
              marginTop: 16,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${COLORS.destructive}15`,
                alignItems: "center",
                justifyContent: "center",
                marginEnd: 16,
              }}
            >
              <LogOut size={20} color={COLORS.destructive} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, color: COLORS.destructive }}>
              {t("signOut")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: COLORS.muted, textAlign: "center" }}>
            {t("footerDistrict")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
