import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060/api/v1/auth";

export const options = {
  scenarios: {
    // Heavy login traffic — most users are returning users
    login: {
      executor: "ramping-vus",
      stages: [
        { duration: "15s", target: 25 },
        { duration: "15s", target: 50 },
        { duration: "30s", target: 50 },
        { duration: "10s", target: 0 },
      ],
      exec: "loginScenario",
    },
    // Light registration traffic — fewer new signups
    register: {
      executor: "constant-vus",
      vus: 5,
      duration: "60s",
      exec: "registerScenario",
    },
  },
  thresholds: {
    "http_req_duration{scenario:login}": ["p(95)<1000", "p(99)<2000"],    // login should be fast
    "http_req_duration{scenario:register}": ["p(95)<2000", "p(99)<4000"], // register involves hashing
    http_req_failed: ["rate<0.10"],
  },
};

// Pre-create a test user for the login scenario
export function setup() {
  const email = "loadtest_login@test.com";
  const password = "Test@1234";

  http.post(
    `${BASE_URL}/register`,
    JSON.stringify({
      name: "Load Test User",
      email,
      password,
      phone: "1234567890",
      address: "123 Test Street",
      answer: "test",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  return { email, password };
}

// --- Login scenario: 50 VUs hammering the login endpoint ---
export function loginScenario(data) {
  const res = http.post(
    `${BASE_URL}/login`,
    JSON.stringify({ email: data.email, password: data.password }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { scenario: "login" },
    }
  );

  check(res, {
    "login: status is 200": (r) => r.status === 200,
    "login: token present": (r) => r.json("token") !== "",
  });

  sleep(1);
}

// --- Register scenario: 5 VUs creating new accounts ---
export function registerScenario() {
  const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;

  const res = http.post(
    `${BASE_URL}/register`,
    JSON.stringify({
      name: `user_${uniqueId}`,
      email: `user_${uniqueId}@test.com`,
      password: "Test@1234",
      phone: "1234567890",
      address: "123 Test Street",
      answer: "test",
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { scenario: "register" },
    }
  );

  check(res, {
    "register: status is 201": (r) => r.status === 201,
    "register: success is true": (r) => r.json("success") === true,
  });

  sleep(1);
}
