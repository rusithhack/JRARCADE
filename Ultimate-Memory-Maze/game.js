// Main game logic for Memory Maze
class MemoryMazeGame {
    constructor() {
        this.currentLevel = 1;
        this.maze = null;
        this.gameState = 'menu'; // 'menu', 'preview', 'playing', 'win', 'gameover'
        this.selectedPath = [];
        this.startTime = null;
        this.previewSpeed = 800; // ms between highlights
        this.currentPreviewIndex = 0;
        this.attempts = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.loadGameData();
        this.showScreen('start-screen');
    }

    initializeElements() {
        // Screens
        this.screens = {
            start: document.getElementById('start-screen'),
            howToPlay: document.getElementById('how-to-play-screen'),
            game: document.getElementById('game-screen'),
            win: document.getElementById('win-screen'),
            gameOver: document.getElementById('game-over-screen')
        };

        // UI Elements
        this.elements = {
            bestLevel: document.getElementById('best-level'),
            gamesWon: document.getElementById('games-won'),
            currentLevel: document.getElementById('current-level'),
            gameStatus: document.getElementById('game-status'),
            progress: document.getElementById('progress'),
            timer: document.getElementById('timer'),
            mazeGrid: document.getElementById('maze-grid'),
            completionTime: document.getElementById('completion-time'),
            accuracy: document.getElementById('accuracy')
        };

        // Buttons
        this.buttons = {
            start: document.getElementById('start-btn'),
            howToPlay: document.getElementById('how-to-play-btn'),
            backToStart: document.getElementById('back-to-start-btn'),
            restartLevel: document.getElementById('restart-level-btn'),
            giveUp: document.getElementById('give-up-btn'),
            backToMenu: document.getElementById('back-to-menu-btn'),
            nextLevel: document.getElementById('next-level-btn'),
            replayLevel: document.getElementById('replay-level-btn'),
            winMenu: document.getElementById('win-menu-btn'),
            tryAgain: document.getElementById('try-again-btn'),
            gameOverMenu: document.getElementById('game-over-menu-btn')
        };
    }

    bindEvents() {
        // Navigation
        this.buttons.start.addEventListener('click', () => this.startGame());
        this.buttons.howToPlay.addEventListener('click', () => this.showScreen('how-to-play-screen'));
        this.buttons.backToStart.addEventListener('click', () => this.showScreen('start-screen'));
        
        // Game controls
        this.buttons.restartLevel.addEventListener('click', () => this.startLevel(this.currentLevel));
        this.buttons.giveUp.addEventListener('click', () => this.showSolution());
        this.buttons.backToMenu.addEventListener('click', () => this.showScreen('start-screen'));
        
        // Win screen
        this.buttons.nextLevel.addEventListener('click', () => this.nextLevel());
        this.buttons.replayLevel.addEventListener('click', () => this.startLevel(this.currentLevel));
        this.buttons.winMenu.addEventListener('click', () => this.showScreen('start-screen'));
        
        // Game over screen
        this.buttons.tryAgain.addEventListener('click', () => this.startLevel(this.currentLevel));
        this.buttons.gameOverMenu.addEventListener('click', () => this.showScreen('start-screen'));
    }

    loadGameData() {
        const data = window.gameStorage.getStats();
        this.elements.bestLevel.textContent = data.bestLevel;
        this.elements.gamesWon.textContent = data.gamesWon;
    }

