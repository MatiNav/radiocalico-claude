# Docker Deployment Guide for Radio Calico

## What is Docker?

Docker packages your application and all its dependencies into a "container" - think of it as a lightweight, portable box that contains everything needed to run your app. This means you don't need to manually install Python, Node.js, or any other dependencies on your computer.

## The Files Explained

### Dockerfile
This is the recipe for building your container. It has two "flavors":

1. **Development** - Includes both Python and Node.js so you can edit code and see changes immediately
2. **Production** - Includes nginx (a web server), Flask, Express, and supervisord (keeps all services running)

### docker-compose.yml (Production)
The simple way to run the production version. Type one command and everything starts:
- nginx listens on port 80 (normal web traffic)
- Flask and Express run in the background
- Your database saves to the `data/` folder (persists even if you restart)

### docker-compose.dev.yml (Development)
Runs two separate containers so you can debug easier:
- One container for Flask (Python API) on port 5001
- One container for Express (Node.js frontend) on port 3000
- Your code changes are picked up automatically

### nginx.conf
nginx is a traffic director. It receives all web requests and decides where to send them:
- Requests to `/api/*` → Flask backend (port 5001)
- All other requests → Express frontend (port 3000)
- This way users only need to connect to port 80

### supervisord.conf
In production, this babysits three processes (Flask, Express, nginx). If any crashes, supervisord restarts it automatically.

## How It All Works Together

### Development Mode
```
You type: docker-compose -f docker-compose.dev.yml up

What happens:
1. Docker builds two containers (Flask + Express)
2. Flask starts on port 5001
3. Express starts on port 3000, configured to proxy API calls to Flask
4. Your code is "linked" so changes appear immediately
5. Visit http://localhost:3000 to use the app
   - The frontend is served from Express
   - API calls to /api/* are automatically forwarded to Flask
   - In Docker, containers talk to each other using service names (flask-api)
```

### Production Mode
```
You type: docker-compose up -d

What happens:
1. Docker builds one container with everything
2. supervisord starts Flask, Express, and nginx
3. nginx listens on port 80 and routes traffic
4. Visit http://localhost to use the app
5. The "-d" flag runs it in the background
```

## Common Commands

```bash
# Start production (runs in background)
docker-compose up -d

# Start development (see logs in terminal)
docker-compose -f docker-compose.dev.yml up

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose build
```

## Why This Architecture?

**Development**: Two containers let you restart just Flask or just Express without restarting everything. Easier to debug.

**Production**: One container with nginx in front is how real websites work. nginx is very fast at serving files and routing traffic. supervisord keeps everything running even if something crashes.

## The Database

The SQLite database lives in the `data/` folder on your computer. Docker mounts this folder into the container, so:
- Your data survives even if you delete the container
- You can back up the database by copying the `data/` folder
- Both dev and prod modes use the same database file

## Troubleshooting

**"Port already in use"**: Something else is using port 80/3000/5001. Stop that service first.

**"Build fails"**: Delete old containers with `docker-compose down` and try again.

**"Database won't persist"**: Make sure the `data/` folder exists and has write permissions.

**"Code changes not appearing"**: In dev mode, they should appear immediately. In prod mode, you need to rebuild: `docker-compose build && docker-compose up -d`
