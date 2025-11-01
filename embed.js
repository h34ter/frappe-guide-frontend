// embed.js - BACK TO WORKING VERSION
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
      position: fixed !important; 
      width: 60px !important; 
      height: 60px !important;
      border: 4px solid #10B981 !important; 
      border-radius: 50% !important;
      background: rgba(16, 185, 129, 0.25) !important; 
      pointer-events: none !important;
      z-index: 999999 !important; 
      display: none !important;
      align-items: center !important;
      justify-content: center !important; 
      font-size: 32px !important;
      box-shadow: 0 0 50px rgba(16, 185, 129, 0.9) !important;
      left: 0 !important;
      top: 0 !important;
    }
    .guide-panel {
      position: fixed !important; bottom: 30px !important; right: 30px !important;
      width: 420px !important; max-height: 70vh !important; overflow-y: auto !important;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
      border: 2px solid #10B981 !important; border-radius: 16px !important; padding: 24px !important;
      z-index: 999998 !important; box-shadow: 0 25px 80px rgba(0,0,0,0.6) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      color: #F3F4F6 !important;
    }
    .guide-section { margin-bottom: 20px !important; }
    .guide-label {
      display: block !important; font-size: 11px !important; font-weight: 700 !important;
      color: #9CA3AF !important; text-transform: uppercase !important; margin-bottom: 8px !important;
    }
    .guide-input, .guide-select {
      width: 100% !important; padding: 12px !important; background: #1e293b !important;
      border: 1.5px solid #334155 !important; border-radius: 10px !important; color: #F3F4F6 !important;
      font-size: 13px !important; margin-bottom: 10px !important;
    }
    .guide-btn {
      width: 100% !important; padding: 12px !important; background: #10B981 !important;
      border: none !important; border-radius: 10px !important; color: white !important;
      font-weight: 700 !important; cursor: pointer !important; font-size: 14px !important;
    }
    .guide-btn:hover { background: #059669 !important; }
    .guide-suggestion-btn {
      width: 100% !important; padding: 12px !important; margin-bottom: 8px !important;
      background: rgba(16, 185, 129, 0.2) !important; border: 1px solid #10B981 !important;
      border-radius: 8px !important; color: #6ee7b7 !important; font-weight: 600 !important;
      cursor: pointer !important; font-size: 13px !important;
    }
    .guide-suggestion-btn:hover { background: rgba(16, 185, 129, 0.3) !important; }
    .guide-step {
      margin-top: 16px !important; padding: 14px !important; background: rgba(16, 185, 129, 0.1) !important;
      border-left: 4px solid #10B981 !important; border-radius: 6px !important; font-size: 13px !important;
      line-height: 1.7 !important; color: #E5E7EB !important;
    }
    .guide-step strong { color: #6ee7b7 !important; }
    .guide-progress {
      font-size: 11px !important; color: #6B7280 !important; margin-top: 10px !important;
      text-align: center !important;
    }
    .guide-hidden { display: none !important; }
  `;
  document.head.appendChild(style);

  const cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  cursor.innerHTML = '👆';
  document.body.appendChild(cursor);

  const panel = document.createElement('div');
  panel.className = 'guide-panel';
  panel.innerHTML = `
    <h2 style="margin:0 0 20px 0; color:#10B981; font-size:20px; font-weight:700;">🤖 Frappe AI Coach</h2>
    
    <div id="onboardingSection">
      <p style="margin:0 0 15px 0; font-size:13px; color:#D1D5DB;">Hi! I'm your AI coach. Let me learn about you.</p>
      
      <div class="guide-section">
        <label class="guide-label">Your Name</label>
        <input class="guide-input" id="userName" placeholder="Enter your name">
      </div>

      <div class="guide-section">
        <label class="guide-label">What's Your Role?</label>
        <select class="guide-select" id="userRole">
          <option value="">Choose your role...</option>
          <option value="procurement_manager">📦 Procurement Manager</option>
          <option value="warehouse_operator">🏭 Warehouse Operator</option>
          <option value="accountant">💰 Accountant</option>
          <option value="retail_owner">🛍️ Retail Owner</option>
          <option value="manufacturing_manager">⚙️ Manufacturing Manager</option>
        </select>
      </div>

      <div class="guide-section">
        <label class="guide-label">Your Industry</label>
        <select class="guide-select" id="userIndustry">
          <option value="">Choose industry...</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="construction">Construction</option>
          <option value="services">Services</option>
        </select>
      </div>

      <button class="guide-btn" onclick="window.startOnboarding()">Let's Go</button>
    </div>

    <div id="suggestionsSection" class="guide-hidden">
      <p style="margin:0 0 15px 0; font-size:13px; color:#D1D5DB;" id="suggestionText"></p>
      <div id="suggestionsList"></div>
    </div>

    <div id="guidanceSection" class="guide-hidden">
      <div id="guideStep"></div>
      <div class="guide-progress" id="guideProgress"></div>
    </div>
  `;
  document.body.appendChild(panel);

  document.addEventListener('click', async (e) => {
    if (!isGuiding || e.target.closest('.guide-panel')) return;
    const clickedText = e.target.textContent?.slice(0, 50) || e.target.getAttribute('placeholder') || '';
    if (clickedText && clickedText.trim()) await continueGuidance(clickedText);
  }, true);

  window.startOnboarding = async function() {
    const name = document.getElementById('userName').value;
    const role = document.getElementById('userRole').value;
    const industry = document.getElementById('userIndustry').value;

    if (!name || !role || !industry) return alert('Fill all fields!');

    userProfile = { name, role, industry };

    try {
      const response = await fetch(`${API_URL}/onboarding-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, industry })
      });

      const data = await response.json();
      document.getElementById('onboardingSection').classList.add('guide-hidden');
      document.getElementById('suggestionsSection').classList.remove('guide-hidden');
      document.getElementById('suggestionText').textContent = data.greeting;
      document.getElementById('suggestionsList').innerHTML = data.suggestions
        .map(s => `<button class="guide-suggestion-btn" onclick="window.selectTask('${s}')">${s}</button>`)
        .join('');
    } catch (err) {
      alert('Error loading suggestions');
    }
  };

  window.selectTask = async function(task) {
    currentGoal = task;
    isGuiding = true;
    stepCount = 0;

    document.getElementById('suggestionsSection').classList.add('guide-hidden');
    document.getElementById('guidanceSection').classList.remove('guide-hidden');

    const stepDiv = document.getElementById('guideStep');
    stepDiv.innerHTML = `<div class="guide-step"><strong>🎯 ${task}</strong><br><br>Follow the cursor! Click when you see it.</div>`;

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

      stepDiv.innerHTML = `<div class="guide-step"><strong>${data.roleEmoji} ${data.personalizedInstruction}</strong></div>`;

      // FIND AND ANIMATE CURSOR TO ELEMENT
      const search = data.nextElement.toLowerCase();
      const allEls = document.querySelectorAll('button, a, input, select, [role="button"]');
      for (let el of allEls) {
        const text = (el.textContent || el.getAttribute('placeholder') || '').toLowerCase();
        if (text.includes(search) && el.offsetHeight > 0) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          setTimeout(() => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            cursor.style.left = (centerX - 30) + 'px';
            cursor.style.top = (centerY - 30) + 'px';
            cursor.style.display = 'flex';
            
            el.style.outline = '4px solid #10B981';
            el.style.outlineOffset = '5px';
            
            setTimeout(() => {
              el.style.outline = '';
            }, 5000);
          }, 300);
          
          break;
        }
      }

      document.getElementById('guideProgress').textContent = `${data.stepProgress} • ${data.roleContext}`;

    } catch (err) {
      stepDiv.innerHTML = `<div class="guide-step"><strong>⚠️</strong> ${err.message}</div>`;
    }
  }

  console.log('✅ AI Coach Ready!');
})();
