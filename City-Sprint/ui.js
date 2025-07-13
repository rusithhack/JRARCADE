class UIManager {
    constructor() {
        this.screens = {
            start: document.getElementById('startScreen'),
            game: document.getElementById('gameScreen'),
            gameOver: document.getElementById('gameOverScreen')
        };
        
        this.modal = document.getElementById('howToPlayModal');
        this.setupEventListeners();
        this.updateBestScoreDisplay();
        this.setupSkinSelector();
    }

    setupEventListeners() {
        // Start screen buttons
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('howToPlayButton').addEventListener('click', () => {
            this.showModal();
        });

        // Game over screen buttons
        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('returnMenuButton').addEventListener('click', () => {
            this.showStartScreen();
        });

        // Modal buttons
        document.getElementById('closeModalButton').addEventListener('click', () => {
            this.hideModal();
        });

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    setupSkinSelector() {
        const skinOptions = document.getElementById('skinOptions');
        const unlockedSkins = gameStorage.getUnlockedSkins();
        const selectedSkin = gameStorage.getSelectedSkin();
        const allSkins = gameStorage.getAllSkins();

        skinOptions.innerHTML = '';

        allSkins.forEach(skin => {
            const skinElement = document.createElement('div');
            skinElement.className = 'skin-option';
            skinElement.innerHTML = skin.emoji;
            
            if (unlockedSkins.includes(skin.id)) {
                skinElement.title = `${skin.name} - Unlocked!`;
            } else {
                skinElement.title = `${skin.name} - Unlock at ${skin.unlockDistance}m`;
            }

            if (unlockedSkins.includes(skin.id)) {
                if (skin.id === selectedSkin) {
                    skinElement.classList.add('selected');
                }
                
                skinElement.addEventListener('click', () => {
                    // Remove selected class from all skins
                    document.querySelectorAll('.skin-option').forEach(el => {
                        el.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked skin
                    skinElement.classList.add('selected');
                    
                    // Save selection
                    gameStorage.setSelectedSkin(skin.id);
                });
            } else {
                skinElement.classList.add('locked');
            }

            skinOptions.appendChild(skinElement);
        });
    }

    updateBestScoreDisplay() {
        const bestScore = gameStorage.getBestScore();
        const bestScoreDisplay = document.getElementById('bestScoreDisplay');
        if (bestScoreDisplay) {
            bestScoreDisplay.textContent = `${bestScore}m`;
        }
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
    }

    showStartScreen() {
        this.showScreen('start');
        this.updateBestScoreDisplay();
        this.setupSkinSelector();
        
        if (game) {
            game.pause();
        }
    }

    showGameScreen() {
        this.showScreen('game');
        
        // Update HUD with current values
        const currentScore = document.getElementById('currentScore');
        const bestScore = document.getElementById('bestScore');
        
        if (currentScore) currentScore.textContent = '0m';
        if (bestScore) bestScore.textContent = `Best: ${gameStorage.getBestScore()}m`;
    }

    showGameOverScreen(finalScore, bestScore, isNewRecord, newUnlocks) {
        this.showScreen('gameOver');
        
        // Update final stats
        document.getElementById('finalScore').textContent = `${finalScore}m`;
        document.getElementById('finalBestScore').textContent = `${bestScore}m`;
        
        // Show new record message
        const newRecordElement = document.getElementById('newRecord');
        if (isNewRecord) {
            newRecordElement.classList.remove('hidden');
        } else {
            newRecordElement.classList.add('hidden');
        }
        
        // Show unlock messages
        const unlockMessageElement = document.getElementById('unlockMessage');
        if (newUnlocks.length > 0) {
            const skinNames = newUnlocks.map(skin => skin.name).join(', ');
            unlockMessageElement.textContent = `New skin${newUnlocks.length > 1 ? 's' : ''} unlocked: ${skinNames}!`;
            unlockMessageElement.classList.remove('hidden');
        } else {
            unlockMessageElement.classList.add('hidden');
        }
        
        // Show motivational quote
        const motivationalText = document.getElementById('motivationalText');
        motivationalText.textContent = gameStorage.getRandomMotivationalQuote();
    }

    showModal() {
        this.modal.classList.remove('hidden');
    }

    hideModal() {
        this.modal.classList.add('hidden');
    }

    startGame() {
        this.showGameScreen();
        
        if (!game) {
            game = new Game();
        }
        
        game.start();
    }
}

// Global UI manager instance
const uiManager = new UIManager();
window.uiManager = uiManager;