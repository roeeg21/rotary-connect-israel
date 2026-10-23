/**
 * Gemini AI Client Service
 * Core integration with Google's Gemini API
 * Server-side only - API key must never be exposed to client
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { z } from "zod/v4";

// Environment configuration
const GEMINI_API_KEY = process.env["GEMINI_API_KEY"];
const GEMINI_MODEL = process.env["GEMINI_MODEL"] || "gemini-3.5-flash-lite";
const GEMINI_SEARCH_MODEL = process.env["GEMINI_SEARCH_MODEL"] || "gemini-3.5-flash-lite";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Singleton client instance
let clientInstance: GoogleGenerativeAI | null = null;

/**
 * Get or create the Gemini client instance
 */
function getClient(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  if (!clientInstance) {
    clientInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  return clientInstance;
}

/**
 * Check if Gemini AI is configured and available
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
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
      message.includes("high demand") ||
      message.includes("429") ||
      message.includes("rate limit") ||
      message.includes("timeout") ||
      message.includes("network")
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
        const backoffDelay = delayMs * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Gemini API error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffDelay}ms...`);
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
  role: "user" | "assistant" | "model";
  content: string;
}

/**
 * Options for Gemini API calls
 */
export interface GeminiOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Get a generative model with system instruction
 */
function getModel(options: GeminiOptions = {}): GenerativeModel {
  const client = getClient();
  const config: Parameters<typeof client.getGenerativeModel>[0] = {
    model: options.model || GEMINI_MODEL,
    generationConfig: {
      maxOutputTokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
    },
  };
  if (options.systemPrompt) {
    config.systemInstruction = options.systemPrompt;
  }
  return client.getGenerativeModel(config);
}

/**
 * Send a message to Gemini and get a text response
 */
export async function sendMessage(
  messages: ConversationMessage[],
  options: GeminiOptions = {}
): Promise<string> {
  return withRetry(async () => {
    const model = getModel(options);

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    return response.text();
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
  options: GeminiOptions = {}
): Promise<z.infer<T>> {
  return withRetry(async () => {
    const jsonSchema = zodToJsonSchema(schema);

    // Add JSON instruction to system prompt with explicit examples
    const jsonInstruction = `
IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, no explanations.
The response must be a valid JSON object that matches this exact schema:
${JSON.stringify(jsonSchema, null, 2)}

CRITICAL RULES FOR THE "updates" FIELD:
1. The "updates" field MUST be an array of objects
2. Each object MUST have exactly two properties: "path" (string) and "value" (string)
3. Example: [{"path": "profile.firstName", "value": "שרה"}, {"path": "profile.age", "value": "42"}]
4. NEVER return strings, NEVER return "path:value" format, NEVER return "path=value" format
5. NEVER return flat arrays like ["profile.firstName", "שרה"] - always use objects
6. Preserve all characters in names - Hebrew names must be complete (e.g., "שרה" not "רה")
`;

    const systemPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${jsonInstruction}`
      : jsonInstruction;

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const client = getClient();
    const modelConfig: Parameters<typeof client.getGenerativeModel>[0] = {
      model: options.model || GEMINI_MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 2048,
        temperature: options.temperature ?? 0.3,
        responseMimeType: "application/json",
        responseSchema: jsonSchema as Parameters<typeof client.getGenerativeModel>[0]["generationConfig"] extends { responseSchema?: infer R } ? R : never,
      },
    };
    const modelWithJson = client.getGenerativeModel(modelConfig);

    const chat = modelWithJson.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    // Parse and validate with Zod
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("Failed to parse Gemini response as JSON:", responseText);
      throw new Error(`Invalid JSON from Gemini: ${jsonError}`);
    }

    try {
      // Fix Gemini's tendency to return malformed updates
      const fixed = fixStringifiedObjects(parsed);
      return schema.parse(fixed);
    } catch (validationError) {
      // Log both the original and fixed versions for debugging
      console.error("Failed to parse Gemini response:", JSON.stringify(parsed, null, 2));
      console.error("After fix attempt:", JSON.stringify(fixStringifiedObjects(parsed), null, 2));
      throw new Error(`Failed to parse Gemini response as JSON: ${JSON.stringify(validationError)}`);
    }
  });
}

/**
 * Check if a string looks like a known registration path
 */
function isKnownPath(str: string): boolean {
  // Must use end anchor ($) to avoid partial matches like "david.levy@gmail.com"
  const isPathPattern = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*|\[\d+\])+$/;
  const knownPrefixes = ["profile.", "spouse.", "children.", "spouse.educationHistory.", "profile.educationHistory.", "rotaryPositions."];
  const knownRoots = ["customClub", "clubId", "joinYear", "hasSpouse", "hasChildren", "hasEligibleChildren", "rotaryJoinDate", "rotaryPositions"];

  return (
    isPathPattern.test(str) ||
    knownPrefixes.some((prefix) => str.startsWith(prefix)) ||
    knownRoots.includes(str)
  );
}

/**
 * Check if a string does NOT look like a path (likely a value)
 */
function isLikelyValue(str: string): boolean {
  // Contains characters that paths don't have
  if (str.includes("@") || str.includes(" ") || str.includes(",")) return true;
  // Contains Hebrew characters (values often do, paths don't)
  if (/[\u0590-\u05FF]/.test(str)) return true;
  // Is a pure number
  if (/^\d+$/.test(str)) return true;
  // Is a boolean string
  if (str === "true" || str === "false") return true;
  // Is an email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return true;
  // Is a phone number
  if (/^[\d\-+() ]+$/.test(str) && str.length >= 7) return true;
  return false;
}

/**
 * Try to parse a single string item that might be a path=value or path:value format
 */
function tryParsePathValue(item: string): { path: string; value: string } | null {
  // Trim whitespace
  const trimmed = item.trim();

  // Case 1: Stringified JSON object like '{"path": "...", "value": "..."}'
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && "path" in parsed && "value" in parsed) {
        return { path: String(parsed.path), value: String(parsed.value) };
      }
    } catch {
      // Try fixing common JSON issues
      try {
        // Fix Hebrew quotes
        const fixed = trimmed.replace(/״/g, '\\"');
        const parsed = JSON.parse(fixed);
        if (parsed && typeof parsed === "object" && "path" in parsed && "value" in parsed) {
          return { path: String(parsed.path), value: String(parsed.value) };
        }
      } catch {
        // Continue to other formats
      }
    }
  }

  // Case 2: Equals-separated format like "profile.firstName=David"
  const equalsIndex = trimmed.indexOf("=");
  if (equalsIndex > 0) {
    const path = trimmed.substring(0, equalsIndex);
    const value = trimmed.substring(equalsIndex + 1);
    if (isKnownPath(path)) {
      return { path, value };
    }
  }

  // Case 3: Colon-separated format like "profile.firstName:David"
  // Be careful not to match URLs (://), timestamps (HH:MM), or object notation
  const colonMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9._\[\]]*):(?!\/\/)(.+)$/);
  if (colonMatch) {
    const path = colonMatch[1];
    const value = colonMatch[2];
    if (isKnownPath(path)) {
      return { path, value };
    }
  }

  return null;
}

/**
 * Recursively fix Gemini's tendency to return malformed JSON in arrays.
 * Handles multiple malformed formats that Gemini produces:
 * 1. Stringified JSON objects: "{\"path\": \"...\", \"value\": \"...\"}"
 * 2. Colon-separated strings: "profile.firstName:David"
 * 3. Equals-separated strings: "profile.firstName=David"
 * 4. Flat alternating pairs: ["profile.firstName", "David", "profile.lastName", "Smith"]
 * 5. Single path strings without values (filtered out)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fixStringifiedObjects(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    // Case 4: Check if this is a flat alternating key-value array
    // Detection: all strings, even count, alternating paths and values
    if (obj.length >= 2 && obj.length % 2 === 0 && obj.every((item) => typeof item === "string")) {
      const firstItem = obj[0] as string;
      const secondItem = obj[1] as string;

      // Check if first looks like path and second looks like value
      const firstIsPath = isKnownPath(firstItem);
      const secondIsValue = isLikelyValue(secondItem) || !isKnownPath(secondItem);

      if (firstIsPath && secondIsValue) {
        // Verify the pattern continues (paths at even indices, values at odd)
        let isAlternating = true;
        for (let i = 0; i < obj.length && isAlternating; i += 2) {
          const path = obj[i] as string;
          if (!isKnownPath(path)) {
            // Allow if it starts with a known prefix even without full match
            const startsWithKnown = ["profile", "spouse", "children", "customClub", "clubId", "joinYear", "hasSpouse", "hasChildren", "hasEligibleChildren", "rotaryJoinDate", "rotaryPositions"].some(
              (p) => path === p || path.startsWith(p + ".")
            );
            if (!startsWithKnown) isAlternating = false;
          }
        }

        if (isAlternating) {
          const result: Array<{ path: string; value: string }> = [];
          for (let i = 0; i < obj.length; i += 2) {
            result.push({ path: obj[i] as string, value: obj[i + 1] as string });
          }
          return result;
        }
      }
    }

    // Process each item individually
    const results: unknown[] = [];
    for (const item of obj) {
      if (typeof item === "string") {
        // Try to parse as path=value format
        const pathValue = tryParsePathValue(item);
        if (pathValue) {
          results.push(pathValue);
          continue;
        }

        // Case 5: Just a path without value (invalid) - skip it
        if (isKnownPath(item) && !item.includes(":") && !item.includes("=")) {
          continue;
        }

        // If it's still a string and none of the above matched,
        // it might be an unknown format - keep it and let Zod fail with a clear error
        results.push(item);
      } else if (item !== null && item !== undefined) {
        // Recursively process non-string items
        results.push(fixStringifiedObjects(item));
      }
    }
    return results;
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = fixStringifiedObjects(value);
    }
    return result;
  }

  return obj;
}

/**
 * Convert Zod schema to JSON schema for prompting
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function zodToJsonSchema(schema: any): Record<string, unknown> {
  // Simple conversion for common types
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
 * Uses a faster model for quick responses
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
      model: GEMINI_SEARCH_MODEL,
      systemPrompt,
      maxTokens: 1024,
      temperature: 0.2, // Very low temperature for consistent interpretation
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
    model: GEMINI_MODEL,
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
    model: GEMINI_MODEL,
    systemPrompt,
    maxTokens: 2048,
    temperature: 0.2,
  });
}

export { GEMINI_MODEL, GEMINI_SEARCH_MODEL };
