uniform vec3 uColor;
uniform float uOpacity;

varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  float strength = pow(1.0 - d * 2.0, 3.0);
  gl_FragColor = vec4(uColor * strength, vAlpha * strength * uOpacity);

  #include <colorspace_fragment>
}
