export type RawFloat = number;
type NamedFloat = [string, number];
export type Float = RawFloat | NamedFloat;

export type RawVec2 = [number, number];
type NamedVec2 = [string, RawVec2];
export type Vec2 = RawVec2 | NamedVec2;

export type RawVec3 = [number, number, number];
type NamedVec3 = [string, RawVec3];
export type Vec3 = RawVec3 | NamedVec3;

export type RawVec4 = [number, number, number, number];
type NamedVec4 = [string, RawVec4];
export type Vec4 = RawVec4 | NamedVec4;

type RawUniformVal = RawFloat | RawVec2 | RawVec3 | RawVec4;
type NamedUniformVal = NamedFloat | NamedVec2 | NamedVec3 | NamedVec4;

type UniformVal = RawUniformVal | NamedUniformVal;

export interface Source {
  sections: string[];
  values: UniformVal[];
}

interface UniformValMap {
  [name: string]: { val: RawUniformVal; changed: boolean };
}

export abstract class Effect {
  needsDepthBuffer: boolean = false;
  needsNeighborSample: boolean = false;
  needsCenterSample: boolean = true;
  repeatNum: number = 1;
  fShaderSource: string;
  uniforms: UniformValMap = {};
  externalFuncs: string[] = [];

  constructor(source: Source) {
    let sourceString = "";
    if (source.sections.length - source.values.length !== 1) {
      throw new Error("wrong lengths for source and values");
    }
    // put all of the values between all of the source sections
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

  repeat(num: number) {
    this.repeatNum = num;
    return this;
  }
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

export function tag(
  strings: TemplateStringsArray,
  ...values: UniformVal[]
): Source {
  return { sections: strings.concat([]), values: values };
}

export function uniformGLSLTypeStr(val: RawUniformVal) {
  const num = uniformGLSLTypeNum(val);
  if (num === 1) return "float";
  if (num >= 2 && num <= 4) return "vec" + num;
  throw new Error("cannot convert " + val + " to a GLSL type");
}
