import { requireSignIn, isAdmin } from "./authMiddleware";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Nigel Lee, A0259264W
jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Authorization Middleware Suite", () => {
    let req;
    let mRes;
    let next;

    const MOCK_USER_ID = "john_doe_678";
    const ADMIN_USER = { _id: MOCK_USER_ID, name: "John Doe", role: 1 };
    const REGULAR_USER = { _id: MOCK_USER_ID, name: "John Doe", role: 0 };

    beforeEach(() => {
        jest.clearAllMocks();
        
        req = {
            headers: {
                authorization: "initial.mock.token"
            },
            user: { _id: MOCK_USER_ID }
        };

        mRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        next = jest.fn();
        
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterAll(() => {
        console.log.mockRestore();
    });

    describe("requireSignIn Logic", () => {
        it('should validate JWT and attach John Doe payload to request', async () => {
            const tokenPayload = { _id: MOCK_USER_ID, name: "John Doe" };
            JWT.verify.mockReturnValue(tokenPayload);

            await requireSignIn(req, mRes, next);

            expect(JWT.verify).toHaveBeenCalledWith(req.headers.authorization, process.env.JWT_SECRET);
            expect(req.user).toEqual(tokenPayload);
            expect(next).toHaveBeenCalled();
        });

        it('should halt execution and return 401 for corrupted or expired tokens', async () => {
            JWT.verify.mockImplementation(() => {
                throw new Error("JWT Error");
            });

            await requireSignIn(req, mRes, next);

            expect(next).not.toHaveBeenCalled();
            expect(mRes.status).toHaveBeenCalledWith(401);
            expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringMatching(/invalid/i)
            }));
        });

        it('should successfully parse "Bearer" prefixed headers', async () => {
            const rawToken = "john_doe_secret_jwt";
            req.headers.authorization = `Bearer ${rawToken}`;
            
            JWT.verify.mockReturnValue({ _id: MOCK_USER_ID });

            await requireSignIn(req, mRes, next);

            expect(JWT.verify).toHaveBeenCalledWith(rawToken, process.env.JWT_SECRET);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("isAdmin Logic", () => {
        it('should permit access when John Doe has admin privileges (role: 1)', async () => {
            userModel.findById.mockResolvedValue(ADMIN_USER);

            await isAdmin(req, mRes, next);

            expect(userModel.findById).toHaveBeenCalledWith(MOCK_USER_ID);
            expect(next).toHaveBeenCalled();
        });

        it('should deny access when John Doe is a regular user (role: 0)', async () => {
            userModel.findById.mockResolvedValue(REGULAR_USER);

            await isAdmin(req, mRes, next);

            expect(mRes.status).toHaveBeenCalledWith(401);
            expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "Unauthorized Access"
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should trigger 500 status code if database connectivity fails', async () => {
            const connectionError = new Error("Connection Refused");
            userModel.findById.mockRejectedValue(connectionError);

            await isAdmin(req, mRes, next);

            expect(mRes.status).toHaveBeenCalledWith(500);
            expect(mRes.send).toHaveBeenCalledWith({
                success: false,
                error: connectionError,
                message: "Error in admin middleware",
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});