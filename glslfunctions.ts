// adapted from The Book of Shaders
export const glslFuncs = {
  // TODO replace with a better one
  random: `float random(vec2 st) {
  return fract(sin(dot(st.xy / 99., vec2(12.9898, 78.233))) * 43758.5453123);
}`,

  rotate2d: `mat2 rotate2d(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}`,

  scale: `mat2 scale(vec2 scale) {
  return mat2(scale.x, 0.0, 0.0, scale.y);
}`,

  hsv2rgb: `vec3 hsv2rgb(vec3 c){
  vec3 rgb = clamp(abs(mod(
    c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  rgb = rgb * rgb * (3.0 - 2.0 * rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}`,

  rgb2hsv: `vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz),
               vec4(c.gb, K.xy),
               step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r),
               vec4(c.r, p.yzx),
               step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
              d / (q.x + e),
              q.x);
}`,
  // adapted from https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/5.glsl
  gauss5: `vec4 gauss5(vec2 dir) {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 direction = dir;
  vec4 col = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  col += texture2D(uSampler, uv) * 0.29411764705882354;
  col += texture2D(uSampler, uv + (off1 / uResolution)) * 0.35294117647058826;
  col += texture2D(uSampler, uv - (off1 / uResolution)) * 0.35294117647058826;
  return col;
}`,
  contrast: `vec4 contrast(float val, vec4 col) {
  col.rgb /= col.a;
  col.rgb = ((col.rgb - 0.5) * val) + 0.5;
  col.rgb *= col.a;
  return col;
}`,
  brightness: `vec4 brightness(float val, vec4 col) {
  col.rgb /= col.a;
  col.rgb += val;
  col.rgb *= col.a;
  return col;
}`,
  hsvmask: `void main(vec4 mask, vec4 components, vec4 col) {
  vec3 hsv = rgb2hsv(col.rgb);
  vec3 m = mask;
  hsv.xyz = (vec3(1., 1., 1.) - m) * components + m * hsv.xyz;
  vec3 rgb = hsv2rgb(hsv);
  col = vec4(rgb.r, rgb.g, rgb.b, gl_FragColor.a);
  return col;
}`,
  setxyz: `vec4 setxyz (vec3 comp, vec3 mask, vec4 col) {
  col.xyz = (vec3(1., 1., 1.) - mask) * comp + m * hsv.xyz;
}`,
};
