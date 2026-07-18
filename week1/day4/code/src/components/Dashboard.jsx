import React, { useState, useEffect, useContext, useReducer } from 'react';
import { DataContext } from '../context/DataContext';
import { DashboardHeader } from './DashboardHeader';
import { MetricsGrid } from './MetricsGrid';
import { ChartContainer } from './ChartContainer';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ErrorBoundary } from './ErrorBoundary';
import './Dashboard.css';

const initialState = {
  loading: false,
  error: null,
  data: {
    users: { labels: [], values: [] },
    revenue: { labels: [], values: [] },
    orders: { labels: [], values: [] }
  },
  filters: {
    dateRange: '30d',
    category: 'all'
  }
};

function dataReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_DATA':
      return { ...state, data: action.payload, loading: false, error: null };
    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function Dashboard() {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [viewMode, setViewMode] = useState('grid');
  
  const { fetchData, subscribe } = useContext(DataContext);

  const loadData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const [users, revenue, orders] = await Promise.all([
        fetchData('/users'),
        fetchData('/revenue'),
        fetchData('/orders')
      ]);
      
      dispatch({
        type: 'SET_DATA',
        payload: { users, revenue, orders }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  useEffect(() => {
    loadData();
  }, [fetchData]);

  useEffect(() => {
    const handleDataUpdate = (endpoint, updatedData) => {
      const key = endpoint.split('/').pop(); // 'users', 'revenue', or 'orders'
      dispatch({
        type: 'SET_DATA',
        payload: { ...state.data, [key]: updatedData }
      });
    };

    const unsubscribeFn = subscribe(handleDataUpdate);
    return unsubscribeFn;
  }, [subscribe, state.data]);

  const handleFilterChange = (filterType, value) => {
    dispatch({
      type: 'UPDATE_FILTERS',
      payload: { [filterType]: value }
    });
  };

  if (state.loading) {
    return <LoadingSpinner />;
  }

  if (state.error) {
    return <ErrorMessage error={state.error} onRetry={loadData} />;
  }

  return (
    <ErrorBoundary>
      <div className="dashboard">
        <DashboardHeader
          filters={state.filters}
          onFilterChange={handleFilterChange}
          onRefresh={loadData}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        <div className={`dashboard-content ${viewMode}`}>
          <MetricsGrid data={state.data} />
          
          <div className="charts-section">
            <ChartContainer
              data={state.data}
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
            />
          </div>
          
          <PerformanceMonitor />
        </div>
      </div>
    </ErrorBoundary>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading telemetry data...</p>
    </div>
  );
}

function ErrorMessage({ error, onRetry }) {
  return (
    <div className="error-container">
      <h2>Error Loading Dashboard</h2>
      <p>{error}</p>
      <button onClick={onRetry} className="btn btn-primary" style={{ marginTop: '1rem' }}>
        Try Again
      </button>
    </div>
  );
}