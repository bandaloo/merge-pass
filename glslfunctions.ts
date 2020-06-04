export const glslFuncs = {
  // adapted from The Book of Shaders
  // TODO replace with a better one
  random: `float random (vec2 st) {
  return fract(sin(dot(st.xy / 99., vec2(12.9898, 78.233))) * 43758.5453123);
}`,

  rotate: `mat2 rotate2d (float angle){
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}`,

  scale: `mat2 scale (vec2 scale) {
  return mat2(scale.x, 0.0, 0.0, scale.y);
}`,
};
