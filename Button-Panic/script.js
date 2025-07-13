// Editable word list - add more words here to expand the game
const WORDS = [
    'JUMP', 'RUN', 'CLAP', 'DANCE', 'SLAP', 'YELL', 'SLEEP', 'SPIN',
    'WALK', 'SING', 'LAUGH', 'CRY', 'WAVE', 'NOD', 'BLINK', 'SMILE',
    'FROWN', 'SHOUT', 'WHISPER', 'CRAWL', 'ROLL', 'FLIP', 'BEND', 'STRETCH',
    'POINT', 'GRAB', 'PUSH', 'PULL', 'LIFT', 'DROP', 'THROW', 'CATCH',
    'SIT', 'STAND', 'KNEEL', 'LIE', 'TURN', 'TWIST', 'SHAKE', 'ROCK'
];

// Game state
let gameState = {
    score: 0,
    hearts: 3,
    currentWord: '',
    correctIndex: 0,
    isPlaying: false,
    timer: null,
    timeLeft: 2.0,
    maxTime: 2.0,
    isMuted: false
};

// Audio context for sound effects
let audioContext;
let sounds = {};

// High score management
function getHighScore() {
    return parseInt(localStorage.getItem('buttonPanicHighScore') || '0');
}

function setHighScore(score) {
    const currentHigh = getHighScore();
    if (score > currentHigh) {
        localStorage.setItem('buttonPanicHighScore', score.toString());
        return true; // New record
    }
    return false;
}

function updateHighScoreDisplay() {
    document.getElementById('highScoreDisplay').textContent = getHighScore();
}

// Timer difficulty progression
function getTimerDuration(score) {
    if (score >= 1200) {
        return 1.0; // Ultra speed
    } else if (score >= 500) {
        return 1.2; // Fast speed
    } else if (score >= 200) {
        return 1.5; // Medium speed
    }
    return 2.0; // Normal speed
}

function getDifficultyText(score) {
    if (score >= 1200) {
        return 'Ultra Speed! 🚀';
    } else if (score >= 500) {
        return 'Fast Speed! ⚡';
    } else if (score >= 200) {
        return 'Medium Speed! 🔥';
    }
    return 'Normal Speed';
}

// Initialize audio
function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create simple sound effects
    sounds.correct = createTone(523.25, 0.3, 'sine'); // C5
    sounds.wrong = createTone(196.00, 0.5, 'square'); // G3
    sounds.click = createTone(440.00, 0.1, 'sine'); // A4
    sounds.gameOver = createTone(146.83, 1.0, 'triangle'); // D3
    sounds.newRecord = createTone(659.25, 0.8, 'sine'); // E5
}

function createTone(frequency, duration, waveform = 'sine') {
    return () => {
        if (gameState.isMuted || !audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = waveform;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    };
}

function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    document.getElementById('muteBtn').textContent = gameState.isMuted ? '🔇' : '🔊';
}

function startGame() {
    // Initialize audio on first user interaction
    if (!audioContext) {
        initAudio();
    }
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    
    gameState.score = 0;
    gameState.hearts = 3;
    gameState.isPlaying = true;
    gameState.maxTime = 2.0;
    
    updateUI();
    updateDifficultyIndicator();
    
    setTimeout(() => {
        nextRound();
    }, 1000);
}

function nextRound() {
    if (!gameState.isPlaying) return;
    
    // Update timer duration based on score
    gameState.maxTime = getTimerDuration(gameState.score);
    updateDifficultyIndicator();
    
    // Reset feedback
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    
    // Select random command word
    gameState.currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    
    // Create button options (1 correct + 3 wrong)
    const options = [gameState.currentWord];
    
    // Add 3 unique wrong options
    while (options.length < 4) {
        const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        if (!options.includes(randomWord)) {
            options.push(randomWord);
        }
    }
    
    // Shuffle the options
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    // Find the correct answer index after shuffle
    gameState.correctIndex = options.indexOf(gameState.currentWord);
    
    // Update UI
    document.getElementById('commandWord').textContent = gameState.currentWord;
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach((button, index) => {
        button.textContent = options[index];
        button.className = 'game-button';
        button.disabled = false;
    });
    
    // Start timer
    startTimer();
}

function updateDifficultyIndicator() {
    document.getElementById('difficultyIndicator').textContent = getDifficultyText(gameState.score);
}

