// Animation utilities
export function initAnimations() {
  console.log('🎬 Initializing animations...');
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    console.log('⚡ Reduced motion detected - using minimal animations');
    return;
  }
  
  // Initialize different types of animations
  initScrollAnimations();
  initHoverAnimations();
  initTypewriterEffect();
  initParallaxEffects();
}

// Scroll-triggered animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const animationType = element.dataset.animation || 'fade-in';
        
        element.classList.add(`animate-${animationType}`);
        
        // Unobserve after animation to improve performance
        observer.unobserve(element);
      }
    });
  }, observerOptions);

  // Observe elements with animation data attributes
  document.querySelectorAll('[data-animation]').forEach(element => {
    observer.observe(element);
  });
  
  // Default animations for sections and cards
  document.querySelectorAll('section, .about__card, .hero__content').forEach(element => {
    if (!element.dataset.animation) {
      element.dataset.animation = 'fade-in';
      observer.observe(element);
    }
  });
}

// Enhanced hover animations
function initHoverAnimations() {
  // Card hover effects
  const cards = document.querySelectorAll('.about__card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
  
  // Button hover effects
  const buttons = document.querySelectorAll('.hero__cta-button, .footer__email');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });
}

// Typewriter effect for hero title
function initTypewriterEffect() {
  const heroTitle = document.querySelector('.hero__title');
  if (!heroTitle) return;
  
  const text = heroTitle.textContent;
  const words = text.split(' ');
  
  // Only apply typewriter to the first part
  if (words.length > 2) {
    const firstPart = words.slice(0, -2).join(' ');
    const lastPart = words.slice(-2).join(' ');
    
    heroTitle.innerHTML = `<span class="typewriter">${firstPart}</span> <span class="highlight">${lastPart}</span>`;
    
    const typewriterElement = heroTitle.querySelector('.typewriter');
    typewriterElement.style.opacity = '0';
    
    // Start typewriter effect after a delay
    setTimeout(() => {
      typewriterAnimation(typewriterElement, firstPart);
    }, 500);
  }
}

// Typewriter animation function
function typewriterAnimation(element, text) {
  element.style.opacity = '1';
  element.textContent = '';
  
  let i = 0;
  const speed = 100; // milliseconds per character
  
  function typeChar() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typeChar, speed);
    }
  }
  
  typeChar();
}

// Subtle parallax effects
function initParallaxEffects() {
  const parallaxElements = document.querySelectorAll('.hero, .about');
  
  if (parallaxElements.length === 0) return;
  
  let ticking = false;
  
  function updateParallax() {
    const scrollY = window.pageYOffset;
    
    parallaxElements.forEach((element, index) => {
      const speed = 0.5 + (index * 0.1); // Different speeds for different elements
      const yPos = -(scrollY * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
}

// Stagger animation for multiple elements
export function staggerAnimation(elements, delay = 100) {
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('animate-fade-in');
    }, index * delay);
  });
}

// Add CSS for animations
const animationStyles = `
  /* Base animation classes */
  .animate-fade-in {
    animation: fadeIn 0.8s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slideUp 0.8s ease-out forwards;
  }
  
  .animate-slide-left {
    animation: slideLeft 0.8s ease-out forwards;
  }
  
  .animate-slide-right {
    animation: slideRight 0.8s ease-out forwards;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.6s ease-out forwards;
  }
  
  /* Keyframe animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideLeft {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideRight {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  /* Typewriter cursor effect */
  .typewriter::after {
    content: '|';
    animation: blink 1s infinite;
    color: var(--secondary-color);
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  /* Hover transition improvements */
  .about__card,
  .hero__cta-button,
  .footer__email,
  .footer__social-link {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    
    .typewriter::after {
      animation: none;
    }
  }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);