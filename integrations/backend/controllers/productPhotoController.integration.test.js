import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { productPhotoController } from "../../../controllers/productController.js";

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});

const createReq = () => ({
  params: {},
});

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
});

describe("productPhotoController (Integration)", () => {
  let req;
  let res;
  let category;

  beforeEach(async () => {
    req = createReq();
    res = createRes();

    category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
  });

  // ✅ 2. Sets correct content type
  test("sets correct Content-type header", async () => {
    const product = await productModel.create({
      name: "Phone",
      slug: "phone",
      description: "Smartphone",
      price: 1000,
      category: category._id,
      quantity: 5,
      photo: {
        data: Buffer.from("abc"),
        contentType: "image/jpeg",
      },
    });

    req.params.pid = product._id.toString();

    await productPhotoController(req, res);

    expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
  });

  // ✅ 3. Returns status 200 when photo exists
  test("returns status 200 when photo is found", async () => {
    const product = await productModel.create({
      name: "Tablet",
      slug: "tablet",
      description: "Android tablet",
      price: 300,
      category: category._id,
      quantity: 3,
      photo: {
        data: Buffer.from("abc"),
        contentType: "image/png",
      },
    });

    req.params.pid = product._id.toString();

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ✅ 4. Does not return anything if photo.data is null
  test("does not send response when photo data is null", async () => {
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "Gaming laptop",
      price: 2000,
      category: category._id,
      quantity: 1,
      photo: {
        data: null,
        contentType: "image/png",
      },
    });

    req.params.pid = product._id.toString();

    await productPhotoController(req, res);

    expect(res.send).not.toHaveBeenCalled();
  });

  // ✅ 5. Does not set header if no photo data
  test("does not set Content-type when photo is missing", async () => {
    const product = await productModel.create({
      name: "Watch",
      slug: "watch",
      description: "Smartwatch",
      price: 250,
      category: category._id,
      quantity: 4,
      photo: {
        data: null,
        contentType: "image/png",
      },
    });

    req.params.pid = product._id.toString();

    await productPhotoController(req, res);

    expect(res.set).not.toHaveBeenCalled();
  });

  // ✅ 6. Handles product with no photo field
  test("handles product without photo field", async () => {
    const product = await productModel.create({
      name: "Speaker",
      slug: "speaker",
      description: "Bluetooth speaker",
      price: 150,
      category: category._id,
      quantity: 6,
    });

    req.params.pid = product._id.toString();

    await productPhotoController(req, res);

    expect(res.send).not.toHaveBeenCalled();
  });

  // ✅ 7. Handles invalid product id format
  test("handles invalid product id format", async () => {
    req.params.pid = "invalid-id";

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalled();
  });

  // ✅ 8. Returns exact binary data (integrity check)
  test("returns exact buffer data without modification", async () => {
    const buffer = Buffer.from("exact-binary");

    const product = await productModel.create({
      name: "Headphones",
      slug: "headphones",
      description: "Audio device",
      price: 100,
      category: category._id,
      quantity: 10,
      photo: {
        data: buffer,
        contentType: "image/png",
      },
    });

    req.params.pid = product._id.toString();

    await productPhotoController(req, res);

    const sentBuffer = res.send.mock.calls[0][0];

    expect(sentBuffer.equals(buffer)).toBe(true);
  });

  // ✅ 9. Only photo field is queried (implicit behavior check)
  test("still works when product has many fields", async () => {
    const product = await productModel.create({
      name: "Drone",
      slug: "drone",
      description: "Flying device",
      price: 800,
      category: category._id,
      quantity: 2,
      shipping: true,
      photo: {
        data: Buffer.from("drone-img"),
        contentType: "image/png",
      },
    });

    req.params.pid = product._id.toString();

    await productPhotoController(req, res);

    expect(res.send).toHaveBeenCalled();
  });
});