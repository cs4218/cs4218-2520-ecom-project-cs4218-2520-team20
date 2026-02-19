import { updateProfileController } from "./authController";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

const canned_user = {
    name: 'John Doe',
    phone: '12345678',
    // dummy password hash generated with salt oCKGycXQs0m3/6KVZMZYvu on bcrypt algorithm for testing
    password: '$2a$10$oCKGycXQs0m3/6KVZMZYvuA7qH.QQdAULJOgQBYR93tfvjdgmiGyW',
    address: 'P. Sherman, 42 Wallaby Way, Sydney'
}

const canned_req = {
    body: {
        name: 'William Smith',
        phone: '87654321',
        password: '123456',
        address: '221B Baker Street, London'
    },
    user: {
        _id: 'test-id'
    }
}

jest.mock('../models/userModel', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(id => Promise.resolve(canned_user)),
        findByIdAndUpdate: jest.fn()
    }
}));

jest.mock('../helpers/authHelper', () => ({
    hashPassword: jest.fn(() => 'hashed-password')
}));

const send_mock = {
    send: jest.fn()
}

const res_mock = {
    status: jest.fn(() => send_mock)
}

describe('Update Profile Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update when all fields are valid', async () => {
        await updateProfileController(canned_req, res_mock);

        expect(res_mock.status).toHaveBeenCalledWith(200)
        expect(send_mock.send).toHaveBeenCalledTimes(1)
        const params = send_mock.send.mock.lastCall[0]
        expect(params).toHaveProperty('success', true)
        expect(params).toHaveProperty('message', 'Profile updated successfully.')
        expect(params).toHaveProperty('updatedUser')
    });

    it('performs a default update with DB values if request is empty', async () => {
        const modded_req = {
            body: {},
            user: canned_req.user
        }

        await updateProfileController(modded_req, res_mock);
        
        expect(res_mock.status).toHaveBeenCalledWith(200);
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
        const params = userModel.findByIdAndUpdate.mock.lastCall[1];
        expect(params).toHaveProperty('name', canned_user.name);
        expect(params).toHaveProperty('phone', canned_user.phone);
        expect(params).toHaveProperty('password', canned_user.password);
        expect(params).toHaveProperty('address', canned_user.address);
    });

    it('should hash the password before update', async () => {
        const modded_req = structuredClone(canned_req)
        modded_req.body = { password: canned_req.body.password }

        await updateProfileController(modded_req, res_mock);

        expect(hashPassword).toHaveBeenCalledTimes(1)
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1)
        const params = userModel.findByIdAndUpdate.mock.lastCall[1]
        expect(params).toHaveProperty('password', 'hashed-password')
    });

    it('should not call hashPassword if no password field exists', async () => {
        const modded_req = structuredClone(canned_req)
        delete modded_req.body.password

        await updateProfileController(modded_req, res_mock);

        expect(hashPassword).not.toHaveBeenCalled()
    });

    
    it('should fail to update if password length = 5 with client-error code', async () => {
        const modded_req = {
            body: { password: '12345' },
            user: canned_req.user
        }

        await updateProfileController(modded_req, res_mock);

        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res_mock.status).toHaveBeenCalledWith(400);
        expect(send_mock.send).toHaveBeenCalledTimes(1)
        const params = send_mock.send.mock.lastCall[0]
        expect(params).toHaveProperty('success', false)
        expect(params).toHaveProperty('message', 'Password needs to be at least 6 characters long.')
        expect(params).toHaveProperty('error')
    });

    it('should update if password length = 7', async () => {
        const modded_req = {
            body: { password: '1234567' },
            user: canned_req.user
        }

        await updateProfileController(modded_req, res_mock);

        expect(hashPassword).toHaveBeenCalledTimes(1)
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1)
        const params = userModel.findByIdAndUpdate.mock.lastCall[1]
        expect(params).toHaveProperty('password', 'hashed-password')
    });

    it('should inform the user of server failure with appropriate code', async () => {
        const err = new Error('test-error')
        userModel.findById.mockRejectedValueOnce(err)

        await updateProfileController(canned_req, res_mock);

        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res_mock.status).toHaveBeenCalledWith(500);
        expect(send_mock.send).toHaveBeenCalledTimes(1)
        const params = send_mock.send.mock.lastCall[0]
        expect(params).toHaveProperty('success', false)
        expect(params).toHaveProperty('message', 'Server Error - Failed to update profile.')
        expect(params).toHaveProperty('error', err)
    });
});