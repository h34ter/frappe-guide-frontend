// embed.js - WITH AI CURSOR GUIDANCE
const API_URL = 'https://frappe-guide-backend.onrender.com';
let currentRole = null;
let currentPhase = 1;
let isInstrucing = false;

const cursor = document.createElement('div');
cursor.className = 'guide-cursor';
document.body.appendChild(cursor);

const tooltip = document.createElement('div');
tooltip.className = 'guide-tooltip';
document.body.appendChild(tooltip);

const sidebar = document.createElement('div');
sidebar.className = 'guide-sidebar';
sidebar.innerHTML = `
  <h2>Frappe Guide</h2>
  
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
    <input type="text" id="taskInput" placeholder="e.g., Create a Purchase Order">
    <button class="guide-btn" onclick="window.startGuidance()">Let's Go!</button>
  </div>

  <div id="currentGuidance"></div>
`;
document.body.appendChild(sidebar);

// Frappe element mapping (button locations)
const FRAPPE_MAP = {
  'buying': { selector: '[data-label="Buying"]', desc: 'Buying Module' },
  'selling': { selector: '[data-label="Selling"]', desc: 'Selling Module' },
  'stock': { selector: '[data-label="Stock"]', desc: 'Stock Module' },
  'new-button': { selector: 'button[data-label="New"]', desc: 'New Button' },
  'save-button': { selector: 'button[title="Save"]', desc: 'Save Button' },
  'submit-button': { selector: 'button[data-label="Submit"]', desc: 'Submit Button' }
};

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
    <div class="phase-indicator">
      Phase ${currentPhase} Active
    </div>
    <div class="current-step">
      Enter what you want to learn and I'll guide you!
    </div>
  `;
};

// MAIN FUNCTION: AI guides the cursor
window.startGuidance = function() {
  const task = document.getElementById('taskInput').value;
  if (!task) return;

  isInstrucing = true;
  document.getElementById('currentGuidance').innerHTML = `
    <div class="current-step" style="background: #f59e0b14; border-left-color: #f59e0b;">
      ⏳ AI is planning your lesson...
    </div>
  `;

  // Ask AI for guidance
  fetch(`${API_URL}/analyze-element`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      elementText: task,
      elementType: 'TASK',
      userRole: currentRole,
      currentPhase
    })
  })
  .then(r => r.json())
  .then(data => {
    document.getElementById('currentGuidance').innerHTML = `
      <div class="current-step">
        <strong>Next Step:</strong>
        <p>${data.guidance}</p>
      </div>
    `;

    // Now find and animate cursor to relevant element
    animateCursorToElement(task);
  })
  .catch(err => {
    console.error('Error:', err);
    document.getElementById('currentGuidance').innerHTML = `
      <div class="current-step" style="background: #ef444414; border-left-color: #ef4444;">
        ⚠️ Error: ${err.message}
      </div>
    `;
  });
};

// CURSOR ANIMATION: Move cursor smoothly to target
function animateCursorToElement(task) {
  // Find the most relevant element on the page
  const allElements = document.querySelectorAll('button, a, input, select, [role="button"]');
  
  let targetElement = null;
  let maxMatch = 0;

  // Find best matching element based on text
  for (let el of allElements) {
    const text = el.textContent.toLowerCase();
    const taskLower = task.toLowerCase();
    
    if (text.includes(taskLower.split(' ')[0])) {
      targetElement = el;
      break;
    }
  }

  // If no perfect match, find first visible button
  if (!targetElement) {
    targetElement = document.querySelector('button:not([style*="display: none"])');
  }

  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    // Animate cursor from center to target
    animateCursor(window.innerWidth / 2, window.innerHeight / 2, targetX, targetY, 1500);

    // Show tooltip on target
    setTimeout(() => {
      tooltip.textContent = `Click here: ${targetElement.textContent || 'button'}`;
      tooltip.style.left = (targetX + 20) + 'px';
      tooltip.style.top = (targetY - 50) + 'px';
      tooltip.style.display = 'block';
    }, 1500);
  }
}

// Smooth cursor animation
function animateCursor(startX, startY, endX, endY, duration = 1500) {
  const startTime = Date.now();
  
  function step() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-in-out)
    const easeProgress = progress < 0.5 
      ? 2 * progress * progress 
      : -1 + (4 - 2 * progress) * progress;

    const currentX = startX + (endX - startX) * easeProgress;
    const currentY = startY + (endY - startY) * easeProgress;

    cursor.style.left = (currentX - 20) + 'px';
    cursor.style.top = (currentY - 20) + 'px';
    cursor.style.display = 'block';

    // Glow effect increases as cursor moves
    cursor.style.boxShadow = `0 0 ${20 + progress * 10}px rgba(59, 130, 246, ${0.5 + progress * 0.3})`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Cursor reached target - pulse effect
      cursor.style.animation = 'pulse 0.6s ease-in-out 2';
    }
  }

  requestAnimationFrame(step);
}

// Add pulse animation
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

// Hover detection still works
document.addEventListener('mousemove', (e) => {
  if (isInstrucing) return; // Don't interfere during AI guidance

  const element = document.elementFromPoint(e.clientX, e.clientY);
  
  if (element && !element.closest('.guide-sidebar') && currentRole) {
    cursor.style.left = (e.clientX - 20) + 'px';
    cursor.style.top = (e.clientY - 20) + 'px';
    cursor.style.display = 'block';

    const elementText = element.textContent?.slice(0, 50) || element.getAttribute('aria-label') || '';

    if (elementText.trim()) {
      fetch(`${API_URL}/analyze-element`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementText,
          elementType: element.tagName,
          userRole: currentRole,
          currentPhase
        })
      })
      .then(r => r.json())
      .then(data => {
        tooltip.textContent = data.guidance;
        tooltip.style.left = (e.clientX + 20) + 'px';
        tooltip.style.top = (e.clientY - 50) + 'px';
        tooltip.style.display = 'block';
      })
      .catch(err => console.error('Error:', err));
    }
  } else {
    tooltip.style.display = 'none';
    if (!isInstrucing) cursor.style.display = 'none';
  }
});

console.log('✓ Frappe Guide loaded with AI cursor guidance!');
