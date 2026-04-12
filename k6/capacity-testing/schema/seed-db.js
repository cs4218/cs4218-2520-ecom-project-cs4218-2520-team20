// Alexander Setyawan, A0257149W
// (also author of json files in same folder)
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const SEED_DIR = __dirname;
const MONGO_URL = process.env.MONGO_URL || "";
if (!process.env.MONGO_URL) {
  console.error("Error: MONGO_URL not found at ../../../.env");
  process.exit(1);
}

const COLLECTIONS = [
  { file: "test.categories.json", name: "categories" },
  { file: "test.products.json", name: "products" },
  { file: "test.users.json", name: "users" },
  { file: "test.orders.json", name: "orders" },
];

async function seed() {
  console.log("Connecting to Atlas...");
  await mongoose.connect(MONGO_URL);
  console.log("Connected.");

  const db = mongoose.connection.db;

  for (const col of COLLECTIONS) {
    const filePath = path.join(SEED_DIR, col.file);
    const raw = fs.readFileSync(filePath, "utf8");
    const docs = JSON.parse(raw);

    const converted = docs.map((doc) => convertBsonTypes(doc));

    console.log(`Dropping ${col.name}...`);
    try {
      await db.collection(col.name).drop();
    } catch (e) {
      // Collection may not exist yet
    }

    console.log(`Inserting ${converted.length} docs into ${col.name}...`);
    await db.collection(col.name).insertMany(converted);
    console.log(`  Done: ${col.name}`);
  }

  console.log("\nSeed complete!");
  await mongoose.disconnect();
}

function convertBsonTypes(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  if (obj.$oid) {
    return new mongoose.Types.ObjectId(obj.$oid);
  }

  if (obj.$date) {
    return new Date(obj.$date);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBsonTypes);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = convertBsonTypes(value);
  }

  return result;
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});