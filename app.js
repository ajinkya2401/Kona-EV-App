<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>Hyundai Kona EV</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="icon-192.png">
<style>
:root{
  --bg:#f6fbf7;--card:#fff;--accent:#0b8a3e;--muted:#6b6f76;--danger:#c94242;
  --safeTop: calc(env(safe-area-inset-top) + 8px);
}
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial;background:var(--bg);color:#0b1730}
.app{
  max-width:480px;margin:0 auto;padding:18px 18px 18px;min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;position:relative;
}

/* centered car title right above big SOC */
.header-centred{
  text-align:center;
  padding-top: var(--safeTop);
  padding-bottom: 8px;
}
.car-title{font-weight:800;font-size:20px;color:#d93636;margin-bottom:6px}
.car-reg{font-size:16px;color:#d93636;opacity:0.9;margin-bottom:8px}

/* big floating SOC */
.float-soc {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: calc(var(--safeTop) + 56px);
  z-index: 2;
  width: min(560px, calc(100% - 48px));
  display:flex;
  align-items:center;
  justify-content:center;
  pointer-events:none;
}
.float-soc .bignum {
  background: transparent;
  padding: 4px 8px;
  border-radius: 8px;
  pointer-events: auto;
  font-size:72px;
  font-weight:800;
}

/* status label under SOC */
.status-label { margin-top:12px; font-size:22px; font-weight:700; }

/* card */
.card{
  background:var(--card);border-radius:14px;padding:18px;margin:0 6px 12px;box-shadow:0 6px 20px rgba(10,20,30,0.06);position:relative;z-index:1;
}
.card .soc-space { height: 26px; } /* visual spacer */

/* text */
.sub{font-size:14px;color:var(--muted);text-align:center}
.controls{display:flex;gap:10px;margin-top:12px}
.btn{flex:1;padding:12px;border-radius:10px;border:0;font-weight:700;font-size:16px;background:var(--accent);color:#fff}
.btn.secondary{background:transparent;border:1px solid #e6e9eb;color:#0b1730}
.row{display:flex;gap:10px;align-items:center}
.input{padding:10px;border-radius:10px;border:1px solid #eee;width:100%;font-size:16px}
.footer{margin-top:6px;font-size:13px;color:var(--muted);text-align:center}
.bottom-actions{display:flex;gap:12px;margin:8px 6px 10px;z-index:3}
.bottom-actions .btn{flex:1;padding:14px;border-radius:12px;font-size:18px}

/* small helpers */
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.2);display:none}
</style>
</head>
<body>
<div class="app" id="app">

  <!-- Car title centered above the big SOC -->
  <div class="header-centred" aria-hidden="true">
    <div class="car-title">Hyundai KONA EV</div>
    <div class="car-reg">191D37789</div>
  </div>

  <!-- floating battery percent (visually sits above the card) -->
  <div class="float-soc" aria-hidden="true">
    <div style="background:transparent;text-align:center;">
      <div id="bigSOCFloat" class="bignum">--%</div>
      <div id="subInfoFloat" class="status-label" style="color:var(--accent);">Idle</div>
    </div>
  </div>

  <!-- main card sits below the floating SOC -->
  <div id="mainCard" class="card" role="region" aria-label="EV SOC">
    <div class="soc-space"></div>
    <div id="cardBody">
      <!-- simplified card: removed in-card big SOC and removed battery capacity line -->
      <div style="text-align:left; margin-top:6px">
        <div id="historySummary" class="sub">No sessions yet</div>
      </div>

      <!-- hidden session controls (we only use bottom bar) -->
      <div id="controls" style="margin-top:12px; display:none">
        <div id="idleControls">
          <div class="row">
            <select id="lastSocSelect" class="input" style="display:none" aria-label="Select current SOC"></select>
            <button id="saveLastSoc" class="btn secondary" style="display:none">Save</button>
          </div>
        </div>
        <div id="sessionControls" style="display:none">
          <div class="row">
            <input id="kwhInput" class="input" type="tel" inputmode="decimal" pattern="[0-9]*" enterkeyhint="done" style="display:none" min="0" step="0.1" placeholder="Total kWh added so far">
            <button id="updateKwh" class="btn" style="display:none">Update</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer small">Tip: open Monta, copy kWh added and paste into the app when charging.</div>

  <!-- bottom big thumb-friendly actions (only controls here) -->
  <div class="bottom-actions" aria-hidden="false">
    <button id="startBtn" class="btn">Start</button>
    <button id="setSocBtn" class="btn secondary">Set SOC</button>
    <button id="addKwhBtn" class="btn" style="display:none">Add kWh</button>
    <button id="endBtn" class="btn secondary" style="display:none">End</button>
  </div>

</div>

<div id="toast" class="toast" role="status" aria-live="polite"></div>

<script src="app.js"></script>
</body>
</html>