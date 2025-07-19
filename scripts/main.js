// Main JavaScript entry point
import { initAnimations } from './utils/animations.js';
import { initResponsive } from './utils/responsive.js';
import { initSmoothScroll } from './components/smooth-scroll.js';

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
    darkMode: false
  }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio site initialized');
  
  // Initialize features based on config
  if (siteConfig.features.animations) {
    initAnimations();
  }
  
  if (siteConfig.features.smoothScrolling) {
    initSmoothScroll();
  }
  
  initResponsive();
});

// Export config for other modules
export { siteConfig };