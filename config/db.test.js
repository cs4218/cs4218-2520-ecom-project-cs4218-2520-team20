import mongoose from "mongoose";
import connectDB from "./db";

jest.mock("mongoose");

describe("connectDB", () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should call mongoose.connect only once", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    mongoose.connect.mockResolvedValue({ connection: { host: "localhost" } });

    // Act
    await connectDB();

    // Assert
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it("should successfully connect to MongoDB and log the connection host", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    mongoose.connect.mockResolvedValue({ connection: { host: "localhost" } });

    // Act
    await connectDB();

    // Assert
    expect(console.log).toHaveBeenCalledWith(
      "Connected To Mongodb Database localhost".bgMagenta.white
    );
  });

  it("should log an error message when the connection to MongoDB fails", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    const errorMessage = "Failed to connect";
    mongoose.connect.mockRejectedValue(new Error(errorMessage));

    // Act
    await connectDB();

    // Assert
    expect(console.log).toHaveBeenCalledWith(
      `Error in Mongodb Error: ${errorMessage}`.bgRed.white
    );
  });

  it("should call mongoose.connect with the correct MONGO_URL", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    mongoose.connect.mockResolvedValue({ connection: { host: "localhost" } });

    // Act
    await connectDB();

    // Assert
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
  });

  it("should log an error message when mongoose.connect throws an error without a message", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    mongoose.connect.mockRejectedValue(new Error());

    // Act
    await connectDB();

    // Assert
    expect(console.log).toHaveBeenCalledWith(
      "Error in Mongodb Error".bgRed.white
    );
  });

  it("should call console.log exactly once on successful connection", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    mongoose.connect.mockResolvedValue({ connection: { host: "localhost" } });

    // Act
    await connectDB();

    // Assert
    expect(console.log).toHaveBeenCalledTimes(1);
  });
});