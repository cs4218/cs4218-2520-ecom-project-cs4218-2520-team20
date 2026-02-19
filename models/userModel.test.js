// Wang Zhi Wren, A0255368U
import mongoose from "mongoose";
import UserModel from "./userModel";

// note unique is NOT a validator for mongoose, so it cannot be tested directly.

const canned_user = {
  name: 'John Doe',
  email: 'a@b.com',
  // dummy password hash generated with salt oCKGycXQs0m3/6KVZMZYvu on bcrypt algorithm for testing
  password: '$2a$10$oCKGycXQs0m3/6KVZMZYvuA7qH.QQdAULJOgQBYR93tfvjdgmiGyW',
  phone: '12345678',
  address: 'P. Sherman, 42 Wallaby Way, Sydney',
  answer: 'Baseball',
  role: 0
}

describe("User Model", () => {
  it("should allow a user when supplied with every relevant field", async () => {
    const user = new UserModel(canned_user)

    const validate = user.validate()

    await expect(validate).resolves.not.toThrow()
  });


  it("should assign string types to all its fields", async () => {
    // we make use of mongoose's casting capability to convert ints into strings
    const modded_user = {
      name: 1,
      email: 1,
      password: 1,
      phone: 1,
      address: 1,
      answer: 1
    }

    const user = new UserModel(modded_user)
    console.log(user.name)

    expect(typeof user.name).toBe("string")
    expect(typeof user.email).toBe("string")
    expect(typeof user.password).toBe("string")
    expect(typeof user.phone).toBe("string")
    expect(typeof user.address).toBe("string")
    expect(typeof user.answer).toBe("string")
  });

  it("should require a name for the new user", async () => {
    const modded_user = structuredClone(canned_user)
    delete modded_user.name
    const user = new UserModel(modded_user)

    const validate = user.validate()

    await expect(validate).rejects.toThrow()
  });

  it("should require an email for the new user", async () => {
    const modded_user = structuredClone(canned_user)
    delete modded_user.email
    const user = new UserModel(modded_user)

    const validate = user.validate()

    await expect(validate).rejects.toThrow()
  });

  it("should require a password for the new user", async () => {
    const modded_user = structuredClone(canned_user)
    delete modded_user.password
    const user = new UserModel(modded_user)

    const validate = user.validate()

    await expect(validate).rejects.toThrow()
  });

  it("should require a phone number for the new user", async () => {
    const modded_user = structuredClone(canned_user)
    delete modded_user.phone
    const user = new UserModel(modded_user)

    const validate = user.validate()

    await expect(validate).rejects.toThrow()
  });

  it("should require an address for the new user", async () => {
    const modded_user = structuredClone(canned_user)
    delete modded_user.address
    const user = new UserModel(modded_user)

    const validate = user.validate()

    await expect(validate).rejects.toThrow()
  });

  it("should require a password-reset answer for the new user", async () => {
    const modded_user = structuredClone(canned_user)
    delete modded_user.answer
    const user = new UserModel(modded_user)

    const validate = user.validate()

    await expect(validate).rejects.toThrow()
  });

  describe('Role Field', () => {
    it("should be set to 0 when creating a user with no role specified", async () => {
      const modded_user = structuredClone(canned_user)
      delete modded_user.role
      const user = new UserModel(modded_user)

      const validate = user.validate()

      await expect(validate).resolves.not.toThrow()
      expect(user.role).toBe(0)
    });

    it("should also allow user with role 1", async () => {
      const modded_user = structuredClone(canned_user)
      modded_user.role = 1
      const user = new UserModel(modded_user)

      const validate = user.validate()

      expect(user.role).toBe(1)
      await expect(validate).resolves.not.toThrow()
    });

    it("should not allow user with non-integer roles", async () => {
      const modded_user = structuredClone(canned_user)
      modded_user.role = 0.5
      const user = new UserModel(modded_user)

      const validate = user.validate()

      await expect(validate).rejects.toThrow()
    });

    it("should not allow user with roles <0", async () => {
      const modded_user = structuredClone(canned_user)
      modded_user.role = -1
      const user = new UserModel(modded_user)

      const validate = user.validate()

      await expect(validate).rejects.toThrow()
    });

    it("should not allow user with roles >1", async () => {
      const modded_user = structuredClone(canned_user)
      modded_user.role = 2
      const user = new UserModel(modded_user)

      const validate = user.validate()

      await expect(validate).rejects.toThrow()
    });
  })
})