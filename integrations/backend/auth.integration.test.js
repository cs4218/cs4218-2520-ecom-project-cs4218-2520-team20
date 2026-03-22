import { registerController, loginController, testController, updateProfileController, forgotPasswordController } from "../../controllers/authController";
import userModel from "../../models/userModel"; 
import * as authHelper from "../../helpers/authHelper";
import { requireSignIn } from "../../middlewares/authMiddleware";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import { describe } from "node:test";

// Nigel Lee, A0259264W
jest.mock("../../models/userModel")
jest.mock("jsonwebtoken");

describe("Backend Auth Integration", () => {
  let mRes;
  let next;
  beforeEach(() => {
    jest.clearAllMocks();
    mRes = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    next = jest.fn();
  });

  beforeAll(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
      console.log.mockRestore();
  });

  describe("Registration Flow: Auth Controller + Auth Helper", () => {
    it("should save the HASHED password when a user successfully registers", async () => {
      const plainTextPassword = "SecurePassword123";  
      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: plainTextPassword,
          phone: "123456789",
          address: "123 Street",
          answer: "42",
        },
      }

      userModel.findOne.mockResolvedValue(null);
      userModel.prototype.save = jest.fn().mockResolvedValue({ 
          ...req.body, 
          _id: "mock_id" 
      });

      await registerController(req, mRes);

      expect(mRes.status).toHaveBeenCalledWith(201);
      const dataPassedToDatabase = userModel.mock.calls[0][0];
      expect(dataPassedToDatabase.password).not.toBe(plainTextPassword);
      const isHashValid = await bcrypt.compare(plainTextPassword, dataPassedToDatabase.password);
      expect(isHashValid).toBe(true);
    });

    it("should return a 500 error if the real bcrypt helper throws an exception", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "SecurePassword123",
          phone: "123456789",
          address: "123 Street",
          answer: "42",
        },
      };

      userModel.findOne.mockResolvedValue(null);
      const helperSpy = jest.spyOn(authHelper, "hashPassword").mockRejectedValue(new Error("Hashing Failed"));

      await registerController(req, mRes);

      expect(mRes.status).toHaveBeenCalledWith(500);
      expect(mRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in Registration",
        })
      );

      helperSpy.mockRestore();  
    });
  });

  describe("Login Flow: Auth Controller + Auth Helper", () => {
    it("should successfully log in a user when the real comparePassword helper matches the database hash", async () => {
      const plainTextPassword = "SecurePassword123";  
      const realHashedPassword = await authHelper.hashPassword(plainTextPassword);

      userModel.findOne.mockResolvedValue({
        _id: "user_123",
        name: "John Doe",
        email: "john@example.com",
        password: realHashedPassword,
        role: 0
      });
      JWT.sign.mockReturnValue("fake_jwt_token");

      const req = {
        body: { email: "john@example.com", password: plainTextPassword }
      };

      await loginController(req, mRes);

      expect(mRes.status).toHaveBeenCalledWith(200);
      expect(mRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "login successfully",
          token: "fake_jwt_token"
        })
      );
    });

    it("should reject login with 401 when the real comparePassword helper says that the passwords do not match", async () => {
      const incorrectPassword = "IncorrectPassword123";
      const realPassword = "SecurePassword123"; 
      const realHashedPassword = await authHelper.hashPassword(realPassword);

      userModel.findOne.mockResolvedValue({
        _id: "user_123",
        name: "John Doe",
        email: "john@example.com",
        password: realHashedPassword,
        role: 0
      });

      const req = {
        body: { email: "john@example.com", password: incorrectPassword }
      };

      await loginController(req, mRes);

      expect(mRes.status).toHaveBeenCalledWith(401);
      expect(mRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid Password",
        })
      );
    });
  });

  describe("Integration: Forgot Password Flow (Controller -> Helper)", () => {
    it("should successfully hash the new password using real bcrypt before updating the database", async () => {
      const plainTextNewPassword = "NewPassword123";
      const req = {
        body: {
          email: "john@example.com",
          answer: "42",
          newPassword: plainTextNewPassword,
        },
      };

      const mockUserId = "user_789";

      userModel.findOne.mockResolvedValue({
        _id: mockUserId,
        email: "john@example.com",
        answer: "42",
        password: "OldHashedPassword",
      });

      userModel.findByIdAndUpdate.mockResolvedValue({});

      await forgotPasswordController(req, mRes);

      expect(mRes.status).toHaveBeenCalledWith(200);
      expect(mRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Password Reset Successfully",
        })
      );

      const updatedUserId = userModel.findByIdAndUpdate.mock.calls[0][0];
      const updatePayload = userModel.findByIdAndUpdate.mock.calls[0][1];

      expect(updatedUserId).toBe(mockUserId);
      expect(updatePayload.password).not.toBe(plainTextNewPassword);
      expect(updatePayload.password).toHaveLength(60);

      const isNewHashValid = await bcrypt.compare(plainTextNewPassword, updatePayload.password);
      expect(isNewHashValid).toBe(true);
    });

    it("should return 500 if the real bcrypt helper throws an error during the reset process", async () => {
      const req = {
        body: {
          email: "john@example.com",
          answer: "42",
          newPassword: "NewPassword123",
        },
      };

      userModel.findOne.mockResolvedValue({ _id: "user_789" });

      const helperSpy = jest
        .spyOn(authHelper, "hashPassword")
        .mockRejectedValue(new Error("Bcrypt crashed during reset"));

      await forgotPasswordController(req, mRes);

      expect(mRes.status).toHaveBeenCalledWith(500);
      expect(mRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Something went wrong",
        })
      );

      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();

      helperSpy.mockRestore();
    });
  });

  describe("Update Profile Flow: Auth Controller + Auth Helper", () => {
    it("should save updated HASHED password if password is updated in the profile", async () => {
      const userId = "john_123";
      const newPlainTextPassword = "NewPassword123";

      const req = {
        user: { _id: userId },
        body: {
          name: "John Updated",
          password: newPlainTextPassword
        },
      };

      userModel.findById.mockResolvedValue({
        _id: userId,
        name: "John",
        password: "OldHashedPassword",
        phone: "123456789",
        address: "123 Street"
      });

      userModel.findByIdAndUpdate.mockResolvedValue({
        name: "John Updated",
        password: "NewHashedPasswordResult",
        phone: "123456789",
        address: "123 Street"
      });

      await updateProfileController(req, mRes);

      expect(mRes.status).toHaveBeenCalledWith(200);

      const updateObject = userModel.findByIdAndUpdate.mock.calls[0][1];
      expect(userModel.findByIdAndUpdate.mock.calls[0][0]).toBe(userId);
      expect(updateObject.name).toBe("John Updated");
      expect(updateObject.password).not.toBe(newPlainTextPassword);

      const isNewPasswordCorrect = await bcrypt.compare(
        newPlainTextPassword, 
        updateObject.password
      );
      expect(isNewPasswordCorrect).toBe(true);
    });
  });

  describe("Update Profile Flow (Middleware -> Controller -> Helper)", () => {
    it("should decode JWT, pass user ID to controller, and hash the new password", async () => {
      const plainTextPassword = "NewPassword123";
      const req = {
        headers: {
          authorization: "valid_token_for_john"
        },
        body: {
          name: "John Updated",
          password: plainTextPassword
        }
      };

      JWT.verify.mockReturnValue({ _id: "john_123" });

      userModel.findById.mockResolvedValue({
        _id: "john_123",
        name: "John Old",
        password: "OldHashedPassword"
      });
      userModel.findByIdAndUpdate.mockResolvedValue({});

      await requireSignIn(req, mRes, next);

      expect(req.user._id).toBe("john_123");
      expect(next).toHaveBeenCalled();


      if (next.mock.calls.length > 0) {
        await updateProfileController(req, mRes);
      }

      expect(userModel.findById).toHaveBeenCalledWith("john_123");

      const updateObject = userModel.findByIdAndUpdate.mock.calls[0][1];

      expect(updateObject.password).not.toBe(plainTextPassword);
      
      const isHashValid = await bcrypt.compare(plainTextPassword, updateObject.password);
      expect(isHashValid).toBe(true);
      
      expect(mRes.status).toHaveBeenCalledWith(200);
    });
  });


  describe("Protected Route Flow: Middleware + Controller Integration", () => {
    it("should authorize user and allow access to the protected controller if JWT is valid", async () => {
      const mockDecodedUser = { _id: "john_123", name: "John Doe" };
      const req = {
        headers: {
          authorization: "valid_token_for_john"
        }
      };

      JWT.verify.mockReturnValue(mockDecodedUser);

      await requireSignIn(req, mRes, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockDecodedUser);

      if (next.mock.calls.length > 0) {
        await testController(req, mRes);
      }

      expect(mRes.send).toHaveBeenCalledWith("Protected Routes");
    });

    it("should block access to the protected controller if JWT is invalid", async () => {
      const req = {
        headers: {
          authorization: "fake_or_expired_token"
        }
      };

      JWT.verify.mockImplementation(() => {
        throw new Error("Invalid Token");
      });

      await requireSignIn(req, mRes, next);

      expect(mRes.status).toHaveBeenCalledWith(401);
      expect(mRes.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: "Invalid or Expired Token"
      }));

      expect(next).not.toHaveBeenCalled();
    });
  });
});