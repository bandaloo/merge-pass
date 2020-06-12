import {
  UniformVal,
  NamedUniformVal,
  RawVec,
  RawUniformVal,
  RawFloat,
  RawVec2,
  RawVec3,
  RawVec4,
  Float,
} from "../exprtypes";
import { UniformLocs, EffectLoop } from "../mergepass";
import { WebGLProgramElement } from "../webglprogramloop";

// TODO see if we need this later
//export type FullExpr<T> = Expr<T> | T;

interface UniformTypeMap {
  // TODO give a proper type that only denotes type names
  [name: string]: string;
}

/** info needed to generate proper declarations */
export interface BuildInfo {
  uniformTypes: UniformTypeMap;
  externalFuncs: Set<string>;
  exprs: Expr[];
  needs: Needs;
}

/**
 * turn a value (can be expression or primitive) into a string
 * @param val the value that gets parsed
 * @param defaultName what to name it if it is unnamed uniform
 * @param e the enclosing expression
 * @param buildInfo the top level effect to add uniforms and functions to
 */
export function vparse(
  val: UniformVal,
  defaultName: string,
  e: Expr,
  buildInfo: BuildInfo
): string {
  // parse the expression if it's an expression
  console.log("in vparse");
  if (val instanceof Expr) {
    return val.eparse(buildInfo);
  }
  // transform `DefaultUniformVal` to `NamedUniformVal`
  let defaulted = false;
  if (typeof val !== "number" && val.length === 1) {
    const namedVal = [defaultName, val[0]] as NamedUniformVal;
    val = namedVal;
    defaulted = true;
  }
  if (typeof val === "number") {
    // this is a float
    return toGLSLFloatString(val);
  }
  if (typeof val[0] === "string") {
    // this is a named value, so it should be inserted as a uniform
    const namedVal = val as NamedUniformVal;
    const name = namedVal[0];
    // TODO what else should it not include?
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
    // get the `RawUniformVal` from the `NamedUniformVal`
    const uniformVal = namedVal[1];
    // set to true so they are set to their default values on first draw
    e.uniformValChangeMap[name] = { val: uniformVal, changed: true };
    // add the new type to the map
    buildInfo.uniformTypes[name] = uniformGLSLTypeStr(uniformVal);
    // add the name mapping
    e.defaultNameMap[defaultName] = name;
    console.log("default name", defaultName);
    return name;
  }
  // not a named value, so it can be inserted into code directly like a macro
  const uniformVal = val as RawVec;
  return `vec${uniformVal.length}(${uniformVal
    .map((n) => toGLSLFloatString(n))
    .join(", ")})`;
}

function toGLSLFloatString(num: number) {
  let str = "" + num;
  if (!str.includes(".")) str += ".";
  return str;
}

// this should be on expression
export interface UniformValChangeMap {
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

export interface SourceLists {
  sections: string[];
  values: UniformVal[];
}

export abstract class Expr {
  static count = 0;
  id: string;
  needs: Needs = {
    depthBuffer: false,
    neighborSample: false,
    centerSample: true,
  };
  defaultNames: string[];
  uniformValChangeMap: UniformValChangeMap = {};
  defaultNameMap: DefaultNameMap = {};
  externalFuncs: string[] = [];
  sourceLists: SourceLists;
  sourceCode: string = "";

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    this.id = "_id_" + Expr.count;
    Expr.count++;
    if (sourceLists.sections.length - sourceLists.values.length !== 1) {
      // this cannot happen if you use `tag` to destructure a template string
      throw new Error("wrong lengths for source and values");
    }
    if (sourceLists.values.length !== defaultNames.length) {
      console.log(sourceLists.values);
      console.log(sourceLists.sections);
      console.log(defaultNames);
      throw new Error(
        "default names list length doesn't match values list length!"
      );
    }
    this.sourceLists = sourceLists;
    this.defaultNames = defaultNames;
  }

