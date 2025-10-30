# Sales Call Feedback AI

An AI-powered application that provides real-time feedback and coaching during sales calls, helping sales professionals improve their performance through live insights, sentiment analysis, and post-call analytics.

## Features

### Real-Time Features
- **Live Transcription**: Automatic speech-to-text with speaker identification
- **Sentiment Analysis**: Track customer sentiment throughout the conversation
- **Talk-Time Analysis**: Monitor speaking time distribution between you and the prospect
- **Keyword Detection**: Highlight important terms, products, and competitor mentions
- **Objection Detection**: Get alerts when prospects raise objections
- **Live Coaching**: Receive AI-powered suggestions during the call

### Post-Call Features
- **Call Summaries**: AI-generated summaries of key discussion points
- **Action Items**: Automatically extracted follow-up tasks
- **Performance Scoring**: Detailed metrics on call quality
- **Trend Analysis**: Track improvement over time
- **Searchable Archive**: Full-text search across all call transcripts

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Caching**: Redis
- **AI/ML**: OpenAI GPT-4 / Anthropic Claude
- **Speech-to-Text**: Deepgram / AssemblyAI / Whisper
- **WebSockets**: Real-time communication

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.io
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
sales-feedback-ai/
├── backend/                    # Python FastAPI backend
│   ├── api/
│   │   ├── routes/            # API endpoints
│   │   └── middleware/        # Auth, logging, etc.
│   ├── services/
│   │   ├── audio/             # Audio processing
│   │   ├── transcription/     # Speech-to-text integration
│   │   ├── ai_analysis/       # LLM-powered analysis
│   │   └── feedback/          # Feedback generation
│   ├── models/                # Database models
│   ├── utils/                 # Helper functions
│   ├── config/                # Configuration files
│   ├── tests/                 # Unit and integration tests
│   └── main.py               # Application entry point
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CallInterface/    # Call controls and UI
│   │   │   ├── Transcription/    # Live transcript display
│   │   │   ├── Feedback/         # AI feedback components
│   │   │   └── Dashboard/        # Analytics dashboard
│   │   ├── services/          # API clients
│   │   ├── hooks/             # Custom React hooks
│   │   ├── contexts/          # React contexts
│   │   ├── utils/             # Helper functions
│   │   ├── types/             # TypeScript types
│   │   └── styles/            # Global styles
│   ├── public/                # Static assets
│   └── tests/                 # Frontend tests
│
├── database/                   # Database management
│   ├── migrations/            # Schema migrations
│   └── seeds/                 # Seed data
│
├── docs/                       # Documentation
│   ├── api/                   # API documentation
│   ├── architecture/          # Architecture docs
│   └── guides/                # User and dev guides
│
├── scripts/                    # Utility scripts
├── .github/                    # GitHub Actions workflows
├── .env.example               # Environment variables template
└── .gitignore                 # Git ignore rules
```

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp ../.env.example ../.env
   # Edit .env with your API keys and database credentials
   ```

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start the server**
   ```bash
   python main.py
   # Or with uvicorn: uvicorn main:app --reload
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   # Update .env with backend URL if different
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

## API Keys Required

To use this application, you'll need API keys for:

1. **AI Provider** (choose one):
   - OpenAI API (GPT-4)
   - Anthropic API (Claude)

2. **Speech-to-Text** (choose one):
   - Deepgram (recommended for real-time)
   - AssemblyAI
   - OpenAI Whisper

## Development Roadmap

### Phase 1: Core Functionality
- [ ] Basic audio capture and streaming
- [ ] Real-time transcription integration
- [ ] Simple AI analysis (sentiment, keywords)
- [ ] Live feedback display
- [ ] Call recording and playback

### Phase 2: Enhanced Features
- [ ] Speaker diarization
- [ ] Advanced AI coaching
- [ ] Objection detection and handling suggestions
- [ ] Competitor mention tracking
- [ ] Post-call summaries and action items

### Phase 3: Analytics & Insights
- [ ] Performance dashboard
- [ ] Historical trend analysis
- [ ] Team analytics (if multi-user)
- [ ] Custom coaching playbooks
- [ ] Integration with CRMs

### Phase 4: Enterprise Features
- [ ] Multi-user support with roles
- [ ] Team management
- [ ] Custom AI training on your calls
- [ ] Advanced security features
- [ ] Mobile app

## Architecture Overview

### Real-Time Flow
```
User's Microphone
    ↓
Browser (Web Audio API)
    ↓
WebSocket Connection
    ↓
Backend Audio Service
    ↓
Speech-to-Text API (Deepgram)
    ↓
AI Analysis Service (GPT-4/Claude)
    ↓
Feedback Generation
    ↓
WebSocket to Frontend
    ↓
Live Feedback Display
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

[Your License Choice - e.g., MIT]

## Support

For questions or issues, please open a GitHub issue or contact [your-email@example.com].

---

**Note**: This application is in active development. Features and documentation will be updated regularly.
