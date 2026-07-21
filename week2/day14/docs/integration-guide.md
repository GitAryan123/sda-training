# System Integration & Review Guide

This guide details the integration architecture between the frontend dashboard and the Node.js backend. It details API communication protocols, authentication management, error handling, performance telemetry, E2E validation, logging, and production deployment steps.

---

## 1. Frontend-Backend API Integration

### Core Communication Protocol
- All frontend-backend interactions occur over **HTTP/S** using a standard RESTful structure.
- Content negotiation is enforced; request payloads and responses use `application/json`.
- The system base URL is configured via environment variables, defaulting to:
  `http://localhost:3000/api/v1`

### Authentication & Token Management
- Authentication uses a hybrid approach of **JSON Web Tokens (JWT)** and **OAuth2** (Google, GitHub, Facebook).
- On successful login, the server returns a short-lived `accessToken` and a long-lived `refreshToken`.
- The frontend stores the tokens securely and attaches the access token as a **Bearer Token** in the `Authorization` header of all subsequent API calls:
  `Authorization: Bearer <accessToken>`
- A silent refresh flow executes automatically when the access token expires by posting the refresh token to `/auth/refresh`.

### Client Architecture
The frontend incorporates a unified `ApiService` class that encapsulates the native `fetch` API. It features:
- Automatic insertion of authentication headers.
- Graceful client-side request mapping.
- Native deserialization and standard error mapping.

```javascript
// Example implementation of frontend client
class ApiService {
  // Configures baseURL and loads the token from localStorage
  // Performs request, processes errors, and returns JSON payload
}
```

---

## 2. Telemetry, Monitoring & Logging

To ensure operational excellence and rapid troubleshooting in production, the application runs a custom monitoring and Winston-based logging system.

### Winston Logger Architecture
- Log outputs are split across **Console** (colorized, human-readable layout for development) and **File Transports** (structured JSON layout for production).
- Production logs write to two files in the application root:
  1. `logs/error.log`: Captures all operational exceptions (severity level `error`).
  2. `logs/combined.log`: Captures general application actions and processed requests.

### Request Performance Profiling
Every inbound request is intercepted by the `monitoringMiddleware` which tracks:
- Request method, URL path, response status code, and duration (measured in milliseconds using `performance.now()`).
- IP addresses, User-Agent parameters, and authenticated User IDs (if present) for request audit trails.

### Health Check & Metrics Endpoints
- **Health Check (`GET /api/v1/health`)**:
  Provides a diagnostic JSON representation of the system. If memory utilization exceeds 90% of heap allocation, the status changes to `unhealthy`.
- **Metrics (`GET /api/v1/metrics`)**:
  Exposes detailed performance statistics, containing system uptime, physical process parameters, current memory layout, and request counters segmented by HTTP method and URI.

---

## 3. Testing & Verification Strategy

We validate the system integrity via a multi-tiered test suite run under Jest:

1. **Integration Tests**: Assesses database connection pooling, user login cycles, session security, and access tokens.
2. **End-to-End (E2E) Tests**: Executes a complete user lifecycle:
   - Registers a new user account with a strong password.
   - Logs the user in to receive auth tokens.
   - Browses products list and retrieves item specifications.
   - Submits a purchase order, deducting stock from the database.
   - Inspects the updated order history and system analytics.
3. **Performance Profiling**: Validates that endpoints respond within a sub-second threshold (SLA < 1000ms) and checks concurrent connection stability.

---

## 4. Production Deployment Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: v5.0+ (running locally or remotely)
- **Environment**: Configured `.env` file containing JWT secrets and database URIs.

### Process Management with PM2
To launch the server as a daemon process that automatically restarts on crashes or system reboots:
```bash
# Install PM2 globally
npm install -g pm2

# Start the application pool
pm2 start server/index.js --name "sda-integration-api"

# Generate system startup scripts
pm2 startup
pm2 save
```

### Nginx Reverse Proxy Configuration
Configure Nginx to act as a reverse proxy, handling SSL termination and rate limiting:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Backup & Log Rotation
1. **Database Backups**: Schedule recurring cron jobs for DB dumps:
   `mongodump --uri="mongodb://localhost:27017/sda-training" --out=/var/backups/mongo/`
2. **Log Rotation**: Prevent disk capacity issues by managing logs using PM2's logrotate plugin:
   `pm2 install pm2-logrotate`
