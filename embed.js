// embed.js - COMPLETE WORKING VERSION WITH AI CURSOR MOVEMENT
(function() {
  'use strict';
  if (window.FRAPPE_GUIDE_LOADED) return;
  window.FRAPPE_GUIDE_LOADED = true;

  const API_URL = 'https://frappe-guide-backend.onrender.com';
  let cursor, panel, isGuiding = false, stepCount = 0;

  // CREATE STYLES
  const style = document.createElement('style');
  style.textContent = `
    .guide-cursor {
      position: fixed;
      width: 50px;
      height: 50px;
      border: 3px solid #3B82F6;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.2);
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), inset 0 0 20px rgba(59, 130, 246, 0.3);
      pointer-events: auto;
      z-index: 999999;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      user-select: none;
    }
    .guide-cursor:active { cursor: grabbing; }
    .guide-panel {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 420px;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border: 2px solid #3B82F6;
      border-radius: 16px;
      padding: 24px;
      z-index: 999998;
      box-shadow: 0 25px 80px rgba(0,0,0,0.6);
      font-family: -apple-system, sans-serif;
      color: #F3F4F6;
    }
    .guide-label { font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px; }
    .guide-select {
      width: 100%;
      padding: 12px;
      background: #1e293b;
      border: 1.5px solid #334155;
      border-radius: 10px;
      color: #F3F4F6;
      font-size: 13px;
      margin-bottom: 10px;
    }
    .guide-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
    .guide-step {
      margin-top: 16px;
      padding: 14px;
      background: rgba(59, 130, 246, 0.1);
      border-left: 4px solid #3B82F6;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.7;
      color: #E5E7EB;
    }
    .guide-step strong { color: #60A5FA; }
    .guide-hidden { display: none; }
  `;
  document.head.appendChild(style);

  // CREATE CURSOR
  cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  cursor.innerHTML = '●';
  cursor.style.left = '300px';
  cursor.style.top = '300px';
  cursor.style.display = 'none';
  document.body.appendChild(cursor);

  // MAKE CURSOR DRAGGABLE
  let isDragging = false;
  cursor.addEventListener('mousedown', () => { isDragging = true; });
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      cursor.style.left = (e.clientX - 25) + 'px';
      cursor.style.top = (e.clientY - 25) + 'px';
    }
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  // CREATE PANEL
  panel = document.createElement('div');
  panel.className = 'guide-panel';
  panel.innerHTML = `
    <h2 style="margin:0 0 20px 0; color:#3B82F6; font-size:20px; font-weight:700;">🤖 AI Guide</h2>
    
    <div id="taskSection">
      <label class="guide-label">Pick a workflow</label>
      <select class="guide-select" id="taskSelect">
        <option value="">Select task...</option>
        <option value="purchase_order">Create Purchase Order</option>
        <option value="sales_order">Create Sales Order</option>
        <option value="invoice">Create Invoice</option>
        <option value="stock_entry">Stock Entry</option>
      </select>
      <button class="guide-btn" onclick="window.startGuide()">Start Guide</button>
    </div>

    <div id="guidanceSection" class="guide-hidden">
      <div id="guideStep"></div>
      <button class="guide-btn" style="margin-top:15px;" onclick="window.nextStep()">Next Step</button>
    </div>
  `;
  document.body.appendChild(panel);

  // START GUIDE
  window.startGuide = async function() {
    const task = document.getElementById('taskSelect').value;
    if (!task) return alert('Pick a task!');

    isGuiding = true;
    stepCount = 0;
    cursor.style.display = 'flex';

    document.getElementById('taskSection').classList.add('guide-hidden');
    document.getElementById('guidanceSection').classList.remove('guide-hidden');

    await guideStep();
  };

  // GUIDE STEP
  async function guideStep() {
    const taskVal = document.getElementById('taskSelect').value;
    const allElements = [];
    
    document.querySelectorAll('button, a, input, select, [role="button"]').forEach(el => {
      if (el.offsetHeight > 0) {
        allElements.push({
          text: el.textContent?.slice(0, 40) || el.getAttribute('placeholder') || '',
          tagName: el.tagName
        });
      }
    });

    try {
      const response = await fetch(`${API_URL}/guide-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskVal,
          step: stepCount++,
          pageUrl: window.location.href,
          availableElements: allElements.slice(0, 30)
        })
      });

      const data = await response.json();
      document.getElementById('guideStep').innerHTML = `<div class="guide-step"><strong>Step ${stepCount}:</strong> ${data.instruction}</div>`;

      // MOVE CURSOR TO ELEMENT
      const search = data.nextClick.toLowerCase();
      const allEls = document.querySelectorAll('button, a, input, select, [role="button"]');
      
      for (let el of allEls) {
        const text = (el.textContent || el.getAttribute('placeholder') || '').toLowerCase();
        if (text.includes(search) && el.offsetHeight > 0) {
          const rect = el.getBoundingClientRect();
          const targetX = rect.left + rect.width / 2 - 25;
          const targetY = rect.top + rect.height / 2 - 25;

          // ANIMATE CURSOR
          animateTo(targetX, targetY, 600);
          
          // HIGHLIGHT ELEMENT
          el.style.outline = '3px solid #3B82F6';
          el.style.outlineOffset = '4px';
          setTimeout(() => { el.style.outline = ''; }, 10000);
          
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    } catch (err) {
      document.getElementById('guideStep').innerHTML = `<div class="guide-step"><strong>Error:</strong> ${err.message}</div>`;
    }
  }

  // ANIMATE CURSOR
  function animateTo(targetX, targetY, duration = 600) {
    const startX = parseFloat(cursor.style.left);
    const startY = parseFloat(cursor.style.top);
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      cursor.style.left = (startX + (targetX - startX) * ease) + 'px';
      cursor.style.top = (startY + (targetY - startY) * ease) + 'px';

      if (progress < 1) requestAnimationFrame(animate);
    }
    animate();
  }

  // NEXT STEP
  window.nextStep = async function() {
    await guideStep();
  };

  console.log('✅ AI Guide Ready - Cursor Draggable!');
})();
