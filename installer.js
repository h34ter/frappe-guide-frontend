// installer.js - FIXED VERSION
(function() {
  // Determine the correct frontend URL
  const isProduction = window.location.hostname !== 'localhost';
  const FRONTEND_URL = isProduction 
    ? 'https://frappe-guide-frontend.vercel.app' 
    : 'http://localhost:3000';

  // Create a style link with CORS headers
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FRONTEND_URL + '/styles.css';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);

  // Load embed script with CORS
  const script = document.createElement('script');
  script.src = FRONTEND_URL + '/embed.js';
  script.crossOrigin = 'anonymous';
  script.onerror = function() {
    console.error('Failed to load:', this.src);
  };
  document.body.appendChild(script);

  console.log('✓ Frappe Guide loading from:', FRONTEND_URL);
})();
