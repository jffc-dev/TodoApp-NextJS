import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Escena nocturna: una luna enorme sale detrás de una colina donde una pareja
// en 3D estilo Funko Pop se toma de la mano, se gira, se da un beso (con pie
// arriba incluido) y suelta corazones. Sus dos perritas los acompañan: la blanca
// sentada junto a ella y la negra dando vueltas alrededor, ladrando.
// Se carga con import() dinámico para que three.js no pese en el resto de la página.

type Point = [number, number];

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

function trailTexture() {
  return canvasTexture(256, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, "rgba(255, 255, 255, 0)");
    g.addColorStop(1, "rgba(255, 255, 255, 1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, s / 2 - 4, s, 8);
  });
}

// ---- Pareja estilo Funko Pop ----
// Colores de cada figura (basados en la foto de los dos).
const LOOK = {
  him: { skin: "#d9a07c", hair: "#1f140e", beard: "#2a1c14", shirt: "#f7f5f0", pants: "#1b1a1f", shoes: "#18171b", soles: "#d8d4cc" },
  her: {
    skin: "#e2a988",
    hairTop: "#1a110e",
    hairTips: "#d6ad74",
    blouse: "#6b2f2c",
    pants: "#cdbda3",
    belt: "#3a2418",
    gold: "#d4af6a",
    heels: "#f8f6f2",
  },
  whiteDog: { fur: "#f6f1ea", muzzle: "#fffaf4", ears: "#eadcc8", bow: "#ff7aa2" },
  blackDog: { fur: "#2c272d", muzzle: "#4a4249", ears: "#1d191e", bow: "#ff5a6e" },
};

type Funko = {
  root: THREE.Group; // pivote en los pies (para inclinarse)
  body: THREE.Group; // gira hacia la pareja
  head: THREE.Group; // pivote en el cuello (cabeceo tipo bobblehead)
  eyes: THREE.Group; // escala en Y para parpadear
  armIn: THREE.Group; // brazo que toma la mano del otro
  armOut: THREE.Group;
  legKick?: THREE.Group; // el clásico "pie arriba" del beso
  hairBack?: THREE.Group;
  phase: number;
};

const curlGeo = new THREE.SphereGeometry(1, 12, 10);

function vinyl(color: THREE.ColorRepresentation, roughness = 0.45) {
  return new THREE.MeshPhysicalMaterial({ color, roughness, clearcoat: 0.6, clearcoatRoughness: 0.35 });
}

function box(w: number, h: number, d: number, r: number) {
  return new RoundedBoxGeometry(w, h, d, 4, r);
}

function part(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}

function ball(
  material: THREE.Material,
  [x, y, z]: [number, number, number],
  [sx, sy, sz]: [number, number, number],
  geometry: THREE.BufferGeometry = new THREE.SphereGeometry(1, 24, 16),
) {
  const mesh = part(geometry, material, x, y, z);
  mesh.scale.set(sx, sy, sz);
  return mesh;
}

