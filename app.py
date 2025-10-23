import logging
import os
import sqlite3
from datetime import datetime

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE = "data/users.db"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Request logging middleware (only in debug mode)
@app.before_request
def log_request_info():
    # Only enable verbose logging in debug/development mode
    if app.debug or os.environ.get("FLASK_ENV") == "development":
        timestamp = datetime.now().isoformat()
        logger.info(f"[{timestamp}] Incoming Request:")
        logger.info(f"  Method: {request.method}")
        logger.info(f"  URL: {request.url}")
        logger.info(f"  Path: {request.path}")
        logger.info(f"  Query Params: {dict(request.args)}")
        logger.info(f"  Headers: {dict(request.headers)}")
        if request.is_json and request.get_json():
            logger.info(f"  JSON Body: {request.get_json()}")
        elif request.form:
            logger.info(f"  Form Data: {dict(request.form)}")


def get_db_connection():
    """Create a database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database with users table."""
    os.makedirs("data", exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            song_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(song_id, user_id)
        )
    """
    )

    conn.commit()
    conn.close()
    print("✓ Database initialized successfully!")


# Initialize database on startup
init_db()


@app.route("/api/metadata")
def get_metadata():
    """Proxy endpoint to fetch stream metadata."""
    try:
        response = requests.get(
            "https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json", timeout=5
        )
        response.raise_for_status()
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/users", methods=["GET"])
def get_users():
    """Get all users."""
    conn = get_db_connection()
    users = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(user) for user in users])


@app.route("/api/users", methods=["POST"])
def create_user():
    """Create a new user."""
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone", "")

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, phone) VALUES (?, ?, ?)",
            (name, email, phone),
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()

        return jsonify({"message": "User created successfully", "id": user_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Delete a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()

    if deleted:
        return jsonify({"message": "User deleted successfully"})
    else:
        return jsonify({"error": "User not found"}), 404


@app.route("/api/ratings/<song_id>", methods=["GET"])
def get_ratings(song_id):
    """Get ratings for a song."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get thumbs up count
    thumbs_up = cursor.execute(
        "SELECT COUNT(*) FROM ratings WHERE song_id = ? AND rating = 1", (song_id,)
    ).fetchone()[0]

    # Get thumbs down count
    thumbs_down = cursor.execute(
        "SELECT COUNT(*) FROM ratings WHERE song_id = ? AND rating = 0", (song_id,)
    ).fetchone()[0]

    conn.close()

    return jsonify(
        {"song_id": song_id, "thumbs_up": thumbs_up, "thumbs_down": thumbs_down}
    )


@app.route("/api/ratings/<song_id>", methods=["POST"])
def rate_song(song_id):
    """Rate a song or update existing rating."""
    data = request.get_json()
    user_id = data.get("user_id")
    rating = data.get("rating")  # 1 for thumbs up, 0 for thumbs down

    if user_id is None or rating is None:
        return jsonify({"error": "user_id and rating are required"}), 400

    if rating not in [0, 1]:
        return (
            jsonify({"error": "rating must be 0 (thumbs down) or 1 (thumbs up)"}),
            400,
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if user has already rated this song
    existing = cursor.execute(
        "SELECT rating FROM ratings WHERE song_id = ? AND user_id = ?",
        (song_id, user_id),
    ).fetchone()

    if existing:
        # Update existing rating
        cursor.execute(
            "UPDATE ratings SET rating = ? WHERE song_id = ? AND user_id = ?",
            (rating, song_id, user_id),
        )
        message = "Rating updated successfully"
    else:
        # Insert new rating
        cursor.execute(
            "INSERT INTO ratings (song_id, user_id, rating) VALUES (?, ?, ?)",
            (song_id, user_id, rating),
        )
        message = "Rating saved successfully"

    conn.commit()

    # Get updated counts
    thumbs_up = cursor.execute(
        "SELECT COUNT(*) FROM ratings WHERE song_id = ? AND rating = 1", (song_id,)
    ).fetchone()[0]

    thumbs_down = cursor.execute(
        "SELECT COUNT(*) FROM ratings WHERE song_id = ? AND rating = 0", (song_id,)
    ).fetchone()[0]

    conn.close()

    return (
        jsonify(
            {
                "message": message,
                "song_id": song_id,
                "thumbs_up": thumbs_up,
                "thumbs_down": thumbs_down,
            }
        ),
        200,
    )


@app.route("/api/ratings/<song_id>/user/<user_id>", methods=["GET"])
def get_user_rating(song_id, user_id):
    """Check if user has rated this song."""
    conn = get_db_connection()
    cursor = conn.cursor()

    rating = cursor.execute(
        "SELECT rating FROM ratings WHERE song_id = ? AND user_id = ?",
        (song_id, user_id),
    ).fetchone()

    conn.close()

    if rating:
        return jsonify({"has_rated": True, "rating": rating[0]})
    else:
        return jsonify({"has_rated": False})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
