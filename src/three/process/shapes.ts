/**
 * Procedural point clouds for the Process section.
 * Every shape writes `count` points into a Float32Array (xyz) plus a tone per point (0..1)
 * that the shader uses to pick between the shape's two palette colors.
 * All shapes fit roughly inside a 5 x 4.2 box centred on the origin.
 */

export const ROCKET_TILT = -0.55; // radians, rocket leans to the right

export type ShapeData = {
  positions: Float32Array;
  tones: Float32Array;
};

type Segment = [number, number, number, number, number?]; // x1, y1, x2, y2, z

const rand = (min = 0, max = 1) => min + Math.random() * (max - min);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

const createShape = (count: number): ShapeData => ({
  positions: new Float32Array(count * 3),
  tones: new Float32Array(count),
});

const write = (shape: ShapeData, i: number, x: number, y: number, z: number, tone: number) => {
  shape.positions[i * 3] = x;
  shape.positions[i * 3 + 1] = y;
  shape.positions[i * 3 + 2] = z;
  shape.tones[i] = tone;
};

/** Picks a segment proportionally to its length and returns a point on it. */
const createSegmentSampler = (segments: Segment[]) => {
  const lengths = segments.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1));
  const total = lengths.reduce((a, b) => a + b, 0);

  return () => {
    let r = Math.random() * total;
    let index = 0;
    while (index < segments.length - 1 && r > lengths[index]!) {
      r -= lengths[index]!;
      index++;
    }
    const [x1, y1, x2, y2, z = 0] = segments[index]!;
    const t = Math.random();
    return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, z, index };
  };
};

const rect = (x: number, y: number, w: number, h: number, z = 0): Segment[] => [
  [x, y, x + w, y, z],
  [x + w, y, x + w, y - h, z],
  [x + w, y - h, x, y - h, z],
  [x, y - h, x, y, z],
];

/* ───────────────────────── 0 · Galaxy (initial chaos) ───────────────────────── */
export const createGalaxy = (count: number): ShapeData => {
  const shape = createShape(count);
  const arms = 3;

  for (let i = 0; i < count; i++) {
    const radius = Math.pow(Math.random(), 1.6) * 4.2 + 0.08;
    const arm = (i % arms) / arms;
    const spin = radius * 0.9;
    const angle = arm * Math.PI * 2 + spin;
    const spread = 0.35 * radius * Math.pow(Math.random(), 2);

    const x = Math.cos(angle) * radius + gauss() * spread;
    const z = Math.sin(angle) * radius + gauss() * spread;
    const y = gauss() * 0.25 * (1.2 - radius / 4.2);

    // the disc is flat here; the shader spins it and tilts it toward the camera
    write(shape, i, x, y, z, radius / 4.2);
  }

  return shape;
};

/* ───────────────────────── 1 · Eye (Discover) ───────────────────────── */
export const createEye = (count: number): ShapeData => {
  const shape = createShape(count);
  const w = 2.3;
  const h = 1.15;

  for (let i = 0; i < count; i++) {
    const r = Math.random();

    if (r < 0.26) {
      // almond outline (two lids)
      const x = rand(-w, w);
      const lid = Math.random() < 0.5 ? 1 : -1;
      const y = lid * h * (1 - Math.pow(x / w, 2)) * (lid > 0 ? 1 : 0.85);
      write(shape, i, x + gauss() * 0.03, y + gauss() * 0.03, gauss() * 0.05, 0.15);
    } else if (r < 0.66) {
      // iris with radial streaks
      const spokes = 64;
      const angle = (Math.floor(Math.random() * spokes) / spokes) * Math.PI * 2 + gauss() * 0.02;
      const radius = rand(0.42, 0.98);
      const bulge = 0.35 * (1 - radius * radius);
      write(shape, i, Math.cos(angle) * radius, Math.sin(angle) * radius, bulge, 0.35 + radius * 0.5);
    } else if (r < 0.74) {
      // pupil ring
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.38 + gauss() * 0.02;
      write(shape, i, Math.cos(angle) * radius, Math.sin(angle) * radius, 0.3, 1);
    } else if (r < 0.77) {
      // light reflection
      write(shape, i, 0.32 + gauss() * 0.07, 0.3 + gauss() * 0.07, 0.45, 0);
    } else {
      // dashed scanning ring around the eye
      const dashes = 48;
      const dash = Math.floor(Math.random() * dashes);
      const angle = ((dash + Math.random() * 0.45) / dashes) * Math.PI * 2;
      const radius = 2.55 + (dash % 2) * 0.12;
      write(shape, i, Math.cos(angle) * radius, Math.sin(angle) * radius * 0.82, -0.3, 0.6);
    }
  }

  return shape;
};

