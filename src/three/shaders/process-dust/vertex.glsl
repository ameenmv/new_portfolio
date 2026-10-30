attribute float aRandom;

uniform float uTime;
uniform float uTravel; // accumulated travel, speeds up during the rocket launch
uniform vec2 uFlameDir;
uniform float uWarp;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uBounds; // half extents of the visible box

varying float vAlpha;

void main() {
  // position.xy is normalized to -1..1 so the field always fills the viewport
  vec3 pos = vec3(position.xy * uBounds.xy, position.z);

  // drift along the flame direction; faster stars feel closer
  float speed = 0.4 + aRandom * 1.2;
  pos.xy += uFlameDir * uTravel * speed;
  pos.x += sin(uTime * 0.2 + aRandom * 40.0) * 0.15;

  // wrap inside the box
  pos.xy = mod(pos.xy + uBounds.xy, uBounds.xy * 2.0) - uBounds.xy;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float twinkle = 0.55 + 0.45 * sin(uTime * (1.0 + aRandom * 2.0) + aRandom * 60.0);
  gl_PointSize = uSize * (0.5 + aRandom) * uPixelRatio * (1.0 + uWarp * 1.5) / -mvPosition.z;
  vAlpha = (0.15 + aRandom * 0.35) * twinkle;
}
