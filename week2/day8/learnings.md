# Day 8 Learnings - Node.js Deep Dive


## What I Learned Today
- Understood how to structure a Node.js backend using layered architecture: server setup, middleware, routes, and services.
- Practiced production-focused middleware usage with Helmet, CORS, compression, and rate limiting to improve security and reliability.
- Learned how clustering works in Node.js using the cluster module to run workers across CPU cores for better throughput.
- Applied event-driven design in services using EventEmitter to decouple business events from core CRUD/auth logic.
- Improved understanding of authentication flow using bcrypt for password hashing and JWT for token-based sessions.
- Implemented centralized error handling with structured logging so runtime issues are easier to trace and debug.
- Practiced performance measurement using perf_hooks and request-level timing to observe response latency and memory usage.

## Key Technical Takeaways
- Node.js single-threaded runtime can still scale with multi-process clustering.
- Security and resilience should be part of app setup from day one, not a later addition.
- Service modularity makes code easier to test, extend, and maintain.
- Observability (logging + metrics) is essential for diagnosing production behavior.
- Async error paths need as much attention as success paths in API design.

## Reflection
Today reinforced that strong backend architecture is not just about making endpoints work. It is about making systems secure, observable, and maintainable as they grow.
