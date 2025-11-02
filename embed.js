/* ────────── embed.js — Demo Coach: actionable-target cursor fix (FULL paste) ────────── */
(function(){
  if (window.FG_DEMO_COACH_ACTIONABLE) return;
  window.FG_DEMO_COACH_ACTIONABLE = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0;
  let atlas = [], chosenFeatureForLesson = null;

  /* STYLES */
  const style = document.createElement('style');
  style.textContent = `
  .fg-cursor{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
    background:rgba(59,130,246,0.18);box-shadow:0 0 40px rgba(59,130,246,.9);z-index:2147483647;
    display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .35s cubic-bezier(.2,.9,.2,1),top .35s cubic-bezier(.2,.9,.2,1),opacity .2s}
  .fg-panel{position:fixed;bottom:30px;right:30px;width:420px;background:#0f172a;border:2px solid #3B82F6;
    border-radius:10px;padding:18px;z-index:2147483646;color:#f3f4f6;font-family:Inter,Arial;font-size:13px;box-shadow:0 6px 24px rgba(2,6,23,.6)}
  .fg-panel input,.fg-panel select{width:100%;padding:8px;margin:8px 0;border:1px solid #334155;background:#0b1220;color:#f3f4f6;border-radius:6px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700}
  .fg-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .fg-card{background:#071327;border:1px solid rgba(59,130,246,.12);padding:8px;border-radius:8px;min-height:70px;display:flex;flex-direction:column;justify-content:space-between}
  .fg-card h4{margin:0;font-size:13px;color:#fff}
  .fg-card p{margin:6px 0 0 0;font-size:12px;color:#9ca3af}
  .fg-stepcard{padding:10px;background:rgba(59,130,246,0.06);border-left:3px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6 !important; outline-offset:4px !important}
  .fg-muted{color:#94a3b8;font-size:12px}
  .fg-tab{position:fixed;top:40%;right:6px;width:40px;height:120px;background:#0b1220;border:2px solid #334155;border-radius:8px;
    display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;color:#94a3b8;z-index:2147483650;cursor:pointer;box-shadow:0 6px 18px rgba(2,6,23,.5)}
  .fg-hidden{display:none !important}
  `;
  document.head.appendChild(style);

  /* CURSOR */
  const cursor = document.createElement('div');
  cursor.className = 'fg-cursor';
  cursor.style.opacity = '0';
  cursor.textContent = '●';
  document.body.appendChild(cursor);

  /* PANEL (same UI) */
  const panel = document.createElement('div');
  panel.className = 'fg-panel'; panel.id = 'fg-panel-main';
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach</h3>
    <div id="fg-setup">
      <p class="fg-muted" style="margin:0 0 8px">Tell me your job — I'll show valuable Frappe features for you.</p>
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
      <div id="fg-choose-note" class="fg-muted" style="margin-top:8px">Preview a feature to hear a 2-line pitch, or choose 'Start Guided Demo' to begin step-by-step.</div>
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

  /* MINIMIZED TAB */
  const tab = document.createElement('div');
  tab.className = 'fg-tab fg-hidden'; tab.id = 'fg-tab'; tab.textContent = 'Demo';
  document.body.appendChild(tab);

  // controls binding
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
  tab.onclick = () => { if (panel.classList.contains('fg-hidden')) { panel.classList.remove('fg-hidden'); tab.classList.add('fg-hidden'); } };

  /* --------------------------
     KEY FIX: Actionable-first element resolution
     -------------------------- */

  // returns true if element is actionable (clickable) by user
  function isActionable(el){
    if(!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (['button','a','input','select','textarea'].includes(tag)) return true;
    const role = (el.getAttribute && el.getAttribute('role')) || '';
    if (['button','link','menuitem'].includes(role)) return true;
    if (el.hasAttribute && el.hasAttribute('data-label')) return true;
    const cls = (el.className || '') + '';
    if (/\b(btn|btn-primary|action|link)\b/.test(cls)) return true;
    // visible and has onclick handler?
    try {
      if (typeof el.onclick === 'function') return true;
      // inline onclick attribute
      if (el.getAttribute && el.getAttribute('onclick')) return true;
    } catch(e){}
    return false;
  }

  // find nearest actionable element around a given element (sibling, parent, children, within same section)
  function findNearestActionable(startEl, opts = { maxParentDepth: 3, maxSearchRadius: 5 }){
    if (!startEl) return null;
    // 1) if startEl itself is actionable, return it
    if (isActionable(startEl)) return startEl;
    // 2) search its descendants (prefer immediate)
    const desc = startEl.querySelector && Array.from(startEl.querySelectorAll('*'));
    if (desc && desc.length){
      for (const d of desc){
        if (isActionable(d) && d.offsetParent !== null) return d;
      }
    }
    // 3) search siblings (breadth-limited)
    const parent = startEl.parentElement;
    if (parent){
      const siblings = Array.from(parent.children);
      for (const s of siblings){
        if (isActionable(s) && s.offsetParent !== null) return s;
        // children of sibling
        const childCandidate = s.querySelector && s.querySelector('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary');
        if (childCandidate && childCandidate.offsetParent !== null) return childCandidate;
      }
    }
    // 4) climb parents up to maxParentDepth and search their descendants
    let p = startEl.parentElement;
    let depth = 0;
    while (p && depth < opts.maxParentDepth){
      // look for actionable inside p
      const found = p.querySelector && p.querySelector('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary');
      if (found && found.offsetParent !== null) return found;
      p = p.parentElement; depth++;
    }
    // 5) radius search on document: find closest actionable by DOM distance using bounding rect center proximity
    const allClickable = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>e.offsetParent !== null);
    if (allClickable.length === 0) return null;
    try {
      const rect = startEl.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      let best = null; let bestDist = Infinity;
      for (const c of allClickable){
        const r = c.getBoundingClientRect();
        const ccx = r.left + r.width/2;
        const ccy = r.top + r.height/2;
        const d = Math.hypot(ccx - cx, ccy - cy);
        if (d < bestDist){ bestDist = d; best = c; }
      }
      // only return if reasonably close (avoid jumping across page)
      if (bestDist < Math.max(window.innerHeight, window.innerWidth) * 0.6) return best;
    } catch(e){}
    return null;
  }

  // main finder: tries selectors first, then actionable-first fuzzy search
  function findElement(selector, textFallback){
    // 1) try provided selector (robust CSS) and ensure actionable/visible
    if (selector){
      try {
        // if multiple selectors comma-separated, prefer the first actionable
        const parts = selector.split(',').map(s=>s.trim()).filter(Boolean);
        for (const p of parts){
          try{
            const el = document.querySelector(p);
            if (el && el.offsetParent !== null){
              // if el is not actionable, try to resolve nearest actionable inside/around it
              if (isActionable(el)) return el;
              const near = findNearestActionable(el);
              if (near) return near;
              // if not found, return the el only if it's something clickable (anchor etc) else continue
              // (but we avoid pointing to inert text)
            }
          }catch(e){}
        }
      } catch(e){}
    }

    // 2) actionable-first fuzzy search by text: look only inside clickable candidate pool
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

    // 3) fallback: find any element whose text matches, then resolve nearest actionable (prevents pointing to words)
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

    // 4) last resort: return first actionable in document
    const any = Array.from(document.querySelectorAll(poolSelectors)).filter(e=>e.offsetParent !== null);
    return any[0] || null;
  }

  /* Improved highlight + autoscroll + smooth cursor motion */
  async function highlightAndPoint(el){
    // clear previous
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{ x.classList.remove('fg-outline'); x.removeAttribute('data-fg-highlight'); });
    if (!el) { cursor.style.display='none'; cursor.style.opacity='0'; return; }

    // ensure element is actionable (if not, resolve nearest actionable)
    if (!isActionable(el)){
      const resolved = findNearestActionable(el) || el;
      el = resolved;
    }

    // smooth scroll to center
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center', inline:'center' }); await waitForScrollToFinish(el); } catch(e){}
    await new Promise(r=>setTimeout(r,120));

    const rect = el.getBoundingClientRect();
    const left = rect.left + rect.width/2 - 30 + window.scrollX;
    const top  = rect.top + rect.height/2 - 30 + window.scrollY;

    cursor.style.display = 'flex';
    cursor.style.opacity = '1';
    cursor.style.left = (left) + 'px';
    cursor.style.top = (top) + 'px';

    el.classList.add('fg-outline'); el.setAttribute('data-fg-highlight','true');
    setTimeout(()=>{ if(el && el.getAttribute && el.getAttribute('data-fg-highlight')) { el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); } }, 8000);
  }

  // wait for scroll heuristic (same as before)
  function waitForScrollToFinish(targetEl, timeout = 900){
    return new Promise(resolve => {
      const start = Date.now();
      const check = () => {
        try {
          const rect = targetEl.getBoundingClientRect();
          const centerY = window.innerHeight/2;
          const centerX = window.innerWidth/2;
          const dy = Math.abs((rect.top + rect.bottom)/2 - centerY);
          const dx = Math.abs((rect.left + rect.right)/2 - centerX);
          if (dy < 20 && dx < 40) return resolve();
        } catch(e){}
        if (Date.now() - start > timeout) return resolve();
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  /* Discovery + UI flow (unchanged behavior) */
  async function runDiscovery(){
    const job = document.getElementById('fg-job').value.trim();
    const industry = document.getElementById('fg-ind').value;
    if (!job) return alert('Enter job title');
    analyzeBtn.disabled = true; analyzeBtn.textContent = 'Analyzing...';
    try {
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial = data.tutorial || data.tutorials || [];
      selectors = data.selectors || data.selectors || [];
      const at = await fetch(API + '/atlas'); atlas = await at.json();
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
      for (const item of scored){
        const key = (item.label||item.name||'').toLowerCase();
        if (!key) continue; if (seen.has(key)) continue; seen.add(key); related.push(item); if (related.length>=6) break;
      }
      const cards = related.length ? related : atlas.slice(0,6);
      showOpportunities(cards, job, industry);
    } catch(e){
      console.error('discover error', e);
      alert('Discovery failed — check backend.');
    } finally { analyzeBtn.disabled = false; analyzeBtn.textContent = 'Discover Opportunities'; }
  }

  function showOpportunities(cards, job, industry){
    document.getElementById('fg-setup').style.display='none';
    document.getElementById('fg-opps').style.display='block';
    cardsEl.innerHTML = ''; let first = null;
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

      preview.onclick = async () => {
        const pitch = generatePitch(c, job, industry);
        await speak(pitch);
        // try find actionable for preview (resolve properly)
        const elCandidate = findElement(null, c.label || c.name);
        if (elCandidate) { await highlightAndPoint(elCandidate); } else {
          infoEl.innerHTML = `<div class="fg-stepcard"><strong>Preview:</strong><div style="margin-top:6px">${pitch}</div></div>`;
        }
      };
      guide.onclick = () => { chosenFeatureForLesson = { label: c.label, route: c.route }; document.getElementById('fg-opps').style.display='none'; startLesson(chosenFeatureForLesson); };

      if (!first) first = c;
    }
    if (cards && cards.length > 0) { const topPitch = generateElevator(cards[0], document.getElementById('fg-job').value); speak(topPitch); }
  }

  function generatePitch(item, job, industry){
    const label = item.label || item.name || '';
    const module = item.module || '';
    return `${label} in ${module} helps ${job} cut manual work and speed up operations. Use it to capture data, automate approvals and reduce errors — a quick win for ${industry} teams.`;
  }
  function generateElevator(item, job){
    const label = item.label || item.name || '';
    return `Top suggestion: ${label}. This feature solves common ${job} problems like missing records and slow approvals — it shows how Frappe saves time and money.`;
  }

  async function quickStart(){
    const job = document.getElementById('fg-job').value.trim() || 'User';
    const industry = document.getElementById('fg-ind').value;
    analyzeBtn.disabled = true; analyzeBtn.textContent = 'Preparing...';
    try{
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial = data.tutorial || [];
      selectors = data.selectors || [];
      document.getElementById('fg-setup').style.display='none'; document.getElementById('fg-opps').style.display='none'; document.getElementById('fg-lesson').style.display='block';
      stepIndex = 0; document.addEventListener('click', onClickHandler, true);
      await speak(`Starting a quick guided demo for ${job}. I'll show you step by step.`);
      await displayStepAndPoint(0);
    }catch(e){ console.error('quick start err', e); alert('Quick start failed'); }
    finally { analyzeBtn.disabled=false; analyzeBtn.textContent='Discover Opportunities'; }
  }

  async function startLesson(feature){
    if (!tutorial || tutorial.length === 0){
      const job = document.getElementById('fg-job').value.trim() || 'User';
      const industry = document.getElementById('fg-ind').value;
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial = data.tutorial || []; selectors = data.selectors || [];
    }
    if (feature && feature.label && tutorial && tutorial.length){
      if (!tutorial[0].toLowerCase().includes((feature.label||'').toLowerCase())){
        tutorial.unshift(`Open ${feature.label} in ${feature.route || 'the app'}`); selectors.unshift(null);
      }
    }
    // minimize UI
    panel.classList.add('fg-hidden'); tab.classList.remove('fg-hidden');
    document.getElementById('fg-setup').style.display='none'; document.getElementById('fg-opps').style.display='none'; document.getElementById('fg-lesson').style.display='block';
    stepIndex = 0; document.addEventListener('click', onClickHandler, true);
    await speak(`We're about to demo ${feature && feature.label ? feature.label + ' — ' : ''}a typical workflow. I'll explain why it matters, then show each step. Pay attention to the options available on each screen.`);
    await displayStepAndPoint(0);
  }

  async function displayStepAndPoint(i){
    const stepText = tutorial[i] || '';
    infoEl.innerHTML = `<div class="fg-stepcard"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${stepText}</div></div>`;
    const sel = selectors[i] || '';
    const el = findElement(sel, stepText);
    await highlightAndPoint(el);
    await speak(stepText);
  }

  async function speakStep(i){
    if (i<0 || i>=tutorial.length) return;
    const el = findElement(selectors[i], tutorial[i]);
    await highlightAndPoint(el);
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
        await highlightAndPoint(null);
        cursor.style.opacity='0';
        await speak("✅ Demo complete. That shows the core workflow and the available options. Ready for the next feature?");
        document.removeEventListener('click', onClickHandler, true);
        tab.classList.remove('fg-hidden'); panel.classList.add('fg-hidden');
        return;
      } else {
        await speak("Nice — moving to the next step.");
        displayStepAndPoint(stepIndex);
      }
    } else {
      await speak("Not quite — I'm pointing to the best option. Look for the highlighted control.");
      if (expectedEl) { await highlightAndPoint(expectedEl); try { expectedEl.animate([{ transform:'scale(1)'},{ transform:'scale(1.03)'},{ transform:'scale(1)'}], {duration:350}); } catch(e){} }
      else { await speak("I can't find that specific control on this page. Check the left menu or search bar for related features."); }
    }
  }

  function stopLesson(){
    tutorial = []; selectors = []; stepIndex = 0;
    document.getElementById('fg-setup').style.display='block'; document.getElementById('fg-opps').style.display='none'; document.getElementById('fg-lesson').style.display='none';
    document.removeEventListener('click', onClickHandler, true);
    highlightAndPoint(null); cursor.style.opacity='0'; panel.classList.remove('fg-hidden'); tab.classList.add('fg-hidden');
    speak("Demo stopped.");
  }

  // expose for debugging
  window.FG_DEMO = { runDiscovery, quickStart, startLesson, stopLesson, findElement };

  console.log('✅ Frappe Demo Coach (actionable-target fix) loaded — use Discover Opportunities to begin');
})();
