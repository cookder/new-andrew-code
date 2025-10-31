/**
 * Custom React Hook for Audio Capture
 * Handles microphone access, audio streaming, and Web Audio API integration
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioCaptureConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface AudioStats {
  isRecording: boolean;
  volume: number;
  duration: number;
  bytesStreamed: number;
}

export interface UseAudioCaptureReturn {
  isRecording: boolean;
  volume: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  getAudioStats: () => AudioStats;
}

const DEFAULT_CONFIG: AudioCaptureConfig = {
  sampleRate: 16000, // 16kHz is good for speech recognition
  channelCount: 1, // Mono
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export function useAudioCapture(
  onAudioData: (audioBlob: Blob) => void,
  config: AudioCaptureConfig = {}
): UseAudioCaptureReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const bytesStreamedRef = useRef<number>(0);

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  /**
   * Calculate audio volume from analyser
   */
  const calculateVolume = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedVolume = average / 255; // Normalize to 0-1

    setVolume(normalizedVolume);

    // Continue animation loop
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(calculateVolume);
    }
  }, [isRecording]);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: mergedConfig.sampleRate,
          channelCount: mergedConfig.channelCount,
          echoCancellation: mergedConfig.echoCancellation,
          noiseSuppression: mergedConfig.noiseSuppression,
          autoGainControl: mergedConfig.autoGainControl,
        },
      });

      mediaStreamRef.current = stream;

      // Set up Web Audio API for volume monitoring
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      // Start volume monitoring
      calculateVolume();

      // Set up MediaRecorder for streaming audio chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm', // Or 'audio/ogg' depending on browser support
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle audio data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          bytesStreamedRef.current += event.data.size;
          onAudioData(event.data);
        }
      };

      // Start recording in small chunks (every 100ms)
      mediaRecorder.start(100);

      setIsRecording(true);
      startTimeRef.current = Date.now();

      console.log('Recording started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      console.error('Error starting recording:', err);
    }
  }, [mergedConfig, onAudioData, calculateVolume]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop all audio tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsRecording(false);
    setVolume(0);

    console.log('Recording stopped');
  }, []);

  /**
   * Get current audio statistics
   */
  const getAudioStats = useCallback((): AudioStats => {
    const duration = isRecording ? (Date.now() - startTimeRef.current) / 1000 : 0;

    return {
      isRecording,
      volume,
      duration,
      bytesStreamed: bytesStreamedRef.current,
    };
  }, [isRecording, volume]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return {
    isRecording,
    volume,
    error,
    startRecording,
    stopRecording,
    getAudioStats,
  };
}
