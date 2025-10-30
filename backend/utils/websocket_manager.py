"""
WebSocket Connection Manager
Handles multiple concurrent WebSocket connections for real-time audio streaming
"""
from typing import Dict, Set
from fastapi import WebSocket
import logging
import json

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for audio streaming sessions"""

    def __init__(self):
        # Store active connections: {session_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # Track all connected clients
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.all_connections.add(websocket)
        logger.info(f"Client connected: {session_id}. Total connections: {len(self.active_connections)}")

    def disconnect(self, session_id: str):
        """Remove a WebSocket connection"""
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            self.all_connections.discard(websocket)
            del self.active_connections[session_id]
            logger.info(f"Client disconnected: {session_id}. Remaining connections: {len(self.active_connections)}")

    async def send_message(self, session_id: str, message: dict):
        """Send a JSON message to a specific session"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {session_id}: {e}")
                self.disconnect(session_id)

    async def send_text(self, session_id: str, text: str):
        """Send a text message to a specific session"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(text)
            except Exception as e:
                logger.error(f"Error sending text to {session_id}: {e}")
                self.disconnect(session_id)

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients"""
        disconnected = []
        for session_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {session_id}: {e}")
                disconnected.append(session_id)

        # Clean up disconnected clients
        for session_id in disconnected:
            self.disconnect(session_id)

    def get_connection(self, session_id: str) -> WebSocket:
        """Get WebSocket connection by session ID"""
        return self.active_connections.get(session_id)

    def is_connected(self, session_id: str) -> bool:
        """Check if a session is currently connected"""
        return session_id in self.active_connections


# Global connection manager instance
manager = ConnectionManager()
