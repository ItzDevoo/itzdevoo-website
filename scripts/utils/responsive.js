// Responsive behavior helpers
export function initResponsive() {
  // Handle viewport changes
  function handleViewportChange() {
    const viewport = window.innerWidth;
    const body = document.body;
    
    // Add viewport classes
    body.classList.remove('mobile', 'tablet', 'desktop', 'large');
    
    if (viewport < 768) {
      body.classList.add('mobile');
    } else if (viewport < 1024) {
      body.classList.add('tablet');
    } else if (viewport < 1440) {
      body.classList.add('desktop');
    } else {
      body.classList.add('large');
    }
  }

  // Initialize and listen for changes
  handleViewportChange();
  window.addEventListener('resize', handleViewportChange);
  
  // Touch-friendly interactions for mobile
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
  }
}