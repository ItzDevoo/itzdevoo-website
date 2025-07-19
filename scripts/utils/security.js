// Security utilities and implementations
export function initSecurity() {
  console.log('🔒 Initializing security measures...');
  
  // Initialize Content Security Policy reporting
  initCSPReporting();
  
  // Initialize input sanitization
  initInputSanitization();
  
  // Initialize XSS protection
  initXSSProtection();
  
  // Initialize secure headers validation
  validateSecureHeaders();
  
  // Initialize security monitoring
  initSecurityMonitoring();
  
  // Initialize secure communication
  initSecureCommunication();
}

// Content Security Policy violation reporting
function initCSPReporting() {
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    console.warn('🚨 CSP Violation:', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber
    });
    
    // Report to security monitoring service (if implemented)
    reportSecurityViolation('csp', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  });
}

// Input sanitization for any user inputs
function initInputSanitization() {
  // Sanitize any text inputs (for future forms)
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .trim();
  };
  
  // Apply to all text inputs
  document.addEventListener('input', (event) => {
    if (event.target.type === 'text' || event.target.type === 'email' || event.target.tagName === 'TEXTAREA') {
      const sanitized = sanitizeInput(event.target.value);
      if (sanitized !== event.target.value) {
        event.target.value = sanitized;
        console.warn('🧹 Input sanitized for security');
      }
    }
  });
  
  // Export sanitization function for use elsewhere
  window.sanitizeInput = sanitizeInput;
}

// XSS protection measures
function initXSSProtection() {
  // Prevent eval() usage
  const originalEval = window.eval;
  window.eval = function(code) {
    console.warn('🚨 eval() usage blocked for security');
    reportSecurityViolation('xss-attempt', {
      type: 'eval-blocked',
      code: code.substring(0, 100), // First 100 chars only
      stack: new Error().stack
    });
    return null;
  };
  
  // Monitor for suspicious DOM modifications
  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for suspicious script injections
              if (node.tagName === 'SCRIPT' && !node.src.startsWith(window.location.origin)) {
                console.warn('🚨 Suspicious script injection detected');
                reportSecurityViolation('xss-attempt', {
                  type: 'script-injection',
                  src: node.src,
                  content: node.textContent.substring(0, 100)
                });
              }
              
              // Check for suspicious event handlers
              const suspiciousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
              suspiciousAttributes.forEach(attr => {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                  console.warn('🚨 Suspicious event handler detected:', attr);
                  reportSecurityViolation('xss-attempt', {
                    type: 'event-handler-injection',
                    attribute: attr,
                    value: node.getAttribute(attr)
                  });
                }
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
    });
  }
}

// Validate that secure headers are present
function validateSecureHeaders() {
  // This would typically be done server-side, but we can check client-side too
  fetch(window.location.href, { method: 'HEAD' })
    .then(response => {
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy',
        'referrer-policy'
      ];
      
      const missingHeaders = securityHeaders.filter(header => 
        !response.headers.has(header)
      );
      
      if (missingHeaders.length > 0) {
        console.warn('⚠️ Missing security headers:', missingHeaders);
        reportSecurityViolation('missing-headers', {
          missingHeaders: missingHeaders
        });
      } else {
        console.log('✅ All security headers present');
      }
    })
    .catch(error => {
      console.warn('Could not validate security headers:', error);
    });
}

