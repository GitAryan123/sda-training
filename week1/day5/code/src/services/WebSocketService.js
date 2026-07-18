class WebSocketService {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 2000,
      maxReconnectInterval: 30000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...options
    };
    this.ws = null;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.subscribers = new Map();
    this.messageQueue = [];
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      console.log(`%c[WebSocketService] CONNECTING: establishing connection to ${this.url}`, 'color: #3b82f6; font-weight: bold;');
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('%c[WebSocketService] CONNECTION ERROR: Instantiation failed.', 'color: #ef4444; font-weight: bold;', error);
      this.handleReconnect();
    }
  }

  setupEventListeners() {
    this.ws.onopen = () => {
      console.log('%c[WebSocketService] OPEN: connection established successfully.', 'color: #10b981; font-weight: bold;');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
      this.notifySubscribers('connected', null);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.warn('[WebSocketService] MESSAGE ERROR: Failed to parse event packet:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`%c[WebSocketService] CLOSE: Connection closed (Code: ${event.code}, Clean: ${event.wasClean})`, 'color: #ef4444; font-weight: bold;');
      this.isConnected = false;
      this.stopHeartbeat();
      this.notifySubscribers('disconnected', { code: event.code, reason: event.reason });

      // Auto-reconnect if closure was unexpected or dirty
      if (!event.wasClean || event.code !== 1000) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('%c[WebSocketService] ERROR: WebSocket channel failed.', 'color: #ef4444; font-weight: bold;', error);
      this.notifySubscribers('error', error);
    };
  }

  handleMessage(message) {
    const { type, payload } = message;

    if (type === 'pong') {
      console.log('%c[WebSocketService] HEARTBEAT: Pong received', 'color: #6b7280; font-size: 0.75rem;');
      return; // Heartbeat response
    }

    // Broadcast generic messages channel
    this.notifySubscribers('message', message);

    // Notify specific action/type channel subscribers
    if (this.subscribers.has(type)) {
      this.subscribers.get(type).forEach(callback => {
        try {
          callback(payload);
        } catch (e) {
          console.error(`[WebSocketService] Event channel '${type}' callback execution failed:`, e);
        }
      });
    }
  }

  send(data) {
    const serialized = JSON.stringify(data);
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serialized);
    } else {
      console.log('%c[WebSocketService] QUEUING: Offline message buffered in transmission queue.', 'color: #f59e0b;');
      this.messageQueue.push(data);
    }
  }

  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);

    return () => {
      if (this.subscribers.has(eventType)) {
        this.subscribers.get(eventType).delete(callback);
      }
    };
  }

  notifySubscribers(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[WebSocketService] Subscriber notification error for '${event}':`, e);
        }
      });
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('%c[WebSocketService] HEARTBEAT: Sending ping', 'color: #6b7280; font-size: 0.75rem;');
        this.send({ type: 'ping' });
      }
    }, this.options.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  processMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`%c[WebSocketService] QUEUE DUMP: sending ${this.messageQueue.length} buffered messages`, 'color: #10b981;');
    }
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('%c[WebSocketService] DISCONNECT: Maximum reconnect attempts reached.', 'color: #ef4444; font-weight: bold;');
      this.notifySubscribers('maxReconnectAttemptsReached', null);
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff with random jitter
    const backoffBase = this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    const backoffCapped = Math.min(this.options.maxReconnectInterval, backoffBase);
    const jitter = Math.random() * 1000 - 500; // +/- 500ms jitter
    const reconnectDelay = Math.max(0, backoffCapped + jitter);

    console.warn(`%c[WebSocketService] RECONNECT: Attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts}. Retrying in ${Math.round(reconnectDelay)}ms...`, 'color: #f59e0b; font-weight: bold;');
    
    setTimeout(() => {
      this.connect();
    }, reconnectDelay);
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected voluntarily');
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
    console.log('%c[WebSocketService] DISCONNECTED: Socket closed by client request.', 'color: #6b7280;');
  }

  getConnectionState() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      url: this.url
    };
  }
}

export default WebSocketService;
