class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
  }

  connect() {
    if (this.socket) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${wsProtocol}${window.location.host}/api/ws`;
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Resubscribe to all channels
      this.subscribers.forEach((callbacks, channel) => {
        this.subscribe(channel, callbacks);
      });
    };

    this.socket.onmessage = (event) => {
      try {
        const { channel, data } = JSON.parse(event.data);
        const callbacks = this.subscribers.get(channel) || [];
        callbacks.forEach(callback => callback(data));
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.socket = null;
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.socket?.close();
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(channel, callback) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    const callbacks = this.subscribers.get(channel) || [];
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
      this.subscribers.set(channel, callbacks);
    }

    // Send subscription message
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }

    // Return unsubscribe function
    return () => this.unsubscribe(channel, callback);
  }

  unsubscribe(channel, callback) {
    const callbacks = this.subscribers.get(channel) || [];
    const filtered = callbacks.filter(cb => cb !== callback);
    
    if (filtered.length === 0) {
      this.subscribers.delete(channel);
      // Unsubscribe from the server if we have no more callbacks for this channel
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'unsubscribe',
          channel
        }));
      }
    } else {
      this.subscribers.set(channel, filtered);
    }
  }

  publish(channel, data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'publish',
        channel,
        data
      }));
      return true;
    }
    return false;
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

// Auto-connect when imported
if (typeof window !== 'undefined') {
  webSocketService.connect();
}

// Export a hook for React components
export function useWebSocket(channel, callback) {
  const { useEffect, useRef } = require('react');
  const callbackRef = useRef(callback);

  // Update the callback if it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleMessage = (data) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    // Subscribe to the channel
    const unsubscribe = webSocketService.subscribe(channel, handleMessage);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [channel]);

  // Return publish function for this channel
  const publish = (data) => {
    return webSocketService.publish(channel, data);
  };

  return { publish };
}
