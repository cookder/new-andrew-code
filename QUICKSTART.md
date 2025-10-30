# Quick Start Guide - WebSocket Audio Streaming

This guide will get your audio streaming system up and running in minutes!

## What We Built

A complete WebSocket-based audio streaming infrastructure:

**Backend (Python/FastAPI):**
- WebSocket server for real-time connections
- Audio streaming handler to process incoming audio
- Connection management for multiple sessions
- Session tracking and statistics

**Frontend (Next.js/React):**
- WebSocket client with auto-reconnect
- Browser microphone capture using Web Audio API
- Real-time audio streaming to backend
- Live UI with volume meter and stats
- Connection status indicators

## Prerequisites

- Python 3.9+
- Node.js 18+
- A microphone

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

The backend will start on `http://localhost:8000`

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

### 2. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000`

### 3. Test the System

1. Open your browser to `http://localhost:3000`
2. You should see the "Sales Call Feedback AI" interface
3. Click **"Start Call"**
4. Allow microphone access when prompted
5. Start speaking - you'll see:
   - Connection status turn green
   - Recording indicator pulse red
   - Volume meter respond to your voice
   - Stats update (duration, data sent, chunks)

### 4. Monitor Backend Logs

In the backend terminal, you should see logs like:

```
INFO - Client connected: abc123. Total connections: 1
INFO - Created audio session: abc123
INFO - Session abc123: 50 chunks, 25.43 KB, 5.12s
INFO - Session abc123: 100 chunks, 50.86 KB, 10.24s
```

### 5. Stop the Call

Click **"Stop Call"** button. You'll see cleanup logs:

```
INFO - Client requested stop for session: abc123
INFO - WebSocket disconnected: abc123
INFO - Closed audio session: abc123. Duration: 15.42s, Total bytes: 78234
INFO - Session cleanup completed: abc123
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts and loads at localhost:3000
- [ ] Can click "Start Call" button
- [ ] Browser requests microphone permission
- [ ] Connection status shows "Connected" (green dot)
- [ ] Recording status shows "Recording" (pulsing red dot)
- [ ] Volume meter moves when you speak
- [ ] Duration timer counts up
- [ ] Data sent increases
- [ ] Backend logs show audio chunks being received
- [ ] Can click "Stop Call" button
- [ ] Everything cleans up properly

## API Endpoints

Test the backend independently:

```bash
# Health check
curl http://localhost:8000/health
# Response: {"status":"healthy"}

# Root endpoint
curl http://localhost:8000/
# Response: {"message":"Sales Call Feedback AI API","status":"running","version":"0.1.0"}

# Active sessions
curl http://localhost:8000/sessions
# Response: {"active_sessions":[],"count":0}
```

## Architecture Overview

### Data Flow

```
User Microphone
    ↓
Web Audio API (capture)
    ↓
MediaRecorder (100ms chunks)
    ↓
WebSocket Client
    ↓
WebSocket Connection (ws://localhost:8000/ws/{session_id})
    ↓
Backend Connection Manager
    ↓
Audio Handler (processes chunks)
    ↓
Backend sends ACK every 10 chunks
    ↓
Frontend updates stats
```

### Key Files Created

**Backend:**
- `backend/main.py` - FastAPI app with WebSocket endpoint
- `backend/utils/websocket_manager.py` - Connection manager
- `backend/services/audio/audio_handler.py` - Audio processing

**Frontend:**
- `frontend/src/services/websocket.ts` - WebSocket client
- `frontend/src/hooks/useAudioCapture.ts` - Microphone capture hook
- `frontend/src/hooks/useAudioStreaming.ts` - Combined streaming hook
- `frontend/src/components/CallInterface/CallInterface.tsx` - Main UI

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.9+)
- Make sure virtual environment is activated
- Check if port 8000 is available: `lsof -i :8000`

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if port 3000 is available

### Microphone not working
- Ensure you're using HTTPS (or localhost for development)
- Check browser microphone permissions
- Try a different browser (Chrome/Edge work best)
- Test microphone in system settings first

### WebSocket connection fails
- Verify backend is running on port 8000
- Check browser console for errors (F12)
- Look for CORS or security errors
- Ensure no firewall blocking WebSocket connections

### No audio data received
- Check browser console for errors
- Verify MediaRecorder support: Check `MediaRecorder.isTypeSupported('audio/webm')`
- Look at Network tab (F12) to see WebSocket frames
- Check backend logs for received data

## Next Steps

Now that you have audio streaming working, you can:

1. **Add Transcription** - Integrate Deepgram or Whisper API
2. **Add AI Analysis** - Send transcripts to OpenAI/Anthropic
3. **Add Real-time Feedback** - Display coaching suggestions
4. **Add Database** - Store sessions and transcripts
5. **Add Authentication** - Secure the endpoints

See the main README.md for the full development roadmap!

## Need Help?

- Check backend logs for errors
- Check browser console (F12) for frontend errors
- Ensure both servers are running
- Try the API endpoints directly with curl
- Check the Network tab in browser DevTools to see WebSocket traffic

---

**Status**: ✅ WebSocket + Audio Streaming Infrastructure Complete!
