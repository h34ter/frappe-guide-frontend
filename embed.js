(function() {
  if (window.GUIDE_LOADED) return;
  window.GUIDE_LOADED = true;

  const API = 'https://frappe-guide-backend.onrender.com';
  let tutorial = [], step = 0, cursor, panel;

  // STYLES
  const s = document.createElement('style');
  s.textContent = `.gc{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;background:rgba(59,130,246,0.2);box-shadow:0 0 40px rgba(59,130,246,0.9);z-index:999999;display:flex;align-items:center;justify-content:center;font-size:28px;pointer-events:none}.gp{position:fixed;bottom:30px;right:30px;width:380px;background:#0f172a;border:2px solid #3B82F6;border-radius:10px;padding:20px;z-index:999998;color:#f3f4f6;font-family:Arial;font-size:13px}.gp input,.gp select{width:100%;padding:8px;margin:8px 0;border:1px solid #334155;background:#1e293b;color:#f3f4f6;border-radius:6px;font-size:12px}.gp button{width:100%;padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;margin:8px 0}.gh{display:none}.gs{padding:10px;background:rgba(59,130,246,0.1);border-left:3px solid #3B82F6;margin:10px 0;border-radius:4px}`;
  document.head.appendChild(s);

  cursor = document.createElement('div');
  cursor.className = 'gc';
  cursor.innerHTML = '●';
  cursor.style.display = 'none';
  document.body.appendChild(cursor);

  panel = document.createElement('div');
  panel.className = 'gp';
  panel.innerHTML = `<h3 style="margin:0 0 15px 0;color:#3B82F6">🤖 Frappe Guide</h3><div id="s1"><p>What's your job?</p><input id="job" placeholder="e.g., Procurement Manager"><select id="ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select><button onclick="window.startFrappe()">Analyze</button></div><div id="s2" class="gh"><div id="info"></div><button onclick="window.nextStep()">Next Step →</button></div>`;
  document.body.appendChild(panel);

  window.startFrappe = async function() {
    const job = document.getElementById('job').value;
    const ind = document.getElementById('ind').value;
    if (!job) return alert('Enter job!');

    document.getElementById('s1').classList.add('gh');
    document.getElementById('s2').classList.remove('gh');
    cursor.style.display = 'flex';

    // GET PERSONALIZED TUTORIAL
    const r = await fetch(`${API}/analyze-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job, industry: ind })
    });

    const data = await r.json();
    tutorial = data.tutorial || [];
    step = 0;

    document.getElementById('info').innerHTML = `<div class="gs"><strong>📚 Your Learning Path</strong><br>Modules: ${data.modules.join(', ')}<br>Features: ${data.features.join(', ')}<br><br><strong>First lesson:</strong> ${data.firstStep}<br>${data.why}</div>`;

    showStep();
  };

  async function showStep() {
    if (step >= tutorial.length) {
      document.getElementById('info').innerHTML = '<div class="gs"><strong>✅ Complete!</strong> You now understand this Frappe feature.</div>';
      cursor.style.display = 'none';
      return;
    }

    const elements = Array.from(document.querySelectorAll('button, a, input, select, [role="button"]')).map(e => (e.textContent || e.getAttribute('placeholder') || '').slice(0, 40)).filter(e => e);

    const r = await fetch(`${API}/next-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentStep: step, totalSteps: tutorial.length, tutorial, pageElements: elements.slice(0, 20) })
    });

    const data = await r.json();
    document.getElementById('info').innerHTML = `<div class="gs"><strong>Step ${data.step}/${tutorial.length}</strong><br>${data.instruction}</div>`;

    highlightElement(data.nextElement);
    step++;
  }

  function highlightElement(text) {
    const search = text.toLowerCase();
    const els = document.querySelectorAll('button, a, input, select, [role="button"]');

    for (let el of els) {
      const t = (el.textContent || el.getAttribute('placeholder') || '').toLowerCase();
      if (t.includes(search) && el.offsetHeight > 0) {
        const r = el.getBoundingClientRect();
        cursor.style.left = (r.left + r.width / 2 - 30) + 'px';
        cursor.style.top = (r.top + r.height / 2 - 30) + 'px';
        el.style.outline = '3px solid #3B82F6';
        el.style.outlineOffset = '2px';
        setTimeout(() => { el.style.outline = ''; }, 5000);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }

  window.nextStep = showStep;
  console.log('✅ Frappe Guide Loaded!');
})();
