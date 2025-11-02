(function () {
  if (window.GUIDE_LOADED) return;  window.GUIDE_LOADED = true;

  /*──── styles ────*/
  const css=`.gc{position:fixed;width:60px;height:60px;border:4px solid #3B82F6;border-radius:50%;
  background:rgba(59,130,246,.2);box-shadow:0 0 40px rgba(59,130,246,.9);z-index:999999;
  display:none;align-items:center;justify-content:center;font-size:28px;pointer-events:none;
  transition:left .35s ease,top .35s ease;}
  .gp{position:fixed;bottom:30px;right:30px;width:380px;background:#0f172a;border:2px solid #3B82F6;
  border-radius:10px;padding:18px;z-index:999998;color:#f3f4f6;font:13px/1.4 Arial;}
  .gp input,.gp select{width:100%;padding:8px;margin:6px 0 10px;border:1px solid #334155;
  background:#1e293b;color:#f3f4f6;border-radius:6px;font-size:12px;}
  .gp button{width:100%;padding:10px;background:#3B82F6;color:#fff;border:none;border-radius:6px;
  cursor:pointer;font-weight:700;}
  .gs{padding:10px;background:rgba(59,130,246,.12);border-left:3px solid #3B82F6;margin-top:10px;
  border-radius:4px;}
  [data-guide-highlight]{outline:4px solid #3B82F6;outline-offset:3px;animation:fadeOutline 8s forwards;}
  @keyframes fadeOutline{0%{outline-width:4px}90%{outline-width:4px}100%{outline-width:0}}`;
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));

  /*──── state ────*/
  const API='https://frappe-guide-backend.onrender.com';
  let tutorial=[],selectors=[],keywords=[],idx=0,target=null;

  /*──── panel ────*/
  const p=document.createElement('div');
  p.className='gp';
  p.innerHTML=`<h3 style="margin:0 0 12px;color:#3B82F6">🤖 Frappe Guide</h3>
  <div id="a"><p style="margin:0 0 4px">What's your job?</p>
  <input id="j" placeholder="e.g. Procurement Manager">
  <select id="i"><option>Manufacturing</option><option>Retail</option><option>Services</option></select>
  <button id="go">Analyze</button></div><div id="r" style="display:none"><div id="info" class="gs"></div></div>`;
  document.body.appendChild(p);

  /*──── cursor ────*/
  const c=document.body.appendChild(Object.assign(document.createElement('div'),{className:'gc',innerHTML:'●'}));

  const $=s=>document.querySelector(s),sleep=t=>new Promise(r=>setTimeout(r,t));

  const findByKeyword=kw=>{
    kw=kw.toLowerCase();
    return Array.from(document.querySelectorAll('button,a,[role="button"],input,select'))
      .find(el=>{
        const t=(el.textContent||'').toLowerCase();
        const ph=(el.getAttribute('placeholder')||'').toLowerCase();
        const dl=(el.getAttribute('data-label')||'').toLowerCase();
        return [t,ph,dl].some(x=>x.includes(kw)) && el.offsetParent;
      });
  };

  const moveCursor=el=>{
    const r=el.getBoundingClientRect();
    c.style.left=(r.left+r.width/2-30)+'px';
    c.style.top =(r.top +r.height/2-30)+'px';
    c.style.display='flex';
  };

  async function showStep(){
    if(idx>=tutorial.length){$('#info').innerHTML='<strong>✅ Complete!</strong>';c.style.display='none';return;}

    $('#info').innerHTML=`<strong>Step ${idx+1}/${tutorial.length}</strong><br>${tutorial[idx]}`;
    target?.removeAttribute('data-guide-highlight');

    /* 1️⃣ selector  */
    let sel=selectors[idx];
    try{ if(sel) target=document.querySelector(sel); }catch(e){ target=null; }

    /* 2️⃣ keyword fallback */
    if(!target) target=findByKeyword(keywords[idx]);

    if(!target){
      $('#info').innerHTML+=`<br><em style="color:#f87171">I can’t locate it – navigate there manually.</em>`;
      c.style.display='none'; return;
    }
    target.setAttribute('data-guide-highlight','');
    target.scrollIntoView({behavior:'smooth',block:'center'});
    await sleep(300); moveCursor(target);
  }

  $('#go').onclick=async()=>{
    const job=$('#j').value.trim(); if(!job) return alert('Enter job');
    $('#a').style.display='none';$('#r').style.display='block';$('#info').innerHTML='⏳ Thinking…';

    const data=await fetch(API+'/analyze-job',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({job,industry:$('#i').value})}).then(r=>r.json());

    ({tutorial,selectors,keywords}=data); idx=0; await showStep();
  };

  /* advance on click */
  document.addEventListener('click',async e=>{
    if(p.contains(e.target)) return;
    await sleep(500);
    if(target && (e.target===target||e.target.closest('[data-guide-highlight]'))){ idx++; await showStep(); }
    else await showStep();
  },true);

  /* auto‑rerun on DOM mutation */
  new MutationObserver(()=>showStep()).observe(document.body,{subtree:true,childList:true});

  console.log('✅ embed.js v3 loaded');
})();
async function ask(question, context=""){
  const r = await fetch(API+"/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,context})});
  const {answer} = await r.json();
  speak(answer);
  return answer;
}

async function speak(text){
  const r = await fetch(API+"/speak",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  new Audio(url).play();
}

async function recordAndAsk(){
  const stream = await navigator.mediaDevices.getUserMedia({audio:true});
  const rec = new MediaRecorder(stream);
  const chunks=[];
  rec.ondataavailable=e=>chunks.push(e.data);
  rec.start();
  setTimeout(()=>rec.stop(),5000);
  rec.onstop=async()=>{
    const blob=new Blob(chunks);
    const form=new FormData();
    form.append("file",blob,"audio.wav");
    const r=await fetch(API+"/transcribe",{method:"POST",body:form});
    const {text}=await r.json();
    const answer=await ask(text);
    console.log("🗣️",text,"\n🤖",answer);
  };
}
