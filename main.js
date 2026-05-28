import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('bg-canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xf5f5f5, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 4;

// ライト
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(2, 3, 4);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x888888));

// モデル読み込み
let model = null;
const loader = new GLTFLoader();
loader.load('./models/ネームプレート.glb', (gltf) => {
  model = gltf.scene;
  scene.add(model);
});

// リサイズ
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// スクロール
let scrollY = 0;
window.addEventListener('scroll', () => { scrollY = window.scrollY; });

// アニメーション
let rotX = 0, rotY = 0;

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    rotX += 0.003;
    rotY += 0.005;

    model.rotation.x = rotX;
    model.rotation.y = rotY + scrollY * 0.002;
    model.position.y = scrollY * 0.002;
  }

  renderer.render(scene, camera);
}
animate();
