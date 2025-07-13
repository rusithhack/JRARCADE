// Utility functions for Reflex Rally game

/**
 * Local Storage utilities
 */
const StorageUtil = {
    // Get best score from localStorage
    getBestScore() {
        return parseInt(localStorage.getItem('bestScore') || '0', 10);
    },

    // Set best score in localStorage
    setBestScore(score) {
        localStorage.setItem('bestScore', score.toString());
    },

    // Get two player best scores
    getTwoPlayerBestScores() {
        const player1Best = parseInt(localStorage.getItem('twoPlayerBestP1') || '0', 10);
        const player2Best = parseInt(localStorage.getItem('twoPlayerBestP2') || '0', 10);
        return { player1: player1Best, player2: player2Best };
    },

    // Set two player best scores
    setTwoPlayerBestScores(player1Score, player2Score) {
        localStorage.setItem('twoPlayerBestP1', player1Score.toString());
        localStorage.setItem('twoPlayerBestP2', player2Score.toString());
    },

    // Get daily score for specific date
    getDailyScore(date = null) {
        const dateKey = date || new Date().toISOString().slice(0, 10);
        return parseInt(localStorage.getItem(`dailyScore-${dateKey}`) || '0', 10);
    },

    // Set daily score for specific date
    setDailyScore(score, date = null) {
        const dateKey = date || new Date().toISOString().slice(0, 10);
        localStorage.setItem(`dailyScore-${dateKey}`, score.toString());
    },

    // Check if daily challenge was played today
    isDailyChallengeCompleted(date = null) {
        const dateKey = date || new Date().toISOString().slice(0, 10);
        return localStorage.getItem(`dailyCompleted-${dateKey}`) === 'true';
    },

    // Mark daily challenge as completed
    markDailyChallengeCompleted(date = null) {
        const dateKey = date || new Date().toISOString().slice(0, 10);
        localStorage.setItem(`dailyCompleted-${dateKey}`, 'true');
    }
};

/**
 * Random number generation with seeding for daily challenges
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    // Simple seeded random number generator (mulberry32)
    random() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    // Random choice from array
    choice(array) {
        return array[this.randomInt(0, array.length - 1)];
    }
}

/**
 * Shape generation utilities
 */
const ShapeUtil = {
    // Possible shape types
    types: ['circle', 'square', 'emoji'],
    
    // Color palette for shapes
    colors: [
        '#00f5ff', // Cyan
        '#ff0080', // Pink
        '#00ff88', // Green
        '#ffaa00', // Orange
        '#ff4444', // Red
        '#8844ff', // Purple
        '#44ff44', // Lime
        '#ff8844'  // Coral
    ],

    // Emoji options for emoji shapes
    emojis: ['⭐', '💎', '🔥', '⚡', '🎯', '💫', '✨', '🌟'],

    // Generate random shape properties
    generateShape(random = Math) {
        const type = this.choice(this.types, random);
        const color = this.choice(this.colors, random);
        const emoji = this.choice(this.emojis, random);
        
        return {
            type,
            color,
            emoji,
            size: this.randomInt(60, 100, random) // Size in pixels
        };
    },

    // Generate random position within safe area
    generatePosition(shapeSize, containerWidth, containerHeight, random = Math) {
        const margin = 80; // Safe margin from edges
        const minX = margin;
        const maxX = containerWidth - shapeSize - margin;
        const minY = margin + 80; // Extra top margin for HUD
        const maxY = containerHeight - shapeSize - margin;

        return {
            x: this.randomInt(minX, Math.max(minX, maxX), random),
            y: this.randomInt(minY, Math.max(minY, maxY), random)
        };
    },

    // Utility methods for random generation
    choice(array, random = Math) {
        return array[Math.floor(random.random() * array.length)];
    },

    randomInt(min, max, random = Math) {
        return Math.floor(random.random() * (max - min + 1)) + min;
    }
};

/**
 * Animation and effects utilities
 */