// Camisa blanca con un estampado de puntitos negros
function dottedTexture() {
  const texture = canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, s, s);
    const rand = seeded(11);
    ctx.fillStyle = "#1b1a1f";
    for (let i = 0; i < 46; i++) {
      ctx.beginPath();
      ctx.ellipse(rand() * s, rand() * s, 2.6, 1.6, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Cabello negro arriba que se degrada a rubio en las puntas
function balayageTexture(top: string, tips: string) {
  return canvasTexture(64, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, top);
    g.addColorStop(0.4, top);
    g.addColorStop(1, tips);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

function arm(x: number, radius: number, sleeve: THREE.Material, hand: THREE.Material) {
  const group = new THREE.Group();
  group.position.set(x, 0.94, 0);
  group.add(part(new THREE.CapsuleGeometry(radius, 0.26, 6, 12), sleeve, 0, -0.2, 0));
  group.add(ball(hand, [0, -0.42, 0], [0.085, 0.085, 0.085]));
  return group;
}

// Manga ancha tipo murciélago de la blusa, antebrazo y pulsera dorada
function capeArm(x: number, blouse: THREE.Material, skin: THREE.Material, gold: THREE.Material) {
  const group = new THREE.Group();
  group.position.set(x, 0.94, 0);
  group.add(part(new THREE.CylinderGeometry(0.075, 0.15, 0.26, 20), blouse, 0, -0.12, 0));
  group.add(part(new THREE.CapsuleGeometry(0.05, 0.14, 6, 12), skin, 0, -0.29, 0));
  const bracelet = part(new THREE.TorusGeometry(0.055, 0.012, 8, 24), gold, 0, -0.34, 0);
  bracelet.rotation.x = Math.PI / 2;
  group.add(bracelet);
  group.add(ball(skin, [0, -0.42, 0], [0.08, 0.08, 0.08]));
  return group;
}

// Lentes de sol: cuadrados negros (él) o redondos con marco dorado (ella)
function sunglasses(shape: "square" | "round", lensColor: string, frameColor: string) {
  const glasses = new THREE.Group();
  glasses.position.set(0, 0.39, 0.45);
  const lens = new THREE.MeshPhysicalMaterial({ color: lensColor, roughness: 0.05, clearcoat: 1, metalness: 0.2 });
  const frame = vinyl(frameColor, 0.3);
  const shine = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 });
  for (const sx of [-1, 1]) {
    if (shape === "square") {
      glasses.add(part(box(0.32, 0.21, 0.05, 0.06), lens, sx * 0.2, 0, 0));
    } else {
      const disc = part(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 32), lens, sx * 0.2, 0, 0);
      disc.rotation.x = Math.PI / 2;
      const rim = part(new THREE.TorusGeometry(0.14, 0.014, 8, 32), frame, sx * 0.2, 0, 0.005);
      glasses.add(disc, rim);
    }
    const glint = part(box(0.1, 0.025, 0.01, 0.01), shine, sx * 0.2 - 0.05, 0.05, 0.03);
    glint.rotation.z = 0.5;
    glasses.add(glint);
    // Patillas hacia las orejas
    glasses.add(part(box(0.025, 0.03, 0.46, 0.01), frame, sx * 0.485, 0.02, -0.22));
  }
  glasses.add(part(box(0.1, 0.03, 0.03, 0.01), frame, 0, 0.05, 0));
  return glasses;
}

// Cabeza grande y cuadradita, ojos negros de vinilo brillante y sin boca.
function funkoHead(skin: THREE.Material, brows: THREE.Material, blush: boolean) {
  const head = new THREE.Group();
  head.add(part(box(0.96, 0.84, 0.84, 0.24), skin, 0, 0.44, 0));

  const eyeMat = new THREE.MeshPhysicalMaterial({ color: "#140a10", roughness: 0.12, clearcoat: 1 });
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.38, 0.42);
  for (const sx of [-1, 1]) {
    eyes.add(ball(eyeMat, [sx * 0.19, 0, 0], [0.085, 0.11, 0.04]));
    const brow = part(box(0.14, 0.035, 0.03, 0.015), brows, sx * 0.19, 0.56, 0.425);
    brow.rotation.z = sx * -0.12;
    head.add(brow);
  }
  head.add(eyes, ball(skin, [0, 0.27, 0.425], [0.04, 0.03, 0.03]));

  if (blush) {
    const blushMat = new THREE.MeshBasicMaterial({ color: "#ff8fab", transparent: true, opacity: 0.5 });
    for (const sx of [-1, 1]) head.add(ball(blushMat, [sx * 0.31, 0.22, 0.41], [0.07, 0.04, 0.015]));
  }
  return { head, eyes };
}

