import { useMemo } from 'react';
import WebSocketService from '../services/WebSocketService';

// Keep a map of socket instances keyed by URL to share connections
const wsInstances = new Map();

export function useWebSocket(url) {
  return useMemo(() => {
    const wsUrl = url || 'ws://localhost:5173/ws';
    if (!wsInstances.has(wsUrl)) {
      wsInstances.set(wsUrl, new WebSocketService(wsUrl));
    }
    return wsInstances.get(wsUrl);
  }, [url]);
}
