import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDB from '../../../config/db';
import CategoryModel from '../../../models/categoryModel';
import OrderModel from '../../../models/orderModel';
import ProductModel from '../../../models/productModel';
import UserModel from '../../../models/userModel';

// canned values
const categories = [
    new CategoryModel({
        name: 'Laptop',
        slug: 'laptop',
    }),
    new CategoryModel({
        name: 'Phone',
        slug: 'phone',
    })
]

const products = [{
    name: 'Gaming Laptop',
    slug: 'gaming-laptop',
    description: 'A gaming laptop',
    price: 1200,
    quantity: 10,
    category: categories[0]._id,
    shipping: true,
}, {
    name: 'Work Laptop',
    slug: 'work-laptop',
    description: 'A working laptop',
    price: 1000,
    quantity: 5,
    category: categories[0]._id,
    photo: {
        data: Buffer.from('imageData'),
        contentType: 'image/png',
    },
    shipping: true,
}, {
    name: 'Phone',
    slug: 'phone',
    description: 'A phone',
    price: 800,
    quantity: 0,
    category: categories[1]._id,
    shipping: false,
}];

// backup the environment object
const original_env = Object.assign({}, process.env);
let mongoServer;

beforeAll(async () => {
    jest.resetModules();
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri()
    await connectDB();

    await CategoryModel.bulkSave(categories);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    process.env = original_env;
})

describe('Product Model', () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // cleanup ALL data between tests
        // inherent assumption that mongoose.deleteMany is implemented correctly.
        await ProductModel.deleteMany({});
    });

    afterAll(() => {
        console.log.mockRestore();
    });

    describe('CRUD - Create', () => {
        it('should save to the DB successfully', async () => {
            const product_docs = products.map(x => new ProductModel(x));

            const res = await ProductModel.bulkSave(product_docs);

            expect(res.isOk).toBeTruthy();
            expect(res.insertedCount).toBe(3);
        });

        describe('should not save to the DB if the entry does not have the required', () => {
            it('name', async () => {
                const bad_product = structuredClone(products[0])
                bad_product.category = products[0].category
                delete bad_product.name
                const product_doc = new ProductModel(bad_product)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `name`/);
            });

            it('slug', async () => {
                const bad_product = structuredClone(products[0])
                bad_product.category = products[0].category
                delete bad_product.slug
                const product_doc = new ProductModel(bad_product)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `slug`/);
            });
            
            it('description', async () => {
                const bad_product = structuredClone(products[0])
                bad_product.category = products[0].category
                delete bad_product.description
                const product_doc = new ProductModel(bad_product)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `description`/);
            });
            
            it('price', async () => {
                const bad_product = structuredClone(products[0])
                bad_product.category = products[0].category
                delete bad_product.price
                const product_doc = new ProductModel(bad_product)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `price`/);
            });
            
            it('category', async () => {
                const bad_product = structuredClone(products[0])
                delete bad_product.category
                const product_doc = new ProductModel(bad_product)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `category`/);
            });
            
            it('quantity', async () => {
                const bad_product = structuredClone(products[0])
                bad_product.category = products[0].category
                delete bad_product.quantity
                const product_doc = new ProductModel(bad_product)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `quantity`/);
            });
        })
    });

    describe('CRUD - Read', () => {
        beforeEach(async () => {
            const product_docs = products.map(x => new ProductModel(x));
            await ProductModel.bulkSave(product_docs);
        });

        it('should be able to search from the DB successfully if item exists', async () => {
            // NO ARRANGE

            const res = await ProductModel.find({ name: 'Gaming Laptop' });

            expect(res).toHaveLength(1);
        });
    
        it('should be able to populate the DB from foreign category DB', async () => {
            const id = (await CategoryModel.findOne({ name: 'Laptop' }))._id;

            const res = await ProductModel.find({ shipping: true }).populate('category');

            expect(res).toHaveLength(2);
            expect(res[0].category).toHaveProperty('_id', id);
            expect(res[0].category).toHaveProperty('name', 'Laptop');
        });

        it('should populate the DB with null if a category does not exist', async () => {
            const phone_clone = structuredClone(products[2]);
            phone_clone.name = 'Phone 2';
            const unused_category = new CategoryModel({ name: 'Unused', slug: 'unused' });
            phone_clone.category = unused_category._id;
            const product_doc = new ProductModel(phone_clone);
            await product_doc.save();
            
            const res = await ProductModel.find({ price: 800 }).populate('category');

            expect(res).toHaveLength(2);
            res.forEach(x => {
                if (x.name == 'Phone') {
                    expect(x.category).toHaveProperty('name', 'Phone');
                    return;
                } else if (x.name == 'Phone 2') {
                    expect(x.category).toBeNull();
                    return;
                }
                fail(`Found unexpected entry in DB - ${x}`);
            });
        });

        it('should not find a match in the DB if item does not exists', async () => {
            // NO ARRANGE

            const res = await ProductModel.find({ name: 'Car' });

            expect(res).toHaveLength(0);
        });
    });

    describe('CRUD - Delete', () => {
        beforeEach(async () => {
            const product_docs = products.map(x => new ProductModel(x));
            await ProductModel.bulkSave(product_docs);
        });

        it('should allow delete of field from the DB when specified', async () => {
            // NO ARRANGE

            const res = await ProductModel.deleteMany({ name: 'Gaming Laptop' });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(1);
        });

        it('should allow mass delete of shared field from the DB when specified', async () => {
            // NO ARRANGE

            const res = await ProductModel.deleteMany({ shipping: true });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(2);
        });

        it('should not delete from the DB if not found', async () => {
            // NO ARRANGE

            const res = await ProductModel.deleteOne({ name: 'Car' });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(0);
        });
    });

    describe('CRUD - Update', () => {
        it('should allow update from the DB when specified', async () => {
            const product_docs = products.map(x => new ProductModel(x));
            await ProductModel.bulkSave(product_docs);
            const update_query = {
                name: 'Broken Laptop',
                slug: 'broken-laptop',
                description: 'A broken laptop',
                price: 10,
                quantity: 1,
                shipping: false,
            }

            const update_res = await ProductModel.updateMany(products[0], update_query);
            const find_new = await ProductModel.find({ name: 'Broken Laptop' });
            const find_old = await ProductModel.find(products[0]);

            expect(update_res.acknowledged).toBeTruthy();
            expect(update_res.matchedCount).toBe(1);
            expect(update_res.modifiedCount).toBe(1);
            expect(find_new).toHaveLength(1);
            expect(find_old).toHaveLength(0);
        });
    });
})
