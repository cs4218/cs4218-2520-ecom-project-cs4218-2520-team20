// Seah Minlong, A0271643E
// Resets the database and seeds test user accounts.
//
// Usage: node playwright-tests/seedTestData.mjs

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

const ADMIN = {
  name: "Test Admin",
  email: process.env.ADMIN_EMAIL ?? "admin@test.com",
  password: process.env.ADMIN_PASSWORD ?? "admin123",
  phone: "00000000",
  address: "Test Address",
  answer: "test",
  role: 1,
};

const USER = {
  name: "Test User",
  email: process.env.USER_EMAIL ?? "user@test.com",
  password: process.env.USER_PASSWORD ?? "user123",
  phone: "00000000",
  address: "Test Address",
  answer: "test",
  role: 0,
};

async function seedUser({ password, ...userData }) {
  const hashed = await bcrypt.hash(password, 10);
  await userModel.create({ ...userData, password: hashed });
  console.log(`Created ${userData.email} (role=${userData.role})`);
}

await mongoose.connect(process.env.MONGO_URL);

console.log("Dropping all collections...");
await orderModel.deleteMany({});
await productModel.deleteMany({});
await categoryModel.deleteMany({});
await userModel.deleteMany({});

console.log("Seeding test users...");
await seedUser(ADMIN);
await seedUser(USER);

console.log("Seeding category, product, and order...");
const category = await categoryModel.create({
  name: "Seed Category",
  slug: "seed-category",
});

const product = await productModel.create({
  name: "Seed Product",
  slug: "seed-product",
  description: "A seeded product for testing",
  price: 25,
  category: category._id,
  quantity: 5,
  shipping: true,
});

const product2 = await productModel.create({
  name: "Seed Product 2",
  slug: "seed-product-2",
  description: "Another seeded product for testing",
  price: 30,
  category: category._id,
  quantity: 5,
  shipping: true,
});

const user = await userModel.findOne({
  email: process.env.USER_EMAIL ?? "user@test.com",
});
await orderModel.create({
  products: [product._id, product2._id],
  payment: { success: true },
  buyer: user._id,
  status: "Not Processed",
});

await mongoose.disconnect();
console.log("Done.");
