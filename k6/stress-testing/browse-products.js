// Kaw Jun Rei Dylan, A0252791Y
// Stress test for product browsing: home page & filtering
// Tests system stability under extreme concurrent viewing load
// These tests were generated with the help of GPT-5.3-CODEX
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060/api/v1";
const REQUEST_TIMEOUT = "15s";

export const options = {
  gracefulStop: "5s",
  scenarios: {
    // Ramp to breaking point: gradually increase browsing load
    browsingRampToBreak: {
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
      exec: "browseHomeAndProducts",
    },
    // Ramp to breaking point: gradual increase in filtering
    filteringRampToBreak: {
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
      exec: "filterProducts",
    },
  },
  thresholds: {
    "http_req_duration{scenario:browsingRampToBreak}": [
      "p(95)<4000",
      "p(99)<10000",
    ],
    "http_req_duration{scenario:filteringRampToBreak}": [
      "p(95)<5000",
      "p(99)<10000",
    ],
    http_req_failed: ["rate<0.15"],
  },
};

// Scenario 1: Browse home page + category + product listing
export function browseHomeAndProducts() {
  // Fetch all categories
  const categoriesRes = http.get(`${BASE_URL}/category/get-category`, {
    timeout: REQUEST_TIMEOUT,
  });
  check(categoriesRes, {
    "categories: status 200": (r) => r.status === 200,
    "categories: has list": (r) => Array.isArray(r.json("category")),
  });

  sleep(0.3);

  // View a random category
  const categories = categoriesRes.json("category");
  if (categories && categories.length > 0) {
    const cat = categories[Math.floor(Math.random() * categories.length)];

    const catRes = http.get(
      `${BASE_URL}/category/single-category/${cat.slug}`,
      {
        timeout: REQUEST_TIMEOUT,
      }
    );
    check(catRes, {
      "single category: status 200": (r) => r.status === 200,
    });

    sleep(0.2);
  }

  // Product listing (page 1-3)
  for (let page = 1; page <= 3; page++) {
    const listRes = http.get(`${BASE_URL}/product/product-list/${page}`, {
      timeout: REQUEST_TIMEOUT,
    });
    check(listRes, {
      [`product list page ${page}: status 200`]: (r) => r.status === 200,
    });

    sleep(0.2);
  }

  // Fetch product count
  const countRes = http.get(`${BASE_URL}/product/product-count`, {
    timeout: REQUEST_TIMEOUT,
  });
  check(countRes, {
    "product count: status 200": (r) => r.status === 200,
  });

  sleep(0.2);
}

// Scenario 2: Filtering with different parameters
export function filterProducts() {
  const filterParams = [
    "?sort=-createdAt",
    "?sort=price",
    "?sort=-price",
    "?limit=20",
    "?limit=50",
  ];

  const filter = filterParams[Math.floor(Math.random() * filterParams.length)];

  // List with filter
  const listRes = http.get(`${BASE_URL}/product/product-list/1${filter}`, {
    timeout: REQUEST_TIMEOUT,
  });
  check(listRes, {
    "filtered list: status 200": (r) => r.status === 200,
    "filtered list: has products": (r) => Array.isArray(r.json("products")),
  });

  sleep(0.3);

  // Get product count for filtered results
  const countRes = http.get(`${BASE_URL}/product/product-count`, {
    timeout: REQUEST_TIMEOUT,
  });
  check(countRes, {
    "count: status 200": (r) => r.status === 200,
  });

  sleep(0.2);

  // Get a random category and its products
  const categoriesRes = http.get(`${BASE_URL}/category/get-category`, {
    timeout: REQUEST_TIMEOUT,
  });
  const categories = categoriesRes.json("category");
  if (categories && categories.length > 0) {
    const cat = categories[Math.floor(Math.random() * categories.length)];

    http.get(`${BASE_URL}/product/product-category/${cat.slug}`, {
      timeout: REQUEST_TIMEOUT,
    });
  }
}
