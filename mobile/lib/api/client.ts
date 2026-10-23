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
  Member,
  FamilyMember,
  BrowseCategory,
  Account,
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

  /**
   * Get member by ID
   */
  async getMember(id: string): Promise<Member | null> {
    return this.request<Member | null>(`/api/members/${id}`);
  }

  /**
   * Get multiple members by IDs
   */
  async getMembers(ids: string[]): Promise<Member[]> {
    return this.request<Member[]>("/api/members", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  /**
   * Get all members (with optional pagination)
   */
  async getAllMembers(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ members: Member[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());
    return this.request(`/api/members?${params.toString()}`);
  }

  /**
   * Get family members for a member
   */
  async getFamilyMembers(memberId: string): Promise<FamilyMember[]> {
    return this.request<FamilyMember[]>(`/api/members/${memberId}/family`);
  }

  /**
   * Get browse categories (industries, locations, professions, expertise)
   */
  async getCategories(): Promise<{
    industries: BrowseCategory[];
    locations: BrowseCategory[];
    professions: BrowseCategory[];
    expertise: BrowseCategory[];
  }> {
    return this.request("/api/categories");
  }

  /**
   * Get new members (recently joined)
   */
  async getNewMembers(limit: number = 5): Promise<Member[]> {
    return this.request<Member[]>(`/api/members/new?limit=${limit}`);
  }
}

// Singleton instance
export const api = new ApiClient();

// Export for testing
export { ApiClient };
