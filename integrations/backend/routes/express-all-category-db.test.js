import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from "express";
import supertest from "supertest";
import JWT from 'jsonwebtoken'
import cors from "cors";
import morgan from "morgan";
import categoryRoutes from '@server/routes/categoryRoutes.js'
import CategoryModel from "@server/models/categoryModel.js";
import connectDB from '@server/config/db';

// canned values
const categories = [{
    name: 'Laptop',
    slug: 'laptop',
}, {
    name: 'Phone',
    slug: 'phone',
}, {
    name: 'Book Cases',
    slug: 'book-cases'
}]

let category_docs = categories.map(x => new CategoryModel(x))

const original_env = Object.assign({}, process.env);
let mongoServer;
let app;

beforeAll(async () => {
    jest.resetModules();

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri()
    await connectDB();

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));
    app.use("/api/v1/category", categoryRoutes);
    await CategoryModel.bulkSave(category_docs);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    process.env = original_env;
});

describe('Get All Categories Route', () => {
    it('should return code 200 on happy path', async () => {
        const fetch_promise = supertest(app).get('/api/v1/category/get-category');

        const fetch_response = (await fetch_promise.expect(200)).body;
        expect(fetch_response).toHaveProperty('success', true);
        expect(fetch_response).toHaveProperty('category');
    });

    it('should yield all categories in the database', async () => {
        const fetch_promise = supertest(app).get('/api/v1/category/get-category');

        const fetched_categories = (await fetch_promise.expect(200)).body.category;
        expect(fetched_categories).toHaveLength(3)
        const flattened_category_name = fetched_categories.map(x => x.name ? x.name : fail(`Entry ${x} has no name field.`))
        expect(flattened_category_name).toContain('Laptop')
        expect(flattened_category_name).toContain('Phone')
        expect(flattened_category_name).toContain('Book Cases')
    });
})