function startTimer() {
    gameState.timeLeft = gameState.maxTime;
    updateTimer();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft -= 0.1;
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            timeOut();
        } else {
            updateTimer();
        }
    }, 100);
}

function updateTimer() {
    const percentage = (gameState.timeLeft / gameState.maxTime) * 100;
    document.getElementById('timerFill').style.width = percentage + '%';
    document.getElementById('timerText').textContent = Math.max(0, gameState.timeLeft).toFixed(1) + 's';
}

function selectAnswer(index) {
    if (!gameState.isPlaying) return;
    
    clearInterval(gameState.timer);
    
    sounds.click?.();
    
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => button.disabled = true);
    
    if (index === gameState.correctIndex) {
        // Correct answer
        buttons[index].classList.add('correct');
        gameState.score += 10;
        showFeedback('Perfect! +10 points', 'correct');
        sounds.correct?.();
    } else {
        // Wrong answer
        buttons[index].classList.add('wrong');
        buttons[gameState.correctIndex].classList.add('correct');
        loseHeart();
        showFeedback('Oops! Wrong answer', 'wrong');
        sounds.wrong?.();
    }
    
    updateUI();
    
    if (gameState.hearts > 0) {
        setTimeout(() => {
            nextRound();
        }, 1500);
    }
}

function timeOut() {
    if (!gameState.isPlaying) return;
    
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => button.disabled = true);
    buttons[gameState.correctIndex].classList.add('correct');
    
    loseHeart();
    showFeedback('Time\'s up!', 'wrong');
    sounds.wrong?.();
    
    updateUI();
    
    if (gameState.hearts > 0) {
        setTimeout(() => {
            nextRound();
        }, 1500);
    }
}

function loseHeart() {
    gameState.hearts--;
    
    // Add beautiful heart losing animation
    const hearts = document.querySelectorAll('.heart');
    const heartToLose = hearts[gameState.hearts]; // The heart that will be lost
    
    if (heartToLose) {
        // Add losing animation class
        heartToLose.classList.add('losing');
        
        // Create and add floating text
        const heartText = document.createElement('span');
        heartText.className = 'heart-text';
        heartText.textContent = gameState.hearts === 0 ? 'GAME OVER!' : '-1 LIFE';
        heartToLose.appendChild(heartText);
        
        // After animation completes, add lost class
        setTimeout(() => {
            heartToLose.classList.remove('losing');
            heartToLose.classList.add('lost');
            // Remove the text element
            if (heartText.parentNode) {
                heartText.parentNode.removeChild(heartText);
            }
        }, 1500);
    }
    
    if (gameState.hearts <= 0) {
        // Delay game end to show the final heart animation
        setTimeout(() => {
            endGame();
        }, 1500);
    }
}

function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index >= gameState.hearts) {
            heart.classList.add('lost');
        } else {
            heart.classList.remove('lost');
        }
    });
}

function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timer);
    
    // Check for new high score
    const isNewRecord = setHighScore(gameState.score);
    
    // Update game over screen
    document.getElementById('finalScore').textContent = gameState.score;
    
    const highScoreResult = document.getElementById('highScoreResult');
    const gameOverTitle = document.getElementById('gameOverTitle');
    
    if (isNewRecord && gameState.score > 0) {
        highScoreResult.textContent = '🎉 NEW HIGH SCORE! 🎉';
        highScoreResult.className = 'high-score-result new-record';
        gameOverTitle.textContent = 'Amazing!';
        sounds.newRecord?.();
    } else {
        highScoreResult.textContent = `High Score: ${getHighScore()}`;
        highScoreResult.className = 'high-score-result no-record';
        gameOverTitle.textContent = 'Game Over!';
        sounds.gameOver?.();
    }
    
    document.getElementById('gameOver').style.display = 'flex';
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    
    // Update high score display
    updateHighScoreDisplay();
    
    // Reset button states
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => {
        button.className = 'game-button';
        button.disabled = false;
    });
    
    // Reset heart states
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach(heart => {
        heart.className = 'heart';
        // Remove any leftover heart text elements
        const heartText = heart.querySelector('.heart-text');
        if (heartText) {
            heartText.remove();
        }
    });
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (!gameState.isPlaying) return;
    
    const key = e.key;
    if (key >= '1' && key <= '4') {
        const index = parseInt(key) - 1;
        selectAnswer(index);
    }
});

// Initialize high score display on page load
document.addEventListener('DOMContentLoaded', () => {
    updateHighScoreDisplay();
});