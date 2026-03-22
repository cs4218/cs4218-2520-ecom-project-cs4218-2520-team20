// Wang Zhi Wren, A0255368U
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDB from '@server/config/db';
import UserModel from '@server/models/userModel';

// canned values
const users = [{
    name: 'The Man',
    email: 'email@1',
    password: 'Some Password Hash',
    phone: '987654321',
    address: 'Address #1',
    answer: 'A',
    role: 0,
}, {
    name: 'The Other Man',
    email: 'email@2',
    password: 'Hash Password Some',
    phone: '1040112305',
    address: 'Address #2',
    answer: 'B',
    role: 1,
}];

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

describe('User Model', () => {
    beforeAll(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // cleanup ALL data between tests
        // inherent assumption that mongoose.deleteMany is implemented correctly.
        await UserModel.deleteMany({});
    });

    afterAll(() => {
        console.log.mockRestore();
    });

    describe('CRUD - Create', () => {
        it('should save to the DB successfully', async () => {
            const user_docs = users.map(x => new UserModel(x));

            const res = await UserModel.bulkSave(user_docs);

            expect(res.isOk).toBeTruthy();
            expect(res.insertedCount).toBe(2);
        });

        it('should save to the DB with a default value for role successfully', async () => {
            const user_clone = structuredClone(users[0]);
            delete user_clone.role;
            const user_doc = new UserModel(user_clone);

            const res = await user_doc.save();

            expect(res.role).toBe(0);
        });

        describe('should not save to the DB if the entry does not have the required', () => {
            it('name', async () => {
                const bad_user = structuredClone(users[0])
                delete bad_user.name
                const user_doc = new UserModel(bad_user)

                const promise = user_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `name`/);
            });

            it('email', async () => {
                const bad_user = structuredClone(users[0])
                delete bad_user.email
                const product_doc = new UserModel(bad_user)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `email`/);
            });
            
            it('password', async () => {
                const bad_user = structuredClone(users[0])
                delete bad_user.password
                const product_doc = new UserModel(bad_user)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `password`/);
            });
            
            it('phone', async () => {
                const bad_user = structuredClone(users[0])
                delete bad_user.phone
                const product_doc = new UserModel(bad_user)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `phone`/);
            });
            
            it('address', async () => {
                const bad_user = structuredClone(users[0])
                delete bad_user.address
                const product_doc = new UserModel(bad_user)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `address`/);
            });
            
            it('answer', async () => {
                const bad_user = structuredClone(users[0])
                delete bad_user.answer
                const product_doc = new UserModel(bad_user)

                const promise = product_doc.save();

                await expect(promise).rejects.toThrow(/.*validation failed.*Path `answer`/);
            });
        })
    });

    describe('CRUD - Read', () => {
        beforeEach(async () => {
            const user_docs = users.map(x => new UserModel(x));
            await UserModel.bulkSave(user_docs);
        });

        it('should be able to search from the DB successfully if item exists', async () => {
            // NO ARRANGE

            const res = await UserModel.find({ name: 'The Man' });

            expect(res).toHaveLength(1);
        });

        it('should not find a match in the DB if item does not exists', async () => {
            // NO ARRANGE

            const res = await UserModel.find({ name: 'The Woman' });

            expect(res).toHaveLength(0);
        });
    });

    describe('CRUD - Delete', () => {
        beforeEach(async () => {
            const user_docs = users.map(x => new UserModel(x));
            await UserModel.bulkSave(user_docs);
        });

        it('should allow delete of field from the DB when specified', async () => {
            // NO ARRANGE

            const res = await UserModel.deleteMany({ name: 'The Man' });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(1);
        });

        it('should not delete from the DB if not found', async () => {
            // NO ARRANGE

            const res = await UserModel.deleteOne({ name: 'The Woman' });

            expect(res.acknowledged).toBeTruthy();
            expect(res.deletedCount).toBe(0);
        });
    });

    describe('CRUD - Update', () => {
        it('should allow update from the DB when specified', async () => {
            const product_docs = users.map(x => new UserModel(x));
            await UserModel.bulkSave(product_docs);
            const update_query = {
                name: 'The Woman',
                email: 'email@3',
                password: 'Edited Password',
                phone: '123944',
                address: 'Address #3',
                answer: 'C',
                role: 0,
            }

            const update_res = await UserModel.updateMany(users[1], update_query);
            const find_new = await UserModel.find({ name: 'The Woman' });
            const find_old = await UserModel.find(users[1]);

            expect(update_res.acknowledged).toBeTruthy();
            expect(update_res.matchedCount).toBe(1);
            expect(update_res.modifiedCount).toBe(1);
            expect(find_new).toHaveLength(1);
            expect(find_old).toHaveLength(0);
        });
    });
})
