// Responsive behavior helpers
export function initResponsive() {
  console.log('📱 Initializing responsive behaviors...');
  
  // Handle viewport changes with debouncing
  const handleViewportChange = debounce(() => {
    const viewport = window.innerWidth;
    const body = document.body;
    
    // Add viewport classes
    body.classList.remove('mobile', 'tablet', 'desktop', 'large');
    
    if (viewport < 640) {
      body.classList.add('mobile');
      handleMobileOptimizations();
    } else if (viewport < 1024) {
      body.classList.add('tablet');
      handleTabletOptimizations();
    } else if (viewport < 1440) {
      body.classList.add('desktop');
      handleDesktopOptimizations();
    } else {
      body.classList.add('large');
      handleLargeScreenOptimizations();
    }
    
    // Update CSS custom properties for dynamic sizing
    updateViewportProperties();
    
  }, 250);

  // Initialize and listen for changes
  handleViewportChange();
  window.addEventListener('resize', handleViewportChange);
  
  // Device-specific optimizations
  initDeviceOptimizations();
  
  // Orientation change handling
  initOrientationHandling();
  
  // Dynamic font sizing
  initDynamicFontSizing();
}

// Device-specific optimizations
function initDeviceOptimizations() {
  const body = document.body;
  
  // Touch device detection
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    body.classList.add('touch-device');
    initTouchOptimizations();
  } else {
    body.classList.add('no-touch');
  }
  
  // High DPI display detection
  if (window.devicePixelRatio > 1) {
    body.classList.add('high-dpi');
  }
  
  // Reduced motion detection
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    body.classList.add('reduced-motion');
  }
  
  // Dark mode preference detection
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    body.classList.add('prefers-dark');
  }
}

// Touch-specific optimizations
function initTouchOptimizations() {
  // Increase touch target sizes
  const style = document.createElement('style');
  style.textContent = `
    .touch-device .footer__social-link,
    .touch-device .hero__cta-button {
      min-height: 44px;
      min-width: 44px;
    }
    
    .touch-device .about__card {
      padding: var(--spacing-6);
    }
  `;
  document.head.appendChild(style);
  
  // Prevent zoom on input focus (iOS)
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }
}

// Orientation change handling
function initOrientationHandling() {
  function handleOrientationChange() {
    // Add small delay to ensure dimensions are updated
    setTimeout(() => {
      const isLandscape = window.innerWidth > window.innerHeight;
      document.body.classList.toggle('landscape', isLandscape);
      document.body.classList.toggle('portrait', !isLandscape);
      
      // Trigger viewport change handler
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }
  
  window.addEventListener('orientationchange', handleOrientationChange);
  
  // Initial orientation
  handleOrientationChange();
}

// Dynamic font sizing based on viewport
function initDynamicFontSizing() {
  function updateFontSizes() {
    const vw = window.innerWidth;
    const root = document.documentElement;
    
    // Calculate base font size (16px at 1200px viewport)
    const baseFontSize = Math.max(14, Math.min(18, (vw / 1200) * 16));
    root.style.setProperty('--font-size-base', `${baseFontSize}px`);
    
    // Scale other font sizes proportionally
    const scale = baseFontSize / 16;
    root.style.setProperty('--font-size-sm', `${14 * scale}px`);
    root.style.setProperty('--font-size-lg', `${18 * scale}px`);
    root.style.setProperty('--font-size-xl', `${20 * scale}px`);
    root.style.setProperty('--font-size-2xl', `${24 * scale}px`);
  }
  
  updateFontSizes();
  window.addEventListener('resize', debounce(updateFontSizes, 250));
}

// Update CSS custom properties for viewport-dependent values
function updateViewportProperties() {
  const root = document.documentElement;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  
  // Update viewport units
  root.style.setProperty('--vw', `${vw}px`);
  root.style.setProperty('--vh', `${vh}px`);
  
  // Dynamic spacing based on viewport
  const spacingScale = Math.max(0.8, Math.min(1.2, vw / 1200));
  root.style.setProperty('--spacing-scale', spacingScale);
}

// Viewport-specific optimizations
function handleMobileOptimizations() {
  // Mobile-specific optimizations
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.minHeight = '80vh';
  }
}

function handleTabletOptimizations() {
  // Tablet-specific optimizations
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.minHeight = '70vh';
  }
}

function handleDesktopOptimizations() {
  // Desktop-specific optimizations
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.minHeight = '80vh';
  }
}

function handleLargeScreenOptimizations() {
  // Large screen optimizations
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.minHeight = '90vh';
  }
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export utilities for use in other modules
export { debounce };