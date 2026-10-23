import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Send, RotateCcw, CheckCircle, Sparkles } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

import { useAppStore } from "@/lib/store/app";
import { isRTL } from "@/lib/i18n";
import { api } from "@/lib/api/client";
import type { ChatMessage, ConversationState, QuickReply } from "@/lib/types";

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
  success: "#34C759",
};

// Session storage key
const SESSION_KEY = "@rotary_registration_session";

// Initial greeting messages
const GREETING_HE = `שלום וברוכים הבאים לרוטרי קונקט ישראל! 👋

אני כאן כדי לעזור לכם להצטרף לרשת. ספרו לי קצת על עצמכם במילים שלכם:
• שם מלא
• גיל
• השכלה ועיסוק
• מועדון רוטרי ושנת הצטרפות`;

const GREETING_EN = `Welcome to Rotary Connect Israel! 👋

I'm here to help you join our network. Tell me a bit about yourself:
• Full name
• Age
• Education and profession
• Rotary club and year joined`;

export default function ChatRegistrationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const signIn = useAppStore((state) => state.signIn);
  const rtl = isRTL();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize or resume session
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // Check for existing session
      const savedSession = await AsyncStorage.getItem(SESSION_KEY);

      if (savedSession) {
        const { state, history } = JSON.parse(savedSession);
        if (state.status === "in_progress" || state.status === "review") {
          // Resume existing session
          setConversationState(state);
          setMessages(history);
          setIsInitializing(false);
          return;
        }
      }

      // Create new session
      const newState: ConversationState = {
        sessionId: uuidv4(),
        language,
        currentStage: "welcome",
        completedStages: [],
        profile: {},
        children: [],
        status: "in_progress",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const greeting: ChatMessage = {
        id: "greeting",
        role: "assistant",
        content: language === "he" ? GREETING_HE : GREETING_EN,
        timestamp: Date.now(),
      };

      setConversationState(newState);
      setMessages([greeting]);
      await saveSession(newState, [greeting]);
    } catch (error) {
      console.error("Failed to initialize session:", error);
      // Fallback to new session
      const greeting: ChatMessage = {
        id: "greeting",
        role: "assistant",
        content: language === "he" ? GREETING_HE : GREETING_EN,
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    } finally {
      setIsInitializing(false);
    }
  };

  const saveSession = async (state: ConversationState, history: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ state, history })
      );
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !conversationState) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send to AI backend
      const response = await api.sendChatMessage(
        inputText.trim(),
        conversationState,
        updatedMessages
      );

      // Update conversation state
      const newState: ConversationState = {
        ...conversationState,
        ...response.state,
        updatedAt: Date.now(),
      };

      // Add AI response messages
      const newMessages = [...updatedMessages, ...response.messages];

      setConversationState(newState);
      setMessages(newMessages);
      await saveSession(newState, newMessages);

      // Check if registration is complete
      if (newState.status === "completed" || newState.currentStage === "completed") {
        // Registration complete - show success
        setTimeout(() => handleRegistrationComplete(newState), 500);
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          language === "he"
            ? "מצטער, נתקלתי בבעיה. אנא נסה שוב."
            : "Sorry, I encountered an issue. Please try again.",
        timestamp: Date.now(),
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    setInputText(reply.value);
    // Auto-send quick reply
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const handleReset = () => {
    Alert.alert(
      language === "he" ? "התחל מחדש" : "Start Over",
      language === "he"
        ? "האם אתה בטוח שברצונך להתחיל מחדש? כל ההתקדמות תאבד."
        : "Are you sure you want to start over? All progress will be lost.",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: language === "he" ? "התחל מחדש" : "Start Over",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(SESSION_KEY);
            initializeSession();
          },
        },
      ]
    );
  };

  const handleRegistrationComplete = async (state: ConversationState) => {
    // Clear session
    await AsyncStorage.removeItem(SESSION_KEY);

    // Sign in with the collected profile data
    signIn({
      firstName: state.profile.firstName || "",
      lastName: state.profile.lastName || "",
      email: state.profile.email || "",
      phone: state.profile.phone,
      club: state.clubId || "",
      onboarded: true,
    });

    // Navigate to home
    router.replace("/");
  };

  const handleCompleteRegistration = () => {
    if (!conversationState) return;

    // Check if we have minimum required data
    const { profile } = conversationState;
    if (!profile.firstName || !profile.email) {
      Alert.alert(
        language === "he" ? "פרטים חסרים" : "Missing Information",
        language === "he"
          ? "נא להשלים לפחות את השם והאימייל לפני סיום הרישום."
          : "Please complete at least your name and email before finishing registration."
      );
      return;
    }

    handleRegistrationComplete(conversationState);
  };

  // Get last assistant message with quick replies
  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .pop();
  const quickReplies = lastAssistantMessage?.quickReplies || [];

  // Check if in review stage
  const isReviewStage =
    conversationState?.currentStage === "review" ||
    conversationState?.status === "review";

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {language === "he" ? "טוען..." : "Loading..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("smartRegistration"),
          headerRight: () => (
            <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
              <RotateCcw size={22} color={COLORS.label} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* AI Badge */}
        <View style={styles.aiBadgeContainer}>
          <View style={styles.aiBadge}>
            <Sparkles size={14} color={COLORS.secondary} />
            <Text style={styles.aiBadgeText}>
              {language === "he" ? "רישום חכם מונחה AI" : "AI-Guided Registration"}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                { alignSelf: message.role === "user" ? "flex-end" : "flex-start" },
              ]}
            >
              {message.role === "assistant" && (
                <View
                  style={[
                    styles.assistantHeader,
                    { flexDirection: rtl ? "row-reverse" : "row" },
                  ]}
                >
                  <View style={styles.assistantAvatar}>
                    <Text style={styles.assistantAvatarText}>R</Text>
                  </View>
                  <Text style={styles.assistantName}>{t("appName")}</Text>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === "user"
                      ? styles.userMessageText
                      : styles.assistantMessageText,
                    { textAlign: rtl ? "right" : "left" },
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageContainer, { alignSelf: "flex-start" }]}>
              <View
                style={[
                  styles.assistantHeader,
                  { flexDirection: rtl ? "row-reverse" : "row" },
                ]}
              >
                <View style={styles.assistantAvatar}>
                  <Text style={styles.assistantAvatarText}>R</Text>
                </View>
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color={COLORS.tertiaryLabel} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Replies */}
        {quickReplies.length > 0 && !isLoading && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickRepliesContainer}
            contentContainerStyle={styles.quickRepliesContent}
          >
            {quickReplies.map((reply) => (
              <TouchableOpacity
                key={reply.id}
                onPress={() => handleQuickReply(reply)}
                style={styles.quickReply}
                activeOpacity={0.7}
              >
                <Text style={styles.quickReplyText}>{reply.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input area */}
        <View
          style={[
            styles.inputContainer,
            { flexDirection: rtl ? "row-reverse" : "row" },
          ]}
        >
          <TextInput
            style={[styles.input, { textAlign: rtl ? "right" : "left" }]}
            placeholder={t("typingPlaceholder")}
            placeholderTextColor={COLORS.tertiaryLabel}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputText.trim() && !isLoading
                    ? COLORS.primary
                    : COLORS.fill,
              },
            ]}
          >
            <Send
              size={20}
              color={inputText.trim() && !isLoading ? "#FFFFFF" : COLORS.tertiaryLabel}
            />
          </TouchableOpacity>
        </View>

        {/* Complete Registration Button (shown in review stage) */}
        {isReviewStage && (
          <TouchableOpacity
            onPress={handleCompleteRegistration}
            style={styles.completeButton}
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>
              {t("finishRegistration")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Progress indicator */}
        {conversationState && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {language === "he"
                ? `שלב: ${getStageLabel(conversationState.currentStage, "he")}`
                : `Stage: ${getStageLabel(conversationState.currentStage, "en")}`}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStageLabel(stage: string, lang: "he" | "en"): string {
  const labels: Record<string, { he: string; en: string }> = {
    welcome: { he: "ברוכים הבאים", en: "Welcome" },
    profile: { he: "פרטים אישיים", en: "Personal Info" },
    professional: { he: "מידע מקצועי", en: "Professional" },
    family: { he: "משפחה", en: "Family" },
    spouse: { he: "בן/בת זוג", en: "Spouse" },
    children: { he: "ילדים", en: "Children" },
    review: { he: "סקירה", en: "Review" },
    completed: { he: "הושלם", en: "Completed" },
  };
  return labels[stage]?.[lang] || stage;
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
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.tertiaryLabel,
  },
  headerButton: {
    padding: 8,
  },
  aiBadgeContainer: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.secondary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.secondary,
  },
  scrollView: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageContainer: {
    maxWidth: "85%",
  },
  assistantHeader: {
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  assistantAvatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  assistantName: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
    fontWeight: "500",
  },
  messageBubble: {
    borderRadius: 18,
    padding: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: COLORS.secondaryBackground,
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  assistantMessageText: {
    color: COLORS.label,
  },
  quickRepliesContainer: {
    maxHeight: 52,
    backgroundColor: COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  quickRepliesContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  quickReply: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  quickReplyText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  inputContainer: {
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    backgroundColor: COLORS.secondaryBackground,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.fill,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.label,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  progressContainer: {
    alignItems: "center",
    paddingBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
  },
});
