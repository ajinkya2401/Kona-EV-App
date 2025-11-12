// app.js - V3 layout final
// Defensive wrapper & error reporting (top of file)
(function(){
  try {
    window.addEventListener('error', function(e){
      console.error('Uncaught error:', e.error || e.message || e);
      try { alert('App error: ' + (e.error?.message || e.message || e)); } catch(_) {}
    });
    window.addEventListener('unhandledrejection', function(e){
      console.error('Unhandled rejection:', e.reason);
      try { alert('Unhandled rejection: ' + (e.reason && e.reason.message ? e.reason.message : JSON.stringify(e.reason))); } catch(_) {}
    });
  } catch(e){}
})();
console.log('app.js loaded (defensive wrapper active)');

// STORAGE key
const STORAGE = "evpwa_v3_final";
const CAPACITY = 80;

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function saveState(state){localStorage.setItem(STORAGE, JSON.stringify(state));}
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE))||{};}catch(e){return {}; }}

// small toast helper
function showToast(msg,timeout=1400){ const t=document.getElementById('toast'); if(!t) return; t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none', timeout); }

// populate the SOC select (hidden by default but used for Set SOC)
function populateSocSelect(){
  const sel = document.getElementById('lastSocSelect');
  if(!sel) return;
  sel.innerHTML = '';
  for(let i=0;i<=100;i++){
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + '%';
    sel.appendChild(opt);
  }
}

// set big SOC text + dynamic color logic
function setBigSocText(value){
  const bigEl = document.getElementById('bigSOCFloat');
  const statusEl = document.getElementById('subInfoFloat');
  const vText = (value===null || value===undefined) ? '--%' : (value + '%');
  if(bigEl) bigEl.textContent = vText;
  // color rules: >=40 => green, <40 => yellow
  let color = '#0b8a3e'; // green
  if(value === null || value === undefined) color = '#0b1730';
  else if(Number(value) < 40) color = '#e09c2f';
  // apply
  if(bigEl) bigEl.style.color = color;
  if(statusEl){
    // keep status color green (for Idle/Charging), but ensure contrast if SOC very low? keep green as requested
    // status color will be set elsewhere to green when idle/charging; leave default here
  }
}

// render UI from state
function render(){
  const s = loadState();
  const hist = s.history || [];
  // decide SOC shown
  let socDisplayed = null;
  let statusText = 'Idle';
  if(s.session && typeof s.session.startSOC !== 'undefined'){
    socDisplayed = clamp(Math.round(s.session.startSOC + ((s.session.kwhAdded||0)/CAPACITY)*100), 0, 100);
    statusText = 'Charging';
  } else if(typeof s.lastSoc === 'number'){
    socDisplayed = s.lastSoc;
    statusText = 'Idle';
  }
  // set big SOC and color
  setBigSocText(socDisplayed);

  // set status label text and color (green)
  const statusEl = document.getElementById('subInfoFloat');
  if(statusEl){
    statusEl.textContent = statusText;
    statusEl.style.color = (statusText === 'Charging') ? '#0b8a3e' : '#0b8a3e';
  }

  // history text
  const histEl = document.getElementById('historySummary');
  if(histEl){
    if(hist.length){
      histEl.textContent = `Last: ${hist[0].startSOC}% → ${hist[0].endSOC}% (${hist[0].kwh} kWh)`;
    } else {
      histEl.textContent = 'No sessions yet';
    }
  }

  // bottom button visibility
  const startBtn = document.getElementById('startBtn');
  const setSocBtn = document.getElementById('setSocBtn');
  const addKwhBtn = document.getElementById('addKwhBtn');
  const endBtn = document.getElementById('endBtn');

  if(s.session){
    // charging: hide start/set, show add/end
    if(startBtn) startBtn.style.display = 'none';
    if(setSocBtn) setSocBtn.style.display = 'none';
    if(addKwhBtn) addKwhBtn.style.display = '';
    if(endBtn) endBtn.style.display = '';
  } else {
    // idle: show start/set, hide add/end
    if(startBtn) startBtn.style.display = '';
    if(setSocBtn) setSocBtn.style.display = '';
    if(addKwhBtn) addKwhBtn.style.display = 'none';
    if(endBtn) endBtn.style.display = 'none';
  }
}

// helper: show the hidden select for SOC, focus (shows iOS wheel)
function revealSocPicker(){
  const sel = document.getElementById('lastSocSelect');
  const saveBtn = document.getElementById('saveLastSoc');
  const s = loadState();
  if(sel){
    sel.value = (s.lastSoc !== undefined && s.lastSoc !== null) ? s.lastSoc : 50;
    sel.style.display = '';
    sel.focus();
  }
  if(saveBtn) saveBtn.style.display = '';
}

// save selected SOC (from select)
function saveSelectedSoc(){
  const sel = document.getElementById('lastSocSelect');
  if(!sel) return;
  const v = Number(sel.value);
  if(!Number.isFinite(v) || v < 0 || v > 100){ showToast('Enter 0–100'); return; }
  const s = loadState();
  s.lastSoc = Math.round(v);
  saveState(s);
  // hide select and save button
  sel.style.display = 'none';
  document.getElementById('saveLastSoc').style.display = 'none';
  render();
  showToast('Saved');
}

// start a charging session using the last selected SOC
function startSession(){
  // we expect lastSoc or select to have the starting value
  let startVal = null;
  const sel = document.getElementById('lastSocSelect');
  if(sel && sel.style.display !== 'none') startVal = Number(sel.value);
  const s = loadState();
  if(startVal === null || !Number.isFinite(startVal)){
    // fallback to stored lastSoc
    startVal = s.lastSoc;
  }
  if(!Number.isFinite(startVal)){ showToast('Set start SOC first'); return; }
  s.session = { startSOC: Math.round(startVal), kwhAdded: 0, tsStart: Date.now() };
  delete s.lastSoc;
  saveState(s);
  render();
  showToast('Session started');
}

// reveal Add kWh input (we'll show the in-card input)
function revealAddKwh(){
  const input = document.getElementById('kwhInput');
  const upd = document.getElementById('updateKwh');
  const s = loadState();
  if(s.session && typeof s.session.kwhAdded !== 'undefined') input.value = s.session.kwhAdded;
  input.style.display = '';
  upd.style.display = '';
  input.focus();
}

// update kWh value
function updateKwh(){
  const input = document.getElementById('kwhInput');
  const v = Number(input.value);
  if(!Number.isFinite(v) || v < 0){ showToast('Enter valid kWh'); return; }
  const s = loadState();
  if(!s.session){ showToast('No active session'); return; }
  s.session.kwhAdded = Number(v.toFixed(2));
  s.session.tsUpdate = Date.now();
  saveState(s);
  render();
  input.style.display = 'none';
  document.getElementById('updateKwh').style.display = 'none';
  showToast('Updated');
}

// end session: compute end SOC and push to history
function endSession(){
  const s = loadState();
  if(!s.session){ showToast('No active session'); return; }
  const endSOC = clamp(Math.round(s.session.startSOC + ((s.session.kwhAdded||0)/CAPACITY)*100),0,100);
  s.history = s.history || [];
  s.history.unshift({ startSOC: s.session.startSOC, kwh: s.session.kwhAdded||0, endSOC, ts: Date.now() });
  s.lastSoc = endSOC;
  delete s.session;
  saveState(s);
  render();
  showToast('Session ended');
}

// cancel session (not exposed in bottom bar but kept)
function cancelSession(){
  const s = loadState();
  if(s.session){ delete s.session; saveState(s); render(); showToast('Cancelled'); }
}

// wire bottom buttons (single source of truth)
function wireButtons(){
  document.getElementById('startBtn')?.addEventListener('click', ()=> {
    // ensure select exist and has a value; if hidden, reveal first to pick
    const s = loadState();
    if(typeof s.lastSoc === 'number'){
      // start directly
      startSession();
    } else {
      // reveal selector so user can pick then press Start again
      revealSocPicker();
      showToast('Pick start SOC then press Start');
    }
  });

  document.getElementById('setSocBtn')?.addEventListener('click', ()=> {
    revealSocPicker();
  });

  document.getElementById('addKwhBtn')?.addEventListener('click', ()=> {
    revealAddKwh();
  });

  document.getElementById('endBtn')?.addEventListener('click', ()=> {
    endSession();
  });

  // in-card save / update buttons (hidden by default) — keep them wired
  document.getElementById('saveLastSoc')?.addEventListener('click', saveSelectedSoc);
  document.getElementById('updateKwh')?.addEventListener('click', updateKwh);
}

// initialize UI
(function init(){
  populateSocSelect();
  wireButtons();
  render();
  console.log('app.js initialized');
})();