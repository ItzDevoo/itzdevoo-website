// Navigation interactions (placeholder for future use)
export function initNavigation() {
  // Mobile menu toggle functionality
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('nav--open');
      menuToggle.classList.toggle('menu-toggle--active');
    });
  }
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
      nav.classList.remove('nav--open');
      menuToggle.classList.remove('menu-toggle--active');
    }
  });
}