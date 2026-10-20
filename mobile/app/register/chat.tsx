import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Send, RotateCcw } from "lucide-react-native";

import { useAppStore } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/types";

// Rotary brand colors
const COLORS = {
  primary: "#003366",
  background: "#FAFAF8",
  text: "#1A1A1A",
  muted: "#737373",
  border: "#E5E5E3",
  card: "#FFFFFF",
};

// Initial greeting
const GREETING_HE = `שלום וברוכים הבאים לרוטרי קונקט ישראל! ספרו לי קצת על עצמכם במילים שלכם: שם, גיל, השכלה, עיסוק, מועדון רוטרי ומתי הצטרפתם.`;
const GREETING_EN = `Welcome to Rotary Connect Israel! Tell me a bit about yourself: name, age, education, profession, Rotary club and when you joined.`;

export default function ChatRegistrationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const signIn = useAppStore((state) => state.signIn);
  const rtl = isRTL();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greeting",
      role: "assistant",
      content: language === "he" ? GREETING_HE : GREETING_EN,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // In production, send to AI API
    // For demo, simulate response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          language === "he"
            ? "תודה רבה על הפרטים! כדי להשלים את הרישום, מה כתובת הדוא״ל שלך?"
            : "Thank you for the details! To complete registration, what's your email address?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content: language === "he" ? GREETING_HE : GREETING_EN,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleFinish = () => {
    // In production, complete registration via API
    signIn({
      firstName: "New",
      lastName: "Member",
      email: "new@member.com",
      club: "tel-aviv",
      onboarded: true,
    });
    router.replace("/");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("smartRegistration"),
          headerRight: () => (
            <TouchableOpacity onPress={handleReset}>
              <RotateCcw size={22} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={{
                alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
              }}
            >
              {message.role === "assistant" && (
                <View
                  style={{
                    flexDirection: rtl ? "row-reverse" : "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: COLORS.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginEnd: 8,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>
                      R
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: COLORS.muted }}>
                    {t("appName")}
                  </Text>
                </View>
              )}
              <View
                style={{
                  backgroundColor:
                    message.role === "user" ? COLORS.primary : COLORS.card,
                  borderRadius: 16,
                  borderTopRightRadius: message.role === "user" ? 4 : 16,
                  borderTopLeftRadius: message.role === "assistant" ? 4 : 16,
                  padding: 14,
                  borderWidth: message.role === "assistant" ? 1 : 0,
                  borderColor: COLORS.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: message.role === "user" ? "#FFFFFF" : COLORS.text,
                    lineHeight: 22,
                    textAlign: rtl ? "right" : "left",
                  }}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
              <View
                style={{
                  flexDirection: rtl ? "row-reverse" : "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: COLORS.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginEnd: 8,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>
                    R
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  borderTopLeftRadius: 4,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.muted }}>...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View
          style={{
            flexDirection: rtl ? "row-reverse" : "row",
            alignItems: "center",
            padding: 12,
            paddingBottom: Platform.OS === "ios" ? 24 : 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            backgroundColor: COLORS.card,
            gap: 12,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: COLORS.background,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: COLORS.text,
              maxHeight: 100,
              textAlign: rtl ? "right" : "left",
            }}
            placeholder={t("typingPlaceholder")}
            placeholderTextColor={COLORS.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                inputText.trim() && !isLoading ? COLORS.primary : COLORS.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send
              size={20}
              color={inputText.trim() && !isLoading ? "#FFFFFF" : COLORS.muted}
            />
          </TouchableOpacity>
        </View>

        {/* Demo finish button - remove in production */}
        {messages.length > 3 && (
          <TouchableOpacity
            onPress={handleFinish}
            style={{
              backgroundColor: COLORS.primary,
              marginHorizontal: 16,
              marginBottom: 16,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
              {t("finishRegistration")} (Demo)
            </Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
