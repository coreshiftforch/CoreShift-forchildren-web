const isMobile = window.matchMedia('(max-width: 768px)').matches;

// ===== ロゴ → ホーム最上部へ（リロードなし）=====
const logoEl = document.querySelector('.logo[data-home-scroll]');
if (logoEl) {
  logoEl.addEventListener('click', e => {
    e.preventDefault();
    e.stopImmediatePropagation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('header')?.classList.remove('scrolled');
  });
}

// ===== ストリップ遷移ユーティリティ =====
function navigateWithStrip(href) {
  const ov = document.getElementById('page-transition');
  if (ov) {
    const s = Array.from(ov.querySelectorAll('.pt-strip'));
    sessionStorage.setItem('ptStrip', '1');
    s.forEach(el => el.classList.add('pt-cover'));
    setTimeout(() => { window.location.href = href; }, 820);
  } else {
    window.location.href = href;
  }
}

// ===== 戻るボタン対策：ストリップが残っていたら即座にリセット =====
window.addEventListener('pageshow', () => {
  const strips = Array.from(document.querySelectorAll('.pt-strip'));
  // pt-cover が残っている かつ 通常の遷移でない（ptStrip が null）場合にリセット
  if (strips.some(s => s.classList.contains('pt-cover')) && !sessionStorage.getItem('ptStrip')) {
    strips.forEach(s => {
      s.style.transition = 'none';
      s.classList.remove('pt-cover', 'pt-init', 'pt-reveal');
    });
    requestAnimationFrame(() => strips.forEach(s => { s.style.transition = ''; }));
  }
});

// ===== ページ遷移：白ストリップ（AI / プログラミング） =====
const ptOverlay = document.getElementById('page-transition');

if (ptOverlay) {
  const strips = Array.from(ptOverlay.querySelectorAll('.pt-strip'));

  // 前ページからのストリップ遷移 → リビール
  if (sessionStorage.getItem('ptStrip') === '1') {
    sessionStorage.removeItem('ptStrip');

    // ストリップが開く前に対象セクションへ瞬時スクロール
    const scrollTarget = sessionStorage.getItem('ptScrollTo');
    if (scrollTarget) {
      sessionStorage.removeItem('ptScrollTo');
      const el = document.getElementById(scrollTarget);
      if (el) {
        document.documentElement.style.scrollBehavior = 'auto';
        el.scrollIntoView();
        document.documentElement.style.scrollBehavior = '';
      }
    }

    document.documentElement.removeAttribute('data-pt-init');
    strips.forEach(s => s.classList.add('pt-init'));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      strips.forEach(s => {
        s.classList.remove('pt-init');
        s.classList.add('pt-reveal');
      });
      // アニメーション完了後にクラスを除去（残像バグ対策）
      setTimeout(() => {
        strips.forEach(s => s.classList.remove('pt-reveal'));
      }, 900);
    }));
  }

  // 通常リンク → ストリップカバー → 遷移
  document.querySelectorAll('a[href]').forEach(link => {
    if (link.dataset.zoomCard) return; // ズームカードは別処理
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')
          || href.startsWith('mailto') || link.target === '_blank'
          || link.hasAttribute('data-home-scroll')) return;
      e.preventDefault();
      // ハッシュがあれば別途保存し、遷移先でスクロールする
      if (href.includes('#')) {
        sessionStorage.setItem('ptScrollTo', href.split('#')[1]);
      }
      sessionStorage.setItem('ptStrip', '1');
      strips.forEach(s => s.classList.add('pt-cover'));
      setTimeout(() => { window.location.href = href.split('#')[0]; }, 820);
    });
  });
}

