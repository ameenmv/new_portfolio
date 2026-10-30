attribute float aT; // 0 = oldest, 1 = at the wing tip

varying float vT;

void main() {
  vT = aT;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
