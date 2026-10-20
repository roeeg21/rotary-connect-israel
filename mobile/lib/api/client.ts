/**
 * API Client for Rotary Connect Israel
 * Connects to the backend server
 */

import type {
  SearchResult,
  ChatMessage,
  ConversationState,
  SearchResponse,
  ChatResponse,
} from "../types";

// API base URL - configure for your environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

interface ApiError {
  message: string;
  code?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: `HTTP error ${response.status}`,
      }));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * AI-powered search
   */
  async search(
    query: string,
    options: {
      limit?: number;
      relationshipFilter?: "all" | "members" | "spouses" | "children";
      locationFilter?: string;
    } = {}
  ): Promise<SearchResponse> {
    return this.request<SearchResponse>("/api/search", {
      method: "POST",
      body: JSON.stringify({
        query,
        limit: options.limit ?? 20,
        relationshipFilter: options.relationshipFilter ?? "all",
        locationFilter: options.locationFilter,
      }),
    });
  }

  /**
   * Process chat message during registration
   */
  async sendChatMessage(
    message: string,
    state: ConversationState,
    history: ChatMessage[]
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        message,
        state,
        history,
      }),
    });
  }

  /**
   * Resume a saved registration session
   */
  async resumeSession(sessionId: string): Promise<{
    state: ConversationState;
    history: ChatMessage[];
  }> {
    return this.request(`/api/chat/resume`, {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
  }

  /**
   * Complete registration and save to database
   */
  async completeRegistration(
    state: ConversationState,
    password: string
  ): Promise<{ success: boolean; userId?: string }> {
    return this.request("/api/register", {
      method: "POST",
      body: JSON.stringify({ state, password }),
    });
  }

  /**
   * Send login OTP
   */
  async sendLoginOTP(
    emailOrPhone: string
  ): Promise<{ success: boolean; method: "email" | "sms" }> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ emailOrPhone }),
    });
  }

  /**
   * Verify login OTP
   */
  async verifyOTP(
    emailOrPhone: string,
    code: string
  ): Promise<{ success: boolean; account?: Record<string, unknown> }> {
    return this.request("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ emailOrPhone, code }),
    });
  }
}

// Singleton instance
export const api = new ApiClient();

// Export for testing
export { ApiClient };
