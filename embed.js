/* ────────── embed.js — Demo-first Live Teacher (paste-in) ────────── */
(function(){
  if (window.FG_DEMO_TEACHER) return;
  window.FG_DEMO_TEACHER = true;

  const API = "https://frappe-guide-backend.onrender.com"; // change if needed
  let tutorial = [], selectors = [], stepIndex = 0;
  let atlas = [];

  /* STYLES */
  const style = document.createElement('style');
  style.textContent = `
  .fg-cursor{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
    background:rgba(59,130,246,0.18);box-shadow:0 0 40px rgba(59,130,246,.9);z-index:2147483647;
    display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .35s ease,top .35s ease}
  .fg-panel{position:fixed;bottom:30px;right:30px;width:420px;background:#0f172a;border:2px solid #3B82F6;
    border-radius:10px;padding:18px;z-index:2147483646;color:#f3f4f6;font-family:Inter,Arial;font-size:13px}
  .fg-panel input,.fg-panel select{width:100%;padding:8px;margin:8px 0;border:1px solid #334155;background:#0b1220;color:#f3f4f6;border-radius:6px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700}
  .fg-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .fg-card{background:#071327;border:1px solid rgba(59,130,246,.12);padding:8px;border-radius:8px;min-height:70px;display:flex;flex-direction:column;justify-content:space-between}
  .fg-card h4{margin:0;font-size:13px;color:#fff}
  .fg-card p{margin:6px 0 0 0;font-size:12px;color:#9ca3af}
  .fg-card .fg-actions{display:flex;gap:6px;margin-top:8px}
  .fg-small{font-size:12px;color:#94a3b8}
  .fg-stepcard{padding:10px;background:rgba(59,130,246,0.06);border-left:3px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6 !important; outline-offset:4px !important}
  .fg-muted{color:#94a3b8;font-size:12px}
  `;
  document.head.appendChild(style);

  /* CURSOR */
  const cursor = document.createElement('div');
  cursor.className = 'fg-cursor';
  cursor.textContent = '●';
  document.body.appendChild(cursor);

  /* PANEL */
  const panel = document.createElement('div');
  panel.className = 'fg-panel';
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach</h3>
    <div id="fg-setup">
      <p class="fg-muted" style="margin:0 0 8px">Tell me your job — I'll show the most valuable Frappe features for you.</p>
      <input id="fg-job" placeholder="e.g., Procurement Manager" />
      <select id="fg-ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="fg-analyze" style="flex:1">Discover Opportunities</button>
        <button id="fg-skip" style="flex:1;background:#0b1220;border:1px solid #334155">Quick Start</button>
      </div>
    </div>

    <div id="fg-opps" style="display:none">
      <div class="fg-small">Top possibilities for your role</div>
      <div id="fg-cards" class="fg-cards"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-start-lesson" style="flex:1">Start Guided Demo</button>
        <button id="fg-back" style="flex:1;background:#0b1220;border:1px solid #334155">Back</button>
      </div>
      <div id="fg-choose-note" class="fg-muted" style="margin-top:8px">Preview a feature to hear a 2-line pitch, or choose 'Start Guided Demo' to begin the step-by-step walk-through.</div>
    </div>

    <div id="fg-lesson" style="display:none">
      <div id="fg-info"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-repeat" style="flex:1">Repeat Step</button>
        <button id="fg-stop" style="flex:1;background:#ef4444">Stop</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // controls
  const analyzeBtn = document.getElementById('fg-analyze');
  const skipBtn = document.getElementById('fg-skip');
  const backBtn = document.getElementById('fg-back');
  const startLessonBtn = document.getElementById('fg-start-lesson');
  const repeatBtn = document.getElementById('fg-repeat');
  const stopBtn = document.getElementById('fg-stop');
  const infoEl = document.getElementById('fg-info');
  const cardsEl = document.getElementById('fg-cards');

  analyzeBtn.onclick = runDiscovery;
  skipBtn.onclick = quickStart;
  backBtn.onclick = () => { document.getElementById('fg-opps').style.display='none'; document.getElementById('fg-setup').style.display='block'; };
  startLessonBtn.onclick = () => startLesson(chosenFeatureForLesson);
  repeatBtn.onclick = () => speakStep(stepIndex);
  stopBtn.onclick = stopLesson;

  let chosenFeatureForLesson = null;

  /* UTILS */

  async function speak(text){
    try {
      const r = await fetch(API + '/speak', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
      if (!r.ok) return;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      return new Promise(resolve => { audio.onended = () => { URL.revokeObjectURL(url); resolve(); }; });
    } catch (e) { console.error('speak error', e); }
  }

  function findElement(selector, textFallback){
    if (selector){
      try { const el = document.querySelector(selector); if (el && el.offsetParent !== null) return el; } catch(e){}
    }
    const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary'));
    const lower = (textFallback||'').toLowerCase();
    if (lower) {
      for (const el of pool){
        const text = ((el.innerText||el.getAttribute('placeholder')||el.getAttribute('aria-label')||el.getAttribute('data-label')||'')+'').trim().replace(/\s+/g,' ');
        if (!text) continue;
        if (text.toLowerCase().includes(lower) && el.offsetParent !== null) return el;
      }
    }
    const all = Array.from(document.querySelectorAll('body *'));
    for (const el of all){
      if (el.children.length>0) continue;
      const t = (el.innerText||'').trim();
      if (!t) continue;
      if (t.toLowerCase().includes(lower) && el.offsetParent !== null) return el;
    }
    return null;
  }

  function highlightAndPoint(el){
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{ x.classList.remove('fg-outline'); x.removeAttribute('data-fg-highlight'); });
    if (!el) { cursor.style.display='none'; return; }
    try { el.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e){}
    setTimeout(()=>{
      const rect = el.getBoundingClientRect();
      const left = rect.left + rect.width/2 - 30 + window.scrollX;
      const top = rect.top + rect.height/2 - 30 + window.scrollY;
      cursor.style.left = left + 'px'; cursor.style.top = top + 'px'; cursor.style.display = 'flex';
      el.classList.add('fg-outline'); el.setAttribute('data-fg-highlight','true');
      setTimeout(()=>{ if (el && el.getAttribute && el.getAttribute('data-fg-highlight')) { el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); } }, 8000);
    }, 300);
  }

  /* DISCOVERY (analyze -> atlas match -> cards UI) */
  async function runDiscovery(){
    const job = document.getElementById('fg-job').value.trim();
    const industry = document.getElementById('fg-ind').value;
    if (!job) return alert('Enter job title');

    analyzeBtn.disabled = true; analyzeBtn.textContent = 'Analyzing...';
    try {
      // generate initial tutorial + selectors (we will not auto-run it)
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial = data.tutorial || data.tutorials || [];
      selectors = data.selectors || data.selectors || [];
      // fetch atlas
      const at = await fetch(API + '/atlas'); atlas = await at.json();
      // compute related features: match by tutorial keywords + job text
      const keywords = [].concat(tutorial.map(t => (t||'').split(/\s+/).slice(-1)[0] || '')).filter(Boolean);
      const jobWords = job.split(/\s+/).map(s=>s.toLowerCase());
      const scored = atlas.map(a => {
        const label = (a.label||'').toLowerCase();
        let score = 0;
        for (const w of keywords) if (label.includes((w||'').toLowerCase())) score += 3;
        for (const w of jobWords) if (label.includes(w)) score += 2;
        if ((a.module||'').toLowerCase().includes(job.toLowerCase())) score += 2;
        return {a, score};
      }).filter(x=>x.score>0).sort((x,y)=>y.score-x.score).map(x=>x.a);

      // dedupe by label
      const seen = new Set();
      const related = [];
      for (const item of scored){
        const key = (item.label||item.name||'').toLowerCase();
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        related.push(item);
        if (related.length>=6) break;
      }

      // fallback: if nothing matched take top modules
      const fallback = atlas.slice(0,6);

      const cards = related.length ? related : fallback;
      showOpportunities(cards, job, industry);
    } catch(e){
      console.error('discover error', e);
      alert('Discovery failed — check backend.');
    } finally {
      analyzeBtn.disabled = false; analyzeBtn.textContent = 'Discover Opportunities';
    }
  }

  function showOpportunities(cards, job, industry){
    document.getElementById('fg-setup').style.display='none';
    document.getElementById('fg-opps').style.display='block';
    cardsEl.innerHTML = '';
    let first = null;
    for (const c of cards){
      const card = document.createElement('div'); card.className='fg-card';
      const title = document.createElement('h4'); title.textContent = c.label || c.name || '(no label)';
      const meta = document.createElement('p'); meta.textContent = (c.module ? (c.module + ' · ') : '') + (c.route || '');
      const actions = document.createElement('div'); actions.className='fg-actions';
      const preview = document.createElement('button'); preview.textContent='Preview'; preview.style.flex='1';
      const guide = document.createElement('button'); guide.textContent='Guide me'; guide.style.flex='1'; guide.style.background='#0b1220'; guide.style.border='1px solid #334155';
      actions.appendChild(preview); actions.appendChild(guide);
      card.appendChild(title); card.appendChild(meta); card.appendChild(actions);
      cardsEl.appendChild(card);

      // click handlers
      preview.onclick = async () => {
        // sales pitch: 2-line benefit
        const pitch = generatePitch(c, job, industry);
        await speak(pitch);
        // try highlight
        const el = findElement(null, c.label || c.name);
        if (el) {
          highlightAndPoint(el);
        } else {
          // briefly show modal text
          infoEl.innerHTML = `<div class="fg-stepcard"><strong>Preview:</strong><div style="margin-top:6px">${pitch}</div></div>`;
        }
      };
      guide.onclick = () => {
        chosenFeatureForLesson = { label: c.label, route: c.route };
        // if the analyze returned a tutorial that matches this feature, use it; otherwise use the original tutorial
        // start the prepared tutorial but allow it to be focused
        document.getElementById('fg-opps').style.display='none';
        startLesson(chosenFeatureForLesson);
      };

      if (!first) first = c;
    }

    // auto-speak elevator pitch for the top card
    if (cards && cards.length > 0) {
      const top = cards[0];
      const topPitch = generateElevator(top, document.getElementById('fg-job').value);
      speak(topPitch);
    }
  }

  // generate 2-line pitch for preview button
  function generatePitch(item, job, industry){
    const label = item.label || item.name || '';
    const module = item.module || '';
    return `${label} in ${module} helps ${job} cut manual work and speed up operations. Use it to capture data, automate approvals and reduce errors — a quick win for ${industry} teams.`;
  }
  // generate quick elevator
  function generateElevator(item, job){
    const label = item.label || item.name || '';
    return `Top suggestion: ${label}. This feature solves common ${job} problems like missing records and slow approvals — it shows how Frappe saves time and money.`;
  }

  /* QUICK START: immediately start the first returned tutorial without cards */
  async function quickStart(){
    const job = document.getElementById('fg-job').value.trim() || 'User';
    const industry = document.getElementById('fg-ind').value;
    analyzeBtn.disabled = true; analyzeBtn.textContent = 'Preparing...';
    try{
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial = data.tutorial || [];
      selectors = data.selectors || [];
      document.getElementById('fg-setup').style.display='none';
      document.getElementById('fg-opps').style.display='none';
      document.getElementById('fg-lesson').style.display='block';
      stepIndex = 0;
      document.addEventListener('click', onClickHandler, true);
      await speak(`Starting a quick guided demo for ${job}. I'll show you step by step.`);
      await displayStepAndPoint(0);
    }catch(e){ console.error('quick start err', e); alert('Quick start failed'); }
    finally { analyzeBtn.disabled=false; analyzeBtn.textContent='Discover Opportunities'; }
  }

  /* LESSON FLOW (same as before but starts after selection) */
  async function startLesson(feature){
    // feature may be null (use existing tutorial) or contain label/route
    if (!tutorial || tutorial.length === 0){
      // call analyze-job to get tutorial if missing
      const job = document.getElementById('fg-job').value.trim() || 'User';
      const industry = document.getElementById('fg-ind').value;
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial = data.tutorial || [];
      selectors = data.selectors || [];
    }
    // if feature is provided, try to reorder/use tutorial where first step matches feature label
    if (feature && feature.label && tutorial && tutorial.length){
      // naive: if first step doesn't mention label, prepend a contextual intro
      if (!tutorial[0].toLowerCase().includes((feature.label||'').toLowerCase())){
        tutorial.unshift(`Open ${feature.label} in ${feature.route || 'the app'}`);
        selectors.unshift(null);
      }
    }
    document.getElementById('fg-setup').style.display='none';
    document.getElementById('fg-opps').style.display='none';
    document.getElementById('fg-lesson').style.display='block';
    stepIndex = 0;
    document.addEventListener('click', onClickHandler, true);
    // spoken ROI pitch before starting
    await speak(`We're about to demo ${feature && feature.label ? feature.label + ' — ' : ''}a typical workflow. I'll explain why it matters, then show each step. Pay attention to the options available on each screen.`);
    await displayStepAndPoint(0);
  }

  async function displayStepAndPoint(i){
    const stepText = tutorial[i] || '';
    infoEl.innerHTML = `<div class="fg-stepcard"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${stepText}</div></div>`;
    const sel = selectors[i] || '';
    const el = findElement(sel, stepText);
    highlightAndPoint(el);
    await speak(stepText);
  }

  async function speakStep(i){
    if (i<0 || i>=tutorial.length) return;
    const el = findElement(selectors[i], tutorial[i]);
    highlightAndPoint(el);
    await speak(tutorial[i]);
  }

  async function onClickHandler(ev){
    if (stepIndex >= tutorial.length) return;
    const expectedSel = selectors[stepIndex] || '';
    let expectedEl = findElement(expectedSel, tutorial[stepIndex]);
    if (!expectedEl) expectedEl = findElement(null, tutorial[stepIndex]);
    const clicked = ev.target;
    if (expectedEl && (expectedEl === clicked || expectedEl.contains(clicked))){
      stepIndex++;
      if (stepIndex >= tutorial.length){
        infoEl.innerHTML = `<div class="fg-stepcard"><strong>✅ Demo complete — opportunity delivered</strong><div style="margin-top:6px">Recommend next steps: enable this workflow, train team, or run a sandbox demo.</div></div>`;
        highlightAndPoint(null);
        cursor.style.display='none';
        await speak("✅ Demo complete. That shows the core workflow and the available options. Ready for the next feature?");
        document.removeEventListener('click', onClickHandler, true);
        return;
      } else {
        await speak("Nice — moving to the next step.");
        displayStepAndPoint(stepIndex);
      }
    } else {
      await speak("Not quite — I'm pointing to the best option. Look for the highlighted control.");
      if (expectedEl) {
        highlightAndPoint(expectedEl);
        expectedEl.animate([{ transform:'scale(1)'},{ transform:'scale(1.03)'},{ transform:'scale(1)'}], {duration:350});
      } else {
        await speak("I can't find that specific control on this page. Check the left menu or search bar for related features.");
      }
    }
  }

  function stopLesson(){
    tutorial = []; selectors = []; stepIndex = 0;
    document.getElementById('fg-setup').style.display='block';
    document.getElementById('fg-opps').style.display='none';
    document.getElementById('fg-lesson').style.display='none';
    document.removeEventListener('click', onClickHandler, true);
    highlightAndPoint(null);
    cursor.style.display='none';
    speak("Demo stopped.");
  }

  // expose for debugging
  window.FG_DEMO = { runDiscovery, quickStart, startLesson, stopLesson, findElement };

  console.log('✅ Frappe Demo Coach loaded — use Discover Opportunities to begin');
})();
