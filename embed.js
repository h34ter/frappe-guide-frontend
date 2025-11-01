// embed.js - CURSOR + AI FUSION (REAL REPLACEMENT)
(function() {
  'use strict';
  if (window.FRAPPE_GUIDE_LOADED) return;
  window.FRAPPE_GUIDE_LOADED = true;

  const API_URL = 'https://frappe-guide-backend.onrender.com';
  let currentGoal = '';
  let isGuiding = false;

  const style = document.createElement('style');
  style.textContent = `
    .guide-cursor {
      position: fixed !important; width: 60px !important; height: 60px !important;
      border: 4px solid #10B981 !important; border-radius: 50% !important;
      background: rgba(16, 185, 129, 0.25) !important; pointer-events: none !important;
      z-index: 999999 !important; display: flex !important; align-items: center !important;
      justify-content: center !important; font-size: 32px !important;
      box-shadow: 0 0 50px rgba(16, 185, 129, 0.9) !important;
    }
    .guide-label {
      position: fixed !important; background: #10B981 !important; color: white !important;
      padding: 8px 14px !important; border-radius: 8px !important; font-size: 12px !important;
      font-weight: 700 !important; z-index: 999998 !important; white-space: nowrap !important;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4) !important;
    }
    .guide-panel {
      position: fixed !important; bottom: 20px !important; right: 20px !important;
      width: 380px !important; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
      border: 2px solid #10B981 !important; border-radius: 16px !important; padding: 20px !important;
      z-index: 999997 !important; box-shadow: 0 25px 80px rgba(0,0,0,0.6) !important;
      font-family: -apple-system, sans-serif !important; color: #fff !important;
    }
    .guide-input {
      width: 100% !important; padding: 12px !important; background: #1e293b !important;
      border: 2px solid #334155 !important; border-radius: 10px !important; color: #fff !important;
      font-size: 14px !important; margin-bottom: 12px !important; box-sizing: border-box !important;
    }
    .guide-btn {
      width: 100% !important; padding: 12px !important; background: #10B981 !important;
      border: none !important; border-radius: 10px !important; color: white !important;
      font-weight: 700 !important; cursor: pointer !important; font-size: 14px !important;
    }
    .guide-btn:hover { background: #059669 !important; }
    .guide-status {
      margin-top: 12px !important; padding: 10px !important; background: rgba(16, 185, 129, 0.1) !important;
      border-radius: 8px !important; font-size: 12px !important; color: #6ee7b7 !important;
      text-align: center !important; line-height: 1.5 !important;
    }
  `;
  document.head.appendChild(style);

  const cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  cursor.innerHTML = '👆';
  document.body.appendChild(cursor);

  const label = document.createElement('div');
  label.className = 'guide-label';
  document.body.appendChild(label);

  const panel = document.createElement('div');
  panel.className = 'guide-panel';
  panel.innerHTML = `
    <h3 style="margin:0 0 15px 0; color:#10B981; font-size:16px;">🤖 AI Guide</h3>
    <input class="guide-input" id="guideGoal" placeholder="What do you want to do?">
    <button class="guide-btn" onclick="window.startGuide()">Let's Go</button>
    <div class="guide-status" id="guideStatus">Ready to guide you!</div>
  `;
  document.body.appendChild(panel);

  function findAllElements() {
    const buttons = [];
    document.querySelectorAll('button, a, input, select, [role="button"]').forEach(el => {
      if (el.offsetHeight > 0) {
        buttons.push({
          el,
          text: el.textContent.toLowerCase().trim(),
          placeholder: (el.getAttribute('placeholder') || '').toLowerCase(),
          type: el.tagName.toLowerCase()
        });
      }
    });
    return buttons;
  }

  async function guideTowards(goal) {
    const status = document.getElementById('guideStatus');
    status.textContent = '🔍 Analyzing page...';

    const elements = findAllElements();
    const elementList = elements.slice(0, 20).map(e => `${e.text || e.placeholder} (${e.type})`).join(', ');

    try {
      const response = await fetch(`${API_URL}/next-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          visibleElements: elementList,
          currentUrl: window.location.href
        })
      });

      const data = await response.json();
      const targetText = data.nextClick.toLowerCase();

      // Find matching element
      let target = null;
      for (let elem of elements) {
        if (elem.text.includes(targetText) || elem.placeholder.includes(targetText)) {
          target = elem.el;
          break;
        }
      }

      if (!target) {
        status.textContent = `❌ Can't find "${targetText}" - ${data.reason}`;
        return;
      }

      // Scroll into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Animate cursor
        cursor.style.left = (cx - 30) + 'px';
        cursor.style.top = (cy - 30) + 'px';
        cursor.style.display = 'flex';

        // Show label
        label.textContent = data.instruction;
        label.style.left = (cx + 50) + 'px';
        label.style.top = (cy - 20) + 'px';
        label.style.display = 'block';

        status.textContent = '✅ ' + data.instruction;

        // Wait for click
        const clickListener = (e) => {
          if (e.target === target || target.contains(e.target)) {
            document.removeEventListener('click', clickListener, true);
            target.click();
            cursor.style.display = 'none';
            label.style.display = 'none';
            status.textContent = '✅ Clicked! What next?';
            isGuiding = false;
          }
        };

        document.addEventListener('click', clickListener, true);

      }, 500);

    } catch (err) {
      status.textContent = '❌ Error: ' + err.message;
    }
  }

  window.startGuide = function() {
    currentGoal = document.getElementById('guideGoal').value;
    if (!currentGoal) return alert('Tell me what you want to do!');
    isGuiding = true;
    guideTowards(currentGoal);
  };

  console.log('✅ AI Visual Guide Ready!');
})();
