/* ────────── embed.js — Voice Interactive Demo Coach ────────── */
(function(){
  if (window.FG_VOICE_COACH) { console.log('FG_VOICE_COACH already loaded'); return; }
  window.FG_VOICE_COACH = true;

  const API = "https://frappe-guide-backend.onrender.com";
  let isListening = false, userName = '', userJob = '', userIndustry = '';
  let conversationState = 'intro'; // intro -> get_name -> get_job -> get_industry -> demo
  let recognition = null, synthesis = window.speechSynthesis;

  /* =======================
     Minimal UI - just a voice assistant avatar
     =======================*/
  const style = document.createElement('style');
  style.setAttribute('data-fg-ignore','1');
  style.textContent = `
  .fg-voice-assistant{position:fixed;bottom:30px;right:30px;width:140px;height:140px;
    background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:50%;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
    box-shadow:0 10px 40px rgba(102,126,234,0.4);z-index:2147483647;
    transition:transform 0.3s, box-shadow 0.3s;}
  .fg-voice-assistant:hover{transform:scale(1.05);box-shadow:0 15px 50px rgba(102,126,234,0.6);}
  .fg-voice-assistant.listening{animation:pulse 2s infinite;}
  .fg-voice-assistant.speaking{animation:glow 1.5s infinite;}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
  @keyframes glow{0%,100%{box-shadow:0 10px 40px rgba(102,126,234,0.4)}50%{box-shadow:0 20px 60px rgba(102,126,234,0.8)}}
  .fg-avatar-icon{font-size:60px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));}
  .fg-transcript{position:fixed;bottom:190px;right:30px;max-width:400px;background:rgba(2,6,23,0.95);
    color:#fff;padding:16px 20px;border-radius:16px;font-family:Inter,Arial;font-size:15px;
    box-shadow:0 8px 32px rgba(0,0,0,0.3);border:1px solid rgba(102,126,234,0.3);
    backdrop-filter:blur(10px);display:none;z-index:2147483646;}
  .fg-transcript.show{display:block;animation:slideUp 0.3s;}
  @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fg-status{color:#a0aec0;font-size:13px;margin-top:8px;font-style:italic;}
  `;
  document.head.appendChild(style);

  function make(tag, props={}, html=''){
    const el = document.createElement(tag);
    el.setAttribute('data-fg-ignore','1');
    Object.assign(el, props);
    if (html) el.innerHTML = html;
    return el;
  }

  const assistant = make('div',{className:'fg-voice-assistant'});
  assistant.innerHTML = '<div class="fg-avatar-icon">🎙️</div>';
  document.body.appendChild(assistant);

  const transcript = make('div',{className:'fg-transcript'});
  transcript.innerHTML = '<div id="fg-text"></div><div class="fg-status" id="fg-status">Click the avatar to start</div>';
  document.body.appendChild(transcript);

  /* =======================
     Speech Recognition Setup
     =======================*/
  function initRecognition(){
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome.');
      return false;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log('👂 Heard:', text);
      handleUserInput(text);
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      stopListening();
      if (event.error === 'no-speech') {
        speak("I didn't catch that. Click me to try again.");
      }
    };

    recognition.onend = () => {
      stopListening();
    };

    return true;
  }

  /* =======================
     TTS - Text to Speech
     =======================*/
  let cachedVoice = null;
  function pickVoice(){
    const voices = synthesis?.getVoices() || [];
    return voices.find(v => /Google US|en-US Female|Samantha/i.test(v.name)) 
        || voices.find(v => /female/i.test(v.name)) 
        || voices[0] || null;
  }
  
  if (synthesis) {
    synthesis.addEventListener('voiceschanged', () => { cachedVoice = pickVoice(); });
  }

  async function speak(text){
    if (!text || !synthesis) return;
    
    return new Promise((resolve) => {
      synthesis.cancel();
      assistant.classList.add('speaking');
      updateTranscript(`🤖: ${text}`, 'Speaking...');
      
      const utterance = new SpeechSynthesisUtterance(text);
      if (!cachedVoice) cachedVoice = pickVoice();
      if (cachedVoice) utterance.voice = cachedVoice;
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      
      utterance.onend = () => {
        assistant.classList.remove('speaking');
        resolve();
      };
      
      utterance.onerror = () => {
        assistant.classList.remove('speaking');
        resolve();
      };
      
      synthesis.speak(utterance);
    });
  }

  /* =======================
     UI Controls
     =======================*/
  function updateTranscript(text, status=''){
    transcript.classList.add('show');
    document.getElementById('fg-text').textContent = text;
    document.getElementById('fg-status').textContent = status;
  }

  function startListening(){
    if (!recognition && !initRecognition()) return;
    
    isListening = true;
    assistant.classList.add('listening');
    updateTranscript('Listening...', '🎤 Speak now');
    
    try {
      recognition.start();
    } catch(e) {
      console.error('Recognition start error:', e);
      stopListening();
    }
  }

  function stopListening(){
    isListening = false;
    assistant.classList.remove('listening');
    if (recognition) {
      try { recognition.stop(); } catch(e) {}
    }
  }

  /* =======================
     Conversation Logic
     =======================*/
  async function handleUserInput(text){
    const input = text.toLowerCase().trim();
    
    switch(conversationState){
      case 'intro':
        // User just started, we already introduced, now get name
        conversationState = 'get_name';
        await speak(`Nice to meet you! What's your name?`);
        setTimeout(() => startListening(), 500);
        break;

      case 'get_name':
        userName = text.trim();
        conversationState = 'get_job';
        await speak(`Great to meet you ${userName}! What's your job role?`);
        setTimeout(() => startListening(), 500);
        break;

      case 'get_job':
        userJob = text.trim();
        conversationState = 'get_industry';
        await speak(`${userJob}, got it. What industry are you in?`);
        setTimeout(() => startListening(), 500);
        break;

      case 'get_industry':
        userIndustry = text.trim();
        conversationState = 'analyzing';
        await speak(`Perfect! Let me show you the best Frappe features for a ${userJob} in ${userIndustry}. Give me just a moment.`);
        await analyzeAndDemo();
        break;

      case 'demo':
        // During demo, user can give commands
        await handleDemoCommand(input);
        break;
    }
  }

  async function analyzeAndDemo(){
    try {
      updateTranscript(`Analyzing features for ${userJob}...`, 'Please wait');
      
      const response = await fetch(API + '/analyze-job', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ job: userJob, industry: userIndustry })
      });
      
      const data = await response.json();
      const steps = data.tutorial || [];
      
      conversationState = 'demo';
      await speak(`Alright ${userName}, I found ${steps.length} key features for you. Let me walk you through them.`);
      
      // Start automated demo
      await runAutomatedDemo(steps);
      
    } catch(err) {
      console.error('Analysis error:', err);
      await speak("Sorry, I'm having trouble connecting to the server. Let's try again later.");
      conversationState = 'intro';
    }
  }

  async function runAutomatedDemo(steps){
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await speak(`Step ${i + 1}. ${step}`);
      updateTranscript(`Step ${i+1}/${steps.length}: ${step}`, 'Demonstrating...');
      
      // Find and interact with element
      const element = await findAndHighlight(step);
      if (element) {
        await scrollToElement(element);
        await new Promise(r => setTimeout(r, 1500));
        
        // Simulate interaction based on element type
        const tag = element.tagName.toLowerCase();
        if (tag === 'button' || tag === 'a') {
          await speak("I'll click this for you.");
          await new Promise(r => setTimeout(r, 800));
          element.click();
          await new Promise(r => setTimeout(r, 2000)); // Wait for page load
        } else if (tag === 'input' || tag === 'textarea') {
          await speak("You would fill this in with your data.");
          element.focus();
          await new Promise(r => setTimeout(r, 1500));
        }
      } else {
        await speak("This feature might be in a different section. I'll continue with the next step.");
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }
    
    await speak(`And that's it ${userName}! I've shown you the main features for your role. Want to see anything else? Just click me and tell me.`);
    conversationState = 'demo';
    updateTranscript('Demo complete! Click to ask questions', 'Ready');
  }

  async function handleDemoCommand(input){
    if (input.includes('show') || input.includes('find') || input.includes('where')) {
      const feature = input.replace(/show|find|where|is|the|me/gi, '').trim();
      await speak(`Let me find ${feature} for you.`);
      const element = await findAndHighlight(feature);
      if (element) {
        await scrollToElement(element);
        await speak(`Here it is. ${getElementDescription(element)}`);
      } else {
        await speak(`I couldn't find that on this page. Try asking about something else.`);
      }
    } else if (input.includes('restart') || input.includes('start over')) {
      conversationState = 'intro';
      await speak("Sure! Let's start fresh. What's your name?");
      conversationState = 'get_name';
      setTimeout(() => startListening(), 500);
    } else if (input.includes('help')) {
      await speak("You can ask me to show you features, restart the demo, or tell me what you need help with.");
    } else {
      await speak(`Interesting. Let me see if I can help with that.`);
      // Could use GPT here for open-ended questions
    }
    
    setTimeout(() => startListening(), 500);
  }

  /* =======================
     Element Finding & Interaction
     =======================*/
  function isVisible(el){
    try{
      if (!el || el.closest('[data-fg-ignore]')) return false;
      if (el.offsetParent === null) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }catch(e){ return false; }
  }

  function getElementText(el){
    if (!el) return '';
    return (
      el.innerText ||
      el.textContent ||
      el.getAttribute('aria-label') ||
      el.getAttribute('data-label') ||
      el.getAttribute('placeholder') ||
      ''
    ).trim().toLowerCase();
  }

  function scoreMatch(el, searchText){
    const text = getElementText(el);
    const search = searchText.toLowerCase().trim();
    
    if (!text || !search) return 0;
    if (text === search) return 1000;
    
    const words = text.split(/\s+/);
    if (words.includes(search)) return 900;
    if (text.startsWith(search)) return 800;
    if (text.includes(search)) return 500;
    
    const searchWords = search.split(/\s+/);
    let score = 0;
    for (const word of searchWords) {
      if (text.includes(word)) score += 100;
    }
    return score;
  }

  async function findAndHighlight(searchText){
    const selectors = 'button,a,input,select,textarea,[role="button"],[data-label],.btn,.module-link';
    const elements = Array.from(document.querySelectorAll(selectors)).filter(isVisible);
    
    const scored = elements.map(el => ({
      el,
      score: scoreMatch(el, searchText)
    })).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
    
    if (scored.length > 0) {
      const best = scored[0].el;
      highlightElement(best);
      return best;
    }
    
    return null;
  }

  function highlightElement(el){
    // Remove previous highlights
    document.querySelectorAll('.fg-highlight-active').forEach(x => {
      x.classList.remove('fg-highlight-active');
      x.style.outline = '';
      x.style.outlineOffset = '';
    });
    
    if (el) {
      el.classList.add('fg-highlight-active');
      el.style.outline = '4px solid #667eea';
      el.style.outlineOffset = '4px';
      
      setTimeout(() => {
        el.classList.remove('fg-highlight-active');
        el.style.outline = '';
        el.style.outlineOffset = '';
      }, 5000);
    }
  }

  async function scrollToElement(el){
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(r => setTimeout(r, 800));
    } catch(e) {}
  }

  function getElementDescription(el){
    const tag = el.tagName.toLowerCase();
    const text = getElementText(el);
    
    if (tag === 'button') return `This is a button labeled "${text}". Click it to take action.`;
    if (tag === 'a') return `This is a link to "${text}".`;
    if (tag === 'input') return `This is an input field for entering data.`;
    return `This is the "${text}" control.`;
  }

  /* =======================
     Start Conversation
     =======================*/
  assistant.onclick = () => {
    if (isListening) {
      stopListening();
      return;
    }
    
    if (conversationState === 'intro') {
      speak(`Hi there! I'm your Frappe demo assistant. I'll help you explore features that matter for your role. Ready to get started?`);
      conversationState = 'get_name';
      setTimeout(() => startListening(), 3000);
    } else {
      startListening();
    }
  };

  // Initialize on load
  setTimeout(() => {
    if (synthesis) pickVoice();
    updateTranscript('Voice Demo Coach Ready', 'Click the avatar to begin');
  }, 500);

  console.log('✅ Voice Interactive Demo Coach loaded');
})();
