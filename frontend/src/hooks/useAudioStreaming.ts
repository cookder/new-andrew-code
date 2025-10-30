/**
 * Custom React Hook for Audio Streaming
 * Combines WebSocket connection and audio capture for seamless streaming
 */

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketService, WebSocketMessage } from '../services/websocket';
import { useAudioCapture, AudioCaptureConfig } from './useAudioCapture';

export interface StreamingStats {
  sessionId: string | null;
  isConnected: boolean;
  isRecording: boolean;
  volume: number;
  duration: number;
  bytesStreamed: number;
  chunksReceived: number;
}

export interface UseAudioStreamingReturn {
  isStreaming: boolean;
  isConnected: boolean;
  volume: number;
  error: string | null;
  stats: StreamingStats;
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
}

export function useAudioStreaming(
  wsService: WebSocketService,
  audioConfig?: AudioCaptureConfig
): UseAudioStreamingReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chunksReceived, setChunksReceived] = useState(0);

  /**
   * Handle audio data from microphone
   */
  const handleAudioData = useCallback(
    async (audioBlob: Blob) => {
      if (wsService.isConnected()) {
        try {
          // Send audio as binary data
          wsService.sendAudioData(audioBlob);
        } catch (err) {
          console.error('Error sending audio data:', err);
        }
      }
    },
    [wsService]
  );

  /**
   * Audio capture hook
   */
  const {
    isRecording,
    volume,
    error: audioError,
    startRecording,
    stopRecording,
    getAudioStats,
  } = useAudioCapture(handleAudioData, audioConfig);

  /**
   * Start streaming: Connect WebSocket + Start audio capture
   */
  const startStreaming = useCallback(async () => {
    try {
      setError(null);
      setIsStreaming(true);

      // Generate session ID
      const newSessionId = uuidv4();
      setSessionId(newSessionId);

      // Connect to WebSocket
      await wsService.connect(newSessionId);
      setIsConnected(true);

      // Wait a moment for connection to stabilize
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start audio recording
      await startRecording();

      console.log(`Streaming started. Session: ${newSessionId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start streaming';
      setError(errorMessage);
      setIsStreaming(false);
      console.error('Error starting streaming:', err);
    }
  }, [wsService, startRecording]);

  /**
   * Stop streaming: Stop audio capture + Disconnect WebSocket
   */
  const stopStreaming = useCallback(() => {
    // Stop recording
    stopRecording();

    // Disconnect WebSocket
    wsService.disconnect();

    setIsConnected(false);
    setIsStreaming(false);
    setSessionId(null);
    setChunksReceived(0);

    console.log('Streaming stopped');
  }, [wsService, stopRecording]);

  /**
   * Set up WebSocket message handlers
   */
  useEffect(() => {
    // Handle audio acknowledgments
    const handleAudioAck = (message: WebSocketMessage) => {
      if (message.chunks_received !== undefined) {
        setChunksReceived(message.chunks_received);
      }
    };

    // Handle connection status
    const handleConnection = (message: WebSocketMessage) => {
      console.log('Connection message:', message);
    };

    // Handle errors
    const handleError = (message: WebSocketMessage) => {
      setError(message.message || 'Unknown error');
      console.error('Server error:', message);
    };

    // Handle stopped
    const handleStopped = () => {
      stopStreaming();
    };

    // Register handlers
    wsService.on('audio_ack', handleAudioAck);
    wsService.on('connection', handleConnection);
    wsService.on('error', handleError);
    wsService.on('stopped', handleStopped);

    // Cleanup handlers on unmount
    return () => {
      wsService.off('audio_ack', handleAudioAck);
      wsService.off('connection', handleConnection);
      wsService.off('error', handleError);
      wsService.off('stopped', handleStopped);
    };
  }, [wsService, stopStreaming]);

  /**
   * Update error from audio capture
   */
  useEffect(() => {
    if (audioError) {
      setError(audioError);
    }
  }, [audioError]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStreaming();
      }
    };
  }, [isStreaming, stopStreaming]);

  /**
   * Get streaming statistics
   */
  const audioStats = getAudioStats();
  const stats: StreamingStats = {
    sessionId,
    isConnected,
    isRecording: audioStats.isRecording,
    volume: audioStats.volume,
    duration: audioStats.duration,
    bytesStreamed: audioStats.bytesStreamed,
    chunksReceived,
  };

  return {
    isStreaming,
    isConnected,
    volume,
    error,
    stats,
    startStreaming,
    stopStreaming,
  };
}
