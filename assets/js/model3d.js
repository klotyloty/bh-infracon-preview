/* BH Infracon – Interaktiver GLB-Viewer (Three.js) für die Unternehmensseite.
   Lädt das Modell erst, wenn der Bereich in den Viewport kommt. */
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const host = document.getElementById('model-3d');
if (host && window.WebGLRenderingContext) {
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { io.disconnect(); start(host); }
  }, { rootMargin: '300px' });
  io.observe(host);
}

function start(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.cursor = 'grab';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.4, 6.5);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2e3034, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 8, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe4ea, 0.8); fill.position.set(-5, 2, -4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xb01b1d, 0.6); rim.position.set(0, 3, -8); scene.add(rim);

  const grid = new THREE.GridHelper(12, 24, 0x5c5f64, 0x3a3c41);
  grid.material.transparent = true; grid.material.opacity = 0.5;
  scene.add(grid);

  const pivot = new THREE.Group();
  scene.add(pivot);

  // Ladehinweis
  const note = document.createElement('div');
  note.textContent = 'Modell wird geladen …';
  note.style.cssText = 'position:absolute;left:24px;bottom:20px;font:13px/1.4 "IBM Plex Mono",monospace;color:#B9BBBF;letter-spacing:.04em';
  host.appendChild(note);

  new GLTFLoader().load(host.getAttribute('data-model'), (gltf) => {
    const model = gltf.scene;
    // Normieren: zentrieren und auf Einheitsgröße skalieren
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 3.2 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(s);
    model.position.sub(center.multiplyScalar(s));
    model.position.y += (size.y * s) / 2 - 0.02;
    grid.position.y = 0;
    model.traverse((o) => { if (o.isMesh && o.material) { o.material.roughness = Math.min(0.9, (o.material.roughness ?? 0.7) + 0.1); } });
    pivot.add(model);
    note.textContent = 'Kettenbagger · 3D-Modell · ziehen zum Drehen';
    if (window.gsap && !reduce) {
      gsap.from(pivot.rotation, { y: -2.5, duration: 1.8, ease: 'power3.out' });
      gsap.from(pivot.position, { y: -1.5, duration: 1.4, ease: 'power3.out' });
    }
  }, undefined, () => { note.textContent = '3D-Modell konnte nicht geladen werden.'; });

  // Drehen per Maus / Touch
  let dragging = false, lastX = 0, lastY = 0, velX = 0, rotX = 0.15, rotY = 0.6;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; el.style.cursor = 'grabbing'; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    velX = (e.clientX - lastX) * 0.01;
    rotY += velX; rotX += (e.clientY - lastY) * 0.005;
    rotX = Math.max(-0.4, Math.min(0.9, rotX));
    lastX = e.clientX; lastY = e.clientY;
  });
  const stop = () => { dragging = false; el.style.cursor = 'grab'; };
  el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('pointerleave', stop);
  el.style.touchAction = 'pan-y';

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(host);
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    if (!dragging) { velX *= 0.95; rotY += velX + (reduce ? 0 : 0.003); }
    pivot.rotation.y = rotY; pivot.rotation.x = rotX;
    renderer.render(scene, camera);
  }
  tick();
}
