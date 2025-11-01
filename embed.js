// embed.js
const API_URL = 'https://frappe-guide-backend.onrender.com'; // Your backend URL
let currentRole = null;
let currentPhase = 1;

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

  <div id="currentGuidance"></div>
`;
document.body.appendChild(sidebar);

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
  document.getElementById('currentGuidance').innerHTML = `
    <div class="phase-indicator">
      Phase ${currentPhase} Activated
    </div>
    <div class="current-step">
      Hover over buttons in Frappe to get guidance.
    </div>
  `;
};

document.getElementById('userRole').addEventListener('change', (e) => {
  currentRole = e.target.value;
  if (currentRole) window.loadPhases(currentRole);
});

document.addEventListener('mousemove', (e) => {
  const element = document.elementFromPoint(e.clientX, e.clientY);
  
  if (element && !element.closest('.guide-sidebar') && currentRole) {
    cursor.style.left = (e.clientX - 20) + 'px';
    cursor.style.top = (e.clientY - 20) + 'px';
    cursor.style.display = 'block';

    const elementText = element.textContent?.slice(0, 50) || element.getAttribute('aria-label') || '';
    const elementType = element.tagName;

    if (elementText.trim()) {
      fetch(`${API_URL}/analyze-element`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementText,
          elementType,
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
      .catch(err => console.error('API Error:', err));
    }
  } else {
    tooltip.style.display = 'none';
    cursor.style.display = 'none';
  }
});
