/* ─── embed.js — Word-target cursor + female voice (paste whole file) ─── */
(function(){
  if (window.FG_WORD_CURSOR_COACH) return;
  window.FG_WORD_CURSOR_COACH = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0, atlas = [], chosenFeatureForLesson = null;
  let recording = false, recordEvents = [];

  /* ===== STYLES ===== */
  const css = document.createElement('style');
  css.textContent = `
  .fg-cursor{position:fixed;width:56px;height:56px;border:4px solid #3B82F6;border-radius:50%;
    background:linear-gradient(180deg, rgba(59,130,246,.18), rgba(59,130,246,.08));box-shadow:0 8px 30px rgba(59,130,246,.25);
    z-index:2147483647;display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .28s ease,top .28s ease,opacity .18s}
  .fg-cursor-text{position:fixed;z-index:2147483646;background:transparent;pointer-events:none;font-weight:700;color:#0ea5e9;text-shadow:0 1px 6px rgba(0,0,0,.6);font-family:Inter,Arial}
  .fg-outline{outline:4px solid #3B82F6 !important; outline-offset:4px !important; border-radius:6px}
  .fg-panel{position:fixed;bottom:26px;right:26px;width:460px;background:#071024;border:1px solid rgba(59,130,246,.14);border-radius:12px;padding:12px;z-index:2147483645;color:#e6eef8;font-family:Inter,Arial;font-size:13px}
  .fg-hidden{display:none!important}
  .fg-hud{position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,.12);z-index:2147483655;font-family:Inter,Arial;font-size:13px;display:flex;gap:10px;align-items:center}
  .fg-debug{position:fixed;left:16px;bottom:12px;background:rgba(0,0,0,0.6);color:#fff;padding:6px 8px;border-radius:6px;font-size:12px;z-index:2147483655}
  `;
  document.head.appendChild(css);

  /* ===== DOM ===== */
  const cursor = document.createElement('div'); cursor.className = 'fg-cursor'; cursor.textContent='●'; cursor.style.opacity='0'; document.body.appendChild(cursor);
  const cursorText = document.createElement('div'); cursorText.className='fg-cursor-text'; cursorText.style.opacity='0'; document.body.appendChild(cursorText);

  const panel = document.createElement('div'); panel.className = 'fg-panel'; panel.id='fg-panel-main';
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach</h3>
    <div id="fg-setup">
      <input id="fg-job" placeholder="Job (e.g., Procurement Manager)" style="width:100%;padding:8px;border-radius:6px"/>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="fg-analyze" style="flex:1">Discover Opportunities</button>
        <button id="fg-enable-voice" style="flex:1;background:#071224;border:1px solid #183047">Enable Voice</button>
      </div>
      <div style="margin-top:8px;font-size:12px;color:#9fb0c9">Shortcuts: N=Next · P=Prev · R=Repeat · Space=Repeat</div>
    </div>
    <div id="fg-lesson" class="fg-hidden">
      <div id="fg-info"></div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="fg-repeat">Repeat</button>
        <button id="fg-stop" style="background:#ef4444">Stop</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const hud = document.createElement('div'); hud.className='fg-hud'; hud.innerHTML = `<div style="font-weight:700">LIVE DEMO</div><div id="fg-hud-txt" style="min-width:160px;opacity:.92">Idle</div>`; document.body.appendChild(hud);
  const debugEl = document.createElement('div'); debugEl.className='fg-debug'; debugEl.id='fg-debug'; debugEl.textContent='DBG: idle'; document.body.appendChild(debugEl);

  /* ===== ELEMENT BINDINGS ===== */
  const analyzeBtn = panel.querySelector('#fg-analyze');
  const voiceBtn = panel.querySelector('#fg-enable-voice');
  const repeatBtn = panel.querySelector('#fg-repeat');
  const stopBtn = panel.querySelector('#fg-stop');
  const infoEl = panel.querySelector('#fg-info');

  analyzeBtn.onclick = runDiscovery;
  voiceBtn.onclick = enableVoice;
  repeatBtn.onclick = ()=> speakStep(stepIndex);
  stopBtn.onclick = stopLesson;

  /* ===== TTS: pick a female voice if available ===== */
  let preferredVoice = null;
  function pickFemaleVoice(){
    if (!('speechSynthesis' in window)) return null;
    const want = ['female','Samantha','Allison','Karen','Sophie','Google UK English Female','Microsoft Zira','Salli','Joanna','Emma','Ivy','Victoria'];
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    // try names first
    for (const name of want){
      const v = voices.find(voice => (voice.name||'').toLowerCase().includes(name.toLowerCase()));
      if (v) return v;
    }
    // fallback: choose English female by lang and gender hint in name
    const eng = voices.filter(v => v.lang && v.lang.startsWith('en'));
    if (eng.length) return eng[0];
    return voices[0];
  }
  // ensure voices loaded (async)
  function ensureVoicesLoaded(){
    return new Promise(resolve=>{
      let vs = window.speechSynthesis.getVoices();
      if (vs.length) { preferredVoice = pickFemaleVoice(); return resolve(); }
      window.speechSynthesis.onvoiceschanged = ()=>{ preferredVoice = pickFemaleVoice(); resolve(); };
      setTimeout(()=>{ preferredVoice = pickFemaleVoice(); resolve(); }, 800);
    });
  }

  async function enableVoice(){
    if (!('speechSynthesis' in window)){ alert('TTS not supported in this browser'); return; }
    await ensureVoicesLoaded();
    voiceBtn.textContent = 'Voice: On';
    voiceBtn.disabled = true;
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

  /* ===== Header avoidance helper ===== */
  function isHeaderElement(el){
    if (!el) return false;
    try {
      const rect = el.getBoundingClientRect();
      if (rect.top < 120) return true;
      let p = el; for (let i=0;i<6 && p;i++){ const cls = (p.className||'')+''; const id = (p.id||'')+''; if (/header|top|nav|logo|brand|topbar|desk-header|frappe-header/i.test(cls+id)) return true; p = p.parentElement; }
      return false;
    } catch(e){ return false; }
  }

  /* ===== Find exact text node helper (NEW) =====
     We will:
     1) Search for element nodes whose innerText contains the step words
     2) Prefer nodes NOT in header
     3) Return that element (even if not actionable) so the cursor can point at the word
  */
  function findTextNodeElement(text){
    if (!text) return null;
    const needle = text.trim().toLowerCase();
    if (!needle) return null;
    // try exact phrase matches first in visible elements not in header
    const candidates = Array.from(document.querySelectorAll('body *')).filter(e=>{
      try { if (!e.offsetParent) return false; if (isHeaderElement(e)) return false; return true; } catch(e){ return false; }
    });
    // prefer elements with short text content (labels)
    candidates.sort((a,b)=> (a.innerText||'').length - (b.innerText||'').length );
    for (const el of candidates){
      const txt = (el.innerText||'').trim().replace(/\s+/g,' ').toLowerCase();
      if (!txt) continue;
      if (txt === needle || txt.includes(needle) || needle.includes(txt)) return el;
    }
    // second pass: include header but deprioritize
    const all = Array.from(document.querySelectorAll('body *')).filter(e=>e.offsetParent);
    for (const el of all){
      const txt = (el.innerText||'').trim().replace(/\s+/g,' ').toLowerCase();
      if (!txt) continue;
      if (txt === needle || txt.includes(needle) || needle.includes(txt)) return el;
    }
    return null;
  }

  /* ===== Actionable detection (keeps old heuristics) ===== */
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

  /* ===== Find element (combined) =====
     Order:
       1) explicit selector(s)
       2) atlas selectors (if present)
       3) look for exact text node element (points at text)
       4) nearest actionable to that text
       5) fallback pool actionable first non-header
  */
  function findElement(selector, textFallback){
    debug(`findElement sel="${selector}" text="${textFallback?.slice(0,60)}"`);
    // 1: explicit selector
    if (selector){
      try {
        const parts = selector.split(',').map(s=>s.trim()).filter(Boolean);
        for (const p of parts){
          try {
            const el = document.querySelector(p);
            if (el && el.offsetParent && !isHeaderElement(el)) {
              if (isActionable(el)) return el;
              // if not actionable, return el (we want to point to text too)
              return el;
            }
          } catch(e){}
        }
      } catch(e){}
    }

    // 2: atlas or text-based match -> find text node element
    const textEl = findTextNodeElement(textFallback || selector || '');
    if (textEl) return textEl;

    // 3: fallback: find nearest actionable by label
    const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>e.offsetParent && !isHeaderElement(e));
    const needle = (textFallback||'').trim().toLowerCase();
    if (needle){
      for (const el of pool){
        const label = ((el.innerText||el.getAttribute('placeholder')||el.getAttribute('aria-label')||el.getAttribute('data-label')||'')+'').trim().toLowerCase();
        if (!label) continue;
        if (label === needle || label.includes(needle) || needle.includes(label)) return el;
      }
      // approximate includes
      for (const el of pool){
        const label = ((el.innerText||'')+'').trim().toLowerCase();
        if (label.includes(needle)) return el;
      }
    }
    return pool[0] || null;
  }

  /* ===== Highlight + pointer to element OR text node element ===== */
  async function highlightAndPoint(el, labelForCursor){
    // remove previous outlines
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{ x.classList.remove('fg-outline'); x.removeAttribute('data-fg-highlight'); });
    cursorText.style.opacity='0';
    if (!el) { cursor.style.opacity='0'; cursor.style.display='none'; return; }
    try {
      // If el is text-like (we still use element), compute its rect; if it's a descendant text node small rect, we still use element bounding rect
      const rect = el.getBoundingClientRect();
      // If the element is the entire header or huge, try to find inner text child to be more precise
      let targetRect = rect;
      if ((el.innerText||'').trim().length > 120){
        const smallChild = Array.from(el.querySelectorAll('*')).find(c => (c.innerText||'').trim().length>0 && (c.innerText||'').trim().length < 80 && c.offsetParent);
        if (smallChild) targetRect = smallChild.getBoundingClientRect();
      }
      // scroll into view center
      try { el.scrollIntoView({ behavior:'smooth', block:'center', inline:'center' }); await waitForScrollToFinish(el); } catch(e){}
      await new Promise(r=>setTimeout(r,120));
      const left = (targetRect.left + targetRect.width/2 - 28) + window.scrollX;
      const top  = (targetRect.top  + targetRect.height/2 - 28) + window.scrollY;
      cursor.style.display='flex'; cursor.style.left = left + 'px'; cursor.style.top = top + 'px'; cursor.style.opacity='1';
      // optional small label above cursor if text provided
      const displayText = (labelForCursor || (el.innerText||'')).trim().slice(0,40);
      if (displayText){
        cursorText.style.left = (left - 10) + 'px';
        cursorText.style.top = (top - 42) + 'px';
        cursorText.textContent = displayText;
        cursorText.style.opacity = '1';
      }
      // outline if actionable
      if (isActionable(el)) { el.classList.add('fg-outline'); el.setAttribute('data-fg-highlight','true'); setTimeout(()=>{ try{ el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); }catch(e){} },9000); }
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

  /* ===== Accept nearby clicks & text clicks ===== */
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

  /* ===== Flow ===== */
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
      // start immediately in lesson mode
      panel.querySelector('#fg-setup').classList.add('fg-hidden');
      panel.querySelector('#fg-lesson').classList.remove('fg-hidden');
      stepIndex = 0; document.addEventListener('click', onClickHandler, true);
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
    infoEl.innerHTML = `<div style="padding:10px;background:rgba(255,255,255,0.02);border-left:4px solid #3B82F6;border-radius:6px"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${stepText}</div></div>`;
    hud.querySelector('#fg-hud-txt').textContent = `Step ${i+1}/${tutorial.length}`;
    // Attempt in order: selector -> text node -> fallback actionable
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
        infoEl.innerHTML = `<div style="padding:10px;background:rgba(255,255,255,0.02);border-left:4px solid #10b981;border-radius:6px"><strong>✅ Demo complete</strong></div>`;
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

  /* ===== Utilities ===== */
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

  /* ===== Keyboard shortcuts ===== */
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'N' || e.key === 'n') { e.preventDefault(); if (stepIndex < tutorial.length-1) { stepIndex++; displayStepAndPoint(stepIndex); } }
    if (e.key === 'P' || e.key === 'p') { e.preventDefault(); if (stepIndex > 0) { stepIndex--; displayStepAndPoint(stepIndex); } }
    if (e.key === 'R' || e.key === 'r' || e.code === 'Space') { e.preventDefault(); speakStep(stepIndex); }
  });

  /* expose API */
  window.FG_WORD_CURSOR = { runDiscovery, stopLesson, displayStepAndPoint, findElement, highlightAndPoint };

  console.log('✅ FG_WORD_CURSOR_COACH loaded — word-target cursor + female voice ready');
})();
