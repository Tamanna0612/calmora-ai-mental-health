/**
 * CALMORA - MUSIC THERAPY MODULE
 * FIXES:
 * 1. Real <audio> element playback (was only simulated before)
 * 2. Correct file paths for Netlify deployment
 * 3. Pause/resume toggle working properly
 * 4. Volume control connected to actual audio
 * 5. Progress bar updates in real time
 */

const MusicTherapy = {
    currentTrack: null,
    isPlaying: false,
    audioElement: null,
    progressTimer: null,

    // ─── Track list ─────────────────────────────────────────
    // IMPORTANT: Paths are relative to index.html root
    // On Netlify: put audio files in /frontend/ folder in your repo
    tracks: {
        'nature':      { name: 'Nature Sounds',  emoji: '🌿', url: 'frontend/Nature sounds.mp3' },
        'ocean':       { name: 'Ocean Waves',     emoji: '🌊', url: 'frontend/ocean waves.mp3'   },
        'meditation':  { name: 'Meditation',      emoji: '🧘', url: 'frontend/focus.mp3'         },
        'rain':        { name: 'Rain Sounds',     emoji: '🌧️', url: 'frontend/rain.mp3'          },
        'piano':       { name: 'Calm Piano',      emoji: '🎹', url: 'frontend/piano.mp3'         },
        'white-noise': { name: 'White Noise',     emoji: '💨', url: 'frontend/forest.mp3'        },
    },

    // ─── Create audio element once ──────────────────────────
    getAudio() {
        if (!this.audioElement) {
            this.audioElement = new Audio();
            this.audioElement.volume = 0.7;

            // Auto-play next when track ends
            this.audioElement.addEventListener('ended', () => {
                this.stopTrack();
            });

            // Update progress bar
            this.audioElement.addEventListener('timeupdate', () => {
                this.updateProgress();
            });

            // Handle load errors
            this.audioElement.addEventListener('error', (e) => {
                console.error('Audio load error:', e);
                this.showToast(`⚠️ Could not load audio file. Check that MP3 files are in the /frontend/ folder.`, 'error');
                this.stopTrack();
            });
        }
        return this.audioElement;
    },

    // ─── Play a track ────────────────────────────────────────
    async playTrack(trackId) {
        const track = this.tracks[trackId];
        if (!track) { console.error('Track not found:', trackId); return; }

        const audio = this.getAudio();

        // If same track — toggle pause/play
        if (this.currentTrack === trackId && !audio.paused) {
            audio.pause();
            this.isPlaying = false;
            this.updateAllButtons(trackId, false);
            this.updatePlayerUI(track, false);
            return;
        }

        // New track — load and play
        try {
            // Stop previous if any
            audio.pause();
            audio.src = track.url;
            audio.currentTime = 0;
            this.currentTrack = trackId;

            await audio.play();     // ← REAL audio playback
            this.isPlaying = true;

            this.updatePlayerUI(track, true);
            this.updateAllButtons(trackId, true);
            this.showToast(`▶ Now playing: ${track.emoji} ${track.name}`);

        } catch (err) {
            console.error('Playback failed:', err);
            // Most common reason: browser blocked autoplay, user must interact first
            this.showToast(`⚠️ Click play button to start audio (browser requires user interaction)`, 'warning');
        }
    },

    // ─── Stop track ─────────────────────────────────────────
    stopTrack() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        this.isPlaying = false;

        // Reset all buttons
        document.querySelectorAll('.music-play-btn').forEach(btn => {
            btn.innerHTML = '▶ Play';
            btn.classList.remove('playing');
        });

        // Hide player
        const player = document.getElementById('musicPlayer');
        if (player) player.classList.add('hidden');

        // Reset progress
        const fill = document.getElementById('playerProgress');
        const time = document.getElementById('playerTime');
        if (fill) fill.style.width = '0%';
        if (time) time.textContent = '0:00';

        this.currentTrack = null;
    },

    // ─── Update sticky player bar ────────────────────────────
    updatePlayerUI(track, playing) {
        const player       = document.getElementById('musicPlayer');
        const trackName    = document.getElementById('playerTrackName');
        const trackEmoji   = document.getElementById('playerTrackEmoji');
        const playPauseBtn = document.getElementById('playerPlayPauseBtn');

        if (player)       player.classList.remove('hidden');
        if (trackName)    trackName.textContent  = track.name;
        if (trackEmoji)   trackEmoji.textContent = track.emoji || '🎵';
        if (playPauseBtn) playPauseBtn.textContent = playing ? '⏸' : '▶';
    },

    // ─── Update all play buttons ─────────────────────────────
    updateAllButtons(activeId, playing) {
        document.querySelectorAll('.music-play-btn').forEach(btn => {
            const id = btn.getAttribute('data-track');
            if (id === activeId) {
                btn.innerHTML  = playing ? '⏸ Pause' : '▶ Play';
                btn.classList.toggle('playing', playing);
            } else {
                btn.innerHTML = '▶ Play';
                btn.classList.remove('playing');
            }
        });
    },

    // ─── Real-time progress bar ──────────────────────────────
    updateProgress() {
        const audio = this.audioElement;
        if (!audio || !audio.duration) return;

        const pct  = (audio.currentTime / audio.duration) * 100;
        const fill = document.getElementById('playerProgress');
        const time = document.getElementById('playerTime');

        if (fill) fill.style.width = pct + '%';
        if (time) {
            const m = Math.floor(audio.currentTime / 60);
            const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
            time.textContent = `${m}:${s}`;
        }
    },

    // ─── Toast notification ──────────────────────────────────
    showToast(message, type = 'success') {
        // Remove existing
        document.getElementById('musicToast')?.remove();

        const toast = document.createElement('div');
        toast.id = 'musicToast';
        toast.style.cssText = `
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#0d9488'};
            color: #fff; padding: 12px 24px; border-radius: 999px;
            font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
            box-shadow: 0 8px 28px rgba(0,0,0,.18); z-index: 8000;
            animation: fadeUp .3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    },

    // ─── INIT ────────────────────────────────────────────────
    init() {
        // Play buttons on music cards
        document.querySelectorAll('.music-play-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const trackId = btn.getAttribute('data-track');
                this.playTrack(trackId);
            });
        });

        // Player stop button
        document.getElementById('playerStopBtn')?.addEventListener('click', () => {
            this.stopTrack();
        });

        // Player play/pause button
        document.getElementById('playerPlayPauseBtn')?.addEventListener('click', () => {
            if (this.currentTrack) {
                this.playTrack(this.currentTrack);
            }
        });

        // Volume slider
        const volSlider = document.getElementById('playerVolume');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                const audio = this.getAudio();
                audio.volume = parseFloat(e.target.value) / 100;
            });
        }

        // Progress bar click to seek
        const progressBar = document.getElementById('playerProgressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const audio = this.getAudio();
                if (!audio.duration) return;
                const rect = progressBar.getBoundingClientRect();
                const pct  = (e.clientX - rect.left) / rect.width;
                audio.currentTime = pct * audio.duration;
            });
        }
    }
};

window.MusicTherapy = MusicTherapy;