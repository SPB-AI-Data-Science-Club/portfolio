/* GPU status popup, shared by every page that shows the GPU pill.
   Click the pill to open a panel listing the club's GPU machines with
   live utilization for the ones that are online. The pill's own text
   is still updated by each page's existing status script. */
(function () {
  var API = 'https://spbdatascience.org/api/gpu-status';
  var pill = document.getElementById('gpuPill') ||
             document.querySelector('.gpu-status-pill, .gpu-pill');
  if (!pill) return;

  var css = [
    '.gpu-pop-wrap{position:fixed;inset:0;z-index:900;display:none}',
    '.gpu-pop-wrap.open{display:block}',
    '.gpu-pop{position:absolute;min-width:300px;max-width:92vw;background:#141f36;border:1px solid #2c3b5e;border-radius:12px;padding:1rem 1.1rem;box-shadow:0 14px 40px rgba(0,0,0,.5);font-family:inherit;color:#e9eef8}',
    '.gpu-pop-title{font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6494e8;margin-bottom:.65rem}',
    '.gpu-pop table{width:100%;border-collapse:collapse;font-size:.84rem}',
    '.gpu-pop th{text-align:left;font-size:.66rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6e7f9d;padding:.25rem .6rem .35rem 0}',
    '.gpu-pop td{padding:.42rem .6rem .42rem 0;border-top:1px solid #22304d;color:#b4c1d8;white-space:nowrap}',
    '.gpu-pop td.gname{color:#e9eef8;font-weight:600}',
    '.gpu-pop .gpu-led{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:.45rem;vertical-align:1px}',
    '.gpu-pop .gpu-led.on{background:#3ecb78;box-shadow:0 0 5px #3ecb7877}',
    '.gpu-pop .gpu-led.busy{background:#e3ab47;box-shadow:0 0 5px #e3ab4777}',
    '.gpu-pop .gpu-led.off{background:#e35d5d}',
    '.gpu-pop-note{margin-top:.6rem;font-size:.72rem;line-height:1.5;color:#6e7f9d}',
    /* Enhanced pill: machine light stack + live utilization bar */
    '#gpuPill, .gpu-status-pill, .gpu-pill{gap:.6rem !important;padding:.4rem .85rem !important;transition:border-color .2s, box-shadow .2s}',
    '#gpuPill:hover{border-color:#3f74d4 !important;box-shadow:0 0 12px rgba(63,116,212,.25)}',
    '.gpu-bars{display:flex;flex-direction:column;gap:3px;flex-shrink:0}',
    '.gpu-bar-row{display:flex;align-items:center;gap:5px}',
    '.gpu-bar-track{display:block;width:42px;height:5px;border-radius:999px;background:rgba(110,127,157,.22);overflow:hidden}',
    '.gpu-bar-fill{display:block;height:5px;width:0%;border-radius:999px;background:#3d4d6e;transition:width .9s ease, background .9s ease}',
    '.gpu-bar-fill.on{background:#3ecb78}',
    '.gpu-bar-fill.busy{background:#e3ab47}',
    /* Offline reads as a 0% dot pinned to the left, not a full red bar */
    '.gpu-bar-fill.off{background:#e35d5d;width:5px}',
    '.gpu-bar-pct{font-size:.52rem;font-weight:700;letter-spacing:.04em;color:#6e7f9d;font-variant-numeric:tabular-nums;line-height:1;min-width:24px;text-align:right}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.className = 'gpu-pop-wrap';
  wrap.innerHTML =
    '<div class="gpu-pop" role="dialog" aria-label="GPU status">' +
    '<div class="gpu-pop-title">Club GPU Servers</div>' +
    '<table><thead><tr><th>Machine</th><th>GPU</th><th>Usage</th></tr></thead>' +
    '<tbody id="gpuPopRows"></tbody></table>' +
    '<div class="gpu-pop-note">Live readings from the club’s machines, refreshed automatically.</div>' +
    '</div>';
  document.body.appendChild(wrap);
  var pop = wrap.firstChild;

  function shortName(g) {
    if (!g || g === 'CPU' || g === 'Club GPU') return 'RTX 5080';
    return g.replace(/NVIDIA\s*/i, '').replace(/GeForce\s*/i, '');
  }

  function row(led, name, gpu, usage) {
    return '<tr><td class="gname"><span class="gpu-led ' + led + '"></span>' +
           name + '</td><td>' + gpu + '</td><td>' + usage + '</td></tr>';
  }

  function render(d) {
    var online = d && (d.status === 'ready' || d.status === 'busy');
    var usage;
    if (!online) {
      usage = 'Offline';
    } else if (typeof d.util === 'number') {
      usage = d.util + '%';
      if (typeof d.mem_used === 'number' && typeof d.mem_total === 'number') {
        usage += ' · ' + Math.round(d.mem_used / 1024) + '/' +
                 Math.round(d.mem_total / 1024) + ' GB VRAM';
      }
    } else {
      usage = d.status === 'busy' ? 'Busy' : 'Idle';
    }
    document.getElementById('gpuPopRows').innerHTML =
      row(!online ? 'off' : (d.status === 'busy' ? 'busy' : 'on'), 'Necron', online ? shortName(d.gpu) : 'RTX 5080', usage) +
      row('off', 'Storm', 'RTX 5080', 'Offline') +
      row('off', 'Goldor', 'RTX 5090', 'Offline');
  }

  var timer = null;
  function refresh() {
    fetch(API).then(function (r) { return r.json(); })
      .then(render)
      .catch(function () { render(null); });
  }

  function place() {
    var r = pill.getBoundingClientRect();
    var w = Math.min(320, window.innerWidth * 0.92);
    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    pop.style.left = left + 'px';
    pop.style.top = (r.bottom + 10) + 'px';
  }

  function open() {
    render(null);
    refresh();
    place();
    wrap.classList.add('open');
    timer = setInterval(refresh, 10000);
  }

  function close() {
    wrap.classList.remove('open');
    if (timer) { clearInterval(timer); timer = null; }
  }

  pill.style.cursor = 'pointer';
  pill.setAttribute('title', 'Click for GPU details');
  pill.addEventListener('click', function (e) {
    e.stopPropagation();
    wrap.classList.contains('open') ? close() : open();
  });
  wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', function () { if (wrap.classList.contains('open')) place(); });

  /* ── Enhanced pill: one light per machine plus a live utilization bar.
     The page's own script keeps updating the text label; this adds the
     visual layer on top and polls the same endpoint for the numbers. ── */
  var legacyDot = pill.querySelector('#gpuDot, .gd, .gpu-dot');
  if (legacyDot) legacyDot.style.display = 'none';

  var bars = document.createElement('span');
  bars.className = 'gpu-bars';
  bars.innerHTML =
    '<span class="gpu-bar-row" title="Necron"><span class="gpu-bar-track"><span class="gpu-bar-fill" id="gpuBarNecron"></span></span><span class="gpu-bar-pct" id="gpuPctNecron">--</span></span>' +
    '<span class="gpu-bar-row" title="Storm"><span class="gpu-bar-track"><span class="gpu-bar-fill off" id="gpuBarStorm"></span></span><span class="gpu-bar-pct" id="gpuPctStorm">--%</span></span>' +
    '<span class="gpu-bar-row" title="Goldor"><span class="gpu-bar-track"><span class="gpu-bar-fill off" id="gpuBarGoldor"></span></span><span class="gpu-bar-pct" id="gpuPctGoldor">--%</span></span>';
  pill.appendChild(bars);

  // Update the pill's text label (folded in from the old per-page inline
  // scripts so the endpoint is polled once, not twice).
  function paintLabel(d) {
    var dot = document.getElementById('gpuDot');
    var txt = document.getElementById('gpuTxt');
    if (!txt) return;
    var s = (d && d.status) || 'offline';
    var live = (s === 'ready' || s === 'busy');
    if (dot) dot.className = 'gd ' + (live ? s : '');
    txt.className = 'gt ' + (live ? s : '');
    txt.textContent = s === 'ready' ? 'GPUs Online' : s === 'busy' ? 'GPUs Busy' : 'GPUs Offline';
  }

  function paint(d) {
    paintLabel(d);
    var fill = document.getElementById('gpuBarNecron');
    var pct = document.getElementById('gpuPctNecron');
    if (!fill) return;
    var online = d && (d.status === 'ready' || d.status === 'busy');
    var util = (d && typeof d.util === 'number') ? d.util : 0;
    if (!online) {
      // Offline: collapse to a small red dot on the left (0% usage)
      fill.className = 'gpu-bar-fill off';
      fill.style.width = '5px';
      pct.textContent = '--%';
    } else {
      fill.className = 'gpu-bar-fill ' + (d.status === 'busy' ? 'busy' : 'on');
      fill.style.width = Math.max(util, 4) + '%';
      pct.textContent = util + '%';
    }
  }

  // Single poll loop drives the label, the pill bars, and (when open) the
  // popup table, so the status endpoint is hit once per interval.
  function poll() {
    fetch(API).then(function (r) { return r.json(); })
      .then(function (d) { paint(d); if (wrap.classList.contains('open')) render(d); })
      .catch(function () { paint(null); if (wrap.classList.contains('open')) render(null); });
  }
  poll();
  setInterval(poll, 20000);
})();
