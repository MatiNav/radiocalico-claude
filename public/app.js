const audio = document.getElementById('audio');
const statusDiv = document.getElementById('status');
const streamUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';

// Set initial volume
audio.volume = 0.7;

// Initialize HLS
let hls;
function initPlayer() {
    if (Hls.isSupported()) {
        hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 3,
            maxFragLookUpTolerance: 0.25,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            liveDurationInfinity: false,
            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 3,
            manifestLoadingRetryDelay: 1000,
            levelLoadingTimeOut: 10000,
            levelLoadingMaxRetry: 4,
            levelLoadingRetryDelay: 1000,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1000,
            startFragPrefetch: true,
            testBandwidth: true
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            updateStatus('Stream loaded successfully', 'stopped');
            console.log('HLS manifest parsed successfully');
        });

        hls.on(Hls.Events.FRAG_LOADED, function() {
            console.log('Fragment loaded');
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS error:', data);

            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        updateStatus('Network error - attempting to recover...', 'error');
                        console.log('Fatal network error encountered, trying to recover');
                        setTimeout(() => {
                            hls.startLoad();
                        }, 1000);
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        updateStatus('Media error - attempting to recover...', 'error');
                        console.log('Fatal media error encountered, trying to recover');
                        hls.recoverMediaError();
                        break;
                    default:
                        updateStatus('Fatal error - reloading stream...', 'error');
                        console.log('Fatal error, destroying and recreating HLS instance');
                        hls.destroy();
                        setTimeout(initPlayer, 2000);
                        break;
                }
            } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                updateStatus('Buffering...', 'loading');
            }
        });

        hls.on(Hls.Events.BUFFER_APPENDING, function() {
            console.log('Buffer appending');
        });

        hls.on(Hls.Events.BUFFER_APPENDED, function() {
            console.log('Buffer appended');
        });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        audio.src = streamUrl;
        updateStatus('Stream loaded successfully', 'stopped');
    } else {
        updateStatus('HLS is not supported in this browser', 'error');
    }
}

// Update status display
function updateStatus(message, type) {
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
    }
    console.log(`[Status] ${message}`);
}

// Audio event listeners
audio.addEventListener('playing', function() {
    updateStatus('Playing live stream', 'playing');
});

audio.addEventListener('pause', function() {
    updateStatus('Paused', 'stopped');
});

audio.addEventListener('waiting', function() {
    updateStatus('Buffering...', 'loading');
});

audio.addEventListener('error', function() {
    updateStatus('Error loading stream', 'error');
});

// Initialize player on page load
initPlayer();

// ========== Metadata Fetching ==========
const metadataUrl = '/api/metadata';
const nowPlayingContent = document.getElementById('nowPlayingContent');
const recentlyPlayedContent = document.getElementById('recentlyPlayedContent');
let lastTrackTitle = '';

