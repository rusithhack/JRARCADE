// Reflex Rally - Main Game Script

class ReflexRally {
    constructor() {
        // Game state
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver', 'twoPlayer', 'twoPlayerGameOver'
        this.score = 0;
        this.bestScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.currentShape = null;
        this.shapeTimeout = null;
        this.shapeDuration = 2000; // Initial shape display time in ms (increased for easier start)
        this.minShapeDuration = 400; // Minimum shape display time (increased limit)
        this.isDailyMode = false;
        this.dailyRandom = null;

        // Two player mode state
        this.isTwoPlayerMode = false;
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1Shape = null;
        this.player2Shape = null;
        this.player1Timeout = null;
        this.player2Timeout = null;
        this.twoPlayerShapeDuration = 2000;
        this.twoPlayerMinDuration = 500;

        // Game utilities
        this.utils = window.ReflexUtils;
        
        // Initialize game
        this.init();
    }

    init() {
        // Load best score from storage
        this.bestScore = this.utils.Storage.getBestScore();
        this.updateBestScoreDisplay();

        // Initialize audio
        this.utils.Audio.init();

        // Bind event listeners
        this.bindEvents();

        // Show start screen
        this.showScreen('startScreen');

        // Check daily challenge availability
        this.updateDailyChallengeButton();
    }

