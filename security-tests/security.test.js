import request from "supertest";
import express from "express";
import authRoutes, { authLimiter } from "../routes/authRoute"; 
import userModel from "../models/userModel";

jest.mock("../models/userModel");

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

describe("Security Testing (Non-Functional Requirements)", () => {

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(async () => {
    console.log.mockRestore();
  });


  it("should sanitize malicious NoSQL operators from login inputs", async () => {
    const maliciousPayload = {
      email: { "$ne": null },
      password: { "$gt": "" }
    };

    const response = await request(app).post("/api/v1/auth/login").send(maliciousPayload);

    expect(response.status).toBe(400); 
    expect(response.body.message).toMatch(/Invalid input format/i);
  });

  it("should sanitize malicious NoSQL operators from forgot-password inputs", async () => {
    const maliciousPayload = {
      email: { "$ne": null },
      answer: { "$gt": "" },
      newPassword: { "$gt": "" }
    };
    const response = await request(app).post("/api/v1/auth/forgot-password").send(maliciousPayload);
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Invalid input format/i);
  });

  it("should reject or sanitize cross-site scripting (XSS) payloads in registration fields", async () => {
    const xssPayload = {
      name: "<script>alert('XSS Attack')</script>BadGuy",
      email: "hacker@example.com",
      password: "password123",
      phone: "123456789",
      address: "123 Street",
      answer: "Football"
    };

    userModel.findOne.mockResolvedValue(null);
    userModel.prototype.save = jest.fn().mockResolvedValue({ _id: "123" });

    const response = await request(app).post("/api/v1/auth/register").send(xssPayload);
    const responseString = JSON.stringify(response.body);

    // The raw script tag should NOT be reflected back or saved
    expect(responseString).not.toContain("<script>");
  });

  it("should enforce strong password policy on the backend to prevent client-side bypass", async () => {
    // Attacker bypasses frontend React checks and hits API directly with a 5-char password
    const weakPasswordPayload = {
      name: "John Doe",
      email: "john@example.com",
      password: "12345", 
      phone: "12345678",
      address: "123 Street",
      answer: "Football"
    };

    const response = await request(app).post("/api/v1/auth/register").send(weakPasswordPayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/too weak/i);
  });

  it("should prevent HTTP Parameter Pollution (HPP) in the forgot password flow", async () => {
    // Attacker sends an array of emails instead of a single string
    const hppPayload = {
      email: ["admin@example.com", "victim@example.com"],
      answer: "Football",
      newPassword: "HackedPassword123#"
    };

    const response = await request(app).post("/api/v1/auth/forgot-password").send(hppPayload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should block excessive login attempts to prevent brute-force attacks", async () => {
    const loginPayload = { email: "john@example.com", password: "wrongpassword" };
    
    let finalStatus;
    // Simulate an attacker firing 15 rapid login requests
    for (let i = 0; i < 15; i++) {
      const response = await request(app).post("/api/v1/auth/login").send(loginPayload);
      finalStatus = response.status;
    }

    expect(finalStatus).toBe(429);
  });

  it("should block forgot password attempts to prevent brute-force attacks", async () => {
    const forgotPasswordPayload = { email: "john@example.com", answer: "football", newPassword: "newPassword123" };
    
    let finalStatus;
    // Simulate an attacker firing 15 rapid forgot password requests
    for (let i = 0; i < 15; i++) {
      const response = await request(app).post("/api/v1/auth/forgot-password").send(forgotPasswordPayload);
      finalStatus = response.status;
    }

    expect(finalStatus).toBe(429);
  });
});