// app.js - EV SOC PWA v2 (inputs hidden until revealed, numeric keyboard on iOS)
const CAPACITY = 80;
const STORAGE = "evpwa_v1";

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}

function saveState(state){localStorage.setItem(STORAGE, JSON.stringify(state));}
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE))||{};}catch(e){return {}; }}

function showToast(msg, timeout=1800){const t=document.getElementById('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',timeout);}

function render(){
  const s = loadState();
  const big = document.getElementById('bigSOC');
  const sub = document.getElementById('subInfo');
  const badge = document.getElementById('statusBadge');
  const mainCard = document.getElementById('mainCard');
  if(s.session && s.session.startSOC!==undefined){
    // compute
    const newSOC = clamp(Math.round(s.session.startSOC + ( (s.session.kwhAdded||0) / CAPACITY)*100),0,100);
    big.textContent = newSOC + '%';
    sub.textContent = `Start ${s.session.startSOC}% · +${s.session.kwhAdded||0} kWh`;
    badge.textContent = 'Charging';
    badge.style.background = '#eaf7ee';
    badge.style.color = '#0b8a3e';
    document.getElementById('idleControls').style.display='none';
    document.getElementById('sessionControls').style.display='block';
    mainCard.classList.add('green-border');
  } else {
    // idle
    const last = s.lastSoc;
    if(last!==undefined && last!==null){
      big.textContent = last + '%';
      sub.textContent = 'Last known SOC';
      document.getElementById('lastSocInput').value = last;
    } else {
      big.textContent = '--%';
      sub.textContent = 'No data';
    }
    badge.textContent = 'Idle';
    badge.style.background = '#fff';
    badge.style.color = '#0b6b44';
    document.getElementById('idleControls').style.display='block';
    document.getElementById('sessionControls').style.display='none';
    mainCard.classList.remove('green-border');
  }
  // history
  const hist = s.history||[];
  if(hist.length){
    document.getElementById('historySummary').textContent = `Last: ${hist[0].startSOC}% → ${hist[0].endSOC}% (${hist[0].kwh} kWh)`;
  } else document.getElementById('historySummary').textContent='No sessions yet';
}

// reveal/hide helpers
function show(element){ element.style.display = ""; try{ element.focus(); }catch(e){} }
function hide(element){ element.style.display = "none"; }

// idle: reveal SOC input
document.getElementById('revealSetSoc').addEventListener('click', ()=>{
  const socInput = document.getElementById('lastSocInput');
  const saveBtn = document.getElementById('saveLastSoc');
  // pre-fill if last known exists
  const s = loadState();
  if(s.lastSoc !== undefined && s.lastSoc !== null) socInput.value = s.lastSoc;
  show(socInput); show(saveBtn);
  // place cursor on input on iOS
  setTimeout(()=>socInput.focus(), 40);
});

// Save last SOC (idle)
document.getElementById('saveLastSoc').addEventListener('click', ()=>{
  const v = Number(document.getElementById('lastSocInput').value);
  if(!Number.isFinite(v) || v<0 || v>100){ showToast('Enter 0–100'); return; }
  const s = loadState();
  s.lastSoc = Math.round(v);
  saveState(s);
  render();
  showToast('Saved');
  // hide input after save for cleaner UI
  hide(document.getElementById('lastSocInput'));
  hide(document.getElementById('saveLastSoc'));
});

// Start session: uses existing lastSoc input value as start
document.getElementById('startSession').addEventListener('click', ()=>{
  const s = loadState();
  // Validate input (we expect user to have set SOC or typed it)
  const startVal = Number(document.getElementById('lastSocInput').value);
  if(!Number.isFinite(startVal) || startVal < 0 || startVal > 100){ showToast('Enter start SOC (0–100)'); return; }
  s.session = { startSOC: Math.round(startVal), kwhAdded: 0, ts: Date.now() };
  delete s.lastSoc; // clear last known while charging
  saveState(s);
  render();
  showToast('Session started');
});

// session: reveal kWh input
document.getElementById('showKwhInput').addEventListener('click', ()=>{
  const kwhInput = document.getElementById('kwhInput');
  const updateBtn = document.getElementById('updateKwh');
  // prefill with previous value if present
  const s = loadState();
  if(s.session && s.session.kwhAdded !== undefined) kwhInput.value = s.session.kwhAdded;
  show(kwhInput); show(updateBtn);
  setTimeout(()=>kwhInput.focus(), 40);
});

// update kWh (session)
document.getElementById('updateKwh').addEventListener('click', ()=>{
  const v = Number(document.getElementById('kwhInput').value);
  if(!Number.isFinite(v) || v<0){ showToast('Enter valid kWh'); return; }
  const s = loadState();
  if(!s.session){ showToast('No active session'); return; }
  s.session.kwhAdded = Number((v).toFixed(2));
  s.session.tsUpdate = Date.now();
  saveState(s);
  render();
  showToast('Updated');
  // hide input after update to keep UI tidy
  hide(document.getElementById('kwhInput'));
  hide(document.getElementById('updateKwh'));
});

// end/cancel session (same as before)
document.getElementById('endSession').addEventListener('click', ()=>{
  const s = loadState();
  if(!s.session){ showToast('No active session'); return; }
  const endSOC = clamp(Math.round(s.session.startSOC + ((s.session.kwhAdded||0)/CAPACITY)*100),0,100);
  // push to history
  s.history = s.history||[];
  s.history.unshift({ startSOC: s.session.startSOC, kwh: s.session.kwhAdded||0, endSOC, ts: Date.now() });
  // save lastSoc
  s.lastSoc = endSOC;
  delete s.session;
  saveState(s);
  render();
  showToast('Session ended');
});

document.getElementById('cancelSession').addEventListener('click', ()=>{
  const s = loadState();
  if(s.session){ delete s.session; saveState(s); render(); showToast('Cancelled'); }
});

document.getElementById('openMenu').addEventListener('click', ()=>{
  alert('Use the UI: Start session, update kWh, end session. Widget will reflect the SOC.');
});

// PWA install prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  btn.style.display = 'inline-block';
  btn.addEventListener('click', async ()=>{
    btn.style.display='none';
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
});

// service worker registration
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

// init UI
render();

// expose for debugging
window._evpwa = { loadState, saveState, render };
