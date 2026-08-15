import { MongoClient, ServerApiVersion, type Collection } from "mongodb";

import type { RegistrationInput } from "./user-registration";

type RegistrationDocument = RegistrationInput & {
  emailLower: string;
  club: string;
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
