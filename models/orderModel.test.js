// Wang Zhi Wren, A0255368U
import mongoose from 'mongoose';
import OrderModel from './orderModel';

const canned_order = {
  products: [new mongoose.Types.ObjectId('000000000000000000000000')],
  payment: true,
  buyer: new mongoose.Types.ObjectId('000000000000000000000001'),
  status: 'Processing'
}

const expected_status = ['Not Processed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

describe('Order Model', () => {
  it('should allow an order when supplied with every relevant field', async () => {
    const order = new OrderModel(canned_order);

    const validate = order.validate();

    await expect(validate).resolves.not.toThrow();
  });

  it('should allow an order even when not supplied a status field', async () => {
    const modded_order = {
      ...canned_order,
    }
    delete modded_order.status;
    const order = new OrderModel(canned_order);

    const validate = order.validate();

    await expect(validate).resolves.not.toThrow();
  });

  it('should fail when order is not supplied with products', async () => {
    const modded_order = {
      ...canned_order,
      products: [],
    }
    modded_order.products = [];
    const order = new OrderModel(modded_order);

    const validate = order.validate();

    await expect(validate).rejects.toThrow('An order should have at least 1 product.');
  });

  it('should fail when order is not supplied with a buyer', async () => {
    const modded_order = {
      ...canned_order
    }
    delete modded_order.buyer;
    const order = new OrderModel(modded_order);

    const validate = order.validate();

    await expect(validate).rejects.toThrow('Order validation failed: buyer: Path `buyer` is required.');
  });

  describe('Status Field Enums', () => {
    expected_status.forEach(status => it(`should allow "${status}" as a possible status field value`, async () => {
      const modded_order = {
        ...canned_order,
        status: status
      }
      const order = new OrderModel(modded_order);

      const validate = order.validate();

      await expect(validate).resolves.not.toThrow();
    }))

    it('should not allow values not specified in its enum', async () => {
      const modded_order = {
        ...canned_order,
        status: 'test failure'
      }
      const order = new OrderModel(modded_order);

      const validate = order.validate();

      await expect(validate).rejects.toThrow('Order validation failed: status: `test failure` is not a valid enum value for path `status`.');
    })
  });
})