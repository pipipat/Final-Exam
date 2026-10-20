import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri?.startsWith("mongodb+srv://") || new URL(uri).pathname !== "/online_course") {
  throw new Error("Set MONGODB_URI to the Atlas URI ending in /online_course (before any ? options).");
}

const source = new MongoClient("mongodb://127.0.0.1:27018/online_course", { serverSelectionTimeoutMS: 15000 });
const target = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });

try {
  await source.connect();
  await target.connect();
  const localDb = source.db("online_course");
  const atlasDb = target.db("online_course");
  const data = {};

  // Read both collections before writing. Keep ObjectIds, dates and hashes intact.
  for (const name of ["users", "courses"]) {
    data[name] = await localDb.collection(name).find({}).toArray();
  }
  if (data.users.length < 6) {
    throw new Error("Local database has fewer than six users. Check Docker and the database name.");
  }

  // Refuse to mix this migration with unrelated records already in Atlas.
  for (const name of ["users", "courses"]) {
    const ids = data[name].map((doc) => doc._id);
    if (await atlasDb.collection(name).countDocuments({ _id: { $nin: ids } })) {
      throw new Error("Atlas already contains different records. Stop and check the destination database.");
    }
  }

  await atlasDb.collection("users").createIndex({ email: 1 }, { unique: true });
  await atlasDb.collection("users").createIndex({ username: 1 }, { unique: true });
  await atlasDb.collection("courses").createIndex({ teacherId: 1 });

  for (const name of ["users", "courses"]) {
    const docs = data[name];
    if (docs.length) {
      await atlasDb.collection(name).bulkWrite(docs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      })));
    }
    const count = await atlasDb.collection(name).countDocuments({
      _id: { $in: docs.map((doc) => doc._id) },
    });
    if (count !== docs.length) throw new Error("Document count verification failed.");
    console.log(`${name}: local=${docs.length}, Atlas=${count}`);
  }
  console.log("Migration complete. Local Docker data is unchanged.");
} catch (error) {
  // Avoid printing credentials or documents from driver error messages.
  if (error.name === "Error") console.error(error.message);
  else console.error(`Migration failed (${error.name}, code ${error.code ?? "n/a"}). Check Atlas credentials, IP access and Docker.`);
  process.exitCode = 1;
} finally {
  await Promise.allSettled([source.close(), target.close()]);
}
