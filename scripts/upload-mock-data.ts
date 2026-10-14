/**
 * Script to upload mock data to MongoDB
 *
 * Run with: npx tsx scripts/upload-mock-data.ts
 */

import { MongoClient } from "mongodb";
import { members } from "../src/data/members.js";
import { familyMembers } from "../src/data/family-members.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://roeegetz_db_user:EiZiautdJYPgP7pX@rotary-connect.gzfjvty.mongodb.net/?appName=rotary-connect";
const DB_NAME = process.env.MONGODB_DB_NAME || "rotary_connect_israel";

async function uploadMockData() {
  console.log("Connecting to MongoDB...");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");

    const db = client.db(DB_NAME);

    // Upload members to 'members' collection
    const membersCollection = db.collection("members");

    // Clear existing data (optional - for fresh upload)
    const existingMembers = await membersCollection.countDocuments();
    if (existingMembers > 0) {
      console.log(`Found ${existingMembers} existing members. Clearing...`);
      await membersCollection.deleteMany({});
    }

    // Insert members
    console.log(`Uploading ${members.length} members...`);
    const membersResult = await membersCollection.insertMany(members as any[]);
    console.log(`Successfully inserted ${membersResult.insertedCount} members!`);

    // Upload family members to 'family_members' collection
    const familyCollection = db.collection("family_members");

    // Clear existing data
    const existingFamily = await familyCollection.countDocuments();
    if (existingFamily > 0) {
      console.log(`Found ${existingFamily} existing family members. Clearing...`);
      await familyCollection.deleteMany({});
    }

    // Insert family members
    console.log(`Uploading ${familyMembers.length} family members...`);
    const familyResult = await familyCollection.insertMany(familyMembers as any[]);
    console.log(`Successfully inserted ${familyResult.insertedCount} family members!`);

    // Verify the upload
    console.log("\n--- Verification ---");
    const totalMembers = await membersCollection.countDocuments();
    const totalFamily = await familyCollection.countDocuments();
    console.log(`Members collection: ${totalMembers} documents`);
    console.log(`Family members collection: ${totalFamily} documents`);

    // Show sample data
    console.log("\n--- Sample Member ---");
    const sampleMember = await membersCollection.findOne({});
    console.log(JSON.stringify(sampleMember, null, 2).substring(0, 500) + "...");

    console.log("\n--- Sample Family Member ---");
    const sampleFamily = await familyCollection.findOne({});
    console.log(JSON.stringify(sampleFamily, null, 2).substring(0, 500) + "...");

    // Create indexes for better search performance
    console.log("\n--- Creating Indexes ---");

    // Text index for members search
    await membersCollection.createIndex(
      {
        "name.he": "text",
        "name.en": "text",
        "profession.he": "text",
        "profession.en": "text",
        "company": "text",
        "specialty.he": "text",
        "specialty.en": "text",
      },
      { name: "members_text_search" }
    );
    console.log("Created text index on members collection");

    // Index on club for filtering
    await membersCollection.createIndex({ club: 1 }, { name: "members_club" });
    console.log("Created club index on members collection");

    // Text index for family members search
    await familyCollection.createIndex(
      {
        "firstName.he": "text",
        "firstName.en": "text",
        "lastName.he": "text",
        "lastName.en": "text",
        "profession.he": "text",
        "profession.en": "text",
        "workplace": "text",
      },
      { name: "family_text_search" }
    );
    console.log("Created text index on family_members collection");

    // Index on primaryMemberId for joining
    await familyCollection.createIndex(
      { primaryMemberId: 1 },
      { name: "family_primary_member" }
    );
    console.log("Created primaryMemberId index on family_members collection");

    console.log("\nUpload completed successfully!");
  } catch (error) {
    console.error("Error uploading data:", error);
    throw error;
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

// Run the upload
uploadMockData()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Upload failed:", error);
    process.exit(1);
  });
