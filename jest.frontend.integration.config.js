export default {
  // name displayed during tests
  displayName: "frontend-integration",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "./FixJSDOMEnvironment.js",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  testMatch: [
   // TODO: Remove at end of MS2 - Early removal will probably cause merge conflicts
    "<rootDir>/integrations/frontend/example/*.test.js",
  ],

  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
  
  collectCoverage: false,
};
