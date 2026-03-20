import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDB from '@server/config/db';
import CategoryModel from '@server/models/categoryModel';
import OrderModel from '@server/models/orderModel';
import ProductModel from '@server/models/productModel';
import UserModel from '@server/models/userModel';

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
];

const products = [
    new ProductModel({
        name: 'Gaming Laptop',
        slug: 'gaming-laptop',
        description: 'A gaming laptop',
        price: 1200,
        quantity: 10,
        category: categories[0]._id,
        shipping: true,
    }),
    new ProductModel({
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
    }),
    new ProductModel({
        name: 'Phone',
        slug: 'phone',
        description: 'A phone',
        price: 800,
        quantity: 0,
        category: categories[1]._id,
        shipping: false,
    })
];

const users = [
    new UserModel({
        name: 'The Man',
        email: 'email@1',
        password: 'Some Password Hash',
        phone: '987654321',
        address: 'Address #1',
        answer: 'A',
        role: 0,
    }),
    new UserModel({
        name: 'The Other Man',
        email: 'email@2',
        password: 'Hash Password Some',
        phone: '1040112305',
        address: 'Address #2',
        answer: 'B',
        role: 1,
    })
];

const orders = [{
    products: [ products[0]._id, products[0]._id ],
    payment: { test: 'order 1' },
    buyer: users[0]._id,
    status: 'Processing',
}, {
    products: [ products[0]._id, products[1]._id, products[2]._id ],
    payment: { error: true },
    buyer: users[0]._id,
    status: 'Not Processed',
}, {
    products: [ products[2]._id ],
    payment: { test: 'order 3' },
    buyer: users[1]._id,
    status: 'Cancelled',
}]

// backup the environment object
const original_env = Object.assign({}, process.env);
let mongoServer;

beforeAll(async () => {
    jest.resetModules();
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri()
    await connectDB();

    await CategoryModel.bulkSave(categories);
    await UserModel.bulkSave(users);
    await ProductModel.bulkSave(products);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    process.env = original_env;
})

describe('Order Model', () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // cleanup ALL data between tests
        // inherent assumption that mongoose.deleteMany is implemented correctly.
        await OrderModel.deleteMany({});
    });

    afterAll(() => {
        console.log.mockRestore();
    });

    describe('CRUD - Create', () => {
        it('should save to the DB successfully', async () => {
            const order_docs = orders.map(x => new OrderModel(x));

            const res = await OrderModel.bulkSave(order_docs);

            expect(res.isOk).toBeTruthy();
            expect(res.insertedCount).toBe(3);
        });

        it('should save to the DB with a default value for status successfully', async () => {
            const order_clone = structuredClone(orders[0]);
            order_clone.products = orders[0].products
            order_clone.buyer = orders[0].buyer
            delete order_clone.status;
            const user_doc = new OrderModel(order_clone);
    
            const res = await user_doc.save();
    
            expect(res.status).toBe('Not Processed');
        });

        describe('should not save to the DB if the entry does not have the required', () => {
            it('products - as an empty array', async () => {
                const bad_order = structuredClone(orders[0])
                bad_order.products = []
                bad_order.buyer = orders[0].buyer
                const product_doc = new OrderModel(bad_order)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*products.*/);
            });

            it('products - as null', async () => {
                const bad_order = structuredClone(orders[0])
                delete bad_order.products
                bad_order.buyer = orders[0].buyer
                const product_doc = new OrderModel(bad_order)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*products.*/);
            });

            it('buyer', async () => {
                const bad_order = structuredClone(orders[0])
                bad_order.products = orders[0].products
                delete bad_order.buyer
                const product_doc = new OrderModel(bad_order)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `buyer`/);
            });
        })
    });

    describe('CRUD - Read', () => {
        beforeEach(async () => {
            const order_docs = orders.map(x => new OrderModel(x));
            await OrderModel.bulkSave(order_docs);
        });

        it('should be able to search from the DB successfully if item exists', async () => {
            // NO ARRANGE

            const res = await OrderModel.find({ status: 'Processing' });

            expect(res).toHaveLength(1);
        });
    
        it('should be able to populate the DB from foreign category DB', async () => {
            // NO ARRANGE

            const res = await OrderModel
                .find({ buyer: users[0]._id })
                .populate('buyer', 'name')
                .populate('products', 'name');

            expect(res).toHaveLength(2);
            res.forEach(x => {
                if (x.products.length == 2) {
                    expect(x.products[0]).toHaveProperty('_id', products[0]._id);
                    expect(x.products[0]).toHaveProperty('name', products[0].name);
                    expect(x.products[1]).toHaveProperty('_id', products[0]._id);
                    expect(x.products[1]).toHaveProperty('name', products[0].name);
                    return;
                } else if (x.products.length == 3) {
                    expect(x.products[0]).toHaveProperty('_id', products[0]._id);
                    expect(x.products[0]).toHaveProperty('name', products[0].name);
                    expect(x.products[1]).toHaveProperty('_id', products[1]._id);
                    expect(x.products[1]).toHaveProperty('name', products[1].name);
                    expect(x.products[2]).toHaveProperty('_id', products[2]._id);
                    expect(x.products[2]).toHaveProperty('name', products[2].name);
                    return;
                }
                fail(`Found unexpected entry in DB - ${x}`);
            });
        });

        it('should populate the DB with null if a category does not exist', async () => {
            const order_clone = structuredClone(orders[0]);
            order_clone.products = orders[0].products.slice(1)
            order_clone.buyer = new mongoose.Types.ObjectId()
            const order_doc = new OrderModel(order_clone);
            await order_doc.save();
            
            const res = await OrderModel
                .find({ status: 'Processing' })
                .populate('buyer', 'name')
                .populate('products', 'name');

            expect(res).toHaveLength(2);
            res.forEach(x => {
                if (x.products.length == 1) {
                    expect(x.buyer).toBeNull();
                    return;
                } else if (x.products.length == 2) {
                    expect(x.buyer).toHaveProperty('name', 'The Man');
                    return;
                }
                fail(`Found unexpected entry in DB - ${x}`);
            });
        });

        it('should not find a match in the DB if item does not exists', async () => {
            // NO ARRANGE

            const res = await OrderModel.find({ status: 'Shipped' });

            expect(res).toHaveLength(0);
        });
    });

    describe('CRUD - Delete', () => {
        beforeEach(async () => {
            const order_docs = orders.map(x => new OrderModel(x));
            await OrderModel.bulkSave(order_docs);
        });

        it('should allow delete of field from the DB when specified', async () => {
            // NO ARRANGE

            const res = await OrderModel.deleteMany({ buyer: users[0]._id });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(2);
        });

        it('should not delete from the DB if not found', async () => {
            // NO ARRANGE

            const res = await OrderModel.deleteOne({ buyer: new mongoose.Types.ObjectId() });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(0);
        });
    });

    describe('CRUD - Update', () => {
        it('should allow update from the DB when specified', async () => {
            const order_docs = orders.map(x => new OrderModel(x));
            await OrderModel.bulkSave(order_docs);
            const update_query = {
                status: 'Shipped'
            }

            const update_res = await OrderModel.updateMany(orders[0], update_query);
            const find_new = await OrderModel.find({ status: 'Shipped' });
            const find_old = await OrderModel.find(orders[0]);

            expect(update_res.acknowledged).toBeTruthy();
            expect(update_res.matchedCount).toBe(1);
            expect(update_res.modifiedCount).toBe(1);
            expect(find_new).toHaveLength(1);
            expect(find_old).toHaveLength(0);
        });
    });
})
