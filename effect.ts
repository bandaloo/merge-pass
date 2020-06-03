import { glslFuncs } from "./glslfunctions";

interface Uniforms {
  [name: string]: number | number[];
}

interface EffectOptions {
  needsDepthBuffer?: boolean;
  needsNeighborSample?: boolean;
  needsCenterSample?: boolean;
  repeatNum?: number;
  fShaderSource: string;
  uniforms?: Uniforms;
  externalFuncs?: string[];
}

export class Effect {
  // TODO make this class have an instance of options rather than all this
  // repeated code
  needsDepthBuffer: boolean;
  needsNeighborSample: boolean;
  needsCenterSample: boolean;
  repeatNum: number;
  fShaderSource: string;
  uniforms: Uniforms;
  externalFuncs: string[];

  constructor(options: EffectOptions) {
    this.needsDepthBuffer = options?.needsDepthBuffer ?? false;
    this.needsNeighborSample = options?.needsNeighborSample ?? false;
    this.needsCenterSample = options?.needsCenterSample ?? true;
    this.repeatNum = options?.repeatNum ?? 1;
    this.fShaderSource = options.fShaderSource;
    this.uniforms = options?.uniforms ?? {};
    this.externalFuncs = options?.externalFuncs ?? [];
  }
}

// TODO consider how effects can potentially use functions outside
export function darken(percent: number) {
  if (percent < 0 || percent > 100) {
    throw new Error("darkness percent must be between 0 and 100 (inclusive)");
  }
  return new Effect({
    fShaderSource: `void main() {
  float d = ${toGLSLFloatString(percent / 100)};
  gl_FragColor = vec4(d * gl_FragColor.rgb, gl_FragColor.a);
}`,
  });
}

export function invert() {
  return new Effect({
    fShaderSource: `void main() {
  gl_FragColor = vec4(1.0 - gl_FragColor.rgb, gl_FragColor.a);
}`,
  });
}

// TODO this doesn't require sampling the first pixel; see if we can
// optimize this out in the code gen
export function blur5(xDir: number, yDir: number) {
  return new Effect({
    needsNeighborSample: true,
    needsCenterSample: false,
    fShaderSource: `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 direction = vec2(${toGLSLFloatString(xDir)}, ${toGLSLFloatString(yDir)});
  gl_FragColor = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  gl_FragColor += texture2D(uSampler, uv) * 0.29411764705882354;
  gl_FragColor += texture2D(uSampler, uv + (off1 / uResolution)) * 0.35294117647058826;
  gl_FragColor += texture2D(uSampler, uv - (off1 / uResolution)) * 0.35294117647058826;
}`,
  });
}

export function red() {
  return new Effect({
    fShaderSource: `void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`,
  });
}

export function nothing() {
  return new Effect({
    fShaderSource: `void main() {
}`,
  });
}

export function fuzzy() {
  return new Effect({
    fShaderSource: `void main() {
  gl_FragColor = vec4(random(gl_FragCoord.xy) * gl_FragColor.rgb, gl_FragColor.a);
}`,
    externalFuncs: [glslFuncs.random],
  });
}

export function repeat(effect: Effect, num: number) {
  effect.repeatNum = num;
  return effect;
}

function toGLSLFloatString(num: number) {
  let str = "" + num;
  if (!str.includes(".")) str += ".";
  return str;
}
