import { MongoClient } from "mongodb";

export function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Check next-backend/.env.local"
    );
  }

  if (!globalThis._courseMongoPromise) {
    const client = new MongoClient(uri);

    globalThis._courseMongoPromise = client.connect().catch((error) => {
      delete globalThis._courseMongoPromise;
      throw error;
    });
  }

  return globalThis._courseMongoPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db();
}