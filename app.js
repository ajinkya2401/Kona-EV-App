// app.js — updated for bottom placement + iOS wheel SOC select
const CAPACITY = 80;
const STORAGE = "evpwa_v1";

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function saveState(state){localStorage.setItem(STORAGE, JSON.stringify(state));}
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE))||{};}catch(e){return {}; }}
function showToast(msg, timeout=1400){const t=document.getElementById('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',timeout);}

// populate SOC select (0..100)
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

// render UI from state
function render(){
  const s = loadState();
  const big = document.getElementById('bigSOC');
  const sub = document.getElementById('subInfo');
  const badge = document.getElementById('statusBadge');
  const mainCard = document.getElementById('mainCard');

  if(s.session && s.session.startSOC!==undefined){
    const newSOC = clamp(Math.round(s.session.startSOC + ( (s.session.kwhAdded||0) / CAPACITY)*100),0,100);
    big.textContent = newSOC + '%';
    sub.textContent = `Start ${s.session.startSOC}% · +${s.session.kwhAdded||0} kWh`;
    badge.textContent = 'Charging';
    badge.style.background = '#eaf7ee';
    badge.style.color = '#0b8a3e';
    document.getElementById('idleControls').style.display='none';
    document.getElementById('sessionControls').style.display='block';
    document.getElementById('showKwhInput').style.display='inline-block';
    document.getElementById('endSession').style.display='inline-block';
    // bottom buttons
    document.getElementById('showKwhInputBottom').style.display='inline-block';
    document.getElementById('endSessionBottom').style.display='inline-block';
    document.getElementById('startSessionBottom').style.display='none';
    document.getElementById('revealSetSocBottom').style.display='none';
    mainCard.classList.add('green-border');
  } else {
    const last = s.lastSoc;
    if(last!==undefined && last!==null){
      big.textContent = last + '%';
      sub.textContent = 'Last known SOC';
      document.getElementById('lastSocSelect').value = last;
    } else {
      big.textContent = '--%';
      sub.textContent = 'No data';
    }
    badge.textContent = 'Idle';
    badge.style.background = '#fff';
    badge.style.color = '#0b6b44';
    document.getElementById('idleControls').style.display='block';
    document.getElementById('sessionControls').style.display='none';
    document.getElementById('showKwhInput').style.display='none';
    document.getElementById('endSession').style.display='none';
    // bottom buttons
    document.getElementById('showKwhInputBottom').style.display='none';
    document.getElementById('endSessionBottom').style.display='none';
    document.getElementById('startSessionBottom').style.display='inline-block';
    document.getElementById('revealSetSocBottom').style.display='inline-block';
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

// idle: reveal SOC wheel select
document.getElementById('revealSetSoc').addEventListener('click', ()=>{
  const sel = document.getElementById('lastSocSelect');
  const saveBtn = document.getElementById('saveLastSoc');
  const s = loadState();
  if(s.lastSoc !== undefined && s.lastSoc !== null) sel.value = s.lastSoc;
  show(sel); show(saveBtn);
  // focus triggers iOS picker wheel
  setTimeout(()=> sel.focus(), 40);
});
document.getElementById('revealSetSocBottom').addEventListener('click', ()=>{
  document.getElementById('revealSetSoc').click();
});

// Save last SOC (idle)
document.getElementById('saveLastSoc').addEventListener('click', ()=>{
  const v = Number(document.getElementById('lastSocSelect').value);
  if(!Number.isFinite(v) || v<0 || v>100){ showToast('Enter 0–100'); return; }
  const s = loadState();
  s.lastSoc = Math.round(v);
  saveState(s);
  render();
  showToast('Saved');
  hide(document.getElementById('lastSocSelect'));
  hide(document.getElementById('saveLastSoc'));
});

// Start session: uses selected SOC as start
document.getElementById('startSession').addEventListener('click', ()=>{
  const startVal = Number(document.getElementById('lastSocSelect').value);
  if(!Number.isFinite(startVal) || startVal < 0 || startVal > 100){ showToast('Select start SOC (0–100)'); return; }
  const s = loadState();
  s.session = { startSOC: Math.round(startVal), kwhAdded: 0, ts: Date.now() };
  delete s.lastSoc; // clear last known while charging
  saveState(s);
  render();
  showToast('Session started');
});
document.getElementById('startSessionBottom').addEventListener('click', ()=> document.getElementById('startSession').click());

// session: reveal kWh input
document.getElementById('showKwhInput').addEventListener('click', ()=>{
  const kwhInput = document.getElementById('kwhInput');
  const updateBtn = document.getElementById('updateKwh');
  const s = loadState();
  if(s.session && s.session.kwhAdded !== undefined) kwhInput.value = s.session.kwhAdded;
  show(kwhInput); show(updateBtn);
  setTimeout(()=>kwhInput.focus(), 40);
});
document.getElementById('showKwhInputBottom').addEventListener('click', ()=> document.getElementById('showKwhInput').click());

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

// end/cancel session
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
document.getElementById('endSessionBottom').addEventListener('click', ()=> document.getElementById('endSession').click());

document.getElementById('cancelSession').addEventListener('click', ()=>{
  const s = loadState();
  if(s.session){ delete s.session; saveState(s); render(); showToast('Cancelled'); }
});

// open menu/help
document.getElementById('openMenu')?.addEventListener('click', ()=>{ alert('Use the UI: Start session, update kWh, end session.'); });

// init: populate select and render
populateSocSelect();
render();

// expose for debugging
window._evpwa = { loadState, saveState, render };