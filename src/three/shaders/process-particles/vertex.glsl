// position = galaxy (shape 0), aTarget1..4 = eye, wireframe, code, rocket
attribute vec3 aTarget1;
attribute vec3 aTarget2;
attribute vec3 aTarget3;
attribute vec3 aTarget4;
attribute vec4 aTones; // tone for shapes 1..4 (shape 0 uses aRandom)
attribute float aRandom;
attribute float aSize;
attribute float aFlame;

uniform float uTime;
uniform float uMorph; // 0..4
uniform float uTurbulence;
uniform float uIntro; // 0 = scattered, 1 = gathered
uniform float uExplode; // 0 = intact, 1 = blown away
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uMouse; // in object space
uniform float uMouseStrength;
uniform vec2 uFlameDir;
uniform vec3 uColorsA[5];
uniform vec3 uColorsB[5];

varying vec3 vColor;
varying float vAlpha;

#define PI 3.141592653589793
#define STAGGER 0.5

// Simplex 3D noise — Ashima Arts / Stefan Gustavson (MIT)
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 noise3(vec3 p) {
  return vec3(
    snoise(p),
    snoise(p + vec3(31.4, 17.2, 9.1)),
    snoise(p + vec3(-11.7, 43.9, 27.3))
  );
}

vec3 galaxy() {
  // differential rotation: inner stars orbit faster
  float r = length(position.xz) + 0.4;
  float a = uTime * 0.12 / r;
  float c = cos(a);
  float s = sin(a);
  vec3 spun = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c);

  // tilt the disc toward the camera
  const float tc = 0.4976; // cos(1.05)
  const float ts = 0.8674; // sin(1.05)
  return vec3(spun.x, spun.y * tc - spun.z * ts, spun.y * ts + spun.z * tc);
}

vec3 shapeAt(int index, vec3 galaxyPos) {
  if (index == 0) return galaxyPos;
  if (index == 1) return aTarget1;
  if (index == 2) return aTarget2;
  if (index == 3) return aTarget3;
  return aTarget4;
}

float toneAt(int index) {
  if (index == 0) return aRandom;
  if (index == 1) return aTones.x;
  if (index == 2) return aTones.y;
  if (index == 3) return aTones.z;
  return aTones.w;
}

void main() {
  float morph = clamp(uMorph, 0.0, 4.0);
  int seg = int(min(floor(morph), 3.0));
  float local = morph - float(seg);

  // each particle starts its trip at a different moment -> sweeping wave
  float p = clamp((local - aRandom * STAGGER) / (1.0 - STAGGER), 0.0, 1.0);
  p = p < 0.5 ? 4.0 * p * p * p : 1.0 - pow(-2.0 * p + 2.0, 3.0) * 0.5;
  float energy = sin(p * PI);

  vec3 galaxyPos = galaxy();
  vec3 pos = mix(shapeAt(seg, galaxyPos), shapeAt(seg + 1, galaxyPos), p);

  // swoop through depth while travelling
  pos.z += energy * (aRandom - 0.5) * 3.0;

  // turbulence: strong in flight, a soft breath at rest
  vec3 n = noise3(pos * 0.55 + uTime * 0.12);
  pos += n * (energy * uTurbulence + 0.045);

  // flame: particles stream out of the nozzle while the rocket is formed
  float rocket = seg == 3 ? p : 0.0;
  float flameLife = fract(uTime * 0.9 + aRandom * 7.31);
  if (aFlame > 0.5) {
    vec2 side = vec2(-uFlameDir.y, uFlameDir.x);
    float wobble = (fract(aRandom * 13.7) - 0.5);
    pos.xy += (uFlameDir * flameLife * 2.1 + side * wobble * flameLife * 0.9) * rocket;
  }

  // intro: start as a wide, faint cloud and gather
  pos = mix(pos * (2.4 + aRandom * 1.5) + n * 1.5, pos, uIntro);

  // exit: blast outward
  vec3 blastDir = normalize(pos + vec3(0.001)) + n * 0.6;
  pos += blastDir * uExplode * (3.0 + aRandom * 6.0);

  // mouse: repel + swirl, the shape heals itself once the cursor moves away
  vec3 toP = pos - uMouse;
  float d = length(toP.xy);
  float force = smoothstep(1.5, 0.0, d) * uMouseStrength;
  vec2 dir = toP.xy / max(d, 0.0001);
  pos.xy += dir * force * 0.55 + vec2(-dir.y, dir.x) * force * 0.5;
  pos.z += force * (aRandom - 0.3) * 1.2;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float sizeBoost = 1.0 + energy * 0.7 + force * 0.8;
  gl_PointSize = uSize * aSize * uPixelRatio * sizeBoost / -mvPosition.z;

  // color: blend palettes of both shapes, burn hotter while moving
  vec3 fromColor = mix(uColorsA[seg], uColorsB[seg], toneAt(seg));
  vec3 toColor = mix(uColorsA[seg + 1], uColorsB[seg + 1], toneAt(seg + 1));
  vColor = mix(fromColor, toColor, p);
  vColor += vec3(1.0, 0.75, 0.5) * energy * 0.35;
  vColor += vec3(0.25, 0.6, 1.0) * force * 0.6;

  float flameAlpha = aFlame > 0.5 ? mix(1.0, 1.0 - flameLife, rocket) : 1.0;
  vAlpha = (0.45 + aRandom * 0.55) * flameAlpha * mix(0.15, 1.0, uIntro) * (1.0 - uExplode);
}
