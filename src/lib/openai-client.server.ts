/**
 * OpenAI-compatible AI Client Service
 * Works with OpenAI, Azure OpenAI, OpenRouter, and other compatible endpoints
 * Server-side only - API key must never be exposed to client
 */

import OpenAI from "openai";
import { z } from "zod/v4";

// Environment configuration
const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];
const OPENAI_BASE_URL = process.env["OPENAI_BASE_URL"] || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env["OPENAI_MODEL"] || "gpt-4o-mini";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Singleton client instance
let clientInstance: OpenAI | null = null;

/**
 * Get or create the OpenAI client instance
 */
function getClient(): OpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  if (!clientInstance) {
    clientInstance = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: OPENAI_BASE_URL,
    });
  }

  return clientInstance;
}

/**
 * Check if OpenAI-compatible API is configured and available
 */
export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (503, 429, network errors)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("503") ||
      message.includes("service unavailable") ||
      message.includes("429") ||
      message.includes("rate limit") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("connection")
    );
  }
  return false;
}

/**
 * Execute a function with retry logic for transient errors
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && isRetryableError(error)) {
        const backoffDelay = delayMs * Math.pow(2, attempt);
        console.warn(`OpenAI API error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffDelay}ms...`);
        await sleep(backoffDelay);
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

/**
 * Message types for conversation
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Options for OpenAI API calls
 */
export interface OpenAIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Send a message to OpenAI and get a text response
 */
export async function sendMessage(
  messages: ConversationMessage[],
  options: OpenAIOptions = {}
): Promise<string> {
  return withRetry(async () => {
    const client = getClient();
    const model = options.model || OPENAI_MODEL;

    // Build messages array
    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt if provided
    if (options.systemPrompt) {
      apiMessages.push({ role: "system", content: options.systemPrompt });
    }

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role === "system") {
        apiMessages.push({ role: "system", content: msg.content });
      } else if (msg.role === "user") {
        apiMessages.push({ role: "user", content: msg.content });
      } else {
        apiMessages.push({ role: "assistant", content: msg.content });
      }
    }

    const response = await client.chat.completions.create({
      model,
      messages: apiMessages,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
    });

    return response.choices[0]?.message?.content || "";
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodSchema = z.ZodType<any, any, any>;

/**
 * Send a message and parse the response as JSON using a Zod schema
 */
export async function sendMessageWithSchema<T extends AnyZodSchema>(
  messages: ConversationMessage[],
  schema: T,
  options: OpenAIOptions = {}
): Promise<z.infer<T>> {
  return withRetry(async () => {
    const client = getClient();
    const model = options.model || OPENAI_MODEL;
    const jsonSchema = zodToJsonSchema(schema);

    // Add JSON instruction to system prompt
    const jsonInstruction = `
IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, no explanations.
The response must be a valid JSON object that matches this exact schema:
${JSON.stringify(jsonSchema, null, 2)}

CRITICAL RULES:
1. Return ONLY valid JSON, no other text
2. All required fields must be present
3. Follow the exact types specified in the schema
`;

    const systemPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${jsonInstruction}`
      : jsonInstruction;

    // Build messages array
    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role === "user") {
        apiMessages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        apiMessages.push({ role: "assistant", content: msg.content });
      }
    }

    const response = await client.chat.completions.create({
      model,
      messages: apiMessages,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.3,
      response_format: { type: "json_object" },
    });

    const responseText = response.choices[0]?.message?.content || "{}";

    // Parse and validate with Zod
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("Failed to parse OpenAI response as JSON:", responseText);
      throw new Error(`Invalid JSON from OpenAI: ${jsonError}`);
    }

    try {
      return schema.parse(parsed);
    } catch (validationError) {
      console.error("Failed to validate OpenAI response:", JSON.stringify(parsed, null, 2));
      throw new Error(`Failed to validate OpenAI response: ${JSON.stringify(validationError)}`);
    }
  });
}

/**
 * Convert Zod schema to JSON schema for prompting
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function zodToJsonSchema(schema: any): Record<string, unknown> {
  const def = schema._def || schema._zod?.def;

  if (!def) {
    return { type: "string" };
  }

  const typeName = def.typeName || def.type;

  if (typeName === "ZodObject" || typeName === "object") {
    const shape = typeof def.shape === "function" ? def.shape() : def.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    if (shape) {
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(value);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const valueDef = (value as any)._def || (value as any)._zod?.def;
        if (valueDef && valueDef.typeName !== "ZodOptional" && valueDef.typeName !== "ZodDefault") {
          required.push(key);
        }
      }
    }

    return { type: "object", properties, required };
  }

  if (typeName === "ZodArray" || typeName === "array") {
    return { type: "array", items: zodToJsonSchema(def.type || def.element) };
  }

  if (typeName === "ZodString" || typeName === "string") {
    return { type: "string" };
  }

  if (typeName === "ZodNumber" || typeName === "number") {
    return { type: "number" };
  }

  if (typeName === "ZodBoolean" || typeName === "boolean") {
    return { type: "boolean" };
  }

  if (typeName === "ZodEnum" || typeName === "enum") {
    return { type: "string", enum: def.values };
  }

  if (typeName === "ZodOptional" || typeName === "optional") {
    return zodToJsonSchema(def.innerType || def.wrapped);
  }

  if (typeName === "ZodDefault" || typeName === "default") {
    return zodToJsonSchema(def.innerType || def.wrapped);
  }

  if (typeName === "ZodNullable" || typeName === "nullable") {
    return { ...zodToJsonSchema(def.innerType || def.wrapped), nullable: true };
  }

  return { type: "string" };
}

/**
 * Send a search query interpretation request
 * Uses a faster response configuration for quick results
 */
export async function interpretSearchQuery<T extends AnyZodSchema>(
  query: string,
  schema: T,
  systemPrompt: string
): Promise<z.infer<T>> {
  return sendMessageWithSchema(
    [{ role: "user", content: query }],
    schema,
    {
      systemPrompt,
      maxTokens: 1024,
      temperature: 0.2,
    }
  );
}

/**
 * Send a registration conversation message
 * Uses higher temperature for natural conversation
 */
export async function sendRegistrationMessage(
  conversationHistory: ConversationMessage[],
  systemPrompt: string
): Promise<string> {
  return sendMessage(conversationHistory, {
    systemPrompt,
    maxTokens: 1024,
    temperature: 0.7,
  });
}

/**
 * Extract structured data from a registration conversation
 */
export async function extractRegistrationData<T extends AnyZodSchema>(
  conversationHistory: ConversationMessage[],
  schema: T,
  systemPrompt: string
): Promise<z.infer<T>> {
  return sendMessageWithSchema(conversationHistory, schema, {
    systemPrompt,
    maxTokens: 2048,
    temperature: 0.2,
  });
}

export { OPENAI_MODEL };
