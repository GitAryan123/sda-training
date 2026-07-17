# REST API Design Guide

## API Design Principles
- **Resource-Based URLs**: Use nouns, not verbs
- **HTTP Methods**: Proper use of GET, POST, PUT, PATCH, DELETE
- **Status Codes**: Consistent HTTP status code usage
- **Content Negotiation**: Accept headers and response formats
- **Pagination**: Offset, limit, and cursor-based pagination

## API Versioning Strategy

### Implementation
API versioning is handled through both URL paths and Accept headers:

```javascript
// Extract version from URL path: /api/v1/users
const versionMatch = req.path.match(/^\/api\/(v\d+)/);
const urlVersion = versionMatch ? versionMatch[1] : null;

// Extract version from Accept header: Accept: application/json; version=v2
const acceptHeader = req.headers.accept || '';
const headerVersion = acceptHeader.includes('version=') 
  ? acceptHeader.split('version=')[1].split(',')[0]
  : null;

// Determine API version (URL takes precedence, then header, then default)
const apiVersion = urlVersion || headerVersion || 'v1';
```

### Supported Versions
- **v1**: Current stable version (default)
- **v2**: Next generation with enhanced features
- Returns 400 Bad Request for unsupported versions

## Rate Limiting Strategy

### Limiter Types

#### 1. General Rate Limiter
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- Standard headers enabled

```javascript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
```

#### 2. Strict Rate Limiter
- **Window**: 15 minutes
- **Limit**: 5 requests per IP
- For sensitive operations (e.g., password reset, account deletion)

#### 3. Login Rate Limiter
- **Window**: 15 minutes
- **Limit**: 5 attempts per IP
- Skips counting successful requests
- Prevents brute force attacks

#### 4. API Key Rate Limiter
Tiered limits based on API key subscription:

```javascript
const limits = {
  'free': { max: 100, windowMs: 15 * 60 * 1000 },      // 100 req/15min
  'premium': { max: 1000, windowMs: 15 * 60 * 1000 },  // 1000 req/15min
  'enterprise': { max: 10000, windowMs: 15 * 60 * 1000 } // 10k req/15min
};
```

### Rate Limit Response
```javascript
{
  "success": false,
  "error": {
    "message": "Too many requests from this IP, please try again later.",
    "retryAfter": "15 minutes",
    "limit": 100,
    "remaining": 0
  }
}
```

## Caching Strategy with Redis

### Cache Service Features
- Automatic Redis connection management with retry strategy
- Key generation with parameter sorting for consistency
- TTL (Time-To-Live) configuration per cache entry
- Graceful fallback if Redis is unavailable

```javascript
// Set cache with TTL
await cacheService.set('user:123', userData, 3600); // 1 hour TTL

// Get from cache
const data = await cacheService.get('user:123');

// Delete specific key
await cacheService.del('user:123');

// Clear all cache
await cacheService.flush();

// Generate cache key
const key = cacheService.generateKey('users:list', { 
  page: 1, 
  limit: 20 
}); // Result: "users:list:limit:20|page:1"
```

### Redis Connection
- Configurable via `REDIS_URL` environment variable
- Default: `redis://localhost:6379`
- Automatic retry with exponential backoff (max 10 attempts)
- Logs all connection errors and operations

## Best Practices

### Error Handling
- Consistent error response format with HTTP status codes
- Meaningful error messages and retry guidance
- Proper HTTP status codes (400, 401, 403, 404, 429, 500)

### Security
- Rate limiting prevents brute force and DDoS
- API key tiering for SaaS models
- Request validation on all endpoints
- Secure header standards

### Performance Optimization
- **Redis Caching**: Reduces database load
- **Rate Limiting**: Prevents resource exhaustion
- **API Versioning**: Enables backward compatibility
- **Response Compression**: Enabled via middleware

### Documentation Standards
- Version endpoints clearly (/api/v1/users, /api/v2/users)
- Include rate limit headers in responses
- Document cache TTL for each endpoint
- Provide API key tier information