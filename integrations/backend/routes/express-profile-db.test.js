import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from "supertest";
import express from "express";
import authRoutes from '@server/routes/authRoute.js'
import UserModel from '@server/models/userModel';
import connectDB from '@server/config/db';
import JWT from 'jsonwebtoken'
import cors from "cors";
import morgan from "morgan";
import { comparePassword } from '@server/helpers/authHelper.js';

// JWT dummy token
const DUMMY_JWT_SECRET = 'PQOW1564QESD7813AS2';

// canned responses
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

let user_docs = users.map(x => new UserModel(x))

let user_tokens = [
    JWT.sign({ _id: user_docs[0]._id }, DUMMY_JWT_SECRET),
    JWT.sign({ _id: user_docs[1]._id }, DUMMY_JWT_SECRET),
]

const original_env = Object.assign({}, process.env);
let mongoServer;
let app;

beforeAll(async () => {
    jest.resetModules();

    process.env.JWT_SECRET = DUMMY_JWT_SECRET

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri()
    await connectDB();

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));
    app.use("/api/v1/auth", authRoutes);
});

beforeEach(async () => {
    user_docs = users.map(x => new UserModel(x))
    user_tokens = [
        JWT.sign({ _id: user_docs[0]._id }, DUMMY_JWT_SECRET),
        JWT.sign({ _id: user_docs[1]._id }, DUMMY_JWT_SECRET),
    ]
    await UserModel.bulkSave(user_docs);
});

afterEach(async () => {
    await UserModel.deleteMany({});
})

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    process.env = original_env;
});

describe('Update Profile Route', () => {
    it('should successfully update the user on the happy path', async () => {
        const update_query = {
            name: 'The Woman',
            password: 'Updated Password',
            address: 'Address #3',
            phone: '007',
        }

        const response = supertest(app).put('/api/v1/auth/profile')
                            .set('Authorization', `Bearer ${user_tokens[0]}`)
                            .send(update_query)

        const update_response = (await response.expect(200)).body;
        expect(update_response).toHaveProperty('success', true);
        expect(update_response).toHaveProperty('updatedUser');
        const updatedUser = update_response.updatedUser
        expect(updatedUser).toHaveProperty('name', 'The Woman');
        expect(updatedUser).toHaveProperty('password');
        expect(updatedUser).toHaveProperty('address', 'Address #3');
        expect(updatedUser).toHaveProperty('phone', '007');
    });

    it('should successfully update the password as a hash', async () => {
        const update_query = {
            password: 'Updated Password',
        }

        const response = supertest(app).put('/api/v1/auth/profile')
                            .set('Authorization', `Bearer ${user_tokens[0]}`)
                            .send(update_query)

        const update_response = (await response.expect(200)).body;
        expect(update_response).toHaveProperty('success', true);
        expect(update_response).toHaveProperty('updatedUser');
        const updatedUser = update_response.updatedUser;
        expect(updatedUser).toHaveProperty('password');
        const password = updatedUser.password;
        expect(password).not.toMatch(update_query.password);
        await expect(comparePassword(update_query.password, password)).resolves.not.toThrow()
    });

    it('should reflect the changes to the user on the DB', async () => {
        const update_query = {
            name: "L'etrange",
            password: '00000001',
            address: 'Address #8',
            phone: '011',
        }

        await supertest(app).put('/api/v1/auth/profile')
                            .set('Authorization', `Bearer ${user_tokens[0]}`)
                            .send(update_query)
                            .expect(200)

        const updatedUser = await UserModel.findById(user_docs[0]);
        expect(updatedUser).toHaveProperty('name', "L'etrange");
        expect(updatedUser).toHaveProperty('password');
        expect(updatedUser).toHaveProperty('address', 'Address #8');
        expect(updatedUser).toHaveProperty('phone', '011');
    });

    it('should never change the email, answer and role of the user', async () => {
        const update_query = {
            name: 'The Woman',
            password: 'Updated Password',
            address: 'Address #3',
            phone: '007',
        }

        await supertest(app).put('/api/v1/auth/profile')
                            .set('Authorization', `Bearer ${user_tokens[1]}`)
                            .send(update_query)
                            .expect(200)

        const updatedUser = await UserModel.findById(user_docs[1]);
        expect(updatedUser).toHaveProperty('email', 'email@2');
        expect(updatedUser).toHaveProperty('answer', 'B');
        expect(updatedUser).toHaveProperty('role', 1);
    });

    it('should not affect other users that are not updated', async () => {
        const update_query = {
            name: 'The Woman',
            password: 'Updated Password',
            address: 'Address #3',
            phone: '007',
        }

        await supertest(app).put('/api/v1/auth/profile')
                            .set('Authorization', `Bearer ${user_tokens[0]}`)
                            .send(update_query)
                            .expect(200);

        const updatedUser = await UserModel.findById(user_docs[1]);
        expect(updatedUser).toHaveProperty('name', 'The Other Man');
        expect(updatedUser).toHaveProperty('address', 'Address #2');
        expect(updatedUser).toHaveProperty('phone', '1040112305');
    });

    it('should return a 400 response with a bad password', async () => {
        const update_query = {
            password: '12345',
        }

        const response = supertest(app).put('/api/v1/auth/profile')
                            .set('Authorization', `Bearer ${user_tokens[0]}`)
                            .send(update_query)

        const body = (await response.expect(400)).body;
        expect(body).toHaveProperty('success', false);
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('message', 'Password needs to be at least 6 characters long.');
    });

    it('should not update the password in the DB if bad password error', async () => {
        const update_query = {
            password: '12345',
        }

        await supertest(app).put('/api/v1/auth/profile')
                            .set('Authorization', `Bearer ${user_tokens[0]}`)
                            .send(update_query)
                            .expect(400);
                            
        const updatedUser = await UserModel.findById(user_docs[0]);
        expect(updatedUser).toHaveProperty('password', 'Some Password Hash');
    });

    it('should reject access to the route if JWT token is expired', async () => {
        const expired_jwt = JWT.sign({
            _id: user_docs[0]._id,
            iat: Math.floor(Date.now() / 1000) - 30,
            exp: Math.floor(Date.now() / 1000) - 20,
        }, DUMMY_JWT_SECRET)
        const update_query = {
            password: '123456',
        }

        const response = await supertest(app).put('/api/v1/auth/profile')
                            .set('Authorization', `Bearer ${expired_jwt}`)
                            .send(update_query)
                            .expect(401);
        
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Invalid or Expired Token');
    })

    it('should reject access to the route if JWT token is not present', async () => {
        const update_query = {
            password: '123456',
        }

        const response = await supertest(app).put('/api/v1/auth/profile')
                            .send(update_query)
                            .expect(401);
        
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Authorization header is missing');
    })
})
