# REST API Design & Best Practices Guide

This document details the API principles, caching strategies, rate limiting parameters, and performance structures configured in our Day 11 versioned routing system.

---

## 🧭 REST API Design Principles

### 1. Resource-Oriented URLs
All URL paths target entities (nouns) rather than actions (verbs):
- **Correct**: `POST /api/v1/orders` (places order)
- **Incorrect**: `POST /api/v1/placeOrder`

### 2. HTTP Method Semantics
Endpoints adhere to standard CRUD mappings:
- **`GET`**: Retrieve resources (must be safe, idempotent, and cacheable).
- **`POST`**: Create resources (unsafe, non-idempotent).
- **`PUT`**: Replace/update an entire resource (idempotent).
- **`DELETE`**: Remove resources (idempotent).

### 3. Proper Status Codes
- **`200 OK`**: General successful responses.
- **`201 Created`**: Successful creation (e.g., product created, order placed).
- **`400 Bad Request`**: Validation errors, malformed request payloads.
- **`401 Unauthorized`**: Authentication missing or expired tokens.
- **`403 Forbidden`**: Valid token but insufficient permissions (e.g. non-admin hits admin route).
- **`404 Not Found`**: Resource does not exist.
- **`429 Too Many Requests`**: Rate limit exceeded.

---

## 🚦 Versioning & Negotiation Pipeline

### 1. Versioning
We implement **URL Versioning** (`/api/v1`) as it is highly visible and caching-friendly. The versioning negotiator also inspects the HTTP `Accept` header (e.g., `application/json; version=v1`) to fall back dynamically.

### 2. Content Negotiation
Standard responses default to `application/json`. The content negotiator checks the incoming `Accept` header to parse formats and set appropriate content boundaries.

---

## ⚡ Caching Strategy (Redis)

To maximize throughput and limit database load, we wrap heavy read endpoints in a Redis-backed caching middleware:

```
Request ──► [Cache Middleware] ──► [Redis.get(key)] ──► HIT ──► Return JSON (X-Cache: HIT)
                 │
                MISS
                 ▼
          [Query Database] ──► [Redis.setEx(key, ttl)] ──► Return JSON (X-Cache: MISS)
```

### Expiration Polices (TTL):
- **Catalog query (`GET /api/v1/products`)**: Cached for 5 minutes (`300s`) since catalog updates are moderately frequent.
- **Product details (`GET /api/v1/products/:id`)**: Cached for 1 hour (`3600s`) to protect against repeat lookups on hot items.
- **Cache Invalidation**: Write/update operations (`POST`, `PUT`, `DELETE`) on products trigger an automatic cache flush (`cacheService.flush()`), guaranteeing immediate catalog consistency.
- **Degraded Fallback**: If the Redis instance is offline, the caching middleware catches connection errors and forwards queries directly to SQL, maintaining operational status.

---

## 🛡️ Throttling & Rate Limiting

We apply tiered limits using `express-rate-limit` to defend the server from overload:

| Limiter Class | Endpoint / Scope | Max Requests | Window (Ms) | Behavior |
|---|---|---|---|---|
| **General** | `/api/` (all routes) | 100 | 15 mins | Global protection |
| **Strict** | `/api/v1/products` (write) | 5 | 15 mins | Limits catalog spam |
| **Login** | `/api/v1/users/login` | 5 | 15 mins | Prevents brute-force (skips successes) |
| **API Key** | Headers `X-API-Key` | Tiered | 15 mins | Free (100) / Premium (1000) / Enterprise (10000) |