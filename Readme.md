# CS4218 Project - Virtual Vault

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:
   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:
   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:
   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:
   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:
   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:
   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**
   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**
   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**
   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**
   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:
   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```

## MS1 CI URL

[MS1 CI URL](https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team20/actions/runs/22283277546/job/64457271252)

### CONTRIBUTIONS

### Alexander Setyawan (A0257149W)

- Search
- Product
- Contact
- General
   - components/Footer.js
   - components/Header.js
   - components/Layout.js
   - components/Spinner.js
   - pages/About.js
   - pages/Pagenotfound.js
   - config/db.js   
   
### Seah Minlong (A0271643E)

- Admin Actions - Client-Related Files only
- Admin View Products
- Admin View Orders
- Admin Dashboard
- Payment

### Nigel Lee Xun Yi (A0259264W)

- Protected Routes
- Registration
- Login
- Policy

### Kaw Jun Rei, Dylan (A0252791Y)

- Home
- Cart
- Category
- Admin Actions - Server-Related Files Only
 
### Wang Zhi, Wren (A0255368U)

- General
   - components/Routes/Private.js
   - components/UserMenu.js
   - pages/user/Dashboard.js
   - models/userModel.js
- Order
- Profile
- Admin View Users

## MS2

### CONTRIBUTIONS

### Alexander Setyawan (A0257149W)

- integrations\backend\controllers\categoryController.integration.test.js
- integrations\backend\controllers\getProductController.integration.test.js
- integrations\backend\controllers\getSingleProductController.integration.test.js
- integrations\backend\controllers\productCategoryController.integration.test.js
- integrations\backend\controllers\productController.integration.test.js
- integrations\backend\controllers\productCountController.integration.test.js
- integrations\backend\controllers\productFiltersController.integration.test.js
- integrations\backend\controllers\productListController.integration.test.js
- integrations\backend\controllers\productPhotoController.integration.test.js
- integrations\backend\controllers\relatedProductController.integration.test.js
- integrations\backend\controllers\searchProductController.integration.test.js
- integrations\frontend\CategoryProductBackend.integration.test.js
- integrations\frontend\ProductDetailsRelated.integration.test.js
- integrations\frontend\ProductDetailsSingle.integration.test.js
- playwright-tests\acProductDetails.spec.js
- playwright-tests\acSearch.spec.js
   
### Seah Minlong (A0271643E)

- integrations/backend/controllers/categoryController.integration.test.js
- integrations/backend/controllers/productController.integration.test.js
- integrations/backend/adminBackend.integration.test.js
- integrations/frontend/adminCreateCategory.integration.test.js
- integrations/frontend/adminProductPages.integration.test.js
- playwright-tests/adminPanel.spec.js
- playwright-test/adminRouteProtection.spec.js
- playwright-test/seedTestData.mjs

### Nigel Lee Xun Yi (A0259264W)


### Kaw Jun Rei, Dylan (A0252791Y)

 
### Wang Zhi, Wren (A0255368U)

