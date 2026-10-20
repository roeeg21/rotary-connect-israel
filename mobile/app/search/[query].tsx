import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Heart,
  User as UserIcon,
} from "lucide-react-native";

import { useAppStore } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";
import { api } from "@/lib/api/client";
import type { SearchResult, RelationshipFilter } from "@/lib/types";

// Rotary brand colors
const COLORS = {
  primary: "#003366",
  background: "#FAFAF8",
  text: "#1A1A1A",
  muted: "#737373",
  border: "#E5E5E3",
  card: "#FFFFFF",
};

// Mock search results for demo
const MOCK_RESULTS: SearchResult[] = [
  {
    id: "m1",
    type: "member",
    name: { he: "דני כהן", en: "Danny Cohen" },
    profession: { he: "עורך דין", en: "Lawyer" },
    location: { he: "תל אביב", en: "Tel Aviv" },
    industry: { he: "משפטים", en: "Legal" },
    score: 0.95,
    reasons: ["Profession match", "Location match"],
  },
  {
    id: "m2",
    type: "member",
    name: { he: "מיכל לוי", en: "Michal Levi" },
    profession: { he: "יזמית", en: "Entrepreneur" },
    location: { he: "הרצליה", en: "Herzliya" },
    industry: { he: "הייטק", en: "High-Tech" },
    score: 0.88,
    reasons: ["Industry match"],
  },
  {
    id: "f1",
    type: "family",
    name: { he: "שרה כהן", en: "Sarah Cohen" },
    profession: { he: "שף", en: "Chef" },
    location: { he: "תל אביב", en: "Tel Aviv" },
    relationship: "spouse",
    primaryMemberId: "m1",
    score: 0.72,
    reasons: ["Related to Danny Cohen"],
  },
];

const RELATIONSHIP_TABS = [
  { key: "all" as const, icon: Users },
  { key: "members" as const, icon: UserIcon },
  { key: "spouses" as const, icon: Heart },
];

export default function SearchResultsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const addRecentlyViewed = useAppStore((state) => state.addRecentlyViewed);
  const rtl = isRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  const [relationshipFilter, setRelationshipFilter] =
    useState<RelationshipFilter>("all");

  // In production, use real API call
  // const { data, isLoading, error } = useQuery({
  //   queryKey: ["search", query, relationshipFilter],
  //   queryFn: () => api.search(query, { relationshipFilter }),
  // });

  // For demo, use mock data
  const isLoading = false;
  const results = MOCK_RESULTS.filter((r) => {
    if (relationshipFilter === "all") return true;
    if (relationshipFilter === "members") return r.type === "member";
    if (relationshipFilter === "spouses") return r.relationship === "spouse";
    return true;
  });

  const handleMemberPress = (result: SearchResult) => {
    addRecentlyViewed(result.id);
    router.push(`/member/${result.id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("resultsFor"),
          headerBackTitle: t("back"),
        }}
      />

      {/* Query display */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: COLORS.text,
            textAlign: rtl ? "right" : "left",
          }}
        >
          "{decodeURIComponent(query || "")}"
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: COLORS.muted,
            marginTop: 4,
            textAlign: rtl ? "right" : "left",
          }}
        >
          {results.length} {t("results")}
        </Text>
      </View>

      {/* Relationship filter tabs */}
      <View
        style={{
          flexDirection: rtl ? "row-reverse" : "row",
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        {RELATIONSHIP_TABS.map(({ key, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setRelationshipFilter(key)}
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor:
                relationshipFilter === key ? COLORS.primary : COLORS.card,
              borderWidth: 1,
              borderColor:
                relationshipFilter === key ? COLORS.primary : COLORS.border,
            }}
          >
            <Icon
              size={16}
              color={relationshipFilter === key ? "#FFFFFF" : COLORS.muted}
            />
            <Text
              style={{
                fontSize: 14,
                color: relationshipFilter === key ? "#FFFFFF" : COLORS.text,
                marginStart: 6,
              }}
            >
              {t(
                key === "all"
                  ? "allPeople"
                  : key === "members"
                  ? "membersOnly"
                  : "spouses"
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 16, color: COLORS.muted }}>{t("searching")}</Text>
        </View>
      ) : results.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: COLORS.text,
              textAlign: "center",
            }}
          >
            {t("noResults")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.muted,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {t("noResultsHint")}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 12 }}
        >
          {results.map((result) => (
            <TouchableOpacity
              key={result.id}
              onPress={() => handleMemberPress(result)}
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "center",
                backgroundColor: COLORS.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: `${COLORS.primary}20`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginEnd: 16,
                }}
              >
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "bold",
                    fontSize: 20,
                  }}
                >
                  {(language === "he" ? result.name.he : result.name.en).charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: COLORS.text,
                    textAlign: rtl ? "right" : "left",
                  }}
                >
                  {language === "he" ? result.name.he : result.name.en}
                </Text>
                {result.profession && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.muted,
                      marginTop: 2,
                      textAlign: rtl ? "right" : "left",
                    }}
                  >
                    {language === "he"
                      ? result.profession.he
                      : result.profession.en}
                  </Text>
                )}
                {result.type === "family" && result.relationship && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.primary,
                      marginTop: 4,
                      textAlign: rtl ? "right" : "left",
                    }}
                  >
                    {t(result.relationship)}
                  </Text>
                )}
              </View>
              <ChevronIcon size={20} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
