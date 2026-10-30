uniform sampler2D uInk;
uniform float uInkAlpha;
uniform float uFlat; // 1 = unlit, matches the contact background exactly
uniform float uCrease; // fold marks left on the unfolded sheet
uniform vec3 uPaper;
uniform vec2 uCreaseA[2]; // point, direction (left half, sheet space)
uniform vec2 uCreaseB[2];
uniform vec2 uCreaseD[2];

varying vec2 vUv;
varying vec3 vView;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float lineSide(vec2 p, vec2 a, vec2 d) { return d.x * (p.y - a.y) - d.y * (p.x - a.x); }

vec2 reflectAcross(vec2 p, vec2 a, vec2 d) {
  vec2 r = p - a;
  return a + 2.0 * dot(r, d) * d - r;
}

// distance to the nearest real crease: walk through the folds like the paper did
float creaseDistance(vec2 uv) {
  vec2 p = vec2(-abs(uv.x * 2.0 - 1.0), uv.y * 2.8 - 1.4);

  float dist = abs(lineSide(p, uCreaseA[0], uCreaseA[1]));
  if (lineSide(p, uCreaseA[0], uCreaseA[1]) * lineSide(vec2(-1.0, 1.4), uCreaseA[0], uCreaseA[1]) > 0.0) {
    p = reflectAcross(p, uCreaseA[0], uCreaseA[1]);
  }

  dist = min(dist, abs(lineSide(p, uCreaseB[0], uCreaseB[1])));
  if (lineSide(p, uCreaseB[0], uCreaseB[1]) * lineSide(vec2(-1.0, 0.0), uCreaseB[0], uCreaseB[1]) > 0.0) {
    p = reflectAcross(p, uCreaseB[0], uCreaseB[1]);
  }

  dist = min(dist, abs(p.x));
  dist = min(dist, abs(lineSide(p, uCreaseD[0], uCreaseD[1])));
  return dist;
}

void main() {
  // flat-shaded facets straight from screen-space derivatives
  vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
  vec3 L = normalize(vec3(-0.4, 0.7, 0.8));
  float shade = 0.6 + 0.5 * max(dot(n, L), 0.0) + 0.12 * pow(1.0 - abs(n.z), 2.0);

  vec3 paper = uPaper * (gl_FrontFacing ? 1.0 : 0.94);
  paper += (hash(floor(vUv * 900.0)) - 0.5) * 0.025 * (1.0 - uFlat);

  vec4 ink = gl_FrontFacing ? texture2D(uInk, vUv) : vec4(0.0);
  vec3 color = mix(paper, ink.rgb, ink.a * uInkAlpha);

  // crease marks: a dark valley with a soft highlight beside it
  float d = creaseDistance(vUv);
  float valley = smoothstep(0.012, 0.0, d);
  float ridge = smoothstep(0.03, 0.012, d) - valley;
  color *= 1.0 - valley * 0.16 * uCrease;
  color += ridge * 0.03 * uCrease;

  color *= mix(shade, 1.0, uFlat);
  gl_FragColor = vec4(color, 1.0);
}
