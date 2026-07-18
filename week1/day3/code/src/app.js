import { DataManager } from './modules/DataManager.js';
import { ChartManager } from './modules/ChartManager.js';
import { PerformanceMonitor } from './modules/PerformanceMonitor.js';

class DashboardApp {
    constructor() {
        this.dataManager = new DataManager('/api');
        this.chartManager = null;
        this.performanceMonitor = new PerformanceMonitor();
        this.init();
    }
    
    async init() {
        try {
            await this.setupUI();
            await this.initializeCharts();
            this.setupEventListeners();
            this.startPerformanceMonitoring();
            console.log('[DashboardApp] System loaded successfully');
        } catch (error) {
            console.error('[DashboardApp] Initialization failed:', error);
            this.showError('Critical failure: Could not load Dashboard system.');
        }
    }
    
    async setupUI() {
        const dashboardHTML = `
            <div class="dashboard-container">
                <!-- Action bar -->
                <div class="control-actions">
                    <button id="btn-refresh" class="btn btn-primary">↻ Refresh Telemetry</button>
                    <button id="btn-clear-cache" class="btn btn-secondary">⚡ Clear Cache</button>
                    <button id="btn-clear-logs" class="btn btn-secondary">🗑 Clear Logs</button>
                </div>
                
                <div class="layout-grid">
                    <!-- Charts Panel -->
                    <div class="charts-grid" id="charts-container">
                        <div class="chart-wrapper">
                            <h3>Revenue Analytics</h3>
                            <div class="canvas-container">
                                <canvas id="revenueChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-wrapper">
                            <h3>User Registrations</h3>
                            <div class="canvas-container">
                                <canvas id="userChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-wrapper">
                            <h3>Order Status Breakdown</h3>
                            <div class="canvas-container">
                                <canvas id="orderChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-wrapper">
                            <h3>Accounts & Revenue Performance</h3>
                            <div class="canvas-container">
                                <canvas id="performanceChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Performance Panel -->
                    <div class="performance-panel">
                        <div class="panel-header">
                            <h3>Telemetry & Performance Log</h3>
                            <span class="active-dot"></span>
                        </div>
                        <div class="metrics-list" id="performance-metrics">
                            <div class="empty-state">Waiting for observer events...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.querySelector('.content');
        if (container) {
            container.innerHTML = dashboardHTML;
        } else {
            throw new Error('No root content element found');
        }
    }
    
    async initializeCharts() {
        this.chartManager = new ChartManager('charts-container', this.dataManager);
    }
    
    setupEventListeners() {
        // Refresh Button
        const refreshBtn = document.getElementById('btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.disabled = true;
                const originalText = refreshBtn.textContent;
                refreshBtn.textContent = 'Syncing...';
                
                try {
                    this.dataManager.clearCache();
                    await this.chartManager.createCharts();
                } catch (e) {
                    this.performanceMonitor.recordError('refresh');
                } finally {
                    refreshBtn.textContent = originalText;
                    refreshBtn.disabled = false;
                }
            });
        }
        
        // Clear Cache Button
        const clearCacheBtn = document.getElementById('btn-clear-cache');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.dataManager.clearCache();
                this.updatePerformanceDisplay({
                    name: 'Cache Action',
                    value: 0,
                    unit: 'Cache Cleared',
                    timestamp: Date.now()
                });
            });
        }
        
        // Clear Logs Button
        const clearLogsBtn = document.getElementById('btn-clear-logs');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                const logsList = document.getElementById('performance-metrics');
                if (logsList) {
                    logsList.innerHTML = '<div class="empty-state">Logs cleared.</div>';
                }
            });
        }
    }
    
    startPerformanceMonitoring() {
        // Observe performance events
        this.performanceMonitor.subscribe((metric) => {
            this.updatePerformanceDisplay(metric);
        });
        
        // Expose data fetching delay telemetry to performance panel
        this.dataManager.subscribe((endpoint, data, latency) => {
            this.performanceMonitor.recordApiLatency(endpoint, latency);
        });
    }
    
    updatePerformanceDisplay(metric) {
        const container = document.getElementById('performance-metrics');
        if (!container) return;
        
        // Remove empty state if present
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
        
        const metricElement = document.createElement('div');
        metricElement.className = 'metric-item';
        
        // Format value based on type
        let formattedValue = '';
        if (typeof metric.value === 'number') {
            formattedValue = metric.value.toFixed(2);
        } else {
            formattedValue = metric.value;
        }
        
        const timeStr = new Date(metric.timestamp).toLocaleTimeString();
        
        metricElement.innerHTML = `
            <div class="metric-info">
                <span class="metric-name">${metric.name}</span>
                <span class="metric-time">${timeStr}</span>
            </div>
            <div class="metric-badge">
                ${formattedValue} ${metric.unit}
            </div>
        `;
        
        // Slide-in effect
        metricElement.style.opacity = '0';
        metricElement.style.transform = 'translateY(10px)';
        metricElement.style.transition = 'all 0.3s ease';
        
        container.insertBefore(metricElement, container.firstChild);
        
        setTimeout(() => {
            metricElement.style.opacity = '1';
            metricElement.style.transform = 'translateY(0)';
        }, 30);
        
        // Limit log display to 15 items
        const items = container.querySelectorAll('.metric-item');
        if (items.length > 15) {
            items[items.length - 1].remove();
        }
    }
    
    showError(message) {
        const container = document.querySelector('.content');
        if (container) {
            container.innerHTML = `
                <div class="app-error-state">
                    <h3>Dashboard System Failure</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Reload Dashboard</button>
                </div>
            `;
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new DashboardApp();
});