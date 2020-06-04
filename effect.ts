import { glslFuncs } from "./glslfunctions";

export type RawFloat = number;
type NamedFloat = [string, number];
export type RawVec2 = [number, number];
type NamedVec2 = [string, RawVec2];
export type RawVec3 = [number, number, number];
type NamedVec3 = [string, RawVec3];
export type RawVec4 = [number, number, number, number];
type NamedVec4 = [string, RawVec4];

type RawUniformVal = RawFloat | RawVec2 | RawVec3 | RawVec4;
type NamedUniformVal = NamedFloat | NamedVec2 | NamedVec3 | NamedVec4;

type UniformVal = RawUniformVal | NamedUniformVal;

interface Source {
  sections: string[];
  values: UniformVal[];
}

interface UniformVals {
  [name: string]: { val: RawUniformVal; changed: boolean };
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

  constructor(source: Source, options?: EffectOptions) {
    this.needsDepthBuffer = options?.needsDepthBuffer ?? false;
    this.needsNeighborSample = options?.needsNeighborSample ?? false;
    this.needsCenterSample = options?.needsCenterSample ?? true;
    this.repeatNum = options?.repeatNum ?? 1;
    // TODO go through one by one verifying that all passed-in lengths for uniforms are are correct
    this.uniforms = options?.uniforms ?? {};
    this.externalFuncs = options?.externalFuncs ?? [];

    let sourceString = "";
    if (source.sections.length - source.values.length !== 1) {
      throw new Error("wrong lengths for source and values");
    }
    for (let i = 0; i < source.values.length; i++) {
      sourceString +=
        source.sections[i] + this.processGLSLVal(source.values[i]);
    }
    sourceString += source.sections[source.sections.length - 1];
    this.fShaderSource = sourceString;
  }

  setUniform(name: string, newVal: RawUniformVal) {
    const oldVal = this.uniforms[name].val;
    if (oldVal === undefined) {
      // TODO should these be errors instead of warnings?
      console.warn("tried to set uniform " + name + " which doesn't exist");
      return;
    }
    const oldType = uniformGLSLTypeNum(oldVal);
    const newType = uniformGLSLTypeNum(newVal);
    if (oldType !== newType) {
      console.warn("tried to set uniform " + name + " to a new type");
      return;
    }
    this.uniforms[name].val = newVal;
    this.uniforms[name].changed = true;
  }

  processGLSLVal(val: UniformVal): string {
    if (typeof val === "number") {
      // this is a float
      val;
      return toGLSLFloatString(val);
    }
    if (typeof val[0] === "string") {
      // this is a named value, so it should be inserted as a uniform
      const namedVal = val as NamedUniformVal;
      const name = namedVal[0];
      const uniformVal = namedVal[1];
      this.uniforms[name] = { val: uniformVal, changed: true };
      return name;
    }
    // not a named value, so it can be inserted into code directly like a macro
    const uniformVal = val as RawVec2 | RawVec3 | RawVec4;
    return `vec${uniformVal.length}(${uniformVal
      .map((n) => toGLSLFloatString(n))
      .join(", ")})`;
  }
}

// TODO making these effects subclasses could be more flexible
export function darken(portion: RawFloat | NamedFloat) {
  if (portion < 0 || portion > 100) {
    throw new Error("darkness portion must be between 0 and 1 (inclusive)");
  }
  return new Effect(
    tag`void main() {
  gl_FragColor = vec4(gl_FragColor.rgb * ${portion}, gl_FragColor.a);
}`
  );
}

/*
export function invert() {
  return new Effect(
    `void main() {
  gl_FragColor = vec4(1.0 - gl_FragColor.rgb, gl_FragColor.a);
}`
  );
}

// TODO this doesn't require sampling the first pixel; see if we can
// optimize this out in the code gen
*/
export function blur5(direction: RawVec2 | NamedVec2) {
  return new Effect(
    tag`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 direction = ${direction}; 
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
/*

export function fuzzy() {
  return new Effect(
    `void main() {
  gl_FragColor = vec4(random(gl_FragCoord.xy) * gl_FragColor.rgb, gl_FragColor.a);
}`,
    { externalFuncs: [glslFuncs.random] }
  );
}

export function contrast(val: RawFloat) {
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
*/

// a single-pass blur is not actually particularly efficient, since we must
// sample everything in the radius
/*
export function boxBlur(val: number) {
  return new Effect({})
}
*/

// test effects (get rid of these)
/*
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
*/

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

export function uniformGLSLTypeNum(val: RawUniformVal) {
  if (typeof val === "number") {
    return 1;
  }
  return val.length;
}

function tag(strings: TemplateStringsArray, ...values: UniformVal[]): Source {
  return { sections: strings.concat([]), values: values };
}

/*
function separator(strings: string[], ...values: UniformVals[]): [string[], UniformVals[]] {
  return [strings, values];
}
*/

export function uniformGLSLTypeStr(val: RawUniformVal) {
  const num = uniformGLSLTypeNum(val);
  if (num === 1) return "float";
  if (num >= 2 && num <= 4) return "vec" + num;
  throw new Error("cannot convert " + val + " to a GLSL type");
}
