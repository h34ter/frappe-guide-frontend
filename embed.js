/* ───────────────────  embed.js  —  Frappe Demo Coach v4  ───────────────────
   Blue outline  +  pointer disc  +  never‑block progression  (10 s timeout)
   © 2025 – free to use in demos
──────────────────────────────────────────────────────────────────────────── */
(() => {
  if (window.FG_DEMO_COACH) return;        // prevent double‑load
  window.FG_DEMO_COACH = true;

  /* ---------------------------------------------------------------------- *
   *  Configuration
   * ---------------------------------------------------------------------- */
  const API      = "https://frappe-guide-backend.onrender.com";
  const TIMEOUT  = 10000;        // auto‑advance after 10 s
  const MAX_OPTS = 6;            // how many alternative elements to list
  const SELECTORS = "button,a,input,select,[role='button'],[data-label],.module-link,.link-item";

  /* ---------------------------------------------------------------------- *
   *  State vars
   * ---------------------------------------------------------------------- */
  let tutorial = [], selectors = [], stepIdx = 0, autoTimer = null;

  /* ---------------------------------------------------------------------- *
   *  Style
   * ---------------------------------------------------------------------- */
  const css = document.createElement("style");
  css.textContent = `
  .fg-panel   {position:fixed;bottom:26px;right:26px;width:460px;background:#071024;
               border:1px solid rgba(59,130,246,.14);border-radius:12px;padding:16px;
               z-index:2147483646;color:#e6eef8;font-family:Inter,Arial;font-size:13px;
               box-shadow:0 10px 40px rgba(2,6,23,.6)}
  .fg-panel input,.fg-panel select{width:100%;padding:9px;margin:8px 0;border:1px solid #1f2a38;
               background:#071224;color:#e6eef8;border-radius:8px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:8px;
               cursor:pointer;font-weight:700}
  .fg-card    {background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;
               min-height:78px;display:flex;flex-direction:column;justify-content:space-between}
  .fg-card h4 {margin:0;font-size:14px;color:#fff}
  .fg-card p  {margin:6px 0 0;font-size:12px;color:#9fb0c9}
  .fg-step    {padding:10px;background:linear-gradient(90deg,rgba(59,130,246,.04),rgba(59,130,246,.02));
               border-left:4px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline {outline:4px solid #3B82F6!important;outline-offset:4px!important;border-radius:6px;transition:outline .3s}
  .fg-tab     {position:fixed;top:42%;right:6px;width:46px;height:130px;background:#071224;
               border:1px solid #1f2a38;border-radius:10px;display:flex;align-items:center;justify-content:center;
               writing-mode:vertical-rl;color:#9fb0c9;z-index:2147483650;cursor:pointer;box-shadow:0 8px 20px rgba(2,6,23,.5)}
  .fg-hidden  {display:none!important}
  .fg-hud     {position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;
               border:1px solid rgba(59,130,246,.12);z-index:2147483655;font-family:Inter,Arial;font-size:13px;
               display:flex;gap:10px;align-items:center}
  .fg-badge   {background:#072033;padding:6px 8px;border-radius:6px;border:1px solid #183047;color:#9fd0ff;font-weight:700}
  .fg-progress{height:8px;background:#0b1220;border-radius:8px;overflow:hidden;margin-top:8px}
  .fg-progress>i{display:block;height:100%;background:linear-gradient(90deg,#60a5fa,#3b82f6);width:0%}
  .fg-options {position:fixed;bottom:26px;right:26px;background:#071327;border:1px solid rgba(59,130,246,.06);
               padding:10px 12px;border-radius:8px;z-index:2147483644;max-height:260px;overflow:auto;width:300px;color:#cfe8ff}
  .fg-options h4{margin:0 0 6px;font-size:13px;color:#9fb0c9;letter-spacing:.4px;text-transform:uppercase}
  .fg-option-row{font-size:13px;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.03)}
  /* pointer disc */
  #fg-pointer {position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
               background:linear-gradient(180deg,rgba(59,130,246,.18),rgba(59,130,246,.08));
               box-shadow:0 8px 30px rgba(59,130,246,.25);pointer-events:none;z-index:2147483645;
               transition:left .35s ease,top .35s ease,opacity .25s;opacity:0}`;
  document.head.appendChild(css);

  /* ---------------------------------------------------------------------- *
   *  Static DOM
   * ---------------------------------------------------------------------- */
  const panel = document.createElement("div");
  panel.className = "fg-panel";
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach <span style="float:right;font-size:12px;font-weight:600;color:#9fb0c9">Investor</span></h3>
    <div id="fg-setup">
      <input id="fg-job" placeholder="e.g., Procurement Manager">
      <select id="fg-ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button id="fg-discover" style="flex:1">Discover</button>
        <button id="fg-quick" style="flex:1;background:#071224;border:1px solid #183047">Quick Start</button>
      </div>
    </div>
    <div id="fg-opps" style="display:none">
      <div style="font-size:12px;color:#9fb0c9">Top matches</div><div id="fg-cards" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-start" style="flex:1">Start Demo</button>
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

  const hud = document.createElement("div");
  hud.className = "fg-hud fg-hidden";
  hud.innerHTML = `<div class="fg-badge">LIVE DEMO</div><div id="fg-hud-txt">Idle</div>`;
  document.body.appendChild(hud);

  const optionsBox = document.createElement("div");
  optionsBox.className = "fg-options fg-hidden";
  optionsBox.innerHTML = `<h4>Options nearby</h4><div id="fg-opt-list"></div>`;
  document.body.appendChild(optionsBox);

  const tab = document.createElement("div");
  tab.className = "fg-tab fg-hidden";
  tab.textContent = "Demo";
  document.body.appendChild(tab);

  /* pointer disc */
  const pointer = document.createElement("div");
  pointer.id = "fg-pointer";
  document.body.appendChild(pointer);

  /* ---------------------------------------------------------------------- *
   *  Utilities
   * ---------------------------------------------------------------------- */
  const $ = sel => panel.querySelector(sel);
  const vis  = el => el && el.offsetParent;
  const topBar = el => el && (el.closest("header,.navbar,.app-header") || el.getBoundingClientRect().top < 60 || /(logo|brand|navbar)/i.test(el.className||""));

  function speak(txt){ if(!txt||!speechSynthesis)return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(txt); u.lang="en-US";
    const v=speechSynthesis.getVoices().find(x=>/Google US English/i.test(x.name)||/female/i.test(x.name))||speechSynthesis.getVoices()[0]; if(v) u.voice=v;
    speechSynthesis.speak(u); }

  /* candidate search – returns best + up to MAX_OPTS list */
  function getCandidates(sel, txt){
    const set = new Map();
    const add = (e,score)=>{ if(e&&!set.has(e)&&vis(e)&&!topBar(e)) set.set(e,score); };
    if(sel){
      sel.split(",").forEach(s=>{
        try{const e=document.querySelector(s.trim()); if(e) add(e,100);}catch{}
      });
    }
    const q=(txt||"").toLowerCase().trim();
    const pool=[...document.querySelectorAll(SELECTORS)].filter(e=>vis(e)&&!topBar(e));
    pool.forEach(e=>{
      const l=(e.innerText||e.value||e.getAttribute("data-label")||"").trim().toLowerCase();
      if(!l) return;
      if(l===q)            add(e,90);
      else if(l.startsWith(q)) add(e,70);
      else if(l.includes(q))   add(e,50);
    });
    if(q){
      [...document.querySelectorAll("body *")].filter(n=>n.children.length===0&&vis(n)&&!topBar(n)).forEach(n=>{
        const t=(n.innerText||"").trim().toLowerCase();
        if(t.includes(q)) add(nearestActionable(n)||n,40);
      });
    }
    pool.slice(0,10).forEach(e=>add(e,10));
    return [...set.entries()].map(([el,score])=>({el,score})).sort((a,b)=>b.score-a.score).slice(0,MAX_OPTS);
  }

  function nearestActionable(start){
    if(!start) return null;
    const isAct = e=>e && (["button","a","input","select"].includes(e.tagName?.toLowerCase()) || e.onclick || e.getAttribute("role")==="button"||e.classList.contains("module-link"));
    if(isAct(start)) return start;
    const within=[...start.querySelectorAll(SELECTORS)].find(isAct);
    if(within) return within;
    let p=start.parentElement;
    while(p && p!==document.body){ if(isAct(p)) return p; p=p.parentElement; }
    return null;
  }

  function outline(el){
    document.querySelectorAll("[data-fg]").forEach(x=>{x.classList.remove("fg-outline");x.removeAttribute("data-fg");});
    if(!el) return;
    el.scrollIntoView({behavior:"smooth",block:"center"});
    setTimeout(()=>{ el.classList.add("fg-outline"); el.setAttribute("data-fg","1"); },250);
  }

  function movePointer(){
    const el=document.querySelector("[data-fg='1']");
    if(el){
      const r=el.getBoundingClientRect();
      pointer.style.left = (r.left + r.width/2 - 30 + window.scrollX) + "px";
      pointer.style.top  = (r.top  + r.height/2 - 30 + window.scrollY) + "px";
      pointer.style.opacity="1";
    }else pointer.style.opacity="0";
    requestAnimationFrame(movePointer);
  }
  movePointer();   // start loop

  function showOpts(list){
    const box=optionsBox.querySelector("#fg-opt-list"); box.innerHTML="";
    list.forEach(c=>{
      const row=document.createElement("div"); row.className="fg-option-row";
      row.textContent=(c.el.innerText||c.el.value||c.el.getAttribute("data-label")||"<no label>").trim().slice(0,60);
      box.appendChild(row);
    });
    optionsBox.classList.remove("fg-hidden");
  }

  function progress(){
    if(!hud.querySelector(".fg-progress")){
      const bar=document.createElement("div"); bar.className="fg-progress"; bar.innerHTML="<i></i>"; hud.appendChild(bar);
    }
    hud.querySelector("#fg-hud-txt").textContent=`Step ${stepIdx+1}/${tutorial.length}`;
    hud.querySelector(".fg-progress i").style.width=`${(stepIdx/tutorial.length)*100}%`;
    hud.classList.remove("fg-hidden");
  }

  function autoAdvance(){ clearTimeout(autoTimer); autoTimer=setTimeout(nextStep,TIMEOUT); }

  /* ---------------------------------------------------------------------- *
   *  Steps
   * ---------------------------------------------------------------------- */
  function showStep(){
    if(!tutorial[stepIdx]) return;
    $("#fg-info").innerHTML=`<div class="fg-step"><strong>Step ${stepIdx+1}/${tutorial.length}</strong><div style="margin-top:6px">${tutorial[stepIdx]}</div></div>`;
    const cand=getCandidates(selectors[stepIdx],tutorial[stepIdx]);
    outline(cand[0]?.el); showOpts(cand); speak(tutorial[stepIdx]); progress(); autoAdvance();
  }

  function nextStep(){ if(++stepIdx>=tutorial.length){ speak("Demo complete."); reset(); } else showStep(); }

  function reset(){
    clearTimeout(autoTimer);
    document.removeEventListener("click",globalClick,true);
    optionsBox.classList.add("fg-hidden");
    panel.classList.remove("fg-hidden"); tab.classList.add("fg-hidden");
    $("#fg-lesson").style.display="none"; $("#fg-setup").style.display="block"; hud.classList.add("fg-hidden");
    document.querySelectorAll("[data-fg]").forEach(x=>{x.classList.remove("fg-outline");x.removeAttribute("data-fg");});
  }

  /* click qualifies if target is ANY candidate */
  function globalClick(e){
    const cand=getCandidates(selectors[stepIdx],tutorial[stepIdx]).map(c=>c.el);
    if(cand.some(el=>el===e.target||el.contains(e.target))){ nextStep(); }
  }

  /* ---------------------------------------------------------------------- *
   *  Discovery
   * ---------------------------------------------------------------------- */
  async function discover(job){
    const res = await fetch(API+"/analyze-job",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({job,industry:$("#fg-ind").value})});
    return res.json();
  }

  function skipLogin(){ while(tutorial[0]&&/log[\s-]?in/i.test(tutorial[0])&&!document.querySelector("form[action*='login']")){tutorial.shift();selectors.shift();} }

  async function quickStart(){
    const data=await discover($("#fg-job").value.trim()||"User");
    tutorial=data.tutorial||[]; selectors=data.selectors||[]; skipLogin(); startLesson();
  }

  async function runDiscovery(){
    const job=$("#fg-job").value.trim(); if(!job) return alert("Enter job title");
    $("#fg-discover").disabled=true;
    const data=await discover(job);
    tutorial=data.tutorial||[]; selectors=data.selectors||[]; skipLogin();
    // very simple card list – just first 6 tutorial keywords
    $("#fg-setup").style.display="none"; $("#fg-opps").style.display="block";
    const box=$("#fg-cards"); box.innerHTML="";
    tutorial.slice(0,6).forEach(t=>{
      const c=document.createElement("div"); c.className="fg-card";
      c.innerHTML=`<h4>${t.split(" ")[0]}</h4><p>${t}</p>
        <div style="display:flex;gap:8px"><button class="guide">Guide</button></div>`;
      c.querySelector(".guide").onclick=()=>startLesson();
      box.appendChild(c);
    });
    $("#fg-discover").disabled=false;
  }

  function startLesson(){
    $("#fg-opps").style.display="none"; $("#fg-setup").style.display="none"; $("#fg-lesson").style.display="block";
    panel.classList.add("fg-hidden"); tab.classList.remove("fg-hidden"); stepIdx=0;
    document.addEventListener("click",globalClick,true); showStep();
  }

  /* ---------------------------------------------------------------------- *
   *  UI bindings
   * ---------------------------------------------------------------------- */
  $("#fg-discover").onclick = runDiscovery;
  $("#fg-back").onclick     = ()=>{ $("#fg-opps").style.display="none"; $("#fg-setup").style.display="block"; };
  $("#fg-start").onclick    = startLesson;
  $("#fg-quick").onclick    = quickStart;
  $("#fg-stop").onclick     = reset;
  $("#fg-repeat").onclick   = ()=>{ speak(tutorial[stepIdx]); outline(document.querySelector("[data-fg='1']")); };
  tab.onclick               = ()=>{ panel.classList.remove("fg-hidden"); tab.classList.add("fg-hidden"); };

  document.addEventListener("keydown",e=>{
    if(["N","n"].includes(e.key)&&stepIdx<tutorial.length-1){stepIdx++;showStep();}
    if(["P","p"].includes(e.key)&&stepIdx>0){stepIdx--;showStep();}
    if(["R","r"," "].includes(e.key)){speak(tutorial[stepIdx]);}
    if(["O","o"].includes(e.key)){optionsBox.classList.toggle("fg-hidden");}
    if(["H","h"].includes(e.key)){hud.classList.toggle("fg-hidden");}
  });

  /* ---------------------------------------------------------------------- *
   *  Bootstrap button (in case the panel is hidden by default later)
   * ---------------------------------------------------------------------- */
  const bootBtn=document.createElement("button");
  bootBtn.textContent="▶ Start Demo"; bootBtn.style="position:fixed;bottom:20px;right:20px;padding:8px 14px;background:#3B82F6;color:#fff;border:none;border-radius:6px;z-index:2147483647;font-weight:600;cursor:pointer";
  bootBtn.onclick=()=>{ bootBtn.remove(); quickStart(); };
  document.body.appendChild(bootBtn);

  console.log("✅ Frappe Demo Coach v4 loaded – pointer disc, blue outline, fail‑safe");
})();
