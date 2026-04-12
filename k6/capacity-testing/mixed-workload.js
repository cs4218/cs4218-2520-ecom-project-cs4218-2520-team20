// Alexander Setyawan, A0257149W

// run this first:
//      node <directory of this file>/schema/seed-db.js
// run test with this:
//      $env:K6_WEB_DASHBOARD_EXPORT="report-mixed-workload.html"; k6 run mixed-workload.js
// report-mixed-workload.html will be generated in same directory
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const errorRate = new Rate("custom_error_rate");
const readTrend = new Trend("read_duration");
const writeTrend = new Trend("write_duration");
const page1Trend = new Trend("page1_duration");
const page2Trend = new Trend("page2_duration");
const page3Trend = new Trend("page3_duration");
const totalRequests = new Counter("total_requests");

// --- Seed data ---
const TEST_EMAIL = "cs4218@test.com";
const TEST_PASSWORD = "cs4218@test.com";
const SEARCH_KEYWORDS = ["laptop", "phone", "book", "shirt", "camera"];
const CATEGORY_SLUGS = ["electronics", "book", "clothing"];
const PRODUCT_IDS = [
  "66db427fdb0119d9234b27f3", // laptop
  "66db427fdb0119d9234b27f1", // textbook
  "66db427fdb0119d9234b27f5", // smartphone
  "66db427fdb0119d9234b27f9", // novel
  "67a21772a6d9e00ef2ac022a", // nus-tshirt
];

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
    read_duration: ["p(95)<1500"],
    write_duration: ["p(95)<3000"],
    page1_duration: ["p(95)<1500"],
    page2_duration: ["p(95)<1500"],
    page3_duration: ["p(95)<1500"],
  },
};

// --- Helper: pick a random read operation ---
function doReadOperation() {
  const ops = ["getProducts", "getCategories", "search"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let res;
  switch (op) {
    case "getProducts":
      res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
        tags: { name: "ReadProducts" },
      });
      break;
    case "getCategories":
      res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
        tags: { name: "ReadCategories" },
      });
      break;
    case "search": {
      const kw =
        SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
      res = http.get(`${BASE_URL}/api/v1/product/search/${kw}`, {
        tags: { name: "ReadSearch" },
      });
      break;
    }
  }

  const success = check(res, {
    "read status 200": (r) => r.status === 200,
  });
  errorRate.add(!success);
  readTrend.add(res.timings.duration);
  totalRequests.add(1);
}

// --- Helper: pick a random write operation ---
function doWriteOperation() {
  const ops = ["login", "filter"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let res;
  switch (op) {
    case "login":
      res = http.post(
        `${BASE_URL}/api/v1/auth/login`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        {
          headers: { "Content-Type": "application/json" },
          tags: { name: "WriteLogin" },
        }
      );
      break;
    case "filter":
      res = http.post(
        `${BASE_URL}/api/v1/product/product-filters`,
        JSON.stringify({ checked: [], radio: [0, 100] }),
        {
          headers: { "Content-Type": "application/json" },
          tags: { name: "WriteFilter" },
        }
      );
      break;
  }

  const success = check(res, {
    "write status 200": (r) => r.status === 200,
  });
  errorRate.add(!success);
  writeTrend.add(res.timings.duration);
  totalRequests.add(1);
}

export default function () {
  // --- Scenario 1: Mixed read/write (80/20 split) ---
  group("Mixed read-write", function () {
    if (Math.random() < 0.8) {
      doReadOperation();
    } else {
      doWriteOperation();
    }
  });

  sleep(0.5);

  // --- Scenario 2: Additional read operation (product detail) ---
  group("Product detail", function () {
    const pid = PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
    const res = http.get(
      `${BASE_URL}/api/v1/product/product-count`,
      { tags: { name: "ProductCount" } }
    );
    const success = check(res, {
      "count status 200": (r) => r.status === 200,
    });
    errorRate.add(!success);
    totalRequests.add(1);
  });

  sleep(0.5);

  // --- Scenario 3: Paginated page cycling ---
  group("Paginated pages", function () {
    for (let page = 1; page <= 3; page++) {
      const res = http.get(
        `${BASE_URL}/api/v1/product/product-list/${page}`,
        { tags: { name: `Page${page}` } }
      );
      const success = check(res, {
        [`page ${page} status 200`]: (r) => r.status === 200,
      });
      errorRate.add(!success);
      totalRequests.add(1);

      if (page === 1) page1Trend.add(res.timings.duration);
      if (page === 2) page2Trend.add(res.timings.duration);
      if (page === 3) page3Trend.add(res.timings.duration);
    }
  });

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    "summary-mixed-workload.html": htmlReport(data),
  };
}