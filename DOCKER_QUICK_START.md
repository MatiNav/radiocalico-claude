# Docker Quick Start

## Local Development (Manual - What's Working Now)

```bash
# Terminal 1: Flask
source venv/bin/activate
python app.py

# Terminal 2: Express
npm start
```

Visit: http://localhost:3000

## Docker Development

```bash
# Start both containers
docker-compose -f docker-compose.dev.yml up

# Rebuild if you change dependencies
docker-compose -f docker-compose.dev.yml build

# Stop
docker-compose -f docker-compose.dev.yml down
```

Visit: http://localhost:3000

## Docker Production

```bash
# Start (runs in background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Visit: http://localhost (port 80)

## How the Proxy Works

**Local/Manual Mode:**
- Browser → `localhost:3000/api/metadata`
- Express proxy → `localhost:5001/api/metadata`
- Flask responds

**Docker Dev Mode:**
- Browser → `localhost:3000/api/metadata`
- Express container proxy → `flask-api:5001/api/metadata` (using Docker service name)
- Flask container responds

**Docker Prod Mode:**
- Browser → `localhost/api/metadata`
- nginx → `localhost:5001/api/metadata` (Flask inside same container)
- Flask responds

## Key Fix

The proxy target must include `/api`:
```javascript
target: `http://localhost:5001/api`
```

This ensures the full path `/api/metadata` reaches Flask correctly.
