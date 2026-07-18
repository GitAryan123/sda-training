# API Integration & Real-Time Data Guide - Day 5

This guide details the custom API service layer, connection safety models, and real-time subscription routines created for the Day 5 Telemetry Dashboard.

## 1. REST API Caching & Safety Layer (`ApiService.js`)
To safeguard server performance and optimize bundle bandwidth, the API service layer houses two core components:
- **Response Caching map**: GET queries are cached using a Map. They expire automatically after a set TTL duration (default 5 minutes). Duplicate queries bypass fetch routines entirely.
- **Exponential Retry Backoff with Jitter**: If a request aborts or server errors (500, 502, 503) occur, the client backs off and retries:
  $$\text{Delay} = \text{retryDelay} \times 2^{\text{attempt} - 1} \pm \text{jitter (100ms)}$$
  The randomized jitter prevents thundering herd requests on recovering servers.
- **Rate Limit Window Throttler**: The client tracks its own request timestamps. If requests exceed 10 actions within a 5-second window, outgoing fetches are throttled.

## 2. WebSocket Reconnection & Offline Queue (`WebSocketService.js`)
The WebSocket connection manager ensures absolute consistency during network drops:
- **Heartbeat Checks**: Sends periodic ping packets (every 30s) and expects a pong. If pongs cease, it closes the socket and triggers reconnection.
- **Jittered Backoff Reconnection**: Reconnection attempts double their timeouts progressively (up to 30s) with added random jitter.
- **Offline Message Buffer**: If `send()` is invoked when offline, messages are pushed to a queue. Upon socket opening, the queue is completely processed and emitted.

## 3. Real-Time Telemetry Hook (`useRealTimeData.js`)
The custom hook coordinates synchronization:
1. **REST Initial Fetch**: Fetches baseline historical metrics. On fetch failures, it falls back to generating randomized mock packages.
2. **WebSocket Stream Subscription**: Registers to messages on the socket. When `dataUpdate` events match the target endpoint, local state values update.
3. **Local Telemetry Simulation**: If the websocket server is offline/mocked, a local timer updates values periodically to verify UI chart transitions.
4. **Latency Measurement**: Calculates time differences (RTT) on telemetry ticks.
