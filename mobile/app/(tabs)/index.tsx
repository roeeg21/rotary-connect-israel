import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Search, ChevronRight, ChevronLeft } from "lucide-react-native";

import { useAppStore, useRecentSearches } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";

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
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              {/* Logo */}
              <View
                style={[
                  styles.logoContainer,
                  { flexDirection: rtl ? "row-reverse" : "row" },
                ]}
              >
                <Image
                  source={require("@/assets/images/app_logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.appName}>{t("appName")}</Text>
                  <Text style={styles.subtitle}>Israel · District 2490</Text>
                </View>
              </View>

              {/* Large Title - iOS style */}
              <Text
                style={[
                  styles.largeTitle,
                  { textAlign: rtl ? "right" : "left" },
                ]}
              >
                {t("homeQuestion")}
              </Text>
            </View>

            {/* Search Input - iOS style */}
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Search size={18} color={COLORS.tertiaryLabel} />
                <TextInput
                  style={[
                    styles.searchInput,
                    { textAlign: rtl ? "right" : "left" },
                  ]}
                  placeholder={t("searchPlaceholder")}
                  placeholderTextColor={COLORS.tertiaryLabel}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>
            </View>

            {/* Search Suggestions - Pills */}
            <View style={styles.suggestionsSection}>
              <Text
                style={[
                  styles.sectionLabel,
                  { textAlign: rtl ? "right" : "left" },
                ]}
              >
                {t("try")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsContainer}
              >
                {SEARCH_SUGGESTIONS.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSuggestionPress(suggestion)}
                    style={styles.suggestionPill}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>
                      {language === "he" ? suggestion.he : suggestion.en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Recent Searches - iOS List style */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: rtl ? "right" : "left" },
                  ]}
                >
                  {t("recentSearches")}
                </Text>
                <View style={styles.listContainer}>
                  {recentSearches.map((query, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleRecentSearchPress(query)}
                      style={[
                        styles.listItem,
                        { flexDirection: rtl ? "row-reverse" : "row" },
                        index === recentSearches.length - 1 && styles.listItemLast,
                      ]}
                      activeOpacity={0.6}
                    >
                      <View
                        style={[
                          styles.listItemContent,
                          { flexDirection: rtl ? "row-reverse" : "row" },
                        ]}
                      >
                        <View style={styles.searchIconContainer}>
                          <Search size={16} color={COLORS.tertiaryLabel} />
                        </View>
                        <Text style={styles.listItemText}>{query}</Text>
                      </View>
                      <ChevronIcon size={16} color={COLORS.tertiaryLabel} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* New to Network - iOS Cards */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { textAlign: rtl ? "right" : "left" },
                ]}
              >
                {t("newToNetwork")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsContainer}
              >
                {[1, 2, 3].map((i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.memberCard}
                    activeOpacity={0.8}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {["ד", "מ", "א"][i - 1]}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.memberName,
                        { textAlign: rtl ? "right" : "left" },
                      ]}
                    >
                      {["דני כהן", "מיכל לוי", "אבי גולן"][i - 1]}
                    </Text>
                    <Text
                      style={[
                        styles.memberProfession,
                        { textAlign: rtl ? "right" : "left" },
                      ]}
                    >
                      {["עורך דין", "יזמית", "אדריכל"][i - 1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View
                style={[
                  styles.footerContent,
                  { flexDirection: rtl ? "row-reverse" : "row" },
                ]}
              >
                <Image
                  source={require("@/assets/images/app_logo.png")}
                  style={styles.footerLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text
                    style={[
                      styles.footerGovernor,
                      { textAlign: rtl ? "right" : "left" },
                    ]}
                  >
                    {t("footerGovernor")}
                  </Text>
                  <Text
                    style={[
                      styles.footerDistrict,
                      { textAlign: rtl ? "right" : "left" },
                    ]}
                  >
                    {t("footerDistrict")}
                  </Text>
                </View>
              </View>
              <Text style={styles.copyright}>
                © {new Date().getFullYear()} Rotary Connect Israel
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 48,
    height: 48,
    marginEnd: 12,
  },
  appName: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.label,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 1,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: COLORS.label,
    letterSpacing: 0.37,
    lineHeight: 41,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.fill,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 17,
    color: COLORS.label,
  },
  suggestionsSection: {
    marginTop: 20,
    paddingStart: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: -0.08,
  },
  suggestionsContainer: {
    gap: 8,
    paddingEnd: 20,
  },
  suggestionPill: {
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "500",
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.label,
    marginBottom: 12,
    letterSpacing: 0.35,
  },
  listContainer: {
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  listItem: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listItemContent: {
    alignItems: "center",
    flex: 1,
  },
  searchIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.fill,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 12,
  },
  listItemText: {
    fontSize: 17,
    color: COLORS.label,
    flex: 1,
  },
  cardsContainer: {
    gap: 12,
  },
  memberCard: {
    width: 150,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.fill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  memberAvatarText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 20,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.label,
    marginBottom: 4,
  },
  memberProfession: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    alignItems: "center",
  },
  footerContent: {
    alignItems: "center",
    marginBottom: 12,
  },
  footerLogo: {
    width: 32,
    height: 32,
    marginEnd: 12,
  },
  footerGovernor: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.secondaryLabel,
  },
  footerDistrict: {
    fontSize: 11,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  copyright: {
    fontSize: 11,
    color: COLORS.tertiaryLabel,
  },
});
