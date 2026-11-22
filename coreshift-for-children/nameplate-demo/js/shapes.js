/* ══════════════════════════════════════════════════════════════
   土台の形

   単位は「前スケール」の mm（app.js が最後に MODEL_SCALE_XY をかける）。
   形を足すときは SHAPES に1行と、makeBaseShapes に1つ分岐を足す。
   選ぶボタンの絵は ここの形から自動で作るので、別に描かなくてよい。
   ══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

/* half … 文字を横一列に並べられる範囲の目安（土台の内側の およそ半分・mm） */
export const SHAPES = [
  { id: 'roundrect', name: 'しかく',     half: { x: 72, y: 34 } },
  { id: 'square',    name: 'ましかく',   half: { x: 40, y: 40 } },
  { id: 'longrect',  name: 'ながしかく', half: { x: 75, y: 19 } },
  { id: 'circle',    name: 'まる',       half: { x: 42, y: 42 } },
  { id: 'ellipse',   name: 'たまご',     half: { x: 62, y: 38 } },
  { id: 'hexagon',   name: 'ろっかく',   half: { x: 46, y: 40 } },
  { id: 'heart',     name: 'ハート',     half: { x: 40, y: 26 } },
  { id: 'star',      name: 'ほし',       half: { x: 36, y: 30 } },
  { id: 'cloud',     name: 'くも',       half: { x: 58, y: 22 } },
  { id: 'fish',      name: 'さかな',     half: { x: 44, y: 24 } },
  { id: 'cat',       name: 'ねこ',       half: { x: 40, y: 26 } },
  { id: 'car',       name: 'くるま',     half: { x: 60, y: 15 } },
  { id: 'bubble',    name: 'ふきだし',   half: { x: 64, y: 32 } },
  { id: 'onigiri',   name: 'おにぎり',   half: { x: 34, y: 22 } },
  { id: 'flower',    name: 'はな',       half: { x: 34, y: 30 } },
  { id: 'clover',    name: 'クローバー', half: { x: 46, y: 18 } },
  { id: 'ribbon',    name: 'リボン',     half: { x: 56, y: 24 } },
  { id: 'train',     name: 'でんしゃ',   half: { x: 62, y: 22 } },
  { id: 'web',       name: 'くものす',   half: { x: 36, y: 26 } },
];

/* ボールチェーン用のリング（前スケール mm）。大きさは どの土台でも同じ */
export const HOLE_ROUT = 13.85;  // 外側の半径
export const HOLE_RIN  = 6.23;   // 穴の半径

export function donutShape(cx, cy) {
  const outer = new THREE.Shape();
  outer.absarc(cx, cy, HOLE_ROUT, 0, Math.PI * 2, false);
  const inner = new THREE.Path();
  inner.absarc(cx, cy, HOLE_RIN, 0, Math.PI * 2, true);
  outer.holes.push(inner);
  return outer;
}

/* 頂点の配列から「角を丸めた」シェイプを作る（星・ハートの とがり対策）。
   半径は 隣の辺の長さの半分までに 自動で抑える。 */
function roundedPolyShape(verts, radiusFn) {
  const n = verts.length;
  const s = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n], cur = verts[i], next = verts[(i + 1) % n];
    const toPrev = prev.clone().sub(cur), toNext = next.clone().sub(cur);
    const rr = Math.min(radiusFn(i), toPrev.length() * 0.5, toNext.length() * 0.5);
    const a = cur.clone().add(toPrev.setLength(rr));
    const b = cur.clone().add(toNext.setLength(rr));
    if (i === 0) s.moveTo(a.x, a.y); else s.lineTo(a.x, a.y);
    s.quadraticCurveTo(cur.x, cur.y, b.x, b.y);
  }
  s.closePath();
  return s;
}

/* 土台のシェイプ（THREE.Shape[]）を作る。sx・sy は よこ・たての倍率。
   複数のシェイプを返す形（くも・さかな等）は、重なりを スライサーが
   まとめて ひとつの部品にする。 */
