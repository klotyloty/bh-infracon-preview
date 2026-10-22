/* BH Infracon – 3D-Hero: Schichtaufbau Straße + Rohrvortrieb (Three.js)
   Exploded-View eines Straßenquerschnitts: Deckschicht, Binderschicht, Tragschicht,
   Frostschutzschicht, Planum – darunter ein Vortriebsrohr mit Schacht.
   Beim Scrollen fügen sich die Schichten zusammen (GSAP ScrollTrigger). */
import * as THREE from './vendor/three.module.min.js';

const host = document.getElementById('hero-3d');
if (host && window.WebGLRenderingContext) init(host);

function init(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1f2023, 14, 30);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(7.5, 5.6, 10.5);
  camera.lookAt(0.8, -0.6, 0);

  // Licht: kühles Tageslicht + Rot-Akzent
  scene.add(new THREE.HemisphereLight(0xdfe4ea, 0x1f2023, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(6, 10, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb01b1d, 0.9);
  rim.position.set(-8, 3, -6);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  // ---------- Materialien ----------
  const matLine = new THREE.LineBasicMaterial({ color: 0xb9bbbf, transparent: true, opacity: 0.55 });
  const matRed = new THREE.LineBasicMaterial({ color: 0xb01b1d });
  const mk = (c, r = 0.85, m = 0.05) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, flatShading: true });

  // ---------- Straßenaufbau (Schichten) ----------
  // [Name, Dicke, Farbe]
  const layers = [
    ['Asphaltdeckschicht', 0.22, 0x2a2b2e],
    ['Asphaltbinderschicht', 0.30, 0x3a3c40],
    ['Asphalttragschicht', 0.44, 0x4a4c50],
    ['Schottertragschicht', 0.60, 0x6a6d72],
    ['Frostschutzschicht', 0.80, 0x8b8e93],
  ];
  const W = 7.2, D = 4.6;
  const slabs = [];
  let y = 1.3;
  layers.forEach(([name, h, color], i) => {
    y -= h;
    const geo = new THREE.BoxGeometry(W, h, D, 1, 1, 1);
    const mesh = new THREE.Mesh(geo, mk(color));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), i === 0 ? matRed : matLine);
    mesh.add(edges);
    mesh.position.y = y + h / 2;
    mesh.userData = { restY: mesh.position.y, explode: (layers.length - i) * 0.42 + 0.25, name };
    group.add(mesh);
    slabs.push(mesh);
  });

  // Fahrbahnmarkierung auf der Deckschicht
  const markGeo = new THREE.PlaneGeometry(W * 0.92, 0.09);
  const markMat = new THREE.MeshBasicMaterial({ color: 0xe4e4e2 });
  const mark = new THREE.Mesh(markGeo, markMat);
  mark.rotation.x = -Math.PI / 2;
  mark.position.y = layers[0][1] / 2 + 0.002;
  slabs[0].add(mark);
  [-1, 1].forEach(s => {
    const m2 = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, 0.07), markMat);
    m2.rotation.x = -Math.PI / 2;
    m2.position.set(0, layers[0][1] / 2 + 0.002, s * D * 0.42);
    slabs[0].add(m2);
  });

  // ---------- Planum / Baugrund ----------
  const groundGeo = new THREE.BoxGeometry(W + 1.6, 1.6, D + 1.6);
  const ground = new THREE.Mesh(groundGeo, mk(0x26282c, 0.95));
  ground.position.y = y - 0.8 - 0.05;
  ground.add(new THREE.LineSegments(new THREE.EdgesGeometry(groundGeo), matLine));
  group.add(ground);
  const groundTop = ground.position.y + 0.8;

  // ---------- Vortriebsrohr (DN 300 / DN 1400) ----------
  const pipeLen = W + 3.2;
  const pipeGeo = new THREE.CylinderGeometry(0.42, 0.42, pipeLen, 28, 1, false);
  const pipe = new THREE.Mesh(pipeGeo, new THREE.MeshStandardMaterial({ color: 0xb01b1d, roughness: 0.5, metalness: 0.25 }));
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(0, groundTop - 0.9, 0.6);
  group.add(pipe);
  const pipeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.44, 0.44, pipeLen, 28, 6, true), 20), new THREE.LineBasicMaterial({ color: 0xf2b8b9, transparent: true, opacity: 0.35 }));
  pipeEdge.rotation.z = Math.PI / 2;
  pipeEdge.position.copy(pipe.position);
  group.add(pipeEdge);
  // Rohrringe (Vortriebsrohr-Stöße)
  for (let i = -4; i <= 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.03, 8, 32), mk(0x8c1517, 0.5, 0.3));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(i * 1.15, pipe.position.y, pipe.position.z);
    group.add(ring);
  }

  // ---------- Startschacht (Spundwandverbau) ----------
  const shaftGeo = new THREE.BoxGeometry(1.6, 3.0, 1.6);
  const shaft = new THREE.Mesh(shaftGeo, new THREE.MeshStandardMaterial({ color: 0x5c5f64, roughness: 0.8, metalness: 0.3, transparent: true, opacity: 0.28, side: THREE.DoubleSide }));
  shaft.position.set(W / 2 + 1.0, groundTop - 1.0, 0.6);
  shaft.add(new THREE.LineSegments(new THREE.EdgesGeometry(shaftGeo), new THREE.LineBasicMaterial({ color: 0xe4e4e2, transparent: true, opacity: 0.6 })));
  group.add(shaft);

  // ---------- Raster-Bodenplatte (Planraster) ----------
  const grid = new THREE.GridHelper(40, 40, 0x3a3c41, 0x2a2c30);
  grid.position.y = ground.position.y - 0.8;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  // Schwebende Vermessungspunkte
  const ptsGeo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 160; i++) pts.push((Math.random() - 0.5) * 22, Math.random() * 7 - 3, (Math.random() - 0.5) * 22);
  ptsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const points = new THREE.Points(ptsGeo, new THREE.PointsMaterial({ color: 0xb9bbbf, size: 0.05, transparent: true, opacity: 0.5 }));
  scene.add(points);

  group.rotation.y = -0.35;
  group.scale.setScalar(0.58);
  group.position.set(3.6, -0.9, 0);

  // ---------- Resize ----------
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // auf schmalen Viewports weiter wegzoomen
    camera.fov = w < 1100 ? 38 : 32;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- Explosion/Assembly per Scroll ----------
  const state = { explode: reduce ? 0 : 1 };
  function applyExplode() {
    slabs.forEach(s => { s.position.y = s.userData.restY + s.userData.explode * state.explode; });
  }
  applyExplode();
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    // Intro: Schichten fliegen ein
    slabs.forEach((s, i) => {
      gsap.from(s.position, { y: s.position.y + 6, duration: 1.4, delay: 0.15 + i * 0.12, ease: 'power3.out' });
      gsap.from(s.material, { opacity: 0, duration: 0.8, delay: 0.15 + i * 0.12, onStart: () => { s.material.transparent = true; }, onComplete: () => { s.material.transparent = false; } });
    });
    gsap.from(group.rotation, { y: -1.1, duration: 2.2, ease: 'power3.out' });
    // Scroll: zusammenfügen
    gsap.to(state, {
      explode: 0, ease: 'none',
      scrollTrigger: { trigger: host.closest('.hero') || host, start: 'top top', end: 'bottom top', scrub: 0.8 },
      onUpdate: applyExplode
    });
  }

  // ---------- Maus-Parallax ----------
  const target = { x: 0, y: 0 };
  if (!reduce) {
    window.addEventListener('pointermove', e => {
      target.x = (e.clientX / window.innerWidth - 0.5);
      target.y = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });
  }

  // ---------- Render-Loop (nur wenn sichtbar) ----------
  let visible = true;
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(host);
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    group.rotation.y += ((-0.35 + target.x * 0.35) - group.rotation.y) * 0.04;
    group.rotation.x += ((target.y * 0.12) - group.rotation.x) * 0.04;
    if (!reduce) group.position.y = -0.9 + Math.sin(t * 0.6) * 0.06;
    points.rotation.y = t * 0.02;
    renderer.render(scene, camera);
  }
  tick();
}
