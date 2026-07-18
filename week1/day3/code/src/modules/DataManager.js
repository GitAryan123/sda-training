export class DataManager {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.cache = new Map();
        this.subscribers = new Set();
        this.cacheDuration = 30000; // 30 seconds cache TTL
    }
    
    async fetchData(endpoint, options = {}) {
        const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
        const now = Date.now();
        
        // 1. Check Cache Validity
        if (this.cache.has(cacheKey)) {
            const cachedItem = this.cache.get(cacheKey);
            if (now - cachedItem.timestamp < this.cacheDuration) {
                console.log(`[DataManager] Cache hit for ${endpoint}`);
                return cachedItem.data;
            }
            console.log(`[DataManager] Cache expired for ${endpoint}`);
            this.cache.delete(cacheKey);
        }
        
        const startTime = performance.now();
        console.log(`[DataManager] Fetching data for ${endpoint}...`);
        
        try {
            // Attempt actual fetch
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error status: ${response.status}`);
            }
            
            const data = await response.json();
            const latency = performance.now() - startTime;
            
            this.saveToCache(cacheKey, data);
            this.notifySubscribers(endpoint, data, latency);
            return data;
            
        } catch (error) {
            // 2. Intercept and fallback to dynamic mockup telemetry
            console.warn(`[DataManager] Fetch failed for ${endpoint}. Intercepting with mock telemetry data.`, error);
            
            // Simulate network latency (100-350ms delay)
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 250));
            
            const mockData = this.generateMockData(endpoint);
            const latency = performance.now() - startTime;
            
            this.saveToCache(cacheKey, mockData);
            this.notifySubscribers(endpoint, mockData, latency);
            return mockData;
        }
    }
    
    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    generateMockData(endpoint) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        if (endpoint.includes('users')) {
            return {
                labels: days,
                values: days.map(() => Math.floor(100 + Math.random() * 250))
            };
        } else if (endpoint.includes('revenue')) {
            return {
                labels: days,
                values: days.map(() => Math.floor(3000 + Math.random() * 6000))
            };
        } else if (endpoint.includes('orders')) {
            const completed = Math.floor(150 + Math.random() * 200);
            const pending = Math.floor(20 + Math.random() * 50);
            const cancelled = Math.floor(5 + Math.random() * 15);
            return {
                labels: ['Completed', 'Pending', 'Cancelled'],
                values: [completed, pending, cancelled]
            };
        }
        
        // Default fallback
        return { labels: [], values: [] };
    }
    
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    
    notifySubscribers(endpoint, data, latency) {
        this.subscribers.forEach(callback => {
            try {
                callback(endpoint, data, latency);
            } catch (err) {
                console.error('[DataManager] Subscriber callback error:', err);
            }
        });
    }
    
    clearCache() {
        this.cache.clear();
        console.log('[DataManager] Cache cleared');
    }
}