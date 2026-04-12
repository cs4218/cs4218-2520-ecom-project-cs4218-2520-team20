# Spike Testing Specifications
Metrics: Check Error Rate, Throughput, Response Time
 - Owing to the exceedingly low error rate of the test run, we focus on the Response Time and Waiting Time metrics instead.

Virtual Vault: E-Commerce Website
 - Assume baseline load of 20-30 users at any one time
   - Small and Growing Website: will not have many users right now
   - Based on Test Schema, Items sold are niche (NUS Shirt, Textbook, etc): Userbase caters to NUS Students,
     so target audience is unlikely to be large

## Key Scenario
Spike Test
 - Simulate a Price Drop/New Product Release
 - Test 3 User Spikes --> 50 Users, 70 Users, 100 Users
   - Compare behaviours between 3 distinct heavy user loads
 - Should focus on spiking API routes
   - Rationale: Frontend runs locally on the client, so not much information to send
   - Auth Routes
     - (`/api/v1/auth/register`, `/api/v1/auth/login`)
     - Normal Load 95% Login, 5% Register
     - Spike 70% Login, 30% Register
     - New Users happen more often during a sale/new product release
   - Homepage
     - Product Information (`/api/v1/category/get-category`, `/api/v1/product/product-list/<page>`, `/api/v1/product/product-count`)
     - Photos (`/api/v1/product/product-photo/<pid>` - each page must fetch multiple of this)
     - ~~Filters (`/api/v1/product/product-filters`)~~ Ignore this API call - this is only called if filters are set up.
     - This must always happen on every call.
   - Product Details
     - Product Details (`/api/v1/product/get-product/<slug>`)
     - Similar Items (`/api/v1/product/related-product/<product id>/<category id>`)
     - Photos (`/api/v1/product/product-photo/<pid>` - each page must fetch multiple of this)
     - Limit this to 80% of the Spike - Represent the more prudent shoppers, 20% will be impulse buyers and skip this step
   - Order Flow
     - Braintree (`/api/v1/product/braintree/token`, `/api/v1/product/braintree/payment`)
       - Use `fake-valid-nonce` for the payments
     - Orders (`/api/v1/auth/orders`) - for Post-Order Handling
     - 100% of Impulse Buyers convert to Orders
     - Limit 30% of Prudent Shoppers to be Orders
   - Full API Flow
     - Some Auth Route Triggers
     - ALL should go to Homepage
     - Some should enter Product Details
     - ~~Small amount should go to Search Page(?)~~ Skipped due to slow setup phase involving Grafana
     - Perform Order
     - Check Order

# How to run
 - Ensure Working Dir is the root folder
 - Seed database: `node k6/spike-testing/helper/seed_db.js`
 - Start Website: `npm run dev`
 - Ensure InfluxDB OSS v1 is running - default port is 8086
 - Do Spike-Test: `K6_WEB_DASHBOARD_PERIOD=1s K6_WEB_DASHBOARD=true k6 run --out influxdb=http://localhost:8086/myk6db k6/spike-testing/spike_test_backend.js`
   - Metrics during the test can be checked using the web-dashboard.
   - Final metrics analysed with Grafana, using Influx-V1 as the datasource.

# Final Test Summary
```
    HTTP
    http_req_duration..............: avg=714.66ms min=109.87ms med=815.29ms max=4s     p(90)=1.04s  p(95)=1.8s  
      { expected_response:true }...: avg=714.68ms min=160.52ms med=815.3ms  max=4s     p(90)=1.04s  p(95)=1.8s  
    http_req_failed................: 0.00%  2 out of 63652
    http_reqs......................: 63652  111.271478/s

    EXECUTION
    iteration_duration.............: avg=6.42s    min=1.63s    med=6.18s    max=19.19s p(90)=11.91s p(95)=12.96s
    iterations.....................: 5529   9.665368/s
    vus............................: 1      min=1          max=100
    vus_max........................: 100    min=100        max=100

    NETWORK
    data_received..................: 225 MB 393 kB/s
    data_sent......................: 8.8 MB 15 kB/s
```