    showScreen(screenId) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Update game data when returning to start screen
        if (screenId === 'start-screen') {
            this.loadGameData();
        }
    }

    startGame() {
        this.currentLevel = 1;
        this.startLevel(1);
    }

    startLevel(level) {
        this.currentLevel = level;
        this.selectedPath = [];
        this.attempts++;
        this.startTime = null;
        
        // Generate maze
        const size = Math.min(4 + Math.floor(level / 2), 8); // 4x4 to 8x8
        this.maze = window.mazeGenerator.generateMaze(size, level);
        
        // Update UI
        this.elements.currentLevel.textContent = `Level ${level}`;
        this.elements.gameStatus.textContent = 'Get ready...';
        this.updateProgress();
        
        // Show game screen and start preview
        this.showScreen('game-screen');
        this.renderMaze();
        
        setTimeout(() => {
            this.startPreview();
        }, 1000);
    }

    renderMaze() {
        const grid = this.elements.mazeGrid;
        grid.innerHTML = '';
        grid.className = `grid-${this.maze.size}x${this.maze.size}`;
        
        for (let y = 0; y < this.maze.size; y++) {
            for (let x = 0; x < this.maze.size; x++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.x = x;
                tile.dataset.y = y;
                
                const cell = this.maze.grid[y][x];
                tile.classList.add(cell.type);
                
                if (cell.type === 'start') {
                    tile.textContent = 'S';
                } else if (cell.type === 'finish') {
                    tile.textContent = 'F';
                }
                
                tile.addEventListener('click', (e) => this.handleTileClick(e));
                grid.appendChild(tile);
            }
        }
    }

    startPreview() {
        this.gameState = 'preview';
        this.elements.gameStatus.textContent = 'Memorize the path...';
        this.currentPreviewIndex = 0;
        this.highlightNextTile();
    }

    highlightNextTile() {
        if (this.currentPreviewIndex >= this.maze.path.length) {
            // Preview complete
            this.endPreview();
            return;
        }
        
        const pathTile = this.maze.path[this.currentPreviewIndex];
        const tileElement = this.getTileElement(pathTile.x, pathTile.y);
        
        if (tileElement) {
            tileElement.classList.add('highlighted');
            
            setTimeout(() => {
                tileElement.classList.remove('highlighted');
                this.currentPreviewIndex++;
                setTimeout(() => this.highlightNextTile(), 200);
            }, this.previewSpeed);
        }
    }

    endPreview() {
        this.gameState = 'playing';
        this.elements.gameStatus.textContent = 'Click the tiles in order!';
        this.startTime = Date.now();
        this.startTimer();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.startTime) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                this.elements.timer.textContent = `${elapsed.toFixed(1)}s`;
            }
        }, 100);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    handleTileClick(event) {
        if (this.gameState !== 'playing') return;
        
        const x = parseInt(event.target.dataset.x);
        const y = parseInt(event.target.dataset.y);
        const tile = this.maze.grid[y][x];
        
        // Can't click walls
        if (tile.type === 'wall') return;
        
        const expectedTile = this.maze.path[this.selectedPath.length];
        
        if (expectedTile && x === expectedTile.x && y === expectedTile.y) {
            // Correct tile
            this.selectedPath.push({ x, y });
            event.target.classList.add('correct');
            this.updateProgress();
            
            if (this.selectedPath.length === this.maze.path.length) {
                // Level complete!
                this.completeLevel();
            }
        } else {
            // Wrong tile
            event.target.classList.add('wrong');
            setTimeout(() => {
                this.showGameOver();
            }, 500);
        }
    }

    updateProgress() {
        this.elements.progress.textContent = `${this.selectedPath.length} / ${this.maze.path.length}`;
    }

    completeLevel() {
        this.stopTimer();
        const completionTime = (Date.now() - this.startTime) / 1000;
        const accuracy = 100; // Always 100% if completed
        
        // Save completion data
        window.gameStorage.recordLevelCompletion(this.currentLevel, completionTime, this.attempts);
        
        // Update win screen
        this.elements.completionTime.textContent = `${completionTime.toFixed(1)}s`;
        this.elements.accuracy.textContent = `${accuracy}%`;
        
        // Show win screen
        this.showScreen('win-screen');
        this.attempts = 0; // Reset attempts for next level
    }

    showGameOver() {
        this.stopTimer();
        this.gameState = 'gameover';
        this.showSolution();
        
        setTimeout(() => {
            this.showScreen('game-over-screen');
        }, 2000);
    }

    showSolution() {
        // Highlight the correct path
        this.maze.path.forEach((pathTile, index) => {
            setTimeout(() => {
                const tileElement = this.getTileElement(pathTile.x, pathTile.y);
                if (tileElement) {
                    tileElement.classList.add('highlighted');
                }
            }, index * 150);
        });
    }

    nextLevel() {
        this.startLevel(this.currentLevel + 1);
    }

    getTileElement(x, y) {
        return document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.memoryMazeGame = new MemoryMazeGame();
});