// ===== ページ遷移：カードズーム（3Dプリンター専用）=====
const printerCard = document.querySelector('[data-zoom-card]');
if (printerCard) {
  printerCard.addEventListener('click', () => {
    const rect = printerCard.getBoundingClientRect();

    // ── Step 1: カード自体を即座に黒く（ラベル・ボーダー非表示）──
    const label = printerCard.querySelector('.tool-card-name');
    if (label) label.style.display = 'none';
    printerCard.style.background = '#060606';
    printerCard.style.border     = 'none';
    printerCard.style.outline    = 'none';

    // 全画面黒背景
    const bg = document.createElement('div');
    Object.assign(bg.style, {
      position   : 'fixed',
      inset      : '0',
      background : '#060606',
      zIndex     : '8000',
    });
    document.body.appendChild(bg);

    // カードを body 直下に移動（section の stacking context を脱出）
    printerCard.style.position = 'fixed';
    printerCard.style.top      = rect.top    + 'px';
    printerCard.style.left     = rect.left   + 'px';
    printerCard.style.width    = rect.width  + 'px';
    printerCard.style.height   = rect.height + 'px';
    printerCard.style.margin   = '0';
    printerCard.style.zIndex   = '8001';
    document.body.appendChild(printerCard);

    // 画面中央への移動量（キャンバス部分の中心を基準にする）
    const imgEl = printerCard.querySelector('.tool-card-img');
    const imgRect = imgEl ? imgEl.getBoundingClientRect() : rect;
    const tx = window.innerWidth  / 2 - (imgRect.left + imgRect.width  / 2);
    const ty = window.innerHeight / 2 - (imgRect.top  + imgRect.height / 2);

    // ── Step 2: 少し間を置いてから座標移動開始 ──
    const ease = 'cubic-bezier(.86,0,.07,1)';
    setTimeout(() => {
      printerCard.style.transition = `transform 0.65s ${ease}`;
      printerCard.style.transform  = `translate(${tx}px, ${ty}px)`;

      // 移動完了後、対角ワイプ（右→左）でマスクしてページ遷移
      setTimeout(() => {
        const wipeEl = document.getElementById('printer-wipe');
        if (wipeEl) {
          sessionStorage.setItem('ptStrip', '1');
          wipeEl.classList.add('pw-cover');
        } else {
          const ptOv = document.getElementById('page-transition');
          if (ptOv) {
            sessionStorage.setItem('ptStrip', '1');
            Array.from(ptOv.querySelectorAll('.pt-strip')).forEach(s => s.classList.add('pt-cover'));
          }
        }
        setTimeout(() => { window.location.href = printerCard.dataset.zoomCard; }, 820);
      }, 650);
    }, 250);
  });
}

// ===== カスタムカーソル =====
if (!isMobile) {
  const cursor = document.getElementById('cursor');
  window.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, [data-zoom-card]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '20px'; cursor.style.height = '20px'; cursor.style.opacity = '0.6';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '60px'; cursor.style.height = '60px'; cursor.style.opacity = '1';
    });
  });
}

// ===== ヘッダー スクロール＆テーマ切り替え =====
const header  = document.getElementById('header');
const sideNav = document.getElementById('side-nav');

function updateNavTheme() {
  const whites = document.querySelectorAll('.white-section');

  // 要素と白セクションの重なり割合を返す（0〜1）
  function whiteRatio(rect) {
    let ratio = 0;
    whites.forEach(sec => {
      const r  = sec.getBoundingClientRect();
      const ot = Math.max(rect.top,    r.top);
      const ob = Math.min(rect.bottom, r.bottom);
      if (ob > ot) ratio = Math.max(ratio, Math.min((ob - ot) / rect.height, 1));
    });
    return ratio;
  }

  // 割合に応じて #fff ↔ #111 を補間
  function blendColor(ratio) {
    const v = Math.round(255 - 238 * ratio); // 255→17
    return `rgb(${v},${v},${v})`;
  }

  // ロゴ：スクロール済み（黒バーあり）は常に白、最上部のみ切り替え
  const logoLink = document.querySelector('#header .logo');
  if (logoLink) {
    logoLink.style.color = window.scrollY > 60
      ? '#fff'
      : blendColor(whiteRatio(logoLink.getBoundingClientRect()));
  }

  // サイドナビ：各リンク・区切り線ごとに個別計算
  document.querySelectorAll('#side-nav a').forEach(a => {
    a.style.color = blendColor(whiteRatio(a.getBoundingClientRect()));
  });
  document.querySelectorAll('.nav-sep').forEach(sep => {
    sep.style.background = blendColor(whiteRatio(sep.getBoundingClientRect()));
  });

  // 言語切り替え：ロゴと同じルールで色を切り替え
  const langColor = window.scrollY > 60
    ? '#fff'
    : blendColor(whiteRatio(document.querySelector('.lang-switch')?.getBoundingClientRect() ?? {}));
  document.querySelectorAll('.lang-btn, .lang-sep-v').forEach(el => {
    el.style.color = langColor;
  });
}

