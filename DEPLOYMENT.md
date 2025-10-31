# Deployment Guide - Sales Call Feedback AI

This guide will help you deploy the app so your friends can access it from their Chrome browsers.

## 🚀 Quick Start Options

### Option 1: Railway (Recommended - Easiest)
**Cost**: ~$5-10/month | **Setup Time**: 10 minutes | **Best for**: Quick deployment

### Option 2: DigitalOcean/VPS
**Cost**: ~$12/month | **Setup Time**: 20 minutes | **Best for**: Full control

### Option 3: Local Network Only (Free)
**Cost**: Free | **Setup Time**: 5 minutes | **Best for**: Testing with friends on same WiFi

---

## ☁️ Option 1: Deploy to Railway (EASIEST)

Railway is a platform that makes deployment super simple.

### Step 1: Prepare Your Environment File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```bash
   # Required: Get from https://platform.deepgram.com
   DEEPGRAM_API_KEY=your_deepgram_key_here

   # Optional but recommended: Get from https://platform.openai.com
   OPENAI_API_KEY=your_openai_key_here

   # Generate a random secret
   JWT_SECRET=your_random_secret_here_change_this
   ```

### Step 2: Deploy to Railway

1. **Create a Railway account** at https://railway.app (free to start)

2. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

3. **Login to Railway**:
   ```bash
   railway login
   ```

4. **Initialize and deploy**:
   ```bash
   railway init
   railway up
   ```

5. **Add PostgreSQL database**:
   - Go to your Railway dashboard
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set DATABASE_URL

6. **Add Redis**:
   - Click "New" → "Database" → "Add Redis"
   - Railway will automatically set REDIS_URL

7. **Set environment variables**:
   - In Railway dashboard, go to your service
   - Click "Variables" tab
   - Add all variables from your `.env` file

8. **Get your public URL**:
   - Railway will provide a URL like `https://your-app.up.railway.app`
   - Share this URL with your friends!

### Step 3: Update CORS Settings

After deployment, update your environment variables in Railway:
```
CORS_ORIGINS=https://your-app.up.railway.app
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-app.up.railway.app/ws
```

---

## 🖥️ Option 2: Deploy to DigitalOcean/VPS

### Prerequisites
- A DigitalOcean droplet or VPS (Ubuntu 22.04 recommended)
- Domain name (optional but recommended)

### Step 1: Set Up Your Server

1. **SSH into your server**:
   ```bash
   ssh root@your_server_ip
   ```

2. **Install Docker and Docker Compose**:
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt install docker-compose -y
   ```

3. **Install Git**:
   ```bash
   apt install git -y
   ```

### Step 2: Deploy Your App

1. **Clone your repository**:
   ```bash
   git clone <your-repo-url>
   cd new-andrew-code
   ```

2. **Create and configure .env file**:
   ```bash
   cp .env.example .env
   nano .env
   ```

   Update these values:
   ```bash
   # Your API keys
   DEEPGRAM_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here

   # Use your server's IP or domain
   CORS_ORIGINS=http://your_server_ip:3000
   NEXT_PUBLIC_API_URL=http://your_server_ip:8000
   NEXT_PUBLIC_WS_URL=ws://your_server_ip:8000/ws

   # Security
   JWT_SECRET=generate_random_secret_here
   POSTGRES_PASSWORD=strong_password_here
   ```

3. **Build and start the application**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Check if everything is running**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

   You should see all services running:
   - postgres
   - redis
   - backend
   - frontend

### Step 3: Access Your App

- Open browser: `http://your_server_ip:3000`
- Share this URL with friends!

### Step 4: (Optional) Set Up Domain with HTTPS

1. **Install Nginx**:
   ```bash
   apt install nginx -y
   ```

2. **Install Certbot for SSL**:
   ```bash
   apt install certbot python3-certbot-nginx -y
   ```

