// ==UserScript==
// @name         BoF Portfolio Feedback
// @namespace    brandonfire
// @version      1.3
// @match        https://brand-on-fire.github.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
/* Brand on Fire portfolio feedback collector. One shared origin (brand-on-fire.github.io) => one shared
   localStorage; every comment is stamped with the site + page it was written on. Shadow DOM so the host
   site's CSS / pointer-events:none can't touch it. "Export all" copies everything for Claude. */
(function () {
  var K = 'bof_feedback', D = document;
  if (D.getElementById('bof-fb-host')) return;
  function L() { try { return JSON.parse(localStorage.getItem(K)) || []; } catch (e) { return []; } }
  function SV(a) { try { localStorage.setItem(K, JSON.stringify(a)); } catch (e) {} }
  function slug() { var p = location.pathname.split('/').filter(Boolean); return p[0] || '(home)'; }
  function pagePath() { var p = location.pathname.split('/').filter(Boolean); return '/' + p.slice(1).join('/') + (p.length > 1 ? '/' : ''); }
  function draftKey() { return 'bof_fb_draft:' + location.pathname; }     // per-page draft, no bleed between sites
  function barH() { var b = D.getElementById('bof-portfolio-bar'); return b ? b.offsetHeight : 0; }
  function counts() { var a = L(), s = slug(), here = a.filter(function (c) { return c.site === s; }).length; return { here: here, total: a.length }; }
  var open = localStorage.getItem('bof_fb_open') === '1';

  var host = D.createElement('div'); host.id = 'bof-fb-host';
  host.style.cssText = 'all:initial;position:fixed;left:0;right:0;bottom:0;z-index:2147483647;pointer-events:none';
  var R = host.attachShadow({ mode: 'open' });
  R.innerHTML =
    '<style>' +
    ':host{all:initial}div,textarea,button,span,b{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;margin:0}' +
    '.tog{position:fixed;right:14px;background:#0033e7;color:#fff;font-weight:700;font-size:13px;padding:9px 14px;border-radius:8px 8px 0 0;cursor:pointer;box-shadow:0 -2px 12px rgba(0,0,0,.45);pointer-events:auto;user-select:none}' +
    '.pan{position:fixed;left:0;right:0;background:#0a0a0a;border-top:2px solid #0033e7;height:158px;padding:8px 12px 10px;display:none;pointer-events:auto}' +
    '.pan.open{display:block}' +
    '.hd{display:flex;align-items:center;gap:8px;color:#fff;font-size:12.5px;margin-bottom:6px}' +
    '.hd b{color:#8bccff;font-weight:700}.hd .pg{color:#9aa3b2}' +
    'textarea{display:block;width:100%;height:74px;background:#16181d;color:#fff;border:1px solid #2a2d35;border-radius:6px;padding:8px;font-size:13px;line-height:1.4;resize:none;pointer-events:auto;-webkit-user-select:text;user-select:text;outline:none}' +
    'textarea:focus{border-color:#0033e7}' +
    '.row{display:flex;gap:8px;align-items:center;margin-top:7px}' +
    'button{border:0;border-radius:6px;padding:8px 14px;font-weight:700;font-size:13px;cursor:pointer;pointer-events:auto}' +
    '.save{background:#0033e7;color:#fff}.exp{background:#16181d;color:#8bccff;border:1px solid #2a2d35}.undo{background:transparent;color:#888;font-weight:600;font-size:12px;padding:6px}' +
    '.st{color:#9aa3b2;font-size:12px;margin-left:auto}' +
    '</style>' +
    '<div class="tog" id="tog"></div>' +
    '<div class="pan" id="pan">' +
    '<div class="hd">Commenting on <b id="site"></b><span class="pg" id="pg"></span></div>' +
    '<textarea id="ta" placeholder="Type feedback for THIS page, then Save…"></textarea>' +
    '<div class="row"><button class="save" id="save">Save</button><button class="undo" id="undo">Undo last</button><button class="exp" id="exp">Export all</button><span class="st" id="st"></span></div>' +
    '</div>';
  D.body.appendChild(host);

  var tog = R.getElementById('tog'), pan = R.getElementById('pan'), ta = R.getElementById('ta');
  R.getElementById('site').textContent = slug();
  R.getElementById('pg').textContent = pagePath();
  ta.value = localStorage.getItem(draftKey()) || '';
  ta.addEventListener('input', function () { localStorage.setItem(draftKey(), ta.value); });
  function refresh() {
    var h = barH(), c = counts();
    pan.style.bottom = h + 'px'; pan.classList.toggle('open', open);
    tog.style.bottom = (open ? 158 + h : h) + 'px';
    tog.textContent = '💬 Feedback (' + c.total + ') ' + (open ? '▾' : '▴');
    R.getElementById('st').textContent = c.here + ' on this site · ' + c.total + ' total';
  }
  tog.addEventListener('click', function () { open = !open; localStorage.setItem('bof_fb_open', open ? '1' : '0'); refresh(); if (open) setTimeout(function () { ta.focus(); }, 0); });
  R.getElementById('save').addEventListener('click', function () {
    var t = ta.value.trim(); if (!t) return;
    var a = L(); a.push({ site: slug(), page: location.pathname, text: t, ts: new Date().toISOString() }); SV(a);
    ta.value = ''; localStorage.removeItem(draftKey()); refresh();
    var b = R.getElementById('save'); b.textContent = 'Saved ✓ ' + slug(); setTimeout(function () { b.textContent = 'Save'; }, 1100);
  });
  R.getElementById('undo').addEventListener('click', function () {
    var a = L(); if (!a.length) return; var last = a.pop(); SV(a); refresh();
    var b = R.getElementById('undo'); b.textContent = 'removed'; setTimeout(function () { b.textContent = 'Undo last'; }, 900);
  });
  R.getElementById('exp').addEventListener('click', function () {
    var a = L(); if (!a.length) { alert('No comments saved yet.'); return; }
    var txt = 'PORTFOLIO FEEDBACK (' + a.length + ' comments)\n\n' + a.map(function (c) { return '[' + c.site + c.page + ']\n' + c.text; }).join('\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { alert('Copied ' + a.length + ' comments — paste to Claude.'); }, function () { window.prompt('Copy all (Cmd+C):', txt); });
    else window.prompt('Copy all (Cmd+C):', txt);
  });
  window.addEventListener('resize', refresh);
  if (D.readyState !== 'loading') refresh(); else D.addEventListener('DOMContentLoaded', refresh);
})();
