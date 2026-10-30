import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PerspectiveCamera,
  Plane,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import gsap from "gsap";
import vertexShader from "../shaders/process-particles/vertex.glsl";
import fragmentShader from "../shaders/process-particles/fragment.glsl";
import dustVertexShader from "../shaders/process-dust/vertex.glsl";
import dustFragmentShader from "../shaders/process-dust/fragment.glsl";
import { BREAKPOINTS } from "../../utils/sizes";
import { ROCKET_TILT, createCode, createEye, createGalaxy, createRocket, createWireframe } from "./shapes";

/**
 * Self-contained WebGL scene for the Process section.
 * It owns its renderer so it never interferes with the main hologram scene,
 * and it only renders while the section is on screen.
 */

const CAMERA_DISTANCE = 11;
const CAMERA_FOV = 35;
const BACKGROUND = new Color("#2d2a24");

const palettes: [string, string][] = [
  ["#f6c177", "#34bfff"], // galaxy: warm core, cyan arms
  ["#fff7ea", "#1fa8ff"], // eye
  ["#f5efe6", "#ff8400"], // wireframe
  ["#ff8400", "#34bfff"], // code
  ["#f5efe6", "#ff6a00"], // rocket
];

/** Values driven by the scroll timeline (GSAP tweens these directly). */
export const processState = {
  morph: 0,
  intro: 0,
  explode: 0,
  warp: 0,
  rotation: 0,
};

let renderer: WebGLRenderer | null = null;
let canvas: HTMLCanvasElement | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let group: Group | null = null;
let particles: Points | null = null;
let dust: Points | null = null;
let resizeObserver: ResizeObserver | null = null;

let active = false;
let paused = false;
let elapsed = 0;
let travel = 0;
let baseSize = 34;
let reducedMotion = false;

const pointer = {
  ndc: new Vector2(),
  inside: false,
  velocity: 0,
  tiltX: 0,
  tiltY: 0,
};
const smoothMouse = new Vector3(0, 0, 100);
const mouseTarget = new Vector3();
const raycaster = new Raycaster();
const mousePlane = new Plane(new Vector3(0, 0, 1), 0);

const flameDir = new Vector2(Math.sin(ROCKET_TILT), -Math.cos(ROCKET_TILT));

const uniforms = {
  uTime: { value: 0 },
  uMorph: { value: 0 },
  uTurbulence: { value: 1.6 },
  uIntro: { value: 0 },
  uExplode: { value: 0 },
  uSize: { value: baseSize },
  uPixelRatio: { value: 1 },
  uMouse: { value: new Vector3(0, 0, 100) },
  uMouseStrength: { value: 0 },
  uFlameDir: { value: flameDir },
  uColorsA: { value: palettes.map(([a]) => new Color(a)) },
  uColorsB: { value: palettes.map(([, b]) => new Color(b)) },
};

const dustUniforms = {
  uTime: { value: 0 },
  uTravel: { value: 0 },
  uWarp: { value: 0 },
  uFlameDir: { value: flameDir },
  uSize: { value: 30 },
  uPixelRatio: { value: 1 },
  uBounds: { value: new Vector3(8, 5, 0) },
  uColor: { value: new Color("#f5efe6") },
  uOpacity: { value: 1 },
};

const createParticles = (count: number) => {
  const geometry = new BufferGeometry();
  const flames = new Float32Array(count);

  const galaxy = createGalaxy(count);
  const eye = createEye(count);
  const wireframe = createWireframe(count);
  const code = createCode(count);
  const rocket = createRocket(count, flames);

  const tones = new Float32Array(count * 4);
  const randoms = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    tones[i * 4] = eye.tones[i]!;
    tones[i * 4 + 1] = wireframe.tones[i]!;
    tones[i * 4 + 2] = code.tones[i]!;
    tones[i * 4 + 3] = rocket.tones[i]!;
    randoms[i] = Math.random();
    sizes[i] = 0.5 + Math.pow(Math.random(), 3) * 1.6;
  }

  geometry.setAttribute("position", new BufferAttribute(galaxy.positions, 3));
  geometry.setAttribute("aTarget1", new BufferAttribute(eye.positions, 3));
  geometry.setAttribute("aTarget2", new BufferAttribute(wireframe.positions, 3));
  geometry.setAttribute("aTarget3", new BufferAttribute(code.positions, 3));
  geometry.setAttribute("aTarget4", new BufferAttribute(rocket.positions, 3));
  geometry.setAttribute("aTones", new BufferAttribute(tones, 4));
  geometry.setAttribute("aRandom", new BufferAttribute(randoms, 1));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  geometry.setAttribute("aFlame", new BufferAttribute(flames, 1));

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  // the shader moves points far from their bind positions
  points.frustumCulled = false;
  return points;
};

