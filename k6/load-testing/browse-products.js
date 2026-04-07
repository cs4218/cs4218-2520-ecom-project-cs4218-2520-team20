import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060/api/v1";

export const options = {
  stages: [
    { duration: "10s", target: 15 }, // gradual ramp-up
    { duration: "10s", target: 30 }, // reach full load
    { duration: "40s", target: 30 }, // sustained browsing
    { duration: "10s", target: 0 },  // ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  // 1. Browse all categories (landing / navbar)
  const categoriesRes = http.get(`${BASE_URL}/category/get-category`);
  check(categoriesRes, {
    "categories: status 200": (r) => r.status === 200,
    "categories: has list": (r) => Array.isArray(r.json("category")),
  });

  sleep(1); // user scans the page

  // 2. Pick a category and browse its products
  const categories = categoriesRes.json("category");
  if (categories && categories.length > 0) {
    const cat = categories[Math.floor(Math.random() * categories.length)];

    const catDetailRes = http.get(
      `${BASE_URL}/category/single-category/${cat.slug}`
    );
    check(catDetailRes, {
      "single category: status 200": (r) => r.status === 200,
    });

    const catProductsRes = http.get(
      `${BASE_URL}/product/product-category/${cat.slug}`
    );
    check(catProductsRes, {
      "category products: status 200": (r) => r.status === 200,
      "category products: has list": (r) => Array.isArray(r.json("products")),
    });

    sleep(2); // user browses category products
  }

  // 3. View product listing (page 1) and total count in parallel
  const listingResponses = http.batch([
    ["GET", `${BASE_URL}/product/product-list/1`],
    ["GET", `${BASE_URL}/product/product-count`],
  ]);

  check(listingResponses[0], {
    "product list: status 200": (r) => r.status === 200,
    "product list: has products": (r) => Array.isArray(r.json("products")),
  });
  check(listingResponses[1], {
    "product count: status 200": (r) => r.status === 200,
  });

  sleep(1);

  // 4. Page through to page 2 (simulating "Load More")
  const page2Res = http.get(`${BASE_URL}/product/product-list/2`);
  check(page2Res, {
    "page 2: status 200": (r) => r.status === 200,
  });

  sleep(1);

  // 5. Click into a product detail
  const products = listingResponses[0].json("products");
  if (products && products.length > 0) {
    const product = products[Math.floor(Math.random() * products.length)];

    const detailRes = http.get(
      `${BASE_URL}/product/get-product/${product.slug}`
    );
    check(detailRes, {
      "product detail: status 200": (r) => r.status === 200,
      "product detail: has product": (r) => r.json("product") !== null,
    });

    sleep(2); // user reads product details

    // 6. Fetch related products
    if (product._id && product.category) {
      const categoryId =
        typeof product.category === "object"
          ? product.category._id
          : product.category;

      const relatedRes = http.get(
        `${BASE_URL}/product/related-product/${product._id}/${categoryId}`
      );
      check(relatedRes, {
        "related products: status 200": (r) => r.status === 200,
      });
    }
  }

  sleep(1); // think time before next browsing session
}
