/* ────────── embed.js — Investor Demo Coach (CURSOR FIXED) ────────── */
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
     DOM matching / cursor logic (FIXED FOR ACCURATE POINTING)
     ======================= */
  const POOL_SELECTORS = 'button,a,input,select,textarea,[role="button"],[data-label],.btn,.btn-primary,.link-item,.module-link';

  function isIgnored(el){
    if (!el) return true;
    return !!el.closest('[data-fg-ignore]');
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

  // IMPROVED: Get text content from element for matching
  function getElementText(el){
    if (!el) return '';
    return (
      el.innerText ||
      el.textContent ||
      el.getAttribute('aria-label') ||
      el.getAttribute('data-label') ||
      el.getAttribute('placeholder') ||
      el.getAttribute('title') ||
      el.value ||
      ''
    ).trim().toLowerCase();
  }

  // IMPROVED: Better scoring system for element matching
  function scoreMatch(el, searchText){
    if (!searchText) return 0;
    const text = getElementText(el);
    const search = searchText.toLowerCase().trim();
    
    if (!text) return 0;
    
    // Exact match = highest score
    if (text === search) return 1000;
    
    // Exact word match (e.g., "buying" matches "Buying" button)
    const words = text.split(/\s+/);
    if (words.includes(search)) return 900;
    
    // Starts with search term
    if (text.startsWith(search)) return 800;
    
    // Search term is at word boundary
    if (new RegExp(`\\b${search}\\b`, 'i').test(text)) return 700;
    
    // Contains search term
    if (text.includes(search)) return 500;
    
    // Partial word match
    const searchWords = search.split(/\s+/);
    let partialScore = 0;
    for (const word of searchWords) {
      if (text.includes(word)) partialScore += 100;
    }
    
    return partialScore;
  }

  // IMPROVED: Find the actual clickable element, not wrapper
  function getClickableElement(el){
    if (!el) return null;
    
    // If it's already a button/link/input, return it
    const tagName = (el.tagName || '').toLowerCase();
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
      return el;
    }
    
    // Check if it has role="button"
    if (el.getAttribute && el.getAttribute('role') === 'button') {
      return el;
    }
    
    // Look for a clickable child (prefer the one with most text)
    const clickableChildren = el.querySelectorAll && Array.from(
      el.querySelectorAll('button, a, [role="button"], .btn')
    ).filter(isVisible);
    
    if (clickableChildren && clickableChildren.length) {
      // Return the one with most content
      return clickableChildren.sort((a, b) => 
        getElementText(b).length - getElementText(a).length
      )[0];
    }
    
    // If element has click handlers, return it
    if (el.onclick || el.getAttribute('onclick')) {
      return el;
    }
    
    return el;
  }

  // CORE FIX: Completely rewritten findElement function
  function findElement(selector, textFallback){
    console.log(`🎯 Finding element: selector="${selector}", text="${textFallback}"`);
    
    // Step 1: Try CSS selector first
    if (selector) {
      const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
      for (const sel of parts) {
        try {
          const elements = Array.from(document.querySelectorAll(sel))
            .filter(el => isVisible(el) && !inHeader(el));
          
          if (elements.length > 0) {
            console.log(`✓ Found ${elements.length} elements with selector "${sel}"`);
            // If we have text fallback, score each element
            if (textFallback) {
              const scored = elements.map(el => ({
                el,
                score: scoreMatch(el, textFallback)
              })).sort((a, b) => b.score - a.score);
              
              if (scored[0].score > 0) {
                const best = getClickableElement(scored[0].el);
                console.log(`✓ Best match: "${getElementText(best)}" (score: ${scored[0].score})`);
                return best;
              }
            }
            // No text fallback, return first visible
            return getClickableElement(elements[0]);
          }
        } catch(e) {
          console.warn(`Selector error: ${sel}`, e);
        }
      }
    }

    // Step 2: Search by text in all interactive elements
    if (!textFallback) {
      console.log('⚠️ No text fallback provided');
      return null;
    }

    const searchText = textFallback.toLowerCase().trim();
    console.log(`🔍 Searching by text: "${searchText}"`);

    // Get all potentially clickable elements
    const pool = Array.from(document.querySelectorAll(POOL_SELECTORS))
      .filter(el => isVisible(el) && !inHeader(el));

    console.log(`📦 Pool size: ${pool.length} elements`);

    // Score all elements
    const scored = pool.map(el => ({
      el,
      score: scoreMatch(el, searchText),
      text: getElementText(el)
    })).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      console.log(`✓ Top 3 matches:`, scored.slice(0, 3).map(s => 
        `"${s.text}" (${s.score})`
      ));
      return getClickableElement(scored[0].el);
    }

    console.log('❌ No matches found');
    return null;
  }

  async function waitForScrollToFinish(el, timeout=1000){
    return new Promise(resolve=>{
      const start = Date.now();
      let lastTop = -9999;
      const check = ()=>{
        try{
          const r = el.getBoundingClientRect();
          const currentTop = r.top;
          
          // Check if element is centered
          const dy = Math.abs((r.top + r.bottom)/2 - window.innerHeight/2);
          const dx = Math.abs((r.left + r.right)/2 - window.innerWidth/2);
          
          // Check if scroll has stopped (position hasn't changed)
          const hasSettled = Math.abs(currentTop - lastTop) < 1;
          
          if ((dy < 50 && dx < 100) || hasSettled) {
            return resolve();
          }
          
          lastTop = currentTop;
        }catch(e){}
        
        if (Date.now() - start > timeout) return resolve();
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  async function highlightAndPoint(el){
    // Remove existing highlights
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{
      x.classList.remove('fg-outline');
      x.removeAttribute('data-fg-highlight');
    });
    
    if (!el){
      cursor.style.display='none';
      cursor.style.opacity='0';
      return;
    }

    console.log(`👉 Highlighting: "${getElementText(el)}" (${el.tagName})`);

    // Ensure we have the clickable element
    const clickable = getClickableElement(el);
    
    // Scroll into view - use smooth scrolling
    try {
      clickable.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
      await waitForScrollToFinish(clickable);
    } catch(e) {
      console.warn('Scroll error:', e);
    }

    // Small delay to ensure layout is stable
    await new Promise(r => setTimeout(r, 200));

    // Position cursor
    try{
      const rect = clickable.getBoundingClientRect();
      
      // Calculate center of element
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Cursor is 56px, so offset by 28px to center it
      const left = Math.max(6, centerX - 28 + window.scrollX);
      const top = Math.max(6, centerY - 28 + window.scrollY);
      
      cursor.style.display = 'flex';
      cursor.style.opacity = '1';
      cursor.style.left = left + 'px';
      cursor.style.top = top + 'px';
      
      console.log(`✓ Cursor positioned at (${Math.round(left)}, ${Math.round(top)})`);
    }catch(e){
      console.error('Cursor positioning error:', e);
      cursor.style.display = 'none';
      cursor.style.opacity = '0';
    }

    // Add outline
    clickable.classList.add('fg-outline');
    clickable.setAttribute('data-fg-highlight', '1');
    
    // Remove highlight after delay
    setTimeout(()=>{
      try{
        if (clickable.getAttribute('data-fg-highlight')){
          clickable.classList.remove('fg-outline');
          clickable.removeAttribute('data-fg-highlight');
        }
      }catch(e){}
    }, 9000);
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
    
    console.log(`\n═══ STEP ${i+1} ═══`);
    console.log(`Text: "${stepText}"`);
    console.log(`Selector: "${selectors[i] || 'none'}"`);
    
    const sel = selectors[i] || '';
    const el = findElement(sel, stepText);
    
    if (el) {
      console.log(`✓ Found element: "${getElementText(el)}"`);
    } else {
      console.log(`✗ No element found`);
    }
    
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
    
    if (expectedEl && (expectedEl === clicked || expectedEl.contains(clicked) || clicked.contains(expectedEl))){
      stepIndex++;
      if (stepIndex >= tutorial.length){
        infoFallback(`<strong>✅ Demo complete</strong><div style="margin-top:6px">Enable workflows, train team, or run sandbox.</div>`);
        await highlightAn
