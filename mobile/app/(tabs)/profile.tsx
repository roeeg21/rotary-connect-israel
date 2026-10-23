import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

// iOS-style colors
const COLORS = {
  primary: "#007AFF",
  background: "#F2F2F7",
  secondaryBackground: "#FFFFFF",
  label: "#000000",
  secondaryLabel: "#3C3C43",
  tertiaryLabel: "#8E8E93",
  separator: "rgba(60, 60, 67, 0.12)",
  fill: "rgba(120, 120, 128, 0.12)",
  destructive: "#FF3B30",
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
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.avatarLarge}>
            <User size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t("notSignedIn")}</Text>
          <Text style={styles.emptyHint}>{t("notSignedInHint")}</Text>

          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{t("signIn")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register/chat")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>{t("createAccount")}</Text>
          </TouchableOpacity>

          {/* Language toggle */}
          <TouchableOpacity
            onPress={handleToggleLanguage}
            style={[styles.languageToggle, { flexDirection: rtl ? "row-reverse" : "row" }]}
          >
            <Globe size={18} color={COLORS.tertiaryLabel} />
            <Text style={styles.languageText}>
              {language === "he" ? "English" : "עברית"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Signed in - show profile
  const initials = `${account.firstName?.charAt(0) || ""}${account.lastName?.charAt(0) || ""}`;

  const MenuItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    destructive = false,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value?: string;
    onPress?: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, { flexDirection: rtl ? "row-reverse" : "row" }]}
      activeOpacity={0.6}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: destructive ? `${COLORS.destructive}15` : `${COLORS.primary}15` },
        ]}
      >
        <Icon size={20} color={destructive ? COLORS.destructive : COLORS.primary} />
      </View>
      <Text style={[styles.menuLabel, destructive && { color: COLORS.destructive }]}>
        {label}
      </Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {onPress && !destructive && <ChevronIcon size={20} color={COLORS.tertiaryLabel} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>
            {account.firstName} {account.lastName}
          </Text>
          <Text style={styles.email}>{account.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{savedContacts.length}</Text>
            <Text style={styles.statLabel}>{t("saved")}</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={Settings}
            label={t("editProfile")}
            onPress={() => {}}
          />
          <MenuItem
            icon={Bookmark}
            label={t("savedTitle")}
            value={savedContacts.length.toString()}
            onPress={() => router.push("/(tabs)/saved")}
          />
          <MenuItem
            icon={Globe}
            label={t("language")}
            value={language === "he" ? "עברית" : "English"}
            onPress={handleToggleLanguage}
          />
        </View>

        {/* Sign out */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={LogOut}
            label={t("signOut")}
            onPress={handleSignOut}
            destructive
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("footerDistrict")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.label,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: COLORS.secondaryBackground,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.label,
    fontSize: 16,
    fontWeight: "600",
  },
  languageToggle: {
    alignItems: "center",
    marginTop: 32,
    gap: 8,
  },
  languageText: {
    color: COLORS.tertiaryLabel,
    fontSize: 15,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.label,
  },
  email: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
    marginTop: 4,
  },
  stats: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.label,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 4,
  },
  menuSection: {
    marginTop: 24,
    backgroundColor: COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
  },
  menuItem: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 17,
    color: COLORS.label,
  },
  menuValue: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
    marginEnd: 8,
  },
  footer: {
    paddingTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
    textAlign: "center",
  },
});
