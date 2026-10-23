import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
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
  ChevronRight,
  ChevronLeft,
} from "lucide-react-native";

import { useAppStore } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";
import { api } from "@/lib/api/client";
import type { Member, FamilyMember } from "@/lib/types";

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
  green: "#34C759",
  whatsapp: "#25D366",
};

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const saved = useAppStore((state) => state.saved);
  const saveContact = useAppStore((state) => state.saveContact);
  const unsaveContact = useAppStore((state) => state.unsaveContact);
  const rtl = isRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  // Fetch member data
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ["member", id],
    queryFn: () => api.getMember(id || ""),
    enabled: !!id,
  });

  // Fetch family members
  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family", id],
    queryFn: () => api.getFamilyMembers(id || ""),
    enabled: !!id,
  });

  const isSaved = member ? saved.includes(member.id) : false;

  const handleCall = () => {
    if (member?.contactInfo?.phone) {
      Linking.openURL(`tel:${member.contactInfo.phone}`);
    }
  };

  const handleEmail = () => {
    if (member?.contactInfo?.email) {
      Linking.openURL(`mailto:${member.contactInfo.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (member?.contactInfo?.whatsapp) {
      const phone = member.contactInfo.whatsapp.replace(/[^0-9]/g, "");
      Linking.openURL(`whatsapp://send?phone=972${phone.substring(1)}`);
    }
  };

  const handleSave = () => {
    if (!member) return;
    if (isSaved) {
      unsaveContact(member.id);
    } else {
      saveContact(member.id);
    }
  };

  const handleShare = async () => {
    if (!member) return;
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

  const handleFamilyMemberPress = (fm: FamilyMember) => {
    // Navigate to the primary member's profile or a family member detail
    router.push(`/member/${fm.primaryMemberId}`);
  };

  if (memberLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: "" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: "" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{t("memberNotFound")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = language === "he" ? member.name.he : member.name.en;
  const position = language === "he" ? member.position.he : member.position.en;
  const about = language === "he" ? member.about.he : member.about.en;
  const industry = language === "he" ? member.industry.he : member.industry.en;
  const city = language === "he" ? member.city.he : member.city.en;
  const clubName = language === "he" ? member.clubName.he : member.clubName.en;

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value: string;
  }) => (
    <View style={[styles.infoRow, { flexDirection: rtl ? "row-reverse" : "row" }]}>
      <Icon size={18} color={COLORS.tertiaryLabel} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? "right" : "left" }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerBackTitle: t("back"),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                {isSaved ? (
                  <BookmarkCheck size={24} color={COLORS.primary} />
                ) : (
                  <Bookmark size={24} color={COLORS.label} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Share2 size={24} color={COLORS.label} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.position}>{position}</Text>
          <Text style={styles.company}>{member.company}</Text>

          {/* Verified badge */}
          <View style={styles.verifiedBadge}>
            <Award size={14} color={COLORS.gold} />
            <Text style={styles.verifiedText}>{t("verified")}</Text>
          </View>
        </View>

        {/* Contact buttons */}
        <View style={styles.contactButtons}>
          {member.contactInfo?.phone && (
            <TouchableOpacity onPress={handleCall} style={styles.contactButton}>
              <Phone size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {member.contactInfo?.email && (
            <TouchableOpacity onPress={handleEmail} style={styles.contactButton}>
              <Mail size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {member.contactInfo?.whatsapp && (
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={[styles.contactButton, { backgroundColor: `${COLORS.whatsapp}15` }]}
            >
              <MessageCircle size={24} color={COLORS.whatsapp} />
            </TouchableOpacity>
          )}
        </View>

        {/* About section */}
        {about && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? "right" : "left" }]}>
              {t("about")}
            </Text>
            <Text style={[styles.aboutText, { textAlign: rtl ? "right" : "left" }]}>
              {about}
            </Text>
          </View>
        )}

        {/* Professional info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: rtl ? "right" : "left" }]}>
            {t("professional")}
          </Text>
          <View style={styles.infoCard}>
            <InfoRow icon={Building2} label={t("industry")} value={industry} />
            <InfoRow icon={MapPin} label={t("city")} value={city} />
          </View>
        </View>

        {/* Rotary info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: rtl ? "right" : "left" }]}>
            {t("rotary")}
          </Text>
          <View style={styles.infoCard}>
            <InfoRow icon={Users} label={t("club")} value={clubName} />
            <InfoRow icon={Calendar} label={t("memberSince")} value={member.memberSince.toString()} />
          </View>
        </View>

        {/* Expertise */}
        {member.expertise && member.expertise.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? "right" : "left" }]}>
              {t("expertise")}
            </Text>
            <View style={styles.tagsContainer}>
              {member.expertise.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>
                    {language === "he" ? item.he : item.en}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Can help with */}
        {member.helpWith && member.helpWith.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? "right" : "left" }]}>
              {t("canHelpWith")}
            </Text>
            <View style={styles.tagsContainer}>
              {member.helpWith.map((item, index) => (
                <View key={index} style={[styles.tag, styles.helpTag]}>
                  <Text style={[styles.tagText, styles.helpTagText]}>
                    {language === "he" ? item.he : item.en}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Family Members */}
        {familyMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? "right" : "left" }]}>
              {t("family")}
            </Text>
            <View style={styles.familyList}>
              {familyMembers.map((fm) => {
                const fmName = language === "he"
                  ? `${fm.firstName.he} ${fm.lastName.he}`
                  : `${fm.firstName.en} ${fm.lastName.en}`;
                const fmProfession = fm.profession
                  ? language === "he" ? fm.profession.he : fm.profession.en
                  : null;

                return (
                  <TouchableOpacity
                    key={fm.id}
                    onPress={() => handleFamilyMemberPress(fm)}
                    style={[styles.familyCard, { flexDirection: rtl ? "row-reverse" : "row" }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.familyAvatar}>
                      <Text style={styles.familyAvatarText}>{fmName.charAt(0)}</Text>
                    </View>
                    <View style={styles.familyInfo}>
                      <Text style={[styles.familyName, { textAlign: rtl ? "right" : "left" }]}>
                        {fmName}
                      </Text>
                      {fmProfession && (
                        <Text style={[styles.familyProfession, { textAlign: rtl ? "right" : "left" }]}>
                          {fmProfession}
                        </Text>
                      )}
                      <View style={styles.relationshipBadge}>
                        <Text style={styles.relationshipText}>{t(fm.relationship)}</Text>
                      </View>
                    </View>
                    <ChevronIcon size={20} color={COLORS.tertiaryLabel} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
  headerRight: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 16,
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
  position: {
    fontSize: 16,
    color: COLORS.secondaryLabel,
    marginTop: 4,
  },
  company: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.gold}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.gold,
    fontWeight: "500",
  },
  contactButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 20,
    backgroundColor: COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  contactButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.label,
    marginBottom: 12,
    letterSpacing: 0.35,
  },
  aboutText: {
    fontSize: 15,
    color: COLORS.label,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginStart: 12,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: COLORS.label,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  helpTag: {
    backgroundColor: `${COLORS.gold}15`,
  },
  helpTagText: {
    color: COLORS.gold,
  },
  familyList: {
    gap: 12,
  },
  familyCard: {
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
  familyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.fill,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 16,
  },
  familyAvatarText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 18,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.label,
  },
  familyProfession: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
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
});
