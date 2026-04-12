// Wang Zhi Wren, A0255368U
import dotenv from 'dotenv';
import mongoose from "mongoose"

import categoryModel from "../../../models/categoryModel.js"
import productModel from "../../../models/productModel.js"
import userModel from "../../../models/userModel.js"
import { hashPassword } from '../../../helpers/authHelper.js';

import categories from "./categories.json" with { type: "json" }
import products from "./products.json" with { type: "json" }

dotenv.config()

const SPIKE_TEST_PASSWORD = 'abc123'
const TEST_TYPE = 'SPIKETEST'
const SEEDED_USERS = 100

async function generate_users(count) {
  const users = []
  const hashedPassword = await hashPassword(SPIKE_TEST_PASSWORD)
  for (let i = 0; i < count; i++) {
    users.push({
      name: `${TEST_TYPE} #${i}`,
      email: `${TEST_TYPE}_${i}@example.com`,
      password: hashedPassword,
      phone: String(i).padStart(8, '0'),
      address: `${TEST_TYPE} AVENUE ${i}`,
      answer: `${TEST_TYPE}`,
      role: 0
    })
  }
  return users.map(x => new userModel(x))
}

async function generate_products() {
  const category_models = categories.map(x => new categoryModel(x))
  const spike_id = category_models[0]._id
  const nonspike_id = category_models[1]._id
  for (let i = 0; i < products.length; i++) {
    if (products[i].category == 'Spike') {
      products[i].category = spike_id
    } else {
      products[i].category = nonspike_id
    }
    if (products[i].photo) {
      const photo_buffer = Buffer.from(products[i].photo.data.$binary.base64, 'base64')
      products[i].photo.data = photo_buffer
    }
  }
  const product_models = products.map(x => new productModel(x))
  return [ category_models, product_models ]
}

export async function seed_db() {
  const mongoose_startup = mongoose.connect(process.env.MONGO_URL)
  const user_creation = generate_users(SEEDED_USERS)
  const product_creation = generate_products()

  await mongoose_startup
  const cleanup_users = userModel.deleteMany({ answer: `${TEST_TYPE}` })
  const cleanup_categories = categoryModel.deleteMany({})
  const cleanup_products = productModel.deleteMany({})

  const user_models = await user_creation
  await cleanup_users
  const save_users = userModel.bulkSave(user_models)

  const [ category_models, product_models ] = await product_creation
  await cleanup_categories
  await cleanup_products

  await categoryModel.bulkSave(category_models)
  await productModel.bulkSave(product_models)
  await save_users
  await mongoose.disconnect()
}

await seed_db()
