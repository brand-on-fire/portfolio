// ==UserScript==
// @name         BoF Portfolio Feedback
// @namespace    brandonfire
// @version      1.1
// @description  150px comment bar on every portfolio page; shared-localStorage collection; Export all -> clipboard
// @match        https://brand-on-fire.github.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
/* Brand on Fire portfolio feedback collector. All portfolio sites are one origin
   (brand-on-fire.github.io) so localStorage is SHARED — comments accumulate in one place across every
   site. "Export all" copies them to the clipboard to paste back to Claude. Zero backend. */
(function () {
  var K = 'bof_feedback', D = document;
  function L() { try { return JSON.parse(localStorage.getItem(K)) || []; } catch (e) { return []; } }
  function SV(a) { try { localStorage.setItem(K, JSON.stringify(a)); } catch (e) {} }
  function slug() { var p = location.pathname.split('/').filter(Boolean); return p[0] || '(root)'; }
  function barH() { var b = D.getElementById('bof-portfolio-bar'); return b ? b.offsetHeight : 0; }
  if (D.getElementById('bof-fb-tog')) return;               // already injected
  var open = localStorage.getItem('bof_fb_open') === '1';

  var tog = D.createElement('div'); tog.id = 'bof-fb-tog';
  tog.style.cssText = 'position:fixed;right:14px;z-index:2147483647;background:#0033e7;color:#fff;font:600 13px Inter,system-ui,Arial,sans-serif;padding:9px 14px;border-radius:8px 8px 0 0;cursor:pointer;box-shadow:0 -2px 12px rgba(0,0,0,.4)';

  var pan = D.createElement('div'); pan.id = 'bof-fb-pan';
  pan.style.cssText = 'position:fixed;left:0;right:0;z-index:2147483647;background:#0a0a0a;border-top:2px solid #0033e7;box-sizing:border-box;height:150px;display:none;padding:10px 12px;font-family:Inter,system-ui,Arial,sans-serif';

  var ta = D.createElement('textarea');
  ta.placeholder = 'Your feedback for this page…';
  ta.style.cssText = 'width:100%;height:88px;background:#16181d;color:#fff;border:1px solid #2a2d35;border-radius:6px;padding:8px;font:13px/1.45 inherit;resize:none;box-sizing:border-box';
  ta.value = localStorage.getItem('bof_fb_draft') || '';
  ta.oninput = function () { localStorage.setItem('bof_fb_draft', ta.value); };

  var row = D.createElement('div'); row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px';
  function btn(t, css) { var b = D.createElement('button'); b.textContent = t; b.style.cssText = 'border:0;border-radius:6px;padding:8px 14px;font:600 13px inherit;cursor:pointer;' + css; return b; }
  var saveB = btn('Save comment', 'background:#0033e7;color:#fff');
  var expB = btn('Export all', 'background:#16181d;color:#8bccff;border:1px solid #2a2d35');
  var clrB = btn('Clear', 'background:transparent;color:#777');
  var st = D.createElement('span'); st.style.cssText = 'color:#9aa3b2;font:12px Inter,system-ui,Arial,sans-serif;margin-left:auto';
  row.appendChild(saveB); row.appendChild(expB); row.appendChild(clrB); row.appendChild(st);
  pan.appendChild(ta); pan.appendChild(row); D.body.appendChild(pan); D.body.appendChild(tog);

  function refresh() {
    var h = barH(), n = L().length;
    pan.style.bottom = h + 'px'; pan.style.display = open ? 'block' : 'none';
    tog.style.bottom = (open ? 150 + h : h) + 'px';
    tog.textContent = '💬 Feedback (' + n + ') ' + (open ? '▾' : '▴');
    st.textContent = n + ' saved · ' + slug();
  }
  tog.onclick = function () { open = !open; localStorage.setItem('bof_fb_open', open ? '1' : '0'); refresh(); if (open) ta.focus(); };
  saveB.onclick = function () {
    var t = ta.value.trim(); if (!t) return;
    var a = L(); a.push({ site: slug(), page: location.pathname, text: t, ts: new Date().toISOString() }); SV(a);
    ta.value = ''; localStorage.removeItem('bof_fb_draft'); refresh();
    saveB.textContent = 'Saved ✓'; setTimeout(function () { saveB.textContent = 'Save comment'; }, 900);
  };
  expB.onclick = function () {
    var a = L(); if (!a.length) { alert('No comments saved yet.'); return; }
    var txt = 'PORTFOLIO FEEDBACK (' + a.length + ' comments)\n\n' + a.map(function (c) { return '[' + c.site + c.page + ']\n' + c.text; }).join('\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { alert('Copied ' + a.length + ' comments — paste them to Claude.'); }, function () { window.prompt('Copy all feedback (Cmd+C):', txt); });
    else window.prompt('Copy all feedback (Cmd+C):', txt);
  };
  clrB.onclick = function () { if (confirm('Clear all ' + L().length + ' saved comments?')) { SV([]); refresh(); } };
  window.addEventListener('resize', refresh);
  if (D.readyState !== 'loading') refresh(); else D.addEventListener('DOMContentLoaded', refresh);
})();