async function fetchMetadata() {
    try {
        const response = await fetch(metadataUrl, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        updateNowPlaying(data);
        updateRecentlyPlayed(data);
    } catch (error) {
        console.error('Error fetching metadata:', error);
        nowPlayingContent.innerHTML = '<div class="loading-metadata">Unable to load track info</div>';
        recentlyPlayedContent.innerHTML = '<div class="loading-metadata">Unable to load recent tracks</div>';
    }
}

function updateNowPlaying(data) {
    if (!data.title) {
        return;
    }

    const bitDepth = data.bit_depth || 16;
    const sampleRate = data.sample_rate || 44100;
    const albumArtUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg?' + Date.now();

    // Extract year from date if available
    const year = data.date || '';

    // Update album art
    document.getElementById('albumArt').src = albumArtUrl;

    // Update year badge
    if (year) {
        document.getElementById('yearBadge').textContent = year;
        document.getElementById('yearBadge').style.display = 'block';
    } else {
        document.getElementById('yearBadge').style.display = 'none';
    }

    // Update track info
    document.getElementById('trackArtist').textContent = escapeHtml(data.artist || 'Unknown Artist');

    // Add year to title if available
    const titleWithYear = year ? `${data.title} (${year})` : data.title;
    document.getElementById('trackTitle').textContent = escapeHtml(titleWithYear);

    if (data.album) {
        document.getElementById('trackAlbum').textContent = escapeHtml(data.album);
    }

    // Update quality info
    document.getElementById('sourceQuality').textContent = `Source quality: ${bitDepth}-bit ${(sampleRate / 1000).toFixed(1)}kHz`;

    // Load ratings for this song
    loadRatings(data);
}

function updateRecentlyPlayed(data) {
    // Build history from prev_title_X and prev_artist_X fields
    const recentTracks = [];
    for (let i = 1; i <= 5; i++) {
        const title = data[`prev_title_${i}`];
        const artist = data[`prev_artist_${i}`];

        if (title) {
            recentTracks.push({ title, artist });
        }
    }

    if (recentTracks.length === 0) {
        recentlyPlayedContent.innerHTML = '<div class="loading-metadata">No recent tracks</div>';
        return;
    }

    recentlyPlayedContent.innerHTML = recentTracks.map(track => `
        <div class="recent-track">
            <span class="recent-track-artist">${escapeHtml(track.artist || 'Unknown Artist')}</span>: <span class="recent-track-title">${escapeHtml(track.title)}</span>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fetch metadata immediately
fetchMetadata();

// Update metadata every 10 seconds
setInterval(fetchMetadata, 10000);

// ========== Rating System ==========
let currentSongId = '';
let userId = '';

// Generate browser fingerprint for consistent user ID
async function generateUserId() {
    const fingerprint = await getBrowserFingerprint();
    userId = 'fp_' + fingerprint;
    console.log('User ID:', userId);
}

async function getBrowserFingerprint() {
    // Collect browser characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();

    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages?.join(',') || '',
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: navigator.deviceMemory || 0,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvasData.substring(0, 100),
        plugins: Array.from(navigator.plugins || []).map(p => p.name).join(','),
        webgl: getWebGLFingerprint()
    };

    // Create hash from fingerprint
    const fingerprintString = JSON.stringify(fingerprint);
    const hash = await hashString(fingerprintString);
    return hash;
}

function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return '';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return debugInfo ?
            gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    } catch (e) {
        return '';
    }
}

async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// Initialize user ID
generateUserId();

function getSongId(data) {
    // Create unique song ID from artist and title
    return btoa(encodeURIComponent(`${data.artist}-${data.title}`));
}

async function loadRatings(data) {
    currentSongId = getSongId(data);

    // Wait for userId to be generated if not ready
    if (!userId) {
        await generateUserId();
    }

    try {
        // Check if user has already rated this song
        const userRatingResponse = await fetch(`/api/ratings/${currentSongId}/user/${userId}`);
        const userRatingData = await userRatingResponse.json();

        const thumbsUpBtn = document.getElementById('thumbsUpBtn');
        const thumbsDownBtn = document.getElementById('thumbsDownBtn');

        if (userRatingData.has_rated) {
            // Highlight the current rating but keep buttons enabled for changing
            if (userRatingData.rating === 1) {
                thumbsUpBtn.classList.add('active-up');
                thumbsDownBtn.classList.remove('active-down');
            } else {
                thumbsDownBtn.classList.add('active-down');
                thumbsUpBtn.classList.remove('active-up');
            }
        }
    } catch (error) {
        console.error('Error loading ratings:', error);
    }
}

async function rateSong(rating) {
    // Wait for userId to be generated if not ready
    if (!userId) {
        await generateUserId();
    }

    try {
        const response = await fetch(`/api/ratings/${currentSongId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                rating: rating
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Highlight the selected button and unhighlight the other
            const thumbsUpBtn = document.getElementById('thumbsUpBtn');
            const thumbsDownBtn = document.getElementById('thumbsDownBtn');

            if (rating === 1) {
                thumbsUpBtn.classList.add('active-up');
                thumbsDownBtn.classList.remove('active-down');
            } else {
                thumbsDownBtn.classList.add('active-down');
                thumbsUpBtn.classList.remove('active-up');
            }

            // Show feedback message
            if (data.message.includes('updated')) {
                console.log('Rating changed successfully');
            }
        } else {
            alert(data.error || 'Failed to save rating');
        }
    } catch (error) {
        console.error('Error rating song:', error);
        alert('Failed to save rating');
    }
}
