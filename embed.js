// embed.js - COMPLETE VERSION WITH CLICK DETECTION & TAB
const API_URL = 'https://frappe-guide-backend.onrender.com';
let currentRole = null;
let currentPhase = 1;
let isInstrucing = false;
let currentStepIndex = 0;
let workflowSteps = [];
let waitingForClick = false;
let targetElement = null;

const cursor = document.createElement('div');
cursor.className = 'guide-cursor';
document.body.appendChild(cursor);

const tooltip = document.createElement('div');
tooltip.className = 'guide-tooltip';
document.body.appendChild(tooltip);

// Create collapsible sidebar
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
    <input type="text" id="taskInput" placeholder="e.g., Create a Purchase Order">
    <button class="guide-btn" onclick="window.startGuidance()">Let's Go!</button>
  </div>

  <div id="currentGuidance"></div>
`;
document.body.appendChild(sidebar);

// Create tab that's always visible
const tab = document.createElement('div');
tab.className = 'guide-tab';
tab.innerHTML = '🤖';
tab.onclick = () => {
  sidebar.classList.toggle('open');
  tab.classList.toggle('active');
};
document.body.appendChild(tab);

// Close sidebar when clicking outside
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
    <div class="phase-indicator">
      Phase ${currentPhase} Active
    </div>
    <div class="current-step">
      Enter what you want to learn and I'll guide you step-by-step!
    </div>
  `;
};

window.startGuidance = function() {
  const task = document.getElementById('taskInput').value;
  if (!task) return;

  isInstrucing = true;
  currentStepIndex = 0;
  document.getElementById('currentGuidance').innerHTML = `
    <div class="current-step" style="background: #f59e0b14; border-left-color: #f59e0b;">
      ⏳ AI is planning your lesson...
    </div>
  `;

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
    // First step
    executeStep(data.guidance, task);
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

function executeStep(instruction, task) {
  document.getElementById('currentGuidance').innerHTML = `
    <div class="current-step">
      <strong>Step ${currentStepIndex + 1}:</strong>
      <p>${instruction}</p>
      <div style="margin-top: 8px; color: #9CA3AF; font-size: 12px;">
        ⏳ Waiting for you to click...
      </div>
    </div>
  `;

  // Find and animate cursor to target
  targetElement = findRelevantElement(task);
  
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    animateCursor(window.innerWidth / 2, window.innerHeight / 2, targetX, targetY, 1500);

    setTimeout(() => {
      // Smart tooltip positioning (avoid going off screen)
      let tooltipX = targetX + 20;
      let tooltipY = targetY - 50;
      
      // Keep tooltip on screen
      if (tooltipY < 10) tooltipY = targetY + rect.height + 10;
      if (tooltipX > window.innerWidth - 300) tooltipX = targetX - 300;
      
      tooltip.textContent = `Click here: ${targetElement.textContent.slice(0, 30) || 'button'}`;
      tooltip.style.left = tooltipX + 'px';
      tooltip.style.top = tooltipY + 'px';
      tooltip.style.display = 'block';
      
      waitingForClick = true;
    }, 1500);
  }
}

function findRelevantElement(task) {
  const allElements = document.querySelectorAll('button, a, input, select, [role="button"]');
  
  let target = null;
  const taskLower = task.toLowerCase();

  for (let el of allElements) {
    const text = el.textContent.toLowerCase();
    if (text.includes(taskLower.split(' ')[0]) || text.includes(taskLower.split(' ')[1])) {
      target = el;
      break;
    }
  }

  if (!target) {
    target = document.querySelector('button:not([style*="display: none"])');
  }

  return target;
}

function animateCursor(startX, startY, endX, endY, duration = 1500) {
  const startTime = Date.now();
  
  function step() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeProgress = progress < 0.5 
      ? 2 * progress * progress 
      : -1 + (4 - 2 * progress) * progress;

    const currentX = startX + (endX - startX) * easeProgress;
    const currentY = startY + (endY - startY) * easeProgress;

    cursor.style.left = (currentX - 20) + 'px';
    cursor.style.top = (currentY - 20) + 'px';
    cursor.style.display = 'block';
    cursor.style.boxShadow = `0 0 ${20 + progress * 10}px rgba(59, 130, 246, ${0.5 + progress * 0.3})`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      cursor.style.animation = 'pulse 0.6s ease-in-out 2';
    }
  }

  requestAnimationFrame(step);
}

// DETECT USER CLICKS - Move to next step
document.addEventListener('click', (e) => {
  if (!waitingForClick || !targetElement) return;

  // Check if user clicked the target (or nearby)
  const clickedElement = e.target;
  const isCorrectClick = clickedElement === targetElement || targetElement.contains(clickedElement);

  if (isCorrectClick) {
    waitingForClick = false;
    currentStepIndex++;
    
    // Celebrate!
    document.getElementById('currentGuidance').innerHTML = `
      <div class="current-step" style="background: #10b98114; border-left-color: #10b981;">
        ✅ Great! Step ${currentStepIndex} complete.
        <div style="margin-top: 8px;">
          ⏳ Moving to next step...
        </div>
      </div>
    `;

    // Get next step from AI
    setTimeout(() => {
      fetch(`${API_URL}/analyze-element`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementText: `Next step after clicking ${targetElement.textContent}`,
          elementType: 'NEXT_STEP',
          userRole: currentRole,
          currentPhase
        })
      })
      .then(r => r.json())
      .then(data => {
        executeStep(data.guidance, targetElement.textContent);
      })
      .catch(err => console.error('Error:', err));
    }, 1000);
  }
}, true); // Use capture phase to catch all clicks

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

// Hover detection (only when not in active guidance mode)
document.addEventListener('mousemove', (e) => {
  if (isInstrucing) return;

  const element = document.elementFromPoint(e.clientX, e.clientY);
  
  if (element && !element.closest('.guide-sidebar') && !element.closest('.guide-tab') && currentRole) {
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
        // Smart tooltip positioning
        let tooltipX = e.clientX + 20;
        let tooltipY = e.clientY - 50;
        
        if (tooltipY < 10) tooltipY = e.clientY + 20;
        if (tooltipX > window.innerWidth - 300) tooltipX = e.clientX - 300;
        
        tooltip.textContent = data.guidance;
        tooltip.style.left = tooltipX + 'px';
        tooltip.style.top = tooltipY + 'px';
        tooltip.style.display = 'block';
      })
      .catch(err => console.error('Error:', err));
    }
  } else {
    tooltip.style.display = 'none';
    if (!isInstrucing) cursor.style.display = 'none';
  }
});

console.log('✓ Frappe Guide loaded - AI will detect your clicks!');