function funkoHim(): Funko {
  const look = LOOK.him;
  const skin = vinyl(look.skin);
  const hair = vinyl(look.hair, 0.7);
  const shirt = vinyl(look.shirt, 0.55);
  shirt.map = dottedTexture();
  const black = vinyl("#141316", 0.3);
  const pants = vinyl(look.pants, 0.6);
  const shoes = vinyl(look.shoes, 0.4);
  const soles = vinyl(look.soles, 0.5);

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Pantalón y zapatillas negras con suela clara
  for (const sx of [-1, 1]) {
    body.add(part(box(0.2, 0.1, 0.3, 0.045), shoes, sx * 0.12, 0.075, 0.04));
    body.add(part(box(0.21, 0.035, 0.31, 0.015), soles, sx * 0.12, 0.018, 0.04));
    body.add(part(box(0.18, 0.34, 0.2, 0.07), pants, sx * 0.12, 0.29, 0));
  }
  // Camisa blanca estampada, cuello y botones negros
  body.add(part(box(0.52, 0.58, 0.34, 0.13), shirt, 0, 0.72, 0));
  for (const sx of [-1, 1]) {
    const collar = part(box(0.17, 0.08, 0.04, 0.02), vinyl(look.shirt, 0.55), sx * 0.08, 0.97, 0.16);
    collar.rotation.z = sx * -0.55;
    body.add(collar);
  }
  for (const y of [0.88, 0.76, 0.64, 0.52]) body.add(ball(black, [0, y, 0.172], [0.018, 0.018, 0.01]));
  body.add(part(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16), skin, 0, 1.02, 0));

  const armIn = arm(0.32, 0.075, shirt, skin);
  const armOut = arm(-0.32, 0.075, shirt, skin);
  body.add(armIn, armOut);

  const { head, eyes } = funkoHead(skin, hair, false);
  head.position.y = 1.02;

  // Cabello medio ruloso, corte clásico (los costados también llevan pelo)
  head.add(part(box(1.04, 0.32, 0.92, 0.15), hair, 0, 0.8, -0.02));
  head.add(part(box(1.02, 0.6, 0.3, 0.14), hair, 0, 0.55, -0.3));
  for (const sx of [-1, 1]) head.add(part(box(0.1, 0.34, 0.78, 0.05), hair, sx * 0.5, 0.66, -0.04));
  const rand = seeded(5);
  const curl = (x: number, y: number, z: number, r: number) =>
    head.add(ball(hair, [x, y + (rand() - 0.5) * 0.03, z], [r, r * 0.9, r], curlGeo));
  for (let i = 0; i < 38; i++) curl((rand() - 0.5) * 0.9, 0.92, (rand() - 0.5) * 0.78 - 0.01, 0.06 + rand() * 0.025);
  for (let x = -0.4; x <= 0.41; x += 0.135) curl(x + (rand() - 0.5) * 0.04, 0.85, 0.4, 0.06);
  for (const sx of [-1, 1]) {
    for (let z = -0.3; z <= 0.31; z += 0.15) curl(sx * 0.52, 0.74 + (rand() - 0.5) * 0.06, z, 0.055);
  }
  for (let x = -0.36; x <= 0.37; x += 0.18) curl(x, 0.66, -0.45, 0.065);
  for (const sx of [-1, 1]) head.add(ball(skin, [sx * 0.49, 0.36, 0], [0.05, 0.09, 0.06]));

  // Barba solo en el borde de la mandíbula (sin bigote ni candado)
  const beard = vinyl(look.beard, 0.8);
  const jaw = new THREE.CatmullRomCurve3(
    [
      [-0.47, 0.42, 0.08],
      [-0.47, 0.22, 0.11],
      [-0.4, 0.1, 0.24],
      [-0.24, 0.085, 0.36],
      [0, 0.08, 0.38],
      [0.24, 0.085, 0.36],
      [0.4, 0.1, 0.24],
      [0.47, 0.22, 0.11],
      [0.47, 0.42, 0.08],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  head.add(new THREE.Mesh(new THREE.TubeGeometry(jaw, 48, 0.06, 8), beard));
  head.add(ball(beard, [0, 0.1, 0.38], [0.17, 0.08, 0.055]));

  head.add(sunglasses("square", "#0c0b0e", "#0c0b0e"));
  body.add(head);

  return { root, body, head, eyes, armIn, armOut, phase: 0 };
}

function funkoHer(): Funko {
  const look = LOOK.her;
  const skin = vinyl(look.skin);
  const blouse = vinyl(look.blouse, 0.3);
  const pants = vinyl(look.pants, 0.55);
  const heels = vinyl(look.heels, 0.3);
  const gold = new THREE.MeshPhysicalMaterial({ color: look.gold, roughness: 0.25, metalness: 0.8 });
  const hairTop = vinyl(look.hairTop, 0.55);
  const hairFade = vinyl("#ffffff", 0.55);
  hairFade.map = balayageTexture(look.hairTop, look.hairTips);

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Pantalón beige de bota ancha y tacones blancos
  let legKick: THREE.Group | undefined;
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.11, 0.5, 0);
    leg.add(part(new THREE.CylinderGeometry(0.1, 0.14, 0.44, 20), pants, 0, -0.22, 0));
    leg.add(part(box(0.11, 0.06, 0.21, 0.03), heels, 0, -0.47, 0.07));
    leg.add(part(new THREE.CylinderGeometry(0.02, 0.014, 0.08, 10), heels, 0, -0.46, -0.05));
    body.add(leg);
    if (sx === 1) legKick = leg;
  }
  body.add(part(box(0.44, 0.2, 0.3, 0.09), pants, 0, 0.55, 0));
  body.add(part(box(0.45, 0.05, 0.31, 0.02), vinyl(look.belt, 0.4), 0, 0.64, 0));
  const buckle = part(new THREE.TorusGeometry(0.03, 0.009, 8, 20), gold, 0, 0.64, 0.16);
  buckle.scale.x = 1.4;
  body.add(buckle);
  // Blusa café satinada
  body.add(part(box(0.46, 0.36, 0.32, 0.12), blouse, 0, 0.83, 0));
  body.add(part(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16), skin, 0, 1.03, 0));
  body.add(ball(gold, [0, 0.99, 0.165], [0.02, 0.02, 0.01]));

  const armIn = capeArm(-0.27, blouse, skin, gold);
  const armOut = capeArm(0.27, blouse, skin, gold);
  body.add(armIn, armOut);

  const { head, eyes } = funkoHead(skin, hairTop, true);
  head.position.y = 1.04;
  // Cabello suelto, raya al medio y sin flequillo: negro arriba, rubio en las puntas
  for (const sx of [-1, 1]) {
    const half = part(box(0.56, 0.34, 0.92, 0.15), hairTop, sx * 0.25, 0.79, -0.02);
    half.rotation.z = sx * -0.1;
    head.add(half);
    head.add(part(box(0.2, 1.2, 0.26, 0.09), hairFade, sx * 0.5, 0.18, 0.16));
  }
  const hairBack = new THREE.Group();
  hairBack.position.set(0, 0.8, -0.26);
  hairBack.add(part(box(1.08, 1.45, 0.34, 0.15), hairFade, 0, -0.68, 0));
  head.add(hairBack);
  head.add(sunglasses("round", "#2a1712", look.gold));
  body.add(head);

  root.scale.setScalar(0.95);
  return { root, body, head, eyes, armIn, armOut, legKick, hairBack, phase: 1.7 };
}

