```
# 🚀 Deployment Guide

Complete guide to deploying your AI Sales Call Feedback system to production.

---

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend)
**Best for:** Quick deployment, auto-scaling
**Cost:** Free tier available
**Time:** 15-30 minutes

### Option 2: AWS (Full Stack)
**Best for:** Enterprise, full control
**Cost:** ~$50-100/month
**Time:** 1-2 hours

### Option 3: Docker + DigitalOcean/Linode
**Best for:** Cost-effective, simple
**Cost:** $12-20/month
**Time:** 30-60 minutes

---

## 📦 Option 1: Vercel + Railway (Recommended)

### Frontend Deployment (Vercel)

**Step 1: Prepare Repository**
```bash
# Ensure all changes are committed
git add -A
git commit -m "Prepare for deployment"
git push origin main
```

**Step 2: Deploy to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set build command: npm run build
# - Set output directory: .next
```

**Step 3: Configure Environment Variables**
In Vercel dashboard:
- `NEXT_PUBLIC_API_URL` = Your backend URL
- `NEXT_PUBLIC_WS_URL` = Your WebSocket URL

**Step 4: Deploy**
```bash
vercel --prod
```

### Backend Deployment (Railway)

**Step 1: Create Railway Project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
cd backend
railway init
```

**Step 2: Configure**
Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Step 3: Set Environment Variables**
```bash
railway variables set DEEPGRAM_API_KEY=your_key_here
railway variables set OPENAI_API_KEY=your_key_here
railway variables set DATABASE_URL=postgresql://...
```

**Step 4: Deploy**
```bash
railway up
```

**Step 5: Get URLs**
```bash
railway domain  # Get your backend URL
```

---

## 🐳 Option 2: Docker Deployment

### Create Docker Files

**backend/Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**frontend/Dockerfile**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml** (already created)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: sales_feedback_db
      POSTGRES_USER: sales_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://sales_user:${DB_PASSWORD}@postgres:5432/sales_feedback_db
      - REDIS_URL=redis://redis:6379
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=https://your-backend-url.com
      - NEXT_PUBLIC_WS_URL=wss://your-backend-url.com
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Deploy to DigitalOcean

**Step 1: Create Droplet**
- Choose Ubuntu 22.04
- Select plan ($12-20/month)
- Add SSH key

**Step 2: Setup Server**
```bash
# SSH into server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose

# Clone repository
git clone your-repo-url
cd your-repo
```

**Step 3: Configure Environment**
```bash
# Create .env file
cat > .env <<EOF
DB_PASSWORD=your_secure_password
DEEPGRAM_API_KEY=your_key
OPENAI_API_KEY=your_key
EOF
```

**Step 4: Deploy**
```bash
docker-compose up -d
```

**Step 5: Setup Domain**
- Point your domain to server IP
- Install Nginx for reverse proxy
- Get SSL certificate with Certbot

---

## ☁️ Option 3: AWS Deployment

### Architecture
```
CloudFront (CDN)
    ↓
S3 (Frontend) + API Gateway
    ↓
Lambda (Backend) or ECS (Containers)
    ↓
RDS (PostgreSQL) + ElastiCache (Redis)
```

### Using AWS Amplify (Easiest)

**Step 1: Install Amplify CLI**
```bash
npm install -g @aws-amplify/cli
amplify configure
```

**Step 2: Initialize**
```bash
cd frontend
amplify init
```

**Step 3: Add Hosting**
```bash
amplify add hosting
# Choose: Amazon CloudFront and S3

amplify publish
```

### Using ECS (Containers)

**Step 1: Push to ECR**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t sales-call-backend ./backend
docker tag sales-call-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/sales-call-backend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/sales-call-backend:latest
```

**Step 2: Create ECS Service**
- Use AWS Console or CloudFormation
- Configure task definitions
- Set environment variables
- Configure load balancer

---

## 🔒 Security Checklist

### Before Deployment:

- [ ] Change all default passwords
- [ ] Set up environment variables properly
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up monitoring/alerts
- [ ] Review API key permissions
- [ ] Enable database encryption
- [ ] Set up VPC (if using AWS)
- [ ] Configure secrets management

### Environment Variables Needed:

**Backend:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
DEEPGRAM_API_KEY=your_key
OPENAI_API_KEY=your_key  # or ANTHROPIC_API_KEY
JWT_SECRET=random_secure_string
CORS_ORIGINS=https://your-frontend.com
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
```

---

## 📊 Monitoring & Logging

### Recommended Tools:

**Application Monitoring:**
- Sentry (errors)
- LogRocket (session replay)
- DataDog (APM)

**Infrastructure:**
- CloudWatch (AWS)
- Railway Metrics
- Vercel Analytics

**Setup Example (Sentry):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs

# Add to backend:
pip install sentry-sdk[fastapi]
```

---

## 🚦 Health Checks

Add to production:

**Backend `/health`:**
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": check_db_connection(),
        "redis": check_redis_connection(),
        "deepgram": deepgram_service.is_enabled(),
        "ai": ai_service.is_enabled()
    }
```

**Frontend Health:**
- Use Vercel's built-in health checks
- Or add `/api/health` endpoint

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 💰 Cost Estimates

### Free Tier (Development):
- Vercel: Free (hobby)
- Railway: $5/month (500 hours)
- Deepgram: $200 credit
- OpenAI: Pay as you go (~$5-20/month)
**Total: ~$10-25/month**

### Small Production:
- Vercel Pro: $20/month
- Railway: $20/month
- Database: $10/month
- APIs: $50/month
**Total: ~$100/month**

### Enterprise:
- AWS ECS: $50-100/month
- RDS: $50/month
- ElastiCache: $30/month
- APIs: $200/month
**Total: ~$300-400/month**

---

## 📱 Post-Deployment

### 1. Test Everything
```bash
# Backend
curl https://api.your-domain.com/health

# Frontend
open https://your-domain.com

# WebSocket
wscat -c wss://api.your-domain.com/ws/test-123
```

### 2. Monitor Logs
```bash
# Railway
railway logs

# Vercel
vercel logs

# Docker
docker-compose logs -f
```

### 3. Setup Alerts
- Configure uptime monitoring (Uptime Robot)
- Set up error alerts (Sentry)
- Monitor API usage
- Track database performance

---

## 🆘 Troubleshooting

### Common Issues:

**WebSocket not connecting:**
- Check CORS settings
- Verify WSS (not WS) in production
- Check load balancer timeout settings

**Database connection fails:**
- Verify connection string
- Check firewall rules
- Ensure database is in same region

**High latency:**
- Enable CDN
- Optimize database queries
- Add Redis caching
- Use connection pooling

---

## 🎉 Success Checklist

After deployment:

- [ ] Frontend loads at your domain
- [ ] Backend API responds
- [ ] WebSocket connects
- [ ] Audio streaming works
- [ ] Transcription works
- [ ] Database saves calls
- [ ] Call history displays
- [ ] SSL/HTTPS enabled
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Documentation updated

---

## 📞 Support

If you need help:
1. Check logs first
2. Review error messages
3. Test locally with same config
4. Check API service status
5. Review firewall/security rules

---

**Your app is production-ready!** 🚀

Choose your deployment method and follow the guide above. All the code is already optimized for production deployment.
```
