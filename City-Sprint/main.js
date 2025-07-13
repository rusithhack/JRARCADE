// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('City Sprint - Endless Runner Game Loaded');
    
    // Initialize UI Manager (already created as global)
    uiManager.showStartScreen();
    
    // Prevent context menu on long press (mobile)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Prevent zooming on mobile
    document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Handle window focus/blur for pausing
    window.addEventListener('blur', () => {
        if (game && game.gameState === 'playing') {
            game.pause();
        }
    });
    
    window.addEventListener('focus', () => {
        if (game && game.gameState === 'playing') {
            game.resume();
        }
    });
    
    // Handle visibility change for mobile
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (game && game.gameState === 'playing') {
                game.pause();
            }
        } else {
            if (game && game.gameState === 'playing') {
                game.resume();
            }
        }
    });
});

// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (game && game.graphics) {
            game.graphics.resizeCanvas();
            game.setupPlayerPosition();
        }
    }, 100);
});

// Prevent scrolling on mobile
document.body.addEventListener('touchstart', (e) => {
    if (e.target === document.body) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchend', (e) => {
    if (e.target === document.body) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchmove', (e) => {
    if (e.target === document.body) {
        e.preventDefault();
    }
}, { passive: false });

console.log('🏃 City Sprint initialized successfully!');
console.log('🎮 Use SPACE/TAP to jump, DOWN ARROW/SWIPE DOWN to slide');
console.log('🏆 Beat your high score and unlock new runner skins!');
console.log('🌃 Welcome to the neon-lit streets of the endless city!');