// ---- Perritas (medio Shih Tzu) ----

type Dog = {
  root: THREE.Group;
  body: THREE.Group; // para los saltitos
  head: THREE.Group;
  mouth: THREE.Group;
  tail: THREE.Group;
  legs: THREE.Group[];
  bark: THREE.Sprite;
};

function barkTexture(text: string) {
  return canvasTexture(256, (ctx, s) => {
    ctx.font = "bold 56px 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#ff6f9a";
    ctx.strokeText(text, s / 2, s / 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, s / 2, s / 2);
  });
}

function funkoDog(look: (typeof LOOK)["whiteDog"], sitting: boolean, barkText: string): Dog {
  const fur = vinyl(look.fur, 0.6);
  const muzzle = vinyl(look.muzzle, 0.6);
  const ears = vinyl(look.ears, 0.65);
  const glossy = new THREE.MeshPhysicalMaterial({ color: "#0d090b", roughness: 0.1, clearcoat: 1 });
  const glint = new THREE.MeshBasicMaterial({ color: "#ffffff" });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const legs: THREE.Group[] = [];

  if (sitting) {
    body.add(ball(fur, [0, 0.25, 0], [0.2, 0.25, 0.19]));
    body.add(ball(muzzle, [0, 0.3, 0.1], [0.15, 0.15, 0.12]));
    for (const sx of [-1, 1]) {
      body.add(ball(fur, [sx * 0.12, 0.11, -0.03], [0.1, 0.1, 0.14]));
      body.add(part(new THREE.CapsuleGeometry(0.045, 0.14, 6, 10), fur, sx * 0.07, 0.12, 0.11));
      body.add(ball(fur, [sx * 0.07, 0.035, 0.15], [0.06, 0.04, 0.07]));
    }
  } else {
    body.add(part(box(0.3, 0.24, 0.42, 0.11), fur, 0, 0.25, 0));
    for (const [x, z] of [[-0.09, 0.13], [0.09, 0.13], [-0.09, -0.13], [0.09, -0.13]]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.16, z);
      leg.add(part(new THREE.CapsuleGeometry(0.05, 0.06, 6, 10), fur, 0, -0.08, 0));
      body.add(leg);
      legs.push(leg);
    }
  }

  // Cabeza redonda, hocico chato, orejas largas y moñito
  const head = new THREE.Group();
  head.position.set(0, sitting ? 0.56 : 0.42, sitting ? 0.06 : 0.2);
  head.add(ball(fur, [0, 0, 0], [0.21, 0.19, 0.19]));
  head.add(ball(muzzle, [0, -0.05, 0.15], [0.1, 0.07, 0.07]));
  head.add(ball(glossy, [0, -0.02, 0.215], [0.03, 0.025, 0.02]));
  for (const sx of [-1, 1]) {
    head.add(ball(glossy, [sx * 0.08, 0.03, 0.16], [0.04, 0.045, 0.03]));
    head.add(ball(glint, [sx * 0.08 + 0.012, 0.045, 0.186], [0.01, 0.01, 0.01]));
    const ear = ball(ears, [sx * 0.19, -0.06, -0.01], [0.07, 0.15, 0.09]);
    ear.rotation.z = sx * 0.25;
    head.add(ear);
    head.add(ball(vinyl(look.bow, 0.35), [sx * 0.045, 0.21, 0.02], [0.045, 0.03, 0.03]));
  }
  head.add(ball(fur, [0, 0.18, 0], [0.06, 0.06, 0.06]));

  // Boca que se abre al ladrar
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.11, 0.15);
  mouth.add(ball(new THREE.MeshBasicMaterial({ color: "#3a0f18" }), [0, 0, 0], [0.05, 0.035, 0.03]));
  mouth.add(ball(new THREE.MeshBasicMaterial({ color: "#ff7c95" }), [0, -0.015, 0.012], [0.03, 0.015, 0.02]));
  mouth.scale.y = 0.2;
  head.add(mouth);
  body.add(head);

  // Cola peluda enroscada sobre la espalda
  const tail = new THREE.Group();
  tail.position.set(0, sitting ? 0.12 : 0.32, sitting ? -0.18 : -0.2);
  const plume = ball(fur, [0, 0.1, 0], [0.06, 0.14, 0.06]);
  plume.rotation.x = -0.5;
  tail.add(plume);
  body.add(tail);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(0, 0, 0, 0.6)"), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.004;
  root.add(shadow);

  const bark = new THREE.Sprite(new THREE.SpriteMaterial({ map: barkTexture(barkText), transparent: true, depthWrite: false }));
  bark.visible = false;

  return { root, body, head, mouth, tail, legs, bark };
}

