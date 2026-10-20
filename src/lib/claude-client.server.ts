/**
 * Claude AI Client Service
 * Core integration with Anthropic's Claude API
 * Server-side only - API key must never be exposed to client
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z, type ZodType } from "zod/v4";

// Environment configuration
const ANTHROPIC_MODEL = process.env["ANTHROPIC_MODEL"] || "claude-sonnet-4-6";
const ANTHROPIC_SEARCH_MODEL = process.env["ANTHROPIC_SEARCH_MODEL"] || ANTHROPIC_MODEL;

// Singleton client instance
let clientInstance: Anthropic | null = null;

/**
 * Get or create the Anthropic client instance
 */
function getClient(): Anthropic {
  const apiKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey,
      timeout: 45_000,
      maxRetries: 1,
    });
  }

  return clientInstance;
}

/**
 * Check if Claude AI is configured and available
 */
export function isClaudeConfigured(): boolean {
  return !!process.env["ANTHROPIC_API_KEY"]?.trim();
}

/**
 * Message types for conversation
 */
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Options for Claude API calls
 */
export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  stopSequences?: string[];
}

/**
 * Send a message to Claude and get a text response
 */
export async function sendMessage(
  messages: ConversationMessage[],
  options: ClaudeOptions = {},
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: options.model || ANTHROPIC_MODEL,
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 0.7,
    ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    ...(options.stopSequences ? { stop_sequences: options.stopSequences } : {}),
  });

  // Extract text content from response
  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  return textContent.text;
}

/**
 * Send a message and parse the response using a Zod schema
 * Uses Claude's structured output feature for reliable JSON parsing
 */
export async function sendMessageWithSchema<T extends ZodType>(
  messages: ConversationMessage[],
  schema: T,
  options: ClaudeOptions = {},
): Promise<z.infer<T>> {
  const client = getClient();

  const response = await client.messages.parse({
    model: options.model || ANTHROPIC_MODEL,
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 0.3, // Lower temperature for structured output
    ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    output_config: {
      format: zodOutputFormat(schema),
    },
  });

  if (
    response.stop_reason === "max_tokens" ||
    response.stop_reason === "refusal" ||
    !response.parsed_output
  ) {
    throw new Error("Failed to parse Claude response with schema");
  }

  return response.parsed_output;
}

/**
 * Send a search query interpretation request
 * Uses the search-optimized model for faster responses
 */
export async function interpretSearchQuery<T extends ZodType>(
  query: string,
  schema: T,
  systemPrompt: string,
): Promise<z.infer<T>> {
  return sendMessageWithSchema([{ role: "user", content: query }], schema, {
    model: ANTHROPIC_SEARCH_MODEL,
    systemPrompt,
    maxTokens: 1024,
    temperature: 0.2, // Very low temperature for consistent interpretation
  });
}

/**
 * Send a registration conversation message
 * Uses the main model with higher temperature for natural conversation
 */
export async function sendRegistrationMessage(
  conversationHistory: ConversationMessage[],
  systemPrompt: string,
): Promise<string> {
  return sendMessage(conversationHistory, {
    model: ANTHROPIC_MODEL,
    systemPrompt,
    maxTokens: 1024,
    temperature: 0.7,
  });
}

/**
 * Extract structured data from a registration conversation
 */
export async function extractRegistrationData<T extends ZodType>(
  conversationHistory: ConversationMessage[],
  schema: T,
  systemPrompt: string,
): Promise<z.infer<T>> {
  return sendMessageWithSchema(conversationHistory, schema, {
    model: ANTHROPIC_MODEL,
    systemPrompt,
    maxTokens: 2048,
    temperature: 0.2,
  });
}

/**
 * Generate follow-up questions for registration
 */
export async function generateFollowUpQuestions<T extends ZodType>(
  extractedData: Record<string, unknown>,
  missingFields: string[],
  schema: T,
  systemPrompt: string,
  language: "he" | "en",
): Promise<z.infer<T>> {
  const prompt = `
Current extracted data: ${JSON.stringify(extractedData, null, 2)}
Missing or incomplete fields: ${missingFields.join(", ")}
Language: ${language === "he" ? "Hebrew" : "English"}

Generate appropriate follow-up questions to gather the missing information naturally.
`;

  return sendMessageWithSchema([{ role: "user", content: prompt }], schema, {
    systemPrompt,
    maxTokens: 512,
    temperature: 0.5,
  });
}

export { ANTHROPIC_MODEL, ANTHROPIC_SEARCH_MODEL };