/* ───────────────────────── 2 · Wireframe layout (Design) ───────────────────────── */
export const createWireframe = (count: number): ShapeData => {
  const shape = createShape(count);
  const left = -2.3;
  const top = 1.75;
  const width = 4.6;
  const height = 3.5;

  const frame: Segment[] = [
    ...rect(left, top, width, height, -0.2),
    [left, top - 0.35, left + width, top - 0.35, -0.2], // browser bar
  ];

  const blocks: Segment[] = [
    // nav
    [left + 2.3, top - 0.6, left + 2.7, top - 0.6, 0.1],
    [left + 2.9, top - 0.6, left + 3.3, top - 0.6, 0.1],
    [left + 3.5, top - 0.6, left + 4.3, top - 0.6, 0.1],
    // hero image placeholder (box + cross)
    ...rect(left + 0.3, top - 0.85, 2.0, 1.3, 0.25),
    [left + 0.3, top - 0.85, left + 2.3, top - 2.15, 0.25],
    [left + 2.3, top - 0.85, left + 0.3, top - 2.15, 0.25],
    // hero copy
    [left + 2.6, top - 1.0, left + 4.3, top - 1.0, 0.15],
    [left + 2.6, top - 1.25, left + 3.9, top - 1.25, 0.15],
    [left + 2.6, top - 1.5, left + 4.1, top - 1.5, 0.15],
    // button
    ...rect(left + 2.6, top - 1.75, 0.9, 0.35, 0.35),
    // cards
    ...rect(left + 0.3, top - 2.4, 1.2, 0.85, 0.05),
    ...rect(left + 1.7, top - 2.4, 1.2, 0.85, 0.05),
    ...rect(left + 3.1, top - 2.4, 1.2, 0.85, 0.05),
  ];

  const sampleFrame = createSegmentSampler(frame);
  const sampleBlocks = createSegmentSampler(blocks);
  const dotsStart = Math.floor(count * 0.97);

  for (let i = 0; i < count; i++) {
    if (i >= dotsStart) {
      // the three window dots
      const dot = i % 3;
      const angle = Math.random() * Math.PI * 2;
      write(shape, i, left + 0.2 + dot * 0.18 + Math.cos(angle) * 0.05, top - 0.175 + Math.sin(angle) * 0.05, -0.2, 1);
      continue;
    }

    const useFrame = Math.random() < 0.3;
    const p = useFrame ? sampleFrame() : sampleBlocks();
    const tone = useFrame ? 0 : p.index >= 3 && p.index <= 8 ? 0.9 : 0.35;
    write(shape, i, p.x + gauss() * 0.012, p.y + gauss() * 0.012, p.z + gauss() * 0.02, tone);
  }

  return shape;
};

