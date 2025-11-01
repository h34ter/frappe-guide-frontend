// embed.js - COMPLETE FIXED VERSION
const API_URL = 'https://frappe-guide-backend.onrender.com';
let currentRole = null;
let currentPhase = 1;
let isInstrucing = false;
let currentStepIndex = 0;
let currentWorkflow = null;
let waitingForClick = false;
let targetElement = null;

// Cursor position tracking
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

// PREDEFINED WORKFLOWS
const WORKFLOWS = {
  'purchase order': [
    { instruction: 'Click on the "Buying" module in the sidebar', selector: '[data-label="Buying"], a[href*="buying"]' },
    { instruction: 'Click on "Purchase Order" from the menu', selector: '[data-label="Purchase Order"], a[href*="purchase-order"]' },
    { instruction: 'Click the "New" button to create a new purchase order', selector: 'button[data-label="New"], .btn-primary-dark' },
    { instruction: 'Select a supplier from the dropdown', selector: '[data-fieldname="supplier"]' },
    { instruction: 'Add items by clicking "Add Row" in the items table', selector: '.grid-add-row' },
    { instruction: 'Save your purchase order by clicking Save', selector: '[data-label="Save"]' }
  ],
  'sales order': [
    { instruction: 'Click on the "Selling" module in the sidebar', selector: '[data-label="Selling"], a[href*="selling"]' },
    { instruction: 'Click on "Sales Order"', selector: '[data-label="Sales Order"], a[href*="sales-order"]' },
    { instruction: 'Click "New" to create a sales order', selector: 'button[data-label="New"]' },
    { instruction: 'Select a customer', selector: '[data-fieldname="customer"]' },
    { instruction: 'Add products to sell', selector: '.grid-add-row' },
    { instruction: 'Set delivery date', selector: '[data-fieldname="delivery_date"]' },
    { instruction: 'Save the sales order', selector: '[data-label="Save"]' }
  ],
  'stock': [
    { instruction: 'Click on "Stock" module', selector: '[data-label="Stock"], a[href*="stock"]' },
    { instruction: 'View your inventory', selector: '[data-label="Stock Balance"]' }
  ]
};

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
      <option value="">Select your role...</option>
      <option value="warehouse_operator">Warehouse Operator</option>
      <option value="meat_shop_owner">Shop Owner (Retail)</option>
      <option value="accountant">Accountant</option>
      <option value="procurement_manager">Procurement Manager</option>
    </select>
  </div>

  <div class="guide-section" id="phaseSection" style="display:none;">
    <label>Your Learning Phase</label>
    <select id="learningPhase"></select>
    <button class="guide-btn" onclick="window.startPhase()">Start Learning</button>
  </div>

  <div class="guide-section" id="taskSection" style="display:none;">
    <label>What do you want to learn?</label>
    <select id="taskSelect">
      <option value="">Select a workflow...</option>
      <option value="purchase order">Create Purchase Order</option>
      <option value="sales order">Create Sales Order</option>
      <option value="stock">Check Stock Levels</option>
    </select>
    <button class="guide-btn" onclick="window.startGuidance()">Start Guide</button>
  </div>

  <div id="currentGuidance"></div>
  <div id="progressBar" style="display:none; margin-top:10px;">
    <div style="background:#374151; height:6px; border-radius:3px; overflow:hidden;">
      <div id="progressFill" style="background:#3B82F6; height:100%; width:0%; transition:width 0.3s;"></div>
    </div>
    <div style="font-size:11px; color:#9CA3AF; margin-top:4px;">
      Step <span id="currentStep">0</span> of <span id="totalSteps">0</span>
    </div>
  </div>