  applyUniforms(gl: WebGL2RenderingContext, uniformLocs: UniformLocs) {
    for (const name in this.uniformValChangeMap) {
      const loc = uniformLocs[name];
      const val = this.uniformValChangeMap[name].val;
      if (this.uniformValChangeMap[name].changed) {
        this.uniformValChangeMap[name].changed = false;
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

  abstract getSize(): number;

  /** expression and loops both implement this */
  getNeeds(name: keyof Needs) {
    return this.needs[name];
  }

  getSampleNum(mult = 1) {
    return this.needs.neighborSample ? mult : 0;
  }

  setUniform(name: string, newVal: RawUniformVal) {
    // if name does not exist, try mapping default name to new name
    if (this.uniformValChangeMap[name]?.val === undefined) {
      name = this.defaultNameMap[name];
    }
    const oldVal = this.uniformValChangeMap[name]?.val;
    if (oldVal === undefined) {
      console.log(this.defaultNameMap);
      throw new Error(
        "tried to set uniform " +
          name +
          " which doesn't exist." +
          "(maybe you tried to change a value that was set as immutable." +
          "to make it immutable, wrap it in square brackets)"
      );
    }
    const oldType = uniformGLSLTypeNum(oldVal);
    const newType = uniformGLSLTypeNum(newVal);
    if (oldType !== newType) {
      throw new Error("tried to set uniform " + name + " to a new type");
    }
    this.uniformValChangeMap[name].val = newVal;
    this.uniformValChangeMap[name].changed = true;
  }

  /** parses this expression into a string, adding info as it recurses */
  eparse(buildInfo: BuildInfo): string {
    console.log("pushing expr to buildinfo!");
    buildInfo.exprs.push(this);
    const updateNeed = (name: keyof Needs) =>
      (buildInfo.needs[name] = buildInfo.needs[name] || this.needs[name]);
    updateNeed("centerSample");
    updateNeed("neighborSample");
    updateNeed("depthBuffer");
    // add each of the external funcs to the builder
    console.log(this.externalFuncs);
    this.externalFuncs.forEach((func) => buildInfo.externalFuncs.add(func));
    // put all of the values between all of the source sections
    for (let i = 0; i < this.sourceLists.values.length; i++) {
      this.sourceCode +=
        this.sourceLists.sections[i] +
        vparse(
          this.sourceLists.values[i],
          this.defaultNames[i] + this.id,
          this,
          buildInfo
        );
    }
    // TODO does sourceCode have to be a member?
    this.sourceCode += this.sourceLists.sections[
      this.sourceLists.sections.length - 1
    ];
    return this.sourceCode;
  }
}

export abstract class VecExpr extends Expr {
  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
  }

  // not needed anymore
  /*
  eparse(bi: BuildInfo): string {
    let counter = 0;
    const list = this.components.map((comp) => {
      return vparse(comp, "uComp" + counter++ + this.id, this, bi);
    });
    return `(vec${this.components.length}(${list.join(", ")}))`;
  }
  */
}

export class ExprFloat extends Expr {
  private float = undefined; // brand for nominal typing

  getSize() {
    return 1;
  }
}

export class ExprVec2 extends VecExpr {
  private vec2 = undefined; // brand for nominal typing

  getSize() {
    return 2;
  }
}

export class ExprVec3 extends VecExpr {
  private vec3: void; // brand for nominal typing

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
  }

  getSize() {
    return 3;
  }
}

export class ExprVec4 extends VecExpr {
  private vec4 = undefined; // brand for nominal typing

  // TODO why can't it infer return type?
  repeat(num: number): EffectLoop {
    return new EffectLoop([this], { num: num });
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

  getSize() {
    return 4;
  }
}

export function uniformGLSLTypeNum(val: RawUniformVal) {
  if (typeof val === "number") {
    return 1;
  }
  return val.length;
}

export function uniformGLSLTypeStr(val: RawUniformVal) {
  const num = uniformGLSLTypeNum(val);
  if (num === 1) return "float";
  if (num >= 2 && num <= 4) return "vec" + num;
  throw new Error("cannot convert " + val + " to a GLSL type");
}

export function tag(
  strings: TemplateStringsArray,
  ...values: UniformVal[]
): SourceLists {
  return { sections: strings.concat([]), values: values };
}

/*
export function tagf(
  strings: TemplateStringsArray,
  ...values: Float[]
): FloatSourceLists {
  return { sections: strings.concat([]), values: values };
}
*/
