// embed.js - OPTIMIZED: Only analyze when mismatch detected
const API_URL = 'https://frappe-guide-backend.onrender.com';

let currentRole = null;
let isGuiding = false;
let currentStepIndex = 0;
let workflowSteps = [];
let lastPageState = null;
let analysisNeeded = false;

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let targetElement = null;

// ============ PREDEFINED WORKFLOWS (Cached) ============
const WORKFLOWS = {
  'purchase order': [
    { step: 1, name: 'Buying', selector: '[data-label="Buying"]', expectedElements: ['Purchase Order'] },
    { step: 2, name: 'Purchase Order', selector: '[data-label="Purchase Order"]', expectedElements: ['New'] },
    { step: 3, name: 'New', selector: 'button[data-label="New"]', expectedElements: ['Supplier'] },
    { step: 4, name: 'Supplier', selector: '[data-fieldname="supplier"]', expectedElements: ['Item'] },
    { step: 5, name: 'Items', selector: '.grid-add-row', expectedElements: ['Save'] },
    { step: 6, name: 'Save', selector: '[data-label="Save"]', expectedElements: [] }
  ],
  'sales order': [
    { step: 1, name: 'Selling', selector: '[data-label="Selling"]', expectedElements: ['Sales Order'] },
    { step: 2, name: 'Sales Order', selector: '[data-label="Sales Order"]', expectedElements: ['New'] },
    { step: 3, name: 'New', selector: 'button[data-label="New"]', expectedElements: ['Customer'] },
    { step: 4, name: 'Customer', selector: '[data-fieldname="customer"]', expectedElements: ['Item'] },
    { step: 5, name: 'Items', selector: '.grid-add-row', expectedElements: ['Save'] },
    { step: 6, name: 'Save', selector: '[data-label="Save"]', expectedElements: [] }
  ]
};

// ============ FAST STATE CHECK ============
class StateValidator {
  static getCurrentState() {
    return {
      url: window.location.href,
      visibleButtons: Array.from(document.querySelectorAll('button, [role="button"]'))
        .filter(e => e.offsetHeight > 0)
        .map(e => e.textContent.slice(0, 30).toLowerCase()),
      visibleFields: Array.from(document.querySelectorAll('[data-fieldname]'))
        .filter(e => e.offsetHeight > 0)
        .map(e => e.getAttribute('data-fieldname'))
    };
  }

  static stateMatches(expected, current) {
    if (!expected || !current) return false;

    // Check if expected elements are visible
    const expectedLower = expected.map(e => e.toLowerCase());
    const found = expectedLower.filter(exp => 
      current.visibleButtons.some(btn => btn.includes(exp)) ||
      current.visibleFields.some(fld => fld.includes(exp))
    ).length;

    return found / Math.max(expectedLower.length, 1) > 0.6; // 60% match = good enough
  }
}

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
      <option value="">Select...</option>
      <option value="warehouse">Warehouse Op</option>
      <option value="shop">Shop Owner</option>
      <option value="accountant">Accountant</option>
    </select>
  </div>

  <div class="guide-section" id="taskSection" style="display:none;">
    <label>What's your task?</label>
    <select id="taskSelect">
      <option value="">Pick one...</option>
      <option value="purchase order">Create Purchase Order</option>
      <option value="sales order">Create Sales Order</option>
    </select>
    <button class="guide-btn" onclick="window.startGuide()">Start</button>
  </div>

  <div id="guidance"></div>
  <div id="status" style="font-size:11px; color:#9CA3AF; margin-top:10px;">Ready</div>
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

// ============ SMART GUIDANCE LOOP ============
window.startGuide = function() {
  const task = document.getElementById('taskSelect').value;
  if (!task || !WORKFLOWS[task]) return;

  currentRole = document.getElementById('userRole').value;
  if (!currentRole) return;

  workflowSteps = WORKFLOWS[task];
  currentStepIndex = 0;
  isGuiding = true;
  analysisNeeded = true;

  executeStep();
};

async function executeStep() {
  if (currentStepIndex >= workflowSteps.length) {
    document.getElementById('guidance').innerHTML = `
      <div class="current-step" style="background:#10b98114;">✅ Done!</div>
    `;
    return;
  }

  const step = workflowSteps[currentStepIndex];
  const currentState = StateValidator.getCurrentState();

  // FAST PATH: Check if expected elements are visible
  const stateOk = StateValidator.stateMatches(step.expectedElements, currentState);

  if (!stateOk && analysisNeeded) {
    // ONLY analyze if state DOESN'T match
    await analyzeAndCorrect(step, currentState);
  } else {
    // Fast path - just execute
    showStep(step);
  }
}

async function analyzeAndCorrect(step, currentState) {
  document.getElementById('status').textContent = '🔍 Analyzing...';

  const response = await fetch(`${API_URL}/quick-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step: step.name,
      currentState,
      workflow: workflowSteps[currentStepIndex - 1]?.name || 'Start',
      role: currentRole
    })
  }).then(r => r.json()).catch(() => ({ correction: null }));

  if (response.correction) {
    document.getElementById('guidance').innerHTML = `
      <div class="current-step" style="background:#f59e0b14;">
        <strong>⚠️ You're off track</strong>
        <p>${response.correction}</p>
      </div>
    `;
    analysisNeeded = true;
  } else {
    showStep(step);
  }

  document.getElementById('status').textContent = 'Ready';
}

function showStep(step) {
  const element = document.querySelector(step.selector);

  if (element && element.offsetHeight > 0) {
    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    animateCursor(cursorX, cursorY, targetX, targetY, 600);

    setTimeout(() => {
      tooltip.textContent = `Click: ${step.name}`;
      tooltip.style.left = (targetX + 20) + 'px';
      tooltip.style.top = Math.max(60, targetY - 50) + 'px';
      tooltip.style.display = 'block';

      // Detect when user clicks it
      const clickHandler = () => {
        currentStepIndex++;
        document.removeEventListener('click', clickHandler, true);
        setTimeout(executeStep, 800);
      };

      document.addEventListener('click', clickHandler, true);
    }, 600);

    document.getElementById('guidance').innerHTML = `
      <div class="current-step">
        <strong>Step ${currentStepIndex + 1}/${workflowSteps.length}:</strong>
        <p>${step.name}</p>
      </div>
    `;
  } else {
    // Element not found - analyze
    analysisNeeded = true;
    executeStep();
  }
}

function animateCursor(startX, startY, endX, endY, duration = 600) {
  const startTime = Date.now();
  cursorX = startX;
  cursorY = startY;

  const step = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

    cursorX = startX + (endX - startX) * ease;
    cursorY = startY + (endY - startY) * ease;

    cursor.style.left = (cursorX - 20) + 'px';
    cursor.style.top = (cursorY - 20) + 'px';
    cursor.style.display = 'block';
    cursor.innerHTML = '●';

    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

document.getElementById('userRole').addEventListener('change', () => {
  currentRole = document.getElementById('userRole').value;
  if (currentRole) document.getElementById('taskSection').style.display = 'block';
});

console.log('✓ Optimized Fast Guide loaded!');
