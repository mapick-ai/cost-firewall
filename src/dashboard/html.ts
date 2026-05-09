/**
 * Dashboard HTML 模板
 */

export function renderDashboardHtml(stats: object): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Mapick Cost Firewall</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; }
    .stat { display: inline-block; margin: 10px 20px; }
    .stat-value { font-size: 2em; font-weight: bold; }
    .stat-label { color: #666; }
    .stopped { color: red; }
    .observe { color: green; }
    .protect { color: orange; }
  </style>
</head>
<body>
  <h1>Mapick Cost Firewall</h1>
  <div id="stats"></div>
  <script>
    const stats = ${JSON.stringify(stats)};
    const el = document.getElementById('stats');
    el.innerHTML = \`
      <div class="stat">
        <div class="stat-value \${stats.mode}">\${stats.mode}</div>
        <div class="stat-label">Mode</div>
      </div>
      <div class="stat">
        <div class="stat-value">$\${stats.today_spent.toFixed(4)}</div>
        <div class="stat-label">Today Spent</div>
      </div>
      <div class="stat">
        <div class="stat-value">\${stats.today_blocked}</div>
        <div class="stat-label">Blocked</div>
      </div>
    \`;

    const es = new EventSource('/mapick/api/live');
    es.onmessage = (e) => {
      const update = JSON.parse(e.data);
    };
  </script>
</body>
</html>`;
}
