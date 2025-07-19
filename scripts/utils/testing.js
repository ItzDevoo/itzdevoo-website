// Testing utilities for cross-browser compatibility and responsiveness
export function initTesting() {
  console.log('🧪 Initializing testing utilities...');
  
  // Initialize browser compatibility tests
  initBrowserCompatibilityTests();
  
  // Initialize responsive design tests
  initResponsiveTests();
  
  // Initialize performance tests
  initPerformanceTests();
  
  // Initialize accessibility tests
  initAccessibilityTests();
  
  // Initialize feature detection tests
  initFeatureDetectionTests();
}

// Browser compatibility testing
function initBrowserCompatibilityTests() {
  const browserTests = {
    // CSS Features
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssCustomProperties: CSS.supports('--test', 'value'),
    cssClamp: CSS.supports('width', 'clamp(1rem, 2vw, 3rem)'),
    cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
    
    // JavaScript Features
    es6Modules: typeof Symbol !== 'undefined',
    asyncAwait: (async () => {})().constructor === Promise,
    intersectionObserver: 'IntersectionObserver' in window,
    serviceWorker: 'serviceWorker' in navigator,
    webWorkers: typeof Worker !== 'undefined',
    
    // Web APIs
    fetch: 'fetch' in window,
    localStorage: typeof Storage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    
    // Media Features
    webp: checkWebPSupport(),
    avif: checkAVIFSupport(),
    lazyLoading: 'loading' in HTMLImageElement.prototype,
    
    // Touch and Input
    touchEvents: 'ontouchstart' in window,
    pointerEvents: 'onpointerdown' in window,
    
    // Security Features
    secureContext: window.isSecureContext,
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null
  };
  
  console.log('🌐 Browser Compatibility Results:', browserTests);
  
  // Apply fallbacks for unsupported features
  applyCompatibilityFallbacks(browserTests);
  
  // Store results for debugging
  window.browserCompatibility = browserTests;
  
  return browserTests;
}

// Apply fallbacks for unsupported features
function applyCompatibilityFallbacks(tests) {
  // CSS Grid fallback
  if (!tests.cssGrid) {
    console.warn('⚠️ CSS Grid not supported, applying flexbox fallback');
    const style = document.createElement('style');
    style.textContent = `
      .grid { display: flex; flex-wrap: wrap; }
      .grid > * { flex: 1; min-width: 300px; }
    `;
    document.head.appendChild(style);
  }
  
  // Intersection Observer fallback
  if (!tests.intersectionObserver) {
    console.warn('⚠️ Intersection Observer not supported, using scroll fallback');
    loadIntersectionObserverPolyfill();
  }
  
  // Backdrop filter fallback
  if (!tests.cssBackdropFilter) {
    console.warn('⚠️ Backdrop filter not supported, applying solid background fallback');
    const style = document.createElement('style');
    style.textContent = `
      .header { background-color: rgba(255, 255, 255, 0.95) !important; }
    `;
    document.head.appendChild(style);
  }
  
  // Custom properties fallback
  if (!tests.cssCustomProperties) {
    console.warn('⚠️ CSS Custom Properties not supported, applying static values');
    applyCSSVariableFallbacks();
  }
}

// Responsive design testing
function initResponsiveTests() {
  const breakpoints = {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    large: 1440
  };
  
  function testResponsiveBreakpoints() {
    const currentWidth = window.innerWidth;
    const results = {};
    
    Object.entries(breakpoints).forEach(([name, width]) => {
      results[name] = currentWidth >= width;
    });
    
    console.log('📱 Responsive Breakpoint Tests:', results);
    return results;
  }
  
  // Test on load and resize
  testResponsiveBreakpoints();
  window.addEventListener('resize', debounce(testResponsiveBreakpoints, 250));
  
  // Test responsive images
  testResponsiveImages();
  
  // Test touch targets
  testTouchTargets();
  
  // Test viewport meta tag
  testViewportConfiguration();
}

// Performance testing
function initPerformanceTests() {
  const performanceTests = {
    loadTime: null,
    domContentLoaded: null,
    firstPaint: null,
    firstContentfulPaint: null,
    largestContentfulPaint: null,
    cumulativeLayoutShift: null,
    firstInputDelay: null
  };
  
  // Navigation timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      performanceTests.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      performanceTests.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      
      // Paint timing
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          performanceTests.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          performanceTests.firstContentfulPaint = entry.startTime;
        }
      });
      
      console.log('⚡ Performance Test Results:', performanceTests);
      
      // Check against performance budgets
      checkPerformanceBudgets(performanceTests);
      
    }, 0);
  });
  
  // Core Web Vitals
  if ('PerformanceObserver' in window) {
    // LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      performanceTests.largestContentfulPaint = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // CLS
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      performanceTests.cumulativeLayoutShift = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });
    
    // FID
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        performanceTests.firstInputDelay = entry.processingStart - entry.startTime;
      });
    }).observe({ entryTypes: ['first-input'] });
  }
  
  window.performanceTests = performanceTests;
}

