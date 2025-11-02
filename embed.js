/* ────────── embed.js — Live Call Cursor Teacher (drop-in) ────────── */
(function(){
  if (window.FG_LIVE_TEACHER_CURSOR) return;
  window.FG_LIVE_TEACHER_CURSOR = true;

  const API = "https://frappe-guide-backend.onrender.com"; // <-- change if different
  let tutorial = [], selectors = [], stepIndex = 0, cursor, panel;

  // STYLES
  const css = document.createElement('style');
  css.textContent = `
  .fg-cursor{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
    background:rgba(59,130,246,0.18);box-shadow:0 0 40px rgba(59,130,246,.9);z-index:2147483647;
    display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .35s ease,top .35s ease}
  .fg-panel{position:fixed;bottom:30px;right:30px;width:380px;background:#0f172a;border:2px solid #3B82F6;
    border-radius:10px;padding:18px;z-index:2147483646;color:#f3f4f6;font-family:Arial;font-size:13px}
  .fg-panel input,.fg-panel select{width:100%;padding:8px;margin:8px 0;border:1px solid #334155;background:#0b1220;color:#f3f4f6;border-radius:6px}
  .fg-panel button{width:100%;padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold}
  .fg-stepcard{padding:10px;background:rgba(59,130,246,0.06);border-left:3px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6 !important; outline-offset:4px !important}
  `;
  document.head.appendChild(css);

  // CURSOR
  cursor = document.createElement('div');
  cursor.className = 'fg-cursor';
  cursor.textContent = '●';
  document.body.appendChild(cursor);

  // PANEL UI
  panel = document.createElement('div');
  panel.className = 'fg-panel';
  panel.innerHTML = `
    <h3 style="margin:0 0 10px;color:#3B82F6">🤖 Frappe Live Teacher</h3>
    <div id="fg-step-setup">
      <p style="margin:6px 0">What do you do for work?</p>
      <input id="fg-job" placeholder="e.g., Procurement Manager" />
      <select id="fg-ind">
        <option>Manufacturing</option>
        <option>Retail</option>
        <option>Services</option>
      </select>
      <button id="fg-start">Analyze & Start Lesson</button>
    </div>
    <div id="fg-lesson" style="display:none">
      <div id="fg-info"></div>
      <div id="fg-controls" style="margin-top:10px">
        <button id="fg-repeat">🔁 Repeat Step</button>
        <button id="fg-stop" style="background:#ef4444;margin-top:6px">⏹ Stop</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const startBtn = document.getElementById('fg-start');
  const repeatBtn = document.getElementById('fg-repeat');
  const stopBtn = document.getElementById('fg-stop');
  const infoEl = document.getElementById('fg-info');

  startBtn.onclick = startLesson;
  repeatBtn.onclick = () => speakStep(stepIndex);
  stopBtn.onclick = stopLesson;

  // UTIL: speak text via backend /speak
  async function speak(text){
    try{
      const r = await fetch(API + '/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!r.ok) return;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.play();
      return new Promise(resolve => { a.onended = () => { URL.revokeObjectURL(url); resolve(); }; });
    } catch(e) {
      console.error('speak error', e);
    }
  }

  // UTIL: get element by selector or fuzzy by text
  function findElement(selector, textFallback){
    // try provided selector first (if truthy)
    if (selector) {
      try {
        // allow comma separated selectors
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) return el;
      } catch(e){}
    }
    // text fallback - search visible clickable elements
    const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary'));
    const lower = (textFallback || '').toLowerCase();
    if (!lower) return null;
    for (const el of pool) {
      const text = ((el.innerText || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('data-label') || '') + '').trim().replace(/\s+/g,' ');
      if (!text) continue;
      if (text.toLowerCase().includes(lower) && el.offsetParent !== null) return el;
    }
    // last resort: search any element with innerText
    const all = Array.from(document.querySelectorAll('body *'));
    for (const el of all) {
      if (el.children.length > 0) continue;
      const t = (el.innerText || '').trim();
      if (!t) continue;
      if (t.toLowerCase().includes(lower) && el.offsetParent !== null) return el;
    }
    return null;
  }

  // highlight + move cursor
  function highlightAndPoint(el){
    // remove previous outlines
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{
      x.classList.remove('fg-outline');
      x.removeAttribute('data-fg-highlight');
    });

    if (!el) {
      cursor.style.display = 'none';
      return;
    }

    // scroll into view
    try { el.scrollIntoView({behavior:'smooth',block:'center',inline:'center'}); } catch{}

    // compute rect after scroll
    setTimeout(()=>{
      const rect = el.getBoundingClientRect();
      const left = rect.left + rect.width/2 - 30 + window.scrollX;
      const top  = rect.top + rect.height/2 - 30 + window.scrollY;
      cursor.style.left = (left) + 'px';
      cursor.style.top  = (top) + 'px';
      cursor.style.display = 'flex';
      // outline element
      el.classList.add('fg-outline');
      el.setAttribute('data-fg-highlight','true');
      // auto remove after 8s
      setTimeout(()=>{ if(el && el.getAttribute && el.getAttribute('data-fg-highlight')) { el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); } }, 8000);
    }, 300);
  }

  // when user clicks anywhere, detect correctness
  async function onClickHandler(ev){
    if (stepIndex >= tutorial.length) return;
    const currentSel = selectors[stepIndex] || '';
    const target = ev.target;
    // if target matches expected selector
    let expectedEl = findElement(currentSel, tutorial[stepIndex]);
    if (!expectedEl) {
      // try matching by text only
      expectedEl = findElement(null, tutorial[stepIndex]);
    }

    // check if clicked the correct element (or inside it)
    if (expectedEl && (expectedEl === target || expectedEl.contains(target))) {
      // correct - advance
      stepIndex++;
      if (stepIndex >= tutorial.length) {
        // done
        infoEl.innerHTML = `<div class="fg-stepcard"><strong>✅ Complete!</strong><div style="margin-top:6px">You finished the lesson.</div></div>`;
        highlightAndPoint(null);
        cursor.style.display = 'none';
        await speak("✅ Tutorial complete. Great job.");
        // remove click listener
        document.removeEventListener('click', onClickHandler, true);
        return;
      } else {
        await speak("Good. Next step.");
        displayStepAndPoint(stepIndex);
      }
    } else {
      // wrong click — immediate guidance
      await speak("Not that one. I'll point to the correct button.");
      // re-highlight correct element
      if (expectedEl) {
        highlightAndPoint(expectedEl);
        // tiny pulse animation
        expectedEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 400 });
      } else {
        // no expected found; say fallback
        await speak("I can't find the button on this page. Try looking for " + (tutorial[stepIndex] || "the correct control") + ".");
      }
    }
  }

  // display step in panel and point cursor + speak
  async function displayStepAndPoint(i){
    const stepText = tutorial[i] || '';
    infoEl.innerHTML = `<div class="fg-stepcard"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${stepText}</div></div>`;
    // find element using selector or fuzzy
    const sel = selectors[i] || '';
    const el = findElement(sel, stepText);
    highlightAndPoint(el);
    // speak step
    await speak(stepText);
  }

  // start whole lesson
  async function startLesson(){
    const job = document.getElementById('fg-job').value.trim();
    const ind = document.getElementById('fg-ind').value;
    if (!job) return alert('Enter your job title');
    // call backend
    try{
      startBtn.disabled = true;
      startBtn.textContent = 'Analyzing...';
      const r = await fetch(API + '/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, industry: ind })
      });
      const data = await r.json();
      tutorial = data.tutorial || data.tutorials || [];
      selectors = data.selectors || data.selectors || [];
      if (!tutorial || tutorial.length === 0) {
        alert('No tutorial returned. Using fallback.');
        tutorial = ['Go to Buying','Click Purchase Order','Click New','Add Items','Save'];
        selectors = ['[data-label="Buying"]','[data-label="Purchase Order"]','button.primary','[placeholder*="Item"]','button:has-text("Save")'];
      }
      // show lesson panel
      document.getElementById('fg-step-setup').style.display = 'none';
      document.getElementById('fg-lesson').style.display = 'block';
      stepIndex = 0;
      // start listening for clicks
      document.addEventListener('click', onClickHandler, true);
      // first step display + speak
      await displayStepAndPoint(0);
    } catch(e){
      console.error('analyze error', e);
      alert('Failed to analyze job. Check backend.');
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = 'Analyze & Start Lesson';
    }
  }

  function stopLesson(){
    tutorial = []; selectors = []; stepIndex = 0;
    document.getElementById('fg-step-setup').style.display = 'block';
    document.getElementById('fg-lesson').style.display = 'none';
    document.removeEventListener('click', onClickHandler, true);
    highlightAndPoint(null);
    cursor.style.display = 'none';
    speak("Lesson stopped.");
  }

  // Repeat current step (also re-speak)
  async function speakStep(i){
    if (i < 0 || i >= tutorial.length) return;
    const el = findElement(selectors[i], tutorial[i]);
    highlightAndPoint(el);
    await speak(tutorial[i]);
  }

  // wire repeat button
  repeatBtn.onclick = () => speakStep(stepIndex);

  // expose helper for debugging
  window.FG_teacher = {
    startLesson, stopLesson, speakStep, highlightAndPoint, findElement
  };

  console.log('✅ Frappe Live Teacher (cursor mode) loaded');
})();
