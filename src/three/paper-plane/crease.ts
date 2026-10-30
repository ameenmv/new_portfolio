import { BufferAttribute, BufferGeometry, Quaternion, Vector3 } from "three";

/**
 * Crease pattern + fold kinematics of a classic dart paper plane.
 * Sheet space: x -1..1, y -1.4..1.4, nose at the top centre.
 * The pattern is built for the left half and mirrored for the right one.
 */

export const HALF_W = 1;
export const HALF_H = 1.4;

type Vec2 = [number, number];
type Line = { a: Vec2; d: Vec2 };
type Flags = { A?: boolean; B?: boolean; D?: boolean };
type Vertex = { o: Vec2; s: Vec2 }; // original + current stage coordinates
type Piece = { poly: Vertex[]; flags: Flags };

export type Folds = { a: number; b: number; c: number; d: number };

const line = (a: Vec2, b: Vec2): Line => {
  const d: Vec2 = [b[0] - a[0], b[1] - a[1]];
  const l = Math.hypot(d[0], d[1]);
  return { a, d: [d[0] / l, d[1] / l] };
};
const side = (L: Line, p: Vec2) => L.d[0] * (p[1] - L.a[1]) - L.d[1] * (p[0] - L.a[0]);
const reflect = (L: Line, p: Vec2): Vec2 => {
  const r = [p[0] - L.a[0], p[1] - L.a[1]] as Vec2;
  const k = r[0] * L.d[0] + r[1] * L.d[1];
  return [L.a[0] + 2 * k * L.d[0] - r[0], L.a[1] + 2 * k * L.d[1] - r[1]];
};

const NOSE: Vec2 = [0, HALF_H];
export const CREASES = {
  A: line(NOSE, [-1, 0.4]), // corners to the centre line
  B: line(NOSE, [-1, HALF_H - 1 / Math.tan(Math.PI / 8)]), // slanted edges to the centre again
  D: line(NOSE, [-0.34, -HALF_H]), // wing fold
};
const { A, B, D } = CREASES;

const splitPoly = (poly: Vertex[], L: Line) => {
  const EPS = 1e-9;
  const pos: Vertex[] = [];
  const neg: Vertex[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const sp = side(L, p.s);
    const sq = side(L, q.s);
    // a vertex lying on the crease belongs to both halves
    if (sp >= -EPS) pos.push(p);
    if (sp <= EPS) neg.push(p);
    if ((sp > EPS && sq < -EPS) || (sp < -EPS && sq > EPS)) {
      const t = sp / (sp - sq);
      const lerp = (u: Vec2, v: Vec2): Vec2 => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t];
      const x = { o: lerp(p.o, q.o), s: lerp(p.s, q.s) };
      pos.push(x);
      neg.push(x);
    }
  }
  return [pos, neg].filter((p) => p.length >= 3);
};

const centroid = (poly: Vertex[]): Vec2 =>
  poly.reduce<Vec2>((c, v) => [c[0] + v.s[0] / poly.length, c[1] + v.s[1] / poly.length], [0, 0]);

const stage = (pieces: Piece[], L: Line, key: keyof Flags, ref: Vec2, mapReflect: boolean) =>
  pieces.flatMap((piece) =>
    splitPoly(piece.poly, L).map((poly) => {
      const inside = Math.sign(side(L, centroid(poly))) === Math.sign(side(L, ref));
      return {
        poly: mapReflect && inside ? poly.map((v) => ({ o: v.o, s: reflect(L, v.s) })) : poly,
        flags: { ...piece.flags, [key]: inside },
      };
    }),
  );

const buildPieces = () => {
  const rect: Vec2[] = [
    [-1, -HALF_H],
    [0, -HALF_H],
    [0, HALF_H],
    [-1, HALF_H],
  ];
  let pieces: Piece[] = [{ poly: rect.map((p) => ({ o: p, s: p })), flags: {} }];
  pieces = stage(pieces, A, "A", [-1, HALF_H], true);
  pieces = stage(pieces, B, "B", [-1, 0], true);
  pieces = stage(pieces, D, "D", [-1, -HALF_H], false);
  return pieces;
};

/* ───────────── kinematics ───────────── */

const v3 = (p: Vec2) => new Vector3(p[0], p[1], 0);
const tmpQ = new Quaternion();
const rotateAround = (v: Vector3, origin: Vector3, axis: Vector3, angle: number) => {
  tmpQ.setFromAxisAngle(axis, angle);
  return v.sub(origin).applyQuaternion(tmpQ).add(origin);
};

