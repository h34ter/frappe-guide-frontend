(function() {
  'use strict';
  if (window.FRAPPE_GUIDE_LOADED) return;
  window.FRAPPE_GUIDE_LOADED = true;

  const API_URL = 'https://frappe-guide-backend.onrender.com';
  let userRole = '', cursor, scanInterval;

  const style = document.createElement('style');
  style.textContent = `
    .guide-cursor { position: fixed; width: 60px; height: 60px; border: 4px solid #3B82F6; border-radius: 50%; background: rgba(59, 130, 246, 0.2); box-shadow: 0 0 40px rgba(59, 130, 246, 0.9); pointer-events: none; z-index: 999999; display: flex; align-items: center; justify-content: center; font-size: 28px; transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .guide-panel { position: fixed; bottom: 30px; right: 30px; width: 450px; background: linear-gradient(135deg, #0f172a, #1e293b); border: 2px solid #3B82F6; border-radius: 16px; padding: 24px; z-index: 999998; box-shadow: 0 25px 80px rgba(0,0,0,0.6); font-family: -apple-system, sans-serif; color: #F3F4F6; }
    .guide-label { font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 10px; }
    .guide-input, .guide-select { width: 100%; padding: 12px; background: #1e293b; border: 1.5px solid #334155; border-radius: 10px; color: #F3F4F6; font-size: 13px; margin-bottom: 10px; }
    .guide-btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #3B82F6, #2563EB); border: none; border-radius: 10px; color: white; font-weight: 700; cursor: pointer; }
    .guide-step { margin-top: 16px; padding: 14px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; border-radius: 6px; font-size: 13px; line-height: 1.8; color: #E5E7EB; }
    .guide-step strong { color: #60A5FA; }
    .guide-hidden { display: none; }
  `;
  document.head.appendChild(style);

  cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  cursor.innerHTML = '●';
  cursor.style.display = 'none';
  document.body.appendChild(cursor);

  const panel = document.createElement('div');
  panel.className = 'guide-panel';
  panel.innerHTML = `
    <h2 style="margin:0 0 20px 0; color:#3B82F6; font-size:20px; font-weight:700;">🤖 Frappe AI Coach</h2>
    <div id="onboardingSection">
      <label class="guide-label">What's your job?</label>
      <input class="guide-input" id="userJob" placeholder="e.g., Procurement Manager, Accountant, Warehouse Operator" type="text">
      <label class="guide-label">Industry</label>
      <select class="guide-select" id="userIndustry">
        <option value="">Choose...</option>
        <option value="manufacturing">Manufacturing</option>
        <option value="retail">Retail</option>
      </select>
      <button class="guide-btn" onclick="window.startCoaching()">Start Guided Tour</button>
    </div>
    <div id="coachingSection" class="guide-hidden">
      <div id="guideStep"></div>
    </div>
  `;
  document.body.appendChild(panel);

  window.startCoaching = async function() {
    userRole = document.getElementById('userJob').value;
    if (!userRole) return alert('Enter your role!');

    document.getElementById('onboardingSection').classList.add('guide-hidden');
    document.getElementById('coachingSection').classList.remove('guide-hidden');
    cursor.style.display = 'flex';

    // START 2-SECOND SCAN
    scanInterval = setInterval(autoScan, 2000);
    autoScan(); // IMMEDIATE FIRST SCAN
  };

  async function autoScan() {
    const elements = Array.from(document.querySelectorAll('button, a, input, select, [role="button"]'))
      .filter(e => e.offsetHeight > 0)
      .map(e => ({
        text: (e.textContent || e.getAttribute('placeholder') || '').slice(0, 50),
        tag: e.tagName,
        element: e
      }));

    try {
      const response = await fetch(`${API_URL}/auto-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole,
          pageUrl: window.location.href,
          availableElements: elements.slice(0, 30)
        })
      });

      const data = await response.json();

      document.getElementById('guideStep').innerHTML = `<div class="guide-step"><strong>${data.roleEmoji} ${data.instruction}</strong></div>`;

      if (data.nextElement) {
        findAndHighlight(data.nextElement, elements);
      }
    } catch (err) {
      console.log('Scan:', err.message);
    }
  }

  function findAndHighlight(targetText, elements) {
    const search = targetText.toLowerCase();
    const match = elements.find(e => e.text.toLowerCase().includes(search));

    if (match) {
      const rect = match.element.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2 - 30;
      const targetY = rect.top + rect.height / 2 - 30;

      animateCursor(targetX, targetY);

      match.element.style.outline = '4px solid #3B82F6';
      match.element.style.outlineOffset = '4px';
      setTimeout(() => { match.element.style.outline = ''; }, 8000);

      match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function animateCursor(x, y) {
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
  }

  console.log('✅ Hybrid AI Coach Ready!');
})();
