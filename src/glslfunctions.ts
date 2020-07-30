// adapted from The Book of Shaders
/** glsl source code for external functions */
export const glslFuncs = {
  // TODO bad to calculate single pixel width every time; maybe it can be a need
  texture2D_region: `vec4 texture2D_region(
  float r_x_min,
  float r_y_min,
  float r_x_max,
  float r_y_max,
  sampler2D sampler,
  vec2 uv
) {
  vec2 d = vec2(1., 1.) / uResolution; // pixel width
  return texture2D(sampler, clamp(uv, vec2(r_x_min + d.x, r_y_min + d.x), vec2(r_x_max - d.y, r_y_max - d.y)));
}`,
  // TODO replace with a better one
  // adapted from The Book of Shaders
  random: `float random(vec2 st) {
  return fract(sin(dot(st.xy / 99., vec2(12.9898, 78.233))) * 43758.5453123);
}`,
  // adapted from The Book of Shaders
  random2: `vec2 random2(vec2 st) {
  st = vec2(dot(st,vec2(127.1,311.7)), dot(st,vec2(269.5,183.3)));
  return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}`,
  rotate2d: `vec2 rotate2d(vec2 v, float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * v;
}`,
  // adapted from The Book of Shaders
  hsv2rgb: `vec4 hsv2rgb(vec4 co){
  vec3 c = co.xyz;
  vec3 rgb = clamp(abs(mod(
    c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  rgb = rgb * rgb * (3.0 - 2.0 * rgb);
  vec3 hsv = c.z * mix(vec3(1.0), rgb, c.y);
  return vec4(hsv.x, hsv.y, hsv.z, co.a);
}`,
  // adapted from The Book of Shaders
  rgb2hsv: `vec4 rgb2hsv(vec4 co){
  vec3 c = co.rgb;
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec4(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
              d / (q.x + e),
              q.x, co.a);
}`,
  // all gaussian blurs adapted from:
  // https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/5.glsl
  gauss5: `vec4 gauss5(vec2 dir) {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 col = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * dir;
  col += texture2D(uSampler, uv) * 0.29411764705882354;
  col += texture2D(uSampler, uv + (off1 / uResolution)) * 0.35294117647058826;
  col += texture2D(uSampler, uv - (off1 / uResolution)) * 0.35294117647058826;
  return col;
}`,
  gauss9: `vec4 gauss9(vec2 dir) {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 col = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * dir;
  vec2 off2 = vec2(3.2307692308) * dir;
  col += texture2D(uSampler, uv) * 0.2270270270;
  col += texture2D(uSampler, uv + (off1 / uResolution)) * 0.3162162162;
  col += texture2D(uSampler, uv - (off1 / uResolution)) * 0.3162162162;
  col += texture2D(uSampler, uv + (off2 / uResolution)) * 0.0702702703;
  col += texture2D(uSampler, uv - (off2 / uResolution)) * 0.0702702703;
  return col;
}`,
  gauss13: `vec4 gauss13(vec2 dir) {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 col = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * dir;
  vec2 off2 = vec2(3.2941176470588234) * dir;
  vec2 off3 = vec2(5.176470588235294) * dir;
  col += texture2D(uSampler, uv) * 0.1964825501511404;
  col += texture2D(uSampler, uv + (off1 / uResolution)) * 0.2969069646728344;
  col += texture2D(uSampler, uv - (off1 / uResolution)) * 0.2969069646728344;
  col += texture2D(uSampler, uv + (off2 / uResolution)) * 0.09447039785044732;
  col += texture2D(uSampler, uv - (off2 / uResolution)) * 0.09447039785044732;
  col += texture2D(uSampler, uv + (off3 / uResolution)) * 0.010381362401148057;
  col += texture2D(uSampler, uv - (off3 / uResolution)) * 0.010381362401148057;
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
  // adapted from https://www.shadertoy.com/view/ls3GWS which was adapted from
  // http://www.geeks3d.com/20110405/fxaa-fast-approximate-anti-aliasing-demo-glsl-opengl-test-radeon-geforce/3/
  // original algorithm created by Timothy Lottes
  fxaa: `vec4 fxaa() {
  float FXAA_SPAN_MAX = 8.0;
  float FXAA_REDUCE_MUL = 1.0 / FXAA_SPAN_MAX;
  float FXAA_REDUCE_MIN = 1.0 / 128.0;
  float FXAA_SUBPIX_SHIFT = 1.0 / 4.0;

  vec2 rcpFrame = 1. / uResolution.xy;
  vec2 t_uv = gl_FragCoord.xy / uResolution.xy; 
  vec4 uv = vec4(t_uv, t_uv - (rcpFrame * (0.5 + FXAA_SUBPIX_SHIFT)));

  vec3 rgbNW = texture2D(uSampler, uv.zw).xyz;
  vec3 rgbNE = texture2D(uSampler, uv.zw + vec2(1,0) * rcpFrame.xy).xyz;
  vec3 rgbSW = texture2D(uSampler, uv.zw + vec2(0,1) * rcpFrame.xy).xyz;
  vec3 rgbSE = texture2D(uSampler, uv.zw + vec2(1,1) * rcpFrame.xy).xyz;
  vec4 rgbMfull = texture2D(uSampler, uv.xy);
  vec3 rgbM = rgbMfull.xyz;
  float alpha = rgbMfull.a;

  vec3 luma = vec3(0.299, 0.587, 0.114);
  float lumaNW = dot(rgbNW, luma);
  float lumaNE = dot(rgbNE, luma);
  float lumaSW = dot(rgbSW, luma);
  float lumaSE = dot(rgbSE, luma);
  float lumaM = dot(rgbM,  luma);

  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

  vec2 dir;
  dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
  dir.y = ((lumaNW + lumaSW) - (lumaNE + lumaSE));

  float dirReduce = max(
    (lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
  float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);

  dir = min(vec2(FXAA_SPAN_MAX,  FXAA_SPAN_MAX),
    max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
    dir * rcpDirMin)) * rcpFrame.xy;

  vec3 rgbA = (1.0 / 2.0) * (
    texture2D(uSampler, uv.xy + dir * (1.0 / 3.0 - 0.5)).xyz +
    texture2D(uSampler, uv.xy + dir * (2.0 / 3.0 - 0.5)).xyz);
  vec3 rgbB = rgbA * (1.0 / 2.0) + (1.0 / 4.0) * (
    texture2D(uSampler, uv.xy + dir * (0.0 / 3.0 - 0.5)).xyz +
    texture2D(uSampler, uv.xy + dir * (3.0 / 3.0 - 0.5)).xyz);

  float lumaB = dot(rgbB, luma);

  if (lumaB < lumaMin || lumaB > lumaMax) {
    return vec4(rgbA.r, rgbA.g, rgbA.b, alpha);
  }

  return vec4(rgbB.r, rgbB.g, rgbB.b, alpha);
}`,
  // normal curve is a = 0 and b = 1
  gaussian: `float gaussian(float x, float a, float b) {
  float e = 2.71828;
  return pow(e, -pow(x - a, 2.) / b);
}`,
  // for calculating the true distance from 0 to 1 depth buffer
  // the small delta is to prevent division by zero, which is undefined behavior
  truedepth: `float truedepth(float i) {
  i = max(i, 0.00000001);
  return (1. - i) / i;
}`,
  // based off of https://fabiensanglard.net/lightScattering/index.php
  godrays: `vec4 godrays(
  vec4 col,
  float exposure,
  float decay,
  float density,
  float weight,
  vec2 lightPos,
  float threshold,
  vec4 newColor
) {
  vec2 texCoord = gl_FragCoord.xy / uResolution;
  vec2 deltaTexCoord = texCoord - lightPos;

  const int NUM_SAMPLES = 100;
  deltaTexCoord *= 1. / float(NUM_SAMPLES) * density;
  float illuminationDecay = 1.0;

  for (int i=0; i < NUM_SAMPLES; i++) {
    texCoord -= deltaTexCoord;
    vec4 sample = texture2D(uSampler, texCoord);
    //uncomment sample = depth2occlusion(sample, newColor, threshold);
    sample *= illuminationDecay * weight;
    col += sample;
    illuminationDecay *= decay;
  }
  return col * exposure;
}`,
  depth2occlusion: `vec4 depth2occlusion(vec4 depthCol, vec4 newCol, float threshold) {
  float red = 1. - ceil(depthCol.r - threshold);
  return vec4(newCol.rgb * red, 1.0);
}`,
  // adapted from The Book of Shaders, which was adapted from Inigo Quilez
  // from this example: https://www.shadertoy.com/view/XdXGW8
  gradientnoise: `float gradientnoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(mix(dot(random2(i + vec2(0.0,0.0)), f - vec2(0.0, 0.0)),
                     dot(random2(i + vec2(1.0,0.0)), f - vec2(1.0, 0.0)), u.x),
             mix(dot(random2(i + vec2(0.0,1.0)), f - vec2(0.0, 1.0)),
                 dot(random2(i + vec2(1.0,1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}`,
  // adapted from The Book of Shaders
  // https://thebookofshaders.com/edit.php#11/2d-snoise-clear.frag
  // this was adapted from this fast implementation
  // https://github.com/ashima/webgl-noise
  // simplex noise invented by Ken Perlin
  simplexnoise: `float simplexnoise(vec2 v) {
  // Precompute values for skewed triangular grid
  const vec4 C = vec4(0.211324865405187,
                      // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,
                      // 0.5*(sqrt(3.0)-1.0)
                      -0.577350269189626,
                      // -1.0 + 2.0 * C.x
                      0.024390243902439);
                      // 1.0 / 41.0

  // First corner (x0)
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  // Other two corners (x1, x2)
  vec2 i1 = vec2(0.0);
  i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
  vec2 x1 = x0.xy + C.xx - i1;
  vec2 x2 = x0.xy + C.zz;

  // Do some permutations to avoid
  // truncation effects in permutation
  i = mod289_2(i);
  vec3 p = permute(
          permute( i.y + vec3(0.0, i1.y, 1.0))
              + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(
                      dot(x0,x0),
                      dot(x1,x1),
                      dot(x2,x2)
                      ), 0.0);

  m = m*m ;
  m = m*m ;

  // Gradients:
  //  41 pts uniformly over a line, mapped onto a diamond
  //  The ring size 17*17 = 289 is close to a multiple
  //      of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  // Normalise gradients implicitly by scaling m
  // Approximation of: m *= inversesqrt(a0*a0 + h*h);
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

  // Compute final noise value at P
  vec3 g = vec3(0.0);
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
  return 130.0 * dot(m, g);
}`,
  // only useful for simplex noise
  simplexhelpers: `vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289_3(((x*34.0)+1.0)*x); }`,
  // sobel adapted from https://gist.github.com/Hebali/6ebfc66106459aacee6a9fac029d0115
  sobel: `vec4 sobel() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 k[8];

  float w = 1. / uResolution.x;
  float h = 1. / uResolution.y;

  k[0] = texture2D(uSampler, uv + vec2(-w, -h));
  k[1] = texture2D(uSampler, uv + vec2(0., -h));
  k[2] = texture2D(uSampler, uv + vec2(w, -h));
  k[3] = texture2D(uSampler, uv + vec2(-w, 0.));

  k[4] = texture2D(uSampler, uv + vec2(w, 0.));
  k[5] = texture2D(uSampler, uv + vec2(-w, h));
  k[6] = texture2D(uSampler, uv + vec2(0., h));
  k[7] = texture2D(uSampler, uv + vec2(w, h));

  vec4 edge_h = k[2] + (2. * k[4]) + k[7] - (k[0] + (2. * k[3]) + k[5]);
  vec4 edge_v = k[0] + (2. * k[1]) + k[2] - (k[5] + (2. * k[6]) + k[7]);
  vec4 sob = sqrt(edge_h * edge_h + edge_v * edge_v);

  return vec4(1. - sob.rgb, 1.);
}`,
  // inlining a similar function will substitute in the full expression for
  // every component, so it's more efficient to have a function
  monochrome: `vec4 monochrome(vec4 col) {
  return vec4(vec3((col.r + col.g + col.b) / 3.), col.a);
}`,
  invert: `vec4 invert(vec4 col) {
  return vec4(vec3(1., 1., 1.) - col.rgb, col.a);
}`,
  channel: `vec4 channel(vec2 uv, sampler2D sampler) {
  return texture2D(sampler, uv);
}`,
};
