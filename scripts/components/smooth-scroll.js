// Smooth scrolling behavior
export function initSmoothScroll() {
  console.log('🎯 Initializing smooth scroll...');
  
  // Enhanced smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      
      if (target) {
        smoothScrollTo(target);
        
        // Update URL without triggering scroll
        if (targetId !== '#') {
          history.pushState(null, null, targetId);
        }
      }
    });
  });
  
  // Initialize scroll-to-top functionality
  initScrollToTop();
  
  // Initialize section highlighting
  initSectionHighlighting();
}

// Enhanced smooth scroll function with easing
function smoothScrollTo(target, duration = 800) {
  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const headerOffset = 80; // Account for sticky header
  
  let startTime = null;
  
  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutQuad(timeElapsed, startPosition, distance - headerOffset, duration);
    
    window.scrollTo(0, run);
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }
  
  requestAnimationFrame(animation);
}

// Easing function for smooth animation
function easeInOutQuad(t, b, c, d) {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
}

// Scroll to top functionality
function initScrollToTop() {
  // Create scroll to top button
  const scrollButton = document.createElement('button');
  scrollButton.innerHTML = '↑';
  scrollButton.className = 'scroll-to-top';
  scrollButton.setAttribute('aria-label', 'Scroll to top');
  scrollButton.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--secondary-color);
    color: var(--primary-color);
    border: none;
    font-size: 1.5rem;
    font-weight: bold;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1000;
    box-shadow: var(--shadow-lg);
  `;
  
  document.body.appendChild(scrollButton);
  
  // Show/hide button based on scroll position
  let ticking = false;
  
  function updateScrollButton() {
    const scrollY = window.pageYOffset;
    
    if (scrollY > 300) {
      scrollButton.style.opacity = '1';
      scrollButton.style.visibility = 'visible';
    } else {
      scrollButton.style.opacity = '0';
      scrollButton.style.visibility = 'hidden';
    }
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollButton);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
  
  // Scroll to top on click
  scrollButton.addEventListener('click', () => {
    smoothScrollTo(document.body, 600);
  });
  
  // Hover effects
  scrollButton.addEventListener('mouseenter', () => {
    scrollButton.style.transform = 'scale(1.1)';
    scrollButton.style.boxShadow = 'var(--shadow-xl)';
  });
  
  scrollButton.addEventListener('mouseleave', () => {
    scrollButton.style.transform = 'scale(1)';
    scrollButton.style.boxShadow = 'var(--shadow-lg)';
  });
}

// Section highlighting based on scroll position
function initSectionHighlighting() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('a[href^="#"]');
  
  if (sections.length === 0) return;
  
  let ticking = false;
  
  function updateActiveSection() {
    const scrollY = window.pageYOffset + 100; // Offset for header
    
    let currentSection = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });
    
    // Update navigation links
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateActiveSection);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
  
  // Initial check
  updateActiveSection();
}

// Scroll progress indicator
export function initScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, var(--secondary-color), var(--primary-color));
    z-index: 9999;
    transition: width 0.1s ease;
  `;
  
  document.body.appendChild(progressBar);
  
  let ticking = false;
  
  function updateProgress() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
}