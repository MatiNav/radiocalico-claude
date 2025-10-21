# Radio Calico 🎵

> A live HLS audio streaming web application with real-time metadata display and song rating functionality.

![License](https://img.shields.io/badge/license-Proprietary-red)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![Python](https://img.shields.io/badge/python-%3E%3D3.7-blue)

## ✨ Features

Radio Calico streams **lossless audio** (48kHz FLAC) from CloudFront CDN with a modern web player interface:

- 🎧 **HLS.js-powered streaming** - High-quality lossless audio playback
- 📊 **Real-time metadata** - Live track info, album art, and audio quality display
- 👍👎 **Anonymous rating system** - Rate tracks without login using browser fingerprinting
- 🎨 **Modern UI** - Responsive design following Radio Calico brand guidelines
- 🔄 **Auto-recovery** - Automatic error handling and stream reconnection

## 📸 Screenshots

*(Add screenshots of your radio player here)*

## 🏗️ Architecture

This application uses a **dual-server architecture**:

| Server | Technology | Port | Purpose |
|--------|-----------|------|---------|
| **Frontend** | Express (Node.js) | 3000 | Serves static files (`public/` directory) |
| **Backend API** | Flask (Python) | 5001 | Metadata proxy, ratings, SQLite database |

### Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- [HLS.js](https://github.com/video-dev/hls.js/) - HLS player library
- Express.js - Static file server with API proxy

**Backend:**
- Flask - REST API framework
- SQLite - Lightweight database
- Flask-CORS - Cross-origin resource sharing

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd radiocalico

# Install dependencies
npm install
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start both servers (in separate terminals)
# Terminal 1:
source venv/bin/activate && python app.py

# Terminal 2:
npm start

# Open browser
# Navigate to http://localhost:3000
```

## 📋 Prerequisites

- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **Python 3** v3.7 or higher ([Download](https://www.python.org/downloads/))
- **npm** (comes with Node.js)
- **pip** (comes with Python)

## 🔧 Installation

### 1. Install Node.js Dependencies

```bash
npm install
```

**Dependencies installed:**
- `express` - Web server framework
- `http-proxy-middleware` - API request proxying
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `better-sqlite3` - SQLite database driver

### 2. Install Python Dependencies

#### Option A: Using a Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

#### Option B: Global Installation

```bash
pip install -r requirements.txt
```

**Dependencies installed:**
- `flask` - Web framework for Python
- `flask-cors` - Cross-origin resource sharing for Flask

## ▶️ Running the Application

Both servers must be running simultaneously for the application to work properly. You'll need **two separate terminal windows/tabs**.

### Terminal 1: Start Backend (Flask API Server)

```bash
# If using virtual environment, activate it first
source venv/bin/activate  # On macOS/Linux

# Start Flask server (runs on port 5001)
python app.py
```

The Flask server will:
- Automatically create the `data/` directory if it doesn't exist
- Initialize the SQLite database (`data/users.db`) with required tables
- Start listening on `http://localhost:5001`
- **Keep this terminal running** - closing it will stop the Flask server

### Terminal 2: Start Frontend (Express Server)

**Open a new terminal window/tab:**

```bash
# Start Express server (runs on port 3000)
npm start

# OR alternatively:
node server.js
```

The Express server will start listening on `http://localhost:3000`

**Keep this terminal running** - closing it will stop the Express server

### Access the Application

With both terminals running, open your browser and navigate to:
```
http://localhost:3000
```

### Stopping the Application

To stop the servers:
- Press `Ctrl+C` in each terminal window
- Or simply close the terminal windows

**Important:** Both processes run in the foreground and are tied to their terminal sessions. This means:
- You must keep both terminals open while using the app
- Closing a terminal will stop that server
- You can restart either server independently by running the command again

## 🔌 API Endpoints

The Flask API (port 5001) provides:

- `GET /api/metadata` - Proxies metadata from CloudFront CDN
- `GET /api/users` - List all registered users
- `POST /api/users` - Create new user
- `DELETE /api/users/<id>` - Delete user by ID
- `GET /api/ratings/<song_id>` - Get thumbs up/down counts for a song
- `POST /api/ratings/<song_id>` - Submit or update rating (requires `user_id` and `rating` in JSON body)
- `GET /api/ratings/<song_id>/user/<user_id>` - Check if user has rated a song

## 📡 Stream Configuration

- **HLS Stream**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Metadata**: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`
- **Album Art**: `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg`
- **Quality**: 48kHz FLAC, lossless (16-bit or 24-bit variable source)

## 💾 Database

The application uses SQLite with the following schema:

### `users` table
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT)
- `email` (TEXT UNIQUE)
- `phone` (TEXT)
- `created_at` (TIMESTAMP)

### `ratings` table
- `id` (INTEGER PRIMARY KEY)
- `song_id` (TEXT)
- `user_id` (TEXT)
- `rating` (INTEGER) - 1 for thumbs up, 0 for thumbs down
- `created_at` (TIMESTAMP)
- Unique constraint on `(song_id, user_id)`

## 📁 Project Structure

```
radiocalico/
├── public/                          # Static frontend files
│   ├── index.html                  # Main radio player (HTML structure)
│   ├── app.js                      # Application logic (HLS, metadata, ratings)
│   ├── styles.css                  # All styling (brand guidelines)
│   ├── logo.png                    # Radio Calico logo
│   └── favicon.ico                 # Site favicon
├── data/                            # Auto-created database directory (gitignored)
│   └── users.db                    # SQLite database
├── venv/                            # Python virtual environment (gitignored)
├── app.py                           # Flask API server (port 5001)
├── server.js                        # Express static file server (port 3000)
├── package.json                     # Node.js dependencies
├── package-lock.json                # Node.js dependency lockfile
├── requirements.txt                 # Python dependencies
├── .gitignore                       # Git ignore rules
├── CLAUDE.md                        # AI assistant project guidelines
├── RadioCalico_Style_Guide.txt      # Brand guidelines
└── README.md                        # This file
```

## 🛠️ Troubleshooting

### Port Already in Use

If you get an error that port 3000 or 5001 is already in use:

```bash
# Find what's using the port (macOS/Linux)
lsof -i :3000
lsof -i :5001

# Kill the process
kill -9 <PID>
```

### Database Issues

If you encounter database errors, try deleting and recreating it:

```bash
rm -rf data/users.db
python app.py  # Will recreate the database
```

### CORS Errors

Make sure both servers are running and that the Flask server has `flask-cors` installed.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Notes

- Frontend follows separation of concerns: HTML (`index.html`), CSS (`styles.css`), JavaScript (`app.js`)
- Both servers must run simultaneously for full functionality
- Database is auto-created on first run
- Rating system uses browser fingerprinting (no login required)
- Song IDs are base64-encoded from `artist-title` combinations

## 🔒 Security Notes

- The `data/` directory is gitignored to prevent committing user data
- Environment variables should be stored in `.env` file (gitignored)
- CORS is configured to allow requests between frontend and backend

## 📄 License

Copyright © Radio Calico. All rights reserved.

---

**Built with ❤️ using Node.js, Python, and HLS.js**
