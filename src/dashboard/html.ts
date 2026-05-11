export function renderDashboardHtml(_stats: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cost Firewall Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f9fb;
      color: #1f2937;
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 220px;
      background: #fff;
      border-right: 1px solid #e5e7eb;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sidebar h1 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat-card {
      background: #f8f9fb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px;
    }
    .stat-card .label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }
    .mode-switch {
      display: flex;
      gap: 8px;
      padding: 4px;
      background: #f8f9fb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .mode-btn {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      background: transparent;
      color: #6b7280;
      transition: all 0.2s;
    }
    .mode-btn.active {
      background: #fff;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-danger {
      background: #dc2626;
      color: #fff;
    }
    .btn-danger:hover { background: #b91c1c; }
    .btn-primary {
      background: #2563eb;
      color: #fff;
    }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary {
      background: #f8f9fb;
      color: #374151;
      border: 1px solid #e5e7eb;
    }
    .btn-secondary:hover { background: #e5e7eb; }
    .main {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .rules-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    @media (max-width: 1200px) {
      .rules-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .rules-grid { grid-template-columns: 1fr; }
    }
      margin-bottom: 24px;
    }
    .rule-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .rule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      margin-bottom: 2px;
      border-bottom: 1px solid #f3f4f6;
    }
    .rule-title {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #d1d5db;
      transition: 0.2s;
      border-radius: 12px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.2s;
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: #2563eb;
    }
    input:checked + .slider:before {
      transform: translateX(20px);
    }
    .rule-fields {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .field-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .field-label {
      font-size: 11px;
      color: #6b7280;
      min-width: 60px;
      flex-shrink: 0;
    }
    .field-input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 12px;
      min-width: 0;
    }
    .field-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 1px #2563eb;
    }
    .field-hint {
      font-size: 11px;
      color: #9ca3af;
    }
    .lists-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .list-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .list-header {
      padding: 12px 16px;
      background: #f8f9fb;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }
    .list-body {
      max-height: 300px;
      overflow-y: auto;
      padding: 8px;
    }
    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f8f9fb;
      border-radius: 6px;
      margin-bottom: 4px;
      font-size: 12px;
    }
    .list-item:last-child { margin-bottom: 0; }
    .btn-sm {
      padding: 4px 10px;
      font-size: 11px;
      border-radius: 4px;
    }
    .empty-state {
      padding: 20px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    .events-section {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .events-body {
      max-height: 500px;
      overflow-y: auto;
      padding: 12px;
    }
    .event-item {
      display: flex;
      gap: 12px;
      padding: 8px 12px;
      font-size: 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .event-item:last-child { border-bottom: none; }
    .event-time {
      color: #6b7280;
      font-family: monospace;
      min-width: 140px;
    }
    .event-type {
      font-weight: 500;
      min-width: 80px;
    }
    .event-type.blocked { color: #dc2626; }
    .event-type.warning { color: #f59e0b; }
    .event-type.info { color: #2563eb; }
    .event-msg { color: #374151; flex: 1; }
    .ok { color: #16a34a; }
    .err { color: #dc2626; font-weight: 500; }
    .warn { color: #f59e0b; }
    .dim { color: #6b7280; }
    .btn-save {
      padding: 3px 10px;
      font-size: 11px;
      border-radius: 4px;
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      margin-top: 2px;
      align-self: flex-end;
      transition: all 0.2s;
    }
    .btn-save:hover {
      background: #e5e7eb;
      border-color: #d1d5db;
    }
  </style>
</head>
<body>
  <div class="sidebar">
    <h1>Cost Firewall</h1>
    
    <div class="stat-card">
      <div class="label">Today Tokens</div>
      <div class="value" id="stat-tokens">-</div>
    </div>
    
    <div class="stat-card">
      <div class="label">Blocked</div>
      <div class="value" id="stat-blocked">-</div>
    </div>
    
    <div class="stat-card">
      <div class="label">Daily Limit</div>
      <div class="value" id="stat-limit">-</div>
    </div>
    
    <div class="stat-card">
      <div class="label">Active Calls</div>
      <div class="value" id="stat-calls">-</div>
    </div>
    
    <div class="mode-switch">
      <button class="mode-btn" id="mode-observe">Observe</button>
      <button class="mode-btn" id="mode-protect">Protect</button>
    </div>
    
    <button class="btn btn-danger" id="btn-stop">Emergency Stop</button>
    <button class="btn btn-primary" id="btn-resume" style="display:none">Resume</button>
    <button class="btn btn-secondary" id="btn-refresh">Refresh</button>
  </div>
  
  <div class="main">
    <div class="section-title">Rules Configuration</div>
    <div class="rules-grid">
      <div class="rule-card">
        <div class="rule-header">
          <span class="rule-title">Daily Token Limit</span>
          <label class="switch">
            <input type="checkbox" id="switch-daily-limit">
            <span class="slider"></span>
          </label>
        </div>
        <div class="rule-fields">
          <div class="field-row">
            <span class="field-label">Limit:</span>
            <input type="number" class="field-input" id="input-daily-limit" placeholder="50000">
            <span class="field-hint">tokens</span>
          </div>
        </div>
        <button class="btn-save" id="btn-save-daily-limit">Save</button>
      </div>
      
      <div class="rule-card">
        <div class="rule-header">
          <span class="rule-title">Consecutive Failures</span>
          <label class="switch">
            <input type="checkbox" id="switch-failures">
            <span class="slider"></span>
          </label>
        </div>
        <div class="rule-fields">
          <div class="field-row">
            <span class="field-label">Failures:</span>
            <input type="number" class="field-input" id="input-failures" placeholder="3">
          </div>
          <div class="field-row">
            <span class="field-label">Cooldown:</span>
            <input type="number" class="field-input" id="input-cooldown" placeholder="30">
            <span class="field-hint">sec</span>
          </div>
        </div>
        <button class="btn-save" id="btn-save-failures">Save</button>
      </div>
      
      <div class="rule-card">
        <div class="rule-header">
          <span class="rule-title">Token Velocity</span>
          <label class="switch">
            <input type="checkbox" id="switch-velocity">
            <span class="slider"></span>
          </label>
        </div>
        <div class="rule-fields">
          <div class="field-row">
            <span class="field-label">Threshold:</span>
            <input type="number" class="field-input" id="input-velocity" placeholder="1000">
            <span class="field-hint">tokens</span>
          </div>
          <div class="field-row">
            <span class="field-label">Window:</span>
            <input type="number" class="field-input" id="input-velocity-window" placeholder="60">
            <span class="field-hint">sec</span>
          </div>
        </div>
        <button class="btn-save" id="btn-save-velocity">Save</button>
      </div>
      
      <div class="rule-card">
        <div class="rule-header">
          <span class="rule-title">Call Frequency</span>
          <label class="switch">
            <input type="checkbox" id="switch-frequency">
            <span class="slider"></span>
          </label>
        </div>
        <div class="rule-fields">
          <div class="field-row">
            <span class="field-label">Threshold:</span>
            <input type="number" class="field-input" id="input-frequency" placeholder="100">
            <span class="field-hint">calls</span>
          </div>
          <div class="field-row">
            <span class="field-label">Window:</span>
            <input type="number" class="field-input" id="input-frequency-window" placeholder="60">
            <span class="field-hint">sec</span>
          </div>
        </div>
        <button class="btn-save" id="btn-save-frequency">Save</button>
      </div>
    </div>
    
    <div class="section-title">Monitoring</div>
    <div class="lists-grid">
      <div class="list-card">
        <div class="list-header">Cooling Sources</div>
        <div class="list-body" id="list-cooling">
          <div class="empty-state">No cooling sources</div>
        </div>
      </div>
      
      <div class="list-card">
        <div class="list-header">Active Runs</div>
        <div class="list-body" id="list-runs">
          <div class="empty-state">No active runs</div>
        </div>
      </div>
      
      <div class="list-card">
        <div class="list-header">Status</div>
        <div class="list-body" id="list-status">
          <div class="empty-state">Normal</div>
        </div>
      </div>
    </div>
    
    <div class="section-title">Event Log</div>
    <div class="events-section">
      <div class="events-body" id="events-log">
        <div class="empty-state">No events</div>
      </div>
    </div>
  </div>

  <script>
    let _saving = false;
    let _refreshTimer = null;

    // Check if element is focused (user is editing), skip value update if so
    function isFocused(id) {
      var el = document.getElementById(id);
      return el && document.activeElement === el;
    }
    function safeSetValue(id, value) {
      if (isFocused(id)) return; // User is editing, don't override
      var el = document.getElementById(id);
      if (el) el.value = value ?? '';
    }

    async function fetchStats() {
      if (_saving) return;
      try {
        const res = await fetch('/mapick/api/stats');
        const data = await res.json();
        updateUI(data);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    }

    function updateUI(data) {
      document.getElementById('stat-tokens').textContent = (data.today_tokens ?? 0).toLocaleString();
      document.getElementById('stat-blocked').textContent = data.today_blocked ?? 0;
      document.getElementById('stat-limit').textContent = data.daily_token_limit ? data.daily_token_limit.toLocaleString() : 'None';
      document.getElementById('stat-calls').textContent = (data.active_runs ?? []).length;

      const modeObserve = document.getElementById('mode-observe');
      const modeProtect = document.getElementById('mode-protect');
      if (data.mode === 'protect') {
        modeProtect.classList.add('active');
        modeObserve.classList.remove('active');
      } else {
        modeObserve.classList.add('active');
        modeProtect.classList.remove('active');
      }

      const btnStop = document.getElementById('btn-stop');
      const btnResume = document.getElementById('btn-resume');
      if (data.emergency_stop) {
        btnStop.style.display = 'none';
        btnResume.style.display = 'block';
      } else {
        btnStop.style.display = 'block';
        btnResume.style.display = 'none';
      }

      const breaker = data.breaker ?? {};
      
      const switchDailyLimit = document.getElementById('switch-daily-limit');
      const inputDailyLimit = document.getElementById('input-daily-limit');
      const hasDailyLimit = data.daily_token_limit != null && data.daily_token_limit > 0;
      switchDailyLimit.checked = hasDailyLimit;
      safeSetValue('input-daily-limit', data.daily_token_limit);

      switchFailures.checked = hasFailures;
      safeSetValue('input-failures', breaker.consecutive_failures);
      safeSetValue('input-cooldown', breaker.cooldown_sec);

      switchVelocity.checked = hasVelocity;
      safeSetValue('input-velocity', breaker.token_velocity_threshold);
      safeSetValue('input-velocity-window', breaker.token_velocity_window_sec);

      switchFrequency.checked = hasFrequency;
      safeSetValue('input-frequency', breaker.call_frequency_threshold);
      safeSetValue('input-frequency-window', breaker.call_frequency_window_sec);

      // Status section
      const statusList = document.getElementById('list-status');
      const modeLabel = data.mode || 'observe';
      const estop = data.emergency_stop;
      statusList.innerHTML = '<div class="list-item"><span>Mode</span><span class="status-tag '+(estop?'status-danger':modeLabel==='protect'?'status-warning':'status-ok')+'" style="font-size:10px;padding:1px 6px;border-radius:3px">'+(estop?'STOPPED':modeLabel)+'</span></div>'+
        '<div class="list-item"><span>Emergency Stop</span><span>'+(estop?'Active ⛔':'Inactive')+'</span></div>'+
        '<div class="list-item"><span>Token Limit</span><span>'+(data.daily_token_limit?data.daily_token_limit.toLocaleString():'∞')+'</span></div>'+
        '<div class="list-item"><span>Today</span><span>'+(data.today_tokens??0).toLocaleString()+' tokens | '+(data.today_blocked??0)+' blocked</span></div>';

      const coolingSources = data.cooling_sources ?? [];
      const coolingList = document.getElementById('list-cooling');
      if (coolingSources.length > 0) {
        coolingList.innerHTML = coolingSources.map(s => \`
          <div class="list-item">
            <span class="list-item-label">\${escapeHtml(s.source ?? '')}</span>
            <span class="list-item-detail" style="color:var(--red);font-size:11px">\${escapeHtml(s.reason ?? '')}</span>
            \${s.remainingSec > 0 ? '<span style="font-size:11px;color:var(--dim)">'+s.remainingSec+'s</span>' : ''}
            <button class="btn btn-sm btn-secondary" onclick="resetSource('\${escapeHtml(s.source ?? '')}')">Reset</button>
          </div>
        \`).join('');
      } else {
        coolingList.innerHTML = '<div class="empty-state">No cooling sources</div>';
      }

      const activeRuns = data.active_runs ?? [];
      const runsList = document.getElementById('list-runs');
      if (activeRuns.length > 0) {
        runsList.innerHTML = activeRuns.map(r => \`
          <div class="list-item">
            <span class="list-item-label">\${escapeHtml((r.runId || '').slice(0,8))}</span>
            <span style="font-size:11px;color:var(--dim)">\${escapeHtml(r.source || '')}</span>
            <span style="font-size:11px;color:var(--dim)">\${r.calls || 0} calls</span>
            <span style="font-size:11px;color:var(--dim)">\${(r.tokens || 0).toLocaleString()} t</span>
            <span class="status-tag \${r.status === 'danger' ? 'status-danger' : r.status === 'warning' ? 'status-warning' : 'status-ok'}" style="font-size:10px;padding:1px 6px;border-radius:3px">\${escapeHtml(r.status || 'healthy')}</span>
          </div>
        \`).join('');
      } else {
        runsList.innerHTML = '<div class="empty-state">No active runs</div>';
      }
    }

    async function saveConfig(body) {
      _saving = true;
      try {
        await fetch('/mapick/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } finally {
        _saving = false;
      }
    }

    async function fetchEvents() {
      try {
        const res = await fetch('/mapick/api/events');
        const events = await res.json();
        renderEvents(events);
      } catch (e) {
        console.error('Failed to fetch events:', e);
      }
    }

    function renderEvents(events) {
      const log = document.getElementById('events-log');
      if (!events || events.length === 0) {
        log.innerHTML = '<div class="empty-state">No events</div>';
        return;
      }
      log.innerHTML = events.slice(0, 50).map(e => {
        const ts = e.timestamp ?? e.time;
        const date = ts ? new Date(ts) : null;
        const timeStr = date ? date.toTimeString().slice(0, 8) : '--:--:--';
        const type = e.type ?? 'unknown';
        let cls = '';
        let text = '';
        
        if (type === 'model_call_ended') {
          const provider = e.provider ?? 'unknown';
          const model = e.model ?? 'unknown';
          const outcome = e.outcome ?? 'completed';
          const cost = e.estimatedCost ?? 0;
          const costK = (cost / 1000).toFixed(1);
          if (outcome === 'completed') {
            cls = 'ok';
            text = provider + '/' + model + ' completed — ' + costK + 'K tokens';
          } else {
            cls = 'err';
            text = provider + '/' + model + ' error (' + outcome + ')';
          }
        } else if (type === 'blocked') {
          cls = 'err';
          const source = e.source ?? 'unknown';
          const reason = e.reason ?? 'unknown';
          text = 'BLOCKED ' + source + ' — ' + reason;
        } else if (type === 'run_status_change') {
          cls = 'warn';
          const runId = e.runId ?? 'unknown';
          const status = e.status ?? 'unknown';
          const tokens = e.cumulativeTokens ?? 0;
          const calls = e.runCalls ?? 0;
          text = 'Run ' + runId + ' → ' + status + ' (' + tokens.toLocaleString() + ' tokens, ' + calls + ' calls)';
        } else if (type === 'agent_end') {
          cls = 'dim';
          const runId = e.runId ?? 'unknown';
          text = 'Run ' + runId + ' ended';
        } else if (type === 'config_warning') {
          cls = 'dim';
          text = 'Config warning: ' + (e.message ?? e.msg ?? 'unknown');
        } else if (type === 'zero_output_warning') {
          cls = 'warn';
          const provider = e.provider ?? 'unknown';
          const model = e.model ?? 'unknown';
          text = 'Zero output: ' + provider + '/' + model + ' — 0 bytes';
        } else {
          cls = 'dim';
          text = (e.message ?? e.msg ?? JSON.stringify(e));
        }
        
        return '<div class="event-item">' +
          '<span class="event-time">' + escapeHtml(timeStr) + '</span>' +
          '<span class="event-msg ' + cls + '">' + escapeHtml(text) + '</span>' +
        '</div>';
      }).join('');
    }

    async function setMode(mode) {
      await saveConfig({ mode });
      fetchStats();
    }

    async function emergencyStop() {
      await fetch('/mapick/api/stop');
      fetchStats();
    }

    async function resume() {
      await fetch('/mapick/api/resume');
      fetchStats();
    }

    async function resetSource(source) {
      await fetch('/mapick/api/reset-source?source=' + encodeURIComponent(source));
      fetchStats();
    }

    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    document.getElementById('mode-observe').addEventListener('click', () => setMode('observe'));
    document.getElementById('mode-protect').addEventListener('click', () => setMode('protect'));
    document.getElementById('btn-stop').addEventListener('click', emergencyStop);
    document.getElementById('btn-resume').addEventListener('click', resume);
    document.getElementById('btn-refresh').addEventListener('click', () => { fetchStats(); fetchEvents(); });

    document.getElementById('switch-daily-limit').addEventListener('change', function() {
      const val = this.checked ? parseInt(document.getElementById('input-daily-limit').value) || 50000 : null;
      saveConfig({ dailyTokenLimit: val });
    });

    document.getElementById('switch-failures').addEventListener('change', function() {
      const failures = this.checked ? parseInt(document.getElementById('input-failures').value) || 3 : 0;
      const cooldown = parseInt(document.getElementById('input-cooldown').value) || 30;
      saveConfig({ breaker: { consecutiveFailures: failures, cooldownSec: cooldown } });
    });

    document.getElementById('switch-velocity').addEventListener('change', function() {
      const threshold = this.checked ? parseInt(document.getElementById('input-velocity').value) || 1000 : 0;
      const window = parseInt(document.getElementById('input-velocity-window').value) || 60;
      saveConfig({ breaker: { tokenVelocityThreshold: threshold, tokenVelocityWindowSec: window } });
    });

    document.getElementById('switch-frequency').addEventListener('change', function() {
      const threshold = this.checked ? parseInt(document.getElementById('input-frequency').value) || 100 : 0;
      const window = parseInt(document.getElementById('input-frequency-window').value) || 60;
      saveConfig({ breaker: { callFrequencyThreshold: threshold, callFrequencyWindowSec: window } });
    });

    document.getElementById('btn-save-daily-limit').addEventListener('click', function() {
      const val = parseInt(document.getElementById('input-daily-limit').value) || null;
      saveConfig({ dailyTokenLimit: val });
    });

    document.getElementById('btn-save-failures').addEventListener('click', function() {
      const failures = parseInt(document.getElementById('input-failures').value) || 0;
      const cooldown = parseInt(document.getElementById('input-cooldown').value) || 30;
      saveConfig({ breaker: { consecutiveFailures: failures, cooldownSec: cooldown } });
    });

    document.getElementById('btn-save-velocity').addEventListener('click', function() {
      const threshold = parseInt(document.getElementById('input-velocity').value) || 0;
      const window = parseInt(document.getElementById('input-velocity-window').value) || 60;
      saveConfig({ breaker: { tokenVelocityThreshold: threshold, tokenVelocityWindowSec: window } });
    });

    document.getElementById('btn-save-frequency').addEventListener('click', function() {
      const threshold = parseInt(document.getElementById('input-frequency').value) || 0;
      const window = parseInt(document.getElementById('input-frequency-window').value) || 60;
      saveConfig({ breaker: { callFrequencyThreshold: threshold, callFrequencyWindowSec: window } });
    });

    fetchStats();
    fetchEvents();
    _refreshTimer = setInterval(() => {
      fetchStats();
      fetchEvents();
    }, 3000);
  </script>
</body>
</html>`;
}