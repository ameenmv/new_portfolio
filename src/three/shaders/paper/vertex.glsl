varying vec2 vUv;
varying vec3 vView;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vView = mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
