export default {
  // display name
  displayName: "backend-integration",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
   // TODO: Remove at end of MS2 - Early removal will probably cause merge conflicts
    "<rootDir>/integrations/backend/example/*.test.js",
    "<rootDir>/integrations/backend/models/*.test.js",
  ],
  
  collectCoverage: false,
};
