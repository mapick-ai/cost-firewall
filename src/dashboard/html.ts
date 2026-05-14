export function renderDashboardHtml(_stats: any): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mapick 防火墙</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #f8f9fa;
      --fg: #1a1a2e;
      --muted: #6b7280;
      --dim: #9ca3af;
      --border: #e5e7eb;
      --card: #ffffff;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --destructive: #dc2626;
      --destructive-hover: #b91c1c;
      --destructive-glow: rgba(220,38,38,0.3);
      --success: #16a34a;
      --warning: #ca8a04;
      --mono: 'JetBrains Mono', monospace;
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
    }
    .mode-btn:hover { color: #334155; }
    .mode-btn.active {
      background: #fff;
      color: #1e293b;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
    .btn-emergency {
      width: 64px;
      height: 64px;
      border: none;
      border-radius: 50%;
      font-size: 28px;
      font-weight: 700;
      cursor: pointer;
      background: var(--destructive);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      animation: pulse-stop 2s infinite;
      box-shadow: 0 4px 24px var(--destructive-glow);
    }
    .btn-emergency:hover {
      background: var(--destructive-hover);
      transform: scale(1.08);
      box-shadow: 0 0 48px rgba(220,38,38,0.5), 0 4px 20px rgba(220,38,38,0.4);
    }
    .btn-emergency.stopped {
      background: #52525b;
      animation: none;
      color: #a1a1aa;
      box-shadow: none;
    }
    @keyframes pulse-stop {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.35), 0 0 32px rgba(220,38,38,0.25); }
      50% { box-shadow: 0 0 0 18px rgba(220,38,38,0), 0 0 48px rgba(220,38,38,0.4); }
    }
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 16px 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .hero-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100px;
    }
    .hero-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      text-align: center;
    }
    .hero-value {
      font-size: 38px;
      font-weight: 600;
      letter-spacing: -0.03em;
      line-height: 1.1;
      font-family: var(--mono);
    }
    .hero-label {
      font-size: 13px;
      color: var(--muted);
      margin-top: 6px;
      letter-spacing: 0.02em;
    }
    @media (max-width: 600px) {
      .hero-stats { grid-template-columns: 1fr; padding: 16px; }
      .hero-value { font-size: 32px; }
    }

    /* Main Content */
    .main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px 24px;
    }

    /* Section */
    .section {
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }
    
    /* Section */
    .section {
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 12px;
      text-transform: none;
      letter-spacing: 0.01em;
    }
    
    /* 规则 Grid */
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
      padding: 10px;
      display: flex;
      flex-direction: column;
      min-height: 100px;
    }
    .rule-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
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
      margin-top: 8px;
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
    
    /* 监控 */
    .monitoring-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 1024px) {
      .monitoring-grid { grid-template-columns: repeat(2, 1fr); }
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
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
      letter-spacing: 0.02em;
    }
    .monitor-body {
      padding: 4px;
      max-height: 180px;
      overflow-y: auto;
    }
    .monitor-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 2px;
    }
    .monitor-body {
      padding: 6px;
      max-height: 200px;
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
      letter-spacing: 0.02em;
    }
    .tag-success { background: rgba(22,163,74,0.1); color: var(--success); }
    .tag-warning { background: rgba(202,138,4,0.1); color: var(--warning); }
    .tag-destructive { background: rgba(220,38,38,0.1); color: var(--destructive); }
    .empty {
      padding: 18px;
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
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    @media (max-width: 900px) {
      .status-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 500px) {
      .status-grid { grid-template-columns: 1fr; }
    }
    .status-item {
      background: var(--card);
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .status-item:nth-child(4n) { border-right: none; }
    .status-item:nth-last-child(-n+4):nth-child(n+1) { border-bottom: none; }
    @media (max-width: 900px) {
      .status-item:nth-child(4n) { border-right: 1px solid var(--border); }
      .status-item:nth-child(2n) { border-right: none; }
    }
    @media (max-width: 500px) {
      .status-item { border-right: none; }
    }
    .status-item-label {
      font-size: 13px;
      color: var(--muted);
    }
    .status-item-value {
      font-size: 13px;
      font-weight: 500;
    }
    
    /* 事件 */
    .events-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .events-body {
      max-height: 280px;
      overflow-y: auto;
    }
    .event-item {
      display: flex;
      gap: 10px;
      padding: 6px 10px;
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
    .event-icon { font-size: 16px; width: 28px; flex-shrink: 0; text-align: center; }
    .event-body { flex: 1; min-width: 0; }
    .event-main { font-size: 13px; font-weight: 500; }
    .event-main.ok { color: var(--success); }
    .event-main.err { color: var(--destructive); }
    .event-main.warn { color: var(--warning); }
    .event-main.dim { color: var(--dim); }
    .event-sub { font-size: 11px; color: var(--dim); margin-top: 2px; word-break: break-all; }
    .btn-kill { padding: 2px 8px; font-size: 10px; border: 1px solid var(--destructive); border-radius: 3px; color: var(--destructive); background: transparent; cursor: pointer; flex-shrink: 0; margin-left: 8px; }
    .btn-kill:hover { background: var(--destructive); color: #fff; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
  <header class="header">
    <div class="header-title" style="display:flex;align-items:center;gap:6px">
      <span style="background:#eff6ff;color:#2563eb;font-weight:600;font-size:11px;padding:3px 10px;border-radius:10px;letter-spacing:0.3px">Mapick</span>
      <span>防火墙</span>
      <span id="firewall-ver" style="font-size:11px;color:var(--muted);margin-left:4px"></span>
    </div>
    <div class="header-right" style="display:flex;align-items:center;gap:12px">
      <div class="mode-toggle">
        <button class="mode-btn active" id="mode-observe">观察</button>
        <button class="mode-btn" id="mode-protect">保护</button>
      </div>
    </div>
  </header>
  
  <div id="alert-unbind" style="display:none;background:#fef2f2;border:1px solid var(--destructive);border-radius:8px;padding:12px 18px;margin:12px auto;max-width:1200px">
    <strong>⚠️ 未绑定警告</strong>：紧急停止已激活，但仍检测到新的 API 请求。请运行 <code>openclaw gateway restart</code>。
    <span id="alert-unbind-detail" style="display:block;margin-top:4px;font-size:12px;color:var(--muted)"></span>
  </div>

  <div class="hero-stats">
    <div class="hero-card">
      <div class="hero-value" id="hero-spent">$0</div>
      <div class="hero-label">今日花费</div>
    </div>
    <div class="hero-card">
      <div class="hero-value" id="hero-blocked">0</div>
      <div class="hero-label">已拦截</div>
    </div>
    <div class="hero-card">
      <div class="hero-value" id="hero-saved">$0</div>
      <div class="hero-label">已省费用</div>
    </div>
    <div class="hero-card" style="border-color:var(--destructive);background:rgba(239,68,68,0.03)">
      <button class="btn-emergency" id="btn-stop" title="紧急停止">⏹</button>
      <button class="btn btn-primary" id="btn-resume" style="display:none;margin-top:8px;font-size:12px;padding:4px 12px">▶ 恢复</button>
      <div class="hero-label" style="color:var(--destructive);margin-top:6px">阻断</div>
    </div>
  </div>

  <main class="main">
    
    <div class="section">
      <div class="section-title">规则</div>
      <div class="rules-grid">
        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">每日 Token 限额</span>
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
            <div class="field-hint">每日最大 Token 数</div>
          </div>
          <div class="rule-footer">
            <button class="btn-save" id="btn-save-daily-limit">保存</button>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">连续失败</span>
            <label class="switch">
              <input type="checkbox" id="switch-failures">
              <span class="slider"></span>
            </label>
          </div>
          <div class="rule-content">
            <div class="field-row">
              <input type="number" class="field-input" id="input-failures" placeholder="3">
              <span class="field-unit">次</span>
            </div>
            <div class="field-row">
              <input type="number" class="field-input" id="input-cooldown" placeholder="30">
              <span class="field-unit">秒</span>
            </div>
            <div class="field-hint">连续失败后冷却时长</div>
          </div>
          <div class="rule-footer">
            <button class="btn-save" id="btn-save-failures">保存</button>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">Token 速率</span>
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
              <span class="field-unit">秒</span>
            </div>
            <div class="field-hint">时间窗口内最大 Token 数</div>
          </div>
          <div class="rule-footer">
            <button class="btn-save" id="btn-save-velocity">保存</button>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <span class="rule-title">调用频率</span>
            <label class="switch">
              <input type="checkbox" id="switch-frequency">
              <span class="slider"></span>
            </label>
          </div>
          <div class="rule-content">
            <div class="field-row">
              <input type="number" class="field-input" id="input-frequency" placeholder="100">
              <span class="field-unit">次</span>
            </div>
            <div class="field-row">
              <input type="number" class="field-input" id="input-frequency-window" placeholder="60">
              <span class="field-unit">秒</span>
            </div>
            <div class="field-hint">时间窗口内最大调用次数</div>
          </div>
          <div class="rule-footer">
            <button class="btn-save" id="btn-save-frequency">保存</button>
          </div>
        </div>
        </div>
      </div>
    
    <div class="section">
      <div class="section-title">费用趋势</div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px">
        <canvas id="cost-chart" width="800" height="250" style="width:100%;max-height:250px"></canvas>
      </div>
    </div>

    <div class="section">
      <div class="section-title">监控</div>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-item-label">紧急停止</span>
          <span class="status-item-value" id="status-estop">未激活</span>
        </div>
        <div class="status-item">
          <span class="status-item-label">连续失败</span>
          <span class="status-item-value" id="status-fail">3</span>
        </div>
        <div class="status-item">
          <span class="status-item-label">Token 速率</span>
          <span class="status-item-value" id="status-velocity">100K / 60s</span>
        </div>
        <div class="status-item">
          <span class="status-item-label">调用频率</span>
          <span class="status-item-value" id="status-frequency">30 / 60s</span>
        </div>
      </div>
      <div class="monitoring-grid">
        <div class="monitor-card">
          <div class="monitor-header">冷却来源</div>
          <div class="monitor-body" id="list-cooling">
            <div class="empty">无冷却来源</div>
          </div>
        </div>
        <div class="monitor-card">
          <div class="monitor-header">活跃会话</div>
          <div class="monitor-body" id="list-runs">
            <div class="empty">无活跃会话</div>
          </div>
        </div>
        <div class="monitor-card">
          <div class="monitor-header">永久封禁</div>
          <div class="monitor-body" id="list-blocked">
            <div class="empty">无封禁来源</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">事件</div>
      <div class="events-card">
        <div class="events-body" id="events-log">
          <div class="empty">无事件</div>
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

    var _useMock = location.search.includes('mock');

    async function fetchStats() {
      if (_saving) return;
      try {
        if (_useMock) throw new Error('mock');
        const res = await fetch('/mapick/api/stats');
        const data = await res.json();
        updateUI(data);
      } catch (e) {
        updateUI({
          mode: 'protect',
          emergency_stop: false,
          today_tokens: 385000,
          today_blocked: 12,
          today_spent_usd: 15.4,
          today_saved_estimate: 4.85,
          daily_token_limit: 500000,
          breaker: { consecutive_failures: 3, cooldown_sec: 30, token_velocity_threshold: 100000, token_velocity_window_sec: 60, call_frequency_threshold: 30, call_frequency_window_sec: 60 },
          cooling_sources: [{ source: 'session:abc12345', reason: 'consecutive_failures', remainingSec: 22 }],
          active_runs: [{ runId: '8293f7a8-c8a2-42d5-9095-cd5af1055bc5', source: 'session:927dd50b', calls: 8, tokens: 272000, status: 'danger' }],
          blocklist: ['session:927dd50b-33a1-48c2-a303-5fa72ec946b5'],
          version: '0.2.25'
        });
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

    var _demoState = 0;

    async function emergencyStop() {
      if (_useMock) {
        _demoState = 1;
        updateUI({
          mode: 'protect', emergency_stop: true,
          today_tokens: 385000, today_blocked: 12, today_spent_usd: 15.4, today_saved_estimate: 4.85,
          daily_token_limit: 500000,
          breaker: { consecutive_failures: 3, cooldown_sec: 30, token_velocity_threshold: 100000, token_velocity_window_sec: 60, call_frequency_threshold: 30, call_frequency_window_sec: 60 },
          cooling_sources: [{ source: 'session:abc12345', reason: 'consecutive_failures', remainingSec: 22 }],
          active_runs: [{ runId: '8293f7a8-c8a2-42d5-9095-cd5af1055bc5', source: 'session:927dd50b', calls: 8, tokens: 272000, status: 'danger' }],
          blocklist: ['session:927dd50b-33a1-48c2-a303-5fa72ec946b5'],
          version: '0.2.25'
        });
        return;
      }
      await fetch('/mapick/api/stop');
      fetchStats();
    }

    async function resume() {
      if (_useMock) {
        _demoState = 0;
        updateUI({
          mode: 'protect', emergency_stop: false,
          today_tokens: 385000, today_blocked: 12, today_spent_usd: 15.4, today_saved_estimate: 4.85,
          daily_token_limit: 500000,
          breaker: { consecutive_failures: 3, cooldown_sec: 30, token_velocity_threshold: 100000, token_velocity_window_sec: 60, call_frequency_threshold: 30, call_frequency_window_sec: 60 },
          cooling_sources: [{ source: 'session:abc12345', reason: 'consecutive_failures', remainingSec: 22 }],
          active_runs: [{ runId: '8293f7a8-c8a2-42d5-9095-cd5af1055bc5', source: 'session:927dd50b', calls: 8, tokens: 272000, status: 'danger' }],
          blocklist: ['session:927dd50b-33a1-48c2-a303-5fa72ec946b5'],
          version: '0.2.25'
        });
        return;
      }
      await fetch('/mapick/api/resume');
      fetchStats();
    }

    async function resetSource(src) {
      await fetch('/mapick/api/reset-source?source=' + encodeURIComponent(src));
      fetchStats();
    }

    async function fetchEvents() {
      try {
        if (_useMock) throw new Error('mock');
        const res = await fetch('/mapick/api/events');
        const events = await res.json();
        renderEvents(events);
        renderCostChart(events);
      } catch(e) {
        const mockEvents = [
          { type: 'emergency_stop', timestamp: Date.now() - 60000 },
          { type: 'run_status_change', runId: '8293f7a8', source: 'session:927dd50b', cumulativeTokens: 317253, status: 'danger', timestamp: Date.now() - 120000, model: 'gpt-5.5' },
          { type: 'blocked', source: 'session:abc12345', reason: 'consecutive_failures', timestamp: Date.now() - 180000 },
          { type: 'model_call_ended', provider: 'openai', model: 'gpt-5.5', outcome: 'completed', estimatedCost: 63500, source: 'session:927dd50b', timestamp: Date.now() - 240000 },
          { type: 'model_call_ended', provider: 'deepseek', model: 'deepseek-chat', outcome: 'completed', estimatedCost: 2100, source: 'session:xyz', timestamp: Date.now() - 300000 },
          { type: 'model_call_ended', provider: 'openai', model: 'gpt-4o', outcome: 'error', failureKind: 'timeout', estimatedCost: 0, source: 'session:abc12345', timestamp: Date.now() - 360000 },
          { type: 'agent_end', runId: '1234abcd', timestamp: Date.now() - 420000 },
          { type: 'model_call_ended', provider: 'anthropic', model: 'claude-sonnet-4-5', outcome: 'completed', estimatedCost: 42000, source: 'session:def45678', timestamp: Date.now() - 480000 },
          { type: 'blocked', source: 'session:927dd50b', reason: 'manual_kill', timestamp: Date.now() - 540000 }
        ];
        renderEvents(mockEvents);
        renderCostChart(mockEvents);
      }
    }

    function updateUI(data) {
      const spentUsd = data.today_spent_usd ?? ((data.today_tokens ?? 0) / 1000 * 0.004);
      document.getElementById('hero-spent').textContent = '$' + spentUsd.toFixed(2);
      document.getElementById('hero-blocked').textContent = data.today_blocked ?? 0;
      document.getElementById('hero-saved').textContent = '$' + (data.today_saved_estimate ?? 0).toFixed(2);
      checkUnbindAlert(data);
      const verEl = document.getElementById('firewall-ver');
      if (verEl && data.version) verEl.textContent = 'v' + data.version;

      const modeObserve = document.getElementById('mode-observe');
      const modeProtect = document.getElementById('mode-protect');
      modeObserve.className = 'mode-btn' + (data.mode === 'observe' ? ' active' : '');
      modeProtect.className = 'mode-btn protect-mode' + (data.mode === 'protect' ? ' active' : '');

      const btnStop = document.getElementById('btn-stop');
      const btnResume = document.getElementById('btn-resume');
      if (data.emergency_stop) {
        btnStop.style.display = 'none';
        btnStop.classList.add('stopped');
        btnResume.style.display = 'block';
      } else {
        btnStop.style.display = 'block';
        btnStop.classList.remove('stopped');
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
      document.getElementById('status-estop').textContent = estop ? '⛔ 已激活' : '未激活';
      document.getElementById('status-estop').style.color = estop ? 'var(--destructive)' : '';
      document.getElementById('status-fail').textContent = (breaker.consecutive_failures ?? 3) + ' 次失败 → ' + (breaker.cooldown_sec ?? 30) + ' 秒';
      document.getElementById('status-velocity').textContent = (breaker.token_velocity_threshold ?? 0) > 0
        ? (breaker.token_velocity_threshold ?? 0).toLocaleString() + ' / ' + (breaker.token_velocity_window_sec ?? 60) + ' 秒'
        : '关闭';
      document.getElementById('status-frequency').textContent = (breaker.call_frequency_threshold ?? 0) > 0
        ? (breaker.call_frequency_threshold ?? 0) + ' / ' + (breaker.call_frequency_window_sec ?? 60) + ' 秒'
        : '关闭';

      const coolingSources = data.cooling_sources ?? [];
      const coolingList = document.getElementById('list-cooling');
      if (coolingSources.length > 0) {
        coolingList.innerHTML = coolingSources.map(function(s) {
          var resetBtn = '<button class="btn-sm" onclick="resetSource(' + String.fromCharCode(39) + escapeHtml(s.source ?? '') + String.fromCharCode(39) + ')">重置</button>';
          var remaining = (s.remainingSec > 0) ? '<span style="font-size:12px;color:var(--muted)">' + s.remainingSec + 's</span>' : '';
          return '<div class="monitor-item"><div><div class="item-label">' + escapeHtml(s.source ?? '') + '</div><div class="item-detail">' + escapeHtml(s.reason ?? '') + '</div></div><div class="item-meta">' + remaining + resetBtn + '</div></div>';
        }).join('');
      } else {
        coolingList.innerHTML = '<div class="empty">无冷却来源</div>';
      }

      const activeRuns = data.active_runs ?? [];
      const runsList = document.getElementById('list-runs');
      if (activeRuns.length > 0) {
        runsList.innerHTML = activeRuns.map(r => \`
          <div class="monitor-item">
            <div>
              <div class="item-label">\${escapeHtml((r.runId ?? '').slice(0, 8))}</div>
              <div class="item-detail">\${escapeHtml(r.source ?? '')} · \${r.calls ?? 0} 次调用 · \${(r.tokens ?? 0).toLocaleString()} tokens</div>
            </div>
            <span class="tag \${r.status === '高风险' ? 'tag-destructive' : r.status === 'warning' ? 'tag-warning' : 'tag-success'}">\${escapeHtml(r.status ?? 'healthy')}</span>
          </div>
        \`).join('');
      } else {
        runsList.innerHTML = '<div class="empty">无活跃会话</div>';
      }

      const blocklist = data.blocklist ?? [];
      const blockedEl = document.getElementById('list-blocked');
      if (blocklist.length > 0) {
        blockedEl.innerHTML = blocklist.map(s => '<div class="monitor-item"><div><div class="item-label">' + escapeHtml(s) + '</div><div class="item-detail" style="color:var(--destructive)">已永久封禁</div></div><div class="item-meta"><button class="btn-sm" style="border-color:var(--destructive);color:var(--destructive)" onclick="unblockSource(' + String.fromCharCode(39) + escapeHtml(s) + String.fromCharCode(39) + ')">解封</button></div></div>').join('');
      } else {
        blockedEl.innerHTML = '<div class="empty">无封禁来源</div>';
      }
    }

    function renderEvents(events) {
      const log = document.getElementById('events-log');
      if (!events || events.length === 0) {
        log.innerHTML = '<div class="empty">暂无事件记录</div>';
        return;
      }
      log.innerHTML = events.slice(0, 50).reverse().map(e => {
        const ts = e.timestamp ?? e.time;
        const date = ts ? new Date(ts) : null;
        const timeStr = date ? date.toTimeString().slice(0, 8) : '--:--:--';
        const type = e.type ?? 'unknown';
        const source = e.source ?? '';
        const shortSource = source.length > 30 ? source.slice(0, 27) + '...' : source;
        const model = e.model ?? '';
        const provider = e.provider ?? '';
        const cost = e.estimatedCost ?? 0;
        const costK = Math.round(cost / 100) / 10;
        const costUsd = (cost / 1000 * 0.004).toFixed(2);
        let icon = '', text = '', sub = '', cls = '';

        if (type === 'model_call_ended') {
          const outcome = e.outcome ?? 'completed';
          if (outcome === 'completed') {
            icon = '✅'; cls = 'ok';
            text = provider + '/' + model + ' — ' + costK + 'K tokens ($' + costUsd + ')';
            sub = source ? '来源 ' + shortSource : '';
          } else {
            icon = '❌'; cls = 'err';
            text = provider + '/' + model + ' — ' + outcome + ' (' + (e.failureKind ?? 'error') + ')';
            sub = source ? '来源 ' + shortSource : '';
          }
        } else if (type === 'blocked') {
          icon = '🚫'; cls = 'err';
          text = '拦截 — ' + (e.reason ?? 'unknown');
          if (source) sub = '来源 ' + shortSource;
        } else if (type === 'run_status_change') {
          icon = '⚠️'; cls = 'warn';
          const tokens = e.cumulativeTokens ?? 0;
          text = 'Token 警告 — ' + (tokens/1000).toFixed(0) + 'K tokens ($' + (tokens/1000*0.004).toFixed(2) + ')';
          if (source) sub = '来源 ' + shortSource + (model ? ' | ' + model : '');
        } else if (type === 'agent_end') {
          icon = '🏁'; cls = 'dim';
          text = '会话结束 — ' + (e.runId ?? '').slice(0, 8);
        } else if (type === 'config_warning') {
          icon = '⚙️'; cls = 'dim';
          text = '配置 — ' + (e.reason ?? e.message ?? '');
        } else if (type === 'emergency_stop') {
          icon = '🛑'; cls = 'err';
          text = '紧急停止已激活';
        } else if (type === 'zero_output_warning') {
          icon = '⚠️'; cls = 'warn';
          text = 'Zero output: ' + provider + '/' + model;
        } else {
          icon = '📋'; cls = 'dim';
          text = type + (e.reason ? ' — ' + e.reason : '');
        }

        var killBtn = (source && (type === 'model_call_ended' || type === 'blocked'))
          ? '<button class="btn-kill" onclick="blockSource(' + String.fromCharCode(39) + escapeHtml(source) + String.fromCharCode(39) + ')">终止</button>'
          : '';

        return '<div class="event-item">' +
          '<span class="event-icon">' + icon + '</span>' +
          '<div class="event-body">' +
            '<div class="event-main ' + cls + '">' + escapeHtml(text) + '</div>' +
            (sub ? '<div class="event-sub">' + escapeHtml(sub) + '</div>' : '') +
          '</div>' +
          '<span class="event-time">' + escapeHtml(timeStr) + '</span>' +
          killBtn +
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

    async function blockSource(src) {
      await fetch('/mapick/api/block-source', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({source:src}) });
      fetchStats(); fetchEvents();
    }
    async function unblockSource(src) {
      await fetch('/mapick/api/unblock-source', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({source:src}) });
      fetchStats(); fetchEvents();
    }

    var costChart = null;
    var unbindAlertShown = false;

    function renderCostChart(events) {
      var canvas = document.getElementById('cost-chart');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var calls = events.filter(function(e) { return e.type === 'model_call_ended' && e.estimatedCost > 0; });
      if (calls.length < 2) { if (costChart) { try { costChart.destroy(); } catch(e) {} costChart = null; } return; }
      var labels = [], values = [], cum = 0;
      calls.sort(function(a,b) { return a.timestamp - b.timestamp; });
      for (var i = 0; i < calls.length; i++) {
        cum += calls[i].estimatedCost;
        labels.push(new Date(calls[i].timestamp).toTimeString().slice(0,5));
        values.push(Math.round(cum / 100) / 10);
      }
      if (costChart) { try { costChart.destroy(); } catch(e) {} costChart = null; }
      costChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'K tokens', data: values, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', fill: true, tension: 0.3, pointRadius: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#e5e7eb' }, beginAtZero: true } } }
      });
    }

    function checkUnbindAlert(data) {
      if (data.emergency_stop && data.today_tokens > 0) {
        if (!unbindAlertShown) {
          document.getElementById('alert-unbind').style.display = 'block';
          document.getElementById('alert-unbind-detail').textContent = '已停止但今日仍有 ' + (data.today_tokens ?? 0).toLocaleString() + ' tokens 消耗';
          unbindAlertShown = true;
        }
      } else if (!data.emergency_stop) {
        document.getElementById('alert-unbind').style.display = 'none';
        unbindAlertShown = false;
      }
    }

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
