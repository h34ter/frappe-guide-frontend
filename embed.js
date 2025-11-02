/* ────────── embed.js — Investor-ready Demo Coach (STEPS REMOVED) ────────── */
(function(){
  if (window.FG_INVESTOR_COACH) return;
  window.FG_INVESTOR_COACH = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0, atlas = [], chosenFeatureForLesson = null;
  let recording = false, recordEvents = [];

  /* =======================
     STYLES
     ======================= */
  const css = document.createElement('style');
  css.textContent = `
  /* base */
  .fg-cursor{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
    background:linear-gradient(180deg, rgba(59,130,246,.18), rgba(59,130,246,.08));box-shadow:0 8px 30px rgba(59,130,246,.25);
    z-index:2147483647;display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .35s ease,top .35s ease,opacity .2s}
  .fg-panel{position:fixed;bottom:26px;right:26px;width:460px;background:#071024;border:1px solid rgba(59,130,246,.14);
    border-radius:12px;padding:16px;z-index:2147483646;color:#e6eef8;font-family:Inter,Arial;font-size:13px;box-shadow:0 10px 40px rgba(2,6,23,.6)}
  .fg-panel input,.fg-panel select{width:100%;padding:9px;margin:8px 0;border:1px solid #1f2a38;background:#071224;color:#e6eef8;border-radius:8px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700}
  .fg-small{font-size:12px;color:#9fb0c9}
  .fg-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .fg-card{background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;min-height:78px;display:flex;flex-direction:column;justify-content:space-between}
  .fg-card h4{margin:0;font-size:14px;color:#fff}
  .fg-card p{margin:6px 0 0 0;font-size:12px;color:#9fb0c9}
  .fg-stepcard{padding:10px;background:linear-gradient(90deg, rgba(59,130,246,.04), rgba(59,130,246,.02));border-left:4px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6 !important; outline-offset:4px !important; border-radius:6px}
  .fg-muted{color:#94a3b8;font-size:12px}
  .fg-tab{position:fixed;top:42%;right:6px;width:46px;height:130px;background:#071224;border:1px solid #1f2a38;border-radius:10px;
    display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;color:#9fb0c9;z-index:2147483650;cursor:pointer;box-shadow:0 8px 20px rgba(2,6,23,.5)}
  .fg-hidden{display:none !important}
  /* HUD (hidden by default to avoid interrupting) */
  .fg-hud{position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,.12);z-index:2147483655;font-family:Inter,Arial;font-size:13px;display:flex;gap:10px;align-items:center}
  .fg-badge{background:#072033;padding:6px 8px;border-radius:6px;border:1px solid #183047;color:#9fd0ff;font-weight:700}
  .fg-progress{height:8px;background:#0b1220;border-radius:8px;overflow:hidden;margin-top:8px}
  .fg-progress > i{display:block;height:100%;background:linear-gradient(90deg,#60a5fa,#3b82f6);width:0%}
  /* Options panel (hidden by default) */
  .fg-options{position:fixed;right:500px;bottom:26px;background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;z-index:2147483650;max-height:320px;overflow:auto;width:360px;color:#cfe8ff}
  .fg-options h4{margin:0 0 6px 0}
  .fg-option-row{display:flex;justify-content:space-between;padding:6px;border-bottom:1px dashed rgba(255,255,255,.03);font-size:13px}
  .fg-record{display:flex;gap:8px;align-items:center}
  .fg-controls{display:flex;gap:8px;margin-top:8px}
  .fg-cta{background:#10b981}
  `;
  document.head.appendChild(css);

  /* =======================
     CORE ELEMENTS
     ======================= */
  const cursor = document.createElement('div'); cursor.className='fg-cursor'; cursor.innerHTML='●'; cursor.style.opacity='0'; document.body.appendChild(cursor);

  const panel = document.createElement('div'); panel.className='fg-panel'; panel.id='fg-panel-main';
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach <span class="fg-small" style="float:right;font-weight:600;color:#9fb0c9">Investor Mode</span></h3>
    <div id="fg-setup">
      <p class="fg-small" style="margin:0 0 8px">Enter a job and we'll show high-impact Frappe features tailored to that role.</p>
      <input id="fg-job" placeholder="e.g., Procurement Manager" />
      <select id="fg-ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
      <div class="fg-controls">
        <button id="fg-analyze" style="flex:1">Discover Opportunities</button>
        <button id="fg-skip" style="flex:1;background:#071224;border:1px solid #183047">Quick Start</button>
      </div>
      <div style="margin-top:8px" class="fg-muted">Shortcuts: N=Next · P=Prev · R=Repeat · Space=Repeat · D=Download demo</div>
    </div>

    <div id="fg-opps" style="display:none">
      <div class="fg-small">Top possibilities for your role</div>
      <div id="fg-cards" class="fg-cards"></div>
      <div class="fg-controls" style="margin-top:10px">
        <button id="fg-start-lesson" style="flex:1">Start Guided Demo</button>
        <button id="fg-back" style="flex:1;background:#071224;border:1px solid #183047">Back</button>
      </div>
      <div id="fg-choose-note" class="fg-muted" style="margin-top:8px">Preview a feature to hear a short pitch, or choose 'Start Guided Demo'.</div>
    </div>

    <div id="fg-lesson" style="display:none">
      <div id="fg-info"></div>
      <div class="fg-controls" style="margin-top:10px">
        <button id="fg-repeat" style="flex:1">Repeat</button>
        <button id="fg-stop" style="flex:1;background:#ef4444">Stop</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // HUD (hidden by default)
  const hud = document.createElement('div'); hud.className='fg-hud fg-hidden';
  hud.innerHTML = `<div class="fg-badge">LIVE DEMO</div><div id="fg-hud-txt" style="min-width:180px">Not running</div><div style="margin-left:8px" id="fg-record-ind" title="Recording status">●</div>`;
  document.body.appendChild(hud);
  document.getElementById('fg-record-ind').style.color = '#4b5563'; // grey when off

  // options box (hidden by default)
  const optionsBox = document.createElement('div'); optionsBox.className='fg-options fg-hidden'; optionsBox.id='fg-options';
  optionsBox.innerHTML = `<h4>Options in viewport</h4><div id="fg-options-list" style="font-size:13px"></div>`;
  document.body.appendChild(optionsBox);

  // minimized tab (remains)
  const tab = document.createElement('div'); tab.className='fg-tab fg-hidden'; tab.id='fg-tab'; tab.textContent='Demo'; document.body.appendChild(tab);

  /* controls binding */
  const analyzeBtn = panel.querySelector('#fg-analyze');
  const skipBtn = panel.querySelector('#fg-skip');
  const backBtn = panel.querySelector('#fg-back');
  const startLessonBtn = panel.querySelector('#fg-start-lesson');
  const repeatBtn = panel.querySelector('#fg-repeat');
  const stopBtn = panel.querySelector('#fg-stop');
  const infoEl = panel.querySelector('#fg-info');
  const cardsEl = panel.querySelector('#fg-cards');
  analyzeBtn.onclick = runDiscovery; skipBtn.onclick = quickStart; backBtn.onclick = ()=>{ panel.querySelector('#fg-opps').style.display='none'; panel.querySelector('#fg-setup').style.display='block'; };
  startLessonBtn.onclick = ()=> startLesson(chosenFeatureForLesson); repeatBtn.onclick = ()=> speakStep(stepIndex); stopBtn.onclick = stopLesson; tab.onclick = ()=>{ panel.classList.remove('fg-hidden'); tab.classList.add('fg-hidden'); };

  /* -------------------------
     SPEAK / TTS (same robust fallback)
     ------------------------- */
  async function speak(text){
    if (!text) return;
    try {
      if ('speechSynthesis' in window){
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = 'en-US';
        return new Promise(resolve => { ut.onend = resolve; window.speechSynthesis.speak(ut); });
      }
    } catch(e){}
  }

  /* =========================
     Actionable matching + cursor logic (same robust approach)
     ========================= */
  function isActionable(el){
    if(!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (['button','a','input','select','textarea'].includes(tag)) return true;
    const role = (el.getAttribute && el.getAttribute('role')) || '';
    if (['button','link','menuitem'].includes(role)) return true;
    if (el.hasAttribute && el.hasAttribute('data-label')) return true;
    const cls = (el.className || '') + '';
    if (/\b(btn|btn-primary|action|link)\b/.test(cls)) return true;
    try { if (typeof el.onclick === 'function') return true; if (el.getAttribute && el.getAttribute('onclick')) return true; } catch(e){}
    return false;
  }

  function findNearestActionable(startEl, opts={maxParentDepth:3}){
    if (!startEl) return null;
    if (isActionable(startEl)) return startEl;

    // prefer actionable elements that are not in header/logo by excluding common header containers
    const headerCandidates = ['header','nav','.navbar','.topbar','.site-header','#header'];
    const desc = startEl.querySelector && Array.from(startEl.querySelectorAll('*'));
    if (desc && desc.length){
      for (const d of desc) if (isActionable(d) && d.offsetParent !== null && !headerCandidates.some(h=>closestMatch(d,h))) return d;
    }

    const parent = startEl.parentElement;
    if (parent){
      const siblings = Array.from(parent.children);
      for (const s of siblings){
        if (isActionable(s) && s.offsetParent !== null && !headerCandidates.some(h=>closestMatch(s,h))) return s;
        const childCandidate = s.querySelector && s.querySelector('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary');
        if (childCandidate && childCandidate.offsetParent !== null && !headerCandidates.some(h=>closestMatch(childCandidate,h))) return childCandidate;
      }
    }

    let p = startEl.parentElement; let depth = 0;
    while (p && depth < opts.maxParentDepth){
      const found = p.querySelector && p.querySelector('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary');
      if (found && found.offsetParent !== null && !headerCandidates.some(h=>closestMatch(found,h))) return found;
      p = p.parentElement; depth++;
    }

    const allClickable = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>e.offsetParent !== null && !headerCandidates.some(h=>closestMatch(e,h)));
    if (allClickable.length === 0) return null;
    try {
      const rect = startEl.getBoundingClientRect();
      const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
      let best=null, bestDist=Infinity;
      for (const c of allClickable){
        const r = c.getBoundingClientRect();
        const ccx = r.left + r.width/2, ccy = r.top + r.height/2;
        const d = Math.hypot(ccx-cx, ccy-cy);
        if (d < bestDist){ bestDist = d; best = c; }
      }
      if (bestDist < Math.max(window.innerHeight, window.innerWidth)*0.7) return best;
    } catch(e){}
    return null;
  }

  // helper used by header exclusion
  function closestMatch(el, selector){
    try {
      return el.closest && el.closest(selector);
    } catch(e){ return false; }
  }

  function findElement(selector, textFallback){
    if (selector){
      try {
        const parts = selector.split(',').map(s=>s.trim()).filter(Boolean);
        for (const p of parts){
          try{
            const el = document.querySelector(p);
            if (el && el.offsetParent !== null){
              if (isActionable(el)) return el;
              const near = findNearestActionable(el);
              if (near) return near;
            }
          }catch(e){}
        }
      } catch(e){}
    }
    const poolSelectors = 'button, a, input, select, [role="button"], [data-label], .btn, .btn-primary';
    const pool = Array.from(document.querySelectorAll(poolSelectors)).filter(e=>e.offsetParent !== null);
    const lower = (textFallback||'').toLowerCase();
    if (lower){
      for (const el of pool){
        const text = ((el.innerText||el.getAttribute('placeholder')||el.getAttribute('aria-label')||el.getAttribute('data-label')||'')+'').trim().replace(/\s+/g,' ');
        if (!text) continue;
        if (text.toLowerCase().includes(lower)) return el;
      }
    }
    if (lower){
      const all = Array.from(document.querySelectorAll('body *'));
      for (const el of all){
        if (el.children.length > 0) continue;
        const t = (el.innerText||'').trim();
        if (!t) continue;
        if (t.toLowerCase().includes(lower) && el.offsetParent !== null){
          const near = findNearestActionable(el);
          if (near) return near;
        }
      }
    }
    const any = Array.from(document.querySelectorAll(poolSelectors)).filter(e=>e.offsetParent !== null);
    // prefer center-of-screen items over header/logo (bias)
    any.sort((a,b)=>{
      try{
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const ca = Math.hypot((ra.left+ra.right)/2 - window.innerWidth/2, (ra.top+ra.bottom)/2 - window.innerHeight/2);
        const cb = Math.hypot((rb.left+rb.right)/2 - window.innerWidth/2, (rb.top+rb.bottom)/2 - window.innerHeight/2);
        return ca - cb;
      }catch(e){ return 0; }
    });
    return any[0] || null;
  }

  async function highlightAndPoint(el){
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{ x.classList.remove('fg-outline'); x.removeAttribute('data-fg-highlight'); });
    if (!el) { cursor.style.display='none'; cursor.style.opacity='0'; return; }
    if (!isActionable(el)) { const resolved = findNearestActionable(el) || el; el = resolved; }
    try { el.scrollIntoView({ behavior: 'smooth', block:'center', inline:'center' }); await waitForScrollToFinish(el); } catch(e){}
    await new Promise(r=>setTimeout(r,120));
    const rect = el.getBoundingClientRect();
    const left = rect.left + rect.width/2 - 30 + window.scrollX;
    const top = rect.top + rect.height/2 - 30 + window.scrollY;
    cursor.style.display='flex'; cursor.style.opacity='1'; cursor.style.left = left + 'px'; cursor.style.top = top + 'px';
    el.classList.add('fg-outline'); el.setAttribute('data-fg-highlight','true');
    setTimeout(()=>{ try{ if(el && el.getAttribute && el.getAttribute('data-fg-highlight')){ el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); } }catch(e){} }, 9000);
  }

  function waitForScrollToFinish(targetEl, timeout=900){
    return new Promise(resolve=>{
      const start = Date.now();
      const check = ()=>{
        try {
          const rect = targetEl.getBoundingClientRect();
          const centerY = window.innerHeight/2, centerX = window.innerWidth/2;
          const dy = Math.abs((rect.top+rect.bottom)/2 - centerY);
          const dx = Math.abs((rect.left+rect.right)/2 - centerX);
          if (dy < 24 && dx < 48) return resolve();
        } catch(e){}
        if (Date.now()-start > timeout) return resolve();
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  /* =========================
     Discovery / flow / recording
     ========================= */
  async function runDiscovery(){
    const job = document.getElementById('fg-job').value.trim();
    const industry = document.getElementById('fg-ind').value;
    if (!job) return alert('Enter job title');

    analyzeBtn.disabled = true; analyzeBtn.textContent = 'Analyzing...';
    hud.querySelector('#fg-hud-txt').textContent = `Analyzing — ${job}`;

    try {
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      if (!r.ok) throw new Error(`analyze-job ${r.status} ${r.statusText}`);
      const data = await r.json();
      tutorial = data.tutorial || []; selectors = data.selectors || [];
      // fetch atlas
      const at = await fetch(API + '/atlas'); atlas = await at.json();
      // present opportunities
      const cards = scoreAtlasForRole(atlas, job, tutorial);
      showOpportunities(cards, job, industry);
      analyzeBtn.disabled = false; analyzeBtn.textContent = 'Discover Opportunities';
      hud.querySelector('#fg-hud-txt').textContent = `Ready — ${job}`;
    } catch(err){
      analyzeBtn.disabled = false; analyzeBtn.textContent = 'Discover Opportunities';
      hud.querySelector('#fg-hud-txt').textContent = `Error`;
      infoEl.innerHTML = `<div class="fg-stepcard" style="border-left-color:#ef4444"><strong>Backend error</strong><div style="margin-top:8px">${String(err)}</div></div>`;
      console.error('Discovery error', err);
    }
  }

  function scoreAtlasForRole(atlas, job, tutorial){
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
    const seen = new Set(); const related = [];
    for (const item of scored){ const key=(item.label||item.name||'').toLowerCase(); if (!key) continue; if (seen.has(key)) continue; seen.add(key); related.push(item); if (related.length>=8) break; }
    return related.length?related:atlas.slice(0,8);
  }

  function showOpportunities(cards, job, industry){
    panel.querySelector('#fg-setup').style.display='none';
    panel.querySelector('#fg-opps').style.display='block';
    cardsEl.innerHTML='';
    chosenFeatureForLesson = null;
    for (const c of cards){
      const card = document.createElement('div'); card.className='fg-card';
      const title = document.createElement('h4'); title.textContent = c.label || c.name || '(no label)';
      const meta = document.createElement('p'); meta.textContent = (c.module ? (c.module + ' · ') : '') + (c.route || '');
      const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px';
      const preview = document.createElement('button'); preview.textContent='Preview';
      const guide = document.createElement('button'); guide.textContent='Guide me'; guide.style.background='#071224'; guide.style.border='1px solid #183047';
      actions.appendChild(preview); actions.appendChild(guide);
      card.appendChild(title); card.appendChild(meta); card.appendChild(actions);
      cardsEl.appendChild(card);

      preview.onclick = async () => {
        const pitch = generatePitch(c, job, industry);
        await speak(pitch);
        const elCandidate = findElement(null, c.label || c.name);
        if (elCandidate) { await highlightAndPoint(elCandidate); showOptionsNear(elCandidate); }
        else infoEl.innerHTML = `<div class="fg-stepcard"><strong>Preview:</strong><div style="margin-top:6px">${pitch}</div></div>`;
      };
      guide.onclick = () => { chosenFeatureForLesson = { label: c.label, route: c.route }; panel.querySelector('#fg-opps').style.display='none'; startLesson(chosenFeatureForLesson); };
    }
    if (cards && cards.length>0) speak(generateElevator(cards[0], document.getElementById('fg-job').value));
  }

  function generatePitch(item, job, industry){
    const label = item.label || item.name || '';
    const module = item.module || '';
    return `${label} in ${module} helps ${job} cut manual work and speed up operations. Use it to capture data, automate approvals and reduce errors — a quick win for ${industry} teams.`;
  }
  function generateElevator(item, job){ const label = item.label || item.name || ''; return `Top suggestion: ${label}. This feature solves common ${job} problems like missing records and slow approvals — demonstrates ROI quickly.`; }

  async function quickStart(){
    const job = document.getElementById('fg-job').value.trim() || 'User';
    const industry = document.getElementById('fg-ind').value;
    analyzeBtn.disabled=true; analyzeBtn.textContent='Preparing...';
    try {
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial = data.tutorial || []; selectors = data.selectors || [];
      panel.querySelector('#fg-setup').style.display='none'; panel.querySelector('#fg-opps').style.display='none'; panel.querySelector('#fg-lesson').style.display='block';
      stepIndex = 0; document.addEventListener('click', onClickHandler, true);
      await speak(`Starting quick demo for ${job}.`);
      await displayStepAndPoint(0);
    } catch(e){ console.error(e); alert('Quick start failed'); }
    finally { analyzeBtn.disabled=false; analyzeBtn.textContent='Discover Opportunities'; }
  }

  async function startLesson(feature){
    if (!tutorial || tutorial.length===0){
      const job = document.getElementById('fg-job').value.trim() || 'User'; const industry = document.getElementById('fg-ind').value;
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json(); tutorial = data.tutorial || []; selectors = data.selectors || [];
    }
    if (feature && feature.label && tutorial && tutorial.length){
      if (!tutorial[0].toLowerCase().includes((feature.label||'').toLowerCase())){
        tutorial.unshift(`Open ${feature.label} in ${feature.route || 'the app'}`); selectors.unshift(null);
      }
    }
    panel.classList.add('fg-hidden'); tab.classList.remove('fg-hidden');
    panel.querySelector('#fg-setup').style.display='none'; panel.querySelector('#fg-opps').style.display='none'; panel.querySelector('#fg-lesson').style.display='block';
    stepIndex=0; document.addEventListener('click', onClickHandler, true);
    await speak(`We'll demo ${feature && feature.label ? feature.label : 'this feature'}. I'll show options and next steps.`);
    await displayStepAndPoint(0);
  }

  async function displayStepAndPoint(i){
    const stepText = tutorial[i] || '';
    infoEl.innerHTML = `<div class="fg-stepcard"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${stepText}</div></div>`;
    const sel = selectors[i] || ''; const el = findElement(sel, stepText);
    await highlightAndPoint(el);
    // options panel will stay hidden by default (user can toggle with 'O')
    showOptionsNear(el); // populates list but stays hidden unless toggled
    await speak(stepText);
    pushRecord({ type:'step_shown', step:i, text:stepText, ts:Date.now() });
  }

  async function speakStep(i){
    if (i<0 || i>=tutorial.length) return;
    const el = findElement(selectors[i], tutorial[i]);
    await highlightAndPoint(el);
    await speak(tutorial[i]);
    pushRecord({ type:'step_spoken', step:i, ts:Date.now() });
  }

  async function onClickHandler(ev){
    if (stepIndex >= tutorial.length) return;
    const expectedSel = selectors[stepIndex] || '';
    let expectedEl = findElement(expectedSel, tutorial[stepIndex]);
    if (!expectedEl) expectedEl = findElement(null, tutorial[stepIndex]);
    const clicked = ev.target;
    pushRecord({ type:'click', target:describeEl(clicked), stepExpected:stepIndex, ts:Date.now() });
    if (expectedEl && (expectedEl === clicked || expectedEl.contains(clicked))){
      stepIndex++;
      if (stepIndex >= tutorial.length){
        infoEl.innerHTML = `<div class="fg-stepcard"><strong>✅ Demo complete</strong><div style="margin-top:6px">Recommend: enable workflow, train team, or run sandbox.</div></div>`;
        await highlightAndPoint(null); cursor.style.opacity='0'; await speak("✅ Demo complete.");
        document.removeEventListener('click', onClickHandler, true); tab.classList.remove('fg-hidden'); panel.classList.add('fg-hidden'); pushRecord({ type:'demo_complete', ts:Date.now() });
        return;
      } else {
        await speak("Nice — moving to the next step."); displayStepAndPoint(stepIndex);
      }
    } else {
      await speak("Not quite — I'm pointing to the best option. Look for the highlighted control.");
      if (expectedEl) { await highlightAndPoint(expectedEl); try{ expectedEl.animate([{transform:'scale(1)'} ,{ transform:'scale(1.03)'},{ transform:'scale(1)'}],{duration:350}); }catch(e){} }
      else await speak("I can't find that exact control on this page. Use the left menu or search to find related features.");
      pushRecord({ type:'wrong_click', target:describeEl(clicked), expected:describeEl(expectedEl), ts:Date.now() });
    }
  }

  function stopLesson(){
    tutorial=[]; selectors=[]; stepIndex=0;
    panel.querySelector('#fg-setup').style.display='block'; panel.querySelector('#fg-opps').style.display='none'; panel.querySelector('#fg-lesson').style.display='none';
    document.removeEventListener('click', onClickHandler, true); highlightAndPoint(null); cursor.style.opacity='0'; panel.classList.remove('fg-hidden'); tab.classList.add('fg-hidden');
    speak("Demo stopped."); pushRecord({ type:'demo_stopped', ts:Date.now() });
  }

  /* ==============================
     Options panel population, recording & utils
     ============================== */
  function showOptionsNear(el){
    if (!el) { optionsBox.querySelector('#fg-options-list').innerHTML=''; return; }
    const list = optionsBox.querySelector('#fg-options-list'); list.innerHTML = '';
    const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>e.offsetParent!==null);
    const base = el.getBoundingClientRect();
    const nearby = pool.map(p=>({p, r:p.getBoundingClientRect()})).filter(x=>{
      const d = Math.hypot((x.r.left + x.r.width/2) - (base.left + base.width/2), (x.r.top + x.r.height/2) - (base.top + base.height/2));
      return d < Math.max(window.innerWidth, window.innerHeight) * 0.6;
    }).slice(0,25);
    for (const row of nearby){
      const label = (row.p.innerText||row.p.getAttribute('placeholder')||row.p.getAttribute('aria-label')||row.p.getAttribute('data-label')||'').trim().replace(/\s+/g,' ');
      const selector = tryBuildSelector(row.p);
      const div = document.createElement('div'); div.className='fg-option-row';
      div.innerHTML = `<div style="max-width:62%">${label || '<no label>'}</div><div style="min-width:38%;text-align:right;color:#9fb0c9;font-size:12px">${selector}</div>`;
      list.appendChild(div);
    }
  }

  function tryBuildSelector(el){
    try {
      if (el.id) return `#${el.id}`;
      const dl = el.getAttribute && (el.getAttribute('data-label') || el.getAttribute('data-doctype'));
      if (dl) return `[data-label="${dl}"]`;
      const cls = el.className && (el.className.split(/\s+/)[0]);
      if (cls) return `.${cls}`;
      const text = (el.innerText||'').trim().replace(/"/g,'').slice(0,40);
      if (text) return `button:has-text("${text}")`;
      return el.tagName.toLowerCase();
    } catch(e){ return el.tagName.toLowerCase(); }
  }

  function describeEl(el){
    if (!el) return null;
    return { tag: el.tagName.toLowerCase(), text: (el.innerText||'').slice(0,80).trim(), id: el.id||null, cls: el.className||null };
  }

  /* =========================
     Recording utilities
     ========================= */
  function pushRecord(obj){
    if (!recording) return;
    recordEvents.push(Object.assign({ ts: Date.now() }, obj));
  }

  function startRecording(){
    recording = true; recordEvents = []; document.getElementById('fg-record-ind').style.color = '#10b981'; pushRecord({ type:'record_start', ts:Date.now() }); hud.querySelector('#fg-hud-txt').textContent = 'Recording';
  }
  function stopRecording(){
    recording = false; document.getElementById('fg-record-ind').style.color = '#4b5563'; pushRecord({ type:'record_stop', ts:Date.now() }); hud.querySelector('#fg-hud-txt').textContent = 'Ready';
  }
  function downloadRecording(){
    const blob = new Blob([JSON.stringify({ events: recordEvents, metadata:{ job: document.getElementById('fg-job').value, created: new Date().toISOString() } }, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `frappe-demo-${Date.now()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  /* =========================
     Keyboard bindings for investor control (H: HUD, O: Options)
     ========================= */
  document.addEventListener('keydown', (e)=>{
    // core navigation
    if (e.key === 'N' || e.key === 'n') { e.preventDefault(); if (stepIndex < tutorial.length-1) { stepIndex++; displayStepAndPoint(stepIndex); } }
    if (e.key === 'P' || e.key === 'p') { e.preventDefault(); if (stepIndex > 0) { stepIndex--; displayStepAndPoint(stepIndex); } }
    if (e.key === 'R' || e.key === 'r' || e.code === 'Space') { e.preventDefault(); speakStep(stepIndex); }
    if (e.key === 'D' || e.key === 'd') { e.preventDefault(); if (recording) downloadRecording(); else alert('No recording available'); }
    if (e.key === 'T' || e.key === 't') { e.preventDefault(); startRecording(); alert('Recording started'); }

    // UI toggles (hidden by default to avoid interrupting)
    if (e.key === 'H' || e.key === 'h'){ // toggle HUD
      e.preventDefault();
      hud.classList.toggle('fg-hidden');
    }
    if (e.key === 'O' || e.key === 'o'){ // toggle Options panel
      e.preventDefault();
      optionsBox.classList.toggle('fg-hidden');
    }
  });

  /* =========================
     Helper: build brief selector (used for options)
     ========================= */
  function buildSimpleSelector(el){
    if (!el) return '';
    if (el.id) return `#${el.id}`;
    const cls = (el.className||'').split(/\s+/).filter(Boolean)[0];
    if (cls) return `.${cls}`;
    const dl = el.getAttribute && (el.getAttribute('data-label') || el.getAttribute('data-doctype'));
    if (dl) return `[data-label="${dl}"]`;
    return el.tagName.toLowerCase();
  }

  /* expose runtime controls on HUD (click to toggle record / options) */
  hud.addEventListener('click', (e)=>{
    if (e.target && e.target.id === 'fg-record-ind'){
      if (!recording) startRecording(); else stopRecording();
    }
  });

  // options toggle (double-click HUD) — still works if you reveal HUD
  hud.addEventListener('dblclick', ()=>{ optionsBox.classList.toggle('fg-hidden'); });

  /* =========================
     Small utility: create debug element selector explorer
     ========================= */
  function showAllOptionsInView(){
    const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>e.offsetParent!==null);
    optionsBox.classList.remove('fg-hidden'); const list = optionsBox.querySelector('#fg-options-list'); list.innerHTML = '';
    pool.slice(0,200).forEach(p=>{
      const label = (p.innerText||p.getAttribute('placeholder')||p.getAttribute('aria-label')||p.getAttribute('data-label')||'').trim().replace(/\s+/g,' ');
      const selector = tryBuildSelector(p);
      const div = document.createElement('div'); div.className='fg-option-row'; div.innerHTML = `<div style="max-width:62%">${label||'<no label>'}</div><div style="min-width:38%;text-align:right;color:#9fb0c9;font-size:12px">${selector}</div>`; list.appendChild(div);
    });
  }

  /* =========================
     Utility: try to click or open a route if route present (not used automatically)
     ========================= */
  function openRouteIfAvailable(route){
    try {
      if (!route) return false;
      if (window.location.href.includes(route)) return true;
      const a = Array.from(document.querySelectorAll('a[href]')).find(x => (x.href||'').includes(route));
      if (a){ a.click(); return true; }
      return false;
    } catch(e){ return false; }
  }

  /* =========================
     Small helpers
     ========================= */
  function tryParseJSON(t){ try{ return JSON.parse(t); }catch(e){ return null; } }

  /* =========================
     Expose API for debugging & final logging
     ========================= */
  window.FG_INVESTOR = {
    runDiscovery, quickStart, startLesson, stopLesson, findElement, highlightAndPoint, startRecording, stopRecording, downloadRecording, showAllOptionsInView
  };

  console.log('✅ Frappe Demo Coach — Investor edition loaded (STEPS REMOVED)');
})();
