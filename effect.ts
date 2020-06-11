import { BuildInfo, Expr, uniformGLSLTypeNum } from "./effects/expression";

export type RawFloat = number;
type NamedFloat = [string, number];
type DefaultFloat = [number];
export type Float = RawFloat | NamedFloat | DefaultFloat | Expr<Float>;

export type RawVec2 = [number, number];
type NamedVec2 = [string, RawVec2];
type DefaultVec2 = [RawVec2];
export type Vec2 = RawVec2 | NamedVec2 | DefaultVec2 | Expr<Vec2>;

export type RawVec3 = [number, number, number];
type NamedVec3 = [string, RawVec3];
type DefaultVec3 = [RawVec3];
export type Vec3 = RawVec3 | NamedVec3 | DefaultVec3 | Expr<Vec3>;

export type RawVec4 = [number, number, number, number];
type NamedVec4 = [string, RawVec4];
type DefaultVec4 = [RawVec4];
export type Vec4 = RawVec4 | NamedVec4 | DefaultVec4 | Expr<Vec4>;

export type Vec = Vec2 | Vec3 | Vec4;
export type RawVec = RawVec2 | RawVec3 | RawVec4;

export type DefaultUniformVal =
  | DefaultFloat
  | DefaultVec2
  | DefaultVec3
  | DefaultVec4;
export type RawUniformVal = RawFloat | RawVec2 | RawVec3 | RawVec4;
export type NamedUniformVal = NamedFloat | NamedVec2 | NamedVec3 | NamedVec4;

// isn't this encompassed by `FullExpr<UniformVal>`?
export type UniformVal =
  | RawUniformVal
  | NamedUniformVal
  | DefaultUniformVal
  | Expr<UniformVal>;

export interface Source {
  sections: string[];
  values: UniformVal[];
}

// this should be on expression
export interface UniformValMap {
  [name: string]: { val: RawUniformVal; changed: boolean };
}

// TODO don't really want to expose this
export interface DefaultNameMap {
  [name: string]: string;
}

export interface Needs {
  depthBuffer: boolean;
  neighborSample: boolean;
  centerSample: boolean;
}

// TODO should this have `implements EffectLike`?
export abstract class Effect {
  /** used to give each effect a unique id */
  static count = 0;
  needs: Needs = {
    depthBuffer: false,
    neighborSample: false,
    centerSample: true,
  };
  fShaderSource: string;
  uniforms: UniformValMap = {};
  // TODO can we get rid of external funcs because of build info?
  externalFuncs: string[] = [];
  defaultNameMap: DefaultNameMap = {};
  id: number;
  idStr: string;
  /** gets populated after parse is called; useful for code builder */
  /*
  bi: BuildInfo = {
    externalFuncs: new Set(),
    uniformTypes: {},
    exprs: [],
  };
  */

  constructor(source: Source, defaultNames: string[]) {
    this.id = Effect.count;
    this.idStr = "_id_" + this.id;
    Effect.count++;
    let sourceString = "";
    if (source.sections.length - source.values.length !== 1) {
      throw new Error("wrong lengths for source and values");
    }
    if (source.values.length !== defaultNames.length) {
      throw new Error(
        "default names list length doesn't match values list length!"
      );
    }
    // put all of the values between all of the source sections
    for (let i = 0; i < source.values.length; i++) {
      sourceString +=
        source.sections[i] +
        // TODO more like process GLSL expression, now
        this.processGLSLVal(source.values[i], defaultNames[i] + this.idStr);
    }
    sourceString += source.sections[source.sections.length - 1];
    this.fShaderSource = sourceString;
  }

  // TODO add a function that can add to `externalFuncs` without duplicate

  setUniform(name: string, newVal: RawUniformVal) {
    // if name does not exist, try mapping default name to new name
    if (this.uniforms[name]?.val === undefined) {
      name = this.defaultNameMap[name];
    }
    const oldVal = this.uniforms[name]?.val;
    if (oldVal === undefined) {
      throw new Error("tried to set uniform " + name + " which doesn't exist");
    }
    const oldType = uniformGLSLTypeNum(oldVal);
    const newType = uniformGLSLTypeNum(newVal);
    if (oldType !== newType) {
      throw new Error("tried to set uniform " + name + " to a new type");
    }
    this.uniforms[name].val = newVal;
    this.uniforms[name].changed = true;
  }

  processGLSLVal(
    val: UniformVal | DefaultUniformVal,
    defaultName: string
  ): string {
    //return vparse(val, defaultName, this, this.bi);
    return "TODO get rid of this (this is a stub)";
    /*
    // transform `DefaultUniformVal` to `NamedUniformVal`
    let defaulted = false;
    if (typeof val !== "number" && val.length === 1) {
      const namedVal = [defaultName, val[0]] as NamedUniformVal;
      val = namedVal;
      defaulted = true;
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
      if (!defaulted && name.includes("_id_")) {
        throw new Error("cannot set a named uniform that has _id_ in it");
      }
      if (/^i[0-9]+$/g.test(name)) {
        throw new Error(
          "cannot name a uniform that matches regex ^i[0-9]+$" +
            "since that's reserved for name of index" +
            "in for loops of generated code"
        );
      }
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
    */
  }

  /*
  getNeeds(name: "neighborSample" | "centerSample" | "depthBuffer") {
    return this.needs[name];
  }

  repeat(num: number) {
    return new EffectLoop([this], { num: num });
  }

  getSampleNum(mult = 1) {
    return this.needs.neighborSample ? mult : 0;
  }

  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs
  ): WebGLProgramElement {
    return new EffectLoop([this], { num: 1 }).genPrograms(
      gl,
      vShader,
      uniformLocs
    );
  }
  */

  // TODO remove
  /*
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
  */
}

// some helpers

// TODO remove
/*
function toGLSLFloatString(num: number) {
  let str = "" + num;
  if (!str.includes(".")) str += ".";
  return str;
}
*/

/*
export function uniformGLSLTypeNum(val: RawUniformVal) {
  if (typeof val === "number") {
    return 1;
  }
  return val.length;
}
*/

// TODO move this
export function tag(
  strings: TemplateStringsArray,
  ...values: UniformVal[]
): Source {
  return { sections: strings.concat([]), values: values };
}
