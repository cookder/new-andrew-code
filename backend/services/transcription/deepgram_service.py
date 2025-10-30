"""
Deepgram Transcription Service
Real-time speech-to-text using Deepgram's streaming API
"""
import asyncio
import logging
import json
from typing import Optional, Callable
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
import os

logger = logging.getLogger(__name__)


class DeepgramTranscriptionService:
    """Handles real-time transcription using Deepgram"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Deepgram service

        Args:
            api_key: Deepgram API key. If None, reads from DEEPGRAM_API_KEY env var
        """
        self.api_key = api_key or os.getenv("DEEPGRAM_API_KEY")

        if not self.api_key:
            logger.warning("Deepgram API key not found. Transcription will not work.")
            self.enabled = False
        else:
            self.enabled = True

        self.connections = {}  # Store active Deepgram connections by session_id

    def is_enabled(self) -> bool:
        """Check if transcription is enabled"""
        return self.enabled

    async def start_transcription(
        self,
        session_id: str,
        on_transcript: Callable,
        on_error: Optional[Callable] = None
    ):
        """
        Start a new transcription session

        Args:
            session_id: Unique session identifier
            on_transcript: Callback function for transcription results
            on_error: Optional callback for errors
        """
        if not self.enabled:
            logger.error("Deepgram is not enabled. Please set DEEPGRAM_API_KEY")
            return False

        try:
            # Create Deepgram client
            deepgram = DeepgramClient(self.api_key)

            # Create live transcription connection
            connection = deepgram.listen.asynclive.v("1")

            # Set up event handlers
            async def handle_transcript(self_inner, result, **kwargs):
                """Handle transcription results"""
                try:
                    sentence = result.channel.alternatives[0].transcript

                    if len(sentence.strip()) > 0:
                        # Extract useful metadata
                        transcript_data = {
                            "transcript": sentence,
                            "is_final": result.is_final,
                            "confidence": result.channel.alternatives[0].confidence,
                            "words": [
                                {
                                    "word": word.word,
                                    "start": word.start,
                                    "end": word.end,
                                    "confidence": word.confidence
                                }
                                for word in result.channel.alternatives[0].words
                            ] if hasattr(result.channel.alternatives[0], 'words') else []
                        }

                        logger.info(
                            f"Session {session_id}: Transcript "
                            f"({'final' if result.is_final else 'interim'}): {sentence}"
                        )

                        # Call the callback
                        await on_transcript(transcript_data)

                except Exception as e:
                    logger.error(f"Error processing transcript for {session_id}: {e}")
                    if on_error:
                        await on_error(f"Transcript processing error: {e}")

            async def handle_error(self_inner, error, **kwargs):
                """Handle errors"""
                logger.error(f"Deepgram error for session {session_id}: {error}")
                if on_error:
                    await on_error(str(error))

            async def handle_metadata(self_inner, metadata, **kwargs):
                """Handle metadata"""
                logger.debug(f"Deepgram metadata for {session_id}: {metadata}")

            async def handle_close(self_inner, close_msg, **kwargs):
                """Handle connection close"""
                logger.info(f"Deepgram connection closed for {session_id}")

            # Register event handlers
            connection.on(LiveTranscriptionEvents.Transcript, handle_transcript)
            connection.on(LiveTranscriptionEvents.Error, handle_error)
            connection.on(LiveTranscriptionEvents.Metadata, handle_metadata)
            connection.on(LiveTranscriptionEvents.Close, handle_close)

            # Configure transcription options
            options = LiveOptions(
                model="nova-2",
                language="en-US",
                smart_format=True,
                interim_results=True,
                utterance_end_ms="1000",
                vad_events=True,
                endpointing=300,
            )

            # Start the connection
            if await connection.start(options):
                self.connections[session_id] = connection
                logger.info(f"Deepgram transcription started for session: {session_id}")
                return True
            else:
                logger.error(f"Failed to start Deepgram connection for {session_id}")
                return False

        except Exception as e:
            logger.error(f"Error starting transcription for {session_id}: {e}")
            if on_error:
                await on_error(f"Failed to start transcription: {e}")
            return False

    async def send_audio(self, session_id: str, audio_data: bytes):
        """
        Send audio data to Deepgram for transcription

        Args:
            session_id: Session identifier
            audio_data: Raw audio bytes
        """
        if session_id not in self.connections:
            logger.warning(f"No active connection for session {session_id}")
            return False

        try:
            connection = self.connections[session_id]
            connection.send(audio_data)
            return True
        except Exception as e:
            logger.error(f"Error sending audio for {session_id}: {e}")
            return False

    async def stop_transcription(self, session_id: str):
        """
        Stop transcription for a session

        Args:
            session_id: Session identifier
        """
        if session_id not in self.connections:
            logger.warning(f"No active connection for session {session_id}")
            return

        try:
            connection = self.connections[session_id]
            await connection.finish()
            del self.connections[session_id]
            logger.info(f"Deepgram transcription stopped for session: {session_id}")
        except Exception as e:
            logger.error(f"Error stopping transcription for {session_id}: {e}")


# Global instance
deepgram_service = DeepgramTranscriptionService()