export function makeBaseShapes(id, sx = 1, sy = 1) {
  const P = (x, y) => [x * sx, y * sy];
  const R = r => r * Math.min(sx, sy);          // 角丸は つぶれない側に合わせる
  const poly = (pts, r) => roundedPolyShape(
    pts.map(p => new THREE.Vector2(...P(p[0], p[1]))),
    typeof r === 'function' ? r : () => R(r));
  const rect = (w, h, r, cx = 0, cy = 0) => poly([
    [cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2],
    [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2],
  ], r);
  const ell = (cx, cy, rx, ry) => {
    const s = new THREE.Shape();
    s.absellipse(...P(cx, cy), rx * sx, ry * sy, 0, Math.PI * 2, false, 0);
    return s;
  };

  switch (id) {
    case 'roundrect': return [rect(158, 90, 16)];
    case 'square':    return [rect(112, 112, 18)];
    case 'longrect':  return [rect(170, 52, 16)];
    case 'circle':    return [ell(0, 0, 56, 56)];
    case 'ellipse':   return [ell(0, 0, 84, 58)];

    case 'hexagon': {
      // 上下が水平な辺＝文字を乗せやすい向き
      const verts = [];
      for (let i = 0; i < 6; i++) verts.push([Math.cos(i * Math.PI / 3) * 62, Math.sin(i * Math.PI / 3) * 62]);
      return [poly(verts, 12)];
    }
    case 'heart': {
      // ベジェ曲線のハート。元データは y が下向きなので 反転＋中央寄せ（+2）してから4倍
      const s = new THREE.Shape();
      const H = (x, y) => P(x * 4, (-y + 2) * 4);
      s.moveTo(...H(-1, 17.2));
      s.bezierCurveTo(...H(-6, 10), ...H(-16, 8), ...H(-16, -2));
      s.bezierCurveTo(...H(-16, -10), ...H(-8, -14), ...H(0, -6));
      s.bezierCurveTo(...H(8, -14), ...H(16, -10), ...H(16, -2));
      s.bezierCurveTo(...H(16, 8), ...H(6, 10), ...H(1, 17.2));
      s.quadraticCurveTo(...H(0, 18), ...H(-1, 17.2));   // 下の先っぽを軽く丸める
      return [s];
    }
    case 'star': {
      // 外側の とがりを大きめ、内側の くぼみを小さめに丸める
      const verts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 74 : 34, a = Math.PI / 2 + i * Math.PI / 5;
        verts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return [poly(verts, i => R(i % 2 === 0 ? 16 : 11))];
    }
    case 'cloud': {
      const shapes = [rect(118, 44, 22)];
      for (const [cx, cy, br] of [[-60, -2, 18], [-34, 12, 24], [2, 18, 28], [38, 12, 25], [62, -2, 18]])
        shapes.push(ell(cx, cy, br, br));
      return shapes;
    }
    // からだ＋しっぽ。しっぽは太めにして折れないように
    case 'fish': return [ell(8, 0, 62, 40), poly([[-28, 0], [-80, 36], [-80, -36]], 10)];
    // かお＋みみ2つ。みみの先は丸めて厚みを確保する
    case 'cat': return [ell(0, -4, 56, 48),
                        poly([[-50, 8], [-34, 56], [-6, 24]], 7),
                        poly([[50, 8], [34, 56], [6, 24]], 7)];
    // ボディ＋うわぶぶん＋タイヤ2つ
    case 'car': return [rect(152, 46, 14, 0, 2), rect(84, 42, 14, -8, 32),
                        ell(-46, -26, 21, 21), ell(46, -26, 21, 21)];
    // 角丸四角＋左下のしっぽ
    case 'bubble': return [rect(154, 86, 26, 0, 8), poly([[-46, -26], [-58, -74], [-6, -30]], 6)];
    case 'onigiri': return [poly([[0, 60], [-64, -44], [64, -44]], 22)];
    // 車輪を等間隔に並べると ただの波形に見えるので、2組に分けて間をあける
    case 'train': return [rect(160, 76, 14, 0, 6),
                          ell(-60, -30, 17, 17), ell(-30, -30, 17, 17),
                          ell(30, -30, 17, 17), ell(60, -30, 17, 17)];
    case 'web': {
      // 外に8つの とがり、あいだを内側へ へこませた形。細い糸は印刷できないので 板で表す
      const s = new THREE.Shape(), n = 8, rad = 66, dipK = 0.7;
      const tip = i => { const a = Math.PI / 2 + i * Math.PI * 2 / n; return P(Math.cos(a) * rad, Math.sin(a) * rad); };
      const dip = i => { const a = Math.PI / 2 + (i + 0.5) * Math.PI * 2 / n; return P(Math.cos(a) * rad * dipK, Math.sin(a) * rad * dipK); };
      s.moveTo(...tip(0));
      for (let i = 0; i < n; i++) s.quadraticCurveTo(...dip(i), ...tip(i + 1));
      return [s];
    }
    case 'flower': {
      const shapes = [ell(0, 0, 30, 30)];
      for (let i = 0; i < 5; i++) {
        const a = Math.PI / 2 + i * Math.PI * 2 / 5;
        shapes.push(ell(Math.cos(a) * 38, Math.sin(a) * 38, 27, 27));
      }
      return shapes;
    }
    case 'clover': {
      // 葉は上下左右に置く（上が2つに割れていると リングが葉に埋もれるため）
      const shapes = [rect(48, 48, 12)];
      for (const [cx, cy] of [[0, 36], [0, -36], [-36, 0], [36, 0]]) shapes.push(ell(cx, cy, 30, 30));
      return shapes;
    }
    // わの内側は とがらせず、太いまま むすびめの中まで差しこむ（細いと印刷後に折れる）
    case 'ribbon': return [rect(48, 56, 10),
                           poly([[-12, -28], [-78, -40], [-78, 40], [-12, 28]], 10),
                           poly([[12, 28], [78, 40], [78, -40], [12, -28]], 10)];
  }
  return [ell(0, 0, 50, 50)];
}