// Accessibility testing
function initAccessibilityTests() {
  const accessibilityTests = {
    altTextPresent: true,
    headingHierarchy: true,
    colorContrast: true,
    keyboardNavigation: true,
    ariaLabels: true,
    focusManagement: true
  };
  
  // Test alt text on images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      accessibilityTests.altTextPresent = false;
      console.warn('⚠️ Image missing alt text:', img.src);
    }
  });
  
  // Test heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > lastLevel + 1) {
      accessibilityTests.headingHierarchy = false;
      console.warn('⚠️ Heading hierarchy skip detected:', heading);
    }
    lastLevel = level;
  });
  
  // Test ARIA labels
  const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
  interactiveElements.forEach(element => {
    if (!element.hasAttribute('aria-label') && 
        !element.hasAttribute('aria-labelledby') && 
        !element.textContent.trim() &&
        !element.hasAttribute('title')) {
      accessibilityTests.ariaLabels = false;
      console.warn('⚠️ Interactive element missing accessible name:', element);
    }
  });
  
  console.log('♿ Accessibility Test Results:', accessibilityTests);
  window.accessibilityTests = accessibilityTests;
}

// Feature detection tests
function initFeatureDetectionTests() {
  const features = {
    // Modern JavaScript
    es6Classes: typeof class {} === 'function',
    es6ArrowFunctions: (() => true)() === true,
    es6TemplateLiterals: typeof `test` === 'string',
    es6Destructuring: (() => { try { const {a} = {a: 1}; return true; } catch(e) { return false; } })(),
    
    // Web APIs
    webGL: !!window.WebGLRenderingContext,
    webGL2: !!window.WebGL2RenderingContext,
    webAssembly: typeof WebAssembly === 'object',
    webRTC: !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia),
    
    // CSS Features
    cssVariables: window.CSS && CSS.supports('color', 'var(--test)'),
    cssGrid: window.CSS && CSS.supports('display', 'grid'),
    cssFlexbox: window.CSS && CSS.supports('display', 'flex'),
    cssTransforms: window.CSS && CSS.supports('transform', 'translateX(1px)'),
    cssAnimations: window.CSS && CSS.supports('animation', 'test 1s'),
    
    // Device Features
    deviceMotion: 'DeviceMotionEvent' in window,
    deviceOrientation: 'DeviceOrientationEvent' in window,
    battery: 'getBattery' in navigator,
    vibration: 'vibrate' in navigator,
    
    // Network
    onlineStatus: 'onLine' in navigator,
    connectionType: 'connection' in navigator,
    
    // Storage
    indexedDB: 'indexedDB' in window,
    webSQL: 'openDatabase' in window,
    
    // Security
    crypto: 'crypto' in window && 'subtle' in window.crypto
  };
  
  console.log('🔍 Feature Detection Results:', features);
  window.featureSupport = features;
  
  return features;
}

// Helper functions
function checkWebPSupport() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

function checkAVIFSupport() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  try {
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  } catch (e) {
    return false;
  }
}

function testResponsiveImages() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('loading') && !img.closest('.hero')) {
      console.warn('⚠️ Image could benefit from lazy loading:', img.src);
    }
  });
}

function testTouchTargets() {
  if ('ontouchstart' in window) {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // 44px minimum touch target size
      
      if (rect.width < minSize || rect.height < minSize) {
        console.warn('⚠️ Touch target too small:', element, `${rect.width}x${rect.height}`);
      }
    });
  }
}

function testViewportConfiguration() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    console.error('❌ Viewport meta tag missing');
    return false;
  }
  
  const content = viewport.getAttribute('content');
  if (!content.includes('width=device-width')) {
    console.warn('⚠️ Viewport should include width=device-width');
  }
  
  if (!content.includes('initial-scale=1')) {
    console.warn('⚠️ Viewport should include initial-scale=1');
  }
  
  return true;
}

function checkPerformanceBudgets(results) {
  const budgets = {
    loadTime: 3000, // 3 seconds
    firstContentfulPaint: 1500, // 1.5 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    cumulativeLayoutShift: 0.1, // 0.1
    firstInputDelay: 100 // 100ms
  };
  
  Object.entries(budgets).forEach(([metric, budget]) => {
    if (results[metric] && results[metric] > budget) {
      console.warn(`⚠️ Performance budget exceeded for ${metric}:`, results[metric], 'vs budget:', budget);
    }
  });
}

function loadIntersectionObserverPolyfill() {
  // Simple fallback for Intersection Observer
  window.IntersectionObserver = window.IntersectionObserver || class {
    constructor(callback) {
      this.callback = callback;
      this.elements = new Set();
    }
    
    observe(element) {
      this.elements.add(element);
      // Trigger immediately for fallback
      setTimeout(() => {
        this.callback([{
          target: element,
          isIntersecting: true
        }]);
      }, 100);
    }
    
    unobserve(element) {
      this.elements.delete(element);
    }
    
    disconnect() {
      this.elements.clear();
    }
  };
}

function applyCSSVariableFallbacks() {
  const style = document.createElement('style');
  style.textContent = `
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #333333;
      background-color: #ffffff;
    }
    .header { background-color: #ffffff; }
    .hero { background-color: #f8f9fa; }
    .about { background-color: #ffffff; }
    .footer { background-color: #000000; color: #ffffff; }
  `;
  document.head.appendChild(style);
}

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

// Export testing functions
export {
  initBrowserCompatibilityTests,
  initResponsiveTests,
  initPerformanceTests,
  initAccessibilityTests,
  initFeatureDetectionTests
};