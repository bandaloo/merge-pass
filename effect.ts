import { glslFuncs } from "./glslfunctions";

type UniformVal = number | number[];

interface UniformVals {
  [name: string]: number | number[];
}

interface EffectOptions {
  needsDepthBuffer?: boolean;
  needsNeighborSample?: boolean;
  needsCenterSample?: boolean;
  repeatNum?: number;
  uniforms?: UniformVals;
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
  uniforms: UniformVals;
  externalFuncs: string[];

  constructor(fShaderSource: string, options?: EffectOptions) {
    this.fShaderSource = fShaderSource;
    this.needsDepthBuffer = options?.needsDepthBuffer ?? false;
    this.needsNeighborSample = options?.needsNeighborSample ?? false;
    this.needsCenterSample = options?.needsCenterSample ?? true;
    this.repeatNum = options?.repeatNum ?? 1;
    // TODO go through one by one verifying that all passed-in lengths for uniforms are are correct
    this.uniforms = options?.uniforms ?? {};
    this.externalFuncs = options?.externalFuncs ?? [];
  }

  setUniform(name: string, newVal: UniformVal) {
    const oldVal = this.uniforms[name];
    if (oldVal === undefined) {
      console.warn("tried to set uniform " + name + " which doesn't exist");
      return;
    }
    const oldType = uniformGLSLTypeNum(oldVal);
    const newType = uniformGLSLTypeNum(newVal);
    if (oldType !== newType) {
      console.warn("tried to set uniform " + name + " to a new type");
      return;
    }
    this.uniforms[name] = newVal;
  }

  applyUniform() {}
}

// TODO making these effects subclasses could be more flexible
// TODO consider how effects can potentially use functions outside
export function darken(percent: number) {
  if (percent < 0 || percent > 100) {
    throw new Error("darkness percent must be between 0 and 100 (inclusive)");
  }
  return new Effect(
    `void main() {
  float d = ${toGLSLFloatString(percent / 100)};
  gl_FragColor = vec4(d * gl_FragColor.rgb, gl_FragColor.a);
}`
  );
}

export function invert() {
  return new Effect(
    `void main() {
  gl_FragColor = vec4(1.0 - gl_FragColor.rgb, gl_FragColor.a);
}`
  );
}

// TODO this doesn't require sampling the first pixel; see if we can
// optimize this out in the code gen
export function blur5(xDir: number, yDir: number) {
  return new Effect(
    `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 direction = vec2(${toGLSLFloatString(xDir)}, ${toGLSLFloatString(yDir)});
  gl_FragColor = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  gl_FragColor += texture2D(uSampler, uv) * 0.29411764705882354;
  gl_FragColor += texture2D(uSampler, uv + (off1 / uResolution)) * 0.35294117647058826;
  gl_FragColor += texture2D(uSampler, uv - (off1 / uResolution)) * 0.35294117647058826;
}`,
    {
      needsNeighborSample: true,
      needsCenterSample: false,
    }
  );
}

export function fuzzy() {
  return new Effect(
    `void main() {
  gl_FragColor = vec4(random(gl_FragCoord.xy) * gl_FragColor.rgb, gl_FragColor.a);
}`,
    { externalFuncs: [glslFuncs.random] }
  );
}

export function contrast(val: number) {
  if (val <= 0) {
    throw new Error("contrast must be > 0");
  }
  return new Effect(
    `void main() {
  gl_FragColor.rgb /= gl_FragColor.a;
  gl_FragColor.rgb = ((gl_FragColor.rgb - 0.5) * ${toGLSLFloatString(
    val
  )}) + 0.5;
  gl_FragColor.rgb *= gl_FragColor.a;
}`
  );
}

export function brightness(val: number) {
  return new Effect(
    `void main() {
  gl_FragColor.rgb /= gl_FragColor.a;
  gl_FragColor.rgb += ${toGLSLFloatString(val)};
  gl_FragColor.rgb *= gl_FragColor.a;
}`
  );
}

// a single-pass blur is not actually particularly efficient, since we must
// sample everything in the radius
/*
export function boxBlur(val: number) {
  return new Effect({})
}
*/

// test effects (get rid of these)
export function red() {
  return new Effect(
    `void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`
  );
}

export function nothing() {
  return new Effect(
    `void main() {
}`
  );
}

export function uniformTest() {
  return new Effect(
    `void main() {
}`,
    {
      uniforms: {
        uTestFloat: 1,
        uTestVec2: [1, 2],
        uTestVec3: [1, 2, 3],
        uTestVec4: [1, 2, 3, 4],
      },
    }
  );
}

export function repeat(effect: Effect, num: number) {
  effect.repeatNum = num;
  return effect;
}

// some helpers

function toGLSLFloatString(num: number) {
  let str = "" + num;
  if (!str.includes(".")) str += ".";
  return str;
}

function uniformGLSLTypeNum(val: UniformVal) {
  if (typeof val === "number") {
    return 1;
  }
  return val.length;
}

export function uniformGLSLTypeStr(val: UniformVal) {
  const num = uniformGLSLTypeNum(val);
  if (num === 1) return "float";
  if (num >= 2 && num <= 4) return "vec" + num;
  throw new Error("cannot convert " + val + " to a GLSL type");
}