`;
document.body.appendChild(sidebar);

const tab = document.createElement('div');
tab.className = 'guide-tab';
tab.innerHTML = '🤖';
tab.onclick = () => {
  sidebar.classList.toggle('open');
  tab.classList.toggle('active');
};
document.body.appendChild(tab);

document.addEventListener('click', (e) => {
  if (!e.target.closest('.guide-sidebar') && !e.target.closest('.guide-tab') && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    tab.classList.remove('active');
  }
});

window.loadPhases = function(role) {
  const phases = {
    warehouse_operator: ['Phase 1: Stock Basics', 'Phase 2: Warehouse Ops', 'Phase 3: Advanced Reports'],
    meat_shop_owner: ['Phase 1: Daily Sales', 'Phase 2: Inventory', 'Phase 3: Business Reports'],
    accountant: ['Phase 1: Basic Entries', 'Phase 2: Financial Reports', 'Phase 3: Tax Compliance'],
    procurement_manager: ['Phase 1: RFQ Basics', 'Phase 2: Purchase Orders', 'Phase 3: Advanced Procurement']
  };

  const phaseSelect = document.getElementById('learningPhase');
  phaseSelect.innerHTML = phases[role].map((p, i) => `<option value="${i+1}">${p}</option>`).join('');
  document.getElementById('phaseSection').style.display = 'block';
};

window.startPhase = function() {
  currentPhase = parseInt(document.getElementById('learningPhase').value);
  document.getElementById('taskSection').style.display = 'block';
  document.getElementById('currentGuidance').innerHTML = `
    <div class="phase-indicator">Phase ${currentPhase} Active</div>
    <div class="current-step">Select what you want to learn!</div>
  `;
};

window.startGuidance = function() {
  const task = document.getElementById('taskSelect').value;
  if (!task || !WORKFLOWS[task]) {
    alert('Please select a workflow!');
    return;
  }

  currentWorkflow = WORKFLOWS[task];
  currentStepIndex = 0;
  isInstrucing = true;
  waitingForClick = false;

  document.getElementById('progressBar').style.display = 'block';
  document.getElementById('totalSteps').textContent = currentWorkflow.length;
  
  executeCurrentStep();
};

function executeCurrentStep() {
  if (currentStepIndex >= currentWorkflow.length) {
    // Workflow complete!
    document.getElementById('currentGuidance').innerHTML = `
      <div class="current-step" style="background:#10b98114; border-left-color:#10b981;">
        🎉 Congratulations! You completed the workflow!
      </div>
    `;
    isInstrucing = false;
    waitingForClick = false;
    tooltip.style.display = 'none';
    cursor.style.display = 'none';
    return;
  }

  const step = currentWorkflow[currentStepIndex];
  
  document.getElementById('currentGuidance').innerHTML = `
    <div class="current-step">
      <strong>Step ${currentStepIndex + 1}:</strong>
      <p>${step.instruction}</p>
      <div style="margin-top:8px; color:#9CA3AF; font-size:12px;">
        ⏳ Waiting for your click...
      </div>
    </div>
  `;

  // Update progress
  document.getElementById('currentStep').textContent = currentStepIndex + 1;
  const progress = ((currentStepIndex + 1) / currentWorkflow.length) * 100;
  document.getElementById('progressFill').style.width = progress + '%';

  // Find target element
  targetElement = document.querySelector(step.selector);
  
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    // Animate cursor from current position to target
    animateCursor(cursorX, cursorY, targetX, targetY, 1000);

    setTimeout(() => {
      let tooltipX = targetX + 20;
      let tooltipY = targetY - 50;
      
      if (tooltipY < 60) tooltipY = targetY + rect.height + 10;
      if (tooltipX > window.innerWidth - 300) tooltipX = targetX - 300;
      
      tooltip.textContent = step.instruction;
      tooltip.style.left = tooltipX + 'px';
      tooltip.style.top = tooltipY + 'px';
      tooltip.style.display = 'block';
      
      waitingForClick = true;
    }, 1000);
  } else {
    // Element not found
    document.getElementById('currentGuidance').innerHTML += `
      <div style="background:#f59e0b14; border-left:3px solid #f59e0b; padding:8px; margin-top:8px; font-size:12px;">
        ⚠️ Can't find this element on current page. Try navigating manually or click "Skip"
        <button class="guide-btn" onclick="window.skipStep()" style="margin-top:8px; font-size:12px;">Skip This Step</button>
      </div>
    `;
  }
}

window.skipStep = function() {
  currentStepIndex++;
  waitingForClick = false;
  tooltip.style.display = 'none';
  executeCurrentStep();
};

function animateCursor(startX, startY, endX, endY, duration = 1000) {
  const startTime = Date.now();
  cursorX = startX;
  cursorY = startY;
  
  function step() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

    cursorX = startX + (endX - startX) * easeProgress;
    cursorY = startY + (endY - startY) * easeProgress;

    cursor.style.left = (cursorX - 20) + 'px';
    cursor.style.top = (cursorY - 20) + 'px';
    cursor.style.display = 'block';
    cursor.style.boxShadow = `0 0 ${20 + progress * 10}px rgba(59, 130, 246, ${0.5 + progress * 0.3})`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// STRICT CLICK DETECTION
document.addEventListener('click', (e) => {
  if (!waitingForClick || !targetElement) return;

  // Check if EXACTLY the target was clicked
  if (e.target === targetElement || targetElement.contains(e.target) || e.target.contains(targetElement)) {
    waitingForClick = false;
    tooltip.style.display = 'none';
    
    document.getElementById('currentGuidance').innerHTML = `
      <div class="current-step" style="background:#10b98114; border-left-color:#10b981;">
        ✅ Perfect! Moving to next step...
      </div>
    `;

    setTimeout(() => {
      currentStepIndex++;
      executeCurrentStep();
    }, 800);
  }
}, true);

const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
  }
`;
document.head.appendChild(style);

