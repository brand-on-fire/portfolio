// ==UserScript==
// @name         BoF Portfolio Feedback
// @namespace    brandonfire
// @version      1.2
// @description  Shadow-DOM 150px comment bar on every portfolio page; shared-localStorage; Export all -> clipboard
// @match        https://brand-on-fire.github.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
/* Brand on Fire portfolio feedback collector. All portfolio sites share one origin
   (brand-on-fire.github.io) so localStorage is SHARED — comments pool in one place across every site.
   Rendered in a SHADOW DOM so the host site's CSS can't bleed in and its `pointer-events:none` form-
   disable rule can't kill the textarea. "Export all" copies everything to the clipboard. Zero backend. */
(function () {
  var K = 'bof_feedback', D = document;
  if (D.getElementById('bof-fb-host')) return;                 // already injected
  function L() { try { return JSON.parse(localStorage.getItem(K)) || []; } catch (e) { return []; } }
  function SV(a) { try { localStorage.setItem(K, JSON.stringify(a)); } catch (e) {} }
  function slug() { var p = location.pathname.split('/').filter(Boolean); return p[0] || '(root)'; }
  function barH() { var b = D.getElementById('bof-portfolio-bar'); return b ? b.offsetHeight : 0; }
  var open = localStorage.getItem('bof_fb_open') === '1';

  var host = D.createElement('div'); host.id = 'bof-fb-host';
  host.style.cssText = 'all:initial;position:fixed;left:0;right:0;bottom:0;z-index:2147483647;pointer-events:none';
  var R = host.attachShadow({ mode: 'open' });
  R.innerHTML =
    '<style>' +
    ':host{all:initial}' +
    'div,textarea,button,span{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;margin:0}' +
    '.tog{position:fixed;right:14px;background:#0033e7;color:#fff;font-weight:600;font-size:13px;padding:9px 14px;border-radius:8px 8px 0 0;cursor:pointer;box-shadow:0 -2px 12px rgba(0,0,0,.45);pointer-events:auto;user-select:none}' +
    '.pan{position:fixed;left:0;right:0;background:#0a0a0a;border-top:2px solid #0033e7;height:150px;padding:10px 12px;display:none;pointer-events:auto}' +
    '.pan.open{display:block}' +
    'textarea{display:block;width:100%;height:88px;background:#16181d;color:#fff;border:1px solid #2a2d35;border-radius:6px;padding:8px;font-size:13px;line-height:1.45;resize:none;pointer-events:auto;-webkit-user-select:text;user-select:text;outline:none}' +
    'textarea:focus{border-color:#0033e7}' +
    '.row{display:flex;gap:8px;align-items:center;margin-top:8px}' +
    'button{border:0;border-radius:6px;padding:8px 14px;font-weight:600;font-size:13px;cursor:pointer;pointer-events:auto}' +
    '.save{background:#0033e7;color:#fff}.exp{background:#16181d;color:#8bccff;border:1px solid #2a2d35}.clr{background:transparent;color:#888}' +
    '.st{color:#9aa3b2;font-size:12px;margin-left:auto}' +
    '</style>' +
    '<div class="tog" id="tog"></div>' +
    '<div class="pan" id="pan"><textarea id="ta" placeholder="Your feedback for this page…"></textarea>' +
    '<div class="row"><button class="save" id="save">Save comment</button><button class="exp" id="exp">Export all</button><button class="clr" id="clr">Clear</button><span class="st" id="st"></span></div></div>';
  D.body.appendChild(host);

  var tog = R.getElementById('tog'), pan = R.getElementById('pan'), ta = R.getElementById('ta'), st = R.getElementById('st');
  ta.value = localStorage.getItem('bof_fb_draft') || '';
  ta.addEventListener('input', function () { localStorage.setItem('bof_fb_draft', ta.value); });
  function refresh() {
    var h = barH(), n = L().length;
    pan.style.bottom = h + 'px'; pan.classList.toggle('open', open);
    tog.style.bottom = (open ? 150 + h : h) + 'px';
    tog.textContent = '💬 Feedback (' + n + ') ' + (open ? '▾' : '▴');
    st.textContent = n + ' saved · ' + slug();
  }
  tog.addEventListener('click', function () { open = !open; localStorage.setItem('bof_fb_open', open ? '1' : '0'); refresh(); if (open) setTimeout(function () { ta.focus(); }, 0); });
  R.getElementById('save').addEventListener('click', function () {
    var t = ta.value.trim(); if (!t) return;
    var a = L(); a.push({ site: slug(), page: location.pathname, text: t, ts: new Date().toISOString() }); SV(a);
    ta.value = ''; localStorage.removeItem('bof_fb_draft'); refresh();
    var b = R.getElementById('save'); b.textContent = 'Saved ✓'; setTimeout(function () { b.textContent = 'Save comment'; }, 900);
  });
  R.getElementById('exp').addEventListener('click', function () {
    var a = L(); if (!a.length) { alert('No comments saved yet.'); return; }
    var txt = 'PORTFOLIO FEEDBACK (' + a.length + ' comments)\n\n' + a.map(function (c) { return '[' + c.site + c.page + ']\n' + c.text; }).join('\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { alert('Copied ' + a.length + ' comments — paste to Claude.'); }, function () { window.prompt('Copy all (Cmd+C):', txt); });
    else window.prompt('Copy all (Cmd+C):', txt);
  });
  R.getElementById('clr').addEventListener('click', function () { if (confirm('Clear all ' + L().length + ' comments?')) { SV([]); refresh(); } });
  window.addEventListener('resize', refresh);
  if (D.readyState !== 'loading') refresh(); else D.addEventListener('DOMContentLoaded', refresh);
})();
