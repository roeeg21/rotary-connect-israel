import { MongoClient, ServerApiVersion, type Collection } from "mongodb";

import type { RegistrationInput } from "./user-registration";

type RegistrationDocument = RegistrationInput & {
  emailLower: string;
  club: string;
  createdAt: Date;
  updatedAt: Date;
};

// Social auth types
export type SocialProvider = "apple" | "google";

export type SocialAuthInput = {
  provider: SocialProvider;
  providerId: string; // Apple/Google user ID
  email: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
};

type SocialAuthDocument = {
  provider: SocialProvider;
  providerId: string;
  email: string;
  emailLower: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  club?: string;
  onboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MongoCache = {
  collectionKey?: string;
  clientPromise?: Promise<MongoClient>;
  indexesPromise?: Promise<void>;
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
    collectionName: process.env.MONGODB_USERS_COLLECTION || "users",
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
    cache.indexesPromise = undefined;
    cache.collectionKey = undefined;
  }

  return cache.clientPromise;
}

async function ensureIndexes(collection: Collection<RegistrationDocument>) {
  const cache = getMongoCache();
  const collectionKey = `${collection.db.databaseName}:${collection.collectionName}`;

  if (!cache.indexesPromise || cache.collectionKey !== collectionKey) {
    cache.collectionKey = collectionKey;
    cache.indexesPromise = (async () => {
      await collection.createIndex({ emailLower: 1 }, { unique: true, name: "users_email_unique" });
      await collection.createIndex({ createdAt: -1 }, { name: "users_createdAt_desc" });
      await collection.createIndex({ updatedAt: -1 }, { name: "users_updatedAt_desc" });
    })();
  }

  await cache.indexesPromise;
}

