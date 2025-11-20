# AI-Powered Sales Intelligence Platform

A Next.js web application that functions as an AI-powered mini-CRM and sales intelligence system. The app ingests sales call transcripts (TXT) and email threads (PDF) to automatically analyze deal health, track MEDDPICC/BANT qualification, and provide actionable recommendations throughout the sales cycle.

## Features

### Core Functionality
- **Opportunity Management**: Track deals through customizable sales stages
- **Account & Contact Management**: Organize customer relationships
- **Document Upload**: Support for TXT transcripts and PDF email threads (bulk upload up to 10 files)
- **AI-Powered Analysis**: Automatic MEDDPICC/BANT extraction using multiple AI models
- **Health Score Tracking**: Algorithmic deal health scoring (0-100)
- **Insights & Recommendations**: AI-generated red flags and next best actions
- **Historical Tracking**: Time-series analysis of qualification metrics

### AI Models Used
- **Gemini 2.0 Flash Thinking**: MEDDPICC/BANT extraction, stakeholder identification
- **GPT-4o**: Red flag identification, competitive intelligence
- **Claude Sonnet 4.5**: Next best actions, stakeholder gap analysis

### MEDDPICC Framework
- **M**etrics: Quantifiable business outcomes
- **E**conomic Buyer: Budget authority identification
- **D**ecision Criteria: Evaluation criteria tracking
- **D**ecision Process: Buying process and timeline
- **P**ain: Specific problem identification
- **I**dentify Champion: Internal advocate tracking
- **C**ompetition: Competitor awareness

### BANT Framework
- **B**udget: Budget confirmation and range
- **A**uthority: Decision maker identification
- **N**eed: Business need validation
- **T**imeline: Purchase timeline establishment

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui-inspired components
- **Database**: SQLite with Prisma ORM
- **AI Integration**:
  - OpenAI SDK (GPT-4o)
  - Anthropic SDK (Claude Sonnet 4.5)
  - Google Generative AI SDK (Gemini 2.0 Flash)
- **File Processing**: pdf-parse for PDF text extraction
- **Charts**: Recharts for data visualization

## Prerequisites

- Node.js 18+ and npm
- API keys for:
  - OpenAI (GPT-4o)
  - Anthropic (Claude)
  - Google Cloud (Gemini)

## Installation

### 1. Clone the Repository
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database
```bash
npm run db:init
```

This will:
- Create `.env.local` file
- Set up uploads directory
- Display next steps for database setup

### 4. Configure Environment Variables

Edit `frontend/.env.local` and add your API keys:

```env
# Database
DATABASE_URL="file:./dev.db"

# AI API Keys - ADD YOUR KEYS HERE
OPENAI_API_KEY=sk-...your-key-here...
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
GOOGLE_API_KEY=...your-key-here...

# Authentication
ADMIN_PASSWORD=admin123

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### 5. Generate Prisma Client & Initialize Database

**IMPORTANT**: You may need to download Prisma engines manually if you encounter network issues:

```bash
# Try to generate Prisma client
npm run db:generate

# If the above fails, you may need to set the environment variable:
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run db:generate

# Push schema to database
npm run db:push
```

### 6. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000/crm` to access the Sales Intelligence Platform.

## Usage Guide

### Getting Started

1. **Create an Account**
   - Navigate to "Manage Accounts"
   - Click "+ New Account"
   - Enter account details (name, industry, company size, website)

2. **Create an Opportunity**
   - From the dashboard, click "+ New Opportunity"
   - Select an account (or create a new one)
   - Set amount, expected close date, and initial stage
   - Click "Create Opportunity"

3. **Upload Documents**
   - Open the opportunity detail page
   - Go to the "Documents" tab
   - Upload TXT transcripts or PDF email threads (supports bulk upload)
   - Click "Upload & Analyze"
   - Wait for AI processing (30-60 seconds for typical documents)

4. **Review Analysis**
   - **Overview Tab**: Health score, stage recommendation, quick stats
   - **MEDDPICC/BANT Tab**: Detailed qualification analysis with confidence scores
   - **Insights Tab**: Red flags, risks, and next best actions
   - **Documents Tab**: View uploaded files and processing status

### Key User Flows

#### Flow 1: Document Upload & Analysis
1. Upload sales call transcripts (TXT) or email threads (PDF)
2. System extracts text content
3. AI analyzes ALL documents for the opportunity
4. Updates MEDDPICC/BANT fields with confidence scores
5. Generates red flags and next action recommendations
6. Calculates overall health score
7. Creates historical snapshot for time-series tracking

