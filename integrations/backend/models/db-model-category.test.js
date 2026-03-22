// Wang Zhi Wren, A0255368U
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDB from '@server/config/db';
import CategoryModel from '@server/models/categoryModel';

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

// backup the environment object
const original_env = Object.assign({}, process.env);
let mongoServer;

beforeAll(async () => {
    jest.resetModules();
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri()
    await connectDB();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    process.env = original_env;
})

describe('Category Model', () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // cleanup ALL data between tests
        // inherent assumption that mongoose.deleteMany is implemented correctly.
        await CategoryModel.deleteMany({});
    });

    afterAll(() => {
        console.log.mockRestore();
    });

    describe('CRUD - Create', () => {
        it('should save to the DB successfully', async () => {
            const categories_docs = categories.map(x => new CategoryModel(x));

            const res = await CategoryModel.bulkSave(categories_docs);

            expect(res.isOk).toBeTruthy();
            expect(res.insertedCount).toBe(3);
        });

        it('should not allow a save on a category that does not have required name field', async () => {
            const bad_category = structuredClone(categories[0]);
            delete bad_category.name;
            const category_doc = new CategoryModel(bad_category);

            const promise = category_doc.save();

            await expect(promise).rejects.toThrow(/.*validation failed.*Path `name`/);
        });

        
        it('should not allow a save on a category already exists', async () => {
            const categories_docs = categories.map(x => new CategoryModel(x));
            await CategoryModel.bulkSave(categories_docs);
            const dupe_category = new CategoryModel(categories[0])

            const res = dupe_category.save();

            await expect(res).rejects.toThrow(/.*duplicate key.*/);
        });
    });

    describe('CRUD - Read', () => {
        it('should be able to search from the DB successfully if item exists', async () => {
            const categories_docs = categories.map(x => new CategoryModel(x));
            await CategoryModel.bulkSave(categories_docs);

            const res = await CategoryModel.find({ name: 'Laptop' });

            expect(res).toHaveLength(1);
        });

        it('should not find a match in the DB if item does not exists', async () => {
            const categories_docs = categories.slice(1).map(x => new CategoryModel(x));
            await CategoryModel.bulkSave(categories_docs);

            const res = await CategoryModel.find({ name: 'Laptop' });

            expect(res).toHaveLength(0);
        });
    });

    describe('CRUD - Delete', () => {
        it('should allow delete from the DB when specified', async () => {
            const categories_docs = categories.map(x => new CategoryModel(x));
            await CategoryModel.bulkSave(categories_docs);

            const res = await CategoryModel.deleteOne({ name: 'Laptop' });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(1);
        });
        
        it('should not delete from the DB if not found', async () => {
            const categories_docs = categories.map(x => new CategoryModel(x));
            await CategoryModel.bulkSave(categories_docs);

            const res = await CategoryModel.deleteOne({ name: 'Fruit' });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(0);
        });
    });

    
    describe('CRUD - Update', () => {
        it('should allow update from the DB when specified', async () => {
            const categories_docs = categories.map(x => new CategoryModel(x));
            await CategoryModel.bulkSave(categories_docs);

            const res = await CategoryModel.updateOne({ name: 'Laptop' }, { name: 'Fruit', slug: 'fruit' });

            expect(res.acknowledged).toBeTruthy();
            expect(res.matchedCount).toBe(1);
            expect(res.modifiedCount).toBe(1);
        });

        it('should not allow an update that violates uniqueness requirements', async () => {
            const categories_docs = categories.map(x => new CategoryModel(x));
            await CategoryModel.bulkSave(categories_docs);

            const res = CategoryModel.updateOne({ name: 'Laptop' }, { name: 'Phone', slug: 'phone' });

            await expect(res).rejects.toThrow(/.*duplicate key.*/);
        });
    });
})