let lastScrollY = window.scrollY;
let scrollDir = 1; // 1 = down, -1 = up

window.addEventListener('scroll', () => {
  scrollDir = window.scrollY > lastScrollY ? 1 : -1;
  lastScrollY = window.scrollY;
  header.classList.toggle('scrolled', window.scrollY > 60);
  updateNavTheme();
}, { passive: true });

updateNavTheme();

// ===== コンテンツ Reveal =====
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== スクロール連動アニメーション =====
const whiteSections = Array.from(document.querySelectorAll('.white-section'));

// 白背景 clip-path リビール
function updateWhiteReveal() {
  const vh = window.innerHeight;
  whiteSections.forEach(sec => {
    const top = sec.getBoundingClientRect().top;
    const p = Math.min(Math.max(1 - top / vh, 0), 1);
    sec.style.setProperty('--reveal-p', (p * 100).toFixed(1) + '%');
  });
}

// スクロール連動フェードイン（要素ごとに stagger）
const scrollRevealGroups = [
  {
    sec: document.getElementById('events'),
    els: [document.querySelector('#events h2')].filter(Boolean),
    start: 0.2, end: 0.72, stagger: 0, translateY: 60, fade: true,
  },
  {
    sec: document.getElementById('events'),
    els: [document.querySelector('#events .sec-num')].filter(Boolean),
    start: 0.45, end: 0.92, stagger: 0, translateY: 100, fade: true,
    preserveCenter: true,
  },
  {
    sec: document.getElementById('events'),
    els: Array.from(document.querySelectorAll('#events .event-card')),
    start: 0.15, end: 0.65, stagger: 0.12, translateY: 36, fade: true,
    mobileStart: 0.7, mobileEnd: 0.97, mobileStagger: 0.08,
  },
];

function updateScrollReveal() {
  const vh = window.innerHeight;
  scrollRevealGroups.forEach(({ sec, els, start, end, stagger, translateY = 36, fade = true, scrollUpInstant = false, preserveCenter = false, mobileStart, mobileEnd, mobileStagger }) => {
    if (!sec) return;
    const isMobileView = window.innerWidth <= 768;
    const effectiveStart   = isMobileView && mobileStart   != null ? mobileStart   : start;
    const effectiveEnd     = isMobileView && mobileEnd     != null ? mobileEnd     : end;
    const effectiveStagger = isMobileView && mobileStagger != null ? mobileStagger : stagger;
    const rawP = 1 - sec.getBoundingClientRect().top / vh;
    const p = Math.min(Math.max(rawP, 0), 1);
    els.forEach((el, i) => {
      let ep;
      if (scrollUpInstant && scrollDir < 0 && rawP >= effectiveStart) {
        ep = 1;
      } else {
        ep = Math.min(Math.max((p - effectiveStart - i * effectiveStagger) / (effectiveEnd - effectiveStart), 0), 1);
      }
      if (fade) el.style.opacity = ep;
      if (preserveCenter && window.innerWidth > 1300) {
        el.style.transform = `translateX(-50%) translateY(calc(-50% + ${(1 - ep) * translateY}px))`;
      } else {
        el.style.transform = `translateY(${(1 - ep) * translateY}px)`;
      }
    });
  });
}

function updateAllScrollAnimations() {
  updateWhiteReveal();
  updateScrollReveal();
}

window.addEventListener('scroll', updateAllScrollAnimations, { passive: true });
updateAllScrollAnimations();