/* ───────────────────────── 3 · Code brackets </> (Develop) ───────────────────────── */
export const createCode = (count: number): ShapeData => {
  const shape = createShape(count);

  const glyph: Segment[] = [
    [-0.85, 1.15, -2.1, 0],
    [-2.1, 0, -0.85, -1.15],
    [0.5, 1.55, -0.5, -1.55],
    [0.85, 1.15, 2.1, 0],
    [2.1, 0, 0.85, -1.15],
  ];
  const sampleGlyph = createSegmentSampler(glyph);

  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.8) {
      const p = sampleGlyph();
      const [x1, y1, x2, y2] = glyph[p.index]!;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const nx = -(y2 - y1) / len;
      const ny = (x2 - x1) / len;
      const thickness = gauss() * 0.11;
      write(shape, i, p.x + nx * thickness, p.y + ny * thickness, gauss() * 0.18, p.index === 2 ? 1 : 0.2);
    } else {
      // faint lines of "code" floating behind the glyph
      const line = Math.floor(Math.random() * 14);
      const indent = (line * 7) % 4;
      const length = 0.8 + ((line * 13) % 5) * 0.45;
      const x = -2.4 + indent * 0.3 + Math.random() * length;
      const y = 1.9 - line * 0.29;
      write(shape, i, x, y, -1.1 + gauss() * 0.03, 0.55);
    }
  }

  return shape;
};

/* ───────────────────────── 4 · Rocket (Deliver) ───────────────────────── */
const bodyHalfWidth = (y: number) => {
  if (y < -1.0 || y > 1.75) return -1;
  if (y < 0.55) return 0.5;
  return 0.5 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 0.55) / 1.2, 2)));
};

const inFin = (x: number, y: number) => {
  const ax = Math.abs(x);
  if (ax < 0.45 || y > -0.15 || y < -1.25) return false;
  // triangle from body edge sweeping down and out
  const t = (-0.15 - y) / 1.1;
  return ax < 0.5 + t * 0.55;
};

const inRocket = (x: number, y: number) => {
  const half = bodyHalfWidth(y);
  return (half > 0 && Math.abs(x) <= half) || inFin(x, y);
};

/** `flags` receives 1 for flame particles: the shader animates them flowing out of the nozzle. */
export const createRocket = (count: number, flags: Float32Array): ShapeData => {
  const shape = createShape(count);
  const cos = Math.cos(ROCKET_TILT);
  const sin = Math.sin(ROCKET_TILT);
  const offsetY = 0.15;

  const place = (i: number, x: number, y: number, z: number, tone: number) => {
    write(shape, i, x * cos - y * sin, x * sin + y * cos + offsetY, z, tone);
  };

  for (let i = 0; i < count; i++) {
    flags[i] = 0;
    const r = Math.random();

    if (r < 0.24) {
      // flame: starts at the nozzle, the shader pushes it out over time
      flags[i] = 1;
      place(i, gauss() * 0.28, -1.05, gauss() * 0.15, rand(0.75, 1));
    } else if (r < 0.3) {
      // porthole ring
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.22 + gauss() * 0.015;
      place(i, Math.cos(angle) * radius, 0.55 + Math.sin(angle) * radius, 0.3, 0.55);
    } else if (r < 0.62) {
      // silhouette edges (keeps the shape readable)
      let x = 0;
      let y = 0;
      do {
        y = rand(-1.25, 1.75);
        const half = bodyHalfWidth(y);
        x = half > 0 ? (Math.random() < 0.5 ? -half : half) : 0;
        if (y < -0.15 && Math.random() < 0.5) {
          const t = (-0.15 - y) / 1.1;
          x = (Math.random() < 0.5 ? -1 : 1) * (0.5 + t * 0.55);
        }
      } while (!inRocket(x * 0.999, y));
      place(i, x, y, gauss() * 0.04, 0.05);
    } else {
      // body fill, slightly rounded in depth
      let x = 0;
      let y = 0;
      do {
        x = rand(-1.05, 1.05);
        y = rand(-1.25, 1.75);
      } while (!inRocket(x, y) || Math.hypot(x, y - 0.55) < 0.2);
      const half = Math.max(bodyHalfWidth(y), 0.5);
      const depth = Math.sqrt(Math.max(0, 1 - Math.pow(x / (half + 0.05), 2))) * 0.35;
      place(i, x, y, (Math.random() < 0.5 ? -1 : 1) * depth * Math.random(), 0.15 + Math.random() * 0.2);
    }
  }

  return shape;
};