const EffectsUtil = {
    // Create particle effect at position
    createParticles(x, y, count = 6) {
        const container = document.getElementById('particleContainer');
        const particles = ['✨', '⭐', '💫', '🌟'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            
            // Random offset from click position
            const offsetX = (Math.random() - 0.5) * 80;
            const offsetY = (Math.random() - 0.5) * 80;
            
            particle.style.left = (x + offsetX) + 'px';
            particle.style.top = (y + offsetY) + 'px';
            
            container.appendChild(particle);

            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    },

    // Screen shake effect
    shakeScreen() {
        document.body.classList.add('shake');
        setTimeout(() => {
            document.body.classList.remove('shake');
        }, 500);
    },

    // Create combo celebration effect
    createComboEffect(combo) {
        if (combo >= 5) {
            this.createParticles(window.innerWidth / 2, window.innerHeight / 2, 12);
        }
    }
};

/**
 * Performance message generator
 */
const PerformanceUtil = {
    generateMessage(score, bestScore) {
        const percentage = Math.floor(Math.random() * 30) + 70; // 70-99%
        
        if (score === bestScore && score > 0) {
            return "🎉 New personal record! You're on fire!";
        }
        
        if (score >= bestScore * 0.9) {
            return `Amazing! You're faster than ${percentage}% of players!`;
        }
        
        if (score >= bestScore * 0.7) {
            return `Great reflexes! You're faster than ${percentage - 10}% of players!`;
        }
        
        if (score >= bestScore * 0.5) {
            return `Nice try! You're faster than ${percentage - 20}% of players!`;
        }
        
        return `Keep practicing! You're faster than ${percentage - 30}% of players!`;
    }
};

/**
 * Audio utilities (for future sound effects)
 */
const AudioUtil = {
    // Audio context for Web Audio API
    audioContext: null,
    
    // Initialize audio context
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.audioContext = null;
        }
    },

    // Resume audio context (required for user interaction)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    // Create and play a tone
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            // Envelope for smooth sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    },

    // Play click sound effect
    playClick() {
        this.resume();
        // Bright, satisfying click sound
        this.playTone(800, 0.1, 'square', 0.2);
        setTimeout(() => this.playTone(1200, 0.05, 'sine', 0.15), 20);
    },

    // Play successful hit sound
    playHit() {
        this.resume();
        // Rising tone for success
        this.playTone(600, 0.08, 'triangle', 0.25);
        setTimeout(() => this.playTone(900, 0.06, 'sine', 0.2), 30);
    },

    // Play combo sound effect
    playCombo(comboCount) {
        this.resume();
        // Ascending notes for combo
        const baseFreq = 400;
        for (let i = 0; i < Math.min(comboCount, 5); i++) {
            setTimeout(() => {
                this.playTone(baseFreq + (i * 150), 0.1, 'triangle', 0.2);
            }, i * 50);
        }
    },

    // Play game over sound
    playGameOver() {
        this.resume();
        // Descending dramatic sound
        this.playTone(400, 0.2, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.25), 100);
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.2), 200);
    },

    // Play victory/win sound
    playVictory() {
        this.resume();
        // Triumphant ascending melody
        const melody = [523, 659, 784, 1047]; // C, E, G, C (octave)
        melody.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'triangle', 0.25);
            }, index * 150);
        });
    },

    // Play new record sound
    playNewRecord() {
        this.resume();
        // Celebratory fanfare
        const fanfare = [523, 659, 784, 1047, 1319]; // C, E, G, C, E
        fanfare.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.15, 'triangle', 0.3);
                // Add harmony
                this.playTone(freq * 1.25, 0.15, 'sine', 0.15);
            }, index * 100);
        });
    },

    // Play miss/error sound
    playMiss() {
        this.resume();
        // Sharp, attention-grabbing error sound
        this.playTone(150, 0.3, 'sawtooth', 0.4);
    },

    // Play button hover sound
    playHover() {
        this.resume();
        // Subtle hover feedback
        this.playTone(1000, 0.05, 'sine', 0.1);
    },

    // Play daily challenge complete sound
    playDailyComplete() {
        this.resume();
        // Special completion melody
        const melody = [440, 554, 659, 880]; // A, C#, E, A
        melody.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'triangle', 0.2);
            }, index * 120);
        });
    },

    // Play two-player win sound
    playTwoPlayerWin(player) {
        this.resume();
        if (player === 1) {
            // Player 1 victory (higher pitch)
            this.playTone(659, 0.2, 'triangle', 0.3);
            setTimeout(() => this.playTone(784, 0.2, 'triangle', 0.25), 100);
            setTimeout(() => this.playTone(1047, 0.3, 'triangle', 0.2), 200);
        } else {
            // Player 2 victory (lower pitch)
            this.playTone(523, 0.2, 'triangle', 0.3);
            setTimeout(() => this.playTone(659, 0.2, 'triangle', 0.25), 100);
            setTimeout(() => this.playTone(784, 0.3, 'triangle', 0.2), 200);
        }
    }
};

/**
 * Date utilities for daily challenges
 */
const DateUtil = {
    // Get today's date string (YYYY-MM-DD)
    getTodayString() {
        return new Date().toISOString().slice(0, 10);
    },

    // Create seed from date string
    dateToSeed(dateString) {
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    },

    // Get seeded random for daily challenge
    getDailyRandom(date = null) {
        const dateString = date || this.getTodayString();
        const seed = this.dateToSeed(dateString);
        return new SeededRandom(seed);
    }
};

/**
 * Mobile detection and touch utilities
 */
const MobileUtil = {
    // Check if device is mobile
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Get touch position from event
    getTouchPosition(event) {
        if (event.touches && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
        return {
            x: event.clientX,
            y: event.clientY
        };
    },

    // Prevent default touch behaviors
    preventDefaultTouch(event) {
        event.preventDefault();
        event.stopPropagation();
    }
};

// Export utilities for use in main script
window.ReflexUtils = {
    Storage: StorageUtil,
    Shape: ShapeUtil,
    Effects: EffectsUtil,
    Performance: PerformanceUtil,
    Audio: AudioUtil,
    Date: DateUtil,
    Mobile: MobileUtil,
    SeededRandom
};