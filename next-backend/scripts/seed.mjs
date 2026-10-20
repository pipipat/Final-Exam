import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is missing. Run with --env-file=.env.local"
  );
}

const client = new MongoClient(uri);
const testPassword = "Course123!";
const testEmails = [];

try {
  await client.connect();

  const db = client.db();
  const users = db.collection("users");

  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ username: 1 }, { unique: true });

  for (const role of ["student", "teacher"]) {
    for (let i = 1; i <= 3; i++) {
      const username = `${role}${i}`;
      const email = `${username}@example.com`;

      testEmails.push(email);

      const result = await users.updateOne(
        { email },
        {
          $setOnInsert: {
            username,
            email,
            password: await bcrypt.hash(testPassword, 12),
            role,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(
        `${result.upsertedCount ? "Created" : "Already exists"}: ${email}`
      );
    }
  }

  console.log(`Database: ${db.databaseName}`);
  console.log(`Password for new test users: ${testPassword}`);

  const accounts = await users
    .find(
      { email: { $in: testEmails } },
      {
        projection: {
          _id: 0,
          username: 1,
          email: 1,
          role: 1,
        },
      }
    )
    .sort({ role: 1, username: 1 })
    .toArray();

  console.table(accounts);
} catch (error) {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}