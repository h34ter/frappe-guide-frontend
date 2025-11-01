// embed.js - AUTO-DETECTS CLICKS + CONTINUOUS GUIDANCE
(function() {
  'use strict';
  if (window.FRAPPE_GUIDE_LOADED) return;
  window.FRAPPE_GUIDE_LOADED = true;

  const API_URL = 'https://frappe-guide-backend.onrender.com';
  let currentGoal = '';
  let isGuiding = false;
  let lastClickedElement = null;

  const style = document.createElement('style');
  style.textContent = `
    .guide-cursor {
      position: fixed !important; width: 40px !important; height: 40px !important;
      border: 3px solid #3B82F6 !important; border-radius: 50% !important;
      background: rgba(59, 130, 246, 0.15) !important; pointer-events: none !important;
      z-index: 999999 !important; display: none !important; align-items: center !important;
      justify-content: center !important; font-size: 20px !important;
      box-shadow: 0 0 25px rgba(59, 130, 246, 0.7) !important;
    }
    .guide-panel {
      position: fixed !important; bottom: 30px !important; right: 30px !important;
      width: 360px !important; background: linear-gradient(135deg, #111827 0%, #1F2937 100%) !important;
      border: 2px solid #3B82F6 !important; border-radius: 14px !important; padding: 20px !important;
      z-index: 999998 !important; box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
      font-family: -apple-system, sans-serif !important; color: #F3F4F6 !important;
    }
    .guide-input {
      width: 100% !important; padding: 12px !important; background: #374151 !important;
      border: 1px solid #4B5563 !important; border-radius: 8px !important; color: #F3F4F6 !important;
      font-size: 13px !important; margin-bottom: 10px !important; box-sizing: border-box !important;
    }
    .guide-btn {
      width: 100% !important; padding: 12px !important; background: #3B82F6 !important;
      border: none !important; border-radius: 8px !important; color: white !important;
      font-weight: 600 !important; cursor: pointer !important; font-size: 13px !important;
    }
    .guide-btn:hover { background: #2563EB !important; }
    .guide-step {
      margin-top: 15px !important; padding: 12px !important; background: rgba(59, 130, 246, 0.1) !important;
      border-left: 3px solid #3B82F6 !important; border-radius: 4px !important; font-size: 13px !important;
      line-height: 1.6 !important; color: #E5E7EB !important;
    }
    .guide-step strong { color: #60A5FA !important; }
  `;
  document.head.appendChild(style);

  const cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  cursor.innerHTML = '●';
  document.body.appendChild(cursor);

  const panel = document.createElement('div');
  panel.className = 'guide-panel';
  panel.innerHTML = `
    <h3 style="margin:0 0 15px 0; font-size:16px; color:#3B82F6; font-weight:700;">🤖 AI Guide</h3>
    <input class="guide-input" id="guideGoal" placeholder="What do you want to do?">
    <button class="guide-btn" onclick="window.startGuide()">Start Guidance</button>
    <div id="guideStep"></div>
  `;
  document.body.appendChild(panel);

  // INTERCEPT ALL CLICKS
  document.addEventListener('click', async (e) => {
    if (!isGuiding || e.target.closest('.guide-panel')) return;

    lastClickedElement = e.target;
    const clickedText = e.target.textContent?.slice(0, 50) || e.target.getAttribute('placeholder') || '';

    if (clickedText) {
      await continueGuidance(clickedText);
    }
  }, true);

  async function continueGuidance(whatUserClicked) {
    const stepDiv = document.getElementById('guideStep');
    stepDiv.innerHTML = `<div class="guide-step"><strong>✓ You clicked:</strong> ${whatUserClicked}<br><strong>⏳</strong> AI is thinking...</div>`;

    try {
      const allElements = [];
      document.querySelectorAll('button, a, input, select').forEach(el => {
        if (el.offsetHeight > 0) {
          allElements.push(el.textContent?.slice(0, 40) || el.getAttribute('placeholder') || '');
        }
      });

      const response = await fetch(`${API_URL}/next-step-auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: currentGoal,
          userJustClicked: whatUserClicked,
          pageUrl: window.location.href,
          availableElements: allElements.slice(0, 30)
        })
      });

      const data = await response.json();

      stepDiv.innerHTML = `<div class="guide-step"><strong>${data.emoji} Next:</strong> ${data.instruction}</div>`;

      // Find and highlight the next element
      findAndHighlight(data.nextElement);

    } catch (err) {
      stepDiv.innerHTML = `<div class="guide-step"><strong>⚠️</strong> ${err.message}</div>`;
    }
  }

  function findAndHighlight(elementText) {
    if (!elementText) return;

    const search = elementText.toLowerCase();
    const allEls = document.querySelectorAll('button, a, input, select, [role="button"]');

    for (let el of allEls) {
      const text = (el.textContent || el.getAttribute('placeholder') || '').toLowerCase();
      if (text.includes(search) && el.offsetHeight > 0) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          cursor.style.left = (rect.left + rect.width / 2 - 20) + 'px';
          cursor.style.top = (rect.top + rect.height / 2 - 20) + 'px';
          cursor.style.display = 'flex';

          el.style.outline = '3px solid #3B82F6';
          el.style.outlineOffset = '3px';

          setTimeout(() => {
            el.style.outline = '';
          }, 4000);
        }, 300);

        return;
      }
    }
  }

  window.startGuide = function() {
    currentGoal = document.getElementById('guideGoal').value;
    if (!currentGoal) return alert('Tell me your goal!');

    isGuiding = true;
    cursor.style.display = 'flex';

    document.getElementById('guideStep').innerHTML = `
      <div class="guide-step">
        <strong>🎯 Goal:</strong> ${currentGoal}
        <br><strong>👆</strong> Now just click things and I'll guide you!
      </div>
    `;
  };

  console.log('✅ AI Auto-Guide Ready - Click naturally, I\'ll guide you!');
})();
