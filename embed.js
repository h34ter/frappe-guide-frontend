/* ────────── embed.js — Investor Demo Coach  (v3.3 blue‑outline, multi‑choice) ────────── */
(() => {
  if (window.FG_INVESTOR_COACH) return;
  window.FG_INVESTOR_COACH = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0, atlas = [], chosenFeature = null;

  /* ── STYLE (cursor removed, blue outline only) ── */
  const css = document.createElement("style");
  css.textContent = `
  .fg-panel{position:fixed;bottom:26px;right:26px;width:460px;background:#071024;border:1px solid rgba(59,130,246,.14);border-radius:12px;padding:16px;z-index:2147483646;color:#e6eef8;font-family:Inter,Arial;font-size:13px;box-shadow:0 10px 40px rgba(2,6,23,.6)}
  .fg-panel input,.fg-panel select{width:100%;padding:9px;margin:8px 0;border:1px solid #1f2a38;background:#071224;color:#e6eef8;border-radius:8px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700}
  .fg-small{font-size:12px;color:#9fb0c9}
  .fg-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .fg-card{background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;min-height:78px;display:flex;flex-direction:column;justify-content:space-between}
  .fg-card h4{margin:0;font-size:14px;color:#fff}.fg-card p{margin:6px 0 0;font-size:12px;color:#9fb0c9}
  .fg-stepcard{padding:10px;background:linear-gradient(90deg,rgba(59,130,246,.04),rgba(59,130,246,.02));border-left:4px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6!important;outline-offset:4px!important;border-radius:6px;transition:outline .3s ease}
  .fg-tab{position:fixed;top:42%;right:6px;width:46px;height:130px;background:#071224;border:1px solid #1f2a38;border-radius:10px;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;color:#9fb0c9;z-index:2147483650;cursor:pointer;box-shadow:0 8px 20px rgba(2,6,23,.5)}
  .fg-hidden{display:none!important}
  .fg-hud{position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,.12);z-index:2147483655;font-family:Inter,Arial;font-size:13px;display:flex;gap:10px;align-items:center}
  .fg-badge{background:#072033;padding:6px 8px;border-radius:6px;border:1px solid #183047;color:#9fd0ff;font-weight:700}
  .fg-progress{height:8px;background:#0b1220;border-radius:8px;overflow:hidden;margin-top:8px}.fg-progress>i{display:block;height:100%;background:linear-gradient(90deg,#60a5fa,#3b82f6);width:0%}
  .fg-options{position:fixed;bottom:26px;right:26px;transform:translateX(calc(100% + 10px));background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px 12px;border-radius:8px;z-index:2147483644;max-height:280px;overflow:auto;width:300px;color:#cfe8ff;transition:opacity .2s ease}
  .fg-options h4{margin:0 0 6px;font-size:13px;color:#9fb0c9;text-transform:uppercase;letter-spacing:.4px}
  .fg-option-row{font-size:13px;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.03)}`;
  document.head.appendChild(css);

  /* ── MAIN PANEL ── */
  const panel = document.createElement("div");
  panel.className = "fg-panel";
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach <span class="fg-small" style="float:right;font-weight:600;color:#9fb0c9">Investor</span></h3>
    <div id="fg-setup">
        <p class="fg-small" style="margin:0 0 8px">Enter a job & we’ll surface the highest‑impact features.</p>
        <input id="fg-job" placeholder="e.g., Procurement Manager">
        <select id="fg-ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
        <div style="display:flex;gap:8px">
            <button id="fg-analyze" style="flex:1">Discover Opportunities</button>
            <button id="fg-skip" style="flex:1;background:#071224;border:1px solid #183047">Quick Start</button>
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

  /* HUD + “options nearby” */
  const hud = Object.assign(document.createElement("div"), { className: "fg-hud fg-hidden" });
  hud.innerHTML = `<div class="fg-badge">LIVE DEMO</div><div id="fg-hud-txt" style="min-width:180px">Idle</div>`;
  document.body.appendChild(hud);

  const optionsBox = Object.assign(document.createElement("div"), { className: "fg-options fg-hidden" });
  optionsBox.innerHTML = `<h4>Options nearby</h4><div id="fg-opt-list"></div>`;
  document.body.appendChild(optionsBox);

  /* tiny tab when panel hidden */
  const tab = Object.assign(document.createElement("div"), { className: "fg-tab fg-hidden", textContent: "Demo" });
  document.body.appendChild(tab);

  /* ── BUTTON HOOKS ── */
  const $ = s => panel.querySelector(s);
  $("#fg-analyze").onclick = runDiscovery;
  $("#fg-skip").onclick     = quickStart;
  $("#fg-back").onclick     = () => { $("#fg-opps").style.display="none"; $("#fg-setup").style.display="block"; };
  $("#fg-start").onclick    = () => startLesson(chosenFeature);
  $("#fg-repeat").onclick   = () => speakStep(stepIndex);
  $("#fg-stop").onclick     = stopLesson;
  tab.onclick               = () => { panel.classList.remove("fg-hidden"); tab.classList.add("fg-hidden"); };

  /* ── TTS ── */
  const voicePref = () => {
    const v = speechSynthesis.getVoices();
    return v.find(x=>/Google US English/i.test(x.name))||v.find(x=>/female/i.test(x.name))||v[0];
  };
  const say = txt => {
    if(!txt||!window.speechSynthesis)return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(txt);u.voice=voicePref();u.lang="en-US";speechSynthesis.speak(u);
  };

  /* ── HELPER FILTERS ── */
  const isVisible = el => el&&el.offsetParent;
  const HEADER_FILTER = el=>{
    if(!el)return true;
    if(el.closest("header,.navbar,.app-header"))return true;
    if((el.getBoundingClientRect().top)<60)return true;
    return /(logo|brand|navbar)/i.test(el.className||"");
  };
  const isActionable = el=>{
    if(!el||!el.tagName)return false;
    const t=el.tagName.toLowerCase();
    return ["button","a","input","select","textarea"].includes(t)||el.getAttribute("role")==="button"||el.hasAttribute("data-label")||el.onclick;
  };

  /* ── FIND ELEMENT (returns best + list of candidates) ── */
  function findCandidates(selector, text){
    const pool=[...document.querySelectorAll("button,a,input,select,[role='button'],[data-label]")].filter(e=>isVisible(e)&&!HEADER_FILTER(e));
    const candidates=[];
    const add=(el,score)=>{if(el&&!candidates.some(c=>c.el===el))candidates.push({el,score});};

    if(selector){
      selector.split(",").map(s=>s.trim()).forEach(sel=>{
        try{const el=document.querySelector(sel);if(isVisible(el)&&!HEADER_FILTER(el))add(el,100);}catch{}
      });
    }
    const t=(text||"").toLowerCase().trim();
    if(t){
      pool.forEach(el=>{
        const label=(el.innerText||el.value||el.getAttribute("placeholder")||el.getAttribute("aria-label")||el.getAttribute("data-label")||"").trim().toLowerCase();
        if(!label)return;
        if(label===t)         add(el,90);
        else if(label.startsWith(t)) add(el,70);
        else if(label.includes(t))  add(el,50);
      });
    }
    // fallback add first pool items
    pool.slice(0,10).forEach(el=>add(el,10));
    return candidates.sort((a,b)=>b.score-a.score);
  }

  function highlight(el){
    document.querySelectorAll("[data-fg-h]").forEach(x=>{x.classList.remove("fg-outline");x.removeAttribute("data-fg-h");});
    if(!el)return;
    el.scrollIntoView({behavior:"smooth",block:"center"});
    setTimeout(()=>{el.classList.add("fg-outline");el.setAttribute("data-fg-h","1");},300);
    setTimeout(()=>{el.classList.remove("fg-outline");el.removeAttribute("data-fg-h");},9000);
  }

  function showOptions(cands){
    const list=optionsBox.querySelector("#fg-opt-list");list.innerHTML="";
    cands.slice(0,6).forEach(c=>{
      const row=document.createElement("div");row.className="fg-option-row";
      const txt=(c.el.innerText||c.el.getAttribute("data-label")||c.el.getAttribute("aria-label")||c.el.value||"").trim()||"<no label>";
      row.textContent=txt;list.appendChild(row);
    });
    optionsBox.classList.remove("fg-hidden");
  }

  /* ── FLOW ── */
  async function runDiscovery(){
    const job=$("#fg-job").value.trim();if(!job)return alert("Enter job");
    $("#fg-analyze").disabled=true;hud.classList.remove("fg-hidden");hud.querySelector("#fg-hud-txt").textContent="Analyzing…";
    try{
      const res=await fetch(API+"/analyze-job",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({job,industry:$("#fg-ind").value})});
      const data=await res.json();tutorial=data.tutorial||[];selectors=data.selectors||[];pruneLogin();
      atlas=await (await fetch(API+"/atlas")).json();
      showCards(scoreAtlas(atlas,job),job);
    }catch(e){alert("Backend error");console.error(e);}
    $("#fg-analyze").disabled=false;hud.classList.add("fg-hidden");
  }

  function pruneLogin(){while(tutorial[0]&&/log[\s-]?in/i.test(tutorial[0])&&!document.querySelector("form[action*='login']")){tutorial.shift();selectors.shift();}}

  const scoreAtlas=(atl,job)=>atl.map(a=>{const l=(a.label||"").toLowerCase();const pts=job.toLowerCase().split(/\s+/).reduce((s,w)=>s+(l.includes(w)?2:0),0);return{a,score:pts};}).sort((x,y)=>y.score-x.score).slice(0,8).map(x=>x.a);

  function showCards(cards,job){
    $("#fg-setup").style.display="none";$("#fg-opps").style.display="block";
    const box=$("#fg-cards");box.innerHTML="";
    cards.forEach(c=>{
      const div=document.createElement("div");div.className="fg-card";
      div.innerHTML=`<h4>${c.label}</h4><p>${c.module||""}</p>
      <div style="display:flex;gap:8px"><button class="prev">Preview</button><button class="guide" style="background:#071224;border:1px solid #183047">Guide</button></div>`;
      div.querySelector(".prev").onclick=()=>say(`${c.label} accelerates ${job} workflows and reduces manual effort.`);
      div.querySelector(".guide").onclick=()=>{chosenFeature=c;startLesson(c);};
      box.appendChild(div);
    });
  }

  async function quickStart(){
    const job=$("#fg-job").value.trim()||"User";
    const data=await (await fetch(API+"/analyze-job",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({job,industry:$("#fg-ind").value})})).json();
    tutorial=data.tutorial||[];selectors=data.selectors||[];pruneLogin();startLesson(null);
  }

  function startLesson(){ $("#fg-setup").style.display="none";$("#fg-opps").style.display="none";$("#fg-lesson").style.display="block";
    panel.classList.add("fg-hidden");tab.classList.remove("fg-hidden");stepIndex=0;
    document.addEventListener("click",onClick,true);say("Starting demo.");showStep(0);
  }

  function showStep(i){
    if(!tutorial[i])return;
    $("#fg-info").innerHTML=`<div class="fg-stepcard"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${tutorial[i]}</div></div>`;
    renderProgress();
    const cands=findCandidates(selectors[i],tutorial[i]);
    highlight(cands[0]?.el);showOptions(cands);
    say(tutorial[i]);
  }

  function onClick(e){
    const cands=findCandidates(selectors[stepIndex],tutorial[stepIndex]);
    if(cands[0]&&(cands[0].el===e.target||cands[0].el.contains(e.target))){
      if(++stepIndex>=tutorial.length){say("Demo complete.");stopLesson();return;}
      showStep(stepIndex);
    }else{
      say("Look for the highlighted blue outline.");highlight(cands[0]?.el);showOptions(cands);
    }
  }

  function stopLesson(){
    document.removeEventListener("click",onClick,true);
    panel.classList.remove("fg-hidden");tab.classList.add("fg-hidden");
    $("#fg-lesson").style.display="none";$("#fg-setup").style.display="block";
    document.querySelectorAll("[data-fg-h]").forEach(x=>{x.classList.remove("fg-outline");x.removeAttribute("data-fg-h");});
    optionsBox.classList.add("fg-hidden");say("Lesson ended.");
  }

  function renderProgress(){
    if(!document.getElementById("fg-bar")){const b=document.createElement("div");b.className="fg-progress";b.id="fg-bar";b.innerHTML="<i></i>";hud.appendChild(b);}
    hud.classList.remove("fg-hidden");hud.querySelector("#fg-hud-txt").textContent=`Step ${stepIndex+1}/${tutorial.length}`;
    hud.querySelector("#fg-bar i").style.width=`${(stepIndex/tutorial.length)*100}%`;
  }

  /* hotkeys */
  document.addEventListener("keydown",e=>{
    if(["N","n"].includes(e.key)&&stepIndex<tutorial.length-1){e.preventDefault();stepIndex++;showStep(stepIndex);}
    if(["P","p"].includes(e.key)&&stepIndex>0){e.preventDefault();stepIndex--;showStep(stepIndex);}
    if(["R","r"," "].includes(e.key)){e.preventDefault();say(tutorial[stepIndex]);}
  });

  console.log("✅ Frappe Demo Coach v3.3 loaded — blue outline + multi‑choice list");
})();
