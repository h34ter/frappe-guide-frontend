/* ────────── embed.js — Investor Demo Coach (cursor + login‑step fix) ────────── */
(function () {
  if (window.FG_INVESTOR_COACH) return;
  window.FG_INVESTOR_COACH = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0, atlas = [], chosenFeature = null;
  let recording = false, recordEvents = [];

  /* ——————————————  STYLE  —————————————— */
  const css = document.createElement("style");
  css.textContent = `
  .fg-cursor{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
    background:linear-gradient(180deg,rgba(59,130,246,.18),rgba(59,130,246,.08));
    box-shadow:0 8px 30px rgba(59,130,246,.25);z-index:2147483647;display:none;
    align-items:center;justify-content:center;font-size:28px;pointer-events:none;
    transition:left .35s ease,top .35s ease,opacity .2s}
  .fg-panel{position:fixed;bottom:26px;right:26px;width:460px;background:#071024;
    border:1px solid rgba(59,130,246,.14);border-radius:12px;padding:16px;z-index:2147483646;
    color:#e6eef8;font-family:Inter,Arial;font-size:13px;box-shadow:0 10px 40px rgba(2,6,23,.6)}
  .fg-panel input,.fg-panel select{width:100%;padding:9px;margin:8px 0;border:1px solid #1f2a38;
    background:#071224;color:#e6eef8;border-radius:8px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700}
  .fg-small{font-size:12px;color:#9fb0c9}
  .fg-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .fg-card{background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;min-height:78px;display:flex;flex-direction:column;justify-content:space-between}
  .fg-card h4{margin:0;font-size:14px;color:#fff}
  .fg-card p{margin:6px 0 0 0;font-size:12px;color:#9fb0c9}
  .fg-stepcard{padding:10px;background:linear-gradient(90deg,rgba(59,130,246,.04),rgba(59,130,246,.02));
    border-left:4px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6!important;outline-offset:4px!important;border-radius:6px}
  .fg-muted{color:#94a3b8;font-size:12px}
  .fg-tab{position:fixed;top:42%;right:6px;width:46px;height:130px;background:#071224;border:1px solid #1f2a38;border-radius:10px;
    display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;color:#9fb0c9;z-index:2147483650;cursor:pointer;box-shadow:0 8px 20px rgba(2,6,23,.5)}
  .fg-hidden{display:none!important}
  .fg-hud{position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,.12);z-index:2147483655;font-family:Inter,Arial;font-size:13px;display:flex;gap:10px;align-items:center}
  .fg-badge{background:#072033;padding:6px 8px;border-radius:6px;border:1px solid #183047;color:#9fd0ff;font-weight:700}
  .fg-progress{height:8px;background:#0b1220;border-radius:8px;overflow:hidden;margin-top:8px}
  .fg-progress>i{display:block;height:100%;background:linear-gradient(90deg,#60a5fa,#3b82f6);width:0%}
  .fg-options{position:fixed;right:500px;bottom:26px;background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;
    z-index:2147483650;max-height:320px;overflow:auto;width:360px;color:#cfe8ff}
  .fg-options h4{margin:0 0 6px 0}.fg-option-row{display:flex;justify-content:space-between;padding:6px;border-bottom:1px dashed rgba(255,255,255,.03);font-size:13px}`;
  document.head.appendChild(css);

  /* ——————————————  CORE ELEMENTS  —————————————— */
  const cursor = Object.assign(document.createElement("div"), { className: "fg-cursor", textContent: "●", style: "opacity:0" });
  document.body.appendChild(cursor);

  const panel = document.createElement("div");
  panel.className = "fg-panel";
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach <span class="fg-small" style="float:right;font-weight:600;color:#9fb0c9">Investor</span></h3>
    <div id="fg-setup">
      <p class="fg-small" style="margin:0 0 8px">Enter a job and we'll suggest the highest‑impact Frappe features.</p>
      <input id="fg-job" placeholder="e.g., Procurement Manager"/>
      <select id="fg-ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
      <div style="display:flex;gap:8px">
        <button id="fg-analyze" style="flex:1">Discover Opportunities</button>
        <button id="fg-skip"    style="flex:1;background:#071224;border:1px solid #183047">Quick Start</button>
      </div>
    </div>
    <div id="fg-opps" style="display:none">
      <div class="fg-small">Top possibilities</div><div id="fg-cards" class="fg-cards"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-start" style="flex:1">Start Guided Demo</button>
        <button id="fg-back"  style="flex:1;background:#071224;border:1px solid #183047">Back</button>
      </div>
    </div>
    <div id="fg-lesson" style="display:none">
      <div id="fg-info"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-repeat" style="flex:1">Repeat</button>
        <button id="fg-stop"   style="flex:1;background:#ef4444">Stop</button>
      </div>
    </div>`;
  document.body.appendChild(panel);

  const hud = Object.assign(document.createElement("div"), { className: "fg-hud fg-hidden" });
  hud.innerHTML = `<div class="fg-badge">LIVE DEMO</div><div id="fg-hud-txt" style="min-width:180px">Idle</div><div id="fg-rec" style="margin-left:8px">●</div>`;
  document.body.appendChild(hud);
  hud.querySelector("#fg-rec").style.color = "#4b5563";

  const optionsBox = Object.assign(document.createElement("div"), { className: "fg-options fg-hidden", id: "fg-options" });
  optionsBox.innerHTML = `<h4>Options nearby</h4><div id="fg-opt-list"></div>`;
  document.body.appendChild(optionsBox);

  const tab = Object.assign(document.createElement("div"), { className: "fg-tab fg-hidden", textContent: "Demo" });
  document.body.appendChild(tab);

  /* ——————————————  BUTTON HOOKS  —————————————— */
  const $ = sel => panel.querySelector(sel);
  $("#fg-analyze").onclick = runDiscovery;
  $("#fg-skip").onclick = quickStart;
  $("#fg-back").onclick = () => { $("#fg-opps").style.display = "none"; $("#fg-setup").style.display = "block"; };
  $("#fg-start").onclick = () => startLesson(chosenFeature);
  $("#fg-repeat").onclick = () => speakStep(stepIndex);
  $("#fg-stop").onclick = stopLesson;
  tab.onclick = () => { panel.classList.remove("fg-hidden"); tab.classList.add("fg-hidden"); };

  /* ——————————————  T T S  —————————————— */
  function pickVoice() {
    const voices = window.speechSynthesis?.getVoices() || [];
    const preferred = voices.find(v => /Google US English/i.test(v.name)) ||
                      voices.find(v => /female/i.test(v.name)) ||
                      voices[0];
    return preferred || null;
  }
  async function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.voice = pickVoice();
    ut.lang = 'en-US';
    return new Promise(res => { ut.onend = res; window.speechSynthesis.speak(ut); });
  }

  /* ——————————————  CURSOR / ELEMENT FIND  —————————————— */
  const HEADER_FILTER = el => {
    const r = el.getBoundingClientRect();
    if (r.top < 70) return true;                     // in very top bar
    if (el.closest("header,.navbar")) return true;   // inside header/navbars
    if (/(brand|logo)/i.test(el.className || "")) return true;
    return false;
  };

  function isActionable(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (["button", "a", "input", "select", "textarea"].includes(tag)) return true;
    if (el.getAttribute("role") === "button") return true;
    if (el.hasAttribute("data-label")) return true;
    return false;
  }

  function findElement(selector, fallbackText) {
    // 1‑ Exact selector
    if (selector) {
      const parts = selector.split(",").map(s => s.trim()).filter(Boolean);
      for (const sel of parts) {
        try {
          const el = document.querySelector(sel);
          if (el && el.offsetParent && !HEADER_FILTER(el)) return el;
        } catch { /* ignore */ }
      }
    }
    // 2‑ by text match
    const txt = (fallbackText || "").toLowerCase();
    if (txt) {
      const pool = [...document.querySelectorAll("button,a,input,select,[role='button'],[data-label]")].filter(e => e.offsetParent && !HEADER_FILTER(e));
      for (const el of pool) {
        const label = (el.innerText || el.getAttribute("placeholder") || el.getAttribute("aria-label") || el.getAttribute("data-label") || "").trim().toLowerCase();
        if (label && label.includes(txt)) return el;
      }
    }
    // 3‑ last resort: any visible actionable not in header
    return [...document.querySelectorAll("button,a,input,select,[role='button'],[data-label]")]
      .find(e => e.offsetParent && !HEADER_FILTER(e)) || null;
  }

  async function highlightAndPoint(el) {
    document.querySelectorAll("[data-fg-h]").forEach(x => { x.classList.remove("fg-outline"); x.removeAttribute("data-fg-h"); });
    if (!el) { cursor.style.display = "none"; cursor.style.opacity = "0"; return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await new Promise(r => setTimeout(r, 200));
    const r = el.getBoundingClientRect();
    cursor.style.left = r.left + r.width / 2 - 30 + window.scrollX + "px";
    cursor.style.top  = r.top  + r.height/ 2 - 30 + window.scrollY + "px";
    cursor.style.display = "flex"; cursor.style.opacity = "1";
    el.classList.add("fg-outline"); el.setAttribute("data-fg-h", "1");
    setTimeout(() => { el.classList.remove("fg-outline"); el.removeAttribute("data-fg-h"); }, 9000);
  }

  /* ——————————————  DISCOVERY / FLOW  —————————————— */
  async function runDiscovery() {
    const job = $("#fg-job").value.trim();
    const industry = $("#fg-ind").value;
    if (!job) return alert("Enter job");

    $("#fg-analyze").disabled = true;
    hud.classList.remove("fg-hidden"); hud.querySelector("#fg-hud-txt").textContent = "Analyzing…";

    try {
      const r = await fetch(API + "/analyze-job", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job, industry }) });
      const data = await r.json();
      tutorial   = data.tutorial   || [];
      selectors  = data.selectors  || [];
      pruneTutorialIfLoggedIn();
      atlas      = await (await fetch(API + "/atlas")).json();
      showOpportunities(scoreAtlas(atlas, job), job, industry);
    } catch (err) {
      alert("Backend error"); console.error(err);
    } finally {
      $("#fg-analyze").disabled = false;
      hud.classList.add("fg-hidden");
    }
  }

  /* remove any leading “log in” step if already inside the app */
  function pruneTutorialIfLoggedIn() {
    const alreadyInside = !/\/login/i.test(location.pathname) && !document.querySelector("form[action*='login']");
    while (alreadyInside && tutorial.length && /log[\s-]?in/i.test(tutorial[0])) {
      tutorial.shift(); selectors.shift();
    }
  }

  /* simple relevance scoring for cards */
  function scoreAtlas(atlas, job) {
    const jw = job.toLowerCase().split(/\s+/);
    return atlas.map(a => {
      const label = (a.label || "").toLowerCase();
      let score = jw.reduce((s, w) => s + (label.includes(w) ? 2 : 0), 0);
      if (/buying|selling|purchase|sales/.test(label)) score += 1;
      return { a, score };
    }).sort((x, y) => y.score - x.score).slice(0, 8).map(x => x.a);
  }

  /* cards > preview/guide */
  function showOpportunities(cards, job, industry) {
    $("#fg-setup").style.display = "none";
    $("#fg-opps").style.display = "block";
    const cardsBox = $("#fg-cards"); cardsBox.innerHTML = "";
    chosenFeature = null;

    for (const c of cards) {
      const card = Object.assign(document.createElement("div"), { className: "fg-card" });
      card.innerHTML = `<h4>${c.label}</h4><p>${c.module || ""}</p>
        <div style="display:flex;gap:8px">
          <button class="prev">Preview</button>
          <button class="guide" style="background:#071224;border:1px solid #183047">Guide</button>
        </div>`;
      cardsBox.appendChild(card);
      card.querySelector(".prev").onclick  = () => speak(`${c.label} speeds up ${job} work by automating key steps.`);
      card.querySelector(".guide").onclick = () => { chosenFeature = c; startLesson(c); };
    }
  }

  /* start quick demo */
  async function quickStart() {
    const job = $("#fg-job").value.trim() || "User";
    const industry = $("#fg-ind").value;
    const r = await fetch(API + "/analyze-job", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job, industry }) });
    const data = await r.json();
    tutorial  = data.tutorial  || [];
    selectors = data.selectors || [];
    pruneTutorialIfLoggedIn();
    startLesson(null);
  }

  /* lesson */
  async function startLesson(feature) {
    $("#fg-setup").style.display = "none";
    $("#fg-opps").style.display = "none";
    $("#fg-lesson").style.display = "block";
    panel.classList.add("fg-hidden"); tab.classList.remove("fg-hidden");
    stepIndex = 0; document.addEventListener("click", clickHandler, true);
    speak("Starting demo."); displayStepAndPoint(0);
  }

  async function displayStepAndPoint(i) {
    if (!tutorial[i]) return;
    $("#fg-info").innerHTML = `<div class="fg-stepcard"><strong>Step ${i + 1}/${tutorial.length}</strong><div style="margin-top:8px">${tutorial[i]}</div></div>`;
    renderProgress();
    await highlightAndPoint(findElement(selectors[i], tutorial[i]));
    speak(tutorial[i]);
  }

  async function speakStep(i) { if (tutorial[i]) { await highlightAndPoint(findElement(selectors[i], tutorial[i])); speak(tutorial[i]); } }

  async function clickHandler(e) {
    const ok = findElement(selectors[stepIndex], tutorial[stepIndex]);
    if (ok && (ok === e.target || ok.contains(e.target))) {
      stepIndex++;
      if (stepIndex >= tutorial.length) { speak("Demo complete."); stopLesson(); return; }
      displayStepAndPoint(stepIndex);
    } else {
      speak("Look for the highlighted control.");
      highlightAndPoint(ok);
    }
  }

  function stopLesson() {
    document.removeEventListener("click", clickHandler, true);
    panel.classList.remove("fg-hidden"); tab.classList.add("fg-hidden");
    $("#fg-lesson").style.display = "none"; $("#fg-setup").style.display = "block";
    cursor.style.opacity = 0; speak("Lesson ended.");
  }

  /* ———  HUD / progress  ——— */
  function renderProgress() {
    if (!document.getElementById("fg-bar")) {
      const bar = Object.assign(document.createElement("div"), { className: "fg-progress", id: "fg-bar" });
      bar.innerHTML = "<i></i>"; hud.appendChild(bar);
    }
    hud.classList.remove("fg-hidden");
    hud.querySelector("#fg-hud-txt").textContent = `Step ${stepIndex + 1}/${tutorial.length}`;
    hud.querySelector("#fg-bar i").style.width = `${((stepIndex) / tutorial.length) * 100}%`;
  }

  /* ———  options near (kept hidden unless user presses O)  ——— */
  function showOptionsNear(el) {
    const list = optionsBox.querySelector("#fg-opt-list"); list.innerHTML = "";
    if (!el) return;
    const base = el.getBoundingClientRect();
    const pool = [...document.querySelectorAll("button,a,input,select,[role='button'],[data-label]")].filter(x => x.offsetParent && !HEADER_FILTER(x));
    pool.filter(p => {
      const r = p.getBoundingClientRect();
      return Math.hypot(r.left - base.left, r.top - base.top) < 600;
    }).slice(0, 20).forEach(p => {
      const lab = (p.innerText || p.getAttribute("data-label") || "").trim().slice(0, 40) || "<no label>";
      const row = Object.assign(document.createElement("div"), { className: "fg-option-row" });
      row.textContent = lab; list.appendChild(row);
    });
  }

  /* ———  keyboard  ——— */
  document.addEventListener("keydown", e => {
    if (["N", "n"].includes(e.key)) { e.preventDefault(); if (stepIndex < tutorial.length - 1) { stepIndex++; displayStepAndPoint(stepIndex); } }
    if (["P", "p"].includes(e.key)) { e.preventDefault(); if (stepIndex > 0) { stepIndex--; displayStepAndPoint(stepIndex); } }
    if (["R", "r", " "].includes(e.key)) { e.preventDefault(); speakStep(stepIndex); }
    if (["O", "o"].includes(e.key)) { e.preventDefault(); optionsBox.classList.toggle("fg-hidden"); }      // toggle options panel
    if (["H", "h"].includes(e.key)) { e.preventDefault(); hud.classList.toggle("fg-hidden"); }            // toggle hud
  });

  console.log("✅ Frappe Demo Coach v3 loaded (cursor fix + login‑step pruning)");
})();
