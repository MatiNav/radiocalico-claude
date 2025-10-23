# Multi-stage Dockerfile for Radio Calico
# Supports both development and production builds

# Stage 1: Base Python image with Flask backend
FROM python:3.11-slim as python-base

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask application
COPY app.py .

# Create data directory for SQLite database
RUN mkdir -p data

# Stage 2: Base Node.js image with Express frontend
FROM node:18-slim as node-base

WORKDIR /app

# Install Node.js dependencies
COPY package*.json .
RUN npm ci --only=production

# Copy Express server and public files
COPY server.js .
COPY public/ ./public/

# Stage 3: Development image (includes both Python and Node.js)
FROM python:3.11-slim as development

WORKDIR /app

# Install Node.js and build tools for native modules
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3-dev \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
COPY package*.json .
RUN npm ci

# Copy application files
COPY app.py .
COPY server.js .
COPY public/ ./public/

# Create data directory
RUN mkdir -p data

# Expose ports
EXPOSE 3000 5001

# Development runs both servers using a process manager
# In dev mode, we'll use docker-compose to run them separately for easier debugging

# Stage 4: Production image with nginx reverse proxy
FROM nginx:alpine as production

# Install Python, Node.js, and build tools for better-sqlite3
RUN apk add --no-cache python3 py3-pip nodejs npm supervisor \
    build-base python3-dev

WORKDIR /app

# Copy Python dependencies and install
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy Node.js dependencies and install
COPY package*.json .
RUN npm ci --only=production

# Copy application files
COPY app.py .
COPY server.js .
COPY public/ ./public/

# Create data directory
RUN mkdir -p data

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Expose only nginx port in production
EXPOSE 80

# Run supervisor to manage both Flask and Express servers
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
