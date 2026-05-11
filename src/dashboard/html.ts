export function renderDashboardHtml(_stats: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firewall</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #fafafa;
      --fg: #111;
      --muted: #525252;
      --dim: #a1a1a1;
      --border: #e5e5e7;
      --card: #fff;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --destructive: #dc2626;
      --destructive-hover: #b91c1c;
      --success: #16a34a;
      --warning: #ca8a04;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.5;
      min-height: 100vh;
    }
    
    /* Header */
    .header {
      background: var(--card);
      border-bottom: 1px solid var(--border);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-title {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .header-center {
      display: flex;
      gap: 0;
      background: var(--bg);
      border-radius: 6px;
      padding: 2px;
      border: 1px solid var(--border);
    }
    .mode-toggle {
      display: inline-flex;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 3px;
      gap: 2px;
    }
    .mode-btn {
      padding: 6px 18px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
      position: relative;
    }
    .mode-btn:hover {
      color: #334155;
    }
    .mode-btn.active {
      background: #fff;
      color: #1e293b;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
      font-weight: 600;
    }
    .mode-btn.protect-mode.active {
      background: #fef3c7;
      color: #92400e;
    }
    .mode-label {
      font-size: 11px;
      color: #94a3b8;
      margin-left: 6px;
      font-weight: 400;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      padding: 8px 14px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      background: var(--card);
      color: var(--fg);
    }
    .btn:hover {
      background: var(--bg);
      border-color: var(--dim);
    }
    .btn-destructive {
      background: var(--destructive);
      border-color: var(--destructive);
      color: #fff;
    }
    .btn-destructive:hover {
      background: var(--destructive-hover);
      border-color: var(--destructive-hover);
    }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
    }
    
    /* Main Content */
    .main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    
    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
    }
    .stat-label {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    
    /* Section */
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    /* Rules Grid */
    .rules-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 1024px) {
      .rules-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .rules-grid { grid-template-columns: 1fr; }
    }
    .rule-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      min-height: 140px;
    }
    .rule-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .rule-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--fg);
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: var(--dim);
      transition: 0.15s ease;
      border-radius: 10px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: #fff;
      transition: 0.15s ease;
      border-radius: 50%;
    }
    input:checked + .slider { background-color: var(--accent); }
    input:checked + .slider:before { transform: translateX(16px); }
    .rule-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .field-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .field-input {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      min-width: 0;
    }
    .field-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
    }
    .field-unit {
      font-size: 12px;
      color: var(--muted);
      min-width: 36px;
    }
    .field-hint {
      font-size: 11px;
      color: var(--dim);
      margin-top: 4px;
    }
    .rule-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }
    .btn-save {
      padding: 5px 12px;
      font-size: 12px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: var(--bg);
      color: var(--muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-save:hover {
      background: var(--border);
      color: var(--fg);
    }
    
    /* Monitoring */
    .monitoring-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 768px) {
      .monitoring-grid { grid-template-columns: 1fr; }
    }
    .monitor-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .monitor-header {
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .monitor-body {
      padding: 8px;
      max-height: 240px;
      overflow-y: auto;
    }
    .monitor-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 2px;
    }
    .monitor-item:hover {
      background: var(--bg);
    }
    .monitor-item:last-child { margin-bottom: 0; }
    .item-label {
      font-weight: 500;
      color: var(--fg);
    }
    .item-detail {
      font-size: 12px;
      color: var(--muted);
    }
    .item-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .tag {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .tag-success { background: rgba(22,163,74,0.1); color: var(--success); }
    .tag-warning { background: rgba(202,138,4,0.1); color: var(--warning); }
    .tag-destructive { background: rgba(220,38,38,0.1); color: var(--destructive); }
    .empty {
      padding: 24px;
      text-align: center;
      color: var(--dim);
      font-size: 13px;
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 11px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--card);
      cursor: pointer;
    }
    .btn-sm:hover {
      background: var(--bg);
    }
    
    /* Status Card */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2px;
      background: var(--border);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .status-item {
      background: var(--card);
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-item-label {
      font-size: 13px;
      color: var(--muted);
    }
    .status-item-value {
      font-size: 13px;
      font-weight: 500;
    }
    
    /* Events */
    .events-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .events-body {
      max-height: 400px;
      overflow-y: auto;
    }
    .event-item {
      display: flex;
      gap: 16px;
      padding: 10px 16px;
      font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      border-bottom: 1px solid var(--border);
    }
    .event-item:last-child { border-bottom: none; }
    .event-time {
      color: var(--dim);
      min-width: 72px;
      flex-shrink: 0;
    }
    .event-msg {
      color: var(--fg);
      flex: 1;
      word-break: break-word;
    }
    .event-msg.ok { color: var(--success); }
    .event-msg.err { color: var(--destructive); }
    .event-msg.warn { color: var(--warning); }
    .event-msg.dim { color: var(--dim); }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-title">Firewall</div>
    <div class="header-center">
      <div class="mode-toggle">
        <button class="mode-btn active" id="mode-observe">Observe</button>
        <button class="mode-btn" id="mode-protect">Protect</button>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn btn-destructive" id="btn-stop">Stop</button>
      <button class="btn btn-primary" id="btn-resume" style="display:none">Resume</button>
    </div>
  </header>
  
  <main class="main">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Today Tokens</div>
        <div class="stat-value" id="stat-tokens">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Blocked</div>
        <div class="stat-value" id="stat-blocked">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Limit</div>
        <div class="stat-value" id="stat-limit">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Calls</div>
        <div class="stat-value" id="stat-calls">-</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Rules</div>
      <div class="rules-grid">
        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">Daily Token Limit</span>
            <label class="switch">
              <input type="checkbox" id="switch-daily-limit">
              <span class="slider"></span>
            </label>
          </div>
          <div class="rule-content">
            <div class="field-row">
              <input type="number" class="field-input" id="input-daily-limit" placeholder="50000">
              <span class="field-unit">tokens</span>
            </div>
            <div class="field-hint">Maximum tokens per day</div>
          </div>
          <div class="rule-footer">
            <button class="btn-save" id="btn-save-daily-limit">Save</button>
          </div>
        </div>
        
        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">Consecutive Failures</span>
            <label class="switch">
              <input type="checkbox" id="switch-failures">
              <span class="slider"></span>
            </label>
          </div>
          <div class="rule-content">
            <div class="field-row">
              <input type="number" class="field-input" id="input-failures" placeholder="3">
              <span class="field-unit">failures</span>
            </div>
            <div class="field-row">
              <input type="number" class="field-input" id="input-cooldown" placeholder="30">
              <span class="field-unit">sec</span>
            </div>
            <div class="field-hint">Cooldown after consecutive failures</div>
          </div>
          <div class="rule-footer">
            <button class="btn-save" id="btn-save-failures">Save</button>
          </div>
        </div>
        
        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">Token Velocity</span>
            <label class="switch">
              <input type="checkbox" id="switch-velocity">
              <span class="slider"></span>
            </label>
          </div>
          <div class="rule-content">
            <div class="field-row">
              <input type="number" class="field-input" id="input-velocity" placeholder="1000">
              <span class="field-unit">tokens</span>
            </div>
            <div class="field-row">
              <input type="number" class="field-input" id="input-velocity-window" placeholder="60">
              <span class="field-unit">sec</span>
            </div>
            <div class="field-hint">Max tokens within time window</div>
          </div>
          <div class="rule-footer">
            <button class="btn-save" id="btn-save-velocity">Save</button>
          </div>
        </div>
        
        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">Call Frequency</span>
            <label class="switch">
              <input type="checkbox" id="switch-frequency">
              <span class="slider"></span>
            </label>
          </div>
          <div class="rule-content">
            <div class="field-row">
              <input type="number" class="field-input" id="input-frequency" placeholder="100">
              <span class="field-unit">calls</span>
            </div>
            <div class="field-row">
              <input type="number" class="field-input" id="input-frequency-window" placeholder="60">
              <span class="field-unit">sec</span>
            </div>
            <div class="field-hint">Max calls within time window</div>
          </div>
          <div class="rule-footer">
            <button class="btn-save" id="btn-save-frequency">Save</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Monitoring</div>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-item-label">Mode</span>
          <span class="status-item-value" id="status-mode">-</span>
        </div>
        <div class="status-item">
          <span class="status-item-label">Status</span>
          <span class="status-item-value" id="status-state">-</span>
        </div>
        <div class="status-item">
          <span class="status-item-label">Token Limit</span>
          <span class="status-item-value" id="status-limit">-</span>
        </div>
        <div class="status-item">
          <span class="status-item-label">Today</span>
          <span class="status-item-value" id="status-today">-</span>
        </div>
      </div>
      <div class="monitoring-grid">
        <div class="monitor-card">
          <div class="monitor-header">Cooling Sources</div>
          <div class="monitor-body" id="list-cooling">
            <div class="empty">No cooling sources</div>
          </div>
        </div>
        <div class="monitor-card">
          <div class="monitor-header">Active Runs</div>
          <div class="monitor-body" id="list-runs">
            <div class="empty">No active runs</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Events</div>
      <div class="events-card">
        <div class="events-body" id="events-log">
          <div class="empty">No events</div>
        </div>
      </div>
    </div>
  </main>

  <script>
    let _saving = false;
    let _refreshTimer = null;

    function isFocused(id) {
      var el = document.getElementById(id);
      return el && document.activeElement === el;
    }

    function safeSetValue(id, value) {
      if (isFocused(id)) return;
      var el = document.getElementById(id);
      if (el) el.value = value ?? '';
    }

    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\'/g, '&#039;');
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

    async function setMode(m) {
      await saveConfig({ mode: m });
      fetchStats();
      // Update button styles
      document.getElementById('mode-observe').className = 'mode-btn' + (m === 'observe' ? ' active' : '');
      document.getElementById('mode-protect').className = 'mode-btn protect-mode' + (m === 'protect' ? ' active' : '');
    }

    async function emergencyStop() {
      await fetch('/mapick/api/stop');
      fetchStats();
    }

    async function resume() {
      await fetch('/mapick/api/resume');
      fetchStats();
    }

    async function resetSource(src) {
      await fetch('/mapick/api/reset-source?source=' + encodeURIComponent(src));
      fetchStats();
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

    function updateUI(data) {
      document.getElementById('stat-tokens').textContent = (data.today_tokens ?? 0).toLocaleString();
      document.getElementById('stat-blocked').textContent = data.today_blocked ?? 0;
      document.getElementById('stat-limit').textContent = data.daily_token_limit ? data.daily_token_limit.toLocaleString() : '∞';
      document.getElementById('stat-calls').textContent = (data.active_runs ?? []).length;

      const modeObserve = document.getElementById('mode-observe');
      const modeProtect = document.getElementById('mode-protect');
      modeObserve.className = 'mode-btn' + (data.mode === 'observe' ? ' active' : '');
      modeProtect.className = 'mode-btn protect-mode' + (data.mode === 'protect' ? ' active' : '');

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
      const hasDailyLimit = data.daily_token_limit != null && data.daily_token_limit > 0;
      switchDailyLimit.checked = hasDailyLimit;
      safeSetValue('input-daily-limit', data.daily_token_limit);

      const switchFailures = document.getElementById('switch-failures');
      const hasFailures = breaker.consecutive_failures > 0;
      switchFailures.checked = hasFailures;
      safeSetValue('input-failures', breaker.consecutive_failures);
      safeSetValue('input-cooldown', breaker.cooldown_sec);

      const switchVelocity = document.getElementById('switch-velocity');
      const hasVelocity = breaker.token_velocity_threshold > 0;
      switchVelocity.checked = hasVelocity;
      safeSetValue('input-velocity', breaker.token_velocity_threshold);
      safeSetValue('input-velocity-window', breaker.token_velocity_window_sec);

      const switchFrequency = document.getElementById('switch-frequency');
      const hasFrequency = breaker.call_frequency_threshold > 0;
      switchFrequency.checked = hasFrequency;
      safeSetValue('input-frequency', breaker.call_frequency_threshold);
      safeSetValue('input-frequency-window', breaker.call_frequency_window_sec);

      const modeLabel = data.mode ?? 'observe';
      const estop = data.emergency_stop;
      document.getElementById('status-mode').innerHTML = estop
        ? '<span class="tag tag-destructive">STOPPED</span>'
        : modeLabel === 'protect'
          ? '<span class="tag tag-warning">Protect</span>'
          : '<span class="tag tag-success">Observe</span>';
      document.getElementById('status-state').textContent = estop ? 'Emergency Stop' : 'Normal';
      document.getElementById('status-limit').textContent = data.daily_token_limit ? data.daily_token_limit.toLocaleString() : '∞';
      document.getElementById('status-today').textContent = (data.today_tokens ?? 0).toLocaleString() + ' tokens | ' + (data.today_blocked ?? 0) + ' blocked';

      const coolingSources = data.cooling_sources ?? [];
      const coolingList = document.getElementById('list-cooling');
      if (coolingSources.length > 0) {
        coolingList.innerHTML = coolingSources.map(s => \`
          <div class="monitor-item">
            <div>
              <div class="item-label">\${escapeHtml(s.source ?? '')}</div>
              <div class="item-detail">\${escapeHtml(s.reason ?? '')}</div>
            </div>
            <div class="item-meta">
              \${s.remainingSec > 0 ? '<span style="font-size:12px;color:var(--muted)">\${s.remainingSec}s</span>' : ''}
              <button class="btn-sm" onclick="resetSource('\${escapeHtml(s.source ?? '')}')">Reset</button>
            </div>
          </div>
        \`).join('');
      } else {
        coolingList.innerHTML = '<div class="empty">No cooling sources</div>';
      }

      const activeRuns = data.active_runs ?? [];
      const runsList = document.getElementById('list-runs');
      if (activeRuns.length > 0) {
        runsList.innerHTML = activeRuns.map(r => \`
          <div class="monitor-item">
            <div>
              <div class="item-label">\${escapeHtml((r.runId ?? '').slice(0, 8))}</div>
              <div class="item-detail">\${escapeHtml(r.source ?? '')} · \${r.calls ?? 0} calls · \${(r.tokens ?? 0).toLocaleString()} tokens</div>
            </div>
            <span class="tag \${r.status === 'danger' ? 'tag-destructive' : r.status === 'warning' ? 'tag-warning' : 'tag-success'}">\${escapeHtml(r.status ?? 'healthy')}</span>
          </div>
        \`).join('');
      } else {
        runsList.innerHTML = '<div class="empty">No active runs</div>';
      }
    }

    function renderEvents(events) {
      const log = document.getElementById('events-log');
      if (!events ?? events.length === 0) {
        log.innerHTML = '<div class="empty">No events</div>';
        return;
      }
      log.innerHTML = events.slice(0, 100).reverse().map(e => {
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
          text = e.message ?? e.msg ?? JSON.stringify(e);
        }
        
        return '<div class="event-item">' +
          '<span class="event-time">' + escapeHtml(timeStr) + '</span>' +
          '<span class="event-msg ' + cls + '">' + escapeHtml(text) + '</span>' +
        '</div>';
      }).join('');
    }

    document.getElementById('mode-observe').addEventListener('click', () => setMode('observe'));
    document.getElementById('mode-protect').addEventListener('click', () => setMode('protect'));
    document.getElementById('btn-stop').addEventListener('click', emergencyStop);
    document.getElementById('btn-resume').addEventListener('click', resume);

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