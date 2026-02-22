import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

// Nigel Lee, A0259264W
jest.mock("bcrypt");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("hashPassword", () => {
    it("should call bcrypt.hash with correct arguments and return hashed password", async () => {
        const plainPassword = "password123";
        const mockHashedValue = "hashed_secret_123";
        
        bcrypt.hash.mockResolvedValue(mockHashedValue);

        const result = await hashPassword(plainPassword);

        expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
        expect(result).toBe(mockHashedValue);
    });

    it("should log error and return undefined if bcrypt.hash fails", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        bcrypt.hash.mockRejectedValue(new Error("Hashing failed"));

        const result = await hashPassword("password");

        expect(consoleSpy).toHaveBeenCalled();
        expect(result).toBeUndefined();
        
        consoleSpy.mockRestore();
    });
    });

describe("comparePassword", () => {
    it("should return true if bcrypt.compare returns true", async () => {
        bcrypt.compare.mockResolvedValue(true);

        const result = await comparePassword("plain", "hashed");

        expect(bcrypt.compare).toHaveBeenCalledWith("plain", "hashed");
        expect(result).toBe(true);
    });

    it("should return false if bcrypt.compare returns false", async () => {
        bcrypt.compare.mockResolvedValue(false);

        const result = await comparePassword("wrong_plain", "hashed");

        expect(result).toBe(false);
    });
});
