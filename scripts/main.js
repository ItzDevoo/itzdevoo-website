// Main JavaScript entry point
import { initAnimations } from './utils/animations.js';
import { initResponsive } from './utils/responsive.js';
import { initSmoothScroll } from './components/smooth-scroll.js';
import { initNavigation } from './components/navigation.js';
import { initPerformanceOptimizations, optimizeImages, optimizeFonts } from './utils/performance.js';
import { initSecurity, performSecurityHealthCheck } from './utils/security.js';

// Site configuration
const siteConfig = {
  personal: {
    name: "ItzDevoo",
    title: "Developer & Content Creator",
    bio: "Passionate about technology and creating digital experiences",
    email: "contact@itzdevoo.com",
    social: {
      github: "itzdevoo",
      youtube: "https://youtube.com/@itzdevoo"
    }
  },
  theme: {
    primaryColor: "#000000",
    secondaryColor: "#32cd32",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif"
  },
  features: {
    smoothScrolling: true,
    animations: true,
    darkMode: false,
    lazyLoading: true,
    typewriter: true
  }
};

// Performance monitoring
const performanceMetrics = {
  startTime: performance.now(),
  loadTime: null,
  interactionTime: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 ItzDevoo Portfolio - Initializing...');
  
  try {
    // Initialize core features
    initResponsive();
    initNavigation();
    
    if (siteConfig.features.smoothScrolling) {
      initSmoothScroll();
    }
    
    if (siteConfig.features.animations) {
      initAnimations();
    }
    
    // Initialize security measures
    initSecurity();
    
    // Initialize performance optimizations
    initPerformanceOptimizations();
    optimizeImages();
    optimizeFonts();
    
    // Initialize additional features
    initHeaderScroll();
    initContactForm();
    initPerformanceMonitoring();
    
    // Perform security health check
    performSecurityHealthCheck();
    
    // Mark load complete
    performanceMetrics.loadTime = performance.now() - performanceMetrics.startTime;
    console.log(`✅ Portfolio loaded in ${performanceMetrics.loadTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Error initializing portfolio:', error);
  }
});

// Header scroll behavior
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  
  let lastScrollY = window.scrollY;
  let ticking = false;
  
  function updateHeader() {
    const scrollY = window.scrollY;
    
    if (scrollY > 100) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    
    lastScrollY = scrollY;
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
}

// Contact form handling (placeholder for future implementation)
function initContactForm() {
  const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
  
  emailLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Track email click for analytics (if implemented)
      console.log('📧 Email contact initiated');
    });
  });
}

// Performance monitoring
function initPerformanceMonitoring() {
  // Monitor Core Web Vitals
  if ('web-vital' in window) {
    // This would be implemented with a web vitals library
    console.log('📊 Performance monitoring initialized');
  }
  
  // Monitor first interaction
  const interactionEvents = ['click', 'keydown', 'touchstart'];
  
  function recordFirstInteraction() {
    if (performanceMetrics.interactionTime === null) {
      performanceMetrics.interactionTime = performance.now() - performanceMetrics.startTime;
      console.log(`👆 First interaction at ${performanceMetrics.interactionTime.toFixed(2)}ms`);
    }
    
    // Remove listeners after first interaction
    interactionEvents.forEach(event => {
      document.removeEventListener(event, recordFirstInteraction);
    });
  }
  
  interactionEvents.forEach(event => {
    document.addEventListener(event, recordFirstInteraction, { once: true, passive: true });
  });
}

// Utility functions
const utils = {
  // Debounce function for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle function for scroll events
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};

// Export config and utils for other modules
export { siteConfig, utils, performanceMetrics };