#### Flow 2: Health Score Interpretation
- **Green (75-100)**: Healthy - deal is well-qualified
- **Yellow (50-75)**: At Risk - missing key qualification elements
- **Red (0-49)**: Critical - significant gaps or risks identified

Health score calculation:
- MEDDPICC completeness: 60% weight
- BANT completeness: 30% weight
- Red flags penalty: -5 points per High severity, -2 per Medium

#### Flow 3: Stage Progression
- AI recommends stage changes based on qualification completeness
- Review recommendation in Overview tab
- Accept or dismiss AI suggestions
- Manually update stage as needed
- Stage changes are tracked in history

## API Endpoints

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/[id]` - Get account details
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

### Contacts
- `GET /api/contacts` - List contacts (optional `?accountId` filter)
- `POST /api/contacts` - Create contact
- `GET /api/contacts/[id]` - Get contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Opportunities
- `GET /api/opportunities` - List opportunities (filters: `?accountId`, `?stage`)
- `POST /api/opportunities` - Create opportunity
- `GET /api/opportunities/[id]` - Get opportunity with full analysis
- `PUT /api/opportunities/[id]` - Update opportunity
- `DELETE /api/opportunities/[id]` - Delete opportunity

### Documents & Analysis
- `POST /api/opportunities/[id]/documents` - Upload documents & trigger AI analysis
- `GET /api/opportunities/[id]/documents` - List documents

## Database Schema

See `prisma/schema.prisma` for full schema. Key models:

- **Account**: Customer companies
- **Contact**: People at accounts with stakeholder types
- **Opportunity**: Sales deals with stage tracking
- **Document**: Uploaded files with extracted text
- **MEDDPICCAnalysis**: MEDDPICC qualification data with confidence scores
- **BANTAnalysis**: BANT qualification data with confidence scores
- **AIInsight**: Red flags, next actions, and recommendations
- **AnalysisSnapshot**: Historical tracking of scores over time

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── accounts/      # Account CRUD
│   │   │   ├── contacts/      # Contact CRUD
│   │   │   └── opportunities/ # Opportunity CRUD + documents
│   │   └── crm/               # Frontend pages
│   │       ├── page.tsx       # Dashboard
│   │       ├── accounts/      # Account management
│   │       └── opportunities/ # Opportunity views
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   └── lib/
│       ├── db.ts              # Prisma client
│       ├── ai-clients.ts      # AI SDK configuration
│       ├── ai-analysis.ts     # AI analysis engine
│       └── health-score.ts    # Health score calculator
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── init-db.js             # Database initialization
└── uploads/                   # Uploaded documents storage
```

## AI Prompt Engineering

The system uses specialized prompts for each analysis type:

1. **MEDDPICC/BANT Extraction**: Analyzes all documents to extract qualification info with source citations
2. **Red Flags Detection**: Identifies risks like lack of urgency, missing stakeholders, competitor threats
3. **Next Actions**: Recommends prioritized actions to advance the deal

All prompts request:
- Structured JSON output
- Confidence scores (0-100)
- Source document references
- Evidence quotes

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database scripts
npm run db:init      # Initialize database setup
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (database GUI)
```

### Adding New Features

1. **New AI Model**: Update `lib/ai-analysis.ts` to add new model integration
2. **New Qualification Framework**: Extend database schema and analysis logic
3. **Custom Stages**: Currently hardcoded; modify stage enums in components
4. **Multi-user Support**: Implement NextAuth.js (structure already supports it)

## Troubleshooting

### Prisma Engine Download Fails
If you see "403 Forbidden" when running Prisma commands:
```bash
# Set environment variable to bypass checksum
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Or add to .env.local:
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

### AI Analysis Fails
- Verify API keys are set correctly in `.env.local`
- Check API quotas/limits
- Review console logs for specific error messages
- Documents are marked as "Error" status if analysis fails

### File Upload Issues
- Ensure `uploads/` directory exists and is writable
- Check file size limits (default 10MB)
- Only TXT and PDF files are supported

## Future Enhancements

- [ ] Email integration (auto-sync Gmail)
- [ ] Calendar integration (auto-import meeting notes)
- [ ] Custom stage definitions per company
- [ ] Multi-user with role-based permissions
- [ ] Mobile responsive design
- [ ] Export reports (PDF/Excel)
- [ ] Webhook integrations (Slack notifications)
- [ ] Voice memo upload with speech-to-text

## License

Private project - All rights reserved

## Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ using Next.js, Prisma, and cutting-edge AI models**