// ===== ホームページ カードビューアー（3Dモデル in カード）=====
initCardViewer();

async function initCardViewer() {
  const canvas = document.querySelector('.card-3d-canvas');
  if (!canvas) return;

  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 4);

  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(3, 4, 5); scene.add(key);
  const blue = new THREE.PointLight(0x3b82f6, 4, 12);
  blue.position.set(-2, 1, 2); scene.add(blue);

  // リサイズ：キャンバス自身の表示サイズを基準にする
  let lastW = 0, lastH = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false); // CSS は変えない
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  requestAnimationFrame(resize);
  window.addEventListener('resize', resize);

  const loader    = new GLTFLoader();
  const modelPath = canvas.dataset.model || 'models/3Dプリンター.glb';

  loader.load(modelPath, gltf => {
    const model  = gltf.scene;
    const box    = new THREE.Box3().setFromObject(model);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale  = 2.0 / Math.max(size.x, size.y, size.z); // xyz 等倍
    model.scale.setScalar(scale);
    const sc = center.multiplyScalar(scale);
    model.position.set(-sc.x, -sc.y, -sc.z);
    scene.add(model);

    resize(); // モデルロード後に再確認

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = Date.now() * 0.0004;
      model.rotation.y += clock.getDelta() * 0.6;
      blue.position.set(Math.sin(t) * 4, 1, Math.cos(t) * 4);
      renderer.render(scene, camera);
    }
    animate();
  });
}

// ===== AI / プログラミングページ：最上部で上スクロール → ホームへ =====
if (document.querySelector('.tool-detail') && !document.getElementById('printer-scroll')) {
  const HOME = '../index.html';
  let navigating = false;

  window.addEventListener('wheel', e => {
    if (navigating || window.scrollY > 0 || e.deltaY >= 0) return;
    navigating = true;
    navigateWithStrip(HOME);
  }, { passive: true });

  let touchStartY = 0;
  window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', e => {
    if (navigating || window.scrollY > 0) return;
    if (e.changedTouches[0].clientY - touchStartY > 60) {
      navigating = true;
      navigateWithStrip(HOME);
    }
  }, { passive: true });
}

// ===== 3Dプリンタースワイプ共有変数 =====
let _printerSwipeTarget = 0;
let _printerSwipeX      = 0;

// ===== 3Dプリンターページ：最上部で上スクロール → ホームへ =====
if (document.getElementById('printer-scroll')) {
  const HOME = '../index.html';
  let navigating = false;

  // マウスホイール
  window.addEventListener('wheel', e => {
    if (navigating || window.scrollY > 0 || e.deltaY >= 0) return;
    navigating = true;
    navigateWithStrip(HOME);
  }, { passive: true });

  // タッチスワイプ（上スワイプ or 右スワイプ → ホームへ）
  let touchStartX = 0, touchStartY = 0;
  window.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (navigating) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (dx > 0 && Math.abs(dx) > Math.abs(dy)) {
      _printerSwipeTarget = Math.min(dx / window.innerWidth, 1);
    } else {
      _printerSwipeTarget = 0;
    }
  }, { passive: true });
  window.addEventListener('touchend', e => {
    if (navigating) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const rightSwipe = dx > 60 && dx > Math.abs(dy);
    const upSwipe    = dy > 60 && dy > Math.abs(dx) && window.scrollY === 0;
    if (rightSwipe) {
      navigating = true;
      _printerSwipeTarget = 2;
      setTimeout(() => navigateWithStrip(HOME), 250);
    } else if (upSwipe) {
      navigating = true;
      navigateWithStrip(HOME);
    } else {
      _printerSwipeTarget = 0;
    }
  }, { passive: true });
}

// ===== 3Dプリンター スクロールビューアー =====
initPrinterViewer();

