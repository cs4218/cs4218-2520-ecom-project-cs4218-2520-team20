export default {
  // name displayed during tests
  displayName: "frontend",

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
    "<rootDir>/client/src/pages/Auth/*.test.js",
    "<rootDir>/client/src/pages/user/*.test.js",
    "<rootDir>/client/src/pages/HomePage.test.js",
    "<rootDir>/client/src/pages/CartPage.test.js",
    "<rootDir>/client/src/pages/Categories.test.js",
    "<rootDir>/client/src/components/*.test.js",
    "<rootDir>/client/src/pages/admin/*.test.js",
    "<rootDir>/client/src/components/Routes/*.test.js",
    "<rootDir>/client/src/components/AdminMenu.test.js",
    "<rootDir>/client/src/components/Form/*.test.js",
    "<rootDir>/client/src/components/Footer.test.js",
    "<rootDir>/client/src/components/Header.test.js",
    "<rootDir>/client/src/components/Layout.test.js",
    "<rootDir>/client/src/components/Spinner.test.js",
    "<rootDir>/client/src/context/*.test.js",
    "<rootDir>/client/src/pages/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/pages/Auth/**",
    "client/src/pages/user/**",
    "client/src/pages/admin/CreateProduct.js",
    "client/src/pages/admin/AdminDashboard.js",
    "client/src/pages/admin/AdminOrders.js",
    "client/src/pages/admin/CreateCategory.js",
    "client/src/pages/admin/CreateProduct.js",
    "client/src/pages/admin/Products.js",
    "client/src/pages/admin/UpdateProduct.js",
    "client/src/pages/admin/Users.js",
    "client/src/components/AdminMenu.js",
    "client/src/components/Form/CategoryForm.js",
    "client/src/components/Footer.js",
    "client/src/components/Layout.js",
    "client/src/components/Spinner.js",
    "client/src/pages/About.js",
    "client/src/pages/Pagenotfound.js",
    "client/src/components/Header.js",
    "client/src/pages/Contact.js",
    "client/src/components/Routes/Private.js",
    "client/src/components/Form/SearchInput.js",
    "client/src/context/search.js",
    "client/src/pages/Search.js",
    "client/src/pages/HomePage.js",
    "client/src/pages/CartPage.js",
    "client/src/pages/Categories.js",
    "client/src/pages/CategoryProduct.js",
    "client/src/pages/ProductDetails.js"
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
