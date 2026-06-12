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
    '.gpu-ledstack{display:flex;flex-direction:column;gap:3px;flex-shrink:0}',
    '.gpu-ledstack i{width:6px;height:6px;border-radius:50%;background:#3d4d6e;display:block;transition:background .3s, box-shadow .3s}',
    '.gpu-ledstack i.on{background:#3ecb78;box-shadow:0 0 4px #3ecb78aa;animation:gpuLedPulse 2.2s ease-in-out infinite}',
    '.gpu-ledstack i.busy{background:#e3ab47;box-shadow:0 0 4px #e3ab47aa;animation:gpuLedPulse 1.1s ease-in-out infinite}',
    '.gpu-ledstack i.off{background:#e35d5d;opacity:.75}',
    '@keyframes gpuLedPulse{0%,100%{opacity:1}50%{opacity:.45}}',
    '.gpu-mini{display:flex;flex-direction:column;gap:2px;flex-shrink:0;width:44px}',
    '.gpu-mini-label{font-size:.5rem;font-weight:700;letter-spacing:.08em;color:#6e7f9d;text-transform:uppercase;line-height:1}',
    '.gpu-mini-bar{display:block;height:5px;border-radius:999px;background:rgba(110,127,157,.25);overflow:hidden}',
    '.gpu-mini-fill{display:block;height:5px;width:0%;border-radius:999px;background:#3ecb78;transition:width .9s ease, background .9s ease}'
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

  var leds = document.createElement('span');
  leds.className = 'gpu-ledstack';
  leds.innerHTML = '<i id="gpuLedNecron" title="Necron"></i><i id="gpuLedStorm" class="off" title="Storm"></i><i id="gpuLedGoldor" class="off" title="Goldor"></i>';
  pill.insertBefore(leds, pill.firstChild);

  var mini = document.createElement('span');
  mini.className = 'gpu-mini';
  mini.innerHTML = '<span class="gpu-mini-label" id="gpuMiniLabel">load</span>' +
                   '<span class="gpu-mini-bar"><span class="gpu-mini-fill" id="gpuMiniFill"></span></span>';
  pill.appendChild(mini);

  function paint(d) {
    var led = document.getElementById('gpuLedNecron');
    var fill = document.getElementById('gpuMiniFill');
    var label = document.getElementById('gpuMiniLabel');
    var online = d && (d.status === 'ready' || d.status === 'busy');
    led.className = !online ? 'off' : (d.status === 'busy' ? 'busy' : 'on');
    var util = (d && typeof d.util === 'number') ? d.util : 0;
    fill.style.width = (online ? Math.max(util, 2) : 0) + '%';
    fill.style.background = util >= 80 ? '#e35d5d' : util >= 40 ? '#e3ab47' : '#3ecb78';
    label.textContent = online ? util + '%' : 'load';
  }

  function pollPill() {
    fetch(API).then(function (r) { return r.json(); })
      .then(paint)
      .catch(function () { paint(null); });
  }
  pollPill();
  setInterval(pollPill, 20000);
})();
