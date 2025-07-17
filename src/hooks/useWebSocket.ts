// hooks/useWebSocket.tsx
import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  roomId?: string; // Changed from fileName
  content?: string;
  isInitialLoad?: boolean;
  isResponse?: boolean;
  senderId?: string;
  clientId?: string;
  timestamp?: number;
  subscriberCount?: number;
  message?: string;
  output?: string;
  error?: string;
  exitCode?: number;
  language?: string;
}

export const useWebSocket = (url: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected" | "error" | "failed">("disconnected");
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const clientIdRef = useRef(`client-${Math.random().toString(36).substring(2, 9)}`);
  const messageHandlersRef = useRef<((event: MessageEvent) => void)[]>([]);
  const connectionTimeRef = useRef<number | null>(null);

  const debugLog = useCallback((message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] useWebSocket: ${message}`);
    if (data) console.log(`[${timestamp}] useWebSocket Data:`, data);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      debugLog('Connection attempt blocked');
      return;
    }

    isConnectingRef.current = true;
    setWsStatus("connecting");
    connectionTimeRef.current = Date.now();

    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }

    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        const connectionTime = Date.now() - (connectionTimeRef.current || 0);
        debugLog(`Connected in ${connectionTime}ms`);
        setWsStatus("connected");
        reconnectAttemptRef.current = 0;
        isConnectingRef.current = false;
        processQueue();
      };

      socket.onerror = (error) => {
        debugLog('WebSocket error:', error);
        setWsStatus("error");
        isConnectingRef.current = false;
      };

      socket.onclose = (event) => {
        debugLog('WebSocket closed:', { code: event.code, reason: event.reason });
        setWsStatus("disconnected");
        wsRef.current = null;
        isConnectingRef.current = false;

        if (!event.wasClean && reconnectAttemptRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptRef.current), 10000);
          debugLog(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptRef.current >= maxReconnectAttempts) {
          setWsStatus("failed");
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          debugLog('Received message:', { type: data.type });
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(event);
            } catch (error) {
              debugLog('Error in handler:', error);
            }
          });
        } catch (error) {
          debugLog('Error processing message:', error);
        }
      };
    } catch (error) {
      debugLog('Error creating WebSocket:', error);
      setWsStatus("error");
      isConnectingRef.current = false;
    }
  }, [url, debugLog]);

  const processQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0 || wsRef.current?.readyState !== WebSocket.OPEN) return;
    debugLog(`Processing ${messageQueueRef.current.length} queued messages`);
    while (messageQueueRef.current.length > 0) {
      const message = messageQueueRef.current.shift();
      try {
        wsRef.current?.send(JSON.stringify(message));
        debugLog('Sent queued message:', message);
      } catch (error) {
        debugLog('Error sending queued message:', error);
      }
    }
  }, [debugLog]);

  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    const messageWithMeta = { ...message, clientId: clientIdRef.current, timestamp: Date.now() };
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(messageWithMeta));
        debugLog('Message sent:', messageWithMeta);
        return true;
      } catch (error) {
        debugLog('Error sending message:', error);
        return false;
      }
    }
    debugLog('Queuing message, WebSocket not ready');
    messageQueueRef.current.push(messageWithMeta);
    if (wsStatus === "disconnected" || wsStatus === "failed") connectWebSocket();
    return false;
  }, [wsStatus, connectWebSocket, debugLog]);

  const addMessageHandler = useCallback((handler: (event: MessageEvent) => void) => {
    messageHandlersRef.current.push(handler);
    return () => {
      messageHandlersRef.current = messageHandlersRef.current.filter(h => h !== handler);
    };
  }, [debugLog]);

  const manualReconnect = useCallback(() => {
    debugLog('Manual reconnect');
    reconnectAttemptRef.current = 0;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) wsRef.current.close(1000, 'Manual reconnect');
    setWsStatus("disconnected");
    setTimeout(connectWebSocket, 100);
  }, [connectWebSocket, debugLog]);

  const getConnectionInfo = useCallback(() => ({
    status: wsStatus,
    clientId: clientIdRef.current,
    queuedMessages: messageQueueRef.current.length,
    handlers: messageHandlersRef.current.length,
    reconnectAttempts: reconnectAttemptRef.current,
    readyState: wsRef.current?.readyState,
    url: wsRef.current?.url,
  }), [wsStatus]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close(1000, 'Component unmounting');
      messageQueueRef.current = [];
      messageHandlersRef.current = [];
    };
  }, [connectWebSocket]);

  useEffect(() => {
    debugLog(`Status changed: ${wsStatus}`);
  }, [wsStatus, debugLog]);

  return { wsStatus, sendMessage, reconnect: manualReconnect, clientId: clientIdRef.current, addMessageHandler, ws: wsRef.current, isConnected: wsStatus === "connected", getConnectionInfo };
};