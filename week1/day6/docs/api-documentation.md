# API Documentation

> **Project:** Apex Telemetry Dashboard — Day 5  
> **Base URL (Dev):** `http://localhost:5173`  
> **WebSocket:** `ws://localhost:5173/ws`  
> **Version:** v1.0  

---

## Table of Contents
- [Authentication](#authentication)
- [Data Endpoints](#data-endpoints)
  - [GET /revenue](#get-revenue)
  - [GET /users](#get-users)
  - [GET /orders](#get-orders)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)
- [WebSocket Events](#websocket-events)
- [Caching Behaviour](#caching-behaviour)

---

## Authentication

> **Note:** The current implementation is frontend-only with simulated data. When a backend is added, all requests should include:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Data Endpoints

### GET /revenue

Retrieve revenue telemetry data for chart visualization.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | ISO8601 string | No | 7 days ago | Time range start |
| `endDate` | ISO8601 string | No | now | Time range end |
| `granularity` | `daily` \| `weekly` \| `monthly` | No | `daily` | Bucket resolution |

**Success Response `200 OK`:**
```json
{
  "total": 47250,
  "change": 8.4,
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "values": [5200, 6800, 4900, 7100, 8200, 9100, 5950]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total` | Number | Aggregate revenue for period |
| `change` | Number | % change vs prior period |
| `labels` | String[] | X-axis labels for chart |
| `values` | Number[] | Revenue per bucket |

---

### GET /users

Retrieve user registration telemetry.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Page number |
| `limit` | Integer | No | 10 | Results per page |
| `search` | String | No | - | Filter by name/email |

**Success Response `200 OK`:**
```json
{
  "total": 1842,
  "change": 12.1,
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "values": [210, 185, 250, 300, 275, 190, 432]
}
```

---

### GET /orders

Retrieve order processing telemetry with status breakdown.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | `completed` \| `pending` \| `cancelled` | No | Filter by status |
| `dateRange` | String | No | Date range filter |

**Success Response `200 OK`:**
```json
{
  "total": 342,
  "change": -1.8,
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "values": [42, 38, 55, 60, 48, 62, 37]
}
```

---

## Error Responses

All errors follow a consistent envelope format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": []
  }
}
```

### HTTP Status Codes

| Status | Code | When |
|--------|------|------|
| `400` | `VALIDATION_ERROR` | Bad query parameters |
| `401` | `UNAUTHORIZED` | Missing or invalid token |
| `403` | `FORBIDDEN` | Insufficient permissions |
| `404` | `NOT_FOUND` | Endpoint or resource missing |
| `429` | `RATE_LIMITED` | Too many requests (see below) |
| `500` | `INTERNAL_ERROR` | Unexpected server failure |
| `502` | `BAD_GATEWAY` | Upstream service unreachable |
| `503` | `SERVICE_UNAVAILABLE` | Service temporarily offline |

---

## Rate Limiting

The `ApiService` client enforces its own rate limit on top of any server-side limits:

| Limit | Window | Behaviour |
|-------|--------|-----------|
| 10 requests | 5 seconds | Client-side sliding window throttle |
| 1000 requests | 1 hour | Server-side IP-based (when backend present) |

When the client rate limit is exceeded, `ApiService` throws:
```
Error: Rate limit exceeded. Please try again later.
```

**Retry Backoff Formula:**
```
delay = retryDelay × 2^(attempt-1) ± jitter(100ms)
```

| Attempt | Base Delay | With Jitter Range |
|---------|-----------|------------------|
| 1 | 1000ms | 900–1100ms |
| 2 | 2000ms | 1900–2100ms |
| 3 | 4000ms | 3900–4100ms |

---

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5173/ws');
```

### Outgoing Events (Client → Server)

| Event Type | Payload | Description |
|------------|---------|-------------|
| `ping` | `null` | Heartbeat keep-alive (sent every 30s) |
| `subscribe` | `{ endpoint: string }` | Subscribe to endpoint updates |

**Example:**
```javascript
wsService.send({ type: 'subscribe', payload: { endpoint: '/revenue' } });
```

### Incoming Events (Server → Client)

| Event Type | Payload | Description |
|------------|---------|-------------|
| `pong` | `null` | Heartbeat acknowledgement |
| `connected` | `null` | Socket open confirmation |
| `disconnected` | `{ code, reason }` | Socket closed |
| `dataUpdate` | `{ endpoint, data }` | Live telemetry packet |
| `error` | `{ message }` | Server-side error notification |

**Example `dataUpdate` payload:**
```json
{
  "type": "dataUpdate",
  "payload": {
    "endpoint": "/revenue",
    "data": {
      "total": 48100,
      "change": 9.2,
      "values": [5200, 6800, 4900, 7100, 8200, 9100, 6800]
    }
  }
}
```

---

## Caching Behaviour

`ApiService` uses an in-memory `Map` for response caching:

| Property | Value | Description |
|----------|-------|-------------|
| Default TTL | 5 minutes (300,000ms) | Time before cache entry expires |
| Key Format | `${url}-${JSON.stringify(options)}` | Unique per endpoint + options combo |
| Cache Bypass | `{ cache: false }` in options | Force fresh fetch |
| Custom TTL | `{ cacheTTL: ms }` in options | Override default TTL |

**Cache lifecycle:**
1. Check if key exists in Map
2. If exists and `Date.now() - timestamp < TTL` → return cached
3. If expired → delete stale entry, fetch fresh
4. On success → `cache.set(key, { data, timestamp: Date.now() })`