document.getElementById('userRole').addEventListener('change', (e) => {
  currentRole = e.target.value;
  if (currentRole) window.loadPhases(currentRole);
});

console.log('✓ Frappe Guide loaded with fixed cursor tracking!');




// Key additions for embed.js:

// ADAPTIVE LEARNING SYSTEM
class AdaptiveTrainer {
  constructor(userRole, experience) {
    this.userRole = userRole;
    this.experience = experience;
    this.adaptiveLevel = experience; // 1-5
    this.mistakePatterns = {};
    this.learningStyle = 'visual'; // Can be adapted
  }

  async generateDynamicWorkflow(task) {
    const response = await fetch(`${API_URL}/generate-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task,
        role: this.userRole,
        experience: this.experience,
        sessionId: window.sessionId
      })
    });
    return response.json();
  }

  trackError(error, action) {
    this.mistakePatterns[action] = (this.mistakePatterns[action] || 0) + 1;
    return fetch(`${API_URL}/handle-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error,
        action,
        role: this.userRole,
        sessionId: window.sessionId
      })
    }).then(r => r.json());
  }

  adaptDifficulty() {
    const avgErrors = Object.values(this.mistakePatterns).reduce((a, b) => a + b, 0) / Object.keys(this.mistakePatterns).length;
    if (avgErrors > 2) this.adaptiveLevel = Math.max(1, this.adaptiveLevel - 1);
    if (avgErrors < 0.5) this.adaptiveLevel = Math.min(5, this.adaptiveLevel + 1);
  }
}

// CONTEXT AWARENESS
class ContextAnalyzer {
  detectCurrentModule() {
    const url = window.location.href;
    if (url.includes('/buying')) return 'Buying';
    if (url.includes('/selling')) return 'Selling';
    if (url.includes('/stock')) return 'Stock';
    if (url.includes('/accounting')) return 'Accounting';
    return 'Unknown';
  }

  detectFormState() {
    return {
      isSaved: !!document.querySelector('[data-docstatus="1"]'),
      hasErrors: !!document.querySelector('.alert-danger'),
      currentForm: document.querySelector('[data-doctype]')?.getAttribute('data-doctype') || null
    };
  }
}

// ERROR RECOVERY
class ErrorRecovery {
  static async handleStepFailure(step, attempt = 1) {
    if (attempt > 3) return { recoverable: false, reason: 'Max retries exceeded' };
    
    // Try alternative selectors
    const alternatives = this.getAlternativeSelectors(step.selector);
    for (let alt of alternatives) {
      if (document.querySelector(alt)) {
        return { recoverable: true, newSelector: alt };
      }
    }
    
    return { recoverable: false, reason: 'Element not found' };
  }

  static getAlternativeSelectors(original) {
    // Fallback selector strategies
    return [
      original,
      original.replace('[data-label=', '[title='),
      original.split(',')[0], // Try first option
      'button:contains("New")',
      '.btn-primary:first'
    ];
  }
}

// VOICE & MULTIMODAL (Optional but recommended)
class VoiceGuide {
  static async speakInstruction(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// Initialize trainer
window.trainer = new AdaptiveTrainer(currentRole, experienceLevel);
window.contextAnalyzer = new ContextAnalyzer();
