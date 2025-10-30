"""
Audio Handler Service
Processes incoming audio streams and prepares them for transcription
"""
import logging
import base64
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class AudioSession:
    """Represents a single audio streaming session"""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.started_at = datetime.utcnow()
        self.audio_chunks = []
        self.total_bytes = 0
        self.is_active = True

    def add_chunk(self, audio_data: bytes):
        """Add an audio chunk to the session"""
        self.audio_chunks.append({
            'data': audio_data,
            'timestamp': datetime.utcnow(),
            'size': len(audio_data)
        })
        self.total_bytes += len(audio_data)

    def get_duration(self) -> float:
        """Get session duration in seconds"""
        return (datetime.utcnow() - self.started_at).total_seconds()

    def stop(self):
        """Mark session as stopped"""
        self.is_active = False


class AudioHandler:
    """Handles audio stream processing"""

    def __init__(self):
        self.sessions: dict[str, AudioSession] = {}

    def create_session(self, session_id: str) -> AudioSession:
        """Create a new audio session"""
        session = AudioSession(session_id)
        self.sessions[session_id] = session
        logger.info(f"Created audio session: {session_id}")
        return session

    def get_session(self, session_id: str) -> Optional[AudioSession]:
        """Get an existing audio session"""
        return self.sessions.get(session_id)

    def close_session(self, session_id: str):
        """Close and remove an audio session"""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session.stop()
            logger.info(
                f"Closed audio session: {session_id}. "
                f"Duration: {session.get_duration():.2f}s, "
                f"Total bytes: {session.total_bytes}"
            )
            # Optionally keep session for post-call analysis
            # For now, we'll remove it
            del self.sessions[session_id]

    async def process_audio_chunk(self, session_id: str, audio_data: bytes) -> dict:
        """
        Process an incoming audio chunk
        Returns status and metadata
        """
        session = self.get_session(session_id)

        if not session:
            logger.warning(f"Received audio for unknown session: {session_id}")
            return {
                'status': 'error',
                'message': 'Session not found'
            }

        if not session.is_active:
            return {
                'status': 'error',
                'message': 'Session is not active'
            }

        # Add chunk to session
        session.add_chunk(audio_data)

        # Log progress periodically (every 50 chunks)
        if len(session.audio_chunks) % 50 == 0:
            logger.info(
                f"Session {session_id}: {len(session.audio_chunks)} chunks, "
                f"{session.total_bytes / 1024:.2f} KB, "
                f"{session.get_duration():.2f}s"
            )

        return {
            'status': 'success',
            'session_id': session_id,
            'chunks_received': len(session.audio_chunks),
            'total_bytes': session.total_bytes,
            'duration': session.get_duration()
        }

    def decode_audio_data(self, encoded_data: str) -> bytes:
        """
        Decode base64 encoded audio data
        Frontend will send audio as base64 string
        """
        try:
            # Remove data URL prefix if present (e.g., "data:audio/webm;base64,")
            if ',' in encoded_data:
                encoded_data = encoded_data.split(',', 1)[1]

            return base64.b64decode(encoded_data)
        except Exception as e:
            logger.error(f"Error decoding audio data: {e}")
            raise ValueError(f"Invalid audio data format: {e}")


# Global audio handler instance
audio_handler = AudioHandler()
