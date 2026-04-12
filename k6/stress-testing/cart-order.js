// Kaw Jun Rei Dylan, A0252791Y
// Stress test for order creation: checkout & payment processing
// Tests system resilience under extreme transactional load
// These tests were generated with the help of GPT-5.3-CODEX
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060/api/v1";
const REQUEST_TIMEOUT = "15s";

export const options = {
  gracefulStop: "5s",
  scenarios: {
    // Ramp to breaking point: gradually increase transaction load
    checkoutRampToBreak: {
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
      exec: "checkoutFlow",
    },
    // Ramp to breaking point: gradually increase order queries
    orderQueryRampToBreak: {
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
      exec: "queryOrdersRepeatedly",
    },
  },
  thresholds: {
    "http_req_duration{scenario:checkoutRampToBreak}": [
      "p(95)<5000",
      "p(99)<12000",
    ],
    "http_req_duration{scenario:orderQueryRampToBreak}": [
      "p(95)<5000",
      "p(99)<12000",
    ],
    http_req_failed: ["rate<0.15"],
  },
};

export function setup() {
  // Pre-create a pool of authenticated users for order stress
  const users = [];

  for (let i = 0; i < 50; i++) {
    const id = `order_stress_${i}_${Date.now()}`;
    const registerRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        name: `orderuser_${id}`,
        email: `orderuser_${id}@test.com`,
        password: "Stress@1234",
        phone: "9999999999",
        address: "999 Stress Order Lane",
        answer: "stress",
      }),
      {
        headers: { "Content-Type": "application/json" },
        timeout: REQUEST_TIMEOUT,
      }
    );

    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: `orderuser_${id}@test.com`,
        password: "Stress@1234",
      }),
      {
        headers: { "Content-Type": "application/json" },
        timeout: REQUEST_TIMEOUT,
      }
    );

    const token = loginRes.json("token");
    if (token) {
      users.push({ token, email: `orderuser_${id}@test.com` });
    }
  }

  // Fetch available products
  const productsRes = http.get(`${BASE_URL}/product/product-list/1`, {
    timeout: REQUEST_TIMEOUT,
  });
  const products = productsRes.json("products") || [];

  return { users, products };
}

// Checkout Flow: full transaction from cart to order
export function checkoutFlow(data) {
  if (!data.users || data.users.length === 0) return;

  const user = data.users[__VU % data.users.length];
  const token = user.token;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Build cart
  const cart = [];
  if (data.products && data.products.length > 0) {
    const cartSize = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < cartSize && i < data.products.length; i++) {
      const p = data.products[Math.floor(Math.random() * data.products.length)];
      cart.push({
        _id: p._id,
        name: p.name,
        description: p.description,
        price: p.price,
      });
    }
  }

  // Request payment token
  const tokenRes = http.get(`${BASE_URL}/product/braintree/token`, {
    timeout: REQUEST_TIMEOUT,
  });
  check(tokenRes, {
    "braintree token: status 200": (r) => r.status === 200,
  });

  sleep(0.5);

  // Submit payment
  const paymentRes = http.post(
    `${BASE_URL}/product/braintree/payment`,
    JSON.stringify({ nonce: "fake-valid-nonce", cart }),
    { headers: authHeaders, timeout: REQUEST_TIMEOUT }
  );

  check(paymentRes, {
    "payment submitted": (r) => r.status !== 0,
    "payment not 500": (r) => r.status !== 500,
  });

  sleep(0.3);

  // Check order confirmation
  const ordersRes = http.get(`${BASE_URL}/auth/orders`, {
    headers: authHeaders,
    timeout: REQUEST_TIMEOUT,
  });

  check(ordersRes, {
    "orders retrieved: status 200": (r) => r.status === 200,
  });

  sleep(0.2);
}

// Query Orders: retrieve user orders repeatedly under load
export function queryOrdersRepeatedly(data) {
  if (!data.users || data.users.length === 0) return;

  const user = data.users[__VU % data.users.length];
  const token = user.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // Fetch orders multiple times (simulating order history page loads)
  for (let i = 0; i < 3; i++) {
    const res = http.get(`${BASE_URL}/auth/orders`, {
      headers: authHeaders,
      timeout: REQUEST_TIMEOUT,
    });

    check(res, {
      "orders query: status 200": (r) => r.status === 200,
    });

    sleep(0.1);
  }
}
