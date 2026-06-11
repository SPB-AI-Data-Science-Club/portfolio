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
    '.gpu-pop .gpu-led.off{background:#e35d5d}',
    '.gpu-pop-note{margin-top:.6rem;font-size:.72rem;line-height:1.5;color:#6e7f9d}'
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
      row(online ? 'on' : 'off', 'Necron', online ? shortName(d.gpu) : 'RTX 5080', usage) +
      row('off', 'Storm', 'RTX 5090', 'Offline') +
      row('off', 'Goldor', 'RTX 5080', 'Offline');
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
})();
