/* ────────── embed.js — Investor Demo Coach (FIXED) ────────── */
(function(){
  if (window.FG_INVESTOR_COACH_v5) { console.log('FG_INVESTOR_COACH_v5 already loaded'); return; }
  window.FG_INVESTOR_COACH_v5 = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0, atlas = [], chosenFeature = null;
  let recording = false, recordEvents = [];

  /* =======================
     Styles + mark injected UI to ignore
     =======================*/
  const style = document.createElement('style');
  style.setAttribute('data-fg-ignore','1');
  style.textContent = `
  .fg-ignore{pointer-events:auto}
  .fg-cursor{position:fixed;width:56px;height:56px;border:4px solid #3B82F6;border-radius:50%;
    background:linear-gradient(180deg, rgba(59,130,246,.18), rgba(59,130,246,.06));box-shadow:0 10px 30px rgba(3,7,18,.6);
    z-index:2147483699;display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .35s cubic-bezier(.22,.9,.2,1), top .35s cubic-bezier(.22,.9,.2,1), opacity .2s;}
  .fg-panel{position:fixed;bottom:26px;right:26px;width:460px;background:#071024;border:1px solid rgba(59,130,246,.14);
    border-radius:12px;padding:12px;z-index:2147483698;color:#e6eef8;font-family:Inter,Arial;font-size:13px;box-shadow:0 10px 40px rgba(2,6,23,.6)}
  .fg-panel input,.fg-panel select{width:100%;padding:9px;margin:8px 0;border:1px solid #1f2a38;background:#071224;color:#e6eef8;border-radius:8px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700}
  .fg-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .fg-card{background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;min-height:78px;display:flex;flex-direction:column;justify-content:space-between}
  .fg-stepcard{padding:10px;background:linear-gradient(90deg,rgba(59,130,246,.04),rgba(59,130,246,.02));border-left:4px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6 !important; outline-offset:4px !important; border-radius:6px}
  .fg-tab{position:fixed;top:42%;right:6px;width:46px;height:130px;background:#071224;border:1px solid #1f2a38;border-radius:10px;
    display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;color:#9fb0c9;z-index:2147483702;cursor:pointer;box-shadow:0 8px 20px rgba(2,6,23,.5)}
  .fg-hidden{display:none!important}
  .fg-hud{position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,.12);z-index:2147483701;font-family:Inter,Arial;font-size:13px;display:flex;gap:10px;align-items:center}
  .fg-progress{height:8px;background:#0b1220;border-radius:8px;overflow:hidden;margin-top:8px}
  .fg-progress>i{display:block;height:100%;background:linear-gradient(90deg,#60a5fa,#3b82f6);width:0%}
  .fg-options{position:fixed;right:500px;bottom:26px;background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;z-index:2147483701;max-height:320px;overflow:auto;width:360px;color:#cfe8ff}
  .fg-option-row{display:flex;justify-content:space-between;padding:6px;border-bottom:1px dashed rgba(255,255,255,.03);font-size:13px}
  `;
  document.head.appendChild(style);

  /* =======================
     CORE UI (all elements carry data-fg-ignore so they won't be matched)
     ======================= */
  function make(tag, props={}, html=''){
    const el = document.createElement(tag);
    el.setAttribute('data-fg-ignore','1');
    Object.assign(el, props);
    if (html) el.innerHTML = html;
    return el;
  }

  const cursor = make('div',{className:'fg-cursor'}); cursor.textContent='●'; document.body.appendChild(cursor);

  const panel = make('div',{className:'fg-panel', id:'fg-panel-main'});
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach <span style="float:right;font-weight:600;color:#9fb0c9;font-size:12px">Investor</span></h3>
    <div id="fg-setup">
      <p style="margin:0 0 8px;color:#9fb0c9;font-size:13px">Enter a job and we'll show high-impact Frappe features tailored to that role.</p>
      <input id="fg-job" placeholder="e.g., Procurement Manager" />
      <select id="fg-ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button id="fg-analyze" style="flex:1">Discover Opportunities</button>
        <button id="fg-skip" style="flex:1;background:#071224;border:1px solid #183047">Quick Start</button>
      </div>
      <div style="margin-top:8px;color:#94a3b8;font-size:12px">Shortcuts: N=Next · P=Prev · R=Repeat · O=Options</div>
    </div>
    <div id="fg-opps" style="display:none">
      <div style="color:#9fb0c9;font-size:13px">Top possibilities for your role</div>
      <div id="fg-cards" class="fg-cards"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-start" style="flex:1">Start Guided Demo</button>
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

  const hud = make('div',{className:'fg-hud fg-hidden'}); hud.innerHTML = `<div style="background:#072033;padding:6px 8px;border-radius:6px;border:1px solid #183047;color:#9fd0ff;font-weight:700">LIVE DEMO</div><div id="fg-hud-txt" style="min-width:180px;margin-left:8px">Idle</div><div id="fg-record-ind" style="margin-left:8px">●</div>`; document.body.appendChild(hud);
  hud.querySelector('#fg-record-ind').style.color = '#4b5563';

  const optionsBox = make('div',{className:'fg-options fg-hidden', id:'fg-options'}); optionsBox.innerHTML = `<h4 style="margin:0 0 6px 0">Options in viewport</h4><div id="fg-options-list" style="font-size:13px"></div>`; document.body.appendChild(optionsBox);

  const tab = make('div',{className:'fg-tab fg-hidden', id:'fg-tab', textContent:'Demo'}); document.body.appendChild(tab);

  /* Controls */
  const $ = sel => panel.querySelector(sel);
  $('#fg-analyze').onclick = runDiscovery;
  $('#fg-skip').onclick = quickStart;
  $('#fg-back').onclick = ()=>{ $('#fg-opps').style.display='none'; $('#fg-setup').style.display='block'; };
  $('#fg-start').onclick = ()=> startLesson(chosenFeature);
  $('#fg-repeat').onclick = ()=> speakStep(stepIndex);
  $('#fg-stop').onclick = stopLesson;
  tab.onclick = ()=>{ panel.classList.remove('fg-hidden'); tab.classList.add('fg-hidden'); };

  /* =======================
     TTS (choose a good voice, fallback gracefully)
     ======================= */
  let cachedVoice = null;
  function pickVoice(){
    const voices = window.speechSynthesis?.getVoices() || [];
    // prefer female-ish or Google voice
    return voices.find(v => /Google US|en-US Female|Samantha/i.test(v.name)) 
        || voices.find(v => /female/i.test(v.name)) 
        || voices[0] || null;
  }
  window.speechSynthesis?.addEventListener && window.speechSynthesis.addEventListener('voiceschanged', ()=>{ cachedVoice = pickVoice(); });

  async function speak(text){
    if (!text) return;
    try{
      if ('speechSynthesis' in window){
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        if (!cachedVoice) cachedVoice = pickVoice();
        if (cachedVoice) ut.voice = cachedVoice;
        ut.lang = 'en-US';
        return new Promise(resolve => { ut.onend = resolve; ut.onerror = resolve; window.speechSynthesis.speak(ut); });
      }
    }catch(e){}
  }

  /* =======================
     DOM matching / cursor logic (HARDENED)
     ======================= */
  const POOL_SELECTORS = 'button,a,input,select,textarea,[role="button"],[data-label],.btn,.btn-primary,.link-item,.module-link';

  function isIgnored(el){
    if (!el) return true;
    return !!el.closest('[data-fg-ignore]'); // ignore our UI and any descendant
  }
  function isVisible(el){
    try{
      if (!el) return false;
      if (isIgnored(el)) return false;
      if (el.offsetParent === null) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }catch(e){ return false; }
  }
  function inHeader(el){
    try{
      const r = el.getBoundingClientRect();
      if (r.top < 60) return true;
      if (el.closest && el.closest('header, .navbar, .app-header')) return true;
      if (/(logo|brand|navbar|topbar)/i.test(el.className || '')) return true;
      return false;
    }catch(e){ return true; }
  }

  function nearestActionable(startEl, depthLimit=6){
    if (!startEl) return null;
    if (isVisible(startEl) && (['button','a','input','select','textarea'].includes((startEl.tagName||'').toLowerCase()))) return startEl;
    // inside candidates
    try{
      const inside = startEl.querySelector && Array.from(startEl.querySelectorAll(POOL_SELECTORS)).find(e=>isVisible(e) && !inHeader(e));
      if (inside) return inside;
    }catch(e){}
    // search siblings/parents
    let p = startEl;
    let depth=0;
    while(p && depth < depthLimit){
      try{
        if (isVisible(p) && (['button','a','input','select','textarea'].includes((p.tagName||'').toLowerCase()))) return p;
        const found = p.querySelector && p.querySelector(POOL_SELECTORS);
        if (found && isVisible(found) && !inHeader(found)) return found;
      }catch(e){}
      p = p.parentElement; depth++;
    }
    // fallback: first visible actionable outside header
    return Array.from(document.querySelectorAll(POOL_SELECTORS)).find(e=>isVisible(e) && !inHeader(e)) || null;
  }

  function buildFingerprint(el){
    if (!el) return {};
    return {
      tag: (el.tagName||'').toLowerCase(),
      id: el.id||null,
      cls: (el.className||'').split(/\s+/).slice(0,2).join(' '),
      text: ((el.innerText||el.getAttribute('aria-label')||el.getAttribute('placeholder')||el.getAttribute('data-label')||'')+'').trim().slice(0,80)
    };
  }

  function findElement(selector, textFallback){
    // 1. try selector(s)
    if (selector){
      const parts = selector.split(',').map(s=>s.trim()).filter(Boolean);
      for (const p of parts){
        try{
          const el = document.querySelector(p);
          if (el && isVisible(el) && !inHeader(el)) return nearestActionable(el) || el;
        }catch(e){}
      }
    }

    // pool
    const pool = Array.from(document.querySelectorAll(POOL_SELECTORS)).filter(e=>isVisible(e) && !inHeader(e));

    const q = (textFallback||'').toLowerCase().trim();

    if (q){
      // prefer exact label
      for (const el of pool){
        const label = ((el.innerText||el.value||el.getAttribute('data-label')||el.getAttribute('aria-label')||'')+'').trim().toLowerCase();
        if (label === q) return el;
      }
      // prefer startsWith
      for (const el of pool){
        const label = ((el.innerText||el.value||el.getAttribute('data-label')||el.getAttribute('aria-label')||'')+'').trim().toLowerCase();
        if (label.startsWith(q)) return el;
      }
      // includes
      for (const el of pool){
        const label = ((el.innerText||el.value||el.getAttribute('data-label')||el.getAttribute('aria-label')||'')+'').trim().toLowerCase();
        if (label.includes(q)) return el;
      }

      // leaf text nodes: find leaves that include the text and take nearest actionable
      const leaves = Array.from(document.querySelectorAll('body *')).filter(n => n.children.length === 0 && n.innerText && n.innerText.trim().toLowerCase().includes(q) && !isIgnored(n));
      if (leaves.length){
        // score by closeness to viewport center
        const centerX = window.innerWidth/2, centerY = window.innerHeight/2;
        let best = null, bestScore = Infinity;
        for (const l of leaves){
          const r = l.getBoundingClientRect();
          const cx = r.left + r.width/2, cy = r.top + r.height/2;
          const d = Math.hypot(cx-centerX, cy-centerY);
          if (d < bestScore){ bestScore = d; best = l; }
        }
        if (best){
          const near = nearestActionable(best);
          if (near) return near;
        }
      }
    }

    // fallback -> first pool element
    return pool[0] || null;
  }

  async function waitForScrollToFinish(el, timeout=800){
    return new Promise(resolve=>{
      const start = Date.now();
      const check = ()=>{
        try{
          const r = el.getBoundingClientRect();
          const dy = Math.abs((r.top + r.bottom)/2 - window.innerHeight/2);
          const dx = Math.abs((r.left + r.right)/2 - window.innerWidth/2);
          if (dy < 24 && dx < 48) return resolve();
        }catch(e){}
        if (Date.now() - start > timeout) return resolve();
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  async function highlightAndPoint(el){
    // remove existing
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{ x.classList.remove('fg-outline'); x.removeAttribute('data-fg-highlight'); });
    if (!el){ cursor.style.display='none'; cursor.style.opacity='0'; return; }

    // ensure actionable
    if (!el.closest && !['button','a','input','select','textarea'].includes((el.tagName||'').toLowerCase())){
      el = nearestActionable(el) || el;
    }

    try { el.scrollIntoView({behavior:'smooth', block:'center', inline:'center'}); await waitForScrollToFinish(el); } catch(e){}

    await new Promise(r=>setTimeout(r,120)); // give browser a beat
    try{
      const rect = el.getBoundingClientRect();
      const left = Math.max(6, rect.left + rect.width/2 - 28 + window.scrollX);
      const top  = Math.max(6, rect.top + rect.height/2 - 28 + window.scrollY);
      cursor.style.display='flex'; cursor.style.opacity='1'; cursor.style.left = left + 'px'; cursor.style.top = top + 'px';
    }catch(e){ cursor.style.display='none'; cursor.style.opacity='0'; }

    el.classList.add('fg-outline'); el.setAttribute('data-fg-highlight','1');
    // auto remove highlight after some time
    setTimeout(()=>{ try{ if (el && el.getAttribute && el.getAttribute('data-fg-highlight')){ el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); } }catch(e){} }, 9000);
  }

  /* =======================
     Discovery / flow
     ======================= */
  async function runDiscovery(){
    const job = document.getElementById('fg-job').value.trim();
    const industry = document.getElementById('fg-ind').value;
    if (!job) return alert('Enter job title');
    $('#fg-analyze').disabled = true;
    hud.classList.remove('fg-hidden'); hud.querySelector('#fg-hud-txt').textContent = `Analyzing — ${job}`;
    try{
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      if (!r.ok) throw new Error('analyze-job failed ' + r.status);
      const data = await r.json();
      tutorial = data.tutorial || []; selectors = data.selectors || [];
      atlas = await (await fetch(API + '/atlas')).json();
      const cards = scoreAtlasForRole(atlas, job, tutorial);
      showOpportunities(cards, job, industry);
      hud.querySelector('#fg-hud-txt').textContent = `Ready — ${job}`;
    }catch(err){
      console.error('Discovery error', err);
      alert('Backend error during discovery (see console)');
      hud.querySelector('#fg-hud-txt').textContent = 'Error';
    } finally { $('#fg-analyze').disabled = false; hud.classList.add('fg-hidden'); }
  }

  function scoreAtlasForRole(atlas, job, tutorial){
    const keywords = tutorial.map(t => (t||'').split(/\s+/).slice(-1)[0] || '').filter(Boolean);
    const jw = job.split(/\s+/).map(s=>s.toLowerCase());
    const scored = atlas.map(a=>{
      const label = (a.label||'').toLowerCase();
      let score = 0;
      for (const w of keywords) if (label.includes((w||'').toLowerCase())) score += 3;
      for (const w of jw) if (label.includes(w)) score += 2;
      if ((a.module||'').toLowerCase().includes(job.toLowerCase())) score += 1;
      return { a, score };
    }).filter(x=>x.score>0).sort((x,y)=>y.score-x.score).map(x=>x.a);
    return scored.length ? scored.slice(0,8) : atlas.slice(0,8);
  }

  function showOpportunities(cards, job, industry){
    $('#fg-setup').style.display='none'; $('#fg-opps').style.display='block';
    const cardsEl = $('#fg-cards'); cardsEl.innerHTML = ''; chosenFeature = null;
    for (const c of cards){
      const card = document.createElement('div'); card.className='fg-card'; card.setAttribute('data-fg-ignore','1');
      const title = document.createElement('h4'); title.textContent = c.label || c.name || '(no label)';
      const meta = document.createElement('p'); meta.textContent = (c.module ? (c.module + ' · ') : '') + (c.route || '');
      const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px';
      const preview = document.createElement('button'); preview.textContent='Preview';
      const guide = document.createElement('button'); guide.textContent='Guide'; guide.style.background='#071224'; guide.style.border='1px solid #183047';
      actions.appendChild(preview); actions.appendChild(guide);
      card.appendChild(title); card.appendChild(meta); card.appendChild(actions);
      cardsEl.appendChild(card);

      preview.onclick = async () => {
        const pitch = `${c.label} — quick win for ${job}. This feature captures data and automates approvals.`;
        await speak(pitch);
        const elCandidate = findElement(null, c.label || c.name);
        if (elCandidate) { await highlightAndPoint(elCandidate); showOptionsNear(elCandidate); }
        else infoFallback(`Preview: ${pitch}`);
      };
      guide.onclick = () => { chosenFeature = { label: c.label, route: c.route }; $('#fg-opps').style.display='none'; startLesson(chosenFeature); };
    }
    if (cards && cards.length) speak(`Top suggestion: ${cards[0].label}`);
    renderStepList();
  }

  function infoFallback(html){
    $('#fg-info').innerHTML = `<div class="fg-stepcard">${html}</div>`;
  }

  async function quickStart(){
    const job = document.getElementById('fg-job').value.trim() || 'User';
    const industry = document.getElementById('fg-ind').value;
    const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
    const data = await r.json();
    tutorial = data.tutorial || []; selectors = data.selectors || [];
    pruneTutorialIfLoggedIn();
    startLesson(null);
  }

  function pruneTutorialIfLoggedIn(){
    const alreadyInside = !/\/login/i.test(location.pathname) && !document.querySelector("form[action*='login']");
    while (alreadyInside && tutorial.length && /log[\s-]?in/i.test(tutorial[0])) { tutorial.shift(); selectors.shift(); }
  }

  async function startLesson(feature){
    if (!tutorial || tutorial.length===0){
      const job = document.getElementById('fg-job').value.trim() || 'User';
      const industry = document.getElementById('fg-ind').value;
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry }) });
      const data = await r.json(); tutorial = data.tutorial || []; selectors = data.selectors || [];
    }
    if (feature && feature.label && tutorial && tutorial.length){
      if (!tutorial[0].toLowerCase().includes((feature.label||'').toLowerCase())){
        tutorial.unshift(`Open ${feature.label} in ${feature.route || 'the app'}`); selectors.unshift(null);
      }
    }
    // minimize UI
    panel.classList.add('fg-hidden'); tab.classList.remove('fg-hidden');
    $('#fg-setup').style.display='none'; $('#fg-opps').style.display='none'; $('#fg-lesson').style.display='block';
    stepIndex = 0; document.addEventListener('click', onClickHandler, true);
    await speak(`We'll demo ${feature && feature.label ? feature.label : 'this feature'}.`);
    await displayStepAndPoint(0);
  }

  async function displayStepAndPoint(i){
    const stepText = tutorial[i] || '';
    $('#fg-info').innerHTML = `<div class="fg-stepcard"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${stepText}</div></div>`;
    renderProgress();
    const sel = selectors[i] || ''; const el = findElement(sel, stepText);
    await highlightAndPoint(el);
    showOptionsNear(el);
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
    const clicked = ev.target;
    pushRecord({ type:'click', target: describeEl(clicked), stepExpected: stepIndex, ts: Date.now() });
    if (expectedEl && (expectedEl === clicked || expectedEl.contains(clicked))){
      stepIndex++;
      if (stepIndex >= tutorial.length){
        infoFallback(`<strong>✅ Demo complete</strong><div style="margin-top:6px">Enable workflows, train team, or run sandbox.</div>`);
        await highlightAndPoint(null); cursor.style.opacity='0'; await speak("✅ Demo complete.");
        document.removeEventListener('click', onClickHandler, true); tab.classList.remove('fg-hidden'); panel.classList.add('fg-hidden'); pushRecord({ type:'demo_complete', ts:Date.now() });
        return;
      } else {
        await speak("Nice — moving to the next step.");
        displayStepAndPoint(stepIndex);
      }
    } else {
      await speak("Not quite — I'm pointing to the best option. Look for the highlighted control.");
      if (expectedEl) { await highlightAndPoint(expectedEl); try{ expectedEl.animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:350}); }catch(e){} }
      else await speak("I can't find that exact control on this page. Use the left menu or search.");
      pushRecord({ type:'wrong_click', target: describeEl(clicked), expected: describeEl(expectedEl), ts: Date.now() });
    }
  }

  function stopLesson(){
    tutorial=[]; selectors=[]; stepIndex=0;
    panel.querySelector('#fg-setup').style.display='block'; panel.querySelector('#fg-opps').style.display='none'; panel.querySelector('#fg-lesson').style.display='none';
    document.removeEventListener('click', onClickHandler, true); highlightAndPoint(null); cursor.style.opacity='0'; panel.classList.remove('fg-hidden'); tab.classList.add('fg-hidden');
    speak("Demo stopped."); pushRecord({ type:'demo_stopped', ts:Date.now() });
  }

  function renderProgress(){
    if (!document.getElementById('fg-progress')){
      const bar = document.createElement('div'); bar.id='fg-progress'; bar.className='fg-progress'; bar.innerHTML='<i style="width:0%"></i>'; hud.appendChild(bar);
    }
    const pct = tutorial && tutorial.length ? Math.round(((stepIndex)/tutorial.length)*100) : 0;
    document.querySelector('#fg-progress > i').style.width = `${pct}%`;
    hud.querySelector('#fg-hud-txt').textContent = `Step ${Math.min(stepIndex+1, tutorial.length)}/${tutorial.length || 0}`;
  }

  function showOptionsNear(el){
    if (!el){ optionsBox.classList.add('fg-hidden'); return; }
    optionsBox.classList.remove('fg-hidden');
    const list = optionsBox.querySelector('#fg-options-list'); list.innerHTML = '';
    const pool = Array.from(document.querySelectorAll(POOL_SELECTORS)).filter(e=>isVisible(e) && !inHeader(e));
    const base = el.getBoundingClientRect();
    const nearby = pool.map(p=>({p,r:p.getBoundingClientRect()})).filter(x=>{
      const d = Math.hypot((x.r.left + x.r.width/2) - (base.left + base.width/2), (x.r.top + x.r.height/2) - (base.top + base.height/2));
      return d < Math.max(window.innerWidth, window.innerHeight) * 0.6;
    }).slice(0,25);
    for (const row of nearby){
      const label = (row.p.innerText||row.p.getAttribute('placeholder')||row.p.getAttribute('aria-label')||row.p.getAttribute('data-label')||'').trim().replace(/\s+/g,' ');
      const div = document.createElement('div'); div.className='fg-option-row';
      div.innerHTML = `<div style="max-width:62%">${label || '<no label>'}</div><div style="min-width:38%;text-align:right;color:#9fb0c9;font-size:12px">${buildSimpleSelector(row.p)}</div>`;
      list.appendChild(div);
    }
  }

  function buildSimpleSelector(el){
    if (!el) return '';
    if (el.id) return `#${el.id}`;
    const dl = el.getAttribute && (el.getAttribute('data-label') || el.getAttribute('data-doctype'));
    if (dl) return `[data-label="${dl}"]`;
    const cls = (el.className||'').split(/\s+/)[0];
    if (cls) return `.${cls}`;
    const text = (el.innerText||'').trim().replace(/"/g,'').slice(0,40);
    if (text) return `button:has-text("${text}")`;
    return el.tagName.toLowerCase();
  }

  function describeEl(el){
    if (!el) return null;
    return { tag: el.tagName.toLowerCase(), text: (el.innerText||'').slice(0,80).trim(), id: el.id||null, cls: el.className||null };
  }

  function pushRecord(o){ if (!recording) return; recordEvents.push(Object.assign({ ts: Date.now() }, o)); }

  function startRecording(){ recording=true; recordEvents=[]; hud.querySelector('#fg-record-ind').style.color='#10b981'; pushRecord({ type:'record_start', ts:Date.now() }); hud.querySelector('#fg-hud-txt').textContent='Recording'; }
  function stopRecording(){ recording=false; hud.querySelector('#fg-record-ind').style.color='#4b5563'; pushRecord({ type:'record_stop', ts:Date.now() }); hud.querySelector('#fg-hud-txt').textContent='Ready'; }
  function downloadRecording(){ const blob = new Blob([JSON.stringify({ events: recordEvents, meta:{ job: document.getElementById('fg-job').value, created: new Date().toISOString() } }, null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `frappe-demo-${Date.now()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

  // keyboard shortcuts
  document.addEventListener('keydown', (e)=>{
    if (e.key==='N' || e.key==='n'){ e.preventDefault(); if (stepIndex < tutorial.length-1) { stepIndex++; displayStepAndPoint(stepIndex); } }
    if (e.key==='P' || e.key==='p'){ e.preventDefault(); if (stepIndex > 0) { stepIndex--; displayStepAndPoint(stepIndex); } }
    if (e.key==='R' || e.key==='r' || e.code==='Space'){ e.preventDefault(); speakStep(stepIndex); }
    if (e.key==='O' || e.key==='o'){ e.preventDefault(); optionsBox.classList.toggle('fg-hidden'); }
    if (e.key==='T' || e.key==='t'){ e.preventDefault(); if (!recording) { startRecording(); alert('Recording started'); } else { downloadRecording(); } }
  });

  // expose runtime controls
  window.FG_INVESTOR = { runDiscovery, quickStart, startLesson, stopLesson, findElement, highlightAndPoint, startRecording, stopRecording, downloadRecording, showOptionsNear };

  console.log('✅ Frappe Demo Coach v5 loaded — hardened matching, UI-hidden, improved TTS and cursor');
})();
