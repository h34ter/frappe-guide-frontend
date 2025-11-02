/* ── FG DEBUG TOOL — Paste this into your page console ── */
(function(){
  if (window.FG_DEBUG_TOOL) {
    console.log('FG_DEBUG_TOOL already running');
    return;
  }
  window.FG_DEBUG_TOOL = true;
  console.log('FG_DEBUG_TOOL started — will inspect current demo step and DOM candidates');

  // helper: get current step text shown by demo
  function getCurrentStepText(){
    const info = document.getElementById('fg-info');
    if (!info) return null;
    const s = info.innerText || info.textContent || '';
    const m = s.match(/Step\s*\d+\/\d+\s*(?:\n)?(.*)$/m);
    // fallback: take the first non-empty line inside
    if (m && m[1]) return m[1].trim();
    // or find the stepcard content
    const stepCard = info.querySelector && info.querySelector('.fg-step, .fg-stepcard');
    if (stepCard) return (stepCard.innerText||'').replace(/^Step.*\n/,'').trim();
    // fallback: entire text
    return s.trim().split('\n').slice(1).join(' ').trim() || s.trim();
  }

  // Candidate finder (same approach used by demo, but instrumented with logs)
  const SELECTORS = "button,a,input,select,[role='button'],[data-label],.module-link,.link-item";
  function isVisible(el){
    try{
      return el && el.offsetParent !== null && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
    }catch(e){ return false; }
  }
  function inTopBar(el){
    try{
      if (!el) return true;
      const r = el.getBoundingClientRect();
      if (r.top < 60) return true;
      if (el.closest && el.closest('header, .navbar, .app-header')) return true;
      if (/(logo|brand|navbar)/i.test(el.className || '')) return true;
      return false;
    }catch(e){ return true; }
  }
  function nearestActionable(start){
    if (!start) return null;
    const tag = (start.tagName||'').toLowerCase();
    if (['button','a','input','select','textarea'].includes(tag) && isVisible(start) && !inTopBar(start)) return start;
    const inside = start.querySelector && Array.from(start.querySelectorAll(SELECTORS)).find(e=>isVisible(e) && !inTopBar(e));
    if (inside) return inside;
    let p = start.parentElement;
    let depth = 0;
    while(p && depth < 6){
      if (isVisible(p) && !inTopBar(p) && (['button','a','input','select'].includes((p.tagName||'').toLowerCase()) || p.getAttribute && p.getAttribute('role')==='button')) return p;
      const found = p.querySelector && p.querySelector(SELECTORS);
      if (found && isVisible(found) && !inTopBar(found)) return found;
      p = p.parentElement; depth++;
    }
    return null;
  }

  function buildFingerprint(el){
    if (!el) return null;
    const parts = [];
    if (el.id) parts.push('#'+el.id);
    if (el.className) parts.push('.'+(el.className.split(/\s+/)[0]||'').replace(/\s+/g,''));
    const txt = (el.innerText||el.getAttribute('aria-label')||el.getAttribute('placeholder')||el.getAttribute('data-label')||'').toString().trim();
    return { tag: (el.tagName||'').toLowerCase(), id: el.id||null, cls: el.className||null, text: txt.slice(0,80) };
  }

  function getCandidates(selector, fallbackText, limit=6){
    const set = new Map();
    function add(el,score){
      if (!el || set.has(el)) return;
      if (!isVisible(el)) return;
      if (inTopBar(el)) return;
      set.set(el, score);
    }

    // exact selector attempts
    if (selector){
      selector.split(',').forEach(s=>{
        try{
          const el = document.querySelector(s.trim());
          if (el) add(nearestActionable(el) || el, 100);
        }catch(e){}
      });
    }

    const q = (fallbackText||'').toLowerCase().trim();

    // pool of actionable items
    const pool = Array.from(document.querySelectorAll(SELECTORS)).filter(e=>isVisible(e) && !inTopBar(e));
    pool.forEach(el=>{
      const label = ((el.innerText||el.value||el.getAttribute('data-label')||el.getAttribute('aria-label')||'') + '').trim().toLowerCase();
      if (!label) return;
      if (label === q) add(el, 90);
      else if (label.startsWith(q)) add(el, 70);
      else if (label.includes(q)) add(el, 50);
    });

    // deep text search in DOM leaves
    if (q){
      Array.from(document.querySelectorAll('body *')).filter(n=>n.children.length===0 && isVisible(n) && !inTopBar(n)).forEach(n=>{
        const t = (n.innerText||'').trim().toLowerCase();
        if (!t) return;
        if (t.includes(q)) add(nearestActionable(n) || n, 40);
      });
    }

    // finally add the first few visible actions as fallback
    pool.slice(0,10).forEach((p,i)=> add(p, 10 - i));

    return [...set.entries()].map(([el,score])=>({el,score,fingerprint: buildFingerprint(el), rect: el.getBoundingClientRect()})).sort((a,b)=>b.score - a.score).slice(0,limit);
  }

  // Debug UI
  const dbg = document.createElement('div');
  dbg.id = 'fg-debug';
  dbg.style = 'position:fixed;left:12px;bottom:12px;width:420px;max-height:46vh;overflow:auto;background:rgba(3,7,18,.95);color:#dbeafe;border:1px solid rgba(59,130,246,.12);padding:10px;border-radius:8px;font-family:Inter,Arial;font-size:13px;z-index:2147483700';
  dbg.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
    <strong style="color:#93c5fd">FG DEBUG</strong>
    <div style="display:flex;gap:8px">
      <button id="fg-debug-refresh" style="background:#2563eb;color:#fff;padding:6px;border-radius:6px;border:none;cursor:pointer">Refresh</button>
      <button id="fg-debug-close" style="background:#111827;color:#fff;padding:6px;border-radius:6px;border:none;cursor:pointer">Close</button>
    </div>
  </div>
  <div id="fg-debug-current" style="margin-bottom:8px;color:#cfe8ff">current step: <em style="color:#9fb0c9">(none)</em></div>
  <div id="fg-debug-list"></div>
  <div style="margin-top:8px;color:#94a3b8;font-size:12px">Click a candidate to simulate/select it (useful for testing).</div>
  `;
  document.body.appendChild(dbg);

  function refreshDebug(){
    const stepText = getCurrentStepText() || '(no step visible)';
    dbg.querySelector('#fg-debug-current em').textContent = stepText;
    dbg.querySelector('#fg-debug-list').innerHTML = '<div style="color:#93c5fd;margin-bottom:6px">Candidates:</div>';
    const cands = getCandidates(null, stepText, 12);
    if (!cands.length) dbg.querySelector('#fg-debug-list').innerHTML += '<div style="color:#fca5a5">— no candidates found —</div>';
    cands.forEach((c, i) => {
      const row = document.createElement('div');
      row.style = 'padding:8px;border-radius:6px;margin-bottom:6px;background:rgba(255,255,255,.03);cursor:pointer';
      row.innerHTML = `<div style="display:flex;justify-content:space-between"><div style="font-weight:700">${c.fingerprint.tag} ${c.fingerprint.id ? c.fingerprint.id : ''} ${c.fingerprint.cls ? c.fingerprint.cls.split(' ')[0] : ''}</div><div style="color:#9fb0c9">score ${c.score}</div></div>
                       <div style="color:#cfe8ff;margin-top:6px">${(c.fingerprint.text||'<no text>')}</div>
                       <div style="color:#94a3b8;margin-top:6px;font-size:12px">rect: left ${Math.round(c.rect.left)}, top ${Math.round(c.rect.top)}, w ${Math.round(c.rect.width)}, h ${Math.round(c.rect.height)}</div>`;
      row.onclick = (ev)=>{
        ev.stopPropagation();
        console.log('DEBUG: Candidate clicked (index)', i, c);
        // highlight it (visual)
        document.querySelectorAll('[data-fg-debug]').forEach(x=>{x.removeAttribute('data-fg-debug'); x.style.outline='';});
        c.el.setAttribute('data-fg-debug','1'); c.el.style.outline='4px solid #f59e0b'; c.el.style.outlineOffset='4px';
        // simulate click event on found element (allow demo handlers to catch it)
        try{ c.el.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){}
        setTimeout(()=>{ c.el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window})); }, 200);
        // also log to console the outerHTML snippet for inspection
        const snippet = (c.el.outerHTML||'').slice(0,400).replace(/\n/g,' ');
        console.log('DEBUG: outerHTML snippet:', snippet);
      };
      dbg.querySelector('#fg-debug-list').appendChild(row);
    });
    console.log('FG_DEBUG: refreshed — stepText=', stepText, 'candidates=', cands);
  }

  // wire buttons
  dbg.querySelector('#fg-debug-refresh').onclick = refreshDebug;
  dbg.querySelector('#fg-debug-close').onclick = ()=>{
    document.querySelectorAll('[data-fg-debug]').forEach(x=>{ x.style.outline=''; x.removeAttribute('data-fg-debug'); });
    dbg.remove(); window.FG_DEBUG_TOOL = false; console.log('FG_DEBUG_TOOL closed');
  };

  // initial run
  refreshDebug();

  // Auto refresh when step changes — poll the #fg-info text
  let lastStep = getCurrentStepText();
  const poll = setInterval(()=>{
    const s = getCurrentStepText();
    if (s !== lastStep){
      lastStep = s;
      console.log('FG_DEBUG: detected step change ->', s);
      refreshDebug();
    }
  }, 900);

  // also expose a manual trigger on window for remote debugging
  window.FG_DEBUG_TOOL_REFRESH = refreshDebug;
  window.FG_DEBUG_TOOL_STOP = ()=>{ clearInterval(poll); console.log('FG_DEBUG_TOOL stopped poll'); };

  console.log('FG_DEBUG_TOOL ready — open the debug panel bottom-left, click Refresh after triggering the problem. Then paste console logs here.');
})();
