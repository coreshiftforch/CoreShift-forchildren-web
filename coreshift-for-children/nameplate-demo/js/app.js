/* ══════════════════════════════════════════════════════════════
   なまえプレート ― アプリ本体

   ながれ：①どだい ②なまえ ③フォント ④おおきさ ⑤うごかす ⑥たかさ ⑦いろ ⑧あな → できあがり
   ・1 unit = 1 mm（ただし「前スケール」。最後に MODEL_SCALE をかけて実寸にする）
   ・画面の状態は ぜんぶ state に入っている
   ・土台の形は shapes.js、3MF の書き出しは export3mf.js、
     URL・色・最大サイズは config.js
   ══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SHAPES, HOLE_ROUT, HOLE_RIN, makeBaseShapes, donutShape, bboxOf, solidTesterOf, shapeIconSVG } from './shapes.js';
import { build3MF, bytesToBase64 } from './export3mf.js';

const CFG = window.NAMEPLATE_CONFIG;
const IS_EVENT = !!window.IS_EVENT_MODE;
const FILAMENTS = CFG.FILAMENTS;
const $ = id => document.getElementById(id);

// ── 定数 ─────────────────────────────────────────────────────────
const MAX_CHARS = 12;
const CHAR_MIN = 10;        // 文字の大きさの最小（前スケール mm）
const CHAR_MAX = 56;
const CHAR_DEFAULT = 26;
const BASE_D = 3;           // 土台の厚さ
const CURVE_SEGS = 16;
// 平面(X/Y)と 厚み(Z)で 倍率がちがう
const MODEL_SCALE_XY = 0.325;
const MODEL_SCALE_Z  = 0.5;
// 土台のふちの面取り（角を丸めて 危なくないように）
const BASE_BEVEL_T = 0.7;
const BASE_BEVEL_S = 0.9;

// ── 印刷で消えない線の太さ ──────────────────────────────────────
// 0.4mmノズルは これより細い線を出さない＝文字の一部（とくに明朝の横線）が消える。
// 対策：①足りないぶん輪郭を太らせる ②書体ごとに 大きさの下限を上げる
const MIN_STROKE_MM    = 0.45;   // 実寸mm: 残したい いちばん細い線
const MAX_DILATE_RATIO = 0.03;   // em比: 自動で太らせる上限（片側）。これ以上は字が つぶれる
const MAX_BOLD_RATIO   = 0.022;  // em比: 本人が太くするときの上限（片側）。
                                 // ★大きくしすぎないこと。0.075 だと「あ」の穴が ぜんぶ埋まった

const DEPTH_LEVELS = [
  { depth: 1, name: 'ひくい' },
  { depth: 3, name: 'ふつう' },
  { depth: 5, name: 'たかい' },
];

// stroke = その書体の「いちばん細い線」の太さ（em比・実測値）
const FONTS = [
  { id: 'gothic', name: 'ゴシック',   file: './fonts/gothic.ttf', css: 'f-gothic', stroke: 0.053 },
  { id: 'mincho', name: 'みんちょう', file: './fonts/mincho.ttf', css: 'f-mincho', stroke: 0.025 },
  { id: 'maru',   name: 'まる',       file: './fonts/maru.ttf',   css: 'f-maru',   stroke: 0.083 },
  { id: 'pop',    name: 'ふとポップ', file: './fonts/pop.ttf',    css: 'f-pop',    stroke: 0.082 },
  { id: 'robo',   name: 'ドット',     file: './fonts/robo.ttf',   css: 'f-robo',   stroke: 0.072 },
];
const fontDef = id => FONTS.find(f => f.id === id) || FONTS[0];

const STEP_CAPS = ['どだい', 'なまえ', 'フォント', 'おおきさ', 'うごかす', 'たかさ', 'いろ', 'あな'];
const STEP_MOVE = 4, STEP_DEPTH = 5, STEP_COLOR = 6, STEP_HOLE = 7;
const LAST_STEP = STEP_CAPS.length - 1;
const DONE_PAGE = STEP_CAPS.length;        // できあがりの画面（ステップの丸には出ない）
const isCharStep = () => state.step === STEP_MOVE || state.step === STEP_DEPTH;

// ── 状態 ─────────────────────────────────────────────────────────
const state = {
  step: 0,
  shape: 'roundrect',
  baseSX: 1, baseSY: 1,          // 土台の よこ・たて倍率
  hole: 'top',                   // 'none' | 'top' | 'left' | 'right'
  fontId: 'gothic',
  charBold: 0,                   // 線をどれだけ太くするか（0〜1）
  charSize: CHAR_DEFAULT,        // 実際に使う大きさ（土台に収まるよう 自動で抑える）
  charSizeWanted: CHAR_DEFAULT,  // 本人が選んだ大きさ。土台が広がれば ここまで戻す
  chars: [],                     // { char, depth, x, y, rot, moved }
  active: 0,                     // いま さわっている文字の番号
  colorMode: '2',                // '1' | '2'
  baseColor: FILAMENTS[2].hex,
  textColor: FILAMENTS[1].hex,
};
let done = false;                // できあがりの画面を出しているか

const fontCache = {};            // id -> opentype の font
let font = null;                 // いまの書体

// ── 画面の部品 ───────────────────────────────────────────────────
const canvas      = $('canvas');
const stepsEl     = $('steps');
const panel       = $('panel');
const btnBack     = $('btnBack');
const btnNext     = $('btnNext');
const shapeGrid   = $('shapeGrid');
const sliderBaseW = $('sliderBaseW');
const sliderBaseH = $('sliderBaseH');
const charsInput  = $('charsInput');
const sliderSize  = $('sliderSize');
const sizeVal     = $('sizeVal');
const sliderBold  = $('sliderBold');
const sliderX     = $('sliderX');
const sliderY     = $('sliderY');
const sliderRot   = $('sliderRot');
const depthOpts   = $('depthOpts');
const holeOpts    = $('holeOpts');
const btnComplete = $('btnComplete');
const floatWarn   = $('floatWarn');
const celEl       = $('celebrate');

// ══════════════════════════════════════════════════════════════════
//  3Dの窓
// ══════════════════════════════════════════════════════════════════
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0a0f1e);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
camera.position.set(0, -55, 65);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.4;      // 子どもの指だと 1.0 は敏感すぎる
controls.target.set(0, 0, 3);
controls.update();

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(60, 90, 180);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x88aaff, 0.25);
fill.position.set(-80, -60, 50);
scene.add(fill);
const heroLight = new THREE.PointLight(0xfff2cc, 0, 300);   // 完成のときだけ光らせる
heroLight.position.set(0, -13, 55);
scene.add(heroLight);

const grid = new THREE.GridHelper(400, 40, 0x1e293b, 0x1e293b);
grid.rotation.x = Math.PI / 2;
grid.position.z = -0.5;
scene.add(grid);

const modelGroup = new THREE.Group();
modelGroup.scale.set(MODEL_SCALE_XY, MODEL_SCALE_XY, MODEL_SCALE_Z);
scene.add(modelGroup);

// カメラの向き：ななめ／真上（置きやすい）／横（高さが分かる）／完成の寄り
const VIEW_PERSPECTIVE = { pos: new THREE.Vector3(0, -55, 65), tgt: new THREE.Vector3(0, 0, 3) };
const VIEW_TOP         = { pos: new THREE.Vector3(0, -1, 86),  tgt: new THREE.Vector3(0, 0, 0) };
const VIEW_SIDE        = { pos: new THREE.Vector3(0, -68, 26), tgt: new THREE.Vector3(0, 0, 3) };
let camView = VIEW_PERSPECTIVE;   // いま めざしている向き
let camTween = null;
let completeAnim = null;

function viewForStep(step) {
  if (step <= 2 || step === STEP_COLOR) return VIEW_PERSPECTIVE;
  if (step === STEP_DEPTH) return VIEW_SIDE;
  return VIEW_TOP;
}
// 完成のときの寄り。プレートぜんたい（リングこみ）が 窓に入るところまで寄る。
// ★リングが左右に付くと まんなかが ずれるので、外形のまんなかを見る。
//   窓が細長い（スマホ）ときは、よこ幅が入るぶんだけ 引く。
function heroView() {
  const cx = (baseBox.minX + baseBox.maxX) / 2 * MODEL_SCALE_XY;
  const cy = (baseBox.minY + baseBox.maxY) / 2 * MODEL_SCALE_XY;
  const halfW = baseFootprint.w * MODEL_SCALE_XY / 2, halfH = baseFootprint.h * MODEL_SCALE_XY / 2;
  const tanV = Math.tan(camera.fov * Math.PI / 360);
  const dist = Math.max(halfW * 1.2 / (tanV * camera.aspect), halfH * 1.5 / tanV);
  const tgt = new THREE.Vector3(cx, cy, 3);
  const dir = new THREE.Vector3(0, -31, 36).normalize();
  return { pos: tgt.clone().addScaledVector(dir, dist), tgt };
}
function moveCameraTo(view, dur = 700) {
  camView = view;
  camTween = {
    fromPos: camera.position.clone(), toPos: view.pos.clone(),
    fromTgt: controls.target.clone(), toTgt: view.tgt.clone(),
    start: performance.now(), dur,
  };
  controls.enabled = false;   // 動いているあいだは 指の操作を止める
}
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function onResize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h || 1;
  camera.updateProjectionMatrix();
}
new ResizeObserver(onResize).observe(canvas);
onResize();

(function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  if (camTween) {
    const t = Math.min(1, (now - camTween.start) / camTween.dur);
    const e = easeInOut(t);
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
    controls.target.lerpVectors(camTween.fromTgt, camTween.toTgt, e);
    if (t >= 1) { camTween = null; controls.enabled = true; }
  }
  if (completeAnim) {
    // 完成：1回転しながら ぷるんと大きくなって 光る
    const t = Math.min(1, (now - completeAnim.start) / completeAnim.dur);
    const s = 1 + Math.sin(t * Math.PI) * 0.16;
    modelGroup.rotation.z = easeInOut(t) * Math.PI * 2;
    modelGroup.scale.set(MODEL_SCALE_XY * s, MODEL_SCALE_XY * s, MODEL_SCALE_Z * s);
    heroLight.intensity = Math.sin(t * Math.PI) * 3.2 + t * 0.9;
    if (t >= 1) {
      modelGroup.rotation.z = 0;
      modelGroup.scale.set(MODEL_SCALE_XY, MODEL_SCALE_XY, MODEL_SCALE_Z);
      heroLight.intensity = 1.3;
      const cb = completeAnim.onDone;
      completeAnim = null;
      cb();
    }
  }
  controls.update();
  renderer.render(scene, camera);
})();

// ══════════════════════════════════════════════════════════════════
//  土台
// ══════════════════════════════════════════════════════════════════
let baseMesh = null;
let baseTopZ = BASE_D;                // 土台の上面（文字を乗せる高さ）
let baseFit = 1;                      // 最大サイズに収めるための自動縮小の倍率
let baseFootprint = { w: 0, h: 0 };   // できあがりの大きさ（リングこみ・前スケール）
let baseBox = { minX: -40, maxX: 40, minY: -20, maxY: 20 };   // 文字を動かせる範囲
let baseSolid = () => true;           // (x,y) に土台があるか
let safeHalf = { x: 40, y: 20 };      // 文字を横一列に並べられる範囲

// リングを付ける向き（星だけは 左右を へこみの方向にする）
function holeDir() {
  if (state.shape === 'star' && state.hole !== 'top') {
    const a = (state.hole === 'right' ? 342 : 198) * Math.PI / 180;
    return [Math.cos(a), Math.sin(a)];
  }
  return state.hole === 'top' ? [0, 1] : state.hole === 'right' ? [1, 0] : [-1, 0];
}

// 中心から dir の向きへ進んで、いちばん外の「土台がある」ところ＝ふちを探す
function edgeAlong(shapes, dir) {
  const isSolid = solidTesterOf(shapes);
  let edge = 0;
  for (let r = 0; r <= 400; r += 0.5) if (isSolid(dir[0] * r, dir[1] * r)) edge = r;
  return edge;
}

// できあがりが最大サイズに収まる いちばん大きい倍率（リングは チェーンが通るよう 縮めない）
function fitScale(box, edge, dir) {
  const LW = CFG.PLATE_MAX_W_MM / MODEL_SCALE_XY, LH = CFG.PLATE_MAX_H_MM / MODEL_SCALE_XY;
  const fits = k => {
    let x0 = box.minX * k, x1 = box.maxX * k, y0 = box.minY * k, y1 = box.maxY * k;
    if (state.hole !== 'none') {
      const c = edge * k + HOLE_RIN + 1;
      x0 = Math.min(x0, c * dir[0] - HOLE_ROUT); x1 = Math.max(x1, c * dir[0] + HOLE_ROUT);
      y0 = Math.min(y0, c * dir[1] - HOLE_ROUT); y1 = Math.max(y1, c * dir[1] + HOLE_ROUT);
    }
    // 面取りは 輪郭より外へ ふくらむ。倍率では変わらないので いつも足す
    return x1 - x0 + 2 * BASE_BEVEL_S <= LW && y1 - y0 + 2 * BASE_BEVEL_S <= LH;
  };
  if (fits(1)) return 1;
  let lo = 0.05, hi = 1;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
  return lo;
}

// 文字を横一列に置ける範囲。SHAPES の half を目安に、土台に乗りきるところまで縮める
function measureSafeHalf() {
  const base = SHAPES.find(s => s.id === state.shape).half;
  const bx = base.x * state.baseSX * baseFit, by = base.y * state.baseSY * baseFit;
  const fits = k => {
    const hx = bx * k, hy = by * k;
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 4; j++) {
      if (!baseSolid(-hx + 2 * hx * i / 8, -hy + 2 * hy * j / 4)) return false;
    }
    return true;
  };
  if (fits(1)) return { x: bx, y: by };
  let lo = 0.08, hi = 1;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
  return { x: bx * lo, y: by * lo };
}

function disposeMesh(m) {
  modelGroup.remove(m);
  m.geometry.dispose();
  m.material.dispose();
}

function rebuildBase() {
  // ① 等倍で測る → ② 最大サイズに収まる倍率を求める → ③ その倍率で作る
  const build = k => makeBaseShapes(state.shape, state.baseSX * k, state.baseSY * k);
  const shapes1 = build(1);
  const dir = holeDir();
  const edge1 = state.hole === 'none' ? 0 : edgeAlong(shapes1, dir);
  baseFit = fitScale(bboxOf(shapes1), edge1, dir);
  const shapes = baseFit === 1 ? shapes1 : build(baseFit);

  // リングを ふちの外側にくっつける（+1 は 土台と重なって 一体になるぶん）
  if (state.hole !== 'none') {
    const c = edge1 * baseFit + HOLE_RIN + 1;
    shapes.push(donutShape(dir[0] * c, dir[1] * c));
  }
  baseBox = bboxOf(shapes);
  baseFootprint = { w: baseBox.w + 2 * BASE_BEVEL_S, h: baseBox.h + 2 * BASE_BEVEL_S };
  baseSolid = solidTesterOf(shapes);

  if (baseMesh) disposeMesh(baseMesh);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: BASE_D, curveSegments: CURVE_SEGS,
    bevelEnabled: true, bevelThickness: BASE_BEVEL_T, bevelSize: BASE_BEVEL_S,
    bevelOffset: 0, bevelSegments: 3,
  });
  baseMesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: state.baseColor }));
  geo.computeBoundingBox();
  baseTopZ = geo.boundingBox.max.z;
  modelGroup.add(baseMesh);
  safeHalf = measureSafeHalf();
}

// ══════════════════════════════════════════════════════════════════
//  文字
// ══════════════════════════════════════════════════════════════════
let charMeshes = [];        // state.chars と同じ順。字形が無い文字は 空き
let floatingChars = [];     // 土台から はみ出している文字の番号

// 輪郭を片側どれだけ太らせるか。「自動（線が消えないための下限）」と
// 「本人が足すぶん」の 大きいほうを使う
function autoDilate(size) {
  const want = MIN_STROKE_MM / MODEL_SCALE_XY;
  const now  = fontDef(state.fontId).stroke * size;
  return Math.min(Math.max(0, (want - now) / 2), size * MAX_DILATE_RATIO);
}
function dilateFor(size) {
  return Math.max(autoDilate(size), state.charBold * size * MAX_BOLD_RATIO);
}
// 「せんの ふとさ」で 実際に何mm 太くなるか（両側ぶん・表示用）
function boldMM(size) {
  return Math.max(0, dilateFor(size) - autoDilate(size)) * 2 * MODEL_SCALE_XY;
}
// この書体で「太らせても線が消えない」最小の大きさ
function minSizeForFont(id) {
  const eff = fontDef(id).stroke + 2 * MAX_DILATE_RATIO;
  return Math.max(CHAR_MIN, Math.ceil(MIN_STROKE_MM / (eff * MODEL_SCALE_XY)));
}

function pathToShapes(opPath) {
  const sp = new THREE.ShapePath();
  for (const cmd of opPath.commands) {
    switch (cmd.type) {
      case 'M': sp.moveTo(cmd.x, -cmd.y); break;
      case 'L': sp.lineTo(cmd.x, -cmd.y); break;
      case 'C': sp.bezierCurveTo(cmd.x1, -cmd.y1, cmd.x2, -cmd.y2, cmd.x, -cmd.y); break;
      case 'Q': sp.quadraticCurveTo(cmd.x1, -cmd.y1, cmd.x, -cmd.y); break;
      case 'Z': if (sp.currentPath) sp.currentPath.autoClose = true; break;
    }
  }
  return sp.toShapes(false);
}

// 太らせると「面積0の三角形」が同じ数だけできる。そのままだと 3MF が倍になり
// スライサーの修復警告も出るので 取りのぞく
function stripDegenerate(geo) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const p = [], n = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    if (b.sub(a).cross(c.sub(a)).lengthSq() < 1e-12) continue;
    for (let k = 0; k < 3; k++) {
      p.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k));
      n.push(nor.getX(i + k), nor.getY(i + k), nor.getZ(i + k));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  geo.dispose();
  return g;
}

// 輪郭の点を間引く。四すみの張り出しは残したいので、いちばん外の点は必ず入れる
function thinOutline(pts, keep = 64) {
  if (pts.length <= keep) return pts;
  const ext = ['x', 'y'].flatMap(k => {
    let lo = pts[0], hi = pts[0];
    for (const p of pts) { if (p[k] < lo[k]) lo = p; if (p[k] > hi[k]) hi = p; }
    return [lo, hi];
  });
  const step = pts.length / keep, out = [];
  for (let i = 0; i < keep; i++) out.push(pts[Math.floor(i * step)]);
  return out.concat(ext);
}

// 1文字のメッシュ（opentype の輪郭 → Shape → 押し出し）
function makeCharMesh(ch, depth) {
  if (!font) return null;
  const shapes = pathToShapes(font.getPath(ch, 0, 0, state.charSize));
  if (!shapes.length) return null;
  // 厚み・幅が0の bevel に bevelOffset を付けると「輪郭だけを外へ ふくらませる」。
  // 外は広がり 穴は同じだけ縮むので、細い線を太らせるのに そのまま使える
  const d = dilateFor(state.charSize);
  const opt = { depth, bevelEnabled: false, curveSegments: CURVE_SEGS };
  if (d > 1e-3) Object.assign(opt, {
    bevelEnabled: true, bevelThickness: 0, bevelSize: 0, bevelOffset: d, bevelSegments: 1,
  });
  let geo = new THREE.ExtrudeGeometry(shapes, opt);
  if (d > 1e-3) geo = stripDegenerate(geo);
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const dx = -(min.x + max.x) / 2, dy = -(min.y + max.y) / 2;
  geo.translate(dx, dy, 0);   // まんなか そろえ
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: state.textColor }));
  // はみ出しを調べるための輪郭の点（まんなか そろえ済み・回す前）
  const pts = [];
  for (const sh of shapes) for (const p of sh.getPoints(6)) pts.push({ x: p.x + dx, y: p.y + dy });
  mesh.userData.outline = thinOutline(pts);
  return mesh;
}

function placeChar(i) {
  const sel = state.chars[i], m = charMeshes[i];
  if (!m) return;
  m.position.set(sel.x, sel.y, baseTopZ);
  m.rotation.z = sel.rot;
}

function rebuildChar(i) {
  if (charMeshes[i]) disposeMesh(charMeshes[i]);
  const sel = state.chars[i];
  const mesh = makeCharMesh(sel.char, sel.depth);
  charMeshes[i] = mesh;
  if (!mesh) return;
  mesh.userData.charIndex = i;
  modelGroup.add(mesh);
  placeChar(i);
}

function rebuildChars() {
  for (const m of charMeshes) if (m) disposeMesh(m);
  charMeshes = [];
  state.chars.forEach((_, i) => rebuildChar(i));
  updateColors();
  updateFloatWarn();
}

function updateColors() {
  baseMesh.material.color.setHex(state.baseColor);
  const tc = state.colorMode === '2' ? state.textColor : state.baseColor;
  charMeshes.forEach((m, i) => {
    if (!m) return;
    m.material.color.setHex(tc);
    // いま さわっている文字を 少し光らせる
    m.material.emissive.setHex(i === state.active && isCharStep() && !done ? 0x2a3a55 : 0x000000);
  });
}

// i 番目の文字の「さいしょの ばしょ」（横一列に並べたとき）
function autoPos(i) {
  const n = state.chars.length;
  const step = Math.min(state.charSize * 1.05, (safeHalf.x * 2) / n);
  return { x: -step * (n - 1) / 2 + i * step, y: 0 };
}
// 手で動かしていない文字を 横一列に並べなおす
function autoLayout() {
  state.chars.forEach((sel, i) => {
    if (sel.moved) return;
    Object.assign(sel, autoPos(i), { rot: 0 });
  });
}

// 土台に収まる大きさに そろえる。基準は「本人が選んだ大きさ」なので、
// 土台を広げれば 元の大きさまで戻る。変わったら true
function clampCharSize() {
  const n = state.chars.length;
  if (!n) return false;
  const limit = Math.floor(Math.min((safeHalf.x * 2) / (n * 1.05), safeHalf.y * 1.8));
  // 線が消えない下限まで上げる。ただし 入りきらないときは はみ出させないほうを優先
  const floor = Math.min(minSizeForFont(state.fontId), Math.max(CHAR_MIN, limit));
  const s = Math.max(floor, Math.min(state.charSizeWanted, limit));
  if (s === state.charSize) return false;
  state.charSize = s;
  syncSizeUI();
  return true;
}

// 文字が土台の上に ちゃんと乗っているか（はみ出すと 宙に浮いて印刷できない）
function updateFloatWarn() {
  floatingChars = [];
  charMeshes.forEach((m, i) => {
    if (!m) return;
    const sel = state.chars[i];
    const c = Math.cos(sel.rot), s = Math.sin(sel.rot);
    for (const p of m.userData.outline) {
      if (!baseSolid(sel.x + p.x * c - p.y * s, sel.y + p.x * s + p.y * c)) { floatingChars.push(i); return; }
    }
  });
  const bad = floatingChars.length > 0;
  floatWarn.hidden = !bad;
  if (bad) {
    const names = floatingChars.map(i => state.chars[i].char).join('');
    floatWarn.textContent = `⚠「${names}」が どだいから はみだしてるよ！ 「うごかす」か「おおきさ」で なおしてね`;
  }
  refreshReady();
}

// つまみを動かしているあいだは、重い処理を 1フレームに1回だけにする
function perFrame(fn) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(); });
  };
}
const queueFloatCheck = perFrame(updateFloatWarn);

// 文字の大きさ・太さ・書体が変わったとき
function relayoutChars() {
  autoLayout();
  rebuildChars();
}

// 土台が変わったとき。文字の形は変わらないので、できるだけ作り直さない
function applyBaseChange() {
  rebuildBase();
  const resized = clampCharSize();
  for (const s of state.chars) {   // 土台の外まで飛び出さないように（手で動かした場所は残す）
    s.x = Math.max(baseBox.minX, Math.min(baseBox.maxX, s.x));
    s.y = Math.max(baseBox.minY, Math.min(baseBox.maxY, s.y));
  }
  autoLayout();
  if (resized) rebuildChars();
  else { state.chars.forEach((_, i) => placeChar(i)); updateColors(); updateFloatWarn(); }
  updateMoveRanges();
  updateBaseSizeLabel();
}

// ══════════════════════════════════════════════════════════════════
//  ① どだい
// ══════════════════════════════════════════════════════════════════
SHAPES.forEach(sh => {
  const b = document.createElement('button');
  b.className = 'shape-btn';
  b.dataset.shape = sh.id;
  b.innerHTML = shapeIconSVG(sh.id) + `<span class="nm">${sh.name}</span>`;
  b.onclick = () => { state.shape = sh.id; syncShapeUI(); applyBaseChange(); };
  shapeGrid.appendChild(b);
});
function syncShapeUI() {
  [...shapeGrid.children].forEach(c => c.classList.toggle('active', c.dataset.shape === state.shape));
}

function updateBaseSizeLabel() {
  $('baseWVal').textContent = (baseFootprint.w * MODEL_SCALE_XY).toFixed(0) + ' mm';
  $('baseHVal').textContent = (baseFootprint.h * MODEL_SCALE_XY).toFixed(0) + ' mm';
  // 上限にぶつかって自動で縮めたときは そう伝える（つまみが効かない理由になるので）
  const clamped = baseFit < 0.999;
  const hint = $('baseSizeHint');
  hint.textContent = clamped
    ? `⚠ ${CFG.PLATE_MAX_W_MM}mm × ${CFG.PLATE_MAX_H_MM}mm に おさまるよう じどうで ちいさくしたよ`
    : `できあがりは ${CFG.PLATE_MAX_W_MM}mm × ${CFG.PLATE_MAX_H_MM}mm までに おさまるよ`;
  hint.classList.toggle('warn', clamped);
}

const queueBaseChange = perFrame(applyBaseChange);
sliderBaseW.addEventListener('input', () => { state.baseSX = +sliderBaseW.value / 100; queueBaseChange(); });
sliderBaseH.addEventListener('input', () => { state.baseSY = +sliderBaseH.value / 100; queueBaseChange(); });
$('btnBaseReset').onclick = () => {
  state.baseSX = state.baseSY = 1;
  sliderBaseW.value = sliderBaseH.value = 100;
  applyBaseChange();
};

// ══════════════════════════════════════════════════════════════════
//  ② なまえ
// ══════════════════════════════════════════════════════════════════
// 使える文字：ひらがな・カタカナ（ー・ふくむ）・英字・数字・半角の記号
// （スペースは 字の形が無く 3Dの部品が作れないので 入れられない）
const ALLOWED_CHAR = /^[ぁ-ゖァ-ヶ・ー!-~]$/;
// 全角で打った記号・英数字は 半角になおす（書体には 半角の字形しか入っていない）
const WIDE_EXTRA = {
  '「': '[', '」': ']', '『': '[', '』': ']', '【': '[', '】': ']',
  '。': '.', '、': ',', '〜': '~', '　': '',
};
function normalizeChar(ch) {
  if (ch in WIDE_EXTRA) return WIDE_EXTRA[ch];
  const c = ch.codePointAt(0);
  if (c >= 0xFF01 && c <= 0xFF5E) return String.fromCodePoint(c - 0xFEE0);
  return ch;
}

function onCharsInput(value) {
  const chars = Array.from(value).map(normalizeChar)
    .filter(ch => ALLOWED_CHAR.test(ch)).slice(0, MAX_CHARS);
  // 同じ場所の同じ文字は、動かした場所や高さを そのまま残す
  state.chars = chars.map((ch, i) => {
    const prev = state.chars[i];
    return (prev && prev.char === ch) ? prev : { char: ch, depth: 3, x: 0, y: 0, rot: 0, moved: false };
  });
  state.active = Math.min(state.active, Math.max(0, chars.length - 1));
  const filtered = chars.join('');
  if (charsInput.value !== filtered) charsInput.value = filtered;
  clampCharSize();     // 文字が増えたら 収まる大きさまで 自動で小さくする
  relayoutChars();
  refreshChips();
}
// 日本語入力の変換中は 待つ（確定してから反映する）
charsInput.addEventListener('input', e => { if (!e.isComposing) onCharsInput(e.target.value); });
charsInput.addEventListener('compositionend', e => onCharsInput(e.target.value));

// ══════════════════════════════════════════════════════════════════
//  ③ フォント
// ══════════════════════════════════════════════════════════════════
function renderFontPanel() {
  const list = $('fontList');
  list.innerHTML = '';
  FONTS.forEach(f => {
    const b = document.createElement('button');
    b.className = 'font-btn' + (state.fontId === f.id ? ' active' : '');
    b.disabled = !fontCache[f.id];
    b.innerHTML = `<span class="sample" style="font-family:'${f.css}'">あいうA</span><span class="nm">${f.name}</span>`;
    b.onclick = () => {
      state.fontId = f.id;
      font = fontCache[f.id];
      renderFontPanel();
      updateSizeRange();   // 書体で「線が消えない下限」が変わる
      clampCharSize();
      relayoutChars();
    };
    list.appendChild(b);
  });
}

async function loadFonts() {
  await Promise.all(FONTS.map(async f => {
    try {
      const res = await fetch(f.file);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      fontCache[f.id] = opentype.parse(await res.arrayBuffer());
    } catch (e) { console.error('フォントを読めません:', f.id, e); }
  }));
  font = fontCache[state.fontId] || Object.values(fontCache)[0] || null;
  // 読めたときは 何も出さない。困ったときだけ知らせる
  $('fontStatus').textContent = font ? '' : '⚠ フォントを よみこめません（サーバーけいゆで ひらいてください）';
  renderFontPanel();
  rebuildChars();
}

// ══════════════════════════════════════════════════════════════════
//  ④ おおきさ
// ══════════════════════════════════════════════════════════════════
function syncSizeUI() {
  sliderSize.value = state.charSize;
  sizeVal.textContent = (state.charSize * MODEL_SCALE_XY).toFixed(1) + ' mm';
  const mm = boldMM(state.charSize);
  $('boldVal').textContent = mm < 0.01 ? 'そのまま' : '＋' + mm.toFixed(2) + ' mm';
}
// 細い書体ほど 下限を上げる（下げても 線が消えて印刷できないため）
function updateSizeRange() {
  const lo = minSizeForFont(state.fontId);
  sliderSize.min = lo;
  sliderSize.max = CHAR_MAX;
  if (state.charSizeWanted < lo) state.charSizeWanted = lo;
  $('sizeHint').textContent = lo > CHAR_MIN
    ? `「${fontDef(state.fontId).name}」は せんが ほそいので ${(lo * MODEL_SCALE_XY).toFixed(1)}mm より おおきくするよ`
    : '';
}
const queueRelayout = perFrame(relayoutChars);
sliderSize.addEventListener('input', () => {
  state.charSize = state.charSizeWanted = parseInt(sliderSize.value);
  syncSizeUI();
  queueRelayout();
});
// ★細くする向きは無い。自動の下限が いつも効いていて、ここは そこから太くするだけ
sliderBold.addEventListener('input', () => {
  state.charBold = parseInt(sliderBold.value) / 100;
  syncSizeUI();
  queueRelayout();   // 線が太ると 字の幅も変わるので 並べなおす
});

// ══════════════════════════════════════════════════════════════════
//  ⑤ うごかす ／ ⑥ たかさ（文字を1つずつ えらんで さわる）
// ══════════════════════════════════════════════════════════════════
function selectChar(i) {
  state.active = i;
  refreshChips();
  syncCharUI();
  updateColors();
}

function refreshChips() {
  document.querySelectorAll('.char-chips').forEach(box => {
    box.innerHTML = '';
    if (!state.chars.length) {
      box.innerHTML = '<span class="chips-empty">さきに ②で なまえを いれてね</span>';
      return;
    }
    state.chars.forEach((sel, i) => {
      const c = document.createElement('button');
      c.className = 'char-chip' + (i === state.active ? ' active' : '');
      c.textContent = sel.char;
      c.onclick = () => selectChar(i);
      box.appendChild(c);
    });
  });
}

// えらんでいる文字の値を つまみに映す
function syncCharUI() {
  const sel = state.chars[state.active];
  [...depthOpts.children].forEach(c => c.classList.toggle('active', !!sel && +c.dataset.depth === sel.depth));
  if (!sel) return;
  const deg = Math.round(sel.rot * 180 / Math.PI);
  sliderX.value = sel.x;
  sliderY.value = sel.y;
  sliderRot.value = deg;
  $('rotVal').textContent = deg + '°';
}

// 土台の上なら どこへでも動かせる（はみ出したら 警告が出るので、範囲では しばらない）
function updateMoveRanges() {
  sliderX.min = Math.floor(baseBox.minX); sliderX.max = Math.ceil(baseBox.maxX);
  sliderY.min = Math.floor(baseBox.minY); sliderY.max = Math.ceil(baseBox.maxY);
  syncCharUI();
}

function moveActive(change) {
  const sel = state.chars[state.active];
  if (!sel) return;
  change(sel);
  sel.moved = true;
  placeChar(state.active);
  queueFloatCheck();
}
sliderX.addEventListener('input', () => moveActive(sel => { sel.x = parseFloat(sliderX.value); }));
sliderY.addEventListener('input', () => moveActive(sel => { sel.y = parseFloat(sliderY.value); }));
sliderRot.addEventListener('input', () => moveActive(sel => {
  sel.rot = parseFloat(sliderRot.value) * Math.PI / 180;
  $('rotVal').textContent = sliderRot.value + '°';
}));
$('btnMoveReset').onclick = () => {
  const i = state.active, sel = state.chars[i];
  if (!sel) return;
  Object.assign(sel, autoPos(i), { rot: 0, moved: false });
  placeChar(i);
  syncCharUI();
  updateFloatWarn();
};

DEPTH_LEVELS.forEach(lv => {
  const b = document.createElement('button');
  b.className = 'opt-btn';
  b.dataset.depth = lv.depth;
  b.innerHTML = `${lv.name}<small>${(lv.depth * MODEL_SCALE_Z).toFixed(1)}mm</small>`;
  b.onclick = () => {
    const sel = state.chars[state.active];
    if (!sel) return;
    sel.depth = lv.depth;
    rebuildChar(state.active);
    updateColors();
    syncCharUI();
  };
  depthOpts.appendChild(b);
});

// 3Dの窓の文字を タップして えらぶ（指を動かしたときは 回す操作なので 無視）
const raycaster = new THREE.Raycaster();
let downPos = null;
canvas.addEventListener('pointerdown', e => { downPos = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', e => {
  const st = downPos;
  downPos = null;
  if (!st || Math.hypot(e.clientX - st.x, e.clientY - st.y) > 6 || !isCharStep() || done) return;
  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(charMeshes.filter(Boolean), false)[0];
  if (hit) selectChar(hit.object.userData.charIndex);
});

// ══════════════════════════════════════════════════════════════════
//  ⑦ いろ
// ══════════════════════════════════════════════════════════════════
const hexStr = hex => '#' + hex.toString(16).padStart(6, '0');
const filamentOf = hex => FILAMENTS.find(f => f.hex === hex) || FILAMENTS[0];

function syncColorUI() {
  const two = state.colorMode === '2';
  document.querySelectorAll('#colorModeSeg button').forEach(b => b.classList.toggle('active', b.dataset.mode === state.colorMode));
  $('textColorBlock').hidden = !two;
  $('baseColorTitle').textContent = two ? 'どだいの いろ' : 'ぜんたいの いろ';
  for (const which of ['base', 'text']) {
    const hex = state[which + 'Color'];
    $(which + 'Swatch').style.background = hexStr(hex);
    $(which + 'ColorName').textContent = filamentOf(hex).name;
    document.querySelectorAll(`[data-colors="${which}"] .color-btn`).forEach(b => b.classList.toggle('active', +b.dataset.hex === hex));
  }
}
for (const which of ['base', 'text']) {
  const box = document.querySelector(`[data-colors="${which}"]`);
  FILAMENTS.forEach(f => {
    const b = document.createElement('button');
    b.className = 'color-btn';
    b.dataset.hex = f.hex;
    b.style.background = hexStr(f.hex);
    b.title = f.name;
    b.onclick = () => { state[which + 'Color'] = f.hex; syncColorUI(); updateColors(); };
    box.appendChild(b);
  });
}
document.querySelectorAll('#colorModeSeg button').forEach(btn => {
  btn.onclick = () => { state.colorMode = btn.dataset.mode; syncColorUI(); updateColors(); };
});

// ══════════════════════════════════════════════════════════════════
//  ⑧ あな → かんせい
// ══════════════════════════════════════════════════════════════════
function syncHoleUI() {
  [...holeOpts.children].forEach(c => c.classList.toggle('active', c.dataset.hole === state.hole));
}
holeOpts.querySelectorAll('button').forEach(btn => {
  btn.onclick = () => {
    const oldFit = baseFit;
    state.hole = btn.dataset.hole;
    syncHoleUI();
    rebuildBase();   // リングを付けなおす（最大サイズに収めるため 土台が縮むことがある）
    // ★土台の縮みぐあいが変わったら、文字の場所と大きさも 同じ割合で合わせる。
    //   これをしないと 土台だけ小さくなって 文字が はみ出す
    const k = baseFit / oldFit;
    if (Math.abs(k - 1) > 1e-4) {
      for (const s of state.chars) { s.x *= k; s.y *= k; }
      state.charSize = Math.max(minSizeForFont(state.fontId), state.charSize * k);
      syncSizeUI();
    }
    applyBaseChange();
    rebuildChars();
  };
});

// かんせいを押せるか。押せないときは 理由を出す
function refreshReady() {
  let why = '';
  if (!font) why = 'フォントを よみこみ中…';
  else if (!state.chars.length) why = '②で なまえを いれてね';
  else if (floatingChars.length) why = 'もじが どだいから はみだしてるよ';
  btnComplete.disabled = !!why;
  $('completeHint').textContent = why;
}

// 完成の演出（放射の光・キラキラ・紙ふぶき・できた！）
function spawnCelebration() {
  const add = (cls, text) => {
    const el = document.createElement('div');
    el.className = cls;
    if (text) el.textContent = text;
    celEl.appendChild(el);
    return el;
  };
  celEl.innerHTML = '';
  celEl.className = 'on';
  add('cel-rays'); add('cel-flash'); add('cel-text', '✨ できた！ ✨');
  const marks = ['✨', '⭐', '🌟', '💫'];
  for (let i = 0; i < 18; i++) {
    const s = add('cel-spark', marks[i % marks.length]);
    const ang = Math.random() * Math.PI * 2, dist = 110 + Math.random() * 200;
    s.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
    s.style.setProperty('--dy', Math.round(Math.sin(ang) * dist) + 'px');
    s.style.animationDelay = Math.round(Math.random() * 180) + 'ms';
  }
  const cols = ['#ffd166', '#ff8fab', '#06d6a0', '#4cc9f0', '#f7b267', '#b5179e'];
  for (let i = 0; i < 30; i++) {
    const c = add('cel-confetti');
    c.style.left = (Math.random() * 100) + '%';
    c.style.background = cols[i % cols.length];
    c.style.setProperty('--fall', (60 + Math.random() * 40) + 'vh');
    c.style.setProperty('--spin', Math.round(Math.random() * 720 - 360) + 'deg');
    c.style.animationDelay = Math.round(Math.random() * 260) + 'ms';
  }
  clearTimeout(celEl._t1); clearTimeout(celEl._t2);
  celEl._t1 = setTimeout(() => celEl.classList.add('fade'), 1750);
  celEl._t2 = setTimeout(clearCelebration, 2150);
}
function clearCelebration() {
  clearTimeout(celEl._t1); clearTimeout(celEl._t2);
  celEl.className = '';
  celEl.innerHTML = '';
}

btnComplete.onclick = () => {
  if (completeAnim) return;
  btnComplete.disabled = true;
  spawnCelebration();
  completeAnim = { start: performance.now(), dur: 1900, onDone: showDone };
  moveCameraTo(heroView(), 1900);
};

// ══════════════════════════════════════════════════════════════════
//  できあがりの画面
// ══════════════════════════════════════════════════════════════════
// ファイル名に使えない記号（Windows / Googleドライブ）は 全角の似た字に置きかえる
const FILE_SAFE = { '\\': '￥', '/': '／', ':': '：', '*': '＊', '?': '？', '"': '”', '<': '＜', '>': '＞', '|': '｜' };
const printTextColor = () => state.colorMode === '2' ? state.textColor : state.baseColor;
// ファイル名：<なまえ>_名<文字の色>_土<土台の色>（受けとった Apps Script が 日時を足す）
function plateFileBase() {
  const name = state.chars.map(s => FILE_SAFE[s.char] ?? s.char).join('') || 'nameplate';
  return `${name}_名${filamentOf(printTextColor()).short}_土${filamentOf(state.baseColor).short}`;
}

function showDone() {
  done = true;
  updateColors();   // えらんでいる文字の光を消す
  const mm = v => (v * MODEL_SCALE_XY).toFixed(1);
  const rows = [
    ['なまえ', state.chars.map(c => c.char).join('')],
    ['おおきさ', `${mm(baseFootprint.w)} × ${mm(baseFootprint.h)} mm`],
    ['もじの おおきさ', `${mm(state.charSize)} mm`],
    ['いろ', state.colorMode === '2' ? '2しょく（どだいと もじを わけて つくる）' : '1しょく'],
  ];
  const info = $('doneInfo');
  info.innerHTML = '';
  for (const [k, v] of rows) {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = k; dd.textContent = v;
    info.append(dt, dd);
  }
  $('doneEvent').hidden = !IS_EVENT;
  $('doneDemo').hidden = IS_EVENT;
  $('btnSubmit').disabled = false;
  setSubmitMsg('', '');
  showPage(DONE_PAGE);
}

function leaveDone() {
  done = false;
  completeAnim = null;
  modelGroup.rotation.z = 0;
  modelGroup.scale.set(MODEL_SCALE_XY, MODEL_SCALE_XY, MODEL_SCALE_Z);
  heroLight.intensity = 0;
  clearCelebration();
}

function setSubmitMsg(text, kind) {
  const el = $('submitMsg');
  el.textContent = text;
  el.className = 'status-msg ' + kind;
}

/* 3mf を Apps Script へ送る（保存先のフォルダは あちらが決める）。
   ★mode:'no-cors' なので、届いたかどうかの返事は 読めない。
     ここで分かるのは「送りだせたか」まで。届いたかは ドライブで確かめる。 */
