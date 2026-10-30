import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Euler,
  Group,
  Line,
  LinearSRGBColorSpace,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import gsap from "gsap";
import paperVertexShader from "../shaders/paper/vertex.glsl";
import paperFragmentShader from "../shaders/paper/fragment.glsl";
import trailVertexShader from "../shaders/paper-trail/vertex.glsl";
import trailFragmentShader from "../shaders/paper-trail/fragment.glsl";
import { BREAKPOINTS } from "../../utils/sizes";
import { CREASES, createPaper, wingTip } from "./crease";
import { drawLetter, type LetterCopy } from "./letter";

/**
 * "Write. Fold. Send." — a letter folds itself into a paper plane, loops around
 * and flies back at the viewer, unfolding into the contact page.
 * Owns its renderer; renders only while the section is on screen.
 */

/** Scroll values (GSAP writes these). `enter` while the section slides in, `progress` while pinned. */
export const paperState = { enter: 0, progress: 0 };

/** Timeline landmarks shared with the DOM side of the section. */
export const PAPER_PHASES = {
  fold: 0.09, // "FOLD." from here
  send: 0.53, // "SEND." from here
  arrive: 0.84, // plane heads to the viewer and unfolds
  handoff: 0.965, // the sheet is the contact page now
};

// matches the contact background rgb(233, 222, 208)
const PAPER = new Color(0.914, 0.871, 0.816);
const CAMERA_FOV = 40;
const TRAIL_POINTS = 70;
const TRAIL_LENGTH = 0.12;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// folds land with a small paper "snap"
const easeOutBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
const fold = (a: number, b: number, v: number) => easeOutBack(clamp((v - a) / (b - a)));

let renderer: WebGLRenderer | null = null;
let canvas: HTMLCanvasElement | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let rig: Group | null = null;
let paper: ReturnType<typeof createPaper> | null = null;
let paperMesh: Mesh | null = null;
let trails: Line[] = [];
let letterTexture: CanvasTexture | null = null;
let resizeObserver: ResizeObserver | null = null;

let active = false;
let paused = false;
let elapsed = 0;
let cameraDistance = 6;
let arrivalDistance = 1.55;

const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

const path = new CatmullRomCurve3(
  [
    new Vector3(0, 0.1, 0),
    new Vector3(1.7, 1.1, -1.4),
    new Vector3(0.6, 2.0, -4.2),
    new Vector3(-2.3, 1.0, -4.0),
    new Vector3(-2.2, -1.1, -1.8),
    new Vector3(0.4, -1.3, -0.2),
    new Vector3(0.9, -0.3, 1.2),
    new Vector3(0, 0, 2.4),
  ],
  false,
  "centripetal",
);

/* ───────────── orientation helpers (local +y = nose, +z = up) ───────────── */

const basis = new Matrix4();
const axisX = new Vector3();
const axisY = new Vector3();
const axisZ = new Vector3();
const orient = (forward: Vector3, up: Vector3, out: Quaternion) => {
  axisY.copy(forward).normalize();
  axisZ.copy(up).addScaledVector(axisY, -up.dot(axisY)).normalize();
  axisX.crossVectors(axisY, axisZ);
  basis.makeBasis(axisX, axisY, axisZ);
  return out.setFromRotationMatrix(basis);
};

const tangent = new Vector3();
const tangentA = new Vector3();
const tangentB = new Vector3();
const bankUp = new Vector3();
const poseAt = (t: number, outPos: Vector3, outQuat: Quaternion) => {
  t = clamp(t);
  path.getPointAt(t, outPos);
  path.getTangentAt(clamp(t - 0.01), tangentA);
  path.getTangentAt(clamp(t + 0.01), tangentB);
  // bank into the turns: tilt "up" toward the centre of curvature
  bankUp.set(0, 1, 0).addScaledVector(tangentB.sub(tangentA), 0.35 / 0.02);
  orient(path.getTangentAt(t, tangent), bankUp, outQuat);
};

const qFace = new Quaternion();
const qShow = orient(new Vector3(0.45, 0.75, -0.35), new Vector3(-0.15, 0.25, 1), new Quaternion());
const qStart = new Quaternion();
poseAt(0, new Vector3(), qStart);

const tips = [wingTip(-1, new Vector3()), wingTip(1, new Vector3())];

/* ───────────── materials ───────────── */

