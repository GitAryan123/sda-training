# Day 11: REST API Best Practices - Key Learnings

## API Versioning

### Implementation Patterns
- **Dual-source versioning**: Support both URL path (`/api/v1/users`) and Accept header (`Accept: application/json; version=v2`)
- **Priority order**: URL path > Accept header > default version
- **Validation**: Always validate requested version against supported versions list
- **Error handling**: Return 400 Bad Request with list of supported versions for unsupported API versions

### Best Practices
- Version using semantic notation (v1, v2, not v1.0, v1.1)
- Keep number of supported versions limited (e.g., current + 1 previous)
- Document breaking changes between versions clearly
- Consider deprecation period before removing old versions

### Real-world Insight
Multiple versioning methods provide flexibility:
- URL path versioning: Clear, visible, SEO-friendly
- Header versioning: Cleaner URLs, better for internal APIs
- Both methods together: Maximum compatibility with different client types

---

## Rate Limiting Strategy

### Limiter Types & Use Cases
1. **General Limiter** (100 req/15min per IP)
   - Default for all endpoints
   - Prevents casual abuse and resource exhaustion

2. **Strict Limiter** (5 req/15min per IP)
   - Sensitive operations: password reset, account deletion, payment processing
   - Critical for security

3. **Login Limiter** (5 attempts/15min per IP)
   - Protects against brute force attacks
   - `skipSuccessfulRequests: true` prevents locking out legitimate users after login

4. **API Key Limiter** (tiered)
   - Free: 100 requests/15min
   - Premium: 1000 requests/15min
   - Enterprise: 10,000 requests/15min
   - Monetization strategy for SaaS products

### Implementation Insights
- Use standard headers (`standardHeaders: true`) for X-RateLimit-* headers
- Include retry information in error responses
- Different endpoints may need different limits
- Consider user reputation and history in advanced implementations

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1234567890
```

### Critical Learning
**Rate limiting is defense-in-depth**, not a single solution:
- Protects against accidental overload
- Mitigates DDoS attacks (first line of defense)
- Enables fair resource sharing in multi-tenant systems
- Should be combined with authentication and authorization

---

## Caching with Redis

### Cache Service Architecture
```
Client Request
    ↓
Check Redis Cache → Hit: Return cached data
    ↓ (Miss)
Query Database
    ↓
Store in Redis with TTL
    ↓
Return to Client
```

### Key Features Implemented

#### 1. Connection Management
- Configurable via environment variable (`REDIS_URL`)
- Automatic retry with exponential backoff
- Maximum 10 retry attempts before giving up
- Event-driven: `connect` and `error` events
- Graceful degradation: API works without Redis (slower, but functional)

#### 2. Key Generation Strategy
```javascript
// Sort parameters for cache key consistency
generateKey('users:list', { page: 1, limit: 20 })
// Result: 'users:list:limit:20|page:1'
```
- Sorted parameters ensure same cache key for different query parameter orders
- Prevents duplicate cache entries
- Example: `?page=1&limit=20` and `?limit=20&page=1` use same cache

#### 3. TTL (Time-To-Live) Management
- Default: 3600 seconds (1 hour)
- Configurable per cache entry
- Automatic expiration reduces stale data
- Critical for frequently changing data (user profiles, inventory)

#### 4. Error Handling & Resilience
```javascript
async get(key) {
  if (!this.isConnected) return null;  // Fallback to DB
  try {
    // ... get logic
  } catch (error) {
    logger.error(...);
    return null;  // Don't crash on Redis error
  }
}
```
- Redis errors don't crash the application
- Graceful fallback to database
- Errors logged for monitoring

### Caching Patterns to Use

#### 1. Cache-Aside (Lazy Loading)
```javascript
// In route handler
const cached = await cacheService.get(key);
if (cached) return cached;

const data = await database.query();
await cacheService.set(key, data, ttl);
return data;
```
- Simple, doesn't require coordination
- Tolerates cache misses
- Best for read-heavy workloads

#### 2. Cache Invalidation Strategies
- **TTL expiration**: Automatic, eventual consistency
- **Manual deletion**: Use `cacheService.del(key)` after database updates
- **Flush all**: Use `cacheService.flush()` for cache clear-down
- **Pattern-based**: Could implement key pattern deletion

### Real-world Considerations

#### When to Cache
- Expensive database queries (joins, aggregations)
- Frequently accessed data (user profiles, product catalogs)
- Data that changes infrequently
- Read-heavy operations

#### When NOT to Cache
- Highly dynamic data (real-time feeds, stock prices)
- Large result sets (memory pressure)
- Sensitive data requiring immediate consistency
- Rarely accessed data (cache not hit, wastes memory)

#### Redis vs. In-Memory Caching
- **Redis**: Shared across multiple application instances, persistent options, larger capacity
- **In-Memory**: Simpler, faster, but isolated per instance, lost on restart

---

## Integration: Versioning + Rate Limiting + Caching

### Complete Flow
```
Request with version header
    ↓
API Versioning Middleware: Extract & validate version
    ↓
Rate Limiting Middleware: Check IP/API key limits
    ↓
Route Handler
    ↓
Check Cache: cacheService.get(key)
    ↓ (Hit)
Return cached response
    ↓ (Miss)
Database query
    ↓
Cache result: cacheService.set(key, data, ttl)
    ↓
Response sent
```

### Performance Impact
- Caching: 10-100x faster for cache hits
- Rate limiting: Minimal overhead (in-memory checks)
- Versioning: Negligible overhead (string matching)
- Combined: Dramatically improves throughput and user experience

---

## Production Considerations

### Monitoring & Observability
- Log all cache hits/misses (identify ineffective caching)
- Monitor rate limit violations (security threats)
- Track API version usage (plan for deprecation)
- Set alerts for Redis connection failures

### Security Implications
- Rate limiting: First defense against brute force and DDoS
- API versioning: Enables security patches on older versions
- Caching: Be careful not to cache sensitive data (passwords, tokens)

### Scaling Strategy
- Vertical scaling: Increase Redis memory for more caching
- Horizontal scaling: Use Redis cluster for multi-instance applications
- Database optimization: Complement, don't replace, good database design

---

## Lessons Learned

✅ **What Worked Well**
- Middleware-based architecture keeps concerns separated
- Tiered rate limiting provides granular control
- Redis integration with fallback prevents single points of failure
- Sorted cache keys prevent duplicate entries

⚠️ **Challenges & Solutions**
- Cache invalidation complexity → Use TTL + manual invalidation for critical updates
- Redis dependency → Built-in fallback to direct database queries
- Rate limit false positives → Implement whitelist for internal services
- Version proliferation → Maintain only 2 versions (current + previous)


