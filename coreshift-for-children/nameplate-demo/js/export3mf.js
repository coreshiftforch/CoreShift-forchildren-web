/* ══════════════════════════════════════════════════════════════
   3MF の書き出し

   土台（＋リング）と 文字を「別の部品」にした 3MF を作る。
   → Bambu Studio で 部品ごとに フィラメントを選べる（2色プリント）。
   3MF の中身は ZIP なので、無圧縮の ZIP を ここで組み立てている。
   ══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    let c = (crc ^ bytes[i]) & 0xFF;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* 無圧縮(store)の ZIP。files: [{ name, data:Uint8Array }] */
function zipStore(files) {
  const u16 = n => [n & 255, (n >>> 8) & 255];
  const u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const nameB = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const local = new Uint8Array([].concat(
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(nameB.length), u16(0)));
    parts.push(local, nameB, f.data);
    central.push(new Uint8Array([].concat(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(nameB.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(offset))), nameB);
    offset += local.length + nameB.length + size;
  }
  let clen = 0;
  for (const c of central) clen += c.length;
  const end = new Uint8Array([].concat(
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(clen), u32(offset), u16(0)));
  const all = [...parts, ...central, end];
  let total = 0;
  for (const c of all) total += c.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of all) { out.set(c, p); p += c.length; }
  return out;
}

/* メッシュ群 → <mesh>。座標は ワールド座標（＝できあがりの mm） */
function meshXML(meshes) {
  const v = new THREE.Vector3();
  const f = n => Math.round(n * 1000) / 1000;
  let vx = '', tx = '', vcount = 0;
  for (const mesh of meshes) {
    if (!mesh) continue;
    mesh.updateWorldMatrix(true, false);
    const pos = mesh.geometry.attributes.position, base = vcount;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      vx += `<vertex x="${f(v.x)}" y="${f(v.y)}" z="${f(v.z)}"/>`;
    }
    vcount += pos.count;
    const idx = mesh.geometry.index;
    if (idx) {
      const a = idx.array;
      for (let i = 0; i < a.length; i += 3) tx += `<triangle v1="${base + a[i]}" v2="${base + a[i + 1]}" v3="${base + a[i + 2]}"/>`;
    } else {
      for (let i = 0; i < pos.count; i += 3) tx += `<triangle v1="${base + i}" v2="${base + i + 1}" v3="${base + i + 2}"/>`;
    }
  }
  return `<mesh><vertices>${vx}</vertices><triangles>${tx}</triangles></mesh>`;
}

const hex6 = n => n.toString(16).padStart(6, '0').toUpperCase();

/* 3MF を Uint8Array で返す。baseColor・textColor は 0xRRGGBB */
export function build3MF({ baseMesh, charMeshes, baseColor, textColor }) {
  const model =
`<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources>
  <basematerials id="10">
   <base name="どだい" displaycolor="#${hex6(baseColor)}FF"/>
   <base name="なまえ" displaycolor="#${hex6(textColor)}FF"/>
  </basematerials>
  <object id="1" type="model" pid="10" pindex="0" name="どだい">${meshXML([baseMesh])}</object>
  <object id="2" type="model" pid="10" pindex="1" name="なまえ">${meshXML(charMeshes)}</object>
 </resources>
 <build><item objectid="1"/><item objectid="2"/></build>
</model>`;
  const contentTypes =
`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
  const rels =
`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
  const enc = new TextEncoder();
  return zipStore([
    { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { name: '_rels/.rels',         data: enc.encode(rels) },
    { name: '3D/3dmodel.model',    data: enc.encode(model) },
  ]);
}

export function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}
