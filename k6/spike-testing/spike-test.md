# Spike Testing Specifications
Metrics: Check Error Rate, Throughput, Response Time

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
     - Filters (`/api/v1/product/product-filters`)
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
     - Small amount should go to Search Page(?)
     - Perform Order
     - Check Order
 - We could experiment with a Hybrid test?
   - Spike multiple API routes with 50 Users --> Perform over full API workflow
   - Have a small 10 VU section test responsiveness on Frontend
