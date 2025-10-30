/**
 * WebSocket Service for Real-Time Audio Streaming
 * Manages WebSocket connection lifecycle and message handling
 */

export type MessageType =
  | 'connection'
  | 'audio'
  | 'audio_ack'
  | 'transcription'
  | 'feedback'
  | 'ping'
  | 'pong'
  | 'stop'
  | 'stopped'
  | 'error';

export interface WebSocketMessage {
  type: MessageType;
  [key: string]: any;
}

export type MessageHandler = (message: WebSocketMessage) => void;
export type ConnectionHandler = () => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private messageHandlers: Map<MessageType, MessageHandler[]> = new Map();
  private onConnectHandlers: ConnectionHandler[] = [];
  private onDisconnectHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;

  constructor(private baseUrl: string = 'ws://localhost:8000') {}

  /**
   * Connect to WebSocket server
   */
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionId = sessionId;
      this.isIntentionallyClosed = false;

      const wsUrl = `${this.baseUrl}/ws/${sessionId}`;
      console.log(`Connecting to WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.onConnectHandlers.forEach(handler => handler());
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onDisconnectHandlers.forEach(handler => handler());

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

          setTimeout(() => {
            if (this.sessionId) {
              this.connect(this.sessionId);
            }
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.ws) {
      // Send stop message before closing
      this.sendMessage({ type: 'stop' });

      this.ws.close();
      this.ws = null;
    }

    this.sessionId = null;
  }

  /**
   * Send a JSON message
   */
  sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  /**
   * Send binary audio data
   */
  sendAudioData(audioData: Blob | ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    } else {
      console.warn('WebSocket is not connected. Audio data not sent.');
    }
  }

  /**
   * Send audio data as base64 encoded JSON (alternative method)
   */
  async sendAudioDataBase64(audioBlob: Blob): Promise<void> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = this.arrayBufferToBase64(arrayBuffer);

    this.sendMessage({
      type: 'audio',
      data: base64
    });
  }

  /**
   * Register a message handler for a specific message type
   */
  on(messageType: MessageType, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Remove a message handler
   */
  off(messageType: MessageType, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Register connection handler
   */
  onConnect(handler: ConnectionHandler): void {
    this.onConnectHandlers.push(handler);
  }

  /**
   * Register disconnection handler
   */
  onDisconnect(handler: ConnectionHandler): void {
    this.onDisconnectHandlers.push(handler);
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): void {
    this.sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);

    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    // Log certain message types
    if (message.type === 'connection') {
      console.log('Connection confirmed:', message);
    } else if (message.type === 'error') {
      console.error('Server error:', message);
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

// Export singleton instance
export const wsService = new WebSocketService(
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
);
