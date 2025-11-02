/* ─── embed.js — Word-target cursor + female voice, panel preserved (paste full file) ─── */
(function(){
  if (window.FG_WORD_CURSOR_COACH_V2) return;
  window.FG_WORD_CURSOR_COACH_V2 = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0, atlas = [], chosenFeatureForLesson = null;
  let recording = false, recordEvents = [];

  /* =========================
     STYLES
     ========================= */
  const css = document.createElement('style');
  css.textContent = `
  .fg-cursor{position:fixed;width:56px;height:56px;border:4px solid #3B82F6;border-radius:50%;
    background:linear-gradient(180deg, rgba(59,130,246,.18), rgba(59,130,246,.08));box-shadow:0 8px 30px rgba(59,130,246,.25);
    z-index:2147483647;display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .28s ease,top .28s ease,opacity .18s}
  .fg-cursor-text{position:fixed;z-index:2147483646;background:transparent;pointer-events:none;font-weight:700;color:#0ea5e9;text-shadow:0 1px 6px rgba(0,0,0,.6);font-family:Inter,Arial}
  .fg-outline{outline:4px solid #3B82F6 !important; outline-offset:4px !important; border-radius:6px}
  .fg-panel{position:fixed;bottom:26px;right:26px;width:460px;background:#071024;border:1px solid rgba(59,130,246,.14);border-radius:12px;padding:12px;z-index:2147483645;color:#e6eef8;font-family:Inter,Arial;font-size:13px;box-shadow:0 10px 40px rgba(2,6,23,.6)}
  .fg-panel.compact{width:220px;padding:8px;right:26px;bottom:26px;border-radius:10px}
  .fg-hidden{display:none!important}
  .fg-hud{position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,.12);z-index:2147483655;font-family:Inter,Arial;font-size:13px;display:flex;gap:10px;align-items:center}
  .fg-debug{position:fixed;left:16px;bottom:12px;background:rgba(0,0,0,0.6);color:#fff;padding:6px 8px;border-radius:6px;font-size:12px;z-index:2147483655}
  .fg-tab{position:fixed;top:42%;right:6px;width:46px;height:130px;background:#071224;border:1px solid #1f2a38;border-radius:10px;
    display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;color:#9fb0c9;z-index:2147483650;cursor:pointer;box-shadow:0 8px 20px rgba(2,6,23,.5)}
  .fg-controls{display:flex;gap:8px}
  .fg-small{font-size:12px;color:#9fb0c9}
  .fg-stepcard{padding:10px;background:linear-gradient(90deg, rgba(59,130,246,.04), rgba(59,130,246,.02));border-left:4px solid #3B82F6;margin-top:10px;border-radius:6px}
  `;
  document.head.appendChild(css);

  /* =========================
     CORE DOM
     ========================= */
  const cursor = document.createElement('div'); cursor.className = 'fg-cursor'; cursor.textContent='●'; cursor.style.opacity='0'; document.body.appendChild(cursor);
  const cursorText = document.createElement('div'); cursorText.className='fg-cursor-text'; cursorText.style.opacity='0'; document.body.appendChild(cursorText);

  const panel = document.createElement('div'); panel.className = 'fg-panel'; panel.id='fg-panel-main';
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach <span class="fg-small" style="float:right;font-weight:600;color:#9fb0c9">Investor</span></h3>
    <div id="fg-setup">
      <input id="fg-job" placeholder="Job (e.g., Procurement Manager)" style="width:100%;padding:8px;border-radius:6px"/>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="fg-analyze" style="flex:1">Discover Opportunities</button>
        <button id="fg-enable-voice" style="flex:1;background:#071224;border:1px solid #183047">Enable Voice</button>
      </div>
      <div style="margin-top:8px;font-size:12px;color:#9fb0c9">Shortcuts: N=Next · P=Prev · R=Repeat · Space=Repeat · M=Minimize</div>
    </div>
    <div id="fg-lesson" class="fg-hidden">
      <div id="fg-info"></div>
      <div class="fg-controls" style="margin-top:8px">
        <button id="fg-repeat">Repeat</button>
        <button id="fg-stop" style="background:#ef4444">Stop</button>
        <button id="fg-minimize" style="background:#071224;border:1px solid #183047">Minimize</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const hud = document.createElement('div'); hud.className='fg-hud'; hud.innerHTML = `<div style="font-weight:700">LIVE DEMO</div><div id="fg-hud-txt" style="min-width:160px;opacity:.92">Idle</div>`; document.body.appendChild(hud);

  const debugEl = document.createElement('div'); debugEl.className='fg-debug'; debugEl.id='fg-debug'; debugEl.textContent='DBG: idle'; document.body.appendChild(debugEl);

  const tab = document.createElement('div'); tab.className='fg-tab fg-hidden'; tab.id='fg-tab'; tab.textContent='Demo'; document.body.appendChild(tab);

  /* =========================
     BINDINGS
     ========================= */
  const analyzeBtn = panel.querySelector('#fg-analyze');
  const voiceBtn = panel.querySelector('#fg-enable-voice');
  const repeatBtn = panel.querySelector('#fg-repeat');
  const stopBtn = panel.querySelector('#fg-stop');
  const minimizeBtn = panel.querySelector('#fg-minimize');
  const infoEl = panel.querySelector('#fg-info');

  analyzeBtn.onclick = runDiscovery;
  voiceBtn.onclick = enableVoice;
  repeatBtn.onclick = ()=> speakStep(stepIndex);
  stopBtn.onclick = stopLesson;
  minimizeBtn.onclick = minimizePanel;
  tab.onclick = restorePanel;

  /* =========================
     TTS: Female voice selection (unchanged)
     ========================= */
  let preferredVoice = null;
  function pickFemaleVoice(){
    if (!('speechSynthesis' in window)) return null;
    const want = ['female','Samantha','Allison','Karen','Sophie','Google UK English Female','Microsoft Zira','Salli','Joanna','Emma','Ivy','Victoria'];
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    for (const name of want){
      const v = voices.find(voice => (voice.name||'').toLowerCase().includes(name.toLowerCase()));
      if (v) return v;
    }
    const eng = voices.filter(v => v.lang && v.lang.startsWith('en'));
    if (eng.length) return eng[0];
    return voices[0];
  }
  function ensureVoicesLoaded(){
    return new Promise(resolve=>{
      let vs = window.speechSynthesis.getVoices();
      if (vs.length) { preferredVoice = pickFemaleVoice(); return resolve(); }
      window.speechSynthesis.onvoiceschanged = ()=>{ preferredVoice = pickFemaleVoice(); resolve(); };
      setTimeout(()=>{ preferredVoice = pickFemaleVoice(); resolve(); }, 800);
    });
  }
  async function enableVoice(){
    if (!('speechSynthesis' in window)){ alert('TTS not supported'); return; }
    await ensureVoicesLoaded();
    voiceBtn.textContent = 'Voice: On'; voiceBtn.disabled = true;
    hud.querySelector('#fg-hud-txt').textContent = 'Voice enabled';
    await speak('Voice enabled.');
  }
  async function speak(text){
    if (!text) return;
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      await ensureVoicesLoaded();
      const u = new SpeechSynthesisUtterance(text);
      if (preferredVoice) u.voice = preferredVoice;
      u.lang = 'en-US';
      return new Promise(res => { u.onend = res; u.onerror = res; window.speechSynthesis.speak(u); });
    } catch(e){ console.warn('TTS error', e); return; }
  }

  /* =========================
     Heuristics helpers (header detection)
     ========================= */
  function isHeaderElement(el){
    if (!el) return false;
    try {
      const rect = el.getBoundingClientRect();
      if (rect.top < 120) return true;
      let p = el; for (let i=0;i<6 && p;i++){ const cls = (p.className||'')+''; const id = (p.id||'')+''; if (/header|top|nav|logo|brand|topbar|desk-header|frappe-header/i.test(cls+id)) return true; p = p.parentElement; }
      return false;
    } catch(e){ return false; }
  }

  /* =========================
     Text-first search (word-target)
     ========================= */
  function findTextNodeElement(text){
    if (!text) return null;
    const needle = text.trim().toLowerCase();
    if (!needle) return null;
    // candidates visible, not header, short text preferred
    const candidates = Array.from(document.querySelectorAll('body *')).filter(e=>{
      try { if (!e.offsetParent) return false; if (isHeaderElement(e)) return false; return true; } catch(e){ return false; }
    });
    candidates.sort((a,b)=> (a.innerText||'').length - (b.innerText||'').length );
    for (const el of candidates){
      const txt = (el.innerText||'').trim().replace(/\s+/g,' ').toLowerCase();
      if (!txt) continue;
      // exact or includes
      if (txt === needle || txt.includes(needle) || needle.includes(txt)) return el;
    }
    // fallback: include all
    const all = Array.from(document.querySelectorAll('body *')).filter(e=>e.offsetParent);
    for (const el of all){
      const txt = (el.innerText||'').trim().replace(/\s+/g,' ').toLowerCase();
      if (!txt) continue;
      if (txt === needle || txt.includes(needle) || needle.includes(txt)) return el;
    }
    return null;
  }

  /* =========================
     Actionable detection (keeps robust rules)
     ========================= */
  function isActionable(el){
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (['button','a','input','select','textarea'].includes(tag)) return true;
    const role = (el.getAttribute && el.getAttribute('role')) || '';
    if (['button','link','menuitem','option'].includes(role)) return true;
    if (el.hasAttribute && el.hasAttribute('data-label')) return true;
    const cls = (el.className||'')+'';
    if (/\b(btn|btn-primary|action|link)\b/i.test(cls)) return true;
    try { if (typeof el.onclick === 'function') return true; if (el.getAttribute && el.getAttribute('onclick')) return true; } catch(e){}
    return false;
  }

  /* =========================
     Combined findElement (selector -> text -> actionable)
     ========================= */
  function findElement(selector, textFallback){
    debug(`findElement sel="${selector||''}" text="${(textFallback||'').slice(0,60)}"`);
    if (selector){
      try {
        const parts = selector.split(',').map(s=>s.trim()).filter(Boolean);
        for (const p of parts){
          try {
            const el = document.querySelector(p);
            if (el && el.offsetParent && !isHeaderElement(el)) {
              if (isActionable(el)) return el;
              return el;
            }
          } catch(e){}
        }
      } catch(e){}
    }
    const textEl = findTextNodeElement(textFallback || selector || '');
    if (textEl) return textEl;
    const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>e.offsetParent && !isHeaderElement(e));
    const needle = (textFallback||'').trim().toLowerCase();
    if (needle){
      for (const el of pool){
        const label = ((el.innerText||el.getAttribute('placeholder')||el.getAttribute('aria-label')||el.getAttribute('data-label')||'')+'').trim().toLowerCase();
        if (!label) continue;
        if (label === needle || label.includes(needle) || needle.includes(label)) return el;
      }
      for (const el of pool){
        const label = ((el.innerText||'')+'').trim().toLowerCase();
        if (label.includes(needle)) return el;
      }
    }
    return pool[0] || null;
  }

  /* =========================
     Highlight + point (points at element center; text label shown)
     ========================= */
  async function highlightAndPoint(el, labelForCursor){
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{ x.classList.remove('fg-outline'); x.removeAttribute('data-fg-highlight'); });
    cursorText.style.opacity='0';
    if (!el) { cursor.style.opacity='0'; cursor.style.display='none'; return; }
    try {
      let rect = el.getBoundingClientRect();
      // if element is huge try to find a smaller descendant
      if ((el.innerText||'').trim().length > 120){
        const smallChild = Array.from(el.querySelectorAll('*')).find(c => (c.innerText||'').trim().length>0 && (c.innerText||'').trim().length < 80 && c.offsetParent);
        if (smallChild) rect = smallChild.getBoundingClientRect();
      }
      try { el.scrollIntoView({ behavior:'smooth', block:'center', inline:'center' }); await waitForScrollToFinish(el); } catch(e){}
      await new Promise(r=>setTimeout(r,120));
      const left = (rect.left + rect.width/2 - 28) + window.scrollX;
      const top  = (rect.top  + rect.height/2 - 28) + window.scrollY;
      cursor.style.display='flex'; cursor.style.left = left + 'px'; cursor.style.top = top + 'px'; cursor.style.opacity='1';
      const displayText = (labelForCursor || (el.innerText||'')).trim().slice(0,40);
      if (displayText){
        cursorText.style.left = (left - 10) + 'px';
        cursorText.style.top = (top - 42) + 'px';
        cursorText.textContent = displayText;
        cursorText.style.opacity = '1';
      }
      if (isActionable(el)) { el.classList.add('fg-outline'); el.setAttribute('data-fg-highlight','true'); setTimeout(()=>{ try{ if(el && el.removeAttribute) { el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); } }catch(e){} },9000); }
      debug(`pointed -> ${describeEl(el)}`);
    } catch(err){ console.error('highlightAndPoint err', err); cursor.style.opacity='0'; cursorText.style.opacity='0'; }
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
        if (Date.now()-start > timeout) return resolve();
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  /* =========================
     Click tolerance: accept nearby clicks or text clicks
     ========================= */
  function isClickCloseEnough(clicked, expectedEl){
    if (!clicked || !expectedEl) return false;
    try {
      if (expectedEl === clicked || expectedEl.contains(clicked) || clicked.contains(expectedEl)) return true;
      const cLabel = ((clicked.innerText||clicked.getAttribute('aria-label')||clicked.getAttribute('data-label')||'')+'').trim().toLowerCase();
      const eLabel = ((expectedEl.innerText||expectedEl.getAttribute('aria-label')||expectedEl.getAttribute('data-label')||'')+'').trim().toLowerCase();
      if (cLabel && eLabel){
        const overlap = cLabel.split(/\s+/).filter(w => eLabel.includes(w));
        if (overlap.length >= Math.max(1, Math.round(Math.min(cLabel.split(/\s+/).length, eLabel.split(/\s+/).length)/2))) return true;
      }
      const rc = clicked.getBoundingClientRect(); const re = expectedEl.getBoundingClientRect();
      const dist = Math.hypot((rc.left+rc.width/2)-(re.left+re.width/2), (rc.top+rc.height/2)-(re.top+re.height/2));
      if (dist < 140) return true;
    } catch(e){}
    return false;
  }

  /* =========================
     Flow: discovery, start, display steps
     ========================= */
  async function runDiscovery(){
    const job = document.getElementById('fg-job').value.trim();
    if (!job) return alert('Enter job title');
    analyzeBtn.disabled = true; analyzeBtn.textContent = 'Analyzing...'; hud.querySelector('#fg-hud-txt').textContent = `Analyzing — ${job}`;
    try {
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry: '' }) });
      if (!r.ok) throw new Error('analyze-job failed ' + r.status);
      const data = await r.json();
      tutorial = data.tutorial || []; selectors = data.selectors || [];
      const at = await fetch(API + '/atlas'); atlas = await at.json();
      panel.classList.remove('fg-hidden'); // ensure full panel present
      panel.classList.remove('compact'); // full size by default
      panel.querySelector('#fg-setup').classList.add('fg-hidden');
      panel.querySelector('#fg-lesson').classList.remove('fg-hidden');
      stepIndex = 0; document.addEventListener('click', onClickHandler, true);
      // keep UI visible, but offer minimize control - user wanted the panel back
      await speak(`Starting demo for ${job}`);
      await displayStepAndPoint(0);
    } catch(e){
      console.error('Discovery error', e);
      hud.querySelector('#fg-hud-txt').textContent = 'Error';
      alert('Discovery failed: ' + String(e));
    } finally { analyzeBtn.disabled = false; analyzeBtn.textContent = 'Discover Opportunities'; }
  }

  async function displayStepAndPoint(i){
    const stepText = tutorial[i] || '';
    infoEl.innerHTML = `<div class="fg-stepcard"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${stepText}</div></div>`;
    hud.querySelector('#fg-hud-txt').textContent = `Step ${i+1}/${tutorial.length}`;
    const sel = selectors[i] || '';
    const el = findElement(sel, stepText);
    await highlightAndPoint(el, stepText);
    await speak(stepText);
  }

  async function speakStep(i){
    if (i<0 || i>=tutorial.length) return;
    const el = findElement(selectors[i], tutorial[i]);
    await highlightAndPoint(el, tutorial[i]);
    await speak(tutorial[i]);
  }

  async function onClickHandler(ev){
    if (stepIndex >= tutorial.length) return;
    const expectedSel = selectors[stepIndex] || '';
    let expectedEl = findElement(expectedSel, tutorial[stepIndex]);
    if (!expectedEl) expectedEl = findElement(null, tutorial[stepIndex]);
    const clicked = ev.target;
    debug(`click: clicked=${describeEl(clicked)} expected=${describeEl(expectedEl)}`);
    if (expectedEl && isClickCloseEnough(clicked, expectedEl)){
      stepIndex++;
      if (stepIndex >= tutorial.length){
        infoEl.innerHTML = `<div class="fg-stepcard" style="border-left-color:#10b981"><strong>✅ Demo complete</strong></div>`;
        await highlightAndPoint(null); cursor.style.opacity='0'; cursorText.style.opacity='0'; await speak("✅ Demo complete.");
        document.removeEventListener('click', onClickHandler, true);
        return;
      } else {
        await speak("Nice — moving to the next step."); displayStepAndPoint(stepIndex);
      }
    } else {
      await speak("Not quite — look for the highlighted word or control.");
      if (expectedEl) { await highlightAndPoint(expectedEl, tutorial[stepIndex]); try{ expectedEl.animate([{transform:'scale(1)'},{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:350}); }catch(e){} }
      else await speak("I can't find that exact control on this page.");
    }
  }

  function stopLesson(){
    tutorial=[]; selectors=[]; stepIndex=0;
    panel.querySelector('#fg-setup').classList.remove('fg-hidden');
    panel.querySelector('#fg-lesson').classList.add('fg-hidden');
    document.removeEventListener('click', onClickHandler, true);
    highlightAndPoint(null); cursorText.style.opacity='0';
    speak("Demo stopped.");
  }

  /* =========================
     Minimize / restore behavior (user wanted panel back and controllable)
     ========================= */
  function minimizePanel(){
    panel.classList.add('compact');
    // shrink content visually but keep essential controls
    // add tab to restore
    tab.classList.remove('fg-hidden');
    panel.style.transition = 'transform .18s ease, opacity .18s ease';
    panel.style.transform = 'translateY(6px)';
    hud.querySelector('#fg-hud-txt').textContent = 'Demo running — minimized';
  }
  function restorePanel(){
    tab.classList.add('fg-hidden');
    panel.classList.remove('compact');
    panel.style.transform = '';
    hud.querySelector('#fg-hud-txt').textContent = `Step ${Math.min(stepIndex+1, tutorial.length)}/${tutorial.length || 0}`;
  }

  /* =========================
     Utilities: selectors, describe, debug
     ========================= */
  function tryBuildSelector(el){
    try {
      if (!el) return '';
      if (el.id) return `#${el.id}`;
      const dl = el.getAttribute && (el.getAttribute('data-label') || el.getAttribute('data-doctype'));
      if (dl) return `[data-label="${dl}"]`;
      const cls = el.className && (el.className.split(/\s+/)[0]);
      if (cls) return `.${cls}`;
      const text = (el.innerText||'').trim().replace(/"/g,'').slice(0,40);
      if (text) return `button:has-text("${text}")`;
      return el.tagName.toLowerCase();
    } catch(e){ return 'unknown'; }
  }
  function describeEl(el){
    if (!el) return '(null)';
    try { return `${el.tagName.toLowerCase()} id=${el.id||''} cls="${(el.className||'').toString().slice(0,30)}" text="${(el.innerText||'').toString().slice(0,40).replace(/\s+/g,' ')}"`; } catch(e){ return '(describe error)'; }
  }
  function debug(msg){ try{ debugEl.textContent = 'DBG: ' + (msg||''); console.debug('FG_DBG', msg); }catch(e){} }

  /* =========================
     Keyboard shortcuts
     ========================= */
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'N' || e.key === 'n') { e.preventDefault(); if (stepIndex < tutorial.length-1) { stepIndex++; displayStepAndPoint(stepIndex); } }
    if (e.key === 'P' || e.key === 'p') { e.preventDefault(); if (stepIndex > 0) { stepIndex--; displayStepAndPoint(stepIndex); } }
    if (e.key === 'R' || e.key === 'r' || e.code === 'Space') { e.preventDefault(); speakStep(stepIndex); }
    if (e.key === 'M' || e.key === 'm') { e.preventDefault(); minimizePanel(); }
  });

  /* =========================
     Expose API to page for testing
     ========================= */
  window.FG_WORD_CURSOR_COACH = {
    runDiscovery, stopLesson, displayStepAndPoint, findElement, highlightAndPoint, minimizePanel, restorePanel
  };

  console.log('✅ FG_WORD_CURSOR_COACH_V2 loaded — panel-preserved, word-cursor + voice ready');
})();
