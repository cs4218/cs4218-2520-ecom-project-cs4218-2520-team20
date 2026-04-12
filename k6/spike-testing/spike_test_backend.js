/**
 * Wang Zhi Wren, A0255368U
 * Spike Test - API Simulated Full Workflow
 * 
 * Assuming a baseline load of 20-30 users, this spike will test a sudden surge
 * to 100 users. Spike will be simulated on the backend based on the proposed user flows:
 * 
 * - Existing User - Standard User - No Purchase -------------------- 70% * 80% * 70% = 39.2% ~~ 39%
 *   Login Route > Homepage API calls > Product Details Page > END
 * - Existing User - Standard User - Purchase ----------------------- 70% * 80% * 30% = 16.8% ~~ 17%
 *   Login Route > Homepage API calls > Product Details Page > Perform Purchase - Braintree > Fetch Orders > END
 * - Existing User - Impulse Buyer ---------------------------------- 70% * 20% * ALL = 14%   ~~ 14%
 *   Login Route > Homepage API calls > Perform Purchase - Braintree > Fetch Orders > END
 * - New User - Standard User - No Purchase ------------------------- 30% * 80% * 70% = 16.8% ~~ 17%
 *   Register Route > Login Route > Homepage API calls > Product Details Page > END
 * - New User - Standard User - Purchase ---------------------------- 30% * 80% * 30% = 7.2%  ~~ 7%
 *   Register Route > Login Route > Homepage API calls > Product Details Page > Perform Purchase - Braintree > Fetch Orders > END
 * - New User - Impulse Buyer --------------------------------------- 30% * 20% * ALL = 6%    ~~ 6%
 *   Register Route > Login Route > Homepage API calls > Perform Purchase - Braintree > Fetch Orders > END
 * 
 * K6_WEB_DASHBOARD_PERIOD=1s K6_WEB_DASHBOARD=true k6 run --out influxdb=http://localhost:8086/myk6db k6/spike-testing/spike_test_backend.js
 */
import { check, sleep, fail } from "k6";
import exec from "k6/execution";
import http from "k6/http";

const SPIKE_TEST_PASSWORD = 'abc123'
const TEST_TYPE = 'SPIKETEST'
const BASE_URL       = "http://localhost:6060/api/v1";
const INIT_TIME_____ = "20s"
const PRESPIKE_TIME_ = "1m"
const RAMPUP_TIME___ = "2m"
const SUSTAIN_SPIKE_ = "3m"
const COOLDOWN_TIME_ = "2m"
const POSTSPIKE_TIME = "1m"
const SHUTDOWN_TIME_ = "10s"

export const options = {
  scenarios: {
    existing_standard_browsing: {
      executor: "ramping-vus",
      stages: [
        { duration: INIT_TIME_____, target: 19 },
        { duration: PRESPIKE_TIME_, target: 19 },
        { duration: RAMPUP_TIME___, target: 39 },
        { duration: SUSTAIN_SPIKE_, target: 39 },
        { duration: COOLDOWN_TIME_, target: 19 },
        { duration: POSTSPIKE_TIME, target: 19 },
        { duration: SHUTDOWN_TIME_, target: 0 },
      ],
      exec: "exec_login_details_browse",
    },
    existing_standard_buyer: {
      executor: "ramping-vus",
      stages: [
        { duration: INIT_TIME_____, target: 0 },
        { duration: PRESPIKE_TIME_, target: 0 },
        { duration: RAMPUP_TIME___, target: 17 },
        { duration: SUSTAIN_SPIKE_, target: 17 },
        { duration: COOLDOWN_TIME_, target: 0 },
        { duration: POSTSPIKE_TIME, target: 0 },
        { duration: SHUTDOWN_TIME_, target: 0 },
      ],
      exec: "exec_login_details_buy",
    },
    existing_impulse: {
      executor: "ramping-vus",
      stages: [
        { duration: INIT_TIME_____, target: 0 },
        { duration: PRESPIKE_TIME_, target: 0 },
        { duration: RAMPUP_TIME___, target: 14 },
        { duration: SUSTAIN_SPIKE_, target: 14 },
        { duration: COOLDOWN_TIME_, target: 0 },
        { duration: POSTSPIKE_TIME, target: 0 },
        { duration: SHUTDOWN_TIME_, target: 0 },
      ],
      exec: "exec_login_impulse",
    },
    new_standard_browsing: {
      executor: "ramping-vus",
      stages: [
        { duration: INIT_TIME_____, target: 1 },
        { duration: PRESPIKE_TIME_, target: 1 },
        { duration: RAMPUP_TIME___, target: 17 },
        { duration: SUSTAIN_SPIKE_, target: 17 },
        { duration: COOLDOWN_TIME_, target: 1 },
        { duration: POSTSPIKE_TIME, target: 1 },
        { duration: SHUTDOWN_TIME_, target: 0 },
      ],
      exec: "exec_register_details_browse",
    },
    new_standard_buyer: {
      executor: "ramping-vus",
      stages: [
        { duration: INIT_TIME_____, target: 0 },
        { duration: PRESPIKE_TIME_, target: 0 },
        { duration: RAMPUP_TIME___, target: 7 },
        { duration: SUSTAIN_SPIKE_, target: 7 },
        { duration: COOLDOWN_TIME_, target: 0 },
        { duration: POSTSPIKE_TIME, target: 0 },
        { duration: SHUTDOWN_TIME_, target: 0 },
      ],
      exec: "exec_register_details_buy",
    },
    new_impulse: {
      executor: "ramping-vus",
      stages: [
        { duration: INIT_TIME_____, target: 0 },
        { duration: PRESPIKE_TIME_, target: 0 },
        { duration: RAMPUP_TIME___, target: 6 },
        { duration: SUSTAIN_SPIKE_, target: 6 },
        { duration: COOLDOWN_TIME_, target: 0 },
        { duration: POSTSPIKE_TIME, target: 0 },
        { duration: SHUTDOWN_TIME_, target: 0 },
      ],
      exec: "exec_register_impulse",
    },
  },
  // thresholds: {
  //   http_req_failed: ["rate<0.10"],
  // },
};

