class InputManager {
    constructor() {
        this.keys = {};
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.swipeThreshold = 50;
        this.isJumping = false;
        this.isSliding = false;
        this.callbacks = {
            jump: null,
            slide: null
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyPress(e.code);
            
            // Prevent default for game controls
            if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch events for mobile
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartY = touch.clientY;
            this.touchStartX = touch.clientX;
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        // Mouse click for jump (desktop fallback)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'gameCanvas') {
                this.triggerJump();
            }
        });
    }

    handleKeyPress(keyCode) {
        switch (keyCode) {
            case 'Space':
            case 'ArrowUp':
                this.triggerJump();
                break;
            case 'ArrowDown':
                this.triggerSlide();
                break;
        }
    }

    handleTouchEnd(e) {
        const touch = e.changedTouches[0];
        const deltaY = this.touchStartY - touch.clientY;
        const deltaX = Math.abs(this.touchStartX - touch.clientX);

        // Vertical swipe detection
        if (Math.abs(deltaY) > this.swipeThreshold && deltaX < this.swipeThreshold) {
            if (deltaY > 0) {
                // Swipe up - jump
                this.triggerJump();
            } else {
                // Swipe down - slide
                this.triggerSlide();
            }
        } else if (Math.abs(deltaY) < this.swipeThreshold && deltaX < this.swipeThreshold) {
            // Tap - jump
            this.triggerJump();
        }
    }

    triggerJump() {
        if (!this.isJumping && this.callbacks.jump) {
            this.callbacks.jump();
        }
    }

    triggerSlide() {
        if (!this.isJumping && !this.isSliding && this.callbacks.slide) {
            this.callbacks.slide();
        }
    }

    setJumpCallback(callback) {
        this.callbacks.jump = callback;
    }

    setSlideCallback(callback) {
        this.callbacks.slide = callback;
    }

    setJumpingState(isJumping) {
        this.isJumping = isJumping;
    }

    setSlidingState(isSliding) {
        this.isSliding = isSliding;
    }

    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
}

// Global input manager instance
const inputManager = new InputManager();