3. **Configure Nginx** (create `/etc/nginx/sites-available/sales-app`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /ws {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable the site**:
   ```bash
   ln -s /etc/nginx/sites-available/sales-app /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

5. **Get SSL certificate**:
   ```bash
   certbot --nginx -d your-domain.com
   ```

6. **Update .env with HTTPS URLs**:
   ```bash
   CORS_ORIGINS=https://your-domain.com
   NEXT_PUBLIC_API_URL=https://your-domain.com
   NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws
   ```

7. **Restart services**:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## 🏠 Option 3: Local Network Access (Free)

This allows friends on your WiFi to access the app.

### Step 1: Find Your Local IP

**On Mac/Linux**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows**:
```bash
ipconfig
```

Look for your local IP (usually starts with `192.168.x.x`)

### Step 2: Update Environment

Edit `.env`:
```bash
CORS_ORIGINS=http://192.168.x.x:3000
NEXT_PUBLIC_API_URL=http://192.168.x.x:8000
NEXT_PUBLIC_WS_URL=ws://192.168.x.x:8000/ws
```

### Step 3: Start the App

```bash
docker-compose up -d
```

### Step 4: Share with Friends

Give them the URL: `http://192.168.x.x:3000`

**Note**: This only works when:
- You're all on the same WiFi network
- Your computer is running
- Your firewall allows connections (you may need to allow ports 3000 and 8000)

---

## 📱 Accessing from Chrome Browser

Once deployed, your friends can:

1. Open Chrome on any device
2. Go to your deployment URL:
   - Railway: `https://your-app.up.railway.app`
   - VPS: `http://your-server-ip:3000` or `https://your-domain.com`
   - Local: `http://192.168.x.x:3000`

3. Grant microphone permissions when prompted

---

## 🔧 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Can't connect to database
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### WebSocket connection fails
- Make sure your CORS_ORIGINS includes your frontend URL
- For HTTPS sites, use `wss://` instead of `ws://` in NEXT_PUBLIC_WS_URL
- Check firewall settings allow WebSocket connections

### Microphone not working
- Browsers require HTTPS for microphone access (except localhost)
- Make sure users click "Allow" when prompted
- Check browser console for errors

---

## 🔐 Security Checklist

Before sharing with others:

- [ ] Changed `JWT_SECRET` to a random string
- [ ] Changed `POSTGRES_PASSWORD` to a strong password
- [ ] Set up HTTPS (for public deployment)
- [ ] Updated CORS_ORIGINS to your actual domain
- [ ] Added Deepgram API key
- [ ] (Optional) Added OpenAI/Anthropic API key
- [ ] Tested the app works from another device

---

## 💰 Cost Estimates

| Platform | Monthly Cost | Setup Difficulty |
|----------|--------------|------------------|
| Railway | $5-10 | ⭐ Easy |
| DigitalOcean | $12+ | ⭐⭐ Medium |
| AWS/GCP | $10-30 | ⭐⭐⭐ Hard |
| Local Network | Free | ⭐ Very Easy |

---

## 🆘 Need Help?

Common issues:

1. **"Cannot connect to backend"**
   - Check NEXT_PUBLIC_API_URL matches your backend URL
   - Verify CORS_ORIGINS includes your frontend URL

2. **"Database connection failed"**
   - Ensure PostgreSQL service is running
   - Check DATABASE_URL is correct

3. **"Microphone not detected"**
   - Use HTTPS (required for microphone access)
   - Check browser permissions

4. **Friends can't access**
   - Verify firewall rules allow traffic on ports 3000, 8000
   - Check the URL you shared is correct
   - For local network: ensure they're on same WiFi

---

## 📊 Monitoring Your Deployment

### Check Service Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Stop Everything
```bash
docker-compose -f docker-compose.prod.yml down
```

### Update and Redeploy
```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🎉 You're Done!

Your app is now accessible to your friends. Share the URL and they can start using it from their Chrome browsers!

**Pro Tip**: For the best experience, use Railway or a VPS with HTTPS. This ensures:
- Secure connections
- Microphone access works everywhere
- Professional looking URLs
- Always accessible (not dependent on your computer being on)
