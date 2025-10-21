# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radio Calico is a live HLS audio streaming web application with real-time metadata display and song rating functionality. The project consists of:
- **Frontend**: Static HTML/CSS/JS served by Express.js (Node.js)
- **Backend API**: Flask (Python) providing metadata proxy and song ratings
- **Database**: SQLite for user and rating persistence

## Architecture

### Dual-Server Setup
The application runs on two servers that must both be operational:

1. **Express Server (Node.js)** - Port 3000 (default)
   - Serves static files from `public/` directory
   - Main entry point: `server.js`
   - Serves `public/index.html` as the radio player interface

2. **Flask API Server (Python)** - Port 5001
   - Main entry point: `app.py`
   - Provides REST API endpoints for metadata and ratings
   - Manages SQLite database in `data/users.db`
   - Proxies metadata from CloudFront CDN

### Database Schema
SQLite database (`data/users.db`) with two tables:

1. **users** - User registration data
   - Columns: id, name, email, phone, created_at
   - Unique constraint on email

2. **ratings** - Song rating system (thumbs up/down)
   - Columns: id, song_id, user_id, rating, created_at
   - rating: 1 = thumbs up, 0 = thumbs down
   - Unique constraint on (song_id, user_id) to prevent duplicate ratings
   - Users can update their rating for the same song

### Frontend Architecture
The frontend is organized with separation of concerns:
- **HTML** (`public/index.html`) - Structure and layout of the radio player interface
- **CSS** (`public/styles.css`) - All styling following Radio Calico brand guidelines
- **JavaScript** (`public/app.js`) - Application logic including:
  - HLS.js integration for lossless audio streaming from CloudFront
  - Real-time metadata polling (every 10 seconds) to display current/recent tracks
  - Browser fingerprinting for anonymous user identification (no login required)
  - Song rating system with persistent thumbs up/down functionality

### API Endpoints
- `GET /api/metadata` - Proxies metadata from CloudFront CDN
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users/<id>` - Delete user
- `GET /api/ratings/<song_id>` - Get thumbs up/down counts for a song
- `POST /api/ratings/<song_id>` - Submit or update rating for a song
- `GET /api/ratings/<song_id>/user/<user_id>` - Check if user has rated a song

## Development Commands

### Starting the Application
The application requires two separate terminal windows running simultaneously:

**Terminal 1: Flask Backend**
```bash
source venv/bin/activate  # Activate virtual environment
python app.py              # Runs on port 5001
```

**Terminal 2: Express Frontend**
```bash
npm start                  # Runs on port 3000 (or: node server.js)
```

Both processes run in the foreground and must remain active. Closing either terminal or pressing Ctrl+C will stop that server.

### Style Guide
- A text version of the syling guide for the webpage is at /home/student/radiocalico/RadioCalico_Style_Guide.txt
- The Radio Calico logo if at /home/student/radiocalico/RadioCalicoLogoTM.png



### Dependencies
```bash
# Python dependencies
pip install -r requirements.txt
# or in venv:
source venv/bin/activate
pip install -r requirements.txt

# Node.js dependencies
npm install
```

### Database
The database is automatically initialized when `app.py` starts (via `init_db()` function). The `data/` directory is created if it doesn't exist.

## Key Technical Details

### Stream Configuration
- **HLS Stream URL**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Metadata URL**: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`
- **Album Art URL**: `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg` (cache-busted with timestamp)
- **Stream Quality**: 48kHz FLAC, lossless quality, variable source bit depth (16-bit or 24-bit)

### User Identification System
The application uses browser fingerprinting (no login required):
- Fingerprint includes: user agent, canvas fingerprint, WebGL renderer, screen resolution, timezone, etc.
- User ID format: `fp_<16-char-hash>` (SHA-256 hash of fingerprint data)
- Allows anonymous rating without user accounts

### Brand & Design
The application follows the Radio Calico Style Guide (`RadioCalico_Style_Guide.txt`):
- **Colors**: Mint (#D8F2D5), Forest Green (#1F4E23), Teal (#38A29D), Calico Orange (#EFA63C), Charcoal (#231F20), Cream (#F5EADA)
- **Typography**: Montserrat for headings, Open Sans for body text
- **Logo**: `public/logo.png` (RadioCalicoLogoTM.png) - 50px minimum with clear space
- **Voice**: Friendly, expert, trustworthy, emphasizing lossless audio quality

### HLS.js Configuration
The player uses custom HLS.js settings optimized for stability:
- Buffer length: 30s max, 90s back buffer
- Low latency mode: disabled (prioritizes stability)
- Retry logic for network/media errors with automatic recovery
- Fallback to Safari native HLS support when available

### Style Guide
- A text version of the styling guide for the webpage is at /home/student/radiocalico/RadioCalico_Style_Guide.txt
- The Radio Calico logo if at /home/student/radiocalico/RadioCalicoLogoTM.png

## File Structure
```
radiocalico/
├── public/                      # Static frontend files served by Express
│   ├── index.html              # Main radio player interface (HTML structure)
│   ├── app.js                  # Application logic (HLS player, metadata, ratings)
│   ├── styles.css              # All styling (Radio Calico brand)
│   ├── logo.png                # Radio Calico logo
│   └── favicon.ico             # Site favicon
├── data/                        # SQLite database storage (auto-created)
│   └── users.db                # User and rating data
├── app.py                       # Flask backend API server (port 5001)
├── server.js                    # Express static file server (port 3000)
├── package.json                 # Node.js dependencies (express, cors, dotenv, better-sqlite3, http-proxy-middleware)
├── requirements.txt             # Python dependencies (flask, flask-cors)
├── venv/                        # Python virtual environment (not in git)
├── radio-player.html            # Standalone player prototype (not used in production)
├── RadioCalico_Style_Guide.txt  # Brand guidelines
├── CLAUDE.md                    # AI assistant project guidelines (this file)
└── README.md                    # Manual setup and run instructions
```

## Important Notes
- **Frontend Code Organization**: The frontend follows separation of concerns with HTML (`index.html`), CSS (`styles.css`), and JavaScript (`app.js`) in separate files
- **Backend Database**: SQLite with Flask for the API layer
- **Server Execution**: Both servers (Flask and Express) run in the foreground in separate terminals for easy management and debugging
- **Metadata Polling**: The system fetches track info every 10 seconds and updates the UI dynamically
- **Song IDs**: Generated as base64-encoded strings from `artist-title` combinations
- **Rating Updates**: Users can change their rating for the same song (UPDATE instead of INSERT when rating exists)
- **Proxy Configuration**: Express proxies `/api/*` requests to Flask backend at port 5001
