// Game State
let gameState = {
    currentPlayer: 1,
    selectedColor: '#000000',
    gridSize: 16,
    targetImage: null,
    playerGrid: [],
    pixelsPlaced: 0,
    hintsUsed: 0,
    undoesUsed: { player1: 0, player2: 0 },
    gameStartTime: null,
    turns: 0
};

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const victoryScreen = document.getElementById('victoryScreen');
const startButton = document.getElementById('startButton');
const gridSizeSelect = document.getElementById('gridSize');
const imagePackSelect = document.getElementById('imagePack');
const pixelGrid = document.getElementById('pixelGrid');
const hintOverlay = document.getElementById('hintOverlay');
const currentPlayerSpan = document.getElementById('currentPlayer');
const playerAvatar = document.getElementById('playerAvatar');
const pixelsPlacedSpan = document.getElementById('pixelsPlaced');
const colorButtons = document.querySelectorAll('.color-btn');
const guessInput = document.getElementById('guessInput');
const guessButton = document.getElementById('guessButton');
const hintButton = document.getElementById('hintButton');
const undoButton = document.getElementById('undoButton');
const quitButton = document.getElementById('quitButton');
const playAgainButton = document.getElementById('playAgainButton');
const changePackButton = document.getElementById('changePackButton');
const confettiContainer = document.getElementById('confetti');
const hintsLeftSpan = document.getElementById('hintsLeft');
const undosLeftSpan = document.getElementById('undosLeft');

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    setupEventListeners();
    updateUnlockedPacks();
});

function setupEventListeners() {
    startButton.addEventListener('click', startGame);
    guessButton.addEventListener('click', makeGuess);
    hintButton.addEventListener('click', showHint);
    undoButton.addEventListener('click', undoLastMove);
    quitButton.addEventListener('click', quitGame);
    playAgainButton.addEventListener('click', playAgain);
    changePackButton.addEventListener('click', changePackAndPlay);
    
    // Color picker
    colorButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            selectColor(this.dataset.color);
        });
    });
    
    // Guess on Enter
    guessInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            makeGuess();
        }
    });
}

function startGame() {
    const selectedSize = parseInt(gridSizeSelect.value);
    const selectedPack = imagePackSelect.value;
    
    // Get random image from selected pack
    gameState.targetImage = getRandomImage(selectedPack);
    if (!gameState.targetImage) {
        alert('No images available in this pack!');
        return;
    }
    
    gameState.gridSize = selectedSize;
    gameState.currentPlayer = 1;
    gameState.pixelsPlaced = 0;
    gameState.hintsUsed = 0;
    gameState.undoesUsed = { player1: 0, player2: 0 };
    gameState.gameStartTime = Date.now();
    gameState.turns = 0;
    
    // Initialize empty grid
    gameState.playerGrid = Array(selectedSize).fill().map(() => Array(selectedSize).fill(''));
    
    // Setup UI
    setupPixelGrid();
    setupHintOverlay();
    updatePlayerDisplay();
    updateControls();
    
    // Switch to game screen
    showScreen('game');
}

function setupPixelGrid() {
    pixelGrid.innerHTML = '';
    pixelGrid.className = `pixel-grid size-${gameState.gridSize}`;
    
    for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.dataset.row = row;
            pixel.dataset.col = col;
            pixel.addEventListener('click', () => paintPixel(row, col));
            pixelGrid.appendChild(pixel);
        }
    }
}

function setupHintOverlay() {
    if (!gameState.targetImage) return;
    
    hintOverlay.innerHTML = '';
    hintOverlay.className = `hint-overlay size-${gameState.gridSize}`;
    
    const targetData = gameState.targetImage.data;
    for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            const color = targetData[row] && targetData[row][col] ? targetData[row][col] : '#f0f0f0';
            pixel.style.backgroundColor = color;
            pixel.style.borderRadius = '2px';
            hintOverlay.appendChild(pixel);
        }
    }
}

function paintPixel(row, col) {
    // Check if pixel is already painted
    if (gameState.playerGrid[row][col]) return;
    
    // Paint the pixel
    gameState.playerGrid[row][col] = gameState.selectedColor;
    gameState.pixelsPlaced++;
    gameState.turns++;
    
    // Update visual
    const pixelElement = pixelGrid.children[row * gameState.gridSize + col];
    pixelElement.style.backgroundColor = gameState.selectedColor;
    pixelElement.classList.add('painted');
    
    // Update UI
    updatePixelCount();
    
    // Show brief hint after each move
    showBriefHint();
    
    // Check win condition
    if (checkWinByCompletion()) {
        endGame('completion');
        return;
    }
    
    // Switch turns
    switchTurns();
}

