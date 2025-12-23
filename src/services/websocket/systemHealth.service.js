class SystemHealthWebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.isConnected = false;
  }

  connect() {
    if (this.socket) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.socket = new WebSocket(`${protocol}//${host}/api/ws/system-health`);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.notifySubscribers({ type: 'connection', status: 'connected' });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifySubscribers(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        this.isConnected = false;
        this.socket = null;
        this.notifySubscribers({ type: 'connection', status: 'disconnected' });
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifySubscribers({ type: 'error', message: 'Connection error' });
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifySubscribers({ 
        type: 'connection', 
        status: 'failed',
        message: 'Failed to reconnect. Please refresh the page.'
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in WebSocket subscriber:', error);
      }
    });
  }

  // Request specific metrics
  requestMetrics(type) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({
        type: 'request',
        data: { metric: type }
      }));
    }
  }
}

// Export a singleton instance
export const systemHealthWebSocket = new SystemHealthWebSocketService();

// Auto-connect when imported
if (typeof window !== 'undefined') {
  systemHealthWebSocket.connect();
}
