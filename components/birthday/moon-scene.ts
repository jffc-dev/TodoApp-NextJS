import * as THREE from "three";

// Escena nocturna: una luna enorme sale detrás de una colina donde una pareja
// (siluetas) se toma de la mano, mientras suben corazones entre los dos.
// Se carga con import() dinámico para que three.js no pese en el resto de la página.

type Point = [number, number];

const SILHOUETTE = "#0c0410";

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function moonTexture() {
  return canvasTexture(512, (ctx, s) => {
    const base = ctx.createRadialGradient(s * 0.42, s * 0.4, s * 0.05, s / 2, s / 2, s * 0.75);
    base.addColorStop(0, "#fffaf2");
    base.addColorStop(1, "#e8d9c3");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);

    const rand = seeded(7);
    // "Mares" lunares
    for (let i = 0; i < 9; i++) {
      const x = rand() * s;
      const y = rand() * s;
      const r = 40 + rand() * 80;
      const mare = ctx.createRadialGradient(x, y, 0, x, y, r);
      mare.addColorStop(0, `rgba(150, 132, 118, ${0.18 + rand() * 0.15})`);
      mare.addColorStop(1, "rgba(150, 132, 118, 0)");
      ctx.fillStyle = mare;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Cráteres
    for (let i = 0; i < 90; i++) {
      const r = 3 + rand() ** 2 * 26;
      const x = rand() * s;
      const y = rand() * s;
      const crater = ctx.createRadialGradient(x, y, 0, x, y, r);
      crater.addColorStop(0, "rgba(120, 104, 94, 0.35)");
      crater.addColorStop(1, "rgba(120, 104, 94, 0)");
      ctx.fillStyle = crater;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x - 1, y - 1, r * 0.8, Math.PI * 0.9, Math.PI * 1.7);
      ctx.stroke();
    }
  });
}

function glowTexture(color: string) {
  return canvasTexture(256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

function heartTexture() {
  return canvasTexture(128, (ctx) => {
    ctx.shadowColor = "rgba(255, 120, 160, 0.9)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ff8fb1";
    ctx.beginPath();
    ctx.moveTo(64, 104);
    ctx.bezierCurveTo(8, 64, 26, 14, 64, 40);
    ctx.bezierCurveTo(102, 14, 120, 64, 64, 104);
    ctx.fill();
  });
}

function trailTexture() {
  return canvasTexture(256, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, "rgba(255, 255, 255, 0)");
    g.addColorStop(1, "rgba(255, 255, 255, 1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, s / 2 - 4, s, 8);
  });
}

// ---- Siluetas ----

function polygon(points: Point[]) {
  const shape = new THREE.Shape();
  shape.moveTo(...points[0]);
  for (const p of points.slice(1)) shape.lineTo(...p);
  shape.closePath();
  return shape;
}

function limb(x1: number, y1: number, x2: number, y2: number, width: number) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = (-(y2 - y1) / len) * (width / 2);
  const ny = ((x2 - x1) / len) * (width / 2);
  return polygon([
    [x1 + nx, y1 + ny],
    [x2 + nx, y2 + ny],
    [x2 - nx, y2 - ny],
    [x1 - nx, y1 - ny],
  ]);
}

function circle(x: number, y: number, r: number) {
  return new THREE.Shape().absarc(x, y, r, 0, Math.PI * 2, false);
}

function ellipse(x: number, y: number, rx: number, ry: number) {
  return new THREE.Shape().absellipse(x, y, rx, ry, 0, Math.PI * 2, false, 0);
}

function figure(shapes: THREE.Shape[], material: THREE.Material) {
  return new THREE.Mesh(new THREE.ShapeGeometry(shapes, 6), material);
}

