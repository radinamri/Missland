// hooks/useWebSocket.ts
import { useCallback, useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  timestamp: number;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onBinaryMessage?: (data: ArrayBuffer) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface WebSocketStats {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
  messagesSent: number;
  messagesReceived: number;
  lastError?: string;
}

export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onBinaryMessage,
    onError,
    onClose,
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 2000,
  } = options;

  const [stats, setStats] = useState<WebSocketStats>({
    connected: false,
    connecting: false,
    reconnecting: false,
    reconnectAttempts: 0,
    messagesSent: 0,
    messagesReceived: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!url) return;

    setStats((prev) => ({
      ...prev,
      connecting: true,
      reconnecting: prev.reconnectAttempts > 0,
    }));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setStats((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          reconnecting: false,
          reconnectAttempts: 0,
        }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'ping',
                timestamp: Date.now(),
              })
            );
          }
        }, 30000); // Every 30 seconds
      };

      ws.onmessage = async (event) => {
        setStats((prev) => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
        }));

        if (event.data instanceof Blob) {
          // Binary message
          const arrayBuffer = await event.data.arrayBuffer();
          onBinaryMessage?.(arrayBuffer);
        } else {
          // JSON message
          try {
            const message = JSON.parse(event.data);
            onMessage?.(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setStats((prev) => ({
          ...prev,
          lastError: 'Connection error',
        }));
        onError?.(error);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setStats((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
        }));

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        onClose?.(event);

        // Attempt reconnection
        if (
          reconnect &&
          stats.reconnectAttempts < maxReconnectAttempts &&
          !event.wasClean
        ) {
          setStats((prev) => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));

          const delay = reconnectInterval * Math.pow(2, stats.reconnectAttempts);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setStats((prev) => ({
        ...prev,
        connecting: false,
        lastError: 'Failed to create connection',
      }));
    }
  }, [
    url,
    reconnect,
    maxReconnectAttempts,
    reconnectInterval,
    stats.reconnectAttempts,
    onMessage,
    onBinaryMessage,
    onError,
    onClose,
  ]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      setStats((prev) => ({
        ...prev,
        messagesSent: prev.messagesSent + 1,
      }));
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  }, []);

  const sendBinary = useCallback((data: ArrayBuffer | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      setStats((prev) => ({
        ...prev,
        messagesSent: prev.messagesSent + 1,
      }));
    } else {
      console.warn('[WebSocket] Cannot send binary: not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setStats({
      connected: false,
      connecting: false,
      reconnecting: false,
      reconnectAttempts: 0,
      messagesSent: 0,
      messagesReceived: 0,
    });
  }, [cleanup]);

  // Auto-connect when URL changes
  useEffect(() => {
    if (url) {
      connect();
    }
    return cleanup;
  }, [url, connect, cleanup]);

  return {
    sendMessage,
    sendBinary,
    disconnect,
    reconnect: connect,
    stats,
  };
}