$('btnSubmit').onclick = async () => {
  const btn = $('btnSubmit');
  btn.disabled = true;
  setSubmitMsg('おくっています…', '');
  try {
    modelGroup.updateMatrixWorld(true);
    const bytes = build3MF({ baseMesh, charMeshes, baseColor: state.baseColor, textColor: printTextColor() });
    await fetch(CFG.SUBMIT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ name: plateFileBase(), stl: bytesToBase64(bytes) }),
    });
    setSubmitMsg('✓ おくりました！ スタッフに こえを かけてね 🎉', 'ok');
  } catch (e) {
    console.error(e);
    setSubmitMsg('⚠ おくれませんでした。でんぱを たしかめて もういちど おしてね', 'err');
    btn.disabled = false;
  }
};

// ══════════════════════════════════════════════════════════════════
//  ステップの切りかえ
// ══════════════════════════════════════════════════════════════════
STEP_CAPS.forEach((cap, i) => {
  const b = document.createElement('button');
  b.className = 'step-dot';
  b.innerHTML = `<span class="num">${i + 1}</span><span class="cap">${cap}</span>`;
  b.onclick = () => goStep(i);
  stepsEl.appendChild(b);
});

function showPage(page) {
  document.querySelectorAll('.step-page').forEach(p => p.classList.toggle('active', +p.dataset.page === page));
  [...stepsEl.children].forEach((dot, i) => {
    dot.classList.toggle('active', i === page);
    dot.classList.toggle('done', i < page);
  });
  const isDone = page === DONE_PAGE;
  btnBack.disabled = page === 0;
  btnBack.textContent = isDone ? '◀ もどって なおす' : '◀ もどる';
  btnNext.hidden = page >= LAST_STEP;
  panel.scrollTop = 0;   // 前の段で 下まで転がしていても、見出しから始まるように
}

function goStep(i) {
  const wasDone = done;
  if (wasDone) leaveDone();
  state.step = Math.max(0, Math.min(LAST_STEP, i));
  showPage(state.step);
  if (isCharStep()) { refreshChips(); syncCharUI(); }
  updateColors();
  refreshReady();
  const want = viewForStep(state.step);
  if (want !== camView || wasDone) moveCameraTo(want);
}

btnBack.onclick = () => goStep(done ? LAST_STEP : state.step - 1);
btnNext.onclick = () => {
  if (state.step === 1 && !state.chars.length) { charsInput.focus(); return; }
  goStep(state.step + 1);
};

// ══════════════════════════════════════════════════════════════════
//  はじめる
// ══════════════════════════════════════════════════════════════════
if (IS_EVENT) {
  $('appTitle').textContent = '🪪 なまえプレート（イベント会場用）';
  document.title = 'なまえプレート（イベント会場用）｜ CoreShift for children';
}
rebuildBase();
syncShapeUI();
updateBaseSizeLabel();
updateMoveRanges();
updateSizeRange();
syncSizeUI();
syncColorUI();
syncHoleUI();
refreshChips();
renderFontPanel();
goStep(0);
loadFonts();
