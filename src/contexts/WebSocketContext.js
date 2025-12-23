import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { data: session } = useSession();
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef(null);
  const eventHandlers = useRef(new Map());

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    // Only connect if we have a valid session
    if (!session?.accessToken) {
      console.log('No session token available, delaying WebSocket connection...');
      return;
    }

    // Close existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    // Create new WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${protocol}${window.location.host}/api/ws`;
    
    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        // Authenticate with the server
        ws.current.send(JSON.stringify({
          type: 'AUTH',
          token: session.accessToken
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handlers = eventHandlers.current.get(message.type) || [];
          handlers.forEach(handler => handler(message.data));
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect in ${timeout}ms...`);
          
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, timeout);
        } else {
          toast({
            title: 'Connection lost',
            description: 'Unable to connect to the server. Please refresh the page.',
            variant: 'destructive',
          });
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.current?.close();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [session?.accessToken]);

  // Connect on mount and when session changes
  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  // Reconnect when the tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !ws.current) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect]);

  const subscribe = useCallback((eventType, callback) => {
    const handlers = eventHandlers.current.get(eventType) || [];
    eventHandlers.current.set(eventType, [...handlers, callback]);
    
    // Return unsubscribe function
    return () => {
      const updatedHandlers = eventHandlers.current.get(eventType)?.filter(h => h !== callback) || [];
      if (updatedHandlers.length > 0) {
        eventHandlers.current.set(eventType, updatedHandlers);
      } else {
        eventHandlers.current.delete(eventType);
      }
    };
  }, []);

  const send = useCallback((type, data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data }));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  return (
    <WebSocketContext.Provider value={{ send, subscribe, isConnected: ws.current?.readyState === WebSocket.OPEN }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
