# Node.js Architecture Guide

## Application Structure
- **Entry Layer**: Application bootstrap and server lifecycle are managed from [week2/day8/server/index.js](week2/day8/server/index.js).
- **Middleware Layer**: Cross-cutting concerns are handled through middleware (security, request processing, logging, errors, performance).
- **Route Layer**: API endpoints are organized by domain under route modules (users, products, orders, health).
- **Service Layer**: Business logic is encapsulated in services to keep route handlers thin and maintainable.
- **Communication Layer**: Real-time communication uses Socket.IO events with room-based subscriptions and broadcast updates.

## Core Architectural Patterns
- **Modular Design**: Separation of concerns between server, middleware, routes, and services.
- **Event-Driven Services**: EventEmitter is used for domain events such as user creation, update, and deletion.
- **Cluster-Based Scaling**: Worker processes are forked per CPU core to improve parallel request handling.
- **Centralized Error Handling**: A global error handler normalizes operational and framework-level errors.
- **Structured Observability**: Winston logging and runtime performance metrics provide traceable operational insights.

## Request Flow
1. Client request enters Express server.
2. Security and utility middleware run first (Helmet, CORS, compression, rate limiting, body parsing).
3. Request is dispatched to the appropriate route.
4. Route delegates core logic to a service.
5. Service performs async operations and may emit domain events.
6. Response is returned; performance middleware records latency and memory snapshot.
7. Any error is passed to centralized error handling for standardized output.

## Security and Reliability Design
- **Security Headers**: Helmet strengthens default HTTP protections.
- **Rate Limiting**: API routes apply request limits to reduce abuse risk.
- **Credential Protection**: Passwords are hashed with bcrypt before storage.
- **Token-Based Auth**: JWT is used for stateless authentication with session tracking.
- **Process Safety**: Global handlers are attached for uncaught exceptions and unhandled rejections.

## Performance Optimization
- **Clustering**: Leverages multi-core CPUs by running multiple workers.
- **Compression**: Reduces payload size and improves client-perceived response time.
- **Request Metrics**: Uses perf_hooks to capture execution time per request.
- **Memory Visibility**: Captures heap usage to identify growth trends early.
- **Graceful Worker Recovery**: Dead worker processes are replaced automatically.

## Error Handling Strategy
- **Operational Errors**: Application-level failures are returned with controlled status codes.
- **Known Framework Errors**: Cast errors, validation errors, duplicate-key errors, and JWT errors are mapped to clear responses.
- **Consistent Error Payload**: API clients receive a predictable error shape.
- **Development Diagnostics**: Stack traces are included only in development mode.

## Best Practices Applied
- **Async/Await First**: Service methods use async/await for readable non-blocking control flow.
- **Service Encapsulation**: Domain logic and state are managed within dedicated service classes.
- **Least Knowledge Routing**: Routes focus on HTTP concerns and delegate business logic.
- **Observability by Default**: Logging and metrics are integrated into normal request execution.
- **Extensibility**: New domains can be added by introducing new route + service modules.

## Future Improvements
- Add persistent storage (SQL/NoSQL) to replace in-memory maps.
- Add request correlation IDs for cross-service traceability.
- Introduce automated tests for middleware and service methods.
- Add caching for high-read endpoints and expensive computations.
- Add health/readiness probes with richer dependency checks.