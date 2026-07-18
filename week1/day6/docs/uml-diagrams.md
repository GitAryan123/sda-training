# UML Diagrams — Apex Telemetry Dashboard

> **Project:** SDA Training Week 1  
> **Scope:** Days 4 & 5 combined architecture diagrams

---

## 1. Component Dependency Graph

```mermaid
graph TD
  subgraph "Entry Point"
    MAIN["main.jsx"]
    APP["App.jsx"]
  end

  subgraph "Day 4 — Advanced React"
    DB["Dashboard.jsx"]
    DH["DashboardHeader.jsx"]
    MG["MetricsGrid.jsx"]
    CS["ChartSection.jsx"]
    PL["PerformanceLog.jsx"]
    CTX["DataContext.jsx (Context)"]
    UDF["useDataFetching.js"]
    UPF["usePerformance.js"]
    UFL["useFilters.js"]
  end

  subgraph "Day 5 — API + Real-Time"
    RTD["RealTimeDashboard.jsx"]
    MC["MetricsCard.jsx"]
    CC["ChartContainer.jsx"]
    CSTS["ConnectionStatus.jsx"]
    URTD["useRealTimeData.js"]
    UAS["useApiService.js"]
    UWS["useWebSocket.js"]
    APIS["ApiService.js"]
    WSSS["WebSocketService.js"]
  end

  MAIN --> APP
  APP --> DB
  APP --> RTD

  DB --> DH
  DB --> MG
  DB --> CS
  DB --> PL
  DB --> CTX

  CTX --> UDF
  DB --> UFL
  PL --> UPF

  RTD --> MC
  RTD --> CC
  RTD --> CSTS
  RTD --> URTD
  RTD --> UPF

  URTD --> UAS
  URTD --> UWS
  UAS --> APIS
  UWS --> WSSS
```

---

## 2. Data Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant RTD as RealTimeDashboard
    participant URTD as useRealTimeData
    participant API as ApiService
    participant WS as WebSocketService
    participant MOCK as Mock Data Generator

    U->>RTD: Page Load
    RTD->>URTD: mount with /revenue, /users, /orders
    URTD->>API: get(endpoint)
    API->>API: checkRateLimit()
    alt Cache Hit
        API-->>URTD: return cached data
    else Cache Miss
        API->>API: fetchWithRetry(url)
        alt Fetch Success
            API-->>URTD: return fresh data
        else Fetch Fails (offline)
            URTD->>MOCK: getMockFallbackData()
            MOCK-->>URTD: return mock telemetry
        end
    end
    URTD-->>RTD: { data, loading:false, latency }
    RTD-->>U: Render metrics + charts

    RTD->>WS: connect() [if enableRealTime]
    WS-->>RTD: onopen → isConnected=true
    
    loop Every 30s
        WS->>WS: send({ type: 'ping' })
    end
    
    loop Every 4s (simulation)
        URTD->>URTD: generate delta update
        URTD-->>RTD: setData() with new values
        RTD-->>U: Live chart update
    end
```

---

## 3. WebSocket Reconnection State Machine

```mermaid
stateDiagram-v2
    [*] --> IDLE

    IDLE --> CONNECTING: connect() called
    CONNECTING --> OPEN: ws.onopen fires
    CONNECTING --> DISCONNECTED: ws.onerror fires

    OPEN --> DISCONNECTED: ws.onclose (dirty)
    OPEN --> IDLE: ws.close(1000) manual disconnect

    DISCONNECTED --> RECONNECTING: attempts < maxAttempts
    RECONNECTING --> CONNECTING: setTimeout(reconnect, backoff+jitter)
    DISCONNECTED --> FAILED: attempts >= maxAttempts

    FAILED --> [*]: notifySubscribers('maxReconnectAttemptsReached')
    IDLE --> [*]: disconnect() called
```

---

## 4. ApiService Cache & Retry Class Diagram

```mermaid
classDiagram
    class ApiService {
        +String baseURL
        +Map cache
        +Number retryAttempts
        +Number retryDelay
        +Number timeout
        +Set subscribers
        +Number rateLimitLimit
        +Number rateLimitWindow
        +Array requestTimestamps
        +checkRateLimit() Boolean
        +request(endpoint, options) Promise
        +fetchWithRetry(url, config, attempt) Promise
        +shouldRetry(error) Boolean
        +delay(ms) Promise
        +get(endpoint, options) Promise
        +post(endpoint, data, options) Promise
        +put(endpoint, data, options) Promise
        +delete(endpoint, options) Promise
        +clearCache() void
        +getCacheSize() Number
        +subscribe(callback) Function
        +notifySubscribers(event, data) void
    }

    class WebSocketService {
        +String url
        +Object options
        +WebSocket ws
        +Number reconnectAttempts
        +Number heartbeatTimer
        +Map subscribers
        +Array messageQueue
        +Boolean isConnected
        +connect() void
        +setupEventListeners() void
        +handleMessage(data) void
        +send(data) void
        +subscribe(eventType, callback) Function
        +notifySubscribers(event, data) void
        +startHeartbeat() void
        +stopHeartbeat() void
        +processMessageQueue() void
        +handleReconnect() void
        +disconnect() void
        +getConnectionState() Object
    }

    class useRealTimeData {
        +state data
        +state loading
        +state error
        +state isConnected
        +state latency
        +ref lastUpdateRef
        +fetchInitialData() void
        +refresh() void
        +getLastUpdate() Number
    }

    useRealTimeData --> ApiService : uses singleton
    useRealTimeData --> WebSocketService : subscribes to events
```

---

## 5. Sprint Burndown Chart (ASCII)

```
Story Points Remaining
58 │█
54 │  █
50 │     █
45 │       █
38 │          █
30 │             █
20 │                █
12 │                   █
 5 │                      █
 0 │                         ●
   └─────────────────────────────
   Day1 Day2 Day3 Day4 Day5 Day6 Day7  (Sprint Timeline)
   
   █ = Actual Burndown   ● = Sprint Complete
```
