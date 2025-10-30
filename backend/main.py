"""
Main FastAPI application entry point for Sales Call Feedback AI
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import json
import uuid

from utils.websocket_manager import manager
from services.audio.audio_handler import audio_handler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sales Call Feedback AI",
    description="Real-time AI-powered feedback system for sales calls",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Sales Call Feedback AI API",
        "status": "running",
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time audio streaming

    Flow:
    1. Client connects with a session_id
    2. Backend creates audio session
    3. Client streams audio chunks
    4. Backend processes and (later) forwards to transcription service
    """
    await manager.connect(websocket, session_id)

    # Create audio session
    audio_handler.create_session(session_id)

    # Send connection confirmation
    await manager.send_message(session_id, {
        "type": "connection",
        "status": "connected",
        "session_id": session_id,
        "message": "WebSocket connection established"
    })

    try:
        while True:
            # Receive data from client
            data = await websocket.receive()

            # Handle text messages (JSON commands)
            if "text" in data:
                try:
                    message = json.loads(data["text"])
                    message_type = message.get("type")

                    if message_type == "audio":
                        # Handle audio data sent as base64 in JSON
                        audio_data_encoded = message.get("data")
                        if audio_data_encoded:
                            audio_bytes = audio_handler.decode_audio_data(audio_data_encoded)
                            result = await audio_handler.process_audio_chunk(session_id, audio_bytes)

                            # Send acknowledgment every 10 chunks
                            if result['chunks_received'] % 10 == 0:
                                await manager.send_message(session_id, {
                                    "type": "audio_ack",
                                    **result
                                })

                    elif message_type == "ping":
                        # Respond to ping for connection health check
                        await manager.send_message(session_id, {
                            "type": "pong",
                            "timestamp": message.get("timestamp")
                        })

                    elif message_type == "stop":
                        # Client is stopping the call
                        logger.info(f"Client requested stop for session: {session_id}")
                        await manager.send_message(session_id, {
                            "type": "stopped",
                            "session_id": session_id
                        })
                        break

                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON received: {e}")
                    await manager.send_message(session_id, {
                        "type": "error",
                        "message": "Invalid message format"
                    })

            # Handle binary audio data
            elif "bytes" in data:
                audio_bytes = data["bytes"]
                result = await audio_handler.process_audio_chunk(session_id, audio_bytes)

                # Send acknowledgment periodically
                if result['chunks_received'] % 10 == 0:
                    await manager.send_message(session_id, {
                        "type": "audio_ack",
                        **result
                    })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection {session_id}: {e}")
    finally:
        # Cleanup
        manager.disconnect(session_id)
        audio_handler.close_session(session_id)
        logger.info(f"Session cleanup completed: {session_id}")


@app.get("/sessions")
async def list_sessions():
    """Get list of active sessions (for debugging)"""
    return {
        "active_sessions": list(audio_handler.sessions.keys()),
        "count": len(audio_handler.sessions)
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