/* シェイプ群の外形 */
export function bboxOf(shapes) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of shapes) for (const p of s.getPoints(48)) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/* 「(x,y) に土台があるか」を答える関数を作る */
export function solidTesterOf(shapes) {
  const outlines = shapes.map(s => ({
    outer: s.getPoints(64),
    holes: (s.holes || []).map(h => h.getPoints(24)),
  }));
  return (x, y) => outlines.some(o =>
    pointInPoly(x, y, o.outer) && !o.holes.some(h => pointInPoly(x, y, h)));
}

/* 選ぶボタンの絵（SVG）。本物の形から作るので、形を直しても ずれない */
export function shapeIconSVG(id) {
  const VW = 46, VH = 40, PAD = 2.5;
  const polys = makeBaseShapes(id).map(s => s.getPoints(8));
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of polys) for (const q of p) {
    x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x);
    y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
  }
  const k = Math.min((VW - 2 * PAD) / (x1 - x0), (VH - 2 * PAD) / (y1 - y0));
  const ox = (VW - (x1 - x0) * k) / 2, oy = (VH - (y1 - y0) * k) / 2;
  const paths = polys.map(p => {
    let d = '', last = '';
    for (const q of p) {
      const X = +((q.x - x0) * k + ox).toFixed(1);
      const Y = +(VH - ((q.y - y0) * k + oy)).toFixed(1);   // SVGは y が下向き
      const cur = X + ' ' + Y;
      if (cur === last) continue;
      d += (d ? 'L' : 'M') + cur;
      last = cur;
    }
    return `<path class="fill" d="${d}Z"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${VW} ${VH}">${paths}</svg>`;
}