// -------------------- STAGES --------------------
function fetch_images(products) {
  const image_links = products.map(p => `${BASE_URL}/product/product-photo/${p._id}`)
  const k6_image_batch = image_links.map(url => ['GET', url, null, { tags: { endpoint: 'product/photo' }}])
  const img_responses = http.batch(k6_image_batch)
  return img_responses
}

function register_stage(data) {
  const id = exec.vu.idInInstance
  const iter = exec.vu.iterationInInstance
  const email = `${TEST_TYPE}_${id}_${iter}_${Date.now()}@example.com`
  const params = { headers: { "Content-Type": "application/json" } }
  const reg_req = {
    name: `${TEST_TYPE} ${id} ${iter}`,
    email: email,
    password: SPIKE_TEST_PASSWORD,
    phone: String(id).padStart(8, '1'),
    address: `${TEST_TYPE} STREET ${id}`,
    answer: `${TEST_TYPE}`,
  }
  
  const reg_res = http.post(`${BASE_URL}/auth/register`, JSON.stringify(reg_req), { ...params, tags: { endpoint: 'auth/register'}});
  check(reg_res, { "register_succeeds": x => x.status == 201 })

  sleep(1)
  const log_req = {
    email: email, password: SPIKE_TEST_PASSWORD
  }
  const log_res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(log_req), { ...params, tags: { endpoint: 'auth/login'}});
  check(log_res, { "login_token_received": x => x.json('token') !== "" });
  return {...data, token: log_res.json('token')}
}

function login_stage(data) {
  const id = exec.vu.idInInstance
  const req = {
    email: `${TEST_TYPE}_${id % 100}@example.com`,
    password: SPIKE_TEST_PASSWORD,
  }
  const params = { headers: { "Content-Type": "application/json" }, tags: { endpoint: 'auth/login'}}
  
  const log_res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(req), params);
  check(log_res, { "login_token_received": x => x.json('token') !== "" });
  return {...data, token: log_res.json('token')}
}

function homepage_stage(data) {
  const responses = http.batch([
    ['GET', `${BASE_URL}/category/get-category`, null, { tags: { endpoint: 'category/get-all'}}],
    ['GET', `${BASE_URL}/product/product-list/1`, null, { tags: { endpoint: 'product/get-list'}}],
    ['GET', `${BASE_URL}/product/product-count`, null, { tags: { endpoint: 'product/get-count'}}],
  ])
  const products = responses[1].json('products')
  const img_responses = fetch_images(products)
  const pid = products.filter(p => p.name == 'Spike Target')[0]._id
  return {...data, pid: pid}
}

function details_stage(data) {
  const detail_res = http.get(`${BASE_URL}/product/get-product/spike-target`, { tags: { endpoint: 'product/get-product'}})
  const product = detail_res.json("product")
  const product_img_res = fetch_images([product])
  const similar_res = http.get(
    `${BASE_URL}/product/related-product/${product._id}/${product.category._id}`,
    { tags: { endpoint: 'product/related-product'}}
  )
  const similar_prods = similar_res.json('products')
  const similar_img_res = fetch_images(similar_prods)
  return data
}

function order_stage(data) {
  const authPostHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.token}`,
  };

  const authGetHeaders = {
    Authorization: `Bearer ${data.token}`,
  };

  const cart = [{
    _id: data.pid,
    name: 'Spike Target',
    description: "The target product of the spike test",
    price: "200"
  }];

  const tokenRes = http.get(`${BASE_URL}/product/braintree/token`, { tags: { endpoint: 'product/braintree-token'}});
  sleep(1);

  const paymentRes = http.post(
    `${BASE_URL}/product/braintree/payment`,
    JSON.stringify({ nonce: "fake-valid-nonce", cart }),
    { headers: authPostHeaders, tags: { endpoint: 'product/braintree-payment'}}
  );
  sleep(1)

  const orderRes = http.get(`${BASE_URL}/auth/orders`, { headers: authGetHeaders, tags: { endpoint: 'auth/orders'}})
  return data
}

// -------------------- EXECUTE -------------------
export function exec_login_details_browse(data) {
  data = login_stage(data)
  data = homepage_stage(data)
  data = details_stage(data)
}
export function exec_login_details_buy(data) {
  data = login_stage(data)
  data = homepage_stage(data)
  data = details_stage(data)
  data = order_stage(data)
}
export function exec_login_impulse(data) {
  data = login_stage(data)
  data = homepage_stage(data)
  data = order_stage(data)
}
export function exec_register_details_browse(data) {
  data = register_stage(data)
  data = login_stage(data)
  data = homepage_stage(data)
  data = details_stage(data)
}
export function exec_register_details_buy(data) {
  data = register_stage(data)
  data = login_stage(data)
  data = homepage_stage(data)
  data = details_stage(data)
  data = order_stage(data)
}
export function exec_register_impulse(data) {
  data = register_stage(data)
  data = login_stage(data)
  data = homepage_stage(data)
  data = order_stage(data)
}
