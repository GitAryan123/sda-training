import React, { createContext, useContext, useReducer, useCallback } from 'react';

const DataContext = createContext();

const cacheDuration = 30000; // 30 seconds cache TTL

const initialState = {
  cache: new Map(),
  subscribers: new Set(),
  loading: false,
  error: null
};

function dataContextReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CACHE_DATA':
      const newCache = new Map(state.cache);
      newCache.set(action.key, {
        data: action.data,
        timestamp: Date.now()
      });
      return { ...state, cache: newCache, loading: false, error: null };
    case 'CLEAR_CACHE':
      return { ...state, cache: new Map() };
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataContextReducer, initialState);

  const generateMockData = useCallback((endpoint) => {
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
    
    return { labels: [], values: [] };
  }, []);

  const fetchData = useCallback(async (endpoint, options = {}) => {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
    const now = Date.now();
    
    // 1. Check Cache Validity
    if (state.cache.has(cacheKey)) {
      const cachedItem = state.cache.get(cacheKey);
      if (now - cachedItem.timestamp < cacheDuration) {
        console.log(`[DataContext] Cache hit for ${endpoint}`);
        return cachedItem.data;
      }
      console.log(`[DataContext] Cache expired for ${endpoint}`);
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    const startTime = performance.now();
    
    try {
      const response = await fetch(`/api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const latency = performance.now() - startTime;
      
      dispatch({ type: 'CACHE_DATA', key: cacheKey, data });
      
      // Notify active subscribers
      state.subscribers.forEach(callback => {
        try {
          callback(endpoint, data, latency);
        } catch (e) {
          console.error('[DataContext] Subscriber error:', e);
        }
      });
      
      return data;
    } catch (error) {
      console.warn(`[DataContext] Fetch failed for ${endpoint}. Intercepting with mock telemetry data.`, error);
      
      // Simulate network latency (100-350ms delay)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 250));
      
      const mockData = generateMockData(endpoint);
      const latency = performance.now() - startTime;
      
      dispatch({ type: 'CACHE_DATA', key: cacheKey, data: mockData });
      
      // Notify active subscribers
      state.subscribers.forEach(callback => {
        try {
          callback(endpoint, mockData, latency);
        } catch (e) {
          console.error('[DataContext] Subscriber error:', e);
        }
      });
      
      return mockData;
    }
  }, [state.cache, state.subscribers, generateMockData]);

  const subscribe = useCallback((callback) => {
    state.subscribers.add(callback);
    return () => state.subscribers.delete(callback);
  }, [state.subscribers]);

  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, []);

  const value = {
    fetchData,
    subscribe,
    clearCache,
    loading: state.loading,
    error: state.error
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}

export { DataContext };