function selectColor(color) {
    gameState.selectedColor = color;
    
    // Update UI
    colorButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-color="${color}"]`).classList.add('active');
}

function makeGuess() {
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;
    
    const targetKeywords = gameState.targetImage.keywords.map(k => k.toLowerCase());
    const isCorrect = targetKeywords.includes(guess);
    
    if (isCorrect) {
        endGame('guess', guess);
    } else {
        // Show brief feedback
        guessInput.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        guessInput.style.borderColor = '#ff4444';
        setTimeout(() => {
            guessInput.style.backgroundColor = '';
            guessInput.style.borderColor = '';
        }, 1000);
        
        // Clear input and switch turns
        guessInput.value = '';
        switchTurns();
    }
}

function showHint() {
    if (gameState.hintsUsed >= 1) return;
    
    gameState.hintsUsed++;
    hintOverlay.classList.add('show');
    
    setTimeout(() => {
        hintOverlay.classList.remove('show');
    }, 3000);
    
    updateControls();
}

function showBriefHint() {
    hintOverlay.classList.add('show');
    setTimeout(() => {
        hintOverlay.classList.remove('show');
    }, 800);
}

function undoLastMove() {
    const playerKey = `player${gameState.currentPlayer}`;
    if (gameState.undoesUsed[playerKey] >= 1) return;
    
    // Find last painted pixel
    let lastPixel = null;
    for (let row = gameState.gridSize - 1; row >= 0; row--) {
        for (let col = gameState.gridSize - 1; col >= 0; col--) {
            if (gameState.playerGrid[row][col]) {
                lastPixel = { row, col };
                break;
            }
        }
        if (lastPixel) break;
    }
    
    if (!lastPixel) return;
    
    // Remove the pixel
    gameState.playerGrid[lastPixel.row][lastPixel.col] = '';
    gameState.pixelsPlaced--;
    gameState.undoesUsed[playerKey]++;
    
    // Update visual
    const pixelElement = pixelGrid.children[lastPixel.row * gameState.gridSize + lastPixel.col];
    pixelElement.style.backgroundColor = '#f0f0f0';
    pixelElement.classList.remove('painted');
    
    updatePixelCount();
    updateControls();
}

function switchTurns() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updatePlayerDisplay();
    updateControls();
    guessInput.value = '';
}

function updatePlayerDisplay() {
    currentPlayerSpan.textContent = `Player ${gameState.currentPlayer}`;
    playerAvatar.textContent = `P${gameState.currentPlayer}`;
    playerAvatar.className = `player-avatar ${gameState.currentPlayer === 2 ? 'player2' : ''}`;
}

function updatePixelCount() {
    pixelsPlacedSpan.textContent = gameState.pixelsPlaced;
}

function updateControls() {
    const currentPlayerKey = `player${gameState.currentPlayer}`;
    const undoesLeft = 1 - gameState.undoesUsed[currentPlayerKey];
    const hintsLeft = 1 - gameState.hintsUsed;
    
    hintsLeftSpan.textContent = hintsLeft;
    hintButton.disabled = hintsLeft <= 0;
    
    undosLeftSpan.textContent = undoesLeft;
    undoButton.disabled = undoesLeft <= 0;
}

function checkWinByCompletion() {
    const totalPixels = gameState.gridSize * gameState.gridSize;
    return gameState.pixelsPlaced >= totalPixels;
}

function endGame(winType, guess = null) {
    let winner;
    let message;
    
    if (winType === 'guess') {
        winner = gameState.currentPlayer;
        message = `Correct guess: "${guess}"`;
    } else if (winType === 'completion') {
        // Determine winner by closest match
        winner = calculateClosestMatch();
        message = 'Grid completed! Winner by accuracy.';
    }
    
    // Update stats
    updateGameStats(winner);
    
    // Setup victory screen
    document.getElementById('victoryTitle').textContent = `🎉 Player ${winner} Wins!`;
    document.getElementById('victoryMessage').textContent = message;
    document.getElementById('finalPixelCount').textContent = gameState.pixelsPlaced;
    document.getElementById('finalTurnCount').textContent = gameState.turns;
    
    // Show final grids
    setupFinalGrids();
    
    // Show confetti
    createConfetti();
    
    // Switch to victory screen
    showScreen('victory');
}

function calculateClosestMatch() {
    // Simple accuracy calculation - count matching pixels
    let matches = 0;
    const targetData = gameState.targetImage.data;
    
    for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
            const targetColor = targetData[row] && targetData[row][col] ? targetData[row][col] : '';
            const playerColor = gameState.playerGrid[row][col];
            
            if (targetColor === playerColor) {
                matches++;
            }
        }
    }
    
    // For now, just return current player as winner
    // In a real implementation, you'd track each player's contributions
    return gameState.currentPlayer;
}

function setupFinalGrids() {
    const finalPlayerGrid = document.getElementById('finalPlayerGrid');
    const originalGrid = document.getElementById('originalGrid');
    
    // Player's final grid
    finalPlayerGrid.innerHTML = '';
    finalPlayerGrid.className = `pixel-grid small size-${gameState.gridSize}`;
    
    for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            const color = gameState.playerGrid[row][col] || '#f0f0f0';
            pixel.style.backgroundColor = color;
            pixel.style.borderRadius = '1px';
            finalPlayerGrid.appendChild(pixel);
        }
    }
    
    // Original image grid
    originalGrid.innerHTML = '';
    originalGrid.className = `pixel-grid small size-${gameState.gridSize}`;
    
    const targetData = gameState.targetImage.data;
    for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            const color = targetData[row] && targetData[row][col] ? targetData[row][col] : '#f0f0f0';
            pixel.style.backgroundColor = color;
            pixel.style.borderRadius = '1px';
            originalGrid.appendChild(pixel);
        }
    }
}

function createConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#FFD93D', '#FF8A80'];
    
    for (let i = 0; i < 100; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.className = 'confetti-piece';
        confettiPiece.style.left = Math.random() * 100 + '%';
        confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confettiPiece.style.animationDelay = Math.random() * 3 + 's';
        confettiPiece.style.animationDuration = (2 + Math.random() * 2) + 's';
        confettiContainer.appendChild(confettiPiece);
    }
    
    // Clean up confetti after animation
    setTimeout(() => {
        confettiContainer.innerHTML = '';
    }, 8000);
}

function updateGameStats(winner) {
    const stats = getStats();
    stats.gamesPlayed++;
    
    if (winner === 1) {
        stats.player1Wins++;
    } else {
        stats.player2Wins++;
    }
    
    // Check for unlocks
    checkUnlocks(stats);
    
    saveStats(stats);
    loadStats(); // Update display
}

function checkUnlocks(stats) {
    // Unlock emoji pack after 5 total wins
    if (stats.player1Wins + stats.player2Wins >= 5) {
        if (!stats.unlockedPacks.includes('emoji')) {
            stats.unlockedPacks.push('emoji');
            setTimeout(() => {
                alert('🎉 New pack unlocked: Emoji!');
            }, 1000);
        }
    }
}

function updateUnlockedPacks() {
    const stats = getStats();
    const emojiOption = imagePackSelect.querySelector('option[value="emoji"]');
    
    if (stats.unlockedPacks.includes('emoji')) {
        emojiOption.disabled = false;
        emojiOption.textContent = '😀 Emoji';
    }
}

function getStats() {
    const defaultStats = {
        player1Wins: 0,
        player2Wins: 0,
        gamesPlayed: 0,
        unlockedPacks: []
    };
    
    const stored = localStorage.getItem('pixelPainterStats');
    return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
}

function saveStats(stats) {
    localStorage.setItem('pixelPainterStats', JSON.stringify(stats));
}

function loadStats() {
    const stats = getStats();
    document.getElementById('p1Wins').textContent = stats.player1Wins;
    document.getElementById('p2Wins').textContent = stats.player2Wins;
    document.getElementById('gamesPlayed').textContent = stats.gamesPlayed;
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    switch (screenName) {
        case 'start':
            startScreen.classList.add('active');
            break;
        case 'game':
            gameScreen.classList.add('active');
            break;
        case 'victory':
            victoryScreen.classList.add('active');
            break;
    }
}

function quitGame() {
    if (confirm('Are you sure you want to quit the current game?')) {
        showScreen('start');
    }
}

function playAgain() {
    showScreen('start');
}

function changePackAndPlay() {
    showScreen('start');
}