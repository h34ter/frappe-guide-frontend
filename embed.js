// embed.js - COMPLETE INTELLIGENT ASSISTANT
(function() {
  'use strict';
  if (window.FRAPPE_GUIDE_LOADED) return;
  window.FRAPPE_GUIDE_LOADED = true;

  const API_URL = 'https://frappe-guide-backend.onrender.com';
  let userProfile = null;
  let currentGoal = '';
  let isGuiding = false;
  let stepCount = 0;

  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; }
    .guide-cursor {
      position: fixed !important; width: 50px !important; height: 50px !important;
      border: 3px solid #3B82F6 !important; border-radius: 50% !important;
      background: rgba(59, 130, 246, 0.2) !important; pointer-events: none !important;
      z-index: 999999 !important; display: none !important; align-items: center !important;
      justify-content: center !important; font-size: 24px !important;
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), inset 0 0 20px rgba(59, 130, 246, 0.3) !important;
      animation: pulse 2s infinite !important;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), inset 0 0 20px rgba(59, 130, 246, 0.3); }
      50% { box-shadow: 0 0 50px rgba(59, 130, 246, 1), inset 0 0 30px rgba(59, 130, 246, 0.5); }
    }
    .guide-panel {
      position: fixed !important; bottom: 30px !important; right: 30px !important;
      width: 420px !important; max-height: 70vh !important; overflow-y: auto !important;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
      border: 2px solid #3B82F6 !important; border-radius: 16px !important; padding: 24px !important;
      z-index: 999998 !important; box-shadow: 0 25px 80px rgba(0,0,0,0.6) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      color: #F3F4F6 !important;
    }
    .guide-section {
      margin-bottom: 20px !important;
    }
    .guide-label {
      display: block !important; font-size: 11px !important; font-weight: 700 !important;
      color: #9CA3AF !important; text-transform: uppercase !important; margin-bottom: 8px !important;
      letter-spacing: 0.5px !important;
    }
    .guide-input, .guide-select {
      width: 100% !important; padding: 12px !important; background: #1e293b !important;
      border: 1.5px solid #334155 !important; border-radius: 10px !important; color: #F3F4F6 !important;
      font-size: 13px !important; margin-bottom: 10px !important;
    }
    .guide-input:focus, .guide-select:focus {
      border-color: #3B82F6 !important; outline: none !important; box-shadow: 0 0 10px rgba(59, 130, 246, 0.3) !important;
    }
    .guide-btn {
      width: 100% !important; padding: 12px !important; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
      border: none !important; border-radius: 10px !important; color: white !important;
      font-weight: 700 !important; cursor: pointer !important; font-size: 14px !important;
      transition: all 0.2s !important;
    }
    .guide-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4) !important; }
    .guide-step {
      margin-top: 16px !important; padding: 14px !important; background: rgba(59, 130, 246, 0.1) !important;
      border-left: 4px solid #3B82F6 !important; border-radius: 6px !important; font-size: 13px !important;
      line-height: 1.7 !important; color: #E5E7EB !important;
    }
    .guide-step strong { color: #60A5FA !important; }
    .guide-progress {
      font-size: 11px !important; color: #6B7280 !important; margin-top: 10px !important;
      text-align: center !important;
    }
    .guide-hidden { display: none !important; }
  `;
  document.head.appendChild(style);

  const cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  cursor.innerHTML = '●';
  document.body.appendChild(cursor);

  const panel = document.createElement('div');
  panel.className = 'guide-panel';
  panel.innerHTML = `
    <h2 style="margin:0 0 20px 0; color:#3B82F6; font-size:20px; font-weight:700;">🤖 Frappe AI Guide</h2>
    
    <div id="onboardingSection" class="guide-section">
      <div class="guide-section">
        <label class="guide-label">Your Name</label>
        <input class="guide-input" id="userName" placeholder="Enter your name">
      </div>
      <div class="guide-section">
        <label class="guide-label">Your Role</label>
        <select class="guide-select" id="userRole">
          <option value="">Select your role...</option>
          <option value="procurement_manager">Procurement Manager</option>
          <option value="warehouse_operator">Warehouse Operator</option>
          <option value="accountant">Accountant</option>
          <option value="retail_owner">Retail Store Owner</option>
          <option value="manufacturing_manager">Manufacturing Manager</option>
        </select>
      </div>
      <div class="guide-section">
        <label class="guide-label">Your Industry</label>
        <select class="guide-select" id="userIndustry">
          <option value="">Select industry...</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="construction">Construction</option>
          <option value="services">Services</option>
        </select>
      </div>
      <button class="guide-btn" onclick="window.completeOnboarding()">Start Guidance</button>
    </div>

    <div id="guidanceSection" class="guide-hidden">
      <div class="guide-section">
        <label class="guide-label" id="greetingLabel">Hi there! What would you like to do?</label>
        <input class="guide-input" id="guideGoal" placeholder="e.g., Create a purchase order">
        <button class="guide-btn" onclick="window.startGuidance()">Guide Me</button>
      </div>
      <div id="guideStep"></div>
      <div class="guide-progress" id="guideProgress"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // INTERCEPT CLICKS
  document.addEventListener('click', async (e) => {
    if (!isGuiding || e.target.closest('.guide-panel')) return;
    const clickedText = e.target.textContent?.slice(0, 50) || e.target.getAttribute('placeholder') || '';
    if (clickedText && clickedText.trim()) await continueGuidance(clickedText);
  }, true);

  window.completeOnboarding = function() {
    const name = document.getElementById('userName').value;
    const role = document.getElementById('userRole').value;
    const industry = document.getElementById('userIndustry').value;

    if (!name || !role || !industry) return alert('Please fill all fields!');

    userProfile = { name, role, industry };
    document.getElementById('onboardingSection').classList.add('guide-hidden');
    document.getElementById('guidanceSection').classList.remove('guide-hidden');
    document.getElementById('greetingLabel').textContent = `Hi ${name}! What would you like to do?`;
  };

  window.startGuidance = async function() {
    currentGoal = document.getElementById('guideGoal').value;
    if (!currentGoal) return alert('Tell me what you want to do!');

    isGuiding = true;
    stepCount = 0;
    cursor.style.display = 'flex';

    const stepDiv = document.getElementById('guideStep');
    stepDiv.innerHTML = `<div class="guide-step"><strong>🎯 Goal:</strong> ${currentGoal}<br><strong>👆 Hint:</strong> Click on elements and I'll guide you through each step!</div>`;

    await continueGuidance('start');
  };

  async function continueGuidance(whatUserClicked) {
    const stepDiv = document.getElementById('guideStep');
    stepDiv.innerHTML = `<div class="guide-step"><strong>⏳</strong> Analyzing...</div>`;

    try {
      const allElements = [];
      document.querySelectorAll('button, a, input, select, [role="button"]').forEach(el => {
        if (el.offsetHeight > 0) {
          allElements.push({
            text: el.textContent?.slice(0, 40) || el.getAttribute('placeholder') || '',
            type: el.tagName
          });
        }
      });

      const response = await fetch(`${API_URL}/personalized-guidance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          goal: currentGoal,
          userJustClicked: whatUserClicked,
          pageUrl: window.location.href,
          availableElements: allElements.slice(0, 40),
          stepNumber: stepCount++
        })
      });

      const data = await response.json();

      stepDiv.innerHTML = `<div class="guide-step"><strong>${data.roleEmoji}</strong> <strong>${data.personalizedInstruction}</strong><br><span style="font-size:12px; color:#9CA3AF; margin-top:8px; display:block;">${data.whyThisStep}</span></div>`;

      findAndHighlight(data.nextElement);
      document.getElementById('guideProgress').textContent = `Step ${stepCount} • ${data.roleContext}`;

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
          cursor.style.left = (rect.left + rect.width / 2 - 25) + 'px';
          cursor.style.top = (rect.top + rect.height / 2 - 25) + 'px';
          cursor.style.display = 'flex';
          el.style.outline = '3px solid #3B82F6';
          el.style.outlineOffset = '4px';
          setTimeout(() => { el.style.outline = ''; }, 5000);
        }, 300);
        return;
      }
    }
  }

  console.log('✅ Complete AI Guide System Ready!');
})();