async function initPrinterViewer() {
  const canvas = document.getElementById('printer-canvas');
  if (!canvas) return;

  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x060606, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(3, 4, 5); scene.add(keyLight);
  const blueLight = new THREE.PointLight(0x3b82f6, 5, 16);
  blueLight.position.set(-3, 1, 3); scene.add(blueLight);
  const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
  rimLight.position.set(-4, -2, -3); scene.add(rimLight);
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));

  let mixer = null, action = null, model = null, baseModelX = 0;

  const scrollSection = document.getElementById('printer-scroll');
  const scrollHint    = document.querySelector('.printer-scroll-hint');
  const textOverlay   = document.querySelector('.printer-text-overlay');
  const stickyEl      = document.querySelector('.printer-sticky');
  const textbox       = document.querySelector('.printer-textbox');


  const loader    = new GLTFLoader();
  const modelPath = canvas.dataset.model || './models/3Dプリンター.glb';

  loader.load(modelPath, gltf => {
    model = gltf.scene;
    const box    = new THREE.Box3().setFromObject(model);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale  = 2.5 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    const sc = center.multiplyScalar(scale);
    model.position.set(-sc.x, -sc.y - 0.1, -sc.z);
    model.rotation.y = -Math.PI / 2; // 正面向き
    baseModelX = -sc.x;
    scene.add(model);

    if (gltf.animations.length > 0) {
      mixer  = new THREE.AnimationMixer(model);
      action = mixer.clipAction(gltf.animations[0]);
      action.clampWhenFinished = true;
      action.loop   = THREE.LoopOnce;
      action.play();
      action.paused = true;
    }
  });

  // ユーティリティ
  const lerp      = (a, b, t) => a + (b - a) * t;
  const clamp01   = v => Math.min(Math.max(v, 0), 1);
  const easeInOut = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
  const phase     = (p, s, e) => easeInOut(clamp01((p-s)/(e-s)));

  function getScrollP() {
    if (!scrollSection) return 0;
    return clamp01(window.scrollY / (scrollSection.offsetHeight - window.innerHeight));
  }

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const isBg = canvas.parentElement.classList.contains('bg-mode');
    const w = isBg ? window.innerWidth  : canvas.parentElement.clientWidth;
    const h = isBg ? window.innerHeight : canvas.parentElement.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const cam  = { z: 5, y: 0 };
  const camT = { z: 5, y: 0 };
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (model && scrollSection) {
      const p = getScrollP();

      // マウスチルト（微妙）
      model.rotation.x = mouseY * 0.03;

      // ズームイン ＋ 扉開閉 同時進行（0〜1.0）
      camT.z = lerp(5, 1.2, phase(p, 0, 1.0));
      camT.y = lerp(0, -0.4, phase(p, 0, 1.0));

      if (mixer && action) {
        action.time = phase(p, 0, 1.0) * action.getClip().duration;
        mixer.update(0);
      }

      // SCROLLヒント フェードアウト
      if (scrollHint) scrollHint.style.opacity = String(1 - clamp01(p / 0.15));

      // アニメーション完了 → 背景モードへ
      if (p >= 0.99 && stickyEl && !stickyEl.classList.contains('bg-mode')) {
        stickyEl.classList.add('bg-mode');
        resize(); // 全画面サイズに更新
      }

      // テキストオーバーレイ：ズームが進んだら（p=0.35〜0.55）フェードアップ
      if (textOverlay) {
        textOverlay.style.opacity = String(clamp01((p - 0.35) / 0.2));
      }

      // テキストボックス：p=0.7 から 0.85 にかけてフェードイン／アウト
      if (textbox) {
        textbox.style.opacity = String(clamp01((p - 0.7) / 0.35));
      }

      // 右スワイプでモデルが右へ流れる
      _printerSwipeX = lerp(_printerSwipeX, _printerSwipeTarget, 0.1);
      model.position.x = baseModelX + _printerSwipeX * 5;

      // ブルーライト周回
      const t = Date.now() * 0.0008;
      blueLight.position.set(Math.sin(t) * 5, 1, Math.cos(t) * 5);
    }

    cam.z = lerp(cam.z, camT.z, 0.05);
    cam.y = lerp(cam.y, camT.y, 0.05);
    camera.position.set(0, cam.y, cam.z);

    renderer.render(scene, camera);
  }
  animate();
}