async function getUsersCollection() {
  const { uri, dbName, collectionName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<RegistrationDocument>(collectionName);
  await ensureIndexes(collection);
  return collection;
}

export async function upsertUserRegistration(input: RegistrationInput) {
  const collection = await getUsersCollection();
  const now = new Date();
  const email = input.email.trim();
  const emailLower = email.toLowerCase();
  const club = input.clubId || input.customClub;

  await collection.updateOne(
    { emailLower },
    {
      $set: {
        ...input,
        email,
        emailLower,
        club,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

// Social authentication functions
export async function findOrCreateSocialUser(input: SocialAuthInput): Promise<SocialAuthDocument> {
  const { uri, dbName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<SocialAuthDocument>("users");

  const now = new Date();
  const emailLower = input.email.toLowerCase();

  // First try to find by provider + providerId
  let user = await collection.findOne({
    provider: input.provider,
    providerId: input.providerId,
  });

  if (user) {
    // Update existing user
    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          email: input.email,
          emailLower,
          firstName: input.firstName || user.firstName,
          lastName: input.lastName || user.lastName,
          photo: input.photo || user.photo,
          updatedAt: now,
        },
      }
    );
    return { ...user, updatedAt: now };
  }

  // Check if email exists with different provider
  const existingByEmail = await collection.findOne({ emailLower });
  if (existingByEmail) {
    // Link this provider to existing account
    await collection.updateOne(
      { _id: existingByEmail._id },
      {
        $set: {
          provider: input.provider,
          providerId: input.providerId,
          photo: input.photo || existingByEmail.photo,
          updatedAt: now,
        },
      }
    );
    return { ...existingByEmail, provider: input.provider, providerId: input.providerId, updatedAt: now };
  }

  // Create new user
  const newUser: SocialAuthDocument = {
    provider: input.provider,
    providerId: input.providerId,
    email: input.email,
    emailLower,
    firstName: input.firstName,
    lastName: input.lastName,
    photo: input.photo,
    onboarded: false,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(newUser);
  return newUser;
}

export async function getUserByEmail(email: string): Promise<SocialAuthDocument | null> {
  const { uri, dbName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<SocialAuthDocument>("users");

  return collection.findOne({ emailLower: email.toLowerCase() });
}

export async function updateUserOnboarding(email: string, club: string): Promise<void> {
  const { uri, dbName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<SocialAuthDocument>("users");

  await collection.updateOne(
    { emailLower: email.toLowerCase() },
    {
      $set: {
        club,
        onboarded: true,
        updatedAt: new Date(),
      },
    }
  );
}

// ============================================================================
// COMPLETE REGISTRATION
// ============================================================================

import type { RegistrationData } from "./registration-schema";

/**
 * Full user document type combining registration data with system fields
 */
type UserDocument = RegistrationData & {
  emailLower: string;
  passwordHash?: string;
  club: string;
  onboarded: boolean;
  emailVerified: boolean;
  // Search-optimized denormalized fields
  searchableProfession?: string;
  searchableEducation?: string;
  searchableMilitary?: string;
  searchableInterests?: string[];
  // Family member references (for searchability)
  spouseSearchable?: boolean;
  childrenSearchable?: boolean;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Simple password hashing using Web Crypto API (no external dependencies)
 * Uses PBKDF2 with SHA-256 for secure password hashing
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return as base64 string
  return Buffer.from(combined).toString("base64");
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const combined = Buffer.from(storedHash, "base64");
  const salt = combined.subarray(0, 16);
  const storedHashBytes = combined.subarray(16);

  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const newHashBytes = new Uint8Array(derivedBits);

  // Constant-time comparison to prevent timing attacks
  if (newHashBytes.length !== storedHashBytes.length) return false;
  let result = 0;
  for (let i = 0; i < newHashBytes.length; i++) {
    result |= newHashBytes[i] ^ storedHashBytes[i];
  }
  return result === 0;
}

/**
 * Build searchable text from registration data for full-text search
 */
function buildSearchableFields(data: RegistrationData) {
  const profession = [
    data.currentEmployment?.role,
    data.currentEmployment?.jobTitle,
    data.currentEmployment?.employer,
    data.currentEmployment?.industry,
    ...(data.employmentHistory?.map((e) => [e.role, e.jobTitle, e.employer, e.industry].filter(Boolean).join(" ")) || []),
  ]
    .filter(Boolean)
    .join(" ");

  const education = [
    ...(data.educationHistory?.map((e) =>
      [e.degree, e.fieldOfStudy, e.institution, e.specialization].filter(Boolean).join(" ")
    ) || []),
  ]
    .filter(Boolean)
    .join(" ");

  const military = data.military
    ? [data.military.framework, data.military.unit, data.military.role, data.military.dischargeRank]
        .filter(Boolean)
        .join(" ")
    : undefined;

  const interests = [
    ...(data.interests?.categories || []),
    ...(data.interests?.customInterests || []),
    ...(data.interests?.expertise || []),
    ...(data.interests?.hobbies || []),
  ].filter(Boolean);

  return {
    searchableProfession: profession || undefined,
    searchableEducation: education || undefined,
    searchableMilitary: military,
    searchableInterests: interests.length > 0 ? interests : undefined,
  };
}

/**
 * Create or update a user account from completed registration data
 * Returns the user ID
 */
export async function upsertUserFromRegistration(
  data: RegistrationData,
  password?: string
): Promise<string> {
  const { uri, dbName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<UserDocument>("users");

  // Ensure indexes for search
  await collection.createIndex({ emailLower: 1 }, { unique: true, name: "users_email_unique" });
  await collection.createIndex({ "firstName": "text", "lastName": "text", "searchableProfession": "text", "searchableEducation": "text" }, { name: "users_fulltext_search" });
  await collection.createIndex({ club: 1 }, { name: "users_club" });
  await collection.createIndex({ searchableInterests: 1 }, { name: "users_interests" });
  await collection.createIndex({ createdAt: -1 }, { name: "users_createdAt_desc" });
  await collection.createIndex({ updatedAt: -1 }, { name: "users_updatedAt_desc" });

  const now = new Date();
  const email = data.email.trim();
  const emailLower = email.toLowerCase();
  const club = data.clubId || data.customClub || "";

  // Build searchable fields
  const searchableFields = buildSearchableFields(data);

  // Hash password if provided
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await hashPassword(password);
  }

  // Check if user exists
  const existingUser = await collection.findOne({ emailLower });

  if (existingUser) {
    // Update existing user
    const updateDoc: Record<string, unknown> = {
      ...data,
      email,
      emailLower,
      club,
      ...searchableFields,
      onboarded: true,
      emailVerified: true, // Verified through OTP during registration
      spouseSearchable: data.hasSpouse && data.spouse ? true : false,
      childrenSearchable: data.hasEligibleChildren && data.children?.length ? true : false,
      updatedAt: now,
    };

    // Only update password if a new one is provided
    if (passwordHash) {
      updateDoc.passwordHash = passwordHash;
    }

    await collection.updateOne(
      { emailLower },
      { $set: updateDoc }
    );

    return existingUser._id.toString();
  } else {
    // Create new user
    const newUser: Omit<UserDocument, "_id"> = {
      ...data,
      email,
      emailLower,
      passwordHash,
      club,
      ...searchableFields,
      onboarded: true,
      emailVerified: true,
      spouseSearchable: data.hasSpouse && data.spouse ? true : false,
      childrenSearchable: data.hasEligibleChildren && data.children?.length ? true : false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newUser as UserDocument);
    return result.insertedId.toString();
  }
}

/**
 * Get user by email with full profile data
 */
export async function getUserProfileByEmail(email: string): Promise<UserDocument | null> {
  const { uri, dbName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<UserDocument>("users");

  return collection.findOne({ emailLower: email.toLowerCase() });
}

/**
 * Search users by various criteria
 * Supports profession, education, military, interests, and location
 */
export async function searchUsers(query: {
  text?: string;
  profession?: string;
  education?: string;
  military?: string;
  interests?: string[];
  city?: string;
  club?: string;
  limit?: number;
}): Promise<UserDocument[]> {
  const { uri, dbName } = getMongoConfig();
  const client = await getMongoClient(uri);
  const collection = client.db(dbName).collection<UserDocument>("users");

  const filter: Record<string, unknown> = {
    onboarded: true,
  };

  // Full-text search
  if (query.text) {
    filter.$text = { $search: query.text };
  }

  // Profession filter
  if (query.profession) {
    filter.searchableProfession = { $regex: query.profession, $options: "i" };
  }

  // Education filter
  if (query.education) {
    filter.searchableEducation = { $regex: query.education, $options: "i" };
  }

  // Military filter
  if (query.military) {
    filter.searchableMilitary = { $regex: query.military, $options: "i" };
  }

  // Interests filter
  if (query.interests?.length) {
    filter.searchableInterests = { $in: query.interests };
  }

  // City filter
  if (query.city) {
    filter.city = { $regex: query.city, $options: "i" };
  }

  // Club filter
  if (query.club) {
    filter.club = query.club;
  }

  return collection
    .find(filter)
    .limit(query.limit || 50)
    .sort({ updatedAt: -1 })
    .toArray();
}
