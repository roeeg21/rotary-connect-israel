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
import { Building2, MapPin, Briefcase, Lightbulb } from "lucide-react-native";

import { useAppStore } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";
import { api } from "@/lib/api/client";
import type { BrowseCategory } from "@/lib/types";

// iOS-style colors
const COLORS = {
  primary: "#007AFF",
  secondary: "#5856D6",
  background: "#F2F2F7",
  secondaryBackground: "#FFFFFF",
  label: "#000000",
  secondaryLabel: "#3C3C43",
  tertiaryLabel: "#8E8E93",
  separator: "rgba(60, 60, 67, 0.12)",
  fill: "rgba(120, 120, 128, 0.12)",
};

const CATEGORY_ICONS = {
  industries: Building2,
  locations: MapPin,
  professions: Briefcase,
  expertise: Lightbulb,
};

export default function NetworkScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const rtl = isRTL();

  // Fetch categories from API
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  const handleCategoryPress = (value: string) => {
    router.push(`/search/${encodeURIComponent(value)}`);
  };

  const CategorySection = ({
    title,
    icon: Icon,
    items,
    titleKey,
  }: {
    title: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    items: BrowseCategory[];
    titleKey: string;
  }) => (
    <View style={styles.categorySection}>
      <View style={[styles.categoryHeader, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <Icon size={20} color={COLORS.primary} />
        <Text style={styles.categoryTitle}>{t(titleKey)}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryItems}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() =>
              handleCategoryPress(language === "he" ? item.name.he : item.name.en)
            }
            style={styles.categoryCard}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryName, { textAlign: rtl ? "right" : "left" }]}>
              {language === "he" ? item.name.he : item.name.en}
            </Text>
            <Text style={[styles.categoryCount, { textAlign: rtl ? "right" : "left" }]}>
              {item.count} {t("people")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !categories) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{t("loadError")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: rtl ? "right" : "left" }]}>
            {t("exploreTitle")}
          </Text>
          <Text style={[styles.subtitle, { textAlign: rtl ? "right" : "left" }]}>
            {t("exploreSubtitle")}
          </Text>
        </View>

        {/* Industries */}
        {categories.industries.length > 0 && (
          <CategorySection
            title="industries"
            titleKey="industries"
            icon={CATEGORY_ICONS.industries}
            items={categories.industries}
          />
        )}

        {/* Locations */}
        {categories.locations.length > 0 && (
          <CategorySection
            title="locations"
            titleKey="locations"
            icon={CATEGORY_ICONS.locations}
            items={categories.locations}
          />
        )}

        {/* Professions */}
        {categories.professions.length > 0 && (
          <CategorySection
            title="professions"
            titleKey="professions"
            icon={CATEGORY_ICONS.professions}
            items={categories.professions}
          />
        )}

        {/* Expertise */}
        {categories.expertise.length > 0 && (
          <CategorySection
            title="expertise"
            titleKey="expertise"
            icon={CATEGORY_ICONS.expertise}
            items={categories.expertise}
          />
        )}
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
  errorText: {
    fontSize: 17,
    color: COLORS.tertiaryLabel,
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
    paddingBottom: 24,
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
    marginTop: 8,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.label,
    letterSpacing: 0.35,
  },
  categoryItems: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.label,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
  },
});
