import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, ChevronRight, ChevronLeft, Search } from "lucide-react-native";

import { useAppStore, useSavedContacts, useAccount } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";
import { api } from "@/lib/api/client";

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
};

export default function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const savedIds = useSavedContacts();
  const language = useAppStore((state) => state.language);
  const account = useAccount();
  const rtl = isRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  // Fetch saved members data
  const { data: savedMembers = [], isLoading } = useQuery({
    queryKey: ["members", savedIds],
    queryFn: () => api.getMembers(savedIds),
    enabled: savedIds.length > 0 && !!account,
  });

  const handleMemberPress = (memberId: string) => {
    router.push(`/member/${memberId}`);
  };

  // Not signed in
  if (!account) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconContainer}>
            <Bookmark size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t("notSignedIn")}</Text>
          <Text style={styles.emptyHint}>{t("notSignedInHint")}</Text>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{t("signIn")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (savedIds.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: rtl ? "right" : "left" }]}>
            {t("savedTitle")}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.iconContainer}>
            <Bookmark size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t("savedEmpty")}</Text>
          <Text style={styles.emptyHint}>{t("savedEmptyHint")}</Text>
          <TouchableOpacity
            onPress={() => router.push("/")}
            style={[styles.primaryButton, { flexDirection: rtl ? "row-reverse" : "row" }]}
          >
            <Search size={18} color="#FFFFFF" />
            <Text style={[styles.primaryButtonText, { marginStart: 8 }]}>
              {t("startSearching")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: rtl ? "right" : "left" }]}>
            {t("savedTitle")}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Saved contacts list
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: rtl ? "right" : "left" }]}>
            {t("savedTitle")}
          </Text>
          <Text style={[styles.subtitle, { textAlign: rtl ? "right" : "left" }]}>
            {savedMembers.length} {t("people")}
          </Text>
        </View>

        <View style={styles.list}>
          {savedMembers.map((member) => {
            const name = language === "he" ? member.name.he : member.name.en;
            const profession = language === "he"
              ? member.profession.he
              : member.profession.en;

            return (
              <TouchableOpacity
                key={member.id}
                onPress={() => handleMemberPress(member.id)}
                style={[styles.memberCard, { flexDirection: rtl ? "row-reverse" : "row" }]}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { textAlign: rtl ? "right" : "left" }]}>
                    {name}
                  </Text>
                  <Text style={[styles.memberProfession, { textAlign: rtl ? "right" : "left" }]}>
                    {profession}
                  </Text>
                </View>
                <ChevronIcon size={20} color={COLORS.tertiaryLabel} />
              </TouchableOpacity>
            );
          })}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: COLORS.label,
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
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
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  memberCard: {
    alignItems: "center",
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.fill,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 16,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.label,
  },
  memberProfession: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
});
