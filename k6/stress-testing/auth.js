// Kaw Jun Rei Dylan, A0252791Y
// Stress test for authentication endpoints (login & signup)
// Tests system behavior under extreme load with rapid scaling
// These tests were generated with the help of GPT-5.3-CODEX
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060/api/v1/auth";
const REQUEST_TIMEOUT = "15s";

export const options = {
  gracefulStop: "5s",
  scenarios: {
    // Ramp to breaking point: gradually increase login load
    loginRampToBreak: {
      executor: "ramping-vus",
      stages: [
        { duration: "5s", target: 100 },
        { duration: "15s", target: 100 },
        { duration: "5s", target: 200 },
        { duration: "15s", target: 200 },
        { duration: "5s", target: 300 },
        { duration: "15s", target: 300 },
        { duration: "5s", target: 400 },
        { duration: "15s", target: 400 },
        { duration: "5s", target: 600 },
        { duration: "15s", target: 600 },
        { duration: "5s", target: 800 },
        { duration: "15s", target: 800 }, // hold at breaking point
        { duration: "10s", target: 0 },
      ],
      exec: "loginScenario",
    },
    // Sustained registration stress
    registerRampToBreak: {
      executor: "ramping-vus",
      startTime: "135s",
      stages: [
        { duration: "5s", target: 100 },
        { duration: "15s", target: 100 },
        { duration: "5s", target: 200 },
        { duration: "15s", target: 200 },
        { duration: "5s", target: 300 },
        { duration: "15s", target: 300 },
        { duration: "5s", target: 400 },
        { duration: "15s", target: 400 },
        { duration: "5s", target: 600 },
        { duration: "15s", target: 600 },
        { duration: "5s", target: 800 },
        { duration: "15s", target: 800 }, // hold at breaking point
        { duration: "10s", target: 0 },
      ],
      exec: "registerScenario",
    },
  },
  thresholds: {
    // Stress thresholds allow for degradation but not total failure
    "http_req_duration{scenario:loginRampToBreak}": [
      "p(95)<4000",
      "p(99)<6000",
    ],
    "http_req_duration{scenario:registerRampToBreak}": [
      "p(95)<5000",
      "p(99)<8000",
    ],
    http_req_failed: ["rate<0.15"], // expect significant failures at breaking point
  },
};

export function setup() {
  // Pre-create a test user for login stress
  const email = "stress_login@test.com";
  const password = "Stress@1234";

  http.post(
    `${BASE_URL}/register`,
    JSON.stringify({
      name: "Stress Login User",
      email,
      password,
      phone: "9999999999",
      address: "999 Stress Test Lane",
      answer: "stress",
    }),
    {
      headers: { "Content-Type": "application/json" },
      timeout: REQUEST_TIMEOUT,
    }
  );

  return { email, password };
}

// Login scenario: attempt repeated logins under various load conditions
export function loginScenario(data) {
  const res = http.post(
    `${BASE_URL}/login`,
    JSON.stringify({ email: data.email, password: data.password }),
    {
      headers: { "Content-Type": "application/json" },
      timeout: REQUEST_TIMEOUT,
    }
  );

  check(res, {
    "login: status 200": (r) => r.status === 200,
    "login: token present": (r) => {
      if (r.status !== 200 || !r.body) return false;
      try {
        const token = r.json("token");
        return typeof token === "string" && token.length > 0;
      } catch (_) {
        return false;
      }
    },
    "login: response time acceptable": (r) => r.timings.duration < 5000,
  });

  sleep(0.5);
}

// Registration scenario: rapid account creation
export function registerScenario() {
  const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;

  const res = http.post(
    `${BASE_URL}/register`,
    JSON.stringify({
      name: `stressuser_${uniqueId}`,
      email: `stressuser_${uniqueId}@test.com`,
      password: "Stress@1234",
      phone: "9999999999",
      address: "999 Stress Test Lane",
      answer: "stress",
    }),
    {
      headers: { "Content-Type": "application/json" },
      timeout: REQUEST_TIMEOUT,
    }
  );

  check(res, {
    "register: status is 201": (r) => r.status === 201,
    "register: success is true": (r) => {
      if (r.status !== 201 || !r.body) return false;
      try {
        return r.json("success") === true;
      } catch (_) {
        return false;
      }
    },
    "register: response time acceptable": (r) => r.timings.duration < 6000,
  });

  sleep(0.5);
}
