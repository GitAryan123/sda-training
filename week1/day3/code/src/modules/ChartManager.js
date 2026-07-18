export class ChartManager {
    constructor(containerId, dataManager) {
        this.container = document.getElementById(containerId);
        this.dataManager = dataManager;
        this.charts = new Map();
        
        // Colors mapping to design system
        this.colors = {
            indigo: '#4f46e5',
            indigoLight: 'rgba(79, 70, 229, 0.1)',
            emerald: '#10b981',
            emeraldLight: 'rgba(16, 185, 129, 0.1)',
            violet: '#7c3aed',
            violetLight: 'rgba(124, 58, 237, 0.1)',
            amber: '#f59e0b',
            amberLight: 'rgba(245, 158, 11, 0.1)',
            coral: '#ff6b6b'
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadChartLibrary();
            this.setupGlobalConfig();
            this.setupEventListeners();
            await this.createCharts();
        } catch (error) {
            console.error('[ChartManager] Init failed:', error);
            this.showError(`Failed to load Chart.js library: ${error.message} <br> <pre style="font-size:10px; text-align:left; max-height:150px; overflow:auto;">${error.stack}</pre>`);
        }
    }
    
    loadChartLibrary() {
        return new Promise((resolve, reject) => {
            if (window.Chart) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'src/modules/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupGlobalConfig() {
        // Set standard styling values for Chart.js
        Chart.defaults.font.family = "'Outfit', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#64748b'; // slate-500
        Chart.defaults.plugins.tooltip.backgroundColor = '#1e293b'; // slate-800
        Chart.defaults.plugins.tooltip.titleFont = { weight: '600' };
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 6;
    }
    
    async createCharts() {
        try {
            const [userData, revenueData, orderData] = await Promise.all([
                this.dataManager.fetchData('/api/users'),
                this.dataManager.fetchData('/api/revenue'),
                this.dataManager.fetchData('/api/orders')
            ]);
            
            this.createLineChart('revenueChart', revenueData);
            this.createBarChart('userChart', userData);
            this.createDoughnutChart('orderChart', orderData);
            this.createMixedChart('performanceChart', { userData, revenueData, orderData });
            
        } catch (error) {
            console.error('[ChartManager] Failed to load data:', error);
            this.showError(`Failed to load dashboard chart datasets: ${error.message} <br> <pre style="font-size:10px; text-align:left; max-height:150px; overflow:auto;">${error.stack}</pre>`);
        }
    }
    
    createLineChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts.has(canvasId)) {
            this.charts.get(canvasId).destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: data.values,
                    borderColor: this.colors.indigo,
                    backgroundColor: this.colors.indigoLight,
                    tension: 0.35,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: this.colors.indigo,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        grid: { color: 'rgba(226, 232, 240, 0.4)' },
                        border: { dash: [4, 4] }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
        
        this.charts.set(canvasId, chart);
    }
    
    createBarChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts.has(canvasId)) {
            this.charts.get(canvasId).destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'New Registrations',
                    data: data.values,
                    backgroundColor: this.colors.emerald,
                    borderRadius: 6,
                    maxBarThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(226, 232, 240, 0.4)' } },
                    x: { grid: { display: false } }
                }
            }
        });
        
        this.charts.set(canvasId, chart);
    }
    
    createDoughnutChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts.has(canvasId)) {
            this.charts.get(canvasId).destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [this.colors.indigo, this.colors.amber, this.colors.coral],
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 15 }
                    }
                },
                cutout: '65%'
            }
        });
        
        this.charts.set(canvasId, chart);
    }
    
    createMixedChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts.has(canvasId)) {
            this.charts.get(canvasId).destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.userData.labels,
                datasets: [
                    {
                        label: 'Accounts',
                        type: 'bar',
                        data: data.userData.values,
                        backgroundColor: 'rgba(124, 58, 237, 0.7)',
                        borderRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Revenue Trend',
                        type: 'line',
                        data: data.revenueData.values,
                        borderColor: this.colors.indigo,
                        borderWidth: 3,
                        pointRadius: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: 'rgba(226, 232, 240, 0.4)' }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
        
        this.charts.set(canvasId, chart);
    }
    
    setupEventListeners() {
        this.dataManager.subscribe((endpoint, data) => {
            console.log(`[ChartManager] Recieved update for ${endpoint}`);
            this.updateCharts(endpoint, data);
        });
        
        window.addEventListener('resize', this.debounce(() => {
            this.charts.forEach(chart => chart.resize());
        }, 200));
    }
    
    updateCharts(endpoint, data) {
        if (endpoint.includes('users')) {
            this.updateChart('userChart', data);
        } else if (endpoint.includes('revenue')) {
            this.updateChart('revenueChart', data);
        } else if (endpoint.includes('orders')) {
            this.updateChart('orderChart', data);
        }
    }
    
    updateChart(chartId, data) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.data.datasets[0].data = data.values;
            chart.data.labels = data.labels;
            chart.update();
        }
    }
    
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="chart-error-banner">
                    <span class="warning-icon">⚠</span>
                    <h4>Visualizations Error</h4>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}
