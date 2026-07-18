import React, { useState, useMemo } from 'react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { usePerformance } from '../hooks/usePerformance';
import { MetricsCard } from './MetricsCard';
import { ChartContainer } from './ChartContainer';
import { ConnectionStatus } from './ConnectionStatus';
import './RealTimeDashboard.css';

export function RealTimeDashboard() {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [enableRealTime, setEnableRealTime] = useState(true);

  // Load telemetry feeds
  const {
    data: revenueData,
    loading: revenueLoading,
    error: revenueError,
    isConnected: revenueConnected,
    latency: revenueLatency,
    refresh: refreshRevenue
  } = useRealTimeData('/revenue', { enableRealTime });

  const {
    data: userData,
    loading: userLoading,
    error: userError,
    isConnected: userConnected,
    latency: userLatency,
    refresh: refreshUsers
  } = useRealTimeData('/users', { enableRealTime });

  const {
    data: orderData,
    loading: orderLoading,
    error: orderError,
    isConnected: orderConnected,
    latency: orderLatency,
    refresh: refreshOrders
  } = useRealTimeData('/orders', { enableRealTime });

  // Load Web Vitals Performance
  const perfMetrics = usePerformance();

  const handleRefreshAll = () => {
    refreshRevenue();
    refreshUsers();
    refreshOrders();
  };

  const handleReconnectAll = () => {
    // Re-establish sockets by resetting enable flag briefly
    setEnableRealTime(false);
    setTimeout(() => setEnableRealTime(true), 200);
  };

  // Compute overall connection state and average roundtrip latency
  const connectionState = useMemo(() => {
    const connections = [revenueConnected, userConnected, orderConnected];
    const connectedCount = connections.filter(Boolean).length;
    
    let status = 'disconnected';
    if (connectedCount === connections.length) status = 'connected';
    else if (connectedCount > 0) status = 'partial';

    const latencies = [revenueLatency, userLatency, orderLatency].filter(val => val > 0);
    const avgLatency = latencies.length > 0 
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) 
      : 0;

    return { status, avgLatency };
  }, [revenueConnected, userConnected, orderConnected, revenueLatency, userLatency, orderLatency]);

  const dashboardData = useMemo(() => {
    return {
      revenue: revenueData || { labels: [], values: [] },
      users: userData || { labels: [], values: [] },
      orders: orderData || { labels: [], values: [] }
    };
  }, [revenueData, userData, orderData]);

  if (revenueLoading && userLoading && orderLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="real-time-dashboard">
      <div className="dashboard-header-controls">
        <div className="header-actions">
          <div className="dashboard-header-title">
            <h2>Apex Live Telemetry</h2>
            <p className="subtitle">Real-time WebSocket & REST synchronization</p>
          </div>
          
          <div className="filter-group">
            <ConnectionStatus 
              status={connectionState.status} 
              latency={connectionState.avgLatency}
              onReconnect={handleReconnectAll}
            />
            
            <button 
              className="btn btn-primary"
              onClick={handleRefreshAll}
              disabled={revenueLoading || userLoading || orderLoading}
            >
              Refresh All
            </button>
            
            <label className="auto-refresh-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enableRealTime}
                onChange={(e) => setEnableRealTime(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Live Sync
            </label>
          </div>
        </div>
      </div>

      <div className="dashboard-content grid">
        <div className="metrics-grid-container">
          <MetricsCard
            title="Revenue Analytics"
            value={revenueData ? `$${revenueData.total.toLocaleString()}` : '0'}
            change={revenueData ? revenueData.change : 0}
            loading={revenueLoading}
            error={revenueError}
            icon="💵"
          />
          <MetricsCard
            title="Total Registrations"
            value={userData ? userData.total : 0}
            change={userData ? userData.change : 0}
            loading={userLoading}
            error={userError}
            icon="👤"
          />
          <MetricsCard
            title="Total Orders"
            value={orderData ? orderData.total : 0}
            change={orderData ? orderData.change : 0}
            loading={orderLoading}
            error={orderError}
            icon="📦"
          />
        </div>

        <div className="charts-section" style={{ gridColumn: 'span 1' }}>
          <ChartContainer
            data={dashboardData}
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
          />
        </div>

        <div className="performance-panel-react" style={{ gridColumn: 'span 1' }}>
          <div className="panel-header">
            <h3>Web Vitals Telemetry</h3>
            <span className="active-dot"></span>
          </div>
          <div className="metrics-list">
            <div className="metric-item">
              <div className="metric-info">
                <span className="metric-name">Largest Contentful Paint (LCP)</span>
                <span className="metric-time">First paint rendering threshold</span>
              </div>
              <span className="metric-badge">{perfMetrics.loadTime} ms</span>
            </div>
            <div className="metric-item">
              <div className="metric-info">
                <span className="metric-name">First Paint (FP)</span>
                <span className="metric-time">First browser pixel change</span>
              </div>
              <span className="metric-badge">{perfMetrics.firstPaint} ms</span>
            </div>
            <div className="metric-item">
              <div className="metric-info">
                <span className="metric-name">DOMContentLoaded</span>
                <span className="metric-time">DOM elements parsing timing</span>
              </div>
              <span className="metric-badge">{perfMetrics.domContentLoaded} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-container" style={{ padding: '5rem 0', textAlign: 'center', color: '#64748b' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ fontWeight: 550 }}>Initializing live telemetry feeds...</p>
    </div>
  );
}