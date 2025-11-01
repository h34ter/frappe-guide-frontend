// embed.js - THE VERSION THAT WORKED
(function() {
  'use strict';
  if (window.FRAPPE_GUIDE_LOADED) return;
  window.FRAPPE_GUIDE_LOADED = true;

  const API_URL = 'https://frappe-guide-backend.onrender.com';

  const style = document.createElement('style');
  style.textContent = `
    .guide-cursor {
      position: fixed;
      width: 40px;
      height: 40px;
      border: 3px solid #3B82F6;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.15);
      pointer-events: none;
      z-index: 99999;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3B82F6;
      font-weight: bold;
    }
    .guide-panel {
      position: fixed; bottom: 30px; right: 30px; width: 420px;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border: 2px solid #3B82F6; border-radius: 16px; padding: 24px;
      z-index: 99998; box-shadow: 0 25px 80px rgba(0,0,0,0.6);
      font-family: -apple-system, sans-serif; color: #F3F4F6;
    }
    .guide-section { margin-bottom: 20px; }
    .guide-label {
      display: block; font-size: 11px; font-weight: 700; color: #9CA3AF;
      text-transform: uppercase; margin-bottom: 8px;
    }
    .guide-input, .guide-select {
      width: 100%; padding: 12px; background: #1e293b; border: 1.5px solid #334155;
      border-radius: 10px; color: #F3F4F6; font-size: 13px; margin-bottom: 10px;
    }
    .guide-btn {
      width: 100%; padding: 12px; background: #3B82F6; border: none;
      border-radius: 10px; color: white; font-weight: 700; cursor: pointer;
    }
    .guide-suggestion-btn {
      width: 100%; padding: 12px; margin-bottom: 8px;
      background: rgba(59, 130, 246, 0.2); border: 1px solid #3B82F6;
      border-radius: 8px; color: #60A5FA; font-weight: 600; cursor: pointer;
    }
    .guide-step {
      margin-top: 16px; padding: 14px; background: rgba(59, 130, 246, 0.1);
      border-left: 4px solid #3B82F6; border-radius: 6px; font-size: 13px;
      line-height: 1.7; color: #E5E7EB;
    }
    .guide-hidden { display: none; }
  `;
  document.head.appendChild(style);

  const cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  cursor.innerHTML = '●';
  cursor.style.display = 'none';
  document.body.appendChild(cursor);

  const panel = document.createElement('div');
  panel.className = 'guide-panel';
  panel.innerHTML = `
    <h2 style="margin:0 0 20px 0; color:#3B82F6; font-size:20px;">🤖 Frappe AI Coach</h2>
    <div id="onboardingSection">
      <p style="margin:0 0 15px 0; font-size:13px; color:#D1D5DB;">Hi! I'm your AI coach.</p>
      <div class="guide-section">
        <label class="guide-label">Your Name</label>
        <input class="guide-input" id="userName" placeholder="Enter name">
      </div>
      <div class="guide-section">
        <label class="guide-label">Role</label>
        <select class="guide-select" id="userRole">
          <option value="">Choose...</option>
          <option value="procurement_manager">📦 Procurement Manager</option>
          <option value="warehouse_operator">🏭 Warehouse Operator</option>
          <option value="accountant">💰 Accountant</option>
        </select>
      </div>
      <div class="guide-section">
        <label class="guide-label">Industry</label>
        <select class="guide-select" id="userIndustry">
          <option value="">Choose...</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="retail">Retail</option>
        </select>
      </div>
      <button class="guide-btn" onclick="window.startOnboarding()">Start</button>
    </div>
    <div id="suggestionsSection" class="guide-hidden">
      <p id="suggestionText" style="font-size:13px;"></p>
      <div id="suggestionsList"></div>
    </div>
    <div id="guidanceSection" class="guide-hidden">
      <div id="guideStep"></div>
    </div>
  `;
  document.body.appendChild(panel);

  window.startOnboarding = async function() {
    const name = document.getElementById('userName').value;
    const role = document.getElementById('userRole').value;
    const industry = document.getElementById('userIndustry').value;
    if (!name || !role || !industry) return alert('Fill all!');

    document.getElementById('onboardingSection').classList.add('guide-hidden');
    document.getElementById('suggestionsSection').classList.remove('guide-hidden');
    document.getElementById('suggestionText').textContent = 'Pick a task:';
    document.getElementById('suggestionsList').innerHTML = `
      <button class="guide-suggestion-btn" onclick="window.selectTask('Create Purchase Order')">Create Purchase Order</button>
    `;
  };

  window.selectTask = function(task) {
    document.getElementById('suggestionsSection').classList.add('guide-hidden');
    document.getElementById('guidanceSection').classList.remove('guide-hidden');
    
    // SHOW CURSOR
    cursor.style.display = 'flex';
    cursor.style.left = '300px';
    cursor.style.top = '300px';
    
    document.getElementById('guideStep').innerHTML = `<div class="guide-step">Follow the cursor!</div>`;
  };

  console.log('✅ Working cursor loaded!');
})();
