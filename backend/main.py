"""
Main FastAPI application entry point for Sales Call Feedback AI
WITH DATABASE INTEGRATION
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import logging
import json

from utils.websocket_manager import manager
from services.audio.audio_handler import audio_handler
from services.transcription.deepgram_service import deepgram_service
from services.call_service import CallService
from models.database import get_db, engine, Base
from api.routes import calls

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sales Call Feedback AI",
    description="Real-time AI-powered feedback system for sales calls",
    version="0.2.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(calls.router, prefix="/api/calls", tags=["calls"])


@app.get("/")
async def root():
    return {
        "message": "Sales Call Feedback AI API",
        "status": "running",
        "version": "0.2.0",
        "features": {
            "audio_streaming": True,
            "transcription": deepgram_service.is_enabled(),
            "database": True
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time audio streaming with database persistence
    """
    # Get database session
    db = next(get_db())

    try:
        await manager.connect(websocket, session_id)

        # Create audio session
        audio_handler.create_session(session_id)

        # Create database record
        try:
            CallService.create_call(db, session_id)
        except Exception as e:
            logger.error(f"Error creating call record: {e}")

        # Start transcription if enabled
        transcription_enabled = deepgram_service.is_enabled()

        if transcription_enabled:
            async def on_transcript(transcript_data):
                """Callback for transcription results"""
                # Save to database
                try:
                    CallService.add_transcription(
                        db,
                        session_id,
                        transcript_data["transcript"],
                        transcript_data["is_final"],
                        transcript_data["confidence"],
                        transcript_data.get("words", [])
                    )
                except Exception as e:
                    logger.error(f"Error saving transcription: {e}")

                # Send to client
                await manager.send_message(session_id, {
                    "type": "transcription",
                    **transcript_data
                })

            async def on_transcription_error(error_msg):
                """Callback for transcription errors"""
                await manager.send_message(session_id, {
                    "type": "transcription_error",
                    "message": error_msg
                })

            await deepgram_service.start_transcription(
                session_id,
                on_transcript,
                on_transcription_error
            )

        # Send connection confirmation
        await manager.send_message(session_id, {
            "type": "connection",
            "status": "connected",
            "session_id": session_id,
            "message": "WebSocket connection established",
            "transcription_enabled": transcription_enabled,
            "database_enabled": True
        })

        while True:
            # Receive data from client
            data = await websocket.receive()

            # Handle text messages (JSON commands)
            if "text" in data:
                try:
                    message = json.loads(data["text"])
                    message_type = message.get("type")

                    if message_type == "audio":
                        audio_data_encoded = message.get("data")
                        if audio_data_encoded:
                            audio_bytes = audio_handler.decode_audio_data(audio_data_encoded)
                            result = await audio_handler.process_audio_chunk(session_id, audio_bytes)

                            # Forward to Deepgram
                            if transcription_enabled:
                                await deepgram_service.send_audio(session_id, audio_bytes)

                            # Update database stats periodically
                            if result['chunks_received'] % 50 == 0:
                                try:
                                    CallService.update_call_stats(
                                        db,
                                        session_id,
                                        result['total_bytes'],
                                        result['chunks_received']
                                    )
                                except Exception as e:
                                    logger.error(f"Error updating stats: {e}")

                            if result['chunks_received'] % 10 == 0:
                                await manager.send_message(session_id, {
                                    "type": "audio_ack",
                                    **result
                                })

                    elif message_type == "ping":
                        await manager.send_message(session_id, {
                            "type": "pong",
                            "timestamp": message.get("timestamp")
                        })

                    elif message_type == "stop":
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

                # Forward to Deepgram
                if transcription_enabled:
                    await deepgram_service.send_audio(session_id, audio_bytes)

                # Update database stats periodically
                if result['chunks_received'] % 50 == 0:
                    try:
                        CallService.update_call_stats(
                            db,
                            session_id,
                            result['total_bytes'],
                            result['chunks_received']
                        )
                    except Exception as e:
                        logger.error(f"Error updating stats: {e}")

                # Send acknowledgment
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
        if transcription_enabled:
            await deepgram_service.stop_transcription(session_id)

        # End call in database
        try:
            CallService.end_call(db, session_id)
        except Exception as e:
            logger.error(f"Error ending call: {e}")

        manager.disconnect(session_id)
        audio_handler.close_session(session_id)
        db.close()
        logger.info(f"Session cleanup completed: {session_id}")


@app.get("/sessions")
async def list_sessions():
    """Get list of active sessions (for debugging)"""
    return {
        "active_sessions": list(audio_handler.sessions.keys()),
        "count": len(audio_handler.sessions)
    }


if __name__ == "__main__":
    uvicorn.run("main_with_db:app", host="0.0.0.0", port=8000, reload=True)
