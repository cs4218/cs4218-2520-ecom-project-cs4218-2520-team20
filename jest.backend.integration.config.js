export default {
  // display name
  displayName: "backend-integration",

  // when testing backend
  testEnvironment: "node",

  moduleNameMapper: {
    "^@client/(.*)$": "<rootDir>/client/src/$1",
    "^@server/(.*)$": "<rootDir>/$1",
  },

  // which test to run
  testMatch: [
    "<rootDir>/integrations/backend/**/*.test.js",
  ],
  
  collectCoverage: false,
};