const axisA = v3(A.d);
const axisB = v3(B.d);
const axisY = new Vector3(0, 1, 0);
const originA = v3(A.a);
const originB = v3(B.a);
const hingeD0 = v3(D.a);
const hingeD1 = v3([D.a[0] + D.d[0], D.a[1] + D.d[1]]);
const ZERO = new Vector3();
const C_ANGLE = (Math.PI / 2) * 0.9;

// every flap folds toward the viewer (+z), the side carrying the letter
const signFor = (p: Vec2, origin: Vector3, axis: Vector3) => (rotateAround(v3(p), origin, axis, 0.1).z > 0 ? 1 : -1);
const signA = signFor([-0.8, 1.2], originA, axisA);
const signB = signFor([-0.9, -0.5], originB, axisB);
// wings swing back out to (almost) horizontal
const signD = (() => {
  const wing = v3([-0.9, -1.2]).applyAxisAngle(axisY, C_ANGLE);
  const h0 = hingeD0.clone().applyAxisAngle(axisY, C_ANGLE);
  const axis = hingeD1.clone().applyAxisAngle(axisY, C_ANGLE).sub(h0).normalize();
  return rotateAround(wing.clone(), h0, axis, 0.1).x < wing.x ? 1 : -1;
})();

const h0 = new Vector3();
const h1 = new Vector3();
const axisD = new Vector3();

const foldLeft = (o: Vec2, flags: Flags, f: Folds, out: Vector3) => {
  out.set(o[0], o[1], 0);
  if (flags.A) {
    rotateAround(out, originA, axisA, signA * f.a * Math.PI);
    out.z += 0.004 * f.a;
  }
  if (flags.B) {
    rotateAround(out, originB, axisB, signB * f.b * Math.PI);
    out.z += 0.004 * f.b;
  }
  const c = f.c * C_ANGLE;
  rotateAround(out, ZERO, axisY, c);
  if (flags.D && f.d > 0) {
    h0.copy(hingeD0).applyAxisAngle(axisY, c);
    h1.copy(hingeD1).applyAxisAngle(axisY, c);
    axisD.subVectors(h1, h0).normalize();
    rotateAround(out, h0, axisD, signD * f.d * C_ANGLE * 0.95);
  }
  return out;
};

export const foldPoint = (o: Vec2, flags: Flags, f: Folds, out: Vector3) => {
  const mirror = o[0] > 0;
  foldLeft(mirror ? [-o[0], o[1]] : o, flags, f, out);
  if (mirror) out.x = -out.x;
  return out;
};

/** Wing-tip position of the fully folded plane (local space), for the trails. */
export const wingTip = (side: -1 | 1, out: Vector3) =>
  foldPoint([side * HALF_W, -HALF_H], { D: true }, { a: 1, b: 1, c: 1, d: 1 }, out);

/** Paper geometry whose vertices are re-folded every frame with `update`. */
export const createPaper = () => {
  const pieces = buildPieces();
  const verts: { o: Vec2; flags: Flags }[] = [];
  const indices: number[] = [];

  for (const mirror of [false, true]) {
    for (const piece of pieces) {
      const base = verts.length;
      for (const v of piece.poly) verts.push({ o: mirror ? [-v.o[0], v.o[1]] : v.o, flags: piece.flags });
      for (let i = 1; i < piece.poly.length - 1; i++) {
        // mirrored pieces flip winding so the letter stays on the front face
        if (mirror) indices.push(base, base + i + 1, base + i);
        else indices.push(base, base + i, base + i + 1);
      }
    }
  }

  const geometry = new BufferGeometry();
  const positions = new Float32Array(verts.length * 3);
  const uvs = new Float32Array(verts.length * 2);
  verts.forEach((v, i) => {
    uvs[i * 2] = (v.o[0] + HALF_W) / (2 * HALF_W);
    uvs[i * 2 + 1] = (v.o[1] + HALF_H) / (2 * HALF_H);
  });
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const tmp = new Vector3();
  const update = (f: Folds) => {
    verts.forEach((v, i) => {
      foldPoint(v.o, v.flags, f, tmp);
      positions[i * 3] = tmp.x;
      positions[i * 3 + 1] = tmp.y;
      positions[i * 3 + 2] = tmp.z;
    });
    geometry.attributes.position!.needsUpdate = true;
    geometry.computeBoundingSphere();
  };

  return { geometry, update };
};
