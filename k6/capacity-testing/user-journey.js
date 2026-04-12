// Alexander Setyawan, A0257149W

// run this first:
//      node <directory of this file>/schema/seed-db.js
// run test with this:
//      $env:K6_WEB_DASHBOARD_EXPORT="report-user-journey.html"; k6 run user-journey.js
// report-user-journey.html will be generated in same directory
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const errorRate = new Rate("custom_error_rate");
const journeyDuration = new Trend("journey_duration");
const totalRequests = new Counter("total_requests");

// Per-endpoint trends for latency comparison
const categoryLatency = new Trend("endpoint_category_latency");
const productsLatency = new Trend("endpoint_products_latency");
const searchLatency = new Trend("endpoint_search_latency");
const detailLatency = new Trend("endpoint_detail_latency");
const loginLatency = new Trend("endpoint_login_latency");
const filterLatency = new Trend("endpoint_filter_latency");
const paginatedLatency = new Trend("endpoint_paginated_latency");

// --- Seed data ---
const TEST_EMAIL = "cs4218@test.com";
const TEST_PASSWORD = "cs4218@test.com";
const PRODUCT_SLUGS = ["laptop", "textbook", "smartphone", "novel", "nus-tshirt"];

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
    custom_error_rate: ["rate<0.1"],
    journey_duration: ["p(95)<20000"],
    http_req_duration: ["p(95)<1500"],
  },
};

export default function () {
  const journeyStart = Date.now();

  // Alternate between browsing and returning journey per iteration
  if (__ITER % 2 === 0) {
    browsingJourney();
  } else {
    returningJourney();
  }

  const journeyTime = Date.now() - journeyStart;
  journeyDuration.add(journeyTime);
  errorRate.add(journeyTime > 8000);
}

// --- Journey 1: New user browsing ---
function browsingJourney() {
  group("Browse categories", function () {
    const res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: { name: "categories" },
    });
    check(res, { "categories 200": (r) => r.status === 200 });
    categoryLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("View products", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { name: "products" },
    });
    check(res, { "products 200": (r) => r.status === 200 });
    productsLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Search", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/search/laptop`, {
      tags: { name: "search" },
    });
    check(res, { "search 200": (r) => r.status === 200 });
    searchLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Product detail", function () {
    const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const res = http.get(`${BASE_URL}/api/v1/product/get-product/${slug}`, {
      tags: { name: "detail" },
    });
    check(res, { "detail 200": (r) => r.status === 200 });
    detailLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Login", function () {
    const payload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "login" },
    });
    check(res, { "login 200": (r) => r.status === 200 });
    loginLatency.add(res.timings.duration);
    totalRequests.add(1);
  });
}

// --- Journey 2: Returning user ---
function returningJourney() {
  group("Login", function () {
    const payload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "login" },
    });
    check(res, { "login 200": (r) => r.status === 200 });
    loginLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Browse categories", function () {
    const res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: { name: "categories" },
    });
    check(res, { "categories 200": (r) => r.status === 200 });
    categoryLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Filter products", function () {
    const payload = JSON.stringify({ checked: [], radio: [0, 100] });
    const res = http.post(`${BASE_URL}/api/v1/product/product-filters`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "filter" },
    });
    check(res, { "filter 200": (r) => r.status === 200 });
    filterLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Paginated list", function () {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
      tags: { name: "paginated" },
    });
    check(res, { "paginated 200": (r) => r.status === 200 });
    paginatedLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Product detail", function () {
    const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const res = http.get(`${BASE_URL}/api/v1/product/get-product/${slug}`, {
      tags: { name: "detail" },
    });
    check(res, { "detail 200": (r) => r.status === 200 });
    detailLatency.add(res.timings.duration);
    totalRequests.add(1);
  });
}

export function handleSummary(data) {
  return {
    "summary-user-journey.html": htmlReport(data),
  };
}