# API Documentation & Integration Guide (SDA Training)

This guide documents the API specifications, interactive Swagger UI documentation, Postman collection automation, and integration testing frameworks established for the authentication and user profile systems.

---

## 📚 OpenAPI/Swagger Standards

We use the **OpenAPI Specification v3.0.0** via `swagger-jsdoc` comments inside our route files to define our endpoint documentation. This ensures code and documentation live together and do not drift out of sync.

### Key Components

*   **Server Endpoints**: Under development, the API base path is `http://localhost:3000/api/v1`.
*   **Security Scheme**: We implement Bearer-style JWT authorization via the HTTP `Authorization` header:
    ```http
    Authorization: Bearer <your_jwt_access_token>
    ```
*   **Response Schemas**:
    *   `AuthResponse`: Standard success response for registration and login, returning user metadata and token pairs.
    *   `TokenRefreshResponse`: Output schema for rotating expired access tokens.
    *   `ProfileResponse`: Exposes safe user object details for the `/auth/me` profile route.
    *   `ErrorResponse`: Consistent error structure (`{ success: false, error: { message, statusCode } }`).

---

## 🚀 Swagger UI Interactive Access

We use `swagger-ui-express` to serve interactive docs directly from our application server.

*   **Swagger JSON Endpoint**: `http://localhost:3000/api/v1/docs/swagger.json`
*   **Interactive UI Interface**: `http://localhost:3000/api/v1/docs/`

To test authenticated endpoints in the browser:
1. Generate an Access Token using `POST /auth/login`.
2. Click the **Authorize** lock button in the upper right.
3. Paste the token into the field and click **Authorize**.
4. Use **Try it out** to execute live queries.

---

## 📮 Postman Collection Integration

A custom generator script is included to automatically compile the OpenAPI specs into a Postman collection JSON file.

### Generating the Collection

Run the generator script using the package script:
```bash
npm run generate-postman
```
This parses the Swagger specifications and writes the output collection schema to:
`week2/day13/docs/postman-collection.json`

### Importing into Postman

1. Open Postman.
2. Click **Import** in the upper left.
3. Drag and drop the `postman-collection.json` file.
4. Set the value of the `base_url` variable in your environment or collection variables to target your local server.
5. Store your logged-in JWT token inside the `jwt_token` variable to automatically authenticate requests.

---

## 🧪 Integration Testing

We use **Jest** and **Supertest** to verify our authentication and authorization lifecycle.

### Running Tests

To run the endpoint tests:
```bash
npm run test
```
The test suite validates:
1. New user registration (success, validation failure, duplicate user error handling).
2. Credentials authentication (successful tokens payload, incorrect password rejects).
3. Session checks (`/auth/me` token checking, invalid scheme rejects).
4. Token rotation lifecycle (refresh tokens exchanging).
5. Passwords update constraints (`/auth/change-password` verification).
6. Logouts behavior.