const paperUniforms = {
  uInk: { value: null as CanvasTexture | null },
  uInkAlpha: { value: 1 },
  uFlat: { value: 0 },
  uCrease: { value: 0 },
  uPaper: { value: PAPER },
  uCreaseA: { value: [new Vector2(...CREASES.A.a), new Vector2(...CREASES.A.d)] },
  uCreaseB: { value: [new Vector2(...CREASES.B.a), new Vector2(...CREASES.B.d)] },
  uCreaseD: { value: [new Vector2(...CREASES.D.a), new Vector2(...CREASES.D.d)] },
};

const createTrail = () => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3));
  const t = new Float32Array(TRAIL_POINTS);
  for (let i = 0; i < TRAIL_POINTS; i++) t[i] = i / (TRAIL_POINTS - 1);
  geometry.setAttribute("aT", new BufferAttribute(t, 1));

  const line = new Line(
    geometry,
    new ShaderMaterial({
      vertexShader: trailVertexShader,
      fragmentShader: trailFragmentShader,
      uniforms: { uOpacity: { value: 0 }, uColor: { value: new Color("#ffb259") } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  line.frustumCulled = false;
  return line;
};

/* ───────────── layout ───────────── */

const resize = () => {
  if (!renderer || !camera || !canvas) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < BREAKPOINTS.md ? 1.5 : 2));
  renderer.setSize(width, height, false);

  const aspect = width / height;
  camera.aspect = aspect;
  // keep the sheet comfortably inside portrait screens
  cameraDistance = aspect < 0.8 ? (6 / aspect) * 0.75 : 6;
  camera.updateProjectionMatrix();

  // close enough that the unfolded sheet overfills the screen on any aspect ratio
  const tanHalf = Math.tan((CAMERA_FOV * Math.PI) / 360);
  arrivalDistance = Math.min(1.55, 1.9 / (2 * tanHalf * aspect), 2.66 / (2 * tanHalf));
};

const handlePointerMove = (event: PointerEvent) => {
  if (event.pointerType !== "mouse") return;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
};

/* ───────────── frame ───────────── */

const position = new Vector3();
const rotation = new Quaternion();
const tilt = new Quaternion();
const euler = new Euler();
const lookTarget = new Vector3();
const arrival = new Vector3();
const trailPos = new Vector3();
const trailQuat = new Quaternion();
const tipWorld = new Vector3();

const tick = (_time: number, deltaTime: number) => {
  if (!active || paused || !renderer || !scene || !camera || !rig || !paper) return;

  const dt = Math.min(deltaTime / 1000, 1 / 20);
  elapsed += dt;
  const k = 1 - Math.pow(0.02, dt);
  pointer.sx += (pointer.x - pointer.sx) * k;
  pointer.sy += (pointer.y - pointer.sy) * k;

  const p = paperState.progress;
  const { arrive } = PAPER_PHASES;

  // ─── folds (each lands with a snap, then opens again on arrival) ───
  paper.update({
    a: fold(0.1, 0.19, p) * (1 - smooth(0.9, 0.95, p)),
    b: fold(0.21, 0.3, p) * (1 - smooth(0.88, 0.93, p)),
    c: fold(0.33, 0.42, p) * (1 - smooth(0.86, 0.91, p)),
    d: fold(0.43, 0.51, p) * (1 - smooth(0.84, 0.89, p)),
  });

  // ─── where the paper is ───
  const flight = smooth(0.54, arrive, p);
  if (p < 0.54) {
    const enter = 1 - Math.pow(1 - paperState.enter, 3);
    position.set(0, -3.6 * (1 - enter) + Math.sin(elapsed * 1.2) * 0.04, 0);
    rotation.copy(qFace).slerp(qShow, smooth(0.3, 0.46, p));
    rotation.slerp(qStart, smooth(0.5, 0.54, p));
  } else {
    poseAt(flight, position, rotation);
  }

  if (p > arrive) {
    // flies straight at you and opens up
    arrival.set(0, 0, cameraDistance - arrivalDistance);
    position.lerp(arrival, smooth(arrive, 0.95, p));
    rotation.slerp(qFace, smooth(arrive, 0.93, p));
  }

  // tilt toward the cursor while the letter is "in hand"
  const inHand = 1 - smooth(0.5, 0.56, p);
  tilt.setFromEuler(euler.set(-pointer.sy * 0.25 * inHand, pointer.sx * 0.35 * inHand, 0));
  rig.position.copy(position);
  rig.quaternion.copy(rotation).multiply(tilt);

  paperUniforms.uInkAlpha.value = 1 - smooth(0.9, 0.95, p);
  paperUniforms.uCrease.value = smooth(0.88, 0.92, p) * (1 - smooth(0.95, 0.965, p));
  paperUniforms.uFlat.value = smooth(0.92, 0.96, p);

  // ─── wing-tip trails trace the path already flown ───
  const trailOpacity = smooth(0.55, 0.6, p) * (1 - smooth(0.8, 0.86, p));
  if (trailOpacity > 0) {
    for (let i = 0; i < TRAIL_POINTS; i++) {
      poseAt(flight - (1 - i / (TRAIL_POINTS - 1)) * TRAIL_LENGTH, trailPos, trailQuat);
      trails.forEach((trail, side) => {
        tipWorld.copy(tips[side]!).applyQuaternion(trailQuat).add(trailPos);
        (trail.geometry.attributes.position!.array as Float32Array).set([tipWorld.x, tipWorld.y, tipWorld.z], i * 3);
      });
    }
    trails.forEach((trail) => (trail.geometry.attributes.position!.needsUpdate = true));
  }
  trails.forEach((trail) => ((trail.material as ShaderMaterial).uniforms.uOpacity!.value = trailOpacity * 0.9));

  // ─── camera: follows the flight a little, parallax otherwise ───
  const following = flight > 0 && flight < 1 ? 0.3 * (1 - smooth(arrive, 0.9, p)) : 0;
  lookTarget.set(0, 0, 0).lerp(position, following);
  // parallax fades out on arrival so the sheet's edges never peek in
  const parallax = 1 - smooth(arrive, 0.92, p);
  camera.position.set(pointer.sx * 0.15 * parallax, pointer.sy * 0.1 * parallax, cameraDistance);
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
};

/* ───────────── lifecycle ───────────── */

const init = (_canvas: HTMLCanvasElement) => {
  if (renderer) return;
  canvas = _canvas;

  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  // the paper shader writes final colours so the sheet matches the contact background exactly
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  scene = new Scene();
  camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.05, 50);

  letterTexture = new CanvasTexture(document.createElement("canvas"));
  letterTexture.anisotropy = 8;
  paperUniforms.uInk.value = letterTexture;

  paper = createPaper();
  paperMesh = new Mesh(
    paper.geometry,
    new ShaderMaterial({
      vertexShader: paperVertexShader,
      fragmentShader: paperFragmentShader,
      uniforms: paperUniforms,
      side: DoubleSide,
    }),
  );
  paperMesh.frustumCulled = false;

  rig = new Group();
  rig.add(paperMesh);
  scene.add(rig);

  trails = [createTrail(), createTrail()];
  trails.forEach((trail) => scene!.add(trail));

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  gsap.ticker.add(tick);
};

