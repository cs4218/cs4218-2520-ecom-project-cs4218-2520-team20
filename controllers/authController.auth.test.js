import { 
    loginController, 
    registerController, 
    forgotPasswordController,   
    testController
} from "./authController.js";
import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// Nigel Lee, A0259264W
jest.mock("../models/userModel.js");
jest.mock("./../helpers/authHelper.js");
jest.mock("jsonwebtoken");

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
    console.log.mockRestore();
});

describe('Register Controller', () => {
    let mRes;
    beforeEach(() => {
        jest.clearAllMocks();
        mRes = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    });

    const mockUserData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "123456789",
        address: "123 Street",
        answer: "42"
    };

    it.each([
        { field: 'name', expected: { message: "Name is Required" } },
        { field: 'email', expected: { message: "Email is Required" } },
        { field: 'password', expected: { message: "Password is Required" } },
        { field: 'phone', expected: { message: "Phone no is Required" } },
        { field: 'address', expected: { message: "Address is Required" } },
        { field: 'answer', expected: { message: "Answer is Required" } }
    ])('should return validation error when $field is missing', async ({ field, expected }) => {
        const body = { ...mockUserData };
        delete body[field];
        await registerController({ body }, mRes);
        expect(mRes.send).toHaveBeenCalledWith(expected);
    });

    it('should return 200 if user already exists', async () => {
        userModel.findOne.mockResolvedValue({ email: "john@example.com" });
        await registerController({ body: mockUserData }, mRes);
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "john@example.com" });
        expect(mRes.status).toHaveBeenCalledWith(200);
        expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Already registered, please login" }));
    });

    it('should register user successfully', async () => {
        userModel.findOne.mockResolvedValue(null);
        hashPassword.mockResolvedValue("hashed_password");
        const saveMock = jest.fn().mockResolvedValue({ ...mockUserData, _id: "mock_id" });
        userModel.prototype.save = saveMock;

        await registerController({ body: mockUserData }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(201);
        expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 500 on internal error', async () => {
        userModel.findOne.mockRejectedValue(new Error("DB Error"));
        await registerController({ body: mockUserData }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(500);
        expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Error in Registration" }));
    });
});

describe('Login Controller', () => {
    let mRes;
    beforeEach(() => {
        jest.clearAllMocks();
        mRes = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    });

    it('should return 404 on missing credentials', async () => {
        await loginController({ body: { email: '' } }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if email not registered', async () => {
        userModel.findOne.mockResolvedValue(null);
        await loginController({ body: { email: 'john@example.com', password: 'password123' } }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(404);
        expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Email is not registered" }));
    });

    it('should return 401 if password does not match', async () => {
        userModel.findOne.mockResolvedValue({ email: 'john@example.com', password: 'hashed' });
        comparePassword.mockResolvedValue(false);
        await loginController({ body: { email: 'john@example.com', password: '123' } }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(401);
        expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid Password" }));
    });

    it('should login successfully', async () => {
        const user = { _id: '1', name: 'John Doe', email: 'john@example.com', role: 0 };
        userModel.findOne.mockResolvedValue(user);
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockReturnValue('mock_token');
        
        await loginController({ body: { email: 'john@example.com', password: 'password123' } }, mRes);
        
        expect(mRes.status).toHaveBeenCalledWith(200);
        expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({ 
            success: true, 
            token: 'mock_token',
            user: expect.objectContaining({ email: 'john@example.com' })
        }));
    });

    it('should return 500 on error', async () => {
        userModel.findOne.mockRejectedValue(new Error());
        await loginController({ body: { email: 'john@example.com', password: 'password123' } }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(500);
    });
});

describe('Forgot Password Controller', () => {
    let mRes;
    const mockData = { email: "john@example.com", answer: "42", newPassword: "new_password" };
    beforeEach(() => {
        jest.clearAllMocks();
        mRes = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    });

    it('should return 400 on missing fields', async () => {
        await forgotPasswordController({ body: { email: '' } }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not found', async () => {
        userModel.findOne.mockResolvedValue(null);
        await forgotPasswordController({ body: mockData }, mRes);
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "john@example.com", answer: "42" });
        expect(mRes.status).toHaveBeenCalledWith(401);
    });

    it('should reset password successfully', async () => {
        userModel.findOne.mockResolvedValue({ _id: '123', email: "john@example.com" });
        hashPassword.mockResolvedValue("hashed");
        await forgotPasswordController({ body: mockData }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(200);
        expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 500 on error', async () => {
        userModel.findOne.mockRejectedValue(new Error());
        await forgotPasswordController({ body: mockData }, mRes);
        expect(mRes.status).toHaveBeenCalledWith(500);
    });
});

describe("testController", () => {
    it("should send protected routes message", () => {
        const res = { send: jest.fn() };
        testController({}, res);
        expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });
});