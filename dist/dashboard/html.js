/**
 * Dashboard HTML 模板
 */
export function renderDashboardHtml(stats) {
    const coolingHtml = (stats.cooling_sources || []).length > 0
        ? (stats.cooling_sources || []).map((s) => `<div style="background:#fff3e0;padding:8px;margin:4px 0;border-radius:4px">
          <b>${s.source}</b> — ${s.reason} — ${s.remainingSec}s left
        </div>`).join("")
        : `<div style="color:#999">No sources in cooldown</div>`;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mapick Cost Firewall</title>
  <style>
    *{box-sizing:border-box}body{font-family:system-ui;max-width:800px;margin:0 auto;padding:24px;background:#f8f9fa}
    h1{font-size:22px;margin-bottom:20px}
    .cards{display:flex;gap:16px;margin-bottom:20px}
    .card{flex:1;padding:16px;border-radius:10px;text-align:center}
    .card .v{font-size:28px;font-weight:700}
    .card .l{font-size:12px;color:#666;margin-top:4px}
    .green{background:#e8f5e9}.green .v{color:#2e7d32}
    .orange{background:#fff3e0}.orange .v{color:#e65100}
    .red{background:#fce4ec}.red .v{color:#c62828}
    .blue{background:#e3f2fd}.blue .v{color:#1565c0}
    .section{margin-bottom:20px}
    .section h2{font-size:15px;margin-bottom:10px;color:#333}
    .breaker{background:#fff;padding:12px;border-radius:8px;font-size:13px;line-height:1.8}
    .breaker span{display:inline-block;background:#f0f0f0;padding:2px 8px;border-radius:4px;margin:0 4px}
    .cooldown{background:#fff;padding:12px;border-radius:8px}
    .events{background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;font-family:monospace;font-size:12px;max-height:300px;overflow:auto;white-space:pre-wrap}
    .err{color:#f44747}
  </style>
</head>
<body>
  <h1>🛡️ Mapick Cost Firewall</h1>

  <div class="cards">
    <div class="card green"><div class="v" id="mode">-</div><div class="l">Mode</div></div>
    <div class="card blue"><div class="v" id="tokens">0</div><div class="l">Today Tokens</div></div>
    <div class="card red"><div class="v" id="blocked">0</div><div class="l">Blocked</div></div>
    <div class="card orange"><div class="v" id="limit">∞</div><div class="l">Limit</div></div>
  </div>

  <div class="section">
    <h2>⚙️ Breaker Config</h2>
    <div class="breaker" id="breaker"></div>
  </div>

  <div class="section">
    <h2>📊 Active Runs</h2>
    <div class="cooldown" id="runs"><div style="color:#999">No active runs</div></div>
  </div>

  <div class="section">
    <h2>🔥 Cooldown Sources</h2>
    <div class="cooldown" id="cooldown">${coolingHtml}</div>
  </div>

  <div class="section">
    <h2>📋 Recent Events</h2>
    <div class="events" id="events">Loading...</div>
  </div>

  <script>
    const API = 'http://127.0.0.1:18789/mapick/api';
    async function refresh(){
      try{
        const r=await fetch(API+'/stats');const d=await r.json();
        document.getElementById('mode').textContent=d.mode;
        document.getElementById('mode').parentElement.className='card '+(d.emergency_stop?'red':d.mode==='protect'?'orange':'green');
        document.getElementById('tokens').textContent=(d.today_tokens||0).toLocaleString();
        document.getElementById('blocked').textContent=d.today_blocked;
        document.getElementById('limit').textContent=d.daily_token_limit!=null?d.daily_token_limit.toLocaleString():'∞';
        document.getElementById('breaker').innerHTML='Consecutive Failures: <span>'+d.breaker?.consecutive_failures_threshold+'</span> Cooldown: <span>'+d.breaker?.cooldown_sec+'s</span>';
        if(d.cooling_sources?.length){
          document.getElementById('cooldown').innerHTML=d.cooling_sources.map(s=>'<div style="background:#fff3e0;padding:8px;margin:4px 0;border-radius:4px"><b>'+s.source+'</b> — '+s.reason+' — '+s.remainingSec+'s left</div>').join('');
        }else{document.getElementById('cooldown').innerHTML='<div style="color:#999">No sources in cooldown</div>'}
        if(d.active_runs?.length){
          document.getElementById('runs').innerHTML=d.active_runs.map(r=>'<div style="background:#e8f5e9;padding:8px;margin:4px 0;border-radius:4px"><b>'+r.runId.slice(0,8)+'</b> | '+r.source+' | '+r.calls+' calls | '+r.tokens.toLocaleString()+' tokens | <span style="color:'+(r.status==='danger'?'red':r.status==='warning'?'orange':'green')+'">'+r.status+'</span>'+(r.reason?' ('+r.reason+')':'')+'</div>').join('');
        }else{document.getElementById('runs').innerHTML='<div style="color:#999">No active runs</div>'} 
      }catch(e){}
    }
    refresh();setInterval(refresh,3000);
  </script>
</body>
</html>`;
}
//# sourceMappingURL=html.js.map