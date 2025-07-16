// Enhanced JR ARCADE Navigation with Scroll Animations

// Page loader
window.addEventListener('load', () => {
  const loader = document.querySelector('.page-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => {
        loader.remove();
      }, 500);
    }, 1000);
  }
});

// Navigation function with enhanced transition
function navigateToGame(path) {
  // Add visual feedback
  document.body.style.cursor = 'wait';
  
  // Create enhanced loading overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
    background-size: 400% 400%;
    animation: gradientShift 2s ease infinite;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.4s ease;
    backdrop-filter: blur(20px);
  `;
  
  const loadingContent = document.createElement('div');
  loadingContent.style.cssText = `
    color: white;
    font-family: 'Poppins', sans-serif;
    font-size: 1.8rem;
    font-weight: 600;
    text-align: center;
    animation: fadeInUp 0.6s ease-out;
  `;
  
  loadingContent.innerHTML = `
    <div style="margin-bottom: 2rem; font-size: 4rem; animation: bounce 1s ease-in-out infinite;">🎮</div>
    <div style="margin-bottom: 1rem; background: linear-gradient(135deg, #ffffff, #f0f0f0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Loading Game...</div>
    <div style="width: 60px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto; overflow: hidden;">
      <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #ffffff, #f0f0f0); border-radius: 2px; animation: loadingBar 1.5s ease-in-out infinite;"></div>
    </div>
  `;
  
  // Add keyframes for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes loadingBar {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(style);
  
  overlay.appendChild(loadingContent);
  document.body.appendChild(overlay);
  
  // Fade in overlay with enhanced animation
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
        document.head.removeChild(style);
        
        // Show enhanced error message
        showErrorMessage(`Game not found at: ${path}`);
      }, 400);
    }
  }, 800);
}

// Enhanced error message function
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
    color: white;
    padding: 3rem 4rem;
    border-radius: 24px;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    text-align: center;
    z-index: 10000;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.4);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation: errorSlideIn 0.6s ease-out forwards;
  `;
  
  errorDiv.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 1.5rem; animation: shake 0.5s ease-in-out;">⚠️</div>
    <div style="margin-bottom: 1.5rem; font-size: 1.3rem; font-weight: 700;">${message}</div>
    <div style="font-size: 1rem; opacity: 0.9; font-weight: 400;">Please check that the game files exist</div>
    <div style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">Click anywhere to dismiss</div>
  `;
  
  // Add error-specific animations
  const errorStyle = document.createElement('style');
  errorStyle.textContent = `
    @keyframes errorSlideIn {
      from { 
        opacity: 0; 
        transform: translate(-50%, -50%) scale(0.8) translateY(20px); 
      }
      to { 
        opacity: 1; 
        transform: translate(-50%, -50%) scale(1) translateY(0); 
      }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(errorStyle);
  
  document.body.appendChild(errorDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    errorDiv.style.opacity = '0';
    errorDiv.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
        document.head.removeChild(errorStyle);
      }
    }, 400);
  }, 5000);
  
  // Click to dismiss
  errorDiv.addEventListener('click', () => {
    errorDiv.style.opacity = '0';
    errorDiv.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
        document.head.removeChild(errorStyle);
      }
    }, 400);
  });
}

// Enhanced scroll animations
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Staggered animation with enhanced timing
      setTimeout(() => {
        entry.target.classList.add('animate');
        
        // Add ripple effect for game cards
        if (entry.target.classList.contains('game-card')) {
          createRippleEffect(entry.target);
        }
      }, index * 150);
    }
  });
}, observerOptions);

// Create ripple effect for elements
function createRippleEffect(element) {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.3), transparent);
    transform: translate(-50%, -50%);
    animation: rippleExpand 1s ease-out;
    pointer-events: none;
    z-index: 1;
  `;
  
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes rippleExpand {
      0% {
        width: 0;
        height: 0;
        opacity: 1;
      }
      100% {
        width: 300px;
        height: 300px;
        opacity: 0;
      }
    }
  `;
  
  if (!document.querySelector('#ripple-styles')) {
    rippleStyle.id = 'ripple-styles';
    document.head.appendChild(rippleStyle);
  }
  
  element.style.position = 'relative';
  element.appendChild(ripple);
  
  setTimeout(() => {
    if (element.contains(ripple)) {
      element.removeChild(ripple);
    }
  }, 1000);
}

