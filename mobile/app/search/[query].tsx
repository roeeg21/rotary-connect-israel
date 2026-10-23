import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Heart,
  User as UserIcon,
  Baby,
  Filter,
  X,
  Sparkles,
} from "lucide-react-native";

import { useAppStore } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";
import { api } from "@/lib/api/client";
import type { SearchResult, RelationshipFilter } from "@/lib/types";

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
  gold: "#C4A052",
};

const RELATIONSHIP_TABS: { key: RelationshipFilter; icon: typeof Users; labelKey: string }[] = [
  { key: "all", icon: Users, labelKey: "allPeople" },
  { key: "members", icon: UserIcon, labelKey: "membersOnly" },
  { key: "spouses", icon: Heart, labelKey: "spouses" },
  { key: "children", icon: Baby, labelKey: "children" },
];

export default function SearchResultsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const addRecentlyViewed = useAppStore((state) => state.addRecentlyViewed);
  const rtl = isRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [industryFilter, setIndustryFilter] = useState<string | undefined>();

  // Fetch search results
  const { data, isLoading, error } = useQuery({
    queryKey: ["search", query, relationshipFilter, locationFilter, industryFilter],
    queryFn: () =>
      api.search(query || "", {
        relationshipFilter,
        locationFilter,
        limit: 50,
      }),
    enabled: !!query,
  });

  const results = data?.results || [];

  const handleMemberPress = (result: SearchResult) => {
    addRecentlyViewed(result.id);
    router.push(`/member/${result.id}`);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const name = language === "he" ? result.name.he : result.name.en;
    const profession = result.profession
      ? language === "he"
        ? result.profession.he
        : result.profession.en
      : null;
    const location = result.location
      ? language === "he"
        ? result.location.he
        : result.location.en
      : null;

    return (
      <TouchableOpacity
        onPress={() => handleMemberPress(result)}
        style={styles.resultCard}
        activeOpacity={0.7}
      >
        <View style={[styles.resultContent, { flexDirection: rtl ? "row-reverse" : "row" }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
          </View>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { textAlign: rtl ? "right" : "left" }]}>
              {name}
            </Text>
            {profession && (
              <Text style={[styles.resultProfession, { textAlign: rtl ? "right" : "left" }]}>
                {profession}
              </Text>
            )}
            {location && (
              <Text style={[styles.resultLocation, { textAlign: rtl ? "right" : "left" }]}>
                {location}
              </Text>
            )}
            {result.type === "family" && result.relationship && (
              <View style={styles.relationshipBadge}>
                <Text style={styles.relationshipText}>{t(result.relationship)}</Text>
              </View>
            )}
          </View>
          <ChevronIcon size={20} color={COLORS.tertiaryLabel} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("results"),
          headerBackTitle: t("back"),
        }}
      />

      {/* Query and result count */}
      <View style={styles.queryHeader}>
        <View style={[styles.queryRow, { flexDirection: rtl ? "row-reverse" : "row" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.queryText, { textAlign: rtl ? "right" : "left" }]}>
              "{decodeURIComponent(query || "")}"
            </Text>
            <Text style={[styles.resultCount, { textAlign: rtl ? "right" : "left" }]}>
              {results.length} {t("results")}
            </Text>
          </View>
          {data && (
            <View style={styles.aiBadge}>
              <Sparkles size={12} color={COLORS.secondary} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
        </View>
      </View>

      {/* Relationship filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {RELATIONSHIP_TABS.map(({ key, icon: Icon, labelKey }) => {
          const isActive = relationshipFilter === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setRelationshipFilter(key)}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                { flexDirection: rtl ? "row-reverse" : "row" },
              ]}
              activeOpacity={0.7}
            >
              <Icon size={16} color={isActive ? "#FFFFFF" : COLORS.tertiaryLabel} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Filter button */}
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={[styles.tab, styles.filterButton]}
          activeOpacity={0.7}
        >
          <Filter size={16} color={COLORS.primary} />
          <Text style={[styles.tabText, { color: COLORS.primary }]}>{t("filters")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t("searching")}</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t("searchError")}</Text>
          <Text style={styles.emptyHint}>{t("tryAgain")}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t("noResults")}</Text>
          <Text style={styles.emptyHint}>{t("noResultsHint")}</Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsList} contentContainerStyle={styles.resultsContent}>
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </ScrollView>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("filters")}</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color={COLORS.label} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.filterLabel}>{t("location")}</Text>
            {/* Location filter options would go here */}
            <Text style={styles.filterHint}>{t("comingSoon")}</Text>

            <Text style={[styles.filterLabel, { marginTop: 24 }]}>{t("industry")}</Text>
            {/* Industry filter options would go here */}
            <Text style={styles.filterHint}>{t("comingSoon")}</Text>
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>{t("apply")}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  queryHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  queryRow: {
    alignItems: "center",
  },
  queryText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.label,
  },
  resultCount: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
    marginTop: 4,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.secondary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.secondary,
  },
  tabsContainer: {
    maxHeight: 56,
    backgroundColor: COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.fill,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  filterButton: {
    backgroundColor: `${COLORS.primary}15`,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.tertiaryLabel,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.label,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
    gap: 12,
  },
  resultCard: {
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  resultContent: {
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.fill,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 16,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 20,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.label,
  },
  resultProfession: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  resultLocation: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  relationshipBadge: {
    backgroundColor: `${COLORS.gold}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  relationshipText: {
    fontSize: 12,
    color: COLORS.gold,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
    backgroundColor: COLORS.secondaryBackground,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.label,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.label,
    marginBottom: 12,
  },
  filterHint: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
