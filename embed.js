/* embed.js — fixes stuck cursor by ignoring header/logo and preferring main-content actionable elements */
(function(){
  if (window.FG_CURSOR_FIXED) return;
  window.FG_CURSOR_FIXED = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0;

  /* styles (kept minimal) */
  const s = document.createElement('style');
  s.textContent = `
  .fg-cursor{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
    background:rgba(59,130,246,0.18);box-shadow:0 0 40px rgba(59,130,246,0.9);z-index:2147483647;display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;transition:left .35s cubic-bezier(.2,.9,.2,1),top .35s cubic-bezier(.2,.9,.2,1),opacity .12s}
  .fg-outline{outline:4px solid #3B82F6!important;outline-offset:4px!important;border-radius:6px}
  .fg-panel{position:fixed;bottom:30px;right:30px;width:420px;background:#0f172a;border:2px solid #3B82F6;border-radius:10px;padding:16px;z-index:2147483646;color:#f3f4f6;font-family:Arial;font-size:13px}
  .fg-stepcard{padding:10px;background:rgba(59,130,246,0.06);border-left:3px solid #3B82F6;margin-top:10px;border-radius:6px}
  `;
  document.head.appendChild(s);

  /* cursor */
  const cursor = document.createElement('div');
  cursor.className = 'fg-cursor';
  cursor.textContent = '●';
  cursor.style.opacity = '0';
  document.body.appendChild(cursor);

  /* simple panel */
  const panel = document.createElement('div');
  panel.className = 'fg-panel';
  panel.innerHTML = `<h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Coach</h3>
    <input id="fg-job" placeholder="Job title (e.g., Procurement Manager)" style="width:100%;padding:8px;margin-bottom:8px;border-radius:6px;border:1px solid #334155;background:#0b1220;color:#f3f4f6" />
    <select id="fg-ind" style="width:100%;padding:8px;margin-bottom:8px;border-radius:6px;border:1px solid #334155;background:#0b1220;color:#f3f4f6"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
    <div style="display:flex;gap:8px"><button id="fg-analyze" style="flex:1">Discover</button><button id="fg-quick" style="flex:1;background:#0b1220;border:1px solid #334155">Quick</button></div>
    <div id="fg-info" style="margin-top:10px"></div>`;
  document.body.appendChild(panel);

  document.getElementById('fg-analyze').onclick = runDiscovery;
  document.getElementById('fg-quick').onclick = quickStart;

  /* --- BLACKLIST / PREFERENCES --- */
  // CSS selectors (elements matching these will be ignored as targets)
  const IGNORE_SELECTOR_MATCH = [
    'header', '.navbar', '.topbar', '.site-header', '.brand', '.logo', '.app-logo', '.erpnext-sidebar', '.sidebar', '.page-head', '.page-header'
  ];

  // ancestor class patterns to ignore if found in element's ancestors
  const IGNORE_ANCESTOR_HINTS = ['logo', 'brand', 'header', 'navbar', 'topbar', 'app-header', 'page-head', 'site-header'];

  // minimal visible size (px) to consider element meaningful
  const MIN_WIDTH = 28;
  const MIN_HEIGHT = 10;

  /* UTIL: is element inside a blacklisted ancestor? */
  function hasIgnoredAncestor(el){
    try {
      let p = el;
      while (p && p !== document.body){
        const cls = (p.className || '') + '';
        if (typeof cls === 'string'){
          for (const hint of IGNORE_ANCESTOR_HINTS){
            if (cls.toLowerCase().includes(hint)) return true;
          }
        }
        const tag = (p.tagName || '').toLowerCase();
        if (IGNORE_SELECTOR_MATCH.includes(tag)) return true;
        p = p.parentElement;
      }
    } catch(e){}
    return false;
  }

  /* UTIL: is element too small / invisible / outside viewport? */
  function isMeaningfulVisible(el){
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < MIN_WIDTH || rect.height < MIN_HEIGHT) return false;
    if (rect.bottom < 0 || rect.top > (window.innerHeight || document.documentElement.clientHeight)) return false;
    return true;
  }

  /* UTIL: is element actionable? */
  function isActionable(el){
    if(!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (['button','a','input','select','textarea'].includes(tag)) return true;
    const role = (el.getAttribute && el.getAttribute('role')) || '';
    if (['button','link','menuitem','option'].includes(role)) return true;
    if (el.hasAttribute && el.hasAttribute('data-label')) return true;
    const cls = (el.className || '') + '';
    if (/\b(btn|btn-primary|action|link)\b/.test(cls)) return true;
    try {
      if (typeof el.onclick === 'function') return true;
      if (el.getAttribute && el.getAttribute('onclick')) return true;
    } catch(e){}
    return false;
  }

  /* find element: improved logic */
  function findElement(selector, textFallback){
    console.debug('findElement called selector=', selector, 'textFallback=', textFallback && textFallback.slice(0,60));
    // 1) try selector(s) but filter out header/logo ancestors and tiny elements
    if (selector){
      const parts = selector.split(',').map(s=>s.trim()).filter(Boolean);
      for (const p of parts){
        try {
          const el = document.querySelector(p);
          if (el && isMeaningfulVisible(el) && !hasIgnoredAncestor(el) && isActionable(el)) { console.debug('matched selector', p, el); return el; }
          // if selected element is not actionable, try nearest actionable inside it
          if (el && isMeaningfulVisible(el) && !hasIgnoredAncestor(el)){
            const near = findNearestActionable(el);
            if (near) { console.debug('near match inside selector', p, near); return near; }
          }
        } catch(e){ /* invalid selector, ignore */ }
      }
    }

    // 2) try high-quality text matches: exact or whole-word matches in visible actionable pool, prefer elements inside main content region
    const poolSelectors = 'button, a, input, select, [role="button"], [data-label], .btn, .btn-primary';
    const pool = Array.from(document.querySelectorAll(poolSelectors)).filter(e=>isMeaningfulVisible(e) && !hasIgnoredAncestor(e));
    const text = (textFallback||'').trim();
    if (text){
      const normalized = text.toLowerCase().replace(/\s+/g,' ').trim();
      // prefer exact text equals for buttons/labels
      for (const el of pool){
        const label = ((el.innerText || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('data-label') || '')+'').trim().replace(/\s+/g,' ').toLowerCase();
        if (!label) continue;
        // exact or startsWith or whole word boundary
        if (label === normalized || label.startsWith(normalized) || new RegExp('\\b' + escapeRegex(normalized) + '\\b').test(label)){
          console.debug('text exact match', label, el);
          return el;
        }
      }
      // second pass: includes match but prefer ones inside main content (below header offset)
      const headerThreshold = Math.max(64, getHeaderHeight());
      const candidates = pool.filter(el => {
        const r = el.getBoundingClientRect();
        if ((r.top + r.bottom)/2 < headerThreshold) return false; // above threshold => likely header/logo
        return true;
      });
      for (const el of candidates){
        const label = ((el.innerText || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('data-label') || '')+'').trim().replace(/\s+/g,' ').toLowerCase();
        if (!label) continue;
        if (label.includes(normalized) || normalized.includes(label)) {
          console.debug('text includes match (main area)', label, el);
          return el;
        }
      }
    }

    // 3) try searching by larger DOM text nodes (not header), find nearest actionable
    if (text){
      const normalized = text.toLowerCase().split(/\s+/).slice(0,5).join(' ');
      const all = Array.from(document.querySelectorAll('body *')).filter(n => {
        if (n.children && n.children.length) return false;
        if (!isMeaningfulVisible(n)) return false;
        if (hasIgnoredAncestor(n)) return false;
        return true;
      });
      // rank by textual match length and being below header threshold
      let best = null; let bestScore = 0;
      const headerThreshold = Math.max(64, getHeaderHeight());
      for (const n of all){
        const t = (n.innerText||'').trim().replace(/\s+/g,' ').toLowerCase();
        if (!t) continue;
        let score = 0;
        if (t.includes(normalized)) score += 5;
        if (normalized.includes(t)) score += 3;
        // penalize things in header area
        const r = n.getBoundingClientRect();
        if ((r.top + r.bottom)/2 < headerThreshold) score -= 4;
        if (score <= 0) continue;
        // try to find nearest actionable inside/near n
        const near = findNearestActionable(n);
        if (near && isMeaningfulVisible(near) && !hasIgnoredAncestor(near)){
          score += 2;
          if (score > bestScore){ bestScore = score; best = near; }
        }
      }
      if (best){ console.debug('found best by DOM text search', best); return best; }
    }

    // 4) fallback: first visible actionable not in header
    const allClickable = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e => isMeaningfulVisible(e) && !hasIgnoredAncestor(e));
    if (allClickable.length) { console.debug('fallback clickable', allClickable[0]); return allClickable[0]; }

    // 5) if nothing, allow header buttons (last resort)
    const fallbackAll = Array.from(document.querySelectorAll('button, a')).filter(e => isMeaningfulVisible(e));
    if (fallbackAll.length) return fallbackAll[0];
    return null;
  }

  function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

  function getHeaderHeight(){
    // try common header selectors to compute a threshold for "above header" elements
    const candidates = Array.from(document.querySelectorAll('header, .navbar, .topbar, .page-head, .site-header'));
    if (candidates.length){
      let max = 0;
      for (const c of candidates){
        try { const r = c.getBoundingClientRect(); if (r.height > max) max = r.height; } catch(e){}
      }
      if (max > 0) return max + 16;
    }
    // fallback typical header
    return 80;
  }

  function findNearestActionable(startEl){
    if (!startEl) return null;
    if (isActionable(startEl) && isMeaningfulVisible(startEl) && !hasIgnoredAncestor(startEl)) return startEl;
    // search children first
    try {
      const child = startEl.querySelector && startEl.querySelector('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary');
      if (child && isMeaningfulVisible(child) && !hasIgnoredAncestor(child)) return child;
    } catch(e){}
    // search siblings and parent
    let p = startEl.parentElement;
    let depth = 0;
    while (p && depth < 4){
      try {
        const candidate = p.querySelector && p.querySelector('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary');
        if (candidate && isMeaningfulVisible(candidate) && !hasIgnoredAncestor(candidate)) return candidate;
      } catch(e){}
      p = p.parentElement; depth++;
    }
    // as last resort, search global pool but avoid header
    const pool = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [data-label], .btn, .btn-primary')).filter(e=>isMeaningfulVisible(e) && !hasIgnoredAncestor(e));
    if (pool.length) {
      // choose the one with bounding rect closest to startEl's rect center if available
      try {
        const ref = startEl.getBoundingClientRect();
        let best = pool[0], bestD = Infinity;
        for (const c of pool){
          const r = c.getBoundingClientRect();
          const d = Math.hypot((r.left + r.width/2) - (ref.left + ref.width/2), (r.top + r.height/2) - (ref.top + ref.height/2));
          if (d < bestD){ bestD = d; best = c; }
        }
        return best;
      } catch(e){}
      return pool[0];
    }
    return null;
  }

  /* highlight + point */
  async function highlightAndPoint(el){
    document.querySelectorAll('[data-fg-highlight]').forEach(x=>{
      x.classList.remove('fg-outline');
      x.removeAttribute('data-fg-highlight');
    });
    if (!el){ cursor.style.display='none'; cursor.style.opacity='0'; return; }
    // ensure el actionable
    if (!isActionable(el)){
      const near = findNearestActionable(el);
      if (near) el = near;
    }
    if (!el){ cursor.style.display='none'; cursor.style.opacity='0'; return; }
    // scroll to center but ensure not to center header/logo
    try { el.scrollIntoView({behavior:'smooth', block:'center', inline:'center'}); await waitForScrollToFinish(el); } catch(e){}
    await new Promise(r=>setTimeout(r,120));
    const rect = el.getBoundingClientRect();
    const left = rect.left + rect.width/2 - 30 + window.scrollX;
    const top  = rect.top + rect.height/2 - 30 + window.scrollY;
    cursor.style.display='flex';
    cursor.style.left = left + 'px';
    cursor.style.top = top + 'px';
    cursor.style.opacity = '1';
    el.classList.add('fg-outline'); el.setAttribute('data-fg-highlight','true');
    setTimeout(()=>{ try{ if (el && el.getAttribute && el.getAttribute('data-fg-highlight')){ el.classList.remove('fg-outline'); el.removeAttribute('data-fg-highlight'); } }catch(e){} }, 8000);
  }

  function waitForScrollToFinish(targetEl, timeout = 900){
    return new Promise(resolve => {
      const start = Date.now();
      const tick = ()=>{
        try {
          const rect = targetEl.getBoundingClientRect();
          const centerY = window.innerHeight/2;
          const centerX = window.innerWidth/2;
          const dy = Math.abs((rect.top + rect.bottom)/2 - centerY);
          const dx = Math.abs((rect.left + rect.right)/2 - centerX);
          if (dy < 30 && dx < 40) return resolve();
        } catch(e){}
        if (Date.now() - start > timeout) return resolve();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* --- flow: analyze-job -> show first step and point --- */
  async function runDiscovery(){
    const job = document.getElementById('fg-job').value.trim();
    const ind = document.getElementById('fg-ind').value;
    if (!job) return alert('Enter job');
    document.getElementById('fg-info').innerHTML = '<div class="fg-stepcard">Analyzing...</div>';
    try {
      const r = await fetch(API + '/analyze-job', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ job, industry: ind }) });
      if (!r.ok) throw new Error('analyze-job failed ' + r.status);
      const data = await r.json();
      tutorial = data.tutorial || [];
      selectors = data.selectors || [];
      stepIndex = 0;
      document.getElementById('fg-info').innerHTML = `<div class="fg-stepcard"><strong>Step 1/${tutorial.length}</strong><div style="margin-top:8px">${tutorial[0]||'—'}</div></div>`;
      // find & point first
      const el = findElement(selectors[0] || '', tutorial[0] || '');
      console.debug('element chosen for step0', el);
      await highlightAndPoint(el);
    } catch (err){
      console.error('Discovery error', err);
      document.getElementById('fg-info').innerHTML = `<div class="fg-stepcard" style="border-left-color:#ef4444"><strong>Error</strong><div style="margin-top:8px">${String(err)}</div></div>`;
    }
  }

  async function quickStart(){
    // call analyze with a default
    document.getElementById('fg-job').value = document.getElementById('fg-job').value || 'Procurement Manager';
    await runDiscovery();
  }

  /* expose for debug */
  window.FG_FIND = { findElement, highlightAndPoint, hasIgnoredAncestor, isMeaningfulVisible };

  console.log('✅ embed (cursor fixes) loaded — findElement will avoid header/logo. Use Discover.');
})();
