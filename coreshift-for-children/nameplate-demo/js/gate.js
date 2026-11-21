/* ══════════════════════════════════════════════════════════════
   あいことばの入口（イベント会場モード ?mode=event のときだけ出る）

   ・4けたの数字を Apps Script（config.js の GATE_URL）に聞いて確かめる。
   ・合っていたら UNLOCK_MINUTES のあいだは 聞きなおさない。
   ・window.IS_EVENT_MODE を立てる。app.js は これを見て
     「3Dプリンターへ おくる」ボタンを出すかどうかを決める。
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CFG = window.NAMEPLATE_CONFIG;
  var isEvent = new URLSearchParams(location.search).get('mode') === 'event';
  window.IS_EVENT_MODE = isEvent;
  if (!isEvent) return;

  var KEY = 'nameplate_unlocked_at';
  var LIMIT_MS = CFG.UNLOCK_MINUTES * 60 * 1000;

  function isUnlocked() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (!raw) { try { raw = sessionStorage.getItem(KEY); } catch (e) {} }
    var t = Number(raw);
    if (t && (Date.now() - t) < LIMIT_MS) return true;
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    return false;
  }
  function remember() {
    var now = String(Date.now());
    try { localStorage.setItem(KEY, now); } catch (e) {}
    try { sessionStorage.setItem(KEY, now); } catch (e) {}
  }
  if (isUnlocked()) return;

  var gate = document.createElement('div');
  gate.className = 'gate';
  gate.innerHTML =
    '<div class="gate-box">' +
      '<div class="gate-icon">🔒</div>' +
      '<div class="gate-title">あいことばを いれてね</div>' +
      '<div class="gate-sub">イベント会場のスタッフにきいてね（4けたのすうじ）</div>' +
      '<input class="gate-input" maxlength="4" inputmode="numeric" autocomplete="off" placeholder="0000">' +
      '<button class="gate-btn">はいる</button>' +
      '<div class="gate-msg"></div>' +
      '<a class="gate-link" href="./">あいことばを持っていない方（Web体験デモへ）</a>' +
    '</div>';
  document.body.appendChild(gate);

  var inp = gate.querySelector('.gate-input');
  var btn = gate.querySelector('.gate-btn');
  var msg = gate.querySelector('.gate-msg');

  /* 全角の数字で打っても通るようにする */
  function normNum(v) {
    return String(v || '')
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[^0-9]/g, '');
  }

  /* JSONP で聞く。cb(true)=合っている / cb(false)=ちがう / cb(null)=確かめられなかった */
  function ask(pass, cb) {
    var name = 'g_' + Math.random().toString(36).slice(2), done = false;
    var s = document.createElement('script');
    function fin(res) {
      if (done) return;
      done = true;
      try { delete window[name]; } catch (e) { window[name] = undefined; }
      s.remove();
      if (!res) return cb(null);
      if (res.ok) return cb(true);
      cb(res.reason === 'mismatch' ? false : null);
    }
    window[name] = fin;
    s.onerror = function () { fin(null); };
    s.src = CFG.GATE_URL + '?action=checkpass&pass=' + encodeURIComponent(pass) +
            '&callback=' + name + '&t=' + Date.now();
    document.body.appendChild(s);
    setTimeout(function () { fin(null); }, 20000);
  }

  function finish(ok) {
    btn.disabled = false;
    if (ok === true) { remember(); gate.remove(); return; }
    msg.className = 'gate-msg err';
    msg.textContent = ok === false ? 'あいことばが ちがいます'
                                   : 'いま かくにん できませんでした。もういちど おしてね';
  }

  function check() {
    var pass = normNum(inp.value);
    if (pass.length !== 4) { msg.className = 'gate-msg err'; msg.textContent = '4けたの すうじを いれてね'; return; }
    btn.disabled = true;
    msg.className = 'gate-msg';
    msg.textContent = 'かくにん中…';
    ask(pass, function (ok) {
      if (ok !== null) return finish(ok);
      msg.textContent = 'でんぱを さがしています…';   // 1回だけ やりなおす
      ask(pass, finish);
    });
  }

  btn.onclick = check;
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
})();
