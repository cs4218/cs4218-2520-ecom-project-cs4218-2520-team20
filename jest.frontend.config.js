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
    "<rootDir>/client/src/pages/admin/*.test.js",
    "<rootDir>/client/src/components/AdminMenu.test.js",
    "<rootDir>/client/src/components/Form/CategoryForm.test.js",
  ],

	// jest code coverage
	collectCoverage: true,
	collectCoverageFrom: [
		"client/src/pages/Auth/**",
    "client/src/pages/user/Orders.js",
		"client/src/pages/admin/CreateProduct.js",
		"client/src/pages/admin/AdminDashboard.js",
    "client/src/pages/admin/Users.js",
		"client/src/components/AdminMenu.js",
		"client/src/components/Form/CategoryForm.js",
    "client/src/pages/admin/UpdateProduct.js",
    "client/src/pages/admin/CreateCategory.js",
	],
	coverageThreshold: {
		global: {
			lines: 100,
			functions: 100,
		},
	},
	setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
