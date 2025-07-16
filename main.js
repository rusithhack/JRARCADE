// Premium Game Hub Navigation

// Navigation function with smooth transition
function navigateToGame(path) {
  // Add visual feedback
  document.body.style.cursor = 'wait';
  
  // Create loading overlay for smooth transition
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(6, 182, 212, 0.9));
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(10px);
  `;
  
  const loadingText = document.createElement('div');
  loadingText.style.cssText = `
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
  `;
  loadingText.innerHTML = `
    <div style="margin-bottom: 1rem;">🎮</div>
    <div>Loading Game...</div>
  `;
  
  overlay.appendChild(loadingText);
  document.body.appendChild(overlay);
  
  // Fade in overlay
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });
  
  // Navigate after smooth transition
  setTimeout(() => {
    try {
      window.location.href = path;
    } catch (error) {
      console.warn(`Could not navigate to ${path}`);
      
      // Remove overlay and show error
      overlay.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(overlay);
        document.body.style.cursor = 'default';
        
        // Show elegant error message
        showErrorMessage(`Game not found at: ${path}`);
      }, 300);
    }
  }, 600);
}

// Error message function
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 2rem 3rem;
    border-radius: 16px;
    font-weight: 600;
    text-align: center;
    z-index: 10000;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: all 0.3s ease;
  `;
  
  errorDiv.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
    <div style="margin-bottom: 1rem;">${message}</div>
    <div style="font-size: 0.9rem; opacity: 0.8;">Please check that the game files exist</div>
  `;
  
  document.body.appendChild(errorDiv);
  
  // Fade in
  requestAnimationFrame(() => {
    errorDiv.style.opacity = '1';
  });
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    errorDiv.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 300);
  }, 4000);
  
  // Click to dismiss
  errorDiv.addEventListener('click', () => {
    errorDiv.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 300);
  });
}

// Make navigation function globally available
window.navigateToGame = navigateToGame;

// Enhanced scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Staggered animation
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0) scale(1)';
      }, index * 100);
    }
  });
}, observerOptions);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up scroll animations
  const gameCards = document.querySelectorAll('.game-card');
  gameCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px) scale(0.95)';
    card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(card);
  });
  
  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close any error messages
      const errorMessages = document.querySelectorAll('[style*="position: fixed"]');
      errorMessages.forEach(msg => {
        if (msg.style.opacity === '1') {
          msg.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(msg)) {
              document.body.removeChild(msg);
            }
          }, 300);
        }
      });
    }
  });
  
  // Add smooth hover effects for better performance
  const style = document.createElement('style');
  style.textContent = `
    .game-card {
      transform-origin: center;
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    .game-card:hover {
      transform: translateY(-12px) scale(1.02) translateZ(0);
    }
    
    /* Optimize animations */
    .particle {
      transform-origin: center;
      backface-visibility: hidden;
    }
  `;
  document.head.appendChild(style);
  
  // Add loading state management
  window.addEventListener('beforeunload', () => {
    document.body.style.cursor = 'wait';
  });
});

// Performance optimization: Throttle scroll events
let ticking = false;

function updateScrollEffects() {
  // Add any scroll-based effects here if needed
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateScrollEffects);
    ticking = true;
  }
});

// Add touch support for mobile devices
document.addEventListener('touchstart', () => {
  // Enable touch interactions
}, { passive: true });

// Preload critical resources
const preloadLinks = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

preloadLinks.forEach(href => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  document.head.appendChild(link);
});