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
