import { MongoClient } from "mongodb";

let client;
let _db;

export async function connectDB(uri, dbName) {
  client = new MongoClient(uri, { ignoreUndefined: true });
  //await client.connect();
  _db = client.db(dbName);
  await createIndexes();
  console.log("✅ MongoDB connected:", dbName);
  return _db;
}

export function db() {
  if (!_db) throw new Error("DB not initialized");
  return _db;
}

export function collections() {
  const d = db();
  return {
    movies: d.collection("movies"),
    watchlist: d.collection("watchlist"),
  };
}

async function createIndexes() {
  const { movies, watchlist } = collections();

  await movies.createIndex({ createdAt: -1 });
  await movies.createIndex({ rating: -1 });
  await movies.createIndex({ genre: 1 });
  await movies.createIndex({ releaseYear: 1 });
  await movies.createIndex({ addedByUid: 1 });
  
  await movies.createIndex({ title: "text", director: "text", cast: "text", plotSummary: "text" });

  await watchlist.createIndex({ userUid: 1 }, { unique: true });
}