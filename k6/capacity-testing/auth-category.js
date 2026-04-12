// Alexander Setyawan, A0257149W

// run this first:
//      node <directory of this file>/schema/seed-db.js
// run test with this:
//      $env:K6_WEB_DASHBOARD_EXPORT="report-auth-category.html"; k6 run auth-category.js
// report-auth-category.html will be generated in same directory
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const errorRate = new Rate("custom_error_rate");
const loginTrend = new Trend("login_duration");
const getAllCategoriesTrend = new Trend("get_all_categories_duration");
const singleCategoryTrend = new Trend("single_category_duration");
const registerTrend = new Trend("register_duration");

// --- Seed data ---
const TEST_EMAIL = "cs4218@test.com";
const TEST_PASSWORD = "cs4218@test.com";
const CATEGORY_SLUGS = ["electronics", "book", "clothing"];

// --- k6 options ---
export const options = {
  stages: [
    { duration: '30s', target: 5 }, 
    { duration: '30s', target: 10 },
    { duration: '30s', target: 15 },
    { duration: '60s', target: 15 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    custom_error_rate: ["rate<0.01"],
    login_duration: ["p(95)<2000"],
    get_all_categories_duration: ["p(95)<2000"],
    single_category_duration: ["p(95)<2000"],
    register_duration: ["p(95)<2000"],
  },
};

export default function () {
  // 1. Login with test credentials (bcrypt is CPU-heavy)
  group("Login", function () {
    const payload = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "Login" },
    });
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "login returns token": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && body.token;
      },
    });
    errorRate.add(!success);
    loginTrend.add(res.timings.duration);
  });

  sleep(1);

  // 2. GET all categories (called on every page load via Header)
  group("Get all categories", function () {
    const res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: { name: "GetAllCategories" },
    });
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "returns categories array": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && Array.isArray(body.category);
      },
    });
    errorRate.add(!success);
    getAllCategoriesTrend.add(res.timings.duration);
  });

  sleep(1);

  // 3. GET single category by slug
  group("Get single category", function () {
    const slug =
      CATEGORY_SLUGS[Math.floor(Math.random() * CATEGORY_SLUGS.length)];
    const res = http.get(
      `${BASE_URL}/api/v1/category/single-category/${slug}`,
      { tags: { name: "SingleCategory" } }
    );
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "returns category data": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && body.category && body.category.name;
      },
    });
    errorRate.add(!success);
    singleCategoryTrend.add(res.timings.duration);
  });

  sleep(1);

  // 4. Register with unique email per VU + iteration
  group("Register", function () {
    const uniqueEmail = `loadtest_vu${__VU}_iter${__ITER}@test.com`;
    const payload = JSON.stringify({
      name: `LoadTest User ${__VU}`,
      email: uniqueEmail,
      password: "loadtest123",
      phone: "91234567",
      address: "1 Test Street",
      answer: "load test",
    });
    const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "Register" },
    });
    const success = check(res, {
      "status is 200 or 201": (r) => r.status === 200 || r.status === 201,
      "no 500 error": (r) => r.status !== 500,
    });
    errorRate.add(!success);
    registerTrend.add(res.timings.duration);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "summary-auth-category.html": htmlReport(data),
  };
}