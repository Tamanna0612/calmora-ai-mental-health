/**
 * CALMORA - BREATHING EXERCISE MODULE
 * Implements animated breathing circle with smooth CSS animations
 */

const BreathingExercise = {
    isRunning: false,
    intervalId: null,
    currentPhase: 0,

    phases: [
        { name: 'Inhale', duration: CONFIG.TIMINGS.BREATHING_INHALE, class: 'inhale' },
        { name: 'Hold', duration: CONFIG.TIMINGS.BREATHING_HOLD, class: 'hold' },
        { name: 'Exhale', duration: CONFIG.TIMINGS.BREATHING_EXHALE, class: 'exhale' }
    ],

    /**
     * Start breathing exercise
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.currentPhase = 0;

        // Update UI
        const startBtn = document.getElementById('breathingStartBtn');
        const stopBtn = document.getElementById('breathingStopBtn');

        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');

        // Start the breathing cycle
        this.executePhase();
    },

    /**
     * Stop breathing exercise
     */
    stop() {
        this.isRunning = false;

        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }

        // Reset UI
        const breathingCircle = document.getElementById('breathingCircle');
        const breathingText = document.getElementById('breathingText');
        const startBtn = document.getElementById('breathingStartBtn');
        const stopBtn = document.getElementById('breathingStopBtn');

        breathingCircle.className = 'breathing-circle';
        breathingText.textContent = 'Ready';

        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
    },

    /**
     * Execute current breathing phase
     */
    executePhase() {
        if (!this.isRunning) return;

        const phase = this.phases[this.currentPhase];
        const breathingCircle = document.getElementById('breathingCircle');
        const breathingText = document.getElementById('breathingText');

        // Update circle animation class
        breathingCircle.className = 'breathing-circle';
        setTimeout(() => {
            breathingCircle.classList.add(phase.class);
        }, 50);

        // Update text
        breathingText.textContent = phase.name;

        // Schedule next phase
        this.intervalId = setTimeout(() => {
            this.currentPhase = (this.currentPhase + 1) % this.phases.length;
            this.executePhase();
        }, phase.duration);
    },

    /**
     * Initialize breathing exercise
     */
    init() {
        const startBtn = document.getElementById('breathingStartBtn');
        const stopBtn = document.getElementById('breathingStopBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.start();
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stop();
            });
        }
    }
};