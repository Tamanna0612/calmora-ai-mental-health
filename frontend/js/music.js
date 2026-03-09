/**
 * CALMORA - MUSIC THERAPY MODULE
 * Handles therapeutic music playback with minimal player
 */

const MusicTherapy = {
    currentTrack: null,
    isPlaying: false,

    // Audio elements for different tracks (using placeholder audio)
    tracks: {
        'nature': { name: 'Nature Sounds', url: "frontend/Nature sounds.mp3" },
        'ocean': { name: 'Ocean Waves', url: "frontend/ocean waves.mp3" },
        'meditation': { name: 'Meditation', url:"frontend/focus.mp3"},
        'rain': { name: 'Rain Sounds', url: "frontend/rain.mp3" },
        'piano': { name: 'Calm Piano', url: "frontend/piano.mp3" },
        'white-noise': { name: 'White Noise', url: "frontend/forest.mp3" }
    },

    audioElement: null,

    /**
     * Play a specific track
     */
    playTrack(trackId) {
        const track = this.tracks[trackId];

        if (!track) {
            console.error('Track not found:', trackId);
            return;
        }

        // For demonstration purposes, we'll show the player UI
        // In production, you would load actual audio files
        this.currentTrack = trackId;
        this.isPlaying = true;

        // Update UI
        this.updatePlayerUI(track.name);
        this.updatePlayButtons(trackId);

        // Show notification
        this.showNotification(`Now playing: ${track.name}`);

        // Note: Actual audio playback would require audio files
        // For this demo, we're simulating the player UI
        console.log(`Playing: ${track.name}`);
    },

    /**
     * Stop current track
     */
    stopTrack() {
        this.isPlaying = false;
        this.currentTrack = null;

        // Reset all play buttons
        const playButtons = document.querySelectorAll('.music-play-btn');
        playButtons.forEach(btn => {
            btn.textContent = '▶ Play';
            btn.classList.remove('playing');
        });

        // Hide player
        const musicPlayer = document.getElementById('musicPlayer');
        if (musicPlayer) {
            musicPlayer.classList.add('hidden');
        }
    },

    /**
     * Update player UI
     */
    updatePlayerUI(trackName) {
        const musicPlayer = document.getElementById('musicPlayer');
        const playerTrackName = document.getElementById('playerTrackName');

        if (musicPlayer && playerTrackName) {
            playerTrackName.textContent = trackName;
            musicPlayer.classList.remove('hidden');
        }
    },

    /**
     * Update play button states
     */
    updatePlayButtons(activeTrackId) {
        const playButtons = document.querySelectorAll('.music-play-btn');

        playButtons.forEach(btn => {
            const trackId = btn.getAttribute('data-track');

            if (trackId === activeTrackId) {
                btn.textContent = '⏸ Pause';
                btn.classList.add('playing');
            } else {
                btn.textContent = '▶ Play';
                btn.classList.remove('playing');
            }
        });
    },

    /**
     * Show notification
     */
    showNotification(message) {
        // Simple notification (can be enhanced with a toast library)
        console.log('Notification:', message);
    },

    /**
     * Initialize music therapy
     */
    init() {
        // Play button handlers
        const playButtons = document.querySelectorAll('.music-play-btn');
        playButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const trackId = btn.getAttribute('data-track');

                if (this.currentTrack === trackId && this.isPlaying) {
                    this.stopTrack();
                } else {
                    this.playTrack(trackId);
                }
            });
        });

        // Stop button handler
        const playerStopBtn = document.getElementById('playerStopBtn');
        if (playerStopBtn) {
            playerStopBtn.addEventListener('click', () => {
                this.stopTrack();
            });
        }
    }
};