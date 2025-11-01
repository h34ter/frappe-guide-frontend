// embed.js - AI VISION GUIDED MODE
(function() {
  'use strict';
  if (window.FRAPPE_GUIDE_LOADED) return;
  window.FRAPPE_GUIDE_LOADED = true;

  const API_URL = 'https://frappe-guide-backend.onrender.com';
  let currentGoal = '';
  let conversationHistory = [];

  const style = document.createElement('style');
  style.textContent = `
    .guide-cursor {
      position: fixed !important; width: 50px !important; height: 50px !important;
      border: 4px solid #10B981 !important; border-radius: 50% !important;
      background: rgba(16, 185, 129, 0.2) !important; pointer-events: none !important;
      z-index: 999999 !important; display: flex !important; align-items: center !important;
      justify-content: center !important; font-size: 28px !important;
      box-shadow: 0 0 40px rgba(16, 185, 129, 0.8) !important; display: none !important;
    }
    .guide-panel {
      position: fixed !important; bottom: 20px !important; right: 20px !important;
      width: 420px !important; max-height: 600px !important; overflow-y: auto !important;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
      border: 2px solid #10B981 !important; border-radius: 16px !important; padding: 24px !important;
      z-index: 999998 !important; box-shadow: 0 25px 80px rgba(0,0,0,0.6) !important;
      font-family: -apple-system, sans-serif !important; color: #fff !important;
    }
    .guide-header {
      display: flex !important; align-items: center !important; gap: 12px !important;
      margin-bottom: 20px !important; font-size: 18px !important; font-weight: 700 !important;
      color: #10B981 !important;
    }
    .guide-input {
      width: 100% !important; padding: 14px !important; background: #1e293b !important;
      border: 2px solid #334155 !important; border-radius: 10px !important; color: #fff !important;
      font-size: 14px !important; margin-bottom: 12px !important; box-sizing: border-box !important;
    }
    .guide-input:focus {
      border-color: #10B981 !important; outline: none !important;
    }
    .guide-btn {
      width: 100% !important; padding: 14px !important; background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
      border: none !important; border-radius: 10px !important; color: white !important;
      font-weight: 700 !important; cursor: pointer !important; font-size: 14px !important;
      transition: all 0.2s !important;
    }
    .guide-btn:hover { transform: scale(1.02) !important; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4) !important; }
    .guide-message {
      margin: 12px 0 !important; padding: 14px !important; background: #1e293b !important;
      border-radius: 10px !important; font-size: 13px !important; line-height: 1.6 !important;
      border-left: 4px solid #10B981 !important; animation: slideIn 0.3s ease !important;
    }
    .guide-message strong { color: #10B981 !important; }
    .guide-status {
      margin-top: 12px !important; padding: 10px !important; background: rgba(16, 185, 129, 0.1) !important;
      border-radius: 8px !important; font-size: 11px !important; color: #6ee7b7 !important;
      text-align: center !important;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  const cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  cursor.innerHTML = '👆';
  document.body.appendChild(cursor);

  const panel = document.createElement('div');
  panel.className = 'guide-panel';
  panel.innerHTML = `
    <div class="guide-header">
      <span>🤖</span>
      <span>AI Guide</span>
    </div>
    <input class="guide-input" id="guideGoal" placeholder="What do you want to accomplish? (e.g., Create a Purchase Order)">
    <button class="guide-btn" onclick="window.startAIGuide()">Start AI Guidance</button>
    <div id="guideMessages"></div>
    <div class="guide-status" id="guideStatus">Ready to guide you!</div>
  `;
  document.body.appendChild(panel);

  function capturePageContext() {
    return {
      url: window.location.href,
      title: document.title,
      visibleButtons: Array.from(document.querySelectorAll('button, a')).filter(el => el.offsetHeight > 0).slice(0, 30).map(el => el.textContent.trim().slice(0, 50)),
      visibleInputs: Array.from(document.querySelectorAll('input, select')).filter(el => el.offsetHeight > 0).slice(0, 20).map(el => ({
        type: el.type || 'select',
        name: el.getAttribute('data-fieldname') || el.name || el.placeholder
      }))
    };
  }

  function addMessage(text, isAI = true) {
    const messages = document.getElementById('guideMessages');
    const msg = document.createElement('div');
    msg.className = 'guide-message';
    msg.innerHTML = isAI ? `<strong>🤖 AI:</strong> ${text}` : `<strong>👤 You:</strong> ${text}`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function findAndHighlight(elementDescription) {
    const allElements = document.querySelectorAll('button, a, input, select, [role="button"]');
    
    for (let el of allElements) {
      const text = el.textContent.toLowerCase();
      const desc = elementDescription.toLowerCase();
      
      if (text.includes(desc) && el.offsetHeight > 0) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          cursor.style.left = (rect.left + rect.width / 2 - 25) + 'px';
          cursor.style.top = (rect.top + rect.height / 2 - 25) + 'px';
          cursor.style.display = 'flex';
          
          el.style.outline = '4px solid #10B981';
          el.style.outlineOffset = '4px';
          el.style.transition = 'all 0.3s';
          
          setTimeout(() => {
            el.style.outline = '';
          }, 5000);
        }, 500);
        
        return true;
      }
    }
    return false;
  }

  async function getAIGuidance(goal, currentContext, step) {
    const status = document.getElementById('guideStatus');
    status.textContent = '🧠 AI is analyzing the page...';

    try {
      const response = await fetch(`${API_URL}/ai-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          context: currentContext,
          step,
          history: conversationHistory
        })
      });

      const data = await response.json();
      status.textContent = '✅ AI ready';
      return data;
    } catch (err) {
      status.textContent = '❌ AI error';
      return {
        instruction: "I see you want to: " + goal + ". Let me find the right button...",
        nextElement: extractKeyword(goal)
      };
    }
  }

  function extractKeyword(text) {
    const keywords = ['purchase order', 'sales order', 'invoice', 'buying', 'selling', 'stock', 'new', 'save', 'submit'];
    const lower = text.toLowerCase();
    for (let keyword of keywords) {
      if (lower.includes(keyword)) return keyword;
    }
    return text.split(' ')[0];
  }

  window.startAIGuide = async function() {
    currentGoal = document.getElementById('guideGoal').value;
    if (!currentGoal) return;

    conversationHistory = [];
    document.getElementById('guideMessages').innerHTML = '';
    
    addMessage(currentGoal, false);
    addMessage('I can help with that! Let me analyze what\'s on your screen...');

    await guideNextStep(0);
  };

  async function guideNextStep(stepNumber) {
    const context = capturePageContext();
    const guidance = await getAIGuidance(currentGoal, context, stepNumber);

    addMessage(guidance.instruction || 'Click the highlighted element');

    const found = findAndHighlight(guidance.nextElement || extractKeyword(currentGoal));

    if (found) {
      setTimeout(() => {
        addMessage('Did you click it? I\'ll check in 3 seconds and guide you to the next step...');
        
        setTimeout(async () => {
          const newContext = capturePageContext();
          if (JSON.stringify(newContext) !== JSON.stringify(context)) {
            addMessage('Great! I see the page changed. Moving to next step...');
            await guideNextStep(stepNumber + 1);
          } else {
            addMessage('Still waiting for you to click. Take your time!');
          }
        }, 3000);
      }, 1000);
    } else {
      addMessage(`I can't find that element on this page. Try navigating to the right module first.`);
    }
  }

  console.log('✅ AI Vision Guide Ready!');
})();
