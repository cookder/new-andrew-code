# Architecture Documentation

## System Overview

The Sales Call Feedback AI system follows a microservices-inspired architecture with three main layers:

1. **Presentation Layer** (Frontend)
2. **Application Layer** (Backend API)
3. **Data Layer** (Database, Cache)

## Component Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│           Next.js Frontend              │
├─────────────────────────────────────────┤
│  Components                             │
│  ├── CallInterface (audio controls)     │
│  ├── Transcription (live text)          │
│  ├── Feedback (AI suggestions)          │
│  └── Dashboard (analytics)              │
├─────────────────────────────────────────┤
│  State Management (Zustand)             │
├─────────────────────────────────────────┤
│  Services & API Clients                 │
│  ├── HTTP Client (axios)                │
│  └── WebSocket Client (socket.io)       │
└─────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────┐
│          FastAPI Backend                │
├─────────────────────────────────────────┤
│  API Routes Layer                       │
│  ├── /api/calls                         │
│  ├── /api/transcription                 │
│  ├── /api/feedback                      │
│  └── /api/analytics                     │
├─────────────────────────────────────────┤
│  Business Logic Layer                   │
│  ├── Audio Service                      │
│  ├── Transcription Service              │
│  ├── AI Analysis Service                │
│  └── Feedback Service                   │
├─────────────────────────────────────────┤
│  Data Access Layer                      │
│  ├── Models (SQLAlchemy)                │
│  └── Repositories                       │
├─────────────────────────────────────────┤
│  External Services                      │
│  ├── Deepgram API                       │
│  ├── OpenAI/Anthropic API               │
│  └── Redis Cache                        │
└─────────────────────────────────────────┘
```

## Data Flow

### 1. Call Initiation Flow
```
User clicks "Start Call"
    ↓
Frontend requests microphone access
    ↓
WebSocket connection established
    ↓
Backend creates call session
    ↓
Session ID returned to frontend
```

### 2. Real-Time Audio Processing Flow
```
Microphone captures audio
    ↓
Audio chunks streamed via WebSocket
    ↓
Backend buffers and forwards to Deepgram
    ↓
Deepgram returns transcription
    ↓
Transcription stored in database
    ↓
Sent to AI Analysis Service
    ↓
AI generates feedback
    ↓
Feedback sent to frontend via WebSocket
    ↓
UI updates in real-time
```

### 3. AI Analysis Pipeline
```
Transcription received
    ↓
Extract context (recent conversation)
    ↓
Analyze sentiment
    ↓
Detect keywords/objections
    ↓
Generate coaching suggestions
    ↓
Calculate metrics (talk time, pace)
    ↓
Package as feedback object
    ↓
Return to frontend
```

## Database Schema

### Core Tables

**calls**
- id (PK)
- user_id (FK)
- started_at
- ended_at
- duration
- status
- recording_url

**transcriptions**
- id (PK)
- call_id (FK)
- speaker
- text
- timestamp
- confidence_score

**feedback_events**
- id (PK)
- call_id (FK)
- type (sentiment, objection, keyword, etc.)
- content
- timestamp
- metadata (JSON)

**analytics**
- id (PK)
- call_id (FK)
- talk_time_ratio
- sentiment_average
- keyword_counts (JSON)
- performance_score

## Technology Decisions

### Why FastAPI?
- Async support for real-time features
- Automatic API documentation
- Type hints and validation
- High performance
- Great for ML/AI integration

### Why Next.js?
- Server-side rendering for better performance
- Built-in routing
- API routes for BFF pattern
- Great developer experience
- TypeScript support

### Why Deepgram?
- Low latency for real-time transcription
- Speaker diarization
- High accuracy
- WebSocket support

### Why Redis?
- Fast session storage
- Real-time features (pub/sub)
- Cache for AI responses
- Rate limiting

## Security Considerations

1. **Authentication**: JWT-based auth
2. **API Keys**: Stored in environment variables, never committed
3. **Audio Data**: Encrypted in transit (WSS), option to not store
4. **PII Protection**: Transcript redaction capabilities
5. **Rate Limiting**: Prevent API abuse

## Scalability Considerations

### Current Architecture
- Single server deployment
- Suitable for 1-100 concurrent calls

### Future Scaling Options
1. **Horizontal Scaling**: Load balancer + multiple backend instances
2. **Microservices**: Split services into separate containers
3. **Message Queue**: Add RabbitMQ/Kafka for async processing
4. **CDN**: Serve frontend assets globally
5. **Database**: Read replicas for analytics queries

## Deployment Architecture

### Development
```
Local Machine
├── Backend (localhost:8000)
├── Frontend (localhost:3000)
├── PostgreSQL (localhost:5432)
└── Redis (localhost:6379)
```

### Production (Recommended)
```
Cloud Provider (AWS/GCP/Azure)
├── Backend: Container (ECS/Cloud Run/App Service)
├── Frontend: Vercel/Netlify
├── Database: Managed PostgreSQL (RDS/Cloud SQL)
├── Cache: Managed Redis (ElastiCache/Cloud Memorystore)
└── Storage: Object storage for recordings (S3/GCS/Blob)
```

## Monitoring & Observability

### Metrics to Track
- API response times
- WebSocket connection health
- Transcription latency
- AI analysis latency
- Error rates
- Active call count

### Logging Strategy
- Structured logging (JSON)
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Centralized logging (future: ELK stack)

## Future Enhancements

1. **Multi-language Support**: Transcription and feedback in multiple languages
2. **Custom AI Models**: Fine-tune models on user's specific sales methodology
3. **Integration Hub**: Connect to Salesforce, HubSpot, etc.
4. **Mobile Apps**: Native iOS/Android apps
5. **Offline Mode**: Record and process later
