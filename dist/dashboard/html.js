/**
 * Dashboard HTML — Security Operations Console
 * Aesthetic: Industrial cyber-security, dark terminal, neon accents
 */
export function renderDashboardHtml(_stats) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Firewall · Mapick</title>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#080c12;--surface:#11161d;--border:#1e2630;--text:#c8ccd4;--dim:#5c6370;
  --cyan:#00e5ff;--green:#00c853;--amber:#ffb300;--red:#ff3d3d;--magenta:#d500f9;
  --font-mono:'JetBrains Mono',monospace;--font-sans:'Inter',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:var(--font-sans);overflow-x:hidden;
  background-image:radial-gradient(ellipse at 20% 0%,#0d1520 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,#0d1520 0%,transparent 60%)}
.app{display:grid;grid-template-columns:320px 1fr;min-height:100vh}
/* Sidebar */
.sidebar{background:var(--surface);border-right:1px solid var(--border);padding:24px 20px;display:flex;flex-direction:column;gap:20px}
.logo{font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--cyan);letter-spacing:-0.5px;display:flex;align-items:center;gap:8px}
.logo span{font-size:11px;color:var(--dim);font-weight:400;letter-spacing:1px;text-transform:uppercase}
/* Stat block */
.stat-block{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:12px 14px}
.stat-val{font-family:var(--font-mono);font-size:28px;font-weight:700;line-height:1}
.stat-label{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-top:4px;display:flex;align-items:center;gap:4px}
.dot{width:6px;height:6px;border-radius:50%;display:inline-block}
.dot.green{background:var(--green);box-shadow:0 0 6px var(--green)}
.dot.amber{background:var(--amber);box-shadow:0 0 6px var(--amber)}
.dot.red{background:var(--red);box-shadow:0 0 6px var(--red)}
/* Mode switch */
.mode-group{display:flex;gap:4px;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:3px}
.mode-btn{flex:1;padding:8px 0;text-align:center;font-size:11px;font-weight:600;border:none;border-radius:4px;cursor:pointer;background:transparent;color:var(--dim);font-family:var(--font-sans);transition:.15s}
.mode-btn.active{background:var(--cyan);color:var(--bg)}
.mode-btn.protect.active{background:var(--amber);color:var(--bg)}
.mode-btn.estop.active{background:var(--red);color:var(--bg)}
/* Main */
.main{padding:24px 28px;overflow-y:auto}
.main h2{font-size:12px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:500;display:flex;align-items:center;gap:8px}
.main h2::after{content:'';flex:1;height:1px;background:var(--border)}
/* Settings grid */
.settings{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px}
.set-card{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:14px;position:relative}
.set-card .sw{position:absolute;top:12px;right:14px}
.set-card label{font-size:11px;color:var(--dim);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px}
.set-card .val{font-family:var(--font-mono);font-size:18px;font-weight:600;color:var(--text);margin-bottom:4px}
.set-card .hint{font-size:10px;color:var(--dim)}
/* Switch */
.sw{position:relative;width:32px;height:18px}
.sw input{display:none}
.sw .track{position:absolute;inset:0;background:var(--border);border-radius:9px;cursor:pointer;transition:.2s}
.sw .track::after{content:'';position:absolute;width:14px;height:14px;left:2px;top:2px;background:#fff;border-radius:50%;transition:.2s}
.sw input:checked+.track{background:var(--green)}
.sw input:checked+.track::after{transform:translateX(14px)}
/* Breaker sources */
.source-list{display:flex;flex-direction:column;gap:6px;margin-bottom:24px}
.source-item{background:var(--surface);border:1px solid #2a1a1a;border-radius:6px;padding:12px 14px;display:flex;align-items:center;gap:12px}
.source-item .reason{font-family:var(--font-mono);font-size:11px;color:var(--red);font-weight:600;min-width:140px}
.source-item .src{font-family:var(--font-mono);font-size:12px;color:var(--text);flex:1}
.source-item .time{font-family:var(--font-mono);font-size:10px;color:var(--dim)}
/* Button */
.btn{font-family:var(--font-sans);font-size:11px;font-weight:600;padding:6px 14px;border-radius:4px;border:none;cursor:pointer;transition:.15s}
.btn.cyan{background:var(--cyan);color:var(--bg)}.btn.cyan:hover{opacity:.85}
.btn.red{background:var(--red);color:#fff}.btn.red:hover{opacity:.85}
.btn.amber{background:var(--amber);color:var(--bg)}.btn.amber:hover{opacity:.85}
.btn.ghost{background:transparent;color:var(--cyan);border:1px solid var(--border)}.btn.ghost:hover{border-color:var(--cyan)}
/* Events */
.events{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:12px;font-family:var(--font-mono);font-size:11px;line-height:1.8;max-height:280px;overflow:auto;color:var(--dim)}
.events .ts{color:var(--dim)}
.events .err{color:var(--red)}.events .ok{color:var(--green)}.events .warn{color:var(--amber)}
.events .blk{color:var(--magenta)}
/* Active runs */
.run-item{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px 14px;display:flex;align-items:center;gap:12px;margin-bottom:6px}
.run-item .status{font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600}
.run-item .status.danger{background:#2a1a1a;color:var(--red);border:1px solid #3a1a1a}
.run-item .status.warning{background:#2a2010;color:var(--amber);border:1px solid #3a2a10}
.empty{font-size:11px;color:var(--dim);text-align:center;padding:24px;font-style:italic}
/* Tip */
.tip{display:inline-block;width:14px;height:14px;border-radius:50%;background:var(--border);color:var(--dim);text-align:center;line-height:14px;font-size:9px;cursor:help;font-weight:700;margin-left:3px}
.tip:hover{background:var(--cyan);color:var(--bg)}
/* Modal for editing */
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:10;align-items:center;justify-content:center}
.modal.show{display:flex}
.modal-inner{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:24px;min-width:360px}
.modal-inner input{width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:var(--font-mono);font-size:14px;padding:8px 10px;border-radius:4px;margin:8px 0}
::selection{background:var(--cyan);color:var(--bg)}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
</style>
</head>
<body>
<div class="app">
<aside class="sidebar">
  <div class="logo">◈ FIREWALL <span>v0.1</span></div>

  <div class="stat-block"><div class="stat-val" id="tokens" style="color:var(--cyan)">0</div><div class="stat-label">Today Tokens <span class="tip" title="累计消耗 token 数（字节÷4 估算）"></span></div></div>
  <div class="stat-block"><div class="stat-val" id="blocked" style="color:var(--red)">0</div><div class="stat-label">Blocked <span class="tip" title="被熔断规则拦截的次数"></span></div></div>
  <div class="stat-block"><div class="stat-val" id="limit" style="color:var(--amber)">∞</div><div class="stat-label">Daily Limit <span class="tip" title="token 上限，达到后拦截；∞=无限制"></span></div></div>
  <div class="stat-block"><div class="stat-val" id="calls" style="color:var(--green)">0</div><div class="stat-label">Calls <span class="tip" title="今日 LLM 调用总次数"></span></div></div>

  <div class="mode-group">
    <button class="mode-btn active" id="btnObs" onclick="setMode('observe')">OBSERVE</button>
    <button class="mode-btn protect" id="btnProt" onclick="setMode('protect')">PROTECT</button>
  </div>

  <button class="btn red" onclick="api('stop')" style="width:100%">⏹ EMERGENCY STOP</button>
  <button class="btn cyan" onclick="api('resume')" style="width:100%">▶ RESUME</button>
  <button class="btn ghost" onclick="refresh()" style="width:100%">⟳ REFRESH</button>
  <div id="msg" style="font-size:10px;font-family:var(--font-mono);color:var(--green);text-align:center;min-height:14px;margin-top:8px"></div>
</aside>

<main class="main">
  <h2>Breaking Rules</h2>
  <div class="settings">
    <div class="set-card">
      <label class="sw"><input type="checkbox" id="swLimit" checked onchange="swToggle('limit')"><span class="track"></span></label>
      <label>Daily Token Limit</label>
      <div class="val" id="vLimit" onclick="editVal('cfgLimit','vLimit','token limit')">10000</div>
      <div class="hint">Block all when exceeded</div>
    </div>
    <div class="set-card">
      <label class="sw"><input type="checkbox" id="swFail" checked onchange="swToggle('fail')"><span class="track"></span></label>
      <label>Consecutive Failures</label>
      <div class="val" id="vFail" onclick="editVal('cfgFail','vFail','failures')">3</div>
      <div class="hint">Failures → break <span id="vCool" onclick="editVal('cfgCool','vCool','cooldown')" style="color:var(--amber);cursor:pointer">30s</span></div>
    </div>
    <div class="set-card">
      <label class="sw"><input type="checkbox" id="swVel" onchange="swToggle('vel')"><span class="track"></span></label>
      <label>Token Velocity</label>
      <div class="val" id="vVel" onclick="editVal('cfgVel','vVel','tokens')">100000</div>
      <div class="hint">tokens / <span id="vVelWin" onclick="editVal('cfgVelWin','vVelWin','window sec')" style="color:var(--cyan);cursor:pointer">60s</span> window</div>
    </div>
    <div class="set-card">
      <label class="sw"><input type="checkbox" id="swFreq" onchange="swToggle('freq')"><span class="track"></span></label>
      <label>Call Frequency</label>
      <div class="val" id="vFreq" onclick="editVal('cfgFreq','vFreq','calls')">30</div>
      <div class="hint">calls / <span id="vFreqWin" onclick="editVal('cfgFreqWin','vFreqWin','window sec')" style="color:var(--cyan);cursor:pointer">60s</span> window</div>
    </div>
  </div>

  <h2>Breaker Sources</h2>
  <div class="source-list" id="coolingList"><div class="empty">All clear — no sources in cooldown</div></div>

  <h2>Active Runs</h2>
  <div id="runsList"><div class="empty">No active runs</div></div>

  <h2>Event Log</h2>
  <div class="events" id="events">Loading…</div>
</main>
</div>

<!-- Hidden inputs for editing -->
<input id="cfgLimit" type="hidden" value="10000">
<input id="cfgFail" type="hidden" value="3"><input id="cfgCool" type="hidden" value="30">
<input id="cfgVel" type="hidden" value="0"><input id="cfgVelWin" type="hidden" value="60">
<input id="cfgFreq" type="hidden" value="0"><input id="cfgFreqWin" type="hidden" value="60">

<!-- Edit modal -->
<div class="modal" id="modal"><div class="modal-inner">
  <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px" id="modalLabel"></div>
  <input id="modalInput" type="number" min="0" autofocus>
  <div style="display:flex;gap:8px;margin-top:12px">
    <button class="btn cyan" onclick="saveEdit()">Save</button>
    <button class="btn ghost" onclick="closeModal()">Cancel</button>
  </div>
</div></div>

<script>
const API='http://127.0.0.1:18789/mapick/api';
var _msgTimer, _saving=false;

function showMsg(text,ok){var m=document.getElementById('msg');m.textContent=text;m.style.color=ok?'#00c853':'#ff3d3d';clearTimeout(_msgTimer);_msgTimer=setTimeout(function(){m.textContent=''},3000)}
function api(p){showMsg('Calling '+p+'...',true);fetch(API+'/'+p).then(function(r){r.ok?showMsg(p+' OK',true):showMsg(p+' FAIL',false)}).catch(function(e){showMsg(p+' ERR: '+e.message,false)}).then(refresh)}
function setMode(m){showMsg('Setting '+m+'...',true);_saving=true;fetch(API+'/config',{method:'POST',body:JSON.stringify({mode:m})}).then(function(r){return r.json()}).then(function(d){_saving=false;showMsg('Mode: '+m+(d.ok?' ✓':' ✗'),d.ok)}).catch(function(e){_saving=false;showMsg('Error: '+e.message,false)}).then(refresh)}
function resetSource(src){showMsg('Resetting '+src+'...',true);fetch(API+'/reset-source?source='+encodeURIComponent(src)).then(function(r){showMsg(r.ok?'Reset OK':'Reset failed',r.ok)}).catch(function(e){showMsg('Error: '+e.message,false)}).then(refresh)}

// ---- Edit modal ----
var editId,editDisplay;
function editVal(id,display,label){
  editId=id;editDisplay=display;
  document.getElementById('modalLabel').textContent='Edit '+label;
  document.getElementById('modalInput').value=document.getElementById(id).value;
  document.getElementById('modal').classList.add('show');
  document.getElementById('modalInput').focus();
}
function closeModal(){document.getElementById('modal').classList.remove('show')}
function saveEdit(){
  document.getElementById(editId).value=document.getElementById('modalInput').value;
  document.getElementById(editDisplay).textContent=document.getElementById('modalInput').value;
  closeModal();saveConfig()
}
document.getElementById('modalInput').addEventListener('keydown',function(e){if(e.key==='Enter')saveEdit();if(e.key==='Escape')closeModal()});
document.getElementById('modal').addEventListener('click',function(e){if(e.target===this)closeModal()});

// ---- Switch toggle ----
function swToggle(rule){
  var sw=document.getElementById('sw'+rule.charAt(0).toUpperCase()+rule.slice(1));
  var on=sw.checked;
  if(rule==='limit'){ document.getElementById('cfgLimit').disabled=!on; if(!on)document.getElementById('cfgLimit').value='0'; }
  else if(rule==='fail'){ document.getElementById('cfgFail').disabled=!on; document.getElementById('cfgCool').disabled=!on; if(!on){document.getElementById('cfgFail').value='0';} }
  else if(rule==='vel'){ document.getElementById('cfgVel').disabled=!on; document.getElementById('cfgVelWin').disabled=!on; if(!on){document.getElementById('cfgVel').value='0';} }
  else if(rule==='freq'){ document.getElementById('cfgFreq').disabled=!on; document.getElementById('cfgFreqWin').disabled=!on; if(!on){document.getElementById('cfgFreq').value='0';} }
  showMsg(rule+' '+(on?'ON':'OFF')+' — click Save',true);
}

// ---- Save config ----
async function saveConfig(){
  if(_saving) return;
  _saving=true; showMsg('Saving...',true);
  var c={
    breaker:{
      consecutiveFailures:+dO('cfgFail'),cooldownSec:+dO('cfgCool'),
      tokenVelocityThreshold:+dO('cfgVel'),tokenVelocityWindowSec:+dO('cfgVelWin'),
      callFrequencyThreshold:+dO('cfgFreq'),callFrequencyWindowSec:+dO('cfgFreqWin')
    }
  };
  var lt=+dO('cfgLimit');c.dailyTokenLimit=lt>0?lt:null;
  try{
    var r=await fetch(API+'/config',{method:'POST',body:JSON.stringify(c)});
    var d=await r.json();
    showMsg(d.ok?'Saved ✓':'Error: '+d.error,!!d.ok);
  }catch(e){ showMsg('Network error',false) }
  _saving=false;
  refresh();
}
function dO(id){return document.getElementById(id).value}

// ---- Refresh ----
async function refresh(){
  if(_saving) return; // 防止保存期间刷新覆盖用户操作
  try{
    var r=await fetch(API+'/stats');var d=await r.json();
    document.getElementById('tokens').textContent=(d.today_tokens||0).toLocaleString();
    document.getElementById('blocked').textContent=d.today_blocked||0;
    document.getElementById('limit').textContent=d.daily_token_limit!=null?d.daily_token_limit.toLocaleString():'∞';
    document.getElementById('calls').textContent=(d.today_calls||0).toLocaleString();

    var m=d.mode||'observe';var es=d.emergency_stop;
    document.getElementById('btnObs').className='mode-btn'+(m==='observe'&&!es?' active':'');
    document.getElementById('btnProt').className='mode-btn protect'+(m==='protect'&&!es?' active':'');

    var b=d.breaker||{};
    document.getElementById('cfgLimit').value=d.daily_token_limit ?? '';
    document.getElementById('vLimit').textContent=d.daily_token_limit ?? '∞';
    document.getElementById('swLimit').checked=d.daily_token_limit!=null;

    // API returns snake_case, saveConfig sends camelCase — both work with backend
    document.getElementById('cfgFail').value=b.consecutive_failures ?? 3;
    document.getElementById('vFail').textContent=b.consecutive_failures ?? 3;
    document.getElementById('swFail').checked=true;

    document.getElementById('cfgCool').value=b.cooldown_sec ?? 30;
    document.getElementById('vCool').textContent=(b.cooldown_sec ?? 30)+'s';
    document.getElementById('cfgVel').value=b.token_velocity_threshold ?? 0;
    document.getElementById('vVel').textContent=b.token_velocity_threshold ?? 0;
    document.getElementById('swVel').checked=(b.token_velocity_threshold ?? 0)>0;

    document.getElementById('cfgVelWin').value=b.token_velocity_window_sec ?? 60;
    document.getElementById('vVelWin').textContent=(b.token_velocity_window_sec ?? 60)+'s';
    document.getElementById('cfgFreq').value=b.call_frequency_threshold ?? 0;
    document.getElementById('vFreq').textContent=b.call_frequency_threshold ?? 0;
    document.getElementById('swFreq').checked=(b.call_frequency_threshold ?? 0)>0;

    document.getElementById('cfgFreqWin').value=b.call_frequency_window_sec||60;
    document.getElementById('vFreqWin').textContent=(b.call_frequency_window_sec||60)+'s';

    // Breaker sources
    var cs=d.cooling_sources||[];
    var cl=document.getElementById('coolingList');
    cl.innerHTML=cs.length?cs.map(function(s){return'<div class="source-item"><span class="reason">'+s.reason+'</span><span class="src">'+s.source+'</span><span class="time">'+s.remainingSec+'s</span><button class="btn red" style="font-size:10px;padding:3px 8px" onclick="resetSource(\\''+s.source+'\\')">Reset</button></div>'}).join(''):'<div class="empty">All clear — no sources in cooldown</div>';

    // Runs
    var ar=d.active_runs||[];
    document.getElementById('runsList').innerHTML=ar.length?ar.map(function(r){return'<div class="run-item"><span class="src" style="flex:1;font-family:var(--font-mono);font-size:11px">'+r.runId.slice(0,8)+' <span style="color:var(--dim)">'+r.source+'</span></span><span style="font-family:var(--font-mono);font-size:11px;color:var(--dim)">'+r.calls+' calls | '+(r.tokens||0).toLocaleString()+' t</span><span class="status '+(r.status==='danger'?'danger':'warning')+'">'+r.status+'</span></div>'}).join(''):'<div class="empty">No active runs</div>';

    // Events
    try{
      var ev=await fetch(API+'/events');var evd=await ev.json();
      document.getElementById('events').innerHTML=evd.length?evd.map(function(e){
        var t=new Date(e.timestamp).toISOString().slice(11,19);
        var c='ok';if(e.type==='blocked')c='blk';else if(e.outcome==='error')c='err';else if(e.type==='run_status_change')c='warn';
        return'<span class="ts">'+t+'</span> <span class="'+c+'">'+e.type+'</span> '+(e.provider||'')+' '+(e.model||'')+' '+(e.outcome||'')+' '+(e.reason||'')+'<br>';
      }).join(''):'<span class="empty">No events yet</span>';
    }catch(ex){document.getElementById('events').textContent='Failed to load events'}
  }catch(ex){console.error(ex)}
}
refresh();setInterval(refresh,3000);
</script>
</body></html>`;
}
//# sourceMappingURL=html.js.map