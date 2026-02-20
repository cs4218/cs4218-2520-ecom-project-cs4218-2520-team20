// Wang Zhi Wren, A0255368U
import { getAllUsersController } from "./authController";
import userModel from "../models/userModel.js";

jest.mock('../models/userModel', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  }
}));

const res_mock = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Get All Users Controller', () => {
  it('should be called with find and sort properly', async () => {
    await getAllUsersController({}, res_mock);

    expect(userModel.find).toHaveBeenCalledTimes(1);
    const find_params = userModel.find.mock.calls[0];
    expect(find_params[0]).toStrictEqual({});
    expect(find_params[1]).toBe('-password -answer -updatedAt');
    const sort_params = userModel.sort.mock.calls[0][0];
    expect(sort_params).toHaveProperty('role', -1);
    expect(sort_params).toHaveProperty('createdAt', -1);
  });

  it('should respond with the default 200 code on success.', async () => {
    await getAllUsersController({}, res_mock);

    expect(res_mock.status).not.toHaveBeenCalled();
    expect(res_mock.send).toHaveBeenCalledTimes(1);
  });

  it('should respond with the code 500 on server failure.', async () => {
    const err = new Error('test-error')
    res_mock.send.mockImplementationOnce(() => { throw err });

    await getAllUsersController({}, res_mock);

    expect(res_mock.status).toHaveBeenCalledWith(500);
    expect(res_mock.send).toHaveBeenCalledTimes(2);
    const params = res_mock.send.mock.lastCall[0]
    expect(params).toHaveProperty('success', false)
    expect(params).toHaveProperty('message', 'Error while getting users.')
    expect(params).toHaveProperty('error', err)
  });
});