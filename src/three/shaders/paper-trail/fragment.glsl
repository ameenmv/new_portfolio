uniform float uOpacity;
uniform vec3 uColor;

varying float vT;

void main() {
  gl_FragColor = vec4(uColor, vT * vT * uOpacity);
}
