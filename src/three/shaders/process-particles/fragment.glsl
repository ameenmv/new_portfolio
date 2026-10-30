varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // bright core + soft halo
  float core = smoothstep(0.22, 0.0, d);
  float halo = pow(1.0 - d * 2.0, 2.5) * 0.55;
  float strength = core + halo;

  gl_FragColor = vec4(vColor * strength, vAlpha * strength);

  #include <colorspace_fragment>
}
