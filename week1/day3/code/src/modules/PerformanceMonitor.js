export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Set();
        this.init();
    }
    
    init() {
        this.observePerformance();
        this.observeMemory();
        this.observeUserInteractions();
    }
    
    observePerformance() {
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint (LCP)
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.recordMetric('LCP', lastEntry.startTime, 'ms (Load Speed)');
                }).observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {
                console.warn('LCP observation not supported', e);
            }
            
            // First Input Delay (FID)
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.recordMetric('FID', entry.processingStart - entry.startTime, 'ms (Input Delay)');
                    });
                }).observe({ type: 'first-input', buffered: true });
            } catch (e) {
                console.warn('FID observation not supported', e);
            }
            
            // Cumulative Layout Shift (CLS)
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            this.recordMetric('CLS', entry.value, ' (Layout Stability)');
                        }
                    });
                }).observe({ type: 'layout-shift', buffered: true });
            } catch (e) {
                console.warn('CLS observation not supported', e);
            }
        }
    }
    
    observeMemory() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                // Convert to MB for better readability
                const usedMB = memory.usedJSHeapSize / (1024 * 1024);
                const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
                
                this.recordMetric('Memory Used', usedMB, 'MB');
                this.recordMetric('Memory Limit', limitMB, 'MB');
            }, 5000);
        } else {
            // Fallback mock metric if memory object not exposed (e.g. Firefox)
            setInterval(() => {
                const mockedUsed = 15 + Math.random() * 10;
                this.recordMetric('Memory Used', mockedUsed, 'MB (Simulated)');
            }, 5000);
        }
    }
    
    observeUserInteractions() {
        let interactionCount = 0;
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionCount++;
                this.recordMetric('Interactions', interactionCount, 'events');
            }, { passive: true });
        });
    }
    
    recordApiLatency(endpoint, latency) {
        this.recordMetric(`Latency [${endpoint}]`, latency, 'ms');
    }
    
    recordError(type) {
        const currentCount = this.metrics.get(`Errors [${type}]`)?.value || 0;
        this.recordMetric(`Errors [${type}]`, currentCount + 1, 'errors occurred');
    }
    
    recordMetric(name, value, unit = '') {
        const timestamp = Date.now();
        const metric = { name, value, unit, timestamp };
        
        this.metrics.set(name, metric);
        this.notifyObservers(metric);
        this.storeMetric(metric);
    }
    
    getMetric(name) {
        return this.metrics.get(name);
    }
    
    getAllMetrics() {
        return Array.from(this.metrics.values());
    }
    
    subscribe(callback) {
        this.observers.add(callback);
        // Expose unsubscribe callback
        return () => this.observers.delete(callback);
    }
    
    notifyObservers(metric) {
        this.observers.forEach(callback => {
            try {
                callback(metric);
            } catch (err) {
                console.error('[PerformanceMonitor] Observer callback error:', err);
            }
        });
    }
    
    storeMetric(metric) {
        try {
            const stored = JSON.parse(localStorage.getItem('performance-metrics') || '[]');
            stored.push(metric);
            // Cap at 50 logs
            if (stored.length > 50) {
                stored.shift();
            }
            localStorage.setItem('performance-metrics', JSON.stringify(stored));
        } catch (e) {
            console.error('LocalStorage write failed:', e);
        }
    }
    
    getStoredMetrics() {
        try {
            return JSON.parse(localStorage.getItem('performance-metrics') || '[]');
        } catch (e) {
            return [];
        }
    }
}