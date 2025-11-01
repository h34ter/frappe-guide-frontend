// embed.js - SMART TEXT-BASED GUIDE (Works on ANY page)
(function() {
  'use strict';

  if (window.FRAPPE_GUIDE_LOADED) return;
  window.FRAPPE_GUIDE_LOADED = true;

  const API_URL = 'https://frappe-guide-backend.onrender.com';
  
  let currentRole = null;
  let isGuiding = false;
  let currentStepIndex = 0;
  let workflowSteps = [];
  let clickHandler = null;

  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;

  // ============ INJECT STYLES ============
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .guide-cursor {
      position: fixed !important;
      width: 40px !important;
      height: 40px !important;
      border: 3px solid #3B82F6 !important;
      border-radius: 50% !important;
      background: rgba(59, 130, 246, 0.15) !important;
      pointer-events: none !important;
      z-index: 99999 !important;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.6) !important;
      display: none !important;
      font-size: 18px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: #3B82F6 !important;
      font-weight: bold !important;
      left: 0 !important;
      top: 0 !important;
    }

    .guide-tooltip {
      position: fixed !important;
      background: rgba(17, 24, 39, 0.98) !important;
      color: #F3F4F6 !important;
      padding: 12px 16px !important;
      border-radius: 8px !important;
      border: 2px solid #3B82F6 !important;
      max-width: 280px !important;
      font-size: 13px !important;
      z-index: 99998 !important;
      pointer-events: none !important;
      display: none !important;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      word-wrap: break-word !important;
      left: 0 !important;
      top: 0 !important;
    }

    .guide-sidebar {
      position: fixed !important;
      right: -350px !important;
      top: 0 !important;
      width: 350px !important;
      height: 100vh !important;
      background: linear-gradient(135deg, #111827 0%, #1F2937 100%) !important;
      border-left: 2px solid #3B82F6 !important;
      z-index: 99997 !important;
      overflow-y: auto !important;
      padding: 20px !important;
      color: #F3F4F6 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5) !important;
      transition: right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      box-sizing: border-box !important;
    }

    .guide-sidebar.open {
      right: 0 !important;
    }

    .guide-sidebar h2 {
      margin: 0 0 20px 0 !important;
      font-size: 18px !important;
      color: #3B82F6 !important;
      font-weight: 700 !important;
    }

    .guide-tab {
      position: fixed !important;
      right: 0 !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 50px !important;
      height: 120px !important;
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
      border-radius: 8px 0 0 8px !important;
      z-index: 99996 !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 28px !important;
      color: white !important;
      box-shadow: -4px 4px 16px rgba(0, 0, 0, 0.3) !important;
      transition: all 0.3s ease !important;
      user-select: none !important;
      border: none !important;
      padding: 0 !important;
    }

    .guide-tab:hover {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important;
      box-shadow: -8px 8px 24px rgba(59, 130, 246, 0.5) !important;
    }

    .guide-tab.active {
      right: 350px !important;
      background: #10B981 !important;
    }

    .guide-section {
      margin-bottom: 20px !important;
    }

    .guide-section label {
      display: block !important;
      margin-bottom: 8px !important;
      font-size: 11px !important;
      color: #9CA3AF !important;
      text-transform: uppercase !important;
      font-weight: 600 !important;
    }

    .guide-section input,
    .guide-section select {
      width: 100% !important;
      padding: 10px 12px !important;
      background: #374151 !important;
      border: 1px solid #4B5563 !important;
      border-radius: 6px !important;
      color: #F3F4F6 !important;
      font-size: 13px !important;
      box-sizing: border-box !important;
    }

    .guide-btn {
      width: 100% !important;
      padding: 10px 12px !important;
      background: #3B82F6 !important;
      border: none !important;
      border-radius: 6px !important;
      color: white !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      margin-top: 10px !important;
      font-size: 13px !important;
    }

    .guide-btn:hover {
      background: #2563EB !important;
    }

    .current-step {
      background: rgba(59, 130, 246, 0.1) !important;
      border-left: 3px solid #3B82F6 !important;
      padding: 12px !important;
      margin: 10px 0 !important;
      border-radius: 4px !important;
      font-size: 13px !important;
      line-height: 1.6 !important;
    }

    .current-step strong {
      color: #3B82F6 !important;
      display: block !important;
    }

    .guide-status {
      font-size: 11px !important;
      color: #9CA3AF !important;
      margin-top: 10px !important;
      padding: 8px !important;
      background: #374151 !important;
      border-radius: 4px !important;
    }
  `;
  document.head.appendChild(styleSheet);

  // ============ DOM ELEMENTS ============
  const cursor = document.createElement('div');
  cursor.className = 'guide-cursor';
  document.body.appendChild(cursor);

  const tooltip = document.createElement('div');
  tooltip.className = 'guide-tooltip';
  document.body.appendChild(tooltip);

  const sidebar = document.createElement('div');
  sidebar.className = 'guide-sidebar';
  sidebar.innerHTML = `
    <h2>🤖 Frappe Guide</h2>
    
    <div class="guide-section">
      <label>Your Role</label>
      <select id="userRole">
        <option value="">Select role...</option>
        <option value="warehouse">Warehouse Operator</option>
        <option value="shop">Shop Owner</option>
        <option value="accountant">Accountant</option>
        <option value="procurement">Procurement Manager</option>
      </select>
    </div>

    <div class="guide-section" id="taskSection" style="display:none;">
      <label>What do you want to do?</label>
      <select id="taskSelect">
        <option value="">Select task...</option>
        <option value="purchase order">Create Purchase Order</option>
        <option value="sales order">Create Sales Order</option>
        <option value="stock entry">Stock Entry</option>
        <option value="invoice">Create Invoice</option>
      </select>
      <button class="guide-btn" onclick="window.startGuide()">Start Guide</button>
    </div>

    <div id="guidance"></div>
    <div class="guide-status" id="status">Ready</div>
  `;
  document.body.appendChild(sidebar);

  const tab = document.createElement('div');
  tab.className = 'guide-tab';
  tab.innerHTML = '🤖';
  tab.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    tab.classList.toggle('active');
  });
  document.body.appendChild(tab);

  // ============ SMART ELEMENT FINDERS ============
  function findButtonByText(searchText) {
    const buttons = document.querySelectorAll('button, a, [role="button"]');
    const search = searchText.toLowerCase().trim();

    for (let btn of buttons) {
      const text = btn.textContent.toLowerCase();
      if (btn.offsetHeight > 0 && text.includes(search)) {
        return btn;
      }
    }
    return null;
  }

  function findFieldByLabel(fieldName) {
    const search = fieldName.toLowerCase();
    
    // Try data-fieldname first
    let field = document.querySelector(`[data-fieldname*="${fieldName}"]`);
    if (field && field.offsetHeight > 0) return field;

    // Try labels
    const labels = document.querySelectorAll('label, [data-label]');
    for (let label of labels) {
      if (label.textContent.toLowerCase().includes(search)) {
        const parent = label.closest('.form-group, .frappe-control, .frappe-field');
        if (parent) {
          const input = parent.querySelector('input, select, textarea, [contenteditable]');
          if (input && input.offsetHeight > 0) return input;
        }
      }
    }

    // Last resort - find by name attribute
    field = document.querySelector(`input[name*="${fieldName}"], select[name*="${fieldName}"]`);
    if (field && field.offsetHeight > 0) return field;

    return null;
  }

  // ============ WORKFLOWS (TEXT-BASED) ============
  const WORKFLOWS = {
    'purchase order': [
      { step: 1, name: 'Click Purchase Order', findBy: 'text', text: 'Purchase Order', action: 'click' },
      { step: 2, name: 'Click New', findBy: 'text', text: 'New', action: 'click' },
      { step: 3, name: 'Select Supplier', findBy: 'label', text: 'Supplier', action: 'click' },
      { step: 4, name: 'Add Item Row', findBy: 'text', text: 'Add Row', action: 'click' },
      { step: 5, name: 'Save Purchase Order', findBy: 'text', text: 'Save', action: 'click' }
    ],
    'sales order': [
      { step: 1, name: 'Click Sales Order', findBy: 'text', text: 'Sales Order', action: 'click' },
      { step: 2, name: 'Click New', findBy: 'text', text: 'New', action: 'click' },
      { step: 3, name: 'Select Customer', findBy: 'label', text: 'Customer', action: 'click' },
      { step: 4, name: 'Add Items', findBy: 'text', text: 'Add Row', action: 'click' },
      { step: 5, name: 'Save Sales Order', findBy: 'text', text: 'Save', action: 'click' }
    ],
    'stock entry': [
      { step: 1, name: 'Click Stock Entry', findBy: 'text', text: 'Stock Entry', action: 'click' },
      { step: 2, name: 'Click New', findBy: 'text', text: 'New', action: 'click' },
      { step: 3, name: 'Save Entry', findBy: 'text', text: 'Save', action: 'click' }
    ],
    'invoice': [
      { step: 1, name: 'Click Invoice', findBy: 'text', text: 'Invoice', action: 'click' },
      { step: 2, name: 'Click New', findBy: 'text', text: 'New', action: 'click' },
      { step: 3, name: 'Select Customer', findBy: 'label', text: 'Customer', action: 'click' },
      { step: 4, name: 'Save Invoice', findBy: 'text', text: 'Save', action: 'click' }
    ]
  };

  // ============ ANIMATION ============
  function animateCursor(startX, startY, endX, endY, duration = 600) {
    const startTime = Date.now();
    cursorX = startX;
    cursorY = startY;

    function frame() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      cursorX = startX + (endX - startX) * ease;
      cursorY = startY + (endY - startY) * ease;

      cursor.style.left = (cursorX - 20) + 'px';
      cursor.style.top = (cursorY - 20) + 'px';
      cursor.style.display = 'flex';
      cursor.innerHTML = '●';
      cursor.style.boxShadow = `0 0 ${20 + progress * 10}px rgba(59, 130, 246, ${0.5 + progress * 0.3})`;

      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // ============ EXECUTE STEP ============
  function showStep(step) {
    let element = null;

    if (step.findBy === 'text') {
      element = findButtonByText(step.text);
    } else if (step.findBy === 'label') {
      element = findFieldByLabel(step.text);
    }

    if (!element || element.offsetHeight === 0) {
      document.getElementById('guidance').innerHTML = `
        <div class="current-step" style="background:#f59e0b14; border-left-color:#f59e0b;">
          ⚠️ Looking for: <strong>${step.name}</strong>
          <p style="margin-top: 8px; font-size: 12px;">Searching page...</p>
        </div>
      `;

      setTimeout(() => {
        element = step.findBy === 'text' ? findButtonByText(step.text) : findFieldByLabel(step.text);
        if (element && element.offsetHeight > 0) {
          showStep(step); // Retry
        } else {
          document.getElementById('guidance').innerHTML = `
            <div class="current-step" style="background:#ef444414; border-left-color:#ef4444;">
              ❌ Can't find: ${step.name}
              <button class="guide-btn" onclick="location.reload()" style="margin-top:8px;">Refresh Page</button>
            </div>
          `;
        }
      }, 1000);
      return;
    }

    // Found element - animate cursor to it
    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    animateCursor(cursorX, cursorY, targetX, targetY, 600);

    setTimeout(() => {
      tooltip.textContent = `${step.action === 'click' ? 'Click' : 'Enter'}: ${step.name}`;
      tooltip.style.left = Math.max(10, targetX + 20) + 'px';
      tooltip.style.top = Math.max(60, targetY - 50) + 'px';
      tooltip.style.display = 'block';

      document.getElementById('guidance').innerHTML = `
        <div class="current-step">
          <strong>Step ${currentStepIndex + 1}/${workflowSteps.length}</strong>
          <p>${step.name}</p>
        </div>
      `;

      // Handle click
      if (clickHandler) document.removeEventListener('click', clickHandler, true);

      clickHandler = (e) => {
        const clicked = e.target.closest('button, a, [role="button"], input, select');
        if (clicked === element || element.contains(clicked)) {
          tooltip.style.display = 'none';
          currentStepIndex++;
          document.removeEventListener('click', clickHandler, true);
          setTimeout(executeStep, 500);
        }
      };

      document.addEventListener('click', clickHandler, true);
    }, 600);
  }

  function executeStep() {
    if (currentStepIndex >= workflowSteps.length) {
      document.getElementById('guidance').innerHTML = `
        <div class="current-step" style="background:#10b98114; border-left-color:#10b981;">
          <strong>✅ Workflow Complete!</strong>
          <p>You did it! 🎉</p>
        </div>
      `;
      tooltip.style.display = 'none';
      cursor.style.display = 'none';
      isGuiding = false;
      return;
    }

    const step = workflowSteps[currentStepIndex];
    document.getElementById('status').textContent = `Step ${currentStepIndex + 1}/${workflowSteps.length}`;
    showStep(step);
  }

  // ============ EVENT HANDLERS ============
  window.startGuide = function() {
    const task = document.getElementById('taskSelect').value;
    if (!task || !WORKFLOWS[task]) return alert('Select a task!');

    currentRole = document.getElementById('userRole').value;
    if (!currentRole) return alert('Select your role!');

    workflowSteps = WORKFLOWS[task];
    currentStepIndex = 0;
    isGuiding = true;

    document.getElementById('taskSelect').disabled = true;
    document.getElementById('userRole').disabled = true;

    executeStep();
  };

  document.getElementById('userRole').addEventListener('change', () => {
    currentRole = document.getElementById('userRole').value;
    if (currentRole) document.getElementById('taskSection').style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.guide-sidebar') && !e.target.closest('.guide-tab') && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      tab.classList.remove('active');
    }
  });

  console.log('✓ Smart Frappe Guide MVP Ready!');
})();
