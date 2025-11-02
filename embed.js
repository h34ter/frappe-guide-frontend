/* ────────── embed.js — Fail‑Safe v3.5 (never blocks, 10 s auto‑advance) ────────── */
(() => {
  if (window.FG_INVESTOR_COACH) return;
  window.FG_INVESTOR_COACH = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let tutorial=[], selectors=[], step=0, autoTimer=null;

  /* ——— minimal CSS (blue outline only) ——— */
  const s=document.createElement("style");s.textContent=`.fg-outline{outline:4px solid #3B82F6!important;outline-offset:4px!important;border-radius:6px}`;document.head.appendChild(s);

  /* quick helpers */
  const say=t=>{if(!t||!speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="en-US";speechSynthesis.speak(u);};
  const isVis=e=>e&&e.offsetParent, HEADER=e=>e&&(e.closest("header,.navbar")||e.getBoundingClientRect().top<60);
  const SELS="button,a,input,select,[role='button'],[data-label],.module-link,.link-item";

  /* candidate finder */
  function cands(sel,txt){
    const set=[],add=(el,sc)=>{if(el&&!set.some(x=>x.el===el))set.push({el,sc});};
    if(sel) sel.split(",").forEach(s=>{try{const e=document.querySelector(s.trim());if(isVis(e)&&!HEADER(e))add(e,100);}catch{}});
    const t=(txt||"").toLowerCase().trim();
    const pool=[...document.querySelectorAll(SELS)].filter(e=>isVis(e)&&!HEADER(e));
    pool.forEach(e=>{
      const l=(e.innerText||e.value||e.getAttribute("data-label")||"").trim().toLowerCase();
      if(!l)return;
      if(l===t) add(e,90); else if(l.startsWith(t)) add(e,70); else if(l.includes(t)) add(e,50);
    });
    return set.sort((a,b)=>b.sc-a.sc).slice(0,6); /* max 6 */
  }

  function outline(el){
    document.querySelectorAll("[data-fg]").forEach(x=>{x.classList.remove("fg-outline");x.removeAttribute("data-fg");});
    if(!el)return;el.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>{el.classList.add("fg-outline");el.setAttribute("data-fg",1);},200);
  }

  function next(){clearTimeout(autoTimer); if(++step>=tutorial.length){say("Demo complete.");return;} show();}
  function show(){
    const cs=cands(selectors[step],tutorial[step]); outline(cs[0]?.el); say(tutorial[step]||"");
    // auto‑advance after 10 s
    autoTimer=setTimeout(next,10000);
  }

  /* very small UI: just a start button */
  const btn=document.createElement("button");btn.textContent="▶ Start Demo";btn.style="position:fixed;bottom:20px;right:20px;padding:8px 14px;background:#3B82F6;color:#fff;border:none;border-radius:6px;z-index:2147483647;font-weight:600;cursor:pointer";
  document.body.appendChild(btn);

  btn.onclick=async()=>{
    btn.remove();
    const data=await (await fetch(API+"/analyze-job",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({job:"Demo",industry:"Any"})})).json();
    tutorial=data.tutorial||[]; selectors=data.selectors||[];
    say("Starting fail‑safe demo."); show();
  };

  /* click handler: any top‑6 candidate registers */
  document.addEventListener("click",e=>{
    const cs=cands(selectors[step],tutorial[step]);
    if(cs.some(c=>c.el===e.target||c.el.contains(e.target))) next();
  },true);

  console.log("✅ Fail‑safe Demo Coach v3.5 loaded — never blocks (10 s auto‑advance)");
})();
