import { EffectLoop, UniformLocs, WebGLProgramElement } from "./mergepass";

export type RawFloat = number;
type NamedFloat = [string, number];
type DefaultFloat = [number];
export type Float = RawFloat | NamedFloat;

export type RawVec2 = [number, number];
type NamedVec2 = [string, RawVec2];
type DefaultVec2 = [RawVec2];
export type Vec2 = RawVec2 | NamedVec2;

export type RawVec3 = [number, number, number];
type NamedVec3 = [string, RawVec3];
type DefaultVec3 = [RawVec3];
export type Vec3 = RawVec3 | NamedVec3;

export type RawVec4 = [number, number, number, number];
type NamedVec4 = [string, RawVec4];
type DefaultVec4 = [RawVec4];
export type Vec4 = RawVec4 | NamedVec4;

type DefaultUniformVal = DefaultFloat | DefaultVec2 | DefaultVec3 | DefaultVec4;
type RawUniformVal = RawFloat | RawVec2 | RawVec3 | RawVec4;
type NamedUniformVal = NamedFloat | NamedVec2 | NamedVec3 | NamedVec4;

export type UniformVal = RawUniformVal | NamedUniformVal;

export interface Source {
  sections: string[];
  values: UniformVal[];
}

interface UniformValMap {
  [name: string]: { val: RawUniformVal; changed: boolean };
}

interface DefaultNameMap {
  [name: string]: string;
}

interface Needs {
  depthBuffer: boolean;
  neighborSample: boolean;
  centerSample: boolean;
}

export abstract class Effect {
  needs: Needs = {
    depthBuffer: false,
    neighborSample: false,
    centerSample: true,
  };
  // TODO get rid of this since we have loops now
  repeatNum: number = 1;
  fShaderSource: string;
  uniforms: UniformValMap = {};
  externalFuncs: string[] = [];
  defaultNameMap: DefaultNameMap = {};

  constructor(source: Source, defaultNames: string[]) {
    let sourceString = "";
    if (source.sections.length - source.values.length !== 1) {
      throw new Error("wrong lengths for source and values");
    }
    if (source.values.length !== defaultNames.length) {
      throw new Error(
        "default names list length doesn't match values list length"
      );
    }
    // put all of the values between all of the source sections
    for (let i = 0; i < source.values.length; i++) {
      sourceString +=
        source.sections[i] +
        this.processGLSLVal(source.values[i], defaultNames[i]);
    }
    sourceString += source.sections[source.sections.length - 1];
    this.fShaderSource = sourceString;
  }

  setUniform(name: string, newVal: RawUniformVal) {
    /*
    const mapping = this.defaultNameMap[name];
    if (mapping === undefined) {
      console.log(this.defaultNameMap);
      //console.warn("no mapping for name" + name);
      return;
    }
    */
    //const oldVal = this.uniforms[name]?.val;
    // if name does not exist, try mapping default name to new name
    if (this.uniforms[name]?.val === undefined) {
      name = this.defaultNameMap[name];
    }
    const oldVal = this.uniforms[name]?.val;
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

  processGLSLVal(
    val: UniformVal | DefaultUniformVal,
    defaultName: string
  ): string {
    // transform `DefaultUniformVal` to `NamedUniformVal`
    if (typeof val !== "number" && val.length === 1) {
      const namedVal = [defaultName, val[0]] as NamedUniformVal;
      val = namedVal;
    }
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
      // add the name mapping
      this.defaultNameMap[defaultName] = name;
      return name;
    }
    // not a named value, so it can be inserted into code directly like a macro
    const uniformVal = val as RawVec2 | RawVec3 | RawVec4;
    return `vec${uniformVal.length}(${uniformVal
      .map((n) => toGLSLFloatString(n))
      .join(", ")})`;

    // add the mapping of default name to new name
  }

  getNeeds(name: "neighborSample" | "centerSample" | "depthBuffer") {
    return this.needs[name];
  }

  // TODO get rid of this
  repeat(num: number) {
    this.repeatNum = num;
    return {};
  }

  getSampleNum(mult = 1) {
    return this.needs.neighborSample ? mult : 0;
  }

  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs
  ): WebGLProgramElement {
    console.log("gen programs in effect");
    return new EffectLoop([this], { num: this.repeatNum }).genPrograms(
      gl,
      vShader,
      uniformLocs
    );
  }

  applyUniforms(gl: WebGL2RenderingContext, uniformLocs: UniformLocs) {
    for (const name in this.uniforms) {
      const loc = uniformLocs[name];
      const val = this.uniforms[name].val;
      if (this.uniforms[name].changed) {
        this.uniforms[name].changed = false;
        switch (uniformGLSLTypeNum(val)) {
          case 1:
            const float = val as RawFloat;
            gl.uniform1f(loc, float);
            break;
          case 2:
            const vec2 = val as RawVec2;
            gl.uniform2f(loc, vec2[0], vec2[1]);
            break;
          case 3:
            const vec3 = val as RawVec3;
            gl.uniform3f(loc, vec3[0], vec3[1], vec3[2]);
            break;
          case 4:
            const vec4 = val as RawVec4;
            gl.uniform4f(loc, vec4[0], vec4[1], vec4[2], vec4[3]);
        }
      }
    }
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
