import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Search, ChevronRight, ChevronLeft } from "lucide-react-native";

import { useAppStore, useRecentSearches } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";

// Rotary brand colors
const COLORS = {
  primary: "#003366",
  gold: "#C4A052",
  background: "#FAFAF8",
  text: "#1A1A1A",
  muted: "#737373",
  border: "#E5E5E3",
  card: "#FFFFFF",
};

// Example search suggestions
const SEARCH_SUGGESTIONS = [
  { he: "עורך דין בתל אביב", en: "Lawyer in Tel Aviv" },
  { he: "רופא שיניים", en: "Dentist" },
  { he: "יועץ עסקי", en: "Business consultant" },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const recentSearches = useRecentSearches();
  const language = useAppStore((state) => state.language);
  const addRecentSearch = useAppStore((state) => state.addRecentSearch);
  const rtl = isRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionPress = (suggestion: { he: string; en: string }) => {
    const query = language === "he" ? suggestion.he : suggestion.en;
    setSearchQuery(query);
    addRecentSearch(query);
    router.push(`/search/${encodeURIComponent(query)}`);
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    addRecentSearch(query);
    router.push(`/search/${encodeURIComponent(query)}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            {/* Logo */}
            <View
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Image
                source={require("@/assets/images/app_logo.png")}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  marginEnd: 12,
                }}
                resizeMode="contain"
              />
              <View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.text }}>
                  {t("appName")}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.muted }}>
                  Israel · District 2490
                </Text>
              </View>
            </View>

            {/* Tagline */}
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: COLORS.text,
                marginTop: 24,
                marginBottom: 8,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {t("homeQuestion")}
            </Text>
          </View>

          {/* Search Input */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <View
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "center",
                backgroundColor: COLORS.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 16,
                height: 52,
              }}
            >
              <Search size={20} color={COLORS.muted} />
              <TextInput
                style={{
                  flex: 1,
                  marginHorizontal: 12,
                  fontSize: 16,
                  color: COLORS.text,
                  textAlign: rtl ? "right" : "left",
                }}
                placeholder={t("searchPlaceholder")}
                placeholderTextColor={COLORS.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
          </View>

          {/* Search Suggestions */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text
              style={{
                fontSize: 13,
                color: COLORS.muted,
                marginBottom: 12,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {t("try")}:
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SEARCH_SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSuggestionPress(suggestion)}
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text style={{ color: COLORS.text, fontSize: 14 }}>
                    {language === "he" ? suggestion.he : suggestion.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: COLORS.text,
                  marginBottom: 12,
                  textAlign: rtl ? "right" : "left",
                }}
              >
                {t("recentSearches")}
              </Text>
              <View style={{ gap: 8 }}>
                {recentSearches.map((query, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleRecentSearchPress(query)}
                    style={{
                      flexDirection: rtl ? "row-reverse" : "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: COLORS.card,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: rtl ? "row-reverse" : "row",
                        alignItems: "center",
                      }}
                    >
                      <Search size={18} color={COLORS.muted} />
                      <Text
                        style={{
                          fontSize: 15,
                          color: COLORS.text,
                          marginStart: 12,
                        }}
                      >
                        {query}
                      </Text>
                    </View>
                    <ChevronIcon size={18} color={COLORS.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* New to Network */}
          <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: COLORS.text,
                marginBottom: 12,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {t("newToNetwork")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {/* Placeholder cards - will be populated with real data */}
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    width: 160,
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${COLORS.primary}20`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.primary,
                        fontWeight: "bold",
                        fontSize: 18,
                      }}
                    >
                      {["ד", "מ", "א"][i - 1]}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: COLORS.text,
                      marginBottom: 4,
                      textAlign: rtl ? "right" : "left",
                    }}
                  >
                    {["דני כהן", "מיכל לוי", "אבי גולן"][i - 1]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.muted,
                      textAlign: rtl ? "right" : "left",
                    }}
                  >
                    {["עורך דין", "יזמית", "אדריכל"][i - 1]}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

        </ScrollView>

        {/* Footer - Fixed at bottom */}
        <View
          style={{
            paddingTop: 16,
            paddingBottom: 8,
            paddingHorizontal: 20,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            backgroundColor: COLORS.background,
          }}
        >
          <View
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <Image
              source={require("@/assets/images/app_logo.png")}
              style={{
                width: 28,
                height: 28,
                marginEnd: 10,
              }}
              resizeMode="contain"
            />
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: COLORS.text,
                  textAlign: rtl ? "right" : "left",
                }}
              >
                {t("footerGovernor")}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: COLORS.muted,
                  textAlign: rtl ? "right" : "left",
                }}
              >
                {t("footerDistrict")}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 10,
              color: COLORS.muted,
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} Rotary Connect Israel
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
