// Seah Minlong, A0271643E - Main Code Logic
// Wang Zhi Wren, A0255368U - Refactor to be more Playwright-centric
// Resets the database and seeds test user accounts.
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import { test as base } from '@playwright/test'

const ui_mongo_db = `${process.env.MONGO_URL.replace(/\/$/, '')}/ui`;

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

export const test = base.extend({
  reset_db: async({}, use) => {
    await mongoose.connect(ui_mongo_db);

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

    const user = await userModel.findOne({
      email: process.env.USER_EMAIL ?? "user@test.com",
    });
    await orderModel.create({
      products: [product._id],
      payment: { success: true },
      buyer: user._id,
      status: "Not Processed",
    });

    await mongoose.disconnect();
    await use()
    console.log('Done setting up DB.')
  }
})
