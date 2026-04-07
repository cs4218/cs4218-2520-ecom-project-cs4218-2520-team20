import http from "k6/http";

export const options = {
  stages: [
    { duration: "1s", target: 5 }, // traffic ramp-up from 1 to 5 users over 1 second
    { duration: "10s", target: 5 }, // stay at 5 users for 10 seconds
    { duration: "1s", target: 0 }, // ramp-down to 0 users
  ],
  thresholds: {
    http_req_failed: ["rate<0.1"], // http errors should be less than 10%
    http_req_duration: ["p(90)<100"], // 90% of requests should be below 100ms
  },
};

export default () => {
  const responses = http.batch([
    ["GET", "https://quickpizza.grafana.com"],
    // ["GET", "some other URL to access in parallel"],
  ]);
};
