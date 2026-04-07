import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060/api/v1";

// Transactional flow: 20 concurrent users checking out simultaneously
// Lower than browsing (30) because only a fraction of browsers convert to buyers
export const options = {
  stages: [
    { duration: "10s", target: 10 }, // ramp-up
    { duration: "10s", target: 20 }, // reach peak
    { duration: "40s", target: 20 }, // sustained checkout pressure
    { duration: "10s", target: 0 },  // ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<4000"],
    http_req_failed: ["rate<0.15"], // higher tolerance — payment gateway may reject test nonces
  },
};

export function setup() {
  // Register and login a pool of test users upfront
  const users = [];
  for (let i = 0; i < 20; i++) {
    const id = `cart_${i}_${Date.now()}`;
    http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        name: `cartuser_${id}`,
        email: `cartuser_${id}@test.com`,
        password: "Test@1234",
        phone: "1234567890",
        address: "123 Test Street",
        answer: "test",
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: `cartuser_${id}@test.com`,
        password: "Test@1234",
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    const token = loginRes.json("token");
    if (token) users.push(token);
  }

  // Fetch available products to build a realistic cart
  const productsRes = http.get(`${BASE_URL}/product/get-product`);
  const products = productsRes.json("products") || [];

  return { users, products };
}

export default function (data) {
  const token = data.users[__VU % data.users.length];
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Build a cart of 1-3 random products (simulating real user behaviour)
  const cartSize = Math.floor(Math.random() * 3) + 1;
  const cart = [];
  for (let i = 0; i < cartSize && i < data.products.length; i++) {
    const p = data.products[Math.floor(Math.random() * data.products.length)];
    cart.push({ _id: p._id, name: p.name, description: p.description, price: p.price });
  }

  // 1. Request Braintree payment token (every checkout session starts here)
  const tokenRes = http.get(`${BASE_URL}/product/braintree/token`);
  check(tokenRes, {
    "braintree token: status 200": (r) => r.status === 200,
  });

  sleep(2); // user fills in payment details

  // 2. Submit checkout (payment + order creation)
  //    Uses "fake-valid-nonce" — Braintree sandbox test nonce
  const paymentRes = http.post(
    `${BASE_URL}/product/braintree/payment`,
    JSON.stringify({ nonce: "fake-valid-nonce", cart }),
    { headers: authHeaders }
  );

  check(paymentRes, {
    "checkout: server responded": (r) => r.status !== 0,
    "checkout: not 500": (r) => r.status !== 500,
  });

  sleep(1);

  // 3. Fetch user's orders (post-checkout confirmation page)
  const ordersRes = http.get(`${BASE_URL}/auth/orders`, {
    headers: authHeaders,
  });

  check(ordersRes, {
    "orders: status 200": (r) => r.status === 200,
  });

  sleep(1);
}
