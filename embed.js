/* ─── embed.js — Fixed: voice + cursor robust + user-gesture TTS unlock ─── */
(function(){
  if (window.FG_INVESTOR_COACH_V2) {
    console.warn('FG_INVESTOR_COACH_V2 already loaded');
    return;
  }
  window.FG_INVESTOR_COACH_V2 = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0, atlas = [], chosenFeatureForLesson = null;
  let recording = false, recordEvents = [];

  /* ================= STYLES ================= */
  const css = document.createElement('style');
  css.textContent = `
  .fg-cursor{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
    background:linear-gradient(180deg, rgba(59,130,246,.18), rgba(59,130,246,.08));box-shadow:0 8px 30px rgba(59,130,246,.25);
    z-index:2147483647;display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .35s ease,top .35s ease,opacity .2s}
  .fg-panel{position:fixed;bottom:26px;right:26px;width:460px;background:#071024;border:1px solid rgba(59,130,246,.14);
    border-radius:12px;padding:16px;z-index:2147483646;color:#e6eef8;font-family:Inter,Arial;font-size:13px;box-shadow:0 10px 40px rgba(2,6,23,.6)}
  .fg-panel input,.fg-panel select{width:100%;padding:9px;margin:8px 0;border:1px solid #1f2a38;background:#071224;color:#e6eef8;border-radius:8px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700}
  .fg-small{font-size:12px;color:#9fb0c9}
  .fg-stepcard{padding:10px;background:linear-gradient(90deg, rgba(59,130,246,.04), rgba(59,130,246,.02));border-left:4px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6 !important; outline-offset:4px !important; border-radius:6px}
  .fg-hidden{display:none !important}
  .fg-hud{position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,.12);z-index:2147483655;font-family:Inter,Arial;font-size:13px;display:flex;gap:10px;align-items:center}
  .fg-badge{background:#072033;padding:6px 8px;border-radius:6px;border:1px solid #183047;color:#9fd0ff;font-weight:700}
  .fg-tab{position:fixed;top:42%;right:6px;width:46px;height:130px;background:#071224;border:1px solid #1f2a38;border-radius:10px;
    display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;color:#9fb0c9;z-index:2147483650;cursor:pointer;box-shadow:0 8px 20px rgba(2,6,23,.5)}
  .fg-options{position:fixed;right:500px;bottom:26px;background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;z-index:2147483650;max-height:320px;overflow:auto;width:360px;color:#cfe8ff}
  `;
  document.head.appendChild(css);

  /* ================= CORE DOM ================= */
  const cursor = document.createElement('div'); cursor.className = 'fg-cursor'; cursor.textContent = '●'; cursor.style.opacity='0'; document.body.appendChild(cursor);

  const panel = document.createElement('div'); panel.className = 'fg-panel'; panel.id='fg-panel-main';
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach <span class="fg-small" style="float:right;font-weight:600;color:#9fb0c9">Investor Mode</span></h3>
    <div id="fg-setup">
      <p class="fg-small" style="margin:0 0 8px">Enter a job and we'll show high-impact Frappe features tailored to that role.</p>
      <input id="fg-job" placeholder="e.g., Procurement Manager" />
      <select id="fg-ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="fg-analyze" style="flex:1">Discover Opportunities</button>
        <button id="fg-voice-enable" style="flex:1;background:#071224;border:1px solid #183047">Enable Voice</button>
      </div>
      <div class="fg-small" style="margin-top:8px">Shortcuts: N=Next · P=Prev · R=Repeat · Space=Repeat</div>
    </div>

    <div id="fg-opps" style="display:none">
      <div class="fg-small">Top possibilities for your role</div>
      <div id="fg-cards" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-start-lesson" style="flex:1">Start Guided Demo</button>
        <button id="fg-back" style="flex:1;background:#071224;border:1px solid #183047">Back</button>
      </div>
    </div>

    <div id="fg-lesson" style="display:none">
      <div id="fg-info"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-repeat" style="flex:1">Repeat</button>
        <button id="fg-stop" style="flex:1;background:#ef4444">Stop</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const hud = document.createElement('div'); hud.className = 'fg-hud'; hud.innerHTML = `<div class="fg-badge">LIVE DEMO</div><div id="fg-hud-txt" style="min-width:160px">Not running</div><div id="fg-record-ind" title="Recording status" style="color:#4b5563">●</div>`; document.body.appendChild(hud);
  const tab = document.createElement('div'); tab.className='fg-tab fg-hidden'; tab.id='fg-tab'; tab.textContent='Demo'; document.body.appendChild(tab);
  const optionsBox = document.createElement('div'); optionsBox.className='fg-options fg-hidden'; optionsBox.id='fg-options'; optionsBox.innerHTML = `<h4>Options near highlighted</h4><div id="fg-options-list"></div>`; document.body.appendChild(optionsBox);

  /* ================= BIND ELEMENTS ================= */
  const analyzeBtn = panel.querySelector('#fg-analyze');
  const voiceEnableBtn = panel.querySelector('#fg-voice-enable');
  const backBtn = panel.querySelector('#fg-back');
  const startLessonBtn = panel.querySelector('#fg-start-lesson');
  const repeatBtn = panel.querySelector('#fg-repeat');
  const stopBtn = panel.querySelector('#fg-stop');
  const infoEl = panel.querySelector('#fg-info');
  const cardsEl = panel.querySelector('#fg-cards');

  analyzeBtn.onclick = runDiscovery;
  voiceEnableBtn.onclick = enableVoiceGesture;
  backBtn.onclick = ()=>{ panel.querySelector('#fg-opps').style.display='none'; panel.querySelector('#fg-setup').style.display='block'; };
  startLessonBtn.onclick = ()=> startLesson(chosenFeatureForLesson);
  repeatBtn.onclick = ()=> speakStep(stepIndex);
  stopBtn.onclick = stopLesson;
  tab.onclick = ()=>{ panel.classList.remove('fg-hidden'); tab.classList.add('fg-hidden'); };

  /* ================= TTS: robust wrapper (returns Promise) ================= */
  // ensure speak is defined before any callers
  function supportsSpeechSynthesis(){ return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function'; }

  let _lastUtterance = null;
  function cancelSpeech(){ try { if (supportsSpeechSynthesis()) window.speechSynthesis.cancel(); } catch(e){} }

  async function speak(text){
    if (!text) return Promise.resolve();
    try {
      // if browser TTS available, use it
      if (supportsSpeechSynthesis()){
        cancelSpeech();
        return new Promise(resolve => {
          try {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'en-US';
            u.onend = ()=>{ _lastUtterance = null; resolve(); };
            u.onerror = (ev)=>{ console.warn('TTS error', ev); _lastUtterance = null; resolve(); };
            _lastUtterance = u;
            window.speechSynthesis.speak(u);
          } catch (e) { console.warn('TTS speak failed', e); resolve(); }
        });
      } else {
        // no speechSynthesis - just return immediately (could add remote TTS later)
        console.debug('TTS not supported in this browser');
        return Promise.resolve();
      }
    } catch(e){
      console.error('speak wrapper error', e); return Promise.resolve();
    }
  }

  async function enableVoiceGesture(){
    // some browsers require user gesture to allow audio; play a short silent utterance and a short beep text
    try {
      await speak('Voice enabled.'); // user gesture unlocks
      voiceEnableBtn.textContent = 'Voice Enabled';
      voiceEnableBtn.disabled = true;
      hud.querySelector('#fg-hud-txt').textContent = 'Voice enabled';
    } catch(e){ console.warn('enableVoiceGesture failed', e); alert('Voice enable failed. Use browser settings.'); }
  }

  /* ================= Actionable detection & cursor ================= */
  function isActionable(el){
    if(!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (['button','a','input','select','textarea'].includes(tag)) return true;
    const role = (el.getAttribute && el.getAttribute('role')) || '';
    if (['button','link','menuitem','option'].includes(role)) return true;
    if (el.hasAttribute && el.hasAttribute('data-label')) return true;
    const cls = (el.className || '') + '';
    if (/\b(btn|btn-primary|action|link)\b/.test(cls)) return true;
    try { if (typeof el.onclick === 'function') return true; if (el.getAttribute && el.getAttribute('onclick')) return true; } catch(e){}
    return false;
  }

  function findNearestActionable(startEl){
    if (!startEl) return null;
    if (isActionable(startEl) && startEl.offsetParent !== null) return startEl;
    try {
      const child = startEl.querySelector && startEl.querySelector('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary');
      if (child && child.offsetParent !== null) return child;
    } catch(e){}
    let p = startEl.parentElement, depth = 0;
    while (p && depth < 4){
      try {
        const cand = p.querySelector && p.querySelector('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary');
        if (cand && cand.offsetParent !== null) return cand;
      } catch(e){}
      p = p.parentElement; depth++;
    }
    const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(x=>x.offsetParent !== null);
    return pool[0] || null;
  }

  function findElement(selector, textFallback){
    try {
      if (selector){
        const parts = selector.split(',').map(s=>s.trim()).filter(Boolean);
        for (const p of parts){
          try {
            const el = document.querySelector(p);
            if (el && el.offsetParent !== null){
              if (isActionable(el)) return el;
              const near = findNearestActionable(el); if (near) return near;
            }
          } catch(e){}
        }
      }
      const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>e.offsetParent !== null);
      const lower = (textFallback||'').trim().toLowerCase();
      if (lower){
        // prefer exact or prefix matches
        for (const el of pool){
          const label = ((el.innerText||el.getAttribute('placeholder')||el.getAttribute('aria-label')||el.getAttribute('data-label')||'')+'').trim().replace(/\s+/g,' ').toLowerCase();
          if (!label) continue;
          if (label === lower || label.startsWith(lower) || new RegExp('\\b'+escapeRegex(lower)+'\\b').test(label)) return el;
        }
        // second pass: includes
        for (const el of pool){
          const label = ((el.innerText||'')+'').trim().toLowerCase();
          if (label.includes(lower)) return el;
        }
      }
      // fallback: nearest clickable in viewport
      return pool[0] || null;
    } catch(e){ console.error('findElement error', e); return null; }
  }

  function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

  async function highlightAndPoint(el){
    try {
      document.querySelectorAll('[data-fg-highlight]').forEach(x=>{ x.classList.remove('fg-outline'); x.removeAttribute('data-fg-highlight'); });
      if (!el){ cursor.style.display='none'; cursor.style.opacity='0'; return; }
      if (!isActionable(el)){
        const near = findNearestActionable(el); if (near) el = near;
      }
      if (!el){ cursor.style.display='none'; cursor.style.opacity='0'; return; }
      try { el.scrollIntoView({ behavior: 'smooth', block:'center', inline:'center' }); await waitForScrollToFinish(el); } catch(e){}
      await new Promise(r=>setTimeout(r,120));
      const rect = el.getBoundingClientRect();
      const left = rect.left + rect.width/2 - 30 + window.scrollX;
      const top  = rect.top + rect.height/2 - 30 + window.scrollY;
      cursor.style.display='flex'; cursor.style.left = left + 'px'; cursor.style.top = top + 'px'; cursor.style.opacity='1';
      el.classList.add('fg-outline'); el.setAttribute('data-fg-highlight','true');
      setTimeout(()=>{ try{ if (el && el.getAttribute && el.getAttribute('data-fg-highlight')){ el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); } }catch(e){} }, 9000);
    } catch(err){ console.error('highlightAndPoint failed', err); cursor.style.opacity='0'; }
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
          if (dy < 30 && dx < 40) return resolve();
        } catch(e){}
        if (Date.now() - start > timeout) return resolve();
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  /* ================= Flow: discovery & lesson ================= */
  async function runDiscovery(){
    const job = document.getElementById('fg-job').value.trim();
    const industry = document.getElementById('fg-ind').value;
    if (!job) return alert('Enter job title');
    analyzeBtn.disabled = true; analyzeBtn.textContent = 'Analyzing...';
    hud.querySelector('#fg-hud-txt').textContent = `Analyzing — ${job}`;
    try {
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      if (!r.ok) throw new Error('analyze-job failed ' + r.status);
      const data = await r.json();
      tutorial = data.tutorial || []; selectors = data.selectors || [];
      // fetch atlas
      const at = await fetch(API + '/atlas'); atlas = await at.json();
      const cards = scoreAtlasForRole(atlas, job, tutorial);
      showOpportunities(cards, job, industry);
      analyzeBtn.disabled = false; analyzeBtn.textContent = 'Discover Opportunities';
      hud.querySelector('#fg-hud-txt').textContent = `Ready — ${job}`;
    } catch(e){
      console.error('Discovery error', e);
      analyzeBtn.disabled = false; analyzeBtn.textContent = 'Discover Opportunities';
      hud.querySelector('#fg-hud-txt').textContent = 'Error';
      infoEl.innerHTML = `<div class="fg-stepcard" style="border-left-color:#ef4444"><strong>Backend error</strong><div style="margin-top:8px">${String(e)}</div></div>`;
    }
  }

  function scoreAtlasForRole(atlas, job, tutorial){
    const keywords = (tutorial||[]).map(t => (t||'').split(/\s+/).slice(-1)[0] || '').filter(Boolean);
    const jobWords = job.split(/\s+/).map(s=>s.toLowerCase());
    const scored = (atlas||[]).map(a => {
      const label = (a.label||'').toLowerCase();
      let score = 0;
      for (const w of keywords) if (label.includes((w||'').toLowerCase())) score += 3;
      for (const w of jobWords) if (label.includes(w)) score += 2;
      if ((a.module||'').toLowerCase().includes(job.toLowerCase())) score += 2;
      return {a, score};
    }).filter(x=>x.score>0).sort((x,y)=>y.score-x.score).map(x=>x.a);
    const seen = new Set(); const related = [];
    for (const item of scored){ const key=(item.label||item.name||'').toLowerCase(); if (!key) continue; if (seen.has(key)) continue; seen.add(key); related.push(item); if (related.length>=8) break; }
    return related.length?related: (atlas || []).slice(0,8);
  }

  function showOpportunities(cards, job, industry){
    panel.querySelector('#fg-setup').style.display='none';
    panel.querySelector('#fg-opps').style.display='block';
    cardsEl.innerHTML=''; chosenFeatureForLesson = null;
    for (const c of cards){
      const card = document.createElement('div'); card.style.background='#071327'; card.style.padding='10px'; card.style.borderRadius='8px';
      card.style.border = '1px solid rgba(59,130,246,.06)'; card.style.display='flex'; card.style.flexDirection='column'; card.style.justifyContent='space-between';
      const title = document.createElement('div'); title.textContent = c.label || c.name || '(no label)'; title.style.fontWeight='700';
      const meta = document.createElement('div'); meta.textContent = (c.module ? c.module + ' · ' : '') + (c.route||''); meta.style.color='#9fb0c9'; meta.style.fontSize='12px';
      const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.marginTop='8px';
      const preview = document.createElement('button'); preview.textContent='Preview'; const guide = document.createElement('button'); guide.textContent='Guide me'; guide.style.background='#071224'; guide.style.border='1px solid #183047';
      actions.appendChild(preview); actions.appendChild(guide);
      card.appendChild(title); card.appendChild(meta); card.appendChild(actions);
      cardsEl.appendChild(card);

      preview.onclick = async () => {
        const pitch = `${c.label || c.name} (${c.module}). Quick win: capture data, speed approvals, reduce errors.`;
        await speak(pitch);
        const elCandidate = findElement(null, c.label || c.name);
        if (elCandidate) { await highlightAndPoint(elCandidate); showOptionsNear(elCandidate); }
        else infoEl.innerHTML = `<div class="fg-stepcard"><strong>Preview:</strong><div style="margin-top:6px">${pitch}</div></div>`;
      };
      guide.onclick = () => { chosenFeatureForLesson = { label: c.label, route: c.route }; panel.querySelector('#fg-opps').style.display='none'; startLesson(chosenFeatureForLesson); };
    }
    // quick elevator
    if (cards && cards.length) speak(`Top suggestion: ${cards[0].label || cards[0].name}`);
  }

  async function quickStart(){
    const job = document.getElementById('fg-job').value.trim() || 'User';
    const industry = document.getElementById('fg-ind').value;
    analyzeBtn.disabled=true; analyzeBtn.textContent='Preparing...';
    try {
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial = data.tutorial || []; selectors = data.selectors || [];
      panel.querySelector('#fg-setup').style.display='none'; panel.querySelector('#fg-opps').style.display='none'; panel.querySelector('#fg-lesson').style.display='block';
      stepIndex=0; document.addEventListener('click', onClickHandler, true);
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
        tutorial.unshift(`Open ${feature.label}`);
        selectors.unshift(null);
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
    console.debug('displayStepAndPoint chosen element:', el, 'selector:', sel, 'textFallback:', stepText);
    await highlightAndPoint(el);
    showOptionsNear(el);
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
        infoEl.innerHTML = `<div class="fg-stepcard"><strong>✅ Demo complete</strong><div style="margin-top:6px">Recommend: enable workflow, train team, or run sandbox.</div></div>`;
        await highlightAndPoint(null); cursor.style.opacity='0'; await speak("✅ Demo complete.");
        document.removeEventListener('click', onClickHandler, true); tab.classList.remove('fg-hidden'); panel.classList.add('fg-hidden');
        return;
      } else {
        await speak("Nice — moving to the next step."); displayStepAndPoint(stepIndex);
      }
    } else {
      await speak("Not quite — I'm pointing to the best option. Look for the highlighted control.");
      if (expectedEl) { await highlightAndPoint(expectedEl); try{ expectedEl.animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:350}); }catch(e){} }
      else await speak("I can't find that exact control on this page. Use the left menu or search to find related features.");
    }
  }

  function stopLesson(){
    tutorial = []; selectors = []; stepIndex = 0;
    panel.querySelector('#fg-setup').style.display='block'; panel.querySelector('#fg-opps').style.display='none'; panel.querySelector('#fg-lesson').style.display='none';
    document.removeEventListener('click', onClickHandler, true); highlightAndPoint(null); cursor.style.opacity='0'; panel.classList.remove('fg-hidden'); tab.classList.add('fg-hidden');
    speak("Demo stopped.");
  }

  /* ================= Options / UI helpers ================= */
  function showOptionsNear(el){
    if (!el){ optionsBox.classList.add('fg-hidden'); return; }
    optionsBox.classList.remove('fg-hidden');
    const list = optionsBox.querySelector('#fg-options-list'); list.innerHTML = '';
    try {
      const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>e.offsetParent!==null);
      const base = el.getBoundingClientRect();
      const nearby = pool.map(p=>({p, r:p.getBoundingClientRect()})).filter(x=>{
        const d = Math.hypot((x.r.left + x.r.width/2) - (base.left + base.width/2), (x.r.top + x.r.height/2) - (base.top + base.height/2));
        return d < Math.max(window.innerWidth, window.innerHeight) * 0.6;
      }).slice(0,25);
      for (const row of nearby){
        const label = (row.p.innerText||row.p.getAttribute('placeholder')||row.p.getAttribute('aria-label')||row.p.getAttribute('data-label')||'').trim().replace(/\s+/g,' ');
        const selector = tryBuildSelector(row.p);
        const div = document.createElement('div'); div.style.display='flex'; div.style.justifyContent='space-between'; div.style.padding='6px'; div.style.borderBottom='1px dashed rgba(255,255,255,.03)';
        div.innerHTML = `<div style="max-width:62%">${label || '<no label>'}</div><div style="min-width:38%;text-align:right;color:#9fb0c9;font-size:12px">${selector}</div>`;
        list.appendChild(div);
      }
    } catch(e){ console.error('showOptionsNear error', e); optionsBox.classList.add('fg-hidden'); }
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

  /* ================= Keyboard shortcuts ================= */
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'N' || e.key === 'n') { e.preventDefault(); if (stepIndex < tutorial.length-1) { stepIndex++; displayStepAndPoint(stepIndex); } }
    if (e.key === 'P' || e.key === 'p') { e.preventDefault(); if (stepIndex > 0) { stepIndex--; displayStepAndPoint(stepIndex); } }
    if (e.key === 'R' || e.key === 'r' || e.code === 'Space') { e.preventDefault(); speakStep(stepIndex); }
  });

  /* expose debug API */
  window.FG_INVESTOR = {
    runDiscovery, quickStart, startLesson, stopLesson, findElement, highlightAndPoint, showOptionsNear
  };

  console.log('✅ Frappe Demo Coach v2 loaded (voice + cursor hardened)');
})();
