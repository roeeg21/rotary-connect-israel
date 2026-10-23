/**
 * Password Service
 * Handles password hashing and verification for user authentication
 */

import { MongoClient, ServerApiVersion, type Collection } from "mongodb";

// User document type with password
type UserWithPassword = {
  email: string;
  emailLower: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  club?: string;
  createdAt: Date;
  updatedAt: Date;
};

type MongoCache = {
  clientPromise?: Promise<MongoClient>;
  uri?: string;
};

const mongoCache = globalThis as typeof globalThis & {
  __rotaryMongoCache?: MongoCache;
};

function getMongoCache() {
  mongoCache.__rotaryMongoCache ??= {};
  return mongoCache.__rotaryMongoCache;
}

function getMongoConfig() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return {
    uri,
    dbName: process.env.MONGODB_DB_NAME || "rotary_connect_israel",
  };
}

async function getMongoClient(uri: string) {
  const cache = getMongoCache();

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
  }

  return cache.clientPromise;
}

async function getUsersCollection(): Promise<Collection<UserWithPassword>> {
  const { uri, dbName } = getMongoConfig();
  const client = await getMongoClient(uri);
  return client.db(dbName).collection<UserWithPassword>("users");
}

/**
 * Simple hash function for password (using Web Crypto API)
 * For production, consider using bcrypt or argon2
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify password against stored hash
 */
async function comparePassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

/**
 * Verify user password
 */
export async function verifyPassword(
  email: string,
  password: string
): Promise<{
  success: boolean;
  email?: string;
  user?: { firstName: string; lastName: string; club: string };
  error?: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: "Invalid email format" };
  }

  try {
    const collection = await getUsersCollection();
    const user = await collection.findOne({ emailLower: normalizedEmail });

    if (!user) {
      return { success: false, error: "User not found. Please register first." };
    }

    if (!user.passwordHash) {
      return { success: false, error: "No password set. Please use one-time code to login." };
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    return {
      success: true,
      email: user.email,
      user: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        club: user.club || "",
      },
    };
  } catch (error) {
    console.error("Password verification error:", error);
    return { success: false, error: "Failed to verify password. Please try again." };
  }
}

/**
 * Set or update user password
 */
export async function setPassword(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Validate password
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  try {
    const collection = await getUsersCollection();
    const passwordHash = await hashPassword(password);
    const now = new Date();

    const result = await collection.updateOne(
      { emailLower: normalizedEmail },
      {
        $set: {
          passwordHash,
          updatedAt: now,
        },
        $setOnInsert: {
          email: normalizedEmail,
          emailLower: normalizedEmail,
          createdAt: now,
        },
      },
      { upsert: true }
    );

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      return { success: false, error: "Failed to set password" };
    }

    return { success: true };
  } catch (error) {
    console.error("Set password error:", error);
    return { success: false, error: "Failed to set password. Please try again." };
  }
}

/**
 * Check if user has a password set
 */
export async function hasPassword(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const collection = await getUsersCollection();
    const user = await collection.findOne(
      { emailLower: normalizedEmail },
      { projection: { passwordHash: 1 } }
    );

    return !!user?.passwordHash;
  } catch (error) {
    console.error("Check password error:", error);
    return false;
  }
}
