import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Bookmark, ChevronRight, ChevronLeft, Search } from "lucide-react-native";

import { useAppStore, useSavedContacts } from "@/lib/store/app";
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

// Sample saved members - would come from stored IDs + member data
const SAVED_MEMBERS = [
  { id: "m1", name: { he: "דני כהן", en: "Danny Cohen" }, profession: { he: "עורך דין", en: "Lawyer" } },
  { id: "m2", name: { he: "מיכל לוי", en: "Michal Levi" }, profession: { he: "יזמית", en: "Entrepreneur" } },
];

export default function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const savedIds = useSavedContacts();
  const language = useAppStore((state) => state.language);
  const account = useAppStore((state) => state.account);
  const rtl = isRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  const handleMemberPress = (memberId: string) => {
    router.push(`/member/${memberId}`);
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
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${COLORS.primary}15`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Bookmark size={36} color={COLORS.primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
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
            }}
          >
            {t("notSignedInHint")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
              marginTop: 24,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
              {t("signIn")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (savedIds.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: COLORS.text,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {t("savedTitle")}
          </Text>
        </View>
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
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${COLORS.primary}15`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Bookmark size={36} color={COLORS.primary} />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: COLORS.text,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {t("savedEmpty")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.muted,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {t("savedEmptyHint")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/")}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
              marginTop: 24,
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
            }}
          >
            <Search size={18} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "600",
                marginStart: 8,
              }}
            >
              {t("startSearching")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Saved contacts list
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: COLORS.text,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {t("savedTitle")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.muted,
              marginTop: 4,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {savedIds.length} {t("people")}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {SAVED_MEMBERS.filter((m) => savedIds.includes(m.id)).map((member) => (
            <TouchableOpacity
              key={member.id}
              onPress={() => handleMemberPress(member.id)}
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
                  width: 48,
                  height: 48,
                  borderRadius: 24,
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
                    fontSize: 18,
                  }}
                >
                  {(language === "he" ? member.name.he : member.name.en).charAt(0)}
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
                  {language === "he" ? member.name.he : member.name.en}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: COLORS.muted,
                    marginTop: 2,
                    textAlign: rtl ? "right" : "left",
                  }}
                >
                  {language === "he" ? member.profession.he : member.profession.en}
                </Text>
              </View>
              <ChevronIcon size={20} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
