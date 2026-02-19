import { getOrdersController, getAllOrdersController, orderStatusController } from "./authController";
import orderModel from "../models/orderModel.js";

const canned_req = {
    user: {
        _id: 'test-id'
    }
}

jest.mock('../models/orderModel', () => ({
    __esModule: true,
    default: {
        find: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        findByIdAndUpdate: jest.fn()
    }
}));

const res_mock = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Get Orders Controller', () => {
    it('should be called with find and populate properly', async () => {
        await getOrdersController(canned_req, res_mock);

        expect(orderModel.find).toHaveBeenCalledTimes(1);
        expect(orderModel.populate).toHaveBeenCalledTimes(2);
        expect(orderModel.sort).toHaveBeenCalledTimes(1);
        const find_params = orderModel.find.mock.calls[0][0];
        expect(find_params).toHaveProperty('buyer', 'test-id');
        const [ pop_params_products, pop_params_buyers ] = orderModel.populate.mock.calls;
        expect(pop_params_products[0]).toBe('products');
        expect(pop_params_products[1]).toBe('-photo');
        expect(pop_params_buyers[0]).toBe('buyer');
        expect(pop_params_buyers[1]).toBe('name');
        const sort_params = orderModel.sort.mock.calls[0][0];
        expect(sort_params).toHaveProperty('createdAt', -1);
    });

    it('should respond with the default 200 code on success.', async () => {
        await getOrdersController(canned_req, res_mock);

        expect(res_mock.status).not.toHaveBeenCalled();
        expect(res_mock.json).toHaveBeenCalledTimes(1);
    });

    it('should respond with the code 500 on server failure.', async () => {
        const err = new Error('test-error')
        res_mock.json.mockImplementationOnce(() => { throw err });

        await getOrdersController(canned_req, res_mock);

        expect(res_mock.status).toHaveBeenCalledWith(500);
        expect(res_mock.send).toHaveBeenCalledTimes(1);
        const params = res_mock.send.mock.lastCall[0]
        expect(params).toHaveProperty('success', false)
        expect(params).toHaveProperty('message', 'Error while getting orders.')
        expect(params).toHaveProperty('error', err)
    });
});

describe('Get All Orders Controller', () => {
    it('should be called with find and populate properly', async () => {
        await getAllOrdersController({}, res_mock);

        expect(orderModel.find).toHaveBeenCalledTimes(1);
        expect(orderModel.populate).toHaveBeenCalledTimes(2);
        const find_params = orderModel.find.mock.calls[0][0];
        expect(find_params).toStrictEqual({});
        const [ pop_params_products, pop_params_buyers ] = orderModel.populate.mock.calls;
        expect(pop_params_products[0]).toBe('products');
        expect(pop_params_products[1]).toBe('-photo');
        expect(pop_params_buyers[0]).toBe('buyer');
        expect(pop_params_buyers[1]).toBe('name');
        const sort_params = orderModel.sort.mock.calls[0][0];
        expect(sort_params).toHaveProperty('createdAt', -1);
    });

    it('should respond with the default 200 code on success.', async () => {
        await getAllOrdersController({}, res_mock);

        expect(res_mock.status).not.toHaveBeenCalled();
        expect(res_mock.json).toHaveBeenCalledTimes(1);
    });

    it('should respond with the code 500 on server failure.', async () => {
        const err = new Error('test-error')
        res_mock.json.mockImplementationOnce(() => { throw err });

        await getAllOrdersController({}, res_mock);

        expect(res_mock.status).toHaveBeenCalledWith(500);
        expect(res_mock.send).toHaveBeenCalledTimes(1);
        const params = res_mock.send.mock.lastCall[0]
        expect(params).toHaveProperty('success', false)
        expect(params).toHaveProperty('message', 'Error while getting orders.')
        expect(params).toHaveProperty('error', err)
    });
});

describe('Update Order Controller', () => {
    const update_order_req = {
        params: { orderId: 'test-id' },
        body: { status: 'test-status' },
    }

    it('should call findByIdAndUpdate properly.', async () => {
        await orderStatusController(update_order_req, res_mock);

        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledTimes(1)
        const params = orderModel.findByIdAndUpdate.mock.lastCall;
        expect(params[0]).toBe(update_order_req.params.orderId);
        expect(params[1]).toHaveProperty('status', update_order_req.body.status);
        expect(params[2]).toHaveProperty('new', true);
    });

    it('should respond with the default 200 code on success.', async () => {
        await orderStatusController(update_order_req, res_mock);

        expect(res_mock.status).not.toHaveBeenCalled();
        expect(res_mock.json).toHaveBeenCalledTimes(1);
    });

    it('should respond with the code 500 on server failure.', async () => {
        const err = new Error('test-error')
        res_mock.json.mockImplementationOnce(() => { throw err });

        await orderStatusController(update_order_req, res_mock);

        expect(res_mock.status).toHaveBeenCalledWith(500);
        expect(res_mock.send).toHaveBeenCalledTimes(1);
        const params = res_mock.send.mock.lastCall[0]
        expect(params).toHaveProperty('success', false)
        expect(params).toHaveProperty('message', 'Error while updating orders.')
        expect(params).toHaveProperty('error', err)
    });
});