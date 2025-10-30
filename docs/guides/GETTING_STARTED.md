# Getting Started Guide

## Quick Start (5 minutes)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd sales-feedback-ai

# Copy environment template
cp .env.example .env
```

### 2. Configure API Keys

Edit `.env` and add your API keys:

```env
# Required: Choose one AI provider
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Required: Speech-to-text
DEEPGRAM_API_KEY=...

# Database (use default for local development)
DATABASE_URL=postgresql://user:password@localhost:5432/sales_feedback_db
```

### 3. Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:8000`

### 4. Start Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### 5. Test the Application

1. Open `http://localhost:3000` in your browser
2. Click "Start Call"
3. Allow microphone access
4. Start speaking!
5. Watch real-time transcription and AI feedback

## Detailed Setup

### Prerequisites Installation

#### macOS
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python@3.11

# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Install Redis
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Python
sudo apt install python3.11 python3.11-venv python3-pip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Install Redis
sudo apt install redis-server
sudo systemctl start redis
```

#### Windows
1. Install Python from python.org (3.11+)
2. Install Node.js from nodejs.org (18+)
3. Install PostgreSQL from postgresql.org
4. Install Redis from redis.io (or use Docker)

### Database Setup

```bash
# Create database
psql postgres
CREATE DATABASE sales_feedback_db;
CREATE USER sales_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sales_feedback_db TO sales_user;
\q

# Update .env with your database credentials
DATABASE_URL=postgresql://sales_user:your_password@localhost:5432/sales_feedback_db
```

### Running with Docker (Alternative)

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Key Setup

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `.env` as `OPENAI_API_KEY`

### Anthropic API Key
1. Go to https://console.anthropic.com/
2. Get API key from Settings
3. Copy to `.env` as `ANTHROPIC_API_KEY`

### Deepgram API Key
1. Sign up at https://deepgram.com
2. Create a new API key
3. Copy to `.env` as `DEEPGRAM_API_KEY`
4. Deepgram offers $200 free credit to start

## Testing the Setup

### Backend Health Check
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### Frontend Test
```bash
curl http://localhost:3000
# Should return HTML
```

### WebSocket Test
Use a WebSocket client or browser console:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onopen = () => console.log('Connected!');
```

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.9+)
- Verify all dependencies installed: `pip list`
- Check database connection in `.env`
- Ensure PostgreSQL is running: `pg_isready`

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for port conflicts (port 3000)

### Microphone not working
- Use HTTPS in production (required for mic access)
- Check browser permissions
- Test mic in browser settings first

### Transcription not working
- Verify Deepgram API key is correct
- Check network connectivity
- Review backend logs for errors

### AI feedback not appearing
- Verify OpenAI or Anthropic API key
- Check API rate limits
- Monitor backend logs for errors

## Next Steps

1. Read the [Architecture Documentation](../architecture/ARCHITECTURE.md)
2. Review the [API Documentation](../api/API.md)
3. Customize AI prompts in `backend/services/ai_analysis/`
4. Configure feedback rules in `backend/services/feedback/`

## Development Workflow

```bash
# Backend development
cd backend
source venv/bin/activate
python main.py  # Auto-reloads on changes

# Frontend development
cd frontend
npm run dev  # Auto-reloads on changes

# Run tests
cd backend && pytest
cd frontend && npm test

# Format code
cd backend && black .
cd frontend && npm run lint
```

## Production Deployment

See [Deployment Guide](./DEPLOYMENT.md) for detailed production setup instructions.
