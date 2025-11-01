// installer.js
(function() {
  const FRONTEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://frappe-guide-frontend.vercel.app';

  // Load styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${FRONTEND_URL}/styles.css`;
  document.head.appendChild(link);

  // Load embed script
  const script = document.createElement('script');
  script.src = `${FRONTEND_URL}/embed.js`;
  document.body.appendChild(script);

  console.log('Frappe Guide loaded from', FRONTEND_URL);
})();
