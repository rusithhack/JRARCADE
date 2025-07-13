class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.graphics = new GraphicsEngine(this.canvas);
        
        this.gameState = 'menu'; // menu, playing, gameOver
        this.score = 0;
        this.bestScore = gameStorage.getBestScore();
        this.gameSpeed = 1;
        this.scrollOffset = 0;
        
        this.player = {
            x: 100,
            y: 0,
            width: 50,
            height: 50,
            baseY: 0,
            velocityY: 0,
            isJumping: false,
            isSliding: false,
            action: 'running',
            animFrame: 0,
            skin: gameStorage.getSelectedSkin()
        };
        
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleFrequency = 120; // frames between obstacles
        this.speedIncreaseTimer = 0;
        this.animationId = null;
        
        this.setupPlayerPosition();
        this.setupInputCallbacks();
        this.setupObstacleTypes();
    }

    setupPlayerPosition() {
        this.player.baseY = this.canvas.height - 80 - this.player.height;
        this.player.y = this.player.baseY;
    }

    setupInputCallbacks() {
        inputManager.setJumpCallback(() => this.jump());
        inputManager.setSlideCallback(() => this.slide());
    }

    setupObstacleTypes() {
        this.obstacleTypes = [
            { 
                type: 'trash', 
                width: 40, 
                height: 60, 
                color: '#ff4444',
                canJumpOver: true,
                canSlideUnder: false
            },
            { 
                type: 'sign', 
                width: 30, 
                height: 80, 
                color: '#ffff00',
                canJumpOver: true,
                canSlideUnder: false
            },
            { 
                type: 'barrier', 
                width: 50, 
                height: 40, 
                color: '#ff8800',
                canJumpOver: false,
                canSlideUnder: true
            },
            { 
                type: 'cone', 
                width: 35, 
                height: 50, 
                color: '#ff6600',
                canJumpOver: true,
                canSlideUnder: false
            }
        ];
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameSpeed = 1;
        this.scrollOffset = 0;
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.speedIncreaseTimer = 0;
        
        this.player.y = this.player.baseY;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.action = 'running';
        this.player.skin = gameStorage.getSelectedSkin();
        
        inputManager.setJumpingState(false);
        inputManager.setSlidingState(false);
        
        this.gameLoop();
    }

    jump() {
        if (!this.player.isJumping && !this.player.isSliding && this.gameState === 'playing') {
            this.player.isJumping = true;
            this.player.velocityY = -15;
            this.player.action = 'jumping';
            inputManager.setJumpingState(true);
        }
    }

    slide() {
        if (!this.player.isJumping && !this.player.isSliding && this.gameState === 'playing') {
            this.player.isSliding = true;
            this.player.action = 'sliding';
            this.player.height = 25;
            this.player.y = this.player.baseY + 25;
            inputManager.setSlidingState(true);
            
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    this.player.isSliding = false;
                    this.player.height = 50;
                    this.player.y = this.player.baseY;
                    this.player.action = 'running';
                    inputManager.setSlidingState(false);
                }
            }, 600);
        }
    }

    updatePlayer() {
        // Handle jumping physics
        if (this.player.isJumping) {
            this.player.velocityY += 0.8; // gravity
            this.player.y += this.player.velocityY;
            
            if (this.player.y >= this.player.baseY) {
                this.player.y = this.player.baseY;
                this.player.velocityY = 0;
                this.player.isJumping = false;
                this.player.action = 'running';
                inputManager.setJumpingState(false);
            }
        }
        
        // Update animation frame
        this.player.animFrame = (this.player.animFrame + 1) % 60;
    }

    spawnObstacle() {
        if (this.obstacleTimer <= 0) {
            const obstacleType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
            const obstacle = {
                ...obstacleType,
                x: this.canvas.width,
                y: this.canvas.height - 80 - obstacleType.height,
                id: Math.random()
            };
            
            this.obstacles.push(obstacle);
            this.obstacleTimer = this.obstacleFrequency / this.gameSpeed;
        } else {
            this.obstacleTimer--;
        }
    }

    updateObstacles() {
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= 5 * this.gameSpeed;
            return obstacle.x + obstacle.width > 0;
        });
    }

    checkCollisions() {
        for (const obstacle of this.obstacles) {
            if (this.isColliding(this.player, obstacle)) {
                this.graphics.addCollisionEffect(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height / 2
                );
                this.gameOver();
                return;
            }
        }
    }

    isColliding(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }

    updateGameSpeed() {
        this.speedIncreaseTimer++;
        if (this.speedIncreaseTimer >= 600) { // Every 10 seconds at 60fps
            this.gameSpeed += 0.1;
            this.speedIncreaseTimer = 0;
            
            // Increase obstacle frequency
            this.obstacleFrequency = Math.max(60, this.obstacleFrequency - 5);
        }
    }

    updateScore() {
        this.score += this.gameSpeed * 0.1;
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.spawnObstacle();
        this.updateObstacles();
        this.checkCollisions();
        this.updateGameSpeed();
        this.updateScore();
        
        this.scrollOffset += 5 * this.gameSpeed;
        
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        this.graphics.clear();
        this.graphics.drawBackground(this.scrollOffset, this.gameSpeed);
        this.graphics.drawGround(this.scrollOffset);
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.graphics.drawObstacle(obstacle);
        });
        
        // Draw player
        this.graphics.drawPlayer(
            this.player.x,
            this.player.y,
            this.player.width,
            this.player.height,
            this.player.action,
            this.player.animFrame,
            this.player.skin
        );
        
        this.graphics.updateAndDrawParticles();
        this.graphics.drawSpeedBlur(this.gameSpeed);
        
        // Update HUD
        this.updateHUD();
    }

    updateHUD() {
        const currentScoreElement = document.getElementById('currentScore');
        const bestScoreElement = document.getElementById('bestScore');
        const speedFillElement = document.getElementById('speedFill');
        
        if (currentScoreElement) {
            currentScoreElement.textContent = `${Math.floor(this.score)}m`;
        }
        
        if (bestScoreElement) {
            bestScoreElement.textContent = `Best: ${this.bestScore}m`;
        }
        
        if (speedFillElement) {
            const speedPercent = Math.min((this.gameSpeed - 1) / 2 * 100, 100);
            speedFillElement.style.width = `${speedPercent}%`;
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const finalScore = Math.floor(this.score);
        const isNewRecord = finalScore > this.bestScore;
        
        if (isNewRecord) {
            this.bestScore = finalScore;
            gameStorage.setBestScore(finalScore);
        }
        
        // Check for unlocks
        const newUnlocks = gameStorage.checkForNewUnlocks(finalScore);
        gameStorage.addToTotalDistance(finalScore);
        
        // Show game over screen
        setTimeout(() => {
            window.uiManager.showGameOverScreen(finalScore, this.bestScore, isNewRecord, newUnlocks);
        }, 1000);
    }

    pause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    resume() {
        if (this.gameState === 'playing') {
            this.gameLoop();
        }
    }
}

// Global game instance
let game = null;