// Performance optimization utilities
export function initPerformanceOptimizations() {
  console.log('⚡ Initializing performance optimizations...');
  
  // Initialize lazy loading
  initLazyLoading();
  
  // Initialize resource hints
  initResourceHints();
  
  // Initialize critical resource loading
  initCriticalResourceLoading();
  
  // Initialize performance monitoring
  initPerformanceMonitoring();
  
  // Initialize service worker (if available)
  initServiceWorker();
}

// Lazy loading for images and other resources
function initLazyLoading() {
  // Native lazy loading support check
  if ('loading' in HTMLImageElement.prototype) {
    console.log('✅ Native lazy loading supported');
    
    // Add loading="lazy" to images that don't have it
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      if (!img.closest('.hero')) { // Don't lazy load hero images
        img.setAttribute('loading', 'lazy');
      }
    });
  } else {
    // Fallback intersection observer implementation
    console.log('🔄 Using Intersection Observer for lazy loading');
    implementIntersectionObserverLazyLoading();
  }
  
  // Lazy load background images
  initBackgroundImageLazyLoading();
}

// Intersection Observer fallback for lazy loading
function implementIntersectionObserverLazyLoading() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach(img => imageObserver.observe(img));
}

// Background image lazy loading
function initBackgroundImageLazyLoading() {
  const bgImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const bgImage = element.dataset.bgSrc;
        if (bgImage) {
          element.style.backgroundImage = `url(${bgImage})`;
          element.classList.add('bg-loaded');
          observer.unobserve(element);
        }
      }
    });
  });

  const bgElements = document.querySelectorAll('[data-bg-src]');
  bgElements.forEach(el => bgImageObserver.observe(el));
}

// Resource hints for better loading performance
function initResourceHints() {
  // Preload critical resources
  const criticalResources = [
    { href: '/styles/main.css', as: 'style' },
    { href: '/scripts/main.js', as: 'script' }
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    document.head.appendChild(link);
  });
  
  // DNS prefetch for external resources
  const externalDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'via.placeholder.com'
  ];
  
  externalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
}

// Critical resource loading optimization
function initCriticalResourceLoading() {
  // Load non-critical CSS asynchronously
  const nonCriticalCSS = [
    // Add paths to non-critical CSS files here
  ];
  
  nonCriticalCSS.forEach(cssPath => {
    loadCSSAsync(cssPath);
  });
  
  // Defer non-critical JavaScript
  const nonCriticalJS = [
    // Add paths to non-critical JS files here
  ];
  
  nonCriticalJS.forEach(jsPath => {
    loadJSAsync(jsPath);
  });
}

// Load CSS asynchronously
function loadCSSAsync(href) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = function() {
    this.onload = null;
    this.rel = 'stylesheet';
  };
  document.head.appendChild(link);
}

// Load JavaScript asynchronously
function loadJSAsync(src) {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

// Performance monitoring
function initPerformanceMonitoring() {
  // Core Web Vitals monitoring
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('📊 LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        console.log('📊 FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift (CLS)
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('📊 CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  // Navigation timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      console.log('📊 Page Load Time:', navigation.loadEventEnd - navigation.fetchStart);
      console.log('📊 DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      console.log('📊 First Paint:', performance.getEntriesByName('first-paint')[0]?.startTime);
      console.log('📊 First Contentful Paint:', performance.getEntriesByName('first-contentful-paint')[0]?.startTime);
    }, 0);
  });
}

// Service Worker for caching
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
}

// Image optimization utilities
export function optimizeImages() {
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    // Add proper sizing attributes
    if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
      img.addEventListener('load', function() {
        this.setAttribute('width', this.naturalWidth);
        this.setAttribute('height', this.naturalHeight);
      });
    }
    
    // Add proper alt text if missing
    if (!img.hasAttribute('alt')) {
      img.setAttribute('alt', '');
      console.warn('⚠️ Image missing alt text:', img.src);
    }
  });
}

// Font loading optimization
export function optimizeFonts() {
  // Use font-display: swap for better performance
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'System';
      src: local('system-ui'), local('-apple-system'), local('BlinkMacSystemFont');
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

// Critical CSS inlining
export function inlineCriticalCSS() {
  // This would typically be done at build time
  // For now, we'll ensure critical styles are loaded first
  const criticalStyles = `
    /* Critical above-the-fold styles */
    body { margin: 0; font-family: var(--font-family); }
    .header { position: sticky; top: 0; z-index: 1000; }
    .hero { min-height: 60vh; display: flex; align-items: center; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
  `;
  
  const style = document.createElement('style');
  style.textContent = criticalStyles;
  document.head.insertBefore(style, document.head.firstChild);
}

// Resource cleanup
export function cleanupResources() {
  // Remove unused event listeners
  // Clean up observers when not needed
  // This would be called when navigating away or on cleanup
}

// Performance budget monitoring
export function monitorPerformanceBudget() {
  const budget = {
    maxLoadTime: 3000, // 3 seconds
    maxLCP: 2500, // 2.5 seconds
    maxFID: 100, // 100ms
    maxCLS: 0.1 // 0.1
  };
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      if (loadTime > budget.maxLoadTime) {
        console.warn('⚠️ Performance budget exceeded - Load Time:', loadTime);
      }
    }, 0);
  });
}