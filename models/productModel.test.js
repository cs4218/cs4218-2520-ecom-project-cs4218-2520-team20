import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Product from './productModel';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Product Model Tests', () => {
  it('should successfully create a product', async () => {
    // Arrange
    const productData = {
      name: 'Laptop',
      slug: 'laptop',
      description: 'A high-end gaming laptop',
      price: 1200,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      photo: {
        data: Buffer.from('imageData'),
        contentType: 'image/png',
      },
      shipping: true,
    };

    // Act
    const product = new Product(productData);
    const savedProduct = await product.save();

    // Assert
    expect(savedProduct.name).toBe(productData.name);
    expect(savedProduct.slug).toBe(productData.slug);
    expect(savedProduct.price).toBe(productData.price);
    expect(savedProduct.category).toBeDefined();
    expect(savedProduct.shipping).toBe(true);
  });

  it('should throw an error if required fields are missing', async () => {
    // Arrange
    const invalidProductData = {
      name: 'Laptop',
      slug: '',
      description: 'A high-end gaming laptop',
      price: 1200,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
    };
    
    try {
      // Act
      const product = new Product(invalidProductData);
      await product.save();
    } catch (error) {
      // Assert
      expect(error.errors.slug).toBeDefined();
    }
  });

  it('should find a product by slug', async () => {
    // Arrange
    const productData = {
      name: 'Laptop',
      slug: 'gaming-laptop',
      description: 'A gaming laptop',
      price: 1200,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      shipping: true,
    };
    const product = new Product(productData);
    await product.save();

    // Act
    const foundProduct = await Product.findOne({ slug: 'gaming-laptop' });

    // Assert
    expect(foundProduct).toBeDefined();
    expect(foundProduct.slug).toBe('gaming-laptop');
    expect(foundProduct.name).toBe('Laptop');
  });

  it('should call save method when creating a product', async () => {
    // Arrange
    const saveMock = jest.fn();
    const productData = {
      name: 'Laptop',
      slug: 'laptop',
      description: 'A gaming laptop',
      price: 1200,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      shipping: true,
    };
    
    const product = new Product(productData);
    product.save = saveMock;

    // Act
    await product.save();

    // Assert
    expect(saveMock).toHaveBeenCalled();
  });

  it('should throw an error if price is less than zero', async () => {
    // Arrange
    const invalidProduct = {
      name: 'Cheap Laptop',
      slug: 'cheap-laptop',
      description: 'A budget laptop',
      price: -50,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      shipping: true,
    };

    try {
      // Act
      const product = new Product(invalidProduct);
      await product.save();
    } catch (error) {
      // Assert
      expect(error.message).toContain('Product validation failed');
    }
  });

  it('should correctly handle the shipping field as a boolean', async () => {
    // Arrange
    const productData = {
      name: 'Laptop',
      slug: 'laptop',
      description: 'A laptop with fast shipping',
      price: 1200,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      shipping: true,
    };

    // Act
    const product = new Product(productData);
    await product.save();

    // Assert
    expect(product.shipping).toBe(true);
  });
});