// 0..1 con un pico por cada ladrido
function barking(age: number, count: number, period = 0.36) {
  if (age < 0 || age > count * period) return 0;
  return Math.sin(Math.PI * ((age % period) / period));
}

function heartGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.45);
  shape.bezierCurveTo(-0.9, 0.15, -0.35, 0.85, 0, 0.35);
  shape.bezierCurveTo(0.35, 0.85, 0.9, 0.15, 0, -0.45);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 4,
    curveSegments: 16,
  });
  geometry.center();
  return geometry;
}

function heartMesh(geometry: THREE.BufferGeometry) {
  return new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: "#ff6f9a",
      emissive: "#ff2f6e",
      emissiveIntensity: 0.35,
      roughness: 0.3,
      clearcoat: 1,
      transparent: true,
      depthWrite: false,
    }),
  );
}

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return k * k * (3 - 2 * k);
};
// Sube entre a→b, se mantiene y baja entre c→d
const envelope = (x: number, a: number, b: number, c: number, d: number) => smooth(a, b, x) * (1 - smooth(c, d, x));

function hill(points: Point[], material: THREE.Material) {
  const shape = new THREE.Shape();
  // Se extiende de lado a lado para que no se vea el borde en pantallas anchas
  const first = points[0];
  const last = points[points.length - 1];
  shape.moveTo(-60, -14);
  shape.lineTo(-60, first[1]);
  shape.lineTo(...first);
  for (let i = 1; i + 2 < points.length; i += 3) {
    const [c1, c2, end] = [points[i], points[i + 1], points[i + 2]];
    shape.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
  }
  shape.lineTo(60, last[1]);
  shape.lineTo(60, -14);
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
        gl_FragColor = vec4(0.9, 0.96, 1.0, smoothstep(0.5, 0.0, d) * vAlpha);
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
    new THREE.SpriteMaterial({ map: glowTexture("rgba(190, 220, 255, 0.55)"), blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  outerGlow.scale.setScalar(26);
  const innerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture("rgba(240, 248, 255, 0.8)"), blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  innerGlow.scale.setScalar(14);
  moon.add(outerGlow, innerGlow, moonMesh);
  scene.add(moon);

  // Colinas (la lejana más clara para dar profundidad)
  const farHill = hill(
    [[-14, -2.6], [-8, -1.2], [-3, -2.8], [2, -2.4], [6, -2.1], [10, -1.6], [14, -2.4]],
    new THREE.MeshBasicMaterial({ color: "#132c57" }),
  );
  farHill.position.z = -6;
  const nearHill = hill(
    [[-14, -3.6], [-6, -2.7], [-2, -2.15], [0.4, -2.15], [3, -2.2], [6, -3.2], [14, -3.8]],
    new THREE.MeshBasicMaterial({ color: "#071530" }),
  );
  // Un poco atrás para que la perrita pueda correr por detrás de la pareja
  nearHill.position.set(0, -0.15, -1.2);
  scene.add(farHill, nearHill);

  // La pareja, centrada sobre la cima
  const lovers = new THREE.Group();
  lovers.position.set(0, -2.17, 0.45);
  scene.add(lovers);
  const him = funkoHim();
  const her = funkoHer();
  him.root.position.x = -0.62;
  her.root.position.x = 0.62;
  lovers.add(him.root, her.root);

  // Sombra suave bajo sus pies
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(0, 0, 0, 0.75)"), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  lovers.add(shadow);

  // La perrita blanca (adulta) sentada junto a ella; la negra (cachorra) corre alrededor
  const whiteDog = funkoDog(LOOK.whiteDog, true, "¡Guau!");
  whiteDog.root.position.set(1.2, 0, 0.15);
  whiteDog.root.rotation.y = -0.35;
  const blackDog = funkoDog(LOOK.blackDog, false, "¡Wof!");
  blackDog.root.scale.setScalar(0.8);
  lovers.add(whiteDog.root, blackDog.root);
  scene.add(whiteDog.bark, blackDog.bark);
  const orbit = { x: 1.6, z: 0.8, stop: -0.35 };
  const barkAnchor = new THREE.Vector3();

  // Luz de luna por detrás (contraluz en el pelo y hombros), relleno celeste al frente
  scene.add(new THREE.HemisphereLight("#b8d4ff", "#0f2547", 1.1));
  const moonLight = new THREE.DirectionalLight("#e6f0ff", 3.2);
  moonLight.position.set(0.5, 4, -8);
  const fillLight = new THREE.DirectionalLight("#d6e8ff", 1.2);
  fillLight.position.set(-3, 2, 8);
  const kissLight = new THREE.PointLight("#ff6f9a", 0, 4, 1);
  const kissPoint = new THREE.Vector3(0, lovers.position.y + 1.5, lovers.position.z + 0.35);
  kissLight.position.copy(kissPoint).add(new THREE.Vector3(0, 0.6, 1.2));
  scene.add(moonLight, fillLight, kissLight);

  // Corazones 3D: unos suben sin parar y otros estallan con el beso
  const heartGeo = heartGeometry();
  const hearts = Array.from({ length: 8 }, (_, i) => {
    const mesh = heartMesh(heartGeo);
    mesh.userData = { offset: i / 8, drift: (rand() - 0.5) * 1.4, size: 0.12 + rand() * 0.08 };
    scene.add(mesh);
    return mesh;
  });
  const burst = Array.from({ length: 7 }, (_, i) => {
    const mesh = heartMesh(heartGeo);
    mesh.userData = { angle: Math.PI * (0.12 + (0.76 * i) / 6), spin: (rand() - 0.5) * 6 };
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
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

  let lookY = 0;
  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // En pantallas verticales la cámara mira un poco más arriba: la escena baja,
    // la tierra ocupa menos y la frase de arriba no se monta sobre la luna.
    lookY = camera.aspect < 0.8 ? 2.6 : 0;
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
      // La cámara se acerca a la pareja mientras sale la luna
      camera.position.z = 13.5 - 3.5 * (1 - (1 - rise) ** 3);
      camera.position.x += (Math.sin(t * 0.15) * 0.3 + pointer.x * 0.45 - camera.position.x) * 0.04;
      camera.position.y += (0.3 - pointer.y * 0.25 - camera.position.y) * 0.04;
    }
    camera.lookAt(0, lookY, -10);
    moonMesh.rotation.y = t * 0.02;

    // Coreografía en bucle: se miran → beso con pie arriba → vuelven al frente
    const cycle = reducedMotion || t < 4 ? -1 : (t - 4) % 13;
    const turn = reducedMotion ? 0.35 : envelope(cycle, 0, 1.1, 6, 7.1);
    const lean = envelope(cycle, 1.1, 2.1, 4.6, 5.6);

    for (const [figure, side] of [[him, 1], [her, -1]] as const) {
      const { body, head, eyes, armIn, armOut, phase } = figure;
      const wobble = reducedMotion ? 0 : 1;
      body.rotation.y = side * turn * 0.38;
      figure.root.rotation.z = -side * lean * 0.065;
      body.position.y = Math.sin(t * 1.6 + phase) * 0.008 * wobble;
      // Cabeza de bobblehead: se bambolea y se inclina hacia la otra en el beso
      head.rotation.z = -side * lean * 0.14 + Math.sin(t * 1.7 + phase) * 0.05 * wobble;
      head.rotation.x = Math.sin(t * 1.3 + phase) * 0.04 * wobble - turn * 0.04;
      head.rotation.y = side * turn * 0.12;
      // Se toman de la mano; el brazo libre se balancea un poco
      armIn.rotation.z = side * (side === 1 ? 0.89 : 1.04) + Math.sin(t * 1.1) * 0.03;
      armOut.rotation.z = -side * (0.18 + lean * 0.5) + Math.sin(t * 1.4 + phase) * 0.05 * wobble;
      // Parpadean y cierran los ojos al besarse
      const blink = (t + phase) % 3.7 < 0.12 ? 0.1 : 1;
      eyes.scale.y = lean > 0.6 ? 0.12 : blink;
    }
    // Ella se pone de puntitas, levanta el pie y el pelo se mece
    her.body.position.y += lean * 0.06;
    her.legKick!.rotation.x = lean * 1.1;
    her.hairBack!.rotation.x = 0.06 + Math.sin(t * 1.2) * 0.04 - lean * 0.08;
    her.hairBack!.rotation.z = Math.sin(t * 0.9) * 0.03;
    kissLight.intensity = lean * 0.5;

    // Perritas, en ciclos de 6 s: la negra da una vuelta completa a la pareja,
    // frena delante y ladra; cada dos vueltas la blanca le ladra mientras pasa.
    const dogCycle = reducedMotion ? 5.95 : t % 6;
    const lap = smooth(0, 4.5, dogCycle);
    const run = dogCycle < 4.5 ? Math.sin((Math.PI * dogCycle) / 4.5) : 0;
    const angle = orbit.stop + lap * Math.PI * 2;
    const puppy = blackDog;
    puppy.root.position.set(Math.sin(angle) * orbit.x, 0, Math.cos(angle) * orbit.z);
    const heading = Math.atan2(Math.cos(angle) * orbit.x, -Math.sin(angle) * orbit.z);
    puppy.root.rotation.y = heading * Math.min(run * 3, 1);
    const puppyBark = barking(dogCycle - 4.65, 3);
    puppy.body.position.y = Math.abs(Math.sin(t * 18)) * 0.05 * run + puppyBark * 0.04;
    puppy.legs.forEach((leg, i) => (leg.rotation.x = Math.sin(t * 18 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.7 * run));
    puppy.tail.rotation.z = Math.sin(t * 16) * 0.6;
    puppy.head.rotation.x = -puppyBark * 0.3 + Math.sin(t * 3) * 0.05;
    puppy.mouth.scale.y = 0.2 + puppyBark * 1.2;

    const scolds = !reducedMotion && Math.floor(t / 6) % 2 === 1;
    const whiteBark = scolds ? barking(dogCycle - 2, 2, 0.42) : 0;
    const watch = scolds ? envelope(dogCycle, 1.5, 1.9, 2.9, 3.4) : 0;
    const { root: wr } = whiteDog;
    const towardPuppy = Math.atan2(puppy.root.position.x - wr.position.x, puppy.root.position.z - wr.position.z) - wr.rotation.y;
    const towardPuppyClamped = Math.max(-1.3, Math.min(1.3, Math.atan2(Math.sin(towardPuppy), Math.cos(towardPuppy))));
    whiteDog.head.rotation.y = watch * towardPuppyClamped + (1 - watch) * Math.sin(t * 0.5) * 0.25;
    whiteDog.head.rotation.x = -whiteBark * 0.25;
    whiteDog.head.rotation.z = Math.sin(t * 0.8) * 0.06 * (1 - watch);
    whiteDog.mouth.scale.y = 0.2 + whiteBark * 1.1;
    whiteDog.body.position.y = whiteBark * 0.015;
    whiteDog.tail.rotation.z = Math.sin(t * 4) * 0.3;

    for (const [dog, amount, age, length] of [
      [puppy, puppyBark, dogCycle - 4.65, 1.08],
      [whiteDog, whiteBark, scolds ? dogCycle - 2 : -1, 0.84],
    ] as const) {
      const show = envelope(age, -0.05, 0.05, length, length + 0.35);
      dog.bark.visible = show > 0;
      if (!show) continue;
      dog.head.getWorldPosition(barkAnchor);
      dog.bark.position.set(barkAnchor.x, barkAnchor.y + 0.35 + Math.max(age, 0) * 0.15, barkAnchor.z + 0.1);
      dog.bark.scale.setScalar(0.55 * (0.9 + amount * 0.2));
      dog.bark.material.opacity = show;
    }

    for (const heart of hearts) {
      const { offset, drift, size } = heart.userData;
      const p = ((t * 0.1 * speed) + offset) % 1;
      heart.position.set(Math.sin(p * 6 + offset * 10) * 0.25 + drift * p, lovers.position.y + 1.85 + p * 3.8, 0.6);
      heart.rotation.y = t * 1.5 + offset * 6;
      heart.scale.setScalar(size * (0.4 + p * 0.8));
      heart.material.opacity = Math.sin(Math.PI * p) * 0.9;
    }

    const burstAge = cycle - 2;
    for (const heart of burst) {
      heart.visible = burstAge >= 0 && burstAge < 2.2;
      if (!heart.visible) continue;
      const { angle, spin } = heart.userData;
      const reach = 1 - (1 - Math.min(burstAge / 1.6, 1)) ** 2;
      heart.position.set(
        kissPoint.x + Math.cos(angle) * reach * 1.3,
        kissPoint.y + 0.2 + Math.sin(angle) * reach * 1.1 + burstAge * 0.2,
        kissPoint.z + 0.2,
      );
      heart.rotation.set(0, burstAge * spin, Math.sin(burstAge * 4) * 0.2);
      heart.scale.setScalar(0.17 * Math.min(burstAge * 5, 1));
      heart.material.opacity = 1 - smooth(1.2, 2.2, burstAge);
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
