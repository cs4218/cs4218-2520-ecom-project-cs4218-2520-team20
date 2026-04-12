// Alexander Setyawan, A0257149W

// run this first:
//      node <directory of this file>/schema/seed-db.js
// run test with this:
//      $env:K6_WEB_DASHBOARD_EXPORT="report-search-filter.html"; k6 run search-filter.js
// report-search-filter.html will be generated in same directory
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const errorRate = new Rate("custom_error_rate");
const searchTrend = new Trend("search_duration");
const filterTrend = new Trend("filter_duration");
const categoryProductsTrend = new Trend("category_products_duration");
const relatedProductsTrend = new Trend("related_products_duration");

// --- Seed data ---
const SEARCH_KEYWORDS = ["laptop", "phone", "book", "shirt", "camera"];
const CATEGORY_SLUGS = ["electronics", "book", "clothing"];

// Known product + category ID pairs for related-product endpoint
const PRODUCT_CATEGORY_PAIRS = [
  { pid: "66db427fdb0119d9234b27f3", cid: "66db427fdb0119d9234b27ed" }, // laptop, electronics
  { pid: "66db427fdb0119d9234b27f1", cid: "66db427fdb0119d9234b27ef" }, // textbook, book
  { pid: "67a21772a6d9e00ef2ac022a", cid: "66db427fdb0119d9234b27ee" }, // nus-tshirt, clothing
  { pid: "66db427fdb0119d9234b27f5", cid: "66db427fdb0119d9234b27ed" }, // smartphone, electronics
  { pid: "66db427fdb0119d9234b27f9", cid: "66db427fdb0119d9234b27ef" }, // novel, book
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
    search_duration: ["p(95)<1000"],
    filter_duration: ["p(95)<3000"],
    category_products_duration: ["p(95)<4000"],
    related_products_duration: ["p(95)<1000"],
  },
};

export default function () {
  // 1. Search products with random keyword
  group("Search products", function () {
    const keyword =
      SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
    const res = http.get(
      `${BASE_URL}/api/v1/product/search/${keyword}`,
      { tags: { name: "SearchProducts" } }
    );
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "search returns array": (r) => {
        const body = r.json();
        return body && Array.isArray(body);
      },
    });
    errorRate.add(!success);
    searchTrend.add(res.timings.duration);
  });

  sleep(1);

  // 2. Filter products by price range
  group("Filter products", function () {
    const payload = JSON.stringify({ checked: [], radio: [0, 100] });
    const res = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "FilterProducts" },
      }
    );
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "filter returns products": (r) => {
        const body = r.json();
        return body && Array.isArray(body.products);
      },
    });
    errorRate.add(!success);
    filterTrend.add(res.timings.duration);
  });

  sleep(1);

  // 3. Category-wise product listing
  group("Category products", function () {
    const slug =
      CATEGORY_SLUGS[Math.floor(Math.random() * CATEGORY_SLUGS.length)];
    const res = http.get(
      `${BASE_URL}/api/v1/product/product-category/${slug}`,
      { tags: { name: "CategoryProducts" } }
    );
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
    });
    errorRate.add(!success);
    categoryProductsTrend.add(res.timings.duration);
  });

  sleep(1);

  // 4. Related products
  group("Related products", function () {
    const pair =
      PRODUCT_CATEGORY_PAIRS[
        Math.floor(Math.random() * PRODUCT_CATEGORY_PAIRS.length)
      ];
    const res = http.get(
      `${BASE_URL}/api/v1/product/related-product/${pair.pid}/${pair.cid}`,
      { tags: { name: "RelatedProducts" } }
    );
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "returns products array": (r) => {
        const body = r.json();
        return body && Array.isArray(body.products);
      },
    });
    errorRate.add(!success);
    relatedProductsTrend.add(res.timings.duration);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "summary-search-filter.html": htmlReport(data),
  };
}