/** Redraws the letter, e.g. after a language switch. */
const setLetter = async (copy: LetterCopy) => {
  try {
    await Promise.all([document.fonts.load("900 82px Urbanist"), document.fonts.load("700 36px Urbanist")]);
  } catch {
    /* draw with whatever font is available */
  }
  if (!letterTexture) return;
  drawLetter(letterTexture.image as HTMLCanvasElement, copy);
  letterTexture.needsUpdate = true;
};

const setActive = (value: boolean) => {
  active = value;
};

const setPaused = (value: boolean) => {
  paused = value;
};

const destroy = () => {
  gsap.ticker.remove(tick);
  window.removeEventListener("pointermove", handlePointerMove);

  resizeObserver?.disconnect();
  resizeObserver = null;

  paper?.geometry.dispose();
  (paperMesh?.material as ShaderMaterial | undefined)?.dispose();
  trails.forEach((trail) => {
    trail.geometry.dispose();
    (trail.material as ShaderMaterial).dispose();
  });
  letterTexture?.dispose();
  renderer?.dispose();

  renderer = null;
  scene = null;
  camera = null;
  rig = null;
  paper = null;
  paperMesh = null;
  trails = [];
  letterTexture = null;
  paperUniforms.uInk.value = null;
  canvas = null;
  active = false;
  elapsed = 0;
};

export const paperPlane = { init, destroy, setLetter, setActive, setPaused };