function couple(material: THREE.Material) {
  const group = new THREE.Group();

  // Él (pies en y = 0)
  const him = figure(
    [
      polygon([
        [-0.17, 0], [-0.06, 0], [0, 0.78], [0.06, 0], [0.17, 0], [0.16, 0.92],
        [0.23, 1.42], [0.09, 1.5], [-0.09, 1.5], [-0.23, 1.42], [-0.16, 0.92],
      ]),
      limb(0, 1.44, 0, 1.58, 0.09),
      circle(0, 1.68, 0.13),
      limb(-0.21, 1.4, -0.29, 0.9, 0.1),
      circle(-0.29, 0.88, 0.05),
      limb(0.21, 1.4, 0.43, 0.98, 0.1),
      circle(0.44, 0.96, 0.055),
    ],
    material,
  );
  him.rotation.z = -0.04;

  // Ella: vestido, pelo largo y la mano que toma la de él
  const her = figure(
    [
      limb(-0.06, 0, -0.05, 0.4, 0.07),
      limb(0.06, 0, 0.05, 0.4, 0.07),
      polygon([
        [-0.3, 0.32], [0.3, 0.32], [0.12, 0.95], [0.19, 1.36],
        [0.06, 1.44], [-0.06, 1.44], [-0.19, 1.36], [-0.12, 0.95],
      ]),
      ellipse(0.03, 1.48, 0.15, 0.23),
      limb(0, 1.4, 0, 1.52, 0.07),
      circle(0, 1.6, 0.12),
      limb(-0.18, 1.33, -0.36, 1.03, 0.085),
      limb(0.18, 1.33, 0.27, 0.88, 0.085),
    ],
    material,
  );
  her.position.x = 0.78;
  her.scale.setScalar(0.92);
  her.rotation.z = 0.05;

  group.add(him, her);
  return group;
}

function hill(points: Point[], material: THREE.Material) {
  const shape = new THREE.Shape();
  shape.moveTo(-14, -14);
  shape.lineTo(...points[0]);
  for (let i = 1; i + 2 < points.length; i += 3) {
    const [c1, c2, end] = [points[i], points[i + 1], points[i + 2]];
    shape.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
  }
  shape.lineTo(14, -14);
  shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), material);
}

// ---- Escena ----

