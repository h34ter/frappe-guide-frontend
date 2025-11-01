// embed.js - REAL-TIME PAGE READER & ADAPTIVE GUIDE
const API_URL = 'https://frappe-guide-backend.onrender.com';
let currentRole = null;
let sessionId = null;
let isGuiding = false;
let currentTask = null;
let pageMonitorInterval = null;

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let targetElement = null;
let waitingForClick = false;

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
      <option value="">Select your role...</option>
      <option value="warehouse_operator">Warehouse Operator</option>
      <option value="meat_shop_owner">Shop Owner</option>
      <option value="accountant">Accountant</option>
      <option value="procurement_manager">Procurement Manager</option>
    </select>
  </div>

  <div class="guide-section" id="taskSection" style="display:none;">
    <label>What do you want to do?</label>
    <input type="text" id="taskInput" placeholder="e.g., Create a purchase order" style="width:100%; padding:8px; border:1px solid #4B5563; background:#374151; color:#F3F4F6; border-radius:4px;">
    <button class="guide-btn" onclick="window.startGuiding()">Start Guide</button>
  </div>

  <div id="pageAnalysis" style="font-size:12px; color:#9CA3AF; margin-top:10px; max-height:150px; overflow-y:auto;">
  </div>

  <div id="currentGuidance"></div>
  
  <div id="statusIndicator" style="margin-top:10px; padding:8px; background:#374151; border-radius:4px; font-size:11px; color:#9CA3AF;">
    <span id="statusText">Idle</span>
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

// ============ PAGE READER ============
class PageReader {
  static getPageStructure() {
    const structure = {
      url: window.location.href,
      title: document.title,
      buttons: [],
      inputs: [],
      links: [],
      forms: [],
      modals: [],
      tables: []
    };

    // Collect clickable elements
    document.querySelectorAll('button, a[href], [role="button"]').forEach(el => {
      if (el.offsetHeight > 0 && el.offsetWidth > 0) {
        structure.buttons.push({
          text: el.textContent.slice(0, 50),
          visible: this.isInViewport(el),
          rect: el.getBoundingClientRect()
        });
      }
    });

    // Collect input fields
    document.querySelectorAll('input[type="text"], input[type="email"], select, textarea').forEach(el => {
      if (el.offsetHeight > 0) {
        structure.inputs.push({
          name: el.getAttribute('data-fieldname') || el.name,
          type: el.getAttribute('data-fieldtype') || el.type,
          visible: this.isInViewport(el),
          placeholder: el.placeholder
        });
      }
    });

    // Detect current module/form
    structure.currentModule = this.detectModule();
    structure.currentForm = this.detectForm();
    structure.currentPage = this.detectPage();

    return structure;
  }

  static isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
  }

  static detectModule() {
    const url = window.location.href;
    if (url.includes('/buying')) return 'Buying';
    if (url.includes('/selling')) return 'Selling';
    if (url.includes('/stock')) return 'Stock';
    if (url.includes('/accounting')) return 'Accounting';
    if (url.includes('/home')) return 'Home';
    return 'Unknown';
  }

  static detectForm() {
    const docType = document.querySelector('[data-doctype]');
    return docType ? docType.getAttribute('data-doctype') : null;
  }

  static detectPage() {
    if (document.querySelector('[data-page-length]')) return 'List';
    if (document.querySelector('.form-column')) return 'Form';
    if (document.querySelector('.sidebar-menu')) return 'Dashboard';
    return 'Unknown';
  }
}

