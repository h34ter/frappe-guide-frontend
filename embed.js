/* ────────── embed.js — Investor Coach v3.5 (CLICK ADVANCE FIXED) ────────── */
(() => {
  if (window.FG_INVESTOR_COACH) return;
  window.FG_INVESTOR_COACH = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial = [], selectors = [], stepIndex = 0, chosenFeature = null;
  let isHandlingClick = false; // prevent double-handling

  /* ---------- CSS ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .fg-panel{position:fixed;bottom:26px;right:26px;width:460px;background:#071024;border:1px solid rgba(59,130,246,.14);border-radius:12px;padding:16px;z-index:2147483646;color:#e6eef8;font-family:Inter,Arial;font-size:13px;box-shadow:0 10px 40px rgba(2,6,23,.6)}
  .fg-panel input,.fg-panel select{width:100%;padding:9px;margin:8px 0;border:1px solid #1f2a38;background:#071224;color:#e6eef8;border-radius:8px}
  .fg-panel button{padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700}
  .fg-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.fg-card{background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px;border-radius:8px;min-height:78px;display:flex;flex-direction:column;justify-content:space-between}
  .fg-card h4{margin:0;font-size:14px;color:#fff}.fg-card p{margin:6px 0 0;font-size:12px;color:#9fb0c9}
  .fg-stepcard{padding:10px;background:linear-gradient(90deg,rgba(59,130,246,.04),rgba(59,130,246,.02));border-left:4px solid #3B82F6;margin-top:10px;border-radius:6px}
  .fg-outline{outline:4px solid #3B82F6!important;outline-offset:4px!important;border-radius:6px;transition:outline .3s}
  .fg-tab{position:fixed;top:42%;right:6px;width:46px;height:130px;background:#071224;border:1px solid #1f2a38;border-radius:10px;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;color:#9fb0c9;z-index:2147483650;cursor:pointer;box-shadow:0 8px 20px rgba(2,6,23,.5)}
  .fg-hidden{display:none!important}
  .fg-hud{position:fixed;left:16px;top:12px;background:rgba(2,6,23,.7);color:#cfe8ff;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,.12);z-index:2147483655;font-family:Inter,Arial;font-size:13px;display:flex;gap:10px;align-items:center}
  .fg-badge{background:#072033;padding:6px 8px;border-radius:6px;border:1px solid #183047;color:#9fd0ff;font-weight:700}
  .fg-progress{height:8px;background:#0b1220;border-radius:8px;overflow:hidden;margin-top:8px}.fg-progress>i{display:block;height:100%;background:linear-gradient(90deg,#60a5fa,#3b82f6);width:0%}
  .fg-options{position:fixed;bottom:26px;right:26px;background:#071327;border:1px solid rgba(59,130,246,.06);padding:10px 12px;border-radius:8px;z-index:2147483644;max-height:260px;overflow:auto;width:300px;color:#cfe8ff}
  .fg-options h4{margin:0 0 6px;font-size:13px;color:#9fb0c9;letter-spacing:.4px;text-transform:uppercase}
  .fg-option-row{font-size:13px;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.03)}`;
  document.head.appendChild(css);

  /* ---------- DOM scaffold ---------- */
  const panel = document.createElement("div");
  panel.className = "fg-panel";
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;color:#3B82F6">🤖 Frappe Demo Coach <span style="float:right;font-size:12px;font-weight:600;color:#9fb0c9">Investor</span></h3>
    <div id="fg-setup">
      <input id="fg-job" placeholder="e.g., Procurement Manager">
      <select id="fg-ind"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button id="fg-analyze" style="flex:1">Discover</button>
        <button id="fg-skip" style="flex:1;background:#071224;border:1px solid #183047">Quick Start</button>
      </div>
    </div>
    <div id="fg-opps" style="display:none">
      <div style="font-size:12px;color:#9fb0c9">Top matches</div><div id="fg-cards" class="fg-cards"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-start" style="flex:1">Start Demo</button>
        <button id="fg-back" style="flex:1;background:#071224;border:1px solid #183047">Back</button>
      </div>
    </div>
    <div id="fg-lesson" style="display:none">
      <div id="fg-info"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="fg-repeat" style="flex:1">Repeat</button>
        <button id="fg-stop" style="flex:1;background:#ef4444">Stop</button>
      </div>
    </div>`;
  document.body.appendChild(panel);

  const hud = Object.assign(document.createElement("div"), { className: "fg-hud fg-hidden" });
  hud.innerHTML = `<div class="fg-badge">LIVE DEMO</div><div id="fg-hud-txt">Idle</div>`;
  document.body.appendChild(hud);

  const optionsBox = Object.assign(document.createElement("div"), { className: "fg-options fg-hidden" });
  optionsBox.innerHTML = `<h4>Options nearby</h4><div id="fg-opt-list"></div>`;
  document.body.appendChild(optionsBox);

  const tab = Object.assign(document.createElement("div"), { className: "fg-tab fg-hidden", textContent: "Demo" });
  document.body.appendChild(tab);

  /* ---------- helpers ---------- */
  const $ = s => panel.querySelector(s);
  const say = txt => { if(!txt||!speechSynthesis)return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(txt); u.lang="en-US"; const v=speechSynthesis.getVoices().find(x=>/female/i.test(x.name))||speechSynthesis.getVoices()[0]; u.voice=v; speechSynthesis.speak(u); };

  const isVisible = el => el && el.offsetParent;
  const HEADER = el => el && (el.closest("header,.navbar,.app-header") || el.getBoundingClientRect().top < 60 || /(logo|brand|navbar)/i.test(el.className||""));

  const ACTIONABLE_SELECTORS = "button,a,input,select,[role='button'],[data-label],.module-link,.link-item";

  function nearestActionable(start){
    if(!start)return null;
    if(isVisible(start)&&!HEADER(start)&&(["button","a","input","select"].includes(start.tagName.toLowerCase())||start.onclick||start.getAttribute("role")==="button"||start.classList.contains("module-link"))) return start;
    const within = [...start.querySelectorAll(ACTIONABLE_SELECTORS)].find(e=>isVisible(e)&&!HEADER(e));
    if(within) return within;
    let up=start.parentElement;
    while(up && up!==document.body){
      if(isVisible(up)&&!HEADER(up)&&up.matches?.(ACTIONABLE_SELECTORS)) return up;
      const desc=[...up.querySelectorAll(ACTIONABLE_SELECTORS)].find(e=>isVisible(e)&&!HEADER(e));
      if(desc) return desc;
      up=up.parentElement;
    }
    return null;
  }

  function findCandidates(selector, text){
    const set=new Map();
    const push=(el,score)=>{ if(el&&!set.has(el)) set.set(el,score); };
    if(selector){
      selector.split(",").map(s=>s.trim()).forEach(sel=>{ try{ const e=document.querySelector(sel); if(isVisible(e)&&!HEADER(e)) push(nearestActionable(e)||e,100);}catch{} });
    }
    const t=(text||"").toLowerCase().trim();
    const pool=[...document.querySelectorAll(ACTIONABLE_SELECTORS)].filter(e=>isVisible(e)&&!HEADER(e));
    pool.forEach(e=>{
      const label=(e.innerText||e.value||e.getAttribute("data-label")||e.getAttribute("aria-label")||"").trim().toLowerCase();
      if(!label) return;
      if(label===t)         push(e,90);
      else if(label.startsWith(t)) push(e,70);
      else if(label.includes(t))  push(e,50);
    });
    if(t){
      [...document.querySelectorAll("body *")].filter(n=>n.children.length===0&&isVisible(n)&&!HEADER(n)).forEach(n=>{
        const lab=(n.innerText||"").trim().toLowerCase();
        if(lab && lab.includes(t)) push(nearestActionable(n)||n,40);
      });
    }
    pool.slice(0,10).forEach(e=>push(e,10));
    return [...set.entries()].map(([el,score])=>({el,score})).sort((a,b)=>b.score-a.score);
  }

  function highlight(el){
    document.querySelectorAll("[data-fg-h]").forEach(x=>{x.classList.remove("fg-outline");x.removeAttribute("data-fg-h");});
    if(!el) return;
    el.scrollIntoView({behavior:"smooth",block:"center"});
    setTimeout(()=>{ el.classList.add("fg-outline"); el.setAttribute("data-fg-h","1"); },300);
    setTimeout(()=>{ el.classList.remove("fg-outline"); el.removeAttribute("data-fg-h"); },9000);
  }

  function showOpts(cands){
    const list=optionsBox.querySelector("#fg-opt-list"); list.innerHTML="";
    cands.slice(0,6).forEach(c=>{
      const row=document.createElement("div"); row.className="fg-option-row";
      row.textContent=(c.el.innerText||c.el.value||c.el.getAttribute("data-label")||c.el.getAttribute("aria-label")||"<no label>").trim().slice(0,60);
      list.appendChild(row);
    });
    optionsBox.classList.remove("fg-hidden");
  }

  /* ---------- flow ---------- */
  $("#fg-analyze").onclick = runDiscovery;
  $("#fg-skip").onclick    = quickStart;
  $("#fg-back").onclick    = ()=>{ $("#fg-opps").style.display="none"; $("#fg-setup").style.display="block"; };
  $("#fg-start").onclick   = ()=>startLesson(chosenFeature);
  $("#fg-repeat").onclick  = ()=>{ say(tutorial[stepIndex]); };
  $("#fg-stop").onclick    = stopLesson;
  tab.onclick              = ()=>{ panel.classList.remove("fg-hidden"); tab.classList.add("fg-hidden"); };

  async function runDiscovery(){
    const job=$("#fg-job").value.trim(); if(!job) return alert("Enter job");
    $("#fg-analyze").disabled=true; hud.classList.remove("fg-hidden"); hud.querySelector("#fg-hud-txt").textContent="Analyzing…";
    try{
      const data = await (await fetch(API+"/analyze-job",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({job,industry:$("#fg-ind").value})})).json();
      tutorial=data.tutorial||[]; selectors=data.selectors||[]; pruneLogin();
      const atlas=await (await fetch(API+"/atlas")).json();
      showCards(atlas,job);
    }catch(e){alert("Backend error");console.error(e);}
    $("#fg-analyze").disabled=false; hud.classList.add("fg-hidden");
  }

  const pruneLogin = ()=>{ while(tutorial[0]&&/log[\s-]?in/i.test(tutorial[0])&&!document.querySelector("form[action*='login']")){tutorial.shift();selectors.shift();} };

  function showCards(atlas,job){
    $("#fg-setup").style.display="none"; $("#fg-opps").style.display="block";
    const jw=job.toLowerCase().split(/\s+/); const picks=atlas.map(a=>({a,score:jw.reduce((s,w)=>s+((a.label||"").toLowerCase().includes(w)?2:0),0)}))
      .sort((x,y)=>y.score-x.score).slice(0,8).map(x=>x.a);
    const box=$("#fg-cards"); box.innerHTML="";
    picks.forEach(p=>{
      const card=document.createElement("div");card.className="fg-card";
      card.innerHTML=`<h4>${p.label}</h4><p>${p.module||""}</p>
        <div style="display:flex;gap:8px"><button class="prev">Preview</button><button class="guide" style="background:#071224;border:1px solid #183047">Guide</button></div>`;
      card.querySelector(".prev").onclick=()=>say(`${p.label} reduces manual work for ${job} roles.`);
      card.querySelector(".guide").onclick=()=>{chosenFeature=p;startLesson();};
      box.appendChild(card);
    });
  }

  async function quickStart(){
    const d=await (await fetch(API+"/analyze-job",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({job:$("#fg-job").value||"User",industry:$("#fg-ind").value})})).json();
    tutorial=d.tutorial||[]; selectors=d.selectors||[]; pruneLogin(); startLesson();
  }

  function startLesson(){
    $("#fg-setup").style.display="none"; $("#fg-opps").style.display="none"; $("#fg-lesson").style.display="block";
    panel.classList.add("fg-hidden"); tab.classList.remove("fg-hidden"); stepIndex=0;
    document.addEventListener("click",handler,true); say("Starting demo."); step(0);
  }

  function step(i){
    if(!tutorial[i]) return;
    $("#fg-info").innerHTML=`<div class="fg-stepcard"><strong>Step ${i+1}/${tutorial.length}</strong><div style="margin-top:8px">${tutorial[i]}</div></div>`;
    progress();
    const cands=findCandidates(selectors[i],tutorial[i]); 
    highlight(cands[0]?.el); 
    showOpts(cands); 
    say(tutorial[i]);
  }

  const handler = async (e) => {
    if (isHandlingClick) return; // prevent re-entry
    
    const cands = findCandidates(selectors[stepIndex], tutorial[stepIndex]);
    const target = cands[0]?.el;
    
    if (target && (target === e.target || target.contains(e.target))) {
      isHandlingClick = true;
      
      // ADVANCE STEP
      stepIndex++;
      
      if (stepIndex >= tutorial.length) {
        say("Demo complete.");
        stopLesson();
      } else {
        // Wait for page to potentially change
        await new Promise(r => setTimeout(r, 800));
        step(stepIndex);
      }
      
      isHandlingClick = false;
    } else {
      // Wrong click - re-highlight
      say("Click the highlighted element.");
      highlight(target);
      showOpts(cands);
    }
  };

  function stopLesson(){
    document.removeEventListener("click",handler,true);
    panel.classList.remove("fg-hidden"); tab.classList.add("fg-hidden"); $("#fg-lesson").style.display="none"; $("#fg-setup").style.display="block";
    document.querySelectorAll("[data-fg-h]").forEach(x=>{x.classList.remove("fg-outline");x.removeAttribute("data-fg-h");});
    optionsBox.classList.add("fg-hidden"); say("Lesson ended.");
  }

  function progress(){
    if(!document.getElementById("fg-bar")){const b=document.createElement("div");b.className="fg-progress";b.id="fg-bar";b.innerHTML="<i></i>";hud.appendChild(b);}
    hud.classList.remove("fg-hidden"); hud.querySelector("#fg-hud-txt").textContent=`Step ${stepIndex+1}/${tutorial.length}`;
    hud.querySelector("#fg-bar i").style.width=`${(stepIndex/tutorial.length)*100}%`;
  }

  document.addEventListener("keydown",e=>{
    if(["N","n"].includes(e.key)&&stepIndex<tutorial.length-1){e.preventDefault();stepIndex++;step(stepIndex);}
    if(["P","p"].includes(e.key)&&stepIndex>0){e.preventDefault();stepIndex--;step(stepIndex);}
    if(["R","r"," "].includes(e.key)){e.preventDefault();say(tutorial[stepIndex]);}
    if(["O","o"].includes(e.key)){e.preventDefault();optionsBox.classList.toggle("fg-hidden");}
    if(["H","h"].includes(e.key)){e.preventDefault();hud.classList.toggle("fg-hidden");}
  });

  console.log("✅ Frappe Demo Coach v3.5 loaded — CLICK ADVANCE FIXED");
})();
