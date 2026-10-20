import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Building2, MapPin, Briefcase, Users } from "lucide-react-native";

import { useAppStore } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";

// Rotary brand colors
const COLORS = {
  primary: "#003366",
  background: "#FAFAF8",
  text: "#1A1A1A",
  muted: "#737373",
  border: "#E5E5E3",
  card: "#FFFFFF",
};

// Sample categories - would come from API in production
const CATEGORIES = {
  industries: [
    { he: "הייטק", en: "High-Tech", count: 45 },
    { he: "משפטים", en: "Legal", count: 32 },
    { he: "רפואה", en: "Healthcare", count: 28 },
    { he: "פיננסים", en: "Finance", count: 24 },
    { he: "נדל״ן", en: "Real Estate", count: 18 },
  ],
  locations: [
    { he: "תל אביב", en: "Tel Aviv", count: 67 },
    { he: "ירושלים", en: "Jerusalem", count: 34 },
    { he: "חיפה", en: "Haifa", count: 22 },
    { he: "הרצליה", en: "Herzliya", count: 18 },
    { he: "רמת גן", en: "Ramat Gan", count: 15 },
  ],
  professions: [
    { he: "עורך דין", en: "Lawyer", count: 28 },
    { he: "רופא", en: "Doctor", count: 22 },
    { he: "יזם", en: "Entrepreneur", count: 35 },
    { he: "מהנדס", en: "Engineer", count: 40 },
    { he: "אדריכל", en: "Architect", count: 12 },
  ],
};

export default function NetworkScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const rtl = isRTL();

  const handleCategoryPress = (type: string, value: string) => {
    router.push(`/search/${encodeURIComponent(value)}`);
  };

  const CategorySection = ({
    title,
    icon: Icon,
    items,
    type,
  }: {
    title: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    items: Array<{ he: string; en: string; count: number }>;
    type: string;
  }) => (
    <View style={{ marginBottom: 32 }}>
      <View
        style={{
          flexDirection: rtl ? "row-reverse" : "row",
          alignItems: "center",
          marginBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        <Icon size={20} color={COLORS.primary} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: COLORS.text,
            marginStart: 8,
          }}
        >
          {title}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() =>
              handleCategoryPress(type, language === "he" ? item.he : item.en)
            }
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              minWidth: 140,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: COLORS.text,
                marginBottom: 4,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {language === "he" ? item.he : item.en}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: COLORS.muted,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {item.count} {t("people")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: COLORS.text,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {t("exploreTitle")}
          </Text>
        </View>

        {/* Industries */}
        <CategorySection
          title={t("industries")}
          icon={Building2}
          items={CATEGORIES.industries}
          type="industry"
        />

        {/* Locations */}
        <CategorySection
          title={t("locations")}
          icon={MapPin}
          items={CATEGORIES.locations}
          type="location"
        />

        {/* Professions */}
        <CategorySection
          title={t("professions")}
          icon={Briefcase}
          items={CATEGORIES.professions}
          type="profession"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