// Parallax effect for background particles
function updateParallax() {
  const scrolled = window.pageYOffset;
  const particles = document.querySelectorAll('.particle');
  
  particles.forEach((particle, index) => {
    const speed = 0.5 + (index * 0.1);
    const yPos = -(scrolled * speed);
    particle.style.transform = `translateY(${yPos}px)`;
  });
}

// Smooth scroll for internal links
function smoothScrollTo(target) {
  const element = document.querySelector(target);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Initialize enhanced animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up scroll animations for game cards
  const gameCards = document.querySelectorAll('.game-card');
  gameCards.forEach((card, index) => {
    card.classList.add('scroll-animate');
    
    // Add different animation types
    if (index % 3 === 0) {
      card.classList.add('slide-left');
    } else if (index % 3 === 1) {
      card.classList.add('zoom-in');
    } else {
      card.classList.add('slide-right');
    }
    
    observer.observe(card);
  });
  
  // Set up scroll animations for other elements
  const animatedElements = document.querySelectorAll('.hero, .games-section, .footer');
  animatedElements.forEach(element => {
    element.classList.add('scroll-animate');
    observer.observe(element);
  });
  
  // Enhanced keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close any error messages or overlays
      const overlays = document.querySelectorAll('[style*="position: fixed"]');
      overlays.forEach(overlay => {
        if (overlay.style.opacity === '1') {
          overlay.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          }, 400);
        }
      });
    }
    
    // Arrow key navigation for game cards
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const cards = document.querySelectorAll('.game-card');
      const focused = document.activeElement;
      const currentIndex = Array.from(cards).indexOf(focused);
      
      if (currentIndex !== -1) {
        const nextIndex = e.key === 'ArrowDown' 
          ? Math.min(currentIndex + 1, cards.length - 1)
          : Math.max(currentIndex - 1, 0);
        cards[nextIndex].focus();
      } else if (cards.length > 0) {
        cards[0].focus();
      }
    }
  });
  
  // Enhanced hover effects with sound (optional)
  const gameCards = document.querySelectorAll('.game-card');
  gameCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      // Add subtle scale animation
      card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Optional: Add hover sound effect
      // playHoverSound();
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
  });
  
  // Parallax scrolling effect
  let ticking = false;
  
  function updateScrollEffects() {
    updateParallax();
    ticking = false;
  }
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollEffects);
      ticking = true;
    }
  });
  
  // Add loading state management
  window.addEventListener('beforeunload', () => {
    document.body.style.cursor = 'wait';
  });
  
  // Enhanced touch support for mobile devices
  let touchStartY = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY - touchY;
    
    // Add subtle parallax effect on mobile scroll
    if (Math.abs(deltaY) > 10) {
      updateParallax();
    }
  }, { passive: true });
  
  // Add focus management for accessibility
  const focusableElements = document.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
  focusableElements.forEach(element => {
    element.addEventListener('focus', () => {
      element.style.outline = '3px solid rgba(102, 126, 234, 0.8)';
      element.style.outlineOffset = '4px';
    });
    
    element.addEventListener('blur', () => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    });
  });
});

// Make navigation function globally available
window.navigateToGame = navigateToGame;

// Preload critical resources for better performance
const preloadLinks = [
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap'
];

preloadLinks.forEach(href => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  document.head.appendChild(link);
});

// Optional: Add sound effects (uncomment if you want to add audio feedback)
/*
function playHoverSound() {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  audio.volume = 0.1;
  audio.play().catch(() => {}); // Ignore errors if audio fails
}
*/

console.log('🎮 Enhanced JR ARCADE initialized successfully!');
console.log('✨ Features: Animated gradients, scroll animations, enhanced hover effects');
console.log('🎨 Inspired by modern web design with smooth transitions');