// ============ SMART GUIDE ============
class SmartGuide {
  static async analyzeAndGuide(task, pageStructure) {
    const prompt = `You are a Frappe ERP expert guide. User wants to: "${task}"

Current page:
- Module: ${pageStructure.currentModule}
- Page Type: ${pageStructure.currentPage}
- Form: ${pageStructure.currentForm}
- Visible Buttons: ${pageStructure.buttons.map(b => b.text).join(', ').slice(0, 200)}
- Available Fields: ${pageStructure.inputs.map(i => i.name).join(', ').slice(0, 200)}

IMPORTANT: 
1. Give EXACT next step based on what's VISIBLE on screen NOW
2. If user needs to scroll, say "SCROLL_UP" or "SCROLL_DOWN" + direction
3. If element not visible, say "NAVIGATE_TO_X_MODULE" first
4. Be SHORT and DIRECT (1 sentence max)
5. Only suggest what's possible on current page

Respond in format:
ACTION: [CLICK_BUTTON | FILL_FIELD | NAVIGATE | SCROLL | WAIT]
TARGET: [exact button/field name or direction]
INSTRUCTION: [what user should do]
`;

    try {
      const response = await fetch(`${API_URL}/analyze-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, task, pageStructure, role: currentRole, sessionId })
      });

      const data = await response.json();
      return this.parseAIResponse(data.guidance, pageStructure);
    } catch (err) {
      console.error('Guide error:', err);
      return null;
    }
  }

  static parseAIResponse(guidance, pageStructure) {
    const lines = guidance.split('\n');
    const action = lines[0]?.split(':')[1]?.trim() || 'UNKNOWN';
    const target = lines[1]?.split(':')[1]?.trim() || '';
    const instruction = lines[2]?.split(':')[1]?.trim() || guidance;

    return { action, target, instruction, guidance };
  }

  static async executeGuidance(guidance, pageStructure) {
    switch (guidance.action) {
      case 'SCROLL':
        this.scrollToTarget(guidance.target);
        return { type: 'scroll', message: `Scroll ${guidance.target}` };

      case 'CLICK_BUTTON':
        const btn = this.findClosestButton(guidance.target, pageStructure);
        if (btn) {
          this.animateAndClick(btn);
          return { type: 'click', element: btn };
        }
        return { type: 'error', message: 'Button not found' };

      case 'FILL_FIELD':
        const field = this.findField(guidance.target, pageStructure);
        if (field) {
          this.highlightElement(field);
          return { type: 'highlight', element: field };
        }
        return { type: 'error', message: 'Field not found' };

      case 'NAVIGATE':
        return { type: 'navigate', message: `Go to ${guidance.target}` };

      default:
        return { type: 'instruction', message: guidance.instruction };
    }
  }

  static findClosestButton(targetName, pageStructure) {
    const buttons = document.querySelectorAll('button, a, [role="button"]');
    let closest = null;
    let closestScore = 0;

    buttons.forEach(btn => {
      const text = btn.textContent.toLowerCase();
      const target = targetName.toLowerCase();
      const score = this.textSimilarity(text, target);

      if (score > closestScore) {
        closestScore = score;
        closest = btn;
      }
    });

    return closestScore > 0.3 ? closest : null;
  }

  static findField(fieldName, pageStructure) {
    return document.querySelector(`[data-fieldname="${fieldName}"]`) ||
           document.querySelector(`input[name="${fieldName}"]`) ||
           document.querySelector(`select[name="${fieldName}"]`);
  }

  static textSimilarity(a, b) {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  static levenshteinDistance(a, b) {
    const costs = [];
    for (let i = 0; i <= a.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= b.length; j++) {
        if (i === 0) costs[j] = j;
        else if (j > 0) {
          let newValue = costs[j - 1];
          if (a.charAt(i - 1) !== b.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[b.length] = lastValue;
    }
    return costs[b.length];
  }

  static scrollToTarget(direction) {
    if (direction.includes('up') || direction.includes('UP')) {
      window.scrollBy({ top: -300, behavior: 'smooth' });
      cursor.innerHTML = '⬆️';
    } else if (direction.includes('down') || direction.includes('DOWN')) {
      window.scrollBy({ top: 300, behavior: 'smooth' });
      cursor.innerHTML = '⬇️';
    }
  }

  static animateAndClick(element) {
    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    this.animateCursor(cursorX, cursorY, targetX, targetY, 800);

    setTimeout(() => {
      tooltip.textContent = `Click: ${element.textContent.slice(0, 30)}`;
      tooltip.style.left = (targetX + 20) + 'px';
      tooltip.style.top = (targetY - 50) + 'px';
      tooltip.style.display = 'block';

      setTimeout(() => {
        element.click();
        waitingForClick = false;
      }, 500);
    }, 800);
  }

  static highlightElement(element) {
    const rect = element.getBoundingClientRect();
    element.style.outline = '3px solid #3B82F6';
    element.style.outlineOffset = '2px';

    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    this.animateCursor(cursorX, cursorY, targetX, targetY, 1000);
  }

  static animateCursor(startX, startY, endX, endY, duration = 1000) {
    const startTime = Date.now();
    cursorX = startX;
    cursorY = startY;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      cursorX = startX + (endX - startX) * easeProgress;
      cursorY = startY + (endY - startY) * easeProgress;

      cursor.style.left = (cursorX - 20) + 'px';
      cursor.style.top = (cursorY - 20) + 'px';
      cursor.style.display = 'block';
      cursor.style.boxShadow = `0 0 ${20 + progress * 10}px rgba(59, 130, 246, ${0.5 + progress * 0.3})`;
      cursor.innerHTML = '●';

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }
}

// ============ MAIN FLOW ============
window.startGuiding = function() {
  const task = document.getElementById('taskInput').value;
  if (!task) return alert('Enter what you want to do!');

  currentRole = document.getElementById('userRole').value;
  if (!currentRole) return alert('Select your role!');

  currentTask = task;
  isGuiding = true;

  document.getElementById('currentGuidance').innerHTML = `
    <div class="current-step" style="background:#f59e0b14;">
      ⏳ AI is analyzing the page...
    </div>
  `;

  // Start real-time page monitoring
  monitorPageAndGuide();
};

async function monitorPageAndGuide() {
  if (!isGuiding) return;

  const pageStructure = PageReader.getPageStructure();

  // Show page analysis
  document.getElementById('pageAnalysis').innerHTML = `
    <strong>Page:</strong> ${pageStructure.currentPage} (${pageStructure.currentModule})
    <br><strong>Form:</strong> ${pageStructure.currentForm || 'None'}
    <br><strong>Visible Buttons:</strong> ${pageStructure.buttons.filter(b => b.visible).length}
  `;

  const guidance = await SmartGuide.analyzeAndGuide(currentTask, pageStructure);

  if (guidance) {
    document.getElementById('currentGuidance').innerHTML = `
      <div class="current-step">
        <strong>Next Step:</strong>
        <p>${guidance.instruction}</p>
        <button class="guide-btn" onclick="window.skipStep()" style="margin-top:8px; font-size:12px;">I'm Stuck</button>
      </div>
    `;

    const result = await SmartGuide.executeGuidance(guidance, pageStructure);
    document.getElementById('statusText').textContent = `Action: ${guidance.action}`;
  }

  // Re-analyze every 2 seconds
  setTimeout(monitorPageAndGuide, 2000);
}

window.stopGuiding = function() {
  isGuiding = false;
  tooltip.style.display = 'none';
  cursor.style.display = 'none';
  clearInterval(pageMonitorInterval);
};

window.skipStep = function() {
  document.getElementById('currentGuidance').innerHTML = `
    <div class="current-step" style="background:#ef444414;">
      What's the issue? Tell me and I'll help differently.
    </div>
  `;
};

document.getElementById('userRole').addEventListener('change', () => {
  currentRole = document.getElementById('userRole').value;
  if (currentRole) {
    document.getElementById('taskSection').style.display = 'block';
  }
});

console.log('✓ Smart Real-Time Guide loaded!');