const createDust = (count: number) => {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = Math.random() * 2 - 1;
    positions[i * 3 + 1] = Math.random() * 2 - 1;
    positions[i * 3 + 2] = -6 + Math.random() * 8;
    randoms[i] = Math.random();
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new BufferAttribute(randoms, 1));

  const material = new ShaderMaterial({
    vertexShader: dustVertexShader,
    fragmentShader: dustFragmentShader,
    uniforms: dustUniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return points;
};

const resize = () => {
  if (!renderer || !camera || !canvas || !group) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  const isSmall = width < BREAKPOINTS.md;
  const pixelRatio = Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const visibleHeight = 2 * Math.tan((CAMERA_FOV * Math.PI) / 360) * CAMERA_DISTANCE;
  const visibleWidth = visibleHeight * camera.aspect;
  const isLandscape = width >= BREAKPOINTS.md && camera.aspect > 1;

  if (isLandscape) {
    // shape on the right, copy on the left
    group.scale.setScalar(Math.min((visibleHeight * 0.62) / 4.2, (visibleWidth * 0.42) / 5));
    group.position.set(visibleWidth * 0.2, -visibleHeight * 0.02, 0);
  } else {
    // shape on top, copy at the bottom
    group.scale.setScalar(Math.min((visibleWidth * 0.84) / 5.2, (visibleHeight * 0.34) / 4.2));
    group.position.set(0, visibleHeight * 0.12, 0);
  }

  uniforms.uPixelRatio.value = pixelRatio;
  uniforms.uSize.value = baseSize * (height / 900) * group.scale.x;
  dustUniforms.uPixelRatio.value = pixelRatio;
  dustUniforms.uSize.value = 30 * (height / 900);
  dustUniforms.uBounds.value.set(visibleWidth * 0.75, visibleHeight * 0.75, 0);
};

const handlePointerMove = (event: PointerEvent) => {
  if (!canvas || event.pointerType !== "mouse") return;

  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  pointer.inside = x >= -1 && x <= 1 && y >= -1 && y <= 1;
  pointer.velocity = Math.min(pointer.velocity + Math.hypot(x - pointer.ndc.x, y - pointer.ndc.y) * 4, 1.5);
  pointer.ndc.set(x, y);
};

const handlePointerLeave = () => {
  pointer.inside = false;
};

const tick = (_time: number, deltaTime: number) => {
  if (!active || paused || !renderer || !scene || !camera || !group) return;

  const dt = Math.min(deltaTime / 1000, 1 / 20);
  const motion = reducedMotion ? 0.35 : 1;
  elapsed += dt * motion;

  // scroll-driven values
  uniforms.uTime.value = elapsed;
  uniforms.uMorph.value = processState.morph;
  uniforms.uIntro.value = processState.intro;
  uniforms.uExplode.value = processState.explode;

  // mouse: project onto the z=0 plane, then into the shape's local space
  raycaster.setFromCamera(pointer.ndc, camera);
  if (raycaster.ray.intersectPlane(mousePlane, mouseTarget)) {
    group.worldToLocal(mouseTarget);
    smoothMouse.lerp(mouseTarget, 1 - Math.pow(0.001, dt));
  }
  uniforms.uMouse.value.copy(smoothMouse);

  pointer.velocity *= Math.pow(0.05, dt);
  const strengthTarget = pointer.inside ? 0.55 + pointer.velocity * 0.6 : 0;
  uniforms.uMouseStrength.value += (strengthTarget - uniforms.uMouseStrength.value) * (1 - Math.pow(0.02, dt));

  // the whole shape leans toward the cursor and keeps a slow idle sway
  const tiltTargetX = pointer.inside ? pointer.ndc.y * -0.18 : 0;
  const tiltTargetY = pointer.inside ? pointer.ndc.x * 0.3 : 0;
  pointer.tiltX += (tiltTargetX - pointer.tiltX) * (1 - Math.pow(0.05, dt));
  pointer.tiltY += (tiltTargetY - pointer.tiltY) * (1 - Math.pow(0.05, dt));

  group.rotation.x = pointer.tiltX + Math.sin(elapsed * 0.4) * 0.05;
  group.rotation.y = processState.rotation + pointer.tiltY + Math.sin(elapsed * 0.3) * 0.12;

  // star field: rushes past during the launch
  travel += dt * (0.03 + processState.warp * 1.4) * motion;
  dustUniforms.uTime.value = elapsed;
  dustUniforms.uTravel.value = travel;
  dustUniforms.uWarp.value = processState.warp;
  dustUniforms.uOpacity.value = 1 - processState.explode * 0.6;

  renderer.render(scene, camera);
};

const init = (_canvas: HTMLCanvasElement) => {
  if (renderer) return;
  canvas = _canvas;

  const isSmall = window.innerWidth < BREAKPOINTS.md || window.matchMedia("(pointer: coarse)").matches;
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  baseSize = isSmall ? 44 : 34;
  uniforms.uTurbulence.value = reducedMotion ? 0.5 : isSmall ? 1.2 : 1.6;

  renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(BACKGROUND);

  scene = new Scene();
  camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_DISTANCE);

  group = new Group();
  particles = createParticles(isSmall ? 6000 : 14000);
  group.add(particles);
  scene.add(group);

  dust = createDust(isSmall ? 350 : 1100);
  scene.add(dust);

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  // compile now so the first visible frame doesn't hitch
  renderer.compile(scene, camera);

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", handlePointerLeave);
  gsap.ticker.add(tick);
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
  document.documentElement.removeEventListener("pointerleave", handlePointerLeave);

  resizeObserver?.disconnect();
  resizeObserver = null;

  for (const points of [particles, dust]) {
    if (!points) continue;
    points.geometry.dispose();
    (points.material as ShaderMaterial).dispose();
  }

  renderer?.dispose();
  renderer = null;
  scene = null;
  camera = null;
  group = null;
  particles = null;
  dust = null;
  canvas = null;
  active = false;
  elapsed = 0;
  travel = 0;
};

export const processScene = { init, destroy, setActive, setPaused };
