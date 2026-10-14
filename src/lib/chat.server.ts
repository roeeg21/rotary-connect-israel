/**
 * Chat Server Module - Session Persistence
 *
 * Handles saving and retrieving conversation sessions from MongoDB.
 */

import { MongoClient, ServerApiVersion, type Collection } from "mongodb";
import type { ConversationState, ChatMessage } from "./conversation";

// Session document type
interface ChatSessionDocument {
  sessionId: string;
  userId?: string;
  state: ConversationState;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// MongoDB cache for connection reuse
type MongoChatCache = {
  collectionKey?: string;
  clientPromise?: Promise<MongoClient>;
  indexesPromise?: Promise<void>;
  uri?: string;
};

const mongoChatCache = globalThis as typeof globalThis & {
  __rotaryChatMongoCache?: MongoChatCache;
};

function getChatMongoCache() {
  mongoChatCache.__rotaryChatMongoCache ??= {};
  return mongoChatCache.__rotaryChatMongoCache;
}

function getMongoConfig() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return {
    uri,
    dbName: process.env.MONGODB_DB_NAME || "rotary_connect_israel",
    collectionName: process.env.MONGODB_CHAT_COLLECTION || "chat_sessions",
  };
}

async function getMongoClient(uri: string) {
  const cache = getChatMongoCache();

  if (!cache.clientPromise || cache.uri !== uri) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    cache.uri = uri;
    cache.clientPromise = client.connect();
    cache.indexesPromise = undefined;
    cache.collectionKey = undefined;
  }

  return cache.clientPromise;
}

async function ensureIndexes(collection: Collection<ChatSessionDocument>) {
  const cache = getChatMongoCache();
  const collectionKey = `${collection.db.databaseName}:${collection.collectionName}`;

  if (!cache.indexesPromise || cache.collectionKey !== collectionKey) {
    cache.collectionKey = collectionKey;
    cache.indexesPromise = (async () => {
      // Unique index on sessionId
      await collection.createIndex(
        { sessionId: 1 },
        { unique: true, name: "chat_sessions_sessionId_unique" }
      );

      // Index for finding sessions by user
      await collection.createIndex(
        { userId: 1, updatedAt: -1 },
        { name: "chat_sessions_userId_updatedAt" }
      );

      // TTL index for auto-expiration (30 days)
      await collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "chat_sessions_ttl" }
      );

      // Index for status
      await collection.createIndex(
        { "state.status": 1, updatedAt: -1 },
        { name: "chat_sessions_status_updatedAt" }
      );
    })();
  }

  await cache.indexesPromise;
}

async function getChatSessionsCollection() {
  const { uri, dbName, collectionName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<ChatSessionDocument>(collectionName);
  await ensureIndexes(collection);
  return collection;
}

/**
 * Save or update a conversation session
 */
export async function saveConversationSession(
  state: ConversationState,
  messages?: ChatMessage[]
): Promise<void> {
  const collection = await getChatSessionsCollection();
  const now = new Date();

  // Sessions expire after 30 days of inactivity
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await collection.updateOne(
    { sessionId: state.sessionId },
    {
      $set: {
        state,
        updatedAt: now,
        expiresAt,
        ...(messages ? { messages } : {}),
      },
      $setOnInsert: {
        sessionId: state.sessionId,
        createdAt: now,
      },
    },
    { upsert: true }
  );
}

/**
 * Get a conversation session by ID
 */
export async function getConversationSession(
  sessionId: string
): Promise<ChatSessionDocument | null> {
  const collection = await getChatSessionsCollection();
  return collection.findOne({ sessionId });
}

/**
 * Get active sessions for a user (by email)
 */
export async function getUserActiveSessions(
  email: string
): Promise<ChatSessionDocument[]> {
  const collection = await getChatSessionsCollection();

  return collection
    .find({
      "state.profile.email": email.toLowerCase(),
      "state.status": { $in: ["in_progress", "review"] },
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .toArray();
}

/**
 * Mark a session as abandoned
 */
export async function abandonSession(sessionId: string): Promise<void> {
  const collection = await getChatSessionsCollection();
  const now = new Date();

  await collection.updateOne(
    { sessionId },
    {
      $set: {
        "state.status": "abandoned",
        updatedAt: now,
      },
    }
  );
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const collection = await getChatSessionsCollection();
  await collection.deleteOne({ sessionId });
}

/**
 * Get session statistics (for admin dashboard)
 */
export async function getSessionStats(): Promise<{
  total: number;
  inProgress: number;
  completed: number;
  abandoned: number;
}> {
  const collection = await getChatSessionsCollection();

  const stats = await collection
    .aggregate([
      {
        $group: {
          _id: "$state.status",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const result = {
    total: 0,
    inProgress: 0,
    completed: 0,
    abandoned: 0,
  };

  for (const stat of stats) {
    result.total += stat.count;
    if (stat._id === "in_progress") result.inProgress = stat.count;
    else if (stat._id === "completed") result.completed = stat.count;
    else if (stat._id === "abandoned") result.abandoned = stat.count;
  }

  return result;
}
