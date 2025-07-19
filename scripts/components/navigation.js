// Navigation interactions
export function initNavigation() {
  console.log('🧭 Initializing navigation...');
  
  // Initialize header interactions
  initHeaderInteractions();
  
  // Initialize mobile menu (if present)
  initMobileMenu();
  
  // Initialize keyboard navigation
  initKeyboardNavigation();
  
  // Initialize focus management
  initFocusManagement();
}

// Header interactions and scroll behavior
function initHeaderInteractions() {
  const header = document.querySelector('.header');
  const headerTitle = document.querySelector('.header__title');
  
  if (!header || !headerTitle) return;
  
  // Header title click to scroll to top
  headerTitle.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // Add cursor pointer to indicate clickability
  headerTitle.style.cursor = 'pointer';
  
  // Header scroll effects
  let lastScrollY = window.scrollY;
  let ticking = false;
  
  function updateHeader() {
    const scrollY = window.scrollY;
    const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
    
    // Add scrolled class for styling
    if (scrollY > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    
    // Hide header on scroll down, show on scroll up (optional)
    if (scrollY > 200) {
      if (scrollDirection === 'down' && scrollY - lastScrollY > 5) {
        header.style.transform = 'translateY(-100%)';
      } else if (scrollDirection === 'up' && lastScrollY - scrollY > 5) {
        header.style.transform = 'translateY(0)';
      }
    } else {
      header.style.transform = 'translateY(0)';
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

// Mobile menu functionality
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  
  if (!menuToggle || !nav) return;
  
  // Toggle menu
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.contains('nav--open');
    
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
      closeMenu();
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
  
  function openMenu() {
    nav.classList.add('nav--open');
    menuToggle.classList.add('menu-toggle--active');
    menuToggle.setAttribute('aria-expanded', 'true');
    
    // Focus first menu item
    const firstMenuItem = nav.querySelector('a');
    if (firstMenuItem) {
      firstMenuItem.focus();
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  function closeMenu() {
    nav.classList.remove('nav--open');
    menuToggle.classList.remove('menu-toggle--active');
    menuToggle.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

// Keyboard navigation support
function initKeyboardNavigation() {
  // Handle tab navigation for better accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  // Remove keyboard navigation class on mouse use
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
  
  // Skip to main content functionality
  const skipLink = document.querySelector('a[href="#main"]');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const main = document.querySelector('#main');
      if (main) {
        main.focus();
        main.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// Focus management for better accessibility
function initFocusManagement() {
  // Trap focus in modals or overlays (if any)
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  // Improve focus visibility
  const style = document.createElement('style');
  style.textContent = `
    .keyboard-navigation *:focus {
      outline: 2px solid var(--secondary-color) !important;
      outline-offset: 2px !important;
    }
    
    .keyboard-navigation *:focus:not(:focus-visible) {
      outline: none !important;
    }
  `;
  document.head.appendChild(style);
  
  // Enhanced focus indicators for interactive elements
  const interactiveElements = document.querySelectorAll('a, button, input, textarea, select');
  
  interactiveElements.forEach(element => {
    element.addEventListener('focus', () => {
      element.classList.add('focused');
    });
    
    element.addEventListener('blur', () => {
      element.classList.remove('focused');
    });
  });
}

// Navigation state management
export const navigationState = {
  currentSection: '',
  isMenuOpen: false,
  scrollDirection: 'up',
  
  setCurrentSection(section) {
    this.currentSection = section;
    this.updateNavigation();
  },
  
  updateNavigation() {
    // Update active navigation links
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${this.currentSection}`) {
        link.classList.add('nav__link--active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('nav__link--active');
        link.removeAttribute('aria-current');
      }
    });
  }
};

// Smooth scroll enhancement for navigation links
export function enhanceNavigationLinks() {
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      
      if (target) {
        // Close mobile menu if open
        const nav = document.querySelector('.nav');
        if (nav && nav.classList.contains('nav--open')) {
          nav.classList.remove('nav--open');
          document.querySelector('.menu-toggle')?.classList.remove('menu-toggle--active');
          document.body.style.overflow = '';
        }
        
        // Smooth scroll to target
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL
        if (targetId !== '#') {
          history.pushState(null, null, targetId);
        }
        
        // Update navigation state
        navigationState.setCurrentSection(targetId.substring(1));
      }
    });
  });
}