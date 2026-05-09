/**
 * Dashboard HTML 模板
 * 布局：顶部状态卡 → 模式选择+紧急操作 → 设置面板 → 熔断列表 → 活跃run → 事件流
 */
export function renderDashboardHtml(_stats) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Mapick Cost Firewall</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui;max-width:1000px;margin:0 auto;padding:16px;background:#f8f9fa;font-size:14px;color:#333}
h2{font-size:14px;margin:18px 0 8px;color:#555;display:flex;align-items:center;gap:8px}
h2 .count{font-size:11px;background:#e0e0e0;padding:1px 8px;border-radius:10px}
.cards{display:flex;gap:10px;margin-bottom:14px}
.card{flex:1;padding:14px;border-radius:10px;text-align:center;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.08);position:relative}
.card .v{font-size:26px;font-weight:700}.card .l{font-size:11px;color:#888;margin-top:2px}
.card.estop{background:#fce4ec;border:2px solid #c62828}
.card.estop .v{color:#c62828}
.mode-bar{display:flex;align-items:center;gap:10px;margin-bottom:14px;background:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.mode-btn{padding:8px 20px;border-radius:6px;border:2px solid #ddd;cursor:pointer;font-size:13px;font-weight:600;background:#fff;transition:.15s}
.mode-btn.active{border-color:#2e7d32;background:#e8f5e9;color:#2e7d32}
.mode-btn.protect.active{border-color:#e65100;background:#fff3e0;color:#e65100}
.mode-btn.estop.active{border-color:#c62828;background:#fce4ec;color:#c62828}
.btn{padding:6px 16px;border-radius:6px;border:none;cursor:pointer;font-size:12px;color:#fff;font-weight:600}
.btn.danger{background:#c62828}.btn.green{background:#2e7d32}.btn.primary{background:#1565c0}
.btn.small{padding:3px 10px;font-size:11px}
.panel{background:#fff;border-radius:8px;padding:14px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.row{display:flex;align-items:center;gap:10px;margin:6px 0}
.row label{min-width:120px;font-size:13px;color:#555}
.row input{width:90px;padding:5px 8px;border:1px solid #ddd;border-radius:5px;font-size:13px}
.row .hint{font-size:11px;color:#999}
table{width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;font-size:12px;margin-top:8px}
th{background:#f5f5f5;padding:6px 10px;text-align:left;font-weight:600}
td{padding:6px 10px;border-top:1px solid #f0f0f0;background:#fff}
.events{max-height:300px;overflow:auto;font-family:monospace;font-size:11px;background:#1e1e1e;color:#d4d4d4;border-radius:8px;padding:10px;white-space:pre;line-height:1.7}
</style></head>
<body>
<h1 style="font-size:20px;margin:0 0 14px">🛡️ Mapick Cost Firewall</h1>

<!-- 模式选择 + 操作 -->
<div class="mode-bar">
  <span style="font-size:13px;color:#555;margin-right:6px">Mode</span>
  <button class="mode-btn observe active" onclick="setMode('observe')" id="btnObs">🔍 Observe</button>
  <button class="mode-btn protect" onclick="setMode('protect')" id="btnProt">🛡️ Protect</button>
  <span style="flex:1"></span>
  <button class="btn danger" onclick="api('stop')" id="btnStop">⏹ 紧急熔断</button>
  <button class="btn green" onclick="api('resume')" id="btnResume">▶ 恢复</button>
  <button class="btn primary" onclick="refresh()">🔄</button>
</div>

<!-- 状态卡 -->
<div class="cards">
  <div class="card"><div class="v" id="tokens" style="color:#1565c0">0</div><div class="l">今日 Tokens<span style="color:#bbb;margin-left:4px;cursor:help" title="当天累计消耗的 token 数（按字节÷4 估算）">?</span></div></div>
  <div class="card"><div class="v" id="blocked" style="color:#c62828">0</div><div class="l">已拦截<span style="color:#bbb;margin-left:4px;cursor:help" title="被熔断规则拦截的请求次数">?</span></div></div>
  <div class="card"><div class="v" id="limit" style="color:#e65100">∞</div><div class="l">日限额<span style="color:#bbb;margin-left:4px;cursor:help" title="token 上限，达到后拦截所有请求；∞=不限制">?</span></div></div>
  <div class="card"><div class="v" id="calls" style="color:#2e7d32">0</div><div class="l">调用次数<span style="color:#bbb;margin-left:4px;cursor:help" title="今天总 LLM 调用次数">?</span></div></div>
</div>

<!-- 设置面板 -->
<h2>⚙️ 阻断规则 <span style="font-weight:400;font-size:11px;color:#999">改后即时生效</span></h2>
<div class="panel">
  <div class="row"><label>日 Token 限额</label><input id="cfgLimit" type="number" min="0" placeholder="∞（不限制）"><span class="hint">0=关闭</span></div>
  <div class="row"><label>连续失败熔断</label><input id="cfgFail" type="number" min="1" style="width:60px"><span class="hint">次连续失败后熔断 30s</span></div>
  <div class="row"><label>冷却时间</label><input id="cfgCool" type="number" min="5" style="width:60px"><span class="hint">秒后自动恢复</span></div>
  <div class="row"><label>Token 速率</label><input id="cfgVel" type="number" min="0" style="width:90px"><span class="hint">tokens / <input id="cfgVelWin" type="number" min="10" style="width:60px">秒，0=关闭</span></div>
  <div class="row"><label>调用频率</label><input id="cfgFreq" type="number" min="0" style="width:60px"><span class="hint">次 / <input id="cfgFreqWin" type="number" min="10" style="width:60px">秒，0=关闭</span></div>
  <button class="btn primary" onclick="saveConfig()" style="margin-top:10px">💾 保存</button>
  <span id="cfgMsg" style="font-size:12px;margin-left:10px"></span>
</div>

<!-- 熔断列表 -->
<h2>🔥 熔断中的 Source <span class="count" id="coolingCount">0</span></h2>
<table><thead><tr><th>Source</th><th>原因</th><th>剩余</th><th>操作</th></tr></thead><tbody id="coolingTb"><tr><td colspan="4" style="text-align:center;color:#999;padding:20px">✅ 暂无熔断</td></tr></tbody></table>

<!-- 活跃 Run -->
<h2>📊 活跃 Run <span class="count" id="runCount">0</span></h2>
<table><thead><tr><th>Run</th><th>Source</th><th>调用</th><th>Tokens</th><th>状态</th></tr></thead><tbody id="runsTb"><tr><td colspan="5" style="text-align:center;color:#999;padding:20px">暂无活跃 run</td></tr></tbody></table>

<!-- 事件流 -->
<h2>📋 最近事件 <span class="count" id="eventCount">0</span></h2>
<div class="events" id="events">加载中...</div>

<script>
const API='http://127.0.0.1:18789/mapick/api';
function api(p){fetch(API+'/'+p).then(refresh)}
function setMode(m){fetch(API+'/config',{method:'POST',body:JSON.stringify({mode:m})}).then(refresh)}
async function saveConfig(){
  const c={breaker:{consecutiveFailures:+dO('cfgFail'),cooldownSec:+dO('cfgCool'),tokenVelocityThreshold:+dO('cfgVel'),tokenVelocityWindowSec:+dO('cfgVelWin'),callFrequencyThreshold:+dO('cfgFreq'),callFrequencyWindowSec:+dO('cfgFreqWin')}};
  const lt=+dO('cfgLimit');if(lt>0)c.dailyTokenLimit=lt;else c.dailyTokenLimit=null;
  const r=await fetch(API+'/config',{method:'POST',body:JSON.stringify(c)});
  const d=await r.json();
  document.getElementById('cfgMsg').textContent=d.ok?'✅ 已保存':'❌ '+d.error;
  document.getElementById('cfgMsg').style.color=d.ok?'#2e7d32':'#c62828';
  setTimeout(()=>document.getElementById('cfgMsg').textContent='',3000);
}
function dO(id){return document.getElementById(id).value}
async function refresh(){
  try{
    const r=await fetch(API+'/stats');const d=await r.json();
    // Mode buttons
    const m=d.mode||'observe';const es=d.emergency_stop;
    document.getElementById('btnObs').className='mode-btn observe'+(m==='observe'&&!es?' active':'');
    document.getElementById('btnProt').className='mode-btn protect'+(m==='protect'&&!es?' active':'');
    document.getElementById('btnStop').style.opacity=es?'0.5':'1';
    document.getElementById('btnResume').style.opacity=es?'1':'0.5';
    // Stats
    document.getElementById('tokens').textContent=(d.today_tokens||0).toLocaleString();
    document.getElementById('blocked').textContent=d.today_blocked||0;
    document.getElementById('limit').textContent=d.daily_token_limit!=null?d.daily_token_limit.toLocaleString():'∞';
    document.getElementById('calls').textContent=(d.today_calls||0).toLocaleString();
    // Config
    document.getElementById('cfgLimit').value=d.daily_token_limit||'';
    const b=d.breaker||{};
    document.getElementById('cfgFail').value=b.consecutive_failures||3;
    document.getElementById('cfgCool').value=b.cooldown_sec||30;
    document.getElementById('cfgVel').value=b.token_velocity_threshold||0;
    document.getElementById('cfgVelWin').value=b.token_velocity_window_sec||60;
    document.getElementById('cfgFreq').value=b.call_frequency_threshold||0;
    document.getElementById('cfgFreqWin').value=b.call_frequency_window_sec||60;
    // Cooldown
    const cs=d.cooling_sources||[];
    document.getElementById('coolingCount').textContent=cs.length;
    document.getElementById('coolingTb').innerHTML=cs.length?cs.map(s=>
      '<tr><td style="font-family:monospace">'+s.source+'</td><td><span style="background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:4px;font-size:11px">'+s.reason+'</span></td><td>'+s.remainingSec+'s</td>'+
      '<td><button class="btn danger small" onclick="fetch(API+\'/reset-source?source='+encodeURIComponent(s.source)+'\').then(refresh)">恢复</button></td></tr>'
    ).join(''):'<tr><td colspan="4" style="text-align:center;color:#999;padding:20px">✅ 暂无熔断</td></tr>';
    // Runs
    const ar=d.active_runs||[];
    document.getElementById('runCount').textContent=ar.length;
    document.getElementById('runsTb').innerHTML=ar.length?ar.map(r=>
      '<tr><td style="font-family:monospace">'+r.runId.slice(0,8)+'</td><td>'+r.source+'</td><td>'+r.calls+'</td><td>'+(r.tokens||0).toLocaleString()+'</td>'+
      '<td><span style="padding:2px 8px;border-radius:4px;font-size:11px;background:'+(r.status==='danger'?'#fce4ec':'#fff3e0')+';color:'+(r.status==='danger'?'#c62828':'#e65100')+'">'+r.status+'</span>'+(r.reason?' <span style="font-size:10px;color:#999">'+r.reason+'</span>':'')+'</td></tr>'
    ).join(''):'<tr><td colspan="5" style="text-align:center;color:#999;padding:20px">暂无活跃 run</td></tr>';
    // Events
    try{
      const ev=await fetch(API+'/events');const evd=await ev.json();
      document.getElementById('eventCount').textContent=evd.length;
      document.getElementById('events').innerHTML=evd.map(e=>{
        const t=new Date(e.timestamp).toISOString().slice(11,19);
        const isBlock=e.type==='blocked';
        const isErr=e.outcome==='error';
        const c=isBlock?'#f44747':isErr?'#e2b93b':'#89d185';
        const info=[e.provider,e.model,e.outcome,e.reason,e.failureKind,e.source].filter(Boolean).join(' ');
        return '<span style="color:'+c+'">'+t+'</span> <b>'+e.type+'</b> '+info;
      }).join('\n')||'（暂无事件）';
    }catch(ex){}
  }catch(ex){console.error(ex)}
}
refresh();setInterval(refresh,3000);
</script></body></html>`;
}
//# sourceMappingURL=html.js.map