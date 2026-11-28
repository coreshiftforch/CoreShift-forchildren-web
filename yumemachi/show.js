// 夢のまち：発表用の端末だけの演出（?show=1 で開いた端末だけ読みこむ。スマホには入らない）
//  1. できあがり：建物のグループ（Blender のコレクション）が、下から光りながら1つずつ現れる
//  2. 見どころ：はじめは空。建物をタップして、自分たちで名前を書きこめる（この端末に保存）
//  3. 住民：建物の床や台の上を、小さな人が歩いたり手をふったりする
export function start(ctx) {
  const { THREE, scene, camera, controls, renderer, model, el, B, flyTo, setSpin, TICK, toT, fromT } = ctx;
  const card = document.getElementById("card");
  renderer.localClippingEnabled = true;

  // ---------- 下から組み上がる（建物まるごと、1まいの面で下から見せていく） ----------
  const all = new THREE.Box3().setFromObject(model);
  const H = all.max.y - all.min.y, R = Math.max(all.max.x - all.min.x, all.max.z - all.min.z) / 2;
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), all.max.y + 1);
  model.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [plane]; o.material.clipShadows = true; } });

  // ---------- 光のつぶ ----------
  const N = 1600, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N), col = new Float32Array(N * 3);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.3, "rgba(255,255,255,.8)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: Math.max(2.2, R * 0.035), map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; scene.add(pts);
  let pi = 0;
  const PAL = [0xfff2a8, 0xffc4e1, 0xa8e6ff, 0xc2ffb8, 0xffffff].map(c => new THREE.Color(c));
  function emit(x, y, z, n, spread, up) {
    for (let k = 0; k < n; k++) {
      const i = pi++ % N, a = Math.random() * Math.PI * 2, s = Math.random() * spread;
      pos.set([x + Math.cos(a) * s, y, z + Math.sin(a) * s], i * 3);
      vel.set([Math.cos(a) * (0.02 + Math.random() * 0.05) * R, (Math.random() * up + 0.02) * R, Math.sin(a) * (0.02 + Math.random() * 0.05) * R], i * 3);
      life[i] = 1; const c = PAL[(Math.random() * PAL.length) | 0]; col.set([c.r, c.g, c.b], i * 3);
    }
  }
  // 地面の光の輪
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = all.min.y + 0.3; scene.add(ring);

  // ---------- できあがり ----------
  const toast = document.createElement("div"); toast.className = "toast"; el.parentElement.appendChild(toast);
  let build = null;
  const DUR = 5500;
  function startBuild() { plane.constant = all.min.y - 0.5; build = { t0: performance.now() }; setSpin(true); ring.userData.t0 = performance.now(); }
  function tickBuild(now) {
    if (!build) return;
    const k = Math.min(1, (now - build.t0) / DUR), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const y = all.min.y - 0.5 + (H + 1.5) * e;
    plane.constant = y;
    const cx = (all.min.x + all.max.x) / 2, cz = (all.min.z + all.max.z) / 2;
    if (k < 1) emit(cx, y, cz, 14, R * 0.9, 0.03);
    else {                                       // できあがり：花火
      for (let i = 0; i < 8; i++) emit(all.min.x + Math.random() * (all.max.x - all.min.x), all.max.y, all.min.z + Math.random() * (all.max.z - all.min.z), 60, R * 0.1, 0.12);
      toast.textContent = `${B.name}、できあがり！`; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 2600);
      build = null;
    }
  }
  function tickFx(now, dt) {
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt * 0.9;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      vel[i * 3 + 1] -= 0.04 * R * dt;
      const f = Math.max(0, life[i]); col[i * 3] *= 0.985 + 0.015 * f; col[i * 3 + 1] *= 0.985 + 0.015 * f; col[i * 3 + 2] *= 0.985 + 0.015 * f;
      if (life[i] <= 0) pos[i * 3 + 1] = -1e5;
    }
    pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
    const t = (now - (ring.userData.t0 || -1e9)) / 1000;
    ring.material.opacity = build ? 0.55 + 0.25 * Math.sin(now / 200) : Math.max(0, 0.8 - t * 0.2);
    const s = R * (1.05 + 0.08 * Math.sin(now / 400)); ring.scale.set(s, s, s);
  }

  // ---------- 住民 ----------
  const people = [];
  const ray = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0);
  const solids = []; model.traverse(o => { if (o.isMesh && !(o.material.transparent && o.material.opacity < 0.9)) solids.push(o); });
  const groundY = all.min.y;
  function floorAt(x, z, fromY) {                 // 上から光線を落として、立てる面（上向き）をさがす
    ray.set(new THREE.Vector3(x, fromY, z), DOWN); ray.far = fromY - groundY + 2;
    const h = ray.intersectObjects(solids, false).find(h => h.face && h.face.normal.clone().transformDirection(h.object.matrixWorld).y > 0.85);
    return h ? h.point.y : null;
  }
  const PH = Math.max(7, H * 0.045);              // 人の背の高さ（mm）
  const SKIN = [0xf3d2b5, 0xe0b08a, 0xc68c64], CLOTH = [0xe8afcf, 0xa3d8e1, 0xc2e189, 0xf7d959, 0xae96d4, 0xf99963, 0xffffff];
  function makePerson() {
    const p = new THREE.Group();
    const m = c => new THREE.MeshStandardMaterial({ color: c, roughness: .7 });
    const cloth = m(CLOTH[(Math.random() * CLOTH.length) | 0]);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(PH * 0.17, PH * 0.32, 4, 10), cloth); body.position.y = PH * 0.48;
    const head = new THREE.Mesh(new THREE.SphereGeometry(PH * 0.17, 14, 10), m(SKIN[(Math.random() * 3) | 0])); head.position.y = PH * 0.88;
    const legs = [-1, 1].map(s => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(PH * 0.06, PH * 0.2, 3, 6), m(0x5b6378)); l.position.set(s * PH * 0.08, PH * 0.16, 0); p.add(l); return l; });
    const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * PH * 0.22, PH * 0.66, 0);
      const am = new THREE.Mesh(new THREE.CapsuleGeometry(PH * 0.05, PH * 0.22, 3, 6), cloth); am.position.y = -PH * 0.14; a.add(am); p.add(a); return a; });
    p.add(body, head); p.traverse(o => { if (o.isMesh) o.castShadow = true; });
    p.userData = { legs, arms, dir: Math.random() * Math.PI * 2, sp: PH * (0.35 + Math.random() * 0.35), wave: 0, ph: Math.random() * 9 };
    return p;
  }
  function place(p, tries = 40) {
    for (let k = 0; k < tries; k++) {
      const out = Math.random() < 0.35;              // まわりの広場か、建物の床の上
      const a = Math.random() * Math.PI * 2, rr = out ? R * (0.95 + Math.random() * 0.35) : R * Math.random() * 0.95;
      const x = (all.min.x + all.max.x) / 2 + Math.cos(a) * rr, z = (all.min.z + all.max.z) / 2 + Math.sin(a) * rr;
      const y = out ? groundY : floorAt(x, z, all.max.y + 5);
      if (y === null) continue;
      if (out && floorAt(x, z, all.max.y + 5) > groundY + 1) continue;    // 建物の下には立たない
      p.position.set(x, y, z); p.userData.out = out; return true;
    }
    return false;
  }
  // 入口：正面（three.js の +z）の地面近くから建物に向けて光線を当てた所。なければ正面のまん中
  const CX = (all.min.x + all.max.x) / 2, CZ = (all.min.z + all.max.z) / 2;
  const doors = [];
  [0, -0.25, 0.25, -0.5, 0.5].forEach(f => {
    ray.set(new THREE.Vector3(CX + f * R, groundY + PH * 0.5, all.max.z + R), new THREE.Vector3(0, 0, -1)); ray.far = R * 4;
    const h = ray.intersectObjects(solids, false)[0]; if (h) doors.push(h.point.clone().setY(groundY).add(new THREE.Vector3(0, 0, PH * 0.6)));
  });
  if (!doors.length) doors.push(new THREE.Vector3(CX, groundY, all.max.z));

  const NP = 22;
  for (let k = 0; k < NP; k++) { const p = makePerson(); if (place(p)) { p.userData.st = "walk"; p.userData.s = 1; scene.add(p); people.push(p); p.visible = false; } }
  function setScale(p, s) { p.userData.s = s; p.scale.setScalar(Math.max(0.001, s)); }
  function walkTo(p, tx, tz, dt) {                // 目的地へまっすぐ歩く（入口へ向かうとき）
    const u = p.userData, dx = tx - p.position.x, dz = tz - p.position.z, d = Math.hypot(dx, dz);
    u.dir = Math.atan2(dx, dz); p.rotation.y = u.dir;
    const st = Math.min(d, u.sp * 1.2 * dt); p.position.x += dx / (d || 1) * st; p.position.z += dz / (d || 1) * st;
    return d < PH * 0.5;
  }
  function tickPeople(now, dt) {
    const showP = !build;
    people.forEach(p => {
      const u = p.userData, t = now / 1000 + u.ph;
      if (!showP) { p.visible = false; return; }
      p.visible = u.st !== "inside";
      const sw = Math.sin(t * 9) * 0.6, legs = on => { const a = on ? sw : 0; u.legs[0].rotation.x = a; u.legs[1].rotation.x = -a; u.arms[0].rotation.x = -a; u.arms[1].rotation.x = a; };
      if (u.st === "inside") {                    // 中にいる：しばらくしたら、入口から出るか、上の階にあらわれる
        if ((u.wait -= dt) > 0) return;
        if (Math.random() < 0.5 || !place(p, 30) || p.userData.out) {
          const d = doors[(Math.random() * doors.length) | 0]; p.position.copy(d); u.out = true; u.dir = Math.random() * Math.PI - Math.PI / 2;
        }
        u.st = "appear"; setScale(p, 0.01); return;
      }
      if (u.st === "appear") { setScale(p, u.s + dt * 2.5); legs(false); if (u.s >= 1) { setScale(p, 1); u.st = "walk"; } return; }
      if (u.st === "vanish") { setScale(p, u.s - dt * 2.5); if (u.s <= 0.02) { u.st = "inside"; u.wait = 3 + Math.random() * 6; } return; }
      if (u.st === "goin") {                      // 入口へ歩いていく
        legs(true); if (walkTo(p, u.door.x, u.door.z, dt)) u.st = "vanish"; return;
      }
      u.arms[1].rotation.z = 0;
      if (u.wave > 0) { u.wave -= dt; u.arms[1].rotation.z = 2.6 + Math.sin(t * 10) * 0.4; legs(false); return; }
      if (Math.random() < dt * 0.06) { u.wave = 1.5 + Math.random(); p.lookAt(camera.position.x, p.position.y, camera.position.z); return; }
      if (Math.random() < dt * 0.05) {           // 建物に入る（外の人は入口まで歩く、床の上の人はその場で中へ）
        if (u.out) { u.door = doors[(Math.random() * doors.length) | 0]; u.st = "goin"; } else u.st = "vanish";
        return;
      }
      if (Math.random() < dt * 0.4) u.dir += (Math.random() - .5) * 1.4;
      const nx = p.position.x + Math.sin(u.dir) * u.sp * dt, nz = p.position.z + Math.cos(u.dir) * u.sp * dt;
      let ny = u.out ? (floorAt(nx, nz, all.max.y + 5) > groundY + 1 ? null : groundY) : floorAt(nx, nz, p.position.y + PH * 0.6);
      if (u.out && Math.hypot(nx - CX, nz - CZ) > R * 1.4) ny = null;
      if (ny === null || Math.abs(ny - p.position.y) > PH * 0.4) { u.dir += Math.PI * (0.6 + Math.random() * 0.8); return; }
      p.position.set(nx, ny, nz); p.rotation.y = u.dir; legs(true);
    });
  }

  // ---------- 住人カメラ（1人の後ろについていく） ----------
  let follow = -1;
  const camBtn = document.createElement("button"); camBtn.type = "button"; camBtn.className = "tool"; camBtn.textContent = "住人カメラ";
  const nextBtn = document.createElement("button"); nextBtn.type = "button"; nextBtn.className = "tool"; nextBtn.textContent = "つぎの人"; nextBtn.hidden = true;
  const camPos = new THREE.Vector3(), camAt = new THREE.Vector3();
  function pick(from) {
    for (let k = 1; k <= people.length; k++) { const i = (from + k) % people.length; if (people[i].userData.st === "walk" || people[i].userData.st === "goin") return i; }
    return -1;
  }
  function setFollow(i) {
    follow = i; const on = i >= 0;
    controls.enabled = !on; setSpin(false);
    camBtn.textContent = on ? "もどる" : "住人カメラ"; camBtn.classList.toggle("on", on); nextBtn.hidden = !on;
    if (on) { const p = people[i]; camPos.copy(camera.position); camAt.copy(controls.target); toast.textContent = `住人カメラ：${i + 1}ばんの人`; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 1600); }
  }
  camBtn.onclick = () => { if (follow >= 0) { setFollow(-1); ctx.home && ctx.home(); } else setFollow(pick(-1)); };
  nextBtn.onclick = () => setFollow(pick(follow));
  function tickFollow(dt) {
    if (follow < 0 || build) return;
    const p = people[follow];
    if (p.userData.st === "inside") { const n = pick(follow); if (n >= 0 && n !== follow) setFollow(n); return; }
    const d = p.userData.dir, back = new THREE.Vector3(-Math.sin(d), 0, -Math.cos(d));
    const want = p.position.clone().addScaledVector(back, PH * 5).add(new THREE.Vector3(0, PH * 2.6, 0));
    const look = p.position.clone().add(new THREE.Vector3(0, PH * 0.8, 0));
    const k = 1 - Math.pow(0.02, dt);              // なめらかについていく
    camPos.lerp(want, k); camAt.lerp(look, k);
    camera.position.copy(camPos); controls.target.copy(camAt); camera.lookAt(camAt);
  }

  // ---------- 見どころ（書きこみ） ----------
  const KEY = `yumemachi_spots_${B.id}`;
  let mine = []; try { mine = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { mine = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) {} };
  const spots = document.getElementById("spots");
  const pins = document.createElement("div"); pins.className = "tags"; el.parentElement.appendChild(pins);
  let adding = false;
  function render() {
    spots.innerHTML = "";
    mine.forEach((s, i) => {
      const bt = document.createElement("button"); bt.type = "button"; bt.className = "spot"; bt.textContent = s.name;
      bt.onclick = () => { setSpin(false); flyTo(s.cam, s.at); };
      const x = document.createElement("button"); x.type = "button"; x.className = "spotdel"; x.textContent = "×"; x.title = "消す";
      x.onclick = () => { if (x.dataset.ok) { mine.splice(i, 1); save(); render(); } else { x.dataset.ok = 1; x.textContent = "消す？"; setTimeout(() => { delete x.dataset.ok; x.textContent = "×"; }, 2500); } };
      const w = document.createElement("span"); w.className = "spotwrap"; w.append(bt, x); spots.appendChild(w);
    });
    const add = document.createElement("button"); add.type = "button"; add.className = "spot add" + (adding ? " on" : "");
    add.textContent = adding ? "建物の見どころをタップしてね" : "＋ 見どころを書く"; add.onclick = () => { adding = !adding; render(); };
    spots.appendChild(add);
    if (!mine.length && !adding) { const p = document.createElement("p"); p.className = "note"; p.textContent = "まだ空っぽ。みんなで見どころを書きこもう"; spots.prepend(p); }
    pins.innerHTML = ""; mine.forEach(s => { const e = document.createElement("span"); e.className = "tag3d pin3d"; e.textContent = s.name; pins.appendChild(e); s._e = e; });
  }
  document.querySelector(".card h2").textContent = "見どころ";
  const form = document.createElement("form"); form.className = "spotform";
  form.innerHTML = `<input maxlength="20" placeholder="見どころの名前（例：くるくる坂）" required><button class="spot on">書く</button><button type="button" class="spot">やめる</button>`;
  spots.after(form); form.hidden = true;
  let pending = null;
  form.onsubmit = ev => { ev.preventDefault(); const v = form.querySelector("input").value.trim(); if (v && pending) { mine.push({ ...pending, name: v }); save(); } form.hidden = true; pending = null; adding = false; render(); };
  form.querySelector("button[type=button]").onclick = () => { form.hidden = true; pending = null; adding = false; render(); };
  let down = null;
  renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!adding || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera); ray.far = 1e5;
    const h = ray.intersectObject(model, true)[0]; if (!h) return;
    const at = h.point.clone(), d = camera.position.clone().sub(controls.target).normalize().multiplyScalar(Math.max(R * 0.9, 60));
    pending = { at: fromT(at), cam: fromT(at.clone().add(d)), p: fromT(at) };
    form.hidden = false; const inp = form.querySelector("input"); inp.value = ""; inp.focus(); form.scrollIntoView({ block: "nearest" });
  });
  const _v = new THREE.Vector3();
  function tickPins() {
    const w = el.clientWidth, h = el.clientHeight;
    mine.forEach(s => { if (!s._e) return; _v.copy(toT(s.p)).project(camera); const vis = _v.z < 1;
      s._e.style.display = vis ? "" : "none"; if (vis) s._e.style.transform = `translate(${(_v.x + 1) / 2 * w}px, ${(1 - _v.y) / 2 * h}px) translate(-50%, -100%)`; });
  }
  render();

  // ---------- ボタン ----------
  const tools = document.querySelector(".tools");
  const again = document.createElement("button"); again.type = "button"; again.className = "tool"; again.textContent = "できあがりを見る";
  again.onclick = () => { setFollow(-1); startBuild(); }; tools.appendChild(again);
  tools.append(camBtn, nextBtn);
  const ex = document.createElement("button"); ex.type = "button"; ex.className = "tool"; ex.textContent = "見どころを書き出す";
  ex.onclick = async () => { const s = JSON.stringify(mine.map(({ name, cam, at, p }) => ({ name, cam, at, p }))); try { await navigator.clipboard.writeText(s); ex.textContent = "コピーしたよ"; } catch (e) { ex.textContent = "コピーできませんでした"; } setTimeout(() => ex.textContent = "見どころを書き出す", 2000); };
  tools.appendChild(ex);
  document.body.classList.add("show");

  let last = performance.now();
  TICK.push(now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; tickBuild(now); tickFx(now, dt); tickPeople(now, dt); tickFollow(dt); tickPins(); });
  startBuild();
}