    bindEvents() {
        // Menu buttons
        document.getElementById('startGame').addEventListener('click', () => this.startGame(false));
        document.getElementById('twoPlayerMode').addEventListener('click', () => this.startTwoPlayerGame());
        document.getElementById('dailyChallenge').addEventListener('click', () => this.startDailyChallenge());
        document.getElementById('howToPlay').addEventListener('click', () => this.showHowToPlay());

        // Add hover sound effects to buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => this.utils.Audio.playHover());
        });

        // Game over buttons
        document.getElementById('playAgain').addEventListener('click', () => this.startGame(this.isDailyMode));
        document.getElementById('backToMenu').addEventListener('click', () => this.backToMenu());

        // Two player game over buttons
        document.getElementById('playAgainTwoPlayer').addEventListener('click', () => this.startTwoPlayerGame());
        document.getElementById('backToMenuFromTwoPlayer').addEventListener('click', () => this.backToMenu());

        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('twoPlayerPauseBtn').addEventListener('click', () => this.togglePause());

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => this.hideHowToPlay());

        // Game area click/touch
        const gameArea = document.getElementById('gameArea');
        gameArea.addEventListener('click', (e) => this.handleGameAreaClick(e));
        gameArea.addEventListener('touchend', (e) => {
            this.utils.Mobile.preventDefaultTouch(e);
            this.handleGameAreaClick(e);
        });

        // Two player areas click/touch
        const player1Area = document.getElementById('player1Area');
        const player2Area = document.getElementById('player2Area');
        
        player1Area.addEventListener('click', (e) => this.handlePlayerAreaClick(e, 1));
        player1Area.addEventListener('touchend', (e) => {
            this.utils.Mobile.preventDefaultTouch(e);
            this.handlePlayerAreaClick(e, 1);
        });
        
        player2Area.addEventListener('click', (e) => this.handlePlayerAreaClick(e, 2));
        player2Area.addEventListener('touchend', (e) => {
            this.utils.Mobile.preventDefaultTouch(e);
            this.handlePlayerAreaClick(e, 2);
        });

        // Prevent context menu on long press
        gameArea.addEventListener('contextmenu', (e) => e.preventDefault());
        player1Area.addEventListener('contextmenu', (e) => e.preventDefault());
        player2Area.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeypress(e));

        // Prevent scroll on mobile
        document.body.addEventListener('touchmove', (e) => {
            if (this.gameState === 'playing' || this.gameState === 'twoPlayer') {
                e.preventDefault();
            }
        }, { passive: false });

        // Window focus events for pause
        window.addEventListener('blur', () => {
            if (this.gameState === 'playing' || this.gameState === 'twoPlayer') {
                this.pauseGame();
            }
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        setTimeout(() => {
            document.getElementById(screenId).classList.add('active');
        }, 100);
    }

    updateBestScoreDisplay() {
        document.getElementById('displayBestScore').textContent = this.bestScore;
        document.getElementById('gameBestScore').textContent = this.bestScore;
        document.getElementById('finalBestScore').textContent = this.bestScore;
    }

    updateDailyChallengeButton() {
        const dailyBtn = document.getElementById('dailyChallenge');
        const isCompleted = this.utils.Storage.isDailyChallengeCompleted();
        
        if (isCompleted) {
            dailyBtn.innerHTML = '<span>Daily Challenge ✓</span>';
            dailyBtn.style.opacity = '0.6';
        } else {
            dailyBtn.innerHTML = '<span>Daily Challenge</span>';
            dailyBtn.style.opacity = '1';
        }
    }

    startGame(isDailyMode = false) {
        // Play click sound
        this.utils.Audio.playClick();
        
        this.gameState = 'playing';
        this.isTwoPlayerMode = false;
        this.isDailyMode = isDailyMode;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.shapeDuration = 2000; // Start with more forgiving timing

        // Setup daily mode if needed
        if (isDailyMode) {
            this.dailyRandom = this.utils.Date.getDailyRandom();
        } else {
            this.dailyRandom = null;
        }

        // Update UI
        this.updateScore();
        this.hideCombo();
        this.showScreen('gameScreen');

        // Clear any existing shapes
        this.clearCurrentShape();

        // Start first shape after short delay
        setTimeout(() => {
            if (this.gameState === 'playing') {
                this.spawnShape();
            }
        }, 500);
    }

    startTwoPlayerGame() {
        // Play click sound
        this.utils.Audio.playClick();
        
        this.gameState = 'twoPlayer';
        this.isTwoPlayerMode = true;
        this.player1Score = 0;
        this.player2Score = 0;
        this.twoPlayerShapeDuration = 2000;

        // Update UI
        this.updateTwoPlayerScores();
        this.showScreen('twoPlayerScreen');

        // Clear any existing shapes
        this.clearTwoPlayerShapes();

        // Start first shapes after short delay
        setTimeout(() => {
            if (this.gameState === 'twoPlayer') {
                this.spawnTwoPlayerShapes();
            }
        }, 1000);
    }

    startDailyChallenge() {
        if (this.utils.Storage.isDailyChallengeCompleted()) {
            alert('You have already completed today\'s daily challenge! Come back tomorrow for a new one.');
            return;
        }
        
        // Play click sound
        this.utils.Audio.playClick();
        this.startGame(true);
    }

    spawnShape() {
        if (this.gameState !== 'playing') return;

        // Clear any existing shape
        this.clearCurrentShape();

        // Generate shape properties
        const random = this.dailyRandom || Math;
        const shapeProps = this.utils.Shape.generateShape(random);
        const position = this.utils.Shape.generatePosition(
            shapeProps.size,
            window.innerWidth,
            window.innerHeight,
            random
        );

        // Create shape element
        const shape = document.createElement('div');
        shape.className = `shape ${shapeProps.type}`;
        shape.style.width = shapeProps.size + 'px';
        shape.style.height = shapeProps.size + 'px';
        shape.style.left = position.x + 'px';
        shape.style.top = position.y + 'px';

        if (shapeProps.type === 'emoji') {
            shape.textContent = shapeProps.emoji;
        } else {
            shape.style.background = `linear-gradient(45deg, ${shapeProps.color}, ${this.adjustColor(shapeProps.color, 30)})`;
            shape.style.boxShadow = `0 0 30px ${shapeProps.color}50, inset 0 0 20px rgba(255,255,255,0.2)`;
        }

        // Add click handler
        shape.addEventListener('click', (e) => this.handleShapeClick(e, shape));
        shape.addEventListener('touchend', (e) => {
            this.utils.Mobile.preventDefaultTouch(e);
            this.handleShapeClick(e, shape);
        });

        // Add to game area
        document.getElementById('gameArea').appendChild(shape);
        this.currentShape = shape;

        // Set timeout for shape disappearance
        this.shapeTimeout = setTimeout(() => {
            this.missShape();
        }, this.shapeDuration);
    }

    spawnTwoPlayerShapes() {
        if (this.gameState !== 'twoPlayer') return;

        // Clear any existing shapes
        this.clearTwoPlayerShapes();

        // Spawn shape for player 1
        this.spawnPlayerShape(1);
        
        // Spawn shape for player 2 with slight delay for variety
        setTimeout(() => {
            if (this.gameState === 'twoPlayer') {
                this.spawnPlayerShape(2);
            }
        }, 100);
    }

    spawnPlayerShape(playerNumber) {
        if (this.gameState !== 'twoPlayer') return;

        const areaId = `player${playerNumber}Area`;
        const area = document.getElementById(areaId);
        const areaRect = area.getBoundingClientRect();

        // Generate shape properties
        const shapeProps = this.utils.Shape.generateShape();
        const position = this.utils.Shape.generatePosition(
            shapeProps.size,
            areaRect.width,
            areaRect.height - 60 // Account for player label
        );

        // Create shape element
        const shape = document.createElement('div');
        shape.className = `shape ${shapeProps.type}`;
        shape.style.width = shapeProps.size + 'px';
        shape.style.height = shapeProps.size + 'px';
        shape.style.left = position.x + 'px';
        shape.style.top = (position.y + 60) + 'px'; // Offset for player label

        // Add player-specific styling
        if (playerNumber === 1) {
            shape.style.borderColor = '#00f5ff';
        } else {
            shape.style.borderColor = '#ff0080';
        }

        if (shapeProps.type === 'emoji') {
            shape.textContent = shapeProps.emoji;
        } else {
            shape.style.background = `linear-gradient(45deg, ${shapeProps.color}, ${this.adjustColor(shapeProps.color, 30)})`;
            shape.style.boxShadow = `0 0 30px ${shapeProps.color}50, inset 0 0 20px rgba(255,255,255,0.2)`;
        }

        // Add click handler
        shape.addEventListener('click', (e) => this.handleTwoPlayerShapeClick(e, shape, playerNumber));
        shape.addEventListener('touchend', (e) => {
            this.utils.Mobile.preventDefaultTouch(e);
            this.handleTwoPlayerShapeClick(e, shape, playerNumber);
        });

        // Add to player area
        area.appendChild(shape);

        // Store shape reference
        if (playerNumber === 1) {
            this.player1Shape = shape;
            this.player1Timeout = setTimeout(() => {
                this.twoPlayerMiss(1);
            }, this.twoPlayerShapeDuration);
        } else {
            this.player2Shape = shape;
            this.player2Timeout = setTimeout(() => {
                this.twoPlayerMiss(2);
            }, this.twoPlayerShapeDuration);
        }
    }

    handleTwoPlayerShapeClick(event, shape, playerNumber) {
        event.stopPropagation();
        
        if (this.gameState !== 'twoPlayer') return;

        const isCorrectShape = (playerNumber === 1 && shape === this.player1Shape) ||
                              (playerNumber === 2 && shape === this.player2Shape);
        
        if (!isCorrectShape) return;

        // Clear timeout for this player
        if (playerNumber === 1 && this.player1Timeout) {
            clearTimeout(this.player1Timeout);
            this.player1Timeout = null;
        } else if (playerNumber === 2 && this.player2Timeout) {
            clearTimeout(this.player2Timeout);
            this.player2Timeout = null;
        }

        // Mark shape as hit
        shape.classList.add('hit');

        // Update score
        if (playerNumber === 1) {
            this.player1Score++;
        } else {
            this.player2Score++;
        }

        // Play hit sound
        this.utils.Audio.playHit();

        // Create particle effect
        const rect = shape.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        this.utils.Effects.createParticles(centerX, centerY);

        // Update UI
        this.updateTwoPlayerScores();

        // Increase difficulty
        this.increaseTwoPlayerDifficulty();

        // Remove shape and spawn next
        setTimeout(() => {
            if (playerNumber === 1) {
                this.clearPlayerShape(1);
            } else {
                this.clearPlayerShape(2);
            }
            
            if (this.gameState === 'twoPlayer') {
                setTimeout(() => {
                    if (playerNumber === 1) {
                        this.spawnPlayerShape(1);
                    } else {
                        this.spawnPlayerShape(2);
                    }
                }, 300);
            }
        }, 150);
    }

    handlePlayerAreaClick(event, playerNumber) {
        if (this.gameState !== 'twoPlayer') return;

        // Player clicked outside their shape - they lose
        this.twoPlayerMiss(playerNumber);
    }

    twoPlayerMiss(playerNumber) {
        if (this.gameState !== 'twoPlayer') return;

        // Play miss sound
        this.utils.Audio.playMiss();

        // Clear shapes and timeouts
        this.clearTwoPlayerShapes();

        // Screen shake effect
        this.utils.Effects.shakeScreen();

        // End two player game
        this.endTwoPlayerGame(playerNumber);
    }

    clearTwoPlayerShapes() {
        this.clearPlayerShape(1);
        this.clearPlayerShape(2);
    }

    clearPlayerShape(playerNumber) {
        if (playerNumber === 1) {
            if (this.player1Shape) {
                if (this.player1Shape.parentNode) {
                    this.player1Shape.parentNode.removeChild(this.player1Shape);
                }
                this.player1Shape = null;
            }
            if (this.player1Timeout) {
                clearTimeout(this.player1Timeout);
                this.player1Timeout = null;
            }
        } else {
            if (this.player2Shape) {
                if (this.player2Shape.parentNode) {
                    this.player2Shape.parentNode.removeChild(this.player2Shape);
                }
                this.player2Shape = null;
            }
            if (this.player2Timeout) {
                clearTimeout(this.player2Timeout);
                this.player2Timeout = null;
            }
        }
    }

    increaseTwoPlayerDifficulty() {
        // Reduce shape duration by 30ms each hit, minimum 500ms
        this.twoPlayerShapeDuration = Math.max(this.twoPlayerMinDuration, this.twoPlayerShapeDuration - 30);
    }

    updateTwoPlayerScores() {
        document.getElementById('player1Score').textContent = this.player1Score;
        document.getElementById('player2Score').textContent = this.player2Score;
    }

    endTwoPlayerGame(losingPlayer) {
        this.gameState = 'twoPlayerGameOver';

        // Determine winner
        const winner = losingPlayer === 1 ? 2 : 1;
        const winnerTitle = document.getElementById('winnerTitle');
        
        if (this.player1Score === this.player2Score) {
            winnerTitle.textContent = "It's a Tie!";
            winnerTitle.style.background = 'linear-gradient(45deg, #00f5ff, #ff0080)';
            // Play game over sound for tie
            this.utils.Audio.playGameOver();
        } else if (winner === 1) {
            winnerTitle.textContent = "Player 1 Wins!";
            winnerTitle.style.background = 'linear-gradient(45deg, #00f5ff, #0080ff)';
            // Play victory sound for player 1
            this.utils.Audio.playTwoPlayerWin(1);
        } else {
            winnerTitle.textContent = "Player 2 Wins!";
            winnerTitle.style.background = 'linear-gradient(45deg, #ff0080, #ff4444)';
            // Play victory sound for player 2
            this.utils.Audio.playTwoPlayerWin(2);
        }
        winnerTitle.style.webkitBackgroundClip = 'text';
        winnerTitle.style.webkitTextFillColor = 'transparent';
        winnerTitle.style.backgroundClip = 'text';

        // Update final scores
        document.getElementById('player1FinalScore').textContent = this.player1Score;
        document.getElementById('player2FinalScore').textContent = this.player2Score;

        // Save best scores
        const bestScores = this.utils.Storage.getTwoPlayerBestScores();
        if (this.player1Score > bestScores.player1 || this.player2Score > bestScores.player2) {
            this.utils.Storage.setTwoPlayerBestScores(
                Math.max(this.player1Score, bestScores.player1),
                Math.max(this.player2Score, bestScores.player2)
            );
        }

        // Show two player game over screen
        this.showScreen('twoPlayerGameOverScreen');
    }

    handleShapeClick(event, shape) {
        event.stopPropagation();
        
        if (this.gameState !== 'playing' || shape !== this.currentShape) return;

        // Clear timeout
        if (this.shapeTimeout) {
            clearTimeout(this.shapeTimeout);
            this.shapeTimeout = null;
        }

        // Mark shape as hit
        shape.classList.add('hit');

        // Update score and combo
        this.score++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        // Play hit sound
        this.utils.Audio.playHit();

        // Create particle effect
        const rect = shape.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        this.utils.Effects.createParticles(centerX, centerY);

        // Update UI
        this.updateScore();
        this.updateCombo();

        // Check for combo effects
        if (this.combo >= 3) {
            this.utils.Effects.createComboEffect(this.combo);
            this.utils.Audio.playCombo(this.combo);
        }

        // Increase difficulty
        this.increaseDifficulty();

        // Remove shape and spawn next
        setTimeout(() => {
            this.clearCurrentShape();
            if (this.gameState === 'playing') {
                setTimeout(() => this.spawnShape(), 200);
            }
        }, 150);
    }

    handleGameAreaClick(event) {
        if (this.gameState !== 'playing') return;

        // Player clicked outside shape - game over
        this.missShape();
    }

    missShape() {
        if (this.gameState !== 'playing') return;

        // Play miss sound
        this.utils.Audio.playMiss();

        // Clear current shape and timeout
        this.clearCurrentShape();

        // Screen shake effect
        this.utils.Effects.shakeScreen();

        // End game
        this.endGame();
    }

    clearCurrentShape() {
        if (this.currentShape) {
            if (this.currentShape.parentNode) {
                this.currentShape.parentNode.removeChild(this.currentShape);
            }
            this.currentShape = null;
        }

        if (this.shapeTimeout) {
            clearTimeout(this.shapeTimeout);
            this.shapeTimeout = null;
        }
    }

    increaseDifficulty() {
        // More gradual difficulty increase: reduce by 25ms each hit, minimum 400ms
        this.shapeDuration = Math.max(this.minShapeDuration, this.shapeDuration - 25);
    }

    updateScore() {
        document.getElementById('currentScore').textContent = this.score;
    }

    updateCombo() {
        const comboElement = document.getElementById('comboDisplay');
        const comboCount = document.getElementById('comboCount');

        if (this.combo > 1) {
            comboCount.textContent = this.combo;
            comboElement.classList.remove('hidden');
        } else {
            comboElement.classList.add('hidden');
        }
    }

    hideCombo() {
        document.getElementById('comboDisplay').classList.add('hidden');
    }

    pauseGame() {
        if (this.gameState === 'playing' || this.gameState === 'twoPlayer') {
            this.gameState = 'paused';
            if (this.isTwoPlayerMode) {
                this.clearTwoPlayerShapes();
            } else {
                this.clearCurrentShape();
            }
            // Could show pause overlay here
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            if (this.isTwoPlayerMode) {
                this.gameState = 'twoPlayer';
                setTimeout(() => this.spawnTwoPlayerShapes(), 500);
            } else {
                this.gameState = 'playing';
                setTimeout(() => this.spawnShape(), 500);
            }
        }
    }

    togglePause() {
        if (this.gameState === 'playing' || this.gameState === 'twoPlayer') {
            this.pauseGame();
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }

    endGame() {
        this.gameState = 'gameOver';

        // Update best score if needed
        let isNewRecord = false;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.utils.Storage.setBestScore(this.bestScore);
            isNewRecord = true;
        }

        // Save daily score if in daily mode
        if (this.isDailyMode) {
            this.utils.Storage.setDailyScore(this.score);
            this.utils.Storage.markDailyChallengeCompleted();
            this.updateDailyChallengeButton();
            
            // Play daily challenge complete sound
            if (this.score > 0) {
                this.utils.Audio.playDailyComplete();
            }
        }

        // Update game over screen
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('maxCombo').textContent = this.maxCombo;
        this.updateBestScoreDisplay();

        // Show new record indicator
        const newRecordElement = document.getElementById('newRecord');
        if (isNewRecord && this.score > 0) {
            newRecordElement.classList.remove('hidden');
            // Play new record sound
            this.utils.Audio.playNewRecord();
        } else {
            newRecordElement.classList.add('hidden');
            // Play regular game over sound
            this.utils.Audio.playGameOver();
        }

        // Generate performance message
        const performanceMessage = this.utils.Performance.generateMessage(this.score, this.bestScore);
        document.getElementById('performanceMessage').textContent = performanceMessage;

        // Show game over screen
        this.showScreen('gameOverScreen');
    }

    backToMenu() {
        // Play click sound
        this.utils.Audio.playClick();
        
        this.gameState = 'menu';
        this.isTwoPlayerMode = false;
        this.clearCurrentShape();
        this.clearTwoPlayerShapes();
        this.showScreen('startScreen');
    }

    showHowToPlay() {
        // Play click sound
        this.utils.Audio.playClick();
        document.getElementById('howToPlayModal').classList.remove('hidden');
    }

    hideHowToPlay() {
        // Play click sound
        this.utils.Audio.playClick();
        document.getElementById('howToPlayModal').classList.add('hidden');
    }

    handleKeypress(event) {
        switch (event.code) {
            case 'Space':
                if (this.gameState === 'menu') {
                    event.preventDefault();
                    this.startGame(false);
                } else if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'twoPlayer') {
                    event.preventDefault();
                    this.togglePause();
                } else if (this.gameState === 'turnBased') {
                    event.preventDefault();
                    this.togglePause();
                } else if (this.gameState === 'gameOver' || this.gameState === 'twoPlayerGameOver' || this.gameState === 'turnBasedGameOver') {
                    event.preventDefault();
                    if (this.gameState === 'twoPlayerGameOver') {
                        this.startTwoPlayerGame();
                    } else if (this.gameState === 'turnBasedGameOver') {
                        this.showPlayerSetup();
                    } else {
                        this.startGame(this.isDailyMode);
                    }
                }
                break;
            case 'Escape':
                if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'twoPlayer' || this.gameState === 'turnBased') {
                    event.preventDefault();
                    this.backToMenu();
                }
                break;
        }
    }

    // Utility method to adjust color brightness
    adjustColor(color, percent) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const factor = (100 + percent) / 100;
        const newR = Math.min(255, Math.floor(r * factor));
        const newG = Math.min(255, Math.floor(g * factor));
        const newB = Math.min(255, Math.floor(b * factor));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ReflexRally();
});

// Prevent zoom on double tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevent pinch zoom
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());