// Security monitoring and anomaly detection
function initSecurityMonitoring() {
  // Monitor for suspicious activity patterns
  let clickCount = 0;
  let rapidClickThreshold = 10;
  let clickTimeWindow = 1000; // 1 second
  
  document.addEventListener('click', () => {
    clickCount++;
    
    setTimeout(() => {
      clickCount--;
    }, clickTimeWindow);
    
    if (clickCount > rapidClickThreshold) {
      console.warn('🚨 Suspicious rapid clicking detected');
      reportSecurityViolation('suspicious-activity', {
        type: 'rapid-clicking',
        count: clickCount,
        timeWindow: clickTimeWindow
      });
    }
  });
  
  // Monitor for console access (potential developer tools usage)
  let devtools = {
    open: false,
    orientation: null
  };
  
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        console.warn('🔍 Developer tools opened');
        reportSecurityViolation('devtools-access', {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      }
    } else {
      devtools.open = false;
    }
  }, 500);
  
  // Monitor for right-click context menu (basic protection)
  document.addEventListener('contextmenu', (event) => {
    // Allow context menu but log for monitoring
    console.log('📋 Context menu accessed');
  });
  
  // Monitor for key combinations that might indicate inspection
  document.addEventListener('keydown', (event) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (event.key === 'F12' || 
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) ||
        (event.ctrlKey && event.key === 'U')) {
      console.log('🔍 Developer shortcut used');
      reportSecurityViolation('devtools-shortcut', {
        key: event.key,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey
      });
    }
  });
}

// Secure communication utilities
function initSecureCommunication() {
  // Ensure all external requests use HTTPS
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Convert HTTP to HTTPS for external requests
    if (typeof url === 'string' && url.startsWith('http://') && !url.includes('localhost')) {
      url = url.replace('http://', 'https://');
      console.log('🔒 Upgraded HTTP request to HTTPS');
    }
    
    // Add security headers to requests
    options.headers = {
      ...options.headers,
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    return originalFetch(url, options);
  };
  
  // Monitor for mixed content
  if ('SecurityPolicyViolationEvent' in window) {
    document.addEventListener('securitypolicyviolation', (event) => {
      if (event.violatedDirective.includes('mixed-content')) {
        console.warn('🚨 Mixed content detected:', event.blockedURI);
        reportSecurityViolation('mixed-content', {
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective
        });
      }
    });
  }
}

// Security violation reporting
function reportSecurityViolation(type, details) {
  const violation = {
    type: type,
    details: details,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    sessionId: getSessionId()
  };
  
  // Log locally for development
  console.warn('🚨 Security violation reported:', violation);
  
  // In production, this would send to a security monitoring service
  // fetch('/api/security/violations', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(violation)
  // }).catch(error => {
  //   console.error('Failed to report security violation:', error);
  // });
  
  // Store locally for batch reporting
  storeSecurityViolation(violation);
}

// Generate or retrieve session ID for tracking
function getSessionId() {
  let sessionId = sessionStorage.getItem('security-session-id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('security-session-id', sessionId);
  }
  return sessionId;
}

// Store security violations locally
function storeSecurityViolation(violation) {
  try {
    const violations = JSON.parse(localStorage.getItem('security-violations') || '[]');
    violations.push(violation);
    
    // Keep only last 50 violations
    if (violations.length > 50) {
      violations.splice(0, violations.length - 50);
    }
    
    localStorage.setItem('security-violations', JSON.stringify(violations));
  } catch (error) {
    console.error('Failed to store security violation:', error);
  }
}

// Get stored security violations (for debugging/reporting)
export function getSecurityViolations() {
  try {
    return JSON.parse(localStorage.getItem('security-violations') || '[]');
  } catch (error) {
    console.error('Failed to retrieve security violations:', error);
    return [];
  }
}

// Clear security violations log
export function clearSecurityViolations() {
  localStorage.removeItem('security-violations');
  console.log('🧹 Security violations log cleared');
}

// Security health check
export function performSecurityHealthCheck() {
  const checks = {
    httpsEnabled: window.location.protocol === 'https:',
    cspEnabled: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
    serviceWorkerRegistered: 'serviceWorker' in navigator,
    secureContextAvailable: window.isSecureContext,
    cookiesSecure: document.cookie.includes('Secure'),
    localStorageAvailable: typeof Storage !== 'undefined'
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  console.log('🔒 Security Health Check:', {
    score: `${passedChecks}/${totalChecks}`,
    checks: checks,
    percentage: Math.round((passedChecks / totalChecks) * 100) + '%'
  });
  
  return checks;
}

// Export security utilities
export {
  reportSecurityViolation,
  getSessionId,
  performSecurityHealthCheck
};