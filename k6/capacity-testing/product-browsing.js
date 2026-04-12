// Alexander Setyawan, A0257149W

// run this first:
//      node <directory of this file>/schema/seed-db.js
// run test with this:
//      $env:K6_WEB_DASHBOARD_EXPORT="report-product-browsing.html"; k6 run product-browsing.js
// report-product-browsing.html will be generated in same directory
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const errorRate = new Rate("custom_error_rate");
const getAllProductsTrend = new Trend("get_all_products_duration");
const paginatedListTrend = new Trend("paginated_list_duration");
const productDetailTrend = new Trend("product_detail_duration");
const productCountTrend = new Trend("product_count_duration");

// --- Known product slugs from seed data ---
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
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    http_req_failed: ["rate<0.1"],
    custom_error_rate: ["rate<0.1"],
    get_all_products_duration: ["p(95)<2000"],
    paginated_list_duration: ["p(95)<1500"],
    product_detail_duration: ["p(95)<2000"],
    product_count_duration: ["p(95)<1500"],
  },
};

export default function () {
  // 1. GET all products
  group("GET all products", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { name: "GetAllProducts" },
    });
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "body has products array": (r) => {
        const body = r.json();
        return body && Array.isArray(body.products);
      },
    });
    errorRate.add(!success);
    getAllProductsTrend.add(res.timings.duration);
  });

  sleep(1);

  // 2. GET paginated product list (random page 1-3)
  group("GET paginated product list", function () {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(
      `${BASE_URL}/api/v1/product/product-list/${page}`,
      { tags: { name: "PaginatedList" } }
    );
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
    });
    errorRate.add(!success);
    paginatedListTrend.add(res.timings.duration);
  });

  sleep(1);

  // 3. GET single product detail (random slug)
  group("GET product detail", function () {
    const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const res = http.get(
      `${BASE_URL}/api/v1/product/get-product/${slug}`,
      { tags: { name: "ProductDetail" } }
    );
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "body has product name": (r) => {
        const body = r.json();
        return body && body.product && body.product.name;
      },
    });
    errorRate.add(!success);
    productDetailTrend.add(res.timings.duration);
  });

  sleep(1);

  // 4. GET product count
  group("GET product count", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/product-count`, {
      tags: { name: "ProductCount" },
    });
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "body has total": (r) => {
        const body = r.json();
        return body && typeof body.total === "number";
      },
    });
    errorRate.add(!success);
    productCountTrend.add(res.timings.duration);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "summary-product-browsing.html": htmlReport(data),
  };
}