export function createMoonScene(container: HTMLElement, { reducedMotion }: { reducedMotion: boolean }) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return () => {}; // Sin WebGL: queda el fondo en CSS y la frase.
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 0, 10);

  // Estrellas que titilan
  const starCount = 900;
  const rand = seeded(42);
  const positions = new Float32Array(starCount * 3);
  const phases = new Float32Array(starCount);
  const sizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    positions.set([(rand() - 0.5) * 70, -4 + rand() * 30, -25 - rand() * 35], i * 3);
    phases[i] = rand() * Math.PI * 2;
    sizes[i] = 1 + rand() * 2.8;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  starGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSize;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aPhase);
        vAlpha = twinkle;
        gl_PointSize = aSize * uPixelRatio * (0.8 + 0.4 * twinkle);
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(1.0, 0.94, 0.97, smoothstep(0.5, 0.0, d) * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(starGeometry, starMaterial));

  // Luna con halo
  const moonY = 1.8;
  const moon = new THREE.Group();
  moon.position.set(0.3, reducedMotion ? moonY : -7, -30);
  const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), new THREE.MeshBasicMaterial({ map: moonTexture() }));
  const outerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture("rgba(255, 214, 196, 0.55)"), blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  outerGlow.scale.setScalar(26);
  const innerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture("rgba(255, 246, 230, 0.8)"), blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  innerGlow.scale.setScalar(14);
  moon.add(outerGlow, innerGlow, moonMesh);
  scene.add(moon);

  // Colinas (la lejana más clara para dar profundidad)
  const farHill = hill(
    [[-14, -2.6], [-8, -1.2], [-3, -2.8], [2, -2.4], [6, -2.1], [10, -1.6], [14, -2.4]],
    new THREE.MeshBasicMaterial({ color: "#2b1233" }),
  );
  farHill.position.z = -6;
  const nearHill = hill(
    [[-14, -3.6], [-6, -2.7], [-2, -2.15], [0.4, -2.15], [3, -2.2], [6, -3.2], [14, -3.8]],
    new THREE.MeshBasicMaterial({ color: "#13061b" }),
  );
  scene.add(farHill, nearHill);

  // La pareja, centrada sobre la cima
  const silhouette = new THREE.MeshBasicMaterial({ color: SILHOUETTE });
  const lovers = couple(silhouette);
  lovers.scale.setScalar(1.15);
  lovers.position.set(-0.45, -2.17, 0.1);
  scene.add(lovers);
  const handsX = lovers.position.x + 0.44 * 1.15;
  const handsY = lovers.position.y + 1.25 * 1.15;

  // Corazones que suben entre los dos
  const heartMap = heartTexture();
  const hearts = Array.from({ length: 12 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartMap, transparent: true, depthWrite: false }));
    sprite.userData = { offset: i / 12, drift: (rand() - 0.5) * 1.6, size: 0.18 + rand() * 0.22 };
    scene.add(sprite);
    return sprite;
  });

  // Luciérnagas
  const fireflyMap = glowTexture("rgba(255, 220, 140, 1)");
  const fireflies = Array.from({ length: 14 }, () => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: fireflyMap, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    sprite.userData = { x: (rand() - 0.5) * 7, y: -2.8 + rand() * 1.8, phase: rand() * 10 };
    sprite.scale.setScalar(0.22);
    scene.add(sprite);
    return sprite;
  });

  // Estrella fugaz
  const shooting = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 0.12),
    new THREE.MeshBasicMaterial({ map: trailTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  shooting.position.z = -12;
  scene.add(shooting);
  // La primera sale a los ~3 s
  const shot = { start: -4, life: 1.3, from: new THREE.Vector2(), dir: new THREE.Vector2() };

  // Paralaje suave con el dedo / mouse
  const pointer = { x: 0, y: 0 };
  function onPointerMove(e: PointerEvent) {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }
  window.addEventListener("pointermove", onPointerMove);

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const startedAt = performance.now();
  const speed = reducedMotion ? 0.3 : 1;
  let frame = 0;

  function tick() {
    const t = (performance.now() - startedAt) / 1000;
    starMaterial.uniforms.uTime.value = t * speed;

    if (!reducedMotion) {
      // La luna sale en ~5 s
      const rise = Math.min(t / 5, 1);
      moon.position.y = -7 + (moonY + 7) * (1 - (1 - rise) ** 3);
      camera.position.x += (Math.sin(t * 0.15) * 0.25 + pointer.x * 0.35 - camera.position.x) * 0.04;
      camera.position.y += (-pointer.y * 0.2 - camera.position.y) * 0.04;
    }
    camera.lookAt(0, 0, -10);
    moonMesh.rotation.y = t * 0.02;

    for (const heart of hearts) {
      const { offset, drift, size } = heart.userData;
      const p = ((t * 0.12 * speed) + offset) % 1;
      heart.position.set(handsX + Math.sin(p * 6 + offset * 10) * 0.15 + drift * p, handsY + 0.2 + p * 4.2, 0.2);
      heart.scale.setScalar(size * (0.5 + p));
      heart.material.opacity = Math.sin(Math.PI * p) * 0.9;
    }

    for (const fly of fireflies) {
      const { x, y, phase } = fly.userData;
      fly.position.set(x + Math.sin(t * 0.3 + phase) * 0.4, y + Math.cos(t * 0.4 + phase) * 0.25, 0.3);
      fly.material.opacity = 0.3 + 0.7 * Math.max(0, Math.sin(t * 1.3 + phase));
    }

    if (!reducedMotion) {
      const age = t - shot.start;
      if (age > shot.life + 5) {
        shot.start = t;
        shot.from.set(-8 + rand() * 6, 9 + rand() * 4);
        shot.dir.set(1, -0.4 - rand() * 0.3).normalize();
        shooting.rotation.z = Math.atan2(shot.dir.y, shot.dir.x);
      } else if (age >= 0 && age <= shot.life) {
        const k = age / shot.life;
        shooting.position.x = shot.from.x + shot.dir.x * k * 14;
        shooting.position.y = shot.from.y + shot.dir.y * k * 14;
        shooting.material.opacity = Math.sin(Math.PI * k);
      } else {
        shooting.material.opacity = 0;
      }
    }

    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  tick();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const material of materials) {
        (material as THREE.MeshBasicMaterial).map?.dispose();
        material.dispose();
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
