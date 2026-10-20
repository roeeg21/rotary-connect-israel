import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Share,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Phone,
  Mail,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  Share2,
  Building2,
  MapPin,
  Calendar,
  Award,
  Users,
} from "lucide-react-native";

import { useAppStore } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";
import type { Member } from "@/lib/types";

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

// Mock member data for demo
const MOCK_MEMBER: Member = {
  id: "m1",
  name: { he: "דני כהן", en: "Danny Cohen" },
  position: { he: "שותף מנהל", en: "Managing Partner" },
  company: "Cohen & Partners Law",
  profession: { he: "עורך דין", en: "Lawyer" },
  specialty: { he: "משפט מסחרי", en: "Commercial Law" },
  industry: { he: "משפטים", en: "Legal" },
  city: { he: "תל אביב", en: "Tel Aviv" },
  club: "tel-aviv",
  clubName: { he: "רוטרי תל אביב", en: "Rotary Tel Aviv" },
  memberSince: 2015,
  about: {
    he: "עורך דין עם ניסיון של 25 שנה בתחום המשפט המסחרי והבינלאומי. מתמחה במיזוגים ורכישות, חוזים בינלאומיים וליווי עסקאות מורכבות.",
    en: "Lawyer with 25 years of experience in commercial and international law. Specializing in mergers & acquisitions, international contracts and complex deal advisory.",
  },
  expertise: [
    { he: "מיזוגים ורכישות", en: "Mergers & Acquisitions" },
    { he: "חוזים בינלאומיים", en: "International Contracts" },
  ],
  helpWith: [
    { he: "ייעוץ משפטי", en: "Legal Advice" },
    { he: "הסכמי מסחר", en: "Commercial Agreements" },
  ],
  languages: [
    { he: "עברית", en: "Hebrew" },
    { he: "אנגלית", en: "English" },
  ],
  accountType: "member",
  contactInfo: {
    email: "danny@cohenlaw.co.il",
    phone: "054-1234567",
    whatsapp: "054-1234567",
    preferredContact: "email",
  },
};

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const saved = useAppStore((state) => state.saved);
  const saveContact = useAppStore((state) => state.saveContact);
  const unsaveContact = useAppStore((state) => state.unsaveContact);
  const rtl = isRTL();

  // In production, fetch member by ID
  const member = MOCK_MEMBER;
  const isSaved = saved.includes(member.id);

  const handleCall = () => {
    if (member.contactInfo?.phone) {
      Linking.openURL(`tel:${member.contactInfo.phone}`);
    }
  };

  const handleEmail = () => {
    if (member.contactInfo?.email) {
      Linking.openURL(`mailto:${member.contactInfo.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (member.contactInfo?.whatsapp) {
      const phone = member.contactInfo.whatsapp.replace(/[^0-9]/g, "");
      Linking.openURL(`whatsapp://send?phone=972${phone.substring(1)}`);
    }
  };

  const handleSave = () => {
    if (isSaved) {
      unsaveContact(member.id);
    } else {
      saveContact(member.id);
    }
  };

  const handleShare = async () => {
    const name = language === "he" ? member.name.he : member.name.en;
    const profession = language === "he" ? member.profession.he : member.profession.en;
    try {
      await Share.share({
        message: `${name} - ${profession}\nRotary Connect Israel`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value: string;
  }) => (
    <View
      style={{
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Icon size={18} color={COLORS.muted} />
      <Text style={{ fontSize: 13, color: COLORS.muted, marginStart: 12, width: 80 }}>
        {label}
      </Text>
      <Text
        style={{ flex: 1, fontSize: 15, color: COLORS.text, textAlign: rtl ? "right" : "left" }}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerBackTitle: t("back"),
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity onPress={handleSave}>
                {isSaved ? (
                  <BookmarkCheck size={24} color={COLORS.primary} />
                ) : (
                  <Bookmark size={24} color={COLORS.text} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare}>
                <Share2 size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile header */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 16,
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
              {(language === "he" ? member.name.he : member.name.en).charAt(0)}
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.text }}>
            {language === "he" ? member.name.he : member.name.en}
          </Text>
          <Text style={{ fontSize: 16, color: COLORS.muted, marginTop: 4 }}>
            {language === "he" ? member.position.he : member.position.en}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.muted }}>
            {member.company}
          </Text>

          {/* Verified badge */}
          <View
            style={{
              flexDirection: rtl ? "row-reverse" : "row",
              alignItems: "center",
              backgroundColor: `${COLORS.gold}20`,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              marginTop: 12,
            }}
          >
            <Award size={14} color={COLORS.gold} />
            <Text style={{ fontSize: 12, color: COLORS.gold, marginStart: 4 }}>
              {t("verified")}
            </Text>
          </View>
        </View>

        {/* Contact buttons */}
        <View
          style={{
            flexDirection: rtl ? "row-reverse" : "row",
            justifyContent: "center",
            gap: 16,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          {member.contactInfo?.phone && (
            <TouchableOpacity
              onPress={handleCall}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: `${COLORS.primary}15`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Phone size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {member.contactInfo?.email && (
            <TouchableOpacity
              onPress={handleEmail}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: `${COLORS.primary}15`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mail size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {member.contactInfo?.whatsapp && (
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#25D36615",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageCircle size={24} color="#25D366" />
            </TouchableOpacity>
          )}
        </View>

        {/* About section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 12,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {t("about")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.text,
              lineHeight: 24,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {language === "he" ? member.about.he : member.about.en}
          </Text>
        </View>

        {/* Professional info */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 8,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {t("professional")}
          </Text>
          <InfoRow
            icon={Building2}
            label={t("industry")}
            value={language === "he" ? member.industry.he : member.industry.en}
          />
          <InfoRow
            icon={MapPin}
            label={t("city")}
            value={language === "he" ? member.city.he : member.city.en}
          />
        </View>

        {/* Rotary info */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 8,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {t("rotary")}
          </Text>
          <InfoRow
            icon={Users}
            label={t("club")}
            value={language === "he" ? member.clubName.he : member.clubName.en}
          />
          <InfoRow
            icon={Calendar}
            label={t("memberSince")}
            value={member.memberSince.toString()}
          />
        </View>

        {/* Expertise */}
        {member.expertise.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: COLORS.text,
                marginBottom: 12,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {t("expertise")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {member.expertise.map((item, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: `${COLORS.primary}10`,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ fontSize: 14, color: COLORS.primary }}>
                    {language === "he" ? item.he : item.en}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Can help with */}
        {member.helpWith.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: COLORS.text,
                marginBottom: 12,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {t("canHelpWith")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {member.helpWith.map((item, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: `${COLORS.gold}15`,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ fontSize: 14, color: COLORS.gold }}>
                    {language === "he" ? item.he : item.en}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
