class ApiService {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL || '';
    this.cache = new Map();
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 10000;
    this.subscribers = new Set();

    // Rate Limiting variables
    this.rateLimitLimit = options.rateLimitLimit || 10; // max 10 requests
    this.rateLimitWindow = options.rateLimitWindow || 5000; // in 5 seconds
    this.requestTimestamps = [];
  }

  checkRateLimit() {
    const now = Date.now();
    // Keep only timestamps within the window
    this.requestTimestamps = this.requestTimestamps.filter(
      time => now - time < this.rateLimitWindow
    );

    if (this.requestTimestamps.length >= this.rateLimitLimit) {
      console.warn('%c[ApiService] RATE LIMIT TRIGGERED: Request throttled to safeguard backend load.', 'color: #ef4444; font-weight: bold;');
      return false;
    }

    this.requestTimestamps.push(now);
    return true;
  }

  async request(endpoint, options = {}) {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${url}-${JSON.stringify(options)}`;

    // Check cache
    if (options.cache !== false && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      const ttl = options.cacheTTL || 300000; // 5 min default
      if (Date.now() - cached.timestamp < ttl) {
        console.log(`%c[ApiService] CACHE HIT: serving cached resource for ${endpoint}`, 'color: #10b981; font-weight: bold;');
        return cached.data;
      }
      this.cache.delete(cacheKey); // Evict expired item
    }

    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    };

    console.log(`%c[ApiService] FETCHING: ${config.method} -> ${endpoint}`, 'color: #3b82f6; font-weight: bold;');

    try {
      const response = await this.fetchWithRetry(url, config);
      const data = await response.json();

      // Cache successful responses
      if (options.cache !== false) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      this.notifySubscribers('success', { endpoint, data });
      return data;
    } catch (error) {
      console.error(`%c[ApiService] ERROR: Request failed for ${endpoint}`, 'color: #ef4444; font-weight: bold;', error);
      this.notifySubscribers('error', { endpoint, error: error.message });
      throw error;
    }
  }

  async fetchWithRetry(url, config, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        // Exponential backoff with jitter
        const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 200 - 100; // Jitter +/- 100ms
        const delayMs = Math.max(0, backoffDelay + jitter);

        console.warn(`%c[ApiService] RETRY: Attempt ${attempt} failed. Backing off for ${Math.round(delayMs)}ms...`, 'color: #f59e0b; font-weight: bold;');
        await this.delay(delayMs);
        return this.fetchWithRetry(url, config, attempt + 1);
      }
      throw error;
    }
  }

  shouldRetry(error) {
    // Retry on network abort timeouts, or gateway issues (500, 502, 503)
    return error.name === 'AbortError' || 
           error.message.includes('500') || 
           error.message.includes('502') || 
           error.message.includes('503') ||
           error.message.includes('Failed to fetch');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // CRUD operations
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  clearCache() {
    this.cache.clear();
    console.log('%c[ApiService] Cache cleared successfully.', 'color: #6b7280; font-style: italic;');
  }

  getCacheSize() {
    return this.cache.size;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (e) {
        console.error('[ApiService] Subscriber error:', e);
      }
    });
  }
